import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('sala de seis jogadores preserva ordem, rodada e sessão após reinício em pausa',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cr-v144-restart-six-'));
 const origin=`http://127.0.0.1:${40000+Math.floor(Math.random()*13000)}`;
 const port=new URL(origin).port;
 let child;
 const start=async()=>{child=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:port,DATA_DIR:dir,ADMIN_PASSWORD:'restart-six-123',NODE_ENV:'test'},stdio:'ignore'});for(let i=0;i<100;i++){try{if((await fetch(origin+'/multiplayer.html')).ok)return;}catch{}await new Promise(r=>setTimeout(r,40));}throw Error('Servidor não iniciou');};
 const stop=async()=>{if(!child)return;const old=child;child=null;old.kill();await new Promise(r=>old.once('exit',r));};
 const req=async(path,method='GET',body,token)=>{const response=await fetch(origin+path,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,data:await response.json()};};
 try{
  await start();
  const {data:{code,token:teacher}}=await req('/api/room/create','POST',{password:'restart-six-123'});
  const p=`/api/room/${code}`;const players=[];
  for(let i=0;i<6;i++){const j=await req(p+'/join','POST',{name:`Pessoa ${i}`,professionId:i,dreamId:'TRAVEL'});assert.equal(j.status,201);players.push(j.data);}
  assert.equal((await req(p+'/start','POST',{},teacher)).status,200);
  assert.equal((await req(p+'/roll','POST',{die:2},players[0].token)).status,200);
  assert.equal((await req(p+'/end','POST',{},players[0].token)).status,200);
  const before=await req(p,'GET',undefined,teacher);
  assert.equal(before.data.activePlayerId,players[1].playerId);
  assert.equal((await req(p+'/pause','POST',{},teacher)).status,200);
  await stop();await start();
  const restored=await req(p,'GET',undefined,teacher);
  assert.equal(restored.data.status,'paused');assert.equal(restored.data.activePlayerId,players[1].playerId);
  assert.equal(restored.data.players.length,6);assert.equal(restored.data.round,1);
  assert.equal((await req(p+'/resume','POST',{},teacher)).status,200);
  assert.equal((await req(p+'/roll','POST',{die:3},players[1].token)).status,200);
  assert.equal((await req(p+'/end','POST',{},players[1].token)).status,200);
  assert.equal((await req(p,'GET',undefined,teacher)).data.activePlayerId,players[2].playerId);
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
