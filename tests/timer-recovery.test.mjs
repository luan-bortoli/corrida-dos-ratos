import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const port=31000+Math.floor(Math.random()*20000);
const base=`http://127.0.0.1:${port}`;
const temp=await mkdtemp(join(tmpdir(),'cr-timer-'));
const child=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'test',TEST_TURN_MS:'500',PORT:String(port),DATA_DIR:temp,ADMIN_PASSWORD:'test-password-123'},stdio:'ignore'});
async function api(path,method='GET',body,token){const res=await fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {...await res.json(),httpStatus:res.status};}
try{
 for(let i=0;i<50;i++){try{if((await fetch(base+'/multiplayer.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 await test('recuperação invalida token antigo, cronômetro e encerramento autorizado',async()=>{
 const created=await api('/api/room/create','POST',{password:'test-password-123'}); const code=created.code,teacher=created.token;
 const one=await api(`/api/room/${code}/join`,'POST',{name:'Maria',professionId:0,dreamId:'TRAVEL'});
 const two=await api(`/api/room/${code}/join`,'POST',{name:'João',professionId:1,dreamId:'TRAVEL'});
 assert.match(one.recoveryCode,/^[A-F0-9]{16}$/);
 assert.equal((await api(`/api/room/${code}/recover`,'POST',{name:'Maria',recoveryCode:'0000000000000000'})).httpStatus,401);
 const rec=await api(`/api/room/${code}/recover`,'POST',{name:'Maria',recoveryCode:one.recoveryCode});
 assert.equal(rec.httpStatus,200);
 assert.equal((await api(`/api/room/${code}`,'GET',undefined,one.token)).httpStatus,403);
 assert.equal((await api(`/api/room/${code}`,'GET',undefined,rec.token)).httpStatus,200);
 await api(`/api/room/${code}/start`,'POST',{},teacher);
 assert.equal((await api(`/api/room/${code}/advance`,'POST',{},teacher)).httpStatus,409);
 assert.equal((await api(`/api/room/${code}/advance`,'POST',{},rec.token)).httpStatus,403);
 await api(`/api/room/${code}/pause`,'POST',{},teacher);
 await new Promise(r=>setTimeout(r,550));
 assert.equal((await api(`/api/room/${code}/advance`,'POST',{},teacher)).httpStatus,409);
 await api(`/api/room/${code}/resume`,'POST',{},teacher);
 await new Promise(r=>setTimeout(r,550));
 const adv=await api(`/api/room/${code}/advance`,'POST',{},teacher);
 assert.equal(adv.httpStatus,200); assert.equal(adv.activePlayerId,two.playerId);
 assert.equal(adv.round,1);
 });
}finally{child.kill();await rm(temp,{recursive:true,force:true});}
