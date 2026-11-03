import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  purchaseOfficialCompany,
  passiveIncome,
  auditCash,
  finishTurn,
} from "../src/engine.js";
import { OFFICIAL_COMPANIES, officialCompanyOffer } from "../src/official-companies.js";
function pending(id = "GO-009", cash = 150000) {
  let s = createGame(1);
  s.cash = cash;
  s.initialCash = cash;
  s.pending = true;
  s.turn = 1;
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
test("sete empresas correspondem às ofertas e valores aprovados", () => {
  assert.equal(OFFICIAL_COMPANIES.length, 7);
  assert.deepEqual(
    OFFICIAL_COMPANIES.map((x) => x.id),
    Array.from({ length: 7 }, (_, i) => `GO-${String(i + 9).padStart(3, "0")}`),
  );
  assert.equal(OFFICIAL_COMPANIES.find((x) => x.id === "GO-015").cost, 90000);
});
test("aquisição debita valor, registra titularidade e renda de referência", () => {
  let s = pending();
  const before = passiveIncome(s);
  s = purchaseOfficialCompany(s);
  assert.equal(s.cash, 122000);
  assert.equal(s.assets[0].source, "official_company");
  assert.equal(s.assets[0].id, "GO-009");
  assert.equal(s.assets[0].incomeStatus, "initial_reference");
  assert.equal(passiveIncome(s), before + 420);
  assert.equal(s.ledger.at(-1).amount, -28000);
  assert.equal(auditCash(s).ok, true);
});
test("impede compra duplicada e exige oferta pendente", () => {
  const s = purchaseOfficialCompany(pending());
  assert.throws(() => purchaseOfficialCompany(s));
  assert.equal(finishTurn(s).pending, false);
  assert.throws(() => purchaseOfficialCompany(finishTurn(s)));
});
test("recusa saldo insuficiente sem modificar partida original", () => {
  const s = pending("GO-011", 1000);
  assert.throws(() => purchaseOfficialCompany(s), /Caixa insuficiente/);
  assert.equal(s.cash, 1000);
  assert.equal(s.assets.length, 0);
});
test("não disponibiliza empresa fora da carta correspondente ou circuito", () => {
  const s = pending("GO-001");
  assert.equal(officialCompanyOffer(s.currentCard, s.circuit), null);
  assert.throws(() => purchaseOfficialCompany(s));
  s.currentCard.id = "GO-009";
  s.circuit = "outer";
  assert.throws(() => purchaseOfficialCompany(s));
});
