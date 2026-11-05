import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera, CircleHelp, Gauge, Hammer, Map, ShieldCheck, Sprout, UserCheck, WifiOff, BellRing } from "lucide-react";
import { GlymaMark } from "@/components/brand";
import { ButtonLink } from "@/components/ui";
import { backendEnabled } from "@/lib/env";
import { Waitlist } from "./waitlist";

export const metadata: Metadata = {
  title: "Glyma — foto da folha, resposta franca",
  description: "Diagnóstico de pragas e doenças da soja pela foto. Diz quanta certeza tem e, quando não sabe, fala. Grátis, sem anúncio, sem venda de produto.",
  openGraph: { title: "Glyma — foto da folha, resposta franca", description: "Diagnóstico da soja que diz quando não sabe.", locale: "pt_BR", type: "website" },
};

const DIFF = [
  { I: CircleHelp, t: "Diz quando não sabe", d: "Foto escura, planta sadia, outra cultura ou sintoma que não bate: o Glyma explica o motivo e não inventa um nome.", ok: true },
  { I: UserCheck, t: "Uma pessoa responde", d: "Pergunta sem resposta vai para os especialistas da Agronomia, com prazo visível para você.", ok: false },
  { I: Gauge, t: "Aplicar ou não", d: "Cada ficha traz o nível de ação. O app mostra o grupo químico e o caminho para o Agrofit, nunca dose nem loja.", ok: true },
  { I: Sprout, t: "Feito para a soja do Brasil", d: "Fichas escritas a partir das fontes da Embrapa, em revisão pela equipe de Agronomia.", ok: true },
  { I: WifiOff, t: "Sem sinal no talhão", d: "A biblioteca abre offline e as fotos esperam na fila até a internet voltar.", ok: true },
  { I: BellRing, t: "Um alerta por dia, no máximo", d: "Só quando o clima da sua região favorece uma doença. Dá para desligar.", ok: true },
];

const FAQ = [
  ["Substitui o agrônomo?", "Não. O Glyma ajuda a olhar melhor e a decidir quando chamar alguém. Aplicação de defensivo exige receituário agronômico."],
  ["Funciona sem internet?", "A biblioteca, sim. O diagnóstico guarda a foto e analisa quando o sinal voltar."],
  ["Quais culturas?", "Por enquanto, só soja, e bem feita. Milho safrinha é o próximo candidato."],
  ["Precisa criar conta?", "Não para diagnosticar. A conta, com o e-mail, serve para perguntar na comunidade e ver o histórico em outro celular."],
  ["O que vocês fazem com as minhas fotos?", "Usamos para o diagnóstico e para medir a precisão do app. A localização exata é apagada no próprio celular; guardamos só o município. Dá para apagar tudo no perfil."],
  ["Por que roxo?", "É a cor da flor da soja."],
];

