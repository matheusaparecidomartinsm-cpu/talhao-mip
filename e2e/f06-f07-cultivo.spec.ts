import { test, expect, PROFILE } from "./fixtures";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

test("F06-H1 fase atual e o que monitorar", async ({ page, withProfile, problems, axe }) => {
  await withProfile();
  await page.goto("/plano");
  await expect(page.getByText(/68 dias após a semeadura · Formação de vagens/)).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "R3" }).first()).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("link", { name: "Percevejo-marrom" })).toBeVisible();
  await axe();
  void problems;
});

test("F06-E1 data no futuro não salva", async ({ page, withProfile, problems }) => {
  await withProfile({ ...PROFILE, sowingDate: undefined });
  await page.goto("/plano");
  await page.getByLabel("Data de semeadura").fill(new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("A data não pode ser no futuro")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sem data de semeadura" })).toBeVisible();
  void problems;
});

test("F06-E2 sem data mostra estado vazio", async ({ page, withProfile, problems, axe }) => {
  await withProfile({ ...PROFILE, sowingDate: undefined });
  await page.goto("/plano");
  await expect(page.getByRole("heading", { name: "Sem data de semeadura" })).toBeVisible();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Informe a data")).toBeVisible();
  await axe();
  void problems;
});

test("F06-E3 depois do ciclo fica na última fase", async ({ page, withProfile, problems }) => {
  await withProfile({ ...PROFILE, sowingDate: daysAgo(200) });
  await page.goto("/plano");
  await expect(page.getByText(/200 dias após a semeadura · Maturação/)).toBeVisible();
  void problems;
});

test("F07-H1 10 ha", async ({ page, withProfile, problems, axe }) => {
  await withProfile();
  await page.goto("/calculadora");
  await page.getByLabel("Área").fill("10");
  const t = page.getByRole("table", { name: "Quantidade estimada por nutriente" });
  await expect(t.getByRole("row", { name: /P₂O₅/ })).toContainText("600–1.000 kg");
  await expect(t.getByRole("row", { name: /K₂O/ })).toContainText("600–1.200 kg");
  await axe();
  void problems;
});

test("F07-H2 alqueire paranaense", async ({ page, withProfile, problems }) => {
  await withProfile();
  await page.goto("/calculadora");
  await page.getByLabel("Área").fill("2");
  await page.getByLabel("Unidade").selectOption("alq");
  await expect(page.getByText("= 4,84 ha")).toBeVisible();
  void problems;
});

test("F07-E1 vírgula decimal", async ({ page, withProfile, problems }) => {
  await withProfile();
  await page.goto("/calculadora");
  await page.getByLabel("Área").fill("12,5");
  await expect(page.getByRole("row", { name: /P₂O₅/ })).toContainText("750–1.250 kg");
  void problems;
});

for (const v of ["0", "-3", "abc"]) {
  test(`F07-E2 valor inválido "${v}"`, async ({ page, withProfile, problems }) => {
    await withProfile();
    await page.goto("/calculadora");
    await page.getByLabel("Área").fill(v);
    await expect(page.getByText("Informe uma área maior que zero")).toBeVisible();
    await expect(page.getByRole("row", { name: /P₂O₅/ })).toContainText("—");
    void problems;
  });
}
