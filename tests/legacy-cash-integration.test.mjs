import test from 'node:test';
import assert from 'node:assert/strict';
import {executeOfficialExpense,executeOuterPersonalExpense,executeOfficialCashBenefit,executeAutomaticLifeEvent} from '../src/official-effects.js';
import {cashBalanceCents} from '../src/money-balance.js';
import {resolveLifeDecision} from '../src/life-decisions.js';
import {createGame} from '../src/engine.js';

test('despesa obrigatória preserva centavos quando caixa cobre tudo',()=>{
 const s={cash:400,secondaryCashCents:73,arrearsLiving:0};
 const result=executeOfficialExpense(s,'DI-001',3500);
 assert.deepEqual([result.paid,result.unpaid,cashBalanceCents(s)],[350,0,5073]);
});
test('despesa parcial utiliza centavos e mantém pendência exata',()=>{
 const s={cash:100,secondaryCashCents:73,arrearsLiving:0};
 const result=executeOuterPersonalExpense(s,'DI-023',2000);
 assert.deepEqual([result.paid,result.unpaid,cashBalanceCents(s),s.arrearsLivingCents],[100.73,99.27,0,9927]);
});
test('benefício é creditado sem eliminar os centavos existentes',()=>{
 const s={cash:100,secondaryCashCents:73};
 executeOfficialCashBenefit(s,'BE-004',3500);
 assert.equal(cashBalanceCents(s),50073);
});
test('decisão de custo pessoal deixa os centavos complementares intactos',()=>{
 const s=createGame(0);
 s.cash=5001;s.secondaryCashCents=73;s.circuit='outer';s.pending=true;s.lastTile='EV';
 s.currentCard={id:'EV-019',category:'EV',status:'text_available'};
 s.cardEvents=[{id:'evt',resolution:'pending'}];
 const out=resolveLifeDecision(s,'accept',3500);
 assert.equal(cashBalanceCents(out),173);
 assert.equal(cashBalanceCents(s),500173);
});
