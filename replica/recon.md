# Recon map: Plantix ("your crop doctor")

Data do levantamento: 05/11/2026 · Fontes só públicas (site, Play Store, termos, docs públicas da API, matérias). Nenhum login, nenhum scraping, nenhum código do app.

---

## 1. Escopo

| pergunta | resposta adotada (ajustável) |
| --- | --- |
| App e plataforma | Plantix, app **Android** (`com.peat.GartenBank`, Android-first; iOS historicamente limitado) + site plantix.net (biblioteca e blog). Clone: **PWA mobile-first** (roda no celular do produtor, instala como app, câmera via navegador). |
| Fatia | **Loop central**: foto da planta → diagnóstico (doença / praga / deficiência) → tratamento (orgânico + químico + prevenção). Em volta: biblioteca de problemas por cultura, comunidade de perguntas, alertas de doença na região, calendário de cultivo, clima para pulverização, calculadora de adubo. |
| Para quem | Encaixa no **Talhão (talhao-mip)**: produtor e técnico de soja no Brasil, com foco em MIP (monitoramento antes de aplicar). Plantix é generalista (30 culturas principais, ~80 na biblioteca); o clone começa só com **soja** e cresce depois. |

**Termos de uso (importante):** os termos do Plantix proíbem reproduzir o conteúdo do app para fins comerciais, uso derivado, page-scrape/robôs e mineração de dados; todo o "Material" é declarado propriedade da empresa. Não proíbem explicitamente construir um concorrente. Consequência prática: **nenhum texto, foto ou ficha da biblioteca deles entra no clone**. Copiamos a ideia e o fluxo; o conteúdo (fichas de pragas e doenças da soja) é escrito do zero a partir de fontes abertas (Embrapa Soja, circulares técnicas, MAPA/Agrofit para produtos registrados).

---

## 2. Fontes

| # | fonte | URL | o que deu |
| --- | --- | --- | --- |
| 1 | Site / home PT | https://plantix.net/pt/ | proposta, loop central (foto → diagnóstico → comunidade → biblioteca), navegação, B2B |
| 2 | Play Store | https://play.google.com/store/apps/details?id=com.peat.GartenBank | lista oficial de features (6), 30 culturas, 780+ danos, 19 idiomas, 10M+ downloads, nota 4.2 (136 mil avaliações), com anúncios, sem compras no app, atualizado 08/10/2026 |
| 3 | Biblioteca (índice) | https://plantix.net/pt/library/plant-diseases/ | organização por cultura, filtros por tipo de agente, índice A–Z, ~750 entradas, "exibir mais" |
| 4 | Ficha de doença (ex.: ferrugem asiática) | https://plantix.net/pt/library/plant-diseases/100102/soybean-rust/ | estrutura da ficha (seções), IDs numéricos por tipo de agente |
| 5 | Página de cultura (soja) | link "/crops/soybean/" a partir da fonte 3 (caminho exato não confirmado) | lista de problemas por cultura |
| 6 | Comunidade (arquivo) | https://plantix.net/pt/community/ | existe arquivo público; conteúdo renderizado no cliente, não legível pelo fetch |
| 7 | Guias da API (Crop Health) | https://plantix.net/en/plantix-intelligence/api-toolkit/guides/ | **modelo de dados do diagnóstico**: entrada (foto + cultura + local + idioma), saída por problema (nome, probabilidade, sintomas, prevenção, tratamentos, fotos de exemplo, PEAT ID), códigos EPPO, 3 checagens (foto, cultura, problema) |
| 8 | Referência da API | https://b2b.plantix.net/ | outras APIs: Biblioteca de pragas e doenças, Recomendação de tratamento, Calculadora de fertilizante |
| 9 | Crop Insights (B2B) | https://plantix.net/en/plantix-intelligence/crop-insights/ | diagnósticos agregados por distrito → alertas de surto, pressão de doença; ~26,7 mil diagnósticos/dia |
| 10 | Termos e condições | https://plantix.net/pt/imprint/terms-and-conditions/ | restrições (seção 1) e direitos sobre conteúdo do usuário |
| 11 | ICRISAT (ficha da solução) | https://issca.icrisat.org/scalable-solutions/plant-protection-application-app-plantix | diagnóstico em 2–3 s, calendário de cultivo embutido, biblioteca offline, comunidade |
| 12 | Matéria Monitor (Uganda) | https://monitor.co.ug/uganda/magazines/farming/plantix-the-agronomist-mobile-app-changing-farmers-fortunes-4354932 | canal WhatsApp (foto → diagnóstico), calculadora de adubo, clima |
| 13 | Blog Plantix (WhatsApp) | https://plantix.net/fr/blog/plant-disease-detection-whatsapp | diagnóstico via WhatsApp |
| 14 | AppWisp | https://appwisp.com/app/android/com.peat.GartenBank | SDKs visíveis: TensorFlow Lite (modelo no aparelho), Firebase/FCM (push), AdMob (anúncios) |
| 15 | Stork / ZoftwareHub | https://www.stork.ai/en/plantix · https://zoftwarehub.com/en-bh/products/plantix/reviews | modelo de receita (comissão de revendas de insumos), críticas (incentivo a agrotóxico, offline limitado), Plantix Partner para revendas |

