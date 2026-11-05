import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/")({
  head: () => pageHead("Início", "Resumo da assistência, ordens em andamento e últimos atendimentos."),
  component: Dashboard,
});
