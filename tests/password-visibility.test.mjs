import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("login administrativo tem botão de visualizar a senha sem enviá-la", () => {
  assert.match(html, /<input type="password" id="password"/);
  assert.match(html, /id="togglePassword"/);
  assert.match(html, /type="button"\s+id="togglePassword"/);
  assert.match(html, /aria-label="Mostrar senha"/);
  assert.match(html, /class="password-slash"/);
});

test("olho alterna visibilidade, acessibilidade e permite voltar a ocultar", () => {
  assert.match(js, /field\.type = visible \? "text" : "password"/);
  assert.match(js, /visible \? "Ocultar senha" : "Mostrar senha"/);
  assert.match(js, /aria-pressed/);
  assert.match(css, /\.password-field input\s*\{\s*padding-right:/);
});
