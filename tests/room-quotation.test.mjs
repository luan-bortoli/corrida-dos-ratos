import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../src/engine.js";
import {
  applyGlobalMarketEvent,
  officialRoomQuote,
  publicOfficialMarket,
  synchronizeOfficialPosition,
} from "../src/global-market.js";
function setup(id) {
  const a = createGame(3),
    b = createGame(3);
  a.officialSecurities = { "PO-013": 4, "PO-014": 2 };
  a.pending = true;
  a.currentCard = { id, category: "MF" };
  a.cardEvents = [{ id: `occ-${id}`, resolution: "pending" }];
  return {
    round: 2,
    players: [
      { id: "a", game: a },
      { id: "b", game: b },
    ],
  };
}
test("cotação global é publicada mesmo sem proprietário de um instrumento", () => {
  const r = setup("MF-015");
  applyGlobalMarketEvent(r, "MF-015");
  assert.equal(officialRoomQuote(r, "PO-014").priceCents, 10500);
  assert.equal(publicOfficialMarket(r).length, 5);
  assert.equal(r.players[0].game.officialSecurityPricesCents["PO-014"], 10500);
  assert.equal(r.players[1].game.officialSecurityPricesCents, undefined);
});
test("novo titular herda cotação global e dividendo atualizado", () => {
  const r = setup("MF-013");
  applyGlobalMarketEvent(r, "MF-013");
  r.players[1].game.officialSecurities = { "PO-013": 3 };
  synchronizeOfficialPosition(r, r.players[1].game, "PO-013");
  assert.equal(r.players[1].game.officialSecurityDividendCents["PO-013"], 22);
  assert.equal(r.players[1].game.officialSecurityPricesCents["PO-013"], 5000);
});
test("eventos sucessivos incidem sobre cotação compartilhada, mesmo sem titulares", () => {
  const r = setup("MF-002");
  applyGlobalMarketEvent(r, "MF-002");
  assert.equal(officialRoomQuote(r, "PO-015").priceCents, 3600);
  r.players[0].game.cardEvents = [{ id: "other", resolution: "pending" }];
  r.players[0].game.currentCard = { id: "MF-021", category: "MF" };
  applyGlobalMarketEvent(r, "MF-021");
  assert.equal(officialRoomQuote(r, "PO-015").priceCents, 3312);
});
test("não modifica o registro global quando a validação de titularidade falha", () => {
  const r = setup("MF-001");
  r.players[1].game.officialSecurities = { "PO-013": -1 };
  assert.throws(() => applyGlobalMarketEvent(r, "MF-001"), /Titularidade/);
  assert.equal(r.officialMarket, undefined);
  assert.equal(r.marketOccurrences.length, 0);
});
test("cotação pública não altera patrimônio ou dinheiro", () => {
  const r = setup("MF-001");
  const cash = r.players[0].game.cash;
  applyGlobalMarketEvent(r, "MF-001");
  publicOfficialMarket(r);
  assert.equal(r.players[0].game.cash, cash);
  assert.equal(r.players[0].game.officialSecurities["PO-013"], 4);
});
test("rejeita cotação global adulterada", () => {
  const r = setup("MF-001");
  r.officialMarket = { pricesCents: { "PO-013": -50 } };
  assert.throws(() => applyGlobalMarketEvent(r, "MF-001"), /inválido/);
});
