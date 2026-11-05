import { test, expect, pickPhoto } from "./fixtures";

test.beforeEach(async ({ withProfile }) => { await withProfile(); });

test("F03-H1 resultado errado → perguntar com a foto", async ({ page, problems, axe }) => {
  await page.goto("/camera");
  await pickPhoto(page, "folha.jpg");
  await page.locator("#res-nome").waitFor({ timeout: 15_000 });
  await page.getByRole("button", { name: "Não bateu" }).click();
  await page.getByRole("link", { name: "Pergunte à comunidade" }).click();
  await expect(page.getByRole("img", { name: "Foto do diagnóstico anexada" })).toBeVisible();
  await axe();
  await page.getByLabel("Título").fill("Manchas marrons nas folhas de baixo");
  await page.getByRole("button", { name: "Publicar pergunta" }).click();
  await expect(page.getByRole("heading", { name: "Manchas marrons nas folhas de baixo" })).toBeVisible();
  await axe();
  await page.goto("/comunidade");
  await expect(page.getByRole("link", { name: /Manchas marrons nas folhas de baixo/ })).toBeVisible();
  await axe();
  void problems;
});

test("F03-H2 responder uma pergunta", async ({ page, problems, axe }) => {
  await page.goto("/comunidade/q3");
  await axe();
  await page.getByLabel("Sua resposta").fill("Vale olhar a face de baixo com lupa.");
  await page.getByRole("button", { name: "Responder" }).click();
  await expect(page.getByText("Vale olhar a face de baixo com lupa.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "1 resposta" })).toBeVisible();
  void problems;
});

test("F03-E1 título curto dá erro no campo", async ({ page, problems }) => {
  await page.goto("/comunidade/nova");
  await page.getByLabel("Título").fill("oi");
  await page.getByRole("button", { name: "Publicar pergunta" }).click();
  await expect(page.getByText("Escreva pelo menos 5 letras no título")).toBeVisible();
  await expect(page.getByLabel("Título")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/nova/);
  void problems;
});

test("F03-E2 título longo com acento e emoji", async ({ page, problems }) => {
  await page.goto("/comunidade/nova");
  const longo = "Lagartas 🐛 comendo folhas da soja em reboleira, ação já? Ação, atenção, pulverização, decisão 🌱 ".repeat(2);
  await page.getByLabel("Título").fill(longo);
  await page.getByRole("button", { name: "Publicar pergunta" }).click();
  await expect(page.getByText("Máximo de 140 caracteres")).toBeVisible();
  await page.getByLabel("Título").fill(longo.slice(0, 120));
  await page.getByRole("button", { name: "Publicar pergunta" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toContainText("🐛");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  void problems;
});

test("F03-E3 duplo clique publica uma vez só", async ({ page, problems }) => {
  await page.goto("/comunidade/nova");
  await page.getByLabel("Título").fill("Pergunta de duplo clique");
  await page.getByRole("button", { name: "Publicar pergunta" }).dblclick();
  await expect(page.getByRole("heading", { name: "Pergunta de duplo clique" })).toBeVisible();
  await page.goto("/comunidade");
  await expect(page.getByRole("link", { name: /Pergunta de duplo clique/ })).toHaveCount(1);
  void problems;
});

test("F03-E4 útil liga e desliga", async ({ page, problems }) => {
  await page.goto("/comunidade/q2");
  const b = page.getByRole("button", { name: /Marcar como útil, 7 pessoas/ });
  await b.click();
  await expect(page.getByRole("button", { name: /Marcar como útil, 8 pessoas/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Marcar como útil, 8 pessoas/ }).click();
  await expect(page.getByRole("button", { name: /Marcar como útil, 7 pessoas/ })).toHaveAttribute("aria-pressed", "false");
  void problems;
});

test("F03-N1 pergunta inexistente", async ({ page, problems, axe }) => {
  await page.goto("/comunidade/nao-existe");
  await expect(page.getByRole("heading", { name: "Pergunta não encontrada" })).toBeVisible();
  await axe();
  void problems;
});
