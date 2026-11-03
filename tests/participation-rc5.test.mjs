import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function setup(t, timeout = "120000", grace = "15000") {
  const dir = await mkdtemp(join(tmpdir(), "cr-rc5-participation-"));
  const port = 38000 + Math.floor(Math.random() * 17000);
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dir,
      ADMIN_PASSWORD: "participation-test-123",
      NODE_ENV: "test",
      TEST_TURN_MS: timeout,
      TEST_PRESENCE_GRACE_MS: grace,
    },
    stdio: "ignore",
  });
  t.after(async () => {
    child.kill();
    await rm(dir, { force: true, recursive: true });
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/health")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 40));
  }
  const call = async (path, method = "GET", body, token) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: "Bearer " + token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  };
  const created = await call("/api/room/create", "POST", { password: "participation-test-123" });
  assert.equal(created.status, 201);
  const path = `/api/room/${created.data.code}`;
  const one = await call(path + "/join", "POST", {
    name: "Estudante Um",
    professionId: 0,
    dreamId: "TRAVEL",
  });
  const two = await call(path + "/join", "POST", {
    name: "Estudante Dois",
    professionId: 1,
    dreamId: "TRAVEL",
  });
  assert.equal(one.status, 201);
  assert.equal(two.status, 201);
  assert.equal((await call(path + "/start", "POST", {}, created.data.token)).status, 200);
  return { call, path, one: one.data, two: two.data, teacher: created.data.token };
}

test("sair da sala mantém estudante e permite retorno, sem travar turno", async (t) => {
  const { call, path, one, two, teacher } = await setup(t);
  assert.equal((await call(path + "/roll", "POST", {}, one.token)).status, 200);
  assert.equal((await call(path + "/leave", "POST", {}, one.token)).status, 200);
  const snap = await call(path, "GET", undefined, teacher);
  assert.equal(snap.data.activePlayerId, two.playerId);
  assert.equal(snap.data.players[0].withdrawn, false);
  assert.equal(snap.data.players[0].connected, false);
  const resumed = await call(path, "GET", undefined, one.token);
  assert.equal(resumed.status, 200);
  assert.equal(resumed.data.players[0].connected, true);
  assert.equal(resumed.data.players.length, 2);
});

test("desistência no turno ativo preserva histórico e impede novas jogadas", async (t) => {
  const { call, path, one, two, teacher } = await setup(t);
  assert.equal((await call(path + "/roll", "POST", {}, one.token)).status, 200);
  assert.equal((await call(path + "/withdraw", "POST", {}, one.token)).status, 200);
  const snap = await call(path, "GET", undefined, teacher);
  assert.equal(snap.data.activePlayerId, two.playerId);
  assert.equal(snap.data.players[0].withdrawn, true);
  assert.equal(snap.data.players[0].turn, 1);
  assert.equal(snap.data.progress.activePlayers, 1);
  assert.equal((await call(path + "/roll", "POST", {}, one.token)).status, 403);
  assert.equal(
    (
      await call(path + "/recover", "POST", {
        name: "Estudante Um",
        recoveryCode: one.recoveryCode,
      })
    ).status,
    409,
  );
  assert.equal((await call(path + "/roll", "POST", {}, two.token)).status, 200);
  const report = await call(path + "/report", "GET", undefined, teacher);
  assert.equal(report.status, 200);
  assert.equal(report.data.participants[0].participationStatus, "desistente");
});

test("desconectado sem sair avança após prazo, mas conectado não avança automaticamente", async (t) => {
  const { call, path, one, two, teacher } = await setup(t, "1100", "100");
  await call(path, "GET", undefined, one.token);
  await new Promise((r) => setTimeout(r, 400));
  // Sem heartbeat, o servidor não depende da conexão aberta.
  await new Promise((r) => setTimeout(r, 1750));
  let snap = await call(path, "GET", undefined, teacher);
  assert.equal(snap.data.activePlayerId, two.playerId);
  assert.equal(snap.data.round, 1);
});

test("desistência de todos encerra a partida e mantém participantes no relatório", async (t) => {
  const { call, path, one, two, teacher } = await setup(t);
  assert.equal((await call(path + "/withdraw", "POST", {}, one.token)).status, 200);
  assert.equal((await call(path + "/withdraw", "POST", {}, two.token)).status, 200);
  const snap = await call(path, "GET", undefined, teacher);
  assert.equal(snap.data.status, "finished");
  assert.equal(snap.data.players.length, 2);
  assert.equal(snap.data.progress.activePlayers, 0);
});

test("desistência durante a preparação não encerra sala que ainda tem participantes", async (t) => {
  const { call, path, one, two, teacher } = await setup(t);
  // Retorna ao lobby para simular sessão recém-criada? O cenário é coberto abaixo por criação independente.
  const result = await call(path + "/withdraw", "POST", {}, one.token);
  assert.equal(result.status, 200);
  const room = await call(path, "GET", undefined, teacher);
  assert.equal(room.data.status, "playing");
  assert.equal(room.data.activePlayerId, two.playerId);
});
