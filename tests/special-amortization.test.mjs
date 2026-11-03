import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  resolveExtraordinaryAmortization,
  validateState,
  auditCash,
} from "../src/engine.js";
function fixture() {
  const s = createGame(1);
  s.circuit = "outer";
  s.turn = 3;
  s.lastTile = "OE";
  s.pending = true;
  s.currentCard = { id: "OE-016", category: "OE", status: "text_available" };
  s.cash = 5000;
  s.initialCash = 5000;
  s.ledger = [];
  s.ledgerBaseline = 5000;
  s.secondaryCashCents = 31;
  s.cardEvents = [
    {
      id: "OE-016",
      turn: 3,
      circuit: "outer",
      position: 1,
      status: "text_available",
      resolution: "pending",
      financialEffect: false,
    },
  ];
  return s;
}
test("OE-016 reduz dívida inicial e caixa mantendo centavos", () => {
  const s = fixture();
  const result = resolveExtraordinaryAmortization(s, "initial", 1000);
  assert.equal(result.initialDebtCents, s.initialDebtCents - 100000);
  assert.equal(result.cash, 4000);
  assert.equal(result.secondaryCashCents, 31);
  assert.ok(validateState(result));
  assert.ok(auditCash(result).ok);
  assert.throws(() => resolveExtraordinaryAmortization(result, "initial", 1000));
});
test("OE-016 não aceita amortização abaixo do mínimo, caixa insuficiente ou dívida inexistente", () => {
  const s = fixture();
  assert.throws(() => resolveExtraordinaryAmortization(s, "initial", 999), /mínima/);
  assert.throws(
    () => resolveExtraordinaryAmortization({ ...s, cash: 100 }, "initial", 1000),
    /Caixa/,
  );
  assert.throws(() => resolveExtraordinaryAmortization(s, "desconhecida", 1000), /não encontrado/);
});
