// Simulador de amortização em centavos. Não altera contratos legados.
const RATE_NUMERATOR=1;
const RATE_DENOMINATOR=100;
function validCents(n){return Number.isSafeInteger(n)&&n>0;}
function validTerm(n){return [6,12,24].includes(n);}
// Juros de 1% por fechamento, arredondados ao centavo mais próximo.
export function interestCents(balanceCents){
 if(!Number.isSafeInteger(balanceCents)||balanceCents<0)throw Error('Saldo devedor inválido');
 const interest=Math.floor((balanceCents*RATE_NUMERATOR+RATE_DENOMINATOR/2)/RATE_DENOMINATOR);
 if(!Number.isSafeInteger(interest))throw Error('Juros acima do limite seguro');
 return interest;
}
export function quoteAmortizationCents(principalCents,term){
 if(!validCents(principalCents)||!validTerm(term))throw Error('Principal ou prazo inválido');
 // Cálculo de prestação nivelada com arredondamento para cima em centavos.
 const rate=0.01;
 const nominalPayment=Math.ceil(principalCents*rate/(1-Math.pow(1+rate,-term)));
 if(!validCents(nominalPayment))throw Error('Prestação fora do limite seguro');
 let balance=principalCents,totalInterestCents=0,totalPaidCents=0;
 const schedule=[];
 for(let period=1;period<=term;period++){
  const interest=interestCents(balance);
  const due=balance+interest;
  if(!Number.isSafeInteger(due))throw Error('Saldo devedor acima do limite seguro');
  const payment=Math.min(nominalPayment,due);
  if(payment<=interest&&period<term)throw Error('Prestação não amortiza o principal');
  const principalPaid=payment-interest;
  balance-=principalPaid;
  totalInterestCents+=interest;totalPaidCents+=payment;
  if(!Number.isSafeInteger(totalPaidCents)||!Number.isSafeInteger(totalInterestCents))throw Error('Total fora do limite seguro');
  schedule.push({period,openingCents:due-interest,interestCents:interest,paymentCents:payment,principalPaidCents:principalPaid,closingCents:balance});
 }
 if(balance!==0)throw Error('Cronograma não quita o principal no prazo');
 return {principalCents,term,ratePercent:1,installmentCents:nominalPayment,totalInterestCents,totalPaidCents,schedule};
}
