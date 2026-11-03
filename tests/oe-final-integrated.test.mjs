import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,improveRentalProperty,finishTurn,rollTurn,resolveSpecialRefinancing,resolveExtraordinaryAmortization,validateState,auditCash} from '../src/engine.js';
import {ensureDiscountCompany,openDiscountOffer,acceptDiscountOffer,expireDiscountOffers} from '../src/discount-share-offer.js';
import {proposeCorporateRenegotiation,settleCorporateLoans} from '../src/corporate-renegotiation.js';

function onCard(id,cash=60000){
 const s=createGame(1);s.cash=cash;s.initialCash=cash;s.ledger=[];s.ledgerBaseline=cash;s.secondaryCashCents=37;
 s.turn=1;s.position=1;s.circuit='outer';s.pending=true;s.lastTile='OE';s.currentCard={id,category:'OE',status:'text_available',effectExecuted:false};
 s.cardEvents=[{id,turn:s.turn,circuit:'outer',position:1,status:'text_available',resolution:'pending',financialEffect:false}];return s;
}
function roomForOffer(){const players=['a','b'].map(id=>({id,game:onCard('OE-012',100000)}));return {round:1,players,companies:[],externalSellerCash:0};}

test('OE-004: reforma mantém fração de caixa, registra aumento uma vez e impede nova execução da mesma carta',()=>{
 let s=onCard('OE-004',30000);s.assets=[{id:'GO-001',ownershipId:'apt',name:'Apartamento',cost:35000,passive:350,kind:'real_estate'}];
 s=improveRentalProperty(s,'apt');assert.equal(s.cash,10000);assert.equal(s.secondaryCashCents,37);
 assert.throws(()=>improveRentalProperty(s,'apt'));s=finishTurn(s);s.position=48;s=rollTurn(s,1);
 assert.equal(s.assets[0].passive,403);assert.equal(s.assets[0].pendingRentalBonus,0);assert.ok(validateState(s));assert.ok(auditCash(s).ok);
});
test('OE-012: preferência do sócio, liquidação íntegra em centavos e nenhuma segunda venda',()=>{
 const r=roomForOffer(),c=ensureDiscountCompany(r);c.shares.origin=80;c.shares.b=20;
 const offer=openDiscountOffer(r,'a');assert.throws(()=>acceptDiscountOffer(r,'a',offer.id),/preferência/);
 acceptDiscountOffer(r,'b',offer.id);assert.equal(c.shares.b,40);assert.equal(c.shares.origin,60);
 assert.equal(r.players[1].game.secondaryCashCents,37);assert.equal(r.players[1].game.ledger.at(-1).amountCents,-5100000);assert.equal(r.externalSellerCash,51000);
 assert.throws(()=>acceptDiscountOffer(r,'a',offer.id));assert.ok(auditCash(r.players[1].game).ok);
});
test('OE-012: expiração protege participação e não movimenta caixa de ninguém',()=>{
 const r=roomForOffer(),o=openDiscountOffer(r,'a');r.round=o.expiresRound+1;expireDiscountOffers(r);
 assert.equal(o.status,'expired');assert.throws(()=>acceptDiscountOffer(r,'b',o.id));assert.equal(r.externalSellerCash,0);
 assert.equal(ensureDiscountCompany(r).shares.origin,100);assert.equal(r.players[0].game.cash,100000);
});
test('OE-014: refinanciamento substitui dívida sem dinheiro novo, mantém centavos e impede segunda troca da carta',()=>{
 const s=onCard('OE-014');s.initialDebtCents=0;s.initialArrearsCents=0;s.debt=0;s.arrearsLoan=0;s.installment=0;s.initialPassive=12000;
 s.loans=[{id:'loan1',original:1000,originalCents:100000,balance:1000,balanceCents:100000,installment:180,installmentCents:18000,term:6,arrears:0,arrearsCents:0,periodsElapsed:1}];
 const next=resolveSpecialRefinancing(s,'loan1',24);assert.equal(next.cash,60000);assert.equal(next.secondaryCashCents,37);
 assert.equal(next.loans.length,1);assert.equal(next.loans[0].balanceCents,100000);
 assert.throws(()=>resolveSpecialRefinancing(next,next.loans[0].id,24));assert.ok(validateState(next));assert.ok(auditCash(next).ok);
});
test('OE-015: conversão empresarial e cobrança parcial preservam dívida, juros e caixa pessoal',()=>{
 const g=onCard('OE-015');const company={id:'co',name:'Empresa',pendingExpenses:2000,retainedProfit:5000,cash:100,reserveRequired:1000,shares:{a:100},history:[],operatingLedger:[],distributions:[]};
 const r={round:1,players:[{id:'a',game:g}],companies:[company]};const before=g.cash;
 const result=proposeCorporateRenegotiation(r,'a','co',6);assert.equal(result.status,'executed');assert.equal(company.pendingExpenses,0);
 const balance=company.corporateLoans[0].balanceCents;const paid=settleCorporateLoans(company,9);
 assert.ok(paid.totalInterestCents>0);assert.ok(paid.totalPaidCents>0);assert.ok(company.corporateLoans[0].arrearsCents>0);
 assert.ok(company.corporateLoans[0].balanceCents>balance-paid.totalPaidCents);assert.equal(g.cash,before);
 assert.throws(()=>proposeCorporateRenegotiation(r,'a','co',6));assert.ok(validateState(g));assert.ok(auditCash(g).ok);
});
test('OE-016: amortização única de dívida inicial preserva valor fracionário e conciliação',()=>{
 const s=onCard('OE-016',5000);const debt=s.initialDebtCents;
 const next=resolveExtraordinaryAmortization(s,'initial',1000);
 assert.equal(next.initialDebtCents,debt-100000);assert.equal(next.secondaryCashCents,37);
 assert.throws(()=>resolveExtraordinaryAmortization(next,'initial',1000));assert.ok(validateState(next));assert.ok(auditCash(next).ok);
});
