import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
export interface SignaturePadHandle { clear: () => void; toDataURL: () => string | null; }
export const SignaturePad = forwardRef<SignaturePadHandle, { initialValue?: string | null }>(function SignaturePad({ initialValue }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let active = true;
    const paint = (data: string) => {
      const image = new Image();
      image.onload = () => { if (!active) return; const ctx = c.getContext("2d"); if (!ctx) return; const r = c.getBoundingClientRect(); ctx.drawImage(image, 0, 0, r.width, r.height); hasInk.current = true; };
      image.src = data;
    };
    const resize = () => {
      const previous = hasInk.current ? c.toDataURL() : initialValue;
      const r = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr; c.height = r.height * dpr;
      const ctx = c.getContext("2d"); if (!ctx) return;
      ctx.scale(dpr, dpr); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = getComputedStyle(c).color;
      hasInk.current = false; if (previous) paint(previous);
    };
    resize(); window.addEventListener("resize", resize);
    return () => { active = false; window.removeEventListener("resize", resize); };
  }, [initialValue]);
  useImperativeHandle(ref, () => ({
    clear() { const c = canvas.current; if (!c) return; c.getContext("2d")?.clearRect(0, 0, c.width, c.height); hasInk.current = false; },
    toDataURL: () => hasInk.current ? canvas.current?.toDataURL("image/png") || null : null,
  }));
  return <canvas ref={canvas} aria-label="Área de assinatura" className="h-40 w-full touch-none rounded-lg border border-dashed border-input bg-muted/40 text-foreground"
    onPointerDown={e => { const ctx = e.currentTarget.getContext("2d"); if (!ctx) return; e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; const r = e.currentTarget.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX-r.left, e.clientY-r.top); }}
    onPointerMove={e => { if (!drawing.current) return; const ctx = e.currentTarget.getContext("2d"); if (!ctx) return; const r = e.currentTarget.getBoundingClientRect(); ctx.lineTo(e.clientX-r.left, e.clientY-r.top); ctx.stroke(); hasInk.current = true; }}
    onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} />;
});
