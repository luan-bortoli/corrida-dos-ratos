import {
  ensureBudget,
  changeBudgetCategory,
  addTemporaryBudgetDiscount,
} from "./personal-budget.js";
import { cashBalanceCents, debitCashCents, creditCashCents } from "./money-balance.js";
// Official effect subset: DI-001..DI-020 only. Percentages transcribed from Cartas.md.
const DI_PERCENT = [10, 10, 5, 10, 20, 5, 10, 5, 5, 10, 20, 10, 5, 5, 20, 10, 5, 20, 30, 20];
export function expenseQuote(cardId, salaryReference) {
  const m = /^DI-(\d{3})$/.exec(cardId ?? "");
  if (!m) return null;
  const index = Number(m[1]) - 1;
  if (index < 0 || index >= DI_PERCENT.length) return null;
  if (!Number.isSafeInteger(salaryReference) || salaryReference < 0)
    throw Error("Salário de referência inválido");
  return {
    percent: DI_PERCENT[index],
    amount: Math.round((salaryReference * DI_PERCENT[index]) / 100),
  };
}
export function executeOfficialExpense(state, cardId, salaryReference) {
  const quote = expenseQuote(cardId, salaryReference);
  if (!quote) return null;
  const paidCents = Math.min(cashBalanceCents(state), quote.amount * 100);
  if (paidCents > 0) debitCashCents(state, paidCents);
  const paid = paidCents / 100;
  const unpaidCents = quote.amount * 100 - paidCents;
  state.arrearsLivingCents =
    (state.arrearsLivingCents ?? (state.arrearsLiving ?? 0) * 100) + unpaidCents;
  state.arrearsLiving = Math.ceil(state.arrearsLivingCents / 100);
  return { ...quote, paid, unpaid: unpaidCents / 100, paidCents, unpaidCents };
}

// Alta Velocidade: only unconditional personal expenses proportional to the
// original professional salary. Asset-conditional and company expenses remain
// unimplemented until eligible asset/accounting pathways are available.
const OUTER_PERSONAL_DI = Object.freeze({
  "DI-023": 10,
  "DI-026": 20,
  "DI-028": 10,
  "DI-030": 30,
  "DI-032": 5,
  "DI-033": 10,
  "DI-035": 20,
});
export function expenseQuoteOuter(cardId, salaryReference) {
  const percent = OUTER_PERSONAL_DI[cardId];
  if (percent === undefined) return null;
  if (!Number.isSafeInteger(salaryReference) || salaryReference < 0)
    throw Error("Salário de referência inválido");
  return { percent, amount: Math.round((salaryReference * percent) / 100) };
}
export function executeOuterPersonalExpense(state, cardId, salaryReference) {
  const quote = expenseQuoteOuter(cardId, salaryReference);
  if (!quote) return null;
  const paidCents = Math.min(cashBalanceCents(state), quote.amount * 100);
  if (paidCents > 0) debitCashCents(state, paidCents);
  const paid = paidCents / 100;
  const unpaidCents = quote.amount * 100 - paidCents;
  state.arrearsLivingCents =
    (state.arrearsLivingCents ?? (state.arrearsLiving ?? 0) * 100) + unpaidCents;
  state.arrearsLiving = Math.ceil(state.arrearsLivingCents / 100);
  return { ...quote, paid, unpaid: unpaidCents / 100, paidCents, unpaidCents };
}
// Only three automatic EV events with fully specified, direct bookkeeping.
// Other EV cards require choices, time limits, or granular expense categories.
export function executeAutomaticLifeEvent(state, cardId, salaryReference) {
  if (!Number.isSafeInteger(salaryReference) || salaryReference < 0)
    throw Error("Salário de referência inválido");
  if (cardId === "EV-008") {
    ensureBudget(state);
    const v = Math.round(state.expenseCategories.food * 0.05);
    changeBudgetCategory(state, "food", v);
    return { kind: "food_inflation", amount: v };
  }
  if (cardId === "EV-009") {
    ensureBudget(state);
    addTemporaryBudgetDiscount(state, "education", 50, 3);
    return { kind: "education_scholarship", amount: 0 };
  }
  if (cardId === "EV-018") {
    ensureBudget(state);
    state.budgetModifiers ??= [];
    state.budgetModifiers.push({ category: "food", percent: -100, remaining: 3, fixedDelta: 500 });
    return { kind: "family_support", amount: 0 };
  }
  if (cardId === "EV-024") {
    ensureBudget(state);
    state.budgetModifiers ??= [];
    state.budgetModifiers.push({ category: "food", percent: -100, remaining: 4, fixedDelta: 250 });
    return { kind: "family_commitment", amount: 0 };
  }
  if (cardId === "EV-001") {
    state.salaryMultiplierBasisPoints =
      ((state.salaryMultiplierBasisPoints ?? 10000) * 10800) / 10000;
    state.salaryMultiplierBasisPoints = Math.round(state.salaryMultiplierBasisPoints);
    return { kind: "promotion", amount: 0 };
  }
  if (cardId === "EV-005") {
    const amount = Math.round(salaryReference * 0.05);
    ensureBudget(state);
    changeBudgetCategory(state, "food", amount);
    return { kind: "recurring_family_expense", amount };
  }
  if (cardId === "EV-013") {
    const amount = Math.round(salaryReference * 0.2);
    creditCashCents(state, amount * 100);
    return { kind: "one_time_bonus", amount };
  }
  return null;
}
// Benefícios automáticos de recebimento único com fórmula integralmente definida.
// Benefícios de redução temporária de categorias de despesa permanecem pendentes.
const CASH_BENEFITS = Object.freeze({
  "BE-001": 15,
  "BE-002": 10,
  "BE-004": null,
  "BE-006": 20,
  "BE-008": 5,
  "BE-010": 10,
});
export function executeOfficialCashBenefit(state, id, salaryReference) {
  if (id === "BE-003" || id === "BE-009") {
    ensureBudget(state);
    const category = id === "BE-003" ? "food" : "housing";
    addTemporaryBudgetDiscount(state, category, 10, 2);
    return { amount: 0, kind: "temporary_saving" };
  }
  if (id === "BE-005") {
    ensureBudget(state);
    const n = state.expenseCategories.transport;
    changeBudgetCategory(state, "transport", Math.max(50, Math.round(n * 0.9)) - n);
    return { amount: 0, kind: "permanent_saving" };
  }
  if (id === "BE-007") {
    state.financialConsultationAvailable = true;
    return { amount: 0, kind: "financial_diagnosis" };
  }
  if (!Object.hasOwn(CASH_BENEFITS, id)) return null;
  if (!Number.isSafeInteger(salaryReference) || salaryReference < 0)
    throw Error("Salário de referência inválido");
  const amount = id === "BE-004" ? 400 : Math.round((salaryReference * CASH_BENEFITS[id]) / 100);
  if (!Number.isSafeInteger(amount) || amount < 0) throw Error("Valor do benefício inválido");
  if (amount > 0) creditCashCents(state, amount * 100);
  return { amount };
}

