import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
test("Mercado fica na coluna das finanças e não cria uma segunda linha no painel 13x5", () => {
  assert.match(
    js,
    /right\.append\(summary\);\s*if\s*\(!r\.teacher\s*&&\s*me\)\s*right\.append\(makeMarketHub\(r\)\)/,
  );
  assert.match(js, /if\s*\(!isCompactCircuit\s*&&\s*!r\.teacher\s*&&\s*me\)/);
  assert.match(
    css,
    /#room \.board-rectangular \.board-center\s*\{\s*grid-template-rows:\s*minmax\(0,\s*1fr\);\s*overflow:\s*hidden/,
  );
  assert.match(
    css,
    /#room \.board-rectangular \.board-rect-finances \.board-market-hub\s*\{[\s\S]*?grid-column:\s*auto;/,
  );
});
test("marcadores dos participantes maiores sem alterar as dimensões das casas", () => {
  assert.match(css, /#room \.player-dot\s*\{\s*min-width:\s*16px;\s*width:\s*16px;\s*height:\s*16px;/);
  assert.match(css, /#room \.player-dots\s*\{\s*flex-wrap:\s*wrap;/);
  assert.match(css, /@media\s*\(max-width:\s*700px\)\s*\{\s*#room \.player-dot\s*\{\s*min-width:\s*13px;/);
});
