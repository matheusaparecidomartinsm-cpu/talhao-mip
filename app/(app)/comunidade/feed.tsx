"use client";
import { useEffect, useState } from "react";
import { MessageCirclePlus, MessagesSquare } from "lucide-react";
import { PostCard } from "@/components/blocks";
import { ButtonLink, Card, EmptyState, Skeleton } from "@/components/ui";
import { listLocalPosts } from "@/lib/client/store";
import { backendEnabled } from "@/lib/env";
import type { Post } from "@/lib/data/types";

export function Feed({ posts }: { posts: Post[] }) {
  const [local, setLocal] = useState<Post[] | null>(null);
  useEffect(() => { if (backendEnabled()) { setLocal([]); return; } listLocalPosts().then(setLocal).catch(() => setLocal([])); }, []);
  const all = [...(local ?? []), ...posts];
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="display text-2xl font-bold">Perguntas sobre soja</h2>
          <p className="mt-1 text-sm text-text-muted">Produtores e especialistas da região respondendo.</p>
        </div>
        <ButtonLink href="/comunidade/nova" size="sm" className="shrink-0"><MessageCirclePlus className="size-4" aria-hidden />Perguntar</ButtonLink>
      </div>
      <Card className="mt-4 overflow-hidden">
        {local === null ? (
          <div className="grid gap-3 p-3">{[0, 1, 2].map((i) => <div key={i} className="flex gap-3"><Skeleton className="size-14" /><div className="grid flex-1 gap-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-4/5" /></div></div>)}</div>
        ) : all.length === 0 ? (
          <EmptyState icon={<MessagesSquare className="size-8" />} title="Ninguém perguntou ainda" action={<ButtonLink href="/comunidade/nova">Fazer a primeira pergunta</ButtonLink>}>
            Seja o primeiro a perguntar sobre soja por aqui.
          </EmptyState>
        ) : all.map((p) => <PostCard key={p.id} p={p} isNew={p.answers.length > 0 && Date.now() - new Date(p.answers.at(-1)!.createdAt).getTime() < 15 * 60_000} />)}
      </Card>
      {!backendEnabled() && <p className="mt-3 text-xs text-text-muted">Perguntas que você fizer ficam neste aparelho até a comunidade online ser ligada.</p>}
    </>
  );
}
