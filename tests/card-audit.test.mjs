import test from "node:test";
import assert from "node:assert/strict";
import { catalogAudit, roomCardAudit } from "../src/card-audit.js";
import { createGame, rollTurn, finishTurn } from "../src/engine.js";
test("inventory audit reconciles the 230 approved IDs", () => {
  const r = catalogAudit();
  assert.equal(r.valid, true);
  assert.equal(r.totalActual, 230);
  assert.equal(r.officialPending, 0);
  assert.equal(r.officialExecutable, 0);
  assert.equal(r.officialTextAvailable, 230);
  assert.equal(
    Object.values(r.groups).reduce((n, g) => n + g.actual, 0),
    230,
  );
});
test("demonstration opportunities never count as official executable texts", () => {
  const r = catalogAudit();
  assert.deepEqual(
    r.demonstrations.map((d) => d.id),
    ["PO-001", "PO-002", "PO-007"],
  );
  assert.equal(r.officialExecutable, 0);
});
test("room audit summarizes decisions without revealing financial private state", () => {
  let game = createGame(0);
  game.position = 2;
  game = finishTurn(rollTurn(game, 1));
  const r = roomCardAudit({
    code: "ROOM",
    status: "playing",
    players: [{ name: "Exemplo", game }],
  });
  assert.equal(r.players[0].acknowledgments, 1);
  assert.equal(r.players[0].resolutions, 1);
  assert.equal(Object.hasOwn(r.players[0], "cash"), false);
});
