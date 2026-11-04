import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cardStatusFeedback } from "../src/card-presentation.js";

const card = (id, category = "PO") => ({ id, category });
const event = (resolution) => ({ resolution });
test("cartas automáticas apresentam efeito confirmado, sem solicitar escolha", () => {
  const msg = cardStatusFeedback({
    card: { id: "MF-014", category: "MF", marketResult: { global: true } },
    event: event("automatic"),
    game: { officialSecurities: { "PO-017": 1 } },
  });
  assert.match(msg.text, /caiu 8%/);
  assert.doesNotMatch(msg.text, /Escolha|Se houver opções|conclua o turno/);
});
test("perguntas pendentes exibem orientação de resposta, encerradas não repetem resultado", () => {
  assert.match(
    cardStatusFeedback({ card: card("EF-006", "EF"), event: event("pending"), hasChoices: true })
      .text,
    /alternativas/,
  );
  assert.equal(
    cardStatusFeedback({
      card: card("EF-006", "EF"),
      event: event("answer"),
      hasAnswerFeedback: true,
    }),
    null,
  );
  assert.match(
    cardStatusFeedback({ card: card("EF-006", "EF"), event: event("unanswered") }).text,
    /sem resposta/,
  );
});
test("decisões de vida têm estado pendente e não duplicam resultado registrado", () => {
  assert.match(
    cardStatusFeedback({ card: card("EV-012", "EV"), event: event("pending"), hasChoices: true })
      .text,
    /opções/,
  );
  assert.equal(
    cardStatusFeedback({
      card: card("EV-012", "EV"),
      event: event("decision"),
      hasLifeFeedback: true,
    }),
    null,
  );
});
test("compras, propostas, recusa e operações usam mensagens específicas", () => {
  for (const state of ["purchase", "joint_purchase", "share_purchase"])
    assert.match(
      cardStatusFeedback({ card: card("GO-016", "GO"), event: event(state) }).text,
      /Aquisição registrada/,
    );
  for (const state of ["joint_proposal", "share_proposal", "corporate_proposal"])
    assert.match(
      cardStatusFeedback({ card: card("GO-016", "GO"), event: event(state) }).text,
      /Proposta registrada/,
    );
  assert.match(
    cardStatusFeedback({ card: card("PO-013"), event: event("decline") }).text,
    /recusada/,
  );
  assert.match(
    cardStatusFeedback({ card: card("OE-014", "OE"), event: event("refinance") }).text,
    /Operação registrada/,
  );
});
test("ausência de escolha não afirma que uma operação pendente foi executada", () => {
  const f = cardStatusFeedback({
    card: card("MF-020", "MF"),
    event: event("pending"),
    hasChoices: false,
  });
  assert.match(f.text, /não apresenta opções/);
  assert.doesNotMatch(f.text, /aplicad[oa]|registrad[oa]/);
});
test("despesas apresentam efeito sem prometer aplicação inexistente", () => {
  const f = cardStatusFeedback({
    card: card("DI-006", "DI"),
    event: event("pending"),
    expense: { percent: 5 },
  });
  assert.match(f.text, /5% do salário/);
  assert.doesNotMatch(f.text, /registrada automaticamente/);
});
test("modal usa resolução contextual e remove a orientação genérica", () => {
  const ui = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
  assert.match(
    ui,
    /cardStatusFeedback\(\{\s*card,\s*event,\s*game:\s*g,\s*hasChoices,\s*expense,\s*hasAnswerFeedback,\s*hasLifeFeedback,?\s*\}\)/,
  );
  assert.doesNotMatch(ui, /Confira as condições da carta\. Se houver opções de decisão/);
});
