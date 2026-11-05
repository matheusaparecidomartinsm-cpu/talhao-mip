"use client";
// Dados do usuário no aparelho (convidado). IndexedDB para diagnósticos e fotos,
// localStorage para o perfil. Quando o Supabase entrar, isto vira cache local
// e a fonte da verdade passa a ser o banco (mesmas funções).
import { createStore, get, set, values, del } from "idb-keyval";
import type { Diagnosis, Post } from "@/lib/data/types";

type StoredDiagnosis = Diagnosis & { image: Blob; stats?: unknown; error?: string };

const db = () => createStore("talhao", "diagnoses");
const postsDb = () => createStore("talhao-posts", "posts");

export const QUEUE_EVENT = "talhao:queue";
const emit = () => window.dispatchEvent(new Event(QUEUE_EVENT));

export async function saveDiagnosis(d: StoredDiagnosis) { await set(d.id, d, db()); emit(); }
export async function getDiagnosis(id: string) { return (await get(id, db())) as StoredDiagnosis | undefined; }
export async function listDiagnoses() {
  const all = (await values(db())) as StoredDiagnosis[];
  return all.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}
export async function removeDiagnosis(id: string) { await del(id, db()); emit(); }
export async function updateDiagnosis(id: string, patch: Partial<StoredDiagnosis>) {
  const d = await getDiagnosis(id);
  if (!d) return;
  await set(id, { ...d, ...patch }, db());
  emit();
}

let running = false;
/** Envia o que está na fila. Idempotente: o servidor usa o id do cliente. */
export async function processQueue() {
  if (running || !navigator.onLine) return;
  running = true;
  try {
    const pending = (await listDiagnoses()).filter((d) => d.status === "queued" || d.status === "pending");
    for (const d of pending) {
      await updateDiagnosis(d.id, { status: "pending" });
      try {
        const body = new FormData();
        body.set("meta", JSON.stringify({ id: d.id, cropSlug: d.cropSlug, stats: d.stats, capturedAt: d.capturedAt }));
        body.set("image", d.image, `${d.id}.jpg`);
        const res = await fetch("/api/diagnoses", { method: "POST", body });
        const r = await res.json().catch(() => ({}));
        if (res.status === 429 || res.status === 413 || res.status === 415 || res.status === 400) {
          await updateDiagnosis(d.id, { status: "failed", error: r.error ?? "Não foi possível analisar" });
          continue;
        }
        if (!res.ok) throw new Error(String(res.status));
        await updateDiagnosis(d.id, { status: r.status, candidates: r.candidates, model: r.model });
      } catch {
        await updateDiagnosis(d.id, { status: navigator.onLine ? "failed" : "queued" });
      }
    }
  } finally {
    running = false;
  }
}

// ─── perfil (convidado) ──────────────────────────────────────────────
export type Profile = {
  onboarded: boolean;
  name?: string;
  crops: string[];
  municipio?: string;
  notifyAlerts: boolean;
  sowingDate?: string;
  areaHa?: number;
};
const PROFILE_KEY = "talhao:profile";
const DEFAULT_PROFILE: Profile = { onboarded: false, crops: ["soja"], notifyAlerts: true };

export function getProfile(): Profile {
  try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") }; }
  catch { return DEFAULT_PROFILE; }
}
export function saveProfile(p: Partial<Profile>) {
  const next = { ...getProfile(), ...p };
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch { /* modo privado */ }
  window.dispatchEvent(new Event("talhao:profile"));
  return next;
}
export async function clearAll() {
  try { localStorage.removeItem(PROFILE_KEY); } catch {}
  for (const d of await listDiagnoses()) await del(d.id, db());
  for (const p of (await values(postsDb())) as Post[]) await del(p.id, postsDb());
  emit();
}

// ─── perguntas criadas no aparelho (até a comunidade ter backend) ─────
export async function saveLocalPost(p: Post) { await set(p.id, p, postsDb()); }
export async function listLocalPosts() { return ((await values(postsDb())) as Post[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export async function getLocalPost(id: string) { return (await get(id, postsDb())) as Post | undefined; }
