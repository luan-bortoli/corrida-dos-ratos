export const PROFESSIONS = [
 ['Auxiliar Administrativo',2200,1800,2000,700,400,200,100,100,300,3000,0,0],
 ['Vendedor',2500,2000,2500,750,450,250,150,100,300,4500,1000,0],
 ['Cozinheiro',2800,2350,2000,850,550,300,150,150,350,4200,0,0],
 ['Técnico em Informática',3500,2800,3500,1000,650,300,250,200,400,6000,1500,0],
 ['Eletricista',3800,3000,3000,1100,650,400,200,200,450,7500,2000,10],
 ['Professor',4200,3500,4000,1250,750,400,250,250,600,12000,2500,0],
 ['Designer',4500,3600,3000,1300,750,450,350,250,500,8000,3000,15],
 ['Enfermeiro',5000,4100,4000,1450,900,450,350,300,650,13500,1000,0],
 ['Programador',6000,5000,5000,1800,1100,600,450,350,700,15000,5000,25],
 ['Engenheiro',8500,7500,6000,2600,1500,700,800,500,1400,32000,8000,40],
 ['Advogado',9000,8000,5000,2800,1700,800,900,500,1300,29000,6000,30],
 ['Médico',13000,11800,8000,4200,2500,1100,1500,900,1600,45000,10000,50],
].map(([name,salary,expenses,cash,housing,food,transport,leisure,education,installment,debt,assets,passive],i)=>({id:i,name,salary,expenses,cash,items:{housing,food,transport,leisure,education,installment},debt,assets,passive}));
export const INNER = ['PAY','PO','EF','DI','PO','EV','GO','MF','PO','DI','BE','EF','PO','EV','GO','DI','MF','PO','EF','DI','GO','EV','PO','MF','DI','BE','EF','GO','PO','EV','DI','MF'];
export const OUTER = ['PAY','GI','OE','DI','GI','DREAM:CAFE','EF','MF','GI','OE','EV','GI','DI','OE','DREAM:TRAVEL','GI','MF','EF','GI','OE','DI','GI','DREAM:HOUSE','EV','OE','GI','MF','DI','EF','DREAM:TECH','GI','OE','EV','MF','GI','DI','DREAM:SOCIAL','OE','EF','GI','MF','DI','FI','GI','OE','EV','DREAM:RURAL','MF'];
export const DREAMS = {CAFE:{name:'Abrir uma Cafeteria',price:150000,position:6},TRAVEL:{name:'Viajar pelo Mundo',price:100000,position:15},HOUSE:{name:'Casa dos Sonhos',price:300000,position:23},TECH:{name:'Empresa de Tecnologia',price:250000,position:30},SOCIAL:{name:'Projeto Social',price:120000,position:37},RURAL:{name:'Propriedade Rural',price:400000,position:47}};
// Only figures recoverable from approved source. This is a demo subset, not the 230-card catalog.
export const VERIFIED_ASSETS = [
 {id:'PO-001',name:'Máquina de Lanches',cost:3000,passive:75},
 {id:'PO-002',name:'Carrinho de Café',cost:2200,passive:55},
 {id:'PO-007',name:'Lavanderia Automatizada',cost:5500,passive:125},
];
export const TILE_NAMES={PAY:'Dia do Pagamento',PO:'Pequena Oportunidade',GO:'Grande Oportunidade',EF:'Educação Financeira',DI:'Despesa Inesperada',EV:'Evento da Vida',MF:'Mercado Financeiro',BE:'Benefício',GI:'Grande Investimento',OE:'Oportunidade Especial',FI:'Filantropia'};
