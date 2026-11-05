// Diagnóstico por foto com o Claude (visão). Chamado só do servidor.
// O modelo é preso ao catálogo: só pode responder slugs que existem na biblioteca.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Problem } from "@/lib/data/types";

export type VisionResult = {
  status: "ok" | "not_identified" | "bad_image" | "not_plant" | "wrong_crop" | "healthy";
  candidates: { problemSlug: string; probability: number; reasoning: string }[];
  model: string;
  raw: unknown;
  latencyMs: number;
};

const Output = z.object({
  is_plant: z.boolean(),
  crop_match: z.boolean(),
  image_quality: z.enum(["good", "poor"]),
  healthy: z.boolean().optional().default(false),
  candidates: z.array(z.object({
    slug: z.string(),
    probability: z.number().min(0).max(1),
    signs: z.string().max(300),
  })).max(5).default([]),
});

export const MIN_PROBABILITY = 0.4;

export function buildPrompt(catalog: Pick<Problem, "slug" | "commonName" | "scientificName" | "agentType" | "summary">[]) {
  const list = catalog.map((p) =>
    `- ${p.slug} | ${p.commonName} (${p.scientificName}) | ${p.agentType} | sinais: ${p.summary.join("; ")}`).join("\n");
  return `Você ajuda produtores de soja no Brasil a identificar pragas, doenças e deficiências pela foto.

Analise a foto e responda SOMENTE com um objeto JSON, sem texto antes ou depois, no formato:
{"is_plant": bool, "crop_match": bool, "image_quality": "good"|"poor", "healthy": bool,
 "candidates": [{"slug": string, "probability": number entre 0 e 1, "signs": string curta em português}]}

Regras:
1. is_plant: a foto mostra uma planta? crop_match: parece soja (folha trifoliolada, vagens de soja)? image_quality: "poor" se escura, desfocada ou distante demais para ver sintomas.
2. healthy: true se a planta parece sadia, sem sintomas visíveis.
3. candidates: até 3, do mais provável ao menos provável, usando APENAS slugs da lista abaixo. As probabilidades devem somar no máximo 1. Se nada da lista combinar com segurança, devolva lista vazia.
4. "signs" descreve o que você viu na foto (cor, forma e posição das lesões, inseto visível), não a teoria da doença.
5. Não invente slugs, não recomende produtos nem doses.

Lista de problemas da soja:
${list}`;
}

/** Interpreta a resposta do modelo. Exportada para teste sem chamar a API. */
export function parseVision(text: string, allowed: Set<string>): Omit<VisionResult, "model" | "raw" | "latencyMs"> {
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  let parsed: z.infer<typeof Output>;
  try { parsed = Output.parse(JSON.parse(json)); }
  catch { return { status: "not_identified", candidates: [] }; }

  if (!parsed.is_plant) return { status: "not_plant", candidates: [] };
  if (!parsed.crop_match) return { status: "wrong_crop", candidates: [] };
  if (parsed.image_quality === "poor") return { status: "bad_image", candidates: [] };

  const seen = new Set<string>();
  const cands = parsed.candidates
    .filter((c) => allowed.has(c.slug) && !seen.has(c.slug) && seen.add(c.slug))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3)
    .map((c) => ({ problemSlug: c.slug, probability: Math.round(c.probability * 100) / 100, reasoning: c.signs.trim() }));

  if (parsed.healthy && (!cands.length || cands[0].probability < MIN_PROBABILITY)) return { status: "healthy", candidates: [] };
  if (!cands.length || cands[0].probability < MIN_PROBABILITY) return { status: "not_identified", candidates: [] };
  return { status: "ok", candidates: cands };
}

export async function diagnoseWithClaude(opts: {
  image: Uint8Array;
  mediaType: "image/jpeg" | "image/webp";
  catalog: Problem[];
  apiKey: string;
  model: string;
  strongModel?: string;
  client?: Pick<Anthropic, "messages">;   // injetável para teste
}): Promise<VisionResult> {
  const client = opts.client ?? new Anthropic({ apiKey: opts.apiKey, maxRetries: 2, timeout: 25_000 });
  const allowed = new Set(opts.catalog.map((p) => p.slug));
  const prompt = buildPrompt(opts.catalog);
  const data = Buffer.from(opts.image).toString("base64");

  const call = async (model: string) => {
    const t0 = Date.now();
    const msg = await client.messages.create({
      model,
      max_tokens: 600,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: opts.mediaType, data } },
          { type: "text", text: prompt },
        ],
      }],
    });
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return { ...parseVision(text, allowed), model, raw: { text, usage: msg.usage }, latencyMs: Date.now() - t0 };
  };

  const first = await call(opts.model);
  // Caso ambíguo (dois candidatos quase empatados): pede a opinião do modelo maior.
  const ambiguous = first.status === "ok" && first.candidates.length > 1 &&
    first.candidates[0].probability - first.candidates[1].probability < 0.1;
  if (ambiguous && opts.strongModel && opts.strongModel !== opts.model) {
    try { return await call(opts.strongModel); } catch { return first; }
  }
  return first;
}
