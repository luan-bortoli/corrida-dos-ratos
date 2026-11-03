import { test } from "node:test";
import assert from "node:assert/strict";
import { cashBalanceCents, formatCashBRL, formatCentsBRL } from "../src/money-balance.js";
import { createGame } from "../src/engine.js";
import { buildTeacherReport, reportCSV } from "../src/reports.js";
test("saldo legado continua válido sem campo de centavos", () => {
  const g = createGame(0, "TRAVEL");
  assert.equal(cashBalanceCents(g), g.cash * 100);
});
test("saldo complementar exibe centavos sem arredondar", () => {
  assert.equal(formatCashBRL({ cash: 162, secondaryCashCents: 3 }), "R$ 162,03");
  assert.equal(formatCentsBRL(1), "R$ 0,01");
});
test("valida saldos incorretos e overflow", () => {
  for (const g of [
    { cash: -1 },
    { cash: 1, secondaryCashCents: 100 },
    { cash: 1, secondaryCashCents: -1 },
    { cash: Number.MAX_SAFE_INTEGER },
  ])
    assert.throws(() => cashBalanceCents(g));
});
test("relatórios incluem saldo exato, preservando campo legado", () => {
  const game = createGame(0, "TRAVEL");
  game.secondaryCashCents = 47;
  const room = { code: "TST", players: [{ id: "1", name: "Teste", game }] };
  const before = JSON.stringify(room),
    report = buildTeacherReport(room);
  assert.equal(report.participants[0].cash, game.cash);
  assert.equal(report.participants[0].cashCents, game.cash * 100 + 47);
  assert.equal(report.participants[0].cashFormatted, (game.cash + 0.47).toFixed(2));
  assert.match(reportCSV(report), /"cashCents"/);
  assert.equal(JSON.stringify(room), before);
});
