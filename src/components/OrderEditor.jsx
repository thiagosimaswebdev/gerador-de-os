import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkshop } from "@/contexts/WorkshopContext";
import { STATUS, numeroUnico, mensagemWhatsApp } from "@/lib/os";
import { imageFromFile } from "@/services/images";
import { Camera, Trash2, Save, ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SignaturePad } from "@/components/SignaturePad";
import {
  ACESSORIOS, MARCA_IOS, MARCAS_ANDROID, MODELOS_IPHONE,
  formatBRLFromDigits, formatPhone, garantiaDaOrdem, validar,
} from "@/lib/os";

const vazio = (numero = "") => ({
  status: "Recebido", trackingUrl: "", fotos: [], assinatura: null,
  numero, emissao: new Date(), cliente: "", telefone: "", so: "", marca: "", modelo: "",
  imei: "", senha: "", servico: "", descricao: "", garantiaCustom: "", valor: "", checklist: [], checklistOutro: "", acessorios: [], observacoes: "",
});

function Card({ title, children }) {
  return (
    <section className="border-b py-5">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-normal text-primary">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Field({ label, req, children }) {
  const id = `order-${label.replace(/[^a-zA-Z0-9]/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}{req && <span className="text-destructive"> *</span>}</Label>
      {React.isValidElement(children) && [Input, Textarea, "select"].includes(children.type) ? React.cloneElement(children, { id }) : children}
    </div>
  );
}
function Chips({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <label key={o} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${on ? "border-primary bg-accent text-accent-foreground" : "border-border"}`}>
            <Checkbox checked={on} onCheckedChange={(c) => onChange(c ? [...value, o] : value.filter((x) => x !== o))} />
            {o}
          </label>
        );
      })}
    </div>
  );
}
const selectCls = "h-11 w-full rounded-md border border-input bg-background px-3 text-base";

