import { useEffect, useState } from "react";
import { logoColors } from "@/services/logo-colors";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, Wrench, ListChecks, Settings, Smartphone, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkshop } from "@/contexts/WorkshopContext";

const links = [ ["/", "Início", LayoutDashboard], ["/historico", "Histórico", ClipboardList], ["/servicos", "Serviços", Wrench], ["/checklist", "Checklist", ListChecks], ["/configuracoes", "Empresa", Settings] ];
export function WorkshopShell({ children }) {
  const { settings, error, reload } = useWorkshop();
  const location = useLocation();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const logo = settings?.empresa.logo;
  useEffect(() => { let alive = true; logoColors(logo).then(c => { if (alive) setBrand(c); }).catch(() => alive && setBrand(null)); return () => { alive = false; }; }, [logo]);
  useEffect(() => { if (settings && !settings.configured && location.pathname !== "/configuracoes") navigate({ to: "/configuracoes" }); }, [settings, location.pathname, navigate]);
  if (error) return <main className="mx-auto max-w-lg p-8"><h1 className="text-xl font-bold">Dados locais indisponíveis</h1><p role="alert" className="my-4 text-muted-foreground">{error}</p><Button onClick={reload}><RefreshCw className="size-4" />Tentar novamente</Button></main>;
  if (!settings) return <main className="p-8 text-muted-foreground" role="status">Abrindo assistência…</main>;
  return <div className="min-h-screen">
    <header className="brand-header shadow-card" style={brand ? { "--brand-1": brand[0], "--brand-2": brand[1] } : undefined}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          {settings.empresa.logo ? <img src={settings.empresa.logo} alt="Logo da empresa" className="size-10 shrink-0 rounded-md bg-background/90 object-contain p-0.5 shadow-card" /> : <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Smartphone className="size-6" /></span>}
          <span className="min-w-0"><span className="block truncate text-base font-extrabold">{settings.empresa.fantasia || settings.empresa.nome || "Ordem de Serviço"}</span><span className="block text-xs text-primary-foreground/75">Assistência técnica</span></span>
        </Link>
        {settings.configured && <Button asChild size="sm" variant="secondary"><Link to="/ordens/nova"><Plus className="size-4" /><span>Nova O.S.</span></Link></Button>}
      </div>
      <div className="brand-nav"><nav aria-label="Navegação principal" className="mx-auto flex max-w-6xl overflow-x-auto px-2 sm:px-6">
        {links.map(([to, label, Icon]) => <Button key={to} asChild variant="ghost" className={`h-12 shrink-0 rounded-none border-b-2 px-3 text-xs sm:px-4 sm:text-sm ${location.pathname === to ? "border-primary-foreground bg-primary-foreground/20 text-primary-foreground" : "border-transparent text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"}`}><Link to={to}><Icon className="size-4" />{label}</Link></Button>)}
      </nav></div>
    </header>
    {children}
  </div>;
}