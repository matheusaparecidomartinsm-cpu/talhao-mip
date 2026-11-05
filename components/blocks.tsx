import Link from "next/link";
import { Cloud, CloudRain, CloudSun, MessageCircle, Sun, TriangleAlert } from "lucide-react";
import type { DiseaseAlert, Post, SprayVerdict, StageTip, WeatherDay } from "@/lib/data/types";
import { cx, relTime } from "./ui";

export function WeatherIcon({ icon, className }: { icon: WeatherDay["icon"]; className?: string }) {
  const I = { sun: Sun, "cloud-sun": CloudSun, cloud: Cloud, rain: CloudRain }[icon];
  const label = { sun: "Sol", "cloud-sun": "Sol entre nuvens", cloud: "Nublado", rain: "Chuva" }[icon];
  return <I className={className} role="img" aria-label={label} />;
}

export const RISK_LABEL = { medio: "médio", alto: "alto" } as const;

export function AlertRow({ a, name, unread }: { a: DiseaseAlert; name: string; unread?: boolean }) {
  const high = a.risk === "alto";
  return (
    <Link
      href={`/alertas#${a.id}`}
      suppressHydrationWarning
      aria-label={`Risco ${RISK_LABEL[a.risk]} de ${name} em ${a.municipio}, ${relTime(a.createdAt)}`}
      className={cx("flex items-center gap-3 border-b border-border p-3 last:border-b-0", unread ? "bg-danger-soft" : "hover:bg-surface-sunken")}
    >
      <span className={cx("grid size-12 shrink-0 place-items-center rounded-sm border",
        high ? "border-danger bg-surface text-danger" : "border-warning-strong bg-warning-soft text-warning")}>
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{name}</span>
        <span className="block truncate text-sm text-text-muted">Risco {RISK_LABEL[a.risk]}: {a.reason}</span>
      </span>
      <time suppressHydrationWarning dateTime={a.createdAt} className="self-start text-xs text-text-subtle">{relTime(a.createdAt)}</time>
    </Link>
  );
}

export function PostCard({ p, isNew }: { p: Post; isNew?: boolean }) {
  const hasExpert = p.answers.some((a) => a.isExpert);
  return (
    <Link href={`/comunidade/${p.id}`} className={cx("flex gap-3 border-b border-border p-3 last:border-b-0", isNew ? "bg-success-soft" : "hover:bg-surface-sunken")}>
      <span className="leaf-ph size-14 shrink-0 rounded-sm" style={{ ["--h" as string]: p.hue }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">Soja · {p.municipio}</span>
        <span className="line-clamp-2 block font-semibold">{p.title}</span>
        <span className="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
          {isNew ? <span className="font-bold text-success">1 resposta nova</span> : (
            <span aria-label={`${p.answers.length} respostas`}><MessageCircle className="inline size-3.5" aria-hidden /> {p.answers.length}</span>
          )}
          {hasExpert && <span className="font-semibold text-accent">Especialista respondeu</span>}
          <time suppressHydrationWarning dateTime={p.createdAt}>{relTime(p.createdAt)}</time>
        </span>
      </span>
    </Link>
  );
}

export function WeatherTable({ days }: { days: (WeatherDay & { spray: SprayVerdict })[] }) {
  const wk = (d: string, i: number) => i === 0 ? "Hoje" : new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const maxRain = Math.max(10, ...days.map((d) => d.rainMm));
  return (
    <div className="scroll-x">
      <table className="w-full min-w-[480px] border-collapse text-center text-sm">
        <caption className="sr-only">Previsão para os próximos {days.length} dias e condição para pulverizar</caption>
        <thead>
          <tr>{days.map((d, i) => <th key={d.date} scope="col" className={cx("py-2 font-semibold capitalize", i === 0 && "rounded-t-sm bg-info-soft")}>{wk(d.date, i)}</th>)}</tr>
        </thead>
        <tbody>
          <tr>{days.map((d, i) => <td key={d.date} className={cx("py-1", i === 0 && "bg-info-soft")}><WeatherIcon icon={d.icon} className="mx-auto size-6 text-info" /></td>)}</tr>
          <tr>{days.map((d, i) => <td key={d.date} className={cx("py-1", i === 0 && "bg-info-soft")}>{d.tMin}–{d.tMax}°</td>)}</tr>
          <tr aria-hidden>{days.map((d, i) => (
            <td key={d.date} className={cx("h-8 align-bottom", i === 0 && "bg-info-soft")}>
              <span className="mx-auto block w-3/5 rounded-t-sm bg-info" style={{ height: `${Math.round((d.rainMm / maxRain) * 28)}px` }} />
            </td>))}</tr>
          <tr>{days.map((d, i) => <td key={d.date} className={cx("py-1 text-xs text-info", i === 0 && "bg-info-soft")}>{d.rainMm} mm</td>)}</tr>
          <tr>{days.map((d, i) => (
            <td key={d.date} className={cx("py-2 text-xs font-bold", d.spray.ok ? "text-success" : "text-danger", i === 0 && "rounded-b-sm bg-info-soft")}>
              {d.spray.ok ? "Bom" : "Evitar"}<span className="block font-normal text-text-muted">{d.spray.ok ? "" : d.spray.reason}</span>
            </td>))}</tr>
        </tbody>
      </table>
    </div>
  );
}

export function StageTimeline({ tips, current }: { tips: StageTip[]; current: number }) {
  return (
    <ol className="relative flex justify-between pt-1 before:absolute before:inset-x-3 before:top-[15px] before:h-0.5 before:bg-border">
      {tips.map((t, i) => (
        <li key={t.stage} aria-current={i === current ? "step" : undefined}
          className={cx("relative w-12 text-center text-xs", i === current ? "font-bold text-ink" : "text-text-muted")}>
          <span aria-hidden className={cx("mx-auto mb-1 block size-6 rounded-full border-2",
            i < current ? "border-accent-bright bg-accent-bright"
              : i === current ? "border-accent bg-accent ring-4 ring-accent-soft"
              : "border-border bg-surface")} />
          {t.stage}
        </li>
      ))}
    </ol>
  );
}
