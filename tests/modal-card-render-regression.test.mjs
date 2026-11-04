import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCard } from "../src/catalog.js";
import { cardStatusFeedback } from "../src/card-presentation.js";

test("renderização do feedback da carta usa elementos existentes no DOM, não variáveis locais de outro escopo", () => {
  const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
  assert.match(
    js,
    /const hasChoices\s*=\s*\[["\']educationQuestion["\'],\s*["\']lifeDecision["\'],\s*["\']companyOffer["\'],\s*["\']realEstateOffer["\']\]\.some\(\(?id\)?\s*=>\s*\{\s*const area\s*=\s*\$\(id\);/,
  );
  assert.doesNotMatch(js, /const hasChoices=\[edu,life,cardOfferArea,realEstateArea\]/);
  for (const id of ["educationQuestion", "lifeDecision", "companyOffer", "realEstateOffer"]) {
    const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test("feedback contextual não impede a apresentação do conteúdo oficial da carta", () => {
  const card = getCard("MF-014");
  assert.ok(card?.text);
  const feedback = cardStatusFeedback({
    card: { id: "MF-014", category: "MF", marketResult: { global: true } },
    event: { resolution: "automatic" },
    game: { officialSecurities: {} },
  });
  assert.ok(feedback?.text);
  assert.match(card.text, /Desvalorização de 8%/);
});
