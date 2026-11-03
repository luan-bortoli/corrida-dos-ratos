// Read-only audit. No unverified official card receives an executable effect.
import { CARD_CATALOG, cardsForTile } from "./catalog.js";
import { functionalCoverage } from "./functional-coverage.js";
import { VERIFIED_ASSETS, INNER, OUTER } from "./data.js";
const EXPECTED = { PO: 25, GO: 20, DI: 35, MF: 30, EV: 30, EF: 30, BE: 10, GI: 25, OE: 20, FI: 5 };
const TILES = {
  PO: "PO",
  GO: "GO",
  DI: "DI",
  MF: "MF",
  EV: "EV",
  EF: "EF",
  BE: "BE",
  GI: "GI",
  OE: "OE",
  FI: "FI",
};
export function catalogAudit() {
  const errors = [];
  const seen = new Set();
  const groups = {};
  for (const [cat, n] of Object.entries(EXPECTED))
    groups[cat] = { expected: n, actual: 0, verifiedExecutable: 0, pending: 0 };
  for (const card of CARD_CATALOG) {
    if (seen.has(card.id)) errors.push(`Identificador repetido: ${card.id}`);
    seen.add(card.id);
    if (!groups[card.category]) {
      errors.push(`Categoria desconhecida: ${card.id}`);
      continue;
    }
    groups[card.category].actual++;
    if (card.status === "awaiting_approved_text") groups[card.category].pending++;
    else if (card.status === "verified_official") groups[card.category].verifiedExecutable++;
    else if (card.status === "text_available")
      groups[card.category].textAvailable = (groups[card.category].textAvailable ?? 0) + 1;
    else errors.push(`Estado de carta inválido: ${card.id}`);
  }
  for (const [cat, g] of Object.entries(groups))
    if (g.actual !== g.expected) errors.push(`Quantidade incorreta: ${cat}`);
  for (const [circuit, board] of [
    ["inner", INNER],
    ["outer", OUTER],
  ])
    for (const tile of new Set(board)) {
      if (!TILES[tile]) continue;
      const available = cardsForTile(tile, circuit);
      if (!available.length) errors.push(`Sem cartas para ${circuit}:${tile}`);
    }
  const demos = VERIFIED_ASSETS.map(({ id, name, cost, passive }) => ({
    id,
    name,
    cost,
    passive,
    mode: "isolated_demo_not_official_effect",
  }));
  return {
    schema: 1,
    totalExpected: 230,
    totalActual: CARD_CATALOG.length,
    officialExecutable: CARD_CATALOG.filter((c) => c.status === "verified_official").length,
    officialPending: CARD_CATALOG.filter((c) => c.status === "awaiting_approved_text").length,
    officialTextAvailable: CARD_CATALOG.filter((c) => c.status === "text_available").length,
    demonstrations: demos,
    groups,
    errors,
    valid: errors.length === 0,
  };
}
export function roomCardAudit(room) {
  const summary = catalogAudit();
  const byPlayer = (room.players || []).map((p) => ({
    name: p.name,
    turns: p.game?.turn || 0,
    resolutions: (p.game?.cardEvents || []).length,
    purchases: (p.game?.cardEvents || []).filter((e) => e.resolution === "purchase").length,
    acknowledgments: (p.game?.cardEvents || []).filter((e) => e.resolution === "acknowledge")
      .length,
    pending: (p.game?.cardEvents || []).filter((e) => e.resolution === "pending").length,
  }));
  return {
    ...summary,
    coverage: (() => {
      const { total, counts, categories, percentages, disclaimer } = functionalCoverage();
      return { total, counts, categories, percentages, disclaimer };
    })(),
    roomCode: room.code,
    roomStatus: room.status,
    players: byPlayer,
    disclaimer:
      "Cobertura de rotas do código não é homologação individual das 230 cartas; ver campo coverage.",
  };
}
