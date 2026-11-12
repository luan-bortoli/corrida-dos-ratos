import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../multiplayer.html', import.meta.url), 'utf8');

test('cabeçalho presencial mantém o nome do curso visível na mesma linha', () => {
  assert.match(html, /class="senai-course">Técnico em Informática para Internet<\/span>/);
  assert.match(css, /body:has\(#room:not\(\[hidden\]\)\) \.topbar \.senai-course\s*\{\s*font-size: 13px;\s*white-space: nowrap;/);
  assert.doesNotMatch(css, /body:has\(#room:not\(\[hidden\]\)\) \.topbar \.senai-course\s*\{\s*display:\s*none;/);
  assert.match(css, /body:has\(#room:not\(\[hidden\]\)\) \.topbar\s*\{\s*display: flex;\s*flex-wrap: nowrap;/);
});

test('nome do curso acompanha a fonte de Corrida dos Ratos no cabeçalho', () => {
  assert.match(css, /\.topbar \.brand strong \{[\s\S]*?font-size: 13px;/);
  assert.match(css, /\.topbar \.senai-course \{\s*font-size: 13px;/);
  assert.match(css, /@media \(max-width: 1330px\) \{[\s\S]*?senai-course \{ font-size: 12px; \}[\s\S]*?brand strong \{ font-size: 12px; \}/);
});
