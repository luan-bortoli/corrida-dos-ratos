import {randomUUID} from 'node:crypto';
const validInteger=n=>Number.isSafeInteger(n)&&n>=0;
export function ensureGovernance(room){room.proposals??=[];for(const c of room.companies||[]){c.operatingLedger??=[];c.closedOperatingPeriods??=[];}}
export function openProposal(room,playerId,companyId,title){
 ensureGovernance(room);
 const c=room.companies?.find(c=>c.id===companyId);
 if(!c||!room.players.some(p=>p.id===playerId))throw Error('Empresa ou estudante não encontrado');
 if((c.shares[playerId]||0)<=0)throw Error('Apenas sócios podem propor');
 if(typeof title!=='string'||title.trim().length<5||title.trim().length>120)throw Error('Descrição deve ter 5 a 120 caracteres');
 if(room.proposals.some(p=>p.companyId===companyId&&p.status==='open'))throw Error('Já existe proposta empresarial em votação');
 const proposal={id:randomUUID(),companyId,authorId:playerId,title:title.trim(),createdRound:room.round,expiresRound:room.round+2,status:'open',ballots:{},resolution:null};room.proposals.push(proposal);return proposal;
}
export function castVote(room,playerId,proposalId,vote){
 ensureGovernance(room);const p=room.proposals.find(p=>p.id===proposalId);if(!p||p.status!=='open')throw Error('Votação encerrada ou inexistente');
 if(!['yes','no','abstain'].includes(vote))throw Error('Voto inválido');
 if(room.round>p.expiresRound)throw Error('Prazo da votação expirou');
 const c=room.companies.find(c=>c.id===p.companyId);const member=room.players.find(x=>x.id===playerId);
 if(!member||member.game.won||(c.shares[playerId]||0)<=0)throw Error('Participante sem direito de voto');
 if(Object.hasOwn(p.ballots,playerId))throw Error('Voto já registrado');
 p.ballots[playerId]=vote;return resolveProposal(room,p);
}
export function resolveProposal(room,p){
 if(p.status!=='open')return p;
 const c=room.companies.find(c=>c.id===p.companyId);const yes=Object.entries(p.ballots).reduce((n,[id,v])=>n+(v==='yes'?(c.shares[id]||0):0),0);
 const no=Object.entries(p.ballots).reduce((n,[id,v])=>n+(v==='no'?(c.shares[id]||0):0),0);
 const eligible=Object.keys(c.shares).filter(id=>id!=='origin'&&c.shares[id]>0&&room.players.some(x=>x.id===id&&!x.game.won));
 const allVoted=eligible.every(id=>Object.hasOwn(p.ballots,id));
 if(yes>50){p.status='approved';p.resolution={yes,no,denominator:100,round:room.round};}
 else if(room.round>p.expiresRound||allVoted){p.status='rejected';p.resolution={yes,no,denominator:100,round:room.round};}
 // Approval is recorded; no money movement until a validated corporate operation exists.
 return p;
}
export function expireProposals(room){ensureGovernance(room);for(const p of room.proposals)resolveProposal(room,p);}
export function publicProposals(room){ensureGovernance(room);return room.proposals.map(p=>({id:p.id,companyId:p.companyId,authorId:p.authorId,title:p.title,createdRound:p.createdRound,expiresRound:p.expiresRound,status:p.status,ballots:p.ballots,resolution:p.resolution}));}
export function recordVerifiedOperatingEvent(company,event){
 // Engine-only API: the future literal card catalog must authorize each business event.
 if(!event||typeof event.sourceId!=='string'||!/^[-A-Z0-9:]{3,80}$/.test(event.sourceId)||!['revenue','expense'].includes(event.type)||!validInteger(event.amount)||event.amount===0||!validInteger(event.round))throw Error('Evento financeiro inválido');
 company.operatingLedger??=[];
 if(company.operatingLedger.some(x=>x.sourceId===event.sourceId))throw Error('Evento empresarial repetido');
 if(event.type==='expense'&&company.cash<event.amount)throw Error('Caixa empresarial insuficiente; obrigação precisa de tratamento próprio');
 // Melhorias de capital incidem SOMENTE sobre receita efetivamente comprovada,
 // a partir da rodada seguinte à aprovação. Não geram receitas recorrentes por si.
 const active=event.type==='revenue'?(company.capitalImprovements??[]).filter(i=>
  Number.isSafeInteger(i.rate)&&i.rate>=0&&Number.isSafeInteger(i.firstEligibleRound)&&event.round>=i.firstEligibleRound):[];
 let amount=event.amount;
 for(const improvement of active){
  amount=Math.round(amount*(100+improvement.rate)/100);
  if(!Number.isSafeInteger(amount))throw Error('Receita após melhoria excede limite monetário');
 }
 if(!Number.isSafeInteger(company.cash+(event.type==='revenue'?amount:-amount))||
    !Number.isSafeInteger(company.retainedProfit+(event.type==='revenue'?amount:-amount)))throw Error('Saldo empresarial fora do limite');
 company.cash+=event.type==='revenue'?amount:-amount;
 company.retainedProfit+=event.type==='revenue'?amount:-amount;
 company.operatingLedger.push({sourceId:event.sourceId,type:event.type,amount,baseAmount:event.amount,
  improvementBonus:amount-event.amount,appliedImprovements:active.map(i=>i.cardId),round:event.round});
 return company;
}
