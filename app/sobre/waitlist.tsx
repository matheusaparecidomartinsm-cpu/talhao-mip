"use client";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button, Field, inputCls } from "@/components/ui";
import { MUNICIPIOS } from "@/lib/data/seed";

export function Waitlist({ enabled }: { enabled: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("produtor");
  const [municipio, setMunicipio] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return <p className="rounded-md bg-surface-sunken p-4 text-center text-sm text-text-muted">A lista do teste abre quando o servidor estiver ligado. Enquanto isso, o app já funciona no seu celular.</p>;
  }
  if (done) {
    return (
      <p role="status" className="flex items-center gap-3 rounded-md bg-success-soft p-4 text-sm font-semibold text-success">
        <MailCheck className="size-6 shrink-0" aria-hidden />Pronto. Avisamos por e-mail, uma vez, quando o teste abrir.
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setErr("Confira o e-mail"); return; }
    if (!consent) { setErr("Marque a caixa para a gente poder avisar"); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/lista", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role, municipio: municipio || undefined, consent }) });
    setBusy(false);
    if (r.ok) setDone(true); else setErr((await r.json().catch(() => ({}))).error ?? "Não deu para salvar agora.");
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 rounded-md border border-border bg-surface p-5" aria-label="Lista do teste">
      <Field id="wl-email" label="E-mail" error={err || undefined}>
        <input id="wl-email" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} aria-describedby={err ? "wl-email-err" : undefined} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="wl-role" label="Você é">
          <select id="wl-role" className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="produtor">Produtor</option><option value="tecnico">Técnico ou agrônomo</option>
            <option value="estudante">Estudante</option><option value="outro">Outro</option>
          </select>
        </Field>
        <Field id="wl-mun" label="Município (opcional)">
          <select id="wl-mun" className={inputCls} value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
            <option value="">Não informar</option>{MUNICIPIOS.map((m) => <option key={m.ibge} value={m.nome}>{m.nome}</option>)}
          </select>
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm text-text-muted">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 accent-[var(--color-accent)]" />
        Pode me avisar por e-mail quando o teste abrir. Só isso, sem propaganda.
      </label>
      <Button type="submit" loading={busy}>Entrar na lista</Button>
    </form>
  );
}
