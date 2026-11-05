import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/shell";

export const metadata: Metadata = {
  title: { default: "Talhão", template: "%s · Talhão" },
  description: "Diagnóstico de pragas e doenças da soja pela foto, com manejo integrado.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#173A2A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3">Pular para o conteúdo</a>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
