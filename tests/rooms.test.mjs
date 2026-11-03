import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const port = 33000 + Math.floor(Math.random() * 20000);
const base = `http://127.0.0.1:${port}`;
const temp = await mkdtemp(join(tmpdir(), "cr-room-test-"));
const child = spawn(process.execPath, ["server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), DATA_DIR: temp, ADMIN_PASSWORD: "test-password-123" },
  stdio: "ignore",
});
async function api(url, method = "GET", body, token) {
  const r = await fetch(base + url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ...(await r.json()), httpStatus: r.status };
}
try {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(base + "/multiplayer.html");
      if (r.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await test("sala, identidade, turnos e pausa são controlados pelo servidor", async () => {
    assert.equal((await api("/api/room/create", "POST", { password: "errada" })).httpStatus, 401);
    const created = await api("/api/room/create", "POST", { password: "test-password-123" });
    assert.equal(created.httpStatus, 201);
    const code = created.code,
      t = created.token;
    const p1 = await api(`/api/room/${code}/join`, "POST", {
      name: "Maria",
      professionId: 0,
      dreamId: "TRAVEL",
    });
    const p2 = await api(`/api/room/${code}/join`, "POST", {
      name: "João",
      professionId: 1,
      dreamId: "TRAVEL",
    });
    assert.equal(p1.httpStatus, 201);
    assert.equal(p2.httpStatus, 201);
    assert.equal((await api(`/api/room/${code}`)).httpStatus, 401);
    assert.equal((await api(`/api/room/${code}`, "GET", undefined, p1.token)).game.professionId, 0);
    assert.equal((await api(`/api/room/${code}/start`, "POST", {}, p1.token)).httpStatus, 403);
    assert.equal((await api(`/api/room/${code}/start`, "POST", {}, t)).httpStatus, 200);
    assert.equal((await api(`/api/room/${code}/roll`, "POST", {}, p2.token)).httpStatus, 403);
    assert.equal((await api(`/api/room/${code}/roll`, "POST", {}, p1.token)).httpStatus, 200);
    assert.equal((await api(`/api/room/${code}/roll`, "POST", {}, p1.token)).httpStatus, 409);
    assert.equal((await api(`/api/room/${code}/pause`, "POST", {}, t)).httpStatus, 200);
    assert.equal((await api(`/api/room/${code}/end`, "POST", {}, p1.token)).httpStatus, 409);
    assert.equal((await api(`/api/room/${code}/resume`, "POST", {}, t)).httpStatus, 200);
    const ended = await api(`/api/room/${code}/end`, "POST", {}, p1.token);
    assert.equal(ended.httpStatus, 200);
    assert.equal(ended.activePlayerId, p2.playerId);
    assert.equal((await api(`/api/room/${code}/finish`, "POST", {}, t)).httpStatus, 200);
    assert.equal((await api(`/api/room/${code}/roll`, "POST", {}, p2.token)).httpStatus, 409);
  });
} finally {
  child.kill();
  await rm(temp, { recursive: true, force: true });
}
