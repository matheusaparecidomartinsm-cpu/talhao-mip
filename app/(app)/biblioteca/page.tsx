import Link from "next/link";
import type { Metadata } from "next";
import { Leaf, Lock } from "lucide-react";
import { AppBar, Page } from "@/components/shell";
import { listCrops } from "@/lib/data";
import { LibrarySearch } from "./search";

export const metadata: Metadata = { title: "Biblioteca" };

export default async function Library() {
  const crops = await listCrops();
  return (
    <>
      <AppBar title="Biblioteca" />
      <Page>
        <h2 className="display text-2xl font-bold">Pragas, doenças e deficiências</h2>
        <p className="mt-1 text-text-muted">Escolha a cultura ou procure pelo nome. Funciona sem internet depois da primeira visita.</p>
        <div className="mt-4"><LibrarySearch /></div>
        <h3 className="mb-2 mt-6 text-lg font-bold">Culturas</h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {crops.map((c) => (
            <li key={c.slug}>
              {c.active ? (
                <Link href={`/biblioteca/${c.slug}`} className="grid min-h-28 place-items-center gap-1 rounded-lg border border-border bg-surface p-3 text-center font-semibold text-ink hover:border-accent hover:bg-accent-soft">
                  <Leaf className="size-8 text-accent" aria-hidden />{c.name}
                </Link>
              ) : (
                <div aria-disabled="true" className="grid min-h-28 place-items-center gap-1 rounded-lg border border-dashed border-border bg-surface-sunken p-3 text-center font-semibold text-text-muted">
                  <Lock className="size-6" aria-hidden />{c.name}<span className="text-xs font-normal">Em breve</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Page>
    </>
  );
}
