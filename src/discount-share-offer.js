// OE-012: oferta demonstrativa de venda de 20% por vendedor externo.
// Sem lucro presumido. A preferência protege os sócios já existentes na abertura.
import {randomUUID} from 'node:crypto';
import {cashBalanceCents,debitCashCents} from './money-balance.js';
export const DISCOUNT_SHARE={id:'OE-012',name:'Participação Societária com Desconto',price:51000,percent:20,valuation:300000,referenceDistribution:3000};
function member(room,id){return room.players?.find(p=>p.id===id&&!p.game.won);}
export function ensureDiscountCompany(room){
 room.companies??=[];
 let company=room.companies.find(c=>c.id==='OE-012');
 if(!company){company={id:'OE-012',name:DISCOUNT_SHARE.name,valuation:300000,referenceDistribution:3000,reserveRequired:6000,cash:6000,initialCapital:6000,retainedProfit:0,pendingExpenses:0,shares:{origin:100},offer:{percent:20,price:51000},history:[],lastClosedRound:0,distributions:[],operatingLedger:[],closedOperatingPeriods:[]};room.companies.push(company);}
 return company;
}
export function ensureDiscountOffers(room){room.discountOffers??=[];return room.discountOffers;}
export function openDiscountOffer(room,authorId,companyId=null){
 const g=member(room,authorId)?.game;
 if(!g?.pending||g.circuit!=='outer'||g.lastTile!=='OE'||g.currentCard?.id!=='OE-012'||g.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Carta OE-012 não disponível');
 const c=companyId?room.companies?.find(x=>x.id===companyId):ensureDiscountCompany(room);
 if(!c||c.valuation!==300000||!Number.isSafeInteger(c.shares?.origin))throw Error('Empresa incompatível com a oferta aprovada de R$ 300.000');
 if(c.shares.origin<20)throw Error('Participação externa indisponível');
 if(ensureDiscountOffers(room).some(o=>o.status==='open'))throw Error('Já existe oferta OE-012 aberta');
 const eligible=Object.entries(c.shares).filter(([id,percent])=>id!=='origin'&&percent>0&&member(room,id)).map(([id])=>id);
 const offer={id:randomUUID(),cardId:'OE-012',authorId,companyId:c.id,price:51000,percent:20,createdRound:room.round,preferenceUntil:eligible.length?room.round+2:room.round,expiresRound:room.round+4,eligible,status:'open'};
 room.discountOffers.push(offer);
 const ev=g.cardEvents.at(-1);ev.resolution='share_proposal';ev.financialEffect=false;g.currentCard.effectExecuted=true;
 return offer;
}
export function acceptDiscountOffer(room,buyerId,offerId){
 const o=ensureDiscountOffers(room).find(x=>x.id===offerId&&x.status==='open');
 if(!o||room.round>o.expiresRound)throw Error('Oferta indisponível ou vencida');
 const p=member(room,buyerId),c=room.companies?.find(x=>x.id===o.companyId);
 if(!p)throw Error('Comprador inválido');
 if(!c)throw Error('Empresa ofertada indisponível');
 if(room.round<=o.preferenceUntil&&o.eligible.length&&!o.eligible.includes(buyerId))throw Error('Direito de preferência dos sócios em vigor');
 if(c.shares.origin<o.percent)throw Error('Participação externa indisponível');
 if(cashBalanceCents(p.game)<o.price*100)throw Error('Caixa insuficiente');
 const before=p.game.cash;
 debitCashCents(p.game,o.price*100);
 p.game.ledger.push({id:randomUUID(),turn:p.game.turn,closure:p.game.closures,kind:'discount_share_purchase',amount:p.game.cash-before,amountCents:-o.price*100,description:'Aquisição OE-012 de 20% da empresa',cardId:'OE-012',companyId:c.id});
 c.shares.origin-=o.percent;c.shares[buyerId]=(c.shares[buyerId]||0)+o.percent;
 room.externalSellerCash=(room.externalSellerCash??0)+o.price;
 c.history.push({type:'discount_share_purchase',buyerId,percent:o.percent,price:o.price,round:room.round});
 o.status='settled';o.buyerId=buyerId;o.settledRound=room.round;
 const author=member(room,o.authorId)?.game;if(author){const ev=author.cardEvents?.find(e=>e.id==='OE-012'&&e.resolution==='share_proposal');if(ev){ev.resolution='share_purchase';ev.financialEffect=true;}}
 return o;
}
export function expireDiscountOffers(room){for(const o of ensureDiscountOffers(room)){if(o.status==='open'&&room.round>o.expiresRound)o.status='expired';}}
export function publicDiscountOffers(room){return ensureDiscountOffers(room).map(o=>({...o,eligible:[...o.eligible]}));}
