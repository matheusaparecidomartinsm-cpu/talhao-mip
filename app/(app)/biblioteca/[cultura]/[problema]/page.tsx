import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppBar, Page } from "@/components/shell";
import { ProblemCard, ReviewNotice, TreatmentAccordion } from "@/components/problem";
import { AgentBadge, ButtonLink, LeafPhoto } from "@/components/ui";
import { getProblem, listProblems } from "@/lib/data";
import { ShareButton } from "./share";

type P = { params: Promise<{ cultura: string; problema: string }> };

export async function generateStaticParams() {
  return (await listProblems("soja")).map((p) => ({ cultura: "soja", problema: p.slug }));
}
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProblem((await params).problema);
  return { title: p ? `${p.commonName} na soja` : "Ficha" };
}

export default async function ProblemPage({ params }: P) {
  const { cultura, problema } = await params;
  const p = await getProblem(problema);
  if (!p || cultura !== "soja") notFound();
  const others = (await listProblems("soja")).filter((o) => o.slug !== p.slug).slice(0, 4);

  return (
    <>
      <AppBar title={p.commonName} back={`/biblioteca/${cultura}`} />
      <Page>
        <div className="md:grid md:grid-cols-[1fr_1.2fr] md:gap-8">
          <div>
            <LeafPhoto hue={p.hue} label={`Ilustração de ${p.commonName} em folha de soja`} className="aspect-[4/3] w-full rounded-md" />
            <p className="mt-1 text-xs text-text-subtle">Imagem ilustrativa. Fotos próprias de campo entram na próxima etapa.</p>
          </div>
          <div>
            <h2 className="display mt-4 text-2xl font-bold md:mt-0">{p.commonName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {p.agentType !== "deficiencia" && <span className="text-sm italic text-text-muted">{p.scientificName}</span>}
              <AgentBadge type={p.agentType} />
              <span className="text-xs text-text-muted">Fases: {p.stages.join(", ")}</span>
            </div>
            <div className="mt-3"><ReviewNotice /></div>

            <ul className="mt-4 grid gap-2">
              {p.summary.map((s) => (
                <li key={s} className="flex gap-2 text-md"><span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-accent-bright" />{s}</li>
              ))}
            </ul>

            <h3 className="mt-6 text-lg font-bold">Sintomas</h3>
            <p className="mt-1 text-text-muted">{p.symptoms}</p>
            <h3 className="mt-6 text-lg font-bold">Por que aparece</h3>
            <p className="mt-1 text-text-muted">{p.cause}</p>

            <h3 className="mb-1 mt-6 text-lg font-bold">Manejo</h3>
            <TreatmentAccordion p={p} />

            <div className="mt-5 flex flex-wrap gap-2">
              <ShareButton title={p.commonName} />
              <ButtonLink href={`/comunidade/nova?problema=${p.slug}`} variant="ghost" size="sm">Perguntar à comunidade</ButtonLink>
            </div>

            <details className="mt-6 text-xs text-text-muted">
              <summary className="cursor-pointer font-semibold">Fontes</summary>
              <ul className="mt-1 list-disc pl-5">{p.sources.map((s) => <li key={s}>{s}</li>)}</ul>
            </details>
          </div>
        </div>

        <h3 className="mb-1 mt-8 text-lg font-bold">Outros problemas da soja</h3>
        <div className="grid md:grid-cols-2">{others.map((o) => <ProblemCard key={o.slug} p={o} compact />)}</div>
      </Page>
    </>
  );
}
