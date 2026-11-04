# RC5 — Modo Presencial: Tela compartilhada

## Objetivo

Permitir a demonstração da Corrida dos Ratos no Mundo SENAI, com 2 a 6 participantes compartilhando um único computador, **sem necessidade de conexão à internet** durante a execução local, preservando o multiplayer para dispositivos individuais.

## Como iniciar

1. Instalar Node.js 20+ no computador antes do evento.
2. Abrir um terminal na raiz do projeto, configurar uma senha com pelo menos 10 caracteres e iniciar `npm start`. Exemplo no PowerShell:
   ```powershell
   $env:ADMIN_PASSWORD="CrieUmaSenhaForte123!"
   npm start
   ```
3. Abrir `http://localhost:3000/multiplayer.html` no navegador do mesmo computador (porta padrão; respeita `PORT` se alterada).
4. Selecionar **Sou Administrador** → **Criar sala** → **Presencial — Tela compartilhada** e fornecer a senha.
5. Na área **Professor**, cadastrar de 2 a 6 jogadores com nome, profissão e sonho. Clicar em **Iniciar**.
6. A aplicação abre a área **Jogo**, exibindo os dados financeiros do jogador da vez e alternando automaticamente após **Encerrar turno**.
7. Na navegação superior, selecionar **Professor** para consultar os controles administrativos. O retorno à área do professor solicita sua senha.
8. Para responder convites de investimentos conjuntos de um jogador que não está com a vez, utilizar **Consultar jogador** na visão de jogo; lançar o dado continua restrito ao jogador do turno.

## Implementação

- Salas incluem `mode: "shared" | "individual"`; ausência do campo equivale ao modo individual, mantendo compatibilidade com salas existentes.
- No modo presencial, o cadastro é feito pelo professor, antes do início da partida. O endpoint de ingresso individual é bloqueado para essas salas.
- As requisições da tela compartilhada usam o token administrativo já autorizado; o servidor associa automaticamente as operações de turno ao jogador ativo.
- A visão **Jogo** retorna os dados privados somente do participante selecionado. A visão **Professor** mantém os controles e relatórios administrativos.
- Respostas a convites conjuntos podem indicar um jogador cadastrado no modo presencial; o motor financeiro existente valida a operação.
- O modo presencial não depende do indicador de conectividade de cada jogador para avançar os turnos; continuam disponíveis pausa, retomada, autorização de avanço e encerramento.
- Os dados da sala continuam persistidos em `.room-data/`; essa pasta é excluída do ZIP distribuído.

## Segurança e limites

- A área do professor solicita a senha para retornar da visualização dos jogadores. Como o navegador utiliza o token administrativo numa sessão local compartilhada, **a senha de retorno é uma proteção de interface, não um isolamento forte contra alguém com acesso técnico ao navegador**. Recomenda-se que o docente controle o computador durante a demonstração.
- A execução offline é local (`localhost`), mas é necessário preparar e testar o computador, Node.js e o pacote antes do evento. Não abrir o arquivo HTML diretamente como `file://`.
- O modo individual existente continua inalterado.
- A homologação manual com interface gráfica e participantes reais é recomendada antes do evento. Nesta entrega, o ambiente de navegador headless do teste tentou abrir o endereço local, mas bloqueou o acesso por política do ambiente (`ERR_BLOCKED_BY_ADMINISTRATOR`); a validação HTTP/servidor passou.

## Validação automatizada

- 525 testes anteriores preservados.
- 2 novos testes automatizados para modo presencial: cadastro e permissões, início, alternância de turnos, visualização do jogador ativo, pausa, retomada, encerramento, persistência e presença dos controles na interface.
- Resultado: **527 testes aprovados, 0 falhas**.
