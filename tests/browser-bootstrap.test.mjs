import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const port=39000+Math.floor(Math.random()*1000);
const origin=`http://127.0.0.1:${port}`;
const password='SenhaForteDeTeste123!';
const dataDir=await mkdtemp(join(tmpdir(),'corrida-bootstrap-'));
const server=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),ADMIN_PASSWORD:password,DATA_DIR:dataDir},stdio:'ignore'});
async function request(path,options){return fetch(origin+path,options);}
async function waitReady(){for(let i=0;i<70;i++){try{const r=await request('/health');if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Servidor não iniciou');}
function modules(source){return [...source.matchAll(/(?:import\s+(?:[^'";]+?\s+from\s+)?|import\s*\()\s*['"](\.[^'"]+)['"]/g)].map(m=>m[1]);}
try{
 await waitReady();
 await test('multiplayer carrega todos os módulos necessários para popular profissão e sonho',async()=>{
  const html=await (await request('/multiplayer.html')).text();
  assert.match(html,/<select id="profession"><\/select>/);
  assert.match(html,/<select id="dream"><\/select>/);
  const stack=['/multiplayer.js','/src/app.js'],seen=new Set();
  while(stack.length){const route=stack.pop();if(seen.has(route))continue;seen.add(route);
   const response=await request(route);
   assert.equal(response.status,200,`Módulo indisponível: ${route}`);
   assert.match(response.headers.get('content-type')||'',route.endsWith('.json')?/json/:/javascript/,route);
   const source=await response.text();
   if(route.endsWith('.json'))continue;
   for(const path of modules(source))stack.push(new URL(path,origin+route).pathname);
  }
  assert.ok(seen.size>20,`Só ${seen.size} módulos importados`);
  const data=await (await request('/src/data.js')).text();
  assert.match(data,/export const PROFESSIONS/);
  assert.match(data,/export const DREAMS/);
 });
 await test('criar sala e ingressar selecionando profissão e sonho',async()=>{
  const created=await request('/api/room/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});
  assert.equal(created.status,201);
  const room=await created.json();
  assert.match(room.code,/^[A-F0-9]{8}$/);
  const join=await request(`/api/room/${room.code}/join`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Estudante Teste',professionId:0,dreamId:'CAFE'})});
  assert.equal(join.status,201);
  const player=await join.json();
  assert.ok(player.token);
  assert.equal(player.room.players[0].professionId,0);
  assert.equal(player.room.players[0].dreamId,'CAFE');
 });
}finally{server.kill();await rm(dataDir,{recursive:true,force:true});}
