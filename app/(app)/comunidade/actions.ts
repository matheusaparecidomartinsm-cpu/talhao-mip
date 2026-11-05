"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import webpush from "web-push";
import { SERVER_ENV } from "@/lib/server/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/supabase/server";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; needAccount?: boolean };

async function signedUser() {
  const { sb, user } = await currentUser();
  if (!user) return { error: { ok: false as const, error: "Sessão expirada. Abra o app de novo." } };
  if (user.is_anonymous) return { error: { ok: false as const, error: "Crie uma conta para participar da comunidade.", needAccount: true } };
  return { sb, user };
}

const NewPost = z.object({
  title: z.string().trim().min(5, "Escreva pelo menos 5 letras no título").max(140, "Máximo de 140 caracteres"),
  body: z.string().trim().max(4000, "Máximo de 4000 caracteres"),
  diagnosisId: z.uuid().optional(),
});

export async function createPost(input: z.input<typeof NewPost>): Promise<Result<{ id: string }>> {
  const parsed = NewPost.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const u = await signedUser(); if ("error" in u) return u.error!;
  const { data: crop } = await u.sb.from("crops").select("id").eq("slug", "soja").single();
  const { data, error } = await u.sb.from("posts")
    .insert({ user_id: u.user.id, crop_id: crop!.id, title: parsed.data.title, body: parsed.data.body, diagnosis_id: parsed.data.diagnosisId ?? null })
    .select("id").single();
  if (error || !data) return { ok: false, error: "Não deu para publicar. Tente de novo." };

  // anexa a foto do diagnóstico (só se o diagnóstico é do próprio usuário)
  if (parsed.data.diagnosisId) {
    const admin = supabaseAdmin();
    const { data: d } = await admin.from("diagnoses").select("user_id, image_path").eq("id", parsed.data.diagnosisId).maybeSingle();
    if (d && d.user_id === u.user.id) {
      const dest = `${u.user.id}/${data.id}.jpg`;
      const file = await admin.storage.from("diagnoses").download(d.image_path);
      if (file.data) {
        await admin.storage.from("community").upload(dest, file.data, { contentType: "image/jpeg", upsert: true });
        await admin.from("posts").update({ image_paths: [dest] }).eq("id", data.id);
      }
    }
  }
  revalidatePath("/comunidade");
  return { ok: true, id: data.id };
}

const NewAnswer = z.object({ postId: z.uuid(), body: z.string().trim().min(2, "Escreva sua resposta").max(4000) });

export async function createAnswer(input: z.input<typeof NewAnswer>): Promise<Result<{ id: string }>> {
  const parsed = NewAnswer.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const u = await signedUser(); if ("error" in u) return u.error!;
  const { data, error } = await u.sb.from("answers").insert({ post_id: parsed.data.postId, user_id: u.user.id, body: parsed.data.body }).select("id").single();
  if (error || !data) return { ok: false, error: "Não deu para responder. Tente de novo." };

  // avisa o autor da pergunta (se não for ele mesmo e se ele quiser)
  const admin = supabaseAdmin();
  const { data: post } = await admin.from("posts").select("user_id, title, profiles(notify_answers)").eq("id", parsed.data.postId).single();
  const wants = (post?.profiles as unknown as { notify_answers: boolean } | null)?.notify_answers;
  if (post && post.user_id !== u.user.id && wants) {
    const { error: nErr } = await admin.from("notifications").insert({ user_id: post.user_id, kind: "answer", ref_id: data.id, title: "Nova resposta na sua pergunta", body: post.title.slice(0, 120) });
    if (!nErr && SERVER_ENV.vapidPrivate && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", post.user_id);
      await Promise.all((subs ?? []).map((s) => webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: "Nova resposta na sua pergunta", body: post.title.slice(0, 120), url: `/comunidade/${parsed.data.postId}`, tag: `resp-${parsed.data.postId}` }),
        { vapidDetails: { subject: SERVER_ENV.vapidSubject, publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, privateKey: SERVER_ENV.vapidPrivate }, TTL: 86400 },
      ).catch(async (e) => { if ([404, 410].includes(e?.statusCode)) await admin.from("push_subscriptions").delete().eq("id", s.id); })));
    }
  }
  revalidatePath(`/comunidade/${parsed.data.postId}`);
  revalidatePath("/comunidade");
  return { ok: true, id: data.id };
}

const Target = z.object({ type: z.enum(["post", "answer"]), id: z.uuid() });

export async function toggleLike(input: z.input<typeof Target> & { on: boolean }): Promise<Result> {
  const parsed = Target.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Inválido" };
  const u = await signedUser(); if ("error" in u) return u.error!;
  const row = { user_id: u.user.id, target_type: parsed.data.type, target_id: parsed.data.id };
  const { error } = input.on
    ? await u.sb.from("likes").upsert(row, { onConflict: "user_id,target_type,target_id", ignoreDuplicates: true })
    : await u.sb.from("likes").delete().match(row);
  return error ? { ok: false, error: "Não deu agora" } : { ok: true };
}

const Report = Target.extend({ reason: z.enum(["spam", "ofensivo", "recomendacao_perigosa", "outro"]), note: z.string().max(500).optional() });

export async function reportContent(input: z.input<typeof Report>): Promise<Result> {
  const parsed = Report.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Inválido" };
  const { sb, user } = await currentUser();
  if (!user) return { ok: false, error: "Sessão expirada" };
  const { error } = await sb.from("reports").upsert({ reporter_id: user.id, target_type: parsed.data.type, target_id: parsed.data.id, reason: parsed.data.reason, note: parsed.data.note ?? null },
    { onConflict: "reporter_id,target_type,target_id", ignoreDuplicates: true });
  return error ? { ok: false, error: "Não deu para enviar a denúncia" } : { ok: true };
}

/** Moderação: só moderador/admin (conferido no banco), executada com service role. */
export async function moderate(input: { type: "post" | "answer"; id: string; action: "hide" | "restore" }): Promise<Result> {
  const parsed = Target.extend({ action: z.enum(["hide", "restore"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Inválido" };
  const { sb, user } = await currentUser();
  if (!user) return { ok: false, error: "Sem sessão" };
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !["moderator", "admin"].includes(me.role)) return { ok: false, error: "Sem permissão" };
  const admin = supabaseAdmin();
  await admin.from(parsed.data.type === "post" ? "posts" : "answers").update({ status: parsed.data.action === "hide" ? "hidden" : "published" }).eq("id", parsed.data.id);
  await admin.from("reports").update({ status: "actioned", resolved_by: user.id }).eq("target_id", parsed.data.id).eq("status", "open");
  revalidatePath("/comunidade");
  return { ok: true };
}
