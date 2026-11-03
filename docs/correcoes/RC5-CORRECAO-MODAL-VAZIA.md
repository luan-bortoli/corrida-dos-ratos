# RC5 — Correção do conteúdo vazio na modal de cartas

## Sintoma

Ao clicar em **Ver carta e decisões**, a janela mostrava apenas o cabeçalho **Carta da jogada** e o botão de fechar, sem os dados da carta.

## Causa

A implementação das mensagens contextuais introduziu uma avaliação de `hasChoices` usando identificadores JavaScript (`edu`, `life`, `cardOfferArea` e `realEstateArea`) declarados somente em outro escopo (`render`). Quando `updateLayout` tentava usá-los, a execução lançava `ReferenceError` e não finalizava a renderização do conteúdo da modal.

## Correção

A consulta agora acessa explicitamente os elementos existentes por ID (`educationQuestion`, `lifeDecision`, `companyOffer` e `realEstateOffer`) e verifica os botões contidos nesses elementos, sem depender de variáveis fora de escopo. Mantidos textos oficiais das cartas, decisões e regras financeiras.

## Verificação

- `node --check multiplayer.js`: aprovado.
- `npm test`: **521 testes aprovados**, incluindo 2 novos testes de regressão.
- Teste visual automatizado: não concluído porque o navegador disponibilizado neste ambiente bloqueou o endereço local com `ERR_BLOCKED_BY_ADMINISTRATOR`.
- A confirmação visual precisa ser realizada no navegador de homologação.
