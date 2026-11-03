import { specialAcquisitionOffer } from "./special-opportunities.js";
import { grandInvestmentOffer } from "./grand-investments.js";
import { philanthropyOffer } from "./philanthropy.js";
import { formatCashBRL } from "./money-balance.js";
import { fixedIncomeOffer, FIXED_INCOME } from "./fixed-income.js";
import { officialSecurityOffer } from "./official-securities.js";
import { officialSmallBusinessOffer, officialPOAssetOffer } from "./official-small-businesses.js";
import { officialCompanyOffer } from "./official-companies.js";
import { realEstateOffer } from "./real-estate.js";
import { getCard } from "./catalog.js";
import { publicQuestion } from "./financial-quiz.js";
import { PROFESSIONS, INNER, OUTER, DREAMS, VERIFIED_ASSETS, TILE_NAMES } from "./data.js";
import {
  createGame,
  rollTurn,
  buyVerifiedAsset,
  purchaseRealEstate,
  purchaseOfficialCompany,
  purchaseOfficialSmallBusiness,
  purchaseOfficialPOAsset,
  subscribeFixedIncome,
  redeemFixedIncome,
  purchaseOfficialSecurity,
  enableOfficialPO,
  quoteRealEstateFinance,
  financeRealEstate,
  answerEducationCard,
  chooseLifeEvent,
  lifeDecision,
  finishTurn,
  passiveIncome,
  recurringExpenses,
  validateState,
  auditCash,
  outstandingObligations,
  quoteCredit,
  contractCredit,
  prepayLoan,
  exportFinanceCSV,
  serializeGame,
  deserializeGame,
  financialSnapshot,
  purchaseSpecialOpportunity,
  quoteSpecialOpportunityFinance,
  purchaseGrandInvestment,
  quoteGrandInvestmentFinance,
  resolvePhilanthropy,
  resolveExtraordinaryAmortization,
  quoteSpecialRefinancing,
  resolveSpecialRefinancing,
  eligibleRentalImprovements,
  improveRentalProperty,
} from "./engine.js";
const $ = (id) => document.getElementById(id),
  money = (n) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(n);
