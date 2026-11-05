"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, CloudUpload, History, Leaf, Trash2 } from "lucide-react";
import { AppBar, Page } from "@/components/shell";
import { Button, Card, Field, Note, Skeleton, inputCls } from "@/components/ui";
import { clearAll, getProfile, saveProfile, type Profile } from "@/lib/client/store";
import { MUNICIPIOS } from "@/lib/data/seed";

export default function ProfilePage() {
  const [p, setP] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { document.title = "Perfil · Talhão"; setP(getProfile()); }, []);
  if (!p) return (<><AppBar title="Perfil" /><Page><Skeleton className="h-48 w-full rounded-md" /></Page></>);

  const update = (patch: Partial<Profile>) => { setP(saveProfile(patch)); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const wipe = async () => {
    if (!confirm("Apagar todos os seus dados deste aparelho? Diagnósticos, perguntas e preferências somem.")) return;
    await clearAll(); location.href = "/boas-vindas";
  };

  return (
    <>
      <AppBar title="Perfil" />
      <Page>
        <Card className="flex items-center gap-4 p-4">
          <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-lg font-bold text-ink" aria-hidden>{(p.name || "Você").slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-bold text-ink">{p.name || "Convidado"}</p><p className="text-sm text-text-muted">Dados guardados só neste aparelho</p></div>
        </Card>
        <div className="mt-3 rounded-md border border-dashed border-border-strong p-4">
          <p className="flex items-center gap-2 font-semibold text-ink"><CloudUpload className="size-5 text-accent" aria-hidden />Criar conta</p>
          <p className="mt-1 text-sm text-text-muted">Com conta, seus diagnósticos ficam salvos na nuvem e você pode responder na comunidade online. Disponível quando o servidor for ligado.</p>
          <Button size="sm" variant="secondary" className="mt-3" disabled>Em breve</Button>
        </div>

        <h2 className="mb-2 mt-6 text-lg font-bold">Seus dados</h2>
        <Card className="grid gap-4 p-4">
          <Field id="nome" label="Como quer ser chamado">
            <input id="nome" className={inputCls} defaultValue={p.name} maxLength={60} onBlur={(e) => update({ name: e.target.value.trim() || undefined })} />
          </Field>
          <Field id="mun" label="Município" help="Usado para clima e alertas da região.">
            <select id="mun" className={inputCls} value={p.municipio ?? ""} onChange={(e) => update({ municipio: e.target.value || undefined })} aria-describedby="mun-help">
              <option value="">Não informar</option>
              {MUNICIPIOS.map((m) => <option key={m.ibge} value={m.nome}>{m.nome} – {m.uf}</option>)}
            </select>
          </Field>
          <label className="flex min-h-12 items-center justify-between gap-3">
            <span><span className="block font-semibold">Alertas de doença na região</span><span className="text-sm text-text-muted">No máximo um aviso por dia</span></span>
            <input type="checkbox" role="switch" checked={p.notifyAlerts} onChange={(e) => update({ notifyAlerts: e.target.checked })} className="size-6 accent-[var(--color-accent)]" />
          </label>
          <p role="status" className="h-4 text-xs text-success">{saved ? "Salvo" : ""}</p>
        </Card>

        <Card className="mt-4 overflow-hidden">
          {[
            { href: "/historico", label: "Meus diagnósticos", I: History },
            { href: "/plano", label: "Plano da lavoura", I: Leaf },
          ].map(({ href, label, I }) => (
            <Link key={href} href={href} className="flex min-h-14 items-center gap-3 border-b border-border px-4 font-semibold text-ink last:border-b-0 hover:bg-surface-sunken">
              <I className="size-5 text-accent" aria-hidden />{label}<ChevronRight className="ml-auto size-5 text-text-subtle" aria-hidden />
            </Link>
          ))}
        </Card>

        <h2 className="mb-2 mt-6 text-lg font-bold">Privacidade</h2>
        <Note tone="info">Fotos são reduzidas e têm a localização (GPS) removida antes de sair do celular. Guardamos só o município.</Note>
        <Button variant="danger" className="mt-3" onClick={wipe}><Trash2 className="size-5" aria-hidden />Apagar meus dados</Button>
        <p className="mt-6 text-xs text-text-muted">Talhão · versão de desenvolvimento · <Link className="underline" href="/prototipo/index.html">protótipo antigo</Link></p>
      </Page>
    </>
  );
}
