# Preço — Glyma

## Mercado (lido em 05/11/2026)

| app | modelo | preço público | fonte |
| --- | --- | --- | --- |
| Plantix | app grátis para o produtor; receita B2B (API, dados de demanda) sob consulta | R$ 0 no app | [plantix.net](https://plantix.net/pt/) · página B2B [Plantix Intelligence](https://plantix.net/en/plantix-intelligence/) ("Book a demo") |
| Agrio | grátis para baixar, com compras no app | **não encontrei página oficial de preços**; um review de terceiros diz que há compras no app | [flypix.ai (review, terceiros)](https://flypix.ai/pt/agrio-tool-review/) |
| Agrofarm (gestão rural, BR) | assinatura mensal em 4 planos | R$ 9,99 · R$ 59,99 · R$ 179,99 · R$ 399,99 por mês | [GetApp](https://www.getapp.com/industries-software/a/agrofarm/) (diretório, não o site oficial) |

Os preços mudam. Antes de citar qualquer um publicamente, confira na fonte oficial.

## O que os usuários disseram sobre preço e cobrança

**0 de 36** avaliações (`feedback.md`) falam de preço, assinatura ou cobrança. O Plantix é grátis, então não há reclamação desse tipo. Não há nada para corrigir aqui por evidência.

## Modelo

**Grátis para quem planta e para quem orienta.** O Glyma nasce acadêmico, e cobrar o produtor iria contra o posicionamento (resposta franca, sem empurrar produto). Também **não** vai ter:
- anúncio;
- comissão de venda de insumo;
- venda de dados identificáveis.

| plano | para quem | preço | o que tem | estado |
| --- | --- | --- | --- | --- |
| Produtor | quem planta | grátis | diagnóstico, biblioteca offline, plano da lavoura, calculadora, comunidade, alertas | pronto (diagnóstico real depende da chave da Anthropic) |
| Técnico e consultor | agrônomo, técnico agrícola, estudante de Agronomia | grátis | tudo do produtor + selo de especialista verificado + fila de perguntas para responder | selo pronto; fila em construção (E1) |
| Cooperativa e instituição | cooperativas (Coopavel, C.Vale, Lar…), universidades, órgãos de assistência técnica | conversar | painel de alertas da região, fila de perguntas atendida pela própria equipe, fichas com a revisão técnica da instituição | **não existe**; validar interesse antes de construir |

Mensal e anual não se aplicam enquanto não houver cobrança. Se o plano institucional virar realidade, a proposta inicial é **valor fixo anual por instituição** (sem cobrança por usuário, para não haver saltos inesperados), com um piloto gratuito de uma safra.

## Custo de rodar (para saber até onde o grátis vai)

- **Diagnóstico:** cada foto custa uma chamada ao Claude (Haiku por padrão; Sonnet só nos casos ambíguos). O limite de `DAILY_DIAGNOSIS_LIMIT` (20 por pessoa por dia) e um limite de gasto mensal no console da Anthropic seguram o custo.
- **Supabase e Vercel:** os planos gratuitos cobrem o começo. Os limites mudam; confira os planos atuais antes do lançamento.
- O que fazer quando o custo crescer: o caminho natural é o plano institucional, não cobrar o produtor.

## Cobrança sem pegadinha (se um dia houver)

- cancelar com um clique, dentro do app;
- e-mail 7 dias antes de renovar, com o valor;
- valor fixo por instituição, sem cobrança por assento;
- nota fiscal automática.

## Stripe

**Nada a criar agora.** Não há produto pago. Se o plano institucional sair, a sugestão é cobrar por boleto/Pix com nota fiscal (o comum para cooperativas no Brasil), não por cartão no app.
