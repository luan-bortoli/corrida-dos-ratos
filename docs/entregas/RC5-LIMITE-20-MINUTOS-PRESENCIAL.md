# RC5 — Demonstração presencial com limite de 20 minutos

## Escopo

Somente salas da modalidade **Presencial — Tela compartilhada** recebem um cronômetro geral de 20 minutos a partir de **Iniciar**. A duração é independente do cronômetro de 120 segundos do turno. O relógio **pausa** quando o Administrador pausa a partida e **retoma** de onde parou.

## Encerramento

Ao terminar o tempo, o servidor pausa a sala e pede uma decisão do Administrador. Se a carta atual ainda exigir conclusão, **não interrompe a decisão**: o tempo fica esgotado e a partida pausa ao término dessa jogada.

- **Encerrar e apurar:** encerra a sala, preserva os participantes, registra o ranking e identifica o vencedor **por renda passiva**, separadamente das vitórias por sonho.
- **Continuar partida:** retoma o turno restante e prossegue **sem novo encerramento obrigatório por tempo**. A vitória tradicional por realização do sonho continua possível; o Administrador ainda pode encerrar a sala manualmente.

## Classificação

1. Maior renda passiva periódica do estado financeiro individual (`financialSnapshot.passive`), excluindo salário.
2. Maior proporção entre renda passiva e despesas periódicas.
3. Maior patrimônio líquido ao custo registrado, já descontadas as obrigações refletidas no estado financeiro.
4. Empates residuais: ordem alfabética e identificador do jogador para desempate determinístico.

**Nota:** a apuração utiliza a renda passiva periódica registrada no estado do jogador, não projeta lucro empresarial ainda não apurado e não transforma rendimentos esperados em créditos fictícios. Dividendo eventual pago separadamente não é convertido automaticamente em renda mensal recorrente para esse ranking. Os desistentes ficam preservados no histórico da sala, mas não entram na classificação por tempo.

O ranking é persistido na sala e incluído na API de relatório (`presencialRanking`, `endingType`) e no relatório imprimível HTML usado para salvar PDF.

## Como testar

1. Entre no **Presencial — Tela compartilhada**, cadastre pelo menos 2 jogadores e inicie.
2. Verifique a contagem geral e a pausa/retomada na área do Administrador.
3. Quando o tempo acabar, confira as opções **Encerrar e apurar** e **Continuar partida**.
4. Se encerrar, verifique a classificação e o relatório PDF. Se continuar, confirme que as jogadas prosseguem e o cronômetro não impõe novo limite.
5. Confirme que o modo **Multiplayer — Dispositivos individuais** não recebeu esse limite.

A suíte inclui testes de tempo, pausa, tratamento de cartas pendentes, ranking, ações administrativas, relatório, persistência e isolamento de modalidade. O teste de integração reduz o limite apenas com `NODE_ENV=test` e `TEST_PRESENTIAL_MS`, nunca na partida normal.
