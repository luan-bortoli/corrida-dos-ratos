// Auditoria somente leitura de liquidações secundárias: cada negócio deve
// produzir lançamentos simétricos, exatos em centavos e com participantes reais.
import { cashBalanceCents } from "./money-balance.js";

export function auditCashTransfers(room) {
  const findings = [];
  const players = new Map((room.players ?? []).map((p) => [p.id, p]));
  let totalTradedCents = 0;
  for (const trade of room.secondaryTrades ?? []) {
    const id = trade.id ?? null;
    const amount =
      trade.amountCents ?? (Number.isSafeInteger(trade.amount) ? trade.amount * 100 : NaN);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      findings.push({ tradeId: id, reason: "Valor monetário inválido" });
      continue;
    }
    if (!Number.isSafeInteger(totalTradedCents + amount)) {
      findings.push({ tradeId: id, reason: "Volume monetário excede limite seguro" });
      continue;
    }
    totalTradedCents += amount;
    const buyer = players.get(trade.buyerId),
      seller = players.get(trade.sellerId);
    if (!buyer || !seller || buyer === seller) {
      findings.push({ tradeId: id, reason: "Contrapartes ausentes ou iguais" });
      continue;
    }
    for (const [p, kind, signed] of [
      [buyer, "secondary_security_buy", -amount],
      [seller, "secondary_security_sell", amount],
    ]) {
      const entries = (p.game?.ledger ?? []).filter(
        (x) =>
          x.kind === kind &&
          x.securityId === trade.securityId &&
          x.amountCents === signed &&
          (x.tradeId === undefined || x.tradeId === id),
      );
      // Registros legados anteriores à introdução de amountCents não possuem
      // identificador da operação; não se pode certificar uma vinculação inequívoca.
      if (!entries.length)
        findings.push({
          tradeId: id,
          playerId: p.id,
          reason: "Lançamento de contraparte ausente ou divergente",
        });
    }
  }
  for (const p of room.players ?? []) {
    try {
      cashBalanceCents(p.game);
    } catch {
      findings.push({ playerId: p.id, reason: "Saldo financeiro inválido" });
    }
  }
  return {
    ok: findings.length === 0,
    tradesChecked: (room.secondaryTrades ?? []).length,
    totalTradedCents,
    findings,
  };
}
