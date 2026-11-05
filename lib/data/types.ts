// Tipos espelham replica/schema.sql. Quando o Supabase entrar (replica-backend),
// só a implementação em lib/data/index.ts muda; telas e tipos ficam.

export type AgentType =
  | "fungo" | "bacteria" | "virus" | "nematoide" | "inseto" | "acaro" | "deficiencia" | "outro";

export const AGENT_LABEL: Record<AgentType, string> = {
  fungo: "Fungo", bacteria: "Bactéria", virus: "Vírus", nematoide: "Nematoide",
  inseto: "Inseto", acaro: "Ácaro", deficiencia: "Deficiência", outro: "Outro",
};

export type Crop = { id: string; slug: string; name: string; scientificName: string; active: boolean };

export type TreatmentKind = "cultural" | "biologico" | "quimico";
export type Treatment = {
  kind: TreatmentKind;
  text: string;
  activeIngredient?: string;
  moaGroup?: string;
};

export type ProblemStatus = "draft" | "review" | "published";
export type Problem = {
  id: string;
  slug: string;
  agentType: AgentType;
  commonName: string;
  scientificName: string;
  summary: string[];
  symptoms: string;
  cause: string;
  preventive: string[];
  treatments: Treatment[];
  stages: string[];          // estádios em que costuma aparecer
  hue: number;               // cor do placeholder de imagem (sem foto real ainda)
  status: ProblemStatus;
  sources: string[];
};

export type DiagnosisStatus =
  | "pending" | "queued" | "ok" | "not_identified" | "bad_image" | "wrong_crop" | "not_plant" | "failed";

export type Candidate = { problemSlug: string; probability: number; reasoning: string };

export type Diagnosis = {
  id: string;
  cropSlug: string;
  status: DiagnosisStatus;
  candidates: Candidate[];
  capturedAt: string;        // ISO
  createdAt: string;
  feedback?: "correct" | "wrong";
  model?: string;
};

export type Post = {
  id: string;
  cropSlug: string;
  author: string;
  municipio: string;
  title: string;
  body: string;
  hue: number;
  createdAt: string;
  answers: Answer[];
  diagnosisId?: string;
};

export type Answer = {
  id: string;
  author: string;
  initials: string;
  isExpert: boolean;
  body: string;
  useful: number;
  createdAt: string;
};

export type RiskLevel = "medio" | "alto";
export type DiseaseAlert = {
  id: string;
  problemSlug: string;
  municipio: string;
  risk: RiskLevel;
  reason: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
};

export type WeatherDay = {
  date: string;              // YYYY-MM-DD
  icon: "sun" | "cloud-sun" | "cloud" | "rain";
  tMin: number;
  tMax: number;
  rainMm: number;
  windKmh: number;
  humidity: number;
};

export type SprayVerdict = { ok: boolean; reason: string };

export type StageTip = {
  stage: string;
  dayFrom: number;
  dayTo: number;
  title: string;
  tip: string;
  watch: string[];           // slugs de problemas
};

export type FertilizerRule = { nutrient: string; kgHaMin: number; kgHaMax: number; note: string };
