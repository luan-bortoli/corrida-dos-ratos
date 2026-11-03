import test from 'node:test';
import assert from 'node:assert/strict';
import {functionalCoverage} from '../src/functional-coverage.js';
import {CARD_CATALOG} from '../src/catalog.js';
test('relatório contém os 230 IDs uma vez e porcentagens reproduzíveis',()=>{
 const a=functionalCoverage();assert.equal(a.total,230);assert.deepEqual(a.cards.map(x=>x.id),CARD_CATALOG.map(x=>x.id));assert.equal(new Set(a.cards.map(x=>x.id)).size,230);assert.equal(Object.values(a.counts).reduce((s,n)=>s+n,0),230);assert.equal(a.percentages.rotasIdentificadas,Math.round((a.counts.rota+a.counts.parcial)/230*10000)/100);
});
test('cobertura de código não equivale à homologação manual',()=>{
 const a=functionalCoverage();assert.equal(a.percentages.homologacaoIntegral,null);for(const id of ['OE-004','OE-012','OE-014','OE-015','OE-016'])assert.equal(a.cards.find(x=>x.id===id).level,'rota');for(const id of ['GO-009','GO-010','GO-011','GO-012','GO-013','GO-014','GO-015'])assert.equal(a.cards.find(x=>x.id===id).level,'rota');
});
test('as cinco cartas de filantropia e 30 questões possuem rotas',()=>{
 const a=functionalCoverage();for(const category of ['FI','EF'])assert.equal(a.categories[category].sem_rota,0);
});
test('as cinco participações GO possuem ciclo contábil testado',()=>{
 const a=functionalCoverage();for(const id of ['GO-016','GO-017','GO-018','GO-019','GO-020'])assert.equal(a.cards.find(x=>x.id===id).level,'rota');
});

test('GI e aquisições OE empresariais têm livro contábil integrado sem homologação automática',()=>{const a=functionalCoverage();for(const id of ['GI-011','GI-019','OE-013','OE-017','OE-018','OE-020'])assert.equal(a.cards.find(x=>x.id===id).level,'rota');assert.equal(a.percentages.homologacaoIntegral,null);});
