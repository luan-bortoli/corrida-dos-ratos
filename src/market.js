// Mercado societário entre estudantes. Propostas não criam quotas nem dinheiro.
import {randomUUID} from 'node:crypto';
const int=n=>Number.isSafeInteger(n)&&n>=0;
const validShares=c=>Object.values(c.shares).every(int)&&Object.values(c.shares).reduce((a,b)=>a+b,0)===100;
export function ensureMarket(room){room.shareOffers??=[];}
export function publishShareOffer(room,sellerId,companyId,percent,price){
 ensureMarket(room);
 if(!int(percent)||percent<1||percent>100||!int(price)||price<1)throw Error('Percentual ou preço inválido');
 const c=room.companies.find(x=>x.id===companyId),seller=room.players.find(x=>x.id===sellerId);
 if(!c||!seller)throw Error('Empresa ou vendedor inexistente');
 if((c.shares[sellerId]||0)<percent)throw Error('Participação insuficiente');
 if(room.shareOffers.some(o=>o.status==='open'&&o.sellerId===sellerId&&o.companyId===companyId))throw Error('Há uma oferta ativa desta empresa');
 const eligible=Object.entries(c.shares).filter(([id,share])=>id!=='origin'&&id!==sellerId&&share>0&&room.players.some(p=>p.id===id&&!p.game.won)).map(([id])=>id);
 const offer={id:randomUUID(),companyId,sellerId,percent,price,createdRound:room.round,preferenceUntil:eligible.length?room.round+2:room.round,expiresRound:room.round+4,eligible,status:'open'};
 room.shareOffers.push(offer);return offer;
}
export function acceptShareOffer(room,buyerId,offerId){
 ensureMarket(room);
 const o=room.shareOffers.find(x=>x.id===offerId&&x.status==='open');if(!o)throw Error('Oferta indisponível');
 if(buyerId===o.sellerId)throw Error('Não é permitido comprar sua própria oferta');
 const buyer=room.players.find(p=>p.id===buyerId),seller=room.players.find(p=>p.id===o.sellerId),c=room.companies.find(x=>x.id===o.companyId);
 if(!buyer||!seller||!c||buyer.game.won)throw Error('Participante ou empresa indisponível');
 if(room.round>o.expiresRound)throw Error('Oferta vencida');
 if(room.round<=o.preferenceUntil&&o.eligible.length&&!o.eligible.includes(buyerId))throw Error('Direito de preferência dos sócios ainda vigente');
 if((c.shares[o.sellerId]||0)<o.percent)throw Error('Participação não está mais disponível');
 if(buyer.game.cash<o.price)throw Error('Caixa do comprador insuficiente');
 // A transferência de cotas e de caixa é indivisível nesta transação serializada no servidor.
 buyer.game.cash-=o.price;seller.game.cash+=o.price;
 buyer.game.ledger.push({id:randomUUID(),turn:buyer.game.turn,closure:buyer.game.closures,kind:'share_trade_buy',amount:-o.price,companyId:c.id,description:`Compra de ${o.percent}% em ${c.name}`});
 seller.game.ledger.push({id:randomUUID(),turn:seller.game.turn,closure:seller.game.closures,kind:'share_trade_sell',amount:o.price,companyId:c.id,description:`Venda de ${o.percent}% em ${c.name}`});
 c.shares[o.sellerId]-=o.percent;c.shares[buyerId]=(c.shares[buyerId]||0)+o.percent;
 o.status='accepted';o.buyerId=buyerId;o.executedRound=room.round;
 c.history.push({type:'share_trade',sellerId:o.sellerId,buyerId,percent:o.percent,price:o.price,round:room.round});
 if(!validShares(c))throw Error('Inconsistência de participações');
 return o;
}
export function expireShareOffers(room){ensureMarket(room);for(const o of room.shareOffers)if(o.status==='open'&&room.round>o.expiresRound)o.status='expired';}
export function publicShareOffers(room){ensureMarket(room);return room.shareOffers.map(({id,companyId,sellerId,percent,price,preferenceUntil,expiresRound,eligible,status,buyerId})=>({id,companyId,sellerId,percent,price,preferenceUntil,expiresRound,eligible,status,buyerId}));}
