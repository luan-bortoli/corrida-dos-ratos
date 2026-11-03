import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");

test("painel do tabuleiro não repete títulos da partida", () => {
  assert.doesNotMatch(html, /class="section-kicker">PARTIDA EM ANDAMENTO/);
  assert.doesNotMatch(html, /<h2>Tabuleiro<\/h2>/);
  assert.match(html, /<span id="boardCircuit" hidden><\/span>/);
  assert.match(html, /id="boardVisual"/);
});

test("Mercado segue nas duas colunas da direita e ocupa largura do conteúdo", () => {
  assert.match(
    css,
    /#room \.board-rectangular \.board-market-hub\{\s*grid-column:2 \/ 4;\s*justify-self:center;\s*width:max-content;/,
  );
  assert.match(css, /padding:5px 8px;/);
  assert.match(js, /function makeMarketHub\(r\)/);
  assert.match(js, /Abrir Mercado →/);
});
