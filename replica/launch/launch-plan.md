# Plano de lançamento — Glyma

**Janela:** safra de soja 2026/27 no oeste do Paraná. A soja semeada em set–nov passa pela floração e pelo enchimento de grãos entre dezembro e fevereiro, a época de mais pressão de ferrugem e percevejo. O **Show Rural Coopavel 2027 é de 1 a 5 de fevereiro, em Cascavel** (data anunciada pela Coopavel, segundo a [Canal Rural](https://www.canalrural.com.br/agricultura/show-rural-coopavel-teve-recorde-de-publico-e-r-75-bilhoes-em-negocios/)): é o ponto alto do lançamento.

## 0. Antes de mostrar a qualquer pessoa de fora

A promessa da página ("quando não sabe, fala, e um especialista olha junto") só pode ir para o público quando for verdade.

- [ ] Projeto Supabase criado, migrações e seed aplicados, chave da Anthropic com limite de gasto (`replica/backend.md`)
- [ ] Acerto medido com ~100 fotos rotuladas pela turma de Agronomia (meta mínima a combinar com o professor; publicar o número real)
- [ ] **E1: fila de perguntas para os especialistas**, com prazo visível. Sem isso, a frase "um especialista olha" sai da página
- [ ] 12 fichas revisadas pela Agronomia (sai o aviso "em revisão")
- [ ] Regras de alerta revisadas (limites de temperatura e chuva)
- [ ] Domínio registrado (`glyma.com.br` ou `glyma.app.br`) e busca no INPI feita
- [ ] Testes manuais M1–M8 do `test-plan.md` no projeto real

## 1. Lista do teste e beta

- A página `/sobre` tem a lista do teste (e-mail, perfil, município, consentimento). Grava na tabela `waitlist`, sem leitura pública.
- **Beta fechado (dezembro):** turma e professores de Agronomia da Univel, mais os produtores que eles indicarem. Entrada por convite; cada pessoa usa nas vistorias reais.
- **Beta aberto (janeiro):** quem está na lista recebe um e-mail único, com a confirmação que a pessoa deu ao se inscrever.

## 2. Medir desde o primeiro dia

Ligado agora:
- **Vercel Web Analytics**, sem cookies e sem dado pessoal; já está no layout e listado na política de privacidade. Só funciona hospedado na Vercel.
- **Erros e jobs:** logs da Vercel; falhas do job diário em `job_failures`; diagnósticos guardam modelo, latência e resposta bruta.

Números a acompanhar toda semana (dá para tirar do banco):

| número | de onde | por que |
| --- | --- | --- |
| diagnósticos por semana | `diagnoses` | uso real |
| % "não identificado" | `diagnoses.status` | honestidade × cobertura |
| % "bateu" no feedback | `diagnoses.user_feedback` | acerto percebido |
| tempo até a 1ª resposta na comunidade | `posts` × `answers` | a promessa do E1 |
| quem volta na semana seguinte | `diagnoses.user_id` | se resolveu algo |

Mais tarde, se precisar: Sentry para erros no navegador (exige conta própria e entra na política de privacidade).

## 3. Onde estão as pessoas

A pesquisa (`replica/feedback.md`) não achou discussões sobre apps de diagnóstico no Reddit. A reclamação aparece nas avaliações da Play, que não são lugar de divulgação. Para o produtor de soja do oeste do Paraná, os canais reais são:

- **Cooperativas:** departamentos técnicos de Coopavel, C.Vale, Lar, Copacol. Ir pelo professor de Agronomia, não por e-mail frio.
- **IDR-Paraná** (assistência técnica do estado), com escritório em Cascavel.
- **Dias de campo e o Show Rural.** Pedir espaço no estande da Univel (se houver) ou numa palestra técnica. Mostrar o app ao vivo numa folha de verdade.
- **Grupos de WhatsApp de produtores e técnicos**, sempre por meio de alguém que já está no grupo, nunca entrando para divulgar.
- **Instagram agro regional:** um vídeo curto mostrando o "não sei" honesto, e não só o acerto.

Não fazer: responder avaliações de outros apps com propaganda, usar o nome do Plantix ou do Agrio em anúncio ou post, nem comparar publicamente sem orientação jurídica.

## 4. Post de lançamento

Produto agrícola tem pouco público no Product Hunt e no Hacker News. Os lugares certos são o **TabNews** (comunidade dev brasileira, conta a história técnica) e o **LinkedIn** (cooperativas, agrônomos, Univel). Rascunho, que começa pela correção, não pela cópia:

> **Fizemos um app de diagnóstico da soja que admite quando não sabe**
>
> Em uma palestra entre Engenharia de Software e Agronomia na Univel, a turma de Agronomia trouxe um problema: app de diagnóstico por foto que dá um nome com cara de certeza, e pergunta na comunidade que ninguém responde.
>
> O Glyma faz três coisas diferentes: diz quanta certeza tem (e quando não tem, fala); manda a dúvida para uma pessoa da Agronomia; e mostra o nível de ação da praga antes de falar em produto. Sem anúncio, sem venda de insumo, funciona sem sinal no talhão.
>
> Ainda é beta. A gente mede o acerto com fotos rotuladas pela Agronomia e publica o número. Se você planta soja ou orienta quem planta, teste na próxima vistoria e conte o que errou: [link]

## 5. Os 10 primeiros, um por um

Conversa de 15 minutos, no talhão ou por vídeo, com o app aberto. Sem formulário.

| # | quem | como chegar |
| --- | --- | --- |
| 1–3 | estudantes de Agronomia com acesso a lavoura (família, estágio) | turma da palestra |
| 4–5 | professores de Agronomia (fitopatologia, entomologia) | coordenação do curso |
| 6–8 | produtores de soja da região | indicação dos estudantes |
| 9 | técnico de cooperativa | professor |
| 10 | extensionista do IDR-Paraná | professor ou o próprio escritório |

Perguntas:
1. Qual foi a última vez que você teve dúvida sobre uma mancha ou um inseto? O que fez?
2. (com o app) Tire a foto de algo que você já sabe o que é. Bateu? A certeza mostrada fez sentido?
3. Quando o app disse "não sei", o que você esperava que ele fizesse?
4. O nível de ação na ficha mudaria sua decisão de aplicar?
5. Usaria de novo na próxima vistoria? Por quê?

Anotar cada resposta numa planilha (pessoa, data, foto, acertou ou não, citação). Os achados viram linhas novas no `features.csv`.

## Calendário

| quando | o quê |
| --- | --- |
| nov/2026 | itens da seção 0; domínio; INPI |
| dez/2026 | beta fechado (turma e professores); 10 conversas |
| jan/2027 | beta aberto para a lista; corrigir o que as conversas mostrarem |
| 1–5 fev/2027 | Show Rural Coopavel: demonstração ao vivo; post no TabNews e no LinkedIn |
| mar/2027 | balanço da safra: números da seção 2, decisão sobre o milho safrinha |
