# v1.43 — Continuação de integração financeira societária

## Alterações verificadas

- `src/companies.js`: compras de participações GO-016 a GO-020 usam saldo total em centavos; pagamentos guardam `amountCents` no extrato.
- `src/distributions.js`: dividendos de empresas são creditados na carteira consolidada.
- `tests/corporate-cents-integration.test.mjs`: quatro testes novos.

## Cobertura e conclusão

- Rotas identificadas: **230/230 (100%)**.
- Sem pendências conhecidas no inventário: **213/230 (92,61%)**.
- Parciais: **17/230** (GO-009 a GO-020, OE-004, OE-012, OE-014, OE-015 e OE-016).
- Homologação integral: **não aferida**. A redução de riscos monetários não autoriza reclassificar nenhuma das 17 cartas como homologada.

## Testes

**426/426 aprovados**. O escopo dos testes não substitui a validação de todas as alternativas de carta em partidas completas.

## Limitações

- A contabilidade empresarial operacional ainda depende de lançamentos documentados pelo professor.
- A compra de participações deve passar por validação integral das demais opções e regras de governança.
- A v1.43 permanece aberta.
