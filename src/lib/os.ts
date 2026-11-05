export type Servico = string;
export const SERVICOS: Servico[] = ["Troca de Tela", "Troca de Bateria", "Porta de Carregamento", "Outros"];

export const CHECKLIST = [
  "Tela quebrada", "Trincas", "Tampa traseira danificada", "Carcaça amassada", "Marcas de queda",
  "Oxidação aparente", "Sem avarias aparentes", "Sem teste funcional", "Aparelho não liga", "Outro",
];
export const ACESSORIOS = ["Carregador", "Cabo USB", "Chip", "Cartão de Memória", "Película", "Capa", "Nenhum"];
export const STATUS = ["Recebido", "Em análise", "Aguardando peça", "Em reparo", "Finalizado", "Entregue"];
export const EMPRESA_FIELDS = ["nome", "fantasia", "telefone", "whatsapp", "instagram", "email", "endereco", "cidade", "estado"] as const;
export type Empresa = Partial<Record<typeof EMPRESA_FIELDS[number], string>> & { logo?: string | null };

export function buscarOrdens<T extends { numero: string; cliente: string; telefone: string }>(orders: T[], busca: string): T[] {
  const q = busca.trim().toLocaleLowerCase("pt-BR");
  const digits = q.replace(/\D/g, "");
  return orders.filter(o => !q || o.numero.toLowerCase().includes(q) || o.cliente.toLocaleLowerCase("pt-BR").includes(q) || o.telefone.includes(q) || (digits.length > 0 && /^[\d\s()+-]+$/.test(q) && o.telefone.replace(/\D/g, "").includes(digits)));
}

export function resumoOrdens(orders: { status: string }[]) {
  return { total: orders.length, andamento: orders.filter(o => STATUS.slice(0, 4).includes(o.status)).length, finalizadas: orders.filter(o => o.status === "Finalizado").length, entregues: orders.filter(o => o.status === "Entregue").length };
}

export function numeroUnico(existentes: string[], date = new Date(), rand = Math.random): string {
  const inicial = gerarNumeroOS(date, rand);
  const prefix = inicial.slice(0, -4);
  const start = Number(inicial.slice(-4));
  for (let i = 0; i < 10000; i++) {
    const n = `${prefix}${String((start + i) % 10000).padStart(4, "0")}`;
    if (!existentes.includes(n)) return n;
  }
  throw new Error("Limite de numeração do dia atingido.");
}

export function mensagemWhatsApp(numero: string) {
  return `Olá, segue sua Ordem de Serviço nº ${numero}. Obrigado pela preferência.`;
}

export const MARCA_IOS = "Apple (iPhone)";
export const MARCAS_ANDROID = ["Samsung", "Motorola", "LG", "Xiaomi", "Realme", "Asus", "Nokia", "Positivo", "Multilaser"];
export const MODELOS_IPHONE = [
  "iPhone SE (2ª geração)", "iPhone SE (3ª geração)",
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
  "iPhone 12", "iPhone 12 mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13", "iPhone 13 mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "iPhone 16e",
  "iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone Air",
];

export const TERMO =
  "A garantia cobre exclusivamente o serviço executado e/ou a peça substituída, pelo prazo informado nesta Ordem de Serviço. A garantia não cobre danos decorrentes de quedas, impactos, pressão física, mau uso, violação do aparelho por terceiros, oxidação, contato com água ou qualquer outro líquido, utilização de acessórios inadequados, descargas elétricas ou quaisquer danos externos posteriores ao reparo. Equipamentos que apresentem sinais de violação, umidade ou avarias físicas terão a garantia automaticamente cancelada. A garantia é limitada ao reparo realizado e não cobre defeitos não relacionados ao serviço executado.";

export function garantiaDias(servico: Servico | "", custom?: number): number | null {
  if (servico === "Troca de Tela" || servico === "Troca de Bateria") return 90;
  if (servico === "Porta de Carregamento") return 30;
  if (servico === "Outros") return custom && custom > 0 ? custom : null;
  return null;
}

export function garantiaDaOrdem(o: Pick<OSData, "garantiaSnapshot" | "servico" | "garantiaCustom">): number | null {
  return o.garantiaSnapshot ?? garantiaDias(o.servico, Number(o.garantiaCustom));
}

export function gerarNumeroOS(date = new Date(), rand = Math.random): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const x = String(Math.floor(rand() * 10000)).padStart(4, "0");
  return `OS-${y}${m}${d}-${x}`;
}

/** Digits-only input -> "R$ 350,00" */
export function formatBRLFromDigits(digits: string): string {
  const n = parseInt(digits.replace(/\D/g, "") || "0", 10);
  if (!n) return "";
  return (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export interface OSData {
  status?: string;
  serviceId?: string;
  garantiaSnapshot?: number;
  serviceObservation?: string;
  empresa?: Empresa;
  assinatura?: string | null;
  fotos?: { label: string; data: string }[];
  trackingUrl?: string;
  updatedAt?: string;
  numero: string;
  emissao: Date;
  cliente: string;
  telefone: string;
  so: "" | "Android" | "iPhone (iOS)";
  marca: string;
  modelo: string;
  imei: string;
  senha: string;
  servico: Servico | "";
  descricao: string;
  garantiaCustom: string;
  valor: string;
  checklist: string[];
  checklistOutro: string;
  acessorios: string[];
  observacoes: string;
}

export function validar(o: OSData): string | null {
  if (!o.cliente.trim()) return "Informe o nome do cliente.";
  if (o.telefone.replace(/\D/g, "").length < 10) return "Informe um telefone válido.";
  if (!o.so) return "Selecione o sistema operacional.";
  if (!o.marca.trim()) return "Informe a marca do aparelho.";
  if (!o.modelo.trim()) return "Informe o modelo do aparelho.";
  if (!o.servico) return "Selecione o serviço executado.";
  if (o.status && !STATUS.includes(o.status)) return "Selecione um status válido.";
  if (o.garantiaSnapshot !== undefined && (!Number.isInteger(o.garantiaSnapshot) || o.garantiaSnapshot < 0)) return "Informe uma garantia válida em dias.";
  if (o.servico === "Outros") {
    if (!o.descricao.trim()) return "Descreva o serviço executado.";
    if (o.garantiaSnapshot === undefined && !garantiaDias("Outros", Number(o.garantiaCustom))) return "Informe a garantia em dias.";
  }
  if (!o.valor) return "Informe o valor do serviço.";
  if (o.observacoes.length > 500) return "As observações devem ter no máximo 500 caracteres.";
  return null;
}
