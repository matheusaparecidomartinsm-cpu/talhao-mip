import type { Crop, DiseaseAlert, FertilizerRule, Post, StageTip, WeatherDay } from "./types";

export const CROPS: Crop[] = [
  { id: "c01", slug: "soja", name: "Soja", scientificName: "Glycine max", active: true },
  { id: "c02", slug: "milho", name: "Milho", scientificName: "Zea mays", active: false },
  { id: "c03", slug: "trigo", name: "Trigo", scientificName: "Triticum aestivum", active: false },
];

const now = Date.now();
const ago = (min: number) => new Date(now - min * 60_000).toISOString();
const day = (offset: number) => new Date(now + offset * 86_400_000).toISOString().slice(0, 10);

export const POSTS: Post[] = [
  {
    id: "q1", cropSlug: "soja", author: "Rodrigo T.", municipio: "Toledo", hue: 48,
    title: "Folhas de baixo amarelando nas bordas, é deficiência?",
    body: "Talhão em V5, solo mais arenoso. O amarelo começa na borda das folhas velhas e o meio continua verde. Fiz adubação mais leve esse ano.",
    createdAt: ago(2),
    answers: [
      { id: "a1", author: "Gabriela M.", initials: "GM", isExpert: true, useful: 4, createdAt: ago(1),
        body: "Pelo padrão, borda das folhas velhas com centro verde, tem cara de falta de potássio. Em solo arenoso perde mais fácil. Confirme com análise de solo antes de corrigir." },
    ],
  },
  {
    id: "q2", cropSlug: "soja", author: "Ana P.", municipio: "Cascavel", hue: 28,
    title: "Percevejo em R5, já passou do nível de ação?",
    body: "Fiz 6 batidas de pano e achei 1, 3, 2, 2, 1 e 3 percevejos. Vale aplicar agora ou esperar?",
    createdAt: ago(50),
    answers: [
      { id: "a2", author: "Lucas F.", initials: "LF", isExpert: false, useful: 1, createdAt: ago(40),
        body: "Aqui na região a pressão subiu essa semana também." },
      { id: "a3", author: "Prof. Helena R.", initials: "HR", isExpert: true, useful: 7, createdAt: ago(30),
        body: "Média de 2 por pano, no limite do nível de ação para grão. Se for semente, já passou. Repita as batidas em 3 a 4 dias em outros pontos antes de decidir." },
      { id: "a4", author: "Ana P.", initials: "AP", isExpert: false, useful: 0, createdAt: ago(10),
        body: "Obrigada! Vou refazer na sexta." },
    ],
  },
  {
    id: "q3", cropSlug: "soja", author: "Marcos V.", municipio: "Palotina", hue: 32,
    title: "Pontinhos escuros nas folhas de baixo depois de 5 dias de chuva",
    body: "Contra a luz dá pra ver uns pontos pequenos. Embaixo da folha tem umas bolinhas. Medo de ser ferrugem.",
    createdAt: ago(60 * 26),
    answers: [],
  },
];

export const ALERTS: DiseaseAlert[] = [
  { id: "al1", problemSlug: "ferrugem-asiatica", municipio: "Cascavel", risk: "alto",
    reason: "Chuva em 5 dos próximos 7 dias, 18 a 27 °C e 3 casos confirmados na região",
    validFrom: day(0), validTo: day(6), createdAt: ago(120) },
  { id: "al2", problemSlug: "percevejo-marrom", municipio: "Cascavel", risk: "medio",
    reason: "Lavouras da região entrando em R5 e relatos na comunidade",
    validFrom: day(-1), validTo: day(5), createdAt: ago(60 * 22) },
];

export function weatherFor(_municipio: string): WeatherDay[] {
  // Provisório: série fixa. replica-backend troca por Open-Meteo + weather_cache.
  const base: Omit<WeatherDay, "date">[] = [
    { icon: "rain", tMin: 18, tMax: 27, rainMm: 24, windKmh: 9, humidity: 88 },
    { icon: "rain", tMin: 19, tMax: 26, rainMm: 8, windKmh: 12, humidity: 84 },
    { icon: "cloud-sun", tMin: 17, tMax: 29, rainMm: 1, windKmh: 8, humidity: 70 },
    { icon: "sun", tMin: 18, tMax: 31, rainMm: 0, windKmh: 6, humidity: 58 },
    { icon: "sun", tMin: 20, tMax: 32, rainMm: 0, windKmh: 18, humidity: 52 },
    { icon: "cloud", tMin: 20, tMax: 30, rainMm: 0, windKmh: 10, humidity: 66 },
    { icon: "rain", tMin: 19, tMax: 25, rainMm: 15, windKmh: 14, humidity: 90 },
  ];
  return base.map((d, i) => ({ ...d, date: day(i) }));
}

export const STAGE_TIPS: StageTip[] = [
  { stage: "VE", dayFrom: 0, dayTo: 10, title: "Emergência", tip: "Confira o estande: falhas grandes agora pesam na produtividade. Olhe pragas de início de ciclo.", watch: [] },
  { stage: "V3", dayFrom: 11, dayTo: 30, title: "Vegetativo inicial", tip: "Monitore lagartas e manchas bacterianas em tempo fresco e chuvoso.", watch: ["crestamento-bacteriano", "lagarta-da-soja"] },
  { stage: "V6", dayFrom: 31, dayTo: 45, title: "Vegetativo", tip: "Entrelinhas fechando: comece o monitoramento de doenças foliares.", watch: ["mancha-alvo", "oidio", "lagarta-da-soja"] },
  { stage: "R1", dayFrom: 46, dayTo: 60, title: "Início da floração", tip: "Janela de atenção para mofo-branco em áreas com histórico e para ferrugem.", watch: ["mofo-branco", "ferrugem-asiatica"] },
  { stage: "R3", dayFrom: 61, dayTo: 75, title: "Formação de vagens", tip: "Pano de batida toda semana: o percevejo começa a pesar daqui em diante.", watch: ["percevejo-marrom", "ferrugem-asiatica", "lagarta-falsa-medideira"] },
  { stage: "R5", dayFrom: 76, dayTo: 100, title: "Enchimento de grãos", tip: "Fase mais sensível a percevejo e desfolha. Desfolha acima de 15% já justifica controle de lagartas.", watch: ["percevejo-marrom", "ferrugem-asiatica"] },
  { stage: "R7", dayFrom: 101, dayTo: 125, title: "Maturação", tip: "Planeje a colheita. Retenção foliar pode indicar ataque de percevejo.", watch: ["percevejo-marrom"] },
];

export const FERTILIZER_RULES: FertilizerRule[] = [
  { nutrient: "P₂O₅", kgHaMin: 60, kgHaMax: 100, note: "Fósforo — depende do teor no solo e da produtividade esperada" },
  { nutrient: "K₂O", kgHaMin: 60, kgHaMax: 120, note: "Potássio — parcelar em solos arenosos" },
];

// Municípios de exemplo (oeste do PR). Versão real: lista completa do IBGE.
export const MUNICIPIOS = [
  { ibge: "4104808", nome: "Cascavel", uf: "PR" },
  { ibge: "4127700", nome: "Toledo", uf: "PR" },
  { ibge: "4117909", nome: "Palotina", uf: "PR" },
  { ibge: "4115200", nome: "Marechal Cândido Rondon", uf: "PR" },
  { ibge: "4103453", nome: "Cafelândia", uf: "PR" },
  { ibge: "4108304", nome: "Foz do Iguaçu", uf: "PR" },
];
