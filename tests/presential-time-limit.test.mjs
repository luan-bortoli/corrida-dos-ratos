import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  startPresentialTimer,
  remainingPresentialMs,
  pausePresentialTimer,
  resumePresentialTimer,
  checkPresentialExpiry,
  rankPresentialPlayers,
  PRESENTIAL_DURATION_MS,
} from "../src/presential-timer.js";
import { createGame } from "../src/engine.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("contagem presencial tem 20 minutos, pausa e retomada sem perder segundos", () => {
  assert.equal(PRESENTIAL_DURATION_MS, 1_200_000);
  const room = { mode: "shared", status: "playing", presencialTimer: startPresentialTimer(1000) };
  assert.equal(remainingPresentialMs(room, 11_000), 1_190_000);
  pausePresentialTimer(room, 11_000);
  room.status = "paused";
  assert.equal(remainingPresentialMs(room, 200_000), 1_190_000);
  room.status = "playing";
  resumePresentialTimer(room, 200_000);
  assert.equal(remainingPresentialMs(room, 210_000), 1_180_000);
});

test("não interrompe carta pendente ao chegar ao limite", () => {
  const room = {
    mode: "shared",
    status: "playing",
    order: ["a"],
    turnIndex: 0,
    turnDeadline: 9000,
    players: [{ id: "a", game: { pending: true } }],
    presencialTimer: startPresentialTimer(0, 100),
  };
  assert.equal(checkPresentialExpiry(room, 200), true);
  assert.equal(room.status, "playing");
  room.players[0].game.pending = false;
  assert.equal(checkPresentialExpiry(room, 200), true);
  assert.equal(room.status, "paused");
  assert.equal(room.presencialTimer.expired, true);
  assert.equal(room.pausedRemaining, 8800);
});

test("classificação: maior renda passiva, cobertura e patrimônio como critérios", () => {
  const a = createGame(0),
    b = createGame(0);
  a.assets.push({ id: "x", ownershipId: "x", name: "Ativo", cost: 1000, passive: 150 });
  b.assets.push({ id: "y", ownershipId: "y", name: "Ativo", cost: 2000, passive: 250 });
  const rows = rankPresentialPlayers({
    players: [
      { id: "a", name: "Ana", game: a },
      { id: "b", name: "Bruno", game: b },
    ],
  });
  assert.deepEqual(
    rows.map((r) => r.name),
    ["Bruno", "Ana"],
  );
  assert.equal(rows[0].place, 1);
});

test("integração: expiração, decisão do administrador, ranking e isolamento do multiplayer", async () => {
  const dir = await mkdtemp(join(tmpdir(), "corrida-limit-"));
  const port = 34000 + Math.floor(Math.random() * 17000);
  const base = `http://127.0.0.1:${port}`;
  const password = "teste-tempo-12345";
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dir,
      ADMIN_PASSWORD: password,
      NODE_ENV: "test",
      TEST_PRESENTIAL_MS: "180",
    },
    stdio: "ignore",
  });
  async function req(path, method = "GET", body, token) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, value: await response.json() };
  }
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(base + "/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await sleep(50);
    }
    assert.equal(ready, true);
    const created = await req("/api/room/create", "POST", { password, mode: "shared" });
    assert.equal(created.status, 201);
    const { code, token } = created.value;
    const path = `/api/room/${code}`;
    for (const [name, professionId] of [
      ["Ana", 0],
      ["Bruno", 1],
    ]) {
      assert.equal(
        (
          await req(
            path + "/shared-add-player",
            "POST",
            { name, professionId, dreamId: "TRAVEL" },
            token,
          )
        ).status,
        201,
      );
    }
    assert.equal((await req(path + "/start", "POST", {}, token)).status, 200);
    await sleep(1250); // relógio de varredura do servidor: 1 segundo
    let state = (await req(path, "GET", undefined, token)).value;
    assert.equal(state.presencial.expired, true);
    assert.equal(state.presencial.pendingDecision, true);
    assert.equal(state.status, "paused");
    assert.equal((await req(path + "/resume", "POST", {}, token)).status, 409);
    assert.equal((await req(path + "/finish-time", "POST", {})).status, 401);
    state = (await req(path + "/finish-time", "POST", {}, token)).value;
    assert.equal(state.status, "finished");
    assert.equal(state.presencial.ranking.length, 2);
    assert.equal(state.presencial.ranking[0].place, 1);
    const report = (await req(path + "/report?format=json", "GET", undefined, token)).value;
    assert.equal(report.endingType, "renda_passiva_por_tempo");
    assert.equal(report.presencialRanking.length, 2);
    const saved = JSON.parse(await readFile(join(dir, "rooms.json"), "utf8"));
    assert.equal(saved[code].endReason, "time_limit");
    // Segunda sala demonstra a alternativa de continuar sem nova imposição de limite.
    const second = await req("/api/room/create", "POST", { password, mode: "shared" });
    const p2 = `/api/room/${second.value.code}`;
    for (const [name, professionId] of [
      ["Carla", 0],
      ["Davi", 1],
    ])
      await req(
        p2 + "/shared-add-player",
        "POST",
        { name, professionId, dreamId: "TRAVEL" },
        second.value.token,
      );
    await req(p2 + "/start", "POST", {}, second.value.token);
    await sleep(1250);
    state = (await req(p2 + "/continue-time", "POST", {}, second.value.token)).value;
    assert.equal(state.status, "playing");
    assert.equal(state.presencial.continued, true);
    assert.equal((await req(p2 + "/finish-time", "POST", {}, second.value.token)).status, 409);
    // Sala em dispositivos individuais não recebe relógio presencial.
    const normal = await req("/api/room/create", "POST", { password, mode: "individual" });
    assert.equal(normal.value.room.presencial, null);
  } finally {
    child.kill();
    await rm(dir, { recursive: true, force: true });
  }
});
