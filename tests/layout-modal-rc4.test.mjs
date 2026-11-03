import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expenseQuote } from "../src/official-effects.js";
const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
test("a carta e as decisões possuem janela modal reabrível", () => {
  assert.match(html, /id="gameCardDialog"/);
  assert.match(js, /host\.append\(\$\('currentCardPanel'\)\)/);
  assert.doesNotMatch(js, /host\.append\(\$\('currentCardPanel'\),\$\('turnPanel'\)\)/);
  assert.doesNotMatch(js, /lastDialogCardKey/);
  assert.match(js, /showCard\.onclick=openGameCard/);
});
test("a visualização financeira oculta a dívida quando zerada e preserva receita no motor", () => {
  assert.match(js, /if\(Number\(g\.debt\)>0\)/);
  assert.match(js, /formatCashBRL\(g\)/);
});
test("DI-006 cobra exatamente 5% do salário de referência", () => {
  assert.deepEqual(expenseQuote("DI-006", 2200), { percent: 5, amount: 110 });
  assert.match(js, /Despesa extra/);
});
