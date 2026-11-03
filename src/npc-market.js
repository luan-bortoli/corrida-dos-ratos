// Carteiras fictícias com caixa limitado; negociação exclusivamente de quotas existentes.
import { randomUUID } from "node:crypto";
export const PROFILES = Object.freeze([
  { id: "conservador", label: "Conservador", initialCash: 100000, base: 80, min: 75, max: 90 },
  { id: "moderado", label: "Moderado", initialCash: 250000, base: 92, min: 85, max: 100 },
  { id: "arrojado", label: "Arrojado", initialCash: 500000, base: 100, min: 90, max: 110 },
]);
const validMoney = (n) => Number.isSafeInteger(n) && n >= 0;
export function ensureNPC(room) {
  if (!Array.isArray(room.npcInvestors))
    room.npcInvestors = PROFILES.map((p) => ({
      id: p.id,
      label: p.label,
      cash: p.initialCash,
      shares: {},
      ledger: [],
    }));
}
export function quoteNPC(room, offer, investorId) {
  ensureNPC(room);
  const inv = room.npcInvestors.find((x) => x.id === investorId),
    profile = PROFILES.find((x) => x.id === investorId),
    company = room.companies?.find((c) => c.id === offer.companyId);
  if (!inv || !profile || !company) throw Error("Investidor ou empresa não encontrado");
  if (offer.status !== "open") throw Error("Oferta indisponível");
  if (room.round <= offer.preferenceUntil && offer.eligible.length)
    throw Error("Direito de preferência em vigor");
  if (room.round > offer.expiresRound) throw Error("Oferta vencida");
  const value = Math.round((company.valuation * offer.percent) / 100);
  const payout = ((company.referenceDistribution ?? 0) * offer.percent) / 100;
  const rate = value > 0 ? (payout / value) * 100 : 0;
  let adjustment = rate >= 2.5 ? 10 : rate >= 1.5 ? 5 : 0;
  if ((company.referenceDistribution ?? 0) === 0) adjustment -= 5;
  // Não deduzimos automaticamente risco setorial ou dívidas: requerem eventos comprovados.
  const pct = Math.max(profile.min, Math.min(profile.max, profile.base + adjustment));
  const maxPrice = Math.floor((value * pct) / 100);
  const proposed = Math.min(offer.price, maxPrice);
  return {
    investorId,
    companyId: company.id,
    offerId: offer.id,
    referenceValue: value,
    pct,
    maxPrice,
    proposed,
    availableCash: inv.cash,
    canBuy: validMoney(proposed) && proposed > 0 && inv.cash >= proposed,
  };
}
export function buyShareNPC(room, offerId, investorId, acceptCounter = false) {
  ensureNPC(room);
  const offer = room.shareOffers?.find((o) => o.id === offerId),
    seller = room.players?.find((p) => p.id === offer?.sellerId),
    company = room.companies?.find((c) => c.id === offer?.companyId);
  if (!offer || !seller || !company) throw Error("Oferta ou vendedor não encontrado");
  if ((company.shares[offer.sellerId] || 0) < offer.percent)
    throw Error("Participação indisponível");
  const quote = quoteNPC(room, offer, investorId);
  if (!quote.canBuy) throw Error("Investidor não possui recursos suficientes");
  // Preço pedido acima do teto gera contraproposta: não se conclui sem aceitação expressa.
  if (offer.price > quote.maxPrice && !acceptCounter)
    throw Error("Preço acima do limite: contraproposta exige aceite do vendedor");
  const investor = room.npcInvestors.find((i) => i.id === investorId);
  const price = offer.price > quote.maxPrice ? quote.maxPrice : offer.price;
  if (price < 1 || investor.cash < price)
    throw Error("Contraproposta sem recursos ou preço inválido");
  investor.cash -= price;
  investor.shares[company.id] = (investor.shares[company.id] || 0) + offer.percent;
  investor.ledger.push({
    id: randomUUID(),
    kind: "stake_purchase",
    companyId: company.id,
    amount: -price,
    percent: offer.percent,
    round: room.round,
  });
  seller.game.cash += price;
  seller.game.ledger.push({
    id: randomUUID(),
    kind: "share_trade_sell",
    amount: price,
    companyId: company.id,
    turn: seller.game.turn,
    closure: seller.game.closures,
    description: `Venda de ${offer.percent}% para investidor ${investor.label}`,
  });
  company.shares[offer.sellerId] -= offer.percent;
  company.shares[`npc:${investorId}`] = (company.shares[`npc:${investorId}`] || 0) + offer.percent;
  offer.status = "accepted";
  offer.buyerId = `npc:${investorId}`;
  offer.executedRound = room.round;
  offer.executedPrice = price;
  offer.counterAccepted = offer.price > price;
  company.history.push({
    type: "share_trade_npc",
    sellerId: offer.sellerId,
    buyerId: offer.buyerId,
    percent: offer.percent,
    price,
    round: room.round,
  });
  return { buyerId: offer.buyerId, price, percent: offer.percent };
}
export function publicNPC(room) {
  ensureNPC(room);
  return room.npcInvestors.map((i) => ({
    id: i.id,
    label: i.label,
    cash: i.cash,
    shares: i.shares,
  }));
}
export function checkNPC(room) {
  ensureNPC(room);
  return room.npcInvestors.every(
    (i) =>
      validMoney(i.cash) && Object.values(i.shares).every(validMoney) && Array.isArray(i.ledger),
  );
}
