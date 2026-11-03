import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollTurn,chooseLifeEvent,finishTurn,validateState} from '../src/engine.js';
import {lifeDecision} from '../src/life-decisions.js';
import {executeAutomaticLifeEvent,executeOfficialCashBenefit} from '../src/official-effects.js';
import {livingDueForClosure,finalizeBudgetClosing,ensureBudget,applyScheduledSalary} from '../src/personal-budget.js';
function event(id,circuit='inner'){
 const s=createGame(3);s.circuit=circuit;s.pending=true;s.lastTile='EV';s.currentCard={id,category:'EV',status:'text_available'};
 s.cardEvents=[{id,resolution:'pending',financialEffect:false}];return s;
}
test('lote de 15 decisões novas mantém opções explícitas por circuito',()=>{
 const inner=['EV-002','EV-003','EV-004','EV-007','EV-010','EV-012','EV-014','EV-015'];
 const outer=['EV-016','EV-017','EV-020','EV-023','EV-025','EV-028'];
 for(const id of inner)assert.ok(lifeDecision(id,'inner'),id);
 for(const id of outer)assert.ok(lifeDecision(id,'outer'),id);
 assert.equal(lifeDecision('EV-020','inner'),null);
});
test('descontos permanentes por categoria não alteram outras categorias',()=>{
 const g=event('EV-007');const after=chooseLifeEvent(g,'accept');
 assert.equal(after.expenseCategories.transport,255);
 assert.equal(after.baseExpenses,g.baseExpenses-45);
 assert.equal(after.cardEvents[0].resolution,'decision');
});
test('curso de qualificação cobra uma vez e ativa aumento salarial no segundo fechamento seguinte',()=>{
 const g=event('EV-002');const a=chooseLifeEvent(g,'accept');
 assert.equal(a.cash,g.cash-600);assert.equal(a.salaryMultiplierBasisPoints,undefined);
 a.closures=0;applyScheduledSalary(a);assert.equal(a.salaryMultiplierBasisPoints,undefined);
 a.closures=1;applyScheduledSalary(a);assert.equal(a.salaryMultiplierBasisPoints,10500);
 assert.throws(()=>chooseLifeEvent(a,'accept'));
});
test('EV-018 e EV-024 adicionam custos temporários e expiram exatamente no prazo',()=>{
 for(const [id,monthly,periods] of [['EV-018',500,3],['EV-024',250,4]]){
  const g=createGame(3);const base=g.baseExpenses;
  executeAutomaticLifeEvent(g,id,3500);
  for(let k=0;k<periods;k++){assert.equal(livingDueForClosure(g),base+monthly);finalizeBudgetClosing(g);}
  assert.equal(livingDueForClosure(g),base);
 }
});
test('benefício temporário não reduz permanentemente a base do orçamento',()=>{
 const g=createGame(3),baseline=g.baseExpenses;
 assert.equal(executeOfficialCashBenefit(g,'BE-003',3500).kind,'temporary_saving');
 assert.equal(livingDueForClosure(g),baseline-65);
 finalizeBudgetClosing(g);assert.equal(livingDueForClosure(g),baseline-65);
 finalizeBudgetClosing(g);assert.equal(livingDueForClosure(g),baseline);
 assert.equal(g.baseExpenses,baseline);
});
test('benefício de transporte e diagnóstico não criam recebimento fictício',()=>{
 const g=createGame(3),cash=g.cash;
 assert.equal(executeOfficialCashBenefit(g,'BE-005',3500).amount,0);
 assert.equal(g.expenseCategories.transport,270);
 assert.equal(executeOfficialCashBenefit(g,'BE-007',3500).kind,'financial_diagnosis');
 assert.equal(g.cash,cash);assert.equal(g.financialConsultationAvailable,true);
});
test('decisão rejeitada preserva caixa e orçamento',()=>{
 const g=event('EV-028','outer');const after=chooseLifeEvent(g,'reject');
 assert.equal(after.cash,g.cash);assert.equal(after.baseExpenses,g.baseExpenses);
 assert.equal(after.cardEvents.at(-1).choice,'reject');
});

test('decisão de vida funciona em turno realmente sorteado e mantém estado válido',()=>{
 let g=createGame(3);g.position=5;g.catalogDecks={'inner:EV':['EV-007']};g=rollTurn(g,1);assert.equal(g.currentCard.id,'EV-007');
 g=chooseLifeEvent(g,'accept');assert.equal(validateState(g),true);g=finishTurn(g);assert.equal(validateState(g),true);
});
test('responsabilidade familiar modifica alimentação, sem atribuir diferença a moradia',()=>{
 const g=createGame(3),before=g.baseExpenses;
 const r=executeAutomaticLifeEvent(g,'EV-005',3500);
 assert.equal(r.amount,175);assert.equal(g.expenseCategories.food,825);
 assert.equal(g.expenseCategories.housing,1000);assert.equal(g.baseExpenses,before+175);
});
test('alternativas com despesa não alteram o saldo quando não há recursos',()=>{
 const g=event('EV-017','outer');g.cash=100;
 assert.throws(()=>chooseLifeEvent(g,'accept'),/Caixa insuficiente/);
 assert.equal(g.cash,100);
});
