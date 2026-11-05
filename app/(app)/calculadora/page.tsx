import type { Metadata } from "next";
import { listFertilizerRules } from "@/lib/data";
import { Calculator } from "./client";
export const metadata: Metadata = { title: "Calculadora de adubo" };
export default async function Page_() { return <Calculator rules={await listFertilizerRules()} />; }
