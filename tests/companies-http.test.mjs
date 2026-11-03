import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const port=38000+Math.floor(Math.random()*18000),base=`http://127.0.0.1:${port}`;
const temp=await mkdtemp(join(tmpdir(),'cr-company-http-'));
const child=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DATA_DIR:temp,ADMIN_PASSWORD:'test-password-123'},stdio:'ignore'});
const api=async(path,method='GET',body,token)=>{const r=await fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};};
try{
 for(let i=0;i<60;i++){try{if((await fetch(base+'/multiplayer.html')).ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,70));}
 await test('empresas compartilhadas visíveis e compra protegida por turno e casa',async()=>{
  const created=(await api('/api/room/create','POST',{password:'test-password-123'})).body;
  const code=created.code;
  const a=(await api(`/api/room/${code}/join`,'POST',{name:'Aline',professionId:11,dreamId:'TRAVEL'})).body;
  const b=(await api(`/api/room/${code}/join`,'POST',{name:'Bruno',professionId:10,dreamId:'TRAVEL'})).body;
  const state=(await api(`/api/room/${code}`,'GET',undefined,created.token)).body;
  assert.equal(state.companies.length,5);
  assert.equal(state.companies[0].shares.origin,100);
  await api(`/api/room/${code}/start`,'POST',{},created.token);
  assert.equal((await api(`/api/room/${code}/company-buy`,'POST',{companyId:'GO-016'},b.token)).status,403);
  assert.equal((await api(`/api/room/${code}/company-buy`,'POST',{companyId:'GO-016'},a.token)).status,409);
 });
}finally{child.kill();await rm(temp,{recursive:true,force:true});}
