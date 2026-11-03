// Category balances in whole reais, consistent with the existing profession sheets.
// Temporary modifiers affect a closing without silently changing the underlying base.
import {PROFESSIONS} from './data.js';
const KEYS=['housing','food','transport','leisure','education'];
export function ensureBudget(s){
 if(!s.expenseCategories){const p=PROFESSIONS[s.professionId];s.expenseCategories=Object.fromEntries(KEYS.map(k=>[k,p.items[k]]));
  const difference=s.baseExpenses-Object.values(s.expenseCategories).reduce((a,b)=>a+b,0);
  if(difference)s.expenseCategories.housing+=difference;
 }
 return s.expenseCategories;
}
export function changeBudgetCategory(s,key,delta){
 const c=ensureBudget(s);if(!KEYS.includes(key)||!Number.isSafeInteger(delta))throw Error('Ajuste de categoria inválido');
 const next=c[key]+delta;if(next<0)throw Error('Despesa não pode ser negativa');c[key]=next;
 s.baseExpenses=Object.values(c).reduce((a,b)=>a+b,0);
}
export function addTemporaryBudgetDiscount(s,category,percent,closures){
 ensureBudget(s);if(!KEYS.includes(category)||percent<=0||percent>100||!Number.isInteger(closures)||closures<1)throw Error('Desconto inválido');
 s.budgetModifiers??=[];s.budgetModifiers.push({category,percent,remaining:closures});
}
export function livingDueForClosure(s){
 if(!s.expenseCategories)return s.baseExpenses;
 const categories=ensureBudget(s);let due=s.baseExpenses;
 for(const mod of s.budgetModifiers??[]){if(mod.remaining>0)due+=mod.fixedDelta??-Math.round(categories[mod.category]*mod.percent/100);}
 return Math.max(0,due);
}
export function applyScheduledSalary(s){
 for(const b of s.delayedSalaryBoosts??[]){if(b.activateAtClosure===s.closures+1)s.salaryMultiplierBasisPoints=Math.round((s.salaryMultiplierBasisPoints??10000)*(10000+b.basisPoints)/10000);}
 s.delayedSalaryBoosts=(s.delayedSalaryBoosts??[]).filter(b=>b.activateAtClosure>s.closures+1);
}
export function finalizeBudgetClosing(s){
 s.budgetModifiers=(s.budgetModifiers??[]).map(x=>({...x,remaining:x.remaining-1})).filter(x=>x.remaining>0);

}
