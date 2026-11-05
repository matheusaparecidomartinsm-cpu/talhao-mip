// Gera supabase/seed.sql a partir das fichas em lib/data (fonte única do conteúdo).
// Uso: node --experimental-strip-types scripts/gen-seed.ts > supabase/seed.sql
import { PROBLEMS } from "../lib/data/seed-problems.ts";
import { CROPS, FERTILIZER_RULES, STAGE_TIPS } from "../lib/data/seed.ts";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return `array[${v.map(q).join(",")}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const out: string[] = [
  "-- GERADO por scripts/gen-seed.ts. Não editar à mão.",
  "-- Conteúdo próprio do Talhão. Fichas publicadas com reviewed_at = null (\"em revisão\").",
  "begin;",
];

for (const c of CROPS) {
  out.push(`insert into crops (slug, name, scientific_name, eppo_code, icon, is_active) values (${q(c.slug)}, ${q(c.name)}, ${q(c.scientificName)}, ${q(c.slug === "soja" ? "GLXMA" : null)}, ${q(c.slug)}, ${q(c.active)})
  on conflict (slug) do update set name = excluded.name, is_active = excluded.is_active;`);
}

for (const p of PROBLEMS) {
  const cues = [...p.summary, p.symptoms].join(" ");
  out.push(`insert into problems (slug, agent_type, common_name, scientific_name, summary, symptoms, cause, preventive_measures, visual_cues, sources, status, placeholder_hue)
  values (${q(p.slug)}, ${q(p.agentType)}, ${q(p.commonName)}, ${q(p.scientificName)}, ${q(p.summary)}, ${q(p.symptoms)}, ${q(p.cause)}, ${q(p.preventive)}, ${q(cues)}, ${q(p.sources)}, 'published', ${p.hue})
  on conflict (slug) do update set agent_type = excluded.agent_type, common_name = excluded.common_name, scientific_name = excluded.scientific_name,
    summary = excluded.summary, symptoms = excluded.symptoms, cause = excluded.cause, preventive_measures = excluded.preventive_measures,
    visual_cues = excluded.visual_cues, sources = excluded.sources, placeholder_hue = excluded.placeholder_hue;`);
  out.push(`insert into problem_crops (problem_id, crop_id, stages) select p.id, c.id, ${q(p.stages)} from problems p, crops c where p.slug = ${q(p.slug)} and c.slug = 'soja'
  on conflict (problem_id, crop_id) do update set stages = excluded.stages;`);
  out.push(`delete from treatments where problem_id = (select id from problems where slug = ${q(p.slug)});`);
  p.treatments.forEach((t, i) => {
    out.push(`insert into treatments (problem_id, kind, text, active_ingredient, moa_group, agrofit_url, sort) select id, ${q(t.kind)}, ${q(t.text)}, ${q(t.activeIngredient)}, ${q(t.moaGroup)}, ${q(t.kind === "quimico" ? "https://agrofit.agricultura.gov.br/agrofit_cons/principal_agrofit_cons" : null)}, ${i} from problems where slug = ${q(p.slug)};`);
  });
}

out.push("delete from crop_stage_tips where crop_id = (select id from crops where slug = 'soja');");
for (const t of STAGE_TIPS) {
  out.push(`insert into crop_stage_tips (crop_id, stage, day_from, day_to, title, tip, problem_ids)
  select c.id, ${q(t.stage)}, ${t.dayFrom}, ${t.dayTo}, ${q(t.title)}, ${q(t.tip)}, coalesce((select array_agg(id) from problems where slug = any(${q(t.watch)})), '{}') from crops c where c.slug = 'soja';`);
}

const NUT: Record<string, string> = { "P₂O₅": "P2O5", "K₂O": "K2O" };
for (const f of FERTILIZER_RULES) {
  out.push(`insert into fertilizer_rules (crop_id, nutrient, kg_per_ha_min, kg_per_ha_max, note) select id, ${q(NUT[f.nutrient] ?? f.nutrient)}, ${f.kgHaMin}, ${f.kgHaMax}, ${q(f.note)} from crops where slug = 'soja'
  on conflict (crop_id, nutrient) do update set kg_per_ha_min = excluded.kg_per_ha_min, kg_per_ha_max = excluded.kg_per_ha_max, note = excluded.note;`);
}

// regras de alerta (ponto de partida; Agronomia deve revisar os limites)
const RULES = [
  { slug: "ferrugem-asiatica", tmin: 18, tmax: 28, rain: 3, hum: 80, local: null, risk: "alto" },
  { slug: "mofo-branco", tmin: 15, tmax: 23, rain: 3, hum: 80, local: null, risk: "alto" },
  { slug: "mancha-alvo", tmin: 20, tmax: 32, rain: 4, hum: 80, local: null, risk: "medio" },
  { slug: "percevejo-marrom", tmin: null, tmax: null, rain: null, hum: null, local: 3, risk: "medio" },
  { slug: "acaro-rajado", tmin: 25, tmax: 40, rain: 0, hum: null, local: 2, risk: "medio" },
];
out.push("delete from alert_rules;");
for (const r of RULES) {
  out.push(`insert into alert_rules (problem_id, crop_id, temp_min, temp_max, min_rain_days, min_humidity, min_local_diagnoses, risk_level)
  select p.id, c.id, ${q(r.tmin)}, ${q(r.tmax)}, ${q(r.rain)}, ${q(r.hum)}, ${q(r.local)}, ${q(r.risk)} from problems p, crops c where p.slug = ${q(r.slug)} and c.slug = 'soja';`);
}
out.push("commit;");
console.log(out.join("\n"));
