# RC5 — Revisão visual das cartas (prévia da modal do jogo)

## Objetivo

Permitir que o Administrador selecione as 230 cartas oficiais e examine a apresentação de cada uma sem sortear cartas nem executar uma partida.

## Acesso

Entrar em uma sala como Administrador, acessar **Revisar cartas** na área administrativa e abrir `http://localhost:3000/revisao-cartas.html`.

A página verifica a sessão administrativa existente usando o endpoint de auditoria. Se a sessão estiver ausente ou inválida, o catálogo permanece bloqueado.

## Experiência

- Busca por código, conteúdo e título; filtros por categoria e circuito.
- Atalhos para exemplos representativos: pequenos negócios, renda fixa, ações, despesas, eventos de escolha, educação financeira, empresas, Alta Velocidade e filantropia.
- Exibição em uma representação da **modal Carta da jogada**, com as classes e estilos utilizados no jogo (`game-card-dialog`, `dialog-shell`, `card-panel`, `card-metrics`, `card-sections`, `card-learning`).
- O conteúdo textual é interpretado pelo mesmo algoritmo de apresentação de cartas disponível em `src/card-text-rendering.js`, equivalente ao usado pelo multiplayer.
- As perguntas de Educação Financeira apresentam as alternativas oficiais de `src/financial-quiz-data.json`.
- As decisões de Eventos da Vida e de Filantropia utilizam os respectivos catálogos oficiais.
- Um painel recolhível mostra o texto original e observações automáticas.

## Limites da prévia

Esta é uma **prévia visual em contexto administrativo**, não uma partida simulada. Não executa compra, venda, crédito, pagamento, escolha, nem altera jogadores ou partidas. As opções de compra/recusa são ilustrativas; ações reais, limites, saldo, elegibilidade, feedback e valores calculados podem variar conforme a carta, os ativos e o estado do jogador. Para essas situações, permanece necessária a homologação funcional contextual.

## Arquivos alterados

- `multiplayer.html` — acesso à revisão na área administrativa.
- `server.mjs` — disponibilização controlada dos arquivos estáticos da revisão.
- `revisao-cartas.html` — interface de seleção e prévia.
- `revisao-cartas.css` — layout da revisão aproveitando o CSS do jogo.
- `revisao-cartas.js` — renderização segura e filtros.
- `src/card-text-rendering.js` — interpretação do texto para a página de revisão.
- `tests/rc5-card-review-page.test.mjs` — regressão da página de revisão.
- `docs/entregas/RC5-REVISAO-VISUAL-CARTAS.md` — este documento.

## Validação

`npm test`: 552 testes aprovados, 0 falhas. Revisão visual em navegador ainda deve ser homologada pelo usuário.
