import { createFileRoute } from "@tanstack/react-router";
import { CatalogEditor } from "@/components/CatalogEditor";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/servicos")({
  head: () => pageHead("Serviços", "Cadastre serviços e seus prazos de garantia."),
  component: Page,
});
function Page() { return <CatalogEditor kind="services" />; }
