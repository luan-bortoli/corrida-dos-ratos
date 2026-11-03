import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomInt } from "node:crypto";
const port = randomInt(34000, 56000),
  base = `http://127.0.0.1:${port}`;
const temp = await mkdtemp(join(tmpdir(), "cr-report-test-"));
const child = spawn(process.execPath, ["server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), DATA_DIR: temp, ADMIN_PASSWORD: "test-password-123" },
  stdio: "ignore",
});
async function send(path, token, method = "GET", body) {
  return fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
try {
  let started = false;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await send("/multiplayer.html");
      if (res.ok) {
        started = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 60));
  }
  assert.ok(started, "Servidor de teste não iniciou");
  await test("API dos relatórios exige sessão de professor; CSV exporta sem modificar estado", async () => {
    const create = await send("/api/room/create", null, "POST", { password: "test-password-123" });
    assert.equal(create.status, 201);
    const { code, token } = await create.json();
    const join = await send(`/api/room/${code}/join`, null, "POST", {
      name: "Ana",
      professionId: 0,
      dreamId: "TRAVEL",
    });
    assert.equal(join.status, 201);
    const student = await join.json();
    assert.equal((await send(`/api/room/${code}/report`)).status, 401);
    assert.equal((await send(`/api/room/${code}/report`, student.token)).status, 403);
    const reportResponse = await send(`/api/room/${code}/report`, token);
    assert.equal(reportResponse.status, 200);
    const report = await reportResponse.json();
    assert.equal(report.participantsCount, 1);
    assert.equal(report.participants[0].name, "Ana");
    assert.ok(!("token" in report) && !("recoveryHash" in report));
    const csvRes = await send(`/api/room/${code}/report?format=csv`, token);
    assert.equal(csvRes.status, 200);
    assert.match(csvRes.headers.get("content-type"), /text\/csv/);
    const csv = await csvRes.text();
    assert.match(csv, /Ana/);
    assert.match(csv, /"name"/);
    const after = await (await send(`/api/room/${code}`, token)).json();
    assert.equal(after.revision, 2);
  });
} finally {
  child.kill();
  await rm(temp, { recursive: true, force: true });
}
