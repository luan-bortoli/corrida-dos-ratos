import test from "node:test";
import assert from "node:assert/strict";
import { interestCents, quoteAmortizationCents } from "../src/credit-cents.js";
import { createGame, quoteCredit } from "../src/engine.js";
test("juros de 1% são arredondados por centavo sem fração binária", () => {
  assert.equal(interestCents(101), 1);
  assert.equal(interestCents(150), 2);
  assert.equal(interestCents(1050), 11);
});
test("cronograma de 6 períodos conserva principal e quita exatamente", () => {
  const q = quoteAmortizationCents(123456, 6);
  assert.equal(q.schedule.length, 6);
  assert.equal(q.schedule.at(-1).closingCents, 0);
  assert.equal(
    q.schedule.reduce((s, p) => s + p.principalPaidCents, 0),
    123456,
  );
  assert.equal(q.totalPaidCents, q.principalCents + q.totalInterestCents);
});
test("prazos aceitos seguem 6, 12 ou 24 e a última prestação é limitada ao saldo", () => {
  for (const term of [6, 12, 24]) {
    const q = quoteAmortizationCents(100000, term);
    assert.equal(q.schedule.at(-1).closingCents, 0);
    assert.ok(q.schedule.at(-1).paymentCents <= q.installmentCents);
  }
  assert.throws(() => quoteAmortizationCents(10000, 18), /inválido/);
  assert.throws(() => quoteAmortizationCents(-1, 12), /inválido/);
});
test("cotação legada mantém a prestação aprovada e oferece prévia em centavos", () => {
  const q = quoteCredit(createGame(8), 1000, 12);
  assert.equal(q.eligible, true);
  assert.equal(q.centPreview.principalCents, 100000);
  assert.equal(q.centPreview.totalPaidCents, 100000 + q.centPreview.totalInterestCents);
  assert.equal(typeof q.installment, "number");
});
