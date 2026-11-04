import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
test("cartas abertas sob demanda, sem seção turno atual na modal", () => {
  assert.match(js, /showCard\.onclick\s*=\s*openGameCard/);
  assert.doesNotMatch(js, /lastDialogCardKey|key!==lastDialogCardKey/);
  assert.match(js, /host\.append\(\$\(["\']currentCardPanel["\']\)\)/);
  assert.match(js, /\$\(["\']turnPanel["\']\)\.hidden\s*=\s*true/);
});
test("sala simplifica cabeçalho e oferece ações de saída e desistência", () => {
  for (const id of [
    "roomOptions",
    "leaveRoom",
    "quitRoom",
    "confirmQuit",
    "cancelQuit",
    "rejoinRoom",
  ])
    assert.match(html, new RegExp(`id="${id}"`));
  assert.doesNotMatch(html, /Jogo individual|SUA SESSÃO|id="roleText"|id="roomCode"/);
  assert.match(js, /exitToWelcome/);
  assert.match(css, /#room\.player-room \.game-grid\s*\{\s*display:\s*block/);
});
