import test from "node:test";
import assert from "node:assert/strict";
import { OFFICIAL_COMPANIES } from "../src/official-companies.js";
import { registerOwnedCompany, registerMissingOwnedCompanies } from "../src/owned-companies.js";
import { createCompanies, checkCompanies } from "../src/companies.js";
import { recordVerifiedOperatingEvent } from "../src/governance.js";
import { applyCorporateExpense } from "../src/corporate-expenses.js";
import { closeVerifiedPeriod } from "../src/distributions.js";
const make = (card = "GO-009") => ({
  round: 1,
  companies: createCompanies(),
  players: [
    {
      id: "student-a",
      game: {
        assets: [{ id: card, source: "official_company", passive: 420 }],
        cash: 100,
        ledger: [],
        closures: 0,
        turn: 1,
      },
    },
  ],
  externalSellerCash: 0,
});
test("sete empresas oficiais e duas participações societárias têm contabilidade própria", () => {
  const r = make();
  r.players[0].game.assets = OFFICIAL_COMPANIES.map((o) => ({
    id: o.id,
    source: "official_company",
    passive: o.passive,
  }));
  registerMissingOwnedCompanies(r);
  assert.equal(r.companies.length, 12);
  assert.ok(checkCompanies(r.companies));
  assert.equal(r.companies.filter((c) => c.model === "owned").length, 7);
  assert.ok(r.players[0].game.assets.every((a) => a.passive === 0 && a.companyLedgerId));
});
test("registro não se repete e exige aquisição válida", () => {
  const r = make();
  registerOwnedCompany(r, "student-a", "GO-009");
  assert.throws(() => registerOwnedCompany(r, "student-a", "GO-009"), /já registrada/);
  assert.throws(() => registerOwnedCompany(r, "student-a", "GO-010"), /não encontrada/);
});
test("receita de referência não produz pagamento sem lucro verificado", () => {
  const r = make();
  registerOwnedCompany(r, "student-a", "GO-009");
  assert.equal(closeVerifiedPeriod(r, 9)[2].paid, 0);
  assert.equal(r.players[0].game.cash, 100);
});
test("receitas verificadas respeitam reserva e dão dividendo ao proprietário", () => {
  const r = make();
  const c = registerOwnedCompany(r, "student-a", "GO-009");
  recordVerifiedOperatingEvent(c, {
    sourceId: "RECEITA:TESTE",
    type: "revenue",
    amount: 3000,
    round: 1,
  });
  const events = closeVerifiedPeriod(r, 9);
  assert.equal(events.find((e) => e.id === c.id).paid, 2000);
  assert.equal(r.players[0].game.cash, 2100);
  assert.equal(c.cash, 1000);
  assert.equal(c.retainedProfit, 1000);
  assert.equal(closeVerifiedPeriod(r, 9).length, 0);
});
test("despesa de carta debitada da empresa e não do estudante", () => {
  const r = make();
  const c = registerOwnedCompany(r, "student-a", "GO-009");
  const e = applyCorporateExpense(r, "student-a", "DI-025", "owned-test-occurrence", c.id);
  assert.equal(e.amount, 900);
  assert.equal(e.paid, 0);
  assert.equal(c.pendingExpenses, 900);
  assert.equal(r.players[0].game.cash, 100);
});
