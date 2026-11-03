# RC5 — Mercado na terceira coluna e marcadores dos jogadores

## Ajustes de apresentação

- No tabuleiro de 13 × 5, o Mercado foi posicionado **somente na terceira coluna**, imediatamente abaixo dos cartões financeiros, sem criar uma segunda linha de grid no centro.
- O Mercado mantém os indicadores de ativos, anúncios e ofertas, o aviso de novas ofertas e a abertura da modal com as três abas já implementadas.
- O Mercado agora usa uma apresentação compacta de duas linhas (título e indicadores), com o botão alinhado à direita.
- Os indicadores circulares dos jogadores nas casas aumentaram de 12 px para 16 px em telas maiores, preservando as cores e iniciais; no mobile, ajustam-se a 13 px.
- A área central permanece com `overflow: hidden`, sem barra de rolagem interna; os tamanhos das casas e a sequência de 32 posições não foram alterados.
- O circuito de Alta Velocidade conserva sua geometria anterior.

## Validação

- `node --check multiplayer.js`: aprovado.
- `npm test --silent`: **499 testes aprovados** (inclui dois novos testes de regressão visual estruturais).
- A aparência no navegador deve ser homologada em zoom de 100% e em dispositivos menores; os testes automatizados não substituem essa inspeção.
