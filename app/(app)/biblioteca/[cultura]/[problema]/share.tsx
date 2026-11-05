"use client";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";

export function ShareButton({ title }: { title: string }) {
  const [msg, setMsg] = useState("");
  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setMsg("Link copiado"); setTimeout(() => setMsg(""), 3000); }
    } catch { /* usuário cancelou */ }
  };
  return (
    <>
      <Button variant="secondary" size="sm" onClick={share}><Share2 className="size-4" aria-hidden />Compartilhar</Button>
      <span role="status" className="self-center text-sm text-success">{msg}</span>
    </>
  );
}
