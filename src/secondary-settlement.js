// Prévia monetária em centavos: cálculo exato, sem modificar carteiras ou realizar liquidação.
export function quoteSettlement(priceCents, units, buyerCashReais) {
  if (
    !Number.isSafeInteger(priceCents) ||
    priceCents <= 0 ||
    !Number.isSafeInteger(units) ||
    units <= 0
  )
    throw Error("Cotação ou quantidade inválida");
  const totalCents = priceCents * units;
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0)
    throw Error("Valor monetário excede limite seguro");
  if (!Number.isSafeInteger(buyerCashReais) || buyerCashReais < 0) throw Error("Saldo inválido");
  const availableCents = buyerCashReais * 100;
  if (!Number.isSafeInteger(availableCents)) throw Error("Saldo excede limite seguro");
  return {
    priceCents,
    units,
    totalCents,
    wholeReais: Math.floor(totalCents / 100),
    remainderCents: totalCents % 100,
    affordable: totalCents <= availableCents,
    legacyCompatible: totalCents % 100 === 0,
  };
}
export function auditSecondarySettlement(room) {
  const findings = [],
    trades = room.secondaryTrades ?? [],
    offers = room.secondaryOffers ?? [];
  const securities = new Set(["PO-013", "PO-014", "PO-015", "PO-016", "PO-017"]);
  for (const t of trades) {
    if (
      !securities.has(t.securityId) ||
      !Number.isSafeInteger(t.units) ||
      t.units <= 0 ||
      !Number.isSafeInteger(t.priceCents) ||
      t.priceCents <= 0 ||
      !Number.isSafeInteger(t.amountCents ?? t.amount * 100) ||
      (t.amountCents ?? t.amount * 100) <= 0 ||
      t.priceCents * t.units !== (t.amountCents ?? t.amount * 100) ||
      t.buyerId === t.sellerId
    )
      findings.push({ tradeId: t.id ?? null, reason: "Liquidação divergente" });
  }
  for (const o of offers) {
    if (
      !securities.has(o.securityId) ||
      !Number.isSafeInteger(o.units) ||
      o.units < 0 ||
      !["open", "cancelled", "filled"].includes(o.status)
    )
      findings.push({ offerId: o.id ?? null, reason: "Oferta inválida" });
  }
  return { ok: findings.length === 0, trades: trades.length, offers: offers.length, findings };
}
