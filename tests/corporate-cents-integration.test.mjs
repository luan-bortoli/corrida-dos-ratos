import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, auditCash } from "../src/engine.js";
import { createCompanies, purchaseCompanyShare } from "../src/companies.js";
import { cashBalanceCents } from "../src/money-balance.js";
import { recordVerifiedOperatingEvent } from "../src/governance.js";
import { closeVerifiedPeriod } from "../src/distributions.js";
function make() {
  const game = createGame(11, "TRAVEL");
  game.cash = 100000;
  game.initialCash = 100000;
  game.secondaryCashCents = 73;
  game.pending = true;
  game.lastTile = "GO";
  game.turn = 1;
  game.currentCard = { id: "GO-016", category: "GO" };
  game.cardEvents = [
    {
      id: "GO-016",
      turn: 1,
      circuit: "inner",
      position: 1,
      status: "text_available",
      resolution: "pending",
      financialEffect: false,
    },
  ];
  return {
    round: 1,
    companies: createCompanies(),
    players: [{ id: "player-1", game }],
    externalSellerCash: 0,
  };
}
test("GO-016 a GO-020: compra secundária preserva os centavos e o saldo do vendedor", () => {
  for (const company of createCompanies()) {
    const r = make(),
      g = r.players[0].game;
    g.currentCard.id = company.id;
    g.cardEvents[0].id = company.id;
    const before = cashBalanceCents(g),
      sellBefore = r.externalSellerCash;
    const result = purchaseCompanyShare(r, "player-1", company.id);
    assert.equal(cashBalanceCents(g), before - result.price * 100, company.id);
    assert.equal(g.secondaryCashCents, 73, company.id);
    assert.equal(r.externalSellerCash - sellBefore, result.price, company.id);
    assert.equal(r.companies.find((c) => c.id === company.id).shares["player-1"], result.percent);
    assert.equal(g.ledger.at(-1).amountCents, -result.price * 100);
    assert.ok(auditCash(g).ok);
  }
});
test("participação com caixa total insuficiente não altera saldo ou ações", () => {
  const r = make(),
    g = r.players[0].game;
  g.cash = 9999;
  g.secondaryCashCents = 99;
  assert.throws(() => purchaseCompanyShare(r, "player-1", "GO-016"), /insuficiente/);
  assert.equal(cashBalanceCents(g), 999999);
  assert.equal(r.companies[0].shares.origin, 100);
  assert.equal(r.externalSellerCash, 0);
});
test("GO-016: dividendos de receita comprovada conservam os centavos existentes", () => {
  const r = make(),
    g = r.players[0].game;
  purchaseCompanyShare(r, "player-1", "GO-016");
  const before = cashBalanceCents(g);
  const c = r.companies[0];
  recordVerifiedOperatingEvent(c, {
    sourceId: "DOC:GO016:1",
    type: "revenue",
    amount: 3000,
    round: 1,
  });
  const closings = closeVerifiedPeriod(r, 9);
  const allocation = closings.find((x) => x.id === "GO-016").allocations["player-1"];
  assert.ok(allocation > 0);
  assert.equal(cashBalanceCents(g), before + allocation * 100);
  assert.equal(g.secondaryCashCents, 73);
  assert.ok(auditCash(g).ok);
});
test("GO-016: sem receita documentada não existem dividendos presumidos", () => {
  const r = make(),
    g = r.players[0].game;
  purchaseCompanyShare(r, "player-1", "GO-016");
  const before = cashBalanceCents(g);
  const close = closeVerifiedPeriod(r, 9).find((x) => x.id === "GO-016");
  assert.equal(close.paid, 0);
  assert.equal(cashBalanceCents(g), before);
});
