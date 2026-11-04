import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
test("tela do Administrador mantém os controles, tabuleiro e campos da versão homologada", () => {
  const html = read("multiplayer.html");
  const js = read("multiplayer.js");
  const css = read("styles.css");
  for (const id of ["sharedRegistration", "sharedPlayerName", "sharedProfession", "sharedDream", "sharedAddPlayer", "sharedAdminBoardHeader", "sharedAdminBoardControls", "boardVisual", "playersPanel", "teacherPanel"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(js, /if \(field\) field\.disabled = registrationFull/);
  assert.match(js, /shared-admin-expanded/);
  assert.match(css, /shared-admin-expanded/);
  assert.match(html, /revisao-cartas\.html/);
});
