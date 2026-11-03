import test from 'node:test';
import assert from 'node:assert/strict';
import {CARD_CATALOG,getCard,drawCatalogCard} from '../src/catalog.js';
test('all 230 ids are linked to original nonempty source excerpts',()=>{
 assert.equal(CARD_CATALOG.length,230);
 for(const card of CARD_CATALOG){const full=getCard(card.id);assert.equal(full.status,'text_available');assert.ok(full.text.length>12,card.id);assert.ok(full.text.includes(card.id),card.id);}
});
test('official draw returns text-available status without auto execution until resolved',()=>{
 const c=drawCatalogCard({},'EF','inner',()=>0);
 assert.equal(c.status,'text_available');assert.equal(c.effectExecuted,false);assert.ok(getCard(c.id).text.includes(c.id));
});
