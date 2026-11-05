import "server-only";
// Segredos: só no servidor. O import "server-only" quebra o build se algum
// componente do cliente tentar importar este arquivo.
export const SERVER_ENV = {
  supabaseSecret: process.env.SUPABASE_SECRET_KEY ?? "",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
  anthropicModelStrong: process.env.ANTHROPIC_MODEL_STRONG || "claude-sonnet-5-5",
  cronSecret: process.env.CRON_SECRET ?? "",
  vapidPrivate: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT || "mailto:contato@exemplo.com",
  dailyDiagnosisLimit: Number(process.env.DAILY_DIAGNOSIS_LIMIT || 20),
};
