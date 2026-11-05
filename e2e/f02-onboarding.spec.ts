import { test, expect } from "./fixtures";

test("F02-H1 primeira abertura até o início", async ({ page, problems, axe }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/boas-vindas$/);
  await axe();
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("button", { name: /Soja/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Município").selectOption("Cascavel");
  await page.getByRole("button", { name: "Entrar no Glyma" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Olá · Cascavel")).toBeVisible();
  await expect(page.getByRole("link", { name: /Ferrugem asiática em Cascavel/ })).toBeVisible();
  await axe();
  void problems;
});

test("F02-E1 sem cultura não continua", async ({ page, problems }) => {
  await page.goto("/boas-vindas");
  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: /Soja/ }).click();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
  await expect(page.getByText("Escolha pelo menos uma cultura")).toBeVisible();
  void problems;
});

test("F02-E2 pular município mostra estado vazio no início", async ({ page, problems }) => {
  await page.goto("/boas-vindas");
  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Entrar no Glyma" }).click();
  await expect(page.getByRole("heading", { name: "Informe seu município" })).toBeVisible();
  void problems;
});

test("F02-E3 voltar mantém a escolha", async ({ page, problems }) => {
  await page.goto("/boas-vindas");
  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Município").selectOption("Toledo");
  await page.getByRole("button", { name: "Voltar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByLabel("Município")).toHaveValue("Toledo");
  void problems;
});

test("F02-E4 recarregar no meio não quebra", async ({ page, problems }) => {
  await page.goto("/boas-vindas");
  await page.getByRole("button", { name: "Começar" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Começar" })).toBeVisible();
  void problems;
});

test("F02-E5 com perfil não volta para boas-vindas", async ({ page, withProfile, problems }) => {
  await withProfile();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /O que está acontecendo/ })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  void problems;
});
