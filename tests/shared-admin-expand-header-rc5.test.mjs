import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("administrador presencial expande tabuleiro quando termina a preparação", () => {
  assert.match(js, /classList\.toggle\("shared-admin-expanded", sharedAdmin && r\.status !== "lobby"\)/);
  assert.match(css, /#room\.shared-admin-room\.shared-admin-expanded \.game-grid\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /#room\.shared-admin-room\.shared-admin-expanded \.side-panel\s*\{\s*display: none/);
});

test("sair fica alinhado ao cabeçalho administrativo sem criar borda ou segunda linha", () => {
  assert.match(js, /document\.body\.classList\.toggle\("shared-admin-header", sharedAdmin\)/);
  assert.match(js, /topbarRoomMeta"\)\.append\(adminExit\)/);
  assert.match(css, /body\.shared-admin-header \.topbar \.teacher-exit-actions\s*\{[^}]*margin: 0;[^}]*padding: 0;[^}]*border: 0;/s);
  assert.match(css, /body\.shared-admin-header \.topbar-room-meta\s*\{[^}]*flex-wrap: nowrap;/s);
});

test("sair preserva confirmação e volta para seleção sem encerrar a sala", () => {
  assert.match(js, /\$\("teacherExitHome"\)\.onclick = \(\) => \{/);
  assert.match(js, /window\.confirm\(\s*"Sair da sala atual/);
  assert.match(js, /window\.location\.assign\("\/"\)/);
});
