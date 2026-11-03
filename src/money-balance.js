// Compatible read-only view of the split legacy cash and secondary-market cents.
// All values in this module are integer centavos, without floating arithmetic.
export function cashBalanceCents(game) {
  const reais = game.cash,
    cents = game.secondaryCashCents ?? 0;
  if (
    !Number.isSafeInteger(reais) ||
    reais < 0 ||
    !Number.isSafeInteger(cents) ||
    cents < 0 ||
    cents > 99
  )
    throw Error("Saldo financeiro inválido");
  const total = reais * 100 + cents;
  if (!Number.isSafeInteger(total)) throw Error("Saldo financeiro acima do limite seguro");
  return total;
}
export function formatCentsBRL(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw Error("Valor monetário inválido");
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
export function formatCashBRL(game) {
  return formatCentsBRL(cashBalanceCents(game));
}

// Fonte única de escrita para operações monetárias migradas. Mantém a
// representação legada (reais inteiros + complemento) sem perda de centavos.
export function setCashBalanceCents(game, cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw Error("Saldo financeiro inválido");
  const reais = Math.floor(cents / 100),
    remainder = cents % 100;
  if (!Number.isSafeInteger(reais) || !Number.isSafeInteger(reais * 100 + remainder))
    throw Error("Saldo financeiro acima do limite seguro");
  cashBalanceCents(game);
  game.cash = reais;
  game.secondaryCashCents = remainder;
  return cents;
}
export function debitCashCents(game, amountCents) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw Error("Débito inválido");
  const before = cashBalanceCents(game);
  if (before < amountCents) throw Error("Caixa insuficiente");
  return setCashBalanceCents(game, before - amountCents);
}
export function creditCashCents(game, amountCents) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw Error("Crédito inválido");
  const before = cashBalanceCents(game),
    after = before + amountCents;
  if (!Number.isSafeInteger(after)) throw Error("Crédito acima do limite seguro");
  return setCashBalanceCents(game, after);
}
export function transferCashCents(from, to, amountCents) {
  if (from === to) throw Error("Contrapartes devem ser diferentes");
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw Error("Transferência inválida");
  const fromBefore = cashBalanceCents(from),
    toBefore = cashBalanceCents(to);
  if (fromBefore < amountCents || !Number.isSafeInteger(toBefore + amountCents))
    throw Error("Transferência sem saldo ou acima do limite seguro");
  setCashBalanceCents(from, fromBefore - amountCents);
  setCashBalanceCents(to, toBefore + amountCents);
  return { debitCents: -amountCents, creditCents: amountCents };
}
