// Auditoria conservadora de rotas de execução: cobertura de código NÃO é homologação.
import {CARD_CATALOG} from './catalog.js';
import {OFFICIAL_SMALL_BUSINESSES,OFFICIAL_PO_RENTALS,OFFICIAL_PO_RESALE} from './official-small-businesses.js';
import {FIXED_INCOME} from './fixed-income.js';
import {OFFICIAL_SECURITIES} from './official-securities.js';
import {REAL_ESTATE} from './real-estate.js';
import {OFFICIAL_COMPANIES} from './official-companies.js';
import {COMPANY_TEMPLATES} from './companies.js';
import {GRAND_INVESTMENTS} from './grand-investments.js';
import {SPECIAL_ACQUISITIONS} from './special-opportunities.js';
import {INDIVIDUAL_MARKET_EVENTS} from './market-events.js';
import {GLOBAL_INCOME_EVENTS,GLOBAL_MARKET_EVENTS,GLOBAL_SECURITY_EVENTS} from './global-market.js';
import {PHILANTHROPY} from './philanthropy.js';
import {CORPORATE_DI} from './corporate-expenses.js';
import {CORPORATE_EXPANSIONS} from './corporate-expansion-catalog.js';
import {CONDITIONAL_ASSET_EXPENSES,expenseQuote,expenseQuoteOuter,executeAutomaticLifeEvent,executeOfficialCashBenefit} from './official-effects.js';
import {lifeDecision} from './life-decisions.js';
import {publicQuestion} from './financial-quiz.js';
const known=new Map();
function assign(ids,level,module,reason){for(const id of ids){if(!CARD_CATALOG.some(c=>c.id===id))throw Error(`ID desconhecido no relatório: ${id}`);const old=known.get(id);if(!old||level==='parcial'&&old.level==='rota')known.set(id,{level,module,reason});}}
const ids=a=>a.map(x=>x.id);
assign([...ids(OFFICIAL_SMALL_BUSINESSES),...ids(OFFICIAL_PO_RENTALS),...ids(OFFICIAL_PO_RESALE)],'rota','official-small-businesses','Aquisição; revenda e manutenção podem requerer avaliação adicional');
assign(ids(FIXED_INCOME),'rota','fixed-income','Aplicação de renda fixa');
assign(ids(OFFICIAL_SECURITIES),'rota','official-securities','Compra e custódia de instrumentos');
assign(ids(REAL_ESTATE),'rota','real-estate','Aquisição imobiliária');
assign(ids(COMPANY_TEMPLATES),'rota','companies/distributions','Aquisição secundária, lançamento comprovado, reserva, dividendos e fechamento idempotente validados por empresa; não presume lucro');
assign(ids(OFFICIAL_COMPANIES),'rota','owned-companies/corporate-operations','Aquisição, receita/despesa documentada, reserva e distribuição validadas individualmente por testes; não presume receita automática');
assign(ids(GRAND_INVESTMENTS),'rota','grand-investments','Aquisição ou participação; efeitos operacionais empresariais precisam auditoria');
// Aquisições GI empresariais agora entram no livro empresarial, inclusive conjuntas.
assign(GRAND_INVESTMENTS.filter(x=>x.kind!=='property').map(x=>x.id),'rota','acquired-company-ledgers','Aquisição vinculada à contabilidade e distribuição somente de receitas documentadas');
assign(ids(SPECIAL_ACQUISITIONS),'rota','special-opportunities','Aquisição implementada; decisões e governança variam');
assign(SPECIAL_ACQUISITIONS.filter(x=>x.incomeStatus==='requires_verified_operating_profit').map(x=>x.id),'rota','acquired-company-ledgers','Participação ou empresa vinculada à apuração de receitas documentadas');
assign(Object.keys(CORPORATE_EXPANSIONS),'rota','corporate-expansions/governance','Desembolso, votação e aumento aplicados somente a receitas empresariais verificadas em rodadas posteriores');
assign(['OE-004','OE-012','OE-014','OE-015','OE-016'],'rota','engine/server','Fluxos e alternativas financeiras cobertos por testes específicos e integrados; homologação manual da partida reservada à v2.0');
assign(Object.keys(PHILANTHROPY),'rota','philanthropy','Contribuição e impacto social');
assign(Object.keys(CORPORATE_DI),'rota','corporate-expenses','Despesa empresarial condicional');
assign(Object.keys(CONDITIONAL_ASSET_EXPENSES),'rota','official-effects','Despesa condicional de ativo');
assign([...Object.keys(INDIVIDUAL_MARKET_EVENTS),...Object.keys(GLOBAL_INCOME_EVENTS),...Object.keys(GLOBAL_MARKET_EVENTS),...Object.keys(GLOBAL_SECURITY_EVENTS),'MF-009'],'rota','market-events/global-market','Evento de mercado identificado');
for(const c of CARD_CATALOG){
 if(c.category==='DI'&&(expenseQuote(c.id,1000)||expenseQuoteOuter(c.id,1000)))assign([c.id],'rota','official-effects','Despesa pessoal');
 if(c.category==='EV'){
  if(lifeDecision(c.id,c.board))assign([c.id],'rota','life-decisions','Decisão disponível');
  else if(['EV-001','EV-005','EV-008','EV-009','EV-013','EV-018','EV-024'].includes(c.id))assign([c.id],'rota','official-effects','Evento automático disponível');
 }
 if(c.category==='BE')assign([c.id],'rota','official-effects','Benefício disponível');
 if(c.category==='EF'&&publicQuestion(c.id))assign([c.id],'rota','financial-quiz','Questão e correção disponíveis');
}
export function functionalCoverage(){
 const cards=CARD_CATALOG.map(c=>({...c,...(known.get(c.id)??{level:'sem_rota',module:'—',reason:'Nenhuma rota de efeito identificada neste inventário'})}));
 const counts={rota:0,parcial:0,sem_rota:0};const categories={};
 for(const c of cards){counts[c.level]++;const g=categories[c.category]??={total:0,rota:0,parcial:0,sem_rota:0};g.total++;g[c.level]++;}
 const percentage=n=>Math.round(n/cards.length*10000)/100;
 return {total:cards.length,counts,categories,percentages:{rotasIdentificadas:percentage(counts.rota+counts.parcial),rotasSemPendenciaConhecida:percentage(counts.rota),homologacaoIntegral:null},cards,disclaimer:'Cobertura de rotas identificadas no código, NÃO porcentagem de homologação. Status parcial registra limitações conhecidas e não substitui testes de ponta a ponta.'};
}
