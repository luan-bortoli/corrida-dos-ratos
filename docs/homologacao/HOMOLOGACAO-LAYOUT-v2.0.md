# Homologação visual — Corrida dos Ratos v2.0 RC2

## Alterações implementadas

- Tabuleiro visual em percurso perimetral: Corrida dos Ratos (32 casas) e Alta Velocidade (48 casas), identificando as posições dos estudantes com marcadores e legenda.
- Painel do turno com participante ativo, estado da decisão, casa e tipo de casa; ações de dado, recusa/encerramento e demais operações preservadas.
- Carta atual em um painel separado, organizado por título, descrição, dados financeiros, requisitos, consequência, risco e aprendizado, ocultando o texto bruto com marcação Markdown e mensagens internas de depuração.
- Motivo de saldo insuficiente explícito para aquisições à vista suportadas pelo motor de ofertas.
- Controles do professor em painel específico, exibido apenas na sessão docente.
- Finanças e sonho em card lateral. Empresas e mercado secundário em painel expansível, sem deslocar a área de jogo.
- Layout responsivo para celulares e tablets. Identificação visual atualizada para a candidata v2.0.

## Testes

- `npm test`: 473/473 aprovados, incluindo dois testes de regressão de interface.
- `node --check multiplayer.js`: aprovado.
- Recursos HTML, JavaScript e dados atendidos pelo servidor local.

## Roteiro de homologação manual

1. Criar uma nova sala com o professor.
2. Entrar com dois estudantes, selecionando profissões e sonhos diferentes.
3. Iniciar a partida; conferir posição e legenda dos peões.
4. Lançar o dado; confirmar se a casa e a carta mudaram no painel.
5. Verificar uma Pequena Oportunidade com compra possível e outra sem saldo suficiente; conferir mensagem de requisito.
6. Recusar ou concluir a carta e encerrar o turno; confirmar troca de jogador.
7. Abrir empresas e mercado secundário no painel expansível; confirmar ações existentes.
8. Conferir versão mobile e desktop e controles exclusivos do professor.

## Limitações

- Este pacote é para homologação visual. A renderização gráfica é uma representação do percurso dos tabuleiros; animações de deslocamento não foram adicionadas.
- O botão de recusar/encerrar usa o mecanismo de fim de turno já existente. Cartas com ações obrigatórias preservam as validações do servidor.
- A homologação humana em navegadores e dispositivos reais não foi realizada automaticamente; confira as interações no ambiente de teste antes da publicação.
- Este pacote é cumulativo e contém todo o projeto anterior, não apenas as alterações da interface.
