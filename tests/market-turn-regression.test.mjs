import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,finishTurn,validateState,auditCash} from '../src/engine.js';
import {applyGlobalMarketEvent,GLOBAL_MARKET_EVENTS,GLOBAL_INCOME_EVENTS,GLOBAL_SECURITY_EVENTS} from '../src/global-market.js';

function fixture(cardId){
 const g=createGame(1,'TRAVEL');
 g.pending=true;g.turn=1;
 g.lastTile='MF';
 g.currentCard={id:cardId,category:'MF',status:'text_available'};
 g.cardEvents.push({id:cardId,turn:g.turn,circuit:g.circuit,position:g.position,status:'text_available',resolution:'pending',financialEffect:false});
 const other=createGame(2,'TRAVEL');
 return {round:4,players:[{id:'a',game:g},{id:'b',game:other}]};
}

test('MF-005 não bloqueia o encerramento do turno após evento global automático',()=>{
 const room=fixture('MF-005');
 assert.equal(validateState(room.players[0].game),true);
 applyGlobalMarketEvent(room,'MF-005');
 assert.equal(room.players[0].game.cardEvents.at(-1).resolution,'automatic');
 assert.equal(auditCash(room.players[0].game).ok,true,'o servidor precisa aceitar o estado antes do comando end');
 const finished=finishTurn(room.players[0].game);
 assert.equal(finished.pending,false);
 assert.equal(auditCash(finished).ok,true);
});

test('todos os eventos de mercado globais deixam o turno financeiramente válido',()=>{
 const ids=new Set([...Object.keys(GLOBAL_MARKET_EVENTS),...Object.keys(GLOBAL_INCOME_EVENTS),...Object.keys(GLOBAL_SECURITY_EVENTS),'MF-009']);
 for(const id of ids){
  const room=fixture(id);
  applyGlobalMarketEvent(room,id);
  assert.equal(validateState(room.players[0].game),true,`estado inválido depois de ${id}`);
  assert.equal(auditCash(room.players[0].game).ok,true,`auditoria bloqueou ${id}`);
  assert.equal(validateState(finishTurn(room.players[0].game)),true,`end bloqueado para ${id}`);
 }
});

test('resoluções automáticas desconhecidas continuam proibidas',()=>{
 const room=fixture('MF-005');room.players[0].game.cardEvents.at(-1).resolution='automatic';room.players[0].game.cardEvents.at(-1).id='PO-001';
 assert.equal(validateState(room.players[0].game),false);
});
