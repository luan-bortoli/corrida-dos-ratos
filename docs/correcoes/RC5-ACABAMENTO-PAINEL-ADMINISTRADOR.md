# RC5 — Acabamento da tela do Administrador

- Retirada a faixa textual “Presencial — Tela compartilhada” da sala.
- Navegação **Jogo / Administrador** movida para o cabeçalho, também na vista de jogo compartilhada.
- Retirado o texto explicativo extenso ao lado de **Sair**.
- Campos de nome, profissão, sonho e botão de cadastro desabilitados ao atingir seis jogadores.
- Centro do tabuleiro mostra avatares com as mesmas cores dos marcadores das casas, acompanhados dos nomes completos.
- Siglas dos avatares usam as iniciais dos primeiros dois nomes (ex.: Maria José = MJ).
- Preservados os controles condicionais Iniciar, Pausar, Retomar e Encerrar sala, além do relatório PDF.

Sem mudanças nas regras financeiras, autenticação ou persistência. Após aplicar, executar `npm test` e verificar visualmente a tela presencial.
