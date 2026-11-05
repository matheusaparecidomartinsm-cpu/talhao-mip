import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRule, normalizeOpenMeteo, openMeteoUrl, todayBR, withRetry, type AlertRule } from "../lib/server/alerts.ts";

const om = { daily: {
  time: ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11"],
  weather_code: [61, 63, 2, 0, 80, 3, 1], temperature_2m_max: [27.4, 26, 29, 31, 26, 30, 32], temperature_2m_min: [18.2, 19, 17, 18, 19, 20, 20],
  precipitation_sum: [24.04, 8, 0.4, 0, 6, 0, 0], wind_speed_10m_max: [9, 12, 8, 6, 18, 10, 14], relative_humidity_2m_mean: [88, 84, 70, 58, 86, 66, 60],
} };
const rule = (o: Partial<AlertRule>): AlertRule => ({ id: "r", problem_id: "p", crop_id: "c", temp_min: null, temp_max: null, min_rain_days: null, min_humidity: null, min_local_diagnoses: null, risk_level: "alto", ...o });

test("normaliza Open-Meteo", () => {
  const d = normalizeOpenMeteo(om);
  assert.equal(d.length, 7);
  assert.deepEqual(d[0], { date: "2026-11-05", rainMm: 24, icon: "rain", tMin: 18, tMax: 27, windKmh: 9, humidity: 88 });
  assert.equal(d[3].icon, "sun");
  assert.equal(d[2].icon, "cloud-sun");
});
test("ferrugem dispara com 3 dias úmidos e 18–28 °C", () => {
  const r = evaluateRule(rule({ temp_min: 18, temp_max: 28, min_rain_days: 3, min_humidity: 80 }), normalizeOpenMeteo(om), 0);
  assert.match(r!, /3 dos próximos 5 dias/);
});
test("não dispara se faltar dia úmido ou estiver quente demais", () => {
  assert.equal(evaluateRule(rule({ min_rain_days: 4, min_humidity: 95 }), normalizeOpenMeteo(om), 0), null);
  assert.equal(evaluateRule(rule({ temp_max: 15, min_rain_days: 1 }), normalizeOpenMeteo(om), 0), null);
});
test("regra por casos na região", () => {
  assert.equal(evaluateRule(rule({ min_local_diagnoses: 3 }), [], 2), null);
  assert.match(evaluateRule(rule({ min_local_diagnoses: 3 }), [], 4)!, /4 casos/);
});
test("regra de estiagem (ácaro) não dispara com chuva", () => {
  assert.equal(evaluateRule(rule({ temp_min: 25, min_rain_days: 0, min_local_diagnoses: 0 }), normalizeOpenMeteo(om), 5), null);
});
test("dia de Brasília e URL", () => {
  assert.equal(todayBR(new Date("2026-11-06T02:30:00Z")), "2026-11-05");   // 23h30 em Brasília
  assert.match(openMeteoUrl(-24.956, -53.455), /timezone=America%2FSao_Paulo/);
});
test("retry com backoff", async () => {
  let n = 0;
  assert.equal(await withRetry(async () => { if (++n < 3) throw new Error("x"); return "ok"; }, 3, 1), "ok");
  await assert.rejects(withRetry(async () => { throw new Error("sempre"); }, 2, 1));
});
