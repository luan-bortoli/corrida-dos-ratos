import test from "node:test";
import assert from "node:assert/strict";
import { createCompanies, closeCompanies } from "../src/companies.js";
import {
  openProposal,
  castVote,
  expireProposals,
  recordVerifiedOperatingEvent,
} from "../src/governance.js";
const game = (won = false) => ({ won });
function room() {
  const companies = createCompanies();
  companies[0].shares = { alice: 60, bob: 40 };
  return {
    round: 1,
    companies,
    players: [
      { id: "alice", game: game() },
      { id: "bob", game: game() },
    ],
  };
}
test("aprovação exige mais de 50% do capital total", () => {
  const r = room();
  const p = openProposal(r, "alice", "GO-016", "Reinvestir excedentes");
  castVote(r, "alice", p.id, "yes");
  assert.equal(p.status, "approved");
  assert.equal(p.resolution.denominator, 100);
});
test("abstenção não reduz denominador", () => {
  const r = room();
  r.companies[0].shares = { alice: 50, bob: 50 };
  const p = openProposal(r, "alice", "GO-016", "Aprovar plano econômico");
  castVote(r, "alice", p.id, "yes");
  assert.equal(p.status, "open");
  castVote(r, "bob", p.id, "abstain");
  assert.equal(p.status, "rejected");
});
test("um sócio não vota duas vezes", () => {
  const r = room();
  const p = openProposal(r, "bob", "GO-016", "Plano de investimento");
  castVote(r, "bob", p.id, "yes");
  assert.throws(() => castVote(r, "bob", p.id, "no"), /já registrado/);
});
test("participante concluído não pode votar novamente", () => {
  const r = room();
  const p = openProposal(r, "bob", "GO-016", "Plano de investimento");
  r.players[0].game.won = true;
  assert.throws(() => castVote(r, "alice", p.id, "yes"), /sem direito/);
});
test("proposta vence após duas rodadas completas", () => {
  const r = room();
  const p = openProposal(r, "bob", "GO-016", "Plano de investimento");
  r.round = 4;
  expireProposals(r);
  assert.equal(p.status, "rejected");
});
test("receita verificada contabiliza uma vez e permite dividendo somente quando existe lucro", () => {
  const r = room(),
    c = r.companies[0],
    start = c.cash;
  recordVerifiedOperatingEvent(c, {
    sourceId: "EVENT:GO016:1",
    type: "revenue",
    amount: 900,
    round: 1,
  });
  assert.equal(c.cash, start + 900);
  assert.throws(
    () =>
      recordVerifiedOperatingEvent(c, {
        sourceId: "EVENT:GO016:1",
        type: "revenue",
        amount: 900,
        round: 1,
      }),
    /repetido/,
  );
  closeCompanies(r, 9);
  assert.equal(c.lastClosedRound, 9);
  assert.equal(c.distributions.length, 1);
  assert.equal(c.distributions[0].paid, 900);
});
test("despesa empresarial não gera caixa negativo", () => {
  const c = createCompanies()[0];
  assert.throws(
    () =>
      recordVerifiedOperatingEvent(c, {
        sourceId: "EVENT:EXP:1",
        type: "expense",
        amount: c.cash + 1,
        round: 1,
      }),
    /insuficiente/,
  );
});
