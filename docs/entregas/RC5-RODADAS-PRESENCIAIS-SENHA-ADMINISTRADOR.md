# RC5 — Demonstração presencial por rodadas e autorização do Administrador

## Escopo

Somente **Presencial — Tela compartilhada**, em um computador. As demais modalidades não foram alteradas.

## Regra implementada

1. O Administrador cadastra de 2 a 6 jogadores e inicia a demonstração.
2. Cada rodada recebe **2 minutos por participante**: 2 jogadores = 4 minutos, 3 = 6 minutos, 4 = 8 minutos, 5 = 10 minutos e 6 = 12 minutos. É um relógio geral informativo, além do relógio individual de 120 segundos.
3. Cada participante joga uma vez. **Mesmo que o relógio chegue a zero, a partida não é encerrada nem o jogador é avançado automaticamente**. Todos devem concluir seu turno em **Encerrar turno**. Se todos concluírem antes de zero, a autorização também aparece imediatamente.
4. Após o último **Encerrar turno** da rodada, o servidor pausa a sala e impede ações até autorização. O modal obrigatório abre sobre o tabuleiro e não pode ser fechado pela tecla Escape.
5. O Administrador digita **a senha configurada em `ADMIN_PASSWORD`** e escolhe:
   - **Encerrar e mostrar ranking**: registra a classificação pela renda passiva mensal, seguida de cobertura das despesas e patrimônio líquido, e finaliza a partida.
   - **Liberar mais uma rodada**: retoma a partida com os mesmos jogadores e reinicia o relógio conforme a quantidade atual. Ao fim desta nova rodada, o modal de senha aparece novamente.
6. Senha inválida não libera a sala. A autorização ocorre no servidor, não somente no navegador. As tentativas de senha são limitadas.
7. A tela do Administrador mantém o relatório imprimível; o motivo do encerramento pelo ranking é registrado no relatório.

## Condições adicionais

- A vitória tradicional por sonho não encerra automaticamente a **demonstração presencial**; a decisão entre encerrar e jogar outra rodada continua exclusiva do Administrador.
- Não há mais uma escolha automática aos 20 minutos. O limite é calculado para **cada rodada**, de acordo com o total de participantes.
- O botão administrativo comum **Encerrar sala** permanece disponível somente antes do início. Durante a demonstração, a opção de encerrar aparece exclusivamente na modal ao fim de cada rodada.
- A tela de jogo, a leitura de cartas, os preços e as regras financeiras não foram redesenhados.

## Verificação funcional

- Suíte completa: **575 testes aprovados, 0 falhas** nesta alteração.
- Cobertura específica: cálculo de 2–6 jogadores; pausas; expiração do relógio sem interrupção; encerramento somente depois de todos os turnos; modal; autenticação da decisão; uma rodada adicional; ranking persistido; relatório; isolamento das outras modalidades.
- **Validação visual em navegador e teste presencial com estudantes ainda necessários**. Iniciar uma sala nova após instalar o pacote para não misturar estados persistidos da regra anterior.
