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
  completePresentialRound,
  continuePresentialRound,
  rankPresentialPlayers,
  publicPresentialTimer,
  PRESENTIAL_DURATION_MS,
} from "../src/presential-timer.js";
import { createGame } from "../src/engine.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("2 minutos por participante, de 2 a 6 jogadores", () => {
  assert.equal(PRESENTIAL_DURATION_MS, 120000);
  for (let players = 2; players <= 6; players++) {
    const timer = startPresentialTimer(1000, players);
    assert.equal(timer.durationMs, players * 120000);
    assert.equal(timer.deadline, 1000 + players * 120000);
  }
});

test("pausa e retomada não gastam tempo de rodada", () => {
  const room = { mode: "shared", status: "playing", presencialTimer: startPresentialTimer(1000, 3) };
  assert.equal(remainingPresentialMs(room, 11000), 350000);
  pausePresentialTimer(room, 11000);
  room.status = "paused";
  assert.equal(remainingPresentialMs(room, 200000), 350000);
  room.status = "playing";
  resumePresentialTimer(room, 200000);
  assert.equal(remainingPresentialMs(room, 210000), 340000);
});

test("tempo esgotado não encerra a rodada; só o último Encerrar turno abre decisão", () => {
  const room = {
    mode: "shared", status: "playing", order: ["a", "b"], turnIndex: 1,
    round: 1, turnDeadline: 10000,
    players: [{ id: "a", game: { pending: false } }, { id: "b", game: { pending: true } }],
    presencialTimer: startPresentialTimer(0, 2, 100),
  };
  assert.equal(checkPresentialExpiry(room, 200), true);
  assert.equal(room.status, "playing");
  assert.equal(publicPresentialTimer(room, 200).pendingDecision, false);
  room.players[1].game.pending = false;
  assert.equal(completePresentialRound(room, 250), true);
  assert.equal(room.status, "paused");
  assert.equal(room.presencialTimer.roundsCompleted, 1);
  assert.equal(publicPresentialTimer(room, 250).pendingDecision, true);
  room.status = "playing";
  continuePresentialRound(room, 300);
  assert.equal(room.presencialTimer.durationMs, 240000);
  assert.equal(room.presencialTimer.pendingDecision, false);
  assert.equal(room.presencialTimer.deadline, 240300);
});

test("ao concluir a rodada, apresenta tempo gasto e não o saldo restante", () => {
  const room = {
    mode: "shared", status: "playing", order: ["a", "b"],
    turnIndex: 1, round: 1, turnDeadline: 300000,
    players: [{ id: "a" }, { id: "b" }],
    presencialTimer: startPresentialTimer(0, 2),
  };
  assert.equal(publicPresentialTimer(room, 90000).secondsRemaining, 150);
  assert.equal(completePresentialRound(room, 90000), true);
  const finished = publicPresentialTimer(room, 120000);
  assert.equal(finished.secondsRemaining, 150);
  assert.equal(finished.secondsElapsed, 90);
  assert.equal(finished.pendingDecision, true);
});

test("tempo gasto exclui pausa e inclui turno concluído depois do prazo", () => {
  const room = {
    mode: "shared", status: "playing", order: ["a", "b"],
    turnIndex: 1, round: 1, turnDeadline: 600000,
    players: [{ id: "a" }, { id: "b" }],
    presencialTimer: startPresentialTimer(0, 2),
  };
  pausePresentialTimer(room, 60000);
  room.status = "paused";
  assert.equal(publicPresentialTimer(room, 90000).secondsElapsed, 60);
  room.status = "playing";
  resumePresentialTimer(room, 90000);
  assert.equal(checkPresentialExpiry(room, 310000), true);
  assert.equal(completePresentialRound(room, 340000), true);
  assert.equal(publicPresentialTimer(room, 500000).secondsElapsed, 310);
  room.status = "playing";
  continuePresentialRound(room, 500000);
  assert.equal(publicPresentialTimer(room, 501000).secondsElapsed, 1);
});

test("cronômetro mostra o decorrido somente após conclusão e mantém contagem regressiva em jogo", async () => {
  const js = await readFile("multiplayer.js", "utf8");
  assert.match(js, /timer\.pendingDecision \|\| r\.status === "finished"/);
  assert.match(js, /Tempo utilizado na rodada/);
  assert.match(js, /timer\.secondsElapsed/);
});

test("modal obrigatória impede fechamento sem senha e conserva escolha da rodada", async () => {
  const html = await readFile("multiplayer.html", "utf8");
  const js = await readFile("multiplayer.js", "utf8");
  assert.match(html, /id="presencialRoundDialog"/);
  assert.match(html, /id="presencialRoundPassword"/);
  assert.match(html, /Encerrar e mostrar ranking/);
  assert.match(html, /Liberar mais uma rodada/);
  assert.match(js, /addEventListener\("cancel", \(event\) => event\.preventDefault\(\)\)/);
  assert.match(js, /roundDialog\.showModal\(\)/);
  assert.match(js, /chooseRoundAction\("finish-time"\)/);
  assert.match(js, /chooseRoundAction\("continue-time"\)/);
});

