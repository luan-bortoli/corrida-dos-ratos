# Corrida dos Ratos v2.0 RC3 — correção bloqueante do encerramento do turno

## Falha corrigida
A validação de eventos automáticos ignorava eventos de mercado global (por exemplo MF-005). A carta era aplicada no sorteio, mas a validação subsequente rejeitava o estado e o servidor respondia `Partida financeira inconsistente`, impedindo `Encerrar turno`.

## Implementação
`src/card-resolution.js` reconhece como resoluções automáticas os identificadores oficiais das tabelas GLOBAL_MARKET_EVENTS, GLOBAL_SECURITY_EVENTS e GLOBAL_INCOME_EVENTS e MF-009, preservando a rejeição a eventos desconhecidos. Partidas já gravadas com esse tipo de evento podem voltar a ser aceitas após reiniciar o servidor com RC3, sem alterar os dados da sala.

## Testes
`tests/market-turn-regression.test.mjs`: reprodução MF-005 com `finishTurn`, teste das demais cartas globais, proibição de resolução automática desconhecida.

## Iniciar
No diretório do projeto: `npm test`, depois defina `ADMIN_PASSWORD` e execute `npm start`. Feche qualquer instância antiga na porta 3000. Use o mesmo diretório de dados (`DATA_DIR`) para recuperar salas anteriores.

A homologação manual no navegador continua necessária.
