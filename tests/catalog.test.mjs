import test from 'node:test';
import assert from 'node:assert/strict';
import {CARD_CATALOG,CARD_COUNTS,cardsForTile,drawCatalogCard,validateCatalogDecks} from '../src/catalog.js';
import {createGame,rollTurn,finishTurn,auditCash,validateState} from '../src/engine.js';

test('230 unique official identifiers across ten groups',()=>{
 assert.equal(CARD_CATALOG.length,230);
 assert.equal(new Set(CARD_CATALOG.map(x=>x.id)).size,230);
 assert.equal(Object.values(CARD_COUNTS).reduce((a,b)=>a+b,0),230);
});
test('only categories belonging to a circuit are drawn',()=>{
 assert.equal(cardsForTile('GI','inner').length,0);
 assert.equal(cardsForTile('GI','outer').length,25);
 assert.equal(cardsForTile('PO','inner').length,25);
 assert.equal(cardsForTile('DI','outer').length,15);
 assert.equal(cardsForTile('DI','inner').length,20);
 assert.equal(cardsForTile('EF','inner').length,15);
});
test('draw without replacement; re-shuffle only after depletion',()=>{
 const s={};const seen=new Set();
 for(let i=0;i<15;i++){const card=drawCatalogCard(s,'EF','inner',()=>0.5);assert.ok(!seen.has(card.id));seen.add(card.id);assert.equal(card.effectExecuted,false);}
 assert.equal(s.catalogCycles['inner:EF'],0);
 drawCatalogCard(s,'EF','inner',()=>0.5);
 assert.equal(s.catalogCycles['inner:EF'],1);
});
test('inner and outer decks remain independent',()=>{
 const s={};drawCatalogCard(s,'DI','inner');drawCatalogCard(s,'DI','outer');
 assert.equal(s.catalogDecks['inner:DI'].length,19);
 assert.equal(s.catalogDecks['outer:DI'].length,14);
});
test('official card with unavailable text is safely inert',()=>{
 let s=createGame(8);s.position=2;s=rollTurn(s,1);
 assert.match(s.currentCard.id,/^EF-/);
 assert.equal(s.currentCard.effectExecuted,false);
 assert.equal(auditCash(s).ok,true);
 s=finishTurn(s);assert.equal(s.currentCard,null);assert.equal(validateState(s),true);
});
test('deck corruption rejects imported states',()=>{
 const s=createGame(8);s.catalogDecks={'inner:EF':['EF-001','EF-001']};
 assert.equal(validateCatalogDecks(s),false);assert.equal(validateState(s),false);
});
