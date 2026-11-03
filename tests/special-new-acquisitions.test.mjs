import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,purchaseSpecialOpportunity,quoteSpecialOpportunityFinance,auditCash,validateState} from '../src/engine.js';
import {SPECIAL_ACQUISITIONS} from '../src/special-opportunities.js';
function fixture(id,cash=250000){const s=createGame(1);s.circuit='outer';s.turn=2;s.lastTile='OE';s.pending=true;s.cash=cash;s.initialCash=cash;s.ledger=[];s.ledgerBaseline=cash;s.secondaryCashCents=27;s.currentCard={id,category:'OE'};s.cardEvents=[{id,turn:2,circuit:'outer',position:1,status:'text_available',resolution:'pending',financialEffect:false}];return s;}
for(const id of ['OE-010','OE-017','OE-020']){
 test(`${id}: aquisição à vista e escrituração sem lucro fictício`,()=>{
  const s=fixture(id),offer=SPECIAL_ACQUISITIONS.find(x=>x.id===id);const next=purchaseSpecialOpportunity(s);
  assert.equal(next.assets[0].id,id);assert.equal(next.cash,s.cash-offer.cost);assert.equal(next.secondaryCashCents,27);
  assert.equal(next.cardEvents[0].resolution,'purchase');assert.ok(validateState(next));assert.ok(auditCash(next).ok);
  if(id!=='OE-010'){assert.equal(next.assets[0].passive,0);assert.throws(()=>purchaseSpecialOpportunity(s,{term:12,downPayment:offer.cost/2}),/não admite/);}
 });
}
test('OE-010 exige entrada mínima de 40% e análise de crédito antes de financiar',()=>{
 const s=fixture('OE-010',50000);
 assert.equal(quoteSpecialOpportunityFinance(s,12,33999).eligible,false);
 assert.equal(quoteSpecialOpportunityFinance(s,12,51000).eligible,false);
 assert.throws(()=>purchaseSpecialOpportunity(s,{term:12,downPayment:34000}),/Parcelas|Margem|obrigações|Caixa|crédito|renda/i);
});
test('OE-010 não permite nova compra após resolução e não debita caixa insuficiente',()=>{
 const s=fixture('OE-010',85000);const result=purchaseSpecialOpportunity(s);
 assert.throws(()=>purchaseSpecialOpportunity(result),/pendente/);
 assert.throws(()=>purchaseSpecialOpportunity(fixture('OE-010',84999)),/Caixa/);
});
test('OE-010: financiamento aprovado cria dívida em centavos e paga apenas a entrada',()=>{
 const s=fixture('OE-010',50000);s.initialPassive=30000;
 const q=quoteSpecialOpportunityFinance(s,12,34000);
 assert.equal(q.eligible,true);
 const next=purchaseSpecialOpportunity(s,{term:12,downPayment:34000});
 assert.equal(next.cash,16000);assert.equal(next.secondaryCashCents,27);
 assert.equal(next.loans[0].balanceCents,5100000);assert.equal(next.assets[0].loanId,next.loans[0].id);
 assert.equal(next.cardEvents[0].resolution,'purchase');assert.ok(auditCash(next).ok);assert.ok(validateState(next));
});
