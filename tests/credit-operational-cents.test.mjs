import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  contractCredit,
  prepayLoan,
  rollTurn,
  validateState,
  auditCash,
} from "../src/engine.js";
import { cashBalanceCents } from "../src/money-balance.js";

function close(state) {
  state.position = 31;
  return rollTurn(state, 3);
}

test("novo contrato mantém principal, prestação e saldo em centavos", () => {
  const s = contractCredit(createGame(8), 1200, 12),
    loan = s.loans[0];
  assert.equal(loan.balanceCents, 120000);
  assert.ok(loan.installmentCents > 0);
  assert.equal(loan.balance, 1200);
  assert.ok(validateState(s));
});
test("fechamento paga parcela fracionária exata e concilia caixa", () => {
  let s = contractCredit(createGame(8), 1200, 12);
  const initial = s.loans[0].balanceCents;
  s = close(s);
  const loan = s.loans[0];
  assert.ok(loan.balanceCents < initial);
  assert.equal(loan.balance, Math.ceil(loan.balanceCents / 100));
  assert.equal(loan.arrearsCents, 0);
  assert.ok(
    s.ledger.some(
      (e) => e.kind === "loan_payment" && Number.isSafeInteger(e.amountCents) && e.amountCents < 0,
    ),
  );
  assert.ok(auditCash(s).ok);
  assert.ok(validateState(s));
});
test("quitação antecipada integral em reais permanece exata", () => {
  let s = contractCredit(createGame(8), 1000, 12);
  const balance = cashBalanceCents(s);
  s = prepayLoan(s, s.loans[0].id, 1000);
  assert.equal(s.loans[0].balanceCents, 0);
  assert.equal(cashBalanceCents(s), balance - 100000);
  assert.ok(validateState(s));
});
test("contrato legado sem campos em centavos continua processável", () => {
  let s = contractCredit(createGame(8), 1200, 12);
  const loan = s.loans[0];
  for (const key of ["balanceCents", "originalCents", "installmentCents", "arrearsCents"])
    delete loan[key];
  s = close(s);
  assert.ok(s.loans[0].balance < 1200);
  assert.equal(s.loans[0].balanceCents, undefined);
  assert.ok(validateState(s));
});
test("estado rejeita divergência de saldo em centavos de contrato novo", () => {
  const s = contractCredit(createGame(8), 1000, 12);
  s.loans[0].balanceCents = -1;
  assert.equal(validateState(s), false);
});
