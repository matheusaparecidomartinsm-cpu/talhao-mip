import type { Metadata } from "next";
import { listAlerts } from "@/lib/data";
import { PROBLEMS } from "@/lib/data/seed-problems";
import { AlertsClient } from "./client";

export const metadata: Metadata = { title: "Alertas" };
export default async function Alerts() {
  const alerts = await listAlerts();
  const names = Object.fromEntries(PROBLEMS.map((p) => [p.slug, { name: p.commonName, hue: p.hue }]));
  return <AlertsClient alerts={alerts} names={names} />;
}