**Lacunas:** não houve acesso a telas reais do app (sem conta, sem navegador conectado). O inventário de telas abaixo é **inferido** das fontes 2, 7, 11, 12 e das avaliações. `replica/screens/` está vazio; para fechar as lacunas, o ideal é o Matheus instalar o Plantix no próprio celular, tirar prints de cada tela marcada "média/baixa" e salvar lá (só referência, nunca vai pro clone).

---

## 3. Inventário de telas

Confiança: **A** = visto em fonte pública · **M** = descrito em fonte, layout inferido · **B** = palpite.

| ID | tela | como chega | propósito | componentes principais | estados | conf. |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | Onboarding: idioma e permissões | 1ª abertura | escolher idioma, pedir câmera/localização/notificação | lista de idiomas, cards de permissão, botão continuar | permissão negada (câmera, local) | M |
| S02 | Onboarding: escolher culturas | após S01 | definir "minhas culturas" (personaliza tudo) | grade de ícones de cultura com seleção múltipla, busca | nenhuma selecionada (botão bloqueado) | M |
| S03 | Início ("Minhas culturas") | aba Início | painel: culturas do usuário, atalho de diagnóstico, alerta da região, clima, dica do dia | chips de cultura, botão grande de câmera, card de alerta, card de clima, card de dica | sem culturas, sem rede, sem localização, alerta ativo | M |
| S04 | Câmera de diagnóstico | botão câmera (S03, barra) | tirar ou escolher foto | visor, guia de enquadramento ("folha inteira, luz natural"), botão galeria, seletor de cultura | permissão negada, foto escura/borrada | M |
| S05 | Analisando | após foto | espera do resultado (2–3 s) | prévia da foto, animação de progresso | sem rede (fila offline), timeout | M |
| S06 | Resultado do diagnóstico | após S05 | mostrar problema(s) mais prováveis | foto do usuário, lista de candidatos com probabilidade, tipo de agente (fungo/inseto/...), fotos de exemplo, botão "ver tratamento", "não é isso? pergunte à comunidade" | 1 resultado claro, vários candidatos, **não identificado** (cultura errada, foto ruim, planta saudável) | A (via API) |
| S07 | Tratamento / ficha do problema | S06 ou biblioteca | sintomas, causa, controle orgânico, controle químico, prevenção | cabeçalho (nome popular, científico, tipo), foto, resumo em tópicos, seções expansíveis, compartilhar, "outros problemas desta cultura" | sem produto registrado, conteúdo offline | A (site) |
| S08 | Biblioteca: escolher cultura | aba Biblioteca | navegar problemas por cultura | grade de culturas, busca | — | A (site) |
| S09 | Biblioteca: lista de problemas da cultura | S08 | listar doenças, pragas, deficiências | filtro por tipo de agente (fungo, bactéria, vírus, inseto, ácaro, deficiência, outro), índice A–Z, cards com foto, "exibir mais" | lista vazia no filtro, carregando | A (site) |
| S10 | Comunidade: feed | aba Comunidade | ver perguntas de outros produtores | cards (foto, cultura, pergunta, nº respostas, curtidas, autor, região, data), filtro por cultura, botão "perguntar" | feed vazio, sem rede | M |
| S11 | Comunidade: nova pergunta | S10 ou S06 | publicar pergunta com foto | upload de foto (anexa a do diagnóstico), cultura, título, descrição, enviar | foto ausente, texto curto, envio falhou | M |
| S12 | Comunidade: detalhe da pergunta | S10 | ler e responder | post, respostas com selo de especialista, curtir, responder, denunciar | sem respostas ainda | M |
| S13 | Alertas de doença | card em S03, push | doenças com risco alto no seu município agora | lista por cultura, nível de risco, link para ficha | sem alertas, sem localização | M |
| S14 | Clima agrícola | card em S03 | previsão e janela para pulverizar, capinar, colher | previsão por dia, ícones de "bom/ruim para pulverizar", vento, chuva | sem localização | M |
| S15 | Calendário / plano de cultivo | cultura em S03 | dicas por fase do ciclo a partir da data de plantio | data de plantio, linha do tempo de fases, tarefas/dicas por fase | sem data de plantio | M |
| S16 | Calculadora de adubo | S03 ou menu | quanto adubo para a área | cultura, área (ha), unidade, resultado em sacos/kg por produto | área inválida | M |
| S17 | Histórico de diagnósticos | menu / perfil | rever diagnósticos anteriores | lista com foto, data, problema, cultura | vazio | B |
| S18 | Perfil e configurações | menu | idioma, culturas, localização, notificações, conta, excluir dados | lista de ajustes, login opcional | convidado (sem conta) | B |
| S19 | Produtos / onde comprar | S07 ("produtos") | produtos e revendas para o tratamento | lista de produtos, revendas próximas | sem revenda na região | B (existe market.plantix.net; no Brasil não confirmado) |

