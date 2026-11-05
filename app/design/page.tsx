import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { AlertRow, PostCard, StageTimeline, WeatherTable } from "@/components/blocks";
import { ProblemCard, TreatmentAccordion } from "@/components/problem";
import { AgentBadge, Badge, Button, Card, ConfidenceMeter, EmptyState, Field, Note, Skeleton, inputCls } from "@/components/ui";
import { ALERTS, POSTS, STAGE_TIPS, weatherFor } from "@/lib/data/seed";
import { PROBLEMS } from "@/lib/data/seed-problems";
import { sprayVerdict } from "@/lib/data";
import type { AgentType } from "@/lib/data/types";

export const metadata: Metadata = { title: "Sistema de design", robots: { index: false } };

const AGENTS: AgentType[] = ["fungo", "bacteria", "virus", "nematoide", "inseto", "acaro", "deficiencia", "outro"];

export default function Design() {
  const p = PROBLEMS[0];
  return (
    <main id="conteudo" className="mx-auto max-w-[var(--layout-content-max)] bg-surface-sunken px-4 py-6">
      <h1 className="display text-3xl font-extrabold">Componentes</h1>
      <p className="text-text-muted">Os mesmos componentes usados nas telas, isolados.</p>

      <h2 className="mt-6 text-xs font-bold uppercase tracking-wider text-text-muted">Botões</h2>
      <Card className="mt-2 grid gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Button><Camera className="size-5" aria-hidden />Tirar foto</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Fantasma</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" size="sm">Perigo</Button>
          <Button size="sm" loading>Enviando</Button>
          <Button size="sm" disabled>Desabilitado</Button>
        </div>
        <Button size="lg">Grande</Button>
      </Card>

      <h2 className="mt-6 text-xs font-bold uppercase tracking-wider text-text-muted">Selos</h2>
      <Card className="mt-2 flex flex-wrap gap-2 p-4">
        {AGENTS.map((a) => <AgentBadge key={a} type={a} />)}
        <Badge>Especialista</Badge><Badge tone="danger">Risco alto</Badge><Badge tone="warning">Risco médio</Badge><Badge tone="info">Info</Badge>
      </Card>

      <h2 className="mt-6 text-xs font-bold uppercase tracking-wider text-text-muted">Confiança</h2>
      <Card className="mt-2 grid gap-3 p-4"><ConfidenceMeter value={0.82} /><ConfidenceMeter value={0.44} /></Card>

      <h2 className="mt-6 text-xs font-bold uppercase tracking-wider text-text-muted">Cards</h2>
      <Card className="mt-2 p-1"><ProblemCard p={p} /><ProblemCard p={PROBLEMS[6]} compact /></Card>
      <Card className="mt-2 overflow-hidden"><AlertRow a={ALERTS[0]} name="Ferrugem asiática" unread /><AlertRow a={ALERTS[1]} name="Percevejo-marrom" /></Card>
      <Card className="mt-2 overflow-hidden"><PostCard p={POSTS[0]} isNew /><PostCard p={POSTS[1]} /></Card>

      <h2 className="mt-6 text-xs font-bold uppercase tracking-wider text-text-muted">Manejo</h2>
      <Card className="mt-2 p-4"><TreatmentAccordion p={p} /></Card>

      <h2 className="mt-6 text-xs font-bold uppercase tracking-wider text-text-muted">Clima e fases</h2>
      <Card className="mt-2 p-3"><WeatherTable days={weatherFor("x").slice(0, 5).map((d) => ({ ...d, spray: sprayVerdict(d) }))} /></Card>
      <Card className="mt-2 p-4"><StageTimeline tips={STAGE_TIPS} current={3} /></Card>

      <h2 className="mt-6 text-xs font-bold uppercase tracking-wider text-text-muted">Campos e estados</h2>
      <Card className="mt-2 grid gap-4 p-4">
        <Field id="d1" label="Normal" help="Texto de ajuda"><input id="d1" className={inputCls} placeholder="Digite aqui" /></Field>
        <Field id="d2" label="Com erro" error="Informe uma área maior que zero"><input id="d2" className={inputCls} defaultValue="0" aria-invalid /></Field>
        <Note>Aviso em âmbar</Note><Note tone="info">Aviso informativo</Note>
        <div className="grid gap-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/3" /></div>
      </Card>
      <Card className="mt-2"><EmptyState icon={<Camera className="size-8" />} title="Estado vazio" action={<Button size="sm">Ação</Button>}>Uma frase explicando.</EmptyState></Card>
    </main>
  );
}
