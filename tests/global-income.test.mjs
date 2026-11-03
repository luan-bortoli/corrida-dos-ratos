import test from 'node:test';
import assert from 'node:assert/strict';
import {applyGlobalMarketEvent,GLOBAL_INCOME_EVENTS} from '../src/global-market.js';
function room(cardId){return {round:3,players:[
 {id:'a',game:{pending:true,won:false,currentCard:{id:cardId,category:'MF'},cardEvents:[{id:'source-event',resolution:'pending'}],assets:[{id:'GO-001',cost:35000,passive:350},{id:'GO-009',cost:28000,passive:420},{id:'GO-015',cost:90000,passive:1050},{id:'GO-011',cost:55000,passive:700}]}},
 {id:'b',game:{won:false,assets:[{id:'GO-002',cost:48000,passive:430},{id:'GO-012',cost:45000,passive:600},{id:'PO-002',cost:2200,passive:55}]}},
 {id:'c',game:{won:true,assets:[{id:'GO-001',cost:35000,passive:350}]}}
]};}
test('cinco eventos globais de renda são configurados',()=>assert.deepEqual(Object.keys(GLOBAL_INCOME_EVENTS),['MF-019','MF-020','MF-023','MF-025','MF-026','MF-029']));
test('MF-023 reduz aluguéis elegíveis dos dois estudantes, sem alterar custo, caixa nem vencedores',()=>{const r=room('MF-023');r.players[0].game.cash=500;const x=applyGlobalMarketEvent(r,'MF-023');assert.equal(x.affected,2);assert.equal(r.players[0].game.assets[0].passive,280);assert.equal(r.players[1].game.assets[0].passive,344);assert.equal(r.players[2].game.assets[0].passive,350);assert.equal(r.players[0].game.assets[0].cost,35000);assert.equal(r.players[0].game.cash,500);});
test('MF-019 afeta apenas negócios comerciais elegíveis',()=>{const r=room('MF-019');assert.equal(applyGlobalMarketEvent(r,'MF-019').affected,2);assert.equal(r.players[0].game.assets[1].passive,357);assert.equal(r.players[0].game.assets[2].passive,893);});
test('MF-020 aumenta apenas lucro distribuível de logística',()=>{const r=room('MF-020');assert.equal(applyGlobalMarketEvent(r,'MF-020').affected,1);assert.equal(r.players[0].game.assets[2].passive,1176);});
test('MF-025 afeta alimentação e MF-026 afeta serviços',()=>{const r=room('MF-025');assert.equal(applyGlobalMarketEvent(r,'MF-025').affected,2);assert.equal(r.players[0].game.assets[3].passive,595);assert.equal(r.players[1].game.assets[2].passive,47);const r2=room('MF-026');assert.equal(applyGlobalMarketEvent(r2,'MF-026').affected,1);assert.equal(r2.players[1].game.assets[1].passive,660);});
test('evento sem elegíveis registra ocorrência e não inventa efeitos',()=>{const r=room('MF-020');r.players.forEach(p=>p.game.assets=[]);const x=applyGlobalMarketEvent(r,'MF-020');assert.equal(x.affected,0);assert.equal(r.marketOccurrences.length,1);});
test('rendimento inválido bloqueia operação antes de afetar outros titulares',()=>{const r=room('MF-023');r.players[1].game.assets[0].passive=-3;assert.throws(()=>applyGlobalMarketEvent(r,'MF-023'),/inválido/);assert.equal(r.players[0].game.assets[0].passive,350);assert.equal(r.marketOccurrences.length,0);});
test('reenvio da mesma ocorrência não duplica ajuste',()=>{const r=room('MF-023');applyGlobalMarketEvent(r,'MF-023');assert.throws(()=>applyGlobalMarketEvent(r,'MF-023'),/pendente|processado/);assert.equal(r.players[0].game.assets[0].passive,280);});
