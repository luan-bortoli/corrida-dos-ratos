import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  rollTurn,
  buyVerifiedAsset,
  finishTurn,
  validateState,
  auditCash,
} from "../src/engine.js";
import { cardAvailability, validateCardEvents } from "../src/card-resolution.js";
import { VERIFIED_ASSETS } from "../src/data.js";
test("official unresolved card receives nonfinancial acknowledgment", () => {
  let s = createGame(0);
  s.position = 2;
  s = rollTurn(s, 1);
  assert.equal(s.cardEvents.length, 1);
  assert.equal(s.cardEvents[0].status, "text_available");
  assert.deepEqual(cardAvailability(s.currentCard).actions, ["acknowledge"]);
  const cash = s.cash;
  s = finishTurn(s);
  assert.equal(s.cardEvents[0].resolution, "acknowledge");
  assert.equal(s.cash, cash);
  assert.equal(auditCash(s).ok, true);
});
test("verified offer creates an auditable purchase resolution", () => {
  let s = createGame(11);
  s.officialPOEnabled = false;
  s.position = 1;
  s = rollTurn(s, 1);
  const a = VERIFIED_ASSETS.find((x) => x.id === s.currentOffer);
  assert.ok(a);
  s = buyVerifiedAsset(s, a.id);
  assert.equal(s.cardEvents.at(-1).resolution, "purchase");
  assert.equal(s.cardEvents.at(-1).financialEffect, true);
  assert.equal(auditCash(s).ok, true);
  assert.throws(() => buyVerifiedAsset(s, a.id));
  s = finishTurn(s);
  assert.equal(validateState(s), true);
});
test("declining a verified card adds no financial event", () => {
  let s = createGame(0);
  s.officialPOEnabled = false;
  s = rollTurn(s, 1);
  const start = s.cash;
  s = finishTurn(s);
  assert.equal(s.cardEvents[0].resolution, "decline");
  assert.equal(s.cardEvents[0].financialEffect, false);
  assert.equal(s.cash, start);
});
test("tampered event journal is rejected", () => {
  let s = createGame(0);
  s = rollTurn(s, 1);
  s = finishTurn(s);
  s.cardEvents[0].financialEffect = true;
  assert.equal(validateCardEvents(s.cardEvents), false);
  assert.equal(validateState(s), false);
});
test("resolved card journal remains valid across multiple turns", () => {
  let s = createGame(8);
  for (let i = 0; i < 12; i++) {
    s = rollTurn(s, 1);
    s = finishTurn(s);
  }
  assert.ok(s.cardEvents.length > 0);
  assert.equal(validateState(s), true);
});
