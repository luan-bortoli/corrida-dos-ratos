import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,chooseLifeEvent,auditCash,lifeDecision} from '../src/engine.js';
function pending(id,circuit='inner',cash=20000){const s=createGame(1);s.cash=cash;s.ledgerBaseline=cash-s.initialCash+s.initialCash;s.initialCash=cash;s.circuit=circuit;s.lastTile='EV';s.pending=true;s.currentCard={id,category:'EV',status:'text_available'};s.turn=1;s.cardEvents=[{id,turn:1,circuit,position:1,status:'text_available',resolution:'pending',financialEffect:false}];return s;}
test('aceite de trabalho temporário gera apenas crédito pontual',()=>{const s=pending('EV-006');const n=chooseLifeEvent(s,'accept');assert.ok(n.cash>s.cash);assert.equal(n.cardEvents[0].resolution,'decision');assert.equal(auditCash(n).ok,true);assert.throws(()=>chooseLifeEvent(n,'accept'));});
test('recusa não movimenta caixa',()=>{const s=pending('EV-011');const n=chooseLifeEvent(s,'reject');assert.equal(n.cash,s.cash);assert.equal(n.ledger.length,0);});
test('desembolso exige caixa, sem alterar original',()=>{const s=pending('EV-027','outer',100);assert.throws(()=>chooseLifeEvent(s,'accept'),/Caixa insuficiente/);assert.equal(s.cash,100);});
test('decisão de despesa mensal afeta próximos fechamentos',()=>{const s=pending('EV-022','outer');const n=chooseLifeEvent(s,'accept');assert.equal(n.baseExpenses,s.baseExpenses+300);assert.equal(n.cash,s.cash);});
test('atividades sociais não concedem recompensa inventada',()=>{for(const id of ['EV-026','EV-029']){const s=pending(id,'outer');const n=chooseLifeEvent(s,'accept');assert.equal(n.cash,s.cash);assert.equal(n.baseExpenses,s.baseExpenses);}});
test('todas as nove decisões possuem rótulos e circuito',()=>{for(const id of ['EV-006','EV-011'])assert.ok(lifeDecision(id,'inner'));for(const id of ['EV-019','EV-021','EV-022','EV-026','EV-027','EV-029','EV-030'])assert.ok(lifeDecision(id,'outer'));assert.equal(lifeDecision('EV-001','inner'),null);});
