# Redesign de tabuleiro — RC4 (homologação)

## Alterações de interface

- O centro do tabuleiro apresenta jogador da vez, rodada, cronômetro visual de 120 segundos, dado interativo e resultado da última jogada.
- As ações **Lançar dado** e **Concluir turno** estão no centro do tabuleiro; as mesmas ações continuam usando os endpoints existentes do servidor.
- O botão de conclusão é exibido somente para o jogador da vez, quando houver evento/carta pendente. As demais ações contextuais de cartas permanecem acessíveis no painel de decisões.
- O painel de decisões só é exibido ao estudante quando há carta/evento pendente e é mantido para o professor.
- A lista de participantes foi transformada em seção expansível, inicialmente recolhida.
- Removidas informações repetidas no centro do tabuleiro e no resumo do turno.
- O dado mostra a face correspondente ao último resultado registrado pelo servidor; a animação é apenas visual e não altera o sorteio.
- Há estilos responsivos e respeito a `prefers-reduced-motion`.

## Regras preservadas

- Não foi implementada passagem automática de turno: a transição continua exigindo conclusão explícita ou autorização do professor após o prazo, conforme o servidor da RC4.
- O cronômetro visual apresenta o tempo fornecido pelo servidor, sem alterar o prazo.
- Não foram alteradas regras financeiras, cartas, empresas, movimentos, segurança ou lógica de multiplayer.

## Validação

- `node --check multiplayer.js`: aprovado.
- `npm test`: 481 testes aprovados.
- A validação visual e de usabilidade em navegador ainda precisa ser realizada na homologação.
