# Arquitetura: clone do Plantix para soja (Talhão)

Base: `replica/recon.md` (19 telas S01–S19, 7 fluxos F01–F07) e `replica/features.csv` (38 linhas).
Schema: `replica/schema.sql` (testado em Postgres 16: 22 tabelas, 43 políticas RLS, contadores e cascatas conferidos).

**Ponto de partida:** o repositório `talhao-mip` hoje é um protótipo estático (`index.html` + localStorage, câmera simulada). Daqui a gente aproveita a identidade visual (fonte Archivo, paleta mata/broto/âmbar/urucum) e, mais tarde, a parte de MIP (régua NE/NC/NDE, mapa de talhões). O app novo é um projeto Next.js no mesmo repo.

---

## 1. Stack

| camada | escolha | por quê |
| --- | --- | --- |
| app | **Next.js (App Router) + TypeScript**, como **PWA** | uma base só para celular e computador; o produtor instala pelo navegador, sem loja; páginas da biblioteca ficam estáticas e rápidas |
| estilo | Tailwind + tokens do replica-design | já é o padrão do pack; tokens vêm da paleta do Talhão |
| offline | **Serwist** (service worker) + **IndexedDB** (`idb-keyval`) | biblioteca em cache e fila de fotos quando não tem sinal no talhão |
| banco | **Postgres no Supabase** | você já tem o Supabase conectado; um banco só, com RLS |
| acesso a dados | `supabase-js` + tipos gerados (`generate_typescript_types`), **sem ORM** | com RLS a regra de acesso mora no banco; ORM com conexão de serviço passaria por cima dela |
| auth | **Supabase Auth**: sessão **anônima** no primeiro uso + e-mail com código (OTP) para virar conta | o Plantix deixa usar sem cadastro; o anônimo é promovido depois sem perder o histórico |
| arquivos | **Supabase Storage** (3 buckets: `diagnoses` privado, `community` e `library` públicos) | mesmo lugar do banco, regras por pasta do usuário |
| diagnóstico | **API da Anthropic (Claude com visão)**, chave própria, chamada só do servidor | sem dataset nem treino para começar; a resposta é presa ao catálogo de problemas da soja (ver §4) |
| clima | **Open-Meteo** (API pública, sem chave) | previsão por coordenada com chuva, umidade, vento: o necessário para janela de pulverização |
| push | **Web Push** (biblioteca `web-push` + chaves VAPID) | funciona no Chrome do Android, que é o celular do público; sem Firebase |
| e-mail | o próprio Supabase Auth para os códigos; **Resend** se precisar de mais entregabilidade | o app quase não manda e-mail |
| jobs | **Vercel Cron** (1×/dia) | plano Hobby só permite cron diário, e é o que o alerta precisa |
| hospedagem | **Vercel** | já conectado; deploy a cada push no GitHub |
| pagamentos | **nenhum** | app acadêmico/gratuito; nada no features.csv pede cobrança |

Sem microsserviços, sem fila externa, sem modelo próprio na primeira versão.

---

## 2. Schema (resumo)

Arquivo completo: `replica/schema.sql`. Acesso: **Row Level Security do Postgres em todas as 22 tabelas**. O cliente usa a chave pública + sessão do usuário; só rotas do servidor e jobs usam a service role.

| grupo | tabelas | dono / acesso |
| --- | --- | --- |
| usuários | `profiles`, `experts` | perfil: só o dono; nome e papel públicos pela view `public_profiles`; especialista verificado por admin |
| catálogo | `crops`, `problems`, `problem_crops`, `problem_images`, `treatments`, `crop_stage_tips`, `fertilizer_rules`, `alert_rules` | leitura pública do que está `published`; escrita só `admin` |
| do usuário | `user_crops`, `crop_plans`, `push_subscriptions`, `notifications` | só o dono (`user_id = auth.uid()`) |
| diagnóstico | `diagnoses`, `diagnosis_candidates` | dono lê e dá feedback; criação e resultado só pelo servidor |
| comunidade | `posts`, `answers`, `likes`, `reports` | leitura pública do publicado; escrever exige conta **não anônima**; moderador oculta |
| alertas/clima | `disease_alerts`, `weather_cache` | alertas públicos; escrita só pelo job |

