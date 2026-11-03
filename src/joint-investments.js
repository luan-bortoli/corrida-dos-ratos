import { randomUUID } from "node:crypto";
import { GRAND_PARTICIPATIONS } from "./grand-investments.js";
import { SPECIAL_ACQUISITIONS } from "./special-opportunities.js";
import { COMPANY_TEMPLATES } from "./companies.js";
import { cashBalanceCents, debitCashCents } from "./money-balance.js";

// Proposta coletiva de participação societária: sem financiamento e sem débito antecipado.
const safe = (v) => Number.isSafeInteger(v) && v > 0;
export function ensureJointInvestments(room) {
  room.jointInvestments ??= [];
  return room.jointInvestments;
}
function participant(room, id) {
  return room.players?.find((p) => p.id === id && !p.game.won);
}
export function openJointInvestment(room, authorId, amount, invitees) {
  const owner = participant(room, authorId),
    game = owner?.game;
  const category = game?.currentCard?.category;
  const isGO = category === "GO";
  const candidates =
    category === "GI"
      ? GRAND_PARTICIPATIONS
      : category === "OE"
        ? SPECIAL_ACQUISITIONS.filter((o) =>
            ["OE-007", "OE-009", "OE-017", "OE-020"].includes(o.id),
          )
        : isGO
          ? COMPANY_TEMPLATES.map((t) => ({
              id: t.id,
              name: t.name,
              cost: t.price,
              percent: t.stake,
            }))
          : [];
  const offer = candidates.find((o) => o.id === game?.currentCard?.id);
  if (
    !offer ||
    !game.pending ||
    (isGO ? game.circuit !== "inner" : game.circuit !== "outer") ||
    game.lastTile !== category ||
    game.cardEvents?.at(-1)?.resolution !== "pending"
  )
    throw Error("Não há participação societária pendente para proposta conjunta");
  if (isGO) {
    const company = room.companies?.find((c) => c.id === offer.id);
    if (
      !company ||
      company.shares.origin < company.offer.percent ||
      room.jointInvestments?.some((x) => x.cardId === offer.id && x.status === "open")
    )
      throw Error("Participação societária indisponível");
  }
  if (
    !safe(amount) ||
    amount >= offer.cost ||
    !Array.isArray(invitees) ||
    invitees.length < 1 ||
    invitees.length > 5 ||
    new Set(invitees).size !== invitees.length ||
    invitees.includes(authorId) ||
    invitees.some((id) => !participant(room, id))
  )
    throw Error("Convites ou aporte inicial inválidos");
  if (cashBalanceCents(game) < amount * 100) throw Error("Caixa do proponente insuficiente");
  if (ensureJointInvestments(room).some((p) => p.authorId === authorId && p.status === "open"))
    throw Error("Já existe proposta conjunta pendente");
  const proposal = {
    id: randomUUID(),
    cardId: offer.id,
    authorId,
    offerCost: offer.cost,
    percent: offer.percent,
    companyName: offer.name,
    invitedIds: [...invitees],
    commitments: { [authorId]: amount },
    declinedIds: [],
    createdRound: room.round,
    expiresRound: room.round + 2,
    status: "open",
    settledRound: null,
  };
  room.jointInvestments.push(proposal);
  const event = game.cardEvents.at(-1);
  event.resolution = "joint_proposal";
  event.financialEffect = false;
  game.currentCard.effectExecuted = true;
  game.currentCard.jointProposalId = proposal.id;
  return proposal;
}
export function acceptJointInvestment(room, playerId, proposalId, amount) {
  const p = ensureJointInvestments(room).find((p) => p.id === proposalId);
  if (!p || p.status !== "open" || room.round > p.expiresRound)
    throw Error("Proposta conjunta indisponível ou expirada");
  if (
    !p.invitedIds.includes(playerId) ||
    !participant(room, playerId) ||
    Object.hasOwn(p.commitments, playerId) ||
    p.declinedIds.includes(playerId)
  )
    throw Error("Participante sem convite válido");
  if (!safe(amount)) throw Error("Aporte inválido");
  const total = Object.values(p.commitments).reduce((a, b) => a + b, 0);
  if (total + amount > p.offerCost) throw Error("Aportes excedem o preço da participação");
  if (cashBalanceCents(participant(room, playerId).game) < amount * 100)
    throw Error("Caixa insuficiente para o aporte");
  p.commitments[playerId] = amount;
  if (total + amount === p.offerCost) return settleJointInvestment(room, p.id);
  return p;
}
export function declineJointInvestment(room, playerId, proposalId) {
  const p = ensureJointInvestments(room).find((p) => p.id === proposalId);
  if (
    !p ||
    p.status !== "open" ||
    room.round > p.expiresRound ||
    !p.invitedIds.includes(playerId) ||
    Object.hasOwn(p.commitments, playerId)
  )
    throw Error("Convite indisponível");
  if (!p.declinedIds.includes(playerId)) p.declinedIds.push(playerId);
  return p;
}
export function settleJointInvestment(room, proposalId) {
  const p = ensureJointInvestments(room).find((p) => p.id === proposalId);
  if (!p || p.status !== "open" || room.round > p.expiresRound)
    throw Error("Proposta indisponível");
  const entries = Object.entries(p.commitments),
    total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total !== p.offerCost || entries.length < 2)
    throw Error("Preço não integralmente coberto por dois participantes");
  // Pré-validação atômica: nenhum participante é debitado se qualquer aporte falhar.
  for (const [id, amount] of entries) {
    const player = participant(room, id);
    if (!player || cashBalanceCents(player.game) < amount * 100)
      throw Error("Saldo insuficiente na liquidação coletiva");
  }
  const isGO = p.cardId.startsWith("GO-");
  const offer = isGO
    ? COMPANY_TEMPLATES.find((t) => t.id === p.cardId)
    : [
        ...GRAND_PARTICIPATIONS,
        ...SPECIAL_ACQUISITIONS.filter((o) =>
          ["OE-007", "OE-009", "OE-017", "OE-020"].includes(o.id),
        ),
      ].find((o) => o.id === p.cardId);
  if (!offer) throw Error("Participação desconhecida");
  const company = isGO ? room.companies?.find((c) => c.id === p.cardId) : null;
  if (isGO && (!company || company.shares.origin < company.offer.percent))
    throw Error("Participação societária indisponível para liquidação");
  const ownershipId = randomUUID();
  // Para ações societárias GO, alocar quotas inteiras por maiores restos, sem criar ou perder capital.
  const quotas = isGO
    ? entries.map(([id, amount], index) => ({
        id,
        index,
        exact: (company.offer.percent * amount) / p.offerCost,
      }))
    : [];
  if (isGO) {
    let remainder =
      company.offer.percent -
      quotas.reduce((sum, q) => {
        q.units = Math.floor(q.exact);
        return sum + q.units;
      }, 0);
    for (const q of [...quotas]
      .sort((a, b) => b.exact - b.units - (a.exact - a.units) || a.index - b.index)
      .slice(0, remainder))
      q.units++;
  }
  if (isGO && quotas.some((q) => q.units < 1))
    throw Error(
      "Cada participante deve aportar valor suficiente para receber pelo menos 1% da empresa",
    );
  for (const [id, amount] of entries) {
    const g = participant(room, id).game;
    debitCashCents(g, amount * 100);
    g.ledger ??= [];
    g.ledger.push({
      id: randomUUID(),
      turn: g.turn,
      closure: g.closures,
      kind: "joint_investment_purchase",
      amount: -amount,
      description: `Aporte coletivo ${p.cardId}`,
      cardId: p.cardId,
      jointProposalId: p.id,
    });
    if (isGO) {
      const units = quotas.find((q) => q.id === id).units;
      company.shares[id] = (company.shares[id] || 0) + units;
      g.ledger.at(-1).kind = "share_purchase";
      g.ledger.at(-1).companyId = p.cardId;
      g.history.unshift({
        id: randomUUID(),
        text: `Aquisição conjunta de ${units}% em ${company.name} por R$ ${amount}.`,
        type: "asset",
      });
    } else {
      g.assets ??= [];
      g.assets.push({
        ...offer,
        ownershipId: `${ownershipId}:${id}`,
        source: p.cardId.startsWith("GI-")
          ? "official_joint_grand_participation"
          : "official_joint_special_participation",
        jointProposalId: p.id,
        contribution: amount,
        percent: (offer.percent * amount) / p.offerCost,
        passive: ["OE-007", "OE-009"].includes(p.cardId)
          ? Math.floor((offer.referencePassive * amount) / p.offerCost)
          : 0,
        incomeStatus: ["OE-007", "OE-009"].includes(p.cardId)
          ? "reference_rental_income"
          : "requires_verified_operating_profit",
      });
    }
    if (id === p.authorId) {
      const event = g.cardEvents?.find(
        (e) => e.id === p.cardId && e.resolution === "joint_proposal",
      );
      if (event) {
        event.resolution = "joint_purchase";
        event.financialEffect = true;
      }
      if (isGO) {
        g.offerResolved = true;
        g.currentOffer = null;
      }
    }
  }
  if (isGO) {
    company.shares.origin -= company.offer.percent;
    room.externalSellerCash = (room.externalSellerCash ?? 0) + p.offerCost;
    company.history.push({
      type: "joint_share_transfer",
      proposalId: p.id,
      participants: quotas.map((q) => ({ playerId: q.id, percent: q.units })),
      price: p.offerCost,
      round: room.round,
    });
  }
  p.status = "settled";
  p.settledRound = room.round;
  p.ownershipId = ownershipId;
  return p;
}
export function expireJointInvestments(room) {
  for (const p of ensureJointInvestments(room)) {
    if (p.status === "open" && room.round > p.expiresRound) p.status = "expired";
  }
}
export function publicJointInvestments(room) {
  return ensureJointInvestments(room).map((p) => ({
    ...p,
    commitments: { ...p.commitments },
    invitedIds: [...p.invitedIds],
    declinedIds: [...p.declinedIds],
  }));
}
