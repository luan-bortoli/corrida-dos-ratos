import test from "node:test";
import assert from "node:assert/strict";
import { gradeQuestion, publicQuestion, validateQuizCatalog } from "../src/financial-quiz.js";
import {
  createGame,
  rollTurn,
  answerEducationCard,
  finishTurn,
  auditCash,
  validateState,
} from "../src/engine.js";
test("30 questões completas com quatro alternativas e catálogo válido", () => {
  assert.equal(validateQuizCatalog(), true);
  for (let n = 1; n <= 30; n++) {
    const id = `EF-${String(n).padStart(3, "0")}`;
    const q = publicQuestion(id);
    assert.ok(q.question.endsWith("?"));
    assert.equal(q.options.length, 4);
    assert.equal("correct" in q, false);
  }
});
test("gabarito: EF-001 e EF-030 seguem os textos oficiais", () => {
  assert.equal(gradeQuestion("EF-001", "B").correct, true);
  assert.equal(gradeQuestion("EF-030", "C").correct, true);
  assert.throws(() => gradeQuestion("EF-001", "Z"));
});
test("resposta correta paga apenas uma vez e reconcilia caixa", () => {
  let s = createGame(3);
  s.position = 2;
  s.catalogDecks = { "inner:EF": ["EF-001"] };
  s = rollTurn(s, 1);
  assert.equal(s.currentCard.id, "EF-001");
  const before = s.cash;
  s = answerEducationCard(s, "B");
  assert.equal(s.cash - before, 175);
  assert.equal(s.cardEvents.at(-1).resolution, "answer");
  assert.equal(validateState(s), true);
  assert.equal(auditCash(s).ok, true);
  assert.throws(() => answerEducationCard(s, "B"));
  s = finishTurn(s);
  assert.equal(s.cash, before + 175);
});
test("resposta errada não gera recompensa e fica registrada", () => {
  let s = createGame(3);
  s.position = 2;
  s.catalogDecks = { "inner:EF": ["EF-001"] };
  s = rollTurn(s, 1);
  const cash = s.cash;
  s = answerEducationCard(s, "A");
  assert.equal(s.cash, cash);
  assert.equal(s.cardEvents.at(-1).correct, false);
  assert.equal(validateState(s), true);
});
test("encerrar pergunta sem responder não concede recompensa", () => {
  let s = createGame(3);
  s.position = 2;
  s.catalogDecks = { "inner:EF": ["EF-001"] };
  s = rollTurn(s, 1);
  const cash = s.cash;
  s = finishTurn(s);
  assert.equal(s.cash, cash);
  assert.equal(s.cardEvents.at(-1).resolution, "acknowledge");
});
