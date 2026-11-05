# Deploy — Glyma

Data: 05/11/2026 · Branch: `clone-plantix` (repo `matheusaparecidomartinsm-cpu/talhao-mip`) · **Versão de teste no ar; produção intocada** (ver "Decisão").

## 1. Checagens (preflight)

| checagem | comando | resultado |
| --- | --- | --- |
| ponta a ponta | `npx playwright test` | ✅ 62 passaram, 0 falharam |
| unidade | `npm run test:unit` | ✅ 14 passaram |
| regras de acesso do banco | `./scripts/db-test.sh` | ✅ todas passaram (inclui lista do teste) |
| build de produção | `npm run build` | ✅ compila |
| dependências | `npm audit --omit=dev` | ✅ 0 vulnerabilidades |
| varredura de marca | `python3 replica/tools/sweep.py . --config replica/brand.json` | ✅ LIMPO |
| texto da loja | `python3 replica/tools/listing.py replica/launch/listing.json` | ✅ 0 erros, 0 avisos |
| paridade | `python3 replica/tools/parity.py replica/features.csv` | ❌ **88,4%, must-haves 8 de 11: não lançável** |
| bugs S1/S2 abertos | `replica/bugs.md` | ✅ nenhum (B01 e B02 corrigidos; só B08, S4, aberto) |
| política de privacidade (lista os processadores) | `/privacidade` | ✅ Supabase, Vercel (+ Web Analytics), Anthropic, Open-Meteo, serviço de push |
| termos de uso | `/termos` | ✅ criados hoje (texto inicial; revisar com orientação jurídica antes do público) |
| aviso de cookies | — | ✅ não precisa: só cookies de sessão (essenciais) e analytics sem cookies |
| excluir conta funciona | `db-test.sh` + `POST /api/conta/excluir` | ✅ no banco local (cascata testada); ☐ conferir no projeto real |
| favicon, títulos, imagem de compartilhamento | olho | ✅ vagem roxa, "· Glyma", `opengraph-image.png` 1200×630 (provisória até o logo final) |

### O que bloqueia a produção

Os 3 must-haves parciais:

1. **Diagnóstico por foto:** o código com o Claude está pronto e testado com cliente falso, mas sem a chave da Anthropic o app roda em modo demonstração. Falta medir o acerto.
2. **Biblioteca por cultura** e 3. **Seleção da cultura:** parciais só porque o escopo é "só soja". Decidir se milho e trigo ficam como `skip` (escopo) ou entram.

Além disso, o plano de lançamento exige a **fila de especialistas (E1)** antes de prometer "um especialista olha junto" em público.

## 2. Serviços de produção

| serviço | estado | quem faz |
| --- | --- | --- |
| Supabase **projeto novo `talhao`/`glyma`**, região São Paulo, separado do projeto da ProFood | ☐ **não criado** (só existe o projeto da ProFood, que **não** deve ser usado) | Matheus cria; eu aplico as 2 migrações e o seed pelo conector |
| backups do banco | ☐ plano gratuito não tem backup diário recuperável; Pro ou `pg_dump` agendado | Matheus decide |
| migrações | `supabase/migrations/` (init + waitlist), aplicadas por comando, não à mão | eu, depois de criado |
| chave da Anthropic com limite de gasto | ☐ | Matheus |
| login anônimo + e-mail ligados no Supabase Auth; Site URL e Redirect URLs | ☐ | Matheus (passo a passo em `backend.md`) |
| modelos de e-mail em português | prontos em `supabase/templates/` | Matheus cola no painel |
| e-mail próprio (SMTP via Resend, domínio verificado) | ☐ antes do público | Matheus |
| Stripe | não se aplica (app grátis) | — |
| OAuth (Google etc.) | não se aplica (só e-mail com código) | — |

