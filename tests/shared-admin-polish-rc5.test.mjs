import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("modo presencial coloca acesso ao jogo e ao administrador no cabeçalho", () => {
  assert.match(js, /topbarRoomMeta"\)\.append\(sharedNavActions\)/);
  assert.match(js, /sharedNavContainer\.append\(sharedNavActions\)/);
  assert.match(css, /\.topbar \.shared-navigation-actions/);
  assert.doesNotMatch(html, /<strong>Presencial — Tela compartilhada<\/strong>/);
  assert.doesNotMatch(html, /Saia desta sala para criar uma nova partida/);
});

test("campos de cadastro ficam bloqueados quando há seis participantes", () => {
  assert.match(js, /const registrationFull = r\.players\.length >= 6/);
  for (const field of ["sharedPlayerName", "sharedProfession", "sharedDream", "sharedAddPlayer"])
    assert.ok(js.includes(`"${field}"`));
  assert.match(js, /if \(field\) field\.disabled = registrationFull/);
});

test("avatares usam cores do tabuleiro e iniciais dos dois primeiros nomes", () => {
  assert.match(js, /function playerAvatarInitials\(name\)/);
  assert.match(js, /parts\.slice\(0, 2\)/);
  assert.match(js, /avatar\.style\.backgroundColor = playerAvatarColor\(r, player\)/);
  assert.match(js, /dot\.textContent = playerAvatarInitials\(p\.name\)/);
  assert.match(css, /\.shared-admin-player-avatar/);
});
