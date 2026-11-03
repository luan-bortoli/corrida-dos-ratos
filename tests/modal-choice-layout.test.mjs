import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("ações de decisão na modal usam flex, centralização e espaço entre botões", () => {
  const rule = css.match(
    /\.game-card-dialog #lifeDecision,\s*\.game-card-dialog #companyOffer,\s*\.game-card-dialog #realEstateOffer\s*\{([^}]*)\}/,
  );
  assert.ok(rule, "regra de layout dos botões não localizada");
  for (const expected of [
    /display:\s*flex\s*;/,
    /flex-wrap:\s*wrap\s*;/,
    /justify-content:\s*center\s*;/,
    /gap:\s*10px\s*;/,
  ]) {
    assert.match(rule[1], expected);
  }
});
