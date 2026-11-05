"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Eye } from "lucide-react";
import { StageTimeline } from "@/components/blocks";
import { AppBar, Page } from "@/components/shell";
import { Button, Card, EmptyState, Field, Skeleton, inputCls } from "@/components/ui";
import { getProfile, saveProfile, type Profile } from "@/lib/client/store";
import type { StageTip } from "@/lib/data/types";

export function PlanClient({ tips, names }: { tips: StageTip[]; names: Record<string, string> }) {
  const [prof, setProf] = useState<Profile | null>(null);
  const [date, setDate] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { const p = getProfile(); setProf(p); setDate(p.sowingDate ?? ""); }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { setErr("Informe a data"); return; }
    if (new Date(date) > new Date()) { setErr("A data não pode ser no futuro"); return; }
    setErr(""); setProf(saveProfile({ sowingDate: date }));
  };

  if (!prof) return (<><AppBar title="Plano da lavoura" back="/" /><Page><Skeleton className="h-40 w-full rounded-md" /></Page></>);
  const dap = prof.sowingDate ? Math.floor((Date.now() - new Date(prof.sowingDate).getTime()) / 86_400_000) : null;
  const idx = dap == null ? -1 : Math.max(0, tips.findIndex((t) => dap >= t.dayFrom && dap <= t.dayTo));
  const cur = idx >= 0 ? (dap! > tips.at(-1)!.dayTo ? tips.length - 1 : idx) : -1;

  return (
    <>
      <AppBar title="Plano da lavoura" back="/" />
      <Page>
        <form onSubmit={save} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end" noValidate>
          <Field id="sem" label="Data de semeadura" error={err} help="Os dias são contados a partir dela; as fases são aproximadas.">
            <input id="sem" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} aria-invalid={!!err} aria-describedby={err ? "sem-err" : "sem-help"} />
          </Field>
          <Button type="submit" variant="secondary">Salvar</Button>
        </form>

        {cur < 0 ? (
          <EmptyState icon={<CalendarDays className="size-8" />} title="Sem data de semeadura">Informe acima e mostramos a fase atual e o que monitorar.</EmptyState>
        ) : (
          <>
            <Card className="mt-5 p-4">
              <StageTimeline tips={tips} current={cur} />
              <p className="mt-4"><b className="text-ink">{dap} dias após a semeadura · {tips[cur].title}.</b> <span className="text-text-muted">{tips[cur].tip}</span></p>
            </Card>
            {tips[cur].watch.length > 0 && (
              <>
                <h3 className="mb-2 mt-6 flex items-center gap-2 text-lg font-bold"><Eye className="size-5 text-accent" aria-hidden />Monitorar agora</h3>
                <ul className="grid gap-2">{tips[cur].watch.map((s) => (
                  <li key={s}><Link href={`/biblioteca/soja/${s}`} className="flex min-h-12 items-center rounded-md border border-border bg-surface px-4 font-semibold text-ink hover:bg-surface-sunken">{names[s]}</Link></li>
                ))}</ul>
              </>
            )}
            <h3 className="mb-2 mt-6 text-lg font-bold">Todas as fases</h3>
            <ol className="grid gap-2">{tips.map((t, i) => (
              <li key={t.stage} className={i === cur ? "rounded-md border border-accent bg-accent-soft p-3" : "rounded-md border border-border bg-surface p-3"}>
                <p className="font-semibold text-ink">{t.stage} · {t.title} <span className="font-normal text-text-muted">({t.dayFrom}–{t.dayTo} dias)</span></p>
                <p className="text-sm text-text-muted">{t.tip}</p>
              </li>))}</ol>
          </>
        )}
      </Page>
    </>
  );
}