**Navegação inferida:** barra inferior com Início · Comunidade · (botão central Câmera) · Biblioteca · Perfil.

---

## 4. Fluxos

Contagem de toques = caminho feliz, a partir do app aberto.

```
F01 Diagnosticar uma planta doente  (LOOP CENTRAL)
    S03 início -> S04 câmera -> S05 analisando -> S06 resultado -> S07 tratamento
    toques: 1 (câmera) + 1 (disparo) + 1 (ver tratamento) = 3
    edge: foto escura/borrada, cultura escolhida errada, planta saudável,
          problema fora da base ("não identificado"), sem internet no talhão,
          vários candidatos com probabilidade parecida

F02 Primeira abertura
    S01 idioma/permissões -> S02 escolher culturas -> S03 início
    toques: ~4 (idioma, permitir, marcar soja, continuar)
    edge: nega câmera, nega localização, pula culturas

F03 Diagnóstico não resolveu → perguntar à comunidade
    S06 resultado ("não é isso?") -> S11 nova pergunta (foto já anexada) -> S10 feed
    -> (depois) push -> S12 detalhe com respostas
    toques: 1 + texto + 1 (enviar) = 2 + digitação
    edge: ninguém responde, resposta errada, conteúdo impróprio (denúncia)

F04 Consultar a biblioteca
    S08 culturas -> S09 problemas da soja -> filtro "inseto" -> S07 ficha
    toques: 3–4
    edge: offline (biblioteca precisa estar em cache), busca sem resultado

F05 Receber alerta e agir
    push "risco alto de ferrugem na sua região" -> S13 alertas -> S07 ficha -> S14 clima (janela de pulverização)
    toques: 3
    edge: localização desligada, alerta irrelevante para a fase da lavoura, excesso de notificações
          (reclamação real na Play Store)

F06 Planejar a safra
    S03 -> S15 calendário (informa data de plantio) -> dicas por fase
    toques: 2 + data
    edge: replantio, duas safras (soja + milho safrinha)

F07 Calcular adubação
    S03 -> S16 calculadora -> área -> resultado
    toques: 2 + digitação
    edge: unidade (ha x alqueire paranaense!), área zero
```

**Número a bater:** F01 em **3 toques** e **≤ 3 s** até o resultado.

---

## 5. Componentes

