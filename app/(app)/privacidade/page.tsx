import type { Metadata } from "next";
import { AppBar, Page } from "@/components/shell";

export const metadata: Metadata = { title: "Privacidade" };

const PROC = [
  ["Supabase (EUA)", "banco de dados, login por e-mail e guarda das fotos"],
  ["Vercel (EUA)", "hospedagem do app e execução do job diário"],
  ["Anthropic (EUA)", "análise da foto para o diagnóstico; a foto é enviada sem nome nem localização"],
  ["Open-Meteo (Suíça)", "previsão do tempo; recebe só a coordenada aproximada da sede do município"],
  ["Serviço de notificação do navegador (Google, Mozilla ou Apple)", "entrega dos avisos no celular, se você ligar"],
];

export default function Privacy() {
  return (
    <>
      <AppBar title="Privacidade" back />
      <Page className="prose-sm">
        <h2 className="display text-2xl font-bold">Como o Talhão usa seus dados</h2>
        <p className="mt-2 text-text-muted">Versão de 5 de novembro de 2026. Projeto acadêmico em desenvolvimento.</p>
        <h3 className="mt-6 text-lg font-bold">O que guardamos</h3>
        <ul className="mt-2 list-disc pl-5 text-text-muted">
          <li>Fotos que você envia para diagnóstico, reduzidas e sem a localização GPS (removida no próprio celular).</li>
          <li>O resultado de cada diagnóstico e se você disse que ele acertou.</li>
          <li>Seu município (nunca o ponto exato), as culturas que acompanha e o nome que escolheu.</li>
          <li>E-mail, se você criar conta. Perguntas e respostas da comunidade, que são públicas.</li>
        </ul>
        <h3 className="mt-6 text-lg font-bold">Para que</h3>
        <p className="mt-2 text-text-muted">Mostrar o diagnóstico, calcular alertas de doença por município e medir a precisão do app. Resultados agregados e sem identificação podem ser usados em pesquisa acadêmica. Não vendemos dados e não mostramos anúncios.</p>
        <h3 className="mt-6 text-lg font-bold">Quem processa</h3>
        <ul className="mt-2 grid gap-2">{PROC.map(([n, d]) => <li key={n}><b className="text-ink">{n}</b> — <span className="text-text-muted">{d}</span></li>)}</ul>
        <h3 className="mt-6 text-lg font-bold">Seus direitos (LGPD)</h3>
        <p className="mt-2 text-text-muted">Você pode apagar tudo a qualquer momento em Perfil → Excluir conta e dados. Isso remove fotos, diagnósticos, perguntas e respostas do servidor.</p>
      </Page>
    </>
  );
}
