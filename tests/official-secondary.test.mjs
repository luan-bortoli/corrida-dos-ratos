import test from "node:test";
import assert from "node:assert/strict";
import { createGame, auditCash, validateState } from "../src/engine.js";
import {
  listSecondary,
  buySecondary,
  cancelSecondary,
  publicSecondary,
  checkSecondary,
} from "../src/official-secondary.js";
function room() {
  const a = createGame(0, "CAFE"),
    b = createGame(0, "CAFE");
  a.officialSecurities = { "PO-013": 40, "PO-014": 20 };
  a.cash = 20000;
  a.ledgerBaseline = 20000;
  a.ledger = [];
  b.cash = 20000;
  b.ledgerBaseline = 20000;
  b.ledger = [];
  return {
    round: 2,
    players: [
      { id: "a", game: a },
      { id: "b", game: b },
    ],
    officialMarket: { pricesCents: { "PO-013": 5400 }, dividendsCents: {} },
  };
}
test("venda secundária transfere caixas e unidades sem alterar soma", () => {
  const r = room(),
    o = listSecondary(r, "a", "PO-013", 10);
  const before = r.players.reduce((s, p) => s + p.game.cash, 0);
  const t = buySecondary(r, "b", o.id, 6);
  assert.equal(t.amount, 324);
  assert.equal(r.players[0].game.officialSecurities["PO-013"], 34);
  assert.equal(r.players[1].game.officialSecurities["PO-013"], 6);
  assert.equal(
    r.players.reduce((s, p) => s + p.game.cash, 0),
    before,
  );
  assert.equal(publicSecondary(r).offers[0].units, 4);
  assert.ok(checkSecondary(r));
  assert.equal(auditCash(r.players[0].game).ok, true);
  assert.equal(auditCash(r.players[1].game).ok, true);
});
test("reserva de oferta impede anúncio duplicado da mesma posição", () => {
  const r = room();
  listSecondary(r, "a", "PO-013", 30);
  assert.throws(() => listSecondary(r, "a", "PO-013", 11));
});
test("não permite comprar de si mesmo nem vender mais do que o anúncio", () => {
  const r = room(),
    o = listSecondary(r, "a", "PO-013", 3);
  assert.throws(() => buySecondary(r, "a", o.id, 1));
  assert.throws(() => buySecondary(r, "b", o.id, 4));
});
test("liquida pagamento fracionário sem perder centavos ou comprometer o extrato", () => {
  const r = room();
  r.officialMarket.pricesCents["PO-013"] = 5401;
  const o = listSecondary(r, "a", "PO-013", 3);
  const t = buySecondary(r, "b", o.id, 1);
  assert.equal(t.amountCents, 5401);
  assert.equal(r.players[0].game.cash, 20054);
  assert.equal(r.players[0].game.secondaryCashCents, 1);
  assert.equal(r.players[1].game.cash, 19945);
  assert.equal(r.players[1].game.secondaryCashCents, 99);
  assert.equal(
    r.players.reduce((a, p) => a + p.game.cash * 100 + (p.game.secondaryCashCents ?? 0), 0),
    4000000,
  );
  assert.ok(r.players.every((p) => auditCash(p.game).ok && validateState(p.game)));
});
test("liquidez agregada respeita limite por instrumento e rodada", () => {
  const r = room();
  r.players[0].game.officialSecurities["PO-013"] = 2000;
  r.players[1].game.cash = 100000;
  r.players[1].game.ledgerBaseline = 100000;
  const o = listSecondary(r, "a", "PO-013", 1200);
  buySecondary(r, "b", o.id, 600);
  assert.throws(() => buySecondary(r, "b", o.id, 401), /liquidez/);
  buySecondary(r, "b", o.id, 400);
  assert.equal(publicSecondary(r).volumes["PO-013"], 1000);
});
test("cancelamento libera reserva e recusa operação depois", () => {
  const r = room(),
    o = listSecondary(r, "a", "PO-014", 20);
  assert.throws(() => cancelSecondary(r, "b", o.id));
  cancelSecondary(r, "a", o.id);
  assert.throws(() => buySecondary(r, "b", o.id, 1));
  assert.equal(listSecondary(r, "a", "PO-014", 20).units, 20);
});

test("negociação posterior utiliza saldo fracionário anterior sem arredondamento", () => {
  const r = room();
  r.officialMarket.pricesCents["PO-013"] = 5401;
  const o = listSecondary(r, "a", "PO-013", 3);
  buySecondary(r, "b", o.id, 1);
  buySecondary(r, "b", o.id, 2);
  assert.equal(r.players[0].game.secondaryCashCents, 3);
  assert.equal(r.players[1].game.secondaryCashCents, 97);
  assert.ok(r.players.every((p) => auditCash(p.game).ok));
  assert.ok(checkSecondary(r));
});
test("recusa saldo fracionário inválido sem mutação", () => {
  const r = room();
  r.officialMarket.pricesCents["PO-013"] = 5401;
  const o = listSecondary(r, "a", "PO-013", 1);
  r.players[1].game.secondaryCashCents = 100;
  const old = structuredClone(r);
  assert.throws(() => buySecondary(r, "b", o.id, 1), /inválido/);
  assert.deepEqual(r, old);
});