Variáveis na Vercel, só no ambiente **Production** (nomes em `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_MODEL_STRONG`, `DAILY_DIAGNOSIS_LIMIT`, `CRON_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Sem elas, o app funciona em modo local (dados no aparelho, diagnóstico de demonstração).

## 3. Hospedagem e domínio

- **Vercel, projeto `talhao-mip`** (já existe, ligado ao GitHub). A produção hoje (`talhao-mip.vercel.app`) serve o **protótipo antigo** a partir da `main`.
- Proteção do projeto: **Vercel Authentication** ligada (`all_except_custom_domains`). As versões de teste só abrem para quem estiver logado na sua conta da Vercel.
- O projeto está como "Other" (site estático). Para não quebrar a produção atual, o `vercel.json` **da branch** declara `"framework": "nextjs"`, sem mexer nas configurações do projeto.
- Cron diário `0 8 * * *` (05:00 em Brasília) declarado no `vercel.json`. No plano Hobby, cron roda 1×/dia, o que é o necessário.

Domínio (depois que você registrar `glyma.com.br` ou `glyma.app.br` no Registro.br):

| registro | nome | valor |
| --- | --- | --- |
| A | @ | IP mostrado pela Vercel em *Settings → Domains* ao adicionar o domínio |
| CNAME | www | `cname.vercel-dns.com` |
| TXT | (se a Vercel pedir) | valor de verificação mostrado na tela |

Canônico: `www` redireciona para o domínio sem www (a Vercel faz isso ao marcar o principal). HTTPS é automático.

E-mail (quando ligar o Resend): os registros SPF (TXT), DKIM (CNAME/TXT) e MX de retorno que o Resend mostrar, mais `TXT _dmarc` = `v=DMARC1; p=none; rua=mailto:SEU-EMAIL` e, depois de uma semana de relatórios limpos, `p=quarantine`.

## 4. Acompanhar

| o quê | como | estado |
| --- | --- | --- |
| erros | logs da Vercel (Runtime Logs) + `job_failures` no banco | pronto ao publicar |
| analytics | Vercel Web Analytics (sem cookies), só ativo na Vercel | pronto; ligar em *Analytics* no painel |
| disponibilidade | monitor externo grátis (ex.: UptimeRobot) em `/` e `/api/clima?m=Cascavel` a cada 5 min, alerta no seu e-mail | ☐ Matheus cria a conta |
| job diário | `job_runs` (status ok/partial/failed por dia) | pronto |
| custo do modelo | painel da Anthropic + limite de gasto | ☐ |

Primeira semana: % de "não identificado", % de "bateu", latência do diagnóstico, falhas do job, 429 de limite diário (se aparecer muito, o limite está baixo).

## 5. Celular

Sem app nativo. Android: publicar o PWA na Play como Trusted Web Activity (Bubblewrap ou PWABuilder) **depois** do beta, com conta de desenvolvedor Google (US$ 25, uma vez, no nome do Matheus) e o `listing.json`. iPhone: pelo Safari, "Adicionar à Tela de Início".

## Decisão e resultado

Produção **não** foi ao ar: a checagem de paridade falhou (must-haves 8/11). Com o ok do Matheus (05/11/2026), a branch foi enviada ao GitHub e a Vercel gerou uma **versão de teste**, que só abre logado na conta da Vercel:

- **Link fixo da branch:** https://talhao-mip-git-clone-plantix-matheus-f340.vercel.app (sempre aponta para o último commit da branch)
- Último deploy: `dpl_2dR8zYz6AiJUo6DTJDb8Cyw9jfxR`, commit `de52368`, estado READY
- Produção (`talhao-mip.vercel.app`): continua com o protótipo antigo (commit `d5a2eb5` da `main`), sem alteração
- Conferido no ar: `/sobre`, `/biblioteca/soja/ferrugem-asiatica` e `/api/clima?m=Cascavel` respondem 200, com título e cor da marca; **0 erros de execução** na Vercel na última hora
- Modo: local (sem Supabase e sem chave da Anthropic). Dados ficam no aparelho e o diagnóstico é de demonstração
- Corrigido depois do primeiro deploy: título da página `/sobre` repetia "Glyma"

### Para virar produção

1. Os itens bloqueados da seção 1 (diagnóstico real com acerto medido, decisão de escopo, fila de especialistas)
2. Supabase novo + variáveis no ambiente Production da Vercel
3. Abrir um pull request de `clone-plantix` para `main`. Ao juntar, a produção passa a ser o Glyma no lugar do protótipo (o protótipo continua em `/prototipo/index.html`)
4. Domínio próprio com os registros da seção 3

### Primeira semana depois de ir para produção

Runtime Logs e erros da Vercel todo dia; `job_runs` (o job das 5h rodou?); % de "não identificado" e de "bateu"; latência do diagnóstico; quantos 429 de limite diário; custo no painel da Anthropic.
