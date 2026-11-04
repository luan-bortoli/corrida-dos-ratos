import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../multiplayer.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../multiplayer.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("mercado em modal: três abas, resumo e fechamento acessível", () => {
  for (const id of [
    "marketDialog",
    "closeMarket",
    "marketTabAssets",
    "marketTabAds",
    "marketTabOffers",
    "marketSectionBody",
    "marketTotalAssets",
    "marketTotalAds",
    "marketTotalOffers",
    "marketTotalDividends",
  ])
    assert.match(html, new RegExp(`id="${id}"`));
  for (const name of ["Meus investimentos", "Meus anúncios", "Ofertas disponíveis"])
    assert.ok(html.includes(name));
  assert.match(css, /\.market-dialog::backdrop/);
});
test("mercado acessível pelo centro do tabuleiro sem abrir automaticamente", () => {
  assert.match(js, /center\.append\(hub\)/);
  assert.match(js, /makeMarketHub\(r\)/);
  assert.match(
    js,
    /button\.onclick\s*=\s*\(\)\s*=>\s*\{\s*marketTab\s*=\s*["\']assets["\'];\s*renderMarket\(r\);\s*if\s*\(!marketDialog\.open\)\s*marketDialog\.showModal\(\)/,
  );
  assert.match(js, /\$\(["\']businessPanel["\']\)\.hidden\s*=\s*true/);
});
test("compra, venda e cancelamento preservam endpoints financeiros", () => {
  for (const endpoint of [
    "secondary-list",
    "secondary-buy",
    "secondary-cancel",
    "share-offer",
    "share-accept",
  ])
    assert.ok(js.includes(endpoint), endpoint);
  assert.match(js, /marketSeenKey\(r\)/);
  assert.match(js, /marketMarkSeen\(r,\s*info\)/);
  assert.match(js, /const parking\s*=\s*\$\(["\']businessPanel["\']\)/);
  assert.match(js, /for\s*\(const id of \[["\']companies["\'],\s*["\']proposals["\'],\s*["\']npcOffers["\'],\s*["\']shareOffers["\']\]\)/);
});