| componente | variantes | estados | usado em |
| --- | --- | --- | --- |
| Barra de navegação inferior | 5 itens com botão central de câmera em destaque | ativo, inativo, badge (nova resposta) | todas |
| Botão | primário, secundário, texto, ícone, FAB câmera | normal, pressionado, desabilitado, carregando | todas |
| Chip / seletor de cultura | ícone+nome, selecionável, compacto | selecionado, não selecionado | S02, S03, S04, S10, S16 |
| Grade de culturas | com busca | vazio de busca | S02, S08 |
| Card de problema | com foto, tipo de agente, probabilidade opcional | carregando (skeleton) | S06, S09, S13 |
| Badge de tipo de agente | fungo, bactéria, vírus, inseto, ácaro, deficiência, outro (cores próprias) | — | S06, S07, S09 |
| Barra de probabilidade | alta, média, baixa | — | S06 |
| Seção expansível (accordion) | — | aberta, fechada | S07 |
| Visor de câmera | com guia de enquadramento | sem permissão, processando | S04 |
| Indicador de progresso de análise | — | analisando, falhou, na fila offline | S05 |
| Card de clima | dia, semana | sem local | S03, S14 |
| Card de alerta | risco alto/médio | dispensado | S03, S13 |
| Card de post da comunidade | com foto, sem foto | curtido, com resposta de especialista | S10, S12 |
| Campo de texto / área de texto | — | foco, erro, contador | S11, S12, S16 |
| Upload de foto | câmera, galeria | enviando, erro | S04, S11 |
| Filtro em pílulas | tipos de agente, culturas | — | S09, S10 |
| Linha do tempo de fases | — | fase atual destacada | S15 |
| Estado vazio | ilustração + texto + ação | — | S03, S10, S13, S17 |
| Toast / snackbar | sucesso, erro, offline | — | todas |
| Banner offline | — | — | todas |
| Folha inferior (bottom sheet) | escolher cultura, compartilhar | — | S04, S07 |
| Diálogo de permissão | câmera, local, notificação | negado → instruções | S01, S04, S13 |

---

## 6. Modelo de dados inferido

```
User         id, language, location (lat/lng, municipio, uf), crops[] (crop_id),
             notification_prefs, is_guest, created_at
             evidence: S01/S02 onboarding, Play Store data safety (coleta localização e info pessoal),
                       "sem registro para o primeiro uso" (ki-syndikat)
             confidence: alta

Crop         id, name, scientific_name, icon, eppo_code
             evidence: biblioteca por cultura, API cita códigos EPPO
             confidence: alta

Problem      id (PEAT ID), type (fungo|bacteria|virus|inseto|acaro|deficiencia|outro),
             common_name, scientific_name, summary[], symptoms, cause,
             organic_control, chemical_control, preventive_measures[], images[],
             crops[] (N:N), eppo_code
             evidence: ficha da ferrugem (seções), API (saída por problema), IDs 100xxx/300xxx/600xxx por tipo
             confidence: alta

Diagnosis    id, user_id, crop_id (informado), image_url, location, created_at,
             status (ok | not_identified | bad_image | wrong_crop),
             candidates[] -> DiagnosisCandidate
             evidence: API "3 checagens (foto, cultura, problema)", S06
             confidence: alta (campos), média (status)

DiagnosisCandidate  diagnosis_id, problem_id, probability, rank
             evidence: API "quão provável"
             confidence: alta

Treatment    id, problem_id, kind (organico|quimico|preventivo), text, active_ingredient?, product_ids[]
             evidence: API "Treatment Recommendations", ficha S07
             confidence: média (pode ser só texto dentro de Problem)

CommunityPost  id, user_id, crop_id, image_urls[], title, body, diagnosis_id?, status, created_at,
               likes_count, answers_count
               evidence: home ("pergunte, receba respostas, compartilhe"), Play Store (500+ especialistas)
               confidence: média

Answer       id, post_id, user_id, body, is_expert, likes_count, created_at
             confidence: média

Expert       user_id, credential, crops[], verified_at
             evidence: "respostas de especialistas da comunidade"
             confidence: baixa (como verificam é desconhecido)

DiseaseAlert id, problem_id, crop_id, region (municipio), risk_level, valid_from, valid_to, source
             evidence: Play Store "Disease Alerts no seu distrito", Crop Insights (agrega diagnósticos por distrito)
             confidence: média (regra de cálculo é palpite: diagnósticos da região + clima)

CropPlan     id, user_id, crop_id, sowing_date, area_ha
CropStageTip id, crop_id, stage (ex.: VE, V3, R1, R5...), day_from, day_to, tip
             evidence: "plano de ação com dicas para o ciclo inteiro", "calendário embutido"
             confidence: média

FertilizerRule  crop_id, product, kg_per_ha  (calculadora = área × dose)
             evidence: "estima adubo pela área", API Fertilizer Calculator
             confidence: média (lógica real provavelmente usa N-P-K por cultura)

WeatherForecast  (externo, não persistido) date, temp, rain_mm, wind_kmh, spray_ok (bool)
             evidence: "melhor hora para capina, pulverização e colheita"
             confidence: média
```