// DI-021, DI-024, DI-027: despesas condicionadas à posse de ativos.
// Se não houver ativo compatível, registrar ocorrência não aplicável sem ressorteio.
export const CONDITIONAL_ASSET_EXPENSES = Object.freeze({
  "DI-021": Object.freeze({ amountCents: 120000, kind: "real_estate" }),
  "DI-024": Object.freeze({ amountCents: 65000, kind: "rental" }),
  "DI-027": Object.freeze({ amountCents: 200000, kind: "real_estate" }),
});
function assetEligibleForExpense(asset, kind) {
  if (!asset || typeof asset !== "object") return false;
  if (kind === "real_estate")
    return asset.source === "official_real_estate" || /^GO-00[1-8]$/.test(asset.id ?? "");
  if (kind === "rental")
    return asset.kind === "rental" && /^PO-0(18|19|20|21)$/.test(asset.id ?? "");
  return false;
}
export function executeConditionalAssetExpense(state, cardId) {
  const rule = CONDITIONAL_ASSET_EXPENSES[cardId];
  if (!rule) return null;
  const eligible = (state.assets ?? []).filter((a) => assetEligibleForExpense(a, rule.kind));
  if (!eligible.length)
    return {
      applicable: false,
      amountCents: 0,
      paidCents: 0,
      unpaidCents: 0,
      eligibleAssetCount: 0,
    };
  // A cobrança é única por ocorrência, mesmo se houver vários bens elegíveis.
  const paidCents = Math.min(cashBalanceCents(state), rule.amountCents);
  if (paidCents) debitCashCents(state, paidCents);
  const unpaidCents = rule.amountCents - paidCents;
  state.arrearsLivingCents =
    (state.arrearsLivingCents ?? (state.arrearsLiving ?? 0) * 100) + unpaidCents;
  state.arrearsLiving = Math.ceil(state.arrearsLivingCents / 100);
  return {
    applicable: true,
    amountCents: rule.amountCents,
    paidCents,
    unpaidCents,
    eligibleAssetCount: eligible.length,
  };
}
