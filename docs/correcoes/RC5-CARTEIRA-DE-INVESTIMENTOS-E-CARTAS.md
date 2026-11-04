# RC5 — Carteira de investimentos e clareza das cartas

## Alterações

A aba **Mercado → Meus investimentos** passa a reunir o patrimônio do jogador, sem criar uma carteira paralela nem alterar as regras financeiras:

- Pequenos negócios adquiridos (`game.assets`, origem `official_small_business`);
- Imóveis e equipamentos de locação;
- Estoques para revenda, com indicação de que o preço-alvo não é garantido;
- Empresas e outros ativos patrimoniais;
- Contratos ativos de renda fixa (`game.fixedIncome`);
- Ações, fundos e participações societárias existentes.

Os valores são apresentados como referências: valor de aquisição, renda declarada quando existente e situação contratual. **Não existe novo endpoint nem nova possibilidade de vender/resgatar**; operações continuam sujeitas às regras atuais.

### Cartas

Aplicações de renda fixa que não tenham descrição detalhada passam a mostrar o nome oficial e uma explicação objetiva sobre valores mínimos, máximos, incrementos e consulta das condições de resgate. Evita-se mostrar a mensagem genérica de descrição indisponível. As condições financeiras oficiais não foram alteradas.

## Arquivos

- `multiplayer.js`: carteira e texto de apoio;
- `styles.css`: cabeçalhos das categorias;
- `tests/portfolio-view-rc5.test.mjs`: testes adicionais;
- `docs/correcoes/RC5-CARTEIRA-DE-INVESTIMENTOS-E-CARTAS.md`: este registro.

## Instalação

Extraia o ZIP **diretamente na raiz do projeto**, mantendo a estrutura de diretórios. Confirme a substituição de `multiplayer.js` e `styles.css`. Execute `npm test` e depois `npm start`.

**Base de aplicação:** RC5 com correção da rolagem e validação da modal (536 testes).
