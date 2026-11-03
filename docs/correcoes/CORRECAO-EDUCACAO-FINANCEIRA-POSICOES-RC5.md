# RC5 — Correção das respostas de Educação Financeira e posição da casa

## Problemas identificados

1. Ao abrir uma carta EF na modal, a pergunta aparecia sem botões de resposta: os controles eram criados em `#playerActions`, filho do painel oculto `#turnPanel`, fora da modal.
2. O motor numera as posições de 1 a 32 (posição 1 = casa visual 0, Pagamento), enquanto o circuito visual numera as casas de 0 a 31. A exibição estava utilizando a posição interna diretamente como índice visual, deslocando os marcadores e o nome/tipo da casa em uma posição.

## Correções

- `multiplayer.js`: o contêiner `#playerActions` acompanha a carta no conteúdo de `#gameCardDialog`, exibindo as alternativas A–D de EF e as decisões de outras categorias; mantém `#turnPanel` oculto na visão do estudante.
- `styles.css`: controles da modal com layout responsivo (alternativas em duas colunas no desktop, uma no celular), ocultação explícita dos controles redundantes de dado e encerramento que permanecem no tabuleiro.
- `multiplayer.js`: os marcadores visuais e a descrição da casa convertem posições internas em índices visuais por `position - 1`, preservando a ordem do motor e a numeração de 0 a 31 exibida no circuito.

## Validação

- `node --check multiplayer.js` — aprovado.
- `npm test --silent` — **502 testes aprovados**, sem falhas.
- Cobertura adicional em `tests/modal-education-actions-rc5.test.mjs` e `tests/board-position-and-quiz-rc5.test.mjs`.

## Homologação recomendada

- Jogar até uma carta EF (como EF-006), abrir a modal e verificar se as quatro alternativas aparecem e podem ser selecionadas.
- Após responder, confirmar a mensagem de acerto/erro e a recompensa aplicável, sem duplicação de recompensa.
- Conferir se a casa destacada corresponde ao tipo da carta e à informação apresentada no centro do tabuleiro.
- Repetir o fluxo com uma oportunidade de compra para confirmar que os botões de decisão também aparecem na modal.

Não foram alteradas as regras financeiras, probabilidades do dado, conteúdo das cartas ou condições de resposta no servidor.
