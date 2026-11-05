# Paridade — Talhão × Plantix

Data: 05/11/2026 · Escopo combinado no recon: **soja, Brasil, PWA**. Ferramentas: `replica/tools/parity.py` e `replica/tools/imgdiff.py` (reescritas porque não vieram com a skill, seguindo as mesmas regras).

## Veredito: **não lançável (ainda)**

- 3 dos 11 must-haves estão parciais. Dois são escolha de escopo (só soja): *biblioteca por cultura* e *seleção da cultura*. O terceiro é o que importa: **o diagnóstico ainda não roda com o modelo de verdade**. O código está pronto e testado; faltam o projeto Supabase, a chave da Anthropic e a medição do acerto.
- Bugs: nenhum S1 ou S2 aberto (1 S4 aberto, o B08).
- Funções: 88,4%, acima dos 80% exigidos. Com o diagnóstico real ligado e o escopo de culturas decidido, o clone fica **lançável**.

| número | valor | leitura |
| --- | ---: | --- |
| Paridade de funções (32 itens, pesos 3/2/1) | **88,4%** | o número que conta |
| Layout, média de 2 telas | 29,6% | baixa confiabilidade (ver abaixo) |
| Nota geral (80% funções + 20% layout) | 76,6% | puxada para baixo pela referência visual |


### Por área (mais fraca primeiro)
| área | nota | itens |
| --- | ---: | ---: |
| canais | 0% | 1 |
| tratamento | 50% | 1 |
| diagnóstico | 81% | 8 |
| onboarding | 86% | 3 |
| biblioteca | 91% | 7 |
| alertas | 100% | 2 |
| clima | 100% | 1 |
| comunidade | 100% | 4 |
| conta | 100% | 2 |
| cultivo | 100% | 2 |
| início | 100% | 1 |

### Falta (ordem de construção)
| prioridade | funcionalidade | estado | nota |
| --- | --- | --- | --- |
| must | Biblioteca por cultura | partial | S08; MVP só soja; soja ativa; milho e trigo 'em breve' |
| must | Diagnóstico por foto (câmera) | partial | backend pronto com Claude visão (testado com cliente falso); vira yes quando a chave estiver configurada e o acerto for medido |
| must | Seleção da cultura antes do diagnóstico | partial | S04; no MVP só soja (pré-selecionada); fixo em soja (única cultura ativa); seletor aparece como rótulo |
| should | Fotos de exemplo do problema no resultado | partial | S06; fotos próprias ou de licença aberta; carrossel pronto; imagens são placeholders até ter fotos próprias de campo |
| should | Onboarding idioma e permissões | partial | S01; MVP só pt-BR; 3 passos (apresentação, culturas, município + consentimento de alertas); só pt-BR |
| could | Diagnóstico via WhatsApp | no | exige WhatsApp Business API |
| could | Produtos registrados para o problema | partial | link Agrofit/MAPA; sem venda; link para o Agrofit; sem catálogo próprio |

### Extras vindos da referência (não contam)
- Frase de confiança no resultado (Muito provável / Provável / Possível): yes
- Faixa de processamento com fila de fotos: yes
- Calendário de manejo (aplicações e monitoramentos): no
- Graus-dia com fases da praga: no
- Inspeção de campo com mapa e trajeto: no
- Assistente de chat com IA: no

## Layout

| tela | nota | veredito | o que difere |
| --- | ---: | --- | --- |
| S06 Resultado | 30,7% | diferente | mesma ordem (fotos com pontos → confiança → nome → descrição → tratamentos em seções). O clone coloca selo, barra, "O que vimos" e **dois avisos antes do manejo**: o primeiro tratamento só aparece no fim da tela, enquanto a referência mostra os três acima da dobra |
| S13 Alertas | 28,5% | diferente | linhas de alerta no mesmo padrão (quadro com ícone, título, tempo, motivo em 1 linha). A referência mostra o alerta em destaque como cartão flutuante sobre a lista; o clone coloca o cartão acima da lista |

