# Backend — Talhão

Stack: Supabase (Postgres + Auth + Storage), rotas do Next.js na Vercel, Claude com visão para o diagnóstico, Open-Meteo para o clima, Web Push para avisos.
**Sem pagamentos:** o app é gratuito e acadêmico; nada no `features.csv` pede cobrança. Stripe não foi configurado de propósito.

## O que você (Matheus) precisa fazer

1. **Criar o projeto `talhao` no Supabase** (separado do projeto da ProFood). Região: São Paulo (`sa-east-1`).
2. Em *Authentication → Sign In / Providers*: ligar **Email** e **Allow anonymous sign-ins**.
3. Em *Authentication → URL Configuration*: Site URL = endereço da Vercel; Redirect URLs = `https://SEU-APP.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`.
4. Em *Authentication → Email Templates*: colar os 3 modelos de `supabase/templates/` (código de 6 dígitos + link, em português).
5. **E-mail de produção:** o envio padrão do Supabase tem limite baixo (poucos e-mails por hora). Antes de abrir para produtores, ligar SMTP próprio (Resend com domínio próprio) em *Authentication → SMTP*.
6. **Chave da Anthropic:** criar em console.anthropic.com, com limite de gasto mensal.
7. Gerar `CRON_SECRET` (`openssl rand -hex 32`) e chaves VAPID (`npx web-push generate-vapid-keys`).
8. Preencher `.env.local` (modelo em `.env.example`) e as mesmas variáveis na Vercel.
9. Me passar o nome do projeto criado: eu aplico a migração e o seed pelo conector do Supabase.

Ou, pelo terminal: `npx supabase link --project-ref SEU_REF && npx supabase db push && psql "$DATABASE_URL" -f supabase/seed.sql`.

## Banco

- Migração: `supabase/migrations/20261105120000_init.sql` (24 tabelas, RLS em todas).
- Seed: `supabase/seed.sql`, gerado de `lib/data/seed-problems.ts` (`node --experimental-strip-types scripts/gen-seed.ts > supabase/seed.sql`). Idempotente.
- Testes de acesso: `./scripts/db-test.sh`. Sobe um Postgres local imitando o Supabase e testa com 3 usuários (A, B e convidado C):
  - B não vê diagnóstico, candidatos, plano, notificação, perfil nem foto de A; não sobe foto na pasta de A; não cria diagnóstico; não se promove a admin; não posta em nome de A;
  - o convidado lê a comunidade mas não posta;
  - autor, contadores, status e selo de especialista são preenchidos pelo banco (cliente não forja);
  - curtida dupla bloqueada; dono só altera o próprio feedback;
  - excluir a conta apaga tudo em cascata.
- Backups: o plano gratuito do Supabase **não** tem backup diário recuperável pelo painel. Antes de ter usuários reais: plano Pro (backups diários) ou `pg_dump` agendado. ☐ pendente

## Auth

- Convidado: sessão anônima automática no primeiro acesso (`components/auth-bootstrap.tsx`).
- Conta: e-mail com código de 6 dígitos ou link (sem senha). O convidado liga o e-mail à mesma conta e o histórico vai junto (`updateUser` + `email_change`).
- Sessão em cookies http-only, renovada no `proxy.ts`. "Sair de todos os aparelhos" usa `signOut({ scope: "global" })`.
- Papéis: farmer, expert, moderator, admin (`profiles.role`), só alterável com service role. Selo de especialista exige `experts.verified_at`.
- Excluir conta (`POST /api/conta/excluir`): apaga as fotos dos dois buckets e o usuário; o banco apaga o resto.

## Diagnóstico

- `POST /api/diagnoses` (multipart): valida com zod, confere os bytes do arquivo (JPEG/WebP), aceita até 5 MB, limita 30 envios por hora por IP e `DAILY_DIAGNOSIS_LIMIT` por usuário por dia (contado no banco, dia de Brasília).
- Idempotente pelo id gerado no celular: um reenvio da fila devolve o resultado salvo, sem chamar o modelo de novo.
- Claude (`lib/server/claude-diagnose.ts`): checagens de planta, soja e qualidade da foto; responde só com slugs do catálogo; descarta slugs inventados; abaixo de 0,4 de probabilidade vira "não identificado". Quando os dois primeiros quase empatam, chama o modelo maior. Grava modelo, resposta bruta e latência.
- Sem chave: modo demonstração (marcado na tela).
- Testes: `tests/claude-diagnose.test.ts` (7 casos, com cliente falso). **Não testado contra a API real**: falta a sua chave. ☐ pendente
- **Antes de lançar:** medir o acerto com ~100 fotos rotuladas pela Agronomia. ☐ pendente

## Jobs

- `GET /api/cron/diario`, Vercel Cron às 08:00 UTC (05:00 em Brasília), protegido por `CRON_SECRET`. Idempotente por dia (`job_runs`); `?force=1` roda de novo.
- Passos: clima do Open-Meteo por município (3 tentativas com espera crescente) → regras de alerta (clima dos próximos 5 dias + diagnósticos confirmados em 14 dias) → no máximo 1 aviso de alerta por pessoa por dia → push → limpeza de notificações com mais de 90 dias.
- Falhas vão para `job_failures` (dead-letter), com etapa e referência e sem dados pessoais. Assinaturas push que respondem 404/410 são removidas.
- Testes: `tests/alerts.test.ts` (7 casos).
- **As regras de alerta (limites de temperatura e chuva) são ponto de partida e precisam de revisão da Agronomia.** ☐ pendente

## Integrações

| integração | API | chave/escopo | revisão do provedor | limites |
| --- | --- | --- | --- | --- |
| Anthropic | Messages API (visão) | API key do Matheus | nenhuma | por organização; limite de gasto no console |
| Open-Meteo | `/v1/forecast` | nenhuma | nenhuma | uso não comercial grátis (~10 mil chamadas/dia); 1 chamada por município por dia |
| Web Push | padrão VAPID | par de chaves próprio | nenhuma | entrega depende do navegador; iOS só com o app instalado na tela inicial |
| Supabase Auth e-mail | interno | — | — | limite baixo sem SMTP próprio (ver item 5) |
| Agrofit | link externo | — | — | sem API |

Nenhum endpoint do Plantix ou do Agrio é usado.

## Checklist de segurança

- [x] segredos só em variáveis de ambiente; `.env` e `.env*.local` no `.gitignore`; `server-only` nos módulos com segredo; grep no bundle do cliente: 0 ocorrências
- [x] validação com zod em todas as rotas e server actions (diagnóstico, push, clima, comunidade, exclusão)
- [x] autorização em toda leitura e escrita (RLS + permissões por coluna), testada com segundo usuário e convidado
- [x] limites de envio: diagnóstico (IP e diário por usuário), exclusão de conta; login por e-mail limitado pelo Supabase Auth
- [x] webhooks: não há webhooks de entrada; o cron é protegido por segredo
- [x] uploads: 5 MB, só JPEG/WebP conferido pelos bytes, buckets separados (fotos de diagnóstico privadas, pasta por usuário)
- [x] sem dados pessoais em URLs ou logs (o log de erro do diagnóstico registra só o tipo de erro)
- [x] `npm audit`: 0 vulnerabilidades
- [x] política de privacidade lista todos os processadores (`/privacidade`)
- [ ] SMTP próprio antes de abrir para o público
- [ ] backups diários (plano Pro ou `pg_dump` agendado)
- [ ] teste de ponta a ponta contra o projeto real, depois de criado
