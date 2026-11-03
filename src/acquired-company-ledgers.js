import {GRAND_PARTICIPATIONS} from './grand-investments.js';
import {SPECIAL_ACQUISITIONS} from './special-opportunities.js';
// Contabilidade única para aquisições empresariais GI/OE, individuais e coletivas.
// Os retornos impressos nas cartas são referências, nunca receitas automáticas.
const enterpriseAsset=asset=>asset?.source==='official_grand_investment'&&['company','participation'].includes(asset.kind)||asset?.source==='special_opportunity'&&['company','participation'].includes(asset.kind)||['official_joint_grand_participation','official_joint_special_participation'].includes(asset?.source);
function eligibleAssets(room){const groups=new Map();for(const player of room.players??[])for(const asset of player.game?.assets??[]){if(!enterpriseAsset(asset))continue;const key=asset.jointProposalId?`joint:${asset.jointProposalId}`:`owned:${player.id}:${asset.ownershipId}`;let g=groups.get(key);if(!g){g={key,asset,investors:[]};groups.set(key,g);}g.investors.push({player,asset});}return groups;}
function allocatePercentages(investors,stake){
 // Shares are integer percentages. Largest remainder ensures exact 100% sum.
 const weighted=investors.map(({player,asset})=>({id:player.id,weight:asset.contribution??1}));
 const weightSum=weighted.reduce((n,x)=>n+x.weight,0);if(!(weightSum>0))throw Error('Aportes societários inválidos');
 const allocated=weighted.map(x=>({...x,raw:stake*x.weight/weightSum,percent:Math.floor(stake*x.weight/weightSum)}));
 let remaining=stake-allocated.reduce((n,x)=>n+x.percent,0);
 allocated.sort((a,b)=>(b.raw-b.percent)-(a.raw-a.percent)||a.id.localeCompare(b.id));
 for(let i=0;i<remaining;i++)allocated[i].percent++;
 return Object.fromEntries(allocated.filter(x=>x.percent>0).map(x=>[x.id,x.percent]));
}
export function registerAcquiredCompanyLedgers(room){
 room.companies??=[];let registered=0;
 for(const {key,asset,investors} of eligibleAssets(room).values()){
  const companyId=`asset:${key}`;
  const existing=room.companies.find(c=>c.id===companyId);
  if(existing){for(const {asset:a} of investors){a.companyLedgerId=companyId;a.passive=0;a.incomeStatus='requires_verified_operating_profit';}continue;}
  const owned=asset.kind==='company'&&asset.source!=='official_joint_special_participation';
  const catalogueStake=[...GRAND_PARTICIPATIONS,...SPECIAL_ACQUISITIONS].find(o=>o.id===asset.id)?.percent;
  const stake=owned?100:Number(asset.jointProposalId?catalogueStake:asset.percent);
  if(!Number.isSafeInteger(stake)||stake<=0||stake>100)throw Error(`Participação inválida: ${asset.id}`);
  const shares=allocatePercentages(investors,stake);
  if(stake<100)shares.origin=100-stake;
  const reserveRequired=Math.max(1000,2*(asset.referencePassive??0));
  const c={id:companyId,name:asset.name,cardId:asset.id,model:owned?'acquired_company':'acquired_participation',valuation:asset.valuation??asset.referenceValue??asset.cost,referenceDistribution:asset.referencePassive??0,reserveRequired,cash:0,initialCapital:0,retainedProfit:0,pendingExpenses:0,shares,initialShares:{...shares},offer:{percent:0,price:0},history:[],lastClosedRound:0,distributions:[],operatingLedger:[],closedOperatingPeriods:[]};
  room.companies.push(c);registered++;
  for(const {asset:a} of investors){a.companyLedgerId=companyId;a.passive=0;a.incomeStatus='requires_verified_operating_profit';}
 }
 return registered;
}
