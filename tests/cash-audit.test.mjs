import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditCashTransfers} from '../src/cash-audit.js';
import {createGame} from '../src/engine.js';
import {buildTeacherReport} from '../src/reports.js';
const trade={id:'T1',buyerId:'a',sellerId:'b',securityId:'PO-013',units:3,priceCents:5401,amountCents:16203};
function room(){const a=createGame(0,'TRAVEL'),b=createGame(1,'TRAVEL');a.secondaryCashCents=3;b.secondaryCashCents=97;a.ledger.push({kind:'secondary_security_buy',securityId:'PO-013',amountCents:-16203});b.ledger.push({kind:'secondary_security_sell',securityId:'PO-013',amountCents:16203});return {code:'AUDIT',players:[{id:'a',name:'A',game:a},{id:'b',name:'B',game:b}],secondaryTrades:[trade],companies:[]};}
test('auditoria confirma contrapartes com valor fracionário exato',()=>{const x=auditCashTransfers(room());assert.equal(x.ok,true);assert.equal(x.totalTradedCents,16203);});
test('auditoria identifica lançamento ausente do vendedor',()=>{const r=room();r.players[1].game.ledger=[];assert.equal(auditCashTransfers(r).ok,false);});
test('auditoria identifica divergência em centavos',()=>{const r=room();r.players[0].game.ledger.at(-1).amountCents=-16200;assert.equal(auditCashTransfers(r).ok,false);});
test('auditoria identifica contraparte inexistente',()=>{const r=room();r.secondaryTrades[0]={...trade,sellerId:'desconhecido'};assert.equal(auditCashTransfers(r).ok,false);});
test('auditoria não modifica a sala e aparece no relatório do professor',()=>{const r=room();const before=JSON.stringify(r),report=buildTeacherReport(r);assert.equal(report.schemaVersion,4);assert.equal(report.cashTransfersAudit.ok,true);assert.equal(JSON.stringify(r),before);});

test('auditoria diferencia negócios com mesmo valor quando vinculados pelo identificador',()=>{const r=room();r.players[0].game.ledger.at(-1).tradeId='OUTRA';assert.equal(auditCashTransfers(r).ok,false);});
