import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = await mkdtemp(join(tmpdir(), "corrida-modes-"));
const port = 43000 + Math.floor(Math.random() * 10000);
const base = `http://127.0.0.1:${port}`;
const password = "senha-professor-exemplo";
const proc = spawn(process.execPath, ["server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), DATA_DIR: dir, ADMIN_PASSWORD: password },
  stdio: "ignore",
});
async function api(path, data, token) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return { status: res.status, body: await res.json() };
}
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base + "/health")).ok) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, "Servidor de teste disponível");

  await test("página inicial apresenta exatamente três modalidades e suas rotas", async () => {
    const response = await fetch(base + "/");
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Presencial — Tela compartilhada/);
    assert.match(html, /Multiplayer — Dispositivos individuais/);
    assert.match(html, /Salas Individuais/);
    assert.match(html, /href="\/multiplayer\.html\?mode=shared"/);
    assert.match(html, /href="\/multiplayer\.html\?mode=individual"/);
    assert.match(html, /href="\/individual\.html"/);
    assert.equal((html.match(/class="mode-card"/g) || []).length, 3);
  });

  await test("cada modalidade serve sua interface; sala compartilhada mantém pré-seleção", async () => {
    for (const route of ["/index.html", "/individual.html", "/multiplayer.html?mode=shared", "/multiplayer.html?mode=individual"]) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200, route);
      assert.match(response.headers.get("content-type"), /text\/html/);
    }
    const solo = await (await fetch(base + "/individual.html")).text();
    assert.match(solo, /id="start"/);
    assert.match(solo, /src="\.\/src\/app\.js"/);
    const js = await (await fetch(base + "/multiplayer.js")).text();
    assert.match(js, /new URLSearchParams\(window\.location\.search\)\.get\("mode"\)/);
    assert.match(js, /\$\("roomMode"\)\.value = requestedMode/);
  });

  await test("presencial oculta escolha de papel e apresenta acesso direto do professor", async () => {
    const html = await (await fetch(base + "/multiplayer.html?mode=shared")).text();
    const js = await (await fetch(base + "/multiplayer.js")).text();
    assert.match(html, /id="loginRoles"/);
    assert.match(html, /id="loginSubtitle"/);
    assert.match(js, /if \(requestedMode === "shared"\) \{/);
    assert.match(js, /\$\("loginRoles"\)\.hidden = true/);
    assert.match(js, /\$\("loginSubtitle"\)\.textContent = "Crie ou acesse uma sala para cadastrar os jogadores\."/);
    assert.match(js, /selectLoginRole\("admin"\)/);
  });

  await test("professor pode sair para escolher outra modalidade sem excluir sala e criar outra turma", async () => {
    const html = await (await fetch(base + "/multiplayer.html")).text();
    const js = await (await fetch(base + "/multiplayer.js")).text();
    assert.match(html, /id="teacherExitHome"/);
    assert.match(js, /\$\("teacherExitHome"\)\.onclick/);
    assert.match(js, /sessionStorage\.removeItem\("cr-room-session"\)/);
    assert.match(js, /window\.location\.assign\("\/"\)/);
    const first = await api("/api/room/create", { password, mode: "shared" });
    assert.equal(first.status, 201);
    const firstCode = first.body.code;
    assert.equal((await api(`/api/room/${firstCode}/shared-add-player`, {
      name: "Ana", professionId: 0, dreamId: "TRAVEL",
    }, first.body.token)).status, 201);
    const second = await api("/api/room/create", { password, mode: "shared" });
    assert.equal(second.status, 201);
    assert.notEqual(firstCode, second.body.code);
    assert.equal(second.body.room.players.length, 0);
    const preserved = await fetch(base + `/api/room/${firstCode}`, {
      headers: { authorization: `Bearer ${first.body.token}` },
    });
    assert.equal(preserved.status, 200);
    assert.equal((await preserved.json()).players.length, 1);
  });
} finally {
  proc.kill();
  await rm(dir, { recursive: true, force: true });
}
