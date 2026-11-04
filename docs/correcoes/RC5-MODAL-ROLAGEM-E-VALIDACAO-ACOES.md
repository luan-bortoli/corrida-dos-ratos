# RC5 — Rolagem da modal e validação de compra de ações

## Problemas relatados

1. A modal **Carta da jogada** apresentava duas barras de rolagem, uma no `<dialog>` e outra em `.dialog-shell`.
2. Na carta **PO-017**, solicitar mais de 80 ações era rejeitado pelo servidor, mas a mensagem ficava no aviso geral da página, oculto atrás da modal.

## Alterações

- `styles.css`: rolagem vertical exclusiva em `.dialog-shell`, evitando a segunda barra do `<dialog>`.
- `multiplayer.html`: adicionado aviso acessível `#gameCardFeedback`, exibido dentro da janela de carta.
- `multiplayer.js`: mensagens de operações agora aparecem também dentro da carta, quando aberta; ao abri-la, o aviso anterior é limpo; a compra primária valida quantidade inteira e intervalo da carta antes de enviar a operação.
- `tests/rc5-card-modal-scroll-validation.test.mjs`: três testes de regressão.

## Regras preservadas

O motor financeiro e o servidor não foram alterados. A PO-017 continua com limite de **1 a 80 ações por compra**; demais cartas seguem seus limites próprios. Erros financeiros retornados pelo servidor continuam sendo validados no backend.

## Validação

`npm test`: **536 testes aprovados, 0 falhas**.

A conferência visual em navegador deve verificar que a modal possui apenas uma barra de rolagem e que informar **90** na PO-017 exibe imediatamente o limite **1 a 80**, sem processar a compra.
