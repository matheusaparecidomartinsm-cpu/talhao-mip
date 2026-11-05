# Plano de testes — Talhão

Alvo: o **clone** rodando localmente (`npm run build && npx next start -p 3100`) com dados semente, no modo sem servidor.
Regras de acesso do banco: `scripts/db-test.sh`. Módulos de diagnóstico e alertas: `tests/*.test.ts`. Nada é executado contra o Plantix.

Toda spec falha em: erro de console, resposta 5xx, violação de acessibilidade **séria ou crítica** (axe, WCAG 2.1 A/AA) em cada tela visitada.
Legenda: **auto** = automatizado em `e2e/`, **db** = `scripts/db-test.sh`, **unit** = `tests/`, **manual** = checklist no fim.

## F01 Diagnosticar uma planta (loop central) — `e2e/f01-diagnostico.spec.ts`

| caso | passos | esperado | como |
| --- | --- | --- | --- |
| F01-H1 | Início → câmera → escolher foto de folha com manchas | resultado com nome, confiança em palavras e %, manejo e link para a ficha, em ≤ 3 toques | auto |
| F01-H2 | no resultado → "Bateu" | feedback marcado e mantido ao recarregar | auto |
| F01-E1 | foto escura | aviso "A foto ficou escura" antes de enviar; "Enviar assim mesmo" segue | auto |
| F01-E2 | foto que não é imagem (arquivo .txt renomeado) | mensagem de erro, sem tela quebrada | auto |
| F01-E3 | sem internet | "Foto guardada na fila"; ao voltar a rede, faixa "Pronto!" e resultado abre | auto |
| F01-E4 | rede lenta (API demora 6 s) | tela "Analisando" continua viva; resultado chega | auto |
| F01-E5 | recarregar a página no meio da análise | a análise termina e o resultado aparece (fila retoma) | auto |
| F01-E6 | voltar (botão do navegador) no meio da análise | nada trava; o resultado fica no histórico | auto |
| F01-E7 | duas abas enviando a mesma fila | cada diagnóstico é analisado uma vez só | auto |
| F01-E8 | 390 px e 1440 px | sem rolagem horizontal | auto |
| F01-E9 | só teclado | chega ao botão da câmera e à galeria; foco visível | auto |
| F01-N1 | servidor devolve erro 502 | estado "Não conseguimos analisar agora" + "Tentar de novo" funciona | auto |
| F01-N2 | abrir `/diagnostico/<id inexistente>` | "Diagnóstico não encontrado" | auto |
| F01-N3 | limite de envios (31 em 1 h) | 429 com mensagem clara, item marcado como falhou com o motivo | auto (API) |
| F01-N4 | diagnóstico de outro usuário | invisível (RLS) | db |
| F01-N5 | modelo responde slug inventado / JSON quebrado | descartado → "não identificado" | unit |

## F02 Primeira abertura — `e2e/f02-onboarding.spec.ts`

| caso | passos | esperado | como |
| --- | --- | --- | --- |
| F02-H1 | abrir app novo → Começar → Soja → município → Entrar | Início com município e alertas da região | auto |
| F02-E1 | desmarcar todas as culturas | Continuar bloqueado + mensagem | auto |
| F02-E2 | pular município | Início mostra "Informe seu município" | auto |
| F02-E3 | Voltar entre passos | estado mantido | auto |
| F02-E4 | recarregar no passo 2 | não quebra (volta ao passo 1) | auto |
| F02-E5 | abrir `/` já com perfil | não volta para boas-vindas | auto |

## F03 Perguntar à comunidade — `e2e/f03-comunidade.spec.ts`

| caso | passos | esperado | como |
| --- | --- | --- | --- |
| F03-H1 | resultado → "Não bateu" → perguntar → título → publicar | pergunta aberta com a foto do diagnóstico | auto |
| F03-H2 | responder uma pergunta | resposta aparece na lista | auto |
| F03-E1 | título vazio / 4 letras | erro no campo, nada publicado | auto |
| F03-E2 | título com 160 caracteres, acentos e emoji 🌱🐛 | aceito até 140; sem quebrar layout | auto |
| F03-E3 | duplo clique em Publicar | uma pergunta só | auto |
| F03-E4 | marcar resposta como útil 2× | volta ao número original | auto |
| F03-N1 | abrir pergunta inexistente | "Pergunta não encontrada" | auto |
| F03-N2 | convidado anônimo tenta postar (com servidor) | pedido de criar conta | db + manual |
| F03-N3 | postar em nome de outro / forjar contadores e selo | bloqueado pelo banco | db |

