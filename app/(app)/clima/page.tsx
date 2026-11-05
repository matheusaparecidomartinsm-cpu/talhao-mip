import type { Metadata } from "next";
import { getWeather, sprayVerdict } from "@/lib/data";
import { WeatherClient } from "./client";

export const metadata: Metadata = { title: "Clima" };

export default async function Weather() {
  const days = (await getWeather("default")).map((d) => ({ ...d, spray: sprayVerdict(d) }));
  return <WeatherClient sample={days} />;
}
