import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,purchaseRealEstate,auditCash,validateState,passiveIncome,finishTurn} from '../src/engine.js';
import {REAL_ESTATE,realEstateOffer} from '../src/real-estate.js';
function offer(id, cash=150000) {
 const s=createGame(1);s.cash=cash;s.initialCash=cash;s.turn=1;s.pending=true;s.lastTile='GO';
 s.currentCard={id,category:'GO',status:'text_available',effectExecuted:false};
 s.cardEvents=[{id,turn:1,circuit:'inner',position:7,status:'text_available',resolution:'pending',financialEffect:false}];return s;
}
test('oito imóveis possuem valores inteiros e códigos oficiais',()=>{
 assert.equal(REAL_ESTATE.length,8);for(const a of REAL_ESTATE){assert.ok(a.cost>0);assert.ok(a.passive>=0);assert.equal(realEstateOffer({id:a.id,category:'GO'},'inner')?.cost,a.cost);}
 assert.equal(realEstateOffer({id:'GO-005',category:'GO'},'inner')?.cost,42000);
});
test('compra à vista debita valor, registra ativo, renda e reconcilia o caixa',()=>{
 const s=offer('GO-001');const n=purchaseRealEstate(s);
 assert.equal(n.cash,115000);assert.equal(s.cash,150000);assert.equal(n.assets[0].passive,350);
 assert.equal(passiveIncome(n),passiveIncome(s)+350);assert.equal(n.cardEvents[0].resolution,'purchase');assert.ok(auditCash(n).ok);assert.ok(validateState(n));
 assert.equal(finishTurn(n).pending,false);
});
test('nenhuma segunda compra da mesma ocorrência',()=>{
 const n=purchaseRealEstate(offer('GO-006'));assert.equal(n.assets[0].passive,0);
 assert.throws(()=>purchaseRealEstate(n),/Não há imóvel/);
});
test('caixa insuficiente e carta sem oferta não movimentam recursos',()=>{
 const s=offer('GO-008',100);assert.throws(()=>purchaseRealEstate(s),/Caixa insuficiente/);assert.equal(s.cash,100);
 assert.throws(()=>purchaseRealEstate(offer('GO-999')),/Não há imóvel/);
});
test('oferta não está disponível na Alta Velocidade ou fora de casa GO',()=>{
 const s=offer('GO-001');s.circuit='outer';assert.throws(()=>purchaseRealEstate(s),/Não há imóvel/);
});
