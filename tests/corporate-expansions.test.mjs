import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,validateState,auditCash} from '../src/engine.js';
import {proposeCorporateExpansion,executeApprovedCorporateExpansion,eligibleCorporateExpansions,CORPORATE_EXPANSIONS} from '../src/corporate-expansions.js';
import {castVote} from '../src/governance.js';
function room(cardId,shares={a:100},name='Agência de Serviços Digitais'){
 const players=['a','b'].map(id=>{const game=createGame(1);game.cash=20000;game.initialCash=20000;return {id,game};});
 const g=players[0].game;g.circuit='outer';g.pending=true;g.lastTile='OE';g.currentCard={id:cardId,category:'OE'};
 g.cardEvents=[{id:cardId,turn:1,circuit:'outer',position:1,status:'text_available',resolution:'pending',financialEffect:false}];
 return {round:1,players,companies:[{id:'co',name,cash:120000,retainedProfit:20000,shares,history:[],operatingLedger:[],pendingExpenses:0,reserveRequired:1000}]};
}
test('expansão de empresa integral: dinheiro empresarial e previsão, sem caixa pessoal nem lucro inventado',()=>{
 const r=room('OE-005'),c=r.companies[0],before=r.players[0].game.cash;
 const result=proposeCorporateExpansion(r,'a','co','OE-005');
 assert.equal(result.spent,25000);assert.equal(c.cash,95000);assert.equal(c.retainedProfit,20000);
 assert.equal(c.forecastMultiplierBps,11500);assert.equal(c.capitalImprovements[0].firstEligibleRound,2);
 assert.equal(r.players[0].game.cash,before);assert.ok(validateState(r.players[0].game));assert.ok(auditCash(r.players[0].game).ok);
});
test('sociedade: proposta requer aprovação acima de 50% e executa uma vez',()=>{
 const r=room('OE-005',{a:60,b:40});const c=r.companies[0];
 const p=proposeCorporateExpansion(r,'a','co','OE-005');assert.equal(c.cash,120000);assert.equal(p.status,'voting');
 const resolution=castVote(r,'a',p.proposalId,'yes');assert.equal(resolution.status,'approved');
 executeApprovedCorporateExpansion(r,p.proposalId);assert.equal(c.cash,95000);
 assert.equal(executeApprovedCorporateExpansion(r,p.proposalId),null);assert.equal(c.cash,95000);
 assert.equal(r.players[0].game.cardEvents[0].resolution,'corporate_expansion');assert.ok(validateState(r.players[0].game));
});
test('votos não aprovados não movimentam caixa empresarial',()=>{
 const r=room('OE-005',{a:40,b:60});const p=proposeCorporateExpansion(r,'a','co','OE-005');
 castVote(r,'a',p.proposalId,'yes');assert.equal(r.proposals[0].status,'open');
 castVote(r,'b',p.proposalId,'no');executeApprovedCorporateExpansion(r,p.proposalId);
 assert.equal(r.companies[0].cash,120000);assert.equal(r.proposals[0].status,'rejected');
 assert.ok(validateState(r.players[0].game));
});
test('validações: carta pendente, empresa elegível, caixa e proposta única',()=>{
 const r=room('OE-019');r.companies[0].retainedProfit=0;
 assert.deepEqual(eligibleCorporateExpansions(r,'a','OE-019'),[]);
 assert.throws(()=>proposeCorporateExpansion(r,'a','co','OE-019'),/elegibilidade/);
 const r2=room('OE-005');r2.companies[0].cash=1000;
 assert.throws(()=>proposeCorporateExpansion(r2,'a','co','OE-005'),/insuficiente/);
 assert.equal(Object.keys(CORPORATE_EXPANSIONS).length,7);
});
