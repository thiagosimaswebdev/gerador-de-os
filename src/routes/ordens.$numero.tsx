import { createFileRoute } from "@tanstack/react-router";
import { OrderEditor } from "@/components/OrderEditor";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/ordens/$numero")({
  head: () => pageHead("Detalhes da O.S.", "Consulte, edite e gere novamente o PDF de uma ordem salva."),
  component: Page,
});
function Page() { const { numero } = Route.useParams(); return <OrderEditor key={numero} numero={numero} />; }
