import Link from "next/link";
import { Bug, ChevronDown, ChevronRight, ExternalLink, FlaskConical, ShieldCheck, Sprout } from "lucide-react";
import type { Problem, TreatmentKind } from "@/lib/data/types";
import { AgentBadge, LeafPhoto, Note, cx } from "./ui";

export function ProblemCard({ p, extra, compact }: { p: Problem; extra?: React.ReactNode; compact?: boolean }) {
  return (
    <Link
      href={`/biblioteca/soja/${p.slug}`}
      className="flex items-center gap-3 rounded-md p-3 hover:bg-surface-sunken"
    >
      <LeafPhoto hue={p.hue} label="" className={cx("shrink-0 rounded-sm", compact ? "size-12" : "size-16")} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{p.commonName}</span>
        {p.agentType !== "deficiencia" && <span className="block truncate text-sm italic text-text-muted">{p.scientificName}</span>}
        <span className="mt-1 flex items-center gap-2"><AgentBadge type={p.agentType} />{extra}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-text-subtle" aria-hidden />
    </Link>
  );
}

const KIND: Record<TreatmentKind, { label: string; Icon: typeof Sprout }> = {
  cultural: { label: "Controle cultural", Icon: Sprout },
  biologico: { label: "Controle biológico", Icon: Bug },
  quimico: { label: "Controle químico", Icon: FlaskConical },
};

export function TreatmentAccordion({ p }: { p: Problem }) {
  const groups = (["cultural", "biologico", "quimico"] as TreatmentKind[])
    .map((k) => ({ k, items: p.treatments.filter((t) => t.kind === k) }))
    .filter((g) => g.items.length);
  const hasChem = groups.some((g) => g.k === "quimico");
  return (
    <div>
      <div className="border-t border-border">
        {groups.map(({ k, items }, i) => {
          const { label, Icon } = KIND[k];
          return (
            <details key={k} open={i === 0} className="group border-b border-border">
              <summary className="flex min-h-14 cursor-pointer items-center gap-3 font-semibold text-ink">
                <Icon className="size-5 text-accent" aria-hidden />
                {label}
                <ChevronDown className="ml-auto size-5 text-text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="grid gap-3 pb-4 pl-8 text-sm text-text-muted">
                {items.map((t, j) => (
                  <div key={j}>
                    <p>{t.text}</p>
                    {t.activeIngredient && (
                      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-sm bg-surface-sunken p-3">
                        <dt className="font-semibold text-text">Grupos</dt><dd>{t.activeIngredient}</dd>
                        {t.moaGroup && (<><dt className="font-semibold text-text">Modo de ação</dt><dd>{t.moaGroup}</dd></>)}
                      </dl>
                    )}
                  </div>
                ))}
                {k === "quimico" && (
                  <a
                    href="https://agrofit.agricultura.gov.br/agrofit_cons/principal_agrofit_cons"
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 font-semibold text-accent underline underline-offset-2"
                  >
                    Consultar produtos registrados no Agrofit <ExternalLink className="size-4" aria-hidden />
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                )}
              </div>
            </details>
          );
        })}
        <details className="group border-b border-border">
          <summary className="flex min-h-14 cursor-pointer items-center gap-3 font-semibold text-ink">
            <ShieldCheck className="size-5 text-accent" aria-hidden />
            Prevenção
            <ChevronDown className="ml-auto size-5 text-text-muted transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="list-disc pb-4 pl-12 text-sm text-text-muted">
            {p.preventive.map((x) => <li key={x} className="mt-1">{x}</li>)}
          </ul>
        </details>
      </div>
      {hasChem && <div className="mt-3"><Note>Aplicação de defensivo exige receituário agronômico. O app mostra grupos químicos, não doses.</Note></div>}
    </div>
  );
}

export function ReviewNotice() {
  return <Note tone="info">Ficha em revisão pela equipe de Agronomia. Use como orientação inicial.</Note>;
}
