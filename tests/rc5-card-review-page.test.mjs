import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARD_CATALOG } from '../src/catalog.js';
import { splitCardText } from '../src/card-text-rendering.js';
const root = new URL('../', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
test('revisão permite consultar 230 cartas, filtrar e acessar exemplos representativos', () => {
  assert.equal(CARD_CATALOG.length, 230);
  const html = read('revisao-cartas.html');
  const js = read('revisao-cartas.js');
  for (const id of ['reviewSearch', 'reviewCategory', 'reviewCircuit', 'reviewList', 'reviewExamples', 'previewTitle', 'previewMetrics']) assert.match(html, new RegExp(`id="${id}"`));
  for (const id of ['PO-003', 'PO-008', 'PO-017', 'DI-006', 'EF-001', 'EV-012', 'GI-001', 'FI-001']) assert.ok(js.includes(id));
});
test('revisão só libera catálogo após confirmar sessão administrativa; operações não são executáveis', () => {
  const js = read('revisao-cartas.js');
  assert.match(js, /session\.role\s*!==\s*"teacher"/);
  assert.match(js, /\/card-audit/);
  assert.match(js, /\.disabled\s*=\s*true/);
  assert.doesNotMatch(js, /fetch\([^)]*\{\s*method:\s*"POST"/);
});
test('revisão usa estrutura de cartas conhecida do jogo sem alterar regras ou textos oficiais', () => {
  const source = read('multiplayer.js');
  const extraction = read('src/card-text-rendering.js');
  assert.match(source, /function splitCardText\(original, id\)/);
  assert.match(extraction, /export function splitCardText\(original, id\)/);
  assert.deepEqual(splitCardText('PO-003\nPequeno negócio\nLoja virtual\nPreço: R$ 1.800', 'PO-003').title, 'Loja virtual');
  assert.match(read('revisao-cartas.html'), /card-panel/);
  assert.match(read('multiplayer.html'), /revisao-cartas\.html/);
  assert.match(read('server.mjs'), /revisao-cartas\.html/);
});

test('prévia mantém a mesma estrutura de modal e apresenta questões oficiais sem executar ações', () => {
  const html = read('revisao-cartas.html');
  const js = read('revisao-cartas.js');
  for (const name of ['game-card-dialog','dialog-shell','dialog-heading','card-panel','card-metrics','card-sections','card-learning']) assert.match(html,new RegExp(name));
  assert.match(js, /financial-quiz-data\.json/);
  assert.match(js, /splitCardText\(card\.text, card\.id\)/);
  assert.match(js, /\.disabled\s*=\s*true/);
});
