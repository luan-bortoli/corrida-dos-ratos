# Correção — centralização dos botões nas modais (RC5)

## Problema

Na EV-012 e em cartas similares, os botões de decisão apareciam à esquerda e sem espaçamento perceptível, apesar das regras anteriores de alinhamento. O contêiner das ações não tinha `display: flex` na modal, então `justify-content` e `gap` não se aplicavam.

## Solução

Definido `display: flex` e `flex-wrap: wrap` para os contêineres de decisões de vida, ofertas empresariais e imóveis, com centralização e 10 px de espaçamento. As alternativas de Educação Financeira continuam empilhadas verticalmente. Sem mudanças nas decisões ou regras financeiras.
