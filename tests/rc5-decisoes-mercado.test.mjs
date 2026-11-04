import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGame } from "../src/engine.js";
import {
  listSecondary,
  cancelSecondary,
  buySecondary,
  publicSecondary,
} from "../src/official-secondary.js";
import { lifeDecision } from "../src/life-decisions.js";

const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("Educação Financeira dispõe as alternativas em coluna única em desktop e celular", () => {
  const end = css.slice(css.lastIndexOf("/* RC5 — padronização de escolhas nas cartas."));
  assert.match(
    end,
    /\.game-card-dialog #educationQuestion\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/s,
  );
  assert.match(end, /\.game-card-dialog #educationQuestion button\s*\{[^}]*width:\s*100%/s);
  assert.match(end, /gap:\s*10px\s*!important/);
});

test("decisões da modal ficam centralizadas com espaçamento e sem alterar ações", () => {
  const end = css.slice(css.lastIndexOf("/* RC5 — padronização de escolhas nas cartas."));
  for (const selector of ["#lifeDecision", "#companyOffer", "#realEstateOffer"])
    assert.ok(end.includes(selector));
  assert.match(end, /justify-content:\s*center/);
  assert.match(js, /perform\(["\']choose-life["\'],\s*\{\s*choice\s*\}\)/);
  assert.match(
    js,
    /perform\(["\']answer-education["\'],\s*\{\s*choice:\s*["\']ABCD["\']\[index\],?\s*\}\)/,
  );
});

test("EV-012 padroniza os textos apresentados e preserva efeito de redução do lazer", () => {
  assert.deepEqual(lifeDecision("EV-012", "inner"), {
    accept: "Cancelar assinaturas",
    reject: "Manter assinaturas",
  });
  const sharedPresentation = readFileSync(
    new URL("../src/card-text-rendering.js", import.meta.url),
    "utf8",
  );
  assert.match(js, /normalizePresentedCard/);
  assert.match(sharedPresentation, /Cancelar assinaturas/);
  assert.match(sharedPresentation, /Manter assinaturas/);
});

test("Mercado não oferece quantidade já anunciada e cancela anúncios liberando unidades", () => {
  const game = createGame(0, "CAFE");
  game.officialSecurities = { "PO-013": 5 };
  const room = {
    round: 1,
    players: [{ id: "a", game }],
    officialMarket: { pricesCents: { "PO-013": 5000 }, dividendsCents: {} },
  };
  const first = listSecondary(room, "a", "PO-013", 3);
  const second = listSecondary(room, "a", "PO-013", 2);
  assert.equal(
    publicSecondary(room).offers.reduce((sum, o) => sum + o.units, 0),
    5,
  );
  assert.throws(() => listSecondary(room, "a", "PO-013", 1), /indisponível/);
  cancelSecondary(room, "a", first.id);
  assert.equal(listSecondary(room, "a", "PO-013", 3).units, 3);
  assert.equal(
    publicSecondary(room).offers.reduce((sum, o) => sum + o.units, 0),
    5,
  );
  assert.match(
    js,
    /const reserved\s*=\s*info\.ownSec\s*\.filter\(\(?o\)?\s*=>\s*o\.securityId\s*===\s*id\)/,
  );
  assert.match(
    js,
    /available\s*===\s*0\s*\?\s*["\']Todas anunciadas["\']\s*:\s*["\']Anunciar venda["\']/,
  );
  assert.match(js, /!canTrade\s*\|\|\s*available\s*===\s*0/);
});
