import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CARD_CATALOG, getCard } from "../src/catalog.js";
import {
  splitCardText,
  normalizePresentedCard,
  CARD_METRIC_LABEL,
} from "../src/card-text-rendering.js";
const file = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const parse = (id) => normalizePresentedCard(splitCardText(getCard(id).text, id), id);
const value = (id, label) => parse(id).fields.find(([name]) => name === label)?.[1];

test("catálogo inteiro (230) usa parser único com títulos e moeda válidos", () => {
  assert.equal(CARD_CATALOG.length, 230);
  for (const card of CARD_CATALOG) {
    const parsed = parse(card.id);
    assert.ok(
      parsed.title && (parsed.title !== card.id || parsed.incomplete),
      `Título não identificado: ${card.id}`,
    );
    assert.ok(parsed.description || parsed.fields.length, `Carta sem conteúdo: ${card.id}`);
    assert.doesNotMatch(JSON.stringify(parsed), /RR\$/i, `Moeda duplicada: ${card.id}`);
    for (const [label, text] of parsed.fields) {
      assert.ok(label.trim() && text.trim(), `Campo vazio: ${card.id}`);
    }
  }
});

test("PO, GO, GI, OE, FI, DI, MF, EV, EF e BE exibem dados em campos distintos", () => {
  assert.equal(value("PO-001", "Preço"), "R$ 3.000");
  assert.equal(value("PO-003", "Investimento"), "R$ 1.800");
  assert.equal(value("PO-017", "Compra"), "de 1 a 80 ações");
  assert.equal(value("GO-015", "Preço"), "R$ 90.000");
  assert.equal(value("GO-015", "Lucro distribuído inicial"), "R$ 1.050/mês");
  assert.equal(value("GI-001", "Investimento"), "R$ 180.000");
  assert.equal(value("GI-001", "Renda inicial de referência"), "R$ 1.500/mês");
  assert.match(value("OE-020", "Participação oferecida"), /15% por R\$ 150\.000/);
  assert.equal(parse("FI-001").title, "Educação para Todos");
  assert.match(value("FI-001", "Contribuição e impacto social"), /5 estudantes apoiados/);
  assert.match(
    value("DI-006", "Despesa extra"),
    /Cobrança adicional de 5% do salário de referência/,
  );
  assert.equal(value("MF-001", "Abrangência"), "Global");
  assert.match(value("EV-012", "Decisão e efeito"), /Cancelar assinaturas/);
  assert.equal(parse("EF-001").title, "Reserva de emergência");
  assert.equal(value("BE-001", "Benefício"), "receber 15% do salário de referência, uma única vez");
  assert.equal(CARD_METRIC_LABEL.test("Renda inicial de referência"), true);
});

test("visualizador e jogo consultam o mesmo parser; respostas mantêm marcações", () => {
  const game = file("multiplayer.js");
  const review = file("revisao-cartas.js");
  const styles = file("styles.css");
  assert.match(game, /readOfficialCard\(original, id\)/);
  assert.match(review, /splitCardText\(card\.text, card\.id\)/);
  assert.match(game, /education-correct/);
  assert.match(game, /education-incorrect/);
  assert.match(review, /review-choice-correct/);
  assert.match(review, /review-choice-incorrect/);
  assert.match(styles, /card-metrics > :only-child/);
});
