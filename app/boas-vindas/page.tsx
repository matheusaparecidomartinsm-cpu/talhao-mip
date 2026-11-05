"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Camera, Check, Leaf, Lock, MapPin, Sprout } from "lucide-react";
import { Button, cx, inputCls } from "@/components/ui";
import { saveProfile } from "@/lib/client/store";
import { MUNICIPIOS } from "@/lib/data/seed";

const CROPS = [
  { slug: "soja", name: "Soja", active: true },
  { slug: "milho", name: "Milho", active: false },
  { slug: "trigo", name: "Trigo", active: false },
];

export default function Welcome() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [crops, setCrops] = useState<string[]>(["soja"]);
  const [municipio, setMunicipio] = useState("");
  const [consent, setConsent] = useState(true);

  useEffect(() => { document.title = "Boas-vindas · Talhão"; }, []);

  const finish = () => {
    saveProfile({ onboarded: true, crops, municipio: municipio || undefined, notifyAlerts: consent });
    router.replace("/");
  };

  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh max-w-[var(--layout-content-max)] flex-col px-5 pb-6 pt-8">
      <div className="flex items-center gap-2 text-xl font-extrabold text-ink display" aria-label="Talhão">
        <Leaf className="size-7 text-accent-bright" aria-hidden />Talhão
      </div>
      <p className="mt-1 text-xs text-text-muted" aria-live="polite">Passo {step + 1} de 3</p>
      <div className="mt-2 flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => <span key={i} className={cx("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-border")} />)}
      </div>

      {step === 0 && (
        <section className="mt-8 flex flex-1 flex-col" aria-labelledby="t0">
          <h1 id="t0" className="display text-3xl font-extrabold">Descubra o que está atacando sua soja</h1>
          <ul className="mt-6 grid gap-4">
            {[
              { I: Camera, t: "Foto da folha", d: "Aponte a câmera e veja o problema mais provável em segundos." },
              { I: Sprout, t: "Manejo integrado", d: "Controle cultural, biológico e químico, com nível de ação antes de aplicar." },
              { I: Bell, t: "Alerta da região", d: "Avisamos quando o clima favorece uma doença perto de você." },
            ].map(({ I, t, d }) => (
              <li key={t} className="flex gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I className="size-6" aria-hidden /></span>
                <span><span className="block font-bold text-ink">{t}</span><span className="text-sm text-text-muted">{d}</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8"><Button size="lg" onClick={() => setStep(1)}>Começar</Button>
            <p className="mt-3 text-center text-xs text-text-muted">Sem cadastro. Você pode criar conta depois para salvar na nuvem.</p></div>
        </section>
      )}

      {step === 1 && (
        <section className="mt-8 flex flex-1 flex-col" aria-labelledby="t1">
          <h1 id="t1" className="display text-2xl font-extrabold">Quais culturas você acompanha?</h1>
          <p className="mt-1 text-sm text-text-muted">Por enquanto o diagnóstico funciona para soja. As outras chegam depois.</p>
          <div role="group" aria-label="Culturas" className="mt-5 grid grid-cols-3 gap-3">
            {CROPS.map((c) => {
              const on = crops.includes(c.slug);
              return (
                <button key={c.slug} disabled={!c.active} aria-pressed={on}
                  onClick={() => setCrops((x) => on ? x.filter((s) => s !== c.slug) : [...x, c.slug])}
                  className={cx("relative grid min-h-24 place-items-center gap-1 rounded-lg border p-3 text-sm font-semibold",
                    on ? "border-accent bg-accent-soft text-ink" : "border-border bg-surface",
                    !c.active && "border-dashed bg-surface-sunken text-text-muted")}>
                  {on && <Check className="absolute right-2 top-2 size-4 text-accent" aria-hidden />}
                  {c.active ? <Leaf className="size-7 text-accent" aria-hidden /> : <Lock className="size-5" aria-hidden />}
                  {c.name}{!c.active && <span className="text-xs font-normal">Em breve</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-auto grid gap-2 pt-8">
            <Button size="lg" disabled={!crops.length} onClick={() => setStep(2)}>Continuar</Button>
            {!crops.length && <p className="text-center text-xs font-semibold text-danger">Escolha pelo menos uma cultura</p>}
            <Button variant="ghost" onClick={() => setStep(0)}>Voltar</Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8 flex flex-1 flex-col" aria-labelledby="t2">
          <h1 id="t2" className="display text-2xl font-extrabold">Onde fica sua lavoura?</h1>
          <p className="mt-1 text-sm text-text-muted">Usamos só o município, nunca o ponto exato, para mostrar clima e alertas de doença da região.</p>
          <label htmlFor="mun" className="mt-5 text-sm font-semibold">Município</label>
          <div className="relative mt-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" aria-hidden />
            <select id="mun" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className={`${inputCls} appearance-none pl-10`}>
              <option value="">Escolher depois</option>
              {MUNICIPIOS.map((m) => <option key={m.ibge} value={m.nome}>{m.nome} – {m.uf}</option>)}
            </select>
          </div>
          <label className="mt-5 flex min-h-12 items-start gap-3 rounded-md bg-surface-sunken p-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 accent-[var(--color-accent)]" />
            <span><span className="font-semibold text-ink">Quero receber alertas de doença na região</span><br /><span className="text-text-muted">No máximo um aviso por dia. Dá pra desligar no perfil.</span></span>
          </label>
          <div className="mt-auto grid gap-2 pt-8">
            <Button size="lg" onClick={finish}>Entrar no Talhão</Button>
            <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
          </div>
        </section>
      )}
    </main>
  );
}
