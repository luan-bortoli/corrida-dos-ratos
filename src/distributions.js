import { creditCashCents } from "./money-balance.js";
import { settleCorporateLoans } from "./corporate-renegotiation.js";
import { randomUUID } from "node:crypto";
import { settleCorporateExpenses } from "./corporate-expenses.js";
const int = (n) => Number.isSafeInteger(n) && n >= 0;
function historicalShares(c, round) {
  const s = { ...(c.initialShares ?? { origin: 100 }) };
  for (const e of c.history
    .filter(
      (x) =>
        x.type === "share_transfer" || x.type === "share_trade" || x.type === "share_trade_npc",
    )
    .sort((a, b) => a.round - b.round)) {
    // A transfer is economically effective at the start of the FOLLOWING round.
    if (e.round >= round) continue;
    const seller = e.type === "share_transfer" ? "origin" : e.sellerId;
    const buyer = e.type === "share_transfer" ? e.playerId : e.buyerId;
    s[seller] = (s[seller] || 0) - e.percent;
    s[buyer] = (s[buyer] || 0) + e.percent;
  }
  return s;
}
export function closeVerifiedPeriod(room, completedRound) {
  if (!int(completedRound) || completedRound < 9 || completedRound % 9 !== 0) return [];
  const result = [];
  for (const c of room.companies ?? []) {
    if ((c.lastClosedRound || 0) >= completedRound) continue;
    // Obrigações já reconhecidas como despesa são quitadas antes de qualquer dividendo.
    // A quitação é fluxo de caixa, não uma segunda despesa operacional.
    c._settlementRound = completedRound;
    const settledPending = settleCorporateExpenses(c);
    const loanSettlement = settleCorporateLoans(c, completedRound);
    delete c._settlementRound;
    const first = completedRound - 8;
    const income = (c.operatingLedger ?? [])
      .filter((e) => e.type !== "settlement" && e.round >= first && e.round <= completedRound)
      .reduce((v, e) => v + (e.type === "revenue" ? e.amount : -e.amount), 0);
    const available = Math.max(
      0,
      Math.min(income, c.retainedProfit, c.cash - c.reserveRequired - (c.pendingExpenses ?? 0)),
    );
    const players = new Map(room.players.map((p) => [p.id, p]));
    const allocations = new Map();
    if (available > 0) {
      // Time-weighted entitlements over nine rounds; remaining integer units go to origin.
      const weights = new Map();
      for (let round = first; round <= completedRound; round++) {
        for (const [holder, share] of Object.entries(historicalShares(c, round)))
          weights.set(holder, (weights.get(holder) || 0) + share);
      }
      let assigned = 0;
      for (const [holder, weight] of weights) {
        if (holder === "origin" || weight <= 0) continue;
        const amount = Math.floor((available * weight) / 900);
        if (amount) {
          allocations.set(holder, amount);
          assigned += amount;
        }
      }
      allocations.set("origin", available - assigned);
    }
    // Do not mutate any balances until all recipients have been validated.
    for (const [id, amount] of allocations)
      if (id !== "origin" && !int(amount)) throw Error("Distribuição inválida");
    for (const [id] of allocations)
      if (
        id !== "origin" &&
        !players.has(id) &&
        !(id.startsWith("npc:") && room.npcInvestors?.some((n) => n.id === id.slice(4)))
      )
        throw Error("Sócio inválido para distribuição");
    c.cash -= available;
    c.retainedProfit -= available;
    for (const [id, amount] of allocations) {
      if (!amount) continue;
      if (id === "origin") {
        room.externalSellerCash = (room.externalSellerCash || 0) + amount;
        continue;
      }
      if (id.startsWith("npc:")) {
        const npc = room.npcInvestors.find((n) => n.id === id.slice(4));
        npc.cash += amount;
        npc.ledger.push({
          id: randomUUID(),
          kind: "company_dividend",
          amount,
          companyId: c.id,
          round: completedRound,
        });
        continue;
      }
      const p = players.get(id);
      creditCashCents(p.game, amount * 100);
      p.game.pendingCorporatePassive = (p.game.pendingCorporatePassive || 0) + amount;
      p.game.ledger.push({
        id: randomUUID(),
        turn: p.game.turn,
        closure: p.game.closures,
        kind: "company_dividend",
        amount,
        companyId: c.id,
        description: `Dividendo recebido: ${c.name} · rodada ${completedRound}`,
      });
    }
    c.lastClosedRound = completedRound;
    const record = {
      round: completedRound,
      income,
      available,
      paid: available,
      settledPending,
      loanSettlement,
      allocations: Object.fromEntries(allocations),
    };
    c.closedOperatingPeriods ??= [];
    c.closedOperatingPeriods.push(record);
    c.distributions ??= [];
    if (available) c.distributions.push(record);
    c.history.push({ type: "closing", ...record });
    result.push({ id: c.id, ...record });
  }
  return result;
}
