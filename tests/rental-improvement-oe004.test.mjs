import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  eligibleRentalImprovements,
  improveRentalProperty,
  finishTurn,
  rollTurn,
  validateState,
  auditCash,
} from "../src/engine.js";
function prepare() {
  const s = createGame(1);
  s.cash = 30000;
  s.initialCash = 30000;
  s.circuit = "outer";
  s.pending = true;
  s.lastTile = "OE";
  s.currentCard = { id: "OE-004", category: "OE", status: "text_available", effectExecuted: false };
  s.cardEvents = [
    {
      id: "OE-004",
      turn: 1,
      circuit: "outer",
      position: 1,
      status: "text_available",
      resolution: "pending",
      financialEffect: false,
    },
  ];
  s.assets = [
    {
      id: "GO-001",
      ownershipId: "property1",
      name: "Apartamento para aluguel",
      cost: 35000,
      passive: 350,
      kind: "real_estate",
    },
    { id: "GO-006", ownershipId: "land1", name: "Terreno", cost: 25000, passive: 0 },
  ];
  return s;
}
test("OE-004 reforma: paga 20 mil, registra melhoria e não antecipa renda", () => {
  const original = prepare();
  const eligible = eligibleRentalImprovements(original);
  assert.equal(eligible.length, 1);
  const next = improveRentalProperty(original, "property1");
  assert.equal(next.cash, 10000);
  assert.equal(next.assets[0].passive, 350);
  assert.equal(next.assets[0].pendingRentalBonus, 53);
  assert.equal(next.assets[0].improvements[0].firstEligibleClosure, 1);
  assert.equal(next.cardEvents[0].resolution, "rental_improvement");
  assert.equal(validateState(next), true);
  assert.equal(auditCash(next).ok, true);
  assert.equal(original.cash, 30000);
  assert.throws(() => improveRentalProperty(next, "property1"));
});
test("OE-004 rejeita terrenos, ativos inexistentes e saldo insuficiente", () => {
  const s = prepare();
  assert.throws(() => improveRentalProperty(s, "land1"), /elegível/);
  s.cash = 19999;
  assert.throws(() => improveRentalProperty(s, "property1"), /insuficiente/);
});
test("OE-004 aumento de renda ocorre no fechamento seguinte", () => {
  let s = improveRentalProperty(prepare(), "property1");
  s = finishTurn(s);
  s.position = 48;
  s = rollTurn(s, 1);
  assert.equal(s.closures, 1);
  assert.equal(s.assets[0].passive, 403);
  assert.equal(s.assets[0].pendingRentalBonus, 0);
  assert.equal(validateState(s), true);
});
