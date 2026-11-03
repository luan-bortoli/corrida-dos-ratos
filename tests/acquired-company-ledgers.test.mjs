import test from 'node:test';
import assert from 'node:assert/strict';
import {registerAcquiredCompanyLedgers} from '../src/acquired-company-ledgers.js';
import {createCompanies,checkCompanies} from '../src/companies.js';
import {registerDocumentedOperation} from '../src/corporate-operations.js';
import {closeCompanies} from '../src/companies.js';
const a=(id,source,kind,percent,ownershipId,rest={})=>({id,name:id,source,kind,percent,ownershipId,cost:100000,referencePassive:1000,passive:999,...rest});
function room(players){return {status:'playing',round:1,companies:createCompanies(),players:players.map(([id,assets])=>({id,game:{assets,cash:100,ledger:[],turn:1,closures:0}}))};}
test('oito empresas GI recebem contabilidade empresarial e não renda estimada',()=>{
 const assets=Array.from({length:8},(_,i)=>a(`GI-${String(i+11).padStart(3,'0')}`,'official_grand_investment','company',undefined,`owned-${i}`));
 const r=room([['ana',assets]]);assert.equal(registerAcquiredCompanyLedgers(r),8);assert.equal(r.companies.length,13);assert.ok(checkCompanies(r.companies));assert.ok(assets.every(x=>x.passive===0&&x.companyLedgerId));assert.equal(registerAcquiredCompanyLedgers(r),0);
});
test('sete participações GI preservam capital externo e não pagam lucro imaginário',()=>{
 const assets=Array.from({length:7},(_,i)=>a(`GI-${String(i+19).padStart(3,'0')}`,'official_grand_investment','participation',[20,15,25,30,20,20,25][i],`share-${i}`));
 const r=room([['ana',assets]]);assert.equal(registerAcquiredCompanyLedgers(r),7);assert.ok(checkCompanies(r.companies));
 for(const asset of assets){const c=r.companies.find(c=>c.id===asset.companyLedgerId);assert.equal(c.shares.ana,asset.percent);assert.equal(c.shares.origin,100-asset.percent);assert.equal(c.retainedProfit,0);}
});
test('aquisições OE-013, OE-017, OE-018 e OE-020 usam contabilidade empresarial',()=>{
 const assets=[a('OE-013','special_opportunity','company',undefined,'oe13'),a('OE-017','special_opportunity','participation',20,'oe17'),a('OE-018','special_opportunity','company',undefined,'oe18'),a('OE-020','special_opportunity','participation',15,'oe20')];
 const r=room([['ana',assets]]);assert.equal(registerAcquiredCompanyLedgers(r),4);assert.ok(checkCompanies(r.companies));assert.ok(assets.every(x=>x.companyLedgerId&&x.passive===0));
});
test('investimento GI conjunto mantém 20% dos estudantes e 80% externo',()=>{
 const r=room([['ana',[a('GI-019','official_joint_grand_participation','participation',8,'ana',{jointProposalId:'offer1',contribution:40000})]],['bia',[a('GI-019','official_joint_grand_participation','participation',12,'bia',{jointProposalId:'offer1',contribution:60000})]]]);
 assert.equal(registerAcquiredCompanyLedgers(r),1);const c=r.companies.find(c=>c.cardId==='GI-019');assert.deepEqual(c.shares,{ana:8,bia:12,origin:80});assert.ok(checkCompanies(r.companies));
});
test('aquisição OE conjunta preserva percentual da carta e não duplica a empresa',()=>{
 const r=room([['ana',[a('OE-020','official_joint_special_participation','participation',6,'ana',{jointProposalId:'offer2',contribution:60000})]],['bia',[a('OE-020','official_joint_special_participation','participation',9,'bia',{jointProposalId:'offer2',contribution:90000})]]]);
 assert.equal(registerAcquiredCompanyLedgers(r),1);const c=r.companies.find(c=>c.cardId==='OE-020');assert.deepEqual(c.shares,{ana:6,bia:9,origin:85});assert.equal(registerAcquiredCompanyLedgers(r),0);
});
test('lucro documentado de empresa GI remunera somente titular após reserva',()=>{
 const asset=a('GI-011','official_grand_investment','company',undefined,'test');const r=room([['ana',[asset]]]);registerAcquiredCompanyLedgers(r);const c=r.companies.find(c=>c.id===asset.companyLedgerId);
 registerDocumentedOperation(r,{companyId:c.id,type:'revenue',amount:5000,document:'DOC-GI-001'});const event=closeCompanies(r,9).find(x=>x.id===c.id);assert.equal(event.paid,3000);assert.equal(r.players[0].game.cash,3100);assert.equal(c.cash,2000);
});
test('dividendo GI participação não atribui a titular mais de sua parcela',()=>{
 const asset=a('GI-019','official_grand_investment','participation',20,'test');const r=room([['ana',[asset]]]);registerAcquiredCompanyLedgers(r);const c=r.companies.find(c=>c.id===asset.companyLedgerId);
 registerDocumentedOperation(r,{companyId:c.id,type:'revenue',amount:5000,document:'DOC-GI-019'});const event=closeCompanies(r,9).find(x=>x.id===c.id);assert.equal(event.allocations.ana,600);assert.equal(event.allocations.origin,2400);
});
