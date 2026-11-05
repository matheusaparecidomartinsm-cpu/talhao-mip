"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraOff, Image as ImageIcon, Loader, SunDim, WifiOff, X } from "lucide-react";
import { Button, cx } from "@/components/ui";
import { prepareImage, type PreparedImage } from "@/lib/client/image";
import { getDiagnosis, processQueue, QUEUE_EVENT, saveDiagnosis } from "@/lib/client/store";

type Phase =
  | { k: "starting" }
  | { k: "live" }
  | { k: "denied" }
  | { k: "nocamera" }
  | { k: "dark"; img: PreparedImage; url: string }
  | { k: "analyzing"; url: string; id: string; slow: boolean }
  | { k: "queued"; url: string };

const STEPS = ["Conferindo a foto", "Procurando sintomas", "Montando o resultado"];

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>({ k: "starting" });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const stop = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setPhase({ k: "nocamera" }); return; }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 } }, audio: false });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
        setPhase({ k: "live" });
      } catch (e) {
        setPhase({ k: (e as DOMException)?.name === "NotAllowedError" ? "denied" : "nocamera" });
      }
    })();
    return () => { cancelled = true; stop(); };
  }, []);

  const submit = useCallback(async (img: PreparedImage, url: string) => {
    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    await saveDiagnosis({
      id, cropSlug: "soja", status: "queued", candidates: [],
      capturedAt: nowIso, createdAt: nowIso, image: img.blob, stats: img.stats,
    });
    stop();
    if (!navigator.onLine) { setPhase({ k: "queued", url }); return; }
    setPhase({ k: "analyzing", url, id, slow: false });
    localStorage.setItem(`seen:${id}`, "1");
    processQueue();
  }, []);

  const handleBlob = useCallback(async (blob: Blob) => {
    setBusy(true);
    try {
      const img = await prepareImage(blob);
      const url = URL.createObjectURL(img.blob);
      if (img.stats.brightness < 0.16) { stop(); setPhase({ k: "dark", img, url }); return; }
      await submit(img, url);
    } finally { setBusy(false); }
  }, [submit]);

  const shoot = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => b && handleBlob(b), "image/jpeg", 0.92);
  };

  // acompanha o resultado
  useEffect(() => {
    if (phase.k !== "analyzing") return;
    const id = phase.id;
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900);
    const slow = setTimeout(() => setPhase((p) => (p.k === "analyzing" ? { ...p, slow: true } : p)), 8000);
    const check = async () => {
      const d = await getDiagnosis(id);
      if (d && !["pending", "queued"].includes(d.status)) router.replace(`/diagnostico/${id}`);
    };
    window.addEventListener(QUEUE_EVENT, check);
    return () => { clearInterval(tick); clearTimeout(slow); window.removeEventListener(QUEUE_EVENT, check); };
  }, [phase, router]);

  const fileInput = (
    <input
      ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only"
      aria-label="Escolher foto da galeria"
      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBlob(f); e.target.value = ""; }}
    />
  );

  if (phase.k === "analyzing" || phase.k === "queued") {
    return (
      <main id="conteudo" className="relative grid min-h-dvh place-items-center bg-surface-inverse p-6 text-text-inverse">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={phase.url} alt="Sua foto" className="absolute inset-0 size-full object-cover opacity-35" />
        <div role="status" aria-live="polite" className="relative max-w-xs text-center">
          {phase.k === "analyzing" ? (
            <>
              <Loader className="mx-auto size-10 animate-spin motion-reduce:animate-none" aria-hidden />
              <p className="mt-4 text-xl font-bold">{STEPS[step]}…</p>
              {phase.slow ? (
                <>
                  <p className="mt-2 text-sm">Está demorando mais que o normal. Pode sair: avisamos quando ficar pronto.</p>
                  <Link href="/" className="mt-4 inline-flex min-h-12 items-center rounded-md border border-text-inverse px-5 font-semibold">Voltar ao início</Link>
                </>
              ) : <p className="mt-2 text-sm opacity-90">Leva só alguns segundos.</p>}
            </>
          ) : (
            <>
              <WifiOff className="mx-auto size-10" aria-hidden />
              <p className="mt-4 text-xl font-bold">Foto guardada na fila</p>
              <p className="mt-2 text-sm">Você está sem sinal. Assim que a internet voltar, a gente analisa e avisa.</p>
              <div className="mt-5 grid gap-2">
                <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-5 font-semibold text-on-accent">Voltar ao início</Link>
                <button onClick={() => location.reload()} className="min-h-12 rounded-md border border-text-inverse px-5 font-semibold">Tirar outra foto</button>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  if (phase.k === "dark") {
    return (
      <main id="conteudo" className="grid min-h-dvh content-center gap-4 bg-bg p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={phase.url} alt="Sua foto" className="mx-auto aspect-[4/3] w-full max-w-sm rounded-md object-cover" />
        <div className="mx-auto max-w-sm text-center">
          <SunDim className="mx-auto size-8 text-warning" aria-hidden />
          <h1 className="mt-2 text-xl font-bold">A foto ficou escura</h1>
          <p className="mt-1 text-sm text-text-muted">Com pouca luz fica difícil ver os sintomas. Tente de dia, sem sombra em cima da folha.</p>
          <div className="mt-4 grid gap-2">
            <Button onClick={() => location.reload()}>Tirar outra foto</Button>
            <Button variant="ghost" onClick={() => submit(phase.img, phase.url)}>Enviar assim mesmo</Button>
          </div>
        </div>
      </main>
    );
  }

  const live = phase.k === "live";
  return (
    <main id="conteudo" className="relative min-h-dvh overflow-hidden bg-surface-inverse text-text-inverse">
      {fileInput}
      <video ref={videoRef} playsInline muted aria-hidden className={cx("absolute inset-0 size-full object-cover", !live && "hidden")} />

      <div className="relative z-10 flex items-center justify-between p-3">
        <span className="rounded-full bg-surface px-3 py-2 text-sm font-semibold text-ink">Cultura: Soja</span>
        <Link href="/" aria-label="Fechar câmera" className="grid size-12 place-items-center rounded-full bg-surface-inverse/70">
          <X aria-hidden />
        </Link>
      </div>

      {live ? (
        <>
          <p className="relative z-10 mx-auto mt-2 w-fit rounded-full bg-surface-inverse/70 px-4 py-2 text-center text-sm">
            Uma folha, de perto, com luz do dia
          </p>
          <div aria-hidden className="pointer-events-none absolute inset-x-10 top-1/2 z-10 aspect-square -translate-y-1/2 rounded-lg border-2 border-dashed border-text-inverse/80" />
        </>
      ) : (
        <div className="relative z-10 mx-auto mt-16 max-w-xs px-4 text-center">
          {phase.k === "starting" ? (
            <p role="status" className="text-sm">Abrindo a câmera…</p>
          ) : (
            <>
              <CameraOff className="mx-auto size-10" aria-hidden />
              <h1 className="mt-3 text-xl font-bold text-text-inverse">
                {phase.k === "denied" ? "Sem acesso à câmera" : "Câmera indisponível"}
              </h1>
              <p className="mt-2 text-sm opacity-90">
                {phase.k === "denied"
                  ? "Para tirar a foto aqui, libere a câmera nas permissões do navegador. Ou escolha uma foto já tirada."
                  : "Este aparelho ou navegador não deixou abrir a câmera. Escolha uma foto da galeria."}
              </p>
              <Button className="mt-5 w-full" onClick={() => fileRef.current?.click()} loading={busy}>
                <ImageIcon className="size-5" aria-hidden /> Escolher foto
              </Button>
            </>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-around p-6 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <button onClick={() => fileRef.current?.click()} aria-label="Escolher foto da galeria" className="grid size-14 place-items-center rounded-full bg-surface-inverse/70">
          <ImageIcon aria-hidden />
        </button>
        <button
          onClick={shoot} disabled={!live || busy} aria-label="Tirar foto"
          className="grid size-[72px] place-items-center rounded-full border-4 border-text-inverse disabled:opacity-40"
        >
          <span className="size-14 rounded-full bg-text-inverse" />
        </button>
        <span className="size-14" aria-hidden />
      </div>
    </main>
  );
}
