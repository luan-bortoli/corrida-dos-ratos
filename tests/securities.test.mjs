import { test } from "node:test";
import assert from "node:assert/strict";
import { registerSecurity, tradeSecurity, checkSecurities } from "../src/securities.js";
function room(kind = "stock") {
  const r = {
    round: 1,
    players: [
      { id: "a", game: { cash: 10000, ledger: [] } },
      { id: "b", game: { cash: 10000, ledger: [] } },
    ],
    securities: [],
  };
  registerSecurity(r, {
    id: "TEST",
    kind,
    totalUnits: 10000,
    priceCents: 200,
    initialHolders: { a: 2000, b: 8000 },
  });
  return r;
}
test("emissão inicial deve conciliar 100% do estoque", () => {
  const r = { securities: [] };
  assert.throws(() =>
    registerSecurity(r, {
      id: "X",
      kind: "stock",
      totalUnits: 10,
      priceCents: 100,
      initialHolders: { a: 9 },
    }),
  );
});
test("ações têm limite global de 10% por rodada", () => {
  const r = room();
  tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "b", units: 400 });
  tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "b", units: 100 });
  assert.throws(
    () => tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "b", units: 501 }),
    /liquidez/,
  );
  assert(checkSecurities(r));
});
test("fundos têm limite de 20% e conservam quantidades", () => {
  const r = room("fund");
  tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "b", units: 500 });
  r.round = 2;
  tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "b", units: 400 });
  assert.equal(r.securities[0].holders.a, 1100);
  assert(checkSecurities(r));
});
test("compra requer caixa e não altera saldos se falhar", () => {
  const r = room();
  r.players[1].game.cash = 10;
  const prev = structuredClone(r);
  assert.throws(
    () => tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "b", units: 600 }),
    /Caixa/,
  );
  assert.deepEqual(r, prev);
});
test("comprador inexistente não recebe venda automática", () => {
  const r = room();
  assert.throws(
    () => tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "market", units: 1 }),
    /não autorizado/,
  );
});
test("mesma unidade não pode ser vendida duas vezes", () => {
  const r = room();
  assert.throws(
    () => tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "b", units: 2001 }),
    /liquidez/,
  );
  r.securities[0].holders.a = 2;
  r.securities[0].holders.b = 9998;
  assert.throws(
    () => tradeSecurity(r, { securityId: "TEST", sellerId: "a", buyerId: "b", units: 3 }),
    /Estoque/,
  );
});
