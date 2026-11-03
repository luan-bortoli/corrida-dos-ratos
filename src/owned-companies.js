import {OFFICIAL_COMPANIES} from './official-companies.js';

// Empresas adquiridas integralmente, com caixa e contabilidade próprios.
// O preço pago pela compra vai ao vendedor, não cria receita na empresa.
export function registerOwnedCompany(room,playerId,cardId){
 const offer=OFFICIAL_COMPANIES.find(x=>x.id===cardId);
 const player=room.players?.find(x=>x.id===playerId);
 if(!offer||!player||!player.game.assets.some(a=>a.source==='official_company'&&a.id===cardId))throw Error('Aquisição oficial não encontrada');
 room.companies??=[];
 const id=`${cardId}:${playerId}`;
 if(room.companies.some(c=>c.id===id))throw Error('Empresa já registrada na contabilidade');
 const company={id,name:offer.name,cardId,model:'owned',valuation:offer.cost,referenceDistribution:offer.passive,reserveRequired:Math.max(1000,2*offer.passive),cash:0,initialCapital:0,retainedProfit:0,pendingExpenses:0,shares:{[playerId]:100},initialShares:{[playerId]:100},offer:{percent:0,price:0},history:[],lastClosedRound:0,distributions:[],operatingLedger:[],closedOperatingPeriods:[]};
 room.companies.push(company);
 // A renda de referência não é lucro realizado; somente dividendos apurados contam.
 const asset=player.game.assets.find(a=>a.source==='official_company'&&a.id===cardId);
 asset.passive=0;asset.incomeStatus='requires_verified_operating_profit';asset.companyLedgerId=id;
 return company;
}
export function registerMissingOwnedCompanies(room){
 room.companies??=[];
 for(const p of room.players??[])for(const asset of p.game.assets??[]){
  if(asset.source!=='official_company')continue;
  const id=`${asset.id}:${p.id}`;
  if(!room.companies.some(c=>c.id===id))registerOwnedCompany(room,p.id,asset.id);
 }
}
