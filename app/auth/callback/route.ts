import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Link do e-mail (confirmação ou entrada). Troca o código por sessão em cookie http-only.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/perfil";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/entrar?erro=link", url.origin));
}
