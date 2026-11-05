import { createFileRoute } from "@tanstack/react-router";
import { CompanySettings } from "@/components/CompanySettings";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/configuracoes")({
  head: () => pageHead("Empresa", "Dados e logo da assistência para suas ordens de serviço."),
  component: Page,
});
function Page() { return <CompanySettings />; }
