import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
test("atualização automática não restaura a visão de jogador após selecionar Administrador", () => {
  assert.match(js, /const requestedView = sharedView;/);
  assert.match(js, /session\?\.code === requestedCode && sharedView === requestedView/);
  assert.match(js, /sharedView = "teacher";\s*render\(await req/);
});
