// Valores iniciais conforme o catálogo consolidado GO-009 a GO-015.
// Distribuição registrada como rendimento inicial de referência; apuração real ainda pendente.
export const OFFICIAL_COMPANIES = Object.freeze([
 {id:'GO-009',name:'Minimercado de Bairro',cost:28000,passive:420,minDown:30},
 {id:'GO-010',name:'Lavanderia de Bairro',cost:38000,passive:520,minDown:30},
 {id:'GO-011',name:'Pequena Padaria',cost:55000,passive:700,minDown:35},
 {id:'GO-012',name:'Agência de Serviços Digitais',cost:45000,passive:600,minDown:30},
 {id:'GO-013',name:'Oficina de Bicicletas',cost:32000,passive:450,minDown:25},
 {id:'GO-014',name:'Empresa de Energia Solar',cost:75000,passive:900,minDown:35},
 {id:'GO-015',name:'Distribuidora de Produtos',cost:90000,passive:1050,minDown:35}
]);
export function officialCompanyOffer(card,circuit){return circuit==='inner'&&card?.category==='GO'?OFFICIAL_COMPANIES.find(x=>x.id===card.id)??null:null;}
