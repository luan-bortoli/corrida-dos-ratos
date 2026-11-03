// Valores e rendimentos iniciais correspondentes às cartas PO-001 a PO-007 do catálogo aprovado.
export const OFFICIAL_SMALL_BUSINESSES=Object.freeze([
 {id:'PO-001',name:'Máquina de Lanches',cost:3000,passive:75},
 {id:'PO-002',name:'Carrinho de Café',cost:2200,passive:55},
 {id:'PO-003',name:'Loja Virtual de Produtos Artesanais',cost:1800,passive:45},
 {id:'PO-004',name:'Ponto de Recarga de Dispositivos',cost:2800,passive:65},
 {id:'PO-005',name:'Serviço de Impressões',cost:4000,passive:100},
 {id:'PO-006',name:'Quiosque de Acessórios',cost:5000,passive:110},
 {id:'PO-007',name:'Pequena Lavanderia Automatizada',cost:5500,passive:125}
]);
// PO-018–PO-021: locação com renda inicial líquida; manutenção extraordinária pendente.
// PO-022–PO-025: estoque para revenda; preço-alvo NÃO é receita garantida.
export const OFFICIAL_PO_RENTALS=Object.freeze([
 {id:'PO-018',name:'Projetor para Eventos',cost:1600,passive:35,kind:'rental'},
 {id:'PO-019',name:'Kit de Ferramentas Profissionais',cost:2000,passive:45,kind:'rental'},
 {id:'PO-020',name:'Equipamentos para Festas',cost:3200,passive:70,kind:'rental'},
 {id:'PO-021',name:'Equipamento Fotográfico',cost:4500,passive:90,kind:'rental'}
]);
export const OFFICIAL_PO_RESALE=Object.freeze([
 {id:'PO-022',name:'Lote de Livros Usados',cost:600,passive:0,targetPrice:780,kind:'resale'},
 {id:'PO-023',name:'Bicicleta para Revenda',cost:900,passive:0,targetPrice:1200,kind:'resale'},
 {id:'PO-024',name:'Computador Recondicionado',cost:1500,passive:0,targetPrice:1950,kind:'resale'},
 {id:'PO-025',name:'Lote de Móveis para Escritório',cost:2400,passive:0,targetPrice:3100,kind:'resale'}
]);
export function officialPOAssetOffer(card,circuit){
 if(circuit!=='inner'||card?.category!=='PO')return null;
 return [...OFFICIAL_PO_RENTALS,...OFFICIAL_PO_RESALE].find(x=>x.id===card.id)??null;
}
export function officialSmallBusinessOffer(card,circuit){return circuit==='inner'&&card?.category==='PO'?OFFICIAL_SMALL_BUSINESSES.find(x=>x.id===card.id)??null:null;}
