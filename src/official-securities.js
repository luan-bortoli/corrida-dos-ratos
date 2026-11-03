// PO-013–PO-017: catálogo aprovado. Mercado primário limitado (10.000 unidades por ativo).
// Dividendos condicionais: os valores iniciais são pagos enquanto não houver evento que os altere.
export const OFFICIAL_SECURITIES = Object.freeze([
  {
    id: "PO-013",
    name: "Ações de Empresa de Energia",
    kind: "stock",
    price: 50,
    min: 1,
    max: 50,
    dividendCents: 20,
  },
  {
    id: "PO-014",
    name: "Fundo de Investimento Imobiliário",
    kind: "fund",
    price: 100,
    min: 1,
    max: 30,
    dividendCents: 60,
  },
  {
    id: "PO-015",
    name: "Ações de Empresa de Tecnologia",
    kind: "stock",
    price: 40,
    min: 1,
    max: 60,
    dividendCents: 0,
  },
  {
    id: "PO-016",
    name: "Fundo de Empresas Diversificadas",
    kind: "fund",
    price: 80,
    min: 1,
    max: 40,
    dividendCents: 24,
  },
  {
    id: "PO-017",
    name: "Ações de Empresa de Comércio",
    kind: "stock",
    price: 30,
    min: 1,
    max: 80,
    dividendCents: 10,
  },
]);
export const ISSUE_UNITS = 10000;
export function officialSecurityOffer(card, circuit) {
  return circuit === "inner" && card?.category === "PO"
    ? (OFFICIAL_SECURITIES.find((x) => x.id === card.id) ?? null)
    : null;
}
export function checkOfficialPortfolio(state) {
  const p = state.officialSecurities ?? {};
  return (
    typeof p === "object" &&
    !Array.isArray(p) &&
    Object.entries(p).every(
      ([id, n]) =>
        OFFICIAL_SECURITIES.some((x) => x.id === id) &&
        Number.isSafeInteger(n) &&
        n >= 0 &&
        n <= ISSUE_UNITS,
    )
  );
}
