import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const temp = await mkdtemp(join(tmpdir(), "cr-full-lifecycle-"));
const port = 35000 + Math.floor(Math.random() * 15000);
const origin = `http://127.0.0.1:${port}`;
let server;
const start = async () => {
  server = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: temp,
      ADMIN_PASSWORD: "test-password-123",
      NODE_ENV: "test",
      TEST_TURN_MS: "1500",
    },
    stdio: "ignore",
  });
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(origin + "/multiplayer.html")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error("Servidor não iniciou");
};
const stop = async () => {
  if (!server) return;
  const child = server;
  server = null;
  child.kill();
  await new Promise((resolve) => child.once("exit", resolve));
};
async function request(path, method = "GET", body, token) {
  const res = await fetch(origin + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const content = await res.text();
  return {
    status: res.status,
    contentType: res.headers.get("content-type"),
    data: res.headers.get("content-type")?.includes("json") ? JSON.parse(content) : content,
  };
}
try {
  await start();
  await test("sala completa: docente recupera acesso, dados sobrevivem reinício, pausa, retomada, relatórios e encerramento", async () => {
    const created = await request("/api/room/create", "POST", { password: "test-password-123" });
    assert.equal(created.status, 201);
    const { code, token: originalToken, teacherRecoveryCode } = created.data;
    assert.match(teacherRecoveryCode, /^[A-F0-9]{24}$/);
    const path = `/api/room/${code}`;
    const p1 = await request(path + "/join", "POST", {
      name: "Estudante Um",
      professionId: 0,
      dreamId: "TRAVEL",
    });
    const p2 = await request(path + "/join", "POST", {
      name: "Estudante Dois",
      professionId: 1,
      dreamId: "TRAVEL",
    });
    assert.equal(p1.status, 201);
    assert.equal(p2.status, 201);
    assert.equal((await request(path + "/start", "POST", {}, originalToken)).status, 200);
    const paused = await request(path + "/pause", "POST", {}, originalToken);
    assert.equal(paused.data.status, "paused");
    const round = paused.data.round;
    await stop();
    await start();
    assert.equal((await request(path, "GET", undefined, p1.data.token)).data.status, "paused");
    const studentRecovery = await request(path + "/recover", "POST", {
      name: "Estudante Um",
      recoveryCode: p1.data.recoveryCode,
    });
    assert.equal(studentRecovery.status, 200);
    assert.equal((await request(path, "GET", undefined, p1.data.token)).status, 403);
    assert.equal((await request(path, "GET", undefined, studentRecovery.data.token)).status, 200);
    assert.equal((await request(path + "/resume", "POST", {}, p1.data.token)).status, 403);
    assert.equal(
      (
        await request(path + "/recover-teacher", "POST", {
          recoveryCode: "123456789012345678901234",
        })
      ).status,
      401,
    );
    const recovery = await request(path + "/recover-teacher", "POST", {
      recoveryCode: teacherRecoveryCode,
    });
    assert.equal(recovery.status, 200);
    const teacher = recovery.data.token;
    assert.equal((await request(path, "GET", undefined, originalToken)).status, 403);
    assert.equal((await request(path + "/resume", "POST", {}, teacher)).data.status, "playing");
    assert.equal(
      (await request(path, "GET", undefined, studentRecovery.data.token)).data.round,
      round,
    );
    const report = await request(path + "/report", "GET", undefined, teacher);
    assert.equal(report.status, 200);
    const csv = await request(path + "/report?format=csv", "GET", undefined, teacher);
    assert.equal(csv.status, 200);
    assert.match(csv.contentType, /text\/csv/);
    assert.equal((await request(path + "/report", "GET", undefined, p1.data.token)).status, 403);
    const finished = await request(path + "/finish", "POST", {}, teacher);
    assert.equal(finished.data.status, "finished");
    assert.equal(finished.data.progress.endedByTeacher, true);
    assert.equal(finished.data.progress.completedPlayers, 0);
    assert.equal(
      (await request(path + "/roll", "POST", {}, studentRecovery.data.token)).status,
      409,
    );
    await stop();
    await start();
    const restored = await request(path, "GET", undefined, teacher);
    assert.equal(restored.data.status, "finished");
    assert.equal(restored.data.progress.endedByTeacher, true);
    assert.equal((await request(path + "/resume", "POST", {}, teacher)).status, 409);
  });
} finally {
  await stop();
  await rm(temp, { recursive: true, force: true });
}
