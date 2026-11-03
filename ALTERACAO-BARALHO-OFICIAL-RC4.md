# Corrida dos Ratos v2.0 RC4 — Baralho oficial automático

## Mudança aplicada

- O botão **Ativar baralho oficial de Pequenas Oportunidades** não é exibido no multiplayer nem no jogo individual.
- Novas partidas iniciam com o baralho oficial de 25 cartas de Pequenas Oportunidades ativo, sem ação do estudante ou professor.
- Salas antigas com baralho demonstrativo são migradas automaticamente na jogada seguinte. Se houver uma carta demonstrativa pendente no momento da atualização, ela pode ser concluída antes do próximo sorteio oficial.
- Partidas individuais anteriores são migradas ao retomar o lançamento do dado. Também funciona para partidas individuais importadas ou salvas no navegador.
- A implementação mantém rotinas de leitura de dados demonstrativos em partidas antigas para evitar inutilizar estados de teste; elas não são oferecidas como opção na interface.

## Validação

A suíte completa passou com **478 de 478 testes**. Os novos testes confirmam a ativação de início, as cartas PO oficiais na primeira jogada e a ausência do botão manual nas interfaces. Sintaxe dos arquivos principais verificada.

## Escopo

Este pacote é cumulativo e contém as funções anteriores da v2.0 RC3. O problema já identificado da falta de opções na carta GO-016 ainda deverá ser corrigido junto à próxima revisão combinada do layout.

## Execução

Execute `npm test` e `npm start` na pasta extraída, definindo `ADMIN_PASSWORD` com pelo menos 10 caracteres. Acesse `http://localhost:3000/multiplayer.html`.
