import type { Problem } from "./types";

// Fichas escritas do zero para o Talhão. NENHUM texto vem do Plantix ou do Agrio.
// Status "review": precisam passar pela revisão da turma/professores de Agronomia
// antes de virar "published". Recomendações químicas trazem só grupo de modo de
// ação, nunca dose — dose depende de produto registrado e receituário agronômico.

const EMBRAPA = "Embrapa Soja — Tecnologias de produção de soja (edição vigente)";
const AGROFIT = "MAPA — Agrofit (consulta de produtos registrados)";

export const PROBLEMS: Problem[] = [
  {
    id: "p01", slug: "ferrugem-asiatica", agentType: "fungo",
    commonName: "Ferrugem asiática", scientificName: "Phakopsora pachyrhizi",
    summary: [
      "Pontinhos escuros na face de cima da folha, começando pelas folhas de baixo",
      "Na face de baixo, pequenas saliências (urédias) que soltam um pó claro",
      "Folhas amarelam e caem cedo; grãos ficam leves",
    ],
    symptoms:
      "Começa no terço inferior da planta com lesões pequenas, de cor castanha a cinza-esverdeada, vistas melhor contra a luz. Na face inferior aparecem urédias em forma de vulcão que liberam esporos. Com a doença avançando, as lesões se juntam, a folha amarela e cai. Desfolha antes do enchimento de grãos é o que mais derruba a produtividade.",
    cause:
      "Fungo que só sobrevive em planta viva (biotrófico), por isso o vazio sanitário funciona. Os esporos viajam com o vento por longas distâncias. Folha molhada por 6 horas ou mais e temperatura entre 18 e 28 °C favorecem a infecção.",
    preventive: [
      "Respeitar o vazio sanitário e o calendário de semeadura da sua região",
      "Semear no início da janela recomendada e preferir cultivares de ciclo precoce",
      "Eliminar soja guaxa (tiguera) na entressafra",
      "Acompanhar os boletins do Consórcio Antiferrugem e monitorar a partir do fechamento das entrelinhas",
    ],
    treatments: [
      { kind: "cultural", text: "Vazio sanitário, semeadura no início da janela e cultivares com genes de resistência reduzem a pressão da doença." },
      { kind: "biologico", text: "Há produtos biológicos registrados para a doença; funcionam como complemento ao manejo, não como substitutos dos fungicidas em alta pressão." },
      { kind: "quimico", text: "Aplicação preventiva ou no início dos sintomas, sempre em mistura e com rotação de modos de ação para evitar resistência. Multissítios ajudam a proteger as moléculas sítio-específicas.", activeIngredient: "Triazóis, estrobilurinas, carboxamidas e multissítios", moaGroup: "FRAC 3, 11, 7 e M" },
    ],
    stages: ["R1", "R3", "R5"], hue: 32, status: "review", sources: [EMBRAPA, AGROFIT],
  },
  {
    id: "p02", slug: "mancha-alvo", agentType: "fungo",
    commonName: "Mancha-alvo", scientificName: "Corynespora cassiicola",
    summary: [
      "Manchas arredondadas com anéis concêntricos, como um alvo",
      "Halo amarelado em volta da mancha",
      "Pode atingir folhas, hastes e vagens",
    ],
    symptoms:
      "Lesões que começam como pontos pardos e crescem em círculos com anéis mais escuros e mais claros alternados, geralmente com um halo amarelo. Em ataques fortes há desfolha e manchas também em hastes e vagens.",
    cause:
      "O fungo sobrevive em restos de cultura e em sementes, e tem muitos hospedeiros. Alta umidade e chuvas frequentes favorecem. A monocultura de soja aumenta a quantidade de inóculo na área.",
    preventive: [
      "Rotação de culturas com gramíneas",
      "Cultivares menos suscetíveis",
      "Sementes sadias e tratadas",
    ],
    treatments: [
      { kind: "cultural", text: "Rotação com milho ou outras gramíneas diminui o inóculo nos restos culturais." },
      { kind: "quimico", text: "Fungicidas em mistura, priorizando moléculas com boa eficiência para mancha-alvo na sua região; há relatos de menor sensibilidade a alguns grupos.", activeIngredient: "Carboxamidas, multissítios e triazóis", moaGroup: "FRAC 7, M e 3" },
    ],
    stages: ["V6", "R1", "R3"], hue: 24, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p03", slug: "antracnose", agentType: "fungo",
    commonName: "Antracnose", scientificName: "Colletotrichum truncatum",
    summary: [
      "Nervuras escurecidas na face de baixo das folhas",
      "Vagens com manchas escuras e deformadas",
      "Pode causar apodrecimento de vagens e queda",
    ],
    symptoms:
      "Na folha, as nervuras ficam escuras e a folha pode enrolar. Nas hastes e vagens aparecem manchas escuras, às vezes com pontinhos pretos (estruturas do fungo). Vagens atacadas podem ficar chochas ou retorcidas.",
    cause:
      "Transmitido principalmente por semente e restos de cultura. Calor com chuva prolongada e lavouras muito adensadas favorecem.",
    preventive: [
      "Semente de boa qualidade e tratada",
      "Espaçamento e população adequados para arejar a lavoura",
      "Rotação de culturas",
    ],
    treatments: [
      { kind: "cultural", text: "Ajustar população de plantas e fazer rotação reduz a doença." },
      { kind: "quimico", text: "Tratamento de sementes e fungicidas foliares nas fases reprodutivas quando há histórico na área.", activeIngredient: "Benzimidazóis no tratamento de sementes; triazóis e estrobilurinas na parte aérea", moaGroup: "FRAC 1, 3 e 11" },
    ],
    stages: ["R3", "R5"], hue: 18, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p04", slug: "oidio", agentType: "fungo",
    commonName: "Oídio", scientificName: "Erysiphe diffusa",
    summary: [
      "Pó branco acinzentado sobre folhas e hastes",
      "Aparece primeiro na face de cima da folha",
      "Mais comum em tempo seco e ameno",
    ],
    symptoms:
      "Camada fina de aspecto empoeirado, branca a cinza, que pode cobrir toda a folha. Folhas muito atacadas ficam amareladas e caem antes do tempo.",
    cause:
      "Favorecido por temperaturas amenas (entre 18 e 24 °C) e baixa umidade relativa. Chuva forte lava os esporos e diminui a doença.",
    preventive: ["Cultivares resistentes", "Monitorar em períodos secos e amenos"],
    treatments: [
      { kind: "cultural", text: "A escolha de cultivar resistente é a medida mais eficiente." },
      { kind: "quimico", text: "Fungicidas quando a doença aparece cedo e o tempo segue favorável.", activeIngredient: "Triazóis e enxofre", moaGroup: "FRAC 3 e M" },
    ],
    stages: ["V8", "R1", "R3"], hue: 60, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p05", slug: "mofo-branco", agentType: "fungo",
    commonName: "Mofo-branco", scientificName: "Sclerotinia sclerotiorum",
    summary: [
      "Mancha encharcada na haste que vira um mofo branco parecido com algodão",
      "Corpos pretos e duros (escleródios) dentro e fora da haste",
      "Plantas murcham e secam em reboleiras",
    ],
    symptoms:
      "Lesões úmidas na haste, geralmente na altura das flores, que se cobrem de micélio branco. Depois surgem escleródios pretos, parecidos com fezes de rato. A planta murcha acima da lesão.",
    cause:
      "Os escleródios sobrevivem anos no solo. Na floração, com frio e umidade, eles germinam e soltam esporos que infectam as flores. Regiões altas e frescas têm mais problema.",
    preventive: [
      "Semente livre de escleródios",
      "Palhada de gramíneas (cobertura de solo) para dificultar a germinação dos escleródios",
      "Evitar trazer máquinas de áreas infestadas sem limpeza",
    ],
    treatments: [
      { kind: "cultural", text: "Cobertura de solo com braquiária ou palhada de milho é uma das medidas mais efetivas." },
      { kind: "biologico", text: "Agentes como Trichoderma spp. e Bacillus spp. reduzem os escleródios no solo quando usados antes da floração." },
      { kind: "quimico", text: "Fungicidas aplicados no início da floração, quando há histórico na área.", activeIngredient: "Dicarboximidas, benzimidazóis e carboxamidas", moaGroup: "FRAC 2, 1 e 7" },
    ],
    stages: ["R1", "R2"], hue: 210, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p06", slug: "crestamento-bacteriano", agentType: "bacteria",
    commonName: "Crestamento bacteriano", scientificName: "Pseudomonas savastanoi pv. glycinea",
    summary: [
      "Manchas pequenas e angulosas, de aspecto encharcado",
      "Centro escurece e fica com halo amarelo",
      "Partes da folha rasgam e caem com o vento",
    ],
    symptoms:
      "Pontos encharcados delimitados pelas nervuras, que ficam pardos a pretos com halo amarelo-esverdeado. As lesões secam e o tecido se rompe, deixando a folha rasgada.",
    cause:
      "Bactéria transmitida por semente e espalhada por chuva com vento. Favorecida por tempo fresco e chuvoso no início do ciclo.",
    preventive: ["Semente sadia", "Cultivares resistentes", "Evitar trânsito na lavoura molhada"],
    treatments: [
      { kind: "cultural", text: "Medidas preventivas são o principal controle; fungicidas não controlam bactérias." },
    ],
    stages: ["V3", "V6"], hue: 90, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p07", slug: "percevejo-marrom", agentType: "inseto",
    commonName: "Percevejo-marrom", scientificName: "Euschistus heros",
    summary: [
      "Inseto marrom com dois espinhos laterais no 'ombro'",
      "Suga vagens e grãos, deixando grãos chochos e manchados",
      "Pode causar retenção foliar (a 'soja louca')",
    ],
    symptoms:
      "O dano não aparece na folha: está nos grãos, que ficam enrugados, menores e com pontinhos escuros onde o inseto picou. Lavouras com muito percevejo podem não completar a maturação e ficar verdes na colheita.",
    cause:
      "Ataca principalmente do início da formação das vagens (R3) até a maturação (R7). Passa a entressafra escondido sob a palhada.",
    preventive: [
      "Monitorar com pano de batida a partir de R3",
      "Decidir a aplicação pelo nível de ação, não pelo calendário",
    ],
    treatments: [
      { kind: "cultural", text: "Monitoramento semanal com pano de batida em vários pontos da lavoura. Nível de ação de referência: 2 percevejos (adultos e ninfas grandes) por metro para grão, 1 por metro para semente." },
      { kind: "biologico", text: "Parasitoides de ovos como Telenomus podisi podem ser liberados; preservar os inimigos naturais evitando aplicações desnecessárias." },
      { kind: "quimico", text: "Aplicar só quando o nível de ação for atingido, alternando grupos químicos.", activeIngredient: "Neonicotinoides, piretroides e organofosforados", moaGroup: "IRAC 4A, 3A e 1B" },
    ],
    stages: ["R3", "R5", "R6"], hue: 28, status: "review", sources: [EMBRAPA, AGROFIT],
  },
  {
    id: "p08", slug: "lagarta-da-soja", agentType: "inseto",
    commonName: "Lagarta-da-soja", scientificName: "Anticarsia gemmatalis",
    summary: [
      "Lagarta verde (às vezes escura) com listras claras no dorso",
      "Come a folha inteira, deixando só as nervuras",
      "Quando incomodada, se debate com força",
    ],
    symptoms:
      "Desfolha de cima para baixo, com folhas comidas inclusive nas nervuras mais finas em ataques fortes. Lagartas grandes comem muito mais que as pequenas, por isso o monitoramento cedo é importante.",
    cause:
      "Ocorre da fase vegetativa até o enchimento de grãos. Mariposas põem ovos nas folhas e a população cresce rápido em tempo quente.",
    preventive: ["Monitorar com pano de batida", "Preservar inimigos naturais"],
    treatments: [
      { kind: "cultural", text: "Nível de ação de referência: 30% de desfolha na fase vegetativa ou 15% na reprodutiva, ou 20 lagartas grandes por pano de batida." },
      { kind: "biologico", text: "Baculovírus (Baculovirus anticarsia) e Bacillus thuringiensis funcionam bem com lagartas pequenas." },
      { kind: "quimico", text: "Inseticidas seletivos, que poupam inimigos naturais, quando o nível de ação for atingido.", activeIngredient: "Reguladores de crescimento e diamidas", moaGroup: "IRAC 15 e 28" },
    ],
    stages: ["V4", "R1", "R4"], hue: 100, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p09", slug: "lagarta-falsa-medideira", agentType: "inseto",
    commonName: "Lagarta-falsa-medideira", scientificName: "Chrysodeixis includens",
    summary: [
      "Lagarta verde-clara que anda 'medindo palmo', arqueando o corpo",
      "Come a folha mas deixa as nervuras, que ficam rendilhadas",
      "Fica no terço médio e inferior, mais difícil de atingir",
    ],
    symptoms:
      "Folhas com aspecto de renda, já que as nervuras ficam. Ataque concentrado no meio e embaixo da planta, onde a calda de pulverização chega com mais dificuldade.",
    cause:
      "Favorecida por tempo quente e seco e por aplicações de produtos que matam os inimigos naturais.",
    preventive: ["Monitoramento no terço médio e inferior", "Evitar aplicações desnecessárias"],
    treatments: [
      { kind: "cultural", text: "Mesmos níveis de ação da lagarta-da-soja; atenção à tecnologia de aplicação para atingir o meio da planta." },
      { kind: "biologico", text: "Baculovírus específico e Bacillus thuringiensis, de preferência em lagartas pequenas." },
      { kind: "quimico", text: "Grupos com boa eficiência para essa espécie, alternando modos de ação.", activeIngredient: "Diamidas e espinosinas", moaGroup: "IRAC 28 e 5" },
    ],
    stages: ["R1", "R3", "R5"], hue: 80, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p10", slug: "mosca-branca", agentType: "inseto",
    commonName: "Mosca-branca", scientificName: "Bemisia tabaci",
    summary: [
      "Insetos brancos pequenos que voam quando a planta é mexida",
      "Ninfas imóveis na face de baixo da folha",
      "Fumagina: camada preta sobre as folhas",
    ],
    symptoms:
      "Folhas com pontos amarelados e, em ataques fortes, cobertas por fumagina, um fungo preto que cresce sobre o melado que o inseto solta. Pode transmitir vírus.",
    cause: "Favorecida por tempo quente e seco e por plantios escalonados de culturas hospedeiras.",
    preventive: ["Eliminar plantas hospedeiras na entressafra", "Monitorar a face inferior das folhas"],
    treatments: [
      { kind: "biologico", text: "Fungos entomopatogênicos, como Beauveria bassiana e Cordyceps fumosorosea, ajudam no manejo." },
      { kind: "quimico", text: "Alternar grupos e focar nas ninfas; a mosca-branca cria resistência rápido.", activeIngredient: "Reguladores de crescimento, neonicotinoides e cetoenóis", moaGroup: "IRAC 16, 4A e 23" },
    ],
    stages: ["V6", "R1", "R5"], hue: 55, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p11", slug: "acaro-rajado", agentType: "acaro",
    commonName: "Ácaro-rajado", scientificName: "Tetranychus urticae",
    summary: [
      "Pontinhos amarelados ou bronzeados na folha",
      "Teias finas na face de baixo",
      "Surtos em veranicos (períodos secos)",
    ],
    symptoms:
      "A folha perde o verde por pontos e depois fica bronzeada ou avermelhada. Com lupa, vê-se os ácaros e as teias na face inferior. Ataque começa em reboleiras e na borda da lavoura.",
    cause:
      "Explode em estiagens e quando inimigos naturais foram mortos por aplicações de amplo espectro.",
    preventive: ["Monitorar bordas em períodos secos", "Evitar inseticidas de amplo espectro sem necessidade"],
    treatments: [
      { kind: "biologico", text: "Ácaros predadores e fungos entomopatogênicos podem ser usados." },
      { kind: "quimico", text: "Acaricidas específicos registrados para a cultura; inseticidas comuns não controlam ácaros.", activeIngredient: "Acaricidas específicos", moaGroup: "IRAC 6, 20 ou 23" },
    ],
    stages: ["V6", "R3"], hue: 12, status: "review", sources: [EMBRAPA],
  },
  {
    id: "p12", slug: "deficiencia-de-potassio", agentType: "deficiencia",
    commonName: "Deficiência de potássio", scientificName: "K",
    summary: [
      "Amarelecimento nas bordas das folhas mais velhas",
      "Bordas secam e ficam pardas, enquanto o centro continua verde",
      "Plantas com haste fina e grãos menores",
    ],
    symptoms:
      "Começa nas folhas de baixo porque o potássio se move para as folhas novas. As margens amarelam e depois necrosam. Em casos fortes, a maturação atrasa e os grãos ficam enrugados.",
    cause:
      "Solo pobre em potássio, adubação insuficiente para a produtividade esperada ou solos arenosos com perda por lixiviação.",
    preventive: ["Análise de solo antes do plantio", "Adubação de manutenção conforme a recomendação regional"],
    treatments: [
      { kind: "cultural", text: "Corrigir com base na análise de solo e no histórico de produtividade. Use a calculadora do app como ponto de partida e confirme com um agrônomo." },
    ],
    stages: ["V4", "R1"], hue: 48, status: "review", sources: [EMBRAPA],
  },
];

export function problemBySlug(slug: string) {
  return PROBLEMS.find((p) => p.slug === slug);
}
