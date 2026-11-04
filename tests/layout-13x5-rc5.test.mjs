import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("circuito 13 x 5 preserva as 32 casas em sequência, sem sobreposições", () => {
  const cols = 13,
    rows = 5,
    coords = [];
  for (let x = 1; x <= cols; x++) coords.push([1, x]);
  for (let y = 2; y <= rows; y++) coords.push([y, cols]);
  for (let x = cols - 1; x >= 1; x--) coords.push([rows, x]);
  for (let y = rows - 1; y >= 2; y--) coords.push([y, 1]);
  assert.equal(coords.length, 32);
  assert.equal(new Set(coords.map((x) => x.join(","))).size, 32);
  assert.deepEqual(coords[0], [1, 1]);
  assert.deepEqual(coords[12], [1, 13]);
  assert.deepEqual(coords[16], [5, 13]);
  assert.deepEqual(coords[28], [5, 1]);
  assert.deepEqual(coords[31], [2, 1]);
  assert.match(js, /const cols\s*=\s*13,\s*rows\s*=\s*isCompactCircuit\s*\?\s*5\s*:\s*13/);
  assert.match(js, /el\.style\.setProperty\(["\']--board-side["\'],\s*String\(cols\)\)/);
  assert.match(css, /\.board-visual\.board-rectangular\s*\{/);
});
