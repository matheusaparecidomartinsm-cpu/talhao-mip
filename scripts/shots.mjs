// Prints de todas as telas para o replica-diff + checagens da definição de pronto.
// Uso: npm run build && npx next start -p 3100 & ; node scripts/shots.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const B = process.env.BASE ?? "http://localhost:3100";
const OUT = "replica/clone-screens";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const report = [];

async function ctx(width, profile) {
  const c = await browser.newContext({ viewport: { width, height: width < 800 ? 844 : 900 }, deviceScaleFactor: width < 800 ? 2 : 1 });
  if (profile) await c.addInitScript((p) => localStorage.setItem("talhao:profile", JSON.stringify(p)), profile);
  return c;
}
const PROFILE = { onboarded: true, crops: ["soja"], municipio: "Cascavel", name: "Matheus", notifyAlerts: true,
  sowingDate: new Date(Date.now() - 68 * 86400000).toISOString().slice(0, 10) };

async function shot(c, id, path, { full = true, before, suffix = "", wait } = {}) {
  const pg = await c.newPage();
  const errors = [];
  pg.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  pg.on("pageerror", (e) => errors.push(String(e)));
  pg.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await pg.goto(B + path, { waitUntil: "networkidle" });
  if (before) await before(pg);
  if (wait) await pg.locator(wait).first().waitFor({ timeout: 10000 });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${OUT}/${id}${suffix}.png`, fullPage: full });
  const overflow = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  report.push({ id: id + suffix, path, errors, overflow });
  await pg.close();
}

// 1) estados vazios / primeira abertura
const fresh = await ctx(390);
await shot(fresh, "S01", "/boas-vindas", { full: false });
await shot(fresh, "S02", "/boas-vindas", { full: false, before: (p) => p.getByRole("button", { name: "Começar" }).click() });
await shot(fresh, "S02", "/boas-vindas", { full: false, suffix: "-municipio", before: async (p) => { await p.getByRole("button", { name: "Começar" }).click(); await p.getByRole("button", { name: "Continuar" }).click(); } });

const m = await ctx(390, PROFILE);
await shot(m, "S17", "/historico", { suffix: "-vazio" });
await shot(m, "S04", "/camera", { full: false, wait: "h1" });

// 2) cria um diagnóstico de verdade pela câmera (fluxo F01)
{
  const pg = await m.newPage();
  await pg.goto(B + "/camera");
  await pg.getByText(/Câmera indisponível|Sem acesso/).waitFor();
  await pg.setInputFiles("input[type=file]", "/tmp/folha.jpg");
  await pg.getByText(/Conferindo|Procurando|Montando/).waitFor();
  await pg.screenshot({ path: `${OUT}/S05.png` });
  report.push({ id: "S05", path: "/camera (analisando)", errors: [], overflow: false });
  await pg.waitForURL("**/diagnostico/**", { timeout: 15000 });
  await pg.locator("#res-nome").waitFor();
  globalThis.diagUrl = new URL(pg.url()).pathname;
  await pg.close();
}
// diagnóstico não identificado (foto escura enviada mesmo assim)
{
  const pg = await m.newPage();
  await pg.goto(B + "/camera");
  await pg.getByText(/Câmera indisponível|Sem acesso/).waitFor();
  await pg.setInputFiles("input[type=file]", "/tmp/escura.jpg");
  await pg.getByText("A foto ficou escura").waitFor();
  await pg.screenshot({ path: `${OUT}/S04-foto-escura.png` });
  await pg.getByRole("button", { name: "Enviar assim mesmo" }).click();
  await pg.waitForURL("**/diagnostico/**", { timeout: 15000 });
  await pg.getByText("Não conseguimos identificar").waitFor();
  await pg.screenshot({ path: `${OUT}/S06-nao-identificado.png`, fullPage: true });
  await pg.close();
}

const SCREENS = [
  ["S03", "/"], ["S06", () => globalThis.diagUrl, "#res-nome"], ["S07", "/biblioteca/soja/ferrugem-asiatica"],
  ["S08", "/biblioteca"], ["S09", "/biblioteca/soja"], ["S10", "/comunidade"], ["S11", "/comunidade/nova"],
  ["S12", "/comunidade/q2"], ["S13", "/alertas"], ["S14", "/clima"], ["S15", "/plano"], ["S16", "/calculadora"],
  ["S17", "/historico"], ["S18", "/perfil"], ["S19", "/produtos"], ["design", "/design"],
];
for (const [id, p, wait] of SCREENS) await shot(m, id, typeof p === "function" ? p() : p, { wait });

// estados extras
await shot(m, "S09", "/biblioteca/soja", { suffix: "-filtro-inseto", before: (p) => p.getByRole("radio", { name: "Inseto" }).click() });
await shot(m, "S08", "/biblioteca", { suffix: "-busca-vazia", full: false, before: (p) => p.fill("#busca", "xyzw") });
await shot(m, "S16", "/calculadora", { suffix: "-erro", full: false, before: (p) => p.fill("#area", "0") });
await shot(m, "S11", "/comunidade/nova", { suffix: "-erro", full: false, before: (p) => p.getByRole("button", { name: "Publicar pergunta" }).click() });
await shot(m, "S12", "/comunidade/nao-existe", { suffix: "-nao-encontrada", full: false, wait: "text=Pergunta não encontrada" });
const noMun = await ctx(390, { ...PROFILE, municipio: undefined, sowingDate: undefined });
await shot(noMun, "S03", "/", { suffix: "-sem-municipio" });
await shot(noMun, "S13", "/alertas", { suffix: "-sem-municipio", full: false });
await shot(noMun, "S15", "/plano", { suffix: "-sem-data", full: false });
// texto longo
{
  const pg = await m.newPage();
  await pg.goto(B + "/comunidade/nova");
  await pg.fill("#titulo", "Manchas amarronzadas com halo amarelo espalhando rápido pelas folhas do terço inferior depois de uma semana inteira de chuva");
  await pg.fill("#corpo", "Detalhe ".repeat(60));
  await pg.getByRole("button", { name: "Publicar pergunta" }).click();
  await pg.waitForURL("**/comunidade/**-**");
  await pg.screenshot({ path: `${OUT}/S12-texto-longo.png`, fullPage: true });
  report.push({ id: "S12-texto-longo", path: pg.url(), errors: [], overflow: await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) });
  await pg.close();
}

// 3) 1440 px
const d = await ctx(1440, PROFILE);
for (const [id, p] of [["S03", "/"], ["S07", "/biblioteca/soja/ferrugem-asiatica"], ["S09", "/biblioteca/soja"], ["S10", "/comunidade"], ["S14", "/clima"]]) {
  await shot(d, id, p, { suffix: "-1440", full: false });
}

// 4) teclado: do início até a câmera e até uma ficha, sem mouse
{
  const pg = await m.newPage();
  await pg.goto(B + "/");
  const reach = async (pred, max = 40) => {
    for (let i = 0; i < max; i++) {
      await pg.keyboard.press("Tab");
      if (await pg.evaluate(pred)) return i + 1;
    }
    return -1;
  };
  const toCam = await reach(() => document.activeElement?.getAttribute("aria-label") === "Diagnosticar com foto");
  const ring = await pg.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  await pg.keyboard.press("Enter");
  await pg.waitForURL("**/camera");
  const gal = await reach(() => document.activeElement?.getAttribute("aria-label") === "Escolher foto da galeria", 10);
  await pg.goto(B + "/biblioteca/soja");
  const toCard = await reach(() => document.activeElement?.getAttribute("href")?.startsWith("/biblioteca/soja/"), 40);
  await pg.keyboard.press("Enter");
  await pg.waitForURL("**/biblioteca/soja/*");
  const toAcc = await reach(() => document.activeElement?.tagName === "SUMMARY", 20);
  await pg.keyboard.press("Enter");
  console.log(`teclado: câmera em ${toCam} tabs (anel de foco: ${ring}), galeria em ${gal}, ficha em ${toCard}, accordion em ${toAcc}`);
  await pg.close();
}

await browser.close();
const ignore = (e) => /ERR_TUNNEL_CONNECTION_FAILED/.test(e);
let bad = 0;
for (const r of report) {
  const errs = r.errors.filter((e) => !ignore(e));
  if (errs.length || r.overflow) bad++;
  console.log(`${errs.length || r.overflow ? "FALHA" : "ok   "} ${r.id.padEnd(22)} ${r.overflow ? "[rolagem horizontal] " : ""}${errs.join(" | ")}`);
}
console.log(`\n${report.length} prints, ${bad} com problema`);
process.exit(bad ? 1 : 0);