let state = null;
const KEY = "corrida-dos-ratos-demo-v1";
function put(s) {
  state = s;
  localStorage.setItem(KEY, JSON.stringify(s));
  render();
}
function opts() {
  $("profession").innerHTML = PROFESSIONS.map(
    (p) => `<option value="${p.id}">${p.name}</option>`,
  ).join("");
  $("dream").innerHTML = Object.entries(DREAMS)
    .map(([k, d]) => `<option value="${k}">${d.name} — ${money(d.price)}</option>`)
    .join("");
}
function professionPreview() {
  const p = PROFESSIONS[Number($("profession").value)];
  $("professionInfo").innerHTML =
    `<div><span>Salário</span><b>${money(p.salary)}</b></div><div><span>Despesas</span><b>${money(p.expenses)}</b></div><div><span>Caixa inicial</span><b>${money(p.cash)}</b></div><div><span>Renda passiva</span><b>${money(p.passive)}</b></div>`;
}
function render() {
  $("setup").hidden = !!state;
  $("game").hidden = !state;
  if (!state) return;
  const s = state,
    p = PROFESSIONS[s.professionId],
    outer = s.circuit === "outer",
    board = outer ? OUTER : INNER;
  $("stageName").textContent = outer ? "ALTA VELOCIDADE" : "CORRIDA DOS RATOS";
  $("welcome").textContent = p.name;
  $("positionText").textContent =
    `Casa ${s.position} de ${board.length} · ${s.turn} turnos · ${s.closures} fechamentos pessoais`;
  $("boardTitle").textContent = outer ? "Alta Velocidade" : "Corrida dos Ratos";
  $("progress").textContent = outer
    ? `Objetivo: ${money(DREAMS[s.dreamId].price)}`
    : `Independência: ${s.streak}/3 fechamentos`;
  $("cash").textContent = formatCashBRL(s);
  $("passive").textContent = money(passiveIncome(s));
  $("expenses").textContent = money(recurringExpenses(s));
  $("debt").textContent = money(s.debt);
  const pending = outstandingObligations(s);
  $("arrears").textContent = money(pending.total);
  $("arrearsBreakdown").textContent =
    `Despesas: ${money(pending.living)} · Parcelas: ${money(pending.loan)}`;
  const snap = financialSnapshot(s);
  $("netWorth").textContent = money(snap.netWorthCostBasis);
  $("invested").textContent = money(snap.assetCostBasis);
  $("dreamName").textContent = DREAMS[s.dreamId].name;
  $("dreamPrice").textContent = money(DREAMS[s.dreamId].price);
  $("board").innerHTML = board
    .map(
      (t, i) =>
        `<div class="tile ${i + 1 === s.position ? "active" : ""} ${t === "PAY" ? "pay" : ""} ${t.startsWith("DREAM") ? "dream" : ""}" title="${t.startsWith("DREAM") ? DREAMS[t.split(":")[1]].name : TILE_NAMES[t]}"><span>${i + 1}</span><b>${t.startsWith("DREAM") ? "SONHO" : t === "PAY" ? "PAGAR" : t}</b>${i + 1 === s.position ? "<i>●</i>" : ""}</div>`,
    )
    .join("");
  $("turnLabel").textContent = `Turno ${s.turn}${s.lastRoll ? " · Dado: " + s.lastRoll : ""}`;
  const tile = s.lastTile;
  const tileName = tile.startsWith("DREAM") ? "Casa dos sonhos" : TILE_NAMES[tile] || "Evento";
  $("tileTitle").textContent = s.won
    ? "Sonho realizado!"
    : s.pending
      ? tileName
      : "Pronto para jogar";
  $("tileDescription").textContent = s.won
    ? "Objetivo concluído. O resultado está preservado nesta sessão."
    : s.pending
      ? tile === "PO"
        ? "Uma oportunidade demonstrativa foi sorteada. Você pode comprar o ativo sorteado ou encerrar o turno."
        : s.currentCard
          ? `${s.currentCard.id} — ${getCard(s.currentCard.id)?.text ?? "Texto indisponível"}\n\nEsta carta ainda não executa efeitos financeiros automaticamente.`
          : "Encerre o turno para continuar."
      : "Lance o dado para avançar. O catálogo oficial pode ser consultado durante as jogadas; efeitos não implementados não serão cobrados.";
  const quizArea = $("soloQuiz");
  quizArea.replaceChildren();
  if (s.pending && s.currentCard?.category === "EF") {
    const ev = s.cardEvents?.at(-1);
    const q = publicQuestion(s.currentCard.id);
    if (ev?.resolution === "pending" && q) {
      const title = document.createElement("p");
      title.textContent = q.question;
      quizArea.append(title);
      q.options.forEach((option, i) => {
        const b = document.createElement("button");
        b.textContent = `${"ABCD"[i]}) ${option}`;
        b.onclick = () => act((x) => answerEducationCard(x, "ABCD"[i]));
        quizArea.append(b);
      });
    } else if (s.currentCard.quizFeedback) {
      const p = document.createElement("p");
      p.textContent = `Resposta ${s.currentCard.quizFeedback.correct ? "correta" : "incorreta"}; gabarito ${s.currentCard.quizFeedback.correctAnswer}, recompensa ${money(s.currentCard.quizFeedback.reward)}.`;
      quizArea.append(p);
    }
  }
  const lifeArea = $("soloLife");
  lifeArea.replaceChildren();
  if (s.pending && s.currentCard?.category === "EV") {
    const d = lifeDecision(s.currentCard.id, s.circuit);
    const ev = s.cardEvents?.at(-1);
    if (d && ev?.resolution === "pending") {
      for (const [value, label] of [
        ["accept", d.accept],
        ["reject", d.reject],
      ]) {
        const b = document.createElement("button");
        b.textContent = label;
        b.onclick = () => act((x) => chooseLifeEvent(x, value));
        lifeArea.append(b);
      }
    } else if (s.currentCard.lifeDecision) {
      const p = document.createElement("p");
      p.textContent = "Decisão registrada: " + s.currentCard.lifeDecision.choice;
      lifeArea.append(p);
    }
  }
  const coArea = $("companyOffer");
  coArea.replaceChildren();
  if (s.pending) {
    const philanthropy = philanthropyOffer(s.currentCard, s.circuit);
    if (philanthropy) {
      const pending = s.cardEvents?.at(-1)?.resolution === "pending";
      const p = document.createElement("p");
      p.textContent = `${philanthropy.project} — contribuição voluntária; impacto social simulado, sem retorno financeiro.`;
      coArea.append(p);
      if (pending) {
        for (const [amount, impact] of philanthropy.options) {
          const b = document.createElement("button");
          b.textContent = `Contribuir ${money(amount)} — ${impact} ${philanthropy.unit}`;
          b.disabled = amount * 100 > s.cash * 100 + (s.secondaryCashCents ?? 0);
          b.onclick = () => act((x) => resolvePhilanthropy(x, amount));
          coArea.append(b);
        }
        const no = document.createElement("button");
        no.textContent = "Não contribuir";
        no.onclick = () => act((x) => resolvePhilanthropy(x, 0));
        coArea.append(no);
      }
    }
  }
  if (
    s.pending &&
    s.currentCard?.id === "OE-004" &&
    s.cardEvents?.at(-1)?.resolution === "pending"
  ) {
    const label = document.createElement("p");
    label.textContent =
      "OE-004 — Reforma R$ 20.000; renda de aluguel +15% a partir do próximo fechamento.";
    coArea.append(label);
    for (const a of eligibleRentalImprovements(s)) {
      const b = document.createElement("button");
      b.textContent = `Reformar ${a.name}`;
      b.disabled = s.cash * 100 + (s.secondaryCashCents ?? 0) < 2000000;
      b.onclick = () => act((x) => improveRentalProperty(x, a.ownershipId));
      coArea.append(b);
    }
  }
  const special = specialAcquisitionOffer(s.currentCard, s.circuit);
  if (s.pending && special) {
    const p = document.createElement("p");
    p.textContent = `${special.id} — ${special.name}, compra à vista por ${money(special.cost)}.`;
    coArea.append(p);
    if (s.cardEvents?.at(-1)?.resolution === "pending") {
      const b = document.createElement("button");
      b.textContent = "Comprar oportunidade especial";
      b.disabled = s.cash * 100 + (s.secondaryCashCents ?? 0) < special.cost * 100;
      b.onclick = () => act(purchaseSpecialOpportunity);
      coArea.append(b);
      if (special.id === "OE-010") {
        for (const term of [6, 12, 24]) {
          const f = document.createElement("button");
          f.className = "outline";
          f.textContent = `Financiar imóvel em ${term}x`;
          f.onclick = () => {
            const minimum = Math.ceil(special.cost * 0.4);
            const raw = prompt(`Entrada mínima ${money(minimum)}`, String(minimum));
            if (raw === null) return;
            const downPayment = Number(raw);
            const quote = quoteSpecialOpportunityFinance(s, term, downPayment);
            if (!quote.eligible) return alert(quote.reason);
            if (
              confirm(
                `Entrada ${money(downPayment)}; ${term} parcelas de ${money(quote.installment)}?`,
              )
            )
              act((x) => purchaseSpecialOpportunity(x, { term, downPayment }));
          };
          coArea.append(f);
        }
      }
    }
  }
  if (
    s.pending &&
    s.currentCard?.id === "OE-016" &&
    s.cardEvents?.at(-1)?.resolution === "pending"
  ) {
    const b = document.createElement("button");
    b.textContent = "Amortizar dívida (OE-016)";
    b.onclick = () => {
      const loans = [
        ...(s.initialDebtCents > 0 ? [{ id: "initial", balance: s.initialDebtCents / 100 }] : []),
        ...(s.loans ?? []).filter((l) => l.balance > 0),
      ];
      if (!loans.length) return alert("Nenhuma dívida ativa");
      const id = prompt(
        "Informe o identificador da dívida: " +
          loans.map((l) => `${l.id} (R$ ${l.balance})`).join(" | "),
        loans[0].id,
      );
      if (id === null) return;
      const value = prompt("Valor de amortização, mínimo R$ 1.000", "1000");
      if (value !== null) act((x) => resolveExtraordinaryAmortization(x, id, Number(value)));
    };
    coArea.append(b);
  }
  if (
    s.pending &&
    s.currentCard?.id === "OE-014" &&
    s.cardEvents?.at(-1)?.resolution === "pending"
  ) {
    const loans = (s.loans ?? []).filter((l) => l.balance > 0);
    for (const loan of loans) {
      const label = document.createElement("p");
      label.textContent = `Financiamento ${loan.id.slice(0, 8)} — saldo ${money(loan.balance)}.`;
      coArea.append(label);
      for (const term of [6, 12, 24]) {
        const button = document.createElement("button");
        button.textContent = `Renegociar em ${term}x`;
        button.onclick = () => {
          const q = quoteSpecialRefinancing(s, loan.id, term);
          if (!q.eligible) return alert(q.reason);
          if (confirm(`Substituir contrato por ${term} parcelas de ${money(q.installment)}?`))
            act((x) => resolveSpecialRefinancing(x, loan.id, term));
        };
        coArea.append(button);
      }
    }
  }
  const grand = grandInvestmentOffer(s.currentCard, s.circuit);
  if (s.pending && grand) {
    const p = document.createElement("p");
    p.textContent = `${grand.id} — ${grand.name}: ${money(grand.cost)}; ${grand.kind === "company" ? "lucro de referência (não distribuído automaticamente)" : "renda inicial de referência"} ${money(grand.referencePassive)}; entrada mínima ${grand.minDown}%.`;
    coArea.append(p);
    if (s.cardEvents?.at(-1)?.resolution === "pending") {
      const b = document.createElement("button");
      b.textContent = "Adquirir à vista";
      b.disabled = s.cash * 100 + (s.secondaryCashCents ?? 0) < grand.cost * 100;
      b.onclick = () => act(purchaseGrandInvestment);
      coArea.append(b);
      for (const term of grand.kind === "participation" ? [] : [6, 12, 24]) {
        const f = document.createElement("button");
        f.className = "outline";
        f.textContent = `Analisar financiamento em ${term}x`;
        f.onclick = () => {
          const min = Math.ceil((grand.cost * grand.minDown) / 100);
          const raw = prompt(`Entrada de ${grand.id} (mínimo R$ ${min})`, String(min));
          if (raw === null) return;
          const downPayment = Number(raw);
          const quote = quoteGrandInvestmentFinance(s, term, downPayment);
          if (!quote.eligible) return alert(quote.reason);
          if (
            confirm(
              `Entrada ${money(downPayment)}; ${term} parcelas de ${money(quote.installment)}?`,
            )
          )
            act((x) => purchaseGrandInvestment(x, { term, downPayment }));
        };
        coArea.append(f);
      }
    }
  }
  const sec = officialSecurityOffer(s.currentCard, s.circuit);
  if (s.pending && sec && s.officialPOEnabled) {
    const line = document.createElement("p");
    line.textContent = `${sec.id} — ${sec.name}: ${money(sec.price)} por unidade, de ${sec.min} a ${sec.max}; distribuição inicial prevista R$ ${(sec.dividendCents / 100).toFixed(2)} por unidade. Sem venda garantida.`;
    coArea.append(line);
    if (s.cardEvents?.at(-1)?.resolution === "pending") {
      const b = document.createElement("button");
      b.textContent = "Comprar ações/cotas";
      b.onclick = () => {
        const answer = prompt("Quantidade de unidades:", String(sec.min));
        if (answer !== null) act((x) => purchaseOfficialSecurity(x, Number(answer)));
      };
      coArea.append(b);
    }
  }
  const fixed = fixedIncomeOffer(s.currentCard, s.circuit);
  if (s.pending && fixed && s.officialPOEnabled) {
    const p = document.createElement("p");
    p.textContent = `${fixed.id} — ${fixed.name}. Aplicação de ${money(fixed.min)} a ${money(fixed.max)}, em passos de ${money(fixed.step)}. ${fixed.distribution === "coupon" ? "Cupom pago por fechamento" : "Rendimento acumulado, sem pagamento passivo"}; ${fixed.term ?? "sem"} fechamento(s) até vencimento.`;
    coArea.append(p);
    if (s.cardEvents?.at(-1)?.resolution === "pending") {
      const b = document.createElement("button");
      b.textContent = "Aplicar em renda fixa";
      b.onclick = () => {
        const answer = prompt(
          `Valor da aplicação ${fixed.id} (mínimo ${fixed.min}, máximo ${fixed.max}, passo ${fixed.step}):`,
          String(fixed.min),
        );
        if (answer !== null) act((x) => subscribeFixedIncome(x, Number(answer)));
      };
      coArea.append(b);
    }
  }
  if (!s.pending) {
    for (const c of (s.fixedIncome ?? []).filter((x) => x.status === "active")) {
      const contract = FIXED_INCOME.find((x) => x.id === c.cardId);
      const p = document.createElement("p");
      p.textContent = `${c.cardId}: saldo ${money(c.balance)}, ${c.elapsed} fechamento(s), ${contract.term ?? "sem"} vencimento.`;
      coArea.append(p);
      if (["full", "discount2"].includes(contract.early)) {
        const b = document.createElement("button");
        b.textContent = `Resgatar ${c.cardId}`;
        b.onclick = () => act((x) => redeemFixedIncome(x, c.id));
        coArea.append(b);
      }
    }
  }
  const poAsset = officialPOAssetOffer(s.currentCard, s.circuit);
  if (s.pending && poAsset && s.officialPOEnabled) {
    const p = document.createElement("p");
    p.textContent =
      poAsset.kind === "rental"
        ? `${poAsset.id} — ${poAsset.name}: ${money(poAsset.cost)} à vista; renda inicial ${money(poAsset.passive)} por fechamento. Riscos de manutenção não simulados.`
        : `${poAsset.id} — ${poAsset.name}: ${money(poAsset.cost)} à vista; preço-alvo ${money(poAsset.targetPrice)} (não garantido). Sem renda passiva e sem venda automática.`;
    coArea.append(p);
    if (s.cardEvents?.at(-1)?.resolution === "pending") {
      const b = document.createElement("button");
      b.textContent =
        poAsset.kind === "rental"
          ? "Comprar equipamento para locação"
          : "Comprar estoque para revenda";
      b.disabled = s.cash < poAsset.cost;
      b.onclick = () => act(purchaseOfficialPOAsset);
      coArea.append(b);
    }
  }
  const po = officialSmallBusinessOffer(s.currentCard, s.circuit);
  if (s.pending && po && s.officialPOEnabled) {
    const p = document.createElement("p");
    p.textContent = `${po.id} — ${po.name}: ${money(po.cost)} à vista; renda inicial ${money(po.passive)} por fechamento. Sujeita a riscos e alterações futuras.`;
    coArea.append(p);
    if (s.cardEvents?.at(-1)?.resolution === "pending") {
      const b = document.createElement("button");
      b.textContent = "Adquirir pequeno negócio";
      b.disabled = s.cash < po.cost;
      b.onclick = () => act(purchaseOfficialSmallBusiness);
      coArea.append(b);
    }
  }
  const company = officialCompanyOffer(s.currentCard, s.circuit);
  if (s.pending && company) {
    const p = document.createElement("p");
    p.textContent = `${company.id} — ${company.name}. Compra à vista: ${money(company.cost)}. Lucro distribuído inicial de referência: ${money(company.passive)} por fechamento. Sujeito à apuração futura.`;
    coArea.append(p);
    if (s.cardEvents?.at(-1)?.resolution === "pending") {
      const b = document.createElement("button");
      b.textContent = "Adquirir empresa à vista";
      b.disabled = s.cash < company.cost;
      b.onclick = () => act(purchaseOfficialCompany);
      coArea.append(b);
    }
  }
  const reArea = $("realEstateOffer");
  reArea.replaceChildren();
  const re = realEstateOffer(s.currentCard, s.circuit);
  if (s.pending && re) {
    const ev = s.cardEvents?.at(-1);
    const info = document.createElement("p");
    info.textContent = `${re.id} — ${re.name}: ${money(re.cost)} à vista. Renda inicial por fechamento: ${money(re.passive)}. Vacância e mudanças de rendimento ainda não são simuladas.`;
    reArea.append(info);
    if (ev?.resolution === "pending") {
      const btn = document.createElement("button");
      btn.textContent = "Comprar imóvel à vista";
      btn.disabled = s.cash < re.cost;
      btn.onclick = () => act(purchaseRealEstate);
      reArea.append(btn);
      for (const term of [6, 12, 24]) {
        const minimum = Math.ceil((re.cost * re.minDown) / 100);
        const b = document.createElement("button");
        b.className = "outline";
        b.textContent = `Simular financiamento em ${term}x (entrada mínima ${money(minimum)})`;
        b.onclick = () => {
          const response = prompt(
            `Entrada para ${re.name} (mínimo R$ ${minimum}, máximo R$ ${re.cost - 1}):`,
            String(minimum),
          );
          if (response === null) return;
          const down = Number(response);
          const quote = quoteRealEstateFinance(s, term, down);
          if (!quote.eligible) return alert(quote.reason);
          if (
            confirm(
              `Confirmar entrada ${money(down)} e ${term} parcelas de ${money(quote.installment)}?`,
            )
          )
            act((x) => financeRealEstate(x, term, down));
        };
        reArea.append(b);
      }
    } else {
      const p = document.createElement("p");
      p.textContent = "Compra registrada.";
      reArea.append(p);
    }
  }
  $("roll").hidden = s.pending || s.won;
  $("end").hidden = !s.pending;
  $("verifiedOffers").hidden = !(s.pending && tile === "PO" && !outer && !s.offerResolved);
  if (!$("verifiedOffers").hidden) {
    const a = VERIFIED_ASSETS.find((a) => a.id === s.currentOffer);
    $("verifiedOffers").innerHTML = a
      ? `<h3>Oportunidade demonstrativa sorteada</h3><p>Baralho reduzido de 3 cartas verificadas, sem reposição até esgotar. Não representa o catálogo completo.</p><div class="offer-grid"><article class="offer"><strong>${a.id} · ${a.name}</strong><span>Compra: ${money(a.cost)}</span><span>Renda por fechamento: ${money(a.passive)}</span><button data-buy="${a.id}" ${s.cash < a.cost ? "disabled" : ""}>Adquirir</button></article></div>`
      : "<p>Oferta indisponível neste salvamento legado. Encerre o turno.</p>";
  }
  $("ownedAssets").innerHTML = s.assets.length
    ? s.assets
        .map(
          (a) =>
            `<div class="asset"><strong>${a.name}</strong><span>${money(a.passive)} por fechamento</span></div>`,
        )
        .join("")
    : '<p class="empty">Nenhum investimento adquirido.</p>';
  const audit = auditCash(s);
  $("cashAudit").innerHTML =
    `<div class="event">${audit.legacy ? "Partida antiga: sem extrato retroativo" : audit.ok ? "Caixa reconciliado" : "Atenção: divergência no caixa"}</div>` +
    (s.ledger || [])
      .slice(-12)
      .reverse()
      .map(
        (x) =>
          `<div class="event"><span>${x.description.replace(/&/g, "&amp;").replace(/</g, "&lt;")}: ${money(x.amount)}</span></div>`,
      )
      .join("");
  const principal = Number($("creditAmount").value),
    term = Number($("creditTerm").value),
    quote = quoteCredit(s, principal, term);
  $("creditQuote").textContent = quote.eligible
    ? `Elegível · Parcela R$ ${quote.installment} · Comprometimento R$ ${quote.debtService}`
    : `Não elegível: ${quote.reason}`;
  $("contractCredit").disabled = !quote.eligible;
  const loans = [
    { id: "initial", balance: s.debt, installment: s.installment },
    ...(s.loans ?? []),
  ].filter((l) => l.balance > 0);
  $("loanList").innerHTML =
    loans
      .map(
        (l) =>
          `<div class="asset"><strong>${l.id === "initial" ? "Dívida inicial" : "Empréstimo " + l.id.slice(0, 8)}</strong><span>Saldo: ${money(l.balance)} · Parcela: ${money(l.installment)}</span><button class="outline" data-prepay="${l.id}">Amortizar</button></div>`,
      )
      .join("") || '<p class="empty">Sem dívidas ativas</p>';
  $("history").innerHTML = s.history
    .map(
      (h) =>
        `<div class="event ${h.type}"><span>${h.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></div>`,
    )
    .join("");
}
function act(fn) {
  try {
    put(fn(state));
  } catch (e) {
    alert(e.message);
  }
}
opts();
$("profession").addEventListener("change", professionPreview);
professionPreview();
$("start").addEventListener("click", () =>
  put(createGame($("profession").value, $("dream").value)),
);
$("roll").addEventListener("click", () =>
  act((s) => rollTurn({ ...s, officialPOEnabled: true }, Math.floor(Math.random() * 6) + 1)),
);
$("end").addEventListener("click", () => act(finishTurn));
$("verifiedOffers").addEventListener("click", (e) => {
  const b = e.target.closest("[data-buy]");
  if (b) act((s) => buyVerifiedAsset(s, b.dataset.buy));
});
$("reset").addEventListener("click", () => {
  if (confirm("Apagar a demonstração salva neste navegador e iniciar outra partida?")) {
    state = null;
    localStorage.removeItem(KEY);
    render();
  }
});
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (validateState(saved)) state = saved.pending ? saved : { ...saved, officialPOEnabled: true };
} catch {}
render();

