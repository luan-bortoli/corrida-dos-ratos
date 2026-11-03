import test from 'node:test';
import assert from 'node:assert/strict';
import {expenseQuoteOuter,executeOuterPersonalExpense,executeAutomaticLifeEvent} from '../src/official-effects.js';
import {createGame,rollTurn,finishTurn,auditCash,validateState} from '../src/engine.js';

test('alta velocidade: somente sete despesas pessoais proporcionais elegíveis',()=>{
 const expected={'DI-023':10,'DI-026':20,'DI-028':10,'DI-030':30,'DI-032':5,'DI-033':10,'DI-035':20};
 for(const [id,percent] of Object.entries(expected))assert.deepEqual(expenseQuoteOuter(id,3500),{percent,amount:3500*percent/100});
 for(const id of ['DI-021','DI-022','DI-024','DI-025','DI-027','DI-029','DI-031','DI-034'])assert.equal(expenseQuoteOuter(id,3500),null);
});
test('despesa de Alta Velocidade respeita o caixa e cria pendência',()=>{
 const s={cash:100,arrearsLiving:20};const r=executeOuterPersonalExpense(s,'DI-030',3500);
 assert.equal(r.amount,1050);assert.equal(r.paid,100);assert.equal(s.cash,0);assert.equal(s.arrearsLiving,970);
});
test('DI-023 na Alta Velocidade registra uma só cobrança no extrato',()=>{
 let s=createGame(3);s.circuit='outer';s.position=3;s.catalogDecks={'outer:DI':['DI-023']};
 const before=s.cash;s=rollTurn(s,1);
 assert.equal(s.currentCard.id,'DI-023');assert.equal(s.cash,before-350);assert.equal(s.cardEvents.at(-1).resolution,'automatic');assert.equal(auditCash(s).ok,true);
 s=finishTurn(s);assert.equal(s.cash,before-350);
});
test('EV-001 promove salário sem mudar salário de referência',()=>{
 let s=createGame(3);s.position=5;s.catalogDecks={'inner:EV':['EV-001']};s=rollTurn(s,1);
 assert.equal(s.salaryMultiplierBasisPoints,10800);assert.equal(s.cardEvents.at(-1).resolution,'automatic');
 assert.equal(validateState(s),true);
});
test('EV-005 aumenta despesas mensais e não cria cobrança à vista',()=>{
 let s=createGame(3);s.position=5;s.catalogDecks={'inner:EV':['EV-005']};const before=s.baseExpenses, cash=s.cash;
 s=rollTurn(s,1);assert.equal(s.baseExpenses,before+175);assert.equal(s.cash,cash);assert.equal(auditCash(s).ok,true);
});
test('EV-013 concede bonificação pontual com lançamento no extrato',()=>{
 let s=createGame(3);s.position=5;s.catalogDecks={'inner:EV':['EV-013']};const before=s.cash;
 s=rollTurn(s,1);assert.equal(s.cash,before+700);assert.equal(auditCash(s).ok,true);
 assert.equal(s.ledger.filter(x=>x.kind==='life_bonus').length,1);
});
test('eventos de escolha não se executam automaticamente',()=>{
 const s=createGame(3),cash=s.cash,expenses=s.baseExpenses;
 assert.equal(executeAutomaticLifeEvent(s,'EV-002',3500),null);
 assert.equal(s.cash,cash);assert.equal(s.baseExpenses,expenses);
});
