# RC5 — Correção do cabeçalho e expansão do tabuleiro administrativo

## Objetivo

Corrigir o desalinhamento do botão **Sair** no cabeçalho e eliminar a coluna vazia ao lado do tabuleiro na tela **Administrador** da modalidade **Presencial — Tela compartilhada**, após o início da partida.

## Mudanças

- O cabeçalho administrativo aplica estilos próprios ao grupo **Jogo**, **Administrador** e **Sair**, removendo as margens e a borda superior que faziam o botão de saída ocupar outra linha. Em larguras menores, o cabeçalho pode quebrar de forma responsiva.
- Na preparação (`lobby`), o tabuleiro fica à esquerda e o formulário de cadastro permanece à direita.
- Nos estados `playing`, `paused` e `finished`, a área lateral de cadastro é ocultada e o tabuleiro administrativo utiliza a largura disponível.
- A opção **Sair** continua exigindo confirmação e retorna à seleção de modalidades, sem encerrar automaticamente a sala.
- Os controles **Iniciar / Pausar / Retomar / Encerrar sala / Relatório PDF** permanecem sujeitos ao estado da sala.
- Não há alterações no motor financeiro, no cadastro de jogadores, nas cartas nem no servidor.

## Arquivos

- `multiplayer.js` — classe de layout e de cabeçalho derivadas do estado da sala.
- `styles.css` — alinhamento do botão e expansão responsiva da grade.
- `tests/shared-admin-expand-header-rc5.test.mjs` — novos testes de regressão.

## Validação

Executar `npm test` na raiz do projeto. Resultado nesta entrega: **548 testes aprovados**, **0 falhas**.

Para homologação visual: criar uma sala presencial, cadastrar jogadores, verificar o cabeçalho, iniciar, voltar à área Administrador, pausar e retomar. Conferir que o tabuleiro ocupa a largura inteira e que **Sair** retorna à tela de modalidades após confirmação.
