"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Flag, MessageSquareOff, ThumbsUp } from "lucide-react";
import { backendEnabled } from "@/lib/env";
import { createAnswer, reportContent, toggleLike } from "../actions";
import { AppBar, Page } from "@/components/shell";
import { Badge, Button, ButtonLink, EmptyState, Field, Skeleton, inputCls, relTime } from "@/components/ui";
import { getLocalPost, getProfile, saveLocalPost } from "@/lib/client/store";
import type { Answer, Post } from "@/lib/data/types";

export function PostView({ id, seed }: { id: string; seed: Post | null }) {
  const [post, setPost] = useState<Post | null | undefined>(seed ?? undefined);
  const [isLocal, setIsLocal] = useState(false);
  const [useful, setUseful] = useState<Record<string, boolean>>({});
  const [reply, setReply] = useState("");
  const [err, setErr] = useState("");
  const [needAccount, setNeedAccount] = useState(false);
  const [reported, setReported] = useState<Record<string, boolean>>({});
  const backend = backendEnabled();

  useEffect(() => {
    if (seed) return;
    getLocalPost(id).then((p) => { setPost(p ?? null); setIsLocal(!!p); });
  }, [id, seed]);

  if (post === undefined) return (<><AppBar title="Pergunta" back="/comunidade" /><Page><Skeleton className="h-6 w-2/3" /><Skeleton className="mt-3 h-24 w-full" /></Page></>);
  if (post === null) return (
    <><AppBar title="Pergunta" back="/comunidade" /><Page>
      <EmptyState icon={<MessageSquareOff className="size-8" />} title="Pergunta não encontrada" action={<ButtonLink href="/comunidade">Ver perguntas</ButtonLink>}>Ela pode ter sido removida.</EmptyState>
    </Page></>
  );

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reply.trim().length < 2) { setErr("Escreva sua resposta"); return; }
    if (backend) {
      const r = await createAnswer({ postId: post.id, body: reply });
      if (!r.ok) { if (r.needAccount) setNeedAccount(true); else setErr(r.error); return; }
    }
    const prof = getProfile();
    const name = prof.name || "Você";
    const a: Answer = { id: crypto.randomUUID(), author: name, initials: name.slice(0, 2).toUpperCase(), isExpert: false, body: reply.trim(), useful: 0, createdAt: new Date().toISOString() };
    const next = { ...post, answers: [...post.answers, a] };
    setPost(next); setReply(""); setErr("");
    if (isLocal) await saveLocalPost(next);
  };

  return (
    <>
      <AppBar title="Pergunta" back="/comunidade" />
      <Page>
        <article>
          <p className="text-sm font-semibold text-ink">Soja · {post.municipio}</p>
          <h2 className="display mt-1 text-2xl font-bold [overflow-wrap:anywhere]">{post.title}</h2>
          <p className="mt-1 text-xs text-text-muted" suppressHydrationWarning>{post.author} · <time suppressHydrationWarning dateTime={post.createdAt}>{relTime(post.createdAt)}</time></p>
          {post.imageUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={post.imageUrl} alt="Foto enviada com a pergunta" className="mt-4 aspect-[4/3] w-full max-w-md rounded-md object-cover" />
            : <div className="leaf-ph mt-4 aspect-[4/3] w-full max-w-md rounded-md" style={{ ["--h" as string]: post.hue }} role="img" aria-label="Foto enviada com a pergunta" />}
          {post.body && <p className="mt-4 whitespace-pre-line [overflow-wrap:anywhere]">{post.body}</p>}
        </article>

        <h3 className="mt-8 text-lg font-bold">{post.answers.length ? `${post.answers.length} resposta${post.answers.length > 1 ? "s" : ""}` : "Sem respostas ainda"}</h3>
        <ul className="mt-2 grid gap-3">
          {post.answers.map((a) => {
            const on = !!useful[a.id];
            return (
              <li key={a.id} className="grid grid-cols-[32px_1fr] gap-3 rounded-md bg-surface p-3 shadow-card">
                <span aria-hidden className="grid size-8 place-items-center rounded-full bg-accent-soft text-xs font-bold text-ink">{a.initials}</span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2"><b className="text-ink">{a.author}</b>
                    {a.isExpert && <Badge><BadgeCheck className="mr-1 size-3.5" aria-hidden />Especialista</Badge>}
                    <time suppressHydrationWarning dateTime={a.createdAt} className="text-xs text-text-subtle">{relTime(a.createdAt)}</time></p>
                  <p className="mt-1 text-sm text-text-muted [overflow-wrap:anywhere]">{a.body}</p>
                  <div className="mt-2 flex items-center gap-2">
                  <button aria-pressed={on} onClick={async () => {
                      setUseful((u) => ({ ...u, [a.id]: !on }));
                      if (backend) { const r = await toggleLike({ type: "answer", id: a.id, on: !on }); if (!r.ok) { setUseful((u) => ({ ...u, [a.id]: on })); if (r.needAccount) setNeedAccount(true); } }
                    }}
                    aria-label={`Marcar como útil, ${a.useful + (on ? 1 : 0)} pessoas acharam útil`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 text-sm font-semibold aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent">
                    <ThumbsUp className="size-4" aria-hidden />{a.useful + (on ? 1 : 0)}
                  </button>
                  {backend && (reported[a.id]
                    ? <span role="status" className="text-xs text-text-muted">Denúncia enviada. Obrigado.</span>
                    : <button onClick={async () => {
                        const perigosa = confirm("Denunciar esta resposta?\n\nOK = recomendação perigosa (dose, produto não registrado)\nCancelar = outro motivo");
                        const r = await reportContent({ type: "answer", id: a.id, reason: perigosa ? "recomendacao_perigosa" : "outro" });
                        if (r.ok) setReported((x) => ({ ...x, [a.id]: true }));
                      }} aria-label={`Denunciar resposta de ${a.author}`} className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-danger-soft hover:text-danger">
                        <Flag className="size-4" aria-hidden />
                      </button>)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {post.answers.some((a) => a.isExpert) && (
          <p className="mt-3 text-xs text-text-muted">Respostas de especialistas são orientação. Aplicação de defensivo exige receituário agronômico.</p>
        )}

        <form onSubmit={send} className="mt-6 grid gap-2" noValidate>
          <Field id="resp" label="Sua resposta" error={err}>
            <textarea id="resp" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} className={`${inputCls} h-auto py-3`} aria-invalid={!!err} aria-describedby={err ? "resp-err" : undefined} />
          </Field>
          {needAccount && (
            <p role="alert" className="rounded-md bg-warning-soft p-3 text-sm text-warning">
              Para responder é preciso ter conta. <Link href="/entrar" className="font-semibold underline">Entrar ou criar conta</Link>
            </p>
          )}
          <Button type="submit" className="justify-self-start">Responder</Button>
        </form>
      </Page>
    </>
  );
}
