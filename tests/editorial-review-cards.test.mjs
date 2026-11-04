import test from "node:test";
import assert from "node:assert/strict";
import { CARD_CATALOG, getCard } from "../src/catalog.js";
import { splitCardText, normalizePresentedCard } from "../src/card-text-rendering.js";
const read = (id) => normalizePresentedCard(splitCardText(getCard(id).text, id), id);
const field = (id, name) => read(id).fields.find(([label]) => label === name)?.[1];

test("revisão editorial percorre as 230 cartas sem moeda duplicada ou vazamento de textos", () => {
  assert.equal(CARD_CATALOG.length, 230);
  for (const card of CARD_CATALOG) {
    const content = read(card.id);
    assert.doesNotMatch(JSON.stringify(content), /RR\$/);
    for (const [label, text] of content.fields) {
      assert.ok(label.trim() && text.trim(), `${card.id}: campo vazio`);
      assert.doesNotMatch(text, /^\s*[a-zà-ÿ]/u, `${card.id}: início de frase em minúscula`);
    }
  }
});
test("PO-013 separa os dividendos previstos dos requisitos", () => {
  assert.doesNotMatch(field("PO-013", "Distribuição inicial prevista"), /Requisitos e/i);
  assert.match(field("PO-013", "Requisito e decisão"), /Possuir o valor/);
});
test("OE-013 mantém os valores oficiais e não incorpora outras cartas", () => {
  const c = read("OE-013");
  assert.equal(c.title, "Pequena Empresa em Recuperação");
  assert.equal(field("OE-013", "Avaliação anterior"), "R$ 90.000");
  assert.match(field("OE-013", "Preço oferecido"), /R\$ 63\.000.*30%/);
  assert.equal(c.fields.filter(([label]) => label === "Consequência").length, 1);
  assert.doesNotMatch(JSON.stringify(c), /OE-014|OE-015|Reestruturação financeira/);
});
test("EV-012 descreve redução mensal de lazer e GI-001 preserva renda de referência", () => {
  assert.match(field("EV-012", "Decisão e efeito"), /despesas mensais com lazer diminuem 10%/);
  assert.match(field("EV-012", "Decisão e efeito"), /R\$ 50/);
  assert.equal(field("GI-001", "Renda inicial de referência"), "R$ 1.500/mês");
});
test("OE-006 a OE-009 têm textos oficiais individuais e não misturam cartas", () => {
  const titles = {
    "OE-006": "Parceria de Distribuição",
    "OE-007": "Sociedade em Projeto Imobiliário",
    "OE-008": "Aliança de Empresas de Tecnologia",
    "OE-009": "Parceria em Energia Renovável",
  };
  for (const [id, title] of Object.entries(titles)) {
    const content = read(id);
    assert.equal(content.incomplete, undefined, id);
    assert.equal(content.title, title, id);
    assert.ok(content.description.length > 20, id);
    assert.equal(content.fields.filter(([label]) => label === "Risco").length, 1, id);
    assert.equal(content.fields.filter(([label]) => label === "Aprendizado").length, 1, id);
    assert.doesNotMatch(JSON.stringify(content), /OE-010|OE-011|OE-012|OE-013/);
  }
  assert.match(field("OE-006", "Investimento necessário"), /15\.000/);
  assert.match(field("OE-006", "Efeito previsto"), /12%/);
  assert.match(field("OE-008", "Investimento necessário"), /30\.000/);
  assert.match(field("OE-008", "Efeito previsto"), /18%/);
  assert.match(field("OE-007", "Valor total do projeto"), /120\.000/);
  assert.match(field("OE-009", "Valor total do projeto"), /180\.000/);
  assert.match(field("OE-007", "Renda líquida inicial"), /900/);
  assert.match(field("OE-009", "Renda líquida inicial"), /1\.500/);
  for (const id of ["OE-007", "OE-009"]) {
    assert.match(field(id, "Requisito"), /integralmente/);
    assert.match(field(id, "Consequência"), /pendentes não descontam dinheiro/);
  }
  for (const id of ["OE-006", "OE-008"]) {
    assert.match(field(id, "Participação de investidores"), /explicitamente|explícita/);
  }
});