**Por que a nota é baixa e quanto confiar nela:** os prints de referência são do **Agrio**, não do Plantix, e são artes de divulgação (a tela vem dentro de um celular desenhado, com cartões sobrepostos). Recortei só a área da tela, mas o estado não é o mesmo (outra praga, outra foto, outro texto). Diferenças de linha de texto pesam muito no mapa de bordas. Controle: a ferramenta dá 100% comparando o clone com ele mesmo. Para uma nota confiável, faltam prints do **Plantix** no seu celular, nas mesmas telas e a 390 px.

Imagens: `replica/diffs/diff-S06.png`, `replica/diffs/diff-S13.png` (vermelho = referência, verde = clone, amarelo = células diferentes).

## Comportamento

| fluxo | Plantix faz | Talhão faz | decisão |
| --- | --- | --- | --- |
| F01 toques até o tratamento | ~3 (câmera, disparo, ver tratamento) | 2 (câmera, disparo); o manejo já vem na tela do resultado | **manter: ganho** |
| F01 quando não reconhece | sugere a comunidade (há reclamações de "não identificou" na Play Store) | diz o motivo (foto escura, não é planta, não é soja, sadia), dá 3 dicas de foto e leva à comunidade com a foto anexada | manter: ganho |
| F01 confiança | probabilidade | palavras + % + "o que vimos na foto" | manter: ganho |
| F01 sem internet | diagnóstico no aparelho (modelo TensorFlow Lite) | foto vai para a fila e é analisada quando o sinal volta | **lacuna**: modelo no aparelho é XL; a fila cobre o essencial |
| F01 custo/abuso | — | limite diário por usuário e por IP | manter |
| F02 primeira abertura | idioma, culturas; sem cadastro | 3 passos, sem cadastro, consentimento de alertas explícito | manter |
| F03 comunidade | 500+ especialistas | selo só para especialista verificado; turma de Agronomia como primeiros especialistas | manter; depende de gente |
| F04 biblioteca | ~750 fichas, 30 culturas, offline | 12 fichas próprias de soja, offline já na instalação, com nível de ação de MIP | lacuna de quantidade, ganho em MIP |
| F05 alertas | alertas por distrito; reclamação de excesso de notificações | por município, **no máximo 1 aviso por dia**, desligável | manter: ganho |
| Tratamento químico | produtos e loja com preço | grupo químico + link do Agrofit, sem dose e sem venda | manter (receituário) |
| Anúncios | tem (AdMob) | não tem | manter |
| WhatsApp | diagnóstico pelo WhatsApp | não tem | could, depois |
| Idiomas / culturas | 19 / 30 | 1 / 1 | escopo: fora |
| E-mails | — | só o código de entrada, em português | manter |

## Próximos 5 para construir

1. **Ligar o diagnóstico real** (projeto Supabase + chave Anthropic) e medir o acerto com ~100 fotos rotuladas pela Agronomia. Resolve o único must-have que é de fato lacuna.
2. **Decidir o escopo de culturas.** Ou marcar milho e trigo como `skip` (escopo soja, decisão consciente), ou adicionar milho safrinha, que tem o mesmo produtor e o mesmo talhão. Fecha os outros 2 must-haves parciais.
3. **Subir o manejo no resultado:** juntar os dois avisos numa linha curta abaixo do manejo, para o primeiro tratamento ficar acima da dobra (achado do diff de layout do S06).
4. **Fotos próprias de campo nas 12 fichas e revisão da Agronomia** (sai o "em revisão" e entram fotos de exemplo reais no carrossel).
5. **Mais fichas de soja (12 → ~25)**: nematoides, mancha-olho-de-rã, cercosporiose, Helicoverpa, tamanduá-da-soja, entre outras. Mais cobertura = menos "não identificado".
