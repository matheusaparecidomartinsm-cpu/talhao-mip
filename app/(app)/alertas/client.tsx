"use client";
import { useEffect, useState } from "react";
import { BellOff, CloudSun, MapPin, TriangleAlert } from "lucide-react";
import { AlertRow } from "@/components/blocks";
import { AppBar, Page } from "@/components/shell";
import { ButtonLink, Card, EmptyState, LeafPhoto, Skeleton, cx } from "@/components/ui";
import { getProfile, type Profile } from "@/lib/client/store";
import type { DiseaseAlert } from "@/lib/data/types";

export function AlertsClient({ alerts, names }: { alerts: DiseaseAlert[]; names: Record<string, { name: string; hue: number }> }) {
  const [prof, setProf] = useState<Profile | null>(null);
  useEffect(() => setProf(getProfile()), []);
  const mine = prof?.municipio ? alerts.filter((a) => a.municipio === prof.municipio) : [];
  const top = mine.find((a) => a.risk === "alto");

  return (
    <>
      <AppBar title="Alertas" back="/" alerts={false} />
      <Page>
        {!prof ? <Skeleton className="h-40 w-full rounded-md" /> : !prof.municipio ? (
          <EmptyState icon={<MapPin className="size-8" />} title="Sem município definido" action={<ButtonLink href="/perfil">Escolher município</ButtonLink>}>
            Os alertas são calculados por município, com o clima e os casos da região.
          </EmptyState>
        ) : (
          <>
            <h2 className="display text-2xl font-bold">Risco em {prof.municipio}</h2>
            <p className="mt-1 text-sm text-text-muted">Atualizado todo dia de manhã com a previsão do tempo e os diagnósticos confirmados na região.</p>
            {!prof.notifyAlerts && (
              <p className="mt-3 flex items-center gap-2 rounded-sm bg-surface-sunken px-3 py-2 text-sm text-text-muted"><BellOff className="size-4" aria-hidden />Avisos no celular desligados. Ligue no perfil.</p>
            )}
            {top && (
              <div id={top.id} className="mt-4 rounded-md border border-border-strong bg-surface p-4 shadow-pop">
                <h3 className="flex items-center gap-2 text-lg font-bold text-danger"><TriangleAlert className="size-5" aria-hidden />Risco alto na sua região</h3>
                <p className="mt-2 text-text-muted">{top.reason}. Vale vistoriar a lavoura nos próximos dias.</p>
                <div className="mt-3 flex items-center gap-2 rounded-sm bg-surface-sunken p-1.5 font-semibold text-ink">
                  <LeafPhoto hue={names[top.problemSlug]?.hue ?? 100} label="" className="size-10 rounded-sm" />{names[top.problemSlug]?.name}
                </div>
                <div className="mt-3 flex gap-2">
                  <ButtonLink href={`/biblioteca/soja/${top.problemSlug}`} size="sm">Ver ficha</ButtonLink>
                  <ButtonLink href="/clima" size="sm" variant="ghost">Ver clima</ButtonLink>
                </div>
              </div>
            )}
            <h3 className="mb-2 mt-6 text-lg font-bold">Todos os alertas</h3>
            <Card className="overflow-hidden">
              {mine.length ? mine.map((a) => (
                <div key={a.id} id={a.id === top?.id ? undefined : a.id} className={cx()}>
                  <AlertRow a={a} name={names[a.problemSlug]?.name ?? a.problemSlug} unread={a.risk === "alto"} />
                </div>
              )) : <EmptyState icon={<CloudSun className="size-8" />} title="Nenhum alerta pra sua região">Olhamos o clima e os casos da região todo dia de manhã.</EmptyState>}
            </Card>
          </>
        )}
      </Page>
    </>
  );
}