export default function Landing() {
  const backend = backendEnabled();
  return (
    <div className="bg-bg">
      <header className="mx-auto flex max-w-[var(--layout-wide-max)] items-center justify-between px-5 py-4">
        <Link href="/sobre" className="display flex items-center gap-2 text-xl font-extrabold text-ink"><GlymaMark className="size-8" />Glyma</Link>
        <ButtonLink href="/" size="sm" variant="secondary">Abrir o app</ButtonLink>
      </header>

      <main id="conteudo">
        {/* 1. destaque */}
        <section className="mx-auto grid max-w-[var(--layout-wide-max)] items-center gap-8 px-5 pb-12 pt-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Diagnóstico da soja pela foto</p>
            <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.6rem)] font-extrabold leading-[1.05]">Foto da folha.<br />Resposta franca.</h1>
            <p className="mt-4 max-w-xl text-lg text-text-muted">
              O Glyma diz o que é mais provável na sua soja e quanta certeza tem. Quando não sabe, fala, e um especialista da Agronomia olha a foto com você.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/" size="md" className="px-7"><Camera className="size-5" aria-hidden />Abrir o Glyma</ButtonLink>
              <ButtonLink href="#lista" size="md" variant="ghost">Entrar na lista do teste</ButtonLink>
            </div>
            <p className="mt-3 text-sm text-text-muted">Grátis. Sem cadastro para diagnosticar. Sem anúncio.</p>
          </div>
          <div className="mx-auto w-[min(300px,80vw)] overflow-hidden rounded-[28px] border-8 border-ink shadow-pop">
            <Image src="/landing/resultado.webp" alt="Tela de resultado do Glyma: Muito provável, 79%, com manejo e o que foi visto na foto" width={585} height={1266} priority className="h-auto w-full" />
          </div>
        </section>

        {/* 2. problema */}
        <section className="bg-surface-sunken" aria-labelledby="problema">
          <div className="mx-auto max-w-[var(--layout-wide-max)] px-5 py-12">
            <h2 id="problema" className="display text-3xl font-extrabold">Já passou por isso?</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-md bg-surface p-5 shadow-card">
                <h3 className="text-lg font-bold">App que chuta</h3>
                <p className="mt-1 text-text-muted">Você manda a foto, o app dá um nome qualquer com cara de certeza, e você aplica no escuro.</p>
              </div>
              <div className="rounded-md bg-surface p-5 shadow-card">
                <h3 className="text-lg font-bold">Pergunta sem resposta</h3>
                <p className="mt-1 text-text-muted">Quando o app não sabe, empurra para uma comunidade em que ninguém responde.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. como funciona */}
        <section className="mx-auto max-w-[var(--layout-wide-max)] px-5 py-12" aria-labelledby="como">
          <h2 id="como" className="display text-3xl font-extrabold">Como funciona</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              ["Tire a foto", "Uma folha, de perto, com luz do dia. Funciona até sem sinal: a foto espera na fila."],
              ["Veja quanta certeza a gente tem", "O mais provável, em palavras e em porcentagem, e o que vimos na foto."],
              ["Decida com calma", "Manejo cultural, biológico e químico, com o nível de ação da praga antes de pensar em produto."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span aria-hidden className="display grid size-11 shrink-0 place-items-center rounded-full bg-accent text-lg font-extrabold text-on-accent">{i + 1}</span>
                <span><span className="block text-lg font-bold text-ink">{t}</span><span className="text-text-muted">{d}</span></span>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. diferenças */}
        <section className="bg-surface-inverse text-text-inverse" aria-labelledby="dif">
          <div className="mx-auto max-w-[var(--layout-wide-max)] px-5 py-12">
            <h2 id="dif" className="display text-3xl font-extrabold text-text-inverse">O que é diferente</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DIFF.map(({ I, t, d, ok }) => (
                <li key={t} className="rounded-md bg-surface p-5 text-text">
                  <I className="size-7 text-accent" aria-hidden />
                  <h3 className="mt-2 flex flex-wrap items-center gap-2 text-lg font-bold">{t}
                    {!ok && <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning"><Hammer className="size-3.5" aria-hidden />em construção</span>}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. preço */}
        <section className="mx-auto max-w-[var(--layout-wide-max)] px-5 py-12" aria-labelledby="preco">
          <h2 id="preco" className="display text-3xl font-extrabold">Quanto custa</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { t: "Produtor", p: "Grátis", d: ["Diagnóstico pela foto", "Biblioteca offline", "Plano da lavoura e calculadora", "Comunidade com especialistas"], hi: true },
              { t: "Técnico e consultor", p: "Grátis", d: ["Tudo do produtor", "Selo de especialista verificado", "Fila de perguntas para responder (em breve)"] },
              { t: "Cooperativa e instituição", p: "Conversar", d: ["Painel de alertas da região", "Fila de perguntas com a sua equipe", "Fichas com a sua marca técnica"], soon: true },
            ].map((c) => (
              <div key={c.t} className={c.hi ? "rounded-md border-2 border-accent bg-surface p-5" : "rounded-md border border-border bg-surface p-5"}>
                <h3 className="text-lg font-bold">{c.t}</h3>
                <p className="display mt-1 text-3xl font-extrabold text-ink">{c.p}</p>
                {c.soon && <p className="text-xs font-semibold text-warning">ainda não existe: estamos ouvindo quem quer</p>}
                <ul className="mt-3 grid gap-1 text-sm text-text-muted">{c.d.map((x) => <li key={x} className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{x}</li>)}</ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-muted">Sem anúncio, sem venda de produto, sem assinatura. O Glyma nasceu de um projeto entre Engenharia de Software e Agronomia.</p>
        </section>

        {/* 6. perguntas */}
        <section className="bg-surface-sunken" aria-labelledby="faq">
          <div className="mx-auto max-w-3xl px-5 py-12">
            <h2 id="faq" className="display text-3xl font-extrabold">Perguntas</h2>
            <div className="mt-6 divide-y divide-border rounded-md bg-surface shadow-card">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group px-5">
                  <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 font-semibold text-ink">{q}<span aria-hidden className="text-accent transition-transform group-open:rotate-45">+</span></summary>
                  <p className="pb-4 text-text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 7. chamada final */}
        <section id="lista" className="mx-auto max-w-[var(--layout-wide-max)] px-5 py-14 text-center" aria-labelledby="fim">
          <Map className="mx-auto size-10 text-accent" aria-hidden />
          <h2 id="fim" className="display mt-2 text-3xl font-extrabold">Teste na próxima vistoria</h2>
          <p className="mx-auto mt-2 max-w-xl text-text-muted">Abra o Glyma no celular, tire a foto de uma folha e veja o que ele diz. Se quiser, deixe seu e-mail: avisamos quando o diagnóstico com IA e a resposta dos especialistas estiverem ligados.</p>
          <div className="mt-6 flex justify-center"><ButtonLink href="/" className="px-7"><Camera className="size-5" aria-hidden />Abrir o Glyma</ButtonLink></div>
          <div className="mx-auto mt-8 max-w-md text-left"><Waitlist enabled={backend} /></div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[var(--layout-wide-max)] flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-text-muted">
          <span className="flex items-center gap-2"><GlymaMark className="size-5" />Glyma · projeto acadêmico, Cascavel (PR)</span>
          <span className="flex gap-4"><Link className="underline" href="/privacidade">Privacidade</Link><Link className="underline" href="/termos">Termos</Link><Link className="underline" href="/biblioteca">Biblioteca</Link></span>
        </div>
      </footer>
    </div>
  );
}
