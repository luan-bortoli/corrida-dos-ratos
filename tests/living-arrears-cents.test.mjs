import test from "node:test";
import assert from "node:assert/strict";
import { executeOfficialExpense, executeOuterPersonalExpense } from "../src/official-effects.js";
import { createGame, rollTurn, outstandingObligations } from "../src/engine.js";
import { cashBalanceCents } from "../src/money-balance.js";

test("despesa parcial utiliza 100% do caixa, inclusive centavos", () => {
  const s = { cash: 100, secondaryCashCents: 73, arrearsLiving: 0, arrearsLivingCents: 0 };
  const r = executeOfficialExpense(s, "DI-001", 3500);
  assert.equal(r.paidCents, 10073);
  assert.equal(r.unpaidCents, 24927);
  assert.equal(s.arrearsLivingCents, 24927);
  assert.equal(cashBalanceCents(s), 0);
});
test("despesas sucessivas acumulam a dívida exata em centavos", () => {
  const s = { cash: 0, secondaryCashCents: 7, arrearsLiving: 0, arrearsLivingCents: 0 };
  executeOuterPersonalExpense(s, "DI-023", 2000);
  executeOuterPersonalExpense(s, "DI-026", 2000);
  assert.equal(s.arrearsLivingCents, 59993);
  assert.equal(s.arrearsLiving, 600);
});
test("fechamento amortiza a pendência em centavos sem gerar saldo residual fictício", () => {
  let s = createGame(8);
  s.arrearsLivingCents = 73;
  s.arrearsLiving = 1;
  s.baseExpenses = 0;
  s.position = 31;
  s.secondaryCashCents = 73;
  s = rollTurn(s, 3);
  assert.equal(s.arrearsLivingCents, 0);
  assert.equal(outstandingObligations(s).livingCents, 0);
});
test("consulta de obrigações expõe o saldo fracionário sem arredondar", () => {
  const s = createGame(8);
  s.arrearsLivingCents = 73;
  s.arrearsLiving = 1;
  assert.equal(outstandingObligations(s).livingCents, 73);
  assert.equal(outstandingObligations(s).living, 1);
});
