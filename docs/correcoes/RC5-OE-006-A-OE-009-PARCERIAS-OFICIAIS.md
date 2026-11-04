# Correção editorial — OE-006 a OE-009

## Origem

Transcrição individual do bloco **Parcerias estratégicas (OE-006 a OE-009)** em `catalogo/Cartas.md`, com a documentação integral fornecida pelo responsável pelo projeto.

## Cartas

| Carta | Modalidade | Custo total | Efeito ou renda de referência |
|---|---|---:|---|
| OE-006 — Parceria de Distribuição | Expansão empresarial | R$ 15.000 | +12% no lucro distribuível elegível após formalização |
| OE-007 — Sociedade em Projeto Imobiliário | Compra conjunta | R$ 120.000 | R$ 900 por fechamento, referência total |
| OE-008 — Aliança de Empresas de Tecnologia | Expansão empresarial | R$ 30.000 | +18% no lucro distribuível elegível após aprovação |
| OE-009 — Parceria em Energia Renovável | Compra conjunta | R$ 180.000 | R$ 1.500 por fechamento, referência total |

## Implementação desta entrega

- `src/approved-card-texts.json`: cada carta passa a possuir o texto individual aprovado, com narrativa, condições, decisão, efeito, risco e aprendizado; não utiliza mais o mesmo parágrafo genérico.
- `src/card-text-rendering.js`: reconhece a categoria **Parcerias estratégicas** e o campo separado **Participação de investidores**. A mesma interpretação alimenta a página de revisão e a interface do jogo.
- Testes de catalogação e comparação dos valores documentados com as regras financeiras existentes.
- Os demais textos e as regras financeiras não foram alterados.

## Verificação funcional e limite atual

- Para OE-006 e OE-008, o módulo `corporate-expansions.js` admite expansões com os valores e percentuais oficiais; o investimento é realizado pelo **caixa da empresa**, e a melhoria financeira depende do momento e das receitas verificadas, sem inventar lucro.
- Para OE-007 e OE-009, `joint-investments.js` exige **aportes integrais, ao menos dois participantes e saldo válido no momento da liquidação**; convidados não são debitados no convite.
- **Limitação importante:** a implementação de compras conjuntas atual identifica convidados entre `room.players` (estudantes); participação de investidores fictícios mencionada na documentação **não está demonstrada nessa rota**. Da mesma forma, a entrada de novos financiadores com cessão negociada de quotas em OE-006/OE-008 não foi homologada como fluxo completo. Esta entrega corrige o conteúdo e sua interpretação, mas **não declara esses recursos societários adicionais concluídos**.
- As ações concretas disponíveis na partida dependem dos requisitos reais do motor e do estado da sala.

## Testes

Executar `npm test` após extrair o patch. A revisão visual deve incluir as quatro cartas na página `revisao-cartas.html` e uma homologação funcional com participantes elegíveis no jogo real.
