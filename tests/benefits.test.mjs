import test from 'node:test';import assert from 'node:assert/strict';
import {executeOfficialCashBenefit} from '../src/official-effects.js';
import {createGame,rollTurn,finishTurn,validateState,auditCash} from '../src/engine.js';
test('seis benefícios com recompensas oficiais, sem executar os condicionais',()=>{
 const cases=[['BE-001',525],['BE-002',350],['BE-004',400],['BE-006',700],['BE-008',175],['BE-010',350]];
 for(const [id,expected] of cases){const s={cash:0};assert.equal(executeOfficialCashBenefit(s,id,3500).amount,expected);assert.equal(s.cash,expected);}
 const g=createGame(3);assert.equal(executeOfficialCashBenefit(g,'BE-003',3500).kind,'temporary_saving');
});
test('benefício automático integrado ao turno com extrato reconciliado',()=>{
 let g=createGame(3);g.position=10;g.catalogDecks={'inner:BE':['BE-001']};const previous=g.cash;g=rollTurn(g,1);
 assert.equal(g.currentCard.id,'BE-001');assert.equal(g.cash,previous+525);
 assert.equal(g.cardEvents.at(-1).resolution,'automatic');assert.equal(auditCash(g).ok,true);assert.equal(validateState(g),true);
 g=finishTurn(g);assert.equal(g.cash,previous+525);
});
