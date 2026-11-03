import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/engine.js';
import {createCompanies} from '../src/companies.js';
import {buildTeacherReport,reportCSV} from '../src/reports.js';
const game=createGame(0,'TRAVEL');
const room={code:'ABC12345',status:'playing',round:4,companies:createCompanies(),players:[{id:'p1',name:'=2+2',game}]};
test('relatório de professor é determinístico e não altera a partida',()=>{
 const before=JSON.stringify(room),report=buildTeacherReport(room);
 assert.equal(report.participantsCount,1);assert.equal(report.participants[0].cash,game.cash);
 assert.equal(report.completedCount,0);assert.equal(JSON.stringify(room),before);
});
test('CSV neutraliza fórmulas e preserva delimitadores',()=>{
 const csv=reportCSV(buildTeacherReport(room));assert.match(csv,/"'=2\+2"/);
 assert.match(csv,/"name";"profession"/);
});
test('indicadores de dívidas e pendências consideram todos os empréstimos',()=>{
 const extended=structuredClone(room);extended.players[0].game.loans=[{balance:123,arrears:25}];extended.players[0].game.arrearsLiving=14;
 const r=buildTeacherReport(extended);assert.equal(r.participants[0].debt,game.debt+123);assert.equal(r.participants[0].overdue,39);
});
