import { NextResponse } from "next/server";
import { diagnose, type ImageStats } from "@/lib/data";

// POST /api/diagnoses — provisório. Contrato igual ao de architecture.md §3:
// entrada { id, cropSlug, ... } → { status, candidates, model }.
// Idempotência real (id do cliente + on conflict) chega com o banco.
export async function POST(req: Request) {
  let body: { id?: string; cropSlug?: string; stats?: ImageStats };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "json inválido" }, { status: 400 }); }

  const { id, cropSlug, stats } = body;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  if (cropSlug !== "soja") {
    return NextResponse.json({ id, status: "wrong_crop", candidates: [], model: "demo" });
  }
  if (!stats || typeof stats.brightness !== "number") {
    return NextResponse.json({ error: "faltam dados da foto" }, { status: 400 });
  }

  await new Promise((r) => setTimeout(r, 1200)); // simula o tempo do modelo
  const result = await diagnose(stats);
  return NextResponse.json({ id, ...result });
}
