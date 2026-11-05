import type { Metadata } from "next";
import { AppBar, Page } from "@/components/shell";
import { WeatherTable } from "@/components/blocks";
import { Card, Note } from "@/components/ui";
import { getWeather, sprayVerdict } from "@/lib/data";

export const metadata: Metadata = { title: "Clima" };

export default async function Weather() {
  const days = (await getWeather("default")).map((d) => ({ ...d, spray: sprayVerdict(d) }));
  const next = days.find((d) => d.spray.ok);
  return (
    <>
      <AppBar title="Clima" back="/" />
      <Page>
        <h2 className="display text-2xl font-bold">Previsão e janela de pulverização</h2>
        {next ? (
          <p className="mt-1 text-text-muted">Próxima janela boa: <b className="text-success">{days.indexOf(next) === 0 ? "hoje" : new Date(next.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric" })}</b>.</p>
        ) : <p className="mt-1 text-danger">Nenhum dia bom para pulverizar nos próximos 7 dias.</p>}
        <Card className="mt-4 p-3"><WeatherTable days={days} /></Card>
        <h3 className="mb-2 mt-6 text-lg font-bold">Detalhe por dia</h3>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Umidade e vento por dia</caption>
            <thead className="bg-surface-sunken text-left"><tr><th scope="col" className="p-3">Dia</th><th scope="col" className="p-3">Umidade</th><th scope="col" className="p-3">Vento</th><th scope="col" className="p-3">Chuva</th></tr></thead>
            <tbody>{days.map((d, i) => (
              <tr key={d.date} className="border-t border-border">
                <th scope="row" className="p-3 text-left font-semibold capitalize">{i === 0 ? "Hoje" : new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}</th>
                <td className="p-3">{d.humidity}%</td><td className="p-3">{d.windKmh} km/h</td><td className="p-3">{d.rainMm} mm</td>
              </tr>))}</tbody>
          </table>
        </Card>
        <div className="mt-4"><Note tone="info">Regra usada: evitar com chuva de 5 mm ou mais, vento acima de 15 km/h ou máxima acima de 32 °C. Dados de exemplo até ligarmos a previsão real.</Note></div>
      </Page>
    </>
  );
}
