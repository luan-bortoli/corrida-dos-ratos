import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
test("as respostas de Educação Financeira ficam dentro da modal, fora do turno oculto", () => {
  assert.match(js, /host\.append\(\$\('playerActions'\)\)/);
  assert.match(html, /id="educationQuestion"/);
  assert.match(js, /edu\.append\(btn\)/);
  assert.match(js, /perform\('answer-education'/);
  assert.match(css, /\.game-card-dialog #educationQuestion\{display:grid/);
  assert.match(css, /\.game-card-dialog #playerActions\[hidden\]\{display:none!important\}/);
});
test("o botão de concluir turno continua no tabuleiro e não reaparece na modal", () => {
  assert.match(js, /endButton\.onclick=\(\)=>\{\$\('end'\)\.click\(\);\}/);
  assert.match(
    css,
    /\.game-card-dialog #playerActions \.primary-actions #end\{display:none!important\}/,
  );
});
