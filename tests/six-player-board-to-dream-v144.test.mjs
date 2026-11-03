import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGame, rollTurn, finishTurn, validateState, auditCash } from "../src/engine.js";
import { INNER, OUTER, DREAMS } from "../src/data.js";

const makeOuter = (dreamId, cash) => {
  const s = createGame(0, dreamId);
  s.circuit = "outer";
  s.position = DREAMS[dreamId].position - 2;
  s.cash = cash;
  s.initialCash = cash;
  s.ledger = [];
  s.secondaryCashCents = 0;
  return s;
};
test("todos os 6 sonhos: realizar ao passar ou parar, somente com recursos e sem segunda cobrança", () => {
  assert.equal(INNER.length, 32);
  assert.equal(OUTER.length, 48);
  for (const [dreamId, d] of Object.entries(DREAMS)) {
    const winning = rollTurn(makeOuter(dreamId, d.price), 3);
    assert.equal(winning.won, true, dreamId);
    assert.equal(winning.cash, 0, dreamId);
    assert.equal(winning.pending, false, dreamId);
    assert.equal(validateState(winning), true, dreamId);
    assert.equal(auditCash(winning).ok, true, dreamId);
    assert.throws(() => rollTurn(winning, 1));
    const poor = rollTurn(makeOuter(dreamId, d.price - 1), 3);
    assert.equal(poor.won, false, dreamId);
    assert.equal(poor.pending, true, dreamId);
    assert.equal(finishTurn(poor).pending, false, dreamId);
  }
});

test("transição de três fechamentos favoráveis entre tabuleiros de 32 e 48 casas", () => {
  let s = createGame(0, "TRAVEL");
  s.initialPassive = 100000;
  s.debt = 0;
  s.initialDebtCents = 0;
  s.initialArrearsCents = 0;
  s.arrearsLoan = 0;
  s.initialInstallmentCents = 0;
  for (let n = 0; n < 3; n++) {
    s.position = 32;
    s = rollTurn(s, 1);
    if (s.pending) s = finishTurn(s);
    assert.equal(s.closures, n + 1);
  }
  assert.equal(s.circuit, "outer");
  assert.equal(s.position, 1);
  assert.equal(s.streak, 3);
  assert.equal(validateState(s), true);
  assert.equal(auditCash(s).ok, true);
});

test("multiplayer: seis participantes, ordem dos turnos, pausa, recuperação e retomada", async () => {
  const temp = await mkdtemp(join(tmpdir(), "cr-v144-six-"));
  const port = 36000 + Math.floor(Math.random() * 13000);
  const origin = `http://127.0.0.1:${port}`;
  let child;
  const call = async (path, method = "GET", body, token) => {
    const res = await fetch(origin + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };
  try {
    child = spawn(process.execPath, ["server.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        DATA_DIR: temp,
        ADMIN_PASSWORD: "v144-six-test-secret",
        NODE_ENV: "test",
        TEST_TURN_MS: "15000",
      },
      stdio: "ignore",
    });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        const r = await fetch(origin + "/multiplayer.html");
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    assert.equal(ready, true);
    const made = await call("/api/room/create", "POST", { password: "v144-six-test-secret" });
    assert.equal(made.status, 201);
    const { code, token: teacher } = made.body,
      p = `/api/room/${code}`;
    const students = [];
    for (let i = 0; i < 6; i++) {
      const j = await call(p + "/join", "POST", {
        name: `Aluno ${i + 1}`,
        professionId: i,
        dreamId: Object.keys(DREAMS)[i],
      });
      assert.equal(j.status, 201);
      students.push(j.body);
    }
    assert.equal(
      (await call(p + "/join", "POST", { name: "Aluno Extra", professionId: 6, dreamId: "TRAVEL" }))
        .status,
      409,
    );
    const started = await call(p + "/start", "POST", {}, teacher);
    assert.equal(started.status, 200);
    assert.equal(started.body.progress.totalPlayers, 6);
    for (let i = 0; i < 6; i++) {
      const before = await call(p, "GET", undefined, teacher);
      assert.equal(before.body.activePlayerId, students[i].playerId);
      const wrong = await call(p + "/roll", "POST", { die: 1 }, students[(i + 1) % 6].token);
      assert.equal(wrong.status, 403);
      const roll = await call(p + "/roll", "POST", { die: 1 }, students[i].token);
      assert.equal(roll.status, 200);
      const end = await call(p + "/end", "POST", {}, students[i].token);
      assert.equal(end.status, 200);
    }
    const next = await call(p, "GET", undefined, teacher);
    assert.equal(next.body.round, 2);
    assert.equal(next.body.activePlayerId, students[0].playerId);
    assert.equal(next.body.progress.activePlayers, 6);
    assert.equal((await call(p + "/pause", "POST", {}, teacher)).body.status, "paused");
    assert.equal((await call(p + "/roll", "POST", { die: 1 }, students[0].token)).status, 409);
    assert.equal((await call(p + "/resume", "POST", {}, teacher)).body.status, "playing");
    const finished = await call(p + "/finish", "POST", {}, teacher);
    assert.equal(finished.body.progress.endedByTeacher, true);
    assert.equal(finished.body.progress.completedPlayers, 0);
    assert.equal((await call(p + "/roll", "POST", { die: 1 }, students[0].token)).status, 409);
  } finally {
    if (child) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
    await rm(temp, { recursive: true, force: true });
  }
});
