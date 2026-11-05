# Marca — Glyma

Posicionamento (de `replica/fixes.md`): *para o produtor de soja que já levou chute de aplicativo e ficou com pergunta sem resposta, o app diz quando não tem certeza e põe um especialista da Agronomia para olhar a foto.*

## 1. Nome

**Escolhido: Glyma** (decisão do Matheus em 05/11/2026). Vem de *Glycine max*, a soja. Curto, se escreve como se fala, não tem significado ruim conhecido em português, inglês ou espanhol, e não lembra Plantix nem Agrio no som, na escrita ou no sentido.

"Talhão" continua dentro do app como **palavra comum** ("seu talhão", "Talhão 1"). Como **nome de marca** foi descartado:
- é termo genérico do setor (Aegro, OneSoil e Senior usam "talhão" como nome de função);
- o INPI tende a recusar marca apenas descritiva;
- `talhao.com.br` já está registrado.

### 20 candidatos

| estilo | candidatos |
| --- | --- |
| descritivo | Talhão, Olho na Soja, Soja Clara, Diagnóstico Soja |
| composto | Campo Certo, Folha Lida, Roça Sabida, Terroxa |
| inventado | **Glyma**, Florata, Sojara, Vistora |
| metáfora | Lupa, Farol do Campo, Joaninha, Segunda Opinião |
| verbo | Confere, Vistoriar, Examina, Olha Aí |

Cortes: **Lupa** (agência brasileira de checagem de fatos com esse nome, e o ângulo é justamente honestidade); **Florata** (perto demais de "Flora – Plant ID & Diagnosis", app da mesma categoria); **Confere / Examina / Vistoriar** (verbos comuns, sem como registrar); **Segunda Opinião / Farol do Campo** (longos); **Sojara / Olha Aí / Roça Sabida** (soam como piada ou forçam o regional). Os descritivos ficaram por causa do mesmo problema do "Talhão".

### Checagens dos 5 finalistas

Todas rodadas em **05/11/2026**. "a rodar" = ninguém rodou ainda. São triagens, não liberação jurídica: antes de gastar com a marca, um advogado de marcas faz a busca completa.

| check | Glyma | Talhão | Vistora | Terroxa | Joaninha |
| --- | --- | --- | --- | --- | --- |
| domínio .com.br (API do Registro.br) | **livre** (status 0) | **registrado** (status 2, vence 30/12/2026) | **registrado** (status 2, vence 10/07/2028) | livre (status 0) | a rodar |
| domínio .app.br | **livre** (status 0) | a rodar | a rodar | a rodar | livre (status 0) |
| busca na web (nome + categoria) | nada no agro; existe a empresa argentina *Glycinemax* (sementes), nome diferente | termo genérico em vários apps de gestão rural | apps de vistoria com nomes parecidos (Visto, Visora), fora do agro | lê-se como "terror"; prefixo da TERRO (EUA, controle de pragas) | palavra comum, muitas marcas |
| INPI (Brasil, classes 9 e 42) | a rodar | a rodar | a rodar | a rodar | a rodar |
| USPTO / EUIPO / WIPO | a rodar | a rodar | a rodar | a rodar | a rodar |
| Google Play e App Store, nome exato | a rodar (a busca da Play recusou acesso automático) | a rodar | a rodar | a rodar | a rodar |
| GitHub, Instagram, X, TikTok | a rodar (o GitHub não respondeu) | a rodar | a rodar | a rodar | a rodar |

> Sobre o "status 0": a API do Registro.br devolveu `status: 0` para os domínios livres e `status: 2` com data de vencimento para os registrados. Confirme no site do Registro.br na hora de registrar.

**Antes de lançar (Matheus):** buscar "Glyma" no INPI (busca.inpi.gov.br, classes 9 e 42) e na Play Store; registrar `glyma.com.br` e/ou `glyma.app.br`; reservar @glyma (ou @glyma.app) no Instagram.

## 2. Paleta

A identidade visual nova é o **roxo da flor da soja**, que também lembra a terra roxa do Paraná.

Por que trocar os verdes do protótipo: o verde é a cor de quase todo app agrícola, inclusive do Plantix (logo verde) e do Agrio (azul-petróleo com verde-limão, medidos nos prints). O verde continua existindo, mas só como **significado** ("bom para pulverizar", "acertou"), nunca como marca.

