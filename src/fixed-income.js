// PO-008 a PO-012 — condições contratuais do catálogo aprovado.
// Valores da economia pessoal são em reais inteiros; juros inferiores a R$ 1 são arredondados por fechamento.
export const FIXED_INCOME = Object.freeze([
  {
    id: "PO-008",
    name: "Aplicação de Liquidez Diária",
    min: 300,
    max: 3000,
    step: 100,
    rate: 0.005,
    term: null,
    distribution: "accumulate",
    early: "full",
  },
  {
    id: "PO-009",
    name: "Título de Renda Fixa de Prazo Curto",
    min: 500,
    max: 4000,
    step: 100,
    rate: 0.007,
    term: 6,
    distribution: "accumulate",
    early: "discount2",
  },
  {
    id: "PO-010",
    name: "Título com Pagamento de Juros",
    min: 1000,
    max: 5000,
    step: 500,
    rate: 0.0055,
    term: 12,
    distribution: "coupon",
    early: "buyer_required",
  },
  {
    id: "PO-011",
    name: "Aplicação com Prazo de 12 Meses",
    min: 800,
    max: 4800,
    step: 400,
    rate: 0.008,
    term: 12,
    distribution: "accumulate",
    early: "blocked",
  },
  {
    id: "PO-012",
    name: "Título de Renda Fixa Negociável",
    min: 2000,
    max: 2000,
    step: 2000,
    coupon: 12,
    term: 12,
    distribution: "coupon",
    early: "buyer_required",
  },
]);
export function fixedIncomeOffer(card, circuit) {
  return circuit === "inner" && card?.category === "PO"
    ? (FIXED_INCOME.find((x) => x.id === card.id) ?? null)
    : null;
}
export function validateFixedAmount(offer, amount) {
  return (
    Number.isSafeInteger(amount) &&
    amount >= offer.min &&
    amount <= offer.max &&
    (amount - offer.min) % offer.step === 0
  );
}
