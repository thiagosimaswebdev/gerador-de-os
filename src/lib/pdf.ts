import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { TERMO, garantiaDaOrdem, type OSData } from "./os";

// Print palette is intentionally independent from the screen theme.
const INK: [number, number, number] = [30, 38, 42];
const ACCENT: [number, number, number] = [15, 107, 92];
const MUTED: [number, number, number] = [100, 110, 115];
async function imageSize(data: string) {
  const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = data; });
  return { width: image.naturalWidth, height: image.naturalHeight };
}
export async function gerarPDF(o: OSData, logo: string | null, assinatura: string | null): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 14, W = 182;
  let y = 14;
  const ensure = (height: number) => { if (y + height > 278) { doc.addPage(); y = 18; } };
  const text = (value: string, size = 9, bold = false, width = W, x = M) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).setTextColor(...INK);
    const lines: string[] = doc.splitTextToSize(value, width);
    for (const line of lines) { ensure(size * 0.45 + 1); doc.text(line, x, y); y += size * 0.45 + 0.5; }
  };
  const section = (label: string) => { ensure(18); y += 3; doc.setDrawColor(...ACCENT).line(M, y, M + W, y); y += 6; doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...ACCENT).text(label.toUpperCase(), M, y); y += 6; };
  const pairs = (items: [string, string][], cols = 2) => {
    const width = W / cols;
    for (let i = 0; i < items.length; i += cols) {
      doc.setFont("helvetica", "bold").setFontSize(9);
      const row = items.slice(i, i + cols).map(([label, value]) => ({ label, lines: doc.splitTextToSize(value || "Não informado", width - 5) as string[] }));
      const height = Math.max(...row.map(item => item.lines.length)) * 4.5 + 8;
      ensure(height);
      row.forEach((item, j) => {
        const x = M + j * width;
        doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED).text(item.label, x, y);
        doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK).text(item.lines, x, y + 5, { lineHeightFactor: 1.4 });
      }); y += height;
    }
  };
  const image = async (data: string, x: number, top: number, width: number, height: number) => {
    const dims = await imageSize(data); const scale = Math.min(width / dims.width, height / dims.height);
    const w = dims.width * scale, h = dims.height * scale;
    doc.addImage(data, data.startsWith("data:image/png") ? "PNG" : "JPEG", x + (width - w) / 2, top + (height - h) / 2, w, h);
  };
  if (logo) await image(logo, M, y - 3, 45, 20);
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...ACCENT).text("ORDEM DE SERVIÇO", 196, y + 3, { align: "right" });
  doc.setFontSize(10).setTextColor(...INK).text(o.numero, 196, y + 10, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(8).text(`Emissão: ${new Date(o.emissao).toLocaleString("pt-BR")}`, 196, y + 16, { align: "right" }); y += 26;
  if (o.empresa) {
    text(o.empresa.fantasia || o.empresa.nome || "Assistência técnica", 12, true);
    if (o.empresa.fantasia && o.empresa.nome) text(o.empresa.nome, 8);
    for (const value of [o.empresa.endereco, [o.empresa.cidade, o.empresa.estado].filter(Boolean).join(" / "), [o.empresa.telefone, o.empresa.whatsapp && `WhatsApp: ${o.empresa.whatsapp}`].filter(Boolean).join(" • "), [o.empresa.email, o.empresa.instagram].filter(Boolean).join(" • ")]) if (value) text(value, 8);
  }
  section("Cliente"); pairs([["Nome", o.cliente], ["Telefone", o.telefone]]);
  section("Equipamento"); pairs([["Sistema", o.so], ["Marca", o.marca], ["Modelo", o.modelo], ["IMEI", o.imei], ["Senha", o.senha], ["Status", o.status || "Recebido"]], 3);
  section("Serviço executado"); pairs([["Serviço", o.servico === "Outros" ? o.descricao : o.servico], ["Garantia", `${garantiaDaOrdem(o) ?? 0} dias`], ["Valor", o.valor]], 3);
  if (o.serviceObservation) text(o.serviceObservation);
  section("Checklist de entrada"); text(o.checklist.length ? o.checklist.map(c => c === "Outro" && o.checklistOutro.trim() ? `Outro: ${o.checklistOutro.trim()}` : c).join(" • ") : "Nenhum item marcado");
  section("Acessórios recebidos"); text(o.acessorios.join(" • ") || "Nenhum item marcado");
  if (o.observacoes.trim()) { section("Observações"); text(o.observacoes.trim()); }
  if (o.fotos?.length) {
    section("Fotos do aparelho"); ensure(53);
    const top = y;
    for (const [i, foto] of o.fotos.slice(0, 3).entries()) { const x = M + i * 62; await image(foto.data, x, top, 57, 43); doc.setFontSize(8).text(foto.label, x + 28.5, top + 48, { align: "center" }); }
    y += 53;
  }
  section("Termo de garantia"); text(TERMO, 7.8);
  ensure(62); y += 5;
  const qr = await QRCode.toDataURL(o.trackingUrl || o.numero, { margin: 1, width: 160 });
  doc.addImage(qr, "PNG", M, y, 22, 22);
  doc.setFontSize(8).text(o.trackingUrl ? "Consulta da ordem" : o.numero, M + 26, y + 12); y += 28;
  if (assinatura) await image(assinatura, M + 3, y, 72, 19);
  y += 21;
  doc.setDrawColor(...MUTED).line(M, y, M + 80, y).line(M + 102, y, M + W, y);
  doc.setFontSize(8).text("Assinatura do Cliente", M + 40, y + 5, { align: "center" }).text("Assinatura da Assistência", M + 142, y + 5, { align: "center" });
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) { doc.setPage(p); doc.setFontSize(7).setTextColor(...MUTED).text(`${o.numero} · ${p}/${pages}`, 105, 290, { align: "center" }); }
  return doc.output("blob");
}
