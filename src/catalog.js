import approvedTexts from './approved-card-texts.json' with {type:'json'};
// Inventory of approved identifiers only. An identifier is not an approved card text.
// No placeholder is allowed to execute a financial effect.
const GROUPS = [
 ['PO',25,'inner'],['GO',20,'inner'],['DI',35,'both'],
 ['MF',30,'both'],['EV',30,'both'],['EF',30,'both'],
 ['BE',10,'inner'],['GI',25,'outer'],['OE',20,'outer'],['FI',5,'outer']
];
export const CARD_CATALOG = Object.freeze(GROUPS.flatMap(([category,count,circuit])=>
 Array.from({length:count},(_,i)=>Object.freeze({id:`${category}-${String(i+1).padStart(3,'0')}`,category,circuit,board:i+1<=(category==='DI'?20:['MF','EV','EF'].includes(category)?15:count)?'inner':'outer',status:approvedTexts[`${category}-${String(i+1).padStart(3,'0')}`]?'text_available':'awaiting_approved_text'}))));
const byId = new Map(CARD_CATALOG.map(card=>[card.id,card]));
export const CARD_COUNTS=Object.freeze(Object.fromEntries(GROUPS.map(([cat,count])=>[cat,count])));
export function getCard(id){const c=byId.get(id);return c?{...c,text:approvedTexts[id]?.original??null}:null;}
export function cardsForTile(tile,circuit){
 return CARD_CATALOG.filter(c=>c.category===tile&&(c.circuit==='both'?c.board===circuit:c.circuit===circuit));
}
function shuffle(ids,random){const a=[...ids];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function drawCatalogCard(state,tile,circuit,random=Math.random){
 const available=cardsForTile(tile,circuit);
 if(!available.length)return null;
 state.catalogDecks??={};state.catalogCycles??={};
 const key=`${circuit}:${tile}`;
 if(!Array.isArray(state.catalogDecks[key])||state.catalogDecks[key].length===0){
  state.catalogDecks[key]=shuffle(available.map(c=>c.id),random);
  if(Object.hasOwn(state.catalogCycles,key))state.catalogCycles[key]++;
  else state.catalogCycles[key]=0;
 }
 const id=state.catalogDecks[key].shift();
 return {id,category:tile,cycle:state.catalogCycles[key],status:byId.get(id).status,effectExecuted:false};
}
export function validateCatalogDecks(state){
 if(state.catalogDecks===undefined)return true;
 if(!state.catalogDecks||typeof state.catalogDecks!=='object'||Array.isArray(state.catalogDecks))return false;
 for(const [key,deck] of Object.entries(state.catalogDecks)){
  const [circuit,tile,...more]=key.split(':');
  if(more.length||!['inner','outer'].includes(circuit)||!Array.isArray(deck))return false;
  const allowed=new Set(cardsForTile(tile,circuit).map(x=>x.id));
  if(!allowed.size||deck.length>allowed.size||new Set(deck).size!==deck.length||deck.some(x=>!allowed.has(x)))return false;
 }
 return true;
}
