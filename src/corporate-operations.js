import { recordVerifiedOperatingEvent } from "./governance.js";

// Registros operacionais são declarados pelo professor, vinculados a documento
// de suporte e auditáveis. Não derivam automaticamente de lucro estimado nas cartas.
export function registerDocumentedOperation(room, input) {
  if (!room || !["playing", "paused"].includes(room.status))
    throw Error("Sala não está em andamento");
  const company = room.companies?.find((c) => c.id === input?.companyId);
  if (!company) throw Error("Empresa inexistente");
  if (!["revenue", "expense"].includes(input.type)) throw Error("Tipo de operação inválido");
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || input.amount > 1_000_000)
    throw Error("Valor operacional inválido");
  const document = String(input.document ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{4,79}$/.test(document))
    throw Error("Identificador do documento inválido (5 a 80 caracteres)");
  const round = room.round;
  if (!Number.isSafeInteger(round) || round < 1) throw Error("Rodada inválida");
  // Identificador global por sala evita contabilizar o mesmo comprovante em duas empresas.
  if (room.companies.some((c) => (c.operatingLedger ?? []).some((e) => e.document === document)))
    throw Error("Documento já contabilizado nesta sala");
  // Pré-validação de fechamento: impede inserir efeitos em rodadas já encerradas.
  if (round <= company.lastClosedRound) throw Error("Rodada já encerrada na contabilidade");
  const before = company.operatingLedger?.length ?? 0;
  recordVerifiedOperatingEvent(company, {
    sourceId: `DOC:${document}`,
    type: input.type,
    amount: input.amount,
    round,
  });
  const record = company.operatingLedger[before];
  record.document = document;
  record.origin = "teacher_documented";
  company.history ??= [];
  company.history.push({
    type: "documented_operation",
    round,
    document,
    operation: input.type,
    amount: record.amount,
    baseAmount: input.amount,
  });
  return {
    companyId: company.id,
    round,
    document,
    type: input.type,
    baseAmount: input.amount,
    amount: record.amount,
    bonus: record.improvementBonus,
  };
}
