# v1.44 — Validação integrada de partida

## Evidências automatizadas desta entrega

- Sala com seis jogadores: entrada, limite de seis participantes, início, sequência de seis turnos, passagem à rodada seguinte e bloqueio de ações fora do turno.
- Pausa, bloqueio de jogadas durante pausa, retomada e encerramento pelo professor sem vencedores fictícios.
- Persistência de seis participantes, estado pausado e jogador da vez após reinicializar o servidor; continuação do jogo com os tokens preservados.
- Tabuleiro Corrida dos Ratos de 32 casas e Alta Velocidade de 48 casas; três fechamentos financeiros favoráveis consecutivos desencadeiam a passagem de fase.
- Seis sonhos: todos podem ser realizados ao passar ou parar na posição indicada, desde que haja saldo suficiente. O débito ocorre apenas uma vez; sem saldo suficiente, não há vitória.
- Invariantes da carteira e do estado após as transições verificadas.

## Escopo e limites

O pacote tem 468 testes automatizados aprovados. Estes testes cobrem cenários representativos, não a matriz combinatória de todas as cartas, profissões, ativos, votos e decisões.

**Não foi homologada ainda uma partida manual e contínua, com seis pessoas reais, até o sonho de todos os participantes.** Nem foram completados os ensaios de balanceamento, carga, acessibilidade, segurança e publicação; esses itens permanecem para a v2.0.

## Aferição da v1.44

Aferição objetiva dos 8 critérios técnicos abaixo para esta etapa:

1. Até seis participantes — validado automaticamente.
2. Controle de turno e avanço de rodada — validado automaticamente.
3. Dois tabuleiros com dimensões oficiais — validado automaticamente.
4. Transição por três fechamentos consecutivos — validado automaticamente.
5. Realização dos seis sonhos com verificação de saldo — validada automaticamente.
6. Pausa e retomada — validadas automaticamente.
7. Persistência e reconexão após reinício — validadas automaticamente.
8. Encerramento e relatório docente — cobertos pela suíte anterior e pelos testes integrados de ciclo de sala.

**8/8 critérios técnicos cobertos por testes automatizados (100% de cobertura desses critérios)**. Esse número não representa homologação geral do produto ou validação manual de todos os cenários.
