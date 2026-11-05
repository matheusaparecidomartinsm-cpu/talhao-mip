import type { Metadata } from "next";
import Link from "next/link";
import { AppBar, Page } from "@/components/shell";

export const metadata: Metadata = { title: "Termos de uso" };

export default function Terms() {
  return (
    <>
      <AppBar title="Termos de uso" back />
      <Page>
        <h2 className="display text-2xl font-bold">Termos de uso do Glyma</h2>
        <p className="mt-2 text-text-muted">Versão de 5 de novembro de 2026. Projeto acadêmico em teste (beta).</p>
        <h3 className="mt-6 text-lg font-bold">O que o Glyma é</h3>
        <p className="mt-2 text-text-muted">Uma ferramenta de apoio para identificar pragas, doenças e deficiências da soja e consultar formas de manejo. É gratuita e está em fase de teste.</p>
        <h3 className="mt-6 text-lg font-bold">O que o Glyma não é</h3>
        <p className="mt-2 text-text-muted">Não é laudo técnico nem receituário agronômico. O resultado do diagnóstico é uma estimativa e pode errar. Decisões de aplicação de defensivos devem ser tomadas com um engenheiro agrônomo, conforme a legislação.</p>
        <h3 className="mt-6 text-lg font-bold">Comunidade</h3>
        <ul className="mt-2 list-disc pl-5 text-text-muted">
          <li>Perguntas e respostas são públicas. Não publique dados pessoais seus ou de outras pessoas.</li>
          <li>Não publique dose de defensivo, indicação de produto não registrado, ofensa ou propaganda. Esse conteúdo pode ser ocultado pela moderação.</li>
          <li>O selo de especialista é dado a quem teve a formação verificada; ainda assim, a resposta é orientação, não receituário.</li>
        </ul>
        <h3 className="mt-6 text-lg font-bold">Suas fotos e seus dados</h3>
        <p className="mt-2 text-text-muted">Você continua dono das suas fotos. Ao enviar, autoriza o uso para gerar o diagnóstico e medir a precisão do app, sem identificação. Detalhes na <Link className="underline" href="/privacidade">política de privacidade</Link>. Você pode apagar tudo a qualquer momento no perfil.</p>
        <h3 className="mt-6 text-lg font-bold">Limites</h3>
        <p className="mt-2 text-text-muted">Por ser um projeto em teste, o serviço pode ficar fora do ar ou mudar sem aviso, e há limite diário de diagnósticos por pessoa. O Glyma não se responsabiliza por perdas decorrentes de decisões tomadas apenas com base no app.</p>
        <p className="mt-6 text-xs text-text-muted">Texto inicial escrito para o beta. Revisar com orientação jurídica antes do lançamento público.</p>
      </Page>
    </>
  );
}
