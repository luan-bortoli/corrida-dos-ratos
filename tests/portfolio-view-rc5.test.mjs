import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("a carteira inclui pequenos negócios e equipamentos registrados no patrimônio individual", () => {
  assert.match(ui, /const ownedAssets = r\.game\?\.assets \|\| \[\]/);
  assert.match(ui, /official_small_business/);
  assert.match(ui, /official_rental/);
  assert.match(ui, /official_resale_stock/);
  assert.match(ui, /marketBox\(`\$\{asset\.id \|\| "Ativo"\}/);
});

test("renda fixa ativa e ações continuam na carteira sem criar novas operações financeiras", () => {
  assert.match(ui, /r\.game\?\.fixedIncome \|\| \[\]/);
  assert.match(ui, /c\.status === "active"/);
  assert.match(ui, /for \(const \[id, units\] of info\.owned\)/);
  assert.match(ui, /market-portfolio-heading/);
  assert.match(css, /\.market-portfolio-heading/);
});

test("a aplicação PO-008 utiliza nome e condições oficiais quando não possui descrição detalhada", () => {
  assert.match(ui, /fixedCard \? fixedCard\.name : content\.title/);
  assert.match(ui, /content\.description \|\| cardIntroduction/);
  assert.doesNotMatch(ui, /Descrição detalhada indisponível para esta carta/);
});
