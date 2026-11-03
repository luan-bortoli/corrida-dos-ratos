import {cashBalanceCents,debitCashCents} from './money-balance.js';
// Módulo econômico compartilhado, valores em REAIS inteiros enquanto o motor v0.x usar reais.
// Nenhum lucro operacional é presumido: a fonte de resultados permanece pendente do catálogo.
export const COMPANY_TEMPLATES=Object.freeze([
 {id:'GO-016',name:'Cafeteria (participação)',stake:25,price:10000,wholeDistribution:500,valuation:40000},
 {id:'GO-017',name:'Academia (participação)',stake:30,price:18000,wholeDistribution:780,valuation:60000},
 {id:'GO-018',name:'Empresa de Aplicativos (participação)',stake:20,price:16000,wholeDistribution:0,valuation:80000},
 {id:'GO-019',name:'Empresa de Reciclagem (participação)',stake:40,price:20000,wholeDistribution:600,valuation:50000},
 {id:'GO-020',name:'Empresa de Logística (participação)',stake:25,price:30000,wholeDistribution:1200,valuation:120000},
]);
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export function createCompanies(){return COMPANY_TEMPLATES.map(t=>({id:t.id,name:t.name,valuation:t.valuation,referenceDistribution:t.wholeDistribution,reserveRequired:Math.max(1000,2*t.wholeDistribution),cash:Math.max(1000,2*t.wholeDistribution),initialCapital:Math.max(1000,2*t.wholeDistribution),retainedProfit:0,pendingExpenses:0,shares:{origin:100},offer:{percent:t.stake,price:t.price},history:[],lastClosedRound:0,distributions:[],operatingLedger:[],closedOperatingPeriods:[]}));}
export function checkCompanies(companies){if(!Array.isArray(companies))return false;return companies.every(c=>integer(c.cash)&&integer(c.initialCapital)&&integer(c.reserveRequired)&&Number.isSafeInteger(c.retainedProfit)&&Object.values(c.shares).every(v=>Number.isInteger(v)&&v>=0)&&Object.values(c.shares).reduce((a,b)=>a+b,0)===100&&integer(c.pendingExpenses??0)&&(c.cashRemainderCents===undefined||(integer(c.cashRemainderCents)&&c.cashRemainderCents<100))&&(c.corporateLoans===undefined||(Array.isArray(c.corporateLoans)&&c.corporateLoans.every(l=>integer(l.balanceCents)&&integer(l.installmentCents)&&l.installmentCents>0&&integer(l.arrearsCents)&&l.arrearsCents<=l.balanceCents&&[6,12,24].includes(l.term))))&&integer(c.lastClosedRound)&&Array.isArray(c.operatingLedger??[])&&Array.isArray(c.history)&&Array.isArray(c.distributions));}
export function purchaseCompanyShare(room,playerId,companyId){
 const company=room.companies?.find(c=>c.id===companyId);const p=room.players.find(x=>x.id===playerId);
 if(!company||!p)throw Error('Empresa ou estudante não encontrado');
 if(!p.game.pending||p.game.lastTile!=='GO'||p.game.currentCard?.id!==companyId||p.game.cardEvents?.at(-1)?.resolution!=='pending'||p.game.offerResolved)throw Error('Aquisição somente da participação da carta GO sorteada e pendente');
 if(room.jointInvestments?.some(x=>x.cardId===companyId&&x.status==='open'))throw Error('Participação reservada para proposta conjunta pendente');
 if(company.shares.origin<company.offer.percent)throw Error('Participação indisponível');
 if(cashBalanceCents(p.game)<company.offer.price*100)throw Error('Caixa insuficiente');
 const percent=company.offer.percent,price=company.offer.price;
 // Oferta secundária: o vendedor externo registrado recebe o valor; não o caixa da empresa.
 room.externalSellerCash??=0;
 const cashBefore=p.game.cash;
 debitCashCents(p.game,price*100);
 p.game.ledger??=[];
 p.game.ledger.push({id:crypto.randomUUID(),turn:p.game.turn,closure:p.game.closures,kind:'share_purchase',amount:p.game.cash-cashBefore,amountCents:-price*100,description:`Participação ${percent}%: ${company.name}`,companyId});
 p.game.offerResolved=true;p.game.currentOffer=null;
 p.game.cardEvents.at(-1).resolution='share_purchase';p.game.cardEvents.at(-1).financialEffect=true;
 p.game.currentCard.effectExecuted=true;
 p.game.history.unshift({id:crypto.randomUUID(),text:`Participação de ${percent}% em ${company.name} adquirida por R$ ${price} (oferta demonstrativa).`,type:'asset'});
 company.shares.origin-=percent;
 company.shares[playerId]=(company.shares[playerId]||0)+percent;
 room.externalSellerCash+=price;
 company.history.push({type:'share_transfer',playerId,percent,price,round:room.round});
 return {companyId,percent,price};
}
// Executado ao COMPLETAR rodadas coletivas 9,18,27...; sem lucro presumido não há distribuição.
export {closeVerifiedPeriod as closeCompanies} from './distributions.js';
export function publicCompanies(room){return (room.companies??[]).map(c=>({id:c.id,name:c.name,valuation:c.valuation,cash:c.cash,reserveRequired:c.reserveRequired,referenceDistribution:c.referenceDistribution,shares:c.shares,offer:c.offer,lastClosedRound:c.lastClosedRound,distributions:c.distributions,closedOperatingPeriods:c.closedOperatingPeriods,retainedProfit:c.retainedProfit,pendingExpenses:c.pendingExpenses??0,corporateLoans:c.corporateLoans??[],cashRemainderCents:c.cashRemainderCents??0}));}
