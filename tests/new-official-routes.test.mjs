import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanies,purchaseCompanyShare} from '../src/companies.js';
import {REAL_ESTATE} from '../src/real-estate.js';
import {GLOBAL_MARKET_EVENTS,GLOBAL_INCOME_EVENTS,applyGlobalMarketEvent} from '../src/global-market.js';
import {functionalCoverage} from '../src/functional-coverage.js';

function marketRoom(id,assets){return {round:4,players:[{id:'a',game:{pending:true,won:false,currentCard:{id,category:'MF'},cardEvents:[{id:`event-${id}`,resolution:'pending'}],assets}},{id:'b',game:{won:true,assets:[{...assets[0]}]}}]};}
test('GO-005 mantém preço, aluguel de referência e entrada oficiais',()=>assert.deepEqual(REAL_ESTATE.find(x=>x.id==='GO-005'),{id:'GO-005',name:'Chalé para Hospedagem',cost:42000,passive:380,minDown:25}));
test('GO-018 a GO-020 incluem três participações com preços oficiais e lucro de referência separado',()=>{
 const c=createCompanies();assert.deepEqual(c.slice(-3).map(x=>[x.id,x.valuation,x.offer.percent,x.offer.price,x.referenceDistribution]),[
 ['GO-018',80000,20,16000,0],['GO-019',50000,40,20000,600],['GO-020',120000,25,30000,1200]
 ]);
 const r={companies:c,round:1,players:[{id:'p',game:{pending:true,lastTile:'GO',offerResolved:false,cash:35000,ledger:[],closures:0,turn:1,history:[]}}]};
 const result=purchaseCompanyShare(r,'p','GO-018');assert.equal(result.percent,20);assert.equal(r.players[0].game.cash,19000);assert.equal(r.companies[2].shares.p,20);assert.equal(r.companies[2].retainedProfit,0);
});
test('MF-018 e MF-030 valorizam e desvalorizam somente empresas tecnológicas',()=>{
 const a={id:'GI-012',cost:280000,passive:0},b={id:'GO-011',cost:55000,passive:0};
 const r=marketRoom('MF-018',[a,b]);assert.equal(applyGlobalMarketEvent(r,'MF-018').affected,1);assert.equal(a.marketValue,322000);assert.equal(b.marketValue,undefined);
 const r2=marketRoom('MF-030',[{id:'GO-018',cost:16000,passive:0}]);assert.equal(applyGlobalMarketEvent(r2,'MF-030').affected,1);assert.equal(r2.players[0].game.assets[0].marketValue,13120);
});
test('MF-024 aplica valorização sustentável e MF-029 renda de temporada somente a elegíveis',()=>{
 const a=marketRoom('MF-024',[{id:'GO-019',cost:20000,passive:0},{id:'GO-018',cost:16000,passive:0}]);assert.equal(applyGlobalMarketEvent(a,'MF-024').affected,1);assert.equal(a.players[0].game.assets[0].marketValue,22400);
 const b=marketRoom('MF-029',[{id:'GO-005',cost:42000,passive:380},{id:'GO-001',cost:35000,passive:350}]);assert.equal(applyGlobalMarketEvent(b,'MF-029').affected,1);assert.equal(b.players[0].game.assets[0].passive,437);assert.equal(b.players[0].game.assets[1].passive,350);
});
test('inventário detecta oito rotas adicionais sem declarar homologação total',()=>{
 const f=functionalCoverage();assert.equal(f.total,230);assert.equal(f.counts.sem_rota,0);assert.equal(f.counts.parcial,0);assert.equal(f.counts.rota,230);assert.equal(f.percentages.homologacaoIntegral,null);
});
