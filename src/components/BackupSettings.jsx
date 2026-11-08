import { useRef, useState } from "react";
import { Download, Upload, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWorkshop } from "@/contexts/WorkshopContext";
import { BackupRepository } from "@/repositories/storage";
import { parseBackup } from "@/services/backup";

export function BackupSettings() {
  const { reload } = useWorkshop();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [restoreSettings, setRestoreSettings] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const text = await BackupRepository.export();
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url; link.download = `backup-os-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Cópia de segurança baixada.");
    } catch { toast.error("Não foi possível criar a cópia de segurança."); }
    finally { setBusy(false); }
  }
  async function selectFile(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setBusy(true); setPending(null); setRestoreSettings(false);
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error("Selecione uma cópia de até 100 MB.");
      const text = await file.text();
      const backup = parseBackup(text);
      setPending({ text, count: backup.orders.length, company: backup.settings.empresa.fantasia || backup.settings.empresa.nome || "Empresa sem nome" });
    } catch (error) { toast.error(error.message || "Não foi possível abrir o arquivo."); }
    finally { setBusy(false); }
  }
  async function restore() {
    if (!pending) return;
    setBusy(true);
    try {
      const result = await BackupRepository.restore(pending.text, restoreSettings);
      setPending(null); await reload();
      toast.success(`${result.added} ordem(ns) restaurada(s). ${result.skipped} já existente(s) preservada(s).`);
      if (restoreSettings) window.location.reload();
    } catch { toast.error("Não foi possível restaurar. Os dados anteriores foram preservados."); }
    finally { setBusy(false); }
  }
  return <section className="mt-10 border-t pt-8">
    <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-primary" />Cópia de segurança</h2>
    <p className="mt-2 text-sm text-muted-foreground">Ordens, fotos, assinaturas e configurações ficam neste aparelho. Guarde uma cópia em local seguro: o arquivo contém dados pessoais e senhas de aparelhos, sem criptografia.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <Button type="button" variant="outline" disabled={busy} onClick={download}><Download className="size-4" />Baixar cópia</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload className="size-4" />Restaurar cópia</Button>
      <input ref={input} type="file" accept=".json,application/json" aria-label="Selecionar cópia de segurança" className="hidden" onChange={selectFile} />
    </div>
    {pending && <div className="mt-5 space-y-4 border-l-2 border-primary pl-4" aria-live="polite">
      <p className="text-sm font-semibold">{pending.company} · {pending.count} ordem(ns) na cópia</p>
      <p className="text-sm text-muted-foreground">As ordens existentes serão mantidas. Números repetidos não serão substituídos.</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={busy} checked={restoreSettings} onChange={e => setRestoreSettings(e.target.checked)} className="mt-1" />Substituir também empresa, logo, serviços e checklist pelas configurações da cópia.</label>
      <div className="flex flex-wrap gap-3"><Button type="button" disabled={busy} onClick={restore}>{busy ? "Restaurando…" : "Confirmar restauração"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setPending(null)}>Cancelar</Button></div>
    </div>}
  </section>;
}