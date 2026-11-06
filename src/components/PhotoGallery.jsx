import React, { useState } from "react";
import { Camera, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imageFromFile } from "@/services/images";
import { CameraCapture } from "@/components/CameraCapture";

export const MAX_FOTOS = 8;
const ETIQUETAS = ["Frente", "Traseira", "Avaria", "Placa interna", "Peça trocada", "Saída"];

export function PhotoGallery({ fotos = [], onChange }) {
  const [zoom, setZoom] = useState(null);
  const [camera, setCamera] = useState(false);
  const cameraInput = React.useRef(null);
  const toque = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const abrirCamera = () => {
    if (!toque() && navigator.mediaDevices?.getUserMedia) setCamera(true);
    else cameraInput.current?.click();
  };
  const restantes = MAX_FOTOS - fotos.length;

  const adicionar = async (files) => {
    const lista = Array.from(files || []);
    if (lista.length > restantes) toast.warning(`Limite de ${MAX_FOTOS} fotos. Só ${restantes} foram adicionadas.`);
    const novas = [];
    for (const file of lista.slice(0, restantes)) {
      try {
        const data = await imageFromFile(file);
        novas.push({ label: ETIQUETAS[(fotos.length + novas.length) % ETIQUETAS.length], data });
      } catch { toast.error("Não foi possível abrir uma das fotos."); }
    }
    if (novas.length) onChange([...fotos, ...novas]);
  };

  const atualizar = (i, label) => onChange(fotos.map((f, j) => (j === i ? { ...f, label } : f)));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{fotos.length}/{MAX_FOTOS} fotos</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fotos.map((f, i) => (
          <div key={i} className="space-y-1">
            <button type="button" onClick={() => setZoom(f)} className="block aspect-square w-full overflow-hidden rounded-lg border bg-muted">
              <img src={f.data} alt={f.label} className="size-full object-cover" />
            </button>
            <div className="flex items-center gap-1">
              <Input list="etiquetas-foto" value={f.label} maxLength={30} aria-label={`Legenda da foto ${i + 1}`} className="h-8 text-xs" onChange={(e) => atualizar(i, e.target.value)} />
              <Button type="button" variant="ghost" size="icon" aria-label={`Remover foto ${i + 1}`} onClick={() => onChange(fotos.filter((_, j) => j !== i))}><Trash2 className="size-3" /></Button>
            </div>
          </div>
        ))}
        {restantes > 0 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted text-muted-foreground hover:bg-accent">
            <Plus className="size-6" />
            <span className="text-xs font-medium">Adicionar foto</span>
            <input type="file" aria-label="Adicionar foto" accept="image/*" multiple className="hidden" onChange={(e) => { adicionar(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        {restantes > 0 && (
          <button type="button" onClick={abrirCamera} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted text-muted-foreground hover:bg-accent">
            <Camera className="size-6" />
            <span className="text-xs font-medium">Tirar foto</span>
          </button>
        )}
        <input ref={cameraInput} type="file" aria-label="Tirar foto" accept="image/*" capture="environment" className="hidden" onChange={(e) => { adicionar(e.target.files); e.target.value = ""; }} />
      </div>
      <datalist id="etiquetas-foto">{ETIQUETAS.map((e) => <option key={e} value={e} />)}</datalist>
      {camera && (
        <CameraCapture onClose={() => setCamera(false)} onCapture={(data) => { setCamera(false); onChange([...fotos, { label: ETIQUETAS[fotos.length % ETIQUETAS.length], data }]); }} />
      )}
      {zoom && (
        <div role="dialog" aria-label="Foto ampliada" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4" onClick={() => setZoom(null)}>
          <img src={zoom.data} alt={zoom.label} className="max-h-full max-w-full rounded-lg object-contain" />
          <Button type="button" variant="secondary" size="icon" aria-label="Fechar" className="absolute right-4 top-4" onClick={() => setZoom(null)}><X /></Button>
        </div>
      )}
    </div>
  );
}
