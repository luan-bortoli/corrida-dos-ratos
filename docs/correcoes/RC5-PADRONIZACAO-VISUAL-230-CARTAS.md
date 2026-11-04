# RC5 — Padronização de apresentação das 230 cartas

## Objetivo

Unificar a leitura e a apresentação das cartas entre a janela do jogo e `revisao-cartas.html`, sem modificar o conteúdo original de `catalogo/Cartas.md`, a execução dos efeitos financeiros, os valores ou a contabilidade.

## Melhorias

1. **Parser compartilhado (`src/card-text-rendering.js`):** interpreta formatos de parágrafos Markdown, tabelas com barras verticais, linhas com tabulações, valores em linhas separadas e campos de informação em sequência. O jogo e a revisão passam a chamar o mesmo parser.
2. **Moeda e caracteres:** normalização de `R\$` para `R$`, sem gerar `RR$`, e remoção de escapes de pontuação apenas na exibição.
3. **Informações separadas:** preço, rendimento, liquidez, aquisição, requisito, decisão, consequência, risco, benefício e aprendizado exibidos em campos distintos quando presentes na fonte. Nenhum campo é inventado para completar dados ausentes.
4. **Títulos:** categorias intermediárias não substituem o título de cartas, e o rótulo de recompensa não vira título das perguntas.
5. **Educação financeira:** questão e alternativas mostradas uma vez; o jogo destaca em verde a resposta certa, em vermelho uma seleção incorreta e informa recompensa. Na revisão, a pessoa pode testar as alternativas sem alterar a partida.
6. **Apresentação visual:** tamanho e hierarquia tipográfica padronizados, conteúdo legível e ocupação da largura inteira quando houver apenas uma métrica.
7. **Textos específicos:** EV-012 usa “assinaturas” de modo consistente; DI-006 explicita a natureza da cobrança de 5% do salário de referência. A receita ou o lucro informado como referência **não é uma promessa de pagamento**, mantendo-se as regras de efetiva distribuição.

## Atenção — qualidade do texto-fonte

Na versão fornecida do catálogo, os identificadores **OE-006, OE-007, OE-008 e OE-009** retornam um parágrafo geral sobre condições complementares, em vez da descrição individual de cada carta. A prévia agora sinaliza esses registros como **incompletos**, sem inventar títulos, valores ou regras. É necessária conferência e eventual restauração do texto individual aprovado antes de homologá-los.

Os arquivos com os textos oficiais e as regras do motor não foram modificados neste pacote. Esta entrega padroniza a *apresentação*; conferir regras específicas e interações reais continua necessário na homologação manual.

## Instalação

Extraia o ZIP incremental diretamente na raiz do projeto, substituindo os arquivos. Preserve o `.env` e os arquivos em `.room-data/`. Reinicie o servidor e atualize o navegador com `Ctrl+F5`.

```bash
npm test
npm start
```

## Validação

- Catálogo de 230 identificadores percorrido automaticamente.
- Representantes dos 10 grupos (PO, GO, DI, MF, EV, EF, BE, GI, OE, FI) verificados.
- 556 testes automatizados aprovados.
- Conferência visual real no navegador ainda necessária, particularmente para as cartas com fontes heterogêneas e para os quatro textos individuais incompletos.
