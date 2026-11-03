# Corrida dos Ratos — v2.0 RC1: homologação técnica

## Resultado

A implementação está preparada como **candidata à versão 2.0**, não como implantação pública homologada.

- Testes unitários e integração automatizados: executar `npm test` e verificar o total no terminal.
- Motor de cartas: 230 identificadores rastreáveis, conforme inventário da v1.43; validação humana de todas as alternativas ainda não executada.
- Partida multiplayer: fluxo de até seis participantes, dois tabuleiros, sonhos e persistência cobertos por testes sintéticos; simulação presencial ainda pendente.
- Segurança nesta versão: limite de requisições nas tentativas de criação de sala e recuperação, cabeçalhos HTTP de segurança e endpoint `/health`.
- Persistência: arquivo JSON em diretório persistente, uma instância Node.js; **não adequado a múltiplas réplicas sem banco de dados e coordenação transacional**.

## Bloqueadores da publicação pública

1. Homologação em uma partida presencial integral com professor e seis estudantes, incluindo interrupções, encerramento e respostas às cartas.
2. Revisão de autorização, privacidade, acessibilidade e comportamento dos navegadores pretendidos; execução de testes de penetração e carga reais.
3. Autenticação docente institucional e segregação de turmas: `ADMIN_PASSWORD` única é apropriada apenas para laboratório controlado.
4. Persistência e backup operacional do diretório `DATA_DIR`; não usar hospedagem efêmera para armazenar salas.
5. Estudos de balanceamento em sessões reais: duração, probabilidade de independência, inadimplência e efeito das cartas; testes unitários não medem equilíbrio pedagógico.

## Checklist de homologação presencial

- Criar sala, registrar códigos de recuperação, convidar 2–6 jogadores e iniciar partida.
- Jogar ao menos uma partida até sonho realizado e outra até encerramento manual, validando a contabilidade e os relatórios.
- Simular perda de conexão de estudante e professor, recuperação, pausa e retomada após reinício.
- Testar oportunidades societárias, votação e negociação conjunta com contas diferentes.
- Conferir manualmente extratos, dividendos, reservas, obrigações e resultados pedagógicos.
- Validar o procedimento de exportação CSV, JSON e impressão para PDF.

**Decisão de release:** candidata de homologação técnica (RC1); não declarar 100% de homologação nem produção pública concluída.
