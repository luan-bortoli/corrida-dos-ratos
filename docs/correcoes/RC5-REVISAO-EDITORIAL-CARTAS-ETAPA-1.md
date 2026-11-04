# RC5 — Revisão editorial das cartas: primeira etapa

## Escopo

Foi feita uma primeira revisão sistemática da **apresentação das 230 cartas**. Esta é uma etapa editorial inicial, com correções de problemas identificados por comparação com a fonte e testes automatizados; **não equivale à revisão humana, linha por linha, de todo o conteúdo oficial**.

- O arquivo `catalogo/Cartas.md` e `src/approved-card-texts.json` **não foram modificados**.
- Nenhuma fórmula, preço, porcentagem, condição de crédito ou efeito financeiro foi alterado.
- O jogo e a revisão consultam o mesmo módulo `src/card-text-rendering.js`.
- Foram normalizados inícios de frases, pontuação de enunciados narrativos e termos de periodicidade financeira na **exibição**.
- Valores apresentados como referência permanecem referência, não renda garantida.

## Correções conferidas com a fonte

| Carta | Correção editorial ou de leitura |
|---|---|
| PO-001 | Requisitos, decisões, consequências e aprendizado com início de frase maiúsculo e pontuação legível; fechamento explicado como Dia do Pagamento. |
| PO-013 | Rendimento previsto não absorve o título “Requisitos e decisão”; cada informação aparece em seu campo. |
| PO-017 | Faixa de compra e orientações com início de frase e terminologia consistente. |
| GI-001 | Mantidos investimento de R$ 180.000 e renda de referência de R$ 1.500/mês; risco iniciado como frase legível. |
| EV-012 | “Assinaturas” padronizado e explicação explícita da redução **mensal** de 10% das despesas com lazer, mantendo mínimo de R$ 50. |
| OE-010 a OE-013 | Título individual diferenciado da categoria “Aquisição com desconto”. |
| OE-013 | Interrompida a leitura quando começa o texto da seção seguinte. Mantidos **R$ 90.000** de avaliação anterior e **R$ 63.000** de preço oferecido, com desconto de 30%, conforme a fonte; excluídas as duplicações de risco/consequência de OE-014 e OE-015. |
| FI-001 | Textos com capitalização e pontuação consistentes; faixas e impacto social conservados. |
| BE-001 | Capitalização da descrição do benefício e das consequências, sem alterar valor percentual. |

## Regra editorial aplicada

1. Frases destinadas ao jogador começam com letra maiúscula, inclusive após ponto final, interrogação ou exclamação.
2. Informações narrativas recebem pontuação final quando ausente; quantias, categorias e valores curtos não ganham pontos artificiais.
3. Expressões como “por fechamento” e “a cada fechamento” passam a explicar “fechamento financeiro (Dia do Pagamento)” quando ocorrem em um campo da carta.
4. Títulos de seções não podem contaminar o conteúdo do campo anterior.
5. Não se inventam campos ausentes nem se substituem as regras ou os valores documentados.

## Pendências de qualidade da fonte

**OE-006, OE-007, OE-008 e OE-009:** no JSON desta versão há apenas um trecho genérico de condições complementares, sem o conteúdo individual completo dessas cartas. As quatro permanecem assinaladas como incompletas. É necessário confrontar a fonte individual aprovada antes de produzir uma redação definitiva.

## Próxima etapa editorial

A primeira passagem foi **sistemática e automatizada**, com conferência dirigida das cartas que apresentaram anomalias conhecidas. Ainda falta uma leitura editorial humana integral para avaliar nuances de significado em todas as 230 cartas, além de homologação visual no navegador para cada família de apresentação. Nenhum resultado automatizado substitui essas verificações.

## Testes

- **561 testes aprovados; 0 falhas** nesta primeira etapa.
- Cinco testes adicionais cobrem capitalização, separação de campos, preservação de valores da OE-013, EV-012 e textos de fonte incompleta.
- Um teste anterior teve as expectativas textuais atualizadas para refletir maiúsculas e pontuação, sem remover as verificações financeiras.

## Instalação

Extrair o ZIP incremental na raiz da versão RC5 já atualizada com a padronização anterior. Substituir somente os arquivos incluídos, reiniciar o servidor e atualizar o navegador com `Ctrl + F5`.
