import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../multiplayer.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../multiplayer.js',import.meta.url),'utf8');
test('layout novo preserva todos os pontos de integração da sala',()=>{
 for(const id of ['room','boardVisual','turnStage','moveSummary','currentCardPanel','cardTitle','cardDescription','cardMetrics','cardSections','cardEligibility','cardLearning','teacherActions','teacherPanel','players','playerActions','roll','end','buy','educationQuestion','lifeDecision','companyOffer','realEstateOffer','personal','companies','dreamSummary']){
  assert.match(html,new RegExp(`id="${id}"`));
  assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`ID duplicado: ${id}`);
 }
});
test('apresentação retira o texto técnico bruto e utiliza o conteúdo oficial',()=>{
 assert.match(js,/function splitCardText/);
 assert.match(js,/cleanMarkdown/);
 assert.match(js,/getCard\(card\.id\)/);
 assert.match(js,/Recusar \/ encerrar turno/);
 assert.match(html,/class="card-panel"|class="panel card-panel"/);
 assert.match(js,/function drawBoard/);
 assert.doesNotMatch(html,/versão 1\.44/);
});
