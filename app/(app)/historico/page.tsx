"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { AppBar, Page } from "@/components/shell";
import { AgentBadge, ButtonLink, Card, EmptyState, Skeleton, confidenceLabel, relTime } from "@/components/ui";
import { listDiagnoses, removeDiagnosis } from "@/lib/client/store";
import { problemBySlug } from "@/lib/data/seed-problems";
import type { Diagnosis } from "@/lib/data/types";

type Row = Diagnosis & { url: string };
const STATUS: Record<string, string> = { queued: "Na fila", pending: "Analisando", failed: "Falhou", not_identified: "Não identificado", bad_image: "Foto ruim", not_plant: "Sem planta na foto", wrong_crop: "Outra cultura" };

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    document.title = "Meus diagnósticos · Glyma";
    const urls: string[] = [];
    listDiagnoses().then((ds) => setRows(ds.map((d) => { const url = URL.createObjectURL(d.image); urls.push(url); return { ...d, url }; })));
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Apagar este diagnóstico do aparelho?")) return;
    await removeDiagnosis(id); setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  };

  return (
    <>
      <AppBar title="Meus diagnósticos" back="/perfil" />
      <Page>
        {rows === null ? <div className="grid gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}</div>
          : rows.length === 0 ? (
            <EmptyState icon={<History className="size-8" />} title="Seus diagnósticos aparecem aqui" action={<ButtonLink href="/camera">Fazer o primeiro</ButtonLink>}>
              Ficam guardados neste aparelho, com a foto e o resultado.
            </EmptyState>
          ) : (
            <Card className="overflow-hidden">
              <ul>{rows.map((d) => {
                const p = d.candidates[0] && problemBySlug(d.candidates[0].problemSlug);
                return (
                  <li key={d.id} className="flex items-center gap-2 border-b border-border pr-2 last:border-b-0">
                    <Link href={`/diagnostico/${d.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3 hover:bg-surface-sunken">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.url} alt="" className="size-14 shrink-0 rounded-sm object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{p ? p.commonName : STATUS[d.status] ?? "Resultado"}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          {p && <AgentBadge type={p.agentType} />}
                          {p && `${confidenceLabel(d.candidates[0].probability)} · `}<time suppressHydrationWarning dateTime={d.capturedAt}>{relTime(d.capturedAt)}</time>
                          {d.feedback && <span>{d.feedback === "correct" ? "· você confirmou" : "· você marcou como errado"}</span>}
                        </span>
                      </span>
                    </Link>
                    <button onClick={() => remove(d.id)} aria-label={`Apagar diagnóstico ${p?.commonName ?? ""}`} className="grid size-12 shrink-0 place-items-center rounded-full text-text-muted hover:bg-danger-soft hover:text-danger">
                      <Trash2 className="size-5" aria-hidden />
                    </button>
                  </li>
                );
              })}</ul>
            </Card>
          )}
      </Page>
    </>
  );
}
