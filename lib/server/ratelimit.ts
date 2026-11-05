import "server-only";
// Limite simples em memória (por instância). Com banco, o limite diário de
// diagnósticos é contado na tabela; isto cobre o modo sem banco e rajadas.
const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return { ok: true, remaining: max - 1 }; }
  h.n++;
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  return { ok: h.n <= max, remaining: Math.max(0, max - h.n) };
}

export function clientKey(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