**Restrições que o banco garante (não a tela):**
- `diagnoses.id` é gerado no celular → reenviar da fila offline não duplica (`insert ... on conflict do nothing`).
- curtir 2× é impossível (`likes` PK composta); denunciar 2× também (`reports` unique).
- contadores `answers_count`/`likes_count` mantidos por trigger, nunca pelo cliente.
- o job de alerta pode rodar 2× no mesmo dia sem duplicar (`unique (problem_id, municipio_ibge, valid_from)`), e o mesmo alerta nunca notifica 2× a mesma pessoa (`notifications unique (user_id, kind, ref_id)`).
- usuário não se autopromove a especialista/admin (policy de update compara com `my_role()`).
- excluir a conta apaga tudo do usuário em cascata (LGPD); conteúdo do catálogo revisado por ele fica, com `reviewed_by = null`.
- `treatments` químicos guardam ingrediente ativo, grupo FRAC/IRAC e link do Agrofit, **sem coluna de dose** (receituário agronômico).

Localização: só **município (código IBGE)** e coordenada arredondada (~1 km). Nunca o ponto exato da foto.

---

## 3. API

Convenção: **SA** = server action do Next; **RH** = route handler (`/api/...`); **pág** = página server component (lê com a sessão do usuário, RLS aplica).

### F01 Diagnosticar (loop central) — S04, S05, S06, S07

| método / caminho | o que faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| (cliente) upload Storage | sobe a foto já reduzida (≤1280 px, JPEG/WebP, ≤5 MB) para `diagnoses/{uid}/{id}.jpg` | qualquer sessão (inclusive anônima) | arquivo | caminho |
| `POST /api/diagnoses` (RH) | idempotente pelo `id`; checa limite diário; chama o modelo; grava `diagnoses` + `diagnosis_candidates` | qualquer sessão | `{id, crop_id, image_path, captured_at}` | `{status, candidates:[{problem_slug, probability, reasoning}]}` |
| `GET /diagnostico/[id]` (pág) | resultado S06 com fotos de exemplo e link pra ficha | dono | — | página |
| `submitFeedback` (SA) | "acertou / errou" → `user_feedback` (mede acurácia) | dono | `{diagnosis_id, value}` | ok |
| `GET /historico` (pág) | S17 lista de diagnósticos | dono | `?cursor` | página |

### F02 Primeira abertura — S01, S02, S03

| método / caminho | o que faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| (cliente) `auth.signInAnonymously()` | cria sessão de convidado | público | — | sessão |
| `saveOnboarding` (SA) | grava `profiles` (idioma, município, coordenada arredondada) e `user_crops` | sessão | `{crops[], lat?, lng?, municipio_ibge?}` | ok |
| `GET /api/municipios?q=` (RH) | busca município por nome / mais próximo da coordenada (arquivo estático do IBGE embutido) | público | `q` ou `lat,lng` | `[{ibge, nome, uf}]` |
| `GET /` (pág) | S03 início: culturas, alerta ativo do município, clima, dica da fase | sessão | — | página |

### F04 Biblioteca — S07, S08, S09

| método / caminho | o que faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| `GET /biblioteca` (pág, estática) | S08 culturas | público | — | página |
| `GET /biblioteca/[cultura]` (pág, estática) | S09 problemas com filtro por tipo e A–Z (filtro no cliente) | público | `?tipo=` | página |
| `GET /biblioteca/[cultura]/[problema]` (pág, estática) | S07 ficha completa | público | — | página |
| `GET /api/busca?q=` (RH) | busca em `problems.search` (tsvector português) | público | `q` | `[{slug, nome, tipo}]` |
| `GET /api/offline-pack` (RH) | JSON com todas as fichas publicadas + URLs das fotos, pro service worker guardar | público | `?versao` | JSON |

Páginas estáticas são revalidadas quando o admin publica uma ficha (`revalidatePath`).

### F03 Comunidade — S10, S11, S12

| método / caminho | o que faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| `GET /comunidade` (pág) | S10 feed por cultura, ordenado por atividade | público | `?cultura&cursor` | página |
| `createPost` (SA) | S11 publica; anexa foto e `diagnosis_id` se veio do resultado | conta não anônima | `{crop_id, title, body, image_paths[], diagnosis_id?}` | `{id}` |
| `GET /comunidade/[id]` (pág) | S12 pergunta + respostas, selo de especialista | público | — | página |
| `createAnswer` (SA) | responde; cria `notifications` + push para o autor na hora | conta não anônima | `{post_id, body}` | `{id}` |
| `toggleLike` (SA) | curte/descurte (insert/delete) | conta não anônima | `{target_type, target_id}` | `{liked}` |
| `reportContent` (SA) | denuncia | conta | `{target_type, target_id, reason, note?}` | ok |
| `moderate` (SA) | oculta/remove post ou resposta; fecha denúncia | moderador/admin | `{report_id, action}` | ok |

