// Eventos globais de avaliação patrimonial. Não liquidam ativos e não criam receita.
// Aplicados exclusivamente uma vez após o sorteio no servidor, a todos os jogadores elegíveis.
import { OFFICIAL_SECURITIES } from "./official-securities.js";
import { REAL_ESTATE } from "./real-estate.js";
import { OFFICIAL_SMALL_BUSINESSES } from "./official-small-businesses.js";
const properties = new Set(REAL_ESTATE.map((a) => a.id));
const commercial = new Set(["GO-002", "GO-004", "GO-007"]);
const small = new Set(OFFICIAL_SMALL_BUSINESSES.map((a) => a.id));
// Receitas distribuíveis: setores explicitamente reconhecíveis nos ativos oficiais.
const rentedProperties = new Set(REAL_ESTATE.filter((a) => a.passive > 0).map((a) => a.id));
const commerce = new Set(["GO-009", "GO-015"]);
const logistics = new Set(["GO-015"]);
const food = new Set(["GO-011", "PO-002"]);
const services = new Set(["GO-012", "GO-013"]);
const holidayRentals = new Set(["GO-005"]);
const technology = new Set(["GO-018", "GI-012", "GI-017", "GI-020", "OE-018", "GO-012"]);
const sustainable = new Set(["GO-019", "GO-014", "GI-014", "GI-018", "GI-024", "OE-009"]);
export const GLOBAL_INCOME_EVENTS = Object.freeze({
  "MF-019": { rate: 85, eligible: (a) => commerce.has(a.id) },
  "MF-020": { rate: 112, eligible: (a) => logistics.has(a.id) },
  "MF-023": { rate: 80, eligible: (a) => rentedProperties.has(a.id) },
  "MF-025": { rate: 85, eligible: (a) => food.has(a.id) },
  "MF-026": { rate: 110, eligible: (a) => services.has(a.id) },
  "MF-029": { rate: 115, eligible: (a) => holidayRentals.has(a.id) },
});
export const GLOBAL_MARKET_EVENTS = Object.freeze({
  "MF-003": { numerator: 106, denominator: 100, eligible: (a) => properties.has(a.id) },
  "MF-016": { numerator: 108, denominator: 100, eligible: (a) => properties.has(a.id) },
  "MF-017": { numerator: 88, denominator: 100, eligible: (a) => properties.has(a.id) },
  "MF-022": { numerator: 110, denominator: 100, eligible: (a) => commercial.has(a.id) },
  "MF-028": { numerator: 110, denominator: 100, eligible: (a) => small.has(a.id) },
  "MF-018": { numerator: 115, denominator: 100, eligible: (a) => technology.has(a.id) },
  "MF-024": { numerator: 112, denominator: 100, eligible: (a) => sustainable.has(a.id) },
  "MF-030": { numerator: 82, denominator: 100, eligible: (a) => technology.has(a.id) },
});
// Eventos oficiais sobre instrumentos: preço (patrimônio) ou dividendos futuros.
// Os preços são em centavos e não representam liquidez garantida.
export const GLOBAL_SECURITY_EVENTS = Object.freeze({
  "MF-001": { rate: 108, kind: "price", ids: ["PO-013"] },
  "MF-002": { rate: 90, kind: "price", ids: ["PO-015"] },
  "MF-004": { rate: 80, kind: "dividend", ids: ["PO-017"] },
  "MF-005": { rate: 110, kind: "dividend", ids: ["PO-014"] },
  "MF-007": { rate: 95, kind: "price", ids: ["PO-013", "PO-015", "PO-017", "PO-016"] },
  "MF-008": { rate: 107, kind: "price", ids: ["PO-017"] },
  "MF-011": { rate: 106, kind: "price", ids: ["PO-016"] },
  "MF-013": { rate: 110, kind: "dividend", ids: ["PO-013"] },
  "MF-014": { rate: 92, kind: "price", ids: ["PO-017"] },
  "MF-015": { rate: 105, kind: "price", ids: ["PO-014"] },
  "MF-021": { rate: 92, kind: "price", ids: ["PO-013", "PO-014", "PO-015", "PO-016", "PO-017"] },
});
// Cotação e dividendos são atributos do instrumento na sala, não do titular.
export function officialRoomQuote(room, id) {
  const offer = OFFICIAL_SECURITIES.find((x) => x.id === id);
  if (!offer) throw Error("Instrumento oficial desconhecido.");
  const priceCents = room.officialMarket?.pricesCents?.[id] ?? offer.price * 100;
  const dividendCents = room.officialMarket?.dividendsCents?.[id] ?? offer.dividendCents;
  if (
    !Number.isSafeInteger(priceCents) ||
    priceCents < 0 ||
    !Number.isSafeInteger(dividendCents) ||
    dividendCents < 0
  )
    throw Error("Cotação ou dividendo inválido.");
  return { id, priceCents, dividendCents };
}
export function publicOfficialMarket(room) {
  return OFFICIAL_SECURITIES.map((x) => officialRoomQuote(room, x.id));
}
export function synchronizeOfficialPosition(room, game, id) {
  const q = officialRoomQuote(room, id);
  game.officialSecurityPricesCents ??= {};
  game.officialSecurityPricesCents[id] = q.priceCents;
  game.officialSecurityDividendCents ??= {};
  game.officialSecurityDividendCents[id] = q.dividendCents;
}
export function applyGlobalMarketEvent(room, cardId) {
  const spec =
    GLOBAL_MARKET_EVENTS[cardId] ??
    GLOBAL_SECURITY_EVENTS[cardId] ??
    GLOBAL_INCOME_EVENTS[cardId] ??
    (cardId === "MF-009" ? { kind: "fixed_rate_offer" } : null);
  if (!spec) return null;
  if (!Array.isArray(room.players)) throw Error("Jogadores inválidos.");
  room.marketOccurrences ??= [];
  // Um mesmo sorteio não pode ser aplicado duas vezes por repetição da requisição.
  const source = room.players.find(
    (p) =>
      p.game?.currentCard?.id === cardId &&
      p.game?.pending &&
      p.game?.cardEvents?.at(-1)?.resolution === "pending",
  );
  if (!source) throw Error("Não há carta global pendente válida.");
  const occurrence = source.game.cardEvents.at(-1).id;
  if (room.marketOccurrences.some((o) => o.occurrence === occurrence))
    throw Error("Evento global já processado.");
  if (cardId === "MF-009") {
    // O catálogo não especifica a duração em rodadas. A condição permanece ativa
    // até configuração explícita, sem reprecificar contratos já firmados.
    room.fixedIncomeRateBonus = 1;
    const result = {
      occurrence,
      cardId,
      round: room.round ?? 1,
      affected: room.players.filter((p) => !p.game?.won).length,
      kind: "fixed_rate_offer",
    };
    room.marketOccurrences.push(result);
    const evt = source.game.cardEvents.at(-1);
    evt.resolution = "automatic";
    evt.financialEffect = true;
    source.game.currentCard.effectExecuted = true;
    source.game.currentCard.marketResult = { cardId, kind: result.kind, global: true };
    return result;
  }
  if (GLOBAL_SECURITY_EVENTS[cardId]) {
    // Calcula todas as alterações antes de modificar a sala (validação atômica).
    const changes = [];
    const nextQuotes = [];
    for (const id of spec.ids) {
      const q = officialRoomQuote(room, id);
      const property = spec.kind === "price" ? "priceCents" : "dividendCents";
      const next = Math.round((q[property] * spec.rate) / 100);
      if (!Number.isSafeInteger(next) || next < 0) throw Error("Cotação fora dos limites.");
      nextQuotes.push({ id, property, next });
      for (const player of room.players) {
        if (player.game?.won) continue;
        const quantity = player.game?.officialSecurities?.[id] ?? 0;
        if (!Number.isSafeInteger(quantity) || quantity < 0)
          throw Error("Titularidade de título inválida.");
        if (!quantity) continue;
        changes.push({ game: player.game, playerId: player.id, id, property, next });
      }
    }
    room.officialMarket ??= { pricesCents: {}, dividendsCents: {} };
    room.officialMarket.pricesCents ??= {};
    room.officialMarket.dividendsCents ??= {};
    for (const q of nextQuotes) {
      room.officialMarket[q.property === "priceCents" ? "pricesCents" : "dividendsCents"][q.id] =
        q.next;
    }
    for (const c of changes) {
      const field =
        c.property === "priceCents"
          ? "officialSecurityPricesCents"
          : "officialSecurityDividendCents";
      c.game[field] ??= {};
      c.game[field][c.id] = c.next;
    }
    const result = {
      occurrence,
      cardId,
      round: room.round ?? 1,
      affected: changes.length,
      players: [...new Set(changes.map((c) => c.playerId))],
      kind: spec.kind === "price" ? "security_valuation" : "security_dividend",
    };
    room.marketOccurrences.push(result);
    const evt = source.game.cardEvents.at(-1);
    evt.resolution = "automatic";
    evt.financialEffect = changes.length > 0;
    source.game.currentCard.effectExecuted = true;
    source.game.currentCard.marketResult = {
      cardId,
      affected: changes.length,
      kind: result.kind,
      global: true,
    };
    return result;
  }
  if (GLOBAL_INCOME_EVENTS[cardId]) {
    // Valida o conjunto inteiro antes de modificar qualquer participante.
    const changes = [];
    for (const player of room.players) {
      if (player.game?.won) continue;
      for (const asset of player.game?.assets ?? []) {
        if (!spec.eligible(asset)) continue;
        if (!Number.isSafeInteger(asset.passive) || asset.passive < 0)
          throw Error("Rendimento de ativo inválido.");
        const next = Math.round((asset.passive * spec.rate) / 100);
        if (!Number.isSafeInteger(next) || next < 0) throw Error("Rendimento resultante inválido.");
        changes.push({ asset, playerId: player.id, next });
      }
    }
    for (const change of changes) change.asset.passive = change.next;
    const result = {
      occurrence,
      cardId,
      round: room.round ?? 1,
      affected: changes.length,
      players: [...new Set(changes.map((c) => c.playerId))],
      kind: "income",
    };
    room.marketOccurrences.push(result);
    const evt = source.game.cardEvents.at(-1);
    evt.resolution = "automatic";
    evt.financialEffect = changes.length > 0;
    source.game.currentCard.effectExecuted = true;
    source.game.currentCard.marketResult = {
      cardId,
      affected: changes.length,
      kind: "income",
      global: true,
    };
    return result;
  }
  const changes = [];
  for (const player of room.players) {
    if (player.game?.won) continue;
    for (const asset of player.game?.assets ?? []) {
      if (!spec.eligible(asset)) continue;
      const old = asset.marketValue ?? asset.cost;
      if (!Number.isSafeInteger(old) || old < 0) throw Error("Valor patrimonial inválido.");
      const next = Math.round((old * spec.numerator) / spec.denominator);
      if (!Number.isSafeInteger(next) || next < 0) throw Error("Avaliação fora dos limites.");
      changes.push({ asset, playerId: player.id, old, next });
    }
  }
  for (const c of changes) c.asset.marketValue = c.next;
  const result = {
    occurrence,
    cardId,
    round: room.round ?? 1,
    affected: changes.length,
    players: [...new Set(changes.map((c) => c.playerId))],
    kind: "valuation",
  };
  room.marketOccurrences.push(result);
  const evt = source.game.cardEvents.at(-1);
  evt.resolution = "automatic";
  evt.financialEffect = changes.length > 0;
  source.game.currentCard.effectExecuted = true;
  source.game.currentCard.marketResult = {
    cardId,
    affected: changes.length,
    kind: "valuation",
    global: true,
  };
  return result;
}
