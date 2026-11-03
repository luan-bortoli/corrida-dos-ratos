# v2.0 RC2 — Relatório de correção de início de sala

- **Falha confirmada:** `server.mjs` autorizava um conjunto fixo e incompleto de módulos ES; o navegador não carregava `multiplayer.js` e suas dependências.
- **Consequência:** seletores de profissões e sonhos vazios; eventos de botão não registrados, impedindo criar sala.
- **Correção:** disponibilização de `src/*.js` e `src/*.json` com nomes restritos, sem permitir caminhos arbitrários; 404 para arquivos inexistentes.
- **Testes de regressão:** requisições HTTP percorrem a árvore de imports do jogo individual e do multiplayer; criação de sala autenticada; entrada de estudante com profissão 0 e sonho CAFE.
- **Resultado:** 471 testes automatizados passaram; nenhum teste falhou.
- **Distribuição:** o ZIP da RC2 contém **todos os arquivos da base RC1**, inclusive código das cartas, módulos de empresas, interfaces, testes e relatórios anteriores.
- **Limites:** a RC2 não representa homologação manual em sala ou autorização para publicação pública.
