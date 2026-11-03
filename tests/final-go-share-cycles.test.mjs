import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,auditCash} from '../src/engine.js';
import {createCompanies,purchaseCompanyShare} from '../src/companies.js';
import {recordVerifiedOperatingEvent} from '../src/governance.js';
import {closeVerifiedPeriod} from '../src/distributions.js';
import {cashBalanceCents} from '../src/money-balance.js';

// Testa, individualmente, o ciclo econômico das cinco participações GO.
for(const template of createCompanies()){
 test(`${template.id}: aquisição, resultado comprovado, reserva, dividendos e fechamento idempotente`,()=>{
  const g=createGame(11,'TRAVEL');g.cash=100000;g.initialCash=100000;g.secondaryCashCents=73;g.pending=true;g.lastTile='GO';g.turn=1;
  const r={round:1,players:[{id:'aluno',game:g}],companies:createCompanies(),externalSellerCash:0};
  const initial=cashBalanceCents(g);
  const purchase=purchaseCompanyShare(r,'aluno',template.id);
  const company=r.companies.find(c=>c.id===template.id);
  assert.equal(cashBalanceCents(g),initial-purchase.price*100);
  assert.equal(company.retainedProfit,0);
  assert.equal(company.shares.aluno,purchase.percent);
  const pre=cashBalanceCents(g);
  const first=closeVerifiedPeriod(r,9).find(x=>x.id===template.id);
  assert.equal(first.paid,0);
  assert.equal(cashBalanceCents(g),pre);
  recordVerifiedOperatingEvent(company,{sourceId:`DOC:${template.id}:10`,type:'revenue',amount:5000,round:10});
  const next=closeVerifiedPeriod(r,18).find(x=>x.id===template.id);
  assert.ok(next.allocations.aluno>0);
  assert.equal(cashBalanceCents(g),pre+next.allocations.aluno*100);
  assert.ok(company.cash>=company.reserveRequired);
  assert.equal(closeVerifiedPeriod(r,18).length,0);
  assert.ok(auditCash(g).ok);
 });
}
