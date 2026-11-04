import test from "node:test";
import assert from "node:assert/strict";
import { CARD_CATALOG, getCard } from "../src/catalog.js";
import { splitCardText, normalizePresentedCard } from "../src/card-text-rendering.js";

function preview(id) {
  return normalizePresentedCard(splitCardText(getCard(id).text, id), id);
}

test("230 cartas: títulos, descrições e campos editoriais completos e legíveis", () => {
  assert.equal(CARD_CATALOG.length, 230);
  for (const { id } of CARD_CATALOG) {
    const card = preview(id);
    assert.notEqual(card.incomplete, true, `${id}: texto individual incompleto`);
    assert.ok(card.title && card.title !== id, `${id}: título inválido`);
    assert.ok(card.description && card.description.trim(), `${id}: descrição ausente`);
    assert.ok(card.fields.length > 0, `${id}: nenhum campo informativo`);
    assert.doesNotMatch(JSON.stringify(card), /RR\$|\\\$|\*\*/, `${id}: caracteres indevidos`);
    const labels = card.fields.map(([label]) => label);
    assert.equal(labels.length, new Set(labels).size, `${id}: rótulos duplicados`);
    for (const [label, value] of [["Título", card.title], ["Descrição", card.description], ...card.fields]) {
      assert.ok(value.trim(), `${id}: campo ${label} vazio`);
      assert.doesNotMatch(value, /^[a-zà-ÿ]/u, `${id}: campo ${label} inicia com minúscula`);
    }
  }
});

test("oito imóveis preservam nomes próprios e contexto da oferta", () => {
  const titles = [
    "Apartamento Compacto para Aluguel",
    "Sala Comercial",
    "Casa para Locação",
    "Pequeno Galpão",
    "Chalé para Hospedagem",
    "Terreno em Área de Expansão",
    "Conjunto de Lojas",
    "Prédio com Três Quitinetes",
  ];
  for (let n = 1; n <= 8; n++) {
    const id = `GO-${String(n).padStart(3, "0")}`;
    assert.equal(preview(id).title, titles[n - 1], id);
    assert.ok(preview(id).description.length > 25, `${id}: descrição resumida indevidamente`);
  }
  const price = preview("GO-001").fields.find(([label]) => label === "Preço de aquisição");
  assert.deepEqual(price, ["Preço de aquisição", "R$ 35.000"]);
});

test("renda fixa e equipamentos mostram contexto e termos da operação sem texto genérico", () => {
  for (const n of [8, 9, 10, 11, 12, 18, 19, 20, 21]) {
    const id = `PO-${String(n).padStart(3, "0")}`;
    const card = preview(id);
    assert.ok(card.description.length > 20, `${id}: descrição insuficiente`);
    assert.doesNotMatch(card.description, /indisponível|conteúdo oficial antes de homologar/i);
  }
});

test("OE-006 a OE-009 e OE-013 mantêm dados e textos próprios", () => {
  const expected = {
    "OE-006": ["15.000", "12%"],
    "OE-007": ["120.000", "900"],
    "OE-008": ["30.000", "18%"],
    "OE-009": ["180.000", "1.500"],
    "OE-013": ["90.000", "63.000"],
  };
  for (const [id, values] of Object.entries(expected)) {
    const card = preview(id);
    const content = card.fields.map(([, value]) => value).join(" ");
    for (const value of values) assert.ok(content.includes(value), `${id}: ausente ${value}`);
    assert.equal(card.fields.filter(([label]) => label === "Consequência").length, 1, id);
  }
});
