import test from "node:test";
import assert from "node:assert/strict";
import QUESTIONS from "../src/financial-quiz-data.json" with { type: "json" };
import { publicQuestion, gradeQuestion } from "../src/financial-quiz.js";

test("as 30 questões não mostram escapes em valores e pontuação", () => {
  assert.equal(Object.keys(QUESTIONS).length, 30);
  for (const id of Object.keys(QUESTIONS)) {
    const q = publicQuestion(id);
    for (const text of [q.question, ...q.options]) {
      assert.doesNotMatch(text, /\\[$.]/, `${id}: escape indevido no texto`);
      assert.doesNotMatch(text, /RR\$/, `${id}: moeda duplicada`);
    }
    assert.equal(q.options.length, 4);
    assert.equal(gradeQuestion(id, QUESTIONS[id].correct).correct, true);
  }
});

test("EF-017 mostra os valores sem barras invertidas", () => {
  const q = publicQuestion("EF-017");
  assert.match(q.question, /R\$ 2\.000/);
  assert.equal(q.options[0], "R$ 500.");
  assert.equal(q.options[1], "R$ 250.");
});
