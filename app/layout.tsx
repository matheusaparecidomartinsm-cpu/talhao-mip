import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/archivo/wdth-italic.css";
import "./globals.css";
import { ServiceWorker } from "@/components/shell";
import { AuthBootstrap } from "@/components/auth-bootstrap";

export const metadata: Metadata = {
  title: { default: "Glyma", template: "%s · Glyma" },
  description: "Foto da folha, resposta franca: o que atacou sua soja, quanta certeza temos e quando vale aplicar.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#2B1E45", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3">Pular para o conteúdo</a>
        {children}
        <ServiceWorker />
        <AuthBootstrap />
      </body>
    </html>
  );
}
