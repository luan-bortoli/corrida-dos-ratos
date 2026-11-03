import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,validateState,auditCash} from '../src/engine.js';
import {proposeCorporateRenegotiation,executeApprovedCorporateRenegotiation,settleCorporateLoans} from '../src/corporate-renegotiation.js';
import {castVote} from '../src/governance.js';
function setup(shares={a:100}){
 const players=['a','b'].map(id=>({id,game:createGame(1)}));
 const g=players[0].game;g.pending=true;g.circuit='outer';g.lastTile='OE';g.currentCard={id:'OE-015',category:'OE',effectExecuted:false};
 g.cardEvents=[{id:'OE-015',turn:1,circuit:'outer',position:1,status:'text_available',resolution:'pending',financialEffect:false}];
 return {round:1,players,companies:[{id:'company',name:'Loja',pendingExpenses:2000,retainedProfit:5000,cash:3000,reserveRequired:1000,shares,history:[],operatingLedger:[],distributions:[]}]};
}
test('OE-015 empresa integral: substitui obrigação sem gerar dinheiro novo ou cobrar duas vezes',()=>{
 const r=setup();const a=r.players[0].game.cash;const result=proposeCorporateRenegotiation(r,'a','company',6);
 assert.equal(result.status,'executed');const c=r.companies[0];assert.equal(c.pendingExpenses,0);assert.equal(c.cash,3000);
 assert.equal(c.corporateLoans.length,1);assert.equal(c.corporateLoans[0].originalCents,200000);
 assert.equal(r.players[0].game.cash,a);assert.ok(validateState(r.players[0].game));assert.ok(auditCash(r.players[0].game).ok);
 assert.throws(()=>proposeCorporateRenegotiation(r,'a','company',6));
});
test('OE-015 sociedade exige votação superior a 50% antes da substituição',()=>{
 const r=setup({a:60,b:40});const result=proposeCorporateRenegotiation(r,'a','company',12);
 assert.equal(result.status,'voting');assert.equal(r.companies[0].pendingExpenses,2000);
 castVote(r,'a',result.proposalId,'yes');const done=executeApprovedCorporateRenegotiation(r,result.proposalId);
 assert.ok(done);assert.equal(r.companies[0].pendingExpenses,0);
 assert.equal(executeApprovedCorporateRenegotiation(r,result.proposalId),null);
 assert.equal(r.players[0].game.cardEvents[0].resolution,'corporate_expansion');
});
test('OE-015 rejeita propostas sem capacidade, sem dívida e prazo não autorizado',()=>{
 const r=setup();r.companies[0].retainedProfit=0;
 assert.throws(()=>proposeCorporateRenegotiation(r,'a','company',6),/capacidade/);
 const r2=setup();assert.throws(()=>proposeCorporateRenegotiation(r2,'a','company',18),/Prazo/);
 const r3=setup();r3.companies[0].pendingExpenses=0;assert.throws(()=>proposeCorporateRenegotiation(r3,'a','company',6),/elegível/);
});
test('OE-015 amortiza saldo no fechamento empresarial sem debitar sócios',()=>{
 const r=setup();proposeCorporateRenegotiation(r,'a','company',6);
 const c=r.companies[0],before=r.players[0].game.cash,principal=c.corporateLoans[0].balanceCents;
 const payment=settleCorporateLoans(c,9);
 assert.ok(payment.totalPaidCents>0);assert.ok(payment.totalInterestCents>0);
 assert.ok(c.corporateLoans[0].balanceCents<principal);
 assert.equal(r.players[0].game.cash,before);
 assert.equal(c.corporateLoans[0].periodsElapsed,1);
});
