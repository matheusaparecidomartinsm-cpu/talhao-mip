// Camada de dados PROVISÓRIA. Mesmas assinaturas que a versão Supabase vai ter
// (replica-architect §3). Ao trocar a implementação, nenhuma tela muda.
import { PROBLEMS, problemBySlug } from "./seed-problems";
import { ALERTS, CROPS, FERTILIZER_RULES, MUNICIPIOS, POSTS, STAGE_TIPS, weatherFor } from "./seed";
import type { AgentType, Candidate, DiseaseAlert, Problem, SprayVerdict, StageTip, WeatherDay } from "./types";

export async function listCrops() { return CROPS; }
export async function getCrop(slug: string) { return CROPS.find((c) => c.slug === slug); }

export async function listProblems(cropSlug: string, type?: AgentType): Promise<Problem[]> {
  if (cropSlug !== "soja") return [];
  return PROBLEMS
    .filter((p) => !type || p.agentType === type)
    .sort((a, b) => a.commonName.localeCompare(b.commonName, "pt-BR"));
}

export async function getProblem(slug: string) { return problemBySlug(slug); }

export async function searchProblems(q: string) {
  const n = norm(q);
  if (!n) return [];
  return PROBLEMS.filter((p) =>
    norm(`${p.commonName} ${p.scientificName} ${p.symptoms}`).includes(n));
}

const remoteOn = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
const remote = () => import("./remote");

export async function listPosts(cropSlug?: string) {
  if (remoteOn()) return (await remote()).remoteListPosts();
  return POSTS.filter((p) => !cropSlug || p.cropSlug === cropSlug)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getPost(id: string) {
  if (remoteOn()) return (await remote()).remoteGetPost(id);
  return POSTS.find((p) => p.id === id);
}

export async function listAlerts(municipio?: string): Promise<DiseaseAlert[]> {
  if (remoteOn()) return (await (await remote()).remoteListAlerts()).filter((a) => !municipio || a.municipio === municipio);
  return ALERTS.filter((a) => !municipio || a.municipio === municipio);
}

/** Previsão do município. `sample: true` quando são dados de exemplo (sem backend ou sem cache recente). */
export async function getWeatherInfo(municipio: string): Promise<{ days: WeatherDay[]; sample: boolean }> {
  if (remoteOn()) { const d = await (await remote()).remoteWeather(municipio); if (d?.length) return { days: d, sample: false }; }
  return { days: weatherFor(municipio), sample: true };
}
export async function getWeather(municipio: string): Promise<WeatherDay[]> { return (await getWeatherInfo(municipio)).days; }

export function sprayVerdict(d: WeatherDay): SprayVerdict {
  if (d.rainMm >= 5) return { ok: false, reason: "chuva" };
  if (d.windKmh > 15) return { ok: false, reason: `vento ${d.windKmh} km/h` };
  if (d.tMax > 32) return { ok: false, reason: "muito calor" };
  return { ok: true, reason: "boas condições" };
}

export async function listStageTips(): Promise<StageTip[]> { return STAGE_TIPS; }
export async function listFertilizerRules() { return FERTILIZER_RULES; }
export async function listMunicipios(q = "") {
  const n = norm(q);
  return MUNICIPIOS.filter((m) => norm(m.nome).includes(n));
}

// ─── diagnóstico provisório ──────────────────────────────────────────
// Sem modelo de visão ainda. Usa só estatísticas da foto calculadas no celular
// (brilho, proporção de verde e de marrom) para devolver um resultado de DEMONSTRAÇÃO.
// replica-backend troca por chamada ao Claude com visão (architecture.md §4).
export type ImageStats = { brightness: number; green: number; brown: number; hash: number };
export type DiagnoseResult = { status: "ok" | "not_identified" | "bad_image" | "not_plant"; candidates: Candidate[]; model: string };

export async function diagnose(stats: ImageStats): Promise<DiagnoseResult> {
  const model = "demo-heuristica-v0";
  if (stats.brightness < 0.16) return { status: "bad_image", candidates: [], model };
  if (stats.green < 0.08 && stats.brown < 0.08) return { status: "not_plant", candidates: [], model };
  const pool = stats.brown > 0.04
    ? ["ferrugem-asiatica", "mancha-alvo", "antracnose", "deficiencia-de-potassio"]
    : ["lagarta-da-soja", "oidio", "percevejo-marrom", "crestamento-bacteriano", "mosca-branca"];
  const first = pool[stats.hash % pool.length];
  const second = pool[(stats.hash + 1) % pool.length];
  const p1 = 0.55 + ((stats.hash >> 3) % 35) / 100;      // 0.55–0.89
  if (stats.green < 0.2 && stats.brown < 0.05) return { status: "not_identified", candidates: [], model };
  return {
    status: "ok",
    model,
    candidates: [
      { problemSlug: first, probability: round(p1), reasoning: "Padrão de manchas e cor da folha compatíveis." },
      { problemSlug: second, probability: round(Math.max(0.05, 0.95 - p1 - 0.05)), reasoning: "Sintomas parecidos; confira a ficha." },
    ],
  };
}

const round = (n: number) => Math.round(n * 100) / 100;
function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
