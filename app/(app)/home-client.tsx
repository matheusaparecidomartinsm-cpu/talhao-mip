"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Calculator, Camera, ChevronRight, CloudSun, History, MapPin, Sprout } from "lucide-react";
import { AppBar, Page } from "@/components/shell";
import { AlertRow } from "@/components/blocks";
import { ButtonLink, Card, EmptyState, SectionTitle, Skeleton } from "@/components/ui";
import { WeatherIcon } from "@/components/blocks";
import { getProfile, type Profile } from "@/lib/client/store";
import type { DiseaseAlert, SprayVerdict, StageTip, WeatherDay } from "@/lib/data/types";

type Props = {
  alerts: DiseaseAlert[];
  weather: (WeatherDay & { spray: SprayVerdict })[];
  tips: StageTip[];
  problems: Record<string, { name: string; hue: number }>;
};

export function HomeClient({ alerts, weather: sampleWeather, tips, problems }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weather, setWeather] = useState(sampleWeather);
  useEffect(() => {
    const p = getProfile();
    if (!p.onboarded) { location.replace("/boas-vindas"); return; }
    setProfile(p);
    if (p.municipio) fetch(`/api/clima?m=${encodeURIComponent(p.municipio)}`).then((r) => r.ok ? r.json() : null).then((j) => j?.days?.length && setWeather(j.days)).catch(() => {});
  }, []);

  if (!profile) {
    return (<><AppBar title="Glyma" /><Page><Skeleton className="h-32 w-full rounded-md" /><Skeleton className="mt-4 h-20 w-full rounded-md" /></Page></>);
  }

  const mine = profile.municipio ? alerts.filter((a) => a.municipio === profile.municipio) : [];
  const today = weather[0];
  const dap = profile.sowingDate ? Math.floor((Date.now() - new Date(profile.sowingDate).getTime()) / 86_400_000) : null;
  const tip = dap != null ? tips.find((t) => dap >= t.dayFrom && dap <= t.dayTo) ?? tips[tips.length - 1] : null;

  return (
    <>
      <AppBar title="Glyma" />
      <Page>
        <p className="text-sm text-text-muted">{profile.name ? `Olá, ${profile.name}` : "Olá"}{profile.municipio && <> · <MapPin className="inline size-3.5" aria-hidden /> {profile.municipio}</>}</p>
        <h2 className="display mt-1 text-2xl font-bold">O que está acontecendo na sua soja?</h2>

        <Card className="mt-4 flex items-center gap-4 bg-accent-soft p-4 shadow-none">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">Tire uma foto da folha</p>
            <p className="text-sm text-text-muted">Em segundos: o mais provável, quanta certeza temos e o que fazer.</p>
          </div>
          <ButtonLink href="/camera" aria-label="Diagnosticar com foto"><Camera className="size-5" aria-hidden /><span className="hidden sm:inline">Diagnosticar</span></ButtonLink>
        </Card>

        <SectionTitle action={<Link href="/alertas" className="text-sm font-semibold text-accent">Ver todos</Link>}>Alertas da região</SectionTitle>
        <Card className="overflow-hidden">
          {!profile.municipio ? (
            <EmptyState icon={<MapPin className="size-8" />} title="Informe seu município" action={<ButtonLink href="/perfil" size="sm" variant="secondary">Escolher município</ButtonLink>}>
              Assim avisamos quando uma doença estiver com risco alto perto de você.
            </EmptyState>
          ) : mine.length ? mine.map((a) => <AlertRow key={a.id} a={a} name={problems[a.problemSlug]?.name ?? a.problemSlug} unread={a.risk === "alto"} />)
            : <EmptyState icon={<CloudSun className="size-8" />} title="Nenhum alerta pra sua região">Olhamos o clima e os casos da região todo dia de manhã.</EmptyState>}
        </Card>

        <SectionTitle action={<Link href="/clima" className="text-sm font-semibold text-accent">Previsão</Link>}>Hoje</SectionTitle>
        <Link href="/clima" className="flex items-center gap-4 rounded-md bg-surface p-4 shadow-card hover:bg-surface-sunken">
          <WeatherIcon icon={today.icon} className="size-10 text-info" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{today.tMin}° a {today.tMax}° · {today.rainMm} mm</p>
            <p className={today.spray.ok ? "text-sm font-semibold text-success" : "text-sm font-semibold text-danger"}>
              {today.spray.ok ? "Bom para pulverizar" : `Evite pulverizar: ${today.spray.reason}`}
            </p>
          </div>
          <ChevronRight className="size-5 text-text-subtle" aria-hidden />
        </Link>

        <SectionTitle>Sua lavoura</SectionTitle>
        <Link href="/plano" className="flex items-center gap-4 rounded-md bg-surface p-4 shadow-card hover:bg-surface-sunken">
          <Sprout className="size-8 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            {tip ? (<><p className="font-bold text-ink">{tip.stage} · {dap} dias após a semeadura</p><p className="text-sm text-text-muted">{tip.tip}</p></>)
              : (<><p className="font-bold text-ink">Informe a data de semeadura</p><p className="text-sm text-text-muted">Mostramos o que monitorar em cada fase.</p></>)}
          </div>
          <ChevronRight className="size-5 shrink-0 text-text-subtle" aria-hidden />
        </Link>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/calculadora" className="flex min-h-20 items-center gap-3 rounded-md bg-surface p-4 font-semibold text-ink shadow-card hover:bg-surface-sunken"><Calculator className="size-6 text-accent" aria-hidden />Calcular adubo</Link>
          <Link href="/historico" className="flex min-h-20 items-center gap-3 rounded-md bg-surface p-4 font-semibold text-ink shadow-card hover:bg-surface-sunken"><History className="size-6 text-accent" aria-hidden />Meus diagnósticos</Link>
        </div>
      </Page>
    </>
  );
}
