import {openProposal} from './governance.js';
// Investimentos de capital: o desembolso não é despesa operacional nem lucro realizado.
import {CORPORATE_EXPANSIONS} from './corporate-expansion-catalog.js';
export {CORPORATE_EXPANSIONS};
const member=(c,id)=>(c.shares?.[id]??0)>0;
const validInt=x=>Number.isSafeInteger(x)&&x>=0;
export function eligibleCorporateExpansions(room,playerId,cardId){
 const rule=CORPORATE_EXPANSIONS[cardId];if(!rule)return [];
 return (room.companies??[]).filter(c=>member(c,playerId)&&rule.match.test(c.name)&&(!rule.requiresProfit||c.retainedProfit>0)).map(c=>({id:c.id,name:c.name,cost:rule.cost,rate:rule.rate,available:c.cash}));
}
function applyExpansion(room,c,cardId,proposalId){
 const rule=CORPORATE_EXPANSIONS[cardId];if(!rule||!validInt(c.cash)||c.cash<rule.cost)throw Error('Caixa empresarial insuficiente para expansão');
 if((c.capitalImprovements??[]).some(x=>x.proposalId===proposalId))throw Error('Expansão já executada');
 c.cash-=rule.cost;
 c.capitalImprovements??=[];
 c.capitalImprovements.push({cardId,proposalId,cost:rule.cost,rate:rule.rate,round:room.round,firstEligibleRound:room.round+1});
 c.history.push({type:'capital_improvement',cardId,proposalId,cost:rule.cost,rate:rule.rate,round:room.round});
 // A porcentagem altera somente a referência de projeção, não gera receita sem fato operacional.
 c.forecastMultiplierBps=Math.round((c.forecastMultiplierBps??10000)*(100+rule.rate)/100);
 return {companyId:c.id,cardId,spent:rule.cost,forecastMultiplierBps:c.forecastMultiplierBps};
}
export function proposeCorporateExpansion(room,playerId,companyId,cardId){
 const rule=CORPORATE_EXPANSIONS[cardId],player=room.players?.find(p=>p.id===playerId),game=player?.game;
 if(!rule||!game?.pending||game.currentCard?.id!==cardId||game.lastTile!=='OE'||game.circuit!=='outer'||game.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Carta de expansão não está pendente');
 const company=(room.companies??[]).find(c=>c.id===companyId);
 if(!company||!eligibleCorporateExpansions(room,playerId,cardId).some(c=>c.id===companyId))throw Error('Empresa sem elegibilidade para a expansão');
 if(!validInt(company.cash)||company.cash<rule.cost)throw Error('Caixa empresarial insuficiente para expansão');
 const actualShares=Object.entries(company.shares).filter(([id,percent])=>percent>0&&id!=='origin');
 const sole=actualShares.length===1&&actualShares[0][0]===playerId&&actualShares[0][1]===100;
 let result;
 if(sole)result=applyExpansion(room,company,cardId,`direct:${cardId}:${playerId}:${game.turn}`);
 else{
  const proposal=openProposal(room,playerId,companyId,`Expansão ${cardId} — R$ ${rule.cost}`);
  proposal.expansionCardId=cardId;
  proposal.operationStatus='awaiting_votes';
  result={proposalId:proposal.id,companyId,cardId,status:'voting'};
 }
 const event=game.cardEvents.at(-1);event.resolution=sole?'corporate_expansion':'corporate_proposal';event.financialEffect=sole;
 game.currentCard.effectExecuted=true;game.currentCard.corporateExpansion=result;
 return result;
}
export function executeApprovedCorporateExpansion(room,proposalId){
 const p=room.proposals?.find(x=>x.id===proposalId);
 if(!p?.expansionCardId||p.status!=='approved'||p.operationStatus==='executed')return null;
 const c=room.companies.find(c=>c.id===p.companyId);
 if(!c)throw Error('Empresa não encontrada');
 if(c.cash<CORPORATE_EXPANSIONS[p.expansionCardId].cost){p.operationStatus='awaiting_company_funds';return null;}
 const result=applyExpansion(room,c,p.expansionCardId,p.id);
 p.operationStatus='executed';p.operationResult=result;
 const author=room.players.find(x=>x.id===p.authorId)?.game;
 const event=author?.cardEvents?.find(e=>e.id===p.expansionCardId&&e.resolution==='corporate_proposal');
 if(event){event.resolution='corporate_expansion';event.financialEffect=true;}
 return result;
}
