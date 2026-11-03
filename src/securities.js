// Infraestrutura do mercado de ações/fundos: somente emissões verificadas, sem catálogo inventado.
import {randomUUID} from 'node:crypto';
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const validCash=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*100))&&Math.abs(n*100-Math.round(n*100))<1e-6;
const cents=n=>Math.round(n*100);
const cap={stock:10,fund:20};
export function ensureSecurities(room){room.securities??=[];room.securityTrades??=[];}
export function registerSecurity(room,{id,kind,totalUnits,priceCents,initialHolders}){
 ensureSecurities(room);
 if(!id||!Object.hasOwn(cap,kind)||!integer(totalUnits)||totalUnits<1||!integer(priceCents)||priceCents<1||room.securities.some(s=>s.id===id))throw Error('Emissão inválida');
 if(!initialHolders||Object.keys(initialHolders).length===0||Object.keys(initialHolders).some(id=>!id||id==='__proto__'||id==='constructor'||id==='prototype')||Object.values(initialHolders).some(v=>!integer(v))||Object.values(initialHolders).reduce((a,b)=>a+b,0)!==totalUnits)throw Error('Titularidade inicial não conciliada');
 const sec={id,kind,totalUnits,priceCents,holders:{...initialHolders},tradedByRound:{}};room.securities.push(sec);return sec;
}
export function tradeSecurity(room,{securityId,sellerId,buyerId,units}){
 ensureSecurities(room);const s=room.securities.find(x=>x.id===securityId);
 if(!s||!integer(units)||units<1||!sellerId||!buyerId||sellerId===buyerId)throw Error('Negociação inválida');
 const round=room.round??1; if(!Number.isSafeInteger(round)||round<1)throw Error('Rodada inválida'); const used=s.tradedByRound[round]??0,limit=Math.floor(s.totalUnits*cap[s.kind]/100);
 if(units>limit-used)throw Error('Limite de liquidez da rodada excedido');
 if((s.holders[sellerId]??0)<units)throw Error('Estoque do vendedor insuficiente');
 const seller=room.players?.find(p=>p.id===sellerId)??room.npcInvestors?.find(p=>`npc:${p.id}`===sellerId);
 const buyer=room.players?.find(p=>p.id===buyerId)??room.npcInvestors?.find(p=>`npc:${p.id}`===buyerId);
 if(!seller||!buyer)throw Error('Titular não autorizado: mercado sem comprador fictício ilimitado');
 const priceCents=s.priceCents*units;
 if(!Number.isSafeInteger(priceCents)||!validCash(buyer.game?.cash??buyer.cash)||!validCash(seller.game?.cash??seller.cash)||priceCents>cents(buyer.game?.cash??buyer.cash))throw Error('Caixa insuficiente ou inválido');
 const amount=priceCents/100;
 const debit=buyer.game??buyer,credit=seller.game??seller;
 if(!Array.isArray(debit.ledger)||!Array.isArray(credit.ledger))throw Error('Extrato indisponível');
 const buyerNextCents=cents(debit.cash)-priceCents,sellerNextCents=cents(credit.cash)+priceCents;
 if(!Number.isSafeInteger(sellerNextCents)||buyerNextCents<0)throw Error('Transação excede limites monetários');
 debit.cash=buyerNextCents/100;credit.cash=sellerNextCents/100;
 const entry={securityId,units,round};
 debit.ledger.push({id:randomUUID(),kind:'security_buy',amount:-amount,...entry});
 credit.ledger.push({id:randomUUID(),kind:'security_sell',amount,...entry});
 s.holders[sellerId]-=units;s.holders[buyerId]=(s.holders[buyerId]??0)+units;s.tradedByRound[round]=used+units;
 const t={id:randomUUID(),sellerId,buyerId,...entry,amount};room.securityTrades.push(t);return t;
}
export function checkSecurities(room){ensureSecurities(room);return room.securities.every(s=>Object.hasOwn(cap,s.kind)&&integer(s.totalUnits)&&s.totalUnits>0&&integer(s.priceCents)&&s.priceCents>0&&Object.values(s.holders).every(integer)&&Object.values(s.holders).reduce((a,b)=>a+b,0)===s.totalUnits&&Object.entries(s.tradedByRound).every(([round,v])=>Number.isSafeInteger(Number(round))&&Number(round)>0&&integer(v)&&v<=Math.floor(s.totalUnits*cap[s.kind]/100)));}

// Auditoria somente leitura: não cria carteiras nem altera titularidade ou caixa.
export function auditSecurities(room){
 const securities=Array.isArray(room.securities)?room.securities:[];
 const trades=Array.isArray(room.securityTrades)?room.securityTrades:[];
 const findings=[];
 for(const s of securities){
  const held=Object.values(s.holders||{}).reduce((a,b)=>a+(Number.isSafeInteger(b)?b:0),0);
  if(held!==s.totalUnits)findings.push({securityId:s.id,issue:'Estoque não reconciliado'});
  for(const [round,volume] of Object.entries(s.tradedByRound||{})){const limit=Math.floor(s.totalUnits*(cap[s.kind]??0)/100);if(volume>limit)findings.push({securityId:s.id,round:Number(round),issue:'Volume excedeu liquidez'});}
 }
 const sumCents=trades.reduce((a,t)=>a+(Number.isSafeInteger(Math.round(t.amount*100))?Math.round(t.amount*100):0),0);
 return {issues:findings,securityCount:securities.length,tradeCount:trades.length,negotiatedCents:sumCents,balanced:findings.length===0&&checkSecurities({...room,securities:structuredClone(securities),securityTrades:structuredClone(trades)})};
}
export function publicSecurities(room){ensureSecurities(room);return room.securities.map(({id,kind,totalUnits,priceCents,holders,tradedByRound})=>({id,kind,totalUnits,priceCents,holders,tradedThisRound:tradedByRound[room.round??1]??0,limitThisRound:Math.floor(totalUnits*cap[kind]/100)}));}
