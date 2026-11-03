import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INNER } from "../src/data.js";
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
test("posição interna 3 corresponde à casa visual 2 de educação financeira", () => {
  assert.equal(INNER[2], "EF");
  assert.equal(INNER[3], "DI");
  assert.match(js, /p\.position===i\+1/);
  assert.match(js, /tiles\[active\.position-1\]/);
  assert.match(js, /Casa nº \${active\.position-1}/);
});
