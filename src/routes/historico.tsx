import { createFileRoute } from "@tanstack/react-router";
import { History } from "@/components/History";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/historico")({
  head: () => pageHead("Histórico", "Busque ordens por cliente, telefone e número, e acompanhe seus status."),
  component: Page,
});
function Page() { return <History />; }
