import { ButtonLink } from "@/components/ui";
export default function NotFound() {
  return (
    <main id="conteudo" className="mx-auto grid min-h-dvh max-w-sm content-center gap-3 p-6 text-center">
      <h1 className="display text-2xl font-bold">Página não encontrada</h1>
      <p className="text-text-muted">O endereço pode estar errado ou a página foi removida.</p>
      <ButtonLink href="/">Voltar ao início</ButtonLink>
    </main>
  );
}
