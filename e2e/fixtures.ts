// Fixture comum: falha em erro de console, em 5xx e em violação séria/crítica do axe.
import { test as base, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Bloqueios do ambiente de teste (sem internet externa) que não são bugs do app.
const IGNORE = [/ERR_TUNNEL_CONNECTION_FAILED/, /net::ERR_INTERNET_DISCONNECTED/, /Failed to fetch/];

export const PROFILE = {
  onboarded: true, crops: ["soja"], municipio: "Cascavel", name: "Matheus", notifyAlerts: true,
  sowingDate: new Date(Date.now() - 68 * 86_400_000).toISOString().slice(0, 10),
};

type Fx = { problems: string[]; axe: (page?: Page) => Promise<void>; withProfile: (p?: object | null) => Promise<void> };

export const test = base.extend<Fx>({
  problems: async ({ page }, use) => {
    const problems: string[] = [];
    const expected = new Set<string>();
    (page as Page & { allow?: (s: string) => void }).allow = (s) => expected.add(s);
    page.on("console", (m) => { if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text())) && ![...expected].some((e) => m.text().includes(e))) problems.push(`console: ${m.text()}`); });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("response", (r) => { if (r.status() >= 500 && ![...expected].some((e) => r.url().includes(e))) problems.push(`${r.status()} ${r.url()}`); });
    await use(problems);
    expect(problems, "erros de console / 5xx durante o teste").toEqual([]);
  },
  axe: async ({ page }, use) => {
    const seen = new Set<string>();
    await use(async (p = page) => {
      const key = new URL(p.url()).pathname;
      if (seen.has(key)) return;
      seen.add(key);
      const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`), `axe em ${key}`).toEqual([]);
    });
  },
  withProfile: async ({ page }, use) => {
    await use(async (p = PROFILE) => {
      await page.addInitScript((prof) => {
        if (prof && !sessionStorage.getItem("__seeded")) { localStorage.setItem("glyma:profile", JSON.stringify(prof)); sessionStorage.setItem("__seeded", "1"); }
      }, p);
    });
  },
});
export { expect };

export async function pickPhoto(page: Page, file: string) {
  await page.getByText(/Câmera indisponível|Sem acesso à câmera/).waitFor();
  await page.locator('input[type="file"]').setInputFiles(`e2e/fixtures/${file}`);
}
export const allow = (page: Page, s: string) => (page as Page & { allow?: (s: string) => void }).allow?.(s);
