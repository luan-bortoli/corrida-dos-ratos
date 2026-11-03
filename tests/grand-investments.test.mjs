import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,purchaseGrandInvestment,quoteGrandInvestmentFinance,validateState,auditCash} from '../src/engine.js';
import {GRAND_INVESTMENTS} from '../src/grand-investments.js';
function state(offer,cash=500000){const s=createGame(1);s.circuit='outer';s.turn=2;s.lastTile='GI';s.pending=true;s.currentCard={id:offer.id,category:'GI',status:'text_available'};s.cash=cash;s.initialCash=cash;s.ledger=[];s.secondaryCashCents=19;s.cardEvents=[{id:offer.id,turn:2,circuit:'outer',position:1,status:'text_available',resolution:'pending',financialEffect:false}];return s;}
for(const offer of GRAND_INVESTMENTS){
 test(`${offer.id} aquisição à vista, renda e contabilidade corretas`,()=>{const s=state(offer);const result=purchaseGrandInvestment(s);assert.equal(result.cash,s.cash-offer.cost);assert.equal(result.secondaryCashCents,19);assert.equal(result.assets[0].passive,['company','participation'].includes(offer.kind)?0:offer.referencePassive);assert.equal(result.cardEvents[0].resolution,'purchase');assert.ok(validateState(result));assert.ok(auditCash(result).ok);assert.throws(()=>purchaseGrandInvestment(result),/disponível/);});
}
test('GI: sem caixa, entrada menor que mínimo ou prazo inválido não contrata',()=>{const o=GRAND_INVESTMENTS[0];const s=state(o,100);assert.throws(()=>purchaseGrandInvestment(s),/Caixa insuficiente/);assert.equal(quoteGrandInvestmentFinance(s,12,100).eligible,false);assert.equal(quoteGrandInvestmentFinance(state(o),7,54000).eligible,false);});
test('GI: valores e tipos transcritos para dezoito cartas',()=>{assert.equal(GRAND_INVESTMENTS.length,25);assert.equal(GRAND_INVESTMENTS[7].referencePassive,0);assert.equal(GRAND_INVESTMENTS[17].cost,310000);assert.equal(GRAND_INVESTMENTS.filter(x=>x.kind==='company').length,8);});
