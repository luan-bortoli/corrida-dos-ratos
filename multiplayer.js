import {CORPORATE_EXPANSIONS} from './src/corporate-expansion-catalog.js';
import {specialAcquisitionOffer} from './src/special-opportunities.js';
import {grandInvestmentOffer} from './src/grand-investments.js';
import {philanthropyOffer} from './src/philanthropy.js';
import {formatCashBRL} from './src/money-balance.js';
import {fixedIncomeOffer,FIXED_INCOME} from './src/fixed-income.js';
import {officialSecurityOffer} from './src/official-securities.js';
import {officialSmallBusinessOffer,officialPOAssetOffer} from './src/official-small-businesses.js';
import {officialCompanyOffer} from './src/official-companies.js';
import {realEstateOffer} from './src/real-estate.js';
import {lifeDecision} from './src/life-decisions.js';
import {getCard} from './src/catalog.js';
import {PROFESSIONS,DREAMS,VERIFIED_ASSETS,INNER,OUTER} from './src/data.js';
const $=id=>document.getElementById(id),money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
$('profession').innerHTML=PROFESSIONS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
$('dream').innerHTML=Object.entries(DREAMS).map(([id,d])=>`<option value="${id}">${d.name}</option>`).join('');
let session=null;try{session=JSON.parse(sessionStorage.getItem('cr-room-session'));}catch{}
const msg=x=>$('message').textContent=x;
async function req(path,method='GET',body){const response=await fetch(path,{method,headers:{'content-type':'application/json',...(session?{authorization:`Bearer ${session.token}`}:{})},body:body?JSON.stringify(body):undefined});const result=await response.json();if(!response.ok)throw Error(result.error||'Erro na solicitação');return result;}
function store(s){session=s;sessionStorage.setItem('cr-room-session',JSON.stringify(s));}
$('create').onclick=async()=>{try{const r=await req('/api/room/create','POST',{password:$('password').value});store({code:r.code,token:r.token,role:'teacher',teacherRecoveryCode:r.teacherRecoveryCode});$('password').value='';render(r.room);msg('Sala criada. Compartilhe o código com estudantes.');}catch(e){msg(e.message);}};
$('recoverTeacher').onclick=async()=>{try{const code=$('code').value.trim().toUpperCase();const recoveryCode=$('teacherRecoveryCode').value.trim().toUpperCase();const r=await req(`/api/room/${encodeURIComponent(code)}/recover-teacher`,'POST',{recoveryCode});store({code,token:r.token,role:'teacher',teacherRecoveryCode:recoveryCode});render(r.room);msg('Acesso do professor recuperado; sessão anterior invalidada.');}catch(e){msg(e.message);}};
$('join').onclick=async()=>{try{const code=$('code').value.trim().toUpperCase();const r=await req(`/api/room/${encodeURIComponent(code)}/join`,'POST',{name:$('name').value,professionId:Number($('profession').value),dreamId:$('dream').value});store({code,token:r.token,role:'player',recoveryCode:r.recoveryCode});render(r.room);msg('Você entrou na sala. Guarde seu código pessoal de recuperação.');}catch(e){msg(e.message);}};
$('recover').onclick=async()=>{try{const code=$('code').value.trim().toUpperCase();const r=await req(`/api/room/${encodeURIComponent(code)}/recover`,'POST',{name:$('name').value,recoveryCode:$('recoveryCode').value});store({code,token:r.token,role:'player',recoveryCode:$('recoveryCode').value.trim().toUpperCase()});render(r.room);msg('Sessão recuperada; acesso anterior invalidado.');}catch(e){msg(e.message);}};
async function perform(action,body){if(!session)return;try{render(await req(`/api/room/${session.code}/${action}`,'POST',body));msg('Operação registrada.');}catch(e){msg(e.message);}}
for(const a of ['start','pause','resume','finish','advance','roll','end'])$(a).onclick=()=>perform(a);
$('buy').onclick=()=>perform('buy',{assetId:window.currentOffer});
async function downloadTeacherReport(format){
 if(!session||session.role!=='teacher')return;
 try{
  const response=await fetch(`/api/room/${session.code}/report?format=${format}`,{headers:{authorization:`Bearer ${session.token}`}});
  if(!response.ok){const data=await response.json();throw Error(data.error||'Relatório indisponível');}
  const blob=await response.blob();const address=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=address;a.download=`corrida-${session.code}-relatorio.${format==='csv'?'csv':'json'}`;
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(address);
  msg('Relatório exportado.');
 }catch(e){msg(e.message);}
}

