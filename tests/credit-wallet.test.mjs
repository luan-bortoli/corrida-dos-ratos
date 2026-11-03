import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  contractCredit,
  prepayLoan,
  financeRealEstate,
  quoteRealEstateFinance,
} from "../src/engine.js";
import { cashBalanceCents } from "../src/money-balance.js";

test("crédito pessoal preserva centavos anteriores e registra valor integral", () => {
  const original = createGame(8);
  original.secondaryCashCents = 73;
  const next = contractCredit(original, 1000, 12);
  assert.equal(cashBalanceCents(next) - cashBalanceCents(original), 100000);
  assert.equal(next.secondaryCashCents, 73);
  assert.equal(next.loans[0].balance, 1000);
});
test("amortização antecipada preserva centavos e reduz exatamente a dívida", () => {
  let state = createGame(8);
  state.secondaryCashCents = 81;
  state = contractCredit(state, 1000, 12);
  const before = cashBalanceCents(state);
  const after = prepayLoan(state, state.loans[0].id, 350);
  assert.equal(cashBalanceCents(after), before - 35000);
  assert.equal(after.secondaryCashCents, 81);
  assert.equal(after.loans[0].balance, 650);
});
test("amortização não altera estado em caso de saldo insuficiente", () => {
  const state = createGame(8);
  state.cash = 0;
  state.secondaryCashCents = 50;
  state.debt = 20;
  state.initialDebtCents = 2000;
  state.initialArrearsCents = 0;
  assert.throws(() => prepayLoan(state, "initial", 1), /supera/);
  assert.equal(cashBalanceCents(state), 50);
  assert.equal(state.debt, 20);
});
test("financiamento de imóvel usa carteira e preserva centavos", () => {
  const state = createGame(1);
  state.cash = 150000;
  state.initialCash = 150000;
  state.secondaryCashCents = 37;
  state.turn = 1;
  state.pending = true;
  state.lastTile = "GO";
  state.currentCard = {
    id: "GO-001",
    category: "GO",
    status: "text_available",
    effectExecuted: false,
  };
  state.cardEvents = [
    {
      id: "GO-001",
      turn: 1,
      circuit: "inner",
      position: 7,
      status: "text_available",
      resolution: "pending",
      financialEffect: false,
    },
  ];
  // A carta e o estado do turno devem estar no formato aceito pelo motor.
  const q = quoteRealEstateFinance(state, 24, 30000);
  assert.equal(q.eligible, true);
  const after = financeRealEstate(state, 24, 30000);
  assert.equal(cashBalanceCents(after), cashBalanceCents(state) - 3000000);
  assert.equal(after.secondaryCashCents, 37);
});
