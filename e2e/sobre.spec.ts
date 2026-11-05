import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";

const AVOID: string[] = JSON.parse(readFileSync("replica/brand.json", "utf-8")).avoid;

test("página de apresentação: seções, sem prova inventada, acessível", async ({ page, problems, axe }) => {
  await page.goto("/sobre");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Foto da folha.\s*Resposta franca./);
  for (const h of ["Já passou por isso?", "Como funciona", "O que é diferente", "Quanto custa", "Perguntas", "Teste na próxima vistoria"])
    await expect(page.getByRole("heading", { name: h, level: 2 })).toBeVisible();
  await expect(page.getByText("em construção")).toBeVisible();   // o que não existe não é prometido
  const body = (await page.locator("body").innerText()).toLowerCase();
  for (const proibido of [...AVOID.map((a) => a.toLowerCase()), "estrelas", "downloads", "depoimento", "usuários satisfeitos"]) expect(body).not.toContain(proibido);
  await axe();
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole("link", { name: "Abrir o Glyma" }).first().click();
  await expect(page).toHaveURL(/\/(boas-vindas)?$/);
  void problems;
});

test("lista do teste sem servidor mostra aviso, sem formulário quebrado", async ({ page, problems }) => {
  await page.goto("/sobre#lista");
  await expect(page.getByText("A lista do teste abre quando o servidor estiver ligado.")).toBeVisible();
  void problems;
});
