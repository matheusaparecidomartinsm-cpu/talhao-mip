# Bugs — Talhão

Encontrados pela suíte `e2e/` (Playwright + axe) contra o clone local. Só entra aqui o que foi reproduzido.
Todos os corrigidos têm o teste que falhava antes do conserto, mantido na suíte. Commit do conserto: `a8855cb`.

| ID | sev. | título | status |
| --- | --- | --- | --- |
| B01 | S2 | Arquivo que não é imagem quebra a câmera sem mensagem | corrigido `a8855cb` |
| B02 | S2 | Duas abas abertas analisam a mesma foto duas vezes | corrigido `a8855cb` |
| B03 | S3 | Quem sai da tela de análise não é avisado de que o resultado ficou pronto | corrigido `a8855cb` |
| B04 | S3 | Horário do alerta não lido com contraste insuficiente | corrigido `a8855cb` |
| B05 | S3 | Nome acessível do alerta diferente do texto visível | corrigido `a8855cb` |
| B06 | S3 | Miniaturas decorativas anunciadas como imagem sem descrição | corrigido `a8855cb` |
| B07 | S3 | Tabela do clima e carrossel do resultado roláveis sem foco pelo teclado | corrigido `a8855cb` |
| B08 | S4 | Botão da câmera cobre o controle de alertas no Perfil em certa posição da rolagem | **aberto** |

---

### B01 · S2 · Arquivo que não é imagem quebra a câmera sem mensagem
- **Passos:** Câmera → "Escolher foto" → escolher um arquivo `.jpg` que na verdade é texto.
- **Esperado:** mensagem dizendo que o arquivo não é uma foto; poder escolher outro.
- **Obtido:** exceção não tratada (`The source image could not be decoded`), nenhuma mensagem na tela.
- **Evidência:** `F01-E2` falhava com `pageerror`. **Conserto:** `prepareImage` dentro de try/catch, mensagem com `role="alert"`.

### B02 · S2 · Duas abas abertas analisam a mesma foto duas vezes
- **Passos:** tirar a foto sem internet (vai para a fila), abrir uma segunda aba, voltar a internet.
- **Esperado:** 1 envio para `/api/diagnoses`.
- **Obtido:** 2 envios. Cada aba tinha a própria trava, então as duas processavam a fila. Com o Claude ligado, a mesma foto seria cobrada duas vezes.
- **Evidência:** `F01-E7` contava `posts = 2`. **Conserto:** Web Locks (`navigator.locks`, uma aba por vez) e nova leitura do status antes de cada envio.

### B03 · S3 · Resultado pronto sem aviso para quem saiu da tela de análise
- **Passos:** enviar a foto, sair da tela "Analisando…" antes de terminar (voltar ou ir para outra aba do app).
- **Esperado:** a faixa "Pronto! Toque para ver o resultado" aparece.
- **Obtido:** a faixa não aparecia, porque a câmera marcava o diagnóstico como visto já no envio. O resultado só podia ser achado no histórico.
- **Evidência:** `F01-E5`. **Conserto:** o diagnóstico só é marcado como visto quando a tela de resultado abre.

### B04 · S3 · Contraste do horário no alerta não lido
- **Passos:** abrir o Início com município que tem alerta de risco alto.
- **Esperado:** contraste de pelo menos 4,5:1.
- **Obtido:** `text-subtle` sobre `danger-soft` abaixo do mínimo (axe `color-contrast`, sério).
- **Conserto:** horário em `text-muted`. Pares `text-muted`/`text-subtle` sobre fundos coloridos adicionados ao `tokens.json` e conferidos pelo `contrast.py` (0 falhas).

### B05 · S3 · Nome acessível do alerta diferente do texto visível
- **Obtido:** o link tinha um `aria-label` que não continha o texto que aparece na tela (axe `label-content-name-mismatch`). Quem usa comando de voz não conseguia acionar o link pelo que lia.
- **Conserto:** `aria-label` removido; município acrescentado em texto só para leitor de tela.

### B06 · S3 · Miniaturas decorativas anunciadas como imagem sem descrição
- **Obtido:** `role="img"` com `aria-label=""` nas listas da biblioteca e dos alertas (axe `role-img-alt`).
- **Conserto:** sem descrição, a miniatura vira `aria-hidden`.

### B07 · S3 · Regiões roláveis sem foco pelo teclado
- **Obtido:** quem usa só o teclado não conseguia rolar a tabela de 7 dias do clima nem o carrossel de fotos do resultado (axe `scrollable-region-focusable`).
- **Conserto:** `tabIndex=0`, `role="region"` e rótulo nos dois.

### B08 · S4 · Botão da câmera sobre o controle de alertas (aberto)
- **Passos:** Perfil a 390 px, rolar até "Alertas de doença na região" ficar perto do rodapé.
- **Obtido:** o botão flutuante da câmera cobre o interruptor. Para contornar, basta rolar mais um pouco.
- **Evidência:** `replica/clone-screens/S18.png`.
- **Sugestão:** esconder o botão flutuante no Perfil (a câmera continua no Início), ou deixar margem à direita nos controles que ficam no fim da linha.

---

## Para conferir (não reproduzido como bug)

- Sem internet, o navegador registra `net::ERR_FAILED` nas requisições internas que o Next faz para adiantar páginas. É comportamento esperado offline e não afeta o que a pessoa vê. Por precaução, o service worker agora só devolve o Início guardado para navegação de página, nunca para essas requisições internas.
- O campo de data mostra o formato do idioma do navegador (o teste em `en-US` mostrou mm/dd/aaaa). Em celular configurado em português deve aparecer dd/mm/aaaa. Conferir num Android real.
- Modo com servidor (Supabase) e diagnóstico com o Claude de verdade ainda não foram testados de ponta a ponta: falta o projeto e a chave. Ver itens M1–M8 do `test-plan.md`.
- Push no iPhone só funciona com o app instalado na tela inicial (limitação do iOS).
