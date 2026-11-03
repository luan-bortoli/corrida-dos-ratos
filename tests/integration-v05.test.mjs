import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollTurn,buyVerifiedAsset,finishTurn,auditCash,serializeGame,deserializeGame,financialSnapshot,contractCredit} from '../src/engine.js';
function ready(){return Object.assign(createGame(8),{demoDeck:['PO-001','PO-002','PO-007']});}
test('primeira casa PO sorteia uma carta do baralho reduzido',()=>{const s=rollTurn(ready(),1);assert.equal(s.currentOffer,'PO-001');assert.equal(s.demoDeck.length,2);});
test('não permite comprar carta diferente da sorteada',()=>{const s=rollTurn(ready(),1);assert.throws(()=>buyVerifiedAsset(s,'PO-002'),/não foi a sorteada/);assert.equal(s.cash,5000);});
test('compra efetiva consome oferta e concilia o caixa',()=>{let s=rollTurn(ready(),1);s=buyVerifiedAsset(s,'PO-001');assert.equal(s.currentOffer,null);assert.equal(s.assets.length,1);assert.equal(auditCash(s).ok,true);});
test('recusar carta não debita dinheiro',()=>{let s=rollTurn(ready(),1);s=finishTurn(s);assert.equal(s.cash,5000);assert.equal(s.currentOffer,null);});
test('baralho sem reposição até esgotar e reembaralha depois',()=>{let s=ready();let drawn=[];for(let i=0;i<3;i++){s.position=1;s.pending=false;s=rollTurn(s,1);drawn.push(s.currentOffer);s=finishTurn(s);}assert.equal(new Set(drawn).size,3);s.position=1;s=rollTurn(s,1);assert.equal(s.demoDeckCycles,1);assert.equal(s.demoDeck.length,2);});
test('backup JSON exporta e restaura uma partida conciliada',()=>{const s=rollTurn(ready(),1);const restored=deserializeGame(serializeGame(s));assert.deepEqual(restored,s);});
test('backup com caixa adulterado é recusado',()=>{const s=ready();s.cash+=100;const payload=JSON.stringify({format:'corrida-dos-ratos-save',schema:1,game:s});assert.throws(()=>deserializeGame(payload),/não confere/);assert.throws(()=>serializeGame(s),/inconsistentes/);});
test('backup incompatível não substitui partida',()=>{assert.throws(()=>deserializeGame('{'),/JSON válido/);assert.throws(()=>deserializeGame('{}'),/incompatível/);});
test('patrimônio líquido considera caixa, ativos, dívidas e despesa vencida',()=>{let s=ready();const snap=financialSnapshot(s);assert.equal(snap.netWorthCostBasis,s.cash+s.initialAssets-s.debt);s.arrearsLiving=300;s.arrearsLivingCents=30000;assert.equal(financialSnapshot(s).netWorthCostBasis,snap.netWorthCostBasis-300);});