| papel | valor | uso |
| --- | --- | --- |
| ink | `#2B1E45` | títulos, faixa de processamento, ícone |
| accent | `#5B3A9E` | botão principal, links (texto branco 7,6:1) |
| accent-bright | `#7E5CC8` | indicador de aba, partes decorativas (3:1 sobre branco) |
| accent-soft | `#EEE8F9` | fundos de destaque |
| leaf / leaf-dark | `#5E8C30` / `#2F4A1F` | só nas ilustrações de folha |
| success / danger / warning / info | mantidos | significados, não marca |

`contrast.py`: **0 falhas** (41 pares de texto, 9 de interface). As cores do Agrio estão em `brand.json` para a varredura. As do Plantix ainda precisam ser medidas no app instalado.

## 3. Brief do logo

- **Ideia:** uma vagem de soja aberta com três grãos, e o último grão destacado: "a gente olha grão por grão e diz o que vê".
- **Tipo:** símbolo + logotipo ("Glyma" em minúsculas, Archivo largo e pesado).
- **Tamanhos:** precisa ler a 16 px (favicon: só a vagem, sem os grãos internos se necessário) e a 1024 px.
- **Cores:** roxo `#2B1E45` de fundo, vagem `#7E5CC8`, grãos `#EEE8F9`; versão em uma cor só (branca e roxa).
- **Entregar:** SVG; ícone 1024×1024 **sem transparência** (iOS); favicons 16/32/180/192/512; imagem social 1200×630.
- **Não pode parecer:** com a folha verde do Plantix, com a folha bicolor e o letreiro azul-petróleo do Agrio, nem com nenhum outro app agrícola. Proibido: folha verde, gota, cruz de "doutor", letra P. Coloque os rascunhos ao lado desses logos e compare antes de aprovar.
- **Hoje:** existe uma marca provisória feita para o app (`components/brand.tsx`, `public/icon.svg`), a ser trocada pelo logo final.

## 4. Voz

**Franco, não seco.** Diz o que sabe e o que não sabe, com gentileza.
**Do campo, não caipira forçado.** Fala como agrônomo que conversa com produtor, sem imitar sotaque.
**Calmo, não frio.** Praga é preocupação; o app não aumenta o susto.

| faça | não faça |
| --- | --- |
| "Dessa vez a gente não sabe." | "Erro de identificação." |
| "Muito provável · 82%" | "Diagnóstico confirmado!" |
| "Vale vistoriar o talhão nos próximos dias." | "ALERTA! Aplique agora!" |
| "Sem sinal por aqui. Quando a internet voltar, a gente analisa." | "Falha de conexão (código 0)." |
| "Aplicação de defensivo exige receituário agronômico." | dose, nome de marca comercial, "compre" |

### Os 10 textos mais vistos, na voz

| onde | texto |
| --- | --- |
| boas-vindas, título | O que deu na sua soja? Tire uma foto. |
| boas-vindas, ponto do posicionamento | Quando a gente não sabe, fala — e um especialista da Agronomia olha a foto junto com você. |
| boas-vindas, botão final | Entrar no Glyma |
| início, cartão principal | Tire uma foto da folha · Em segundos: o mais provável, quanta certeza temos e o que fazer. |
| análise | Conferindo a foto… → Procurando sintomas… → Montando o resultado… |
| resultado | Muito provável · 79% · O que vimos: … |
| não identificado, título e ação | Dessa vez a gente não sabe · Pedir para um especialista olhar |
| sem internet | Foto guardada · Sem sinal por aqui. Quando a internet voltar, a gente analisa e avisa. |
| alerta | Risco alto na sua região · Vale vistoriar a lavoura nos próximos dias. |
| e-mail de entrada | Seu código do Glyma |

Todos escritos agora. Nenhum repete frase do Plantix ou do Agrio.

## 5. Varredura

`python3 replica/tools/sweep.py . --config replica/brand.json` → **LIMPO** (6 nomes, 3 domínios e 4 cores procurados no código, nos nomes de arquivo e nos identificadores; ficam fora `node_modules`, build, `replica/` e o protótipo antigo). Para confirmar que a ferramenta funciona, foi testada com um arquivo plantado com "Plantix", "Agrio" e `#7ED320`: acusou os 3 e saiu com código 1.

Conferido a olho: título das páginas ("… · Glyma"), favicon e ícone (vagem roxa), manifesto PWA, cor do tema, os 3 modelos de e-mail e o README. Não existe imagem social ainda (vem com o logo final).

Depois da troca, toda a suíte continua passando: 59 testes de ponta a ponta, 14 de unidade, regras de acesso do banco e 36 prints sem erro.
