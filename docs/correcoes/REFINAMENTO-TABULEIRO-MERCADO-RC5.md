# Refinamento do tabuleiro e Mercado — RC5

## Ajustes visuais

- Removidos do topo do painel os títulos redundantes “PARTIDA EM ANDAMENTO”, “Tabuleiro” e o selo “Corrida dos Ratos · 32 casas”. A situação e o nome do jogo já aparecem no cabeçalho principal.
- Mantido o elemento `boardCircuit` oculto para compatibilidade com a atualização dinâmica do circuito da Corrida dos Ratos e da Alta Velocidade.
- Mercado mantido na faixa das duas colunas da direita do tabuleiro 13 × 5, mas dimensionado segundo o próprio conteúdo, sem espaço lateral ocioso.
- Reduzidos os espaçamentos internos, a separação entre elementos e a altura do bloco.
- Preservados contadores de ativos, anúncios, ofertas, avisos e botão de abertura da modal.

## Escopo

Nenhuma alteração nas regras de cartas, finanças, multiplayer, mercado ou movimentação. Mantida a estrutura `docs/`.

## Validação

- Suíte automatizada e testes específicos do refinamento visual aprovados.
- A homologação em navegador real, incluindo tamanhos de tela distintos, continua recomendada.
