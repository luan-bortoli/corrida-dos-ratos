# RC5 — Tela inicial de modalidades e nova partida

## Navegação

- `/` e `/index.html`: tela de seleção com três modalidades.
- `/multiplayer.html?mode=shared`: login com modalidade presencial pré-selecionada; o professor cria a sala e cadastra até seis participantes.
- `/multiplayer.html?mode=individual`: login com modalidade multiplayer de dispositivos individuais pré-selecionada; o professor cria a sala e os jogadores entram pelo código.
- `/individual.html`: jogo individual local existente, agora acessado por uma rota exclusiva.

A seleção feita na página inicial prevalece na criação da sala, sem exigir que o professor escolha novamente. Quem abrir diretamente `/multiplayer.html` ainda pode selecionar o modo no formulário, por compatibilidade.

## Sair da área do professor e criar outra partida

No painel **Controles do professor**, o botão **Sair e escolher outra modalidade** solicita confirmação, remove a sessão ativa do navegador e retorna à página inicial. A sala anterior e seu histórico **não são excluídos nem encerrados automaticamente**. O professor poderá criar nova sala para outra turma, com participantes diferentes. Para encerrar a sala anterior, utilize **Encerrar sala** antes de sair.

## Execução offline

1. Instale Node.js compatível com `--env-file-if-exists` (Node.js 22.9+ recomendado).
2. Copie `.env.example` para `.env` e defina uma senha administrativa com pelo menos 10 caracteres.
3. Execute `npm start`.
4. Abra `http://localhost:3000/`.

O navegador e o servidor podem funcionar no mesmo computador sem internet, após a instalação das dependências necessárias e sem recursos externos. Nunca inclua uma senha real em ZIP público ou commit.

## Verificação

Execute `npm test` para conferir regressão e a navegação das modalidades. A homologação visual no navegador local continua recomendada.
