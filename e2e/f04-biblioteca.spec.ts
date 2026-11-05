import { test, expect, allow } from "./fixtures";

test.beforeEach(async ({ withProfile }) => { await withProfile(); });

test("F04-H1 cultura → filtro → ficha", async ({ page, problems, axe }) => {
  await page.goto("/biblioteca");
  await axe();
  await page.getByRole("link", { name: "Soja" }).click();
  await axe();
  await page.getByRole("radio", { name: "Inseto" }).click();
  const cards = page.getByRole("link", { name: /Lagarta|Percevejo|Mosca/ });
  await expect(cards).toHaveCount(4);
  await expect(page.getByRole("link", { name: /Ferrugem/ })).toHaveCount(0);
  await page.getByRole("link", { name: /Percevejo-marrom/ }).click();
  await expect(page.getByRole("heading", { name: "Sintomas" })).toBeVisible();
  await expect(page.getByText(/receituário agronômico/)).toBeVisible();
  await axe();
  void problems;
});

for (const q of ["ferrugem", "PERCEVEJO", "acaro"]) {
  test(`F04-H2 busca "${q}"`, async ({ page, problems }) => {
    await page.goto("/biblioteca");
    await page.getByRole("searchbox", { name: "Procurar na biblioteca" }).fill(q);
    await expect(page.getByRole("search").getByRole("link").first()).toBeVisible();
    void problems;
  });
}

test("F04-E1 busca sem resultado", async ({ page, problems }) => {
  await page.goto("/biblioteca");
  await page.getByRole("searchbox", { name: "Procurar na biblioteca" }).fill("xyzw");
  await expect(page.getByText(/Nada encontrado para/)).toBeVisible();
  void problems;
});

test("F04-E2 offline abre ficha nunca visitada", async ({ page, context, problems }) => {
  allow(page, "net::ERR_FAILED"); // requisições recusadas enquanto o navegador está offline (esperado)
  allow(page, "ERR_INTERNET_DISCONNECTED");
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForTimeout(1500);
  await context.setOffline(true);
  await page.goto("/biblioteca/soja/mancha-alvo");
  await expect(page.getByRole("heading", { name: "Mancha-alvo", level: 2 })).toBeVisible();
  await context.setOffline(false);
  void problems;
});

test("F04-E3 accordion pelo teclado", async ({ page, problems }) => {
  await page.goto("/biblioteca/soja/ferrugem-asiatica");
  const prev = page.locator("summary", { hasText: "Prevenção" });
  await prev.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/vazio sanitário e o calendário/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/vazio sanitário e o calendário/)).toBeHidden();
  void problems;
});

test("F04-N1 ficha e cultura inexistentes → 404 própria", async ({ page, problems, axe }) => {
  allow(page, "404");
  for (const u of ["/biblioteca/soja/nao-existe", "/biblioteca/milho"]) {
    const r = await page.goto(u);
    expect(r?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  }
  await axe();
  void problems;
});
