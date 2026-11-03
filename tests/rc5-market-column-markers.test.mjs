import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
test("Mercado fica na coluna das finanças e não cria uma segunda linha no painel 13x5", () => {
  assert.match(
    js,
    /right\.append\(summary\);\s*if\(!r\.teacher&&me\)right\.append\(makeMarketHub\(r\)\)/,
  );
  assert.match(js, /if\(!isCompactCircuit&&!r\.teacher&&me\)/);
  assert.match(
    css,
    /#room \.board-rectangular \.board-center\{\s*grid-template-rows:minmax\(0,1fr\);\s*overflow:hidden/,
  );
  assert.match(
    css,
    /#room \.board-rectangular \.board-rect-finances \.board-market-hub\{[\s\S]*?grid-column:auto;/,
  );
});
test("marcadores dos participantes maiores sem alterar as dimensões das casas", () => {
  assert.match(css, /#room \.player-dot\{\s*min-width:16px;\s*width:16px;\s*height:16px;/);
  assert.match(css, /#room \.player-dots\{\s*flex-wrap:wrap;/);
  assert.match(css, /@media\(max-width:700px\)\{\s*#room \.player-dot\{min-width:13px;/);
});
