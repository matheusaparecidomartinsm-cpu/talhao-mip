import { test, expect, pickPhoto, allow } from "./fixtures";

test.beforeEach(async ({ withProfile }) => { await withProfile(); });

test("F01-H1 foto → resultado → ficha em 3 toques", async ({ page, problems, axe }) => {
  await page.goto("/");
  await axe();
  let taps = 0;
  await page.getByRole("link", { name: "Diagnosticar com foto" }).first().click(); taps++;
  await expect(page).toHaveURL(/\/camera$/);
  await axe();
  await pickPhoto(page, "folha.jpg"); taps++;
  await expect(page).toHaveURL(/\/diagnostico\//, { timeout: 15_000 });
  const name = page.locator("#res-nome");
  await expect(name).toBeVisible();
  await expect(page.getByText(/(Muito provável|Provável|Possível) · \d+%/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manejo" })).toBeVisible();
  if (await page.getByText("Controle químico", { exact: true }).count()) {
    await expect(page.getByText(/receituário agronômico/).first()).toBeVisible();
  } else {
    await expect(page.getByText(/receituário agronômico/)).toHaveCount(0);   // sem químico, sem aviso
  }
  await axe();
  expect(taps).toBeLessThanOrEqual(3);
  const resultName = (await name.textContent()) ?? "";
  await page.getByRole("link", { name: "Ver ficha completa" }).click();
  await expect(page.locator("h2").first()).toHaveText(resultName);
  void problems;
});

test("F01-H2 feedback fica salvo ao recarregar", async ({ page, problems }) => {
  await page.goto("/camera");
  await pickPhoto(page, "folha.jpg");
  await page.locator("#res-nome").waitFor({ timeout: 15_000 });
  await page.getByRole("button", { name: "Bateu", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Bateu", exact: true })).toHaveAttribute("aria-pressed", "true");
  void problems;
});

test("F01-E1 foto escura avisa antes de enviar", async ({ page, problems, axe }) => {
  await page.goto("/camera");
  await pickPhoto(page, "escura.jpg");
  await expect(page.getByRole("heading", { name: "A foto ficou escura" })).toBeVisible();
  await axe();
  await page.getByRole("button", { name: "Enviar assim mesmo" }).click();
  await expect(page).toHaveURL(/\/diagnostico\//, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /Não conseguimos identificar|Nenhum problema/ })).toBeVisible();
  await axe();
  void problems;
});

test("F01-E2 arquivo que não é imagem mostra erro e não quebra", async ({ page, problems }) => {
  await page.goto("/camera");
  await pickPhoto(page, "nao-e-imagem.jpg");
  await expect(page.getByRole("alert").filter({ hasText: /não parece uma foto/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Escolher foto", exact: true })).toBeEnabled();
  void problems;
});

test("F01-E3 offline vai para a fila e processa quando a rede volta", async ({ page, context, problems }) => {
  allow(page, "net::ERR_FAILED"); // requisições recusadas enquanto o navegador está offline (esperado)
  await page.goto("/camera");
  await page.getByText(/Câmera indisponível|Sem acesso à câmera/).waitFor();
  await context.setOffline(true);
  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/folha.jpg");
  await expect(page.getByText("Foto guardada na fila")).toBeVisible();
  await page.getByRole("link", { name: "Voltar ao início" }).click().catch(() => {});
  await context.setOffline(false);
  await page.goto("/biblioteca");
  await expect(page.getByText("Pronto! Toque para ver o resultado")).toBeVisible({ timeout: 15_000 });
  await page.getByText("Pronto! Toque para ver o resultado").click();
  await expect(page.locator("#res-nome")).toBeVisible();
  void problems;
});

test("F01-E4 rede lenta: análise espera e conclui", async ({ page, problems }) => {
  await page.route("**/api/diagnoses", async (r) => { await new Promise((x) => setTimeout(x, 6000)); await r.continue(); });
  await page.goto("/camera");
  await pickPhoto(page, "folha.jpg");
  await expect(page.getByText(/Conferindo|Procurando|Montando/)).toBeVisible();
  await expect(page.locator("#res-nome")).toBeVisible({ timeout: 25_000 });
  void problems;
});

test("F01-E5 recarregar no meio da análise retoma a fila", async ({ page, problems }) => {
  let first = true;
  await page.route("**/api/diagnoses", async (r) => {
    if (first) { first = false; await new Promise((x) => setTimeout(x, 4000)); return r.abort("connectionreset").catch(() => {}); }
    await r.continue();
  });
  await page.goto("/camera");
  await pickPhoto(page, "folha.jpg");
  await expect(page.getByText(/Conferindo|Procurando|Montando/)).toBeVisible();
  await page.goto("/historico");
  await page.reload();
  const row = page.getByRole("link", { name: /Analisando|Na fila|Falhou|Muito provável|Provável|Possível/ }).first();
  await expect(row).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(/Pronto! Toque para ver|Não deu pra analisar/)).toBeVisible({ timeout: 20_000 });
  void problems;
});

test("F01-E6 voltar no meio da análise não trava e fica no histórico", async ({ page, problems }) => {
  await page.route("**/api/diagnoses", async (r) => { await new Promise((x) => setTimeout(x, 2500)); await r.continue(); });
  await page.goto("/");
  await page.getByRole("link", { name: "Diagnosticar com foto" }).first().click();
  await pickPhoto(page, "folha.jpg");
  await expect(page.getByText(/Conferindo|Procurando|Montando/)).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: /O que está acontecendo/ })).toBeVisible();
  await page.goto("/historico");
  await expect(page.getByRole("listitem")).toHaveCount(1);
  void problems;
});

test("F01-E7 duas abas não analisam o mesmo diagnóstico duas vezes", async ({ page, context, problems }) => {
  allow(page, "net::ERR_FAILED"); // requisições recusadas enquanto o navegador está offline (esperado)
  let posts = 0;
  await context.route("**/api/diagnoses", async (r) => { posts++; await new Promise((x) => setTimeout(x, 800)); await r.continue(); });
  await page.goto("/camera");
  await page.getByText(/Câmera indisponível|Sem acesso à câmera/).waitFor();
  await context.setOffline(true);
  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/folha.jpg");
  await expect(page.getByText("Foto guardada na fila")).toBeVisible();
  const second = await context.newPage();
  await second.goto("/biblioteca").catch(() => {});
  await context.setOffline(false);
  await page.goto("/biblioteca");
  await second.reload();
  await page.waitForTimeout(4000);
  expect(posts).toBe(1);
  void problems;
});

test("F01-E8 sem rolagem horizontal em 390 e 1440 px", async ({ page, problems }) => {
  await page.goto("/camera");
  await pickPhoto(page, "folha.jpg");
  await page.locator("#res-nome").waitFor({ timeout: 15_000 });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `largura ${width}`).toBe(true);
  }
  void problems;
});

test("F01-E9 só teclado chega à câmera e à galeria", async ({ page, problems }) => {
  await page.goto("/");
  let found = false;
  for (let i = 0; i < 30 && !found; i++) {
    await page.keyboard.press("Tab");
    found = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Diagnosticar com foto");
  }
  expect(found).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/camera$/);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAccessibleName("Escolher foto da galeria");
  void problems;
});

test("F01-N1 erro do servidor → tentar de novo funciona", async ({ page, problems }) => {
  allow(page, "/api/diagnoses");
  allow(page, "502");
  let n = 0;
  await page.route("**/api/diagnoses", async (r) => {
    if (n++ === 0) return r.fulfill({ status: 502, contentType: "application/json", body: '{"error":"O serviço de análise não respondeu."}' });
    await r.continue();
  });
  await page.goto("/camera");
  await pickPhoto(page, "folha.jpg");
  await expect(page).toHaveURL(/\/diagnostico\//, { timeout: 15_000 });
  await expect(page.getByText("Não conseguimos analisar agora")).toBeVisible();
  await page.getByRole("button", { name: "Tentar de novo", exact: true }).click();
  await expect(page.locator("#res-nome")).toBeVisible({ timeout: 15_000 });
  void problems;
});

test("F01-N2 diagnóstico inexistente", async ({ page, problems, axe }) => {
  await page.goto("/diagnostico/00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "Diagnóstico não encontrado" })).toBeVisible();
  await axe();
  void problems;
});
