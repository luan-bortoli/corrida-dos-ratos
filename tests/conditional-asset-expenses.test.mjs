import test from 'node:test';
import assert from 'node:assert/strict';
import {executeConditionalAssetExpense} from '../src/official-effects.js';
import {cashBalanceCents} from '../src/money-balance.js';
const state=(assets,cash=100,cent=73)=>({cash,secondaryCashCents:cent,assets,arrearsLiving:0,arrearsLivingCents:0});
test('três cartas têm valores fixos e imóveis elegíveis',()=>{
 for(const [id,value] of [['DI-021',120000],['DI-027',200000]]){
  const s=state([{id:'GO-001',source:'official_real_estate'}],3000,0);
  const r=executeConditionalAssetExpense(s,id);
  assert.equal(r.applicable,true);assert.equal(r.amountCents,value);assert.equal(cashBalanceCents(s),300000-value);
 }
});
test('equipamento de locação suporta DI-024',()=>{
 const s=state([{id:'PO-020',kind:'rental'}],700,0);
 const r=executeConditionalAssetExpense(s,'DI-024');assert.equal(r.paidCents,65000);assert.equal(cashBalanceCents(s),5000);
});
test('sem ativos elegíveis não há débito, obrigação ou novo sorteio',()=>{
 const s=state([{id:'PO-022',kind:'resale'}]);const before=structuredClone(s);
 const r=executeConditionalAssetExpense(s,'DI-024');assert.equal(r.applicable,false);assert.deepEqual(s,before);
});
test('despesa usa centavos e registra obrigação exata',()=>{
 const s=state([{id:'GO-003',source:'official_real_estate'}]);
 const r=executeConditionalAssetExpense(s,'DI-021');assert.equal(r.paidCents,10073);assert.equal(r.unpaidCents,109927);
 assert.equal(s.arrearsLivingCents,109927);assert.equal(cashBalanceCents(s),0);
});
test('dois imóveis não duplicam cobrança na mesma ocorrência',()=>{
 const s=state([{id:'GO-001',source:'official_real_estate'},{id:'GO-003',source:'official_real_estate'}],3000,0);
 const r=executeConditionalAssetExpense(s,'DI-021');assert.equal(r.eligibleAssetCount,2);assert.equal(cashBalanceCents(s),180000);
});
test('cartas sem mecanismo suportado não movimentam caixa',()=>{
 const s=state([{id:'GO-001',source:'official_real_estate'}]);const before=structuredClone(s);
 assert.equal(executeConditionalAssetExpense(s,'DI-022'),null);assert.deepEqual(s,before);
});
