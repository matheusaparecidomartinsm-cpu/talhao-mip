"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CircleAlert, Leaf, Loader, ScanSearch, ThumbsDown, ThumbsUp, WifiOff } from "lucide-react";
import { AppBar, Page } from "@/components/shell";
import { TreatmentAccordion, ReviewNotice } from "@/components/problem";
import { AgentBadge, Button, ButtonLink, ConfidenceMeter, EmptyState, LeafPhoto, Note, Skeleton, confidenceLabel, cx } from "@/components/ui";
import { getDiagnosis, processQueue, QUEUE_EVENT, updateDiagnosis } from "@/lib/client/store";
import { problemBySlug } from "@/lib/data/seed-problems";
import type { Diagnosis } from "@/lib/data/types";

type D = Diagnosis & { image: Blob; error?: string };

const TIPS = ["Uma folha só, bem de perto", "Luz do dia, sem sombra em cima", "Mostre o lado com o sintoma"];

export default function DiagnosisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<D | null | undefined>(undefined);
  const [url, setUrl] = useState<string>();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    let u: string | undefined;
    const load = async () => {
      const x = (await getDiagnosis(id)) as D | undefined;
      setD(x ?? null);
      if (x && !u) { u = URL.createObjectURL(x.image); setUrl(u); }
    };
    load();
    window.addEventListener(QUEUE_EVENT, load);
    return () => { window.removeEventListener(QUEUE_EVENT, load); if (u) URL.revokeObjectURL(u); };
  }, [id]);

  if (d === undefined) {
    return (
      <>
        <AppBar title="Resultado" back="/" />
        <Page><Skeleton className="aspect-[4/3] w-full rounded-md" /><Skeleton className="mt-4 h-4 w-1/3" /><Skeleton className="mt-2 h-8 w-2/3" /></Page>
      </>
    );
  }
  if (d === null) {
    return (
      <>
        <AppBar title="Resultado" back="/" />
        <Page>
          <EmptyState icon={<ScanSearch className="size-8" />} title="Diagnóstico não encontrado"
            action={<ButtonLink href="/camera">Fazer um diagnóstico</ButtonLink>}>
            Ele pode ter sido feito em outro aparelho ou apagado do histórico.
          </EmptyState>
        </Page>
      </>
    );
  }

  const photo = url && (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Sua foto" className="aspect-[4/3] w-full rounded-md object-cover" />
  );

  if (d.status === "pending" || d.status === "queued" || d.status === "failed") {
    const failed = d.status === "failed";
    return (
      <>
        <AppBar title="Resultado" back="/" />
        <Page>
          {photo}
          <div role="status" className="mt-6 text-center">
            {d.status === "pending" ? <Loader className="mx-auto size-8 animate-spin text-accent motion-reduce:animate-none" aria-hidden />
              : failed ? <CircleAlert className="mx-auto size-8 text-danger" aria-hidden />
              : <WifiOff className="mx-auto size-8 text-warning" aria-hidden />}
            <p className="mt-2 font-bold text-ink">
              {d.status === "pending" ? "Analisando…" : failed ? "Não conseguimos analisar agora" : "Na fila, esperando sinal"}
            </p>
            {failed && d.error && <p className="mt-1 text-sm text-text-muted">{d.error}</p>}
            {failed && <Button className="mt-4" onClick={() => { updateDiagnosis(d.id, { status: "queued" }).then(processQueue); }}>Tentar de novo</Button>}
          </div>
        </Page>
      </>
    );
  }

  if (d.status !== "ok" || !d.candidates.length) {
    const reason = {
      bad_image: "A foto ficou escura ou sem foco.",
      not_plant: "Não encontramos uma planta na foto.",
      wrong_crop: "Por enquanto o Talhão só reconhece soja.",
      not_identified: "Os sintomas não bateram com nenhum problema da nossa biblioteca com segurança.",
      healthy: "A planta parece sadia: não vimos sintomas na foto. Se algo te preocupa, tire uma foto mais de perto.",
    }[d.status as string] ?? "";
    return (
      <>
        <AppBar title="Resultado" back="/" />
        <Page>
          {photo}
          <EmptyState tone="warning" icon={<ScanSearch className="size-8" />} title={d.status === "healthy" ? "Nenhum problema à vista" : "Não conseguimos identificar"}
            action={<>
              <ButtonLink href="/camera">Tirar outra foto</ButtonLink>
              <ButtonLink href={`/comunidade/nova?diagnostico=${d.id}`} variant="secondary">Perguntar à comunidade</ButtonLink>
              <ButtonLink href="/biblioteca/soja" variant="ghost">Ver a biblioteca</ButtonLink>
            </>}>
            <p>{reason}</p>
            <ul className="mx-auto mt-3 w-fit list-disc pl-5 text-left">{TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
          </EmptyState>
        </Page>
      </>
    );
  }

  const [top, ...rest] = d.candidates;
  const p = problemBySlug(top.problemSlug)!;
  const slides = [{ key: "user", label: "Sua foto" }, { key: "ex1", label: `Exemplo: ${p.commonName}` }, { key: "ex2", label: `Exemplo: ${p.commonName}, detalhe` }];

  return (
    <>
      <AppBar title="Resultado" back="/" />
      <Page>
        <div className="md:grid md:grid-cols-[1fr_1.2fr] md:gap-8">
          <section aria-label="Fotos">
            <div
              className="scroll-x flex gap-2"
              onScroll={(e) => { const el = e.currentTarget; setSlide(Math.round(el.scrollLeft / (el.clientWidth * 0.86))); }}
            >
              {slides.map((s, i) => (
                <div key={s.key} className="w-[86%] shrink-0 snap-start">
                  {i === 0 ? photo : <LeafPhoto hue={p.hue + i * 6} label={s.label} className="aspect-[4/3] w-full rounded-md" />}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {slides.map((s, i) => (
                <span key={s.key} aria-hidden className={cx("h-2 rounded-full transition-all", i === slide ? "w-5 bg-ink" : "w-2 bg-border-strong")} />
              ))}
            </div>
          </section>

          <section aria-labelledby="res-nome">
            <p className="mt-4 text-sm text-text-muted md:mt-0">{confidenceLabel(top.probability)} · {Math.round(top.probability * 100)}%</p>
            <h2 id="res-nome" className="display text-2xl font-bold">{p.commonName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {p.agentType !== "deficiencia" && <span className="text-sm italic text-text-muted">{p.scientificName}</span>}
              <AgentBadge type={p.agentType} />
            </div>
            <div className="mt-2"><ConfidenceMeter value={top.probability} /></div>
            <p className="mt-3 text-text-muted">{p.summary[0]}. {p.summary[1]}.</p>
            <p className="mt-2 text-sm text-text-muted"><span className="font-semibold text-text">O que vimos: </span>{top.reasoning}</p>

            <div className="mt-3 grid gap-2">
              {d.model?.startsWith("demo") && <Note>Modo demonstração: este resultado ainda não vem de um modelo treinado.</Note>}
              <ReviewNotice />
            </div>

            <h3 className="mb-1 mt-6 text-lg font-bold">Manejo</h3>
            <TreatmentAccordion p={p} />
            <ButtonLink href={`/biblioteca/soja/${p.slug}`} variant="secondary" className="mt-4 w-full">
              <Leaf className="size-5" aria-hidden /> Ver ficha completa
            </ButtonLink>

            {rest.length > 0 && (
              <>
                <h3 className="mt-8 text-lg font-bold">Também pode ser</h3>
                <ul className="mt-2 grid gap-2">
                  {rest.map((c) => {
                    const o = problemBySlug(c.problemSlug);
                    if (!o) return null;
                    return (
                      <li key={c.problemSlug}>
                        <Link href={`/biblioteca/soja/${o.slug}`} className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-surface-sunken">
                          <LeafPhoto hue={o.hue} label="" className="size-12 shrink-0 rounded-sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-ink">{o.commonName}</span>
                            <span className="mt-1 flex items-center gap-2 text-xs text-text-muted"><AgentBadge type={o.agentType} />{confidenceLabel(c.probability)} · {Math.round(c.probability * 100)}%</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <Feedback d={d} onChange={(f) => setD({ ...d, feedback: f })} />
          </section>
        </div>
      </Page>
    </>
  );
}

function Feedback({ d, onChange }: { d: D; onChange: (f: "correct" | "wrong") => void }) {
  const set = (f: "correct" | "wrong") => { updateDiagnosis(d.id, { feedback: f }); onChange(f); };
  return (
    <div className="mt-8 rounded-md bg-surface-sunken p-4">
      <p className="font-semibold text-ink">O resultado bateu com o que você vê na lavoura?</p>
      <div className="mt-3 flex gap-2" role="group" aria-label="Avaliar resultado">
        <button aria-pressed={d.feedback === "correct"} onClick={() => set("correct")}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 font-semibold aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent">
          <ThumbsUp className="size-5" aria-hidden />Bateu
        </button>
        <button aria-pressed={d.feedback === "wrong"} onClick={() => set("wrong")}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 font-semibold aria-pressed:border-danger aria-pressed:bg-danger-soft aria-pressed:text-danger">
          <ThumbsDown className="size-5" aria-hidden />Não bateu
        </button>
      </div>
      {d.feedback === "wrong" && (
        <p className="mt-3 text-sm text-text-muted">
          Obrigado. <Link className="font-semibold text-accent underline" href={`/comunidade/nova?diagnostico=${d.id}`}>Pergunte à comunidade</Link> com a mesma foto.
        </p>
      )}
      {d.feedback === "correct" && <p className="mt-3 text-sm text-success" role="status">Obrigado! Isso ajuda a medir a precisão.</p>}
    </div>
  );
}
