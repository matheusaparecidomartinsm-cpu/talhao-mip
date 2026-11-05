"use client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ProblemCard } from "@/components/problem";
import { inputCls } from "@/components/ui";
import { PROBLEMS } from "@/lib/data/seed-problems";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function LibrarySearch() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return null;
    return PROBLEMS.filter((p) => norm(`${p.commonName} ${p.scientificName} ${p.symptoms}`).includes(n));
  }, [q]);
  return (
    <div role="search">
      <label htmlFor="busca" className="sr-only">Procurar na biblioteca</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" aria-hidden />
        <input id="busca" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Ex.: ferrugem, percevejo, mancha" className={`${inputCls} pl-10`} autoComplete="off" />
      </div>
      {results && (
        <div className="mt-2 rounded-md bg-surface shadow-card" aria-live="polite">
          {results.length ? results.map((p) => <ProblemCard key={p.slug} p={p} compact />)
            : <p className="p-4 text-sm text-text-muted">Nada encontrado para “{q}”. Tente outro nome ou descreva o sintoma.</p>}
        </div>
      )}
    </div>
  );
}