test("ranking prioriza renda passiva e critérios de desempate", () => {
  const a = createGame(0), b = createGame(0);
  a.assets.push({ id: "x", ownershipId: "x", name: "Ativo", cost: 1000, passive: 150 });
  b.assets.push({ id: "y", ownershipId: "y", name: "Ativo", cost: 2000, passive: 250 });
  const rows = rankPresentialPlayers({ players: [
    { id: "a", name: "Ana", game: a }, { id: "b", name: "Bruno", game: b },
  ] });
  assert.deepEqual(rows.map((r) => r.name), ["Bruno", "Ana"]);
  assert.equal(rows[0].place, 1);
});

test("integração: turno de todos, bloqueio de modal, senha, mais uma rodada e ranking", async () => {
  const dir = await mkdtemp(join(tmpdir(), "corrida-rodadas-"));
  const port = 34500 + Math.floor(Math.random() * 15000);
  const base = `http://127.0.0.1:${port}`;
  const password = "senha-rodadas-123";
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), DATA_DIR: dir, ADMIN_PASSWORD: password,
      NODE_ENV: "test", TEST_PRESENTIAL_MS: "100" },
    stdio: "ignore",
  });
  async function req(path, method = "GET", body, token) {
    const response = await fetch(base + path, { method,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, value: await response.json() };
  }
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try { if ((await fetch(base + "/health")).ok) { ready = true; break; } } catch {}
      await sleep(50);
    }
    assert.equal(ready, true);
    const created = await req("/api/room/create", "POST", { password, mode: "shared" });
    assert.equal(created.status, 201);
    const { code, token } = created.value;
    const path = `/api/room/${code}`;
    for (const [name, professionId] of [["Ana", 0], ["Bruno", 1]])
      assert.equal((await req(path + "/shared-add-player", "POST", { name, professionId, dreamId: "TRAVEL" }, token)).status, 201);
    let state = (await req(path + "/start", "POST", {}, token)).value;
    assert.equal(state.presencial.durationSeconds, 0); // janela curta somente no teste
    await sleep(1200);
    state = (await req(path, "GET", undefined, token)).value;
    assert.equal(state.status, "playing", "não deve pausar por tempo enquanto a rodada está em curso");
    assert.equal(state.presencial.waitingForTurn, true);
    assert.equal((await req(path + "/finish", "POST", {}, token)).status, 409);
    assert.equal((await req(path + "/finish-time", "POST", { password }, token)).status, 409);
    assert.equal((await req(path + "/advance", "POST", {}, token)).status, 409);
    async function play() {
      assert.equal((await req(path + "/roll", "POST", {}, token)).status, 200);
      return await req(path + "/end", "POST", {}, token);
    }
    state = (await play()).value;
    assert.equal(state.status, "playing", "primeiro encerramento não abre modal");
    state = (await play()).value;
    assert.equal(state.status, "paused", "último encerramento deve pausar");
    assert.equal(state.presencial.pendingDecision, true);
    assert.equal(state.presencial.roundsCompleted, 1);
    assert.equal((await req(path + "/roll", "POST", {}, token)).status, 409);
    assert.equal((await req(path + "/resume", "POST", {}, token)).status, 409);
    // O botão Administrador deve funcionar com a rodada bloqueada: somente
    // a autenticação de retorno é liberada, sem desbloquear ações de jogo.
    assert.equal((await req(path + "/shared-teacher-unlock", "POST", { password: "errada" }, token)).status, 401);
    assert.equal((await req(path + "/shared-teacher-unlock", "POST", { password }, token)).status, 200);
    const viewAfterUnlock = (await req(path, "GET", undefined, token)).value;
    assert.equal(viewAfterUnlock.teacher, true);
    assert.equal(viewAfterUnlock.presencial.pendingDecision, true);
    assert.equal((await req(path + "/roll", "POST", {}, token)).status, 409);
    assert.equal((await req(path + "/finish-time", "POST", {}, token)).status, 401);
    assert.equal((await req(path + "/finish-time", "POST", { password: "errada" }, token)).status, 401);
    assert.equal((await req(path + "/continue-time", "POST", { password: "errada" }, token)).status, 401);
    state = (await req(path + "/continue-time", "POST", { password }, token)).value;
    assert.equal(state.status, "playing");
    assert.equal(state.presencial.durationSeconds, 240);
    assert.equal(state.presencial.pendingDecision, false);
    state = (await play()).value;
    assert.equal(state.status, "playing");
    state = (await play()).value;
    assert.equal(state.presencial.pendingDecision, true);
    assert.equal(state.presencial.roundsCompleted, 2);
    state = (await req(path + "/finish-time", "POST", { password }, token)).value;
    assert.equal(state.status, "finished");
    assert.equal(state.presencial.ranking.length, 2);
    const report = (await req(path + "/report?format=json", "GET", undefined, token)).value;
    assert.equal(report.endingType, "renda_passiva_por_tempo");
    assert.equal(report.presencialRanking.length, 2);
    const saved = JSON.parse(await readFile(join(dir, "rooms.json"), "utf8"));
    assert.equal(saved[code].endReason, "time_limit");
    assert.equal(saved[code].presencialTimer.roundsCompleted, 2);
    const normal = await req("/api/room/create", "POST", { password, mode: "individual" });
    assert.equal(normal.value.room.presencial, null);
  } finally { child.kill(); await rm(dir, { recursive: true, force: true }); }
});
