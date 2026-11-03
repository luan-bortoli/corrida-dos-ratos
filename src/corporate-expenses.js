// Despesas oficiais DI empresariais: sempre no caixa da empresa, nunca no do sócio.
// Uma ocorrência vincula-se a uma única empresa elegível para não multiplicar cobranças.
export const CORPORATE_DI = Object.freeze({
  "DI-022": 1500,
  "DI-025": 900,
  "DI-029": 1800,
  "DI-031": 1100,
  "DI-034": 1000,
});
const valid = (n) => Number.isSafeInteger(n) && n >= 0;
export function eligibleCorporateCompanies(room, playerId) {
  return (room.companies ?? [])
    .filter((c) => (c.shares?.[playerId] ?? 0) > 0)
    .map((c) => ({ id: c.id, name: c.name }));
}
export function applyCorporateExpense(room, playerId, cardId, occurrenceId, companyId = null) {
  const amount = CORPORATE_DI[cardId];
  if (amount === undefined) return null;
  if (typeof occurrenceId !== "string" || !/^[-\w]{3,90}$/.test(occurrenceId))
    throw Error("Ocorrência empresarial inválida");
  if (!room.players?.some((p) => p.id === playerId)) throw Error("Estudante inexistente");
  if (!valid(room.round) || room.round < 1) throw Error("Rodada inválida");
  const companies = room.companies ?? [];
  const previous = companies
    .flatMap((c) => c.operatingLedger ?? [])
    .find((e) => e.sourceId === `CARD:${occurrenceId}`);
  if (previous) throw Error("Ocorrência empresarial já registrada");
  const eligible = companies.filter((c) => (c.shares?.[playerId] ?? 0) > 0);
  if (
    companyId !== null &&
    (typeof companyId !== "string" || !eligible.some((c) => c.id === companyId))
  )
    throw Error("Empresa selecionada não pertence ao estudante");
  if (companyId === null && eligible.length > 1)
    throw Error("Selecione a empresa que receberá a despesa");
  const company = companyId === null ? eligible[0] : eligible.find((c) => c.id === companyId);
  if (!company) return { applicable: false, cardId, paid: 0, pending: 0, companyId: null };
  if (
    !valid(company.cash) ||
    !valid(company.pendingExpenses ?? 0) ||
    !Number.isSafeInteger(company.retainedProfit) ||
    !Array.isArray(company.operatingLedger)
  )
    throw Error("Contabilidade empresarial inconsistente");
  const paid = Math.min(amount, company.cash),
    pending = amount - paid;
  // Não se retira dinheiro de sócios; obrigações não pagas reduzem o resultado distribuível.
  company.cash -= paid;
  company.retainedProfit -= amount;
  company.pendingExpenses = (company.pendingExpenses ?? 0) + pending;
  company.operatingLedger.push({
    sourceId: `CARD:${occurrenceId}`,
    type: "expense",
    amount,
    paid,
    pending,
    round: room.round,
    cardId,
  });
  return { applicable: true, cardId, companyId: company.id, amount, paid, pending };
}
export function settleCorporateExpenses(company) {
  if (!valid(company.cash) || !valid(company.pendingExpenses ?? 0))
    throw Error("Saldo empresarial inválido");
  const paid = Math.min(company.cash, company.pendingExpenses ?? 0);
  company.cash -= paid;
  company.pendingExpenses = (company.pendingExpenses ?? 0) - paid;
  if (paid) {
    company.operatingLedger ??= [];
    company.operatingLedger.push({
      type: "settlement",
      amount: paid,
      paid,
      round: company._settlementRound ?? 0,
    });
  }
  return paid;
}
