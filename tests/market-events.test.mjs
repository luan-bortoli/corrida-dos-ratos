import test from "node:test";
import assert from "node:assert/strict";
import { applyIndividualMarketEvent, INDIVIDUAL_MARKET_EVENTS } from "../src/market-events.js";
import { createGame, rollTurn, validateState, finishTurn } from "../src/engine.js";
function sample() {
  return {
    cash: 1000,
    assets: [
      { id: "PO-018", cost: 1600, passive: 35 },
      { id: "GO-001", cost: 35000, passive: 350 },
      { id: "PO-001", cost: 3000, passive: 75 },
      { id: "PO-015", cost: 40, passive: 0 },
    ],
  };
}
test("somente os quatro eventos individuais têm execução automática", () =>
  assert.deepEqual(Object.keys(INDIVIDUAL_MARKET_EVENTS), [
    "MF-006",
    "MF-010",
    "MF-012",
    "MF-027",
  ]));
test("MF-006 aumenta em 10% a renda de equipamento elegível, sem mudar o caixa", () => {
  const s = sample();
  const x = applyIndividualMarketEvent(s, "MF-006");
  assert.equal(x.affected, 1);
  assert.equal(s.assets[0].passive, 39);
  assert.equal(s.assets[1].passive, 350);
  assert.equal(s.cash, 1000);
});
test("MF-010 desvaloriza equipamento sem mudar renda ou custo histórico", () => {
  const s = sample();
  applyIndividualMarketEvent(s, "MF-010");
  assert.equal(s.assets[0].marketValue, 1440);
  assert.equal(s.assets[0].cost, 1600);
  assert.equal(s.assets[0].passive, 35);
  assert.equal(s.cash, 1000);
});
test("MF-012 reduz em 15% a renda dos imóveis alugados elegíveis", () => {
  const s = sample();
  applyIndividualMarketEvent(s, "MF-012");
  assert.equal(s.assets[1].passive, 298);
  assert.equal(s.assets[0].passive, 35);
});
test("MF-027 reduz em 15% a avaliação de equipamento e pequeno negócio", () => {
  const s = sample();
  const x = applyIndividualMarketEvent(s, "MF-027");
  assert.equal(x.affected, 2);
  assert.equal(s.assets[0].marketValue, 1360);
  assert.equal(s.assets[2].marketValue, 2550);
  assert.equal(s.assets[1].marketValue, undefined);
});
test("sem ativo elegível evento é não aplicável sem sortear outra carta", () => {
  const s = { assets: [{ id: "PO-015", cost: 40, passive: 0 }] };
  const x = applyIndividualMarketEvent(s, "MF-006");
  assert.equal(x.affected, 0);
  assert.equal(s.assets[0].passive, 0);
});
test("aplicações sucessivas incidem sobre o valor atual, não o original", () => {
  const s = sample();
  applyIndividualMarketEvent(s, "MF-006");
  applyIndividualMarketEvent(s, "MF-006");
  assert.equal(s.assets[0].passive, 43);
});
test("não altera dados para cartas globais ainda não implementadas", () => {
  const s = sample();
  assert.equal(applyIndividualMarketEvent(s, "MF-001"), null);
  assert.equal(s.assets[0].marketValue, undefined);
});
test("estado legado continua válido e encerramento normal permanece possível", () => {
  const s = createGame(1);
  assert.equal(validateState(s), true);
  const r = rollTurn(s, 1);
  assert.equal(validateState(r), true);
  assert.equal(validateState(finishTurn(r)), true);
});