## F04 Biblioteca — `e2e/f04-biblioteca.spec.ts`

| caso | passos | esperado | como |
| --- | --- | --- | --- |
| F04-H1 | Biblioteca → Soja → filtro Inseto → ficha | só insetos; ficha com sintomas, manejo e aviso de receituário | auto |
| F04-H2 | busca "ferrugem" e "PERCEVEJO" e "acaro" (sem acento) | encontra | auto |
| F04-E1 | busca sem resultado | mensagem clara | auto |
| F04-E2 | offline, ficha nunca aberta | abre do cache | auto |
| F04-E3 | accordion só com teclado | abre e fecha com Enter | auto |
| F04-N1 | ficha inexistente / cultura inativa | página 404 própria | auto |

## F05 Alertas e clima — `e2e/f05-alertas-clima.spec.ts`

| caso | passos | esperado | como |
| --- | --- | --- | --- |
| F05-H1 | Início → alerta → ficha | alerta da região com motivo → ficha do problema | auto |
| F05-H2 | Clima | 7 dias, janela de pulverização, tabela com cabeçalhos | auto |
| F05-E1 | sem município | estado vazio com ação | auto |
| F05-E2 | `/api/clima` com município inválido | 400 | auto (API) |
| F05-E3 | job diário 2× no mesmo dia, 1 aviso por pessoa | idempotente | unit + manual (precisa do banco) |
| F05-E4 | fuso: 23h30 em Brasília conta como "hoje" | dia certo | unit |
| F05-N1 | cron sem segredo | 401 | auto (API) |

## F06 Plano da lavoura — `e2e/f06-f07-cultivo.spec.ts`

| caso | passos | esperado | como |
| --- | --- | --- | --- |
| F06-H1 | data de semeadura há 68 dias | fase R3, "monitorar agora" com links | auto |
| F06-E1 | data no futuro | erro, não salva | auto |
| F06-E2 | data vazia | estado "Sem data de semeadura" | auto |
| F06-E3 | data de 200 dias atrás | última fase (R7), sem quebrar | auto |

## F07 Calculadora de adubo — `e2e/f06-f07-cultivo.spec.ts`

| caso | passos | esperado | como |
| --- | --- | --- | --- |
| F07-H1 | 10 ha | P₂O₅ 600–1.000 kg, K₂O 600–1.200 kg | auto |
| F07-H2 | 2 alqueires | convertido para 4,84 ha | auto |
| F07-E1 | "12,5" com vírgula | aceito | auto |
| F07-E2 | 0, negativo, letras | erro no campo, total "—" | auto |

## Conta e privacidade — `e2e/conta.spec.ts`

| caso | passos | esperado | como |
| --- | --- | --- | --- |
| C-H1 | Perfil → mudar nome e município | salvo e refletido no Início | auto |
| C-H2 | Apagar meus dados | volta às boas-vindas; histórico vazio | auto |
| C-E1 | nome com 60+ caracteres | truncado sem quebrar | auto |
| C-N1 | segundo usuário não vê nada do primeiro | RLS | db |
| C-N2 | excluir conta apaga tudo em cascata | db |

## Manual (precisa do projeto Supabase real e de chaves)

- [ ] M1 Código de 6 dígitos chega no e-mail, em português, e entra
- [ ] M2 Convidado com 2 diagnósticos cria conta → diagnósticos continuam no histórico
- [ ] M3 Sair de todos os aparelhos derruba a sessão em outro navegador
- [ ] M4 Excluir conta remove as fotos do bucket (conferir no painel)
- [ ] M5 Diagnóstico real com Claude em 5 fotos de campo (ferrugem, percevejo, lagarta, folha sadia, foto de milho)
- [ ] M6 Push chega no Android com o app instalado; tocar abre o alerta
- [ ] M7 Cron `?force=1` com `CRON_SECRET` grava `job_runs` e não duplica alerta
- [ ] M8 Leitor de tela (TalkBack) no fluxo F01
