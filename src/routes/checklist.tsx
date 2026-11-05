import { createFileRoute } from "@tanstack/react-router";
import { CatalogEditor } from "@/components/CatalogEditor";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/checklist")({
  head: () => pageHead("Checklist", "Gerencie os itens do checklist de entrada dos aparelhos."),
  component: Page,
});
function Page() { return <CatalogEditor kind="checklist" />; }
