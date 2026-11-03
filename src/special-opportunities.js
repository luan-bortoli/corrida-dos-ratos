// Somente ofertas sem prazo de preferência/votação pendente, compra integral à vista.
// Referências patrimoniais não são lucros realizados.
const rows = [
  ["OE-007", "Sociedade em Projeto Imobiliário", 120000, 120000, 900, "joint_real_estate"],
  ["OE-009", "Parceria em Energia Renovável", 180000, 180000, 1500, "joint_energy"],
  ["OE-010", "Imóvel Comercial com Desconto", 85000, 100000, 650, "real_estate"],
  ["OE-011", "Equipamentos Empresariais Usados", 32000, 40000, 300, "equipment"],
  ["OE-013", "Pequena Empresa em Recuperação", 63000, 90000, 0, "company"],
  ["OE-017", "Consórcio de Investimento Imobiliário — 20%", 100000, 100000, 0, "participation"],
  ["OE-018", "Aquisição de Empresa Inovadora", 140000, 140000, 0, "company"],
  ["OE-020", "Participação em Infraestrutura — 15%", 150000, 150000, 0, "participation"],
];
export const SPECIAL_ACQUISITIONS = Object.freeze(
  rows.map(([id, name, cost, referenceValue, passive, kind]) =>
    Object.freeze({
      id,
      name,
      cost,
      referenceValue,
      referencePassive: passive,
      passive,
      kind,
      minDown: id === "OE-010" ? 40 : undefined,
      percent: ["OE-007", "OE-009"].includes(id)
        ? 100
        : id === "OE-017"
          ? 20
          : id === "OE-020"
            ? 15
            : undefined,
      incomeStatus:
        kind === "company" || kind === "participation"
          ? "requires_verified_operating_profit"
          : "reference_rental_income",
    }),
  ),
);
export function specialAcquisitionOffer(card, circuit) {
  return circuit === "outer" && card?.category === "OE"
    ? (SPECIAL_ACQUISITIONS.find((x) => x.id === card.id) ?? null)
    : null;
}
