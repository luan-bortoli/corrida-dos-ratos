import {cashBalanceCents,transferCashCents} from './money-balance.js';
// Mercado secundário oficial. Não cria caixa nem compradores artificiais.
// Compatibilidade: saldo e extrato pessoais ainda usam reais inteiros.
import {randomUUID} from 'node:crypto';
import {OFFICIAL_SECURITIES,ISSUE_UNITS} from './official-securities.js';
import {quoteSettlement,auditSecondarySettlement} from './secondary-settlement.js';
import {officialRoomQuote,synchronizeOfficialPosition} from './global-market.js';
const integer=n=>Number.isSafeInteger(n)&&n>0;
const limits={stock:10,fund:20};
export function ensureSecondary(room){room.secondaryOffers??=[];room.secondaryTrades??=[];room.secondaryVolumes??={};}
const instrument=id=>OFFICIAL_SECURITIES.find(s=>s.id===id);
const participant=(r,id)=>r.players?.find(p=>p.id===id);
const open=(r,id)=>r.secondaryOffers.find(o=>o.id===id&&o.status==='open');
const reserved=(r,id,playerId)=>r.secondaryOffers.filter(o=>o.status==='open'&&o.securityId===id&&o.sellerId===playerId).reduce((a,o)=>a+o.units,0);
export function listSecondary(room,sellerId,securityId,units){
 ensureSecondary(room);const s=instrument(securityId),p=participant(room,sellerId);
 if(!s||!p||p.game.won||!integer(units)||units>(p.game.officialSecurities?.[securityId]??0)-reserved(room,securityId,sellerId))throw Error('Titularidade ou quantidade indisponível');
 const quote=officialRoomQuote(room,securityId);
 if(!integer(quote.priceCents))throw Error('Cotação indisponível para negociação');
 const offer={id:randomUUID(),securityId,sellerId,units,createdRound:room.round,status:'open'};
 room.secondaryOffers.push(offer);return offer;
}
export function cancelSecondary(room,sellerId,offerId){ensureSecondary(room);const o=open(room,offerId);if(!o||o.sellerId!==sellerId)throw Error('Oferta indisponível');o.status='cancelled';return o;}
export function buySecondary(room,buyerId,offerId,units){
 ensureSecondary(room);const o=open(room,offerId),buyer=participant(room,buyerId);
 if(!o||!buyer||buyer.game.won||o.sellerId===buyerId||!integer(units)||units>o.units)throw Error('Oferta ou comprador inválido');
 const s=instrument(o.securityId),seller=participant(room,o.sellerId);
 if(!s||!seller||seller.game.won||!integer(room.round)||!Number.isSafeInteger(room.round))throw Error('Mercado indisponível');
 const limit=Math.floor(ISSUE_UNITS*limits[s.kind]/100),used=room.secondaryVolumes[room.round]?.[s.id]??0;
 if(units>limit-used)throw Error('Limite de liquidez da rodada excedido');
 if((seller.game.officialSecurities?.[s.id]??0)<reserved(room,s.id,seller.id))throw Error('Titularidade insuficiente');
 const priceCents=officialRoomQuote(room,s.id).priceCents;
 const totalCents=quoteSettlement(priceCents,units,buyer.game.cash).totalCents;
 const beforeBuyer=cashBalanceCents(buyer.game),beforeSeller=cashBalanceCents(seller.game);
 if(beforeBuyer<totalCents||!Number.isSafeInteger(beforeSeller+totalCents))throw Error('Saldo insuficiente ou inválido');
 const amount=totalCents/100;
 const tradeId=randomUUID();
 if(!Array.isArray(buyer.game.ledger)||!Array.isArray(seller.game.ledger))throw Error('Extrato inválido');
 buyer.game.officialSecurities??={};seller.game.officialSecurities??={};
 const oldBuyerCash=buyer.game.cash,oldSellerCash=seller.game.cash;
 transferCashCents(buyer.game,seller.game,totalCents);
 seller.game.officialSecurities[s.id]-=units;buyer.game.officialSecurities[s.id]=(buyer.game.officialSecurities[s.id]??0)+units;
 for(const [player,delta,kind,oldCash] of [[buyer,-totalCents,'secondary_security_buy',oldBuyerCash],[seller,totalCents,'secondary_security_sell',oldSellerCash]]){
  player.game.ledger.push({id:randomUUID(),tradeId,kind,amount:player.game.cash-oldCash,amountCents:delta,turn:player.game.turn,closure:player.game.closures,description:`Mercado secundário ${s.id} (${units} unidades)`,securityId:s.id});
 }
 synchronizeOfficialPosition(room,buyer.game,s.id);synchronizeOfficialPosition(room,seller.game,s.id);
 room.secondaryVolumes[room.round]??={};room.secondaryVolumes[room.round][s.id]=used+units;
 o.units-=units;if(o.units===0)o.status='filled';
 const trade={id:tradeId,round:room.round,securityId:s.id,buyerId,sellerId:seller.id,units,priceCents,amountCents:totalCents,...(totalCents%100===0?{amount}:{})};room.secondaryTrades.push(trade);return trade;
}
export function publicSecondary(room){ensureSecondary(room);return {offers:room.secondaryOffers.filter(o=>o.status==='open').map(o=>({...o,priceCents:officialRoomQuote(room,o.securityId).priceCents})),trades:room.secondaryTrades.slice(-30),volumes:room.secondaryVolumes[room.round]??{}};}
export {quoteSettlement,auditSecondarySettlement};
export function checkSecondary(room){return (room.secondaryOffers??[]).every(o=>!!instrument(o.securityId)&&Number.isSafeInteger(o.units)&&o.units>=0&&['open','filled','cancelled'].includes(o.status))&&(room.secondaryTrades??[]).every(t=>integer(t.units)&&((Number.isSafeInteger(t.amountCents)&&t.amountCents>0)||(Number.isSafeInteger(t.amount)&&t.amount>0)));}
