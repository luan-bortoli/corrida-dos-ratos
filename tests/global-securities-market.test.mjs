import test from "node:test";
import assert from "node:assert/strict";
import { applyGlobalMarketEvent, GLOBAL_SECURITY_EVENTS } from "../src/global-market.js";
import { createGame, validateState } from "../src/engine.js";
function room(id) {
  const a = createGame(3);
  const b = structuredClone(a);
  a.officialSecurities = { "PO-013": 10, "PO-014": 2, "PO-017": 5, "PO-015": 1, "PO-016": 4 };
  b.officialSecurities = { "PO-013": 3 };
  a.pending = true;
  a.currentCard = { id, category: "MF" };
  a.cardEvents = [{ id: "evt-sec-1", resolution: "pending" }];
  return {
    round: 3,
    players: [
      { id: "a", game: a },
      { id: "b", game: b },
    ],
  };
}
test("onze eventos globais oficiais de títulos cadastrados", () =>
  assert.equal(Object.keys(GLOBAL_SECURITY_EVENTS).length, 11));
test("MF-001 valoriza energia sem gerar caixa, preservando custo e titularidade", () => {
  const r = room("MF-001");
  const old = r.players[0].game.cash;
  const result = applyGlobalMarketEvent(r, "MF-001");
  assert.equal(result.affected, 2);
  assert.equal(r.players[0].game.officialSecurityPricesCents["PO-013"], 5400);
  assert.equal(r.players[1].game.officialSecurityPricesCents["PO-013"], 5400);
  assert.equal(r.players[0].game.cash, old);
  assert.equal(r.players[0].game.officialSecurities["PO-013"], 10);
});
test("MF-004 diminui dividendo de comércio para os próximos fechamentos", () => {
  const r = room("MF-004");
  applyGlobalMarketEvent(r, "MF-004");
  assert.equal(r.players[0].game.officialSecurityDividendCents["PO-017"], 8);
  assert.equal(r.players[1].game.officialSecurityDividendCents, undefined);
});
test("MF-021 altera cotação de todas as posições existentes e não cria títulos", () => {
  const r = room("MF-021");
  const x = applyGlobalMarketEvent(r, "MF-021");
  assert.equal(x.affected, 6);
  assert.equal(r.players[0].game.officialSecurityPricesCents["PO-015"], 3680);
  assert.equal(r.players[0].game.officialSecurities["PO-015"], 1);
});
test("MF-005 aumenta cupom imobiliário sem alterar preços", () => {
  const r = room("MF-005");
  applyGlobalMarketEvent(r, "MF-005");
  assert.equal(r.players[0].game.officialSecurityDividendCents["PO-014"], 66);
  assert.equal(r.players[0].game.officialSecurityPricesCents, undefined);
});
test("não reaplica ocorrência e mantém histórico de transação", () => {
  const r = room("MF-011");
  applyGlobalMarketEvent(r, "MF-011");
  assert.throws(() => applyGlobalMarketEvent(r, "MF-011"));
  assert.equal(r.marketOccurrences.length, 1);
  assert.equal(r.players[0].game.officialSecurityPricesCents["PO-016"], 8480);
});
test("estado com cotação negativa é inválido", () => {
  const r = room("MF-001");
  r.players[0].game.officialSecurityPricesCents = { "PO-013": -1 };
  assert.equal(validateState(r.players[0].game), false);
});
