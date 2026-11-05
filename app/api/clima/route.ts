import { NextResponse } from "next/server";
import { z } from "zod";
import { getWeatherInfo, sprayVerdict } from "@/lib/data";
import { MUNICIPIOS } from "@/lib/data/seed";

export async function GET(req: Request) {
  const m = z.string().max(80).safeParse(new URL(req.url).searchParams.get("m") ?? "");
  if (!m.success || !MUNICIPIOS.some((x) => x.nome === m.data)) return NextResponse.json({ error: "Município desconhecido" }, { status: 400 });
  const { days, sample } = await getWeatherInfo(m.data);
  return NextResponse.json({ sample, days: days.map((d) => ({ ...d, spray: sprayVerdict(d) })) },
    { headers: { "cache-control": "public, max-age=600, stale-while-revalidate=3600" } });
}
