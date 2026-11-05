import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { AppBar, Page } from "@/components/shell";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Produtos" };
export default function Products() {
  return (
    <>
      <AppBar title="Produtos registrados" back />
      <Page>
        <EmptyState icon={<PackageSearch className="size-8" />} title="Consulta de produtos em breve"
          action={<a className="inline-flex min-h-12 items-center rounded-md bg-accent px-5 font-semibold text-on-accent" href="https://agrofit.agricultura.gov.br/agrofit_cons/principal_agrofit_cons" target="_blank" rel="noopener noreferrer">Abrir o Agrofit</a>}>
          O Talhão não vende produtos. Por enquanto, consulte os registrados para cada praga no Agrofit, do Ministério da Agricultura.
        </EmptyState>
      </Page>
    </>
  );
}
