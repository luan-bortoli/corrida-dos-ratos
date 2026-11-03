# Corrida dos Ratos — Encerramento funcional da v1.43

## Critério de aceite desta etapa

A v1.43 é considerada encerrada **quanto à implementação do motor e à cobertura automatizada inventariada das 230 cartas**. Não se declara homologação manual de todas as alternativas ou segurança de produção. A v1.44 continuará o trabalho de integração de partidas completas; a v2.0 executará a homologação manual, balanceamento, segurança e publicação.

## Evidência

- **230/230 cartas** com texto aprovado, rota inventariada e pertencentes a baralhos sorteáveis.
- **0 cartas sem rota ou classificadas como parciais no inventário funcional**.
- **457/457 testes automatizados passaram**.
- A suíte já continha testes específicos da OE-004, OE-012, OE-014, OE-015 e OE-016, além de testes financeiros integrados, propostas e votação.
- Novos testes `tests/v143-closure.test.mjs` conferem inventário, texto aprovado, as cinco OE e ciclo de sorteio de todas as categorias.
- OE-012 admite empresa existente compatível (avaliação de R$ 300.000 e participação externa >=20%); a operação demonstrativa segue disponível.
- OE-014 permite refinanciamento do saldo preciso em centavos, sem criação de dinheiro.

## Limites e riscos para as próximas etapas

1. A classificação "rota" é inventário de implementação; **não comprova que todas as ramificações de todas as cartas tenham sido homologadas em interface**.
2. Receitas empresariais exigem lançamentos operacionais documentados pelo professor; lucros de referência não viram dinheiro automaticamente.
3. As restrições de elegibilidade da OE-012 dependem de uma empresa compatível com a oferta; não há negociação geral de participações sem condições.
4. Ciclos completos de partidas, multiplayer em tempo real, recuperação de sessão, experiência do professor, balanceamento e publicação exigem a v1.44 e a v2.0.

## Próximo marco

**v1.44 — Jogo completo:** testar integralmente uma partida, as duas pistas, sonhos, empresas, eventos, multiplayer e relatórios; corrigir bloqueios de integração antes da homologação da v2.0.
