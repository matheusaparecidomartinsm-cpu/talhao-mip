import "server-only";
// Leituras do Supabase (dados públicos: comunidade publicada, alertas, clima).
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MUNICIPIOS } from "./seed";
import type { DiseaseAlert, Post, WeatherDay } from "./types";

const munName = (ibge?: string | null) => MUNICIPIOS.find((m) => m.ibge === ibge)?.nome ?? "Sem município";
const munCode = (nome: string) => MUNICIPIOS.find((m) => m.nome === nome)?.ibge;
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "P";

type PostRow = {
  id: string; author_name: string; municipio_ibge: string | null; title: string; body: string; image_paths: string[];
  created_at: string; diagnosis_id: string | null;
  answers?: { id: string; author_name: string; is_expert: boolean; body: string; likes_count: number; created_at: string; status: string }[];
};

function toPost(r: PostRow): Post {
  const db = supabaseAdmin();
  const img = r.image_paths?.[0];
  return {
    id: r.id, cropSlug: "soja", author: r.author_name, municipio: munName(r.municipio_ibge), title: r.title, body: r.body,
    hue: 100, createdAt: r.created_at, diagnosisId: r.diagnosis_id ?? undefined,
    imageUrl: img ? db.storage.from("community").getPublicUrl(img).data.publicUrl : undefined,
    answers: (r.answers ?? []).filter((a) => a.status === "published").sort((a, b) => a.created_at.localeCompare(b.created_at)).map((a) => ({
      id: a.id, author: a.author_name, initials: initials(a.author_name), isExpert: a.is_expert, body: a.body, useful: a.likes_count, createdAt: a.created_at,
    })),
  };
}

export async function remoteListPosts(): Promise<Post[]> {
  const { data } = await supabaseAdmin().from("posts")
    .select("id, author_name, municipio_ibge, title, body, image_paths, created_at, diagnosis_id, answers(id, author_name, is_expert, body, likes_count, created_at, status)")
    .eq("status", "published").order("last_activity_at", { ascending: false }).limit(50);
  return (data ?? []).map((r) => toPost(r as PostRow));
}

export async function remoteGetPost(id: string): Promise<Post | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  const { data } = await supabaseAdmin().from("posts")
    .select("id, author_name, municipio_ibge, title, body, image_paths, created_at, diagnosis_id, answers(id, author_name, is_expert, body, likes_count, created_at, status)")
    .eq("id", id).eq("status", "published").maybeSingle();
  return data ? toPost(data as PostRow) : undefined;
}

export async function remoteListAlerts(): Promise<DiseaseAlert[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin().from("disease_alerts")
    .select("id, municipio_ibge, risk_level, reason, valid_from, valid_to, created_at, problems(slug)")
    .gte("valid_to", today).order("created_at", { ascending: false }).limit(200);
  return (data ?? []).map((a) => ({
    id: a.id, problemSlug: (a.problems as unknown as { slug: string })?.slug ?? "", municipio: munName(a.municipio_ibge),
    risk: a.risk_level as "medio" | "alto", reason: a.reason, validFrom: a.valid_from, validTo: a.valid_to, createdAt: a.created_at,
  }));
}

export async function remoteWeather(municipioNome: string): Promise<WeatherDay[] | null> {
  const code = munCode(municipioNome);
  if (!code) return null;
  const { data } = await supabaseAdmin().from("weather_cache").select("forecast, fetched_at").eq("municipio_ibge", code).maybeSingle();
  if (!data || Date.now() - new Date(data.fetched_at).getTime() > 36 * 3600_000) return null;
  return data.forecast as WeatherDay[];
}
