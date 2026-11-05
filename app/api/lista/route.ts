import { NextResponse } from "next/server";
import { z } from "zod";
import { MUNICIPIOS } from "@/lib/data/seed";
import { backendEnabled } from "@/lib/env";
import { clientKey, rateLimit } from "@/lib/server/ratelimit";
import { SERVER_ENV } from "@/lib/server/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({
  email: z.email("Confira o e-mail").max(200),
  role: z.enum(["produtor", "tecnico", "estudante", "outro"]),
  municipio: z.string().max(80).optional(),
  consent: z.literal(true, "Precisamos do seu ok para avisar por e-mail"),
});

export async function POST(req: Request) {
  if (!backendEnabled() || !SERVER_ENV.supabaseSecret) return NextResponse.json({ error: "A lista ainda não está ligada." }, { status: 503 });
  if (!rateLimit(`lista:${clientKey(req)}`, 5, 60 * 60_000).ok) return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { email, role, municipio } = parsed.data;
  const ibge = MUNICIPIOS.find((m) => m.nome === municipio)?.ibge ?? null;
  const { error } = await supabaseAdmin().from("waitlist")
    .upsert({ email: email.trim().toLowerCase(), role, municipio_ibge: ibge, consent: true }, { onConflict: "email", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "Não deu para salvar agora." }, { status: 500 });
  return NextResponse.json({ ok: true });   // mesma resposta para e-mail novo ou repetido (não revela quem já está na lista)
}
