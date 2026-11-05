"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MailCheck } from "lucide-react";
import { GlymaMark } from "@/components/brand";
import { Button, Field, Note, inputCls } from "@/components/ui";
import { backendEnabled, PUBLIC_ENV } from "@/lib/env";

function SignIn() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [mode, setMode] = useState<"link" | "login">("login");
  const [err, setErr] = useState(sp.get("erro") ? "O link expirou ou já foi usado. Peça um novo código." : "");
  const [busy, setBusy] = useState(false);

  if (!backendEnabled()) {
    return <Note tone="info">Contas ainda não estão ligadas neste ambiente. Seus dados ficam no aparelho.</Note>;
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setErr("Confira o e-mail"); return; }
    setBusy(true); setErr("");
    const { supabaseBrowser } = await import("@/lib/supabase/browser");
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getUser();
    const redirect = `${PUBLIC_ENV.siteUrl}/auth/callback?next=/perfil`;
    // Convidado anônimo: liga o e-mail à mesma conta (mantém o histórico).
    const res = data.user?.is_anonymous
      ? (setMode("link"), await sb.auth.updateUser({ email: email.trim() }, { emailRedirectTo: redirect }))
      : (setMode("login"), await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect, shouldCreateUser: true } }));
    setBusy(false);
    if (res.error) {
      setErr(res.error.status === 429 ? "Muitas tentativas. Espere um minuto e tente de novo."
        : res.error.message.includes("already") ? "Esse e-mail já tem conta. Saia do modo convidado e entre com ele." : "Não deu para enviar o código. Tente de novo.");
      return;
    }
    setStep("code");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) { setErr("O código tem 6 números"); return; }
    setBusy(true); setErr("");
    const { supabaseBrowser } = await import("@/lib/supabase/browser");
    const { error } = await supabaseBrowser().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: mode === "link" ? "email_change" : "email" });
    setBusy(false);
    if (error) { setErr("Código errado ou vencido."); return; }
    router.replace("/perfil");
    router.refresh();
  };

  return step === "email" ? (
    <form onSubmit={send} noValidate className="grid gap-4">
      <h1 className="display text-2xl font-extrabold">Entrar ou criar conta</h1>
      <p className="text-text-muted">Mandamos um código de 6 números para o seu e-mail. Sem senha para lembrar.</p>
      <Field id="email" label="E-mail" error={err}>
        <input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className={inputCls} aria-invalid={!!err} aria-describedby={err ? "email-err" : undefined} />
      </Field>
      <Button type="submit" size="lg" loading={busy}>Enviar código</Button>
      <p className="text-xs text-text-muted">Se você já usa o app como convidado, seus diagnósticos passam para a conta.</p>
    </form>
  ) : (
    <form onSubmit={verify} noValidate className="grid gap-4">
      <MailCheck className="size-10 text-accent" aria-hidden />
      <h1 className="display text-2xl font-extrabold">Confira seu e-mail</h1>
      <p className="text-text-muted">Enviamos um código para <b className="text-ink">{email}</b>. Você também pode tocar no link do e-mail.</p>
      <Field id="code" label="Código" error={err}>
        <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={`${inputCls} text-center text-2xl tracking-[0.4em]`} aria-invalid={!!err} aria-describedby={err ? "code-err" : undefined} />
      </Field>
      <Button type="submit" size="lg" loading={busy}>Confirmar</Button>
      <Button type="button" variant="ghost" onClick={() => { setStep("email"); setCode(""); }}>Usar outro e-mail</Button>
    </form>
  );
}

export default function Page() {
  return (
    <main id="conteudo" className="mx-auto grid min-h-dvh max-w-sm content-start gap-6 px-5 py-8">
      <Link href="/" className="display flex items-center gap-2 text-xl font-extrabold text-ink"><GlymaMark className="size-7" />Glyma</Link>
      <Suspense><SignIn /></Suspense>
    </main>
  );
}
