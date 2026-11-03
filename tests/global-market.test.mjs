import test from "node:test";
import assert from "node:assert/strict";
import { applyGlobalMarketEvent, GLOBAL_MARKET_EVENTS } from "../src/global-market.js";
function room(cardId = "MF-003") {
  const event = { id: "evt-1", resolution: "pending" };
  return {
    round: 2,
    players: [
      {
        id: "a",
        game: {
          pending: true,
          won: false,
          currentCard: { id: cardId, category: "MF" },
          cardEvents: [event],
          assets: [
            { id: "GO-001", cost: 35000, passive: 350 },
            { id: "GO-002", cost: 48000, passive: 430 },
          ],
        },
      },
      {
        id: "b",
        game: {
          pending: false,
          won: false,
          assets: [
            { id: "GO-001", cost: 35000, passive: 350 },
            { id: "PO-001", cost: 3000, passive: 75 },
          ],
        },
      },
      {
        id: "c",
        game: { pending: false, won: true, assets: [{ id: "GO-001", cost: 35000, passive: 350 }] },
      },
    ],
  };
}
test("cinco eventos globais patrimoniais com percentuais oficiais", () =>
  assert.deepEqual(Object.keys(GLOBAL_MARKET_EVENTS), [
    "MF-003",
    "MF-016",
    "MF-017",
    "MF-022",
    "MF-028",
    "MF-018",
    "MF-024",
    "MF-030",
  ]));
test("MF-003 alcança jogadores elegíveis e exclui vencedor sem alterar renda", () => {
  const r = room();
  const x = applyGlobalMarketEvent(r, "MF-003");
  assert.equal(x.affected, 3);
  assert.equal(r.players[0].game.assets[0].marketValue, 37100);
  assert.equal(r.players[1].game.assets[0].marketValue, 37100);
  assert.equal(r.players[2].game.assets[0].marketValue, undefined);
  assert.equal(r.players[0].game.assets[0].passive, 350);
  assert.equal(r.players[0].game.assets[0].cost, 35000);
});
test("MF-022 restringe alteração a imóveis comerciais", () => {
  const r = room("MF-022");
  const x = applyGlobalMarketEvent(r, "MF-022");
  assert.equal(x.affected, 1);
  assert.equal(r.players[0].game.assets[1].marketValue, 52800);
  assert.equal(r.players[0].game.assets[0].marketValue, undefined);
});
test("MF-028 restringe alteração a pequenos negócios", () => {
  const r = room("MF-028");
  const x = applyGlobalMarketEvent(r, "MF-028");
  assert.equal(x.affected, 1);
  assert.equal(r.players[1].game.assets[1].marketValue, 3300);
});
test("bloqueia reaplicação da mesma ocorrência", () => {
  const r = room();
  applyGlobalMarketEvent(r, "MF-003");
  assert.throws(() => applyGlobalMarketEvent(r, "MF-003"), /pendente|processado/);
  assert.equal(r.marketOccurrences.length, 1);
});
test("sem ativo elegível registra zero e não modifica caixa", () => {
  const r = room("MF-022");
  r.players.forEach((p) => (p.game.assets = [{ id: "PO-015", cost: 40, passive: 0 }]));
  r.players[0].game.cash = 170;
  const x = applyGlobalMarketEvent(r, "MF-022");
  assert.equal(x.affected, 0);
  assert.equal(r.players[0].game.cash, 170);
  assert.equal(r.marketOccurrences.length, 1);
});
test("rejeita valores patrimoniais corrompidos antes de qualquer modificação", () => {
  const r = room();
  r.players[1].game.assets[0].marketValue = -1;
  assert.throws(() => applyGlobalMarketEvent(r, "MF-003"), /inválido/);
  assert.equal(r.players[0].game.assets[0].marketValue, undefined);
});
