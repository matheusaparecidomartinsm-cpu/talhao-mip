# Componentes — Talhão

Referência visual: prints do **Agrio** em `replica/screens/agrio-01..08.png` (só referência, nunca vão pro app).
Do Agrio vem o **sistema**: tinta escura nos títulos, um verde de ação, fundo branco, alertas em linha com ícone, accordion de tratamentos, FAB de câmera, faixa de processamento embaixo.
**Não vêm:** logo, robô mascote ("Harvie"), ilustrações de planta/mão, fotos, textos, o azul-petróleo `#00486C` e o verde `#7ED320` deles. As cores são as do Talhão (mata `#173A2A`, broto, âmbar, urucum), os ícones são do **Lucide** (licença ISC) e os textos são todos novos.

Regras gerais
- Toda cor vem de token (`bg-surface`, `text-muted`, `border-input`). Nunca hex no componente.
- Alvo de toque **mínimo 48 px** (uso no campo, sol forte, dedo sujo).
- Foco visível em tudo que é interativo: anel de 2 px `focus` + 2 px de respiro (`outline-offset`).
- Texto mínimo 14 px; corpo 16 px. Nada de cinza claro em texto (`text-subtle` é o mais claro permitido).
- Base acessível: **Radix UI** (Accordion, Dialog, Tabs, Toast, Toggle Group) com estilo próprio via Tailwind.

IDs de tela (S01–S19) são os do `replica/recon.md`.

---

## Botão
```
variants  primary (bg accent / on-accent), secondary (surface, borda border-strong, texto ink),
          ghost (sem borda, texto accent), danger (bg danger / on-danger)
sizes     sm 36px · md 48px (padrão) · lg 56px (CTA de tela cheia)
states    default, hover (accent-hover), active (scale .98), focus-visible (anel focus),
          disabled (opacidade .45, cursor not-allowed, sem hover), loading (spinner + label mantida)
tokens    radius md, font md/600, padding x 20px, gap ícone 8px
a11y      <button> real; loading → aria-busy="true" e label continua no DOM; ícone sozinho exige aria-label
used on   S01, S02, S06, S07, S11, S12, S16, S18
```

## FAB da câmera
```
o quê     botão redondo flutuante, ícone Lucide "camera", canto inferior direito acima da barra de abas
size      64px (alvo), ícone 28px
states    default (bg accent, shadow fab), pressed, focus-visible, desabilitado offline? NÃO — offline continua ativo (foto vai pra fila)
tokens    bg accent, text on-accent, radius full, shadow fab
a11y      <button aria-label="Diagnosticar com foto">; atalho teclado nenhum
used on   S03, S09, S10, S13 (some em S04–S07)
```

## Barra de abas inferior
```
itens     Início · Comunidade · [espaço do FAB] · Biblioteca · Perfil (ícones Lucide house, users, book-open, user)
height    64px + safe-area-inset-bottom
states    ativa (ícone e rótulo ink, barra de 3px accent-bright em cima), inativa (text-muted), badge (ponto danger com número)
a11y      <nav aria-label="Principal">, links com aria-current="page"; badge lido como "3 respostas novas"
used on   todas as telas de nível 1
```

## Barra do app (topo)
```
conteúdo  título da tela (font xl/700, ink) ou nome do app; à direita ícone de alertas (sino) com badge
height    56px, fundo bg, borda inferior border
variante  "voltar" (seta à esquerda, título centralizado) em telas de nível 2
a11y      <header>; o título é o <h1> da página
used on   todas
```

## Chip de cultura
```
variants  selecionável (S02 onboarding, grade), filtro (pílula compacta), estático (rótulo)
states    não selecionado (surface, borda border), selecionado (accent-soft, borda accent, check), focus, disabled
tokens    radius full (pílula) / lg (cartão da grade), font sm/600, min-height 40px (pílula) / 96px (grade)
a11y      grupo = role="group" + checkboxes visuais (aria-pressed nos toggles); pílula de filtro = radio group
used on   S02, S03, S04, S10, S16
```

