import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Save, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkshop } from "@/contexts/WorkshopContext";
import { imageFromFile } from "@/services/images";
import { BackupSettings } from "@/components/BackupSettings";

const fields = [["nome", "Nome da empresa"], ["fantasia", "Nome fantasia"], ["telefone", "Telefone"], ["whatsapp", "WhatsApp"], ["instagram", "Instagram"], ["email", "E-mail"], ["endereco", "Endereço"], ["cidade", "Cidade"], ["estado", "Estado"]];
export function CompanySettings() {
  const { settings, saveSettings } = useWorkshop();
  const [company, setCompany] = useState(settings.empresa);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    try { await saveSettings({ ...settings, empresa: company, configured: true }); toast.success("Dados da empresa salvos."); if (!settings.configured) navigate({ to: "/" }); }
    catch { toast.error("Não foi possível salvar os dados neste aparelho."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
    <p className="mb-2 text-xs font-bold uppercase text-primary">{settings.configured ? "Configurações" : "Primeiro acesso"}</p><h1 className="text-2xl font-extrabold">Sua assistência</h1>
    <form onSubmit={submit} className="mt-8 space-y-6">
      <div className="flex items-center gap-4"><label className="flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-card text-muted-foreground">{company.logo ? <img src={company.logo} alt="Logo" className="size-full object-contain" /> : <Upload className="size-6" />}<input aria-label="Enviar logo da empresa" type="file" accept="image/*" className="hidden" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { const logo = await imageFromFile(file, 800); setCompany(p => ({ ...p, logo })); } catch { toast.error("Não foi possível abrir esta imagem."); } }} /></label><div><p className="font-semibold">Logo da empresa</p>{company.logo && <Button type="button" size="sm" variant="ghost" onClick={() => setCompany(p => ({ ...p, logo: null }))}><Trash2 className="size-4" />Remover</Button>}</div></div>
      <div className="grid gap-5 sm:grid-cols-2">{fields.map(([key, label]) => <div key={key} className={key === "endereco" ? "space-y-2 sm:col-span-2" : "space-y-2"}><Label htmlFor={`company-${key}`}>{label}{key === "nome" && " *"}</Label><Input id={`company-${key}`} required={key === "nome"} maxLength={key === "endereco" ? 200 : 100} type={key === "email" ? "email" : "text"} inputMode={["telefone", "whatsapp"].includes(key) ? "tel" : undefined} value={company[key] || ""} onChange={e => setCompany(p => ({ ...p, [key]: e.target.value }))} className="h-11" /></div>)}</div>
      <Button type="submit" disabled={busy} size="lg"><Save className="size-4" />{busy ? "Salvando…" : "Salvar empresa"}</Button>
    </form>
    <BackupSettings />
  </main>;
}