# Ajuste visual — Mercado compacto no tabuleiro 13 × 5

## Alteração

- O bloco **Mercado** foi deslocado da largura total do painel para as **duas colunas à direita** (decisões e finanças).
- Foram reduzidos margens internas, espaçamento entre elementos e dimensões do ícone e do botão.
- A coluna esquerda, dedicada ao dado e ao cronômetro, permanece livre abaixo do seu conteúdo.
- Não houve mudanças nas regras financeiras, no mercado secundário, nos modais, nas cartas nem nos turnos.

## Validação

- `node --check multiplayer.js` aprovado.
- `npm test --silent`: **495 testes aprovados**.
- Pendente: homologação visual com navegador em zoom 100% e diferentes dimensões de tela.
