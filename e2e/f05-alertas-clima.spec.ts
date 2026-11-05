import { test, expect, PROFILE } from "./fixtures";

test("F05-H1 alerta do início → ficha", async ({ page, withProfile, problems, axe }) => {
  await withProfile();
  await page.goto("/");
  await page.getByRole("link", { name: /Ferrugem asiática em Cascavel/ }).click();
  await expect(page).toHaveURL(/\/alertas/);
  await expect(page.getByRole("heading", { name: "Risco alto na sua região" })).toBeVisible();
  await axe();
  await page.getByRole("link", { name: "Ver ficha" }).click();
  await expect(page).toHaveURL(/ferrugem-asiatica/);
  void problems;
});

test("F05-H2 clima com janela de pulverização", async ({ page, withProfile, problems, axe }) => {
  await withProfile();
  await page.goto("/clima");
  await expect(page.getByText(/Próxima janela boa|Nenhum dia bom/)).toBeVisible();
  const table = page.getByRole("table", { name: /Previsão para os próximos 7 dias/ });
  await expect(table.getByRole("columnheader")).toHaveCount(7);
  await expect(page.getByRole("table", { name: "Umidade e vento por dia" }).getByRole("rowheader")).toHaveCount(7);
  await axe();
  void problems;
});

test("F05-E1 sem município", async ({ page, withProfile, problems, axe }) => {
  await withProfile({ ...PROFILE, municipio: undefined });
  await page.goto("/alertas");
  await expect(page.getByRole("heading", { name: "Sem município definido" })).toBeVisible();
  await page.getByRole("link", { name: "Escolher município" }).click();
  await expect(page).toHaveURL(/\/perfil/);
  await axe();
  void problems;
});