## Grade de culturas
```
o quê     2–3 colunas de cartões com ícone próprio + nome; campo de busca no topo
states    filtrada, vazia ("Nenhuma cultura com esse nome")
used on   S02, S08
```

## Badge de tipo de agente
```
variants  fungo, bacteria, virus, nematoide, inseto, acaro, deficiencia, outro (tokens agent.*.bg / agent.*.fg)
size      altura 24px, font xs/600, padding x 8px, radius full; ícone 14px opcional
regra     a cor nunca é a única pista: o rótulo sempre aparece ("Fungo")
used on   S06, S07, S09, S13
```

## Frase de confiança + barra de probabilidade
```
o quê     padrão visto na referência: o resultado fala a confiança em palavras antes do nome
          ≥ 0.75 "Muito provável"  ·  0.50–0.74 "Provável"  ·  0.40–0.49 "Possível"  ·  < 0.40 → estado não identificado
          (textos nossos; nada do tipo "estamos muito confiantes")
barra     4px de altura, trilho surface-sunken, preenchimento accent (alto) / warning-strong (médio)
a11y      <meter min=0 max=1 value=…> com aria-label "Probabilidade 82%"; o número aparece em texto também
used on   S06
```

## Carrossel de fotos
```
o quê     a foto do usuário primeiro, depois fotos de exemplo do problema; deslizar na horizontal com pontos
size      proporção 4:3, radius md, gap 8px; a próxima foto aparece cortada (mostra que dá pra deslizar)
states    carregando (skeleton surface-sunken), erro (ícone image-off + "Foto indisponível")
a11y      scroll-snap nativo; pontos são botões "Foto 2 de 4"; cada foto com alt ("Sua foto" / "Exemplo: ferrugem asiática em folha")
used on   S06, S07, S12
```

## Card de problema
```
layout    miniatura 64px (radius sm) · nome (md/600) · nome científico (sm itálico, text-muted) · badge de agente
variants  lista (S09), resultado com probabilidade (S06), compacto (S13)
states    default, pressed (surface-sunken), skeleton
a11y      card inteiro é um <a>; só um alvo por card
used on   S06, S09, S13
```

## Accordion de tratamento
```
itens     Controle cultural · Controle biológico · Controle químico · Prevenção — cada um com ícone Lucide
          (sprout, bug, flask-conical, shield-check) em accent
item      linha de 56px, título md/600 ink, chevron à direita que gira 180°; conteúdo com padding 16px
states    fechado, aberto, focus-visible
regra     controle químico mostra ingrediente ativo + grupo FRAC/IRAC + link Agrofit, NUNCA dose;
          rodapé fixo: "Aplicação de defensivo exige receituário agronômico."
a11y      Radix Accordion (type="multiple"); cabeçalho é <button aria-expanded>; setas ↑↓ navegam entre itens
used on   S07
```

## Linha de alerta
```
layout    quadrado 48px com ícone triangle-alert (danger sobre danger-soft) · título "Ferrugem asiática" (md/600)
          · motivo em 1 linha com reticências (sm, text-muted) · tempo relativo à direita (xs, text-subtle)
states    não lido (fundo danger-soft), lido (fundo bg), risco médio (ícone warning sobre warning-soft)
a11y      <a> com texto completo no aria-label ("Risco alto de ferrugem asiática em Cascavel, há 2 horas")
used on   S03 (card), S13
```

## Cartão de alerta (destaque)
```
o quê     versão grande do alerta que aparece no topo do início ou ao abrir a notificação
layout    ícone + título · texto de 2–3 linhas · miniatura do problema + nome · ações "Ver ficha" e "Ver clima"
tokens    surface, borda 1px border-strong, radius md, shadow pop
used on   S03, S13
```

