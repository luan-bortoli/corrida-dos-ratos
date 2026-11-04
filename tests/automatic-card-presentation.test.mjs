import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { automaticCardFeedback, cardLearningDisplay } from "../src/card-presentation.js";
import { getCard } from "../src/catalog.js";

test("MF-014 relata desvalorização automática sem inventar desconto do caixa", () => {
  const card = {
    id: "MF-014",
    marketResult: { global: true, affected: 2, kind: "security_valuation" },
  };
  const event = { resolution: "automatic" };
  const withShares = automaticCardFeedback(card, event, { officialSecurities: { "PO-017": 2 } });
  const withoutShares = automaticCardFeedback(card, event, { officialSecurities: {} });
  assert.match(withShares, /caiu 8%/);
  assert.match(withShares, /possui 2 unidade/);
  assert.match(withShares, /não sofre desconto direto/);
  assert.match(withoutShares, /não possui unidades/);
  assert.match(withoutShares, /não houve alteração direta em sua carteira/);
  assert.match(getCard("MF-014").text, /Desvalorização de 8%/);
});
test("a apresentação não atribui efeito registrado a carta pendente", () => {
  assert.equal(
    automaticCardFeedback(
      { id: "MF-014", marketResult: { global: true } },
      { resolution: "pending" },
      { officialSecurities: { "PO-017": 1 } },
    ),
    null,
  );
  assert.equal(automaticCardFeedback({ id: "EF-006" }, { resolution: "answer" }, {}), null);
});
test("cartas automáticas sem elegibilidade apresentam resultado correto", () => {
  assert.match(
    automaticCardFeedback(
      { id: "MF-006", marketResult: { affected: 0 } },
      { resolution: "automatic" },
      {},
    ),
    /não possui investimentos elegíveis/,
  );
  assert.match(
    automaticCardFeedback(
      { id: "DI-023", conditionalExpense: { applicable: false } },
      { resolution: "automatic" },
      {},
    ),
    /não houve cobrança/,
  );
});
test("Global e Individual são abrangências, não aprendizados inventados", () => {
  assert.deepEqual(cardLearningDisplay("Global"), {
    label: "Abrangência",
    value: "Global — afeta o mercado da sala",
  });
  assert.deepEqual(cardLearningDisplay("Individual"), {
    label: "Abrangência",
    value: "Individual — aplicada somente ao jogador elegível",
  });
  assert.deepEqual(cardLearningDisplay("Organize suas despesas."), {
    label: "Aprendizado",
    value: "Organize suas despesas.",
  });
  assert.equal(cardLearningDisplay(""), null);
});
test("interface usa feedback automático antes de orientações de escolhas", () => {
  const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
  assert.match(
    js,
    /cardStatusFeedback\(\{\s*card,\s*event,\s*game:\s*g,\s*hasChoices,\s*expense,\s*hasAnswerFeedback,\s*hasLifeFeedback,?\s*\}\)/,
  );
  assert.match(js, /eligibility\.hidden\s*=\s*!feedback/);
  assert.match(js, /cardLearningDisplay\(learning\?\.\[1\]\)/);
});