$('reportPrint').onclick=async()=>{
 if(!session||session.role!=='teacher')return;
 try{
  const report=await req(`/api/room/${session.code}/report`);
  const safe=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const rows=(report.participants||[]).map(p=>`<tr><td>${safe(p.name)}</td><td>${safe(p.profession)}</td><td>${safe(p.dream)}</td><td>${p.completed?'Sim':'Não'}</td><td>${p.rank??'—'}</td><td>${Number(p.closures)||0}</td><td>${Number(p.cardDraws)||0}</td><td>${Number(p.educationCorrect)||0}/${Number(p.educationAnswers)||0}</td><td>${safe(p.cashFormatted)}</td></tr>`).join('');
  const winners=(report.progress?.winners||[]).map(w=>`<li>${Number(w.place)||0}º — ${safe(w.name)}: ${safe(w.dream)}</li>`).join('')||'<li>Nenhum sonho realizado até este relatório</li>';
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório da sala ${safe(report.roomCode)}</title><style>body{font:14px system-ui,Arial;max-width:1100px;margin:30px auto;padding:0 18px;color:#222}h1{font-size:26px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #aaa;padding:7px;text-align:left}th{background:#eee}footer{margin-top:26px;color:#555}button{padding:9px 15px;margin:10px 0}@media print{button{display:none}body{margin:0}table{font-size:10px}}</style></head><body><h1>Corrida dos Ratos — Relatório pedagógico</h1><p><strong>Sala:</strong> ${safe(report.roomCode)} · <strong>Rodada:</strong> ${Number(report.round)||0} · <strong>Situação:</strong> ${safe(report.status)} · <strong>Participantes:</strong> ${Number(report.participantsCount)||0}</p><h2>Ordem de realização dos sonhos</h2><ol>${winners}</ol><h2>Indicadores dos participantes</h2><table><thead><tr><th>Nome</th><th>Profissão</th><th>Sonho</th><th>Realizado</th><th>Posição</th><th>Fechamentos</th><th>Cartas</th><th>Educação financeira</th><th>Caixa (R$)</th></tr></thead><tbody>${rows}</tbody></table><footer><p>Os indicadores derivam dos eventos registrados. Não representam notas escolares, nem certificam a conciliação financeira integral.</p></footer><button onclick="window.print()">Imprimir / salvar como PDF</button></body></html>`;
  const blob=new Blob([html],{type:'text/html;charset=utf-8'}),link=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=link;a.download=`corrida-${session.code}-relatorio-imprimivel.html`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(link),3000);
  msg('Relatório HTML para impressão gerado. Abra-o e use Imprimir > Salvar como PDF.');
 }catch(e){msg(e.message);}
};
$('reportJson').onclick=()=>downloadTeacherReport('json');
$('reportCsv').onclick=()=>downloadTeacherReport('csv');
$('corporateOperation').onclick=async()=>{
 if(!session||session.role!=='teacher')return;
 try{
  const room=await req(`/api/room/${session.code}`);
  const list=(room.companies||[]).map(c=>`${c.id}: ${c.name}`).join('\n');
  const companyId=prompt('Empresa (copie o ID):\n'+list);
  if(!companyId)return;
  const kind=prompt('Tipo: revenue (receita) ou expense (despesa)','revenue');
  if(!kind)return;
  const amount=Number(prompt('Valor em reais inteiros, de 1 a 1.000.000','100'));
  const document=prompt('Identificador único do comprovante (5 a 80 caracteres)');
  if(!document)return;
  const result=await req(`/api/room/${session.code}/corporate-operation`,'POST',{companyId,type:kind,amount,document});
  render(result.room);
  msg(`Operação contabilizada: ${result.operation.type} de ${money(result.operation.amount)} em ${result.operation.companyId}.`);
 }catch(e){msg(e.message);}
};
$('cardAudit').onclick=async()=>{if(!session||session.role!=='teacher')return;try{const report=await req(`/api/room/${session.code}/card-audit`);const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`corrida-${session.code}-auditoria-cartas.json`;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);msg(`Inventário: ${report.totalActual} cartas; ${report.officialTextAvailable} com texto original; ${report.errors.length} inconsistências.`);}catch(e){msg(e.message);}};

