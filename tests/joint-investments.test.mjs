import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,validateState,auditCash} from '../src/engine.js';
import {openJointInvestment,acceptJointInvestment,declineJointInvestment,expireJointInvestments} from '../src/joint-investments.js';
import {GRAND_PARTICIPATIONS} from '../src/grand-investments.js';
function room(){const players=['a','b','c'].map(id=>{const game=createGame(1);game.cash=250000;game.initialCash=250000;game.secondaryCashCents=0;game.circuit='outer';game.pending=false;return {id,game};});const g=players[0].game;g.pending=true;g.lastTile='GI';g.currentCard={id:'GI-019',category:'GI'};g.cardEvents=[{id:'GI-019',turn:1,circuit:'outer',position:1,status:'text_available',resolution:'pending',financialEffect:false}];return {round:1,players,jointInvestments:[]};}
test('proposta em GI: cartão, convites e aceite até total; compra conjunta sem dividendos fictícios',()=>{const r=room(),p=openJointInvestment(r,'a',40000,['b','c']);assert.equal(p.status,'open');assert.equal(r.players[0].game.cash,250000);acceptJointInvestment(r,'b',p.id,60000);assert.equal(p.status,'settled');assert.deepEqual(r.players.slice(0,2).map(x=>x.game.cash),[210000,190000]);assert.deepEqual(r.players.slice(0,2).map(x=>x.game.assets.at(-1).percent),[8,12]);assert.equal(r.players[0].game.cardEvents[0].resolution,'joint_purchase');for(const x of r.players){assert.ok(validateState(x.game));assert.ok(auditCash(x.game).ok);}});
test('aportes abaixo do preço não movimentam dinheiro',()=>{const r=room(),p=openJointInvestment(r,'a',20000,['b']);acceptJointInvestment(r,'b',p.id,30000);assert.equal(p.status,'open');assert.equal(r.players[0].game.cash,250000);assert.equal(r.players[1].game.cash,250000);});
test('não aceita excesso, não convidado, duplicação nem aporte negativo',()=>{const r=room(),p=openJointInvestment(r,'a',40000,['b']);assert.throws(()=>acceptJointInvestment(r,'c',p.id,60000),/convite/);assert.throws(()=>acceptJointInvestment(r,'b',p.id,60001),/excedem/);assert.throws(()=>acceptJointInvestment(r,'b',p.id,-1),/inválido/);acceptJointInvestment(r,'b',p.id,60000);assert.throws(()=>acceptJointInvestment(r,'b',p.id,1),/indisponível/);});
test('saldo de convidado insuficiente impede liquidação e preserva todos os caixas',()=>{const r=room(),p=openJointInvestment(r,'a',40000,['b']);r.players[1].game.cash=30;assert.throws(()=>acceptJointInvestment(r,'b',p.id,60000),/insuficiente/);assert.equal(r.players[0].game.cash,250000);assert.equal(p.status,'open');});
test('expiração após duas rodadas e recusa não debitam',()=>{const r=room(),p=openJointInvestment(r,'a',40000,['b']);declineJointInvestment(r,'b',p.id);assert.throws(()=>acceptJointInvestment(r,'b',p.id,60000),/convite/);r.round=4;expireJointInvestments(r);assert.equal(p.status,'expired');assert.equal(r.players[0].game.cash,250000);});
test('todas as sete participações preservam dados oficiais',()=>{assert.equal(GRAND_PARTICIPATIONS.length,7);assert.equal(GRAND_PARTICIPATIONS.reduce((a,b)=>a+b.percent,0),155);});

for(const [id,cost,percent] of [['OE-017',100000,20],['OE-020',150000,15]]){
 test(`${id}: compra coletiva com preço e participação oficiais`,()=>{
  const r=room();r.players[0].game.lastTile='OE';r.players[0].game.currentCard={id,category:'OE'};r.players[0].game.cardEvents=[{id,turn:1,circuit:'outer',position:1,status:'text_available',resolution:'pending',financialEffect:false}];
  const p=openJointInvestment(r,'a',cost*2/5,['b']);
  assert.equal(p.status,'open');assert.equal(r.players[0].game.cash,250000);
  acceptJointInvestment(r,'b',p.id,cost*3/5);
  assert.equal(p.status,'settled');assert.equal(r.players[0].game.assets.at(-1).percent,percent*2/5);
  assert.equal(r.players[1].game.assets.at(-1).percent,percent*3/5);
  assert.equal(r.players[0].game.cardEvents.at(-1).resolution,'joint_purchase');
  assert.equal(r.players[0].game.assets.at(-1).passive,0);
  for(const person of r.players){assert.ok(validateState(person.game));assert.ok(auditCash(person.game).ok);}
 });
}
test('OE coletiva recusada não bloqueia recurso e não debita o caixa',()=>{const r=room();const g=r.players[0].game;g.lastTile='OE';g.currentCard={id:'OE-017',category:'OE'};g.cardEvents=[{id:'OE-017',resolution:'pending',financialEffect:false}];const p=openJointInvestment(r,'a',40000,['b']);declineJointInvestment(r,'b',p.id);assert.equal(g.cash,250000);assert.equal(p.status,'open');r.round=4;expireJointInvestments(r);assert.equal(p.status,'expired');});

for(const [id,cost,income] of [['OE-007',120000,900],['OE-009',180000,1500]]){
 test(`${id}: dois estudantes integralizam o projeto e recebem renda inicial proporcional`,()=>{
  const r=room();const g=r.players[0].game;g.lastTile='OE';g.currentCard={id,category:'OE'};g.cardEvents=[{id,turn:1,circuit:'outer',position:1,status:'text_available',resolution:'pending',financialEffect:false}];
  const p=openJointInvestment(r,'a',cost*2/5,['b']);
  assert.equal(p.status,'open');assert.equal(r.players[0].game.cash,250000);
  acceptJointInvestment(r,'b',p.id,cost*3/5);
  assert.equal(p.status,'settled');
  assert.deepEqual(r.players.slice(0,2).map(x=>x.game.assets.at(-1).passive),[income*2/5,income*3/5]);
  assert.deepEqual(r.players.slice(0,2).map(x=>x.game.assets.at(-1).percent),[40,60]);
  assert.equal(r.players[0].game.cardEvents.at(-1).resolution,'joint_purchase');
  for(const player of r.players){assert.ok(validateState(player.game));assert.ok(auditCash(player.game).ok);}
 });
}
