// Regras de alerta e normalização do clima. Funções puras (testadas em tests/alerts.test.ts).
import type { WeatherDay } from "@/lib/data/types";

export type AlertRule = {
  id: string;
  problem_id: string;
  crop_id: string;
  temp_min: number | null;
  temp_max: number | null;
  min_rain_days: number | null;
  min_humidity: number | null;
  min_local_diagnoses: number | null;
  risk_level: "medio" | "alto";
};

export const OPEN_METEO_DAILY = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean";

export function openMeteoUrl(lat: number, lng: number) {
  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.searchParams.set("latitude", lat.toFixed(3));
  u.searchParams.set("longitude", lng.toFixed(3));
  u.searchParams.set("daily", OPEN_METEO_DAILY);
  u.searchParams.set("timezone", "America/Sao_Paulo");
  u.searchParams.set("forecast_days", "7");
  return u.toString();
}

const icon = (code: number, rain: number): WeatherDay["icon"] =>
  rain >= 2 || (code >= 51 && code <= 99) ? "rain" : code <= 1 ? "sun" : code <= 2 ? "cloud-sun" : "cloud";

type OM = { daily: Record<string, (number | string | null)[]> };
export function normalizeOpenMeteo(json: OM): WeatherDay[] {
  const d = json.daily;
  const n = (k: string, i: number) => Math.round(Number(d[k]?.[i] ?? 0));
  return (d.time as string[]).map((date, i) => {
    const rain = Math.round(Number(d.precipitation_sum?.[i] ?? 0) * 10) / 10;
    return {
      date, rainMm: rain, icon: icon(n("weather_code", i), rain),
      tMin: n("temperature_2m_min", i), tMax: n("temperature_2m_max", i),
      windKmh: n("wind_speed_10m_max", i), humidity: n("relative_humidity_2m_mean", i),
    };
  });
}

/** Avalia uma regra nos próximos 5 dias. Retorna o motivo em texto se disparar. */
export function evaluateRule(rule: AlertRule, days: WeatherDay[], localDiagnoses: number): string | null {
  const next = days.slice(0, 5);
  const parts: string[] = [];
  const hasWeather = rule.min_rain_days != null || rule.temp_min != null || rule.temp_max != null || rule.min_humidity != null;

  if (hasWeather) {
    const wet = next.filter((d) => d.rainMm >= 2 || (rule.min_humidity != null && d.humidity >= rule.min_humidity));
    const pool = rule.min_rain_days && rule.min_rain_days > 0 ? wet : next;
    if (rule.min_rain_days != null && rule.min_rain_days > 0 && wet.length < rule.min_rain_days) return null;
    if (rule.min_rain_days === 0 && next.some((d) => d.rainMm >= 2)) return null;   // regra de estiagem
    const avg = pool.reduce((s, d) => s + (d.tMin + d.tMax) / 2, 0) / Math.max(1, pool.length);
    if (rule.temp_min != null && avg < rule.temp_min) return null;
    if (rule.temp_max != null && avg > rule.temp_max) return null;
    if (rule.min_rain_days) parts.push(`chuva ou umidade alta em ${wet.length} dos próximos 5 dias`);
    if (rule.min_rain_days === 0) parts.push("tempo seco nos próximos 5 dias");
    parts.push(`média de ${Math.round(avg)} °C`);
  }
  if (rule.min_local_diagnoses != null) {
    if (localDiagnoses < rule.min_local_diagnoses) return null;
    parts.push(`${localDiagnoses} caso${localDiagnoses > 1 ? "s" : ""} identificado${localDiagnoses > 1 ? "s" : ""} na região em 14 dias`);
  }
  if (!parts.length) return null;
  const s = parts.join(", ");
  return s[0].toUpperCase() + s.slice(1);
}

/** Dia corrente em Brasília (YYYY-MM-DD), independente do fuso do servidor. */
export function todayBR(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export async function withRetry<T>(fn: () => Promise<T>, tries = 3, baseMs = 500): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; if (i < tries - 1) await new Promise((r) => setTimeout(r, baseMs * 2 ** i)); }
  }
  throw last;
}
