import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");

test("cabeçalho da sala mantém identidade, SENAI e ações numa única linha", () => {
  assert.match(css, /cabeçalho da sala em UMA linha/);
  assert.match(css, /body:has\(#room:not\(\[hidden\]\)\) \.topbar \{\s*display: flex;\s*flex-wrap: nowrap;/);
  assert.match(css, /\.topbar-room-meta \{\s*display: flex;\s*flex: 0 0 auto;\s*flex-wrap: nowrap;/);
  assert.match(css, /\.topbar \.shared-navigation-actions,\s*body:has\(#room:not\(\[hidden\]\)\) \.topbar \.teacher-exit-actions \{[^}]*flex-wrap: nowrap;/s);
  assert.match(html, /class="senai-badge"/);
  assert.match(html, /id="sharedTeacherView"/);
});

test("telas estreitas deslizam horizontalmente sem empilhar os controles", () => {
  assert.match(css, /@media \(max-width: 980px\) \{[\s\S]*?overflow-x: auto;/);
  assert.match(css, /@media \(max-width: 1330px\) \{[\s\S]*?senai-course \{ font-size: 12px; \}/);
});
