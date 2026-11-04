import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");

test("modal da carta tem rolagem em um único contêiner", () => {
  assert.match(css, /\.game-card-dialog\s*\{\s*overflow:\s*hidden;/);
  assert.match(css, /\.game-card-dialog \.dialog-shell\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.match(css, /\.game-card-dialog \.dialog-shell\s*\{[^}]*overflow-x:\s*hidden;/s);
});

test("erros de operações aparecem dentro da modal da carta", () => {
  assert.match(html, /id="gameCardFeedback"[^>]*role="alert"/);
  assert.match(js, /if \(cardFeedback && \$\("gameCardDialog"\)\?\.open\)/);
  assert.match(js, /cardFeedback\.textContent = x;/);
  assert.match(js, /cardFeedback\.hidden = false;/);
});

test("compra primária valida a quantidade conforme o limite da carta antes de enviar", () => {
  assert.match(js, /quantity < sec\.min\s*\|\|\s*quantity > sec\.max/);
  assert.match(js, /Quantidade inválida\. Escolha de \$\{sec\.min\} a \$\{sec\.max\}/);
  assert.match(js, /perform\("official-security-buy", \{ quantity \}\)/);
});
