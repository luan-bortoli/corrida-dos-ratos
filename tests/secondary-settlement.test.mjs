import test from "node:test";
import assert from "node:assert/strict";
import { quoteSettlement, auditSecondarySettlement } from "../src/secondary-settlement.js";
test("prévia calcula centavos exatos sem arredondamento", () => {
  assert.deepEqual(quoteSettlement(5401, 3, 200), {
    priceCents: 5401,
    units: 3,
    totalCents: 16203,
    wholeReais: 162,
    remainderCents: 3,
    affordable: true,
    legacyCompatible: false,
  });
});
test("prévia aceita somente valores inteiros e seguros", () => {
  for (const input of [
    [1.5, 1, 10],
    [1, 0, 10],
    [1, 1, -1],
    [Number.MAX_SAFE_INTEGER, 2, 10],
  ])
    assert.throws(() => quoteSettlement(...input));
});
test("prévia distingue saldo insuficiente e compatibilidade legada", () => {
  const q = quoteSettlement(5000, 2, 90);
  assert.equal(q.affordable, false);
  assert.equal(q.legacyCompatible, true);
});
test("auditoria reconhece transferência conciliada", () => {
  const r = {
    secondaryTrades: [
      {
        id: "t",
        securityId: "PO-013",
        units: 2,
        priceCents: 5400,
        amount: 108,
        buyerId: "a",
        sellerId: "b",
      },
    ],
    secondaryOffers: [],
  };
  assert.deepEqual(auditSecondarySettlement(r).findings, []);
});
test("auditoria detecta divergência entre centavos e reais", () => {
  const r = {
    secondaryTrades: [
      {
        id: "t",
        securityId: "PO-013",
        units: 1,
        priceCents: 5401,
        amount: 54,
        buyerId: "a",
        sellerId: "b",
      },
    ],
  };
  assert.equal(auditSecondarySettlement(r).ok, false);
});

test("auditoria confirma liquidação em centavos exatos", () => {
  const r = {
    secondaryTrades: [
      {
        id: "x",
        securityId: "PO-013",
        units: 3,
        priceCents: 5401,
        amountCents: 16203,
        buyerId: "a",
        sellerId: "b",
      },
    ],
  };
  assert.equal(auditSecondarySettlement(r).ok, true);
});
