# RC5 — Padronização de decisões e anúncios

## Interface das cartas

- Alternativas A–D de Educação Financeira em coluna única, com espaçamento vertical de 10 px e largura completa na modal.
- Botões de decisão centralizados e separados por 10 px; em telas pequenas podem ocupar a largura da modal.
- EV-012: apresentação e botões padronizados para **Cancelar assinaturas** e **Manter assinaturas**. O texto oficial arquivado em `catalogo/Cartas.md` e `src/approved-card-texts.json` permanece inalterado; a padronização do enunciado é apenas visual e a regra financeira é preservada.

## Mercado

- Em **Meus investimentos**, cada posição exibe quantidade total, anunciada e disponível para novas vendas.
- Quantidade disponível = quantidade possuída - soma das ofertas de venda abertas pelo jogador para o mesmo ativo.
- Quando não existem unidades livres, a ação muda para **Todas anunciadas** e fica desabilitada.
- Ao cancelar um anúncio ou comprar novas unidades, a disponibilidade é recalculada a partir do estado da sala.
- O servidor já impede anúncios acima da quantidade disponível e permanece como autoridade final.

## Validação

- `npm test`: **506 testes aprovados**; quatro novos testes de regressão.
- `node --check multiplayer.js` e `node --check src/life-decisions.js` sem erros.
- A aparência real e o clique em navegadores diferentes ainda dependem da homologação visual do usuário.

## Escopo

Nenhuma mudança no tabuleiro 13 × 5, no cabeçalho, na posição do Mercado ou nas regras financeiras.
