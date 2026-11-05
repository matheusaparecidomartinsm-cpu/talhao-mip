"use client";
import { useEffect, useState } from "react";
import { AppBar, Page } from "@/components/shell";
import { WeatherTable } from "@/components/blocks";
import { Card, Note } from "@/components/ui";
import { getProfile } from "@/lib/client/store";
import type { SprayVerdict, WeatherDay } from "@/lib/data/types";

type Day = WeatherDay & { spray: SprayVerdict };

export function WeatherClient({ sample }: { sample: Day[] }) {
  const [days, setDays] = useState(sample);
  const [isSample, setIsSample] = useState(true);
  const [mun, setMun] = useState<string>();
  useEffect(() => {
    const m = getProfile().municipio; setMun(m);
    if (!m) return;
    fetch(`/api/clima?m=${encodeURIComponent(m)}`).then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.days?.length) { setDays(j.days); setIsSample(j.sample); } }).catch(() => {});
  }, []);
  const next = days.find((d) => d.spray.ok);
  const label = (d: Day, i: number, opts: Intl.DateTimeFormatOptions) => i === 0 ? "hoje" : new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", opts);
  return (
    <>
      <AppBar title="Clima" back="/" />
      <Page>
        <h2 className="display text-2xl font-bold">Previsão e janela de pulverização</h2>
        {mun && <p className="text-sm text-text-muted">{mun}</p>}
        {next ? <p className="mt-1 text-text-muted">Próxima janela boa: <b className="text-success">{label(next, days.indexOf(next), { weekday: "long", day: "numeric" })}</b>.</p>
          : <p className="mt-1 text-danger">Nenhum dia bom para pulverizar nos próximos 7 dias.</p>}
        <Card className="mt-4 p-3"><WeatherTable days={days} /></Card>
        <h3 className="mb-2 mt-6 text-lg font-bold">Detalhe por dia</h3>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Umidade e vento por dia</caption>
            <thead className="bg-surface-sunken text-left"><tr><th scope="col" className="p-3">Dia</th><th scope="col" className="p-3">Umidade</th><th scope="col" className="p-3">Vento</th><th scope="col" className="p-3">Chuva</th></tr></thead>
            <tbody>{days.map((d, i) => (
              <tr key={d.date} className="border-t border-border">
                <th scope="row" className="p-3 text-left font-semibold capitalize" suppressHydrationWarning>{label(d, i, { weekday: "short", day: "2-digit" })}</th>
                <td className="p-3">{d.humidity}%</td><td className="p-3">{d.windKmh} km/h</td><td className="p-3">{d.rainMm} mm</td>
              </tr>))}</tbody>
          </table>
        </Card>
        <div className="mt-4"><Note tone="info">
          Regra usada: evitar com chuva de 5 mm ou mais, vento acima de 15 km/h ou máxima acima de 32 °C.
          {isSample ? " Dados de exemplo: a previsão real aparece quando o município estiver definido e o servidor ligado." : " Previsão: Open-Meteo, atualizada todo dia às 5h."}
        </Note></div>
      </Page>
    </>
  );
}
