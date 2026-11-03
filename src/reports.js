import {roomProgress} from './room-progress.js';
import {cashBalanceCents} from './money-balance.js';
import {auditCashTransfers} from './cash-audit.js';
import {auditSecurities} from './securities.js';
import {PROFESSIONS,DREAMS} from './data.js';

// Read-only reports: never mutate game state while building exports.
const finite = v => typeof v === 'number' && Number.isFinite(v) ? v : 0;
const reportedCashCents=g=>Number.isFinite(g.cash)&&!Number.isInteger(g.cash)&&g.secondaryCashCents===undefined?Math.round(g.cash*100):cashBalanceCents({...g,cash:finite(g.cash)});
const sum=(items,fn)=>items.reduce((total,item)=>total+finite(fn(item)),0);
export function buildTeacherReport(room){
 const progress=roomProgress(room);
 const participants=(room.players||[]).map(p=>{
  const g=p.game||{};
  const income=sum(g.ledger||[],x=>x.amount>0&&['salary','passive','corporate_dividend','dividend'].includes(x.kind)?x.amount:0);
  const outflow=sum(g.ledger||[],x=>x.amount<0?-x.amount:0);
  const loans=(g.loans||[]).reduce((total,l)=>total+finite(l.balance),0);
  const obligations=finite(g.arrearsLiving)+finite(g.arrearsLoan)+sum(g.loans||[],l=>l.arrears);
  const profession=PROFESSIONS.find(x=>x.id===g.professionId);
  return {name:p.name,profession:profession?.name||'Não identificada',circuit:g.circuit,position:finite(g.position),turns:finite(g.turn),closures:finite(g.closures),independenceStreak:finite(g.streak),completed:Boolean(g.won),dream:DREAMS[g.dreamId]?.name||'Não identificado',cash:finite(g.cash),cashCents:reportedCashCents(g),cashFormatted:(reportedCashCents(g)/100).toFixed(2),debt:finite(g.debt)+loans,overdue:obligations,verifiedAssets:(g.assets||[]).length,corporateParticipations:(room.companies||[]).filter(c=>(c.shares?.[p.id]||0)>0).map(c=>({company:c.name,percent:c.shares[p.id]})),recognizedInflows:income,recordedOutflows:outflow,financialEntries:(g.ledger||[]).length,cardDraws:(g.cardEvents||[]).length,cardDecisions:(g.cardEvents||[]).filter(e=>e.resolution==='decision').length,educationAnswers:(g.cardEvents||[]).filter(e=>e.id?.startsWith('EF-')&&['answer','unanswered'].includes(e.resolution)).length,educationCorrect:(g.cardEvents||[]).filter(e=>e.id?.startsWith('EF-')&&e.correct===true).length,rank:progress.winners.find(w=>w.id===p.id)?.place??null};
 });
 return {schemaVersion:4,progress,roomCode:room.code,status:room.status,round:finite(room.round),participantsCount:participants.length,completedCount:participants.filter(p=>p.completed).length,participants,securitiesAudit:auditSecurities(room),cashTransfersAudit:auditCashTransfers(room),companies:(room.companies||[]).map(c=>({name:c.name,cash:finite(c.cash),reserveRequired:finite(c.reserveRequired),lastClosedRound:finite(c.lastClosedRound),closedPeriods:(c.closedOperatingPeriods||[]).length})),notes:['Valores são indicadores do protótipo e não notas escolares.','Os valores reconhecidos dependem dos lançamentos disponíveis e não substituem conciliação completa dos investimentos.','Não representa simulação de conclusão nem validação do balanceamento.','cashCents é o saldo total exato em centavos; cash é o campo legado em reais inteiros.','A auditoria de transferências exige lançamentos simétricos e pode sinalizar negociações legadas sem trilha em centavos.']};
}
const csvCell=v=>{let s=String(v??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
export function reportCSV(report){
 const fields=['name','profession','circuit','position','turns','closures','independenceStreak','completed','dream','cash','cashCents','cashFormatted','debt','overdue','verifiedAssets','recognizedInflows','recordedOutflows','financialEntries','cardDraws','cardDecisions','educationAnswers','educationCorrect','rank'];
 return '\uFEFF'+[fields.map(csvCell).join(';'),...report.participants.map(p=>fields.map(f=>csvCell(p[f])).join(';'))].join('\r\n')+'\r\n';
}
