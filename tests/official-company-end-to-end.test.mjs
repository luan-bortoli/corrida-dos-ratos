import test from 'node:test';
import assert from 'node:assert/strict';
import {OFFICIAL_COMPANIES} from '../src/official-companies.js';
import {registerOwnedCompany} from '../src/owned-companies.js';
import {createCompanies,checkCompanies} from '../src/companies.js';
import {registerDocumentedOperation} from '../src/corporate-operations.js';
import {closeVerifiedPeriod} from '../src/distributions.js';
import {cashBalanceCents} from '../src/money-balance.js';
function setup(offer){
 const game={cash:500,secondaryCashCents:73,assets:[{id:offer.id,source:'official_company',passive:offer.passive}],ledger:[],turn:1,closures:0};
 const room={status:'playing',round:1,companies:createCompanies(),players:[{id:'owner',game}],externalSellerCash:0};
 return {room,game,company:registerOwnedCompany(room,'owner',offer.id)};
}
for(const offer of OFFICIAL_COMPANIES){
 test(`${offer.id}: receita documentada, fechamento e dividendo sem lucro fictício`,()=>{
  const {room,game,company}=setup(offer);
  assert.equal(company.shares.owner,100);
  assert.equal(game.assets[0].passive,0);
  const opening=cashBalanceCents(game);
  const first=closeVerifiedPeriod(room,9).find(x=>x.id===company.id);
  assert.equal(first.paid,0);
  assert.equal(cashBalanceCents(game),opening);
  room.round=10;
  const document=`DOC-${offer.id}-REV-001`;
  const revenue=registerDocumentedOperation(room,{companyId:company.id,type:'revenue',amount:5000,document});
  assert.equal(revenue.amount,5000);
  assert.throws(()=>registerDocumentedOperation(room,{companyId:company.id,type:'revenue',amount:5000,document}),/já contabilizado/);
  const balance=cashBalanceCents(game);
  const second=closeVerifiedPeriod(room,18).find(x=>x.id===company.id);
  assert.equal(second.paid,5000-company.reserveRequired);
  assert.equal(second.allocations.owner,5000-company.reserveRequired);
  assert.equal(cashBalanceCents(game),balance+(5000-company.reserveRequired)*100);
  assert.equal(company.cash,company.reserveRequired);
  assert.equal(company.retainedProfit,company.reserveRequired);
  assert.ok(checkCompanies(room.companies));
  assert.equal(closeVerifiedPeriod(room,18).length,0);
 });
 test(`${offer.id}: despesa operacional documentada reduz lucro sem debitar o proprietário`,()=>{
  const {room,game,company}=setup(offer);
  const before=cashBalanceCents(game);
  registerDocumentedOperation(room,{companyId:company.id,type:'revenue',amount:5000,document:`DOC-${offer.id}-REV-002`});
  registerDocumentedOperation(room,{companyId:company.id,type:'expense',amount:1500,document:`DOC-${offer.id}-EXP-002`});
  assert.equal(cashBalanceCents(game),before);
  const result=closeVerifiedPeriod(room,9).find(x=>x.id===company.id);
  assert.equal(result.paid,3500-company.reserveRequired);
  assert.equal(cashBalanceCents(game),before+(3500-company.reserveRequired)*100);
  assert.equal(company.cash,company.reserveRequired);
 });
}
