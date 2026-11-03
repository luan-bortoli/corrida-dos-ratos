import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  resolvePhilanthropy,
  validateState,
  auditCash,
  finishTurn,
} from "../src/engine.js";
import { PHILANTHROPY, validateSocialImpact } from "../src/philanthropy.js";
function state(id, cash = 5000) {
  const s = createGame(1);
  s.circuit = "outer";
  s.turn = 5;
  s.lastTile = "FI";
  s.pending = true;
  s.currentCard = { id, category: "FI", status: "text_available" };
  s.cash = cash;
  s.initialCash = cash;
  s.ledger = [];
  s.secondaryCashCents = 73;
  s.cardEvents = [
    {
      id,
      turn: 5,
      circuit: "outer",
      position: 1,
      status: "text_available",
      resolution: "pending",
      financialEffect: false,
    },
  ];
  return s;
}
for (const [id, offer] of Object.entries(PHILANTHROPY)) {
  test(`${id} contribuição permitida preserva caixa e indicador`, () => {
    const s = state(id);
    const [amount, impact] = offer.options[1];
    const end = resolvePhilanthropy(s, amount);
    assert.equal(end.cash, 5000 - amount);
    assert.equal(end.secondaryCashCents, 73);
    assert.equal(end.socialImpact[0].impact, impact);
    assert.equal(end.cardEvents[0].resolution, "philanthropy");
    assert.ok(validateState(end));
    assert.ok(auditCash(end).ok);
    assert.equal(finishTurn(end).pending, false);
  });
  test(`${id} recusa sem penalidade`, () => {
    const s = state(id);
    const end = resolvePhilanthropy(s, 0);
    assert.equal(end.cash, s.cash);
    assert.equal(end.socialImpact?.length ?? 0, 0);
    assert.equal(end.cardEvents[0].financialEffect, false);
    assert.ok(validateState(end));
  });
  test(`${id} bloqueia valor e caixa inválidos`, () => {
    const s = state(id, 100);
    assert.throws(() => resolvePhilanthropy(s, offer.options[0][0]), /Caixa insuficiente/);
    assert.throws(() => resolvePhilanthropy(s, 123), /faixa/);
    assert.equal(s.cardEvents[0].resolution, "pending");
  });
}
test("sem repetição da mesma contribuição e indicadores inválidos", () => {
  const s = resolvePhilanthropy(state("FI-001"), 500);
  assert.throws(() => resolvePhilanthropy(s, 500), /pendente/);
  assert.equal(validateSocialImpact([{ ...s.socialImpact[0], impact: 999 }]), false);
  assert.equal(
    validateState({ ...s, socialImpact: [{ ...s.socialImpact[0], impact: 999 }] }),
    false,
  );
});