function render(r){$('room').hidden=false;document.querySelector('.setup').hidden=true;$('roomTitle').textContent='Código '+r.code;$('roomCode').textContent=r.code;$('roleText').textContent=r.teacher?'Professor':'Estudante';$('statusText').textContent=`Situação: ${r.status} · Revisão ${r.revision}`;
$('progressSummary').textContent=r.progress?`Rodada ${r.progress.round} · ${r.progress.completedPlayers}/${r.progress.totalPlayers} sonhos realizados · ${r.progress.activePlayers} participantes ativos${r.progress.endedByTeacher?' · encerramento pelo professor':''}${r.progress.allDreamsCompleted?' · todos os sonhos realizados':''}`:'';
$('players').replaceChildren(...r.players.map(p=>{const e=document.createElement('div');e.className='event';e.textContent=`${p.id===r.activePlayerId?'▶ ':''}${p.name} · ${PROFESSIONS.find(x=>x.id===p.professionId)?.name} · Casa ${p.position} · ${p.circuit==='outer'?'Alta Velocidade':'Corrida dos Ratos'}${p.won?' · Sonho realizado'+(r.progress?.winners.find(w=>w.id===p.id)?.place?' · '+r.progress.winners.find(w=>w.id===p.id).place+'º lugar':''):''}`;return e;}));
const companyArea=$('companies');companyArea.replaceChildren(...(r.companies||[]).map(c=>{const el=document.createElement('div');el.className='event';const label=document.createElement('p');label.textContent=`${c.name} · reserva R$ ${c.reserveRequired} · caixa R$ ${c.cash} · fechamento: rodada ${c.lastClosedRound||'ainda não'} · últimos dividendos: ${money(c.distributions?.at(-1)?.paid||0)} · participação do titular de origem ${c.shares.origin}%`;el.append(label);const me=r.players.find(p=>p.id===r.you);if(me){const share=c.shares[me.id]||0;const detail=document.createElement('p');detail.textContent=`Sua participação: ${share}% · oferta: ${c.offer.percent}% por ${money(c.offer.price)}`;el.append(detail);const button=document.createElement('button');button.textContent='Comprar participação demonstrativa';button.className='outline';button.disabled=!(r.status==='playing'&&r.activePlayerId===me.id&&r.game?.pending&&r.game?.lastTile==='GO'&&!r.game?.offerResolved&&r.game?.cash>=c.offer.price&&c.shares.origin>=c.offer.percent);button.onclick=()=>perform('company-buy',{companyId:c.id});el.append(button);if(share>0){const sell=document.createElement('button');sell.className='outline';sell.textContent='Anunciar participação';sell.disabled=!(r.status==='playing'&&r.activePlayerId===me.id);sell.onclick=()=>{const pct=Number(prompt(`Percentual para venda (máximo ${share}%)`,String(share)));const price=Number(prompt('Preço total solicitado em R$','1000'));if(!Number.isSafeInteger(pct)||!Number.isSafeInteger(price))return msg('Informe números inteiros válidos');perform('share-offer',{companyId:c.id,percent:pct,price});};el.append(sell);const prop=document.createElement('button');prop.className='outline';prop.textContent='Propor deliberação';prop.disabled=!(r.status==='playing'&&r.activePlayerId===me.id);prop.onclick=()=>{const title=prompt('Descrição da proposta societária (sem efeito financeiro automático)');if(title)perform('proposal-open',{companyId:c.id,title});};el.append(prop);}}return el;}));if(r.game?.currentCard?.corporateExpense?.requiresCompanySelection){
 for(const company of r.game.currentCard.corporateExpense.eligibleCompanies){const b=document.createElement('button');b.className='outline';b.textContent=`Atribuir despesa a ${company.name}`;b.disabled=!(r.status==='playing'&&r.activePlayerId===r.you);b.onclick=()=>perform('corporate-expense-select',{companyId:company.id});companyArea.append(b);}
}
// Participações GI compartilhadas: convidados respondem mesmo fora de seu turno.
for(const proposal of r.jointInvestments||[]){
 const box=document.createElement('div');box.className='event';
 const paid=Object.values(proposal.commitments).reduce((sum,v)=>sum+v,0);
 const caption=document.createElement('p');caption.textContent=`Proposta conjunta ${proposal.cardId} — ${proposal.companyName}: ${money(paid)} de ${money(proposal.offerCost)} comprometidos · ${proposal.status} · validade até rodada ${proposal.expiresRound}`;box.append(caption);
 if(r.you&&proposal.status==='open'&&proposal.invitedIds.includes(r.you)&&!Object.hasOwn(proposal.commitments,r.you)&&!proposal.declinedIds.includes(r.you)&&r.status==='playing'){
  const yes=document.createElement('button');yes.className='outline';yes.textContent='Confirmar aporte';yes.onclick=()=>{const remaining=proposal.offerCost-paid;const answer=prompt(`Aporte em reais (até ${money(remaining)})`,String(remaining));if(answer!==null)perform('joint-accept',{proposalId:proposal.id,amount:Number(answer)});};box.append(yes);
  const no=document.createElement('button');no.className='outline';no.textContent='Recusar convite';no.onclick=()=>perform('joint-decline',{proposalId:proposal.id});box.append(no);
 }
 companyArea.append(box);
}
const offersArea=$('shareOffers');offersArea.replaceChildren(...(r.shareOffers||[]).filter(o=>o.status==='open').map(o=>{const el=document.createElement('div');el.className='event';const label=document.createElement('p');label.textContent=`${o.companyId} · ${o.percent}% por ${money(o.price)} · preferência até a rodada ${o.preferenceUntil} · expira após a rodada ${o.expiresRound}`;el.append(label);const me=r.players.find(p=>p.id===r.you);if(me&&me.id!==o.sellerId){const eligible=r.round>o.preferenceUntil||!o.eligible.length||o.eligible.includes(me.id);const btn=document.createElement('button');btn.className='outline';btn.textContent='Aceitar oferta';btn.disabled=!(r.status==='playing'&&r.activePlayerId===me.id&&eligible&&r.game?.cash>=o.price);btn.onclick=()=>perform('share-accept',{offerId:o.id});el.append(btn);}return el;}));const market=r.secondaryMarket||{offers:[],trades:[],volumes:{}};
 const marketTitle=document.createElement('h3');marketTitle.textContent='Mercado secundário de ações e fundos';companyArea.append(marketTitle);
 const canTrade=r.status==='playing'&&r.activePlayerId===r.you;
 for(const [securityId,units] of Object.entries(r.game?.officialSecurities||{})){
  if(!units)continue;const quote=r.officialMarket?.find(q=>q.id===securityId);
  const line=document.createElement('div');line.className='event';line.textContent=`${securityId}: ${units} unidades; cotação R$ ${((quote?.priceCents??0)/100).toFixed(2)}`;
  const b=document.createElement('button');b.className='outline';b.textContent='Anunciar venda';b.disabled=!canTrade;
  b.onclick=()=>{const value=prompt('Quantidade de unidades para anunciar:',String(units));if(value!==null)perform('secondary-list',{securityId,units:Number(value)});};line.append(b);companyArea.append(line);
 }
 for(const o of market.offers){const line=document.createElement('div');line.className='event';const name=r.players.find(p=>p.id===o.sellerId)?.name||'Estudante';line.textContent=`${name} oferece ${o.units} unidades ${o.securityId}; cotação atual R$ ${(o.priceCents/100).toFixed(2)}`;
  if(o.sellerId===r.you){const b=document.createElement('button');b.className='outline';b.textContent='Cancelar anúncio';b.disabled=!canTrade;b.onclick=()=>perform('secondary-cancel',{offerId:o.id});line.append(b);}
  else if(r.you){const b=document.createElement('button');b.className='outline';b.textContent='Comprar unidades';b.disabled=!canTrade;b.onclick=()=>{const value=prompt('Quantidade de unidades para comprar:','1');if(value!==null)perform('secondary-buy',{offerId:o.id,units:Number(value)});};line.append(b);}
  companyArea.append(line);
 }
const npcArea=$('npcInvestors');npcArea.replaceChildren(...(r.npcInvestors||[]).map(i=>{const el=document.createElement('div');el.className='event';el.textContent=`${i.label}: ${money(i.cash)} disponíveis`;return el;}));
const npcOffersArea=$('npcOffers');npcOffersArea.replaceChildren(...(r.shareOffers||[]).filter(o=>o.status==='open'&&o.sellerId===r.you).map(o=>{const el=document.createElement('div');el.className='event';const label=document.createElement('p');label.textContent=`Oferta ${o.companyId}: ${o.percent}% por ${money(o.price)} (preferência até a rodada ${o.preferenceUntil})`;el.append(label);for(const inv of (r.npcInvestors||[])){const b=document.createElement('button');b.className='outline';b.textContent=`Negociar com ${inv.label} (pode oferecer menos)`;b.disabled=!(r.status==='playing'&&r.activePlayerId===r.you&&r.round>o.preferenceUntil&&inv.cash>=o.price&&r.round<=o.expiresRound);b.onclick=()=>{const ref=(r.companies||[]).find(c=>c.id===o.companyId);const profile={conservador:{base:80,min:75,max:90},moderado:{base:92,min:85,max:100},arrojado:{base:100,min:90,max:110}}[inv.id];if(!ref||!profile)return;const value=Math.round(ref.valuation*o.percent/100),payout=(ref.referenceDistribution||0)*o.percent/100,rate=value>0?payout/value*100:0,adjust=(rate>=2.5?10:rate>=1.5?5:0)-((ref.referenceDistribution||0)===0?5:0),pct=Math.max(profile.min,Math.min(profile.max,profile.base+adjust)),max=Math.floor(value*pct/100),counter=Math.min(o.price,max);if(counter<=0||inv.cash<counter)return msg('Comprador sem recursos ou sem contraproposta válida.');if(!confirm('Confirmar venda de '+o.percent+'% por '+money(counter)+(counter<o.price?' (contraproposta inferior ao anúncio)':'')+'?'))return;perform('npc-buy',{offerId:o.id,investorId:inv.id,acceptCounter:counter<o.price});};el.append(b);}npcOffersArea.append(el); }));
const proposalArea=$('proposals');proposalArea.replaceChildren(...(r.proposals||[]).map(pr=>{const el=document.createElement('div');el.className='event';const t=document.createElement('p');t.textContent=`${pr.companyId} · ${pr.title} · ${pr.status} · prazo rodada ${pr.expiresRound}`;el.append(t);const me=r.players.find(p=>p.id===r.you);const co=r.companies?.find(c=>c.id===pr.companyId);if(me&&pr.status==='open'&&!me.won&&(co?.shares?.[me.id]||0)>0&&!Object.hasOwn(pr.ballots,me.id)&&r.status==='playing'&&r.activePlayerId===me.id){for(const [vote,label] of [['yes','Aprovar'],['no','Rejeitar'],['abstain','Abster-se']]){const b=document.createElement('button');b.className='outline';b.textContent=label;b.onclick=()=>perform('proposal-vote',{proposalId:pr.id,vote});el.append(b);}}return el;}));$('teacherActions').hidden=!r.teacher;$('start').disabled=r.status!=='lobby';$('pause').disabled=r.status!=='playing';$('resume').disabled=r.status!=='paused';$('finish').disabled=r.status==='finished';$('advance').disabled=!r.canTeacherAdvance;
const me=r.players.find(p=>p.id===r.you),active=r.players.find(p=>p.id===r.activePlayerId);$('timerInfo').textContent=r.status==='playing'?`Rodada ${r.round} · Restam ${r.secondsRemaining} segundos para o prazo de decisão`:`Rodada ${r.round} · Temporizador suspenso`; $('recoveryInfo').textContent=session?.role==='player'&&session.recoveryCode?`Código pessoal de recuperação: ${session.recoveryCode} (guarde em local seguro)`:session?.role==='teacher'&&session.teacherRecoveryCode?`Código de recuperação do professor: ${session.teacherRecoveryCode} (guarde em local seguro)`:''; $('turnInfo').textContent=active?`Vez de ${active.name}${r.status==='paused'?' (sala pausada)':''}`:'Sem turnos ativos';const allowed=r.status==='playing'&&me?.id===r.activePlayerId;$('playerActions').hidden=!allowed;
const g=r.game;
const edu=$('educationQuestion');edu.replaceChildren();edu.hidden=true;
if(g?.pending&&g.currentCard?.category==='EF'){
 const q=g.currentCard.quizQuestion;
 const ev=g.cardEvents?.at(-1);
 edu.hidden=false;
 const title=document.createElement('p');title.textContent=q?`${g.currentCard.id}: ${q.question}`:`${g.currentCard.id}: pergunta indisponível`;edu.append(title);
 if(q&&ev?.resolution==='pending')q.options.forEach((opt,index)=>{const btn=document.createElement('button');btn.className='outline';btn.textContent=`${'ABCD'[index]}) ${opt}`;btn.onclick=()=>perform('answer-education',{choice:'ABCD'[index]});edu.append(btn);});
 else {const feedback=document.createElement('p');feedback.textContent=g.currentCard.quizFeedback?`Resposta ${g.currentCard.quizFeedback.correct?'correta':'incorreta'}. Gabarito: ${g.currentCard.quizFeedback.correctAnswer}; recompensa ${money(g.currentCard.quizFeedback.reward)}.`:'Pergunta encerrada sem resposta.';edu.append(feedback);}
}
const life=$('lifeDecision');life.replaceChildren();life.hidden=true;
if(g?.pending&&g.currentCard?.category==='EV'){const d=lifeDecision(g.currentCard.id,g.circuit);const ev=g.cardEvents?.at(-1);if(d&&ev?.resolution==='pending'){life.hidden=false;for(const [choice,label] of [['accept',d.accept],['reject',d.reject]]){const b=document.createElement('button');b.className='outline';b.textContent=label;b.onclick=()=>perform('choose-life',{choice});life.append(b);}}else if(g.currentCard?.lifeDecision){life.hidden=false;life.textContent='Decisão registrada: '+g.currentCard.lifeDecision.choice;}}
const philanthropy=philanthropyOffer(g?.currentCard,g?.circuit);if(g?.pending&&philanthropy){life.hidden=false;const p=document.createElement('p');p.textContent=`Filantropia — ${philanthropy.project}. Impacto social estimado, sem benefício financeiro.`;life.append(p);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){for(const [amount,impact] of philanthropy.options){const b=document.createElement('button');b.className='outline';b.textContent=`Contribuir ${money(amount)} — ${impact} ${philanthropy.unit}`;b.disabled=amount*100>g.cash*100+(g.secondaryCashCents??0);b.onclick=()=>perform('philanthropy',{amount});life.append(b);}const b=document.createElement('button');b.textContent='Não contribuir';b.onclick=()=>perform('philanthropy',{amount:0});life.append(b);}}
const cardOfferArea=$('companyOffer');cardOfferArea.replaceChildren();
if(g&&!g.pending&&!g.officialPOEnabled&&allowed){const b=document.createElement('button');b.textContent='Ativar baralho oficial de Pequenas Oportunidades';b.className='outline';b.onclick=()=>perform('official-po-enable');cardOfferArea.append(b);}
if(g?.pending&&g.currentCard?.id==='OE-015'&&g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){
 const companies=(r.companies??[]).filter(c=>(c.shares?.[r.you]??0)>0&&c.pendingExpenses>0);
 const info=document.createElement('p');info.textContent='OE-015 — renegociação de obrigações empresariais, sujeita à análise de capacidade e votação.';cardOfferArea.append(info);
 for(const c of companies){for(const term of [6,12,24]){const b=document.createElement('button');b.textContent=`Renegociar ${c.name} em ${term} fechamentos`;b.onclick=()=>perform('corporate-renegotiate',{companyId:c.id,term});cardOfferArea.append(b);}}
}
const expansion=CORPORATE_EXPANSIONS[g?.currentCard?.id];if(g?.pending&&g.lastTile==='OE'&&expansion&&g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const heading=document.createElement('p');heading.textContent=`${g.currentCard.id} — investimento empresarial ${money(expansion.cost)}; projeção de resultado +${expansion.rate}%, condicionada a lucro verificado.`;cardOfferArea.append(heading);for(const company of (r.companies||[]).filter(c=>(c.shares?.[r.you]||0)>0&&expansion.match.test(c.name)&&(!expansion.requiresProfit||c.retainedProfit>0))){const button=document.createElement('button');button.className='outline';button.textContent=`Propor expansão em ${company.name} (${money(expansion.cost)})`;button.disabled=company.cash<expansion.cost;button.onclick=()=>perform('corporate-expand',{companyId:company.id,cardId:g.currentCard.id});cardOfferArea.append(button);}}
if(g?.pending&&g.currentCard?.id==='OE-004'&&g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){
 const assets=(g.assets??[]).filter(a=>a.passive>0&&a.kind!=='participation'&&a.kind!=='company'&&a.id!=='GO-006');
 const info=document.createElement('p');info.textContent='OE-004: reforma de R$ 20.000, com aluguel +15% no fechamento seguinte.';cardOfferArea.append(info);
 for(const a of assets){const b=document.createElement('button');b.textContent='Reformar '+a.name;b.disabled=g.cash*100+(g.secondaryCashCents??0)<2000000;b.onclick=()=>perform('rental-improve',{ownershipId:a.ownershipId});cardOfferArea.append(b);}
}
if(g?.pending&&g.currentCard?.id==='OE-012'&&g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const info=document.createElement('p');info.textContent='OE-012: participação de 20% por R$ 51.000. A transferência respeita preferência dos sócios atuais por duas rodadas.';cardOfferArea.append(info);const candidates=(r?.companies||[]).filter(c=>c.valuation===300000&&(c.shares?.origin??0)>=20);const chooser=document.createElement('select');const standard=document.createElement('option');standard.value='';standard.textContent='Oferta demonstrativa da carta';chooser.append(standard);for(const c of candidates){const option=document.createElement('option');option.value=c.id;option.textContent=`${c.name} (avaliação R$ 300.000)`;chooser.append(option);}cardOfferArea.append(chooser);const button=document.createElement('button');button.textContent='Apresentar proposta de compra';button.onclick=()=>perform('discount-open',chooser.value?{companyId:chooser.value}:{});cardOfferArea.append(button);}
for(const offer of (r?.discountOffers||[]).filter(o=>o.status==='open'&&r.you)){const eligible=offer.eligible.includes(r.you);const restricted=offer.eligible.length>0&&r.round<=offer.preferenceUntil&&!eligible;const info=document.createElement('p');info.textContent=`OE-012: oferta aberta R$ 51.000 por 20%; preferência até rodada ${offer.preferenceUntil}; encerra na rodada ${offer.expiresRound}.`;cardOfferArea.append(info);const buy=document.createElement('button');buy.textContent='Exercer preferência / comprar OE-012';buy.className='outline';buy.disabled=restricted||(g?.cash*100+(g?.secondaryCashCents??0)<5100000);buy.onclick=()=>perform('discount-accept',{offerId:offer.id});cardOfferArea.append(buy);}
const special=specialAcquisitionOffer(g?.currentCard,g?.circuit);if(g?.pending&&special){const p=document.createElement('p');p.textContent=`${special.id} — ${special.name}, compra à vista por ${money(special.cost)}.`;cardOfferArea.append(p);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent='Comprar oportunidade especial';b.disabled=['OE-007','OE-009'].includes(special.id)||g.cash*100+(g.secondaryCashCents??0)<special.cost*100;b.onclick=()=>perform('special-acquisition-buy');cardOfferArea.append(b);if(['OE-007','OE-009','OE-017','OE-020'].includes(special.id)){const joint=document.createElement('button');joint.className='outline';joint.textContent='Propor aquisição conjunta';joint.onclick=()=>{const invitees=r.players.filter(p=>p.id!==r.you&&!p.won);if(!invitees.length)return msg('Não há estudante para convidar');const raw=prompt('IDs dos convidados: '+invitees.map(p=>`${p.name} (${p.id})`).join(' | '),invitees.map(p=>p.id).join(','));if(raw===null)return;const amountRaw=prompt('Seu aporte em R$ (inferior ao preço total)',String(Math.floor(special.cost/2)));if(amountRaw===null)return;perform('joint-open',{invitees:raw.split(',').map(x=>x.trim()).filter(Boolean),amount:Number(amountRaw)});};cardOfferArea.append(joint);}if(special.id==='OE-010'){for(const term of [6,12,24]){const f=document.createElement('button');f.className='outline';f.textContent=`Financiar imóvel em ${term}x`;f.onclick=()=>{const minimum=Math.ceil(special.cost*.4);const raw=prompt(`Entrada mínima ${money(minimum)}`,String(minimum));if(raw===null)return;const downPayment=Number(raw);if(!Number.isSafeInteger(downPayment))return msg('Entrada inválida');perform('special-acquisition-buy',{term,downPayment});};cardOfferArea.append(f);}}}}
if(g?.pending&&g.currentCard?.id==='OE-016'&&g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent='Amortização extraordinária';b.onclick=()=>{const loans=[...(g.initialDebtCents>0?[{id:'initial',balance:g.initialDebtCents/100}]:[]),...(g.loans??[]).filter(l=>l.balance>0)];if(!loans.length)return msg('Nenhuma dívida ativa');const id=prompt('ID da dívida: '+loans.map(l=>`${l.id} (${money(l.balance)})`).join(' | '),loans[0].id);if(id===null)return;const v=prompt('Amortização mínima R$ 1.000','1000');if(v!==null)perform('special-amortize',{loanId:id,amount:Number(v)});};cardOfferArea.append(b);}
if(g?.pending&&g.currentCard?.id==='OE-014'&&g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){for(const loan of (g.loans??[]).filter(l=>l.balance>0)){
const t=document.createElement('p');t.textContent=`Contrato ${loan.id.slice(0,8)}: saldo ${money(loan.balance)}`;cardOfferArea.append(t);
for(const term of [6,12,24]){const b=document.createElement('button');b.textContent=`Renegociar ${term}x`;b.onclick=()=>perform('special-refinance',{loanId:loan.id,term});cardOfferArea.append(b);}}}
const grand=grandInvestmentOffer(g?.currentCard,g?.circuit);if(g?.pending&&grand){const p=document.createElement('p');p.textContent=`${grand.id} — ${grand.name}. Preço ${money(grand.cost)}. ${grand.kind==='company'?'Lucro de referência sujeito a apuração':'Renda inicial de referência'} ${money(grand.referencePassive)}.`;cardOfferArea.append(p);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent='Comprar à vista';b.disabled=g.cash*100+(g.secondaryCashCents??0)<grand.cost*100;b.onclick=()=>perform('grand-investment-buy',{});cardOfferArea.append(b);if(grand.kind==='participation'){
 const joint=document.createElement('button');joint.className='outline';joint.textContent='Propor aquisição conjunta';
 joint.onclick=()=>{
  const invitees=r.players.filter(p=>p.id!==r.you&&!p.won);
  if(!invitees.length)return msg('Não há outro estudante para convidar');
  const raw=prompt('IDs dos convidados, separados por vírgula: '+invitees.map(p=>`${p.name} (${p.id})`).join(' | '),invitees.map(p=>p.id).join(','));
  if(raw===null)return;
  const ids=raw.split(',').map(x=>x.trim()).filter(Boolean);
  const amount=Number(prompt('Seu aporte inicial em reais (menor que o preço total)',String(Math.floor(grand.cost/2))));
  if(!Number.isSafeInteger(amount))return msg('Aporte inválido');
  perform('joint-open',{invitees:ids,amount});
 };cardOfferArea.append(joint);
}for(const term of (grand.kind==='participation'?[]:[6,12,24])){const f=document.createElement('button');f.className='outline';f.textContent=`Solicitar financiamento ${term}x`;f.onclick=()=>{const min=Math.ceil(grand.cost*grand.minDown/100);const raw=prompt(`Entrada mínima: ${money(min)}`,String(min));if(raw===null)return;const downPayment=Number(raw);if(!Number.isSafeInteger(downPayment))return msg('Entrada inválida');perform('grand-investment-buy',{term,downPayment});};cardOfferArea.append(f);}}}
const sec=officialSecurityOffer(g?.currentCard,g?.circuit);if(g?.pending&&sec&&g.officialPOEnabled){const line=document.createElement('p');const quote=room?.officialMarket?.find(x=>x.id===sec.id);line.textContent=`${sec.id} — ${sec.name}: cotação de referência R$ ${((quote?.priceCents??sec.price*100)/100).toFixed(2)}, limite ${sec.min}–${sec.max}, dividendo de referência R$ ${((quote?.dividendCents??sec.dividendCents)/100).toFixed(2)} por unidade; compra primária segue preço da carta até migração integral do caixa para centavos; venda não garantida.`;cardOfferArea.append(line);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent='Comprar ações/cotas';b.onclick=()=>{const answer=prompt('Quantidade:',String(sec.min));if(answer!==null)perform('official-security-buy',{quantity:Number(answer)});};cardOfferArea.append(b);}}
const fixed=fixedIncomeOffer(g?.currentCard,g?.circuit);if(g?.pending&&fixed&&g.officialPOEnabled){const p=document.createElement('p');p.textContent=`${fixed.id}: ${fixed.name}. Aplicação de ${money(fixed.min)} a ${money(fixed.max)}, passo ${money(fixed.step)}; ${fixed.distribution==='coupon'?'cupom distribuído':'rendimento acumulado'}.`;cardOfferArea.append(p);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent='Aplicar em renda fixa';b.onclick=()=>{const a=prompt(`Valor (${fixed.min}–${fixed.max}, incremento ${fixed.step})`,String(fixed.min));if(a!==null)perform('fixed-subscribe',{amount:Number(a)});};cardOfferArea.append(b);}}
if(g&&!g.pending&&allowed){for(const c of (g.fixedIncome??[]).filter(x=>x.status==='active')){const contract=FIXED_INCOME.find(x=>x.id===c.cardId);const p=document.createElement('p');p.textContent=`${c.cardId}: saldo ${money(c.balance)}, ${c.elapsed} fechamento(s).`;cardOfferArea.append(p);if(['full','discount2'].includes(contract.early)){const b=document.createElement('button');b.textContent=`Resgatar ${c.cardId}`;b.onclick=()=>perform('fixed-redeem',{contractId:c.id});cardOfferArea.append(b);}}}
const poAsset=officialPOAssetOffer(g?.currentCard,g?.circuit);if(poAsset&&g?.pending&&g.officialPOEnabled){const p=document.createElement('p');p.textContent=poAsset.kind==='rental'?`${poAsset.id} — ${poAsset.name}: ${money(poAsset.cost)}; renda inicial ${money(poAsset.passive)} por fechamento.`:`${poAsset.id} — ${poAsset.name}: ${money(poAsset.cost)}; preço-alvo ${money(poAsset.targetPrice)}, sem venda automática ou renda passiva.`;cardOfferArea.append(p);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent=poAsset.kind==='rental'?'Comprar equipamento para locação':'Comprar estoque para revenda';b.className='outline';b.disabled=g.cash<poAsset.cost;b.onclick=()=>perform('official-po-asset-buy');cardOfferArea.append(b);}}
const po=officialSmallBusinessOffer(g?.currentCard,g?.circuit);if(po&&g?.pending&&g.officialPOEnabled){const p=document.createElement('p');p.textContent=`${po.id} — ${po.name}. Preço: ${money(po.cost)}; renda inicial: ${money(po.passive)} por fechamento.`;cardOfferArea.append(p);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent='Adquirir pequeno negócio';b.className='outline';b.disabled=g.cash<po.cost;b.onclick=()=>perform('official-po-buy');cardOfferArea.append(b);}}
const company=officialCompanyOffer(g?.currentCard,g?.circuit);
if(company&&g?.pending){const p=document.createElement('p');p.textContent=`${company.id} — ${company.name}. À vista: ${money(company.cost)}. Distribuição inicial de referência ${money(company.passive)} por fechamento; apuração empresarial futura.`;cardOfferArea.append(p);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent='Adquirir empresa à vista';b.className='outline';b.disabled=g.cash<company.cost;b.onclick=()=>perform('official-company-buy');cardOfferArea.append(b);}}
const realEstateArea=$('realEstateOffer');realEstateArea.replaceChildren();
const offer=realEstateOffer(g?.currentCard,g?.circuit);
if(offer&&g?.pending){const info=document.createElement('p');info.textContent=`${offer.id} — ${offer.name}: ${money(offer.cost)} à vista; renda inicial ${money(offer.passive)} por fechamento (eventos de vacância ainda pendentes).`;realEstateArea.append(info);if(g.cardEvents?.at(-1)?.resolution==='pending'&&allowed){const b=document.createElement('button');b.textContent='Comprar imóvel à vista';b.className='outline';b.disabled=g.cash<offer.cost;b.onclick=()=>perform('real-estate-buy');realEstateArea.append(b);for(const term of [6,12,24]){const down=Math.ceil(offer.cost*offer.minDown/100);const b=document.createElement('button');b.className='outline';b.textContent=`Solicitar financiamento ${term}x · entrada ${money(down)}`;b.onclick=()=>{const response=prompt(`Entrada para ${offer.id} (mínimo R$ ${down}, máximo R$ ${offer.cost-1})`,String(down));if(response===null)return;const downPayment=Number(response);if(!Number.isSafeInteger(downPayment)||downPayment<down||downPayment>=offer.cost)return msg('Entrada inválida.');if(!confirm(`Solicitar análise de crédito para ${offer.id}, entrada ${money(downPayment)}, prazo ${term} fechamentos?`))return;perform('real-estate-finance',{term,downPayment});};realEstateArea.append(b);}} }
if(g){$('personal').textContent=`Caixa: ${formatCashBRL(g)} · Dívida inicial: ${money(g.debt)} · Fechamentos: ${g.closures} · Pendências: ${money((g.arrearsLiving||0)+(g.arrearsLoan||0))} · dividendos na janela atual: ${money(g.pendingCorporatePassive||0)}`;$('roll').disabled=g.pending||g.won;$('end').disabled=!g.pending;const a=VERIFIED_ASSETS.find(x=>x.id===g.currentOffer);window.currentOffer=a?.id;$('buy').hidden=!(g.pending&&a&&!g.offerResolved);$('buy').disabled=!a||g.cash<a.cost;$('offerInfo').textContent=a?`Oferta: ${a.name} por ${money(a.cost)} (renda ${money(a.passive)} por fechamento)`:(g.pending&&g.currentCard?`Carta ${g.currentCard.id} (${g.currentCard.category}):\n${getCard(g.currentCard.id)?.text??'Texto indisponível'}\n${g.currentCard.effectExecuted?'Efeito automático registrado no histórico; encerre o turno.':'Sem efeito automático implementado para esta carta; encerre o turno.'}`:g.pending?'Esta casa ainda não possui um evento implementado. Encerre o turno.':'');}else{$('personal').textContent='Painel de acompanhamento dos estudantes.';$('offerInfo').textContent='';}
updateLayout(r);}
if(session){req(`/api/room/${session.code}`).then(render).catch(e=>{session=null;sessionStorage.removeItem('cr-room-session');msg(e.message);});}
setInterval(()=>{if(session&&document.visibilityState==='visible')req(`/api/room/${session.code}`).then(render).catch(e=>msg(e.message));},2500);

