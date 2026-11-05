import { NextResponse } from "next/server";
import { z } from "zod";
import { backendEnabled } from "@/lib/env";
import { currentUser } from "@/lib/supabase/server";

const Sub = z.object({
  endpoint: z.url().max(1000).refine((u) => u.startsWith("https://"), "endpoint precisa ser https"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

export async function POST(req: Request) {
  if (!backendEnabled()) return NextResponse.json({ error: "Indisponível" }, { status: 503 });
  const parsed = Sub.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  const { sb, user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  const { endpoint, keys } = parsed.data;
  const { error } = await sb.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: req.headers.get("user-agent")?.slice(0, 200) ?? null },
    { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Não deu para salvar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!backendEnabled()) return NextResponse.json({ ok: true });
  const parsed = z.object({ endpoint: z.url() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Inválido" }, { status: 400 });
  const { sb, user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  await sb.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
