import {specialAcquisitionOffer} from './special-opportunities.js';
import {grandInvestmentOffer} from './grand-investments.js';
import {philanthropyOffer,validateSocialImpact} from './philanthropy.js';
import {ensureBudget,changeBudgetCategory,addTemporaryBudgetDiscount,livingDueForClosure,finalizeBudgetClosing,applyScheduledSalary} from './personal-budget.js';
import {quoteAmortizationCents,interestCents} from './credit-cents.js';
import {cashBalanceCents,debitCashCents,creditCashCents} from './money-balance.js';
import {applyIndividualMarketEvent} from './market-events.js';
import {fixedIncomeOffer,validateFixedAmount} from './fixed-income.js';
import {officialSecurityOffer,OFFICIAL_SECURITIES,ISSUE_UNITS,checkOfficialPortfolio} from './official-securities.js';
import {officialSmallBusinessOffer,officialPOAssetOffer} from './official-small-businesses.js';
import {officialCompanyOffer} from './official-companies.js';
import {realEstateOffer} from './real-estate.js';
import {lifeDecision,resolveLifeDecision} from './life-decisions.js';
import {gradeQuestion} from './financial-quiz.js';
import {executeOfficialExpense,executeOuterPersonalExpense,executeConditionalAssetExpense,executeAutomaticLifeEvent,executeOfficialCashBenefit} from './official-effects.js';
import {createCardEvent,resolveCardEvent,validateCardEvents} from './card-resolution.js';
import {drawCatalogCard,validateCatalogDecks,getCard} from './catalog.js';
import {PROFESSIONS,INNER,OUTER,DREAMS,VERIFIED_ASSETS} from './data.js';
const uid = () => crypto.randomUUID();
const verifiedIds = VERIFIED_ASSETS.map(x=>x.id);
function shuffledDeck() {const ids=[...verifiedIds];for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return ids;}
function drawOpportunity(s){
 s.demoDeck ??= shuffledDeck();
 if(s.demoDeck.length===0){s.demoDeck=shuffledDeck();s.demoDeckCycles=(s.demoDeckCycles??0)+1;}
 const id=s.demoDeck.shift();s.currentOffer=id;
 addLog(s,`Oportunidade demonstrativa sorteada: ${id}.`, 'asset');
}

