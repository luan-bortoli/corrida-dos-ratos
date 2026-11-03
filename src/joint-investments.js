import {randomUUID} from 'node:crypto';
import {GRAND_PARTICIPATIONS} from './grand-investments.js';
import {SPECIAL_ACQUISITIONS} from './special-opportunities.js';
import {cashBalanceCents,debitCashCents} from './money-balance.js';

// Proposta coletiva de participação societária: sem financiamento e sem débito antecipado.
const safe=(v)=>Number.isSafeInteger(v)&&v>0;
export function ensureJointInvestments(room){room.jointInvestments??=[];return room.jointInvestments;}
function participant(room,id){return room.players?.find(p=>p.id===id&&!p.game.won);}
export function openJointInvestment(room,authorId,amount,invitees){
 const owner=participant(room,authorId),game=owner?.game;
 const isGI=game?.currentCard?.category==='GI';
 const offer=(isGI?GRAND_PARTICIPATIONS:SPECIAL_ACQUISITIONS.filter(o=>['OE-007','OE-009','OE-017','OE-020'].includes(o.id))).find(o=>o.id===game?.currentCard?.id);
 if(!offer||!game.pending||game.circuit!=='outer'||game.lastTile!==(isGI?'GI':'OE')||game.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há participação GI/OE pendente para proposta conjunta');
 if(!safe(amount)||amount>=offer.cost||!Array.isArray(invitees)||invitees.length<1||invitees.length>5||new Set(invitees).size!==invitees.length||invitees.includes(authorId)||invitees.some(id=>!participant(room,id)))throw Error('Convites ou aporte inicial inválidos');
 if(cashBalanceCents(game)<amount*100)throw Error('Caixa do proponente insuficiente');
 if(ensureJointInvestments(room).some(p=>p.authorId===authorId&&p.status==='open'))throw Error('Já existe proposta conjunta pendente');
 const proposal={id:randomUUID(),cardId:offer.id,authorId,offerCost:offer.cost,percent:offer.percent,companyName:offer.name,invitedIds:[...invitees],commitments:{[authorId]:amount},declinedIds:[],createdRound:room.round,expiresRound:room.round+2,status:'open',settledRound:null};
 room.jointInvestments.push(proposal);
 const event=game.cardEvents.at(-1);event.resolution='joint_proposal';event.financialEffect=false;game.currentCard.effectExecuted=true;game.currentCard.jointProposalId=proposal.id;
 return proposal;
}
export function acceptJointInvestment(room,playerId,proposalId,amount){
 const p=ensureJointInvestments(room).find(p=>p.id===proposalId);
 if(!p||p.status!=='open'||room.round>p.expiresRound)throw Error('Proposta conjunta indisponível ou expirada');
 if(!p.invitedIds.includes(playerId)||!participant(room,playerId)||Object.hasOwn(p.commitments,playerId)||p.declinedIds.includes(playerId))throw Error('Participante sem convite válido');
 if(!safe(amount))throw Error('Aporte inválido');
 const total=Object.values(p.commitments).reduce((a,b)=>a+b,0);
 if(total+amount>p.offerCost)throw Error('Aportes excedem o preço da participação');
 if(cashBalanceCents(participant(room,playerId).game)<amount*100)throw Error('Caixa insuficiente para o aporte');
 p.commitments[playerId]=amount;
 if(total+amount===p.offerCost)return settleJointInvestment(room,p.id);
 return p;
}
export function declineJointInvestment(room,playerId,proposalId){
 const p=ensureJointInvestments(room).find(p=>p.id===proposalId);
 if(!p||p.status!=='open'||room.round>p.expiresRound||!p.invitedIds.includes(playerId)||Object.hasOwn(p.commitments,playerId))throw Error('Convite indisponível');
 if(!p.declinedIds.includes(playerId))p.declinedIds.push(playerId);
 return p;
}
export function settleJointInvestment(room,proposalId){
 const p=ensureJointInvestments(room).find(p=>p.id===proposalId);
 if(!p||p.status!=='open'||room.round>p.expiresRound)throw Error('Proposta indisponível');
 const entries=Object.entries(p.commitments),total=entries.reduce((sum,[,v])=>sum+v,0);
 if(total!==p.offerCost||entries.length<2)throw Error('Preço não integralmente coberto por dois participantes');
 // Pré-validação atômica: nenhum participante é debitado se qualquer aporte falhar.
 for(const [id,amount] of entries){const player=participant(room,id);if(!player||cashBalanceCents(player.game)<amount*100)throw Error('Saldo insuficiente na liquidação coletiva');}
 const offer=[...GRAND_PARTICIPATIONS,...SPECIAL_ACQUISITIONS.filter(o=>['OE-007','OE-009','OE-017','OE-020'].includes(o.id))].find(o=>o.id===p.cardId);
 if(!offer)throw Error('Participação desconhecida');
 const ownershipId=randomUUID();
 for(const [id,amount] of entries){
  const g=participant(room,id).game;debitCashCents(g,amount*100);
  g.ledger??=[];g.ledger.push({id:randomUUID(),turn:g.turn,closure:g.closures,kind:'joint_investment_purchase',amount:-amount,description:`Aporte coletivo ${p.cardId}`,cardId:p.cardId,jointProposalId:p.id});
  g.assets??=[];g.assets.push({...offer,ownershipId:`${ownershipId}:${id}`,source:p.cardId.startsWith('GI-')?'official_joint_grand_participation':'official_joint_special_participation',jointProposalId:p.id,contribution:amount,percent:offer.percent*amount/p.offerCost,passive: ['OE-007','OE-009'].includes(p.cardId)?Math.floor(offer.referencePassive*amount/p.offerCost):0,incomeStatus:['OE-007','OE-009'].includes(p.cardId)?'reference_rental_income':'requires_verified_operating_profit'});
  if(id===p.authorId){const event=g.cardEvents?.find(e=>e.id===p.cardId&&e.resolution==='joint_proposal');if(event){event.resolution='joint_purchase';event.financialEffect=true;}}
 }
 p.status='settled';p.settledRound=room.round;p.ownershipId=ownershipId;
 return p;
}
export function expireJointInvestments(room){for(const p of ensureJointInvestments(room)){if(p.status==='open'&&room.round>p.expiresRound)p.status='expired';}}
export function publicJointInvestments(room){return ensureJointInvestments(room).map(p=>({...p,commitments:{...p.commitments},invitedIds:[...p.invitedIds],declinedIds:[...p.declinedIds]}));}
