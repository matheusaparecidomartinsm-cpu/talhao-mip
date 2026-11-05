import { NextResponse } from "next/server";
import { backendEnabled } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/server/ratelimit";

// Exclusão de conta de verdade: fotos no Storage + usuário (o banco apaga o resto em cascata).
export async function POST(req: Request) {
  if (!backendEnabled()) return NextResponse.json({ ok: true, local: true });
  if (!rateLimit(`del:${clientKey(req)}`, 5, 60 * 60_000).ok) return NextResponse.json({ error: "Tente mais tarde" }, { status: 429 });
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "EXCLUIR") return NextResponse.json({ error: "Confirmação ausente" }, { status: 400 });

  const admin = supabaseAdmin();
  for (const bucket of ["diagnoses", "community"]) {
    for (let page = 0; page < 50; page++) {
      const { data } = await admin.storage.from(bucket).list(user.id, { limit: 100 });
      if (!data?.length) break;
      await admin.storage.from(bucket).remove(data.map((f) => `${user.id}/${f.name}`));
    }
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "Não deu para excluir agora" }, { status: 500 });
  const res = NextResponse.json({ ok: true });
  for (const c of req.headers.get("cookie")?.split(";") ?? []) {
    const name = c.split("=")[0].trim();
    if (name.startsWith("sb-")) res.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
  return res;
}
