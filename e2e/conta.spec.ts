import { test, expect, pickPhoto } from "./fixtures";

test.beforeEach(async ({ withProfile }) => { await withProfile(); });

test("C-H1 mudar nome e município reflete no início", async ({ page, problems, axe }) => {
  await page.goto("/perfil");
  await axe();
  await page.getByLabel("Como quer ser chamado").fill("Ana");
  await page.getByLabel("Município").selectOption("Toledo");
  await page.getByLabel("Como quer ser chamado").blur();
  await page.goto("/");
  await expect(page.getByText("Olá, Ana")).toBeVisible();
  await expect(page.getByText("Toledo")).toBeVisible();
  void problems;
});

test("C-H2 apagar meus dados", async ({ page, problems }) => {
  await page.goto("/camera");
  await pickPhoto(page, "folha.jpg");
  await page.locator("#res-nome").waitFor({ timeout: 15_000 });
  await page.goto("/perfil");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Apagar meus dados" }).click();
  await expect(page).toHaveURL(/\/boas-vindas/);
  await page.goto("/historico");
  await expect(page.getByRole("heading", { name: "Seus diagnósticos aparecem aqui" })).toBeVisible();
  void problems;
});

test("C-E1 nome muito longo não quebra o layout", async ({ page, problems }) => {
  await page.goto("/perfil");
  await page.getByLabel("Como quer ser chamado").fill("Maximiliano Aparecido de Oliveira Martins dos Santos Pereira Júnior");
  await page.getByLabel("Como quer ser chamado").blur();
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  void problems;
});

test("privacidade lista os processadores", async ({ page, problems, axe }) => {
  await page.goto("/privacidade");
  for (const n of ["Supabase", "Vercel", "Anthropic", "Open-Meteo"]) await expect(page.getByText(new RegExp(n)).first()).toBeVisible();
  await axe();
  void problems;
});
