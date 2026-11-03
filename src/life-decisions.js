import { cashBalanceCents, debitCashCents, creditCashCents } from "./money-balance.js";
// Decisões explícitas de Eventos da Vida, derivadas de catalogo/Cartas.md.
// Nenhuma despesa é criada antes da escolha do estudante.
import {
  ensureBudget,
  changeBudgetCategory,
  addTemporaryBudgetDiscount,
} from "./personal-budget.js";
const DECISIONS = Object.freeze({
  "EV-002": {
    circuit: "inner",
    accept: "Participar do curso",
    reject: "Recusar",
    kind: "training",
    value: 600,
  },
  "EV-003": {
    circuit: "inner",
    accept: "Reduzir gastos de lazer",
    reject: "Manter",
    kind: "category_pct",
    category: "leisure",
    value: -10,
    min: 50,
  },
  "EV-004": {
    circuit: "inner",
    accept: "Mudar de residência",
    reject: "Permanecer",
    kind: "housing_move_pct",
    value: -15,
  },
  "EV-007": {
    circuit: "inner",
    accept: "Adotar transporte compartilhado",
    reject: "Manter",
    kind: "category_pct",
    category: "transport",
    value: -15,
  },
  "EV-010": {
    circuit: "inner",
    accept: "Aceitar nova jornada",
    reject: "Recusar",
    kind: "work_shift",
  },
  "EV-012": {
    circuit: "inner",
    accept: "Cancelar assinaturas",
    reject: "Manter assinaturas",
    kind: "category_pct",
    category: "leisure",
    value: -10,
    min: 50,
  },
  "EV-014": {
    circuit: "inner",
    accept: "Matricular-se",
    reject: "Recusar",
    kind: "extra_study",
    value: 400,
  },
  "EV-015": {
    circuit: "inner",
    accept: "Adotar eficiência residencial",
    reject: "Manter",
    kind: "housing_efficiency",
    value: 200,
  },
  "EV-016": {
    circuit: "outer",
    accept: "Aumentar lazer",
    reject: "Manter",
    kind: "category_pct",
    category: "leisure",
    value: 15,
  },
  "EV-017": {
    circuit: "outer",
    accept: "Mudar de residência",
    reject: "Permanecer",
    kind: "housing_move_fixed",
    value: 3000,
  },
  "EV-020": {
    circuit: "outer",
    accept: "Consultar opções de venda",
    reject: "Manter",
    kind: "liquidity_review",
  },
  "EV-023": {
    circuit: "outer",
    accept: "Investir na residência",
    reject: "Recusar",
    kind: "housing_saving",
    value: 2000,
  },
  "EV-025": {
    circuit: "outer",
    accept: "Consultar opções de venda",
    reject: "Manter",
    kind: "liquidity_review",
  },
  "EV-028": {
    circuit: "outer",
    accept: "Renegociar contratos",
    reject: "Manter",
    kind: "leisure_saving",
    value: 500,
  },

  "EV-006": {
    circuit: "inner",
    accept: "Aceitar trabalho temporário",
    reject: "Recusar",
    kind: "income_pct",
    value: 15,
  },
  "EV-011": {
    circuit: "inner",
    accept: "Comprar bem pessoal",
    reject: "Adiar",
    kind: "cost_pct",
    value: 20,
  },
  "EV-019": {
    circuit: "outer",
    accept: "Realizar projeto pessoal",
    reject: "Adiar",
    kind: "cost",
    value: 5000,
  },
  "EV-021": {
    circuit: "outer",
    accept: "Contribuir para formação",
    reject: "Não contribuir",
    kind: "cost",
    value: 4000,
  },
  "EV-022": {
    circuit: "outer",
    accept: "Aumentar orçamento de lazer e viagens",
    reject: "Manter orçamento",
    kind: "recurring",
    value: 300,
  },
  "EV-026": {
    circuit: "outer",
    accept: "Participar da mentoria",
    reject: "Recusar",
    kind: "social",
    value: 0,
  },
  "EV-027": {
    circuit: "outer",
    accept: "Reformar residência pessoal",
    reject: "Adiar",
    kind: "cost",
    value: 8000,
  },
  "EV-029": {
    circuit: "outer",
    accept: "Participar da ação comunitária",
    reject: "Não participar",
    kind: "social",
    value: 0,
  },
  "EV-030": {
    circuit: "outer",
    accept: "Contratar diagnóstico patrimonial",
    reject: "Recusar",
    kind: "cost",
    value: 2500,
  },
});
export function lifeDecision(id, circuit) {
  const d = DECISIONS[id];
  return d && d.circuit === circuit ? { accept: d.accept, reject: d.reject } : null;
}
export function resolveLifeDecision(state, choice, salaryReference) {
  const card = state.currentCard;
  const d = DECISIONS[card?.id];
  if (
    !d ||
    d.circuit !== state.circuit ||
    state.lastTile !== "EV" ||
    !state.pending ||
    state.cardEvents?.at(-1)?.resolution !== "pending"
  )
    throw Error("Evento sem decisão pendente.");
  if (choice !== "accept" && choice !== "reject") throw Error("Alternativa inválida.");
  if (!Number.isSafeInteger(salaryReference) || salaryReference < 0)
    throw Error("Salário de referência inválido.");
  const s = structuredClone(state);
  const ev = s.cardEvents.at(-1);
  let amount = 0;
  let kind = "no_change";
  if (choice === "accept") {
    amount =
      d.kind === "cost_pct"
        ? -Math.round((salaryReference * d.value) / 100)
        : d.kind === "income_pct"
          ? Math.round((salaryReference * d.value) / 100)
          : d.kind === "cost"
            ? -d.value
            : 0;
    if (amount < 0 && cashBalanceCents(s) < -amount * 100)
      throw Error("Caixa insuficiente para escolher esta alternativa.");
    if (amount < 0) debitCashCents(s, -amount * 100);
    if (amount > 0) creditCashCents(s, amount * 100);
    if (d.kind === "recurring") {
      ensureBudget(s);
      changeBudgetCategory(s, "leisure", d.value);
      kind = "recurring_expense";
    } else if (d.kind === "category_pct") {
      ensureBudget(s);
      const current = s.expenseCategories[d.category];
      const newAmount = Math.max(d.min ?? 0, Math.round((current * (100 + d.value)) / 100));
      changeBudgetCategory(s, d.category, newAmount - current);
      kind = "category_adjustment";
    } else if (d.kind === "training") {
      amount = -600;
      if (cashBalanceCents(s) < 60000) throw Error("Caixa insuficiente");
      debitCashCents(s, 60000);
      s.delayedSalaryBoosts ??= [];
      s.delayedSalaryBoosts.push({ activateAtClosure: s.closures + 2, basisPoints: 500 });
      kind = "training";
    } else if (d.kind === "housing_move_pct") {
      amount = -Math.round(salaryReference * 0.1);
      if (cashBalanceCents(s) < amount * -100) throw Error("Caixa insuficiente");
      debitCashCents(s, -amount * 100);
      ensureBudget(s);
      const c = s.expenseCategories.housing;
      changeBudgetCategory(s, "housing", Math.round(c * 0.85) - c);
      kind = "housing_move";
    } else if (d.kind === "work_shift") {
      s.salaryMultiplierBasisPoints = Math.round((s.salaryMultiplierBasisPoints ?? 10000) * 1.1);
      ensureBudget(s);
      const c = s.expenseCategories.transport;
      changeBudgetCategory(s, "transport", Math.round(c * 0.1));
      kind = "work_shift";
    } else if (d.kind === "extra_study") {
      amount = -400;
      if (cashBalanceCents(s) < 40000) throw Error("Caixa insuficiente");
      debitCashCents(s, 40000);
      ensureBudget(s);
      addTemporaryBudgetDiscount(s, "leisure", 10, 2);
      kind = "extra_study";
    } else if (d.kind === "housing_efficiency") {
      amount = -200;
      if (cashBalanceCents(s) < 20000) throw Error("Caixa insuficiente");
      debitCashCents(s, 20000);
      ensureBudget(s);
      const c = s.expenseCategories.housing;
      changeBudgetCategory(s, "housing", Math.round(c * 0.95) - c);
      kind = "housing_efficiency";
    } else if (d.kind === "housing_move_fixed") {
      amount = -3000;
      if (cashBalanceCents(s) < 300000) throw Error("Caixa insuficiente");
      debitCashCents(s, 300000);
      ensureBudget(s);
      const c = s.expenseCategories.housing;
      changeBudgetCategory(s, "housing", Math.round(c * 0.85) - c);
      kind = "housing_move";
    } else if (d.kind === "housing_saving") {
      amount = -2000;
      if (cashBalanceCents(s) < 200000) throw Error("Caixa insuficiente");
      debitCashCents(s, 200000);
      ensureBudget(s);
      changeBudgetCategory(s, "housing", -Math.min(100, s.expenseCategories.housing));
      kind = "housing_saving";
    } else if (d.kind === "leisure_saving") {
      amount = -500;
      if (cashBalanceCents(s) < 50000) throw Error("Caixa insuficiente");
      debitCashCents(s, 50000);
      ensureBudget(s);
      changeBudgetCategory(s, "leisure", -Math.min(150, s.expenseCategories.leisure));
      kind = "leisure_saving";
    } else if (d.kind === "liquidity_review") {
      s.liquidityReviewAvailable = true;
      kind = "liquidity_review";
    } else kind = d.kind;
    if (amount) {
      s.ledger ??= [];
      s.ledger.push({
        id: crypto.randomUUID(),
        turn: s.turn,
        closure: s.closures,
        kind: "life_decision",
        amount,
        description: `Decisão ${card.id}: ${d.accept}`,
        cardId: card.id,
      });
    }
  }
  ev.resolution = "decision";
  ev.choice = choice;
  ev.financialEffect = amount !== 0 || (choice === "accept" && d.kind === "recurring");
  s.currentCard.effectExecuted = true;
  s.currentCard.lifeDecision = { choice, amount, kind };
  s.history = [
    {
      id: crypto.randomUUID(),
      text: `${card.id}: ${choice === "accept" ? d.accept : d.reject}${amount ? " (R$ " + amount + ")" : ""}.`,
      type: "info",
    },
    ...s.history,
  ].slice(0, 100);
  return s;
}
