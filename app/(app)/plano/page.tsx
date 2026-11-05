import type { Metadata } from "next";
import { listStageTips } from "@/lib/data";
import { PROBLEMS } from "@/lib/data/seed-problems";
import { PlanClient } from "./client";

export const metadata: Metadata = { title: "Plano da lavoura" };
export default async function Plan() {
  const tips = await listStageTips();
  const names = Object.fromEntries(PROBLEMS.map((p) => [p.slug, p.commonName]));
  return <PlanClient tips={tips} names={names} />;
}
