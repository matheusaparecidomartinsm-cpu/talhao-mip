import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppBar, Page } from "@/components/shell";
import { getCrop, listProblems } from "@/lib/data";
import { ProblemList } from "./list";

type P = { params: Promise<{ cultura: string }> };
export async function generateStaticParams() { return [{ cultura: "soja" }]; }
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await getCrop((await params).cultura);
  return { title: c ? `Problemas da ${c.name.toLowerCase()}` : "Biblioteca" };
}

export default async function CropLibrary({ params }: P) {
  const { cultura } = await params;
  const crop = await getCrop(cultura);
  if (!crop || !crop.active) notFound();
  const problems = await listProblems(cultura);
  return (
    <>
      <AppBar title={crop.name} back="/biblioteca" />
      <Page>
        <h2 className="display text-2xl font-bold">Problemas da {crop.name.toLowerCase()}</h2>
        <p className="mt-1 text-sm text-text-muted">{problems.length} fichas · <span className="italic">{crop.scientificName}</span></p>
        <ProblemList problems={problems} />
      </Page>
    </>
  );
}
