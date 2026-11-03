import {randomUUID} from 'node:crypto';
import {openProposal} from './governance.js';
import {quoteAmortizationCents,interestCents} from './credit-cents.js';
// OE-015: uma obrigação empresarial já reconhecida pode tornar-se financiamento.
// Não credita caixa e não duplica a despesa original no resultado operacional.
const active=(room,id)=>room.players?.find(p=>p.id===id)?.game;
export function eligibleCorporateRenegotiations(room,playerId){
 return (room.companies??[]).filter(c=>(c.shares?.[playerId]??0)>0&&Number.isSafeInteger(c.pendingExpenses)&&c.pendingExpenses>0)
 .map(c=>({id:c.id,name:c.name,balance:c.pendingExpenses}));
}
export function applyCorporateRenegotiation(room,companyId,term,proposalId){
 const company=(room.companies??[]).find(c=>c.id===companyId);
 if(!company||!Number.isSafeInteger(company.pendingExpenses)||company.pendingExpenses<=0)throw Error('Empresa sem obrigação renegociável');
 if(![6,12,24].includes(term))throw Error('Prazo deve ser 6, 12 ou 24 fechamentos');
 if((company.corporateLoans??[]).some(l=>l.proposalId===proposalId))throw Error('Renegociação já executada');
 const principal=company.pendingExpenses*100;
 const schedule=quoteAmortizationCents(principal,term);
 if(!Number.isSafeInteger(schedule.installmentCents)||schedule.installmentCents<=0)throw Error('Parcelas inválidas');
 // Critério conservador: capacidade de pagamento baseada apenas em lucro retido verificado.
 if((company.retainedProfit??0)<=0||Math.ceil(schedule.installmentCents/100)>(company.retainedProfit??0)*.3)
  throw Error('Empresa sem capacidade comprovada para as parcelas');
 company.pendingExpenses=0;
 company.corporateLoans??=[];
 const loan={id:randomUUID(),proposalId,originalCents:principal,balanceCents:principal,installmentCents:schedule.installmentCents,arrearsCents:0,term,periodsElapsed:0};
 company.corporateLoans.push(loan);
 company.history??=[];company.history.push({type:'debt_renegotiation',proposalId,loanId:loan.id,principalCents:principal,term,round:room.round});
 return {companyId,loanId:loan.id,principalCents:principal,installmentCents:loan.installmentCents,term,status:'executed'};
}
export function proposeCorporateRenegotiation(room,playerId,companyId,term){
 const game=active(room,playerId);
 if(!game?.pending||game.circuit!=='outer'||game.lastTile!=='OE'||game.currentCard?.id!=='OE-015'||game.cardEvents?.at(-1)?.resolution!=='pending')throw Error('OE-015 não está pendente');
 if(!eligibleCorporateRenegotiations(room,playerId).some(c=>c.id===companyId))throw Error('Empresa sem obrigação elegível');
 const company=room.companies.find(c=>c.id===companyId);
 const shareholders=Object.entries(company.shares).filter(([id,share])=>id!=='origin'&&share>0);
 let result;
 if(shareholders.length===1&&shareholders[0][0]===playerId&&shareholders[0][1]===100)
  result=applyCorporateRenegotiation(room,companyId,term,`direct:${game.id}:${game.turn}:OE-015`);
 else{
  const proposal=openProposal(room,playerId,companyId,`Renegociação OE-015: ${term} fechamentos`);
  proposal.renegotiationTerm=term;proposal.operationStatus='awaiting_votes';result={companyId,proposalId:proposal.id,status:'voting'};
 }
 const event=game.cardEvents.at(-1);event.resolution=result.status==='voting'?'corporate_proposal':'corporate_expansion';event.financialEffect=result.status!=='voting';
 game.currentCard.effectExecuted=true;game.currentCard.corporateRenegotiation=result;
 return result;
}
export function executeApprovedCorporateRenegotiation(room,proposalId){
 const proposal=room.proposals?.find(p=>p.id===proposalId);
 if(!proposal?.renegotiationTerm||proposal.status!=='approved'||proposal.operationStatus==='executed')return null;
 try{
  const result=applyCorporateRenegotiation(room,proposal.companyId,proposal.renegotiationTerm,proposal.id);
  proposal.operationStatus='executed';proposal.operationResult=result;
  const g=active(room,proposal.authorId);
  const event=g?.cardEvents?.find(e=>e.id==='OE-015'&&e.resolution==='corporate_proposal');
  if(event){event.resolution='corporate_expansion';event.financialEffect=true;}
  return result;
 }catch(e){proposal.operationStatus='awaiting_company_capacity';return null;}
}
export function settleCorporateLoans(company,round){
 let totalPaidCents=0,totalInterestCents=0;
 for(const loan of company.corporateLoans??[]){
  if(loan.balanceCents<=0)continue;
  const interest=interestCents(loan.balanceCents);
  loan.balanceCents+=interest;totalInterestCents+=interest;
  const due=Math.min(loan.balanceCents,loan.installmentCents+loan.arrearsCents);
  const balanceCents=company.cash*100+(company.cashRemainderCents??0);
  const paid=Math.min(due,balanceCents);
  const remainingCash=balanceCents-paid;
  company.cash=Math.floor(remainingCash/100);
  company.cashRemainderCents=remainingCash%100;
  loan.balanceCents-=paid;
  loan.arrearsCents=Math.max(0,due-paid);
  loan.periodsElapsed++;
  totalPaidCents+=paid;
  company.history.push({type:'corporate_loan_installment',loanId:loan.id,round,paidCents:paid,interestCents:interest,balanceCents:loan.balanceCents});
 }
 // Juros são despesa financeira nova, não principal repetido; contabilizados em centavos.
 company.corporateInterestPendingCents=(company.corporateInterestPendingCents??0)+totalInterestCents;
 const recognizedReais=Math.floor(company.corporateInterestPendingCents/100);
 company.corporateInterestPendingCents%=100;
 if(recognizedReais){company.retainedProfit-=recognizedReais;company.operatingLedger.push({sourceId:`CORP-INTEREST:${company.id}:${round}`,type:'expense',amount:recognizedReais,round});}
 return {totalPaidCents,totalInterestCents};
}
