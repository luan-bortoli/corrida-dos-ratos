# Correção da GO-016 — Participação em Cafeteria (RC4)

## Origem do problema

As participações GO-016 a GO-020 tinham ofertas registradas no módulo de empresas, mas não eram renderizadas como decisões na carta em jogo. O endpoint de compra aceitava qualquer participação enquanto a casa GO estivesse ativa, sem exigir correspondência com a carta sorteada. A aquisição conjunta da carta GO também não estava integrada ao fluxo existente de propostas.

## Correções

- Na carta GO-016 (e nas demais participações GO-017 a GO-020), aparecem **Adquirir participação à vista** e **Propor aquisição conjunta** quando a carta estiver pendente e o jogador estiver no turno.
- A aquisição à vista exige saldo suficiente, disponibilidade de quotas e correspondência exata com a carta sorteada; após compra, o evento é registrado como concluído.
- A proposta conjunta permite convidar estudantes, registrar aportes e transferir as quotas oferecidas somente depois de integralizar todo o preço; nenhuma cobrança antecipada é efetuada.
- Os percentuais societários são atribuídos em pontos percentuais inteiros, por maiores restos, totalizando exatamente a participação oferecida; nenhum participante pode pagar sem receber pelo menos 1%.
- A operação mantém separado o caixa empresarial do preço pago ao vendedor externo e não cria dividendos presumidos.
- Propostas conjuntas pendentes impedem a venda simultânea da mesma oferta; a expiração continua após duas rodadas, conforme o fluxo existente.
- O painel de empresas continua disponível para acompanhamento, mas o botão de aquisição agora só habilita quando a empresa corresponde à carta sorteada.
- Mantida a opção de recusa/encerramento de turno já existente.

## Arquivos alterados

- `multiplayer.js`
- `src/companies.js`
- `src/joint-investments.js`
- `src/card-resolution.js`
- `tests/companies.test.mjs`
- `tests/corporate-cents-integration.test.mjs`
- `tests/final-go-share-cycles.test.mjs`
- `tests/new-official-routes.test.mjs`
- `tests/joint-investments.test.mjs`

## Verificação

`npm test`: 481 testes aprovados, sem falhas.

## Homologação manual sugerida

1. Inicie uma sala multiplayer com dois estudantes.
2. Ao sortear GO-016, confira no painel da carta os botões de aquisição à vista e conjunta e os valores de R$ 10.000 por 25%.
3. Com saldo suficiente, confirme compra à vista; confira quota, caixa e estado da decisão.
4. Em outra partida, proponha compra conjunta de R$ 4.000 + R$ 6.000 e confirme o aceite do outro estudante; confira a divisão de 10%/15%, o pagamento único de R$ 10.000 e a ausência de dividendos automáticos.
5. Confira recusas, falta de caixa e impossibilidade de adquirir participação de outra carta GO no mesmo turno.

Esta entrega é uma correção pontual da base RC4, não uma nova rodada de alterações visuais.
