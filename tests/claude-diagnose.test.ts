// node --experimental-strip-types --test tests/claude-diagnose.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, diagnoseWithClaude, parseVision } from "../lib/server/claude-diagnose.ts";
import { PROBLEMS } from "../lib/data/seed-problems.ts";

const allowed = new Set(PROBLEMS.map((p) => p.slug));
const J = (o: object) => "Aqui está:\n" + JSON.stringify(o) + "\n";
const base = { is_plant: true, crop_match: true, image_quality: "good" };

test("resultado normal, ordenado e arredondado", () => {
  const r = parseVision(J({ ...base, candidates: [
    { slug: "mancha-alvo", probability: 0.2, signs: "anéis" },
    { slug: "ferrugem-asiatica", probability: 0.7234, signs: "pústulas na face inferior" }] }), allowed);
  assert.equal(r.status, "ok");
  assert.equal(r.candidates[0].problemSlug, "ferrugem-asiatica");
  assert.equal(r.candidates[0].probability, 0.72);
});
test("slug inventado é descartado", () => {
  const r = parseVision(J({ ...base, candidates: [{ slug: "praga-inexistente", probability: 0.9, signs: "x" }] }), allowed);
  assert.equal(r.status, "not_identified");
});
test("não é planta / não é soja / foto ruim / sadia", () => {
  assert.equal(parseVision(J({ ...base, is_plant: false }), allowed).status, "not_plant");
  assert.equal(parseVision(J({ ...base, crop_match: false }), allowed).status, "wrong_crop");
  assert.equal(parseVision(J({ ...base, image_quality: "poor" }), allowed).status, "bad_image");
  assert.equal(parseVision(J({ ...base, healthy: true, candidates: [] }), allowed).status, "healthy");
});
test("probabilidade baixa vira não identificado", () => {
  assert.equal(parseVision(J({ ...base, candidates: [{ slug: "oidio", probability: 0.3, signs: "pó" }] }), allowed).status, "not_identified");
});
test("resposta quebrada não derruba", () => {
  assert.equal(parseVision("desculpe, não consigo", allowed).status, "not_identified");
  assert.equal(parseVision("{\"is_plant\": \"talvez\"}", allowed).status, "not_identified");
});
test("prompt traz todo o catálogo e proíbe dose", () => {
  const p = buildPrompt(PROBLEMS);
  for (const x of PROBLEMS) assert.ok(p.includes(x.slug));
  assert.match(p, /nem doses/);
});
test("pedido à API: imagem em base64 + texto; caso ambíguo chama o modelo maior", async () => {
  const calls: { model: string; content: any[] }[] = [];
  const fake = { messages: { create: async (req: any) => {
    calls.push({ model: req.model, content: req.messages[0].content });
    const tie = req.model === "pequeno";
    return { content: [{ type: "text", text: J({ ...base, candidates: tie
      ? [{ slug: "oidio", probability: 0.45, signs: "a" }, { slug: "mancha-alvo", probability: 0.41, signs: "b" }]
      : [{ slug: "oidio", probability: 0.81, signs: "pó branco na face superior" }] }) }], usage: { input_tokens: 1, output_tokens: 1 } };
  } } } as any;
  const r = await diagnoseWithClaude({ image: new Uint8Array([0xff, 0xd8, 0xff, 1]), mediaType: "image/jpeg", catalog: PROBLEMS,
    apiKey: "x", model: "pequeno", strongModel: "grande", client: fake });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].content[0].type, "image");
  assert.equal(calls[0].content[0].source.data, Buffer.from([0xff, 0xd8, 0xff, 1]).toString("base64"));
  assert.equal(r.model, "grande");
  assert.equal(r.candidates[0].probability, 0.81);
});