### F05 Alertas e clima — S13, S14

| método / caminho | o que faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| `POST /api/push` (RH) | registra assinatura Web Push | sessão | `{endpoint, keys}` | ok |
| `DELETE /api/push` (RH) | remove assinatura | dono | `{endpoint}` | ok |
| `GET /alertas` (pág) | S13 alertas válidos do município do usuário | sessão | — | página |
| `GET /clima` (pág) | S14 previsão de `weather_cache` + "bom/ruim para pulverizar" | sessão | — | página |
| `markRead` (SA) | marca notificação lida | dono | `{id}` | ok |

### F06 Plano de cultivo — S15 · F07 Calculadora — S16

| método / caminho | o que faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| `saveCropPlan` (SA) | cria/edita talhão com data de semeadura e área | sessão | `{id?, name, sowing_date, area_ha}` | `{id}` |
| `GET /plano/[id]` (pág) | S15 fase atual (dias após semeadura → `crop_stage_tips`) e o que monitorar | dono | — | página |
| `GET /calculadora` (pág) | S16 cálculo no cliente com `fertilizer_rules`; aceita ha e alqueire paranaense (2,42 ha) | público | — | página |

### Conta e admin — S18

| método / caminho | o que faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| `upgradeAccount` (SA) | liga e-mail à sessão anônima (`updateUser` + OTP), mantém histórico | anônimo | `{email}` | ok |
| `updateProfile` (SA) | nome, idioma, município, notificações | dono | campos | ok |
| `POST /api/conta/excluir` (RH) | apaga fotos do Storage e o `auth.users` (cascata) | dono | confirmação | ok |
| `/admin/problemas` (pág + SAs) | CRUD de fichas, imagens, tratamentos, regras de alerta; fluxo draft → review → published | admin (review: expert) | formulário | — |
| `/admin/denuncias` (pág) | fila de moderação | moderador/admin | — | — |

**Total: 33 rotas** (8 route handlers, 11 server actions, 14 páginas com dados; as ações de CRUD do admin contam junto da página), mais as chamadas diretas do cliente ao Storage e ao Auth.

### Jobs (Vercel Cron, protegidos por `CRON_SECRET`)

| job | horário | o que faz |
| --- | --- | --- |
| `GET /api/cron/diario` | 08:00 UTC (05:00 em Brasília) | 1) atualiza `weather_cache` para cada município com usuário (Open-Meteo, em lotes); 2) avalia `alert_rules` (clima dos próximos 5 dias + diagnósticos confirmados no município nos últimos 14) → `disease_alerts`; 3) cria `notifications` e manda push, **no máximo 1 push de alerta por pessoa por dia** |
| mesma rota, passo 4 | diário | limpeza: fotos órfãs no Storage (upload sem diagnóstico há >24 h), assinaturas push que deram 410 Gone |

### Webhooks

Entrada: nenhum (sem pagamento, sem provedor externo que notifique). Saída: Web Push para os navegadores. Só APIs públicas com chave própria (Anthropic, Open-Meteo, IBGE em arquivo). **Nenhum endpoint do Plantix.**

---

## 4. As partes que mordem

