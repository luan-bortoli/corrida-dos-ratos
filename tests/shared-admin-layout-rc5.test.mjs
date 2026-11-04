import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../multiplayer.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../multiplayer.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('modo presencial mantém um único tabuleiro e uma área de cadastro lateral', () => {
  assert.match(html, /id="sharedAdminBoardHeader"/);
  assert.match(html, /id="sharedAdminBoardControls"/);
  assert.match(html, /id="sharedRegistration"/);
  assert.match(html, /id="playersPanel"/);
  assert.match(css, /#room\.shared-admin-room \.game-grid\s*\{\s*display: grid;\s*grid-template-columns: minmax\(0,/);
  assert.match(js, /adminSidePanel\.append\(adminTeacherPanel\)/);
});

test('controles da sala presencial dependem do estado e PDF fica fora da preparação', () => {
  assert.match(js, /\$\("start"\)\.hidden = r\.status !== "lobby"/);
  assert.match(js, /\$\("pause"\)\.hidden = r\.status !== "playing"/);
  assert.match(js, /\$\("resume"\)\.hidden = r\.status !== "paused"/);
  assert.match(js, /\$\("finish"\)\.hidden = r\.status === "finished"/);
  assert.match(js, /\$\("reportPrint"\)\.hidden = r\.status === "lobby"/);
  assert.match(js, /controls\.append\(\$\(id\)\)/);
});

test('painel administrativo não exibe dado ou cronômetro e preserva centro do jogador', () => {
  const start = js.indexOf('if (r.teacher && r.mode === "shared")', js.indexOf('function drawBoard'));
  const regular = js.indexOf('const active = r.players.find', start);
  assert.ok(start > -1 && regular > start);
  const admin = js.slice(start, regular);
  assert.match(admin, /Aguardando jogadores/);
  assert.match(admin, /fullName\.textContent = player\.name/);
  assert.match(admin, /return;/);
  assert.match(js, /const dieButton = document\.createElement\("button"\)/);
  assert.match(css, /#room\.shared-admin-room #turnPanel,/);
});