// Interface de homologação v2.0: toda a apresentação é derivada do estado já retornado pelo servidor.
const TILE_LABELS={PAY:'Pagamento',PO:'Pequena oportunidade',GO:'Grande oportunidade',GI:'Grande investimento',OE:'Oportunidade especial',DI:'Despesa inesperada',EV:'Evento da vida',EF:'Educação financeira',BE:'Benefício',MF:'Mercado financeiro',FI:'Filantropia'};
const CATEGORY_LABELS={PO:'Pequena Oportunidade',GO:'Grande Oportunidade',GI:'Grande Investimento',OE:'Oportunidade Especial',DI:'Despesa Inesperada',EV:'Evento da Vida',EF:'Educação Financeira',BE:'Benefício',MF:'Mercado Financeiro',FI:'Filantropia'};
const cleanMarkdown=value=>String(value??'').replace(/\\\$/g,'R$').replace(/\*\*/g,'').replace(/^\s*#{1,5}\s*/gm,'').replace(/\s+/g,' ').trim();
function splitCardText(original,id){
 const text=String(original??'').replace(/\\\$/g,'R$').replace(/\*\*/g,'').replace(/^\s*#{1,5}\s*/gm,'').replace(/\r/g,'');
 const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean).filter(x=>x!==id);
 const categoryLines=new Set(['Pequeno negócio','Imóvel','Ações','Renda fixa','Grande investimento','Oportunidade especial']);
 const title=lines.find((x,i)=>i>0&&!categoryLines.has(x)&&!x.includes(':')&&x.length<100) || lines.find(x=>x.length<95&&!x.includes(':')) || id;
 const after=lines.slice(lines.indexOf(title)+1);
 const description=after.find(x=>!/(?:^|\s)(?:Investimento|Preço|Requisito|Decisão|Consequência|Risco|Liquidez|Aprendizagem|Aprendizado):/i.test(x))||'';
 const fields=[];
 const combined=after.filter(x=>x!==description).join(' ');
 for(const name of ['Investimento','Preço','Renda líquida inicial','Renda inicial','Requisito','Decisão','Consequência','Risco','Liquidez','Aprendizagem','Aprendizado']){
  const re=new RegExp(`(?:^|[.;]\\s*|\\s)(`+name+`):\\s*([\\s\\S]*?)(?=(?:\\.\\s+|;\\s+)(?:Investimento|Preço|Renda líquida inicial|Renda inicial|Requisito|Decisão|Consequência|Risco|Liquidez|Aprendizagem|Aprendizado):|$)`,'i');
  const m=combined.match(re);if(m)fields.push([name,m[2].trim().replace(/[.;]$/,'')]);
 }
 return {title:cleanMarkdown(title),description:cleanMarkdown(description),fields,raw:cleanMarkdown(combined)};
}
const displayLabel=(node,label,value)=>{const block=document.createElement('div');block.className='metric';const cap=document.createElement('span');cap.textContent=label;const strong=document.createElement('strong');strong.textContent=value;block.append(cap,strong);node.append(block);};
function drawBoard(r){
 const el=$('boardVisual');const current=r.game?.circuit==='outer'?'outer':r.players.find(p=>p.id===r.activePlayerId)?.circuit==='outer'?'outer':'inner';const tiles=current==='outer'?OUTER:INNER;
 const side=current==='outer'?13:9;el.style.setProperty('--board-side',side);el.replaceChildren();$('boardCircuit').textContent=current==='outer'?'Alta Velocidade · 48 casas':'Corrida dos Ratos · 32 casas';
 const coords=[];for(let x=1;x<=side;x++)coords.push([1,x]);for(let y=2;y<=side;y++)coords.push([y,side]);for(let x=side-1;x>=1;x--)coords.push([side,x]);for(let y=side-1;y>=2;y--)coords.push([y,1]);
 tiles.forEach((code,i)=>{
  const [y,x]=coords[i];const tile=document.createElement('div');const occupants=r.players.filter(p=>p.circuit===current&&p.position===i);
  const dream=code.startsWith('DREAM:');tile.className='board-cell'+(occupants.length?' occupied':'')+(dream?' dream-cell':'')+(code==='PAY'?' pay-cell':'');tile.style.gridColumn=x;tile.style.gridRow=y;tile.title=`Casa ${i} · ${dream?'Sonho':(TILE_LABELS[code]||code)}${occupants.length?' · '+occupants.map(p=>p.name).join(', '):''}`;
  const number=document.createElement('span');number.className='tile-number';number.textContent=i;const type=document.createElement('strong');type.className='tile-type';type.textContent=dream?'★':code;tile.append(number,type);
  if(occupants.length){const holder=document.createElement('div');holder.className='player-dots';occupants.forEach((p,n)=>{const dot=document.createElement('span');dot.className='player-dot';dot.style.background=['#f0bd6b','#5fcab3','#9d96ec','#ef848c','#78baf4','#e6d579'][r.players.indexOf(p)%6];dot.textContent=p.name.slice(0,1).toUpperCase();dot.title=p.name;holder.append(dot);});tile.append(holder);}
  el.append(tile);
 });
 const center=document.createElement('div');center.className='board-center';center.style.gridColumn=`2 / ${side}`;center.style.gridRow=`2 / ${side}`;
 const heading=document.createElement('strong');heading.textContent=current==='outer'?'ALTA VELOCIDADE':'CORRIDA DOS RATOS';const sub=document.createElement('span');sub.textContent=`Rodada ${r.round} · ${r.players.length} participante(s)`;
 const legend=document.createElement('div');legend.className='board-legend';r.players.filter(p=>p.circuit===current).forEach(p=>{const tag=document.createElement('span');tag.textContent=`● ${p.name}`;tag.style.color=['#f0bd6b','#5fcab3','#9d96ec','#ef848c','#78baf4','#e6d579'][r.players.indexOf(p)%6];legend.append(tag);});center.append(heading,sub,legend);el.append(center);
}
function updateLayout(r){
 $('teacherPanel').hidden=!r.teacher;
 $('financeHeading').textContent=r.teacher?'Acompanhamento da turma':'Minhas finanças';
 const active=r.players.find(p=>p.id===r.activePlayerId),g=r.game,me=r.players.find(p=>p.id===r.you);
 drawBoard(r);
 const pending=Boolean(g?.pending),alreadyResolved=Boolean(g?.cardEvents?.at(-1)?.resolution&&g.cardEvents.at(-1).resolution!=='pending');
 $('end').textContent=pending&&!alreadyResolved?'Recusar / encerrar turno':'Encerrar turno';
 $('turnStage').textContent=r.status==='paused'?'Pausada':r.status==='finished'?'Encerrada':r.status==='lobby'?'Aguardando início':!active?'Aguardando':pending?(alreadyResolved?'Decisão registrada':'Aguardando decisão'):'Lançar dado';
 const move=$('moveSummary');move.replaceChildren();
 if(active){displayLabel(move,'Jogador atual',active.name);displayLabel(move,'Casa atual',`${active.position} · ${active.circuit==='outer'?'Alta Velocidade':'Corrida dos Ratos'}`);displayLabel(move,'Tipo de casa',TILE_LABELS[g?.lastTile]||(g?.lastTile?.startsWith('DREAM:')?'Sonho':pending?'Carta / evento':'Aguardando dado'));}
 const card=g?.currentCard;const cardPanel=$('currentCardPanel');cardPanel.hidden=!pending||!card;
 if(!cardPanel.hidden){
  const approved=getCard(card.id);const content=splitCardText(approved?.text,card.id);
  $('cardIdentifier').textContent=card.id;$('cardCategory').textContent=CATEGORY_LABELS[card.category]||card.category;
  $('cardTitle').textContent=content.title;$('cardDescription').textContent=content.description||'Leia as condições desta carta e escolha uma das ações disponíveis.';
  const metrics=$('cardMetrics'),sections=$('cardSections');metrics.replaceChildren();sections.replaceChildren();
  const summary=content.fields.filter(([label])=>/Investimento|Preço|Renda inicial|Renda líquida inicial|Liquidez/i.test(label));
  summary.forEach(([label,value])=>displayLabel(metrics,label,value));
  for(const [label,value] of content.fields.filter(([label])=>!/Investimento|Preço|Renda inicial|Renda líquida inicial|Liquidez|Aprendizagem|Aprendizado/i.test(label))){const section=document.createElement('div');section.className='card-field';const title=document.createElement('strong');title.textContent=label;const desc=document.createElement('p');desc.textContent=value;section.append(title,desc);sections.append(section);}
  if(!content.fields.length&&content.raw){const section=document.createElement('p');section.className='card-fallback';section.textContent=content.raw;sections.append(section);}
  const learning=content.fields.find(([label])=>/Aprendizagem|Aprendizado/i.test(label));$('cardLearning').hidden=!learning;$('cardLearning').textContent=learning?`Aprendizado · ${learning[1]}`:'';
  const direct=officialSmallBusinessOffer(card,g.circuit)||officialCompanyOffer(card,g.circuit)||realEstateOffer(card,g.circuit)||officialPOAssetOffer(card,g.circuit)||grandInvestmentOffer(card,g.circuit)||specialAcquisitionOffer(card,g.circuit);
  const cash=g.cash*100+(g.secondaryCashCents??0);const eligibility=$('cardEligibility');
  if(direct?.cost&&alreadyResolved){eligibility.textContent='Decisão registrada. Confira o histórico e encerre o turno.';eligibility.className='eligibility-hint success-hint';}
  else if(direct?.cost){const ok=cash>=direct.cost*100;eligibility.textContent=ok?`Caixa: ${formatCashBRL(g)} · Valor: ${money(direct.cost)}. Você possui saldo para a opção à vista.`:`Caixa: ${formatCashBRL(g)} · Valor: ${money(direct.cost)}. Saldo insuficiente para a compra à vista.`;eligibility.className='eligibility-hint '+(ok?'success-hint':'error-hint');}
  else{eligibility.textContent=alreadyResolved?'Evento ou decisão registrados. Você pode encerrar o turno.':'Escolha uma das ações disponíveis no painel do turno. Se a carta tiver efeito automático, ele será registrado pelo jogo.';eligibility.className='eligibility-hint';}
 }
 const hint=$('actionHint');
 if(r.teacher)hint.textContent='Acompanhe o turno dos estudantes. Os controles administrativos estão no painel do professor.';
 else if(!me)hint.textContent='Você está acompanhando a partida.';
 else if(r.status==='paused')hint.textContent='A sala está pausada pelo professor.';
 else if(r.activePlayerId!==r.you)hint.textContent=`Aguarde: agora é a vez de ${active?.name||'outro participante'}.`;
 else if(!pending)hint.textContent='Lance o dado para avançar e descobrir a próxima casa.';
 else if(alreadyResolved)hint.textContent='A decisão foi processada. Encerre o turno para continuar.';
 else hint.textContent='Confira a carta abaixo. Execute uma das ações disponíveis ou encerre o turno se não quiser realizar a oportunidade.';
 const dream=DREAMS[me?.dreamId];$('dreamSummary').replaceChildren();if(dream){const title=document.createElement('strong');title.textContent=`Meu sonho · ${dream.name}`;const detail=document.createElement('p');detail.textContent=me?.won?'Sonho realizado!':`Objetivo para a Alta Velocidade${dream.cost?` · ${money(dream.cost)}`:''}`;$('dreamSummary').append(title,detail);}
 // A listagem de empresas deve ser secundária ao tabuleiro e ao turno.
}
