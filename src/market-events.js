// Efeitos individuais expressos literalmente nas cartas de Mercado Financeiro.
// O valor patrimonial não é convertido em dinheiro ou renda passiva.
import { OFFICIAL_PO_RENTALS, OFFICIAL_SMALL_BUSINESSES } from "./official-small-businesses.js";
import { REAL_ESTATE } from "./real-estate.js";
const rentals = new Set(OFFICIAL_PO_RENTALS.map((x) => x.id));
const businesses = new Set(OFFICIAL_SMALL_BUSINESSES.map((x) => x.id));
const properties = new Set(REAL_ESTATE.filter((x) => x.passive > 0).map((x) => x.id));
export const INDIVIDUAL_MARKET_EVENTS = Object.freeze({
  "MF-006": {
    field: "passive",
    numerator: 110,
    denominator: 100,
    eligible: (a) => rentals.has(a.id),
  },
  "MF-010": {
    field: "marketValue",
    numerator: 90,
    denominator: 100,
    eligible: (a) => rentals.has(a.id),
  },
  "MF-012": {
    field: "passive",
    numerator: 85,
    denominator: 100,
    eligible: (a) => properties.has(a.id),
  },
  "MF-027": {
    field: "marketValue",
    numerator: 85,
    denominator: 100,
    eligible: (a) => rentals.has(a.id) || businesses.has(a.id),
  },
});
export function applyIndividualMarketEvent(state, cardId) {
  const event = INDIVIDUAL_MARKET_EVENTS[cardId];
  if (!event) return null;
  let affected = 0;
  for (const asset of state.assets ?? []) {
    if (!event.eligible(asset)) continue;
    const initial = event.field === "marketValue" ? asset.cost : asset.passive;
    const current = asset[event.field] ?? initial;
    if (!Number.isSafeInteger(current) || current < 0)
      throw Error("Valor de ativo inválido para evento de mercado.");
    const next = Math.round((current * event.numerator) / event.denominator);
    if (!Number.isSafeInteger(next) || next < 0) throw Error("Resultado financeiro inválido.");
    asset[event.field] = next;
    affected++;
  }
  return { cardId, affected, kind: event.field === "marketValue" ? "valuation" : "income" };
}
