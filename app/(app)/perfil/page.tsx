"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, CloudUpload, History, Leaf, LogOut, Trash2 } from "lucide-react";
import { backendEnabled } from "@/lib/env";
import { disablePush, enablePush, pushSupported } from "@/lib/client/push";
import { AppBar, Page } from "@/components/shell";
import { Button, Card, Field, Note, Skeleton, inputCls } from "@/components/ui";
import { clearAll, getProfile, saveProfile, type Profile } from "@/lib/client/store";
import { MUNICIPIOS } from "@/lib/data/seed";

export default function ProfilePage() {
  const [p, setP] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [pushMsg, setPushMsg] = useState("");
  const backend = backendEnabled();
  useEffect(() => {
    document.title = "Perfil · Talhão"; setP(getProfile());
    if (backend) import("@/lib/supabase/browser").then(async ({ supabaseBrowser }) => {
      const { data } = await supabaseBrowser().auth.getUser();
      setEmail(data.user && !data.user.is_anonymous ? data.user.email ?? null : null);
    });
  }, [backend]);
  if (!p) return (<><AppBar title="Perfil" /><Page><Skeleton className="h-48 w-full rounded-md" /></Page></>);

  const update = (patch: Partial<Profile>) => { setP(saveProfile(patch)); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const wipe = async () => {
    const msg = backend
      ? "Excluir sua conta e todos os dados? Diagnósticos, fotos, perguntas e respostas são apagados do servidor e deste aparelho. Não dá para desfazer."
      : "Apagar todos os seus dados deste aparelho? Diagnósticos, perguntas e preferências somem.";
    if (!confirm(msg)) return;
    if (backend) {
      const res = await fetch("/api/conta/excluir", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: "EXCLUIR" }) });
      if (!res.ok) { alert("Não deu para excluir agora. Tente de novo."); return; }
    }
    await clearAll(); location.href = "/boas-vindas";
  };
  const signOutAll = async () => {
    if (!confirm("Sair da conta em todos os aparelhos?")) return;
    const { supabaseBrowser } = await import("@/lib/supabase/browser");
    await supabaseBrowser().auth.signOut({ scope: "global" });
    location.href = "/";
  };
  const togglePush = async (on: boolean) => {
    update({ notifyAlerts: on });
    if (!backend || !pushSupported()) return;
    if (on) {
      const r = await enablePush();
      setPushMsg(r === "on" ? "Avisos ligados neste aparelho" : r === "denied" ? "O navegador bloqueou as notificações. Libere nas permissões do site." : "Não deu para ligar os avisos agora.");
    } else { await disablePush(); setPushMsg("Avisos desligados"); }
  };

  return (
    <>
      <AppBar title="Perfil" />
      <Page>
        <Card className="flex items-center gap-4 p-4">
          <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-lg font-bold text-ink" aria-hidden>{(p.name || "Você").slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-bold text-ink">{p.name || "Convidado"}</p>
            <p className="truncate text-sm text-text-muted">{email ?? (backend ? "Convidado: dados salvos neste aparelho e no servidor" : "Dados guardados só neste aparelho")}</p></div>
        </Card>
        {!email && (
          <div className="mt-3 rounded-md border border-dashed border-border-strong p-4">
            <p className="flex items-center gap-2 font-semibold text-ink"><CloudUpload className="size-5 text-accent" aria-hidden />Criar conta</p>
            <p className="mt-1 text-sm text-text-muted">Com conta você acessa seus diagnósticos em outro celular e pode perguntar e responder na comunidade.</p>
            {backend ? <Link href="/entrar" className="mt-3 inline-flex min-h-9 items-center rounded-md border border-border-strong px-3.5 text-sm font-semibold text-ink hover:bg-surface-sunken">Entrar ou criar conta</Link>
              : <Button size="sm" variant="secondary" className="mt-3" disabled>Em breve</Button>}
          </div>
        )}

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
            <input type="checkbox" role="switch" checked={p.notifyAlerts} onChange={(e) => togglePush(e.target.checked)} className="size-6 accent-[var(--color-accent)]" />
          </label>
          {pushMsg && <p role="status" className="text-xs text-text-muted">{pushMsg}</p>}
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
        <div className="mt-3 flex flex-wrap gap-2">
          {email && <Button variant="secondary" onClick={signOutAll}><LogOut className="size-5" aria-hidden />Sair de todos os aparelhos</Button>}
          <Button variant="danger" onClick={wipe}><Trash2 className="size-5" aria-hidden />{backend ? "Excluir conta e dados" : "Apagar meus dados"}</Button>
        </div>
        <p className="mt-6 text-xs text-text-muted">Talhão · versão de desenvolvimento · <Link className="underline" href="/privacidade">privacidade</Link> · <Link className="underline" href="/prototipo/index.html">protótipo antigo</Link></p>
      </Page>
    </>
  );
}
