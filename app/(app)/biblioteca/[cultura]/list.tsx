"use client";
import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { ProblemCard } from "@/components/problem";
import { Card, EmptyState, cx } from "@/components/ui";
import { AGENT_LABEL, type AgentType, type Problem } from "@/lib/data/types";

export function ProblemList({ problems }: { problems: Problem[] }) {
  const [type, setType] = useState<AgentType | "todos">("todos");
  const present = useMemo(() => Array.from(new Set(problems.map((p) => p.agentType))), [problems]);
  const shown = type === "todos" ? problems : problems.filter((p) => p.agentType === type);
  const groups = useMemo(() => {
    const g = new Map<string, Problem[]>();
    for (const p of shown) { const L = p.commonName[0].toUpperCase(); g.set(L, [...(g.get(L) ?? []), p]); }
    return [...g.entries()];
  }, [shown]);
  const opts: (AgentType | "todos")[] = ["todos", ...present];

  return (
    <>
      <div role="radiogroup" aria-label="Filtrar por tipo" className="scroll-x -mx-4 mt-4 flex gap-2 px-4 pb-1">
        {opts.map((o) => (
          <button key={o} role="radio" aria-checked={type === o} onClick={() => setType(o)}
            className={cx("min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold",
              type === o ? "border-ink bg-ink text-text-inverse" : "border-border bg-surface text-text")}>
            {o === "todos" ? "Todos" : AGENT_LABEL[o]}
          </button>
        ))}
      </div>
      <Card className="mt-3 p-1">
        {shown.length === 0 ? (
          <EmptyState icon={<SearchX className="size-8" />} title="Nenhuma ficha desse tipo">Escolha outro filtro.</EmptyState>
        ) : groups.map(([letter, items]) => (
          <section key={letter} aria-label={`Letra ${letter}`}>
            <h3 className="px-3 pt-3 text-xs font-bold uppercase tracking-wider text-text-muted">{letter}</h3>
            <div className="md:grid md:grid-cols-2">{items.map((p) => <ProblemCard key={p.slug} p={p} />)}</div>
          </section>
        ))}
      </Card>
    </>
  );
}