**Arquitetura que dá pra ver por fora:** TensorFlow Lite no app (modelo de visão rodando no aparelho, ajuda no offline), Firebase Cloud Messaging (push de alertas e respostas), AdMob (anúncios). Isso é só a lista de SDKs pública; nada do código foi lido.

---

## 7. Matriz de features

Em `replica/features.csv` (38 linhas: 11 must, 15 should, 6 could, 6 skip).

---

## 8. O que não dá pra clonar

| item | motivo | alternativa no clone |
| --- | --- | --- |
| Modelo de IA treinado do Plantix | propriedade deles, treinado com 150+ milhões de fotos de usuários | (a) modelo de visão com LLM multimodal via API (rápido de começar); (b) treinar modelo próprio só de soja com dataset aberto (ex.: datasets públicos de folhas de soja / PlantVillage) e fotos próprias do curso de Agronomia; (c) híbrido |
| Biblioteca de ~750 fichas (textos e fotos) | conteúdo protegido; termos proíbem reproduzir | fichas próprias de soja (começar com ~25 pragas/doenças), escritas com base em Embrapa Soja, revisadas pelos alunos/professores de Agronomia |
| Comunidade e seus 500+ especialistas | rede de usuários é deles | comunidade própria, semeada com a turma de Agronomia como "especialistas" |
| Dados agregados de surtos por distrito (Crop Insights) | vêm de milhões de diagnósticos | alertas por regra: clima (umidade/temperatura favoráveis à ferrugem) + diagnósticos do próprio app + boletins públicos (ex.: Consórcio Antiferrugem) |
| Catálogo de produtos e revendas parceiras | acordos comerciais | link para consulta de produtos registrados no Agrofit/MAPA, sem venda |
| Canal WhatsApp com número próprio | exige WhatsApp Business API e custo por conversa | fica para depois (could) |
| Marca, nome, ícone, ilustrações | marca registrada | identidade própria do Talhão |
| Recomendação química com dose | regulado (receituário agronômico no Brasil) | mostrar ingrediente ativo e grupo, com aviso "consulte um engenheiro agrônomo"; dose só em produto registrado |

---

## 9. Tamanho

| métrica | número |
| --- | --- |
| Telas | 19 (12 no MVP) |
| Fluxos | 7 (F01, F02, F04 no MVP) |
| Entidades | 13 |

**Partes difíceis**
1. **Diagnóstico por foto com qualidade aceitável** — é o produto inteiro. Precisa de dataset ou de um modelo multimodal bem instruído, de um estado "não identificado" honesto e de checagem "isso é mesmo soja?".
2. **Offline no talhão** — biblioteca em cache (PWA/service worker), fila de fotos para analisar quando voltar o sinal; modelo no aparelho só se treinar o próprio.
3. **Conteúdo agronômico confiável** — escrever e revisar as fichas de soja com a Agronomia; recomendações químicas tocam em regulação.
4. (menos) Alertas regionais que façam sentido sem milhões de usuários; moderação da comunidade; push sem virar spam.

**Tamanho: M** (algumas semanas) para o MVP de soja: PWA + diagnóstico via modelo multimodal + biblioteca própria + histórico + clima. Com comunidade, alertas e calendário vira **L**. Clone do Plantix inteiro (30 culturas, 19 idiomas, modelo próprio) é **XL → reescopar**, que é exatamente o que este recorte faz.
