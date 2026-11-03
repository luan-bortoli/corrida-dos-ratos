import { specialAcquisitionOffer } from "./special-opportunities.js";
import { grandInvestmentOffer } from "./grand-investments.js";
import { officialSecurityOffer } from "./official-securities.js";
import { fixedIncomeOffer } from "./fixed-income.js";
import { officialSmallBusinessOffer, officialPOAssetOffer } from "./official-small-businesses.js";
import { officialCompanyOffer } from "./official-companies.js";
import { realEstateOffer } from "./real-estate.js";
import { lifeDecision } from "./life-decisions.js";
// Official inventory entries without approved texts remain non-executable.
// Verified demonstration cards are deliberately isolated from the official deck.
import { getCard } from "./catalog.js";
import {
  GLOBAL_MARKET_EVENTS,
  GLOBAL_SECURITY_EVENTS,
  GLOBAL_INCOME_EVENTS,
} from "./global-market.js";
const isGlobalAutomaticMarketCard = (id) =>
  Object.hasOwn(GLOBAL_MARKET_EVENTS, id) ||
  Object.hasOwn(GLOBAL_SECURITY_EVENTS, id) ||
  Object.hasOwn(GLOBAL_INCOME_EVENTS, id) ||
  id === "MF-009";
import { VERIFIED_ASSETS } from "./data.js";
const demos = new Map(VERIFIED_ASSETS.map((asset) => [asset.id, asset]));
export function cardAvailability(card) {
  if (!card) return { status: "none", actions: [] };
  if (card.status === "verified_demo_subset" && demos.has(card.id))
    return { status: "demo", actions: ["purchase", "decline"] };
  if (getCard(card.id))
    return {
      status: card.status === "text_available" ? "text_available" : "awaiting_approved_text",
      actions: ["acknowledge"],
    };
  return { status: "invalid", actions: [] };
}
export function createCardEvent(card, turn, circuit, position) {
  const availability = cardAvailability(card);
  if (availability.status === "invalid") throw Error("Carta desconhecida");
  return {
    id: card?.id ?? null,
    turn,
    circuit,
    position,
    status: availability.status,
    resolution: "pending",
    financialEffect: false,
  };
}
export function resolveCardEvent(events, card, outcome) {
  const available = cardAvailability(card);
  if (
    !available.actions.includes(outcome) &&
    !(outcome === "unanswered" && card?.category === "EF")
  )
    throw Error("Ação não permitida para esta carta");
  const last = events?.at(-1);
  if (!last || last.id !== card.id || last.resolution !== "pending")
    throw Error("Evento já resolvido ou inexistente");
  last.resolution = outcome;
  last.financialEffect = outcome === "purchase";
  return last;
}
export function validateCardEvents(events) {
  if (events === undefined) return true;
  if (!Array.isArray(events) || events.length > 1000) return false;
  return events.every(
    (e) =>
      e &&
      typeof e === "object" &&
      Number.isSafeInteger(e.turn) &&
      e.turn >= 1 &&
      ["inner", "outer"].includes(e.circuit) &&
      Number.isInteger(e.position) &&
      e.position >= 1 &&
      e.position <= (e.circuit === "inner" ? 32 : 48) &&
      ["demo", "awaiting_approved_text", "text_available"].includes(e.status) &&
      [
        "pending",
        "purchase",
        "decline",
        "acknowledge",
        "automatic",
        "answer",
        "unanswered",
        "decision",
        "philanthropy",
        "refinance",
        "joint_proposal",
        "joint_purchase",
        "share_proposal",
        "share_purchase",
        "corporate_proposal",
        "corporate_expansion",
        "rental_improvement",
      ].includes(e.resolution) &&
      typeof e.financialEffect === "boolean" &&
      (["share_proposal", "share_purchase"].includes(e.resolution) &&
      e.id !== "OE-012" &&
      !(e.resolution === "share_purchase" && /^GO-0(1[6-9]|20)$/.test(e.id))
        ? false
        : e.resolution === "refinance"
          ? e.id === "OE-014" && e.circuit === "outer" && !e.financialEffect
          : e.resolution === "philanthropy"
            ? e.circuit === "outer" &&
              /^FI-00[1-5]$/.test(e.id) &&
              Number.isSafeInteger(e.amount) &&
              e.amount >= 0 &&
              e.financialEffect === e.amount > 0
            : e.resolution === "decision"
              ? ["accept", "reject"].includes(e.choice) &&
                !!lifeDecision(e.id, e.circuit) &&
                (!e.financialEffect || e.choice === "accept")
              : e.resolution === "automatic"
                ? typeof e.financialEffect === "boolean"
                : e.financialEffect ===
                  ([
                    "purchase",
                    "joint_purchase",
                    "share_purchase",
                    "corporate_expansion",
                    "rental_improvement",
                  ].includes(e.resolution) ||
                    (e.resolution === "answer" && e.correct === true))) &&
      typeof e.id === "string" &&
      !!getCard(e.id) &&
      ((e.status === "demo" && demos.has(e.id)) ||
        (["awaiting_approved_text", "text_available"].includes(e.status) &&
          (e.resolution !== "purchase" ||
            (e.id === "OE-016" && e.circuit === "outer") ||
            !!specialAcquisitionOffer({ id: e.id, category: "OE" }, e.circuit) ||
            !!grandInvestmentOffer({ id: e.id, category: "GI" }, e.circuit) ||
            !!officialSecurityOffer({ id: e.id, category: "PO" }, e.circuit) ||
            !!fixedIncomeOffer({ id: e.id, category: "PO" }, e.circuit) ||
            !!officialSmallBusinessOffer({ id: e.id, category: "PO" }, e.circuit) ||
            !!officialPOAssetOffer({ id: e.id, category: "PO" }, e.circuit) ||
            !!realEstateOffer({ id: e.id, category: "GO" }, e.circuit) ||
            !!officialCompanyOffer({ id: e.id, category: "GO" }, e.circuit)) &&
          e.resolution !== "decline" &&
          (!["answer", "unanswered"].includes(e.resolution) || e.id.startsWith("EF-")) &&
          (e.resolution !== "automatic" ||
            isGlobalAutomaticMarketCard(e.id) ||
            (e.circuit === "inner" &&
              (/^DI-0(0[1-9]|1[0-9]|20)$/.test(e.id) ||
                [
                  "MF-006",
                  "MF-010",
                  "MF-012",
                  "EV-001",
                  "EV-005",
                  "EV-008",
                  "EV-009",
                  "EV-013",
                  "BE-003",
                  "BE-005",
                  "BE-007",
                  "BE-009",
                  "BE-001",
                  "BE-002",
                  "BE-004",
                  "BE-006",
                  "BE-008",
                  "BE-010",
                ].includes(e.id))) ||
            (e.circuit === "outer" &&
              [
                "MF-027",
                "EV-018",
                "EV-024",
                "DI-023",
                "DI-026",
                "DI-028",
                "DI-030",
                "DI-032",
                "DI-033",
                "DI-035",
              ].includes(e.id))))),
  );
}