- **Qualidade do diagnóstico.** O prompt manda ao modelo a lista de problemas publicados da soja (slug + `visual_cues`) e exige JSON: checagens `is_plant`, `crop_match`, `image_quality`, depois até 3 candidatos *só dessa lista* com probabilidade e sinais vistos. Slug fora da lista é descartado. Abaixo de 0,4 de probabilidade → `not_identified` com o botão "pergunte à comunidade". Antes de lançar: um conjunto de ~100 fotos rotuladas pela turma de Agronomia para medir acerto; depois, `user_feedback` em produção. Modelo e resposta bruta ficam gravados para comparar versões.
- **Custo e abuso da API de visão.** Limite de 20 diagnósticos/dia por usuário (contagem no banco antes da chamada), foto reduzida no celular antes do upload, modelo mais barato primeiro (Haiku) com o maior só quando as checagens forem ambíguas.
- **Offline.** Fichas e fotos da biblioteca vão para o cache na instalação (`/api/offline-pack`, poucos MB para ~25 fichas). A foto tirada sem sinal vai para o IndexedDB com o `id` já gerado; Background Sync no Chrome Android, e nos outros reenvio no evento `online`. Tela S05 mostra "na fila, analisamos quando voltar o sinal".
- **Idempotência.** Fila offline reenvia → `id` do cliente + `on conflict do nothing`. Cron rodando 2× → `unique` em `disease_alerts` e `notifications`.
- **Fuso horário.** Tudo `timestamptz` em UTC; a tela mostra em `America/Sao_Paulo`. Brasil não tem horário de verão desde 2019, mas não fixe o offset −3 no código: use o nome do fuso. "Hoje" do alerta é calculado em horário de Brasília.
- **Limites de arquivo.** 5 MB por foto, só JPEG/WebP (configurado no bucket); celular reduz para 1280 px antes. Remove EXIF (inclusive GPS) na redução via canvas.
- **Rate limits externos.** Open-Meteo: uma chamada por município (não por usuário), em cache por 24 h. Anthropic: retry com espera exponencial em 429/529, e o diagnóstico vira `failed` com "tente de novo" se não der.
- **Busca.** `tsvector` em português no Postgres basta para centenas de fichas; nada de serviço de busca.
- **Realtime.** Não precisa. Resposta nova chega por push; a página recarrega ao abrir.
- **Notificações em excesso.** Reclamação real na Play Store do Plantix. Teto de 1 push de alerta/dia, só para culturas do usuário, desligável em S18.
- **Moderação.** Recomendação perigosa (dose de agrotóxico, produto não registrado) tem motivo próprio de denúncia; resposta de especialista ganha selo, mas o texto de rodapé lembra que recomendação química exige agrônomo.
- **Conteúdo e direitos.** Nenhum texto ou foto do Plantix. `problem_images.license` é obrigatório; fichas passam por `review` antes de `published`.
- **LGPD.** Localização só por município; exclusão de conta apaga Storage + banco; política de privacidade dizendo que as fotos podem ser usadas, anonimizadas, para medir acurácia (e pedindo consentimento para isso no onboarding).
- **Multi-tenancy.** Não há organizações; um usuário = um dono. Se um dia entrar "fazenda com vários técnicos", nasce uma tabela `farms` e `farm_id` nos dados.

---

## 5. Ordem de construção

| marco | o que entrega | telas | tabelas | rotas |
| --- | --- | --- | --- | --- |
| **M0 Base** | Next.js no repo `talhao-mip`, Supabase com o schema, deploy na Vercel, PWA instalável | — | todas (migração 1) | — |
| **M1 Fatia vertical (feia)** | abrir → convidado → tirar foto → resultado real → ficha. Com 5 fichas de soja escritas (ferrugem asiática, percevejo-marrom, lagarta-da-soja, mancha-alvo, oídio) | S04, S05, S06, S07 | profiles, crops, problems, treatments, diagnoses, diagnosis_candidates | signInAnonymously, upload, `POST /api/diagnoses`, `/diagnostico/[id]`, `/biblioteca/soja/[problema]` |
| **M2 Essenciais (must)** | biblioteca completa de soja (~25 fichas), filtro por tipo, estados de erro do diagnóstico, biblioteca offline, início | S03, S07, S08, S09 | problem_crops, problem_images, user_crops | `/`, `/biblioteca*`, `/api/offline-pack`, saveOnboarding |
| **M3 Importantes (should)** | onboarding, fila offline, histórico, feedback, busca, conta e exclusão, fotos de exemplo; depois comunidade; depois alertas + push + clima | S01, S02, S10–S14, S17, S18 | experts, posts, answers, likes, reports, alert_rules, disease_alerts, weather_cache, push_subscriptions, notifications | submitFeedback, `/historico`, `/api/busca`, `/api/municipios`, upgradeAccount, `/api/conta/excluir`, rotas da comunidade, `/api/push`, `/alertas`, `/clima`, cron diário, `/admin/*` |
| **M4 Opcionais (could)** | plano de cultivo por fase, calculadora de adubo, compartilhar ficha, links Agrofit; integrar a régua NE/NC/NDE do protótipo ao plano | S15, S16, S19 | crop_plans, crop_stage_tips, fertilizer_rules | saveCropPlan, `/plano/[id]`, `/calculadora` |
| **M5 Correções** | o que o `/replica-entrepreneur` apontar | — | — | — |

Critério para sair do M1: tirar foto de uma folha com ferrugem no celular e ver o resultado certo em até 3 toques e alguns segundos.
