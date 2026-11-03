# Corrida dos Ratos — v1.44 (em desenvolvimento)

## Entrega integrada: acompanhamento da partida
- Salas: progresso com total de participantes, ativos, concluídos, vencedor e ordem de conclusão.
- Encerramento: distingue sonho realizado e encerramento antecipado pelo professor.
- Painel do professor e estudantes: indicadores de rodada, sonhos realizados e classificação.
- Relatórios JSON e CSV: participação e desempenho pedagógico extraídos do histórico efetivamente registrado.
- Integração sem mudanças nas regras de sorteio, turnos, crédito, empresas e sonhos da v1.43.

## Validação
- 463 testes automatizados aprovados.
- `node --check` do servidor, do multiplayer e do novo módulo.

## Percentual de conclusão
- v1.43 cartas: cobertura funcional inventariada 100% (fechamento anterior; não é homologação manual).
- v1.44 jogo completo: **não aferido**. Esta entrega avança no acompanhamento e nos relatórios, mas ainda não comprova jornada completa em navegador, acessibilidade, segurança de produção e conclusão de todos os relatórios planejados.

## Próximos passos dentro da v1.44
- Testes de ponta a ponta de partida/encerramento, reconexão e retomada após pausa.
- Melhorias de interfaces e tabuleiros para condução em sala.
- Relatórios pedagógicos finais e exportações.
- Corrigir falhas de integração identificadas nos testes, sem criar uma versão adicional por correção.
