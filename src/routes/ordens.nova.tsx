import { createFileRoute } from "@tanstack/react-router";
import { OrderEditor } from "@/components/OrderEditor";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/ordens/nova")({
  head: () => pageHead("Nova O.S.", "Emita uma ordem com fotos, checklist, garantia e assinatura."),
  component: Page,
});
function Page() { return <OrderEditor />; }
