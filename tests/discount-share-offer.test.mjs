import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, validateState, auditCash } from "../src/engine.js";
import {
  ensureDiscountCompany,
  openDiscountOffer,
  acceptDiscountOffer,
  expireDiscountOffers,
} from "../src/discount-share-offer.js";
function fixture() {
  const players = ["a", "b", "c"].map((id) => {
    const game = createGame(11, "TRAVEL");
    game.cash = 100000;
    game.initialCash = 100000;
    game.ledgerBaseline = 100000;
    return { id, game };
  });
  const r = { round: 1, players, companies: [], externalSellerCash: 0 };
  const g = players[0].game;
  g.circuit = "outer";
  g.pending = true;
  g.lastTile = "OE";
  g.currentCard = { id: "OE-012", category: "OE" };
  g.cardEvents = [
    {
      id: "OE-012",
      turn: 1,
      circuit: "outer",
      position: 1,
      status: "text_available",
      resolution: "pending",
      financialEffect: false,
    },
  ];
  return r;
}
test("OE-012: compra externa com 20%, preço com desconto e sem dividendos presumidos", () => {
  const r = fixture(),
    o = openDiscountOffer(r, "a");
  acceptDiscountOffer(r, "a", o.id);
  const c = ensureDiscountCompany(r);
  assert.equal(c.shares.a, 20);
  assert.equal(c.shares.origin, 80);
  assert.equal(r.externalSellerCash, 51000);
  assert.equal(r.players[0].game.cash, 49000);
  assert.equal(c.retainedProfit, 0);
  assert.ok(auditCash(r.players[0].game).ok);
  assert.ok(validateState(r.players[0].game));
});
test("OE-012: sócios existentes têm preferência por duas rodadas", () => {
  const r = fixture(),
    c = ensureDiscountCompany(r);
  c.shares.origin = 80;
  c.shares.b = 20;
  const o = openDiscountOffer(r, "a");
  assert.deepEqual(o.eligible, ["b"]);
  assert.throws(() => acceptDiscountOffer(r, "a", o.id), /preferência/);
  r.round = 4;
  acceptDiscountOffer(r, "a", o.id);
  assert.equal(c.shares.origin, 60);
  assert.equal(c.shares.a, 20);
});
test("OE-012: sócio exerce preferência imediatamente", () => {
  const r = fixture(),
    c = ensureDiscountCompany(r);
  c.shares.origin = 80;
  c.shares.b = 20;
  const o = openDiscountOffer(r, "a");
  acceptDiscountOffer(r, "b", o.id);
  assert.equal(c.shares.b, 40);
  assert.equal(r.players[1].game.cash, 49000);
});
test("OE-012: sem caixa não liquida e não transfere participação", () => {
  const r = fixture(),
    o = openDiscountOffer(r, "a");
  r.players[1].game.cash = 100;
  assert.throws(() => acceptDiscountOffer(r, "b", o.id), /Caixa/);
  assert.equal(r.companies[0].shares.origin, 100);
  assert.equal(r.externalSellerCash, 0);
});
test("OE-012: oferta expira e impede liquidação dupla", () => {
  const r = fixture(),
    o = openDiscountOffer(r, "a");
  acceptDiscountOffer(r, "a", o.id);
  assert.throws(() => acceptDiscountOffer(r, "b", o.id), /indisponível/);
  const r2 = fixture(),
    o2 = openDiscountOffer(r2, "a");
  r2.round = 6;
  expireDiscountOffers(r2);
  assert.equal(o2.status, "expired");
  assert.throws(() => acceptDiscountOffer(r2, "b", o2.id), /indisponível/);
});
