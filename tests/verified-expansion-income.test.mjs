import test from 'node:test';
import assert from 'node:assert/strict';
import {recordVerifiedOperatingEvent} from '../src/governance.js';
import {createGame} from '../src/engine.js';
import {proposeCorporateExpansion,executeApprovedCorporateExpansion} from '../src/corporate-expansions.js';
import {castVote} from '../src/governance.js';
import {closeCompanies} from '../src/companies.js';
function setup(shares={a:100}){
 const players=['a','b'].map(id=>({id,game:createGame(1)}));
 const g=players[0].game;g.circuit='outer';g.pending=true;g.lastTile='OE';g.currentCard={id:'OE-005',category:'OE'};
 g.cardEvents=[{id:'OE-005',resolution:'pending'}];
 const c={id:'co',name:'Agência de Serviços Digitais',cash:50000,reserveRequired:1000,retainedProfit:0,pendingExpenses:0,shares,initialShares:{...shares},history:[],operatingLedger:[],distributions:[],lastClosedRound:0};
 return {players,companies:[c],round:1};
}
test('melhoria não gera receita automaticamente nem retroage à rodada de investimento',()=>{
 const r=setup(),c=r.companies[0];proposeCorporateExpansion(r,'a','co','OE-005');
 assert.equal(c.cash,25000);assert.equal(c.retainedProfit,0);assert.equal(c.operatingLedger.length,0);
 recordVerifiedOperatingEvent(c,{sourceId:'SALE:ROUND:1',type:'revenue',amount:1000,round:1});
 assert.equal(c.operatingLedger[0].amount,1000);assert.equal(c.operatingLedger[0].improvementBonus,0);
 recordVerifiedOperatingEvent(c,{sourceId:'SALE:ROUND:2',type:'revenue',amount:1000,round:2});
 assert.equal(c.operatingLedger[1].amount,1150);assert.equal(c.operatingLedger[1].improvementBonus,150);
 assert.equal(c.retainedProfit,2150);
 assert.throws(()=>recordVerifiedOperatingEvent(c,{sourceId:'SALE:ROUND:2',type:'revenue',amount:1000,round:2}),/repetido/);
});
test('despesa empresarial não recebe multiplicador de expansão',()=>{
 const r=setup(),c=r.companies[0];proposeCorporateExpansion(r,'a','co','OE-005');
 recordVerifiedOperatingEvent(c,{sourceId:'COST:ROUND:2',type:'expense',amount:600,round:2});
 assert.equal(c.cash,24400);assert.equal(c.retainedProfit,-600);assert.equal(c.operatingLedger[0].amount,600);
});
test('melhoria votada só se aplica após aprovação e execução',()=>{
 const r=setup({a:60,b:40}),c=r.companies[0];const p=proposeCorporateExpansion(r,'a','co','OE-005');
 recordVerifiedOperatingEvent(c,{sourceId:'SALE:BEFORE',type:'revenue',amount:1000,round:2});
 assert.equal(c.operatingLedger[0].amount,1000);
 castVote(r,'a',p.proposalId,'yes');executeApprovedCorporateExpansion(r,p.proposalId);
 recordVerifiedOperatingEvent(c,{sourceId:'SALE:AFTER',type:'revenue',amount:1000,round:2});
 assert.equal(c.operatingLedger[1].amount,1150);
});
test('distribuição do lucro confirmado inclui bônus da expansão, respeitando reserva',()=>{
 const r=setup(),c=r.companies[0];proposeCorporateExpansion(r,'a','co','OE-005');
 recordVerifiedOperatingEvent(c,{sourceId:'SALE:ROUND:2',type:'revenue',amount:1000,round:2});
 const before=r.players[0].game.cash;const [period]=closeCompanies(r,9);
 assert.equal(period.income,1150);assert.equal(period.paid,1150);
 assert.equal(r.players[0].game.cash-before,1150);assert.equal(c.cash,25000);
});
const expandedCases=[
 ['OE-001','Cafeteria',12000,20],['OE-002','Loja',18000,12],
 ['OE-003','Mercado',35000,25],['OE-005','Agência Digital',25000,15],
 ['OE-006','Loja',15000,12],['OE-008','Empresa de Software',30000,18],
 ['OE-019','Loja',80000,30]
];
for(const [cardId,name,cost,rate] of expandedCases){
 test(`${cardId}: investimento comprovado e acréscimo somente sobre receitas posteriores`,()=>{
  const r=setup(),c=r.companies[0],g=r.players[0].game;
  r.round=3; c.cash=150000;c.retainedProfit=10000;c.name=name;
  g.currentCard.id=cardId;g.cardEvents[0].id=cardId;
  const res=proposeCorporateExpansion(r,'a','co',cardId);
  assert.equal(res.spent,cost);assert.equal(c.cash,150000-cost);
  recordVerifiedOperatingEvent(c,{sourceId:`BASE:${cardId}`,type:'revenue',amount:1000,round:3});
  recordVerifiedOperatingEvent(c,{sourceId:`NEXT:${cardId}`,type:'revenue',amount:1000,round:4});
  assert.equal(c.operatingLedger[0].amount,1000);
  assert.equal(c.operatingLedger[1].amount,1000+10*rate);
  assert.equal(c.retainedProfit,12000+10*rate);
 });
}
