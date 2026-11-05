// Testes de API do clone (validação, limites, autorização). Nunca contra o original.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const leaf = readFileSync("e2e/fixtures/folha.jpg");
const meta = (o: object = {}) => JSON.stringify({ id: crypto.randomUUID(), cropSlug: "soja", capturedAt: new Date().toISOString(), stats: { brightness: 0.4, green: 0.5, brown: 0.1, hash: 7 }, ...o });
const send = (request: import("@playwright/test").APIRequestContext, m: string, buf: Buffer = leaf, name = "f.jpg", ip = "10.0.0.1") =>
  request.post("/api/diagnoses", { headers: { "x-forwarded-for": ip }, multipart: { meta: m, image: { name, mimeType: "image/jpeg", buffer: buf } } });

test("diagnóstico válido", async ({ request }) => {
  const r = await send(request, meta(), leaf, "f.jpg", "10.0.1.1");
  expect(r.status()).toBe(200);
  const j = await r.json();
  expect(["ok", "not_identified"]).toContain(j.status);
});
test("rejeita meta inválida, não-imagem e foto grande", async ({ request }) => {
  expect((await send(request, '{"id":"x"}', leaf, "f.jpg", "10.0.2.1")).status()).toBe(400);
  expect((await send(request, meta(), Buffer.from("texto"), "f.jpg", "10.0.2.2")).status()).toBe(415);
  expect((await send(request, meta(), Buffer.alloc(5 * 1024 * 1024 + 10, 0xff), "f.jpg", "10.0.2.3")).status()).toBe(413);
});
test("outra cultura → wrong_crop", async ({ request }) => {
  const j = await (await send(request, meta({ cropSlug: "milho" }), leaf, "f.jpg", "10.0.3.1")).json();
  expect(j.status).toBe("wrong_crop");
});
test("F01-N3 limite de 30 envios por hora por IP", async ({ request }) => {
  let last = 0;
  for (let i = 0; i < 31; i++) last = (await send(request, '{"id":"x"}', leaf, "f.jpg", "10.0.9.9")).status();
  expect(last).toBe(429);
});
test("F05-N1 cron exige segredo", async ({ request }) => {
  expect((await request.get("/api/cron/diario")).status()).toBe(401);
  expect((await request.get("/api/cron/diario", { headers: { authorization: "Bearer errado" } })).status()).toBe(401);
});
test("F05-E2 clima com município inválido", async ({ request }) => {
  expect((await request.get("/api/clima?m=Atlantida")).status()).toBe(400);
  const ok = await request.get("/api/clima?m=Cascavel");
  expect(ok.status()).toBe(200);
  expect((await ok.json()).days).toHaveLength(7);
});
test("push e exclusão sem backend: 503 esperado para push, exclusão local ok", async ({ request }) => {
  expect((await request.post("/api/push", { data: { endpoint: "x" } })).status()).toBe(503);
  expect((await request.post("/api/conta/excluir", { data: {} })).status()).toBeLessThan(500);
});
test("callback de login sem código volta para entrar", async ({ request }) => {
  const r = await request.get("/auth/callback?next=//evil.com", { maxRedirects: 0 });
  expect(r.status()).toBe(307);
  expect(r.headers()["location"]).toMatch(/\/entrar\?erro=link$/);
});
