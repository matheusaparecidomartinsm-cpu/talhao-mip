"use client";
import { useEffect, useState } from "react";
import { AppBar, Page } from "@/components/shell";
import { Card, Field, Note, inputCls } from "@/components/ui";
import { getProfile } from "@/lib/client/store";
import type { FertilizerRule } from "@/lib/data/types";

const UNITS = { ha: { label: "hectares", f: 1 }, alq: { label: "alqueires paranaenses", f: 2.42 }, m2: { label: "m²", f: 0.0001 } } as const;
type U = keyof typeof UNITS;
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export function Calculator({ rules }: { rules: FertilizerRule[] }) {
  const [raw, setRaw] = useState("");
  const [unit, setUnit] = useState<U>("ha");
  useEffect(() => { const a = getProfile().areaHa; if (a) setRaw(String(a).replace(".", ",")); }, []);
  const value = Number(raw.replace(/\./g, "").replace(",", "."));
  const invalid = raw !== "" && (!isFinite(value) || value <= 0);
  const ha = !invalid && raw ? value * UNITS[unit].f : 0;

  return (
    <>
      <AppBar title="Calculadora de adubo" back="/" />
      <Page>
        <h2 className="display text-2xl font-bold">Quanto de fósforo e potássio?</h2>
        <p className="mt-1 text-text-muted">Estimativa de manutenção para soja. O ideal é partir da análise de solo.</p>
        <div className="mt-4">
          <Field id="area" label="Área" error={invalid ? "Informe uma área maior que zero" : undefined} help="Aceita vírgula. Ex.: 12,5">
            <div className="flex">
              <input id="area" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="0"
                className={`${inputCls} min-w-0 flex-1 rounded-r-none`} aria-invalid={invalid} aria-describedby={invalid ? "area-err" : "area-help"} />
              <select aria-label="Unidade" value={unit} onChange={(e) => setUnit(e.target.value as U)}
                className="h-12 rounded-r-md border border-l-0 border-border-input bg-surface-sunken px-3 font-semibold">
                <option value="ha">ha</option><option value="alq">alqueire</option><option value="m2">m²</option>
              </select>
            </div>
          </Field>
        </div>
        <Card className="mt-5 overflow-hidden" aria-live="polite">
          <table className="w-full text-sm">
            <caption className="sr-only">Quantidade estimada por nutriente</caption>
            <thead className="bg-surface-sunken text-left"><tr><th scope="col" className="p-3">Nutriente</th><th scope="col" className="p-3">Por hectare</th><th scope="col" className="p-3">Total</th></tr></thead>
            <tbody>{rules.map((r) => (
              <tr key={r.nutrient} className="border-t border-border">
                <th scope="row" className="p-3 text-left"><b className="text-ink">{r.nutrient}</b><span className="block text-xs font-normal text-text-muted">{r.note}</span></th>
                <td className="p-3">{r.kgHaMin}–{r.kgHaMax} kg</td>
                <td className="p-3 font-bold text-ink">{ha ? `${fmt(r.kgHaMin * ha)}–${fmt(r.kgHaMax * ha)} kg` : "—"}</td>
              </tr>))}</tbody>
          </table>
        </Card>
        {ha > 0 && unit !== "ha" && <p className="mt-2 text-sm text-text-muted">{raw} {UNITS[unit].label} = {ha.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha</p>}
        <div className="mt-4"><Note>Faixas de referência para orientar. Ajuste com a análise de solo e a recomendação de um agrônomo.</Note></div>
      </Page>
    </>
  );
}
