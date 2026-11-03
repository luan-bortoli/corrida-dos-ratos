import test from "node:test";
import assert from "node:assert/strict";
import { expenseQuote, executeOfficialExpense } from "../src/official-effects.js";
import { createGame, rollTurn, finishTurn, validateState, auditCash } from "../src/engine.js";
test("DI-001..020: official percentages include 5%, 10%, 20%, 30%", () => {
  assert.deepEqual(expenseQuote("DI-001", 3500), { percent: 10, amount: 350 });
  assert.deepEqual(expenseQuote("DI-003", 3500), { percent: 5, amount: 175 });
  assert.deepEqual(expenseQuote("DI-005", 3500), { percent: 20, amount: 700 });
  assert.deepEqual(expenseQuote("DI-019", 3500), { percent: 30, amount: 1050 });
  assert.equal(expenseQuote("DI-021", 3500), null);
});
test("expense pays what is available and leaves unpaid living obligation", () => {
  const state = { cash: 60, arrearsLiving: 20 };
  const result = executeOfficialExpense(state, "DI-001", 2200);
  assert.equal(result.amount, 220);
  assert.equal(result.paid, 60);
  assert.equal(result.unpaid, 160);
  assert.equal(state.cash, 0);
  assert.equal(state.arrearsLiving, 180);
});
test("automatic DI effect posts one journal entry and is not charged again at turn closure", () => {
  let state = createGame(3);
  state.position = 3;
  state.catalogDecks = { "inner:DI": ["DI-001"] };
  const initial = state.cash;
  state = rollTurn(state, 1);
  assert.equal(state.currentCard.id, "DI-001");
  assert.equal(state.cash, initial - 350);
  assert.equal(state.cardEvents.at(-1).resolution, "automatic");
  assert.equal(auditCash(state).ok, true);
  state = finishTurn(state);
  assert.equal(state.cash, initial - 350);
  assert.equal(validateState(state), true);
});
test("full DI-001 expense uses arrears if personal cash insufficient", () => {
  let state = createGame(0);
  state.position = 3;
  state.cash = 50;
  state.initialCash = 50;
  state.catalogDecks = { "inner:DI": ["DI-001"] };
  state = rollTurn(state, 1);
  assert.equal(state.cash, 0);
  assert.equal(state.arrearsLiving, 170);
  assert.equal(validateState(state), true);
});
