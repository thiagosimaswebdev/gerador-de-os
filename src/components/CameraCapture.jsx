import React, { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Câmera ao vivo (webcam/notebook/tablet) via getUserMedia. Retorna JPEG dataURL. */
export function CameraCapture({ onCapture, onClose, maxSize = 1200 }) {
  const video = useRef(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => { stream = s; if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); } })
      .catch(() => setErro("Não foi possível acessar a câmera. Verifique a permissão do navegador."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const capturar = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    const scale = Math.min(1, maxSize / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    onCapture(c.toDataURL("image/jpeg", 0.8));
  };

  return (
    <div role="dialog" aria-label="Câmera" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-foreground/90 p-4">
      {erro ? <p className="max-w-sm text-center text-background">{erro}</p> : <video ref={video} playsInline muted className="max-h-[75vh] max-w-full rounded-lg" />}
      <div className="flex gap-3">
        {!erro && <Button size="lg" onClick={capturar}><Camera className="size-5" />Capturar</Button>}
        <Button size="lg" variant="secondary" onClick={onClose}><X className="size-5" />Fechar</Button>
      </div>
    </div>
  );
}
