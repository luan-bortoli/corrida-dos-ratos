import test from "node:test";
import assert from "node:assert/strict";
import { getCard } from "../src/catalog.js";
import { splitCardText, normalizePresentedCard } from "../src/card-text-rendering.js";
import { CORPORATE_EXPANSIONS } from "../src/corporate-expansion-catalog.js";
import { SPECIAL_ACQUISITIONS } from "../src/special-opportunities.js";

const shown = (id) => normalizePresentedCard(splitCardText(getCard(id).text, id), id);
const findField = (id, label) => shown(id).fields.find(([key]) => key === label)?.[1];

test("OE-006 e OE-008: texto e custos/taxas coincidem com as regras empresariais", () => {
  for (const [id, cost, rate] of [
    ["OE-006", 15000, 12],
    ["OE-008", 30000, 18],
  ]) {
    assert.equal(CORPORATE_EXPANSIONS[id].cost, cost);
    assert.equal(CORPORATE_EXPANSIONS[id].rate, rate);
    assert.match(
      findField(id, "Investimento necessário"),
      new RegExp(String(cost).replace(/\B(?=(\d{3})+(?!\d))/g, "\\.")),
    );
    assert.match(findField(id, "Efeito previsto"), new RegExp(`${rate}%`));
    assert.match(findField(id, "Participação de investidores"), /participações cedidas/);
    assert.match(findField(id, "Consequência"), /pendente não desconta|pendentes não descontam/);
  }
});

test("OE-007 e OE-009: capital integral e renda total da proposta são mantidos", () => {
  for (const [id, cost, rental] of [
    ["OE-007", 120000, 900],
    ["OE-009", 180000, 1500],
  ]) {
    const offer = SPECIAL_ACQUISITIONS.find((value) => value.id === id);
    assert.equal(offer.cost, cost);
    assert.equal(offer.referencePassive, rental);
    assert.equal(offer.percent, 100);
    assert.match(findField(id, "Requisito"), /integralmente/);
    assert.match(findField(id, "Renda líquida inicial"), /referência total do projeto/);
    assert.doesNotMatch(
      JSON.stringify(shown(id)),
      /RR\$|financeiro \(Dia do Pagamento\) financeiro/,
    );
  }
});
