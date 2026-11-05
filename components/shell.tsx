"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Bell, BookOpen, Camera, ChevronUp, House, User, Users, WifiOff, Loader, CircleCheck, CircleAlert } from "lucide-react";
import { cx } from "./ui";
import { listDiagnoses, processQueue, QUEUE_EVENT } from "@/lib/client/store";
import { problemBySlug } from "@/lib/data/seed-problems";

export function AppBar({ title, back, alerts = true }: { title: string; back?: string | true; alerts?: boolean }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[var(--layout-content-max)] items-center gap-2 px-2 md:max-w-[var(--layout-wide-max)]">
        {back ? (
          typeof back === "string" ? (
            <Link href={back} aria-label="Voltar" className="grid size-12 place-items-center rounded-full text-ink hover:bg-surface-sunken">
              <ArrowLeft aria-hidden />
            </Link>
          ) : (
            <button onClick={() => router.back()} aria-label="Voltar" className="grid size-12 place-items-center rounded-full text-ink hover:bg-surface-sunken">
              <ArrowLeft aria-hidden />
            </button>
          )
        ) : <span className="w-2" />}
        <h1 className={cx("display min-w-0 flex-1 truncate text-xl font-bold", back && "text-center")}>{title}</h1>
        {alerts ? (
          <Link href="/alertas" aria-label="Alertas da região" className="relative grid size-12 place-items-center rounded-full text-ink hover:bg-surface-sunken">
            <Bell aria-hidden />
            <span className="absolute right-3 top-3 size-2 rounded-full bg-danger" aria-hidden />
          </Link>
        ) : <span className="w-12" />}
      </div>
    </header>
  );
}

const TABS = [
  { href: "/", label: "Início", icon: House, match: (p: string) => p === "/" || p.startsWith("/clima") || p.startsWith("/alertas") || p.startsWith("/plano") || p.startsWith("/calculadora") },
  { href: "/comunidade", label: "Comunidade", icon: Users, match: (p: string) => p.startsWith("/comunidade") },
  null,
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen, match: (p: string) => p.startsWith("/biblioteca") || p.startsWith("/produtos") },
  { href: "/perfil", label: "Perfil", icon: User, match: (p: string) => p.startsWith("/perfil") || p.startsWith("/historico") || p.startsWith("/diagnostico") },
];

export function BottomDock() {
  const path = usePathname();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="pointer-events-auto relative mx-auto max-w-[var(--layout-content-max)]">
        <Link
          href="/camera"
          aria-label="Diagnosticar com foto"
          className="absolute -top-20 right-4 grid size-16 place-items-center rounded-full bg-accent text-on-accent shadow-fab transition-colors hover:bg-accent-hover"
        >
          <Camera className="size-7" aria-hidden />
        </Link>
        <ProcessingBar />
        <nav aria-label="Principal" className="grid h-16 grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t, i) => {
            if (!t) return <span key={i} aria-hidden />;
            const active = t.match(path);
            const Icon = t.icon;
            return (
              <Link
                key={t.href} href={t.href} aria-current={active ? "page" : undefined}
                className={cx("relative grid place-content-center justify-items-center gap-0.5 text-xs font-semibold",
                  active ? "text-ink" : "text-text-muted")}
              >
                {active && <span aria-hidden className="absolute inset-x-1/4 top-0 h-[3px] rounded-b-sm bg-accent-bright" />}
                <Icon className="size-5" aria-hidden />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

type QItem = { id: string; status: string; hue: number; label: string };

export function ProcessingBar() {
  const [items, setItems] = useState<QItem[]>([]);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const all = await listDiagnoses();
      const recent = all.filter((d) =>
        ["pending", "queued", "failed"].includes(d.status) ||
        (Date.now() - new Date(d.createdAt).getTime() < 90_000 && !sessionStorage.getItem(`seen:${d.id}`)));
      if (alive) setItems(recent.map((d) => {
        const top = d.candidates[0] && problemBySlug(d.candidates[0].problemSlug);
        return { id: d.id, status: d.status, hue: top?.hue ?? 100, label: top?.commonName ?? "" };
      }));
    };
    refresh();
    const onOnline = () => processQueue();
    window.addEventListener(QUEUE_EVENT, refresh);
    window.addEventListener("online", onOnline);
    processQueue();
    return () => { alive = false; window.removeEventListener(QUEUE_EVENT, refresh); window.removeEventListener("online", onOnline); };
  }, []);

  useEffect(() => {
    const m = path.match(/^\/diagnostico\/(.+)$/);
    if (m) { sessionStorage.setItem(`seen:${m[1]}`, "1"); setItems((x) => x.filter((i) => i.id !== m[1])); }
  }, [path]);

  if (!items.length) return null;
  const pending = items.filter((i) => i.status === "pending").length;
  const queued = items.filter((i) => i.status === "queued").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const ready = items.filter((i) => !["pending", "queued", "failed"].includes(i.status));
  const first = items[0];

  const text = pending ? "Analisando sua foto…"
    : queued ? `${queued} foto${queued > 1 ? "s" : ""} na fila — enviamos quando voltar o sinal`
    : failed ? "Não deu pra analisar. Toque para tentar de novo"
    : "Pronto! Toque para ver o resultado";

  const single = items.length === 1;
  const content = (
    <>
      <span className="leaf-ph size-10 shrink-0 rounded-sm" style={{ ["--h" as string]: first.hue }} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm">{text}</span>
      {pending ? <Loader className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
        : failed ? <CircleAlert className="size-5" aria-hidden />
        : queued ? <WifiOff className="size-5" aria-hidden />
        : <CircleCheck className="size-5" aria-hidden />}
      {!single && <ChevronUp className={cx("size-5 transition-transform", open && "rotate-180")} aria-hidden />}
    </>
  );
  const cls = "relative mx-2 flex w-[calc(100%-16px)] items-center gap-3 overflow-hidden rounded-t-md bg-surface-inverse px-3 py-2 text-left text-text-inverse";

  return (
    <div role="status" aria-live="polite">
      {open && !single && (
        <ul className="mx-2 max-h-60 overflow-auto rounded-t-md bg-surface-inverse text-text-inverse">
          {items.map((i) => (
            <li key={i.id}>
              <Link href={`/diagnostico/${i.id}`} className="flex items-center gap-3 border-b border-ink px-3 py-2 text-sm">
                <span className="leaf-ph size-8 rounded-sm" style={{ ["--h" as string]: i.hue }} aria-hidden />
                {i.status === "pending" ? "Analisando…" : i.status === "queued" ? "Na fila" : i.status === "failed" ? "Falhou" : i.label || "Resultado pronto"}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {single ? (
        failed ? (
          <button className={cls} onClick={() => processQueue()}>{content}</button>
        ) : (
          <Link href={`/diagnostico/${first.id}`} className={cls}>
            {pending > 0 && <span aria-hidden className="absolute left-0 top-0 h-[3px] w-2/3 animate-pulse bg-accent-bright" />}
            {content}
          </Link>
        )
      ) : (
        <button className={cls} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {content}
        </button>
      )}
      {!single && ready.length > 0 && null}
    </div>
  );
}

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="flex items-center gap-2 bg-warning-soft px-4 py-2 text-sm font-semibold text-warning">
      <WifiOff className="size-4 shrink-0" aria-hidden />
      Sem internet. A biblioteca funciona e as fotos vão pra fila.
    </div>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main id="conteudo" className={cx("mx-auto max-w-[var(--layout-content-max)] px-4 pb-safe pt-4 md:max-w-[var(--layout-wide-max)]", className)}>{children}</main>;
}

export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
