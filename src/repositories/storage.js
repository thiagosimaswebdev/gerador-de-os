import { openDB } from "idb";
import { CHECKLIST, numeroUnico, STATUS } from "@/lib/os";
import { parseBackup, serializeBackup } from "@/services/backup";

let database;
export const StorageProvider = {
  open() {
    if (typeof indexedDB === "undefined") throw new Error("Armazenamento local indisponível neste navegador.");
    if (!database) database = openDB("assistencia-os", 1, {
      upgrade(db) {
        db.createObjectStore("settings");
        db.createObjectStore("orders", { keyPath: "numero" });
      },
    }).catch(error => { database = undefined; throw error; });
    return database;
  },
};

export const defaultServices = () => [
  { id: "tela", nome: "Troca de Tela", dias: 90, observacao: "" },
  { id: "bateria", nome: "Troca de Bateria", dias: 90, observacao: "" },
  { id: "porta", nome: "Porta de Carregamento", dias: 30, observacao: "" },
];
export const SettingsRepository = {
  async load() {
    const db = await StorageProvider.open();
    const existing = await db.get("settings", "app");
    if (existing) return existing;
    const settings = { empresa: { logo: localStorage.getItem("os-logo") }, configured: false, services: defaultServices(), checklist: CHECKLIST.map((nome, i) => ({ id: `check-${i}`, nome })) };
    await db.put("settings", settings, "app");
    return settings;
  },
  async save(settings) {
    const db = await StorageProvider.open();
    await db.put("settings", settings, "app");
    return settings;
  },
};

export const OrderRepository = {
  async list() {
    const db = await StorageProvider.open();
    const rows = await db.getAll("orders");
    return rows.sort((a, b) => new Date(b.emissao).getTime() - new Date(a.emissao).getTime());
  },
  async get(numero) { return (await StorageProvider.open()).get("orders", numero); },
  async save(order, editing = false) {
    const db = await StorageProvider.open();
    const tx = db.transaction("orders", "readwrite");
    const keys = await tx.store.getAllKeys();
    const saved = { ...order, status: order.status || "Recebido", trackingUrl: order.trackingUrl || "", updatedAt: new Date().toISOString() };
    if (!STATUS.includes(saved.status)) { tx.abort(); throw new Error("Status inválido."); }
    if (!editing && keys.includes(saved.numero)) saved.numero = numeroUnico(keys, new Date(saved.emissao));
    if (!saved.numero) saved.numero = numeroUnico(keys, new Date(saved.emissao));
    await tx.store.put(saved);
    await tx.done;
    return saved;
  },
};

export const BackupRepository = {
  async export() {
    const db = await StorageProvider.open();
    const tx = db.transaction(["settings", "orders"], "readonly");
    const [settings, orders] = await Promise.all([tx.objectStore("settings").get("app"), tx.objectStore("orders").getAll()]);
    await tx.done;
    return serializeBackup(settings, orders);
  },
  async restore(text, restoreSettings = false) {
    const backup = parseBackup(text);
    const db = await StorageProvider.open();
    const tx = db.transaction(["settings", "orders"], "readwrite");
    let added = 0;
    try {
      const store = tx.objectStore("orders");
      const existing = new Set(await store.getAllKeys());
      for (const order of backup.orders) {
        if (existing.has(order.numero)) continue;
        await store.add({ ...order, emissao: new Date(order.emissao) });
        added++;
      }
      if (restoreSettings) await tx.objectStore("settings").put(backup.settings, "app");
      await tx.done;
      return { added, skipped: backup.orders.length - added };
    } catch (error) {
      try { tx.abort(); } catch { /* Transaction may already be aborted. */ }
      await tx.done.catch(() => {});
      throw error;
    }
  },
};