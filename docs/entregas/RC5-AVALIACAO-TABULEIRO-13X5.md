# RC5 — Protótipo funcional do tabuleiro retangular 13 × 5

Esta entrega é uma alternativa visual para homologação, baseada na RC5 com o Mercado integrado. Não substitui o layout quadrado aprovado até o usuário validar o resultado no navegador.

## Alterações

- Corrida dos Ratos (32 casas): distribuição do circuito 13 colunas × 5 linhas, mantendo ordem original de 0 a 31.
- Painel central horizontal: cronômetro e dado; identificação da casa e ações; sonho e finanças; Mercado em faixa compacta inferior.
- Removido o título duplicado de dentro do centro para o circuito de 32 casas.
- Controles e informações permanecem ligados à lógica existente; cartas seguem em modal e não abrem automaticamente.
- A Alta Velocidade (48 casas) mantém o formato 13 × 13.
- Para telas estreitas, o circuito permite rolagem horizontal da área do tabuleiro para não reduzir excessivamente a legibilidade. O centro do tabuleiro não tem rolagem interna na versão desktop.

## Validação

Executar `npm test` e validar visualmente em navegador com zoom de 100%, incluindo estado anterior ao lançamento, carta pendente, turno resolvido e Mercado aberto.
