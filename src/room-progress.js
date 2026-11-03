import {DREAMS} from './data.js';
import {cashBalanceCents} from './money-balance.js';
/** Read-only progress indicators; winning requires an actual completed dream. */
export function roomProgress(room){
 const players=room.players??[];
 const completed=players.filter(p=>p.game?.won);
 const sorted=[...completed].sort((a,b)=>{const ai=room.winnerOrder?.indexOf(a.id)??-1,bi=room.winnerOrder?.indexOf(b.id)??-1;return (ai<0?Infinity:ai)-(bi<0?Infinity:bi);});
 const winners=sorted.map(p=>({id:p.id,name:p.name,place:sorted.indexOf(p)+1,dream:DREAMS[p.game.dreamId]?.name??p.game.dreamId,turns:p.game.turn,closures:p.game.closures}));
 const standings=players.map(p=>{const g=p.game??{};return {id:p.id,name:p.name,stage:g.won?'sonho_realizado':g.circuit==='outer'?'alta_velocidade':'corrida_dos_ratos',turns:g.turn??0,closures:g.closures??0,streak:g.streak??0,position:g.position??1,completed:!!g.won,cashCents:Number.isSafeInteger(g.cash??0)&&Number.isSafeInteger(g.secondaryCashCents??0)?cashBalanceCents({...g,cash:g.cash??0}):null};});
 return {status:room.status,round:room.round??1,totalPlayers:players.length,completedPlayers:winners.length,activePlayers:players.length-winners.length,winners,standings,allDreamsCompleted:players.length>0&&winners.length===players.length,endedByTeacher:room.status==='finished'&&winners.length<players.length};
}
