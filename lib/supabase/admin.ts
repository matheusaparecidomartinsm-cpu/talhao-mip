import "server-only";
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_ENV } from "@/lib/env";
import { SERVER_ENV } from "@/lib/server/env";

/** Service role: ignora RLS. Só em rotas do servidor e jobs, depois de checar quem chama. */
export function supabaseAdmin() {
  if (!SERVER_ENV.supabaseSecret) throw new Error("SUPABASE_SECRET_KEY ausente");
  return createClient(PUBLIC_ENV.supabaseUrl, SERVER_ENV.supabaseSecret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
