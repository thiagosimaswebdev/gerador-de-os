import { z } from "zod";
import { STATUS } from "@/lib/os";

const image = z.string().regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/);
const company = z.object({ logo: image.nullish() }).catchall(z.string());
const settingsSchema = z.object({
  empresa: company,
  configured: z.boolean(),
  services: z.array(z.object({ id: z.string().min(1), nome: z.string().min(1), dias: z.number().int().nonnegative(), observacao: z.string().optional() }).passthrough()),
  checklist: z.array(z.object({ id: z.string().min(1), nome: z.string().min(1) }).passthrough()),
}).passthrough();
const orderSchema = z.object({
  numero: z.string().regex(/^OS-\d{8}-\d{4}$/),
  emissao: z.string().refine(v => Number.isFinite(Date.parse(v))),
  cliente: z.string(), telefone: z.string(),
  so: z.enum(["Android", "iPhone (iOS)"]), marca: z.string(), modelo: z.string(),
  imei: z.string(), senha: z.string(), servico: z.string(), descricao: z.string(),
  garantiaCustom: z.string(), valor: z.string(),
  checklist: z.array(z.string()), checklistOutro: z.string(), acessorios: z.array(z.string()), observacoes: z.string(),
  status: z.string().refine(v => STATUS.includes(v)).optional(),
  garantiaSnapshot: z.number().int().nonnegative().optional(),
  empresa: company.optional(), assinatura: image.nullish(),
  fotos: z.array(z.object({ label: z.string(), data: image }).passthrough()).optional(),
}).passthrough();
const schema = z.object({
  app: z.literal("assistencia-os"), version: z.literal(1),
  exportedAt: z.string(), settings: settingsSchema, orders: z.array(orderSchema),
});

export function parseBackup(text) {
  let data;
  try { data = schema.parse(JSON.parse(text)); }
  catch { throw new Error("Arquivo inválido ou incompatível. Nenhum dado foi alterado."); }
  if (new Set(data.orders.map(o => o.numero)).size !== data.orders.length) {
    throw new Error("A cópia contém números de O.S. repetidos. Nenhum dado foi alterado.");
  }
  return data;
}

export function serializeBackup(settings, orders) {
  const text = JSON.stringify({ app: "assistencia-os", version: 1, exportedAt: new Date().toISOString(), settings, orders });
  parseBackup(text);
  return text;
}