# RC5 — Acesso do modo presencial somente pelo professor

## Alteração

Na modalidade **Presencial — Tela compartilhada**, a tela de acesso deixa de exibir a seleção **Sou Administrador / Sou Jogador**. O acesso inicia diretamente nas opções do professor, **Criar sala** e **Acessar sala**. O professor cadastra os participantes da partida pela interface administrativa, com nome, profissão e sonho.

A modalidade **Multiplayer — Dispositivos individuais** continua apresentando a seleção de perfis e o login dos jogadores como antes.

## Arquivos alterados

- `multiplayer.html`: identificadores para a seção de seleção de perfis e o subtítulo.
- `multiplayer.js`: oculta a seleção de perfis apenas no modo `shared` e atualiza a orientação exibida.
- `tests/home-modes-rc5.test.mjs`: novo teste de regressão.

## Testes

- `npm test`: **533 aprovados, 0 falhas**.

A homologação visual em navegador real ainda deve ser executada no computador de demonstração.
