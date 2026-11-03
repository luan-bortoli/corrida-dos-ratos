# Corrida dos Ratos — v2.0 RC5

## Base

Parte da v2.0 RC4 com a correção GO-016 e a organização dos documentos, seguido do redesign do tabuleiro e das cartas em modais. Código, motor financeiro, catálogo oficial, regras de multiplayer e testes anteriores preservados.

## Layout da sala de estudante

- Dado e cronômetro permanecem no centro do tabuleiro.
- Número e nome da casa de destino, sonho, caixa e indicadores financeiros contextuais permanecem no tabuleiro.
- Cabeçalho simplificado: Corrida dos Ratos, código da sala e situação compreensível; removidos link para jogo individual, número de revisão e quadro "Sua sessão".
- Cartas e perguntas **não** abrem automaticamente: o jogador acompanha a jogada e escolhe "Ver carta/pergunta ... e decisões".
- O bloco redundante "Turno atual" foi removido de dentro da modal. Botões de escolha continuam associados à carta e a conclusão da jogada continua no tabuleiro.
- O catálogo permanente de empresas não é oferecido como vitrine ao estudante. Informações societárias continuam disponíveis quando há participações ou operações aplicáveis.
- Texto detalhado de despesas, inclusive DI-006, permanece explicativo e baseado nas regras reais.

## Sair e desistir

- **Sair da sala:** marca a sessão como ausente, sem excluir jogador, dados, investimentos ou histórico. Se era sua vez, conclui o turno sem efetivar compras opcionais e passa a vez. A mesma sessão pode ser retomada pelo botão "Retornar à minha partida" no mesmo navegador/aba; o sistema de recuperação já existente permanece disponível.
- **Desistir:** exige confirmação, marca o estudante como desistente, retira-o da ordem, preserva seus dados e impede novos comandos de jogo e recuperação de participação naquela sala. Não confundir com fechar a aba.
- **Queda de conexão:** o servidor monitora presença pelo acesso autenticado. Se não receber comunicação por pelo menos 15 segundos e o prazo de 120 segundos do turno expirar, conclui o turno ausente sem comprar investimentos em nome do jogador e passa a vez. Jogador conectado continua sujeito à regra de autorização do professor após o prazo.
- Caso uma despesa obrigatória empresarial exija escolha de empresa, o sistema escolhe deterministicamente uma empresa elegível, registra a despesa e conclui o turno; ações financeiras opcionais não são realizadas automaticamente.
- Quando todos desistirem, a sala termina sem registrar vencedores artificiais. O relatório docente mantém todos os participantes, distinguindo desistentes dos demais.

## Limitações e verificações manuais

- A detecção de presença é por comunicação periódica, não por uma conexão WebSocket. Pode haver atraso de até alguns segundos na identificação da ausência.
- O retorno direto após clicar "Sair" usa credenciais guardadas somente na sessão da aba. Para outro navegador ou sessão perdida, deve-se usar a recuperação existente; não há novo cadastro obrigatório.
- A desistência não liquida participações de maneira forçada nem apaga histórico, para não criar movimentações financeiras fictícias. Participações remanescentes permanecem registradas para auditoria.
- Realizar homologação manual no navegador, em telas desktop e mobile, com vários jogadores, cartas de cada tipo e desconexão real durante um turno.

## Testes

Executar `npm test`. Novos testes cobrem saída durante turno ativo, retorno, desistência, relatório pedagógico e avanço de ausente após o prazo, além das verificações de layout. Os demais testes do projeto continuam incluídos.
