import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const password = "acesso-simplificado-123456";
async function setup(t) {
  const dir = await mkdtemp(join(tmpdir(), "cr-login-v2-"));
  const port = 38000 + Math.floor(Math.random() * 17000);
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dir,
      ADMIN_PASSWORD: password,
      NODE_ENV: "test",
    },
    stdio: "ignore",
  });
  t.after(async () => {
    child.kill();
    await rm(dir, { recursive: true, force: true });
  });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(base + "/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 40));
  }
  assert.ok(ready, "servidor iniciado");
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
  const created = await call("/api/room/create", "POST", { password });
  assert.equal(created.status, 201);
  return { call, path: `/api/room/${created.data.code}`, teacher: created.data.token };
}

test("administrador entra em sala existente com código e senha, sem código de recuperação", async (t) => {
  const { call, path, teacher } = await setup(t);
  assert.equal((await call(path + "/admin-login", "POST", { password: "errada" })).status, 401);
  const login = await call(path + "/admin-login", "POST", { password });
  assert.equal(login.status, 200);
  assert.equal(login.data.room.teacher, true);
  assert.equal((await call(path, "GET", undefined, teacher)).status, 403);
  assert.equal((await call(path, "GET", undefined, login.data.token)).status, 200);
});

test("após iniciar não aceita novos jogadores, mas retorno autorizado recupera o jogador anterior", async (t) => {
  const { call, path, teacher } = await setup(t);
  const a = await call(path + "/join", "POST", {
    name: "Amanda",
    professionId: 0,
    dreamId: "TRAVEL",
  });
  const b = await call(path + "/join", "POST", {
    name: "Bruno",
    professionId: 1,
    dreamId: "TRAVEL",
  });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.equal((await call(path + "/start", "POST", {}, teacher)).status, 200);
  assert.equal(
    (await call(path + "/join", "POST", { name: "Carlos", professionId: 2, dreamId: "TRAVEL" }))
      .status,
    409,
  );
  const before = await call(path + "/reconnect-request", "POST", { name: "Amanda" });
  assert.equal(before.status, 202);
  const request = before.data;
  assert.equal(
    (
      await call(path + "/reconnect-status", "POST", {
        requestId: request.requestId,
        ticket: "fake",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call(path + "/reconnect-status", "POST", {
        requestId: request.requestId,
        ticket: request.ticket,
      })
    ).data.status,
    "pending",
  );
  const list = await call(path, "GET", undefined, teacher);
  assert.equal(list.data.reconnectRequests.length, 1);
  assert.equal(list.data.reconnectRequests[0].name, "Amanda");
  const review = await call(
    path + "/reconnect-review",
    "POST",
    { requestId: request.requestId, decision: "approve" },
    teacher,
  );
  assert.equal(review.status, 200);
  const resumed = await call(path + "/reconnect-status", "POST", {
    requestId: request.requestId,
    ticket: request.ticket,
  });
  assert.equal(resumed.status, 200);
  assert.equal(resumed.data.status, "approved");
  assert.equal(resumed.data.room.you, a.data.playerId);
  assert.equal((await call(path, "GET", undefined, a.data.token)).status, 403);
  assert.equal((await call(path, "GET", undefined, resumed.data.token)).status, 200);
  assert.equal(
    (
      await call(path + "/reconnect-status", "POST", {
        requestId: request.requestId,
        ticket: request.ticket,
      })
    ).status,
    401,
  );
  assert.equal((await call(path + "/reconnect-request", "POST", { name: "Carlos" })).status, 404);
});

test("administrador pode rejeitar pedido de retorno sem revelar acesso", async (t) => {
  const { call, path, teacher } = await setup(t);
  assert.equal(
    (await call(path + "/join", "POST", { name: "Daniela", professionId: 0, dreamId: "TRAVEL" }))
      .status,
    201,
  );
  const request = (await call(path + "/reconnect-request", "POST", { name: "Daniela" })).data;
  assert.equal(
    (
      await call(
        path + "/reconnect-review",
        "POST",
        { requestId: request.requestId, decision: "reject" },
        teacher,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(path + "/reconnect-status", "POST", {
        requestId: request.requestId,
        ticket: request.ticket,
      })
    ).status,
    403,
  );
});

test("tela inicial possui dois perfis e não mostra controles antigos de recuperação", async () => {
  const html = await readFile("multiplayer.html", "utf8");
  const js = await readFile("multiplayer.js", "utf8");
  for (const id of [
    "roleAdmin",
    "rolePlayer",
    "adminLoginButton",
    "newPlayerFields",
    "pendingReconnect",
    "teacherReconnectRequests",
  ])
    assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /Sou Administrador/);
  assert.match(html, /Sou Jogador/);
  assert.doesNotMatch(html, /Recuperar acesso do professor|Recuperar sessão/);
  assert.match(js, /reconnect-request/);
  assert.match(js, /reconnect-status/);
});
