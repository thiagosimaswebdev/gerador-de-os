import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { BackupRepository, OrderRepository, SettingsRepository, StorageProvider } from "@/repositories/storage";
import { parseBackup, serializeBackup } from "./backup";

describe("cópia de segurança", () => {
  it("restaura fotos, assinaturas e garantia, sem substituir ordens existentes", async () => {
    const db = await StorageProvider.open();
    await db.clear("orders");
    const settings = { ...await SettingsRepository.load(), empresa: { nome: "Oficina original", logo: null }, configured: true };
    await SettingsRepository.save(settings);
    const image = "data:image/png;base64,aGVsbG8=";
    const order = { numero: "OS-20261108-0001", emissao: new Date("2026-11-08T00:00:00Z"), cliente: "Ana", telefone: "11999999999", so: "Android", marca: "Samsung", modelo: "A54", imei: "", senha: "", servico: "Troca de Tela", descricao: "", garantiaCustom: "", garantiaSnapshot: 90, valor: "R$ 350,00", checklist: [], checklistOutro: "", acessorios: [], observacoes: "", assinatura: image, fotos: [{ label: "Frente", data: image }] };
    await OrderRepository.save(order);
    const original = await BackupRepository.export();
    await db.clear("orders");
    expect(await BackupRepository.restore(original)).toEqual({ added: 1, skipped: 0 });
    const restored = await OrderRepository.get(order.numero);
    expect(restored.fotos).toEqual(order.fotos);
    expect(restored.assinatura).toBe(image);
    expect(restored.garantiaSnapshot).toBe(90);
    expect(restored.emissao).toEqual(order.emissao);
    const changed = serializeBackup({ ...settings, empresa: { nome: "Outra oficina" } }, [{ ...order, cliente: "Nome alterado" }]);
    expect(await BackupRepository.restore(changed)).toEqual({ added: 0, skipped: 1 });
    expect((await OrderRepository.get(order.numero)).cliente).toBe("Ana");
    expect((await SettingsRepository.load()).empresa.nome).toBe("Oficina original");
    await BackupRepository.restore(changed, true);
    expect((await SettingsRepository.load()).empresa.nome).toBe("Outra oficina");
  });
  it("recusa arquivos inválidos antes de alterar qualquer dado", async () => {
    const before = await BackupRepository.export();
    await expect(BackupRepository.restore('{"app":"outro"}')).rejects.toThrow("incompatível");
    const after = await BackupRepository.export();
    expect(parseBackup(after).orders).toEqual(parseBackup(before).orders);
    expect(parseBackup(after).settings).toEqual(parseBackup(before).settings);
  });
  it("recusa números repetidos e versões desconhecidas", async () => {
    const data = parseBackup(await BackupRepository.export());
    expect(() => parseBackup(JSON.stringify({ ...data, version: 2 }))).toThrow("incompatível");
    expect(() => parseBackup(JSON.stringify({ ...data, orders: [data.orders[0], data.orders[0]] }))).toThrow("repetidos");
  });
});