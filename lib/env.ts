// Variáveis de ambiente. Sem Supabase configurado, o app roda em modo local
// (dados no aparelho); sem chave da Anthropic, o diagnóstico fica em modo demonstração.
export const PUBLIC_ENV = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  vapidPublic: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
export const backendEnabled = () => Boolean(PUBLIC_ENV.supabaseUrl && PUBLIC_ENV.supabaseKey);
