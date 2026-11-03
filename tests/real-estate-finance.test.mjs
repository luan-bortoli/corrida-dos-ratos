import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  quoteRealEstateFinance,
  financeRealEstate,
  auditCash,
  validateState,
  passiveIncome,
  finishTurn,
} from "../src/engine.js";
import { REAL_ESTATE } from "../src/real-estate.js";
function offer(id = "GO-001", cash = 150000) {
  const s = createGame(1);
  s.cash = cash;
  s.initialCash = cash;
  s.turn = 1;
  s.pending = true;
  s.lastTile = "GO";
  s.currentCard = { id, category: "GO", status: "text_available", effectExecuted: false };
  s.cardEvents = [
    {
      id,
      turn: 1,
      circuit: "inner",
      position: 7,
      status: "text_available",
      resolution: "pending",
      financialEffect: false,
    },
  ];
  return s;
}
test("entradas mínimas seguem os percentuais individuais do catálogo", () => {
  assert.deepEqual(
    REAL_ESTATE.map((x) => x.minDown),
    [20, 25, 25, 30, 25, 30, 30, 30],
  );
});
test("financiamento vincula empréstimo ao imóvel, reconcilia caixa e registra renda", () => {
  const s = offer();
  const q = quoteRealEstateFinance(s, 24, 30000);
  assert.equal(q.eligible, true);
  const n = financeRealEstate(s, 24, 30000);
  assert.equal(n.cash, 120000);
  assert.equal(n.loans.length, 1);
  assert.equal(n.loans[0].balance, 5000);
  assert.equal(n.loans[0].assetId, "GO-001");
  assert.equal(n.assets[0].loanId, n.loans[0].id);
  assert.equal(passiveIncome(n), passiveIncome(s) + 350);
  assert.equal(n.cardEvents[0].resolution, "purchase");
  assert.equal(
    n.ledger.filter((x) => x.loanId === n.loans[0].id).reduce((a, x) => a + x.amount, 0),
    -30000,
  );
  assert.ok(auditCash(n).ok);
  assert.ok(validateState(n));
  assert.equal(finishTurn(n).pending, false);
});
test("financiamento não permite comprar a mesma carta duas vezes", () => {
  const n = financeRealEstate(offer(), 24, 30000);
  assert.throws(() => financeRealEstate(n, 24, 30000), /Não há imóvel/);
});
test("entrada insuficiente e valores inválidos não criam dívida", () => {
  const s = offer();
  assert.equal(quoteRealEstateFinance(s, 24, 6999).eligible, false);
  assert.equal(quoteRealEstateFinance(s, 24, 35000).eligible, false);
  assert.equal(quoteRealEstateFinance(s, 5, 30000).eligible, false);
  assert.throws(() => financeRealEstate(s, 24, 6999));
  assert.equal(s.loans.length, 0);
});
test("crédito reprovado por capacidade não gera aquisição", () => {
  const s = offer();
  const q = quoteRealEstateFinance(s, 24, 7000);
  assert.equal(q.eligible, false);
  assert.match(q.reason, /30%|10%/);
  assert.throws(() => financeRealEstate(s, 24, 7000));
  assert.equal(s.assets.length, 0);
});
test("não há financiamento fora de GO, na Alta Velocidade ou para uma carta sem oferta", () => {
  assert.equal(quoteRealEstateFinance(offer("GO-999"), 24, 10000).eligible, false);
  const s = offer();
  s.circuit = "outer";
  assert.equal(quoteRealEstateFinance(s, 24, 30000).eligible, false);
});
