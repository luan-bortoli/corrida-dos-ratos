import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  quoteCredit,
  contractCredit,
  prepayLoan,
  rollTurn,
  finishTurn,
  auditCash,
  recurringExpenses,
  outstandingObligations,
  exportFinanceCSV,
} from "../src/engine.js";
test("prazo permitido e parcela positiva", () => {
  for (const term of [6, 12, 24]) {
    const q = quoteCredit(createGame(8), 1000, term);
    assert.ok(q.eligible);
    assert.ok(q.installment > 0);
  }
  assert.equal(quoteCredit(createGame(8), 1000, 18).eligible, false);
});
test("contratação gera saldo, dívida e lançamento conciliado", () => {
  const original = createGame(8);
  const s = contractCredit(original, 1000, 12);
  assert.equal(s.cash, 6000);
  assert.equal(s.loans[0].balance, 1000);
  assert.equal(s.ledger.at(-1).amount, 1000);
  assert.ok(auditCash(s).ok);
  assert.equal(original.loans.length, 0);
});
test("rejeita crédito além de 30% e não altera original", () => {
  const s = createGame(0);
  assert.equal(quoteCredit(s, 30000, 6).eligible, false);
  assert.throws(() => contractCredit(s, 30000, 6));
  assert.equal(s.cash, 2000);
});
test("rejeita crédito com pendências", () => {
  const s = createGame(8);
  s.arrearsLiving = 100;
  s.arrearsLivingCents = 10000;
  assert.match(quoteCredit(s, 1000, 12).reason, /atraso/);
});
test("parcela do novo crédito amortiza saldo em fechamento", () => {
  let s = contractCredit(createGame(8), 1200, 12);
  const prior = s.loans[0].balance;
  s.position = 31;
  s = rollTurn(s, 3);
  assert.ok(s.loans[0].balance < prior);
  assert.equal(s.loans[0].arrears, 0);
  assert.ok(auditCash(s).ok);
});
test("crédito não pode ser contratado durante decisão pendente", () => {
  let s = rollTurn(createGame(8), 1);
  assert.equal(quoteCredit(s, 1000, 12).eligible, false);
});
test("amortização antecipada reduz principal e preserva caixa conciliado", () => {
  let s = contractCredit(createGame(8), 1200, 12);
  s = prepayLoan(s, s.loans[0].id, 400);
  assert.equal(s.loans[0].balance, 800);
  assert.equal(s.cash, 5800);
  assert.ok(auditCash(s).ok);
});
test("não aceita amortização maior que dívida ou caixa", () => {
  let s = contractCredit(createGame(8), 1000, 12);
  assert.throws(() => prepayLoan(s, s.loans[0].id, 1001));
  assert.throws(() => prepayLoan(s, s.loans[0].id, -1));
});
test("empréstimo com falta de caixa gera atraso e não reduz principal indevidamente", () => {
  let s = contractCredit(createGame(0), 1000, 24);
  s.cash = 0;
  s.initialCash = 0;
  s.ledgerBaseline = -1000;
  s.baseExpenses = 10000;
  s.position = 31;
  s = rollTurn(s, 3);
  assert.ok(s.loans[0].arrears > 0);
  assert.ok(outstandingObligations(s).total > 0);
  assert.equal(s.cash, 0);
});
test("quitação integral elimina prestação recorrente", () => {
  let s = contractCredit(createGame(8), 1000, 12);
  const expense = recurringExpenses(s);
  s = prepayLoan(s, s.loans[0].id, 1000);
  assert.ok(recurringExpenses(s) < expense);
});
test("extrato exportado tem cabeçalho e registra crédito", () => {
  const s = contractCredit(createGame(8), 1000, 12);
  const csv = exportFinanceCSV(s);
  assert.match(csv, /turno;fechamento;tipo;descricao;valor/);
  assert.match(csv, /credit/);
});
