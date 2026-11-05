"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppBar, Page } from "@/components/shell";
import { Button, Field, inputCls } from "@/components/ui";
import { getDiagnosis, getProfile, saveLocalPost } from "@/lib/client/store";
import { problemBySlug } from "@/lib/data/seed-problems";

function NewQuestion() {
  const router = useRouter();
  const sp = useSearchParams();
  const diagId = sp.get("diagnostico") ?? undefined;
  const problem = sp.get("problema") ? problemBySlug(sp.get("problema")!) : undefined;
  const [photo, setPhoto] = useState<string>();
  const [title, setTitle] = useState(problem ? `Dúvida sobre ${problem.commonName.toLowerCase()}` : "");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<{ title?: string; body?: string }>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!diagId) return;
    let u: string | undefined;
    getDiagnosis(diagId).then((d) => { if (d) { u = URL.createObjectURL(d.image); setPhoto(u); } });
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [diagId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof err = {};
    if (title.trim().length < 5) er.title = "Escreva pelo menos 5 letras no título";
    if (title.length > 140) er.title = "Máximo de 140 caracteres";
    if (body.length > 4000) er.body = "Máximo de 4000 caracteres";
    setErr(er);
    if (Object.keys(er).length) return;
    setSending(true);
    const id = crypto.randomUUID();
    const prof = getProfile();
    await saveLocalPost({
      id, cropSlug: "soja", author: prof.name || "Você", municipio: prof.municipio || "Sem município",
      title: title.trim(), body: body.trim(), hue: problem?.hue ?? 100, createdAt: new Date().toISOString(), answers: [], diagnosisId: diagId,
    });
    router.replace(`/comunidade/${id}`);
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <h2 className="display text-2xl font-bold">Nova pergunta</h2>
      {photo && (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Foto do diagnóstico anexada" className="aspect-[4/3] w-full max-w-sm rounded-md object-cover" />
          <figcaption className="mt-1 text-xs text-text-muted">A foto do diagnóstico vai junto.</figcaption>
        </figure>
      )}
      <Field id="titulo" label="Título" help={`${title.length}/140 · Resuma o que você está vendo`} error={err.title}>
        <input id="titulo" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160}
          aria-invalid={!!err.title} aria-describedby={err.title ? "titulo-err" : "titulo-help"} placeholder="Ex.: manchas nas folhas de baixo depois da chuva" />
      </Field>
      <Field id="corpo" label="Detalhes (opcional)" help="Fase da lavoura, há quanto tempo, o que já foi feito" error={err.body}>
        <textarea id="corpo" rows={5} className={`${inputCls} h-auto py-3`} value={body} onChange={(e) => setBody(e.target.value)}
          aria-invalid={!!err.body} aria-describedby={err.body ? "corpo-err" : "corpo-help"} />
      </Field>
      <Button type="submit" size="lg" loading={sending}>Publicar pergunta</Button>
    </form>
  );
}

export default function Page_() {
  return (
    <>
      <AppBar title="Perguntar" back />
      <Page><Suspense><NewQuestion /></Suspense></Page>
    </>
  );
}
