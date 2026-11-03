# RC5 — Mensagens contextuais nas cartas

## Objetivo

Eliminar a orientação genérica “Confira as condições da carta. Se houver opções de decisão...” e informar a situação real da carta, sem modificar o texto oficial do catálogo, o estado do jogo ou seus efeitos financeiros.

## Comportamentos

- **Cartas automáticas**: informar o resultado da aplicação quando o registro da partida indicar resolução `automatic`. Para despesas pessoais com cotação disponível, exibir o percentual, o valor em reais e a possibilidade de pendência; para a MF-014, informar a redução de cotação e a exposição da carteira.
- **Perguntas pendentes**: instruir a selecionar uma alternativa. Quando já respondidas, preservar a informação de gabarito/recompensa no próprio painel, sem duplicar avisos.
- **Cartas com opções**: instruir o jogador a escolher entre os botões realmente disponíveis.
- **Decisões concluídas**: mostrar confirmação contextual por natureza da operação (compra, proposta, recusa, renegociação ou filantropia). Para decisões de vida com resultado já apresentado, evitar repetir a mensagem.
- **Cartas pendentes sem opção**: não afirmar que o efeito foi aplicado; explicar que não há decisão disponível e orientar a concluir o turno quando permitido.
- **Aprendizado e abrangência**: preservar a separação já aprovada entre ensinamentos e escopo Global/Individual.

## Arquivos modificados

- `src/card-presentation.js` — resolução e mensagem contextual.
- `multiplayer.js` — aplicação das mensagens na modal a partir dos eventos e controles existentes.
- `tests/automatic-card-presentation.test.mjs` — atualização de teste de integração.
- `tests/card-status-contextual.test.mjs` — novos testes de regressão.

## Verificação

- `npm test`: 519/519 aprovados.
- `node --check multiplayer.js`: aprovado.

A homologação visual e funcional com jogadores no navegador permanece necessária.
