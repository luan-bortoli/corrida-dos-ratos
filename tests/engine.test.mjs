import test from "node:test";
import assert from "node:assert/strict";
import { PROFESSIONS, INNER, OUTER, DREAMS } from "../src/data.js";
import {
  createGame,
  rollTurn,
  buyVerifiedAsset,
  finishTurn,
  recurringExpenses,
  passiveIncome,
  validateState,
} from "../src/engine.js";
test("12 fichas batem com despesas discriminadas", () => {
  assert.equal(PROFESSIONS.length, 12);
  for (const p of PROFESSIONS)
    assert.equal(
      Object.values(p.items).reduce((a, b) => a + b, 0),
      p.expenses,
    );
});
test("tabuleiros aprovados têm 32 e 48 casas", () => {
  assert.equal(INNER.length, 32);
  assert.equal(OUTER.length, 48);
  assert.equal(INNER.filter((x) => x === "PAY").length, 1);
  assert.equal(OUTER.filter((x) => x === "PAY").length, 1);
  for (const d of Object.values(DREAMS)) assert.ok(OUTER[d.position - 1].startsWith("DREAM:"));
});
test("começar na casa 1 não paga imediatamente", () => {
  const s = rollTurn(createGame(0), 1);
  assert.equal(s.cash, 2000);
  assert.equal(s.closures, 0);
  assert.equal(s.position, 2);
});
test("passar pelo dia de pagamento faz só um fechamento", () => {
  let s = createGame(0);
  s.position = 31;
  s = rollTurn(s, 3);
  assert.equal(s.closures, 1);
  assert.equal(s.position, 2);
  assert.equal(s.cash, 2400);
});
test("prestação inicial está incluída em despesas e juros amortizam saldo", () => {
  let s = createGame(0);
  s.position = 31;
  s = rollTurn(s, 3);
  assert.equal(s.debt, 2730);
  assert.equal(recurringExpenses(s), 1800);
});
test("compra de ativo confirmado custa caixa e registra rendimento", () => {
  let s = rollTurn(
    Object.assign(createGame(4), {
      officialPOEnabled: false,
      demoDeck: ["PO-001", "PO-002", "PO-007"],
    }),
    1,
  );
  s = buyVerifiedAsset(s, "PO-001");
  assert.equal(s.cash, 0);
  assert.equal(passiveIncome(s), 85);
  assert.equal(s.assets.length, 1);
  assert.throws(() => buyVerifiedAsset(s, "GO-016"));
});
test("bloqueia jogada seguinte antes da resolução", () => {
  let s = rollTurn(createGame(0), 1);
  assert.throws(() => rollTurn(s, 3));
  s = finishTurn(s);
  assert.doesNotThrow(() => rollTurn(s, 3));
});
test("independência requer renda passiva estritamente maior em três fechamentos", () => {
  let s = createGame(0);
  s.assets = [{ passive: 1801 }];
  for (let i = 0; i < 3; i++) {
    s.position = 31;
    s.pending = false;
    s = rollTurn(s, 3);
    assert.equal(s.streak, i + 1);
  }
  assert.equal(s.circuit, "outer");
  assert.equal(s.position, 1);
});
test("dado inválido não modifica partida", () => {
  const s = createGame(0);
  assert.throws(() => rollTurn(s, 7));
  assert.ok(validateState(s));
});
import { auditCash } from "../src/engine.js";
test("compra é limitada a uma aquisição por casa sorteada", () => {
  let s = rollTurn(
    Object.assign(createGame(8), {
      officialPOEnabled: false,
      demoDeck: ["PO-001", "PO-002", "PO-007"],
    }),
    1,
  );
  s = buyVerifiedAsset(s, "PO-001");
  assert.throws(() => buyVerifiedAsset(s, "PO-002"), /indisponível/);
  assert.equal(s.assets.length, 1);
});
test("extrato reconcilia compras e fechamentos", () => {
  let s = rollTurn(
    Object.assign(createGame(8), {
      officialPOEnabled: false,
      demoDeck: ["PO-001", "PO-002", "PO-007"],
    }),
    1,
  );
  s = buyVerifiedAsset(s, "PO-001");
  assert.equal(auditCash(s).ok, true);
  s = finishTurn(s);
  s.position = 31;
  s = rollTurn(s, 3);
  assert.equal(auditCash(s).ok, true);
  assert.ok(s.ledger.some((x) => x.kind === "salary"));
  assert.ok(s.ledger.some((x) => x.kind === "passive"));
});
test("fechamento com caixa insuficiente registra obrigação sem saldo negativo", () => {
  let s = createGame(0);
  s.cash = 0;
  s.initialCash = 0;
  s.baseExpenses = 10000;
  s.position = 31;
  s = rollTurn(s, 3);
  assert.equal(s.cash, 0);
  assert.equal(s.arrearsLiving, 7800);
  assert.equal(s.arrearsLoan, 300);
  assert.equal(s.debt, 3030);
  assert.equal(s.closures, 1);
  assert.equal(s.streak, 0);
  assert.equal(auditCash(s).ok, true);
});
test("pagamentos pendentes têm prioridade e não duplicam a prestação", () => {
  let s = createGame(0);
  s.baseExpenses = 2400;
  s.cash = 0;
  s.initialCash = 0;
  s.position = 31;
  s = rollTurn(s, 3);
  assert.equal(s.arrearsLiving, 200);
  assert.equal(s.arrearsLoan, 300);
  assert.equal(s.debt, 3030);
  s = finishTurn(s);
  s.position = 31;
  s = rollTurn(s, 3);
  assert.equal(s.arrearsLiving, 400);
  assert.equal(s.arrearsLoan, 600);
  assert.equal(s.debt, 3061);
  assert.equal(auditCash(s).ok, true);
});
test("quitação posterior de parcelas em atraso reduz saldo principal", () => {
  let s = createGame(0);
  s.baseExpenses = 2400;
  s.cash = 0;
  s.initialCash = 0;
  s.position = 31;
  s = rollTurn(s, 3);
  s = finishTurn(s);
  s.cash += 5000;
  s.ledger.push({ amount: 5000, kind: "test_funding" });
  s.position = 31;
  s = rollTurn(s, 3);
  assert.equal(s.arrearsLiving, 0);
  assert.equal(s.arrearsLoan, 0);
  assert.equal(s.debt, 2461);
  assert.equal(auditCash(s).ok, true);
});
test("estado novo exige consistência das pendências em centavos", () => {
  const s = createGame(0);
  delete s.arrearsLiving;
  delete s.arrearsLoan;
  assert.equal(validateState(s), false);
});
test("auditoria detecta alteração de caixa sem lançamento", () => {
  const s = createGame(0);
  s.cash += 100;
  assert.equal(auditCash(s).ok, false);
});
test("uma nova casa permite uma nova compra legítima", () => {
  let s = rollTurn(
    Object.assign(createGame(11), {
      officialPOEnabled: false,
      demoDeck: ["PO-001", "PO-002", "PO-007"],
    }),
    1,
  );
  s = buyVerifiedAsset(s, "PO-001");
  s = finishTurn(s);
  s.position = 4;
  s.demoDeck = ["PO-002", "PO-007", "PO-001"];
  s = rollTurn(s, 1);
  assert.equal(s.offerResolved, false);
  s = buyVerifiedAsset(s, "PO-002");
  assert.equal(s.assets.length, 2);
  assert.equal(auditCash(s).ok, true);
});

test("partida legada cria extrato com saldo inicial da migração", () => {
  let s = createGame(0);
  delete s.ledger;
  delete s.offerResolved;
  s.officialPOEnabled = false;
  s.demoDeck = ["PO-001", "PO-002", "PO-007"];
  s.cash = 4000;
  s = rollTurn(s, 1);
  s = buyVerifiedAsset(s, "PO-001");
  assert.equal(auditCash(s).ok, true);
  assert.equal(s.ledgerBaseline, 4000);
});
