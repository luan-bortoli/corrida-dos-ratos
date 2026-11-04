# RC5 — Compatibilidade entre a tela administrativa e a revisão de cartas

## Sintoma
A abertura de sala pode mostrar tabuleiro vazio, painéis antigos e a mensagem `can't access property "disabled", $(...) is null`.

## Ajuste
- `multiplayer.js`: valida a existência dos campos de cadastro compartilhado antes de mudar `disabled`, evitando interromper a renderização da sala quando HTML e JS estão temporariamente dessincronizados.
- `multiplayer.html`: preserva o layout de duas colunas aprovado, cabeçalho administrativo, tabuleiro expandido e o link de revisão; acrescenta uma versão ao endereço do script para reduzir problemas com cache do navegador.
- Testes atualizados e teste novo verificam os elementos de integração da tela.

## Instalação
Extrair este ZIP na raiz do projeto, substituindo os arquivos, com servidor parado. Iniciar `npm start`, atualizar a página com `Ctrl+F5` e abrir novamente a sala. Não alterar/apagar `.env` nem os dados de partidas. Executar `npm test`.

## Limite da verificação
A suíte automatizada foi aprovada (553/553). A navegação completa em navegador com servidor local não foi executada neste ambiente por bloqueio de acesso do navegador local. Se a mensagem persistir, verificar versão dos arquivos e o primeiro erro no console (F12).
