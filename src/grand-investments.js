// GI-001–GI-018: dados econômicos transcritos das cartas aprovadas.
// GI-011–GI-018 são empresas e não produzem dividendos sem apuração operacional.
const rows=[
 ['Edifício com Apartamentos',180000,1500,30],
 ['Centro Comercial de Bairro',250000,2200,35],
 ['Galpão Logístico',320000,2800,40],
 ['Residencial para Estudantes',210000,1850,30],
 ['Pousada de Pequeno Porte',290000,2400,35],
 ['Imóvel Comercial em Região Valorizada',400000,3100,40],
 ['Conjunto de Casas para Aluguel',240000,2000,35],
 ['Terreno para Valorização',150000,0,40],
 ['Centro de Armazenamento',350000,3000,40],
 ['Complexo de Salas Profissionais',450000,3600,40],
 ['Rede de Cafeterias',160000,1800,35],
 ['Empresa de Desenvolvimento de Software',280000,2600,40],
 ['Indústria de Móveis',350000,3200,40],
 ['Empresa de Energia Renovável',420000,3700,40],
 ['Rede de Lavanderias',230000,2200,35],
 ['Empresa de Logística Regional',380000,3400,40],
 ['Plataforma de Ensino Digital',190000,1500,35],
 ['Empresa de Reciclagem Industrial',310000,2750,40]
];
const participationRows=[
 ['Sócio de um Centro Médico',100000,500000,20,900],
 ['Participação em Empresa de Inteligência Artificial',120000,800000,15,0],
 ['Investimento em Rede de Supermercados',150000,600000,25,1300],
 ['Sócio de Complexo de Hospedagem',210000,700000,30,1800],
 ['Participação em Indústria Alimentícia',180000,900000,20,1400],
 ['Sociedade em Empresa de Energia Solar',200000,1000000,20,1600],
 ['Participação em Centro de Distribuição',300000,1200000,25,2500]
];
export const GRAND_PARTICIPATIONS=Object.freeze(participationRows.map(([name,cost,valuation,percent,referencePassive],i)=>Object.freeze({id:`GI-${String(i+19).padStart(3,'0')}`,name,cost,valuation,percent,referencePassive,passive:0,kind:'participation',minDown:100})));
export const GRAND_INVESTMENTS=Object.freeze([...rows.map(([name,cost,referencePassive,minDown],i)=>Object.freeze({id:`GI-${String(i+1).padStart(3,'0')}`,name,cost,referencePassive,passive:i<10?referencePassive:0,minDown,kind:i<10?'property':'company'})),...GRAND_PARTICIPATIONS]);
export function grandInvestmentOffer(card,circuit){return circuit==='outer'&&card?.category==='GI'?GRAND_INVESTMENTS.find(x=>x.id===card.id)??null:null;}
