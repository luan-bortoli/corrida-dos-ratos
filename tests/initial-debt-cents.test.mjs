import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  rollTurn,
  finishTurn,
  prepayLoan,
  validateState,
  auditCash,
} from "../src/engine.js";
import { cashBalanceCents } from "../src/money-balance.js";
function close(s) {
  s.position = 31;
  s.pending = false;
  return rollTurn(s, 3);
}
test("dívida inicial nasce com centavos como fonte contábil", () => {
  const s = createGame(0);
  assert.equal(s.initialDebtCents, s.debt * 100);
  assert.equal(s.initialInstallmentCents, s.installment * 100);
  assert.equal(s.initialArrearsCents, 0);
  assert.ok(validateState(s));
});
test("juros iniciais preservam frações nas rodadas seguintes", () => {
  let s = createGame(0);
  s.cash = 0;
  s.initialCash = 0;
  s.baseExpenses = 10000;
  s = close(s);
  assert.equal(s.initialDebtCents, 303000);
  s = finishTurn(s);
  s = close(s);
  assert.equal(s.initialDebtCents, 306030);
  assert.equal(s.debt, 3061);
  assert.equal(s.initialArrearsCents, 60000);
  assert.ok(validateState(s));
});
test("pagamento inicial pode consumir centavos e mantém extrato conciliado", () => {
  let s = createGame(1);
  s.cash = 0;
  s.initialCash = 0;
  s.secondaryCashCents = 99;
  s.baseExpenses = 0;
  // Não há parcela inicial se a profissão não possuir dívida; neste teste há.
  assert.ok(s.initialDebtCents > 0);
  s = close(s);
  assert.equal(cashBalanceCents(s) % 100, 99); // salário foi suficiente, não houve perda.
  assert.equal(s.initialArrearsCents, 0);
  assert.ok(auditCash(s).ok);
});
test("amortização da dívida inicial mantém sincronizadas as projeções", () => {
  let s = createGame(0);
  s = prepayLoan(s, "initial", 100);
  assert.equal(s.initialDebtCents, 290000);
  assert.equal(s.debt, 2900);
  assert.ok(validateState(s));
});
test("validação rejeita projeção inicial divergente", () => {
  const s = createGame(0);
  s.initialDebtCents++;
  assert.equal(validateState(s), false);
});
