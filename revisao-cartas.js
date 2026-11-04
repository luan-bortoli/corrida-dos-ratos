import { CARD_CATALOG, getCard } from "./src/catalog.js";
import { FIXED_INCOME } from "./src/fixed-income.js";
import { lifeDecision } from "./src/life-decisions.js";
import { philanthropyOffer } from "./src/philanthropy.js";
import { cardLearningDisplay } from "./src/card-presentation.js";
import { splitCardText } from "./src/card-text-rendering.js";
import quizData from "./src/financial-quiz-data.json" with { type: "json" };

const $ = (id) => document.getElementById(id);
const LABELS = {
  PO: "Pequenas oportunidades", GO: "Grandes oportunidades", DI: "Despesas inesperadas",
  MF: "Mercado financeiro", EV: "Eventos da vida", EF: "Educação financeira",
  BE: "Benefícios", GI: "Grandes investimentos", OE: "Oportunidades especiais",
  FI: "Filantropia",
};
const clean = (x) => String(x ?? "").replace(/\\\$/g, "R$").replace(/\\\./g, ".")
  .replace(/\*\*/g, "").replace(/^\s*#{1,5}\s*/gm, "").replace(/\s+/g, " ").trim();
function inspectCard(card) {
  // Mesmo parser de texto utilizado no multiplayer; não reinterpretamos a carta no visualizador.
  const content = splitCardText(card.text, card.id);
  const fixed = FIXED_INCOME.find((x) => x.id === card.id);
  const title = fixed?.name || content.title;
  const description = content.description || (fixed
    ? `Você pode aplicar de ${money(fixed.min)} a ${money(fixed.max)}, em valores de ${money(fixed.step)}. Consulte as condições de rendimento, prazo e resgate antes de decidir.`
    : "Leia as condições desta oportunidade e avalie os riscos antes de decidir.");
  const notes = [];
  if (!String(card.text ?? "").trim()) notes.push("Texto oficial não encontrado.");
  if (title === card.id) notes.push("O título apresentado não foi identificado claramente.");
  if (/descrição detalhada indisponível/i.test(card.text || "")) notes.push("O texto contém uma mensagem de conteúdo indisponível.");
  return { ...card, title, description, fields: content.fields, raw: content.raw, notes, source: String(card.text || "") };
}
const money=(n)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);
const cards = CARD_CATALOG.map(x => inspectCard(getCard(x.id)));
let selected = cards[0]?.id;
const category = $("reviewCategory");
Object.keys(LABELS).forEach(key=>category.add(new Option(`${LABELS[key]} (${cards.filter(c=>c.category===key).length})`,key)));
function make(tag, text, className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function previewLabel(parent, label, value) {
  const node=make("div",undefined,"metric");
  node.append(make("span",label),make("strong",value));
  parent.append(node);
}
function previewField(parent,label,value) {
  const node=make("div",undefined,"card-field");
  node.append(make("strong",label),make("p",value));
  parent.append(node);
}
function previewChoices(card){
  const actions=$("reviewActions");actions.replaceChildren();
  const hint=make("p",undefined,"review-action-hint");
  const buttons=make("div",undefined,"review-action-buttons");
  let labels=[];
  const circuit=card.circuit==="both"?card.board:card.circuit;
  const decision=card.category==="EV"?lifeDecision(card.id,circuit):null;
  const philanthropy=card.category==="FI"?philanthropyOffer(card,circuit):null;
  if(decision) labels=[decision.accept,decision.reject];
  else if(philanthropy){labels=philanthropy.options.map(([amount,impact])=>`Contribuir ${money(amount)} — ${impact} ${philanthropy.unit}`);labels.push("Não contribuir");}
  else if(card.category==="EF"){
    const question=quizData[card.id];
    if(question){
      const q=make("p",`${card.id}: ${question.question}`, "review-quiz-question");
      actions.append(q);
      labels=question.options.map((option,i)=>`${"ABCD"[i]}) ${option}`);
      buttons.classList.add("review-answer-buttons");
      hint.textContent="Alternativas oficiais da carta; nenhum resultado ou recompensa será aplicado nesta revisão.";
    }else{
      hint.textContent="Não foi possível carregar as alternativas oficiais desta carta.";
    }
  } else if(["PO","GO","GI","OE"].includes(card.category)){
    labels=["Comprar / aceitar oportunidade","Recusar / concluir turno"];
    hint.textContent="Botões ilustrativos. As opções reais dependem do ativo, do caixa, do circuito e da carta sorteada.";
  } else {
    hint.textContent="Carta sem escolhas demonstráveis nesta prévia. Os efeitos automáticos e os resultados não são executados.";
  }
  if(labels.length){
    if(card.category==="EF")buttons.classList.add("review-answer-buttons");
    for(const label of labels){const button=make("button",label,"outline");button.type="button";button.disabled = true;buttons.append(button);}
    actions.append(buttons);
  }
  actions.append(hint);
}
function renderPreview(card){
  if(!card)return;
  selected=card.id;
  $("previewId").textContent=card.id;
  $("previewCategory").textContent=LABELS[card.category] || card.category;
  $("previewTitle").textContent=card.title;
  $("previewDescription").textContent=card.description;
  const metrics=$("previewMetrics"), fields=$("previewFields");metrics.replaceChildren();fields.replaceChildren();
  const summary=/Investimento|Preço|Renda inicial|Renda líquida inicial|Liquidez/i;
  for(const [label,value] of card.fields){
    if(summary.test(label))previewLabel(metrics,label,value);
    else if(!/Aprendizagem|Aprendizado/i.test(label)) previewField(fields,label,value);
  }
  if(!card.fields.length && card.raw) {
    fields.append(make("p",card.raw,"card-fallback"));
  }
  const learning=card.fields.find(([label])=>/Aprendizagem|Aprendizado/i.test(label));
  const learningInfo=cardLearningDisplay(learning?.[1]);
  $("previewLearning").hidden=!learningInfo;
  $("previewLearning").textContent=learningInfo?`${learningInfo.label} · ${learningInfo.value}`:"";
  // Elegibilidade e feedback não são inventados fora de um contexto real.
  $("previewEligibility").hidden=true;
  previewChoices(card);
  const notes=$("previewObservations");notes.replaceChildren(make("h3","Observações automáticas"));
  if(!card.notes.length)notes.append(make("p","Nenhuma observação de texto detectada automaticamente.","review-ok"));
  else{const list=make("ul");for(const note of card.notes)list.append(make("li",note));notes.append(list);}
  $("previewOriginal").textContent=card.source||"Sem texto original cadastrado.";
}
function renderList(){
  const q=$("reviewSearch").value.trim().toLocaleLowerCase("pt-BR");
  const kind=category.value, circuit=$("reviewCircuit").value, flag=$("reviewFlag").value;
  const matches=cards.filter(c=>(!kind||c.category===kind)&&(!circuit||c.circuit===circuit||c.circuit==="both")
    &&(!flag||(flag==="attention"?c.notes.length>0:c.notes.length===0))
    &&(!q||`${c.id} ${c.title} ${c.description} ${c.source}`.toLocaleLowerCase("pt-BR").includes(q)));
  $("reviewCount").textContent=`${matches.length} de ${cards.length} cartas`;
  const list=$("reviewList");list.replaceChildren();
  for(const c of matches){const button=make("button",undefined,"review-item");button.type="button";button.setAttribute("role","option");button.setAttribute("aria-selected",String(c.id===selected));
    button.append(make("strong",`${c.id} · ${c.title}`),make("small",LABELS[c.category]+(c.notes.length?" · Revisar apresentação":"")));
    button.onclick=()=>{renderPreview(c);renderList();};list.append(button);}
  if(!matches.length) list.append(make("p","Nenhuma carta encontrada para esses filtros.","review-empty"));
  if(!matches.find(c=>c.id===selected) && matches.length)renderPreview(matches[0]);
}
const examples=[
  ["PO-003","Pequeno negócio"], ["PO-008","Renda fixa"],
  ["PO-017","Ações"], ["DI-006","Despesa"],
  ["EV-012","Escolha"], ["EF-001","Pergunta"],
  ["GO-016","Participação"], ["GI-001","Alta Velocidade"],
  ["FI-001","Filantropia"]
];
for(const [id,label] of examples){
  const button=make("button",`${label} · ${id}`,"outline review-example");button.type="button";
  button.onclick=()=>{ $("reviewSearch").value=id;$("reviewCategory").value="";$("reviewCircuit").value="";$("reviewFlag").value="";renderList();};
  $("reviewExamples").append(button);
}
for(const id of ["reviewSearch","reviewCategory","reviewCircuit","reviewFlag"])$(id).addEventListener("input",renderList);
async function authenticate(){
  let session;
  try{session=JSON.parse(sessionStorage.getItem("cr-room-session")||"null");}catch{}
  if(!session||session.role!=="teacher"||!/^[A-F0-9]{8}$/.test(session.code||""))throw Error("Acesse primeiro uma sala como Administrador.");
  const response=await fetch(`/api/room/${session.code}/card-audit`,{headers:{authorization:`Bearer ${session.token}`}});
  if(!response.ok)throw Error("A sessão administrativa expirou. Entre novamente na sala.");
  const audit=await response.json();
  if(audit.totalActual!==cards.length)throw Error("O catálogo local não corresponde ao inventário do servidor.");
}
authenticate().then(()=>{$("reviewRoot").hidden=false;renderPreview(cards[0]);renderList();}).catch(e=>{$("reviewBlocked").hidden=false;$("reviewBlockReason").textContent=e.message;});
