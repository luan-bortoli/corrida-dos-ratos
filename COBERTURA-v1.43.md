# Corrida dos Ratos — Cobertura de implementação v1.43 (parcial)

**Situação: integração parcial; esta não é a v1.43 funcionalmente concluída.**

## Escopo adicionado na continuação

- Grandes Investimentos GI-001 a GI-018: ofertas e compras à vista ou financiadas (quando análise de crédito aprova), preços, entradas mínimas, ativo adquirido, passivo de financiamento e extrato; nas 8 empresas GI-011 a GI-018 a renda de referência NÃO é dividendo verificado, e falta ligação à contabilidade empresarial operacional.
- Filantropia FI-001 a FI-005: três faixas aprovadas, escolha de contribuição ou recusa, validação de caixa, débito único, impacto social simulado rastreável, modos individual e multiplayer.
- 16 novos testes para Filantropia e 20 para Grandes Investimentos, total de 327 testes aprovados.
- Sem geração de renda, patrimônio ou doações reais.

## Escopo adicionado nesta consolidação

- Eventos da Vida — novas decisões: EV-002, EV-003, EV-004, EV-007, EV-010, EV-012, EV-014, EV-015, EV-016, EV-017, EV-020, EV-023, EV-025, EV-028.
- Eventos automáticos: EV-008, EV-009, EV-018, EV-024.
- Benefícios: BE-003, BE-005, BE-007, BE-009.
- As decisões já existentes, eventos anteriores, carteira, baralhos e todas as descrições das 230 cartas foram preservados.

## Regra econômica preservada

A despesa é dividida em categorias existentes das 12 profissões: moradia, alimentação, transporte, lazer e educação. Alterações permanentes afetam apenas a categoria escolhida. Descontos temporários afetam somente a cobrança dos próximos fechamentos elegíveis; não apagam os valores-base. Aumento salarial por qualificação só passa a incidir a partir do segundo fechamento seguinte. Reconhecimento social e consulta financeira não adicionam dinheiro fictício.

## Pendências antes de declarar a v1.43 concluída

- GI-019 a GI-025 (participações societárias) e OE-001 a OE-020 (Oportunidades Especiais) continuam pendentes; para GI-011 a GI-018 falta o fechamento empresarial operacional. As 5 cartas FI estão integradas.
- Algumas Grandes Oportunidades de participação societária GO-018–GO-020 e seus fluxos de investimento.
- Complementos das 30 cartas de Mercado Financeiro em todos os circuitos, com conciliação de preço, setor e dividendos.
- Desfechos de revenda de estoques e negócios, gestão de compradores e liquidez.
- Completar ações condicionais, diagnósticos pedagógicos e operações das demais cartas.
- Testes de integração por carta e por turno, contemplando todas as alternativas e condições.
- Consolidar operações empresariais e financeiras que continuam divergentes entre o modo individual e multiplayer.

A presença do texto aprovado no catálogo **não** significa que a carta já pode executar todos os seus efeitos. Este relatório não atribui porcentagem geral sem auditoria funcional por identificador.

## Continuação 3 — aquisições e amortização (346 testes)
- GI-019 a GI-025: as sete ofertas de participação podem ser adquiridas **integralmente por um jogador com dinheiro próprio**, registrando preço, percentual, avaliação de referência e sem rendimentos fictícios. Financiamento automático bloqueado. **Aquisição conjunta, direito de preferência e votação ficam pendentes**.
- OE-011, OE-013 e OE-018: aquisições à vista integradas no jogo individual e multiplayer, com custos oficiais e distinção entre aluguel de equipamento e lucros empresariais não comprovados.
- OE-016: amortização extraordinária de dívida própria, mínimo de R$ 1.000, limitada ao caixa e saldo devedor; funciona nos dois modos.
- **Não concluídas**: OE-001 a OE-010, OE-012, OE-014 a OE-015, OE-017 e OE-019 a OE-020. Muitas demandam votações, propostas conjuntas, direito de preferência, alterações empresariais e/ou financiamento conforme o catálogo.
- A aquisição GI individual **não representa o fluxo coletivo de proposta de duas rodadas**. Empresas GI-011–GI-025 ainda carecem de apuração operacional integrada; não foram criados dividendos artificiais.
- Esta integração **não conclui as 230 cartas**. A versão continua em desenvolvimento, sem liberar rótulo de finalização funcional.


## Continuação 5 — investimentos conjuntos GI (363 testes)
- GI-019 a GI-025: compra individual já existente e **compra conjunta multiplayer** por proposta de até duas rodadas, aceites, recusas, revalidação de caixa e participações proporcionais sem juros/dividendos inventados.
- Negociação conjunta em partida individual não se aplica (apenas um jogador).
- Este avanço não homologa os demais efeitos das 230 cartas; consultar `RELATORIO-CONCLUSAO-v1.43.md`.

## Continuação: OE-017 e OE-020
Ambas as participações agora têm proposta conjunta no multiplayer, com convites, aporte proporcional, confirmação, recusa, expiração em duas rodadas e liquidação com saldos revalidados; validadas em 366 testes. Governança e apuração operacional das demais oportunidades permanecem pendentes.

## Continuação: OE-004 e OE-015 (379 testes)
- OE-004: reforma de imóvel próprio de locação por R$ 20.000, com aluguel +15% no fechamento seguinte, integrada ao individual e multiplayer. Propriedades societárias compartilhadas não são reformadas por esse fluxo individual.
- OE-015: substituição de obrigação empresarial vencida por financiamento de 6/12/24 fechamentos a 1% por período. Sociedade exige votação >50%; capacidade de pagamento verificada antes da contratação; sem dinheiro novo ou movimentação pessoal.
- OE-012 ainda pendente: transferência societária com direito de preferência.
- As 230 cartas ainda não estão homologadas ponta a ponta.

## Continuação — OE-012, oferta com direito de preferência (384/384 testes)

- Implementada a oferta da OE-012: venda externa de 20% por R$ 51.000 (avaliação de referência de R$ 300.000, equivalente proporcional de R$ 60.000 e desconto de 15%).
- Sócios com participação registrada na abertura possuem preferência por duas rodadas; depois, outros jogadores podem comprar até a expiração da oferta na quarta rodada.
- A compra só é liquidada após validar os recursos do comprador; o valor é contabilizado para o vendedor externo, nunca como receita empresarial ou lucro distribuível.
- A participação da empresa é atualizada sem exceder 100%; a oferta não pode ser liquidada duas vezes.
- Integração ao servidor e à interface multiplayer, incluindo ofertas visíveis aos jogadores e botões de exercício de preferência e compra.
- Cinco novos testes específicos da OE-012, com regressão de 384/384 testes aprovados.

**Limitações:** o motor da OE-012 modela a oferta demonstrativa de investidor externo como uma empresa própria da carta; não representa negociação universal de participações em qualquer sociedade preexistente. Não há dividendos fictícios. A auditoria funcional de todas as 230 cartas e a apuração operacional geral continuam pendentes, portanto a v1.43 não está encerrada.
