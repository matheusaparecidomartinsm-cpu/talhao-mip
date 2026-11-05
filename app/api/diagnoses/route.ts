import { NextResponse } from "next/server";
import { z } from "zod";
import { diagnose as demoDiagnose } from "@/lib/data";
import { PROBLEMS } from "@/lib/data/seed-problems";
import { backendEnabled } from "@/lib/env";
import { diagnoseWithClaude, type VisionResult } from "@/lib/server/claude-diagnose";
import { SERVER_ENV } from "@/lib/server/env";
import { clientKey, rateLimit } from "@/lib/server/ratelimit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;
const Meta = z.object({
  id: z.uuid(),
  cropSlug: z.string().min(2).max(40),
  capturedAt: z.iso.datetime(),
  stats: z.object({ brightness: z.number(), green: z.number(), brown: z.number(), hash: z.number() }).optional(),
});
const FINAL = new Set(["ok", "not_identified", "bad_image", "not_plant", "wrong_crop", "healthy"]);

const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

function sniff(b: Uint8Array): "image/jpeg" | "image/webp" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

/** POST /api/diagnoses — multipart: meta (JSON) + image (JPEG/WebP ≤ 5 MB). Idempotente pelo id. */
export async function POST(req: Request) {
  if (!rateLimit(`diag:${clientKey(req)}`, 30, 60 * 60_000).ok) return fail(429, "Muitos envios em pouco tempo. Tente daqui a pouco.");

  let form: FormData;
  try { form = await req.formData(); } catch { return fail(400, "Envio inválido"); }
  const meta = Meta.safeParse((() => { try { return JSON.parse(String(form.get("meta") ?? "")); } catch { return null; } })());
  if (!meta.success) return fail(400, "Dados do diagnóstico inválidos");
  const file = form.get("image");
  if (!(file instanceof File)) return fail(400, "Foto ausente");
  if (file.size > MAX_BYTES) return fail(413, "Foto maior que 5 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mediaType = sniff(bytes);
  if (!mediaType) return fail(415, "Formato de foto não aceito (use JPEG ou WebP)");

  const { id, cropSlug, capturedAt, stats } = meta.data;
  const useDb = backendEnabled() && Boolean(SERVER_ENV.supabaseSecret);
  let userId: string | null = null;
  let municipio: string | null = null;
  const admin = useDb ? supabaseAdmin() : null;

  if (admin) {
    const { user } = await currentUser();
    if (!user) return fail(401, "Sessão expirada. Abra o app de novo.");
    userId = user.id;

    const { data: existing } = await admin.from("diagnoses")
      .select("id, user_id, status, model, diagnosis_candidates(probability, rank, reasoning, problems(slug))")
      .eq("id", id).maybeSingle();
    if (existing && existing.user_id !== userId) return fail(409, "Identificador em uso");
    if (existing && FINAL.has(existing.status)) {
      type Row = { probability: number; rank: number; reasoning: string | null; problems: { slug: string } | null };
      const candidates = ((existing.diagnosis_candidates ?? []) as unknown as Row[])
        .sort((a, b) => a.rank - b.rank)
        .map((c) => ({ problemSlug: c.problems?.slug ?? "", probability: Number(c.probability), reasoning: c.reasoning ?? "" }));
      return NextResponse.json({ id, status: existing.status, candidates, model: existing.model, cached: true });
    }

    const since = new Date(); since.setUTCHours(3, 0, 0, 0); // meia-noite em Brasília (UTC−3)
    if (since > new Date()) since.setUTCDate(since.getUTCDate() - 1);
    const { count } = await admin.from("diagnoses").select("id", { count: "exact", head: true })
      .eq("user_id", userId).gte("created_at", since.toISOString());
    if ((count ?? 0) >= SERVER_ENV.dailyDiagnosisLimit) return fail(429, `Limite de ${SERVER_ENV.dailyDiagnosisLimit} diagnósticos por dia atingido. Volte amanhã.`);

    const { data: prof } = await admin.from("profiles").select("municipio_ibge").eq("id", userId).single();
    municipio = prof?.municipio_ibge ?? null;
    const { data: crop } = await admin.from("crops").select("id").eq("slug", cropSlug).maybeSingle();
    if (!crop) return fail(400, "Cultura desconhecida");

    const path = `${userId}/${id}.${mediaType === "image/webp" ? "webp" : "jpg"}`;
    const up = await admin.storage.from("diagnoses").upload(path, bytes, { contentType: mediaType, upsert: true });
    if (up.error) return fail(502, "Não deu para guardar a foto. Tente de novo.");
    const ins = await admin.from("diagnoses").upsert({
      id, user_id: userId, crop_id: crop.id, image_path: path, municipio_ibge: municipio, status: "pending", captured_at: capturedAt,
    }, { onConflict: "id", ignoreDuplicates: true });
    if (ins.error) return fail(500, "Erro ao registrar o diagnóstico");
  }

  // ── diagnóstico ──
  let result: Omit<VisionResult, "raw"> & { raw?: unknown };
  if (cropSlug !== "soja") {
    result = { status: "wrong_crop", candidates: [], model: "regra", latencyMs: 0 };
  } else if (SERVER_ENV.anthropicKey) {
    try {
      result = await diagnoseWithClaude({
        image: bytes, mediaType, catalog: PROBLEMS, apiKey: SERVER_ENV.anthropicKey,
        model: SERVER_ENV.anthropicModel, strongModel: SERVER_ENV.anthropicModelStrong,
      });
    } catch (e) {
      console.error("diagnose: falha no modelo", (e as Error).name);
      if (admin) await admin.from("diagnoses").update({ status: "failed" }).eq("id", id);
      return fail(502, "O serviço de análise não respondeu. Tente de novo em instantes.");
    }
  } else {
    if (!stats) return fail(400, "Modo demonstração precisa das estatísticas da foto");
    const t0 = Date.now();
    result = { ...(await demoDiagnose(stats)), latencyMs: Date.now() - t0 };
  }

  // ── grava ──
  if (admin) {
    const slugs = result.candidates.map((c) => c.problemSlug);
    const { data: probs } = slugs.length ? await admin.from("problems").select("id, slug").in("slug", slugs) : { data: [] };
    const idBySlug = new Map((probs ?? []).map((p) => [p.slug, p.id]));
    const rows = result.candidates.filter((c) => idBySlug.has(c.problemSlug)).map((c, i) => ({
      diagnosis_id: id, problem_id: idBySlug.get(c.problemSlug), probability: c.probability, rank: i + 1, reasoning: c.reasoning,
    }));
    if (rows.length) await admin.from("diagnosis_candidates").upsert(rows, { onConflict: "diagnosis_id,rank" });
    await admin.from("diagnoses").update({
      status: result.status === "healthy" ? "not_identified" : result.status,
      model: result.model, raw_response: result.raw ?? null, latency_ms: result.latencyMs,
    }).eq("id", id);
  }

  return NextResponse.json({ id, status: result.status, candidates: result.candidates, model: result.model });
}
