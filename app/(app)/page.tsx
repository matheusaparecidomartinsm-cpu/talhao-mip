import { getWeather, listAlerts, listStageTips, sprayVerdict } from "@/lib/data";
import { PROBLEMS } from "@/lib/data/seed-problems";
import { HomeClient } from "./home-client";

export default async function Home() {
  const [alerts, weather, tips] = await Promise.all([listAlerts(), getWeather("default"), listStageTips()]);
  const problems = Object.fromEntries(PROBLEMS.map((p) => [p.slug, { name: p.commonName, hue: p.hue }]));
  return <HomeClient alerts={alerts} weather={weather.map((d) => ({ ...d, spray: sprayVerdict(d) }))} tips={tips} problems={problems} />;
}
