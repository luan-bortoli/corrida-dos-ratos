import test from 'node:test';
import assert from 'node:assert/strict';
import {functionalCoverage} from '../src/functional-coverage.js';
import {CARD_CATALOG,getCard,cardsForTile,drawCatalogCard} from '../src/catalog.js';

const finalIds=['OE-004','OE-012','OE-014','OE-015','OE-016'];

test('fechamento funcional v1.43: 230 identificadores, textos aprovados e rotas sem lacunas inventariadas',()=>{
 const report=functionalCoverage();
 assert.equal(report.total,230);
 assert.deepEqual(report.counts,{rota:230,parcial:0,sem_rota:0});
 assert.equal(report.percentages.rotasIdentificadas,100);
 assert.equal(report.percentages.rotasSemPendenciaConhecida,100);
 assert.equal(report.percentages.homologacaoIntegral,null);
 assert.deepEqual(new Set(report.cards.map(c=>c.id)).size,230);
 for(const card of CARD_CATALOG){
  assert.equal(getCard(card.id).status,'text_available',`Texto aprovado ausente: ${card.id}`);
  assert.ok(getCard(card.id).text,`Texto vazio: ${card.id}`);
  assert.equal(report.cards.find(c=>c.id===card.id).level,'rota',`Rota ausente: ${card.id}`);
 }
});

test('fechamento funcional v1.43: cinco OE possuem rastreabilidade de execução',()=>{
 const report=functionalCoverage();
 for(const id of finalIds){
  const card=report.cards.find(c=>c.id===id);
  assert.ok(card,`Carta ausente: ${id}`);
  assert.equal(card.category,'OE');
  assert.equal(card.level,'rota');
  assert.ok(card.module&&card.reason);
  assert.ok(cardsForTile('OE','outer').some(c=>c.id===id),`Não sorteável: ${id}`);
 }
});

test('fechamento funcional v1.43: todos os baralhos percorrem cada carta uma vez por ciclo',()=>{
 for(const circuit of ['inner','outer']){
  for(const tile of new Set(CARD_CATALOG.map(c=>c.category))){
   const available=cardsForTile(tile,circuit);
   if(!available.length)continue;
   const state={};const drawn=[];
   for(let i=0;i<available.length;i++)drawn.push(drawCatalogCard(state,tile,circuit,()=>0));
   assert.deepEqual(new Set(drawn.map(c=>c.id)),new Set(available.map(c=>c.id)),`${tile}/${circuit}`);
   assert.equal(drawn.length,new Set(drawn.map(c=>c.id)).size);
  }
 }
});
