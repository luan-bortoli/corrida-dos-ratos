import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame, rollTurn, finishTurn, validateState} from '../src/engine.js';
import {getCard} from '../src/catalog.js';

test('novas partidas individuais e multiplayer usam o catálogo oficial de PO sem ativação manual',()=>{
  for(const profession of [0,4,8]){
    let game=createGame(profession);
    assert.equal(game.officialPOEnabled,true);
    game=rollTurn(game,1);
    assert.equal(game.lastTile,'PO');
    assert.equal(game.currentOffer,null);
    assert.equal(game.currentCard.category,'PO');
    assert.match(game.currentCard.id,/^PO-0(?:0[1-9]|1[0-9]|2[0-5])$/);
    assert.ok(getCard(game.currentCard.id));
    game=finishTurn(game);
    assert.equal(validateState(game),true);
  }
});

test('interface multiplayer e individual não exibem opção de ativar manualmente',async()=>{
  for(const file of ['multiplayer.js','src/app.js']){
    const source=await readFile(new URL('../'+file,import.meta.url),'utf8');
    assert.doesNotMatch(source,/Ativar baralho oficial de Pequenas Oportunidades/);
    assert.doesNotMatch(source,/official-po-enable/);
  }
});
