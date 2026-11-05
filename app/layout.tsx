import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/archivo/wdth-italic.css";
import "./globals.css";
import { ServiceWorker } from "@/components/shell";
import { AuthBootstrap } from "@/components/auth-bootstrap";

export const metadata: Metadata = {
  title: { default: "Talhão", template: "%s · Talhão" },
  description: "Diagnóstico de pragas e doenças da soja pela foto, com manejo integrado.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#173A2A", width: "device-width", initialScale: 1 };

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
