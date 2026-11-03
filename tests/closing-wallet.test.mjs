import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, rollTurn } from "../src/engine.js";
import { cashBalanceCents } from "../src/money-balance.js";

function close(g) {
  g.position = 32;
  g.pending = false;
  return rollTurn(g, 1);
}

test("fechamento preserva centavos complementares mesmo com salário e despesas", () => {
  const g = createGame(1);
  g.secondaryCashCents = 73;
  const after = close(g);
  assert.equal(after.secondaryCashCents, 73);
  assert.equal(cashBalanceCents(after) % 100, 73);
  assert.equal(after.closures, 1);
});

test("obrigações podem consumir os centavos complementares", () => {
  const g = createGame(1);
  g.cash = 0;
  g.secondaryCashCents = 99;
  g.initialPassive = 0;
  g.baseExpenses = 999999;
  const after = close(g);
  assert.equal(after.secondaryCashCents, 0);
  assert.equal(cashBalanceCents(after) % 100, 0);
  assert.ok(after.arrearsLiving > 0);
});

test("fechamentos consecutivos mantêm os centavos sem deriva", () => {
  let g = createGame(1);
  g.secondaryCashCents = 21;
  g = close(g);
  g.pending = false;
  g = close(g);
  assert.equal(g.secondaryCashCents, 21);
  assert.equal(g.closures, 2);
});

test("não processa fechamento com complemento inválido", () => {
  const g = createGame(1);
  g.secondaryCashCents = 120;
  assert.throws(() => close(g), /Saldo financeiro inválido/);
});
