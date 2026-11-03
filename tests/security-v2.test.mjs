import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

await test("v2: cabeçalhos HTTP, saúde, limites de autenticação e recuperação", async () => {
  const dir = await mkdtemp(join(tmpdir(), "corrida-v2-security-"));
  const port = 32000 + Math.floor(Math.random() * 20000);
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dir,
      ADMIN_PASSWORD: "Senha-Teste-V2-123",
    },
    stdio: "ignore",
  });
  try {
    let health;
    for (let i = 0; i < 80; i++) {
      try {
        health = await fetch(base + "/health");
        if (health.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.equal(health?.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });
    assert.equal(health.headers.get("x-frame-options"), "DENY");
    assert.match(health.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    assert.equal(health.headers.get("referrer-policy"), "no-referrer");
    const request = (url, body) =>
      fetch(base + url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    const room = await (
      await request("/api/room/create", { password: "Senha-Teste-V2-123" })
    ).json();
    assert.ok(room.code);
    for (let i = 0; i < 8; i++)
      assert.equal(
        (
          await request(`/api/room/${room.code}/recover-teacher`, {
            recoveryCode: "000000000000000000000000",
          })
        ).status,
        401,
      );
    assert.equal(
      (
        await request(`/api/room/${room.code}/recover-teacher`, {
          recoveryCode: room.teacherRecoveryCode,
        })
      ).status,
      429,
    );
    const status = await fetch(base + "/health");
    assert.equal(status.status, 200);
    assert.equal(status.headers.get("x-content-type-options"), "nosniff");
  } finally {
    child.kill();
    await rm(dir, { recursive: true, force: true });
  }
});
