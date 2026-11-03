# v1.43 — Validação integrada das cinco Oportunidades Especiais

Data: 2026-11-01.

## Execução

`npm test`: **451 testes, 451 aprovados, 0 falhas**.

Novos cenários de regressão em `tests/oe-final-integrated.test.mjs`:

- OE-004: imóvel elegível, desembolso, centavos, aplicação do aluguel no fechamento seguinte e proteção contra execução repetida.
- OE-012: preferência societária e compra com transferência, centavos, proteção contra segunda venda; expiração sem movimentação.
- OE-014: substituição do financiamento existente sem liberação de recursos, preservação de centavos e proteção contra nova execução da mesma carta.
- OE-015: conversão de obrigação da empresa em financiamento, pagamento parcial, juros, atraso e separação do caixa dos sócios.
- OE-016: amortização da dívida inicial, conservação de centavos e bloqueio de repetição.

A compra OE-012 também passou a registrar `amountCents` no lançamento da carteira pessoal.

## Critérios de conclusão e limitações

A suíte automatizada demonstra que os cenários testados funcionam; não equivale à homologação manual e individual de todas as alternativas das 230 cartas. O inventário `functionalCoverage` continua conservador: **225/230 rotas sem pendências conhecidas (97,83%)**, com **cinco fluxos específicos ainda classificados como parciais**. A OE-012 continua vinculada a uma empresa demonstrativa de referência; não é uma negociação universal de qualquer sociedade. A OE-014 não permite renegociar saldo devedor fracionário. A apuração empresarial exige receitas operacionais registradas e não pode ser confundida com lucro presumido.

Por isso esta compilação não é rotulada como homologação integral da v1.43. As funcionalidades estão prontas para avaliação funcional adicional, e eventuais lacunas do catálogo e de suas alternativas devem ser resolvidas antes da declaração formal de encerramento.
