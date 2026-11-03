// Valores e indicadores das cinco cartas FI aprovadas. Impacto é estimado,
// nunca equivale a beneficiários reais ou a rendimento de investimento.
export const PHILANTHROPY = Object.freeze({
  "FI-001": {
    project: "Educação para Todos",
    unit: "estudantes apoiados",
    options: [
      [500, 5],
      [1000, 10],
      [2000, 20],
    ],
  },
  "FI-002": {
    project: "Saúde na Comunidade",
    unit: "atendimentos/participações apoiados",
    options: [
      [750, 5],
      [1500, 10],
      [3000, 20],
    ],
  },
  "FI-003": {
    project: "Preservação Ambiental",
    unit: "mudas apoiadas (não necessariamente plantadas)",
    options: [
      [400, 10],
      [800, 20],
      [1600, 40],
    ],
  },
  "FI-004": {
    project: "Empreendedorismo Social",
    unit: "participantes apoiados",
    options: [
      [1000, 4],
      [2000, 8],
      [4000, 16],
    ],
  },
  "FI-005": {
    project: "Combate à Fome",
    unit: "refeições apoiadas",
    options: [
      [500, 25],
      [1000, 50],
      [2000, 100],
    ],
  },
});
export function philanthropyOffer(card, circuit) {
  return circuit === "outer" && card?.category === "FI" ? (PHILANTHROPY[card.id] ?? null) : null;
}
export function validateSocialImpact(records) {
  return (
    records === undefined ||
    (Array.isArray(records) &&
      records.length <= 1000 &&
      records.every(
        (r) =>
          r &&
          Object.hasOwn(PHILANTHROPY, r.cardId) &&
          typeof r.id === "string" &&
          Number.isSafeInteger(r.turn) &&
          r.turn >= 0 &&
          Number.isSafeInteger(r.amount) &&
          Number.isSafeInteger(r.impact) &&
          PHILANTHROPY[r.cardId].options.some(
            ([amount, impact]) => amount === r.amount && impact === r.impact,
          ) &&
          r.unit === PHILANTHROPY[r.cardId].unit,
      ))
  );
}
