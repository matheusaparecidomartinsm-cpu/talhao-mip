import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PUBLIC_ENV } from "@/lib/env";

/** Cliente com a sessão do usuário (cookies http-only). Respeita RLS. */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(PUBLIC_ENV.supabaseUrl, PUBLIC_ENV.supabaseKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* chamado de um Server Component: o proxy renova os cookies */ }
      },
    },
  });
}

export async function currentUser() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return { sb, user: data.user };
}
