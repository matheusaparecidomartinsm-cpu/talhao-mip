import { NextResponse } from "next/server";
import webpush from "web-push";
import { MUNICIPIOS } from "@/lib/data/seed";
import { backendEnabled } from "@/lib/env";
import { evaluateRule, normalizeOpenMeteo, openMeteoUrl, todayBR, withRetry, type AlertRule } from "@/lib/server/alerts";
import { SERVER_ENV } from "@/lib/server/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

// Vercel Cron: 08:00 UTC = 05:00 em Brasília (vercel.json). Idempotente por dia.
export async function GET(req: Request) {
  if (!SERVER_ENV.cronSecret || req.headers.get("authorization") !== `Bearer ${SERVER_ENV.cronSecret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  if (!backendEnabled() || !SERVER_ENV.supabaseSecret) return NextResponse.json({ error: "backend desligado" }, { status: 503 });

  const db = supabaseAdmin();
  const day = todayBR();
  const force = new URL(req.url).searchParams.get("force") === "1";
  const { data: prev } = await db.from("job_runs").select("id, status").eq("job", "diario").eq("run_date", day).maybeSingle();
  if (prev?.status === "ok" && !force) return NextResponse.json({ skipped: true, day });
  const { data: run } = await db.from("job_runs").upsert({ job: "diario", run_date: day, status: "running", started_at: new Date().toISOString() }, { onConflict: "job,run_date" }).select("id").single();

  const stats = { municipios: 0, clima: 0, alertas: 0, notificacoes: 0, push: 0, falhas: 0 };
  const failure = async (step: string, ref: string | null, e: unknown) => {
    stats.falhas++;
    await db.from("job_failures").insert({ job: "diario", step, ref, error: String((e as Error)?.message ?? e).slice(0, 500) });
  };

  // 1) municípios com usuários
  const { data: profs } = await db.from("profiles").select("municipio_ibge").not("municipio_ibge", "is", null);
  const codes = [...new Set((profs ?? []).map((p) => p.municipio_ibge as string))];
  stats.municipios = codes.length;

  const { data: rules } = await db.from("alert_rules").select("*").eq("is_active", true);
  const validTo = new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10);
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();

  for (const code of codes) {
    const m = MUNICIPIOS.find((x) => x.ibge === code);
    if (!m) { await failure("coords", code, "município sem coordenadas"); continue; }

    // 2) clima
    let days;
    try {
      const json = await withRetry(async () => {
        const r = await fetch(openMeteoUrl(m.lat, m.lng), { signal: AbortSignal.timeout(10_000) });
        if (!r.ok) throw new Error(`open-meteo ${r.status}`);
        return r.json();
      });
      days = normalizeOpenMeteo(json);
      await db.from("weather_cache").upsert({ municipio_ibge: code, forecast: days, fetched_at: new Date().toISOString() });
      stats.clima++;
    } catch (e) { await failure("clima", code, e); continue; }

    // 3) regras
    for (const rule of (rules ?? []) as AlertRule[]) {
      const { count } = await db.from("diagnosis_candidates")
        .select("diagnosis_id, diagnoses!inner(municipio_ibge, status, created_at)", { count: "exact", head: true })
        .eq("rank", 1).eq("problem_id", rule.problem_id)
        .eq("diagnoses.municipio_ibge", code).eq("diagnoses.status", "ok").gte("diagnoses.created_at", since);
      const reason = evaluateRule(rule, days, count ?? 0);
      if (!reason) continue;
      const { error } = await db.from("disease_alerts").upsert({
        rule_id: rule.id, problem_id: rule.problem_id, crop_id: rule.crop_id, municipio_ibge: code,
        risk_level: rule.risk_level, reason, valid_from: day, valid_to: validTo,
      }, { onConflict: "problem_id,municipio_ibge,valid_from", ignoreDuplicates: true });
      if (error) await failure("alerta", code, error); else stats.alertas++;
    }

    // 4) avisos: no máximo 1 por pessoa por dia, só o alerta mais grave
    const { data: alerts } = await db.from("disease_alerts").select("id, risk_level, reason, problems(common_name, slug)")
      .eq("municipio_ibge", code).eq("valid_from", day);
    if (!alerts?.length) continue;
    const top = [...alerts].sort((a, b) => (a.risk_level === "alto" ? -1 : 1) - (b.risk_level === "alto" ? -1 : 1))[0] as unknown as
      { id: string; risk_level: string; reason: string; problems: { common_name: string; slug: string } };
    const { data: users } = await db.from("profiles").select("id").eq("municipio_ibge", code).eq("notify_alerts", true);
    const startOfDay = new Date(`${day}T03:00:00Z`).toISOString(); // 00h em Brasília
    for (const u of users ?? []) {
      const { count: already } = await db.from("notifications").select("id", { count: "exact", head: true })
        .eq("user_id", u.id).eq("kind", "alert").gte("created_at", startOfDay);
      if ((already ?? 0) > 0) continue;
      const title = `Risco ${top.risk_level === "alto" ? "alto" : "médio"}: ${top.problems.common_name}`;
      const { error } = await db.from("notifications").insert({ user_id: u.id, kind: "alert", ref_id: top.id, title, body: top.reason });
      if (error) continue; // unique: já avisado deste alerta
      stats.notificacoes++;
      if (!SERVER_ENV.vapidPrivate || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) continue;
      const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", u.id);
      for (const s of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title, body: top.reason, url: `/alertas#${top.id}`, tag: `alerta-${day}` }),
            { vapidDetails: { subject: SERVER_ENV.vapidSubject, publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey: SERVER_ENV.vapidPrivate }, TTL: 12 * 3600 });
          stats.push++;
        } catch (e) {
          const code_ = (e as { statusCode?: number }).statusCode;
          if (code_ === 404 || code_ === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
          else await failure("push", s.id, e);
        }
      }
    }
  }

  // 5) limpeza: notificações com mais de 90 dias
  await db.from("notifications").delete().lt("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString());

  const status = stats.falhas === 0 ? "ok" : stats.clima > 0 ? "partial" : "failed";
  if (run) await db.from("job_runs").update({ status, stats, finished_at: new Date().toISOString() }).eq("id", run.id);
  return NextResponse.json({ day, status, stats });
}
