import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cashBalanceCents,debitCashCents,creditCashCents,transferCashCents,setCashBalanceCents} from '../src/money-balance.js';
import {purchaseOfficialSmallBusiness,createGame} from '../src/engine.js';

test('débito preserva o complemento em centavos',()=>{
 const g={cash:120,secondaryCashCents:73};debitCashCents(g,12000);
 assert.equal(g.cash,0);assert.equal(g.secondaryCashCents,73);assert.equal(cashBalanceCents(g),73);
});
test('crédito produz carry exato entre centavos e reais',()=>{
 const g={cash:4,secondaryCashCents:99};creditCashCents(g,2);
 assert.deepEqual([g.cash,g.secondaryCashCents],[5,1]);
});
test('transferência com centavos conserva o total das duas carteiras',()=>{
 const a={cash:1,secondaryCashCents:5},b={cash:0,secondaryCashCents:98};
 const sum=cashBalanceCents(a)+cashBalanceCents(b);
 transferCashCents(a,b,104);
 assert.equal(cashBalanceCents(a),1);assert.equal(cashBalanceCents(b),202);assert.equal(cashBalanceCents(a)+cashBalanceCents(b),sum);
});
test('transferência inválida não modifica nenhum saldo',()=>{
 const a={cash:1,secondaryCashCents:5},b={cash:0,secondaryCashCents:98};
 const before=JSON.stringify([a,b]);assert.throws(()=>transferCashCents(a,b,106));
 assert.equal(JSON.stringify([a,b]),before);
});
test('não aceita complemento incorreto nem overflow',()=>{
 assert.throws(()=>debitCashCents({cash:1,secondaryCashCents:100},1));
 assert.throws(()=>creditCashCents({cash:Math.floor(Number.MAX_SAFE_INTEGER/100),secondaryCashCents:90},100));
 assert.throws(()=>setCashBalanceCents({cash:0},-1));
});
