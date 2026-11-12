import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = await mkdtemp(join(tmpdir(), "corrida-shared-"));
const port = 32000 + Math.floor(Math.random() * 25000);
const base = `http://127.0.0.1:${port}`;
const password = "teste-professor-123";
const proc = spawn(process.execPath, ["server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), DATA_DIR: dir, ADMIN_PASSWORD: password },
  stdio: "ignore",
});
async function api(path, method = "GET", body, token, view) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(view ? { "x-shared-view": view } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, value: await res.json() };
}
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base + "/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw Error("Servidor de teste não iniciou");
  await test("modo presencial cadastra participantes e troca jogadores no mesmo token de professor", async () => {
    const create = await api("/api/room/create", "POST", { password, mode: "shared" });
    assert.equal(create.status, 201);
    assert.equal(create.value.room.mode, "shared");
    const { code, token } = create.value;
    const room = `/api/room/${code}`;
    const add = (name, professionId) =>
      api(room + "/shared-add-player", "POST", { name, professionId, dreamId: "TRAVEL" }, token);
    assert.equal((await add("Ana", 0)).status, 201);
    assert.equal((await add("Ana", 1)).status, 409);
    assert.equal((await add("Bruno", 1)).status, 201);
    assert.equal((await add("Carla", 2)).status, 201);
    assert.equal(
      (await api(room + "/join", "POST", { name: "Intruso", professionId: 0, dreamId: "TRAVEL" }))
        .status,
      403,
    );
    assert.equal(
      (
        await api(room + "/shared-add-player", "POST", {
          name: "Hack",
          professionId: 0,
          dreamId: "TRAVEL",
        })
      ).status,
      401,
    );
    assert.equal(
      (await api(room + "/shared-teacher-unlock", "POST", { password: "errado" }, token)).status,
      401,
    );
    assert.equal(
      (await api(room + "/shared-teacher-unlock", "POST", { password }, token)).status,
      200,
    );
    let result = await api(room + "/start", "POST", {}, token);
    assert.equal(result.status, 200);
    const first = result.value.activePlayerId;
    result = await api(room, "GET", undefined, token, "player");
    assert.equal(result.status, 200);
    assert.equal(result.value.teacher, false);
    assert.equal(result.value.sharedAdmin, true);
    assert.equal(result.value.you, first);
    assert.ok(result.value.game);
    assert.equal(result.value.game.professionId, 0);
    result = await api(room + "/roll", "POST", {}, token, "player");
    assert.equal(result.status, 200);
    assert.equal(result.value.you, first);
    assert.equal(result.value.game.pending, true);
    assert.equal((await api(room + "/roll", "POST", {}, token, "player")).status, 409);
    result = await api(room + "/end", "POST", {}, token, "player");
    assert.equal(result.status, 200);
    assert.equal(result.value.activePlayerId, result.value.you);
    assert.notEqual(result.value.you, first);
    assert.equal(result.value.game.professionId, 1);
    assert.equal(
      (
        await api(
          room + "/shared-add-player",
          "POST",
          { name: "Dani", professionId: 3, dreamId: "TRAVEL" },
          token,
        )
      ).status,
      409,
    );
    const teacher = await api(room, "GET", undefined, token);
    assert.equal(teacher.value.teacher, true);
    assert.equal(teacher.value.game, null);
    const saved = JSON.parse(await readFile(join(dir, "rooms.json"), "utf8"));
    assert.equal(saved[code].mode, "shared");
    assert.equal(saved[code].players.length, 3);
    assert.ok(saved[code].players.every((p) => p.tokenHash === null));
    assert.equal((await api(room + "/pause", "POST", {}, token)).status, 200);
    assert.equal((await api(room + "/roll", "POST", {}, token, "player")).status, 409);
    assert.equal((await api(room + "/resume", "POST", {}, token)).status, 200);
    assert.equal((await api(room + "/finish", "POST", {}, token)).status, 409);
  });
  await test("interface presencial possui cadastro, navegação e modos independentes", async () => {
    const html = await readFile("multiplayer.html", "utf8");
    const js = await readFile("multiplayer.js", "utf8");
    assert.match(html, /Presencial — Tela compartilhada/);
    for (const id of [
      "sharedNavigation",
      "sharedGameView",
      "sharedTeacherView",
      "sharedAddPlayer",
      "roomMode",
    ])
      assert.match(html, new RegExp(`id="${id}"`));
    assert.match(js, /shared-teacher-unlock/);
    assert.match(js, /shared-add-player/);
    assert.match(js, /x-shared-view/);
  });
} finally {
  proc.kill();
  await rm(dir, { recursive: true, force: true });
}