## Faixa de processamento (fila de fotos)
```
o quê     faixa fixa acima da barra de abas, como na referência: miniatura da foto + texto + chevron para expandir
textos    "Analisando sua foto…" · "2 fotos na fila — enviamos quando voltar o sinal" · "Pronto! Toque para ver"
tokens    bg surface-inverse, text text-inverse, barra de progresso fina accent-bright no topo, radius md em cima
states    analisando, na fila (offline), pronto, falhou ("Toque para tentar de novo")
a11y      role="status" aria-live="polite"; expandido vira lista de itens da fila
used on   todas as telas de nível 1 quando há item na fila
```

## Visor de câmera
```
o quê     vídeo em tela cheia, moldura-guia com cantos, dica curta em cima ("Uma folha, de perto, com luz do dia")
controles disparo 72px no centro, galeria à esquerda, seletor de cultura (chip) no topo, fechar à direita
states    sem permissão (tela com explicação + botão abrir ajustes), foto escura (aviso antes de enviar), processando
a11y      disparo com aria-label "Tirar foto"; alternativa sempre visível: <input type="file" accept="image/*" capture="environment">
used on   S04
```

## Indicador de análise
```
o quê     prévia da foto escurecida + spinner + texto que troca: "Conferindo a foto" → "Procurando sintomas" → "Montando o resultado"
regra     se passar de 8 s, mostra "Está demorando. Pode sair que avisamos." e libera a navegação (vira faixa de processamento)
a11y      role="status"; reduced-motion: spinner parado, só texto
used on   S05
```

## Estado não identificado
```
o quê     quando a probabilidade é baixa, a foto é ruim, não é planta ou não é soja
conteúdo  ícone (scan-search) · título honesto ("Não conseguimos identificar") · motivo · 3 dicas de foto
ações     "Tirar outra foto" (primário) · "Perguntar à comunidade" (secundário, já leva a foto) · "Ver a biblioteca" (ghost)
used on   S06
```

## Card de pergunta (comunidade)
```
layout    miniatura 56px · cultura (sm/600) · título (md, 2 linhas) · nº de respostas (ícone message-circle) · tempo relativo
variants  normal, com resposta nova (fundo success-soft + "1 resposta nova" em success, como na referência), com especialista (selo)
a11y      card = <a>; contagem lida por extenso
used on   S10, S17
```

## Resposta
```
layout    avatar com iniciais (32px, accent-soft/ink) · nome · selo "Especialista" (badge accent-soft/accent) · texto · ações
ações     útil (thumbs-up + número, pílula com borda) · responder · denunciar (menu ⋯)
states    útil marcado (fundo accent-soft, borda accent)
a11y      botão útil com aria-pressed e "Marcar como útil, 4 pessoas acharam útil"
used on   S12
```

## Previsão do tempo
```
diária    faixa horizontal de 5–7 colunas: dia, ícone (Lucide cloud-rain, sun, cloud-sun), mín/máx, barra de chuva (info) com mm
          hoje destacado com fundo info-soft
pulverização linha abaixo de cada dia: "Bom" (success) / "Evitar" (danger) + motivo ("vento 18 km/h", "chuva")
horária   lista de 3 em 3 horas com umidade e vento
a11y      tabela real (<table>) com cabeçalhos; cor nunca sozinha ("Bom para pulverizar")
used on   S03 (resumo), S14
```

## Linha do tempo de estádios
```
o quê     inspirado no cartão de fases da praga da referência: passos horizontais com bolinha + rótulo + dias
uso       estádios da soja (VE, V3, R1, R3, R5, R7) com a fase atual em accent e "o que monitorar agora" embaixo
states    passado (accent-bright), atual (accent, anel), futuro (border)
a11y      <ol> com aria-current="step"
used on   S15
```

## Calendário de manejo
```
o quê     mês com pontos nos dias que têm aplicação/monitoramento; abaixo, lista do dia selecionado
          (padrão visto na referência — "calendário de intervenções")
states    hoje (anel accent), selecionado (bg accent, on-accent), com evento (ponto 6px), fora do mês (text-subtle)
a11y      grade com role="grid", setas navegam entre dias, Enter seleciona
used on   S15 (could)
```

