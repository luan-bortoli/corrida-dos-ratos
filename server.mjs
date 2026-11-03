import {registerAcquiredCompanyLedgers} from './src/acquired-company-ledgers.js';
import {registerDocumentedOperation} from './src/corporate-operations.js';
import {ensureDiscountCompany,ensureDiscountOffers,openDiscountOffer,acceptDiscountOffer,expireDiscountOffers,publicDiscountOffers} from './src/discount-share-offer.js';
import {proposeCorporateRenegotiation,executeApprovedCorporateRenegotiation} from './src/corporate-renegotiation.js';
import {proposeCorporateExpansion,executeApprovedCorporateExpansion} from './src/corporate-expansions.js';
import {openJointInvestment,acceptJointInvestment,declineJointInvestment,expireJointInvestments,publicJointInvestments} from './src/joint-investments.js';
import {registerOwnedCompany,registerMissingOwnedCompanies} from './src/owned-companies.js';
import {applyCorporateExpense,eligibleCorporateCompanies} from './src/corporate-expenses.js';
import {ensureSecondary,listSecondary,cancelSecondary,buySecondary,publicSecondary,checkSecondary} from './src/official-secondary.js';
import {applyGlobalMarketEvent,publicOfficialMarket,synchronizeOfficialPosition} from './src/global-market.js';
import {ISSUE_UNITS} from './src/official-securities.js';
import {fixedIncomeOffer} from './src/fixed-income.js';
import {officialSmallBusinessOffer,officialPOAssetOffer} from './src/official-small-businesses.js';
import {publicQuestion} from './src/financial-quiz.js';
import {roomCardAudit} from './src/card-audit.js';
import {buildTeacherReport,reportCSV} from './src/reports.js';
import {roomProgress} from './src/room-progress.js';
import {ensureSecurities,publicSecurities,checkSecurities} from './src/securities.js';
import {ensureNPC,publicNPC,quoteNPC,buyShareNPC,checkNPC} from './src/npc-market.js';
import http from 'node:http';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {randomBytes,randomInt,createHash,timingSafeEqual} from 'node:crypto';
import {join,resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ensureMarket,publishShareOffer,acceptShareOffer,expireShareOffers,publicShareOffers} from './src/market.js';
import {ensureGovernance,openProposal,castVote,expireProposals,publicProposals} from './src/governance.js';
import {createCompanies,checkCompanies,purchaseCompanyShare,closeCompanies,publicCompanies} from './src/companies.js';
import {createGame,rollTurn,finishTurn,buyVerifiedAsset,purchaseRealEstate,purchaseOfficialCompany,purchaseOfficialSmallBusiness,purchaseOfficialPOAsset,subscribeFixedIncome,redeemFixedIncome,purchaseOfficialSecurity,enableOfficialPO,financeRealEstate,answerEducationCard,chooseLifeEvent,resolvePhilanthropy,purchaseGrandInvestment,purchaseSpecialOpportunity,resolveExtraordinaryAmortization,resolveSpecialRefinancing,improveRentalProperty,contractCredit,prepayLoan,validateState,auditCash,quoteCredit} from './src/engine.js';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||3000);
const password=process.env.ADMIN_PASSWORD;
if(!password||password.length<10){console.error('Defina ADMIN_PASSWORD com pelo menos 10 caracteres para iniciar o servidor.');process.exit(1);}
const dataDir=resolve(process.env.DATA_DIR||join(root,'.room-data'));
await mkdir(dataDir,{recursive:true});
const dataFile=join(dataDir,'rooms.json');
let rooms={};try{rooms=JSON.parse(await readFile(dataFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const token=()=>randomBytes(32).toString('hex');
const hash=t=>createHash('sha256').update(t).digest('hex');
const equal=(a,b)=>{const x=Buffer.from(hash(a));const y=Buffer.from(hash(b));return timingSafeEqual(x,y);};
// Limits apply to authentication/recovery attempts, not regular gameplay polling.
const authAttempts=new Map();
function guardAuth(req,scope,limit=8){
 const now=Date.now(),windowMs=60_000;
 const ip=req.socket.remoteAddress||'unknown';
 const key=`${ip}:${scope}`;
 const entry=authAttempts.get(key);
 if(!entry||now-entry.started>=windowMs){authAttempts.set(key,{started:now,count:1});return;}
 if(entry.count>=limit)fail(429,'Muitas tentativas. Tente novamente em um minuto.');
 entry.count++;
 if(authAttempts.size>2000)for(const [k,v] of authAttempts)if(now-v.started>=windowMs)authAttempts.delete(k);
}

const TURN_MS=process.env.NODE_ENV==='test'?Number(process.env.TEST_TURN_MS||120000):120000;
const safe=s=>({id:s.id,name:s.name,professionId:s.game.professionId,dreamId:s.game.dreamId,circuit:s.game.circuit,position:s.game.position,turn:s.game.turn,closures:s.game.closures,won:s.game.won,pending:s.game.pending,cash:s.game.cash,streak:s.game.streak});
const publicGame=(game)=>{if(!game)return null;const g=structuredClone(game);if(g.currentCard?.category==='EF'){g.currentCard.quizQuestion=publicQuestion(g.currentCard.id);if(g.cardEvents?.at(-1)?.resolution==='pending')delete g.currentCard.quizFeedback;}return g;};
const snapshot=(room,who)=>({round:room.round??1,turnDeadline:room.turnDeadline??null,secondsRemaining:room.status==='playing'?Math.max(0,Math.ceil(((room.turnDeadline??Date.now())-Date.now())/1000)):room.pausedRemaining==null?null:Math.ceil(room.pausedRemaining/1000),canTeacherAdvance:who?.role==='teacher'&&room.status==='playing'&&Date.now()>=(room.turnDeadline??Infinity),code:room.code,progress:roomProgress(room),status:room.status,paused:room.status==='paused',revision:room.revision,turnIndex:room.turnIndex,activePlayerId:room.order[room.turnIndex]||null,players:room.players.map(safe),companies:publicCompanies(room),shareOffers:publicShareOffers(room),proposals:publicProposals(room),jointInvestments:publicJointInvestments(room),discountOffers:publicDiscountOffers(room),npcInvestors:publicNPC(room),securities:publicSecurities(room),officialMarket:publicOfficialMarket(room),secondaryMarket:publicSecondary(room),externalSellerCash:who?.role==='teacher'?room.externalSellerCash:undefined,you:who?.role==='player'?who.playerId:null,teacher:who?.role==='teacher',game:who?.role==='player'?publicGame(room.players.find(p=>p.id===who.playerId)?.game):null});
for(const room of Object.values(rooms)){room.winnerOrder??=[];room.companies??=createCompanies();room.externalSellerCash??=0;ensureMarket(room);ensureGovernance(room);ensureNPC(room);ensureSecurities(room);ensureSecondary(room);registerMissingOwnedCompanies(room);registerAcquiredCompanyLedgers(room);ensureDiscountOffers(room);}
let chain=Promise.resolve();
function queue(fn){const p=chain.then(fn);chain=p.catch(()=>{});return p;}
async function save(){const tmp=dataFile+'.tmp';await writeFile(tmp,JSON.stringify(rooms));await rename(tmp,dataFile);}
function fail(code,msg){const e=Error(msg);e.status=code;throw e;}
function locate(code){const r=rooms[code];if(!r)fail(404,'Sala não encontrada');return r;}
function authorize(req,r){const t=(req.headers.authorization||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(t))fail(401,'Sessão não autorizada');const h=hash(t);if(r.teacherToken===h)return {role:'teacher'};const p=r.players.find(x=>x.tokenHash===h);if(p)return {role:'player',playerId:p.id};fail(403,'Acesso não autorizado para esta sala');}
function teacher(who){if(who.role!=='teacher')fail(403,'Somente professor');}
function current(r,who){if(r.status!=='playing')fail(409,'A sala precisa estar em andamento e sem pausa');if(who.role!=='player'||r.order[r.turnIndex]!==who.playerId)fail(403,'Não é o seu turno');return r.players.find(p=>p.id===who.playerId);}
function bodyOf(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>20000){reject(Object.assign(Error('Corpo muito grande'),{status:413}));req.destroy();}});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{});}catch{reject(Object.assign(Error('JSON inválido'),{status:400}));}});req.on('error',reject);});}
function json(res,status,value){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(value));}
function roomCode(){let code;do{code=randomBytes(4).toString('hex').toUpperCase();}while(rooms[code]);return code;}
function turnAdvance(r){const active=r.players.filter(p=>!p.game.won).map(p=>p.id);r.order=r.order.filter(id=>active.includes(id));if(!r.order.length){r.status='finished';r.turnIndex=0;return;}if(r.turnIndex>=r.order.length)r.turnIndex=0;}
async function api(req,res,url){const parts=url.pathname.split('/').filter(Boolean);let data={};if(req.method==='POST')data=await bodyOf(req);
 if(req.method==='POST'&&url.pathname==='/api/room/create'){
  guardAuth(req,'create',12);
  if(typeof data.password!=='string'||!equal(data.password,password))fail(401,'Senha do professor incorreta');
  const code=roomCode(),secret=token(),teacherRecovery=randomBytes(12).toString('hex').toUpperCase();rooms[code]={code,status:'lobby',teacherToken:hash(secret),teacherRecoveryHash:hash(teacherRecovery),players:[],order:[],winnerOrder:[],turnIndex:0,round:1,turnDeadline:null,pausedRemaining:null,companies:createCompanies(),shareOffers:[],proposals:[],jointInvestments:[],discountOffers:[],npcInvestors:undefined,securities:[],secondaryOffers:[],secondaryTrades:[],secondaryVolumes:{},externalSellerCash:0,revision:1,createdAt:Date.now()};await save();return json(res,201,{code,token:secret,teacherRecoveryCode:teacherRecovery,room:snapshot(rooms[code],{role:'teacher'})});
 }
 const code=parts[2];if(parts[0]!=='api'||parts[1]!=='room'||!code)fail(404,'Rota inexistente');const r=locate(code);
 if(req.method==='POST'&&parts[3]==='join'){
  guardAuth(req,`join:${code}`,20);
  if(r.status!=='lobby')fail(409,'Sala já iniciada');if(r.players.length>=6)fail(409,'Sala cheia');
  const name=String(data.name||'').trim();if(name.length<2||name.length>40)fail(400,'Nome deve ter 2 a 40 caracteres');
  if(r.players.some(p=>p.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')))fail(409,'Este nome já está em uso');
  const game=createGame(data.professionId,data.dreamId),secret=token(),recovery=randomBytes(8).toString('hex').toUpperCase(),id=randomBytes(9).toString('hex');r.players.push({id,name,game,tokenHash:hash(secret),recoveryHash:hash(recovery)});r.revision++;await save();return json(res,201,{token:secret,recoveryCode:recovery,playerId:id,room:snapshot(r,{role:'player',playerId:id})});
 }
 if(req.method==='POST'&&parts[3]==='recover'){guardAuth(req,`recover:${code}`);const name=String(data.name||'').trim(),key=String(data.recoveryCode||'').trim().toUpperCase();if(!/^[A-F0-9]{16}$/.test(key))fail(401,'Código de recuperação inválido');const p=r.players.find(x=>x.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')&&x.recoveryHash===hash(key));if(!p)fail(401,'Nome ou código de recuperação inválido');const secret=token();p.tokenHash=hash(secret);r.revision++;await save();return json(res,200,{token:secret,playerId:p.id,room:snapshot(r,{role:'player',playerId:p.id})});}
 if(req.method==='POST'&&parts[3]==='recover-teacher'){
  guardAuth(req,`recover-teacher:${code}`);
  const key=String(data.recoveryCode||'').trim().toUpperCase();
  if(!/^[A-F0-9]{24}$/.test(key)||!r.teacherRecoveryHash||r.teacherRecoveryHash!==hash(key))fail(401,'Código de recuperação do professor inválido');
  const secret=token();r.teacherToken=hash(secret);r.revision++;await save();
  return json(res,200,{token:secret,room:snapshot(r,{role:'teacher'})});
 }
 const who=authorize(req,r);
 if(req.method==='GET'&&parts.length===4&&parts[3]==='card-audit'){teacher(who);return json(res,200,roomCardAudit(r));}
 if(req.method==='GET'&&parts.length===4&&parts[3]==='report'){
  teacher(who);
  const report=buildTeacherReport(r);
  if(url.searchParams.get('format')==='csv'){
   res.writeHead(200,{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="corrida-${r.code}-relatorio.csv"`,'cache-control':'no-store','x-content-type-options':'nosniff'});
   res.end(reportCSV(report));return;
  }
  return json(res,200,report);
 }
 if(req.method==='POST'&&parts.length===4&&parts[3]==='corporate-operation'){
  teacher(who);
  const result=registerDocumentedOperation(r,{companyId:data.companyId,type:data.type,amount:data.amount,document:data.document});
  r.revision++;await save();return json(res,200,{operation:result,room:snapshot(r,who)});
 }
 if(req.method==='GET'&&parts.length===3)return json(res,200,snapshot(r,who));
 if(req.method!=='POST')fail(405,'Método não permitido');
 const action=parts[3];
 // Convidados podem responder a propostas durante o turno de outro jogador.
 if(req.method==='POST'&&['joint-accept','joint-decline','discount-accept'].includes(action)){
  if(r.status!=='playing'||who.role!=='player')fail(403,'Participação indisponível');
  if(action==='discount-accept')acceptDiscountOffer(r,who.playerId,String(data.offerId||''));
  else if(action==='joint-accept'){acceptJointInvestment(r,who.playerId,String(data.proposalId||''),Number(data.amount));registerAcquiredCompanyLedgers(r);}
  else declineJointInvestment(r,who.playerId,String(data.proposalId||''));
  for(const player of r.players)if(!validateState(player.game)||!auditCash(player.game).ok)fail(500,'Liquidação coletiva inconsistente');
  r.revision++;await save();return json(res,200,snapshot(r,who));
 }
 if(['start','pause','resume','finish','advance'].includes(action)){
  teacher(who);
  if(action==='start'){if(r.status!=='lobby'||r.players.length<2)fail(409,'É necessário ter de 2 a 6 participantes na sala');r.status='playing';r.order=r.players.map(p=>p.id);r.turnIndex=0;r.round=1;r.turnDeadline=Date.now()+TURN_MS;}
  if(action==='pause'){if(r.status!=='playing')fail(409,'Sala não está em andamento');r.pausedRemaining=Math.max(0,(r.turnDeadline??Date.now())-Date.now());r.turnDeadline=null;r.status='paused';}
  if(action==='resume'){if(r.status!=='paused')fail(409,'Sala não está pausada');r.status='playing';r.turnDeadline=Date.now()+(r.pausedRemaining??TURN_MS);r.pausedRemaining=null;}
  if(action==='advance'){if(r.status!=='playing')fail(409,'Sala não está em andamento');if(Date.now()<(r.turnDeadline??Infinity))fail(409,'O turno ainda está dentro do prazo');const id=r.order[r.turnIndex];const p=r.players.find(x=>x.id===id);if(p?.game.pending){if(p.game.currentCard?.corporateExpense?.requiresCompanySelection)throw Error('Selecione a empresa antes de avançar o turno');p.game=finishTurn(p.game);}if(p){r.turnIndex=(r.turnIndex+1)%r.order.length;if(r.turnIndex===0){closeCompanies(r,r.round??1);r.round=(r.round??1)+1;expireShareOffers(r);expireProposals(r);expireJointInvestments(r);expireDiscountOffers(r);}turnAdvance(r);}r.turnDeadline=r.status==='playing'?Date.now()+TURN_MS:null;}
  if(action==='finish'){if(r.status==='finished')fail(409,'Sala já encerrada');r.status='finished';r.turnDeadline=null;}
 }else{
  const p=current(r,who);if(!validateState(p.game)||!auditCash(p.game).ok)fail(409,'Partida financeira inconsistente');
  try{switch(action){
   case 'company-buy':purchaseCompanyShare(r,p.id,String(data.companyId||''));break;
   case 'discount-open':openDiscountOffer(r,p.id,data.companyId?String(data.companyId):null);break;
   case 'joint-open':openJointInvestment(r,p.id,Number(data.amount),data.invitees);break;
   case 'proposal-open':openProposal(r,p.id,String(data.companyId||''),String(data.title||''));break;
   case 'proposal-vote':castVote(r,p.id,String(data.proposalId||''),String(data.vote||''));executeApprovedCorporateExpansion(r,String(data.proposalId||''));executeApprovedCorporateRenegotiation(r,String(data.proposalId||''));break;
   case 'corporate-expand':proposeCorporateExpansion(r,p.id,String(data.companyId||''),String(data.cardId||''));break;
   case 'share-offer':publishShareOffer(r,p.id,String(data.companyId||''),Number(data.percent),Number(data.price));break;
   case 'share-accept':acceptShareOffer(r,p.id,String(data.offerId||''));break;
   case 'npc-buy':{const offer=r.shareOffers?.find(o=>o.id===String(data.offerId||''));if(!offer||offer.sellerId!==p.id)fail(403,'Apenas o vendedor pode confirmar a venda');buyShareNPC(r,offer.id,String(data.investorId||''),data.acceptCounter===true);break;}
   case 'roll':{p.game=rollTurn(p.game,randomInt(1,7));if(p.game.currentCard?.category==='MF')applyGlobalMarketEvent(r,p.game.currentCard.id);
    if(p.game.currentCard?.category==='DI'&&p.game.circuit==='outer'){
     const card=p.game.currentCard;
     const occurrence=p.game.cardEvents?.at(-1);
     const elig=eligibleCorporateCompanies(r,p.id);
     const result=elig.length>1?{requiresCompanySelection:true,eligibleCompanies:elig}:applyCorporateExpense(r,p.id,card.id,occurrence?.id??`TURN-${p.id}-${p.game.turn}`);
     if(result){card.corporateExpense=result;if(!result.requiresCompanySelection){card.effectExecuted=true;if(occurrence){occurrence.resolution='automatic';occurrence.financialEffect=result.applicable;}}}
    }
    break;}
   case 'corporate-expense-select':{
    const card=p.game.currentCard;
    if(!p.game.pending||p.game.circuit!=='outer'||!card?.corporateExpense?.requiresCompanySelection||!card.id?.startsWith('DI-'))throw Error('Não há despesa empresarial aguardando seleção');
    const occurrence=p.game.cardEvents?.at(-1);
    const result=applyCorporateExpense(r,p.id,card.id,occurrence?.id??`TURN-${p.id}-${p.game.turn}`,String(data.companyId||''));
    card.corporateExpense=result;card.effectExecuted=true;
    if(occurrence){occurrence.resolution='automatic';occurrence.financialEffect=result.applicable;}
    break;
   }
   case 'answer-education':p.game=answerEducationCard(p.game,String(data.choice||''));break;
   case 'choose-life':p.game=chooseLifeEvent(p.game,String(data.choice||''));break;
   case 'philanthropy':p.game=resolvePhilanthropy(p.game,Number(data.amount));break;
   case 'rental-improve':p.game=improveRentalProperty(p.game,String(data.ownershipId));break;
   case 'corporate-renegotiate':proposeCorporateRenegotiation(r,p.id,String(data.companyId),Number(data.term));break;
   case 'special-refinance':p.game=resolveSpecialRefinancing(p.game,String(data.loanId),Number(data.term));break;
   case 'special-amortize':p.game=resolveExtraordinaryAmortization(p.game,String(data.loanId),Number(data.amount));break;
   case 'special-acquisition-buy':p.game=purchaseSpecialOpportunity(p.game,data.term===undefined?{}:{term:Number(data.term),downPayment:Number(data.downPayment)});registerAcquiredCompanyLedgers(r);break;
   case 'grand-investment-buy':p.game=purchaseGrandInvestment(p.game,data.term===undefined?{}:{term:Number(data.term),downPayment:Number(data.downPayment)});registerAcquiredCompanyLedgers(r);break;
   case 'official-po-enable':p.game=enableOfficialPO(p.game);break;
   case 'official-po-buy':p.game=purchaseOfficialSmallBusiness(p.game);break;
   case 'official-security-buy':{const id=p.game.currentCard?.id;const total=r.players.reduce((sum,player)=>sum+(player.game?.officialSecurities?.[id]??0),0);if(!Number.isSafeInteger(total)||total+Number(data.quantity)>ISSUE_UNITS)throw Error('Emissão oficial esgotada nesta sala.');p.game=purchaseOfficialSecurity(p.game,Number(data.quantity));synchronizeOfficialPosition(r,p.game,id);break;}
   case 'secondary-list':listSecondary(r,p.id,String(data.securityId||''),Number(data.units));break;
   case 'secondary-cancel':cancelSecondary(r,p.id,String(data.offerId||''));break;
   case 'secondary-buy':buySecondary(r,p.id,String(data.offerId||''),Number(data.units));break;
   case 'fixed-subscribe':p.game=subscribeFixedIncome(p.game,Number(data.amount),r.fixedIncomeRateBonus??0);break;
   case 'fixed-redeem':p.game=redeemFixedIncome(p.game,String(data.contractId||''));break;
   case 'official-po-asset-buy':p.game=purchaseOfficialPOAsset(p.game);break;
   case 'official-company-buy':{const cardId=p.game.currentCard?.id;p.game=purchaseOfficialCompany(p.game);registerOwnedCompany(r,p.id,cardId);break;}
   case 'real-estate-buy':p.game=purchaseRealEstate(p.game);break;
   case 'real-estate-finance':p.game=financeRealEstate(p.game,Number(data.term),Number(data.downPayment));break;
   case 'buy':p.game=buyVerifiedAsset(p.game,String(data.assetId||''));break;
   case 'credit':p.game=contractCredit(p.game,Number(data.amount),Number(data.term));break;
   case 'prepay':p.game=prepayLoan(p.game,String(data.loanId),Number(data.amount));break;
   case 'end':if(p.game.currentCard?.corporateExpense?.requiresCompanySelection)throw Error('Selecione a empresa antes de encerrar o turno');p.game=finishTurn(p.game);r.turnIndex=(r.turnIndex+1)%r.order.length;if(r.turnIndex===0){closeCompanies(r,r.round??1);r.round=(r.round??1)+1;expireShareOffers(r);expireProposals(r);expireJointInvestments(r);expireDiscountOffers(r);}turnAdvance(r);r.turnDeadline=r.status==='playing'?Date.now()+TURN_MS:null;break;
   default:fail(404,'Ação inexistente');
  }}catch(e){if(!e.status)e.status=409;throw e;}
  if(p.game.won) {r.winnerOrder??=[];if(!r.winnerOrder.includes(p.id))r.winnerOrder.push(p.id);const idx=r.order.indexOf(p.id);r.order.splice(idx,1);if(idx<r.turnIndex)r.turnIndex--;turnAdvance(r);r.turnDeadline=r.status==='playing'?Date.now()+TURN_MS:null;}
  if(!validateState(p.game)||!auditCash(p.game).ok||!checkCompanies(r.companies)||!checkNPC(r)||!checkSecondary(r))fail(500,'Operação gerou inconsistência');
 }
 r.revision++;await save();return json(res,200,snapshot(r,who));
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{queue(async()=>{
 try{
 res.setHeader('x-content-type-options','nosniff');
 res.setHeader('referrer-policy','no-referrer');
 res.setHeader('x-frame-options','DENY');
 res.setHeader('permissions-policy','camera=(), microphone=(), geolocation=()');
 res.setHeader('content-security-policy',"default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'");
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.pathname==='/health'){return json(res,200,{status:'ok'});}
 if(url.pathname.startsWith('/api/'))return await api(req,res,url);
 if(req.method!=='GET')fail(405,'Método não permitido');let path=url.pathname==='/'?'/index.html':url.pathname;const allowed=['/index.html','/styles.css','/multiplayer.html','/multiplayer.js'];const publicModule=/^\/src\/[a-z0-9-]+\.(?:js|json)$/i.test(path);if(!allowed.includes(path)&&!publicModule)fail(404,'Arquivo não encontrado');const filePath=join(root,path);if(!existsSync(filePath))fail(404,'Arquivo não encontrado');const bytes=await readFile(filePath);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','x-content-type-options':'nosniff','cache-control':'no-store'});res.end(bytes);
 }catch(e){json(res,e.status||500,{error:e.status?e.message:'Erro interno'});}
 });});
 server.listen(port,()=>console.log(`Corrida dos Ratos: http://localhost:${port}`));
export {server};