export function OrderEditor({ numero }) {
  const { settings, orders, saveOrder } = useWorkshop();
  const navigate = useNavigate();
  const existing = orders.find(o => o.numero === numero);
  const [editing, setEditing] = useState(Boolean(existing));
  const [savedSignature, setSavedSignature] = useState(existing?.assinatura || null);
  const [os, setOs] = useState(() => existing ? { ...existing, emissao: new Date(existing.emissao) } : vazio(numeroUnico(orders.map(o => o.numero))));
  const [logo, setLogo] = useState(settings.empresa.logo || null);
  const [pdf, setPdf] = useState(null);
  const [busy, setBusy] = useState(false);
  const sig = useRef(null);
  const set = (k, v) => setOs((p) => ({ ...p, [k]: v }));
  const [outraMarca, setOutraMarca] = useState(Boolean(existing?.so === "Android" && !MARCAS_ANDROID.includes(existing?.marca)));
  const trocarSO = (s) => {
    setOs((p) => ({ ...p, so: s, marca: s === "iPhone (iOS)" ? MARCA_IOS : "", modelo: "" }));
    setOutraMarca(false);
  };

  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf.url); }, [pdf]);
  const persist = async () => {
    const err = validar(os);
    if (err) { toast.error(err); return null; }
    const assinatura = sig.current ? sig.current.toDataURL() : savedSignature;
    const saved = await saveOrder({ ...os, assinatura, empresa: { ...settings.empresa } }, editing);
    setOs(saved); setEditing(true); setSavedSignature(assinatura);
    return saved;
  };
  const salvar = async () => {
    setBusy(true);
    try { const saved = await persist(); if (saved) { toast.success("Ordem salva."); navigate({ to: "/historico" }); } }
    catch { toast.error("Não foi possível salvar esta ordem."); }
    finally { setBusy(false); }
  };
  const gerar = async () => {
    const err = validar(os);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const { gerarPDF } = await import("@/lib/pdf");
      const saved = await persist();
      if (!saved) return;
      const blob = await gerarPDF(saved, saved.empresa?.logo || logo, saved.assinatura);
      if (pdf) URL.revokeObjectURL(pdf.url);
      setPdf({ blob, url: URL.createObjectURL(blob) });
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setBusy(false);
    }
  };

  const fileName = `${os.numero}.pdf`;
  const baixar = () => {
    if (!pdf) return;
    const a = document.createElement("a");
    a.href = pdf.url; a.download = fileName; a.click();
  };
  const compartilhar = async () => {
    if (!pdf) return;
    const file = new File([pdf.blob], fileName, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `Ordem de Serviço ${os.numero}` }); } catch { /* cancelado */ }
    } else {
      toast.info("Compartilhamento não suportado neste navegador. Baixe o PDF.");
    }
  };
  const nova = () => {
    if (pdf) URL.revokeObjectURL(pdf.url);
    if (numero) { navigate({ to: "/ordens/nova" }); return; }
    setPdf(null); setOs(vazio(numeroUnico(orders.map(o => o.numero)))); setEditing(false); setSavedSignature(null); sig.current?.clear(); setOutraMarca(false); window.scrollTo({ top: 0 });
  };

  const dias = garantiaDaOrdem(os);
  if (numero && !existing && !editing) return <main className="p-8">Ordem não encontrada.</main>;

  if (pdf) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 p-4 pb-8">
        
        <header className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-normal text-primary">PDF gerado</p>
          <h1 className="text-2xl font-extrabold">{os.numero}</h1>
        </header>
        <iframe src={pdf.url} title="Prévia do PDF" className="h-[60vh] w-full rounded-lg border bg-card" />
        <div className="grid gap-3">
          <Button size="lg" className="h-12 text-base font-bold" onClick={compartilhar}>COMPARTILHAR PDF</Button>
          <Button size="lg" variant="outline" className="h-12 text-base font-bold" onClick={baixar}>BAIXAR PDF</Button>
          <Button variant="secondary" onClick={() => window.open(`https://wa.me/55${os.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagemWhatsApp(os.numero))}`, "_blank", "noopener,noreferrer")}><Send className="size-4" />Enviar para cliente</Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" onClick={() => setPdf(null)}>Editar ordem</Button>
            <Button variant="secondary" onClick={nova}>Nova ordem</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4 pb-28">
      
      <header className="pt-2"><Button variant="ghost" size="sm" onClick={() => navigate({ to: "/historico" })}><ArrowLeft className="size-4" />Voltar</Button><p className="mt-4 text-xs font-semibold uppercase text-primary">{editing ? "Editar ordem" : "Nova ordem"}</p><h1 className="text-xl font-extrabold">{os.numero}</h1></header>
      <Field label="Status"><select aria-label="Status da ordem" className={selectCls} value={os.status} onChange={e => set("status", e.target.value)}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></Field>

      <Card title="Cliente">
        <Field label="Nome do cliente" req><Input className="h-11" value={os.cliente} onChange={(e) => set("cliente", e.target.value)} /></Field>
        <Field label="Telefone" req><Input className="h-11" inputMode="tel" placeholder="(11) 98765-4321" value={os.telefone} onChange={(e) => set("telefone", formatPhone(e.target.value))} /></Field>
      </Card>

      <Card title="Equipamento">
        <Field label="Sistema operacional" req>
          <div className="grid grid-cols-2 gap-2">
            {(["Android", "iPhone (iOS)"]).map((s) => (
              <Button key={s} type="button" variant={os.so === s ? "default" : "outline"} className="h-11" onClick={() => trocarSO(s)}>{s}</Button>
            ))}
          </div>
        </Field>
        {os.so === "Android" && (
          <>
            <Field label="Marca" req>
              <div className="grid grid-cols-3 gap-2">
                {MARCAS_ANDROID.map((m) => (
                  <Button key={m} type="button" variant={os.marca === m && !outraMarca ? "default" : "outline"} className="h-10 px-1 text-sm" onClick={() => { setOutraMarca(false); set("marca", m); }}>{m}</Button>
                ))}
                <Button type="button" variant={outraMarca ? "default" : "outline"} className="h-10 px-1 text-sm" onClick={() => { setOutraMarca(true); set("marca", ""); }}>Outra</Button>
              </div>
            </Field>
            {outraMarca && <Field label="Qual marca?"><Input className="h-11" value={os.marca} onChange={(e) => set("marca", e.target.value)} /></Field>}
            <Field label="Modelo" req><Input className="h-11" placeholder="Ex.: Moto G 5G" value={os.modelo} onChange={(e) => set("modelo", e.target.value)} /></Field>
          </>
        )}
        {os.so === "iPhone (iOS)" && (
          <>
            <Field label="Marca" req><Input className="h-11 bg-muted" readOnly value={MARCA_IOS} /></Field>
            <Field label="Modelo" req>
              <select className={selectCls} value={os.modelo} onChange={(e) => set("modelo", e.target.value)}>
                <option value="">Selecione…</option>
                {MODELOS_IPHONE.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="IMEI"><Input className="h-11" inputMode="numeric" value={os.imei} onChange={(e) => set("imei", e.target.value.replace(/\D/g, "").slice(0, 15))} /></Field>
          <Field label="Senha"><Input className="h-11" value={os.senha} onChange={(e) => set("senha", e.target.value)} /></Field>
        </div>
      </Card>

      <Card title="Serviço">
        <Field label="Serviço executado" req>
          <select className={selectCls} value={os.serviceId || (os.servico === "Outros" ? "outros" : "")} onChange={(e) => { const service = settings.services.find(s => s.id === e.target.value); setOs(p => ({ ...p, serviceId: e.target.value, servico: service?.nome || (e.target.value === "outros" ? "Outros" : ""), garantiaSnapshot: service?.dias, garantiaCustom: "", serviceObservation: service?.observacao || "" })); }}>
            <option value="">Selecione…</option>
            {settings.services.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            {os.serviceId && os.serviceId !== "outros" && !settings.services.some(s => s.id === os.serviceId) && <option value={os.serviceId}>{os.servico}</option>}
            <option value="outros">Outros</option>
          </select>
        </Field>
        {os.servico === "Outros" && (
          <>
            <Field label="Descrição do serviço" req><Input className="h-11" value={os.descricao} onChange={(e) => set("descricao", e.target.value)} /></Field>
            <Field label="Garantia (dias)" req><Input className="h-11" inputMode="numeric" value={os.garantiaCustom} onChange={(e) => setOs(p => ({ ...p, garantiaCustom: e.target.value.replace(/\D/g, "").slice(0, 4), garantiaSnapshot: undefined }))} /></Field>
          </>
        )}
        {dias !== null && <p className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">Garantia: {dias} dias</p>}
        <Field label="Valor" req><Input className="h-11 text-lg font-bold" inputMode="numeric" placeholder="R$ 0,00" value={os.valor} onChange={(e) => set("valor", formatBRLFromDigits(e.target.value))} /></Field>
      </Card>

      <Card title="Checklist de entrada">
        <Chips options={[...new Set([...settings.checklist.map(c => c.nome), ...os.checklist])]} value={os.checklist} onChange={(v) => set("checklist", v)} />
        {os.checklist.includes("Outro") && (
          <Field label="Descreva o item “Outro”">
            <Textarea rows={2} maxLength={200} placeholder="Ex.: Moldura trincada na lateral" value={os.checklistOutro} onChange={(e) => set("checklistOutro", e.target.value)} />
          </Field>
        )}
      </Card>
      <Card title="Acessórios recebidos"><Chips options={ACESSORIOS} value={os.acessorios} onChange={(v) => set("acessorios", v)} /></Card>

      <Card title="Observações">
        <Textarea rows={3} maxLength={500} value={os.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
        <p className="text-right text-xs text-muted-foreground">{os.observacoes.length}/500</p>
      </Card>

      <Card title="Fotos do aparelho (opcional)"><PhotoGallery fotos={os.fotos || []} onChange={(f) => set("fotos", f)} /></Card>

      <Card title="Assinatura do cliente (opcional)">
        <SignaturePad ref={sig} initialValue={savedSignature} />
        <Button variant="outline" size="sm" onClick={() => { sig.current?.clear(); setSavedSignature(null); }}>Limpar assinatura</Button>
      </Card>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-xl gap-3">
          <Button variant="outline" className="h-13" disabled={busy} onClick={salvar}><Save className="size-4" />Salvar</Button>
          <Button size="lg" className="h-13 w-full text-base font-bold" disabled={busy} onClick={gerar}>
            {busy ? "Gerando…" : "Gerar PDF"}
          </Button>
        </div>
      </div>
    </main>
  );
}
