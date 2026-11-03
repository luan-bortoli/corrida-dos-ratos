import test from "node:test";
import assert from "node:assert/strict";
import { applyGlobalMarketEvent } from "../src/global-market.js";
import { subscribeFixedIncome } from "../src/engine.js";
import { functionalCoverage } from "../src/functional-coverage.js";
function game() {
  return {
    officialPOEnabled: true,
    currentCard: { id: "PO-008", category: "PO" },
    circuit: "inner",
    pending: true,
    lastTile: "PO",
    cash: 2500,
    secondaryCashCents: 0,
    closures: 0,
    turn: 1,
    cardEvents: [{ id: "subscription", resolution: "pending" }],
    history: [],
    fixedIncome: [],
  };
}
test("MF-009 é global, automático e não debita posições", () => {
  const g = {
    currentCard: { id: "MF-009", category: "MF" },
    pending: true,
    cardEvents: [{ id: "mf009-1", resolution: "pending" }],
    cash: 1500,
  };
  const r = {
    round: 3,
    players: [
      { id: "a", game: g },
      { id: "b", game: { won: false } },
    ],
  };
  const x = applyGlobalMarketEvent(r, "MF-009");
  assert.equal(x.kind, "fixed_rate_offer");
  assert.equal(r.fixedIncomeRateBonus, 1);
  assert.equal(g.cash, 1500);
  assert.equal(g.cardEvents[0].resolution, "automatic");
  assert.throws(() => applyGlobalMarketEvent(r, "MF-009"), /pendente|processado/);
});
test("nova aplicação recebe 0,1 ponto percentual; contrato anterior permanece imutável", () => {
  const old = subscribeFixedIncome(game(), 1000);
  const newer = subscribeFixedIncome(game(), 1000, 1);
  assert.equal(old.fixedIncome[0].contractRate, 0.005);
  assert.equal(newer.fixedIncome[0].contractRate, 0.006);
  assert.equal(old.cash, newer.cash);
});
test("não aceita bonificação arbitrária ou negativa", () => {
  assert.throws(() => subscribeFixedIncome(game(), 1000, -1), /inválido/);
  assert.throws(() => subscribeFixedIncome(game(), 1000, 11), /inválido/);
});
test("auditoria identifica as 230 cartas, incluindo MF-009", () => {
  const v = functionalCoverage();
  assert.equal(v.total, 230);
  assert.equal(v.counts.sem_rota, 0);
  assert.equal(v.percentages.rotasIdentificadas, 100);
});
