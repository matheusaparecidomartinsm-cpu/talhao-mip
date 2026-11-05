"use client";
import { useEffect } from "react";
import { backendEnabled } from "@/lib/env";

/** Com backend: garante uma sessão (convidado anônimo) e sincroniza o perfil local com o banco. */
export function AuthBootstrap() {
  useEffect(() => {
    if (!backendEnabled()) return;
    (async () => {
      const { supabaseBrowser } = await import("@/lib/supabase/browser");
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getSession();
      if (!data.session) await sb.auth.signInAnonymously().catch(() => {});
      const sync = async () => {
        const { getProfile } = await import("@/lib/client/store");
        const { MUNICIPIOS } = await import("@/lib/data/seed");
        const p = getProfile();
        const m = MUNICIPIOS.find((x) => x.nome === p.municipio);
        const { data: u } = await sb.auth.getUser();
        if (!u.user) return;
        await sb.from("profiles").update({
          display_name: p.name ?? null, municipio_ibge: m?.ibge ?? null, uf: m?.uf ?? null,
          lat: m ? Number(m.lat.toFixed(2)) : null, lng: m ? Number(m.lng.toFixed(2)) : null, notify_alerts: p.notifyAlerts,
        }).eq("id", u.user.id);
        for (const slug of p.crops) {
          const { data: c } = await sb.from("crops").select("id").eq("slug", slug).maybeSingle();
          if (c) await sb.from("user_crops").upsert({ user_id: u.user.id, crop_id: c.id }, { onConflict: "user_id,crop_id", ignoreDuplicates: true });
        }
      };
      sync();
      window.addEventListener("talhao:profile", sync);
    })();
  }, []);
  return null;
}
