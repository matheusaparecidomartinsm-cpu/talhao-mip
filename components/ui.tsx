import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AGENT_LABEL, type AgentType } from "@/lib/data/types";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 active:scale-[.98] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 select-none";
const btnVariant: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-border-strong hover:bg-surface-sunken",
  ghost: "text-accent hover:bg-accent-soft",
  danger: "bg-danger text-on-danger",
};
const btnSize: Record<Size, string> = {
  sm: "min-h-9 px-3.5 text-sm",
  md: "min-h-12 px-5 text-md",
  lg: "min-h-14 px-6 text-lg w-full",
};

export function Button({
  variant = "primary", size = "md", loading, className, children, ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      className={cx(btnBase, btnVariant[variant], btnSize[size], className)}
      aria-busy={loading || undefined}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading && <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary", size = "md", className, ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cx(btnBase, btnVariant[variant], btnSize[size], className)} {...rest} />;
}

export function AgentBadge({ type }: { type: AgentType }) {
  const map: Record<AgentType, string> = {
    fungo: "bg-agent-fungo-bg text-agent-fungo-fg",
    bacteria: "bg-agent-bacteria-bg text-agent-bacteria-fg",
    virus: "bg-agent-virus-bg text-agent-virus-fg",
    nematoide: "bg-agent-nematoide-bg text-agent-nematoide-fg",
    inseto: "bg-agent-inseto-bg text-agent-inseto-fg",
    acaro: "bg-agent-acaro-bg text-agent-acaro-fg",
    deficiencia: "bg-agent-deficiencia-bg text-agent-deficiencia-fg",
    outro: "bg-agent-outro-bg text-agent-outro-fg",
  };
  return (
    <span className={cx("inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold", map[type])}>
      {AGENT_LABEL[type]}
    </span>
  );
}

export function Badge({ tone = "accent", children }: { tone?: "accent" | "danger" | "warning" | "info"; children: ReactNode }) {
  const t = {
    accent: "bg-accent-soft text-accent",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  }[tone];
  return <span className={cx("inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold", t)}>{children}</span>;
}

export function confidenceLabel(p: number) {
  if (p >= 0.75) return "Muito provável";
  if (p >= 0.5) return "Provável";
  return "Possível";
}

export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div
      role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
      aria-label={`Probabilidade ${pct}%`}
      className="h-1 overflow-hidden rounded-full bg-surface-sunken"
    >
      <div className={cx("h-full", value >= 0.5 ? "bg-accent" : "bg-warning-strong")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({
  icon, title, children, action, tone = "accent",
}: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode; tone?: "accent" | "warning" }) {
  return (
    <div className="px-4 py-8 text-center">
      <div className={cx(
        "mx-auto mb-3 grid size-18 place-items-center rounded-full",
        tone === "accent" ? "bg-accent-soft text-accent" : "bg-warning-soft text-warning",
      )}>{icon}</div>
      <h2 className="text-lg font-bold">{title}</h2>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-text-muted">{children}</div>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cx("skeleton block rounded-sm", className)} />;
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("rounded-md bg-surface shadow-card", className)} {...rest} />;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between">
      <h2 className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function LeafPhoto({ hue, className, label }: { hue: number; className?: string; label: string }) {
  return (
    <div
      role="img" aria-label={label}
      className={cx("leaf-ph", className)}
      style={{ ["--h" as string]: hue }}
    />
  );
}

export function Note({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "info" }) {
  return (
    <p className={cx(
      "rounded-sm px-3 py-2 text-xs",
      tone === "warning" ? "bg-warning-soft text-warning" : "bg-info-soft text-info",
    )}>{children}</p>
  );
}

export function Field({
  label, help, error, id, children,
}: { label: string; help?: string; error?: string; id: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {error ? <p id={`${id}-err`} className="text-xs font-semibold text-danger">{error}</p>
        : help ? <p id={`${id}-help`} className="text-xs text-text-muted">{help}</p> : null}
    </div>
  );
}

export const inputCls =
  "h-12 w-full rounded-md border border-border-input bg-surface px-3 text-md placeholder:text-text-subtle focus:outline-2 focus:outline-focus aria-[invalid=true]:border-danger";

export function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (diff < 1) return "agora";
  if (diff < 60) return `há ${Math.round(diff)} min`;
  if (diff < 60 * 24) return `há ${Math.round(diff / 60)} h`;
  const d = Math.round(diff / 1440);
  return d === 1 ? "ontem" : `há ${d} dias`;
}
