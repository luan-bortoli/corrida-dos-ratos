# RC5 — Painel do Administrador em duas colunas

## Objetivo

Simplificar a tela administrativa do modo **Presencial — Tela compartilhada**, preservando o layout do jogo, as operações existentes e o motor financeiro.

## Alterações

- O tabuleiro permanece à esquerda e o cadastro presencial passa à coluna direita.
- O cabeçalho do tabuleiro exibe apenas os controles pertinentes ao estado da sala: **Iniciar + Encerrar sala** (aguardando), **Pausar + Encerrar sala** (jogando), **Retomar + Encerrar sala** (pausada) ou nenhum controle de partida (encerrada).
- **Iniciar** fica desabilitado com menos de dois participantes ativos.
- **Relatório PDF** aparece após o início da partida, inclusive quando ela estiver pausada ou encerrada. Abre a página de impressão, pela qual o navegador permite salvar em PDF.
- O controle de avanço por tempo esgotado só é visível quando o servidor informa que a autorização é necessária.
- O centro do tabuleiro administrativo exibe o status da sala e os nomes dos participantes, sem o dado nem o cronômetro.
- A lista detalhada **Participantes da sala** permanece recolhível abaixo do tabuleiro.
- **Sair** fica no cabeçalho geral, mantendo a confirmação para deixar a sala sem encerrá-la.
- A visão administrativa presencial não exibe os painéis de finanças individuais, mercado, limites técnicos nem próxima ação; também não exibe os controles técnicos de relatórios JSON, CSV e operação empresarial. Os endpoints e funcionalidades existentes não foram removidos.
- O acesso à área administrativa permanece protegido pelo fluxo existente de desbloqueio com senha quando o jogo estiver no modo de tela compartilhada.
- A modalidade multiplayer com dispositivos individuais permanece com seu fluxo existente.

## Instalação

Extraia o ZIP incremental diretamente na raiz do projeto, preservando os caminhos e substituindo somente os arquivos indicados. Reinicie o servidor, recarregue a página sem cache e execute `npm test`.

## Testes

542 testes automatizados aprovados, sendo 3 específicos para a estrutura administrativa. A homologação visual e funcional no navegador deve ser feita no computador do evento.

## Roteiro manual de homologação

1. Iniciar o modo presencial e criar sala: confirmar duas colunas, centro do tabuleiro sem dado e sem cronômetro; botão **Iniciar** desabilitado antes do segundo jogador.
2. Cadastrar 2 a 6 jogadores; confirmar que seus nomes aparecem dentro do tabuleiro e na lista recolhível abaixo.
3. Confirmar **Iniciar + Encerrar sala** e ausência de PDF antes do início.
4. Iniciar a sala; confirmar entrada no jogo compartilhado e alternância de turnos.
5. Voltar à área do Administrador com autenticação; confirmar **Pausar + Encerrar sala**, além do relatório PDF.
6. Pausar, voltar à área administrativa e confirmar **Retomar + Encerrar sala**.
7. Encerrar a sala e confirmar ausência dos controles de partida, mantendo relatório PDF.
8. Clicar em **Sair**, confirmar retorno às modalidades e possibilidade de criar outra sala sem reaproveitar jogadores.
9. Validar que a modalidade de dispositivos individuais continua funcionando.