## Campo de texto / área de texto
```
states    default (borda border-input), focus (anel focus), erro (borda danger + mensagem danger com ícone), disabled, só leitura
tokens    height 48px, radius md, font md, label sm/600 acima, ajuda xs text-muted abaixo, contador à direita na área de texto
a11y      <label for>; erro ligado por aria-describedby e aria-invalid
used on   S11, S12, S16, S18
```

## Campo numérico com unidade
```
o quê     área + seletor de unidade (ha | alqueire paranaense | m²) colado à direita
a11y      inputmode="decimal"; aceita vírgula
used on   S16
```

## Upload de foto
```
variants  câmera, galeria; até 4 fotos (comunidade)
states    vazio (tracejado border-strong + ícone image-plus), enviando (progresso), erro (danger, tentar de novo), com fotos (miniaturas com ×)
used on   S04, S11
```

## Filtro em pílulas
```
o quê     linha rolável na horizontal (Todos, Fungo, Inseto, Bactéria, Vírus, Ácaro, Deficiência)
states    ativo (bg ink, text-inverse), inativo (surface, borda border)
a11y      role="radiogroup" ou Toggle Group do Radix
used on   S09, S10
```

## Abas no topo
```
o quê     como na referência (Início / Comunidade com sublinhado verde) — usado dentro de telas, não na navegação principal
tokens    altura 48px, rótulo sm/600, ativa: texto ink + barra 3px accent-bright
a11y      Radix Tabs
used on   S07 (Ficha / Fotos / Perguntas), S13 (Alertas / Notificações)
```

## Estado vazio
```
conteúdo  ícone grande em círculo accent-soft (sem ilustração copiada) · título · 1 frase · 1 ação
exemplos  S10 "Ainda ninguém perguntou sobre soja por aqui. Seja o primeiro."
          S13 "Nenhum alerta pra sua região. Olhamos todo dia às 5h."
          S17 "Seus diagnósticos aparecem aqui."
used on   S03, S10, S13, S17
```

## Toast
```
variants  sucesso, erro, info, offline
posição   acima da faixa de processamento/abas; some em 4 s (erro fica até fechar)
a11y      Radix Toast; role="status" (sucesso/info), role="alert" (erro)
used on   todas
```

## Banner offline
```
o quê     faixa fina no topo: "Sem internet. A biblioteca funciona; fotos vão pra fila." (warning sobre warning-soft)
a11y      role="status"
used on   todas
```

## Folha inferior (bottom sheet)
```
uso       escolher cultura (S04), compartilhar (S07), ações do post (S12)
tokens    surface, radius lg em cima, alça 4×36px border-strong, overlay
a11y      Radix Dialog; foco preso; Esc e toque fora fecham; volta o foco ao gatilho
```

## Diálogo de permissão
```
o quê     antes de pedir câmera/local/notificação ao navegador, uma tela nossa explica o porquê
          ("Usamos seu município para avisar de doença na região. Nunca o ponto exato.")
ações     "Permitir" (primário) · "Agora não" (ghost)
negado    instrução de como liberar nos ajustes do navegador
used on   S01, S04, S13
```

## Skeleton
```
o quê     blocos surface-sunken com brilho lento (desliga em reduced-motion)
used on   S06, S09, S10
```

---

## Padrões da referência que **não** entram agora

| padrão (Agrio) | decisão |
| --- | --- |
| Assistente de chat com mascote | fora do recon; mascote é deles. Possível depois como "pergunte à IA" sem personagem |
| Mapa de inspeção com trajeto e áudio | `could` — casa com o mapa de talhões do protótipo |
| Monitoramento por satélite (NDVI) | `skip` — exige processamento de imagens Sentinel, é outro projeto |
| Gráfico de graus-dia | `could` — útil pra lagartas; depende de dados de temperatura diária |
| Vitrine de produtos com preço | `skip` — sem venda (ver recon §8) |
