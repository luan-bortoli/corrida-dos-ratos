import { test } from "node:test";
import assert from "node:assert/strict";
import { createCompanies, checkCompanies, closeCompanies } from "../src/companies.js";
import { applyCorporateExpense, CORPORATE_DI } from "../src/corporate-expenses.js";
import { createGame } from "../src/engine.js";
const room = () => {
  const c = createCompanies();
  c[0].shares = { origin: 75, student: 25 };
  return { round: 1, players: [{ id: "student", game: createGame(11, "TRAVEL") }], companies: c };
};
test("cinco valores oficiais preservados", () => {
  assert.deepEqual(Object.values(CORPORATE_DI), [1500, 900, 1800, 1100, 1000]);
});
test("sem empresa elegível não cobra estudante", () => {
  const r = room();
  r.companies[0].shares = { origin: 100 };
  const cash = r.players[0].game.cash;
  const x = applyCorporateExpense(r, "student", "DI-022", "abc-1");
  assert.equal(x.applicable, false);
  assert.equal(r.players[0].game.cash, cash);
});
test("despesa empresarial parcial cria obrigação e não debita sócio", () => {
  const r = room(),
    c = r.companies[0],
    cash = r.players[0].game.cash;
  const x = applyCorporateExpense(r, "student", "DI-022", "abc-2");
  assert.equal(x.paid, 1000);
  assert.equal(x.pending, 500);
  assert.equal(c.cash, 0);
  assert.equal(c.pendingExpenses, 500);
  assert.equal(c.retainedProfit, -1500);
  assert.equal(r.players[0].game.cash, cash);
  assert(checkCompanies(r.companies));
});
test("idempotência por ocorrência", () => {
  const r = room();
  applyCorporateExpense(r, "student", "DI-025", "abc-3");
  assert.throws(() => applyCorporateExpense(r, "student", "DI-025", "abc-3"), /já registrada/);
});
test("uma ocorrência não multiplica cobrança entre sociedades", () => {
  const r = room();
  r.companies[1].shares = { origin: 75, student: 25 };
  assert.throws(() => applyCorporateExpense(r, "student", "DI-034", "abc-4"), /Selecione/);
  applyCorporateExpense(r, "student", "DI-034", "abc-4", r.companies[1].id);
  assert.equal(r.companies[0].operatingLedger.length, 0);
  assert.equal(r.companies[1].operatingLedger.length, 1);
});
test("despesa impede dividendo sem lucro verificado", () => {
  const r = room();
  applyCorporateExpense(r, "student", "DI-031", "abc-5");
  r.round = 9;
  const x = closeCompanies(r, 9);
  assert.equal(x[0].paid, 0);
});

test("empresa escolhida deve pertencer ao estudante e erro não modifica nenhuma empresa", () => {
  const r = room();
  const before = structuredClone(r.companies);
  assert.throws(
    () => applyCorporateExpense(r, "student", "DI-025", "abc-6", "GO-017"),
    /não pertence/,
  );
  assert.deepEqual(r.companies, before);
});
test("no fechamento, quita pendência com dinheiro disponível, sem debitar sócios nem duplicar despesa", () => {
  const r = room(),
    c = r.companies[0];
  applyCorporateExpense(r, "student", "DI-022", "abc-7");
  assert.equal(c.pendingExpenses, 500);
  c.cash = 700;
  const before = r.players[0].game.cash;
  const records = closeCompanies(r, 9);
  assert.equal(records[0].settledPending, 500);
  assert.equal(c.pendingExpenses, 0);
  assert.equal(c.cash, 200);
  assert.equal(r.players[0].game.cash, before);
  assert.equal(c.operatingLedger.filter((e) => e.type === "expense").length, 1);
  assert.equal(c.operatingLedger.filter((e) => e.type === "settlement").length, 1);
  assert.equal(closeCompanies(r, 9).length, 0);
});
test("fechamento com caixa insuficiente quita só até o caixa disponível e mantém resto", () => {
  const r = room(),
    c = r.companies[0];
  applyCorporateExpense(r, "student", "DI-022", "abc-8");
  c.cash = 125;
  const x = closeCompanies(r, 9);
  assert.equal(x[0].settledPending, 125);
  assert.equal(c.pendingExpenses, 375);
  assert.equal(c.cash, 0);
});