export function createGame(professionId,dreamId='TRAVEL') {
 const p=PROFESSIONS.find(x=>x.id===Number(professionId));
 if(!p||!DREAMS[dreamId])throw Error('Profissão ou sonho inválido');
 return {version:1,id:uid(),professionId:p.id,dreamId,position:1,circuit:'inner',cash:p.cash,initialCash:p.cash,debt:p.debt,initialDebtCents:p.debt*100,initialInstallmentCents:p.items.installment*100,initialArrearsCents:0,installment:p.items.installment,baseExpenses:p.expenses-p.items.installment,initialAssets:p.assets,initialPassive:p.passive,assets:[],loans:[],turn:0,closures:0,streak:0,won:false,lastRoll:null,lastTile:'PAY',pending:false,offerResolved:false,demoDeck:shuffledDeck(),demoDeckCycles:0,currentOffer:null,currentCard:null,cardEvents:[],catalogDecks:{},catalogCycles:{},arrearsLiving:0,arrearsLivingCents:0,arrearsLoan:0,ledger:[],history:[{id:uid(),text:`Partida iniciada: ${p.name}.`,type:'info'}]};
}
function migrateLedger(s){if(!Array.isArray(s.ledger)){s.ledgerBaseline=s.cash;s.ledger=[];}}
function post(s,kind,amount,description,meta={}){
 if(!Number.isSafeInteger(amount))throw Error('Lançamento financeiro inválido.');
 s.ledger ??= [];
 s.ledger.push({id:uid(),turn:s.turn,closure:s.closures,kind,amount,description,...meta});
}
export function recurringExpenses(s){return s.baseExpenses+(s.debt>0?s.installment:0)+(s.loans??[]).reduce((sum,l)=>sum+(l.balance>0?l.installment:0),0)};
export function passiveIncome(s){return s.initialPassive+s.assets.reduce((a,b)=>a+b.passive,0)};
export function addLog(s,text,type='info'){s.history=[{id:uid(),text,type},...s.history].slice(0,100);}
// Payment priority: overdue living costs, current living costs, overdue installments,
// then the current installment. Unpaid balances remain enforceable obligations.
// No fines or default interest are invented: only the approved 1% on outstanding loan principal.
function settleFixedIncome(s){
 for(const investment of (s.fixedIncome??[])){
  if(investment.status!=='active')continue;
  const offer=fixedIncomeOffer({id:investment.cardId,category:'PO'},'inner');
  if(!offer)throw Error('Contrato de renda fixa desconhecido.');
  investment.elapsed++;
  if(offer.distribution==='accumulate'){
   investment.balance+=Math.round(investment.balance*(investment.contractRate??offer.rate));
  }else{
   const coupon=offer.coupon??Math.round(investment.principal*(investment.contractRate??offer.rate));
   if(coupon>0){creditCashCents(s,coupon*100);post(s,'fixed_coupon',coupon,`Cupom de ${offer.id}`,{cardId:offer.id,contractId:investment.id});s.fixedPassivePaid=(s.fixedPassivePaid??0)+coupon;}
  }
  if(offer.term!==null&&investment.elapsed>=offer.term){
   const paid=offer.distribution==='accumulate'?investment.balance:investment.principal;
   creditCashCents(s,paid*100);post(s,'fixed_maturity',paid,`Vencimento ${offer.id}`,{cardId:offer.id,contractId:investment.id});investment.status='matured';investment.paidAtClosure=s.closures+1;
  }
 }
}
function settleOfficialSecurities(s){
 let paidCents=0;
 for(const offer of OFFICIAL_SECURITIES){
  const qty=s.officialSecurities?.[offer.id]??0;
  if(!qty||!offer.dividendCents)continue;
  paidCents+=qty*(s.officialSecurityDividendCents?.[offer.id]??offer.dividendCents);
 }
 // Resto em centavos é transportado ao próximo fechamento, sem criar centavos no caixa em reais.
 paidCents+=(s.officialDividendRemainderCents??0);
 const paid=Math.floor(paidCents/100);
 s.officialDividendRemainderCents=paidCents%100;
 if(paid){creditCashCents(s,paid*100);post(s,'official_security_dividend',paid,'Dividendos de ações e fundos oficiais');}
 s.officialSecuritiesPassivePaid=paid;
}
function personalClosing(s){
 for(const a of s.assets??[]){if(a.pendingRentalBonus){a.passive+=a.pendingRentalBonus;a.pendingRentalBonus=0;}}
 applyScheduledSalary(s);
 settleFixedIncome(s);
 settleOfficialSecurities(s);
 const p=PROFESSIONS[s.professionId];
 const salary=s.circuit==='inner'?Math.round(p.salary*(s.salaryMultiplierBasisPoints??10000)/10000):0;
 const distributedPassive=s.pendingCorporatePassive||0;
 const couponPaid=s.fixedPassivePaid??0;
 const securityPaid=s.officialSecuritiesPassivePaid??0;
 const passive=passiveIncome(s)+distributedPassive+couponPaid+securityPaid;
 s.officialSecuritiesPassivePaid=0;
 s.fixedPassivePaid=0;
 s.pendingCorporatePassive=0;
 const previousLivingCents=s.arrearsLivingCents??(s.arrearsLiving??0)*100;
 const previousLiving=Math.ceil(previousLivingCents/100);
 const previousLoan=s.arrearsLoan??0;
 const principalBefore=s.debt;
 // A dívida da profissão também é calculada em centavos, sem alterar o contrato base.
 // Os campos de reais são projeções de leitura para os módulos já existentes.
 const initialBalanceBefore=s.initialDebtCents??s.debt*100;
 const previousInitialArrears=s.initialArrearsCents??previousLoan*100;
 const initialInterestCents=initialBalanceBefore>0?interestCents(initialBalanceBefore):0;
 s.initialDebtCents=initialBalanceBefore+initialInterestCents;
 const interest=Math.ceil(initialInterestCents/100);
 const installmentDueCents=initialBalanceBefore>0?Math.min(s.initialInstallmentCents??s.installment*100,Math.max(0,s.initialDebtCents-previousInitialArrears)):0;
 const installmentDue=Math.ceil(installmentDueCents/100);
 s.debt=Math.ceil(s.initialDebtCents/100);
 const currentLiving=livingDueForClosure(s);
 const due=currentLiving+installmentDue+(s.loans??[]).reduce((a,l)=>a+(l.balance>0?Math.min(l.installment,Math.max(0,l.balance-l.arrears)):0),0);
 if(salary){creditCashCents(s,salary*100);post(s,'salary',salary,'Salário recebido');}
 if(passive-distributedPassive-couponPaid){creditCashCents(s,(passive-distributedPassive-couponPaid)*100);post(s,'passive',passive-distributedPassive-couponPaid,'Renda passiva recebida');}
 const available=()=>Math.floor(cashBalanceCents(s)/100);
 function pay(amount,kind,description){
  const paid=Math.min(amount,available());
  if(paid){debitCashCents(s,paid*100);post(s,kind,-paid,description);}
  return paid;
 }
 const payLivingCents=(target,description)=>{
  const cents=Math.min(target,cashBalanceCents(s));
  if(cents>0){const old=s.cash;debitCashCents(s,cents);post(s,'expense',s.cash-old,description,{amountCents:-cents});}
  return cents;
 };
 const paidOldLivingCents=payLivingCents(previousLivingCents,'Quitação de despesas pessoais pendentes');
 const paidLivingCents=payLivingCents(currentLiving*100,'Despesas pessoais do período');
 const paidOldLiving=paidOldLivingCents/100;
 const paidLiving=paidLivingCents/100;
 const payInitial=(target,description)=>{
  const cents=Math.min(target,cashBalanceCents(s));
  if(cents>0){const oldCash=s.cash;debitCashCents(s,cents);post(s,'loan_payment',s.cash-oldCash,description,{amountCents:-cents,loanId:'initial'});}
  s.initialDebtCents-=cents;
  return cents;
 };
 const paidOldLoanCents=payInitial(Math.min(previousInitialArrears,s.initialDebtCents),'Pagamento de prestações vencidas');
 const paidInstallmentCents=payInitial(Math.min(installmentDueCents,s.initialDebtCents),'Prestação da dívida inicial');
 const paidOldLoan=Math.floor(paidOldLoanCents/100);
 const paidInstallment=Math.floor(paidInstallmentCents/100);
 s.initialArrearsCents=Math.min(s.initialDebtCents,Math.max(0,previousInitialArrears-paidOldLoanCents)+installmentDueCents-paidInstallmentCents);
 s.debt=Math.ceil(s.initialDebtCents/100);
 for(const loan of (s.loans??[])){
  if(loan.balance<=0)continue;
  if(Number.isSafeInteger(loan.balanceCents)){
   const oldCents=loan.arrearsCents??0;
   const interest=interestCents(loan.balanceCents);
   loan.balanceCents+=interest;
   const currentCents=Math.min(loan.installmentCents,Math.max(0,loan.balanceCents-oldCents));
   const payCents=(target,description)=>{
    const paid=Math.min(target,cashBalanceCents(s));
    if(paid>0){const beforeReais=s.cash;debitCashCents(s,paid);post(s,'loan_payment',s.cash-beforeReais,description,{loanId:loan.id,amountCents:-paid});}
    return paid;
   };
   const oldPaid=payCents(Math.min(oldCents,loan.balanceCents),`Parcela vencida do empréstimo ${loan.id.slice(0,8)}`);
   loan.balanceCents-=oldPaid;
   const currentPaid=payCents(Math.min(currentCents,loan.balanceCents),`Parcela do empréstimo ${loan.id.slice(0,8)}`);
   loan.balanceCents-=currentPaid;
   loan.arrearsCents=Math.min(loan.balanceCents,Math.max(0,oldCents-oldPaid)+currentCents-currentPaid);
   loan.balance=Math.ceil(loan.balanceCents/100);
   loan.arrears=Math.ceil(loan.arrearsCents/100);
   loan.periodsElapsed++;
   continue;
  }
  const old=loan.arrears;
  loan.balance+=Math.round(loan.balance*0.01);
  const currentDue=Math.min(loan.installment,Math.max(0,loan.balance-old));
  const paidOld=pay(Math.min(old,loan.balance),'loan_payment',`Parcela vencida do empréstimo ${loan.id.slice(0,8)}`);
  loan.balance-=paidOld;
  const paidNow=pay(Math.min(currentDue,loan.balance),'loan_payment',`Parcela do empréstimo ${loan.id.slice(0,8)}`);
  loan.balance-=paidNow;
  loan.arrears=Math.min(loan.balance,Math.max(0,old-paidOld)+currentDue-paidNow);
  loan.periodsElapsed++;
 }
 s.arrearsLivingCents=previousLivingCents-paidOldLivingCents+currentLiving*100-paidLivingCents;
 s.arrearsLiving=Math.ceil(s.arrearsLivingCents/100);
 s.arrearsLoan=Math.ceil(s.initialArrearsCents/100);
 s.closures++;
 finalizeBudgetClosing(s);
 const unpaid=s.arrearsLiving+s.arrearsLoan+(s.loans??[]).reduce((a,l)=>a+l.arrears,0);
 const previousStreak=s.streak;
 if(s.circuit==='inner'){
  s.streak=passive>due&&unpaid===0?previousStreak+1:0;
  if(s.streak>=3){s.circuit='outer';s.position=1;s.streak=3;addLog(s,'Independência financeira alcançada! Entrada na Alta Velocidade.','success');}
 }
 const paid=paidOldLiving+paidLiving+paidOldLoan+paidInstallment;
 const delta=salary+passive-distributedPassive-couponPaid-securityPaid-paid;
 addLog(s,`Fechamento ${s.closures}: receitas R$ ${salary+passive}, obrigações do período R$ ${due}, pagamentos R$ ${paid}, pendências R$ ${unpaid}.`,unpaid?'warning':'pay');
 return {salary,passive,due,paid,unpaid,interest,delta};
}
export function outstandingObligations(s){const extra=(s.loans??[]).reduce((a,l)=>a+l.arrears,0);const livingCents=s.arrearsLivingCents??(s.arrearsLiving??0)*100;return {living:Math.ceil(livingCents/100),livingCents,loan:(s.arrearsLoan??0)+extra,total:Math.ceil(livingCents/100)+(s.arrearsLoan??0)+extra};}
export function rollTurn(state,die){
 if(state.won||state.pending)throw Error('A jogada atual precisa ser concluída.');
 if(!Number.isInteger(die)||die<1||die>6)throw Error('Dado inválido');
 const s=structuredClone(state);migrateLedger(s);const board=s.circuit==='inner'?INNER:OUTER;
 const start=s.position;const raw=(start-1)+die;
 const passedPay=raw>=board.length;let stop=raw%board.length+1;
 // Dream resolution on passing or stopping, in path order.
 let dreamHit=false;
 if(s.circuit==='outer'){
  const dream=DREAMS[s.dreamId];
  for(let step=1;step<=die;step++)if(((start-1+step)%board.length+1)===dream.position)dreamHit=true;
 }
 s.position=stop;s.turn++;s.lastRoll=die;s.lastTile=board[stop-1];s.offerResolved=false;s.currentOffer=null;s.currentCard=null;
 addLog(s,`Turno ${s.turn}: dado ${die}, casa ${stop} (${s.lastTile.startsWith('DREAM')?'Sonho':s.lastTile}).`);
 if(passedPay){
   personalClosing(s);
   // Independence transition changes board, no second payday from same move.
   if(s.circuit==='outer' && s.position===1 && board===INNER){s.lastTile='PAY';}
 }
 if(dreamHit&&s.circuit==='outer'&&board===OUTER){
  const d=DREAMS[s.dreamId];
  if(cashBalanceCents(s)>=d.price*100){debitCashCents(s,d.price*100);post(s,'dream',-d.price,`Realização do sonho: ${d.name}`);s.won=true;s.pending=false;addLog(s,`Sonho realizado: ${d.name}! Pagamento de R$ ${d.price}.`,'success');return s;}
  addLog(s,`Passou pelo sonho ${d.name}, mas faltam recursos para realizá-lo.`,'info');
 }
 s.pending=true;
 if(s.circuit==='inner'&&s.lastTile==='PO'&&!s.officialPOEnabled){
  drawOpportunity(s);
  // The demo deck is deliberately separate from the 230 official card IDs.
  s.currentCard={id:s.currentOffer,category:'PO',status:'verified_demo_subset',effectExecuted:false};
 }else{
  s.currentCard=drawCatalogCard(s,s.lastTile,s.circuit);
  if(s.currentCard)addLog(s,`Carta ${s.currentCard.id} registrada; descrição original disponível, sem efeito financeiro automático.`, 'info');
 }
 if(s.currentCard){
  s.cardEvents??=[];
  const event=createCardEvent(s.currentCard,s.turn,s.circuit,s.position);
  s.cardEvents.push(event);
  if(s.lastTile==='DI' && s.currentCard.status==='text_available'){
   const result=s.circuit==='inner'?executeOfficialExpense(s,s.currentCard.id,PROFESSIONS[s.professionId].salary):executeOuterPersonalExpense(s,s.currentCard.id,PROFESSIONS[s.professionId].salary);
   if(result){
    if(result.paid)post(s,'unexpected_expense',-result.paid,`Despesa inesperada ${s.currentCard.id}`,{cardId:s.currentCard.id});
    event.resolution='automatic';event.financialEffect=true;
    s.currentCard.effectExecuted=true;
    addLog(s,`Despesa ${s.currentCard.id}: R$ ${result.amount}; pago R$ ${result.paid}; pendente R$ ${result.unpaid}.`,'warning');
   }else if(s.circuit==='outer'){
    const conditional=executeConditionalAssetExpense(s,s.currentCard.id);
    if(conditional){
     if(conditional.paidCents)post(s,'unexpected_expense',-Math.trunc(conditional.paidCents/100),`Despesa condicional ${s.currentCard.id}`,{cardId:s.currentCard.id,amountCents:-conditional.paidCents});
     event.resolution='automatic';event.financialEffect=conditional.applicable;
     s.currentCard.effectExecuted=true;
     s.currentCard.conditionalExpense=conditional;
     addLog(s,conditional.applicable
      ?`Despesa ${s.currentCard.id}: R$ ${(conditional.amountCents/100).toFixed(2)}; pago R$ ${(conditional.paidCents/100).toFixed(2)}; pendente R$ ${(conditional.unpaidCents/100).toFixed(2)}.`
      :`Carta ${s.currentCard.id} não aplicável: nenhum ativo elegível.`,conditional.applicable?'warning':'info');
    }
   }
  }
  if(s.circuit==='inner'&&s.lastTile==='BE'&&s.currentCard.status==='text_available'){
   const result=executeOfficialCashBenefit(s,s.currentCard.id,PROFESSIONS[s.professionId].salary);
   if(result){if(result.amount)post(s,'benefit',result.amount,`Benefício ${s.currentCard.id}`,{cardId:s.currentCard.id});event.resolution='automatic';event.financialEffect=true;s.currentCard.effectExecuted=true;addLog(s,`Benefício ${s.currentCard.id}: recebidos R$ ${result.amount}.`,'success');}
  }
  if(s.lastTile==='MF'&&s.currentCard.status==='text_available'){
   const result=applyIndividualMarketEvent(s,s.currentCard.id);
   if(result){
    event.resolution='automatic';event.financialEffect=result.affected>0;
    s.currentCard.effectExecuted=true;
    s.currentCard.marketResult=result;
    addLog(s,`Mercado ${s.currentCard.id}: ${result.affected} ativo(s) elegível(is); ${result.kind==='valuation'?'valor patrimonial':'rendimento'} ajustado.`, 'asset');
   }
  }
  if(s.lastTile==='EV'&&s.currentCard.status==='text_available'){
   const result=executeAutomaticLifeEvent(s,s.currentCard.id,PROFESSIONS[s.professionId].salary);
   if(result){
    if(result.kind==='one_time_bonus')post(s,'life_bonus',result.amount,`Bonificação ${s.currentCard.id}`,{cardId:s.currentCard.id});
    event.resolution='automatic';event.financialEffect=true;s.currentCard.effectExecuted=true;
    addLog(s,`Evento da vida ${s.currentCard.id}: ${result.kind}; ${result.amount} R$.`,'info');
   }
  }
 }
 return s;
}
export function buyVerifiedAsset(state,assetId){
 if(!state.pending||state.lastTile!=='PO'||state.circuit!=='inner'||state.offerResolved)throw Error('Compra indisponível neste momento.');
 if(state.currentOffer!==assetId)throw Error('A oferta escolhida não foi a sorteada nesta casa.');
 const asset=VERIFIED_ASSETS.find(x=>x.id===assetId);if(!asset)throw Error('Ativo não catalogado');
 if(state.cash<asset.cost)throw Error('Caixa insuficiente.');
 const s=structuredClone(state);migrateLedger(s);s.cash-=asset.cost;s.assets.push({...asset,ownershipId:uid()});s.offerResolved=true;s.currentOffer=null;if(s.currentCard){s.cardEvents??=[];resolveCardEvent(s.cardEvents,s.currentCard,'purchase');s.currentCard.effectExecuted=true;}post(s,'purchase',-asset.cost,`Compra demonstrativa: ${asset.name}`,{assetId});addLog(s,`Comprou ${asset.name} por R$ ${asset.cost}.`,'asset');return s;
}
export function purchaseRealEstate(state){
 const offer=realEstateOffer(state.currentCard,state.circuit);
 if(!offer||!state.pending||state.lastTile!=='GO'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há imóvel disponível para aquisição nesta jogada.');
 if(cashBalanceCents(state)<offer.cost*100)throw Error('Caixa insuficiente para compra à vista.');
 const s=structuredClone(state);migrateLedger(s);
 debitCashCents(s,offer.cost*100);
 s.assets.push({...offer,ownershipId:uid(),source:'official_real_estate'});
 post(s,'real_estate_purchase',-offer.cost,`Compra à vista ${offer.id}: ${offer.name}`,{cardId:offer.id});
 const ev=s.cardEvents.at(-1);ev.resolution='purchase';ev.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:offer.cost};
 addLog(s,`Imóvel ${offer.id} adquirido à vista por R$ ${offer.cost}.`,'asset');
 return s;
}
// Financiamento imobiliário: entrada por carta; crédito pessoal aprovado de 1% por fechamento.
// Receita do imóvel é inicial e não garantida; não simula vacância ou tarifas não aprovadas.
export function quoteRealEstateFinance(state,term,downPayment){
 const offer=realEstateOffer(state?.currentCard,state?.circuit);
 if(!offer||!state.pending||state.lastTile!=='GO'||state.cardEvents?.at(-1)?.resolution!=='pending')return {eligible:false,reason:'Não há imóvel pendente para financiar.'};
 const minimum=Math.ceil(offer.cost*offer.minDown/100);
 if(offer.kind==='participation')return {eligible:false,reason:'Participações GI-019 a GI-025 exigem capital próprio; não admitem financiamento automático.'};
 if(!Number.isSafeInteger(downPayment)||downPayment<minimum||downPayment>=offer.cost)return {eligible:false,reason:`Entrada deve ser de pelo menos R$ ${minimum} e inferior ao valor do imóvel.`,minimum};
 if(cashBalanceCents(state)<downPayment*100)return {eligible:false,reason:'Caixa insuficiente para a entrada.',minimum};
 const principal=offer.cost-downPayment;
 // A cotação é durante a decisão na casa GO; a regra geral proíbe crédito quando há turno pendente.
 const evalState={...state,pending:false};
 const q=quoteCredit(evalState,principal,term);
 return {...q,minimum,downPayment,principal,offerId:offer.id};
}
export function financeRealEstate(state,term,downPayment){
 const q=quoteRealEstateFinance(state,term,downPayment);
 if(!q.eligible)throw Error(q.reason);
 const offer=realEstateOffer(state.currentCard,state.circuit);
 const s=structuredClone(state);migrateLedger(s);
 const preview=q.centPreview;
 const loan={id:uid(),original:q.principal,balance:q.principal,installment:Math.ceil(preview.installmentCents/100),term,periodsElapsed:0,arrears:0,assetId:offer.id,kind:'real_estate_finance',
  originalCents:q.principal*100,balanceCents:q.principal*100,installmentCents:preview.installmentCents,arrearsCents:0};
 s.loans??=[];s.loans.push(loan);
 // Recebimento do financiamento e pagamento integral ao vendedor; líquido = entrada.
 creditCashCents(s,q.principal*100);post(s,'real_estate_credit',q.principal,`Financiamento do imóvel ${offer.id}`,{cardId:offer.id,loanId:loan.id});
 debitCashCents(s,offer.cost*100);post(s,'real_estate_purchase',-offer.cost,`Aquisição financiada ${offer.id}`,{cardId:offer.id,loanId:loan.id});
 s.assets.push({...offer,ownershipId:uid(),source:'official_real_estate',loanId:loan.id,downPayment});
 const ev=s.cardEvents.at(-1);ev.resolution='purchase';ev.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:offer.cost,downPayment,financed:q.principal,loanId:loan.id};
 addLog(s,`Imóvel ${offer.id}: entrada R$ ${downPayment}; financiamento R$ ${q.principal} em ${term} parcelas de R$ ${q.installment}.`,'asset');
 return s;
}
export function enableOfficialPO(state){
 if(!validateState(state)||state.pending||state.won)throw Error('Ative o baralho oficial fora de um turno pendente.');
 const s=structuredClone(state);s.officialPOEnabled=true;addLog(s,'Baralho oficial de Pequenas Oportunidades ativado. O baralho demonstrativo anterior foi preservado.');return s;
}
export function purchaseOfficialSecurity(state,quantity){
 const offer=officialSecurityOffer(state?.currentCard,state?.circuit);
 if(!state.officialPOEnabled||!offer||!state.pending||state.lastTile!=='PO'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há título oficial disponível nesta jogada.');
 if(!Number.isSafeInteger(quantity)||quantity<offer.min||quantity>offer.max)throw Error('Quantidade fora dos limites da carta.');
 const already=state.officialSecurities?.[offer.id]??0;
 if(!Number.isSafeInteger(already)||already<0||already+quantity>ISSUE_UNITS)throw Error('Estoque da emissão esgotado.');
 const total=quantity*offer.price;
 if(!Number.isSafeInteger(total)||cashBalanceCents(state)<total*100)throw Error('Caixa insuficiente.');
 const s=structuredClone(state);migrateLedger(s);
 s.officialSecurities??={};s.officialSecurities[offer.id]=already+quantity;
 debitCashCents(s,total*100);
 post(s,'official_security_purchase',-total,`Compra ${quantity} unidade(s) de ${offer.id}`,{cardId:offer.id,quantity});
 const ev=s.cardEvents.at(-1);ev.resolution='purchase';ev.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:total,quantity};
 addLog(s,`Compra de ${quantity} unidade(s) de ${offer.id}, por R$ ${total}. Dividendos não garantidos.`, 'asset');
 return s;
}
export function subscribeFixedIncome(state,amount,rateBonus=0){
 if(!Number.isSafeInteger(rateBonus)||rateBonus<0||rateBonus>10)throw Error('Adicional de juros inválido.');
 const offer=fixedIncomeOffer(state?.currentCard,state?.circuit);
 if(!state.officialPOEnabled||!offer||!state.pending||state.lastTile!=='PO'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há aplicação de renda fixa pendente.');
 if(!validateFixedAmount(offer,amount))throw Error('Valor não permitido pelas condições desta aplicação.');
 if(cashBalanceCents(state)<amount*100)throw Error('Caixa insuficiente para a aplicação.');
 const s=structuredClone(state);migrateLedger(s);debitCashCents(s,amount*100);
 s.fixedIncome??=[];
 const contract={id:uid(),cardId:offer.id,principal:amount,balance:amount,elapsed:0,status:'active',createdAtClosure:s.closures,contractRate:offer.rate+rateBonus/1000};
 s.fixedIncome.push(contract);
 post(s,'fixed_subscription',-amount,`Aplicação ${offer.id}`,{cardId:offer.id,contractId:contract.id});
 const ev=s.cardEvents.at(-1);ev.resolution='purchase';ev.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:amount,contractId:contract.id};
 addLog(s,`Aplicação ${offer.id} realizada: R$ ${amount}.`, 'asset');
 return s;
}
export function redeemFixedIncome(state,contractId){
 if(state.pending||state.won)throw Error('O resgate deve ocorrer fora de um turno pendente.');
 const s=structuredClone(state);migrateLedger(s);
 const investment=(s.fixedIncome??[]).find(x=>x.id===contractId&&x.status==='active');
 if(!investment)throw Error('Aplicação ativa não encontrada.');
 const offer=fixedIncomeOffer({id:investment.cardId,category:'PO'},'inner');
 if(offer.early==='blocked'||offer.early==='buyer_required')throw Error('Resgate indisponível: esta carta exige vencimento ou comprador, conforme o contrato.');
 const proceeds=offer.early==='discount2'?Math.round(investment.balance*0.98):investment.balance;
 creditCashCents(s,proceeds*100);post(s,'fixed_redemption',proceeds,`Resgate ${offer.id}`,{cardId:offer.id,contractId:investment.id});
 investment.status='redeemed';investment.redemptionAmount=proceeds;
 addLog(s,`Resgate ${offer.id}: R$ ${proceeds}.`,'asset');return s;
}
export function purchaseOfficialSmallBusiness(state){
 const offer=officialSmallBusinessOffer(state?.currentCard,state?.circuit);
 if(!state.officialPOEnabled||!offer||!state.pending||state.lastTile!=='PO'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há pequeno negócio oficial pendente nesta jogada.');
 if(cashBalanceCents(state)<offer.cost*100)throw Error('Caixa insuficiente para aquisição.');
 const s=structuredClone(state);migrateLedger(s);debitCashCents(s,offer.cost*100);
 s.assets.push({...offer,ownershipId:uid(),source:'official_small_business',incomeStatus:'initial_reference'});
 post(s,'official_small_business_purchase',-offer.cost,`Aquisição ${offer.id}: ${offer.name}`,{cardId:offer.id});
 const ev=s.cardEvents.at(-1);ev.resolution='purchase';ev.financialEffect=true;s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:offer.cost};
 addLog(s,`Pequeno negócio ${offer.id} adquirido por R$ ${offer.cost}; renda inicial R$ ${offer.passive} por fechamento.`,'asset');return s;
}
// Patrimônio oficial PO-018–PO-025. Revenda NÃO é automática: o preço-alvo é apenas referencial.
export function purchaseOfficialPOAsset(state){
 const offer=officialPOAssetOffer(state?.currentCard,state?.circuit);
 if(!state.officialPOEnabled||!offer||!state.pending||state.lastTile!=='PO'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há ativo oficial pendente nesta jogada.');
 if(cashBalanceCents(state)<offer.cost*100)throw Error('Caixa insuficiente para aquisição.');
 const s=structuredClone(state);migrateLedger(s);debitCashCents(s,offer.cost*100);
 s.assets.push({...offer,ownershipId:uid(),source:offer.kind==='rental'?'official_rental':'official_resale_stock',incomeStatus:offer.kind==='rental'?'initial_reference':'no_recurring_income'});
 post(s,'official_po_asset_purchase',-offer.cost,`Aquisição ${offer.id}: ${offer.name}`,{cardId:offer.id});
 const ev=s.cardEvents.at(-1);ev.resolution='purchase';ev.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:offer.cost};
 addLog(s,offer.kind==='rental'?`Equipamento ${offer.id} adquirido por R$ ${offer.cost}; renda inicial R$ ${offer.passive} por fechamento.`:`Estoque ${offer.id} adquirido por R$ ${offer.cost}; revenda exige comprador, sem receita automática.`,'asset');
 return s;
}
export function purchaseOfficialCompany(state){
 const offer=officialCompanyOffer(state?.currentCard,state?.circuit);
 if(!offer||!state.pending||state.lastTile!=='GO'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há empresa oficial disponível nesta jogada.');
 if(cashBalanceCents(state)<offer.cost*100)throw Error('Caixa insuficiente para adquirir a empresa.');
 const s=structuredClone(state);migrateLedger(s);
 debitCashCents(s,offer.cost*100);
 s.assets.push({...offer,ownershipId:uid(),source:'official_company',incomeStatus:'initial_reference'});
 post(s,'official_company_purchase',-offer.cost,`Aquisição da empresa ${offer.id}: ${offer.name}`,{cardId:offer.id});
 const ev=s.cardEvents.at(-1);ev.resolution='purchase';ev.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:offer.cost};
 addLog(s,`Empresa ${offer.id} adquirida por R$ ${offer.cost}; distribuição inicial de referência R$ ${offer.passive}.`,'asset');
 return s;
}
export function answerEducationCard(state,choice){
 if(!state.pending||state.lastTile!=='EF'||!state.currentCard||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há pergunta pendente');
 const s=structuredClone(state);migrateLedger(s);const result=gradeQuestion(s.currentCard.id,choice);
 const salary=PROFESSIONS[s.professionId].salary;
 const reward=result.correct?(s.circuit==='inner'?Math.round(salary*0.05):300):0;
 if(reward){creditCashCents(s,reward*100);post(s,'education_reward',reward,`Acerto da pergunta ${s.currentCard.id}`,{cardId:s.currentCard.id});}
 const ev=s.cardEvents.at(-1);ev.resolution='answer';ev.financialEffect=reward>0;ev.choice=choice;ev.correct=result.correct;ev.correctAnswer=result.answer;
 s.currentCard.effectExecuted=true;s.currentCard.quizFeedback={correct:result.correct,correctAnswer:result.answer,reward};
 addLog(s,`Pergunta ${s.currentCard.id}: resposta ${choice}; gabarito ${result.answer}; ${result.correct?'acerto':'erro'}; recompensa R$ ${reward}.`,'info');
 return s;
}
function checkGrandInvestment(state){
 const offer=grandInvestmentOffer(state?.currentCard,state?.circuit);
 if(!offer||!state.pending||state.lastTile!=='GI'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há Grande Investimento disponível nesta jogada.');
 return offer;
}
export function quoteGrandInvestmentFinance(state,term,downPayment){
 let offer;try{offer=checkGrandInvestment(state);}catch(e){return {eligible:false,reason:e.message};}
 const minimum=Math.ceil(offer.cost*offer.minDown/100);
 if(offer.kind==='participation')return {eligible:false,reason:'Participações GI-019 a GI-025 exigem capital próprio; não admitem financiamento automático.'};
 if(!Number.isSafeInteger(downPayment)||downPayment<minimum||downPayment>=offer.cost)return {eligible:false,reason:`Entrada mínima de R$ ${minimum} e inferior ao preço.`,minimum};
 if(cashBalanceCents(state)<downPayment*100)return {eligible:false,reason:'Caixa insuficiente para a entrada.',minimum};
 const q=quoteCredit({...state,pending:false},offer.cost-downPayment,term);
 return {...q,minimum,downPayment,offerId:offer.id};
}
export function purchaseGrandInvestment(state,options={}){
 const offer=checkGrandInvestment(state);
 const {term,downPayment}=options;
 const financed=term!==undefined;
 if(financed&&offer.kind==='participation')throw Error('Participação societária exige capital próprio; financiamento não permitido.');
 const quote=financed?quoteGrandInvestmentFinance(state,term,downPayment):null;
 if(financed&&!quote.eligible)throw Error(quote.reason);
 if(!financed&&cashBalanceCents(state)<offer.cost*100)throw Error('Caixa insuficiente para a compra à vista.');
 const s=structuredClone(state);migrateLedger(s);
 let loanId;
 if(financed){
  const principal=offer.cost-downPayment;
  const loan={id:uid(),original:principal,balance:principal,installment:Math.ceil(quote.centPreview.installmentCents/100),term,periodsElapsed:0,arrears:0,assetId:offer.id,kind:'grand_investment_finance',originalCents:principal*100,balanceCents:principal*100,installmentCents:quote.centPreview.installmentCents,arrearsCents:0};
  s.loans.push(loan);loanId=loan.id;
  creditCashCents(s,principal*100);
  post(s,'grand_investment_credit',principal,`Financiamento ${offer.id}`,{cardId:offer.id,loanId});
 }
 debitCashCents(s,offer.cost*100);
 post(s,'grand_investment_purchase',-offer.cost,`Aquisição ${offer.id}: ${offer.name}`,{cardId:offer.id,loanId});
 s.assets.push({...offer,ownershipId:uid(),source:'official_grand_investment',loanId,downPayment:financed?downPayment:undefined,incomeStatus:['company','participation'].includes(offer.kind)?'requires_verified_operating_profit':'reference_rental_income'});
 const event=s.cardEvents.at(-1);event.resolution='purchase';event.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:offer.cost,financed,downPayment:financed?downPayment:undefined,loanId};
 addLog(s,`${offer.id} adquirido ${financed?'com financiamento':'à vista'} por R$ ${offer.cost}.`,'asset');
 return s;
}
export function quoteSpecialOpportunityFinance(state,term,downPayment){
 const offer=specialAcquisitionOffer(state?.currentCard,state?.circuit);
 if(!offer||offer.id!=='OE-010'||!state.pending||state.lastTile!=='OE'||state.cardEvents?.at(-1)?.resolution!=='pending')return {eligible:false,reason:'Apenas OE-010 admite financiamento neste fluxo.'};
 const minimum=Math.ceil(offer.cost*0.4);
 if(!Number.isSafeInteger(downPayment)||downPayment<minimum||downPayment>=offer.cost)return {eligible:false,reason:`Entrada mínima de R$ ${minimum}.`,minimum};
 if(cashBalanceCents(state)<downPayment*100)return {eligible:false,reason:'Caixa insuficiente para entrada.',minimum};
 const q=quoteCredit({...state,pending:false},offer.cost-downPayment,term);
 return {...q,minimum,downPayment,offerId:offer.id};
}
export function purchaseSpecialOpportunity(state,options={}){
 const offer=specialAcquisitionOffer(state?.currentCard,state?.circuit);
 if(!offer||!state.pending||state.lastTile!=='OE'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há aquisição especial pendente.');
 if(['OE-007','OE-009'].includes(offer.id))throw Error('Esta oportunidade exige investimento conjunto de dois ou mais participantes.');
 const financed=options.term!==undefined;
 if(financed&&offer.id!=='OE-010')throw Error('Esta oportunidade não admite financiamento.');
 const quote=financed?quoteSpecialOpportunityFinance(state,options.term,options.downPayment):null;
 if(financed&&!quote.eligible)throw Error(quote.reason);
 if(!financed&&cashBalanceCents(state)<offer.cost*100)throw Error('Caixa insuficiente para esta aquisição especial.');
 const s=structuredClone(state);migrateLedger(s);
 let loanId;
 if(financed){
  const principal=offer.cost-options.downPayment;
  const loan={id:uid(),original:principal,balance:principal,installment:Math.ceil(quote.centPreview.installmentCents/100),term:options.term,periodsElapsed:0,arrears:0,assetId:offer.id,kind:'special_real_estate_finance',originalCents:principal*100,balanceCents:principal*100,installmentCents:quote.centPreview.installmentCents,arrearsCents:0};
  s.loans.push(loan);loanId=loan.id;creditCashCents(s,principal*100);
  post(s,'special_acquisition_credit',principal,`Financiamento ${offer.id}`,{cardId:offer.id,loanId});
 }
 debitCashCents(s,offer.cost*100);
 post(s,'special_acquisition',-offer.cost,`Aquisição especial ${offer.id}`,{cardId:offer.id,loanId});
 s.assets.push({...offer,ownershipId:uid(),source:'special_opportunity',loanId,incomeStatus:offer.incomeStatus});
 const event=s.cardEvents.at(-1);event.resolution='purchase';event.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.purchase={cost:offer.cost,financed,loanId};
 addLog(s,`Aquisição especial ${offer.id} por R$ ${offer.cost}${financed?' com financiamento':''}.`,'asset');
 return s;
}
// OE-004: melhoria de imóvel próprio elegível; rendimento muda apenas no próximo fechamento.
export function eligibleRentalImprovements(state){
 if(!state?.pending||state.circuit!=='outer'||state.lastTile!=='OE'||state.currentCard?.id!=='OE-004'||state.cardEvents?.at(-1)?.resolution!=='pending')return [];
 return (state.assets??[]).filter(a=>Number.isSafeInteger(a.passive)&&a.passive>0&&a.kind!=='participation'&&a.kind!=='company'&&a.kind!=='joint_real_estate'&&a.kind!=='joint_energy'&&a.id!=='GO-006').map(a=>({ownershipId:a.ownershipId,id:a.id,name:a.name,passive:a.passive}));
}
export function improveRentalProperty(state,ownershipId){
 const asset=eligibleRentalImprovements(state).find(a=>a.ownershipId===ownershipId);
 if(!asset)throw Error('Imóvel de locação não elegível para a OE-004.');
 if(cashBalanceCents(state)<2000000)throw Error('Caixa insuficiente para a reforma de R$ 20.000.');
 const s=structuredClone(state);migrateLedger(s);
 debitCashCents(s,2000000);
 post(s,'rental_improvement',-20000,`Reforma OE-004: ${asset.name}`,{cardId:'OE-004',ownershipId});
 const target=s.assets.find(a=>a.ownershipId===ownershipId);
 target.improvements??=[];
 target.improvements.push({cardId:'OE-004',cost:20000,rateBps:1500,turn:s.turn,firstEligibleClosure:s.closures+1});
 target.pendingRentalBonus=(target.pendingRentalBonus??0)+Math.round(target.passive*.15);
 // O novo valor só vale no fechamento seguinte (primeiro fechamento elegível).
 const e=s.cardEvents.at(-1);e.resolution='rental_improvement';e.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.improvement={ownershipId,cost:20000,rateBps:1500};
 addLog(s,`Reforma OE-004 registrada em ${asset.name} por R$ 20.000. Acréscimo de 15% programado para o próximo fechamento.`,'asset');
 return s;
}
// OE-014: substituir somente um financiamento pessoal já existente, sem dinheiro novo.
// A análise exclui a parcela do contrato substituído, mas considera as demais obrigações.
export function quoteSpecialRefinancing(state,loanId,term){
 if(!state?.pending||state.circuit!=='outer'||state.lastTile!=='OE'||state.currentCard?.id!=='OE-014'||state.cardEvents?.at(-1)?.resolution!=='pending')return {eligible:false,reason:'OE-014 não está pendente.'};
 const loan=(state.loans??[]).find(l=>l.id===loanId);
 if(!loan||loan.balance<=0)return {eligible:false,reason:'Financiamento ativo não encontrado.'};
 if((loan.arrearsCents??loan.arrears*100)>0)return {eligible:false,reason:'Contrato em atraso exige processo específico de inadimplência.'};
 const balanceCents=loan.balanceCents??loan.balance*100;
 const assessment=structuredClone(state);
 assessment.pending=false;
 assessment.loans=assessment.loans.filter(l=>l.id!==loanId);
 const principalForAssessment=Math.ceil(balanceCents/100);
 const quote=quoteCredit(assessment,principalForAssessment,term);
 if(!quote.eligible)return quote;
 const centPreview=quoteAmortizationCents(balanceCents,term);
 return {...quote,principal:principalForAssessment,centPreview,loanId,replacementBalanceCents:balanceCents};
}
export function resolveSpecialRefinancing(state,loanId,term){
 const quote=quoteSpecialRefinancing(state,loanId,term);
 if(!quote.eligible)throw Error(quote.reason);
 const s=structuredClone(state);migrateLedger(s);
 const old=s.loans.find(l=>l.id===loanId);
 const replacement={id:uid(),kind:'renegotiated_loan',replacesLoanId:loanId,original:quote.principal,balance:quote.principal,installment:Math.ceil(quote.centPreview.installmentCents/100),term,periodsElapsed:0,arrears:0,originalCents:quote.replacementBalanceCents,balanceCents:quote.replacementBalanceCents,installmentCents:quote.centPreview.installmentCents,arrearsCents:0};
 s.loans=s.loans.filter(l=>l.id!==loanId);
 s.loans.push(replacement);
 s.refinancingHistory??=[];
 s.refinancingHistory.push({oldLoanId:loanId,newLoanId:replacement.id,cardId:'OE-014',turn:s.turn,principalCents:quote.replacementBalanceCents,oldTerm:old.term,newTerm:term});
 const event=s.cardEvents.at(-1);event.resolution='refinance';event.financialEffect=false;
 s.currentCard.effectExecuted=true;s.currentCard.refinancing={loanId,newLoanId:replacement.id,term};
 addLog(s,`OE-014: financiamento renegociado em ${term} parcelas, sem liberação de novo dinheiro.`,'pay');
 return s;
}
export function resolveExtraordinaryAmortization(state,loanId,amount){
 if(!state?.pending||state.circuit!=='outer'||state.lastTile!=='OE'||state.currentCard?.id!=='OE-016'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('OE-016 não está pendente.');
 if(!Number.isSafeInteger(amount)||amount<1000)throw Error('Amortização mínima de R$ 1.000.');
 const loan=loanId==='initial'?null:(state.loans??[]).find(l=>l.id===loanId);
 if(loanId!=='initial'&&!loan)throw Error('Financiamento não encontrado.');
 const remaining=loan?(loan.balanceCents??loan.balance*100):(state.initialDebtCents??state.debt*100);
 if(remaining<=0||amount*100>remaining)throw Error('Amortização superior ao saldo devedor.');
 if(amount*100>cashBalanceCents(state))throw Error('Caixa insuficiente.');
 const s=structuredClone(state);migrateLedger(s);
 const selected=loanId==='initial'?null:s.loans.find(l=>l.id===loanId);
 if(selected){
  if(selected.balanceCents!==undefined){selected.balanceCents-=amount*100;selected.arrearsCents=Math.min(selected.arrearsCents??0,selected.balanceCents);selected.balance=Math.ceil(selected.balanceCents/100);selected.arrears=Math.ceil(selected.arrearsCents/100);}
  else{selected.balance-=amount;selected.arrears=Math.min(selected.arrears,selected.balance);}
 }else{
  s.initialDebtCents=(s.initialDebtCents??s.debt*100)-amount*100;
  s.initialArrearsCents=Math.min(s.initialArrearsCents??0,s.initialDebtCents);
  s.debt=Math.ceil(s.initialDebtCents/100);s.arrearsLoan=Math.ceil(s.initialArrearsCents/100);
 }
 debitCashCents(s,amount*100);
 post(s,'extraordinary_amortization',-amount,'Amortização OE-016',{cardId:'OE-016',loanId});
 const event=s.cardEvents.at(-1);event.resolution='purchase';event.financialEffect=true;
 s.currentCard.effectExecuted=true;s.currentCard.amortization={loanId,amount};
 addLog(s,`OE-016: amortização extraordinária de R$ ${amount}.`,'pay');
 return s;
}
export function resolvePhilanthropy(state,amount){
 const offer=philanthropyOffer(state.currentCard,state.circuit);
 if(!offer||!state.pending||state.lastTile!=='FI'||state.cardEvents?.at(-1)?.resolution!=='pending')throw Error('Não há contribuição de filantropia pendente.');
 if(!Number.isSafeInteger(amount)||amount<0)throw Error('Valor inválido.');
 const selection=offer.options.find(([value])=>value===amount);
 if(amount!==0&&!selection)throw Error('Escolha uma faixa de contribuição aprovada.');
 if(amount*100>cashBalanceCents(state))throw Error('Caixa insuficiente para a contribuição.');
 const s=structuredClone(state);migrateLedger(s);
 const event=s.cardEvents.at(-1);
 event.resolution='philanthropy';event.financialEffect=amount>0;event.amount=amount;
 if(amount){
  debitCashCents(s,amount*100);
  post(s,'philanthropy',-amount,`Contribuição social ${s.currentCard.id}`,{cardId:s.currentCard.id,impact:selection[1],unit:offer.unit});
  s.socialImpact??=[];
  s.socialImpact.push({id:uid(),turn:s.turn,cardId:s.currentCard.id,project:offer.project,amount,impact:selection[1],unit:offer.unit});
  addLog(s,`${offer.project}: contribuição de R$ ${amount}; impacto simulado ${selection[1]} ${offer.unit}.`,'info');
 }else addLog(s,`Contribuição ${s.currentCard.id} recusada, sem penalidade.`,'info');
 s.currentCard.effectExecuted=true;
 return s;
}
export function finishTurn(state){if(!state.pending)throw Error('Nenhuma resolução pendente');const s=structuredClone(state);if(s.currentCard){s.cardEvents??=[];if(s.cardEvents.at(-1)?.resolution==='pending')resolveCardEvent(s.cardEvents,s.currentCard,s.currentCard.status==='verified_demo_subset'?'decline':'acknowledge');}s.pending=false;s.offerResolved=false;s.currentOffer=null;s.currentCard=null;return s;}
export function validateState(s){
 if(!s||s.version!==1||!PROFESSIONS[s.professionId]||!DREAMS[s.dreamId])return false;
 const b=s.circuit==='inner'?INNER:OUTER;
 return ['inner','outer'].includes(s.circuit)&&Number.isInteger(s.position)&&s.position>=1&&s.position<=b.length&&Number.isSafeInteger(s.cash)&&s.cash>=0&&(s.secondaryCashCents===undefined||(Number.isSafeInteger(s.secondaryCashCents)&&s.secondaryCashCents>=0&&s.secondaryCashCents<100))&&(s.salaryMultiplierBasisPoints===undefined||(Number.isSafeInteger(s.salaryMultiplierBasisPoints)&&s.salaryMultiplierBasisPoints>=10000))&&Number.isSafeInteger(s.debt)&&s.debt>=0&&(s.initialDebtCents===undefined||(Number.isSafeInteger(s.initialDebtCents)&&s.initialDebtCents>=0&&s.debt===Math.ceil(s.initialDebtCents/100)&&Number.isSafeInteger(s.initialInstallmentCents)&&s.initialInstallmentCents>=0&&Number.isSafeInteger(s.initialArrearsCents)&&s.initialArrearsCents>=0&&s.initialArrearsCents<=s.initialDebtCents&&s.arrearsLoan===Math.ceil(s.initialArrearsCents/100)))&&(s.arrearsLivingCents===undefined||(Number.isSafeInteger(s.arrearsLivingCents)&&s.arrearsLivingCents>=0))&&['arrearsLiving','arrearsLoan'].every(k=>s[k]===undefined||(Number.isSafeInteger(s[k])&&s[k]>=0))&&(s.arrearsLoan??0)<=s.debt&&Array.isArray(s.assets)&&Array.isArray(s.history)&&validateCatalogDecks(s)&&validateCardEvents(s.cardEvents)&&validateSocialImpact(s.socialImpact)&&(s.currentCard===undefined||s.currentCard===null||(typeof s.currentCard.id==='string'&&!!getCard(s.currentCard.id)))&&(s.ledger===undefined||Array.isArray(s.ledger))&&(s.offerResolved===undefined||typeof s.offerResolved==='boolean')&&(s.currentOffer===undefined||s.currentOffer===null||verifiedIds.includes(s.currentOffer))&&(s.demoDeck===undefined||(Array.isArray(s.demoDeck)&&s.demoDeck.every(id=>verifiedIds.includes(id))&&new Set(s.demoDeck).size===s.demoDeck.length))&&checkOfficialPortfolio(s)&&['officialSecurityPricesCents','officialSecurityDividendCents'].every(k=>s[k]===undefined||(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])&&Object.entries(s[k]).every(([id,n])=>OFFICIAL_SECURITIES.some(o=>o.id===id)&&Number.isSafeInteger(n)&&n>=0)))&&(s.officialDividendRemainderCents===undefined||(Number.isSafeInteger(s.officialDividendRemainderCents)&&s.officialDividendRemainderCents>=0&&s.officialDividendRemainderCents<100))&&(s.loans===undefined||(Array.isArray(s.loans)&&s.loans.every(l=>Number.isSafeInteger(l.balance)&&l.balance>=0&&Number.isSafeInteger(l.arrears)&&l.arrears>=0&&l.arrears<=l.balance&&(l.balanceCents===undefined||(Number.isSafeInteger(l.balanceCents)&&l.balanceCents>=0&&l.balance===Math.ceil(l.balanceCents/100)&&Number.isSafeInteger(l.installmentCents)&&l.installmentCents>0&&Number.isSafeInteger(l.arrearsCents)&&l.arrearsCents>=0&&l.arrearsCents<=l.balanceCents&&l.arrears===Math.ceil(l.arrearsCents/100)))))); 
}

// The ledger records personal cash movements; no corporate or credit-origin transactions exist yet.
export function auditCash(state){
 if(!validateState(state))return {ok:false,reason:'Estado inválido'};
 if(!Array.isArray(state.ledger))return {ok:true,legacy:true};
 const expected=(state.ledgerBaseline??state.initialCash)+state.ledger.reduce((a,x)=>a+x.amount,0);
 return {ok:expected===state.cash,expected,actual:state.cash};
}

// Personal credit: approved 1% per personal closure, fixed installment in 6/12/24 periods.
// Amounts are whole reais in this educational prototype, as is the existing ledger.
export function quoteCredit(state,principal,term){
 if(![6,12,24].includes(term)||!Number.isSafeInteger(principal)||principal<=0)return {eligible:false,reason:'Valor ou prazo inválido'};
 if(!validateState(state)||state.won||state.pending)return {eligible:false,reason:'Finalize o turno antes de contratar crédito'};
 if(outstandingObligations(state).total>0)return {eligible:false,reason:'Há obrigações em atraso'};
 const p=PROFESSIONS[state.professionId];
 const income=(state.circuit==='inner'?Math.round(p.salary*(state.salaryMultiplierBasisPoints??10000)/10000):0)+passiveIncome(state);
 const rate=0.01;
 const installment=Math.ceil(principal*rate/(1-Math.pow(1+rate,-term)));
 const debtService=(state.debt>0?state.installment:0)+(state.loans??[]).filter(l=>l.balance>0).reduce((sum,l)=>sum+l.installment,0)+installment;
 const afterExpenses=income-recurringExpenses(state)-installment;
 if(debtService>income*.30)return {eligible:false,reason:'Parcelas superam 30% da renda recorrente',installment,debtService,income};
 if(afterExpenses<income*.10)return {eligible:false,reason:'Margem após despesas abaixo de 10% da renda',installment,debtService,income};
 return {eligible:true,installment,debtService,income,afterExpenses,term,principal,centPreview:quoteAmortizationCents(principal*100,term)};
}
export function contractCredit(state,principal,term){
 const q=quoteCredit(state,principal,term);if(!q.eligible)throw Error(q.reason);
 const s=structuredClone(state);migrateLedger(s);
 const loan={id:uid(),original:principal,balance:principal,installment:Math.ceil(q.centPreview.installmentCents/100),term,periodsElapsed:0,arrears:0,
  balanceCents:principal*100,originalCents:principal*100,installmentCents:q.centPreview.installmentCents,arrearsCents:0};
 s.loans??=[];s.loans.push(loan);creditCashCents(s,principal*100);
 post(s,'credit',principal,`Crédito contratado: ${term} períodos`,{loanId:loan.id});
 addLog(s,`Crédito de R$ ${principal} contratado em ${term} parcelas de R$ ${q.installment}.`,'asset');
 return s;
}
export function prepayLoan(state,loanId,amount){
 if(!validateState(state)||state.pending||state.won)throw Error('Finalize o turno antes de quitar dívidas');
 if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Valor de pagamento inválido');
 const s=structuredClone(state);migrateLedger(s);
 const loan=loanId==='initial'?null:(s.loans??[]).find(l=>l.id===loanId);
 if(loanId!=='initial'&&!loan)throw Error('Empréstimo não encontrado');
 const outstanding=loan?loan.balance:s.debt;
 if((loan&&Number.isSafeInteger(loan.balanceCents)?amount*100>loan.balanceCents:amount>outstanding)||amount*100>cashBalanceCents(s))throw Error('Pagamento supera o saldo devido ou o caixa');
 if(loan){
  if(Number.isSafeInteger(loan.balanceCents)){
   loan.balanceCents-=amount*100;
   loan.arrearsCents=Math.min(loan.arrearsCents??0,loan.balanceCents);
   loan.balance=Math.ceil(loan.balanceCents/100);
   loan.arrears=Math.ceil(loan.arrearsCents/100);
  }else{loan.balance-=amount;loan.arrears=Math.min(loan.arrears,loan.balance);}
 }else{s.initialDebtCents=(s.initialDebtCents??s.debt*100)-amount*100;s.initialArrearsCents=Math.min(s.initialArrearsCents??(s.arrearsLoan??0)*100,s.initialDebtCents);s.debt=Math.ceil(s.initialDebtCents/100);s.arrearsLoan=Math.ceil(s.initialArrearsCents/100);}
 debitCashCents(s,amount*100);post(s,'loan_payment',-amount,'Amortização antecipada de dívida',{loanId});
 addLog(s,`Amortização antecipada de R$ ${amount}.`,'pay');return s;
}
export function exportFinanceCSV(state){
 if(!validateState(state))throw Error('Estado inválido');
 const escape=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 return '﻿'+'turno;fechamento;tipo;descricao;valor\n'+(state.ledger??[]).map(e=>[e.turn,e.closure,e.kind,e.description,e.amount].map(escape).join(';')).join('\n');
}

// Portable saves are local-only and do not grant multiplayer identity or authority.
export function serializeGame(state){
 if(!validateState(state)||!auditCash(state).ok)throw Error('Partida com dados financeiros inconsistentes.');
 return JSON.stringify({format:'corrida-dos-ratos-save',schema:1,exportedAt:new Date().toISOString(),game:state},null,2);
}
export function deserializeGame(content){
 let payload;try{payload=JSON.parse(content)}catch{throw Error('Arquivo de partida não é um JSON válido.');}
 if(payload?.format!=='corrida-dos-ratos-save'||payload.schema!==1||!validateState(payload.game))throw Error('Formato de partida inválido ou incompatível.');
 if(!auditCash(payload.game).ok)throw Error('O extrato não confere com o caixa da partida.');
 return structuredClone(payload.game);
}
export function financialSnapshot(s){
 if(!validateState(s))throw Error('Estado inválido');
 const obligations=outstandingObligations(s);
 const credit=(s.loans??[]).reduce((a,l)=>a+l.balance,0);
 const assets=s.initialAssets+s.assets.reduce((a,x)=>a+x.cost,0);
 return {cash:s.cash,assetCostBasis:assets,loanBalance:s.debt+credit,overdueLiving:obligations.living,netWorthCostBasis:s.cash+assets-s.debt-credit-obligations.living,passive:passiveIncome(s),expenses:recurringExpenses(s),streak:s.streak,closures:s.closures};
}

export {lifeDecision};
export function chooseLifeEvent(state,choice){return resolveLifeDecision(state,choice,PROFESSIONS[state.professionId].salary);}