$("creditAmount").addEventListener("input", render);
$("creditTerm").addEventListener("change", render);
$("contractCredit").addEventListener("click", () =>
  act((s) => contractCredit(s, Number($("creditAmount").value), Number($("creditTerm").value))),
);
$("loanList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-prepay]");
  if (!b) return;
  const amount = Number(prompt("Valor para amortizar (R$ inteiros):"));
  if (Number.isSafeInteger(amount) && amount > 0)
    act((s) => prepayLoan(s, b.dataset.prepay, amount));
});
$("exportCSV").addEventListener("click", () => {
  if (!state) return;
  const blob = new Blob([exportFinanceCSV(state)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "corrida-dos-ratos-extrato.csv";
  link.click();
  URL.revokeObjectURL(url);
});

function saveFile(contents, name, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("saveGame").addEventListener("click", () => {
  if (state)
    try {
      saveFile(serializeGame(state), "corrida-dos-ratos-partida.json", "application/json");
    } catch (e) {
      alert(e.message);
    }
});
$("loadGame").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2000000) throw Error("Arquivo muito grande.");
    const newState = deserializeGame(await file.text());
    if (confirm("Substituir a partida local atual pela partida importada?"))
      put(newState.pending ? newState : { ...newState, officialPOEnabled: true });
  } catch (err) {
    alert(err.message);
  } finally {
    e.target.value = "";
  }
});
