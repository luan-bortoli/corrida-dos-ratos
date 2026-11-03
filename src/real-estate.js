// Aquisições à vista verificadas no catálogo aprovado. Financiamento utiliza as regras existentes de crédito pessoal; vacância ainda não é simulada.
export const REAL_ESTATE = Object.freeze([
 {id:'GO-001',name:'Apartamento Compacto para Aluguel',cost:35000,passive:350,minDown:20},
 {id:'GO-002',name:'Sala Comercial',cost:48000,passive:430,minDown:25},
 {id:'GO-003',name:'Casa para Locação',cost:65000,passive:520,minDown:25},
 {id:'GO-004',name:'Pequeno Galpão',cost:80000,passive:680,minDown:30},
 {id:'GO-005',name:'Chalé para Hospedagem',cost:42000,passive:380,minDown:25},
 {id:'GO-006',name:'Terreno em Área de Expansão',cost:25000,passive:0,minDown:30},
 {id:'GO-007',name:'Conjunto de Lojas',cost:95000,passive:820,minDown:30},
 {id:'GO-008',name:'Prédio com Três Quitinetes',cost:110000,passive:950,minDown:30}
]);
export function realEstateOffer(card,circuit){return circuit==='inner'&&card?.category==='GO'?REAL_ESTATE.find(x=>x.id===card.id)??null:null;}
