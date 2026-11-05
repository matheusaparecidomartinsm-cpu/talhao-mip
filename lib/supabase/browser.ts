"use client";
import { createBrowserClient } from "@supabase/ssr";
import { PUBLIC_ENV } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseBrowser() {
  if (!client) client = createBrowserClient(PUBLIC_ENV.supabaseUrl, PUBLIC_ENV.supabaseKey);
  return client;
}
