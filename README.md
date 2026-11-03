## v2.0 RC2 — correção crítica de início de partida e pacote cumulativo (02/11/2026)

Esta é uma **entrega completa e cumulativa**: contém o projeto inteiro e todas as implementações anteriores (cartas, modo individual, multiplayer, financiamentos, empresas, tabuleiros, relatórios e segurança); não é um patch de arquivos avulsos.

**Correção principal:** a lista de arquivos estáticos permitidos no `server.mjs` ficou desatualizada após a integração das cartas e empresas. Por isso, o navegador recebia erro ao importar módulos usados pelo `multiplayer.js` e a interface não iniciava: profissões e sonhos permaneciam vazios, e os botões não respondiam. O servidor agora disponibiliza os módulos JavaScript e dados JSON do diretório `src/` pela mesma origem, mantendo restrição de extensão e nome, sem publicar arquivos de configuração do servidor. Arquivos inexistentes devolvem 404.

**Teste de regressão:** `tests/browser-bootstrap.test.mjs` percorre as dependências de módulos servidas por HTTP e valida criação de sala e entrada de estudante com profissão e sonho. **471 testes automatizados aprovados.**

**Execução:** no terminal aberto dentro desta pasta, defina `ADMIN_PASSWORD` (mínimo de dez caracteres) e execute `npm start`. Acesse `http://localhost:3000/multiplayer.html` pelo navegador; não abra o HTML diretamente como arquivo (`file://`) e não publique somente os arquivos estáticos, pois a criação de salas exige o servidor Node.js. Para verificar os testes, execute `npm test`.

Esta versão ainda é candidata à publicação: testes com pessoas reais, carga, segurança externa e balanceamento continuam pendentes.

---

# Corrida dos Ratos — v2.0 RC1

**Candidata à homologação técnica, ainda não aprovada para publicação pública.**

Veja `RELATORIO-HOMOLOGACAO-v2.0.md` e `IMPLANTACAO-v2.0.md` para critérios, limitações e execução.

## v1.43 — continuação integrada (em desenvolvimento)

- **GI-001–GI-018:** ofertas oficiais de Grandes Investimentos com aquisição à vista, análise de financiamento conforme entrada mínima aprovada, registro de ativos e contratos em centavos. As dez primeiras cartas representam imóveis ou propriedade; as oito últimas representam empresas. Os lucros indicados para empresas são de referência e **não** geram dividendos automáticos enquanto não houver resultado operacional apurado.
- **FI-001–FI-005:** três faixas por projeto e recusa voluntária. Validação de saldo, débito único, histórico separado de impacto social *simulado*, sem aumento de renda, patrimônio ou pontos financeiros. Fluxos nos modos individual e multiplayer.
- **Validação:** 327 testes automatizados passaram; a auditoria completa das 230 cartas permanece pendente.

**Limitações importantes:** GI-019–GI-025, OE-001–OE-020 e demais cartas pendentes não foram concluídas; a integração operacional das empresas GI-011–GI-018 ao livro empresarial também permanece para a v1.43. Não divulgar esta versão parcial como todas as 230 cartas implementadas.

## v1.43 — continuação: Filantropia funcional (integração parcial)

As cartas FI-001 a FI-005 agora permitem três faixas de contribuição e recusa, nos modos individual e multiplayer. O sistema exige caixa disponível, debita uma única vez o valor escolhido e registra o impacto **simulado** no campo `socialImpact`, separado de investimentos, renda passiva e patrimônio. A operação fica identificada no extrato pelo tipo `philanthropy` e só pode ser executada uma vez por ocorrência. Não há retorno financeiro, benefício garantido ou doação real.

**A v1.43 ainda não está concluída:** GI e OE, participação societária adicional, revendas e outras cartas ainda exigem implementação e testes por identificador. Esta continuação não deve ser anunciada como conclusão das 230 cartas. Foram executados 307 testes automatizados com sucesso.

# Atualização v1.41 — Contabilidade empresarial e seleção de empresa

- Despesas DI-022, DI-025, DI-029, DI-031 e DI-034: quando o estudante possui participações em duas ou mais empresas compartilhadas, deve escolher explicitamente qual empresa receberá a cobrança. A API valida a titularidade e impede selecionar empresas de terceiros. Com uma empresa elegível, o processamento permanece automático; sem empresa elegível, não há cobrança.
- A escolha está disponível no painel multiplayer. O servidor impede encerrar ou avançar o turno enquanto a escolha estiver pendente.
- No fechamento coletivo das rodadas 9, 18, 27 etc., o caixa empresarial disponível quita obrigações `pendingExpenses` antes de qualquer distribuição. Pagamentos parciais preservam a parte restante. A quitação entra no livro operacional como `settlement`, não como segunda despesa. O fechamento repetido não cobra novamente.
- A separação entre caixa pessoal e empresarial continua obrigatória; nenhum sócio é debitado automaticamente.
- **Ainda pendente:** incorporar à mesma contabilidade as empresas de aquisição integral GO-009 a GO-015, atualmente representadas como ativos pessoais com lucro inicial de referência. Também não existe geração automática de receitas empresariais verificadas: sem receita comprovada, não há dividendos extraordinários. Os valores monetários das empresas compartilhadas continuam em reais inteiros.
- Sem partidas reais em produção, a compatibilidade com dados legados não condiciona futuras simplificações, mas os testes existentes foram preservados nesta versão.

# Corrida dos Ratos v1.40 — despesas empresariais condicionais

Novas cartas oficiais: DI-022 (R$ 1.500), DI-025 (R$ 900), DI-029 (R$ 1.800), DI-031 (R$ 1.100) e DI-034 (R$ 1.000).

No multiplayer, a ocorrência é aplicada à primeira empresa compartilhada em que o estudante possui participação. O caixa do estudante **não é debitado**. Se a empresa não tiver dinheiro suficiente, a diferença é registrada em `pendingExpenses`, e o resultado disponível para distribuição é reduzido pelo valor completo da despesa. Sem empresa elegível, a ocorrência fica não aplicável.

**Limitações:** a seleção da empresa é determinística, não uma escolha do aluno; a quitação das obrigações empresariais pendentes ainda não está integrada ao fechamento automático. Empresas integrais adquiridas pelas cartas GO-009 a GO-015 não usam esse mesmo caixa compartilhado e ainda não são elegíveis. O mecanismo legado contabiliza em reais inteiros. A integração de todas as 230 cartas e a homologação geral continuam pendentes.

Execução: `ADMIN_PASSWORD=senha-segura npm start` e `npm test`.

---

# Corrida dos Ratos v1.39 — Despesas condicionais de ativos

**Novo nesta versão:** DI-021, DI-024 e DI-027 (Alta Velocidade) aplicam despesas fixas apenas quando o estudante possui o tipo de ativo previsto no catálogo. Sem ativo elegível, a ocorrência é registrada como não aplicável, sem novo sorteio. Pagamento parcial e obrigação residual são registrados em centavos. A cobrança é única por ocorrência, mesmo com vários ativos.

**Limitações:** despesas corporativas DI-022, DI-025, DI-029, DI-031 e DI-034 ainda dependem de apuração empresarial; outros efeitos das 230 cartas continuam em desenvolvimento. Contabilidade inteiramente em centavos também pendente.

Para executar: `ADMIN_PASSWORD=senha-com-10-caracteres npm start`. Testes: `npm test`.

---

# Corrida dos Ratos — v1.38

**Nova etapa:** obrigações pessoais pendentes são mantidas em `arrearsLivingCents` (centavos inteiros). O campo `arrearsLiving` permanece como projeção arredondada para relatórios e APIs legadas. Despesas oficiais proporcionais utilizam todo o saldo disponível, inclusive centavos, e fechamentos liquidam pendências em centavos sem descartar frações.

**Limites:** demais obrigações, apuração empresarial e parte dos extratos ainda dependem de representações em reais; não é a migração financeira integral. Nenhum efeito de carta adicional foi implementado nesta versão. Não há necessidade de migração de partidas reais, conforme definido para este desenvolvimento.

**Testes:** `npm test`. **Execução:** `ADMIN_PASSWORD` com pelo menos 10 caracteres e `npm start`.

---

## v1.37 — Dívida inicial em centavos e simplificação pré-lançamento

**Premissa:** não existem partidas reais que precisam de migração; o projeto ainda está em desenvolvimento. Novas partidas nascem com `initialDebtCents`, `initialInstallmentCents` e `initialArrearsCents`. Os juros de 1% da dívida inicial passam a ser calculados sobre centavos exatos e cobrados pela carteira consolidada. Os campos antigos em reais permanecem como projeções de leitura para módulos ainda não migrados, não como fonte independente de valores.

**Mudança intencional de arredondamento:** um saldo de R$ 3.030,00 acumula R$ 30,30 de juros e vira R$ 3.060,30; o campo legado de exibição `debt` representa o teto em reais (3061), e não R$ 3.060,00. Testes antigos baseados exclusivamente no arredondamento em reais foram atualizados.

**Ainda pendente:** cálculo fracionário integral de despesas recorrentes, renda empresarial, distribuições, custos e relatórios; unificação do extrato de todas as operações; execução dos efeitos faltantes das 230 cartas e homologação. Esta entrega NÃO declara a contabilidade inteira concluída. Foram executados 253 testes automatizados.

---

# v1.34 — Prévia de crédito em centavos

A nova função `quoteAmortizationCents` gera cronogramas informativos de 6, 12 e 24 fechamentos, aplicando juros fictícios de 1% por período e arredondamento por centavo. A cotação de crédito elegível acrescenta `centPreview` sem alterar a prestação nem os contratos legados. **Ainda não é uma migração operacional da dívida para centavos**; os pagamentos e obrigações antigos seguem as fórmulas anteriores.

## Versão 1.32 — operações de crédito pela carteira consolidada

- Contratação de crédito pessoal utiliza `creditCashCents`, conservando centavos do saldo.
- Amortização antecipada utiliza `debitCashCents` e verifica o saldo total consolidado, mantendo dívida e extrato na unidade legada (reais).
- Financiamento imobiliário registra o crédito e o pagamento da aquisição com a carteira em centavos, sem perder o complemento monetário.
- Quatro testes adicionais de conservação do saldo, capacidade de pagamento e aquisição financiada.
- **Limitação:** cálculos de juros, prestações e obrigações ainda permanecem em reais inteiros; esta entrega NÃO constitui migração completa da contabilidade. A auditoria do extrato ainda usa reais inteiros. Não utilizar em produção antes da homologação.

# Corrida dos Ratos v1.30 — Auditoria de caixa e contrapartes

Esta entrega amplia a reconciliação do mercado secundário sem alterar as regras aprovadas das cartas ou converter prematuramente o caixa legado.

- `src/cash-audit.js`: auditoria **somente leitura** dos negócios secundários, exigindo comprador e vendedor presentes, lançamentos simétricos com os mesmos centavos e saldos individuais válidos.
- `src/official-secondary.js`: cada nova transação recebe um `tradeId` persistido nos lançamentos de ambas as partes, garantindo rastreabilidade individual.
- `src/reports.js`: relatório JSON do professor passa a incluir `cashTransfersAudit` e esquema 3. O CSV mantém o formato anterior.
- `tests/cash-audit.test.mjs`: seis testes de sucesso, perda de contraparte, erro de centavos, participante ausente, imutabilidade e identificação inequívoca.

**Compatibilidade e limitações:** partidas salvas continuam com `cash` em reais inteiros e `secondaryCashCents` de 0 a 99. A auditoria pode sinalizar negociações antigas sem lançamentos em centavos; não altera dados para tentar corrigi-las. A migração integral de compras, despesas, créditos e empresas para centavos **não foi concluída**. Os demais efeitos das 230 cartas continuam em desenvolvimento.

**Executar:** Node.js 20+, configure `ADMIN_PASSWORD` com pelo menos dez caracteres, execute `npm start`; para testes execute `npm test`.

---

# Corrida dos Ratos v1.24 — Eventos globais de renda

Cinco cartas de Mercado Financeiro agora alteram globalmente rendimentos futuros dos ativos elegíveis: MF-019 (comércio −15%), MF-020 (logística +12%), MF-023 (aluguéis −20%), MF-025 (alimentação −15%) e MF-026 (serviços +10%). As alterações são registradas e aplicadas uma única vez por sorteio, sem modificar o dinheiro recebido anteriormente nem criar caixa.

**Limitações:** a classificação setorial nesta entrega contempla apenas os ativos oficiais cujo setor é inequívoco. Empresas compartilhadas com apuração contábil própria não recebem ajustes automáticos por esta via. O mercado secundário com cotação variável e a migração integral para centavos seguem pendentes.

# Corrida dos Ratos — v1.22

## Mercado financeiro global — ações e fundos

Integra onze cartas oficiais de mercado: MF-001, MF-002, MF-004, MF-005, MF-007, MF-008, MF-011, MF-013, MF-014, MF-015 e MF-021. O servidor processa cada ocorrência uma vez e atualiza somente as posições dos jogadores elegíveis, sem alterar seu caixa. Eventos de preços registram uma cotação patrimonial em centavos por unidade; eventos de dividendos ajustam o cupom futuro por unidade, que é liquidado nos fechamentos pessoais. Os dividendos já pagos não são recalculados.

**Limitações:** a cotação não constitui oferta de compra nem liquidez garantida; a negociação no mercado secundário ainda não está conectada. A versão individual ainda não executa esses eventos globais e as cotas não são negociáveis pelo preço atualizado. Não se trata de aplicação de todos os eventos MF e o catálogo completo continua em implementação.

# Corrida dos Ratos v1.21 — Eventos globais de patrimônio

**Novidade:** cinco cartas globais de Mercado Financeiro são agora aplicadas no servidor a todos os jogadores elegíveis de uma sala: MF-003 (+6% imóveis), MF-016 (+8% imóveis), MF-017 (−12% imóveis), MF-022 (+10% imóveis comerciais), MF-028 (+10% pequenos negócios). O efeito ocorre uma vez no sorteio e não cria renda recebida nem modifica custos históricos. Jogadores que já venceram são excluídos. Sem ativos elegíveis, registra-se a ocorrência sem novas cartas.

Os 4 eventos individuais de mercado da v1.20, as operações e o catálogo de 230 cartas permanecem. Os demais eventos globais, os impactos de dividendos/renda global e os mecanismos completos de revenda permanecem pendentes. Uso de desenvolvimento, não publicação pública.

## Executar

Node.js 20+. Configure `ADMIN_PASSWORD` com ao menos 10 caracteres e execute `npm start`. Testes: `npm test`.

## Notas de compatibilidade

Partidas anteriores podem ser carregadas. As ocorrências globais novas são armazenadas na sala em `marketOccurrences`. Sem saldo monetário novo: o efeito é patrimonial e não deve mudar o extrato do caixa. A atualização da avaliação dos ativos afeta as respectivas propriedades `marketValue`.

---

# Corrida dos Ratos — v1.20: Mercado Financeiro (primeira integração)

Esta versão preserva integralmente os textos de `catalogo/Cartas.md` e os módulos anteriores.

## Eventos individuais agora executáveis

| Carta | Regra oficial | Implementação |
| --- | --- | --- |
| MF-006 | +10% na renda dos equipamentos de locação do jogador | Altera `passive` do ativo elegível; próximo fechamento usa o novo valor |
| MF-010 | -10% no preço de equipamentos para locação do jogador | Altera `marketValue` sem movimentar caixa nem renda |
| MF-012 | -15% na renda de aluguel de imóveis elegíveis do jogador | Altera `passive` de imóveis alugados do catálogo já implementados |
| MF-027 | -15% no valor de equipamentos de locação e máquinas de pequenos negócios do jogador | Altera `marketValue` dos ativos elegíveis conhecidos |

Aplicação automática no sorteio da carta MF, com registro no histórico e resolução. Se não houver ativo elegível, a ocorrência é concluída como não aplicável, sem novo sorteio. Múltiplos eventos incidem sobre os valores correntes. Preços patrimoniais não são receitas nem renda passiva. Nenhuma venda ou crédito automático é criado.

**Limitações:** os outros 26 eventos MF ainda não executam efeitos automáticos, principalmente os eventos globais e setoriais. `marketValue` é apenas o valor avaliado do ativo, não uma cotação negociável nem promessa de comprador. Ajustes de renda usam o arredondamento legado em reais inteiros; a migração financeira integral para centavos ainda é pendente. Não há homologação completa de uso em sala.

**Testes:** `npm test` — 170 testes automatizados aprovados nesta entrega.

**Execução:** Node.js 20+, `ADMIN_PASSWORD` definido, `npm start`; acessar `/` ou `/multiplayer.html`.

---

# Corrida dos Ratos — v1.17

## Novidade: PO-018 a PO-025

- **PO-018–PO-021**: equipamentos de locação adquiridos à vista, renda líquida inicial por fechamento; manutenção extraordinária, variações de receita e revenda ainda não simuladas.
- **PO-022–PO-025**: estoque de compra e revenda adquirido à vista, sem renda passiva. O **preço-alvo é informativo** e não gera crédito automático. A venda futura ainda depende de um mecanismo de compradores.
- Disponível após ativar o baralho oficial de Pequenas Oportunidades, nas interfaces individual e multiplayer.
- Histórico, conciliação do caixa, validação dos eventos e bloqueio de compra duplicada preservados.
- **Não se alteraram textos, valores nem efeitos de cartas oficialmente aprovadas.**
- PO-008–PO-017 (renda fixa, ações e fundos) continuam sem resolução financeira completa.

## Executar

Node.js >= 20: `npm test` e `ADMIN_PASSWORD=uma-senha-de-teste-segura npm start`.

---

# Corrida dos Ratos — v1.15

## Nova entrega: sete empresas oficiais (GO-009 a GO-015)

A v1.15 adiciona a compra **à vista** das sete empresas integrais previstas no catálogo consolidado, com oferta contextual nas interfaces individual e multiplayer, confirmação do estudante, débito do caixa, patrimônio com titularidade e registro no extrato financeiro.

| Carta | Empresa | Valor à vista | Distribuição inicial de referência |
| --- | --- | ---: | ---: |
| GO-009 | Minimercado de Bairro | R$ 28.000 | R$ 420 |
| GO-010 | Lavanderia de Bairro | R$ 38.000 | R$ 520 |
| GO-011 | Pequena Padaria | R$ 55.000 | R$ 700 |
| GO-012 | Agência de Serviços Digitais | R$ 45.000 | R$ 600 |
| GO-013 | Oficina de Bicicletas | R$ 32.000 | R$ 450 |
| GO-014 | Empresa de Energia Solar | R$ 75.000 | R$ 900 |
| GO-015 | Distribuidora de Produtos | R$ 90.000 | R$ 1.050 |

**Limitações:** a renda inicial é processada como renda passiva de referência pelo motor pessoal legado, sem apuração de receitas e despesas operacionais reais. Portanto, não representa ainda o modelo empresarial definitivo, com reserva, distribuição apenas após lucro realizado e risco de redução de lucros. Financiamento empresarial, manutenção, negociação de empresas, ativos de PO e renda fixa oficiais ainda não estão implementados nesta entrega. O catálogo textual original permanece preservado. A compra de uma carta oficial só acontece na casa GO correspondente e com uma decisão explícita, sem débitos automáticos. A base e os testes de versões anteriores foram mantidos.

## Execução

Node.js 20 ou posterior:

```powershell
$env:ADMIN_PASSWORD="UmaSenhaDeTesteForte123!"
npm start
```

- Individual: http://localhost:3000/
- Multiplayer: http://localhost:3000/multiplayer.html
- Testes: `npm test` (138 aprovados nesta entrega)

---

# Corrida dos Ratos — v1.14

## Novidade: aquisição financiada de imóveis

As sete ofertas imobiliárias oficiais previamente disponíveis à vista (GO-001, GO-002, GO-003, GO-004, GO-006, GO-007 e GO-008) também admitem financiamento, com entrada mínima específica conforme `catalogo/Cartas.md`: 20%, 25% ou 30%. O estudante pode escolher uma entrada maior.

Utiliza a política de crédito existente: juros fictícios de 1% por fechamento, 6/12/24 fechamentos, comprometimento máximo de 30% da renda e margem mínima de 10% após despesas. Crédito não é concedido se houver obrigações vencidas. A aquisição só é concluída se passar na análise. A dívida é vinculada ao imóvel e suas parcelas seguem o fechamento financeiro pessoal. O extrato registra o empréstimo e a aquisição separadamente, com efeito líquido igual à entrada.

**Limitações:** não há simulação de vacância, impostos, garantia real, refinanciamento, alienação ou custos extraordinários. A análise segue o modelo educacional de empréstimo pessoal aprovado anteriormente, não um financiamento bancário real. A carta GO-005 continua sem compra por depender de ocupação. Os outros efeitos oficiais ainda não implementados permanecem pendentes. Valores internos em reais inteiros.

## Executar

Node.js 20+; definir `ADMIN_PASSWORD` (mínimo 10 caracteres); `npm start`; interface individual em `/` e multiplayer em `/multiplayer.html`. Testes: `npm test`.

# Corrida dos Ratos v1.11 — Catálogo consolidado e educação financeira

Esta entrega mantém os **230 textos oficiais** integralmente em `catalogo/Cartas.md` e `src/approved-card-texts.json`.

## Efeitos integrados

- As 30 perguntas EF-001 a EF-030 possuem quatro opções, resposta avaliada no servidor e uma única resposta por sorteio.
- Acerto na Corrida dos Ratos: pagamento de 5% do salário original da profissão.
- Acerto na Alta Velocidade: pagamento único de R$ 300.
- Erro ou não responder: sem recompensa; conclusão da pergunta registrada no histórico.
- Registro no livro-caixa pessoal, evitando duplicação no encerramento do turno.
- Seis benefícios automáticos: BE-001, BE-002, BE-004, BE-006, BE-008 e BE-010.
- Regras de DI-001 a DI-020, sete DI da Alta Velocidade e três EV já presentes em v1.10.

**Importante:** as 230 cartas têm texto integrado, mas 66 possuem mecanismo de efeito (30 EF + 30 DI/EV + 6 benefícios). As restantes exigem programação das operações correspondentes. Esta versão NÃO representa 230 efeitos concluídos.

## Executar

Node.js 20+: `ADMIN_PASSWORD='senha-forte-aqui' npm start` (PowerShell: `$env:ADMIN_PASSWORD='senha-forte-aqui'; npm start`). `npm test` executa a suíte.

**Limitações:** servidor para laboratório, não publicar diretamente na Internet; persistência em arquivo; saldo-base pessoal ainda em reais inteiros, com arredondamento de bonificações. O jogo não inclui todas as cartas executáveis.


## v1.12 — Decisões de Eventos da Vida
Nove cartas adicionais de decisão: EV-006, EV-011, EV-019, EV-021, EV-022, EV-026, EV-027, EV-029 e EV-030. Confirmação individual na interface local e multiplayer; registro de caixa ou orçamento recorrente somente após escolha; recusa sem efeitos; impede reaplicação da mesma ocorrência. Compras pessoais exigem recursos integrais, sem criar financiamento não previsto. Eventos ainda não modelados permanecem como reconhecimento sem efeito automático. Para as cartas de despesas recorrentes, a v1.12 utiliza o agregado de despesas pessoais; categorias detalhadas de lazer/moradia não foram implantadas.

## v1.13 — Aquisição de imóveis oficiais à vista

Implementado o fluxo de aquisição **à vista** para GO-001, GO-002, GO-003, GO-004, GO-006, GO-007 e GO-008, somente quando a carta sorteada corresponde à oferta. O fluxo exibe o custo e a renda inicial, exige saldo suficiente, registra um ativo individual, debita o caixa com lançamento no extrato e impede repetir a compra na mesma carta. GO-006 não gera renda passiva. Interface individual e multiplayer usam o mesmo motor e a rota autenticada `real-estate-buy`.

**Limitações deliberadas:** GO-005 (chalé de temporada) não tem distribuição automática porque a ocupação varia; financiamento de aquisição, análise de crédito vinculada ao imóvel, vacância, efeitos globais de mercado, custos extraordinários, revenda e rendimentos variáveis ainda não estão concluídos. Os valores de rendimentos representam a condição inicial do catálogo e não garantem continuidade sob eventos futuros. As empresas e demais oportunidades não são tratadas como se gerassem lucro automático. A parte financeira pessoal existente usa reais inteiros.

Para executar: `npm test` (127 testes automatizados) e `ADMIN_PASSWORD=senha-segura-com-mais-de-10-caracteres npm start`. A senha deve ser definida em variável de ambiente, não incluída em arquivos versionados. Não publicar esse protótipo como serviço aberto na internet.


## Versão 1.16 — Pequenos negócios oficiais

- Ativação explícita do baralho oficial de Pequenas Oportunidades (PO-001 a PO-025) fora de uma jogada pendente.
- As sete cartas PO-001 a PO-007 permitem compra à vista e recebimento inicial de renda por fechamento, com registro contábil e bloqueio de aquisições duplicadas na mesma carta.
- Cartas PO-008 a PO-025 continuam visíveis e sorteáveis, mas sem efeito financeiro até integração específica.
- Partidas antigas permanecem no baralho demonstrativo até ativação, preservando seus dados e o histórico de testes.
- Ainda faltam manutenção, vacância, mercado secundário e custos extraordinários desses negócios.

## v1.18 — Renda fixa oficial (PO-008 a PO-012)

- Cinco oportunidades do catálogo aprovadas, integradas às partidas individual e multiplayer por meio do baralho oficial de Pequenas Oportunidades (ativação fora de turno pendente).
- PO-008: aplicações de R$ 300 a R$ 3.000, incrementos de R$ 100, rendimento acumulado de 0,5% por fechamento e resgate pelo saldo atualizado fora de turno pendente.
- PO-009: aplicações de R$ 500 a R$ 4.000, incrementos de R$ 100, 0,7% por fechamento por 6 fechamentos; resgate antecipado com deságio de 2% sobre saldo atualizado.
- PO-010: aplicações de R$ 1.000 a R$ 5.000, incrementos de R$ 500; cupom de 0,55% do principal por fechamento, 12 fechamentos; revenda antecipada condicionada a comprador (ainda não implementada).
- PO-011: aplicações de R$ 800 a R$ 4.800, incrementos de R$ 400, rendimento acumulado de 0,8% por fechamento durante 12 fechamentos, sem resgate antecipado comum.
- PO-012: unidade de R$ 2.000, cupom de R$ 12 por fechamento e devolução do principal após 12 fechamentos; venda antecipada depende de comprador (ainda não implementada).
- Contratos individuais e lançamentos financeiros registrados no estado e no extrato; sem recompensas duplicadas.
- Cupom efetivamente pago é considerado renda passiva no fechamento; juros acumulados não contam para a independência financeira.
- Limitação técnica: o motor pessoal legado contabiliza em reais inteiros; frações inferiores a R$ 1 são arredondadas em cada fechamento. A migração universal para centavos continua pendente.
- As cinco cartas PO-013 a PO-017 (ações e fundos) ainda aguardam integração econômica completa com o mercado e a interface, inclusive preço oscilante e dividendos contingentes.
- As condições são fictícias e exclusivas do jogo, sem representar rentabilidades reais.
- Execute `npm test`: 154 testes automatizados aprovados nesta versão; a homologação manual permanece pendente.

## v1.19 — Ações e fundos oficiais (PO-013–PO-017)

As cinco cartas aprovadas possuem compra primária com quantidade limitada pela própria carta, pagamento à vista, registro de titularidade e lançamento no extrato. O teto de emissão é 10.000 unidades por instrumento; no servidor multiplayer a disponibilidade considera o total de carteiras dos estudantes da mesma sala. A verificação do estado individual impede carteiras com quantidades inválidas.

Os dividendos iniciais previstos são PO-013 R$ 0,20/ação, PO-014 R$ 0,60/cota, PO-015 R$ 0,00/ação, PO-016 R$ 0,24/cota e PO-017 R$ 0,10/ação. O valor distribuído é acumulado em centavos por fechamento e convertido em caixa inteiro somente quando completar R$ 1, mantendo o saldo fracionário para os próximos fechamentos. Dividendos efetivamente creditados contam como renda passiva do período. São valores iniciais do catálogo e não uma promessa de pagamentos futuros.

**Limitações explícitas:** as cinco cartas não possuem ainda venda integrada com contraparte real, variações dinâmicas de cotações, suspensão de dividendos por eventos de Mercado Financeiro, nem integração com o livro de ordens de `src/securities.js`. Não há comprador fictício ilimitado. O patrimônio e os dividendos são pessoais; não são negociáveis até a integração da interface de mercado e da liquidação. As demais 230 cartas permanecem com seus textos originais e as implementações anteriores preservadas.

Para executar: `npm test` e, com `ADMIN_PASSWORD` definido, `npm start`. Os 161 testes automatizados aprovados não substituem a homologação com estudantes reais.

## v1.23 — Cotações oficiais compartilhadas

- Mantém uma cotação de referência e um dividendo de referência **por instrumento e por sala** em `officialMarket`, atualizados pelos eventos MF globais.
- Os eventos incidem sobre a referência da sala mesmo que nenhuma pessoa possua o título naquele momento; novos investidores herdam a referência mais recente para avaliação e distribuição futura.
- A interface multiplayer apresenta a cotação e o dividendo global de referência.
- Valida previamente todos os titulares e os valores, antes de efetivar alterações globais.
- Preserva o histórico, preços de aquisição e saldo financeiro; nenhum evento global inventa liquidez ou transfere dinheiro.

**Limitação importante:** a compra primária segue o preço contratual original da carta; a referência global ainda não determina seu preço de liquidação. A negociação secundária, a reconciliação em centavos de todo o caixa e os demais eventos MF permanecem pendentes. O catálogo oficial foi preservado integralmente.


## v1.25 — Negociação secundária oficial

- As posições oficiais PO-013 a PO-017 podem ser anunciadas e negociadas entre estudantes da mesma sala durante o turno do participante que realiza a operação.
- Cotação utilizada: referência compartilhada vigente **na confirmação** (não no anúncio); as ofertas não fixam preço.
- Liquidez máxima agregada por instrumento por rodada: 10% da emissão para ações e 20% para fundos (10.000 unidades por instrumento). Operações parciais e cancelamento são aceitos.
- Não existe comprador automático; a aquisição exige outro estudante com caixa e saldo disponível.
- Por compatibilidade com o caixa e extrato existentes em **reais inteiros**, somente operações cujo valor total em centavos seja múltiplo de 100 podem ser concluídas. Tentativas com centavos fracionários são recusadas antes de modificar qualquer dado.
- O mercado secundário é exclusivo da modalidade multiplayer; a versão individual permanece sem negociação.
- **Pendente:** migração integral do caixa e extratos para centavos, ordens com preço fixo, reconciliação integral de emissão primária e secundária em carteira centralizada, testes de integração HTTP adicionais e homologação de produção.

## v1.26 — Prévia em centavos e auditoria da liquidação

- Novo `src/secondary-settlement.js` calcula preços exatos em centavos sem arredondar ou modificar carteiras.
- O mercado secundário utiliza essa conferência antes de liquidar transações.
- Auditoria somente leitura confere unidades, preço em centavos e o valor lançado em reais.
- A restrição da v1.25 permanece: operações cujo valor total não seja um número inteiro de reais são recusadas. **Esta versão NÃO migra o caixa geral para centavos e NÃO libera liquidações fracionárias.**
- Cinco testes adicionais verificam precisão, limites, insuficiência de saldo e divergências.

## v1.27 — Liquidação fracionária no mercado secundário

- O mercado secundário oficial agora liquida compras e vendas de ações e fundos por valores exatos em centavos, inclusive R$ 54,01, sem arredondar a negociação.
- A compatibilidade com a contabilidade preexistente, expressa em reais inteiros, é mantida pela propriedade `game.secondaryCashCents` (0–99), que representa os centavos de caixa ainda não incorporados ao campo inteiro `cash`.
- Para obter o saldo exato de um jogador, calcular `cash * 100 + (secondaryCashCents ?? 0)` em centavos. O extrato guarda `amount` como variação efetiva do componente inteiro de caixa e `amountCents` como movimentação exata do mercado secundário. A auditoria do livro-razão legado permanece válida, sem eliminar os centavos acumulados.
- As novas negociações registram `trade.amountCents` e, somente quando o valor é integral em reais, mantêm `trade.amount` para compatibilidade. Os negócios antigos continuam auditáveis.
- Limitação importante: compras, dívidas, rendimentos e demais regras pessoais/empresariais ainda operam em reais inteiros. A migração integral para centavos está pendente. Interfaces e relatórios legados podem mostrar somente o componente inteiro do caixa, não o saldo exato.
- Para conferência: `npm test` (212 testes).

## v1.28 — Saldo consolidado para exibição e relatórios

- Novo módulo `src/money-balance.js`: soma o saldo legado em reais e os centavos complementares do mercado secundário, usando inteiros em centavos e validando faixa e overflow.
- O saldo de caixa exibido nas interfaces individual e multiplayer inclui o complemento de centavos e é formatado com duas casas decimais.
- Relatórios JSON/CSV do professor passaram a incluir `cashCents` (total em centavos) e `cashFormatted` (valor em reais com duas casas), mantendo `cash` legado para compatibilidade. O esquema de relatório foi elevado para `schemaVersion: 2`.
- A validação do histórico aceita os eventos individuais MF-006, MF-010, MF-012 e MF-027 já existentes, inclusive sem efeito sobre ativos quando não aplicáveis.
- Limitação: esta **não é a migração integral da contabilidade**. O motor pessoal, o financiamento, os recebimentos recorrentes e parte das interfaces continuam utilizando inteiros em reais. O saldo complementar é conservado pelo mercado secundário, não disponibilizado automaticamente para outras operações.
- Testes: `npm test` — 216 testes passando.


## Entrega v1.30 — carteira monetária compartilhada

- `src/money-balance.js` agora centraliza débito, crédito, transferência e persistência de saldos em centavos, preservando os campos legados `cash` e `secondaryCashCents`.
- Compras oficiais de pequenos negócios, imóveis à vista, empresas, equipamentos, ações/fundos e assinaturas de renda fixa passam a validar o saldo **consolidado** e debitar pela mesma função centralizada.
- O mercado secundário agora utiliza a transferência atômica da carteira, sem duplicar cálculos de saldo.
- Compra com saldo complementar não perde centavos. **Lançamentos de extrato das compras legadas continuam registrados em reais inteiros**; só as transferências secundárias têm valor exato `amountCents`.
- Financiamentos, fechamento pessoal e empresarial, juros e outras obrigações seguem majoritariamente em reais inteiros e precisam de migração posterior.

## v1.32 — Carteira monetária nos fechamentos pessoais

- Salários e renda passiva do fechamento agora entram pela rotina centralizada `creditCashCents`.
- Pagamentos de despesas e prestações no fechamento utilizam `debitCashCents`, conservando o saldo complementar em centavos.
- Cupons e vencimentos de renda fixa e dividendos oficiais inteiros utilizam a mesma rotina de crédito.
- Valores de prestações, juros, obrigações e lançamentos legados **continuam calculados em reais inteiros**; o saldo complementar não é arredondado para pagar frações de obrigações.
- Não foi feita migração de schema de persistência: continuam os campos `cash` e `secondaryCashCents`; partidas antigas continuam compatíveis.
- O objetivo desta versão é **conservação monetária no fechamento**, não migração de todos os cálculos econômicos para centavos. Empresas, regras de financiamento, determinadas ações fora do fechamento e ajustes de mercado permanecem em revisão.
- Execute `npm test` para validar a suíte completa, incluindo `tests/closing-wallet.test.mjs`.


## v1.34 — Cobrança operacional de novos créditos em centavos

- Novos empréstimos pessoais passam a registrar `balanceCents`, `installmentCents`, `arrearsCents` e `originalCents` em centavos inteiros.
- Os fechamentos de novos contratos aplicam juros de 1% arredondados ao centavo e pagam parcelas utilizando o caixa consolidado, com `amountCents` no lançamento do extrato.
- Os campos legados `balance`, `installment` e `arrears` continuam disponíveis como visões arredondadas em reais para manter as interfaces e relatórios antigos.
- Contratos antigos sem esses campos permanecem no mecanismo anterior: não há migração automática, nem reescrita dos valores contratados.
- Amortizações antecipadas em reais inteiros também atualizam o saldo preciso dos novos contratos.
- **Limites:** a dívida inicial de cada profissão e os cálculos das demais obrigações ainda utilizam reais inteiros. A aquisição financiada de imóveis continua usando o contrato legado. As telas que consultam campos legados mostram valores inteiros arredondados para cima; o extrato de novas parcelas informa o valor exato em `amountCents`.

## v1.35 — Financiamento imobiliário operacional em centavos

- Novos contratos de financiamento das cartas GO-001–GO-004 e GO-006–GO-008 utilizam `originalCents`, `balanceCents`, `installmentCents` e `arrearsCents`.
- O fechamento e a amortização antecipada já utilizam a rotina operacional de cobrança em centavos dos empréstimos pessoais introduzida na v1.34.
- A cotação da entrada consulta o saldo monetário consolidado, sem ignorar centavos.
- Contratos antigos sem campos de centavos seguem seu cálculo original, sem conversão silenciosa.
- Testes específicos cobrem contratação, pagamento, amortização e compatibilidade histórica.

### Pendências financeiras não encerradas

**Esta versão não conclui a migração financeira integral.** Dívida inicial das profissões, parcelas/juros legados, obrigações de despesas recorrentes e determinadas operações e apurações empresariais ainda usam o modelo em reais inteiros. A contabilidade e os registros financeiros precisam ser reconciliados de ponta a ponta antes de considerar a migração concluída. As 230 cartas permanecem no catálogo; seus efeitos não estão todos implementados.


## Entrega v1.37 — integração monetária de eventos

- Cartas DI-001 a DI-020 e despesas pessoais proporcionais da Alta Velocidade usam a carteira consolidada na cobrança.
- Quando a despesa excede a disponibilidade, mantém-se o complemento de centavos na carteira e o saldo não pago em reais inteiros; não se perdem centavos nem se registra um lançamento fracionário incompatível com o extrato legado.
- Benefícios monetários e bonificações usam crédito centralizado, preservando os centavos anteriores.
- Decisões de Eventos da Vida usam débito/crédito centralizado e validam o saldo consolidado.
- Resgates de renda fixa, recompensas da educação financeira e realização dos sonhos usam a carteira centralizada.
- Quatro novos testes de integração foram acrescentados.

**Pendente:** migração completa das obrigações recorrentes e dos lançamentos do extrato para centavos; contabilidade empresarial; integração de todos os efeitos oficiais das cartas; homologação completa. Não é uma versão final para uso em produção.

## v1.42 — Contabilidade empresarial integrada

- As **sete empresas de aquisição integral** GO-009 a GO-015 passam a ter entidade contábil independente no multiplayer (`src/owned-companies.js`).
- As **duas participações empresariais** GO-016 e GO-017 permanecem no mesmo conjunto, totalizando **nove empresas/modelos disponíveis**, das quais sete são adquiridas integralmente.
- Uma compra oficial confirma a titularidade de 100%, cria conta empresarial distinta, separa o caixa pessoal do empresarial e desativa o pagamento direto da renda de referência no ativo do estudante.
- O preço de aquisição não entra como receita da empresa. O capital inicial operacional é zero; reserva mínima requerida é de R$ 1.000 ou duas distribuições de referência, o maior valor.
- No fechamento de 9 rodadas coletivas, dividendos dependem de receita **efetivamente registrada** e do caixa acima da reserva, com pagamento prévio das obrigações empresariais; não há lucro presumido.
- As cartas DI empresariais podem atingir qualquer empresa da qual o estudante seja sócio, inclusive as sete integrais, com seleção quando houver mais de uma.
- Os objetos empresariais têm identificador por carta e proprietário, possibilitando que vários estudantes comprem uma empresa do mesmo tipo sem compartilhar indevidamente os caixas.
- Registros de empresas adquiridas em dados de desenvolvimento anteriores podem ser incorporados ao iniciar o servidor.

### Limitações que permanecem

1. **O catálogo não define o faturamento e as despesas operacionais periódicas necessárias para simular todas as empresas.** Sem eventos de receita validados, não há dividendos; os lucros iniciais das cartas são referências, não dinheiro gerado automaticamente.
2. Os valores da contabilidade empresarial permanecem em reais inteiros, não inteiramente migrados para centavos.
3. A versão **individual** ainda mantém seu motor financeiro de ativos separado: a integração contábil das sete empresas está conectada ao **multiplayer**.
4. O motor de propostas e governança está voltado principalmente às participações compartilhadas. Não foi criada governança artificial para empresas de titular único.

### Testes

`npm test` — 281 testes aprovados nesta entrega.

## Consolidação v1.43 — lote de Eventos da Vida e Benefícios

**Entrega de desenvolvimento parcial, sem declarar as 230 cartas concluídas.**

Foram acrescentadas 14 decisões de Eventos da Vida, quatro Eventos da Vida automáticos e quatro Benefícios, com controle das categorias pessoais de despesas, efeitos temporários por fechamento, alterações salariais programadas e rastreabilidade das decisões.

Consulte `COBERTURA-v1.43.md` para a listagem dos identificadores implementados neste lote e para as pendências antes da conclusão da v1.43. A meta de três grandes entregas permanece; não iniciar v1.44 enquanto v1.43 não estiver completa.

Execute `npm test` para rodar os testes automatizados.

### Integração adicional v1.43 — participações e oportunidades
- Sete participações GI-019 a GI-025 adquiríveis individualmente com recursos próprios, sem financiamento ou dividendos automáticos. Compra conjunta pendente.
- OE-011, OE-013 e OE-018 adquiríveis à vista, com registro de ativo e débito auditável; renda de referência de equipamentos somente onde prevista.
- OE-016: amortização extraordinária da dívida inicial ou empréstimos, com mínimo R$ 1.000, limite de caixa e saldo devedor, no individual e multiplayer.
- 346 testes passam. Demais cartas OE continuam pendentes. Consulte `COBERTURA-v1.43.md`.


## Estado após esta continuação — 357 testes

A v1.43 ainda não está concluída. Consulte `RELATORIO-CONCLUSAO-v1.43.md` e `COBERTURA-230-CARTAS.csv`. Foram adicionados os fluxos individuais OE-010, OE-017, OE-020 e a renegociação pessoal OE-014. Não confundir a existência de texto catalogado com efeito plenamente homologado.


## Continuação v1.43 — investimentos conjuntos GI (363 testes)

- Multiplayer: GI-019 a GI-025 agora admitem **proposta coletiva**, além da compra individual já existente. O proponente escolhe seu aporte e convida de um a cinco estudantes. Os convidados podem aceitar ou recusar mesmo fora do próprio turno.
- O preço total da participação precisa ser coberto pela soma dos compromissos de pelo menos dois participantes. Nenhuma carteira é debitada até a liquidação; no momento da compra, todos os saldos são revalidados. A participação de cada jogador é proporcional ao aporte realizado.
- A proposta expira após as duas rodadas previstas; recusa e expiração não debitam caixa. Compra e percentuais ficam registrados por jogador; **não** são pagos dividendos empresariais presumidos.
- Testes: 363/363 (`npm test`). A v1.43 permanece incompleta quanto a oportunidades empresariais e auditoria funcional das 230 cartas.


## v1.43 — continuação: consórcio de OE-017/OE-020

As oportunidades especiais OE-017 e OE-020 agora admitem compra coletiva no multiplayer, pelo fluxo de convites e aportes de duas rodadas já existente para GI. A liquidação pré-valida o caixa de todos, registra as porcentagens proporcionais e não gera dividendos sem apuração. Isto **não** encerra a homologação de todas as 230 cartas.

### Continuação v1.43 — expansões e projetos coletivos

- OE-007 e OE-009 foram vinculadas a propostas coletivas, com confirmação de todos os aportes, pelo menos dois participantes e rendimentos iniciais proporcionais.
- OE-001, 002, 003, 005, 006, 008 e 019 agora dispõem de uma ação de investimento empresarial no multiplayer. Desembolso no caixa da empresa; sócio único integral executa diretamente; empresa compartilhada exige proposta e aprovação por mais de 50% do capital. O resultado registrado é **previsão**, não lucro distribuível realizado.
- Essas implementações não concluem a contabilidade operacional, o direito de preferência ou a homologação das 230 cartas. Consultar `RELATORIO-CONCLUSAO-v1.43.md`.

### Integração adicional da v1.43 — OE-004
A reforma de imóveis de locação próprios pode ser realizada na carta OE-004 por R$ 20.000, com seleção do imóvel elegível. O acréscimo de 15% no aluguel entra no próximo fechamento pessoal; terrenos, participações e empresas não são aceitos como imóveis próprios de locação nesta operação. O projeto possui 375 testes automatizados aprovados, mas a v1.43 **ainda não está completa** (OE-012, OE-015, contabilidade empresarial operacional e cobertura integral pendentes).

A OE-015 também possui fluxo de renegociação empresarial: parcela em 6/12/24 fechamentos, 1% de juros por fechamento, revalidação de capacidade da empresa, votação quando existir sociedade e pagamento pelo caixa da pessoa jurídica. Novos testes foram incluídos; total de **379 aprovados**. O direito de preferência OE-012 ainda é uma pendência, assim como a homologação completa do catálogo.

## Continuação — OE-012, oferta com direito de preferência (384/384 testes)

- Implementada a oferta da OE-012: venda externa de 20% por R$ 51.000 (avaliação de referência de R$ 300.000, equivalente proporcional de R$ 60.000 e desconto de 15%).
- Sócios com participação registrada na abertura possuem preferência por duas rodadas; depois, outros jogadores podem comprar até a expiração da oferta na quarta rodada.
- A compra só é liquidada após validar os recursos do comprador; o valor é contabilizado para o vendedor externo, nunca como receita empresarial ou lucro distribuível.
- A participação da empresa é atualizada sem exceder 100%; a oferta não pode ser liquidada duas vezes.
- Integração ao servidor e à interface multiplayer, incluindo ofertas visíveis aos jogadores e botões de exercício de preferência e compra.
- Cinco novos testes específicos da OE-012, com regressão de 384/384 testes aprovados.

**Limitações:** o motor da OE-012 modela a oferta demonstrativa de investidor externo como uma empresa própria da carta; não representa negociação universal de participações em qualquer sociedade preexistente. Não há dividendos fictícios. A auditoria funcional de todas as 230 cartas e a apuração operacional geral continuam pendentes, portanto a v1.43 não está encerrada.

## Auditoria funcional desta continuação
A auditoria reproduzível encontra-se em `src/functional-coverage.js` e
`RELATORIO-COBERTURA-PERCENTUAL-v1.43.md`, com CSV individual de 230 cartas.
A API de auditoria do professor agora informa também a cobertura de rotas.
**Percentual de rotas encontradas não é percentual de homologação**; a v1.43
continua incompleta. Não foram criados efeitos fictícios para cartas ausentes.

## Continuação da auditoria v1.43 — 393 testes

Foram acrescentadas rotas para GO-005, GO-018 a GO-020 e MF-018, MF-024, MF-029, MF-030. Foram executados 393 testes (393 aprovados). Consulte `RELATORIO-COBERTURA-PERCENTUAL-v1.43.md`. A v1.43 **não está concluída**.

## Continuação v1.43 — evento MF-009 e cobertura

- MF-009: evento global acrescenta 0,1 ponto percentual às taxas ofertadas **somente para novos contratos** de renda fixa, sem reprecificar contratos antigos. A taxa de cada nova aplicação é fixada no contrato.
- O catálogo aprovado não informa a duração em rodadas da condição MF-009; por enquanto o efeito persiste na sala. Essa decisão operacional provisória precisa de homologação antes da versão final.
- Auditoria de rotas: 230/230 (100%); sem pendência conhecida no inventário: 187/230 (81,30%); 43 ainda parciais (18,70%). Esses indicadores não equivalem à porcentagem de homologação de todas as cartas.
- Testes automatizados: 397 aprovados.

## Continuação integrada v1.43 — receitas verificadas após expansões empresariais

- OE-001, OE-002, OE-003, OE-005, OE-006, OE-008 e OE-019: ampliações já aprovadas afetam **apenas receitas operacionais registradas a partir da rodada seguinte**, pelos percentuais do catálogo. As decisões continuam exigindo caixa da empresa e votação quando aplicável.
- O registro original é preservado como `baseAmount`; o lançamento informa o bônus (`improvementBonus`) e as melhorias aplicadas (`appliedImprovements`). A proteção contra fonte duplicada continua ativa.
- O sistema **não presume receitas**, nem aplica bônus sobre despesas. Fontes de eventos operacionais precisam ser comprovadas e integrar as operações empresariais restantes.
- Testes: **408/408**. Cobertura de rotas: **100%**; sem pendência conhecida neste inventário: **194/230 (84,35%)**; **36** parciais. Homologação das 230 cartas ainda não concluída.

### Continuação v1.43 — registro de operações empresariais documentadas

O professor agora pode usar **Registrar operação empresarial comprovada** no painel multiplayer. A nova ação autenticada `POST /api/room/:code/corporate-operation` recebe `{companyId,type,amount,document}`; requer autenticação docente, sala em andamento/pausada, valor inteiro positivo e identificador de documento exclusivo na sala. O lançamento é guardado no histórico da empresa, com valor de origem, bonificação por melhorias ativas, rodada e documento; participa da apuração em nove rodadas e da distribuição condicionada ao caixa/reserva. Também funciona com empresas adquiridas integralmente. **O registro do documento é feito pelo professor; o sistema não autentica documentos fiscais externos nem gera automaticamente receitas ou lucros a partir de projeções do catálogo.** Seis testes adicionais validam receita, distribuição, deduplicação, erros, titularidade integral e expansão.

Indicadores de auditoria mantidos: 230/230 rotas (100%); 194/230 sem pendências conhecidas no inventário (84,35%); 36 parciais. A inclusão de uma via manual verificável não permite reclassificar automaticamente as demais 36 cartas como concluídas ou homologadas.

## Continuação v1.43 — integração contábil de GI/OE

A partir desta revisão, aquisições empresariais e participações das cartas GI-011 a GI-025, OE-013, OE-017, OE-018 e OE-020 passam a registrar empresas no mesmo livro operacional do multiplayer. A integralização é idempotente, mantém acionistas externos e calcula a participação de cada consorciado. Não há lucro automático: só operações documentadas pelo professor podem produzir resultado distribuível. Executar `npm test` para a bateria completa. **A v1.43 continua pendente de homologação integral.**


## Continuação da v1.43 — carteira monetária das participações GO

- As compras secundárias GO-016 a GO-020 agora debitam a carteira consolidada, preservando centavos.
- Os dividendos empresariais apurados passam a creditar a mesma carteira sem apagar centavos.
- O extrato mantém `amount` compatível com a auditoria de reais e registra `amountCents` preciso nas compras de participações.
- Quatro novos testes confirmam compras, insuficiência de caixa, distribuição e ausência de dividendos presumidos.
- Esta entrega **não encerra** as 17 classificações parciais; a cobertura conservadora permanece 213/230 (92,61%) e a homologação integral ainda não foi aferida.

## Continuação da v1.43 — auditoria empresarial GO-009 a GO-015

Foram adicionados 14 testes de ponta a ponta de receitas e despesas documentadas, reserva mínima por empresa, dividendos sem rendimentos fictícios e prevenção de duplicação. Todos os 440 testes passaram. O inventário atualizado identifica **220/230 (95,65%)** cartas sem pendência conhecida e **10** parciais. O percentual **não** representa homologação completa da versão. Consulte `RELATORIO-CONCLUSAO-v1.43.md`.

### Continuação v1.43 — GO-016 a GO-020

Cinco testes integrados (`tests/final-go-share-cycles.test.mjs`) verificam compra, ausência de lucro presumido, lançamento de receita, distribuição após fechamento de nove rodadas, respeito à reserva e prevenção de fechamento duplicado. Inventário atualizado para 225/230 sem pendências conhecidas (97,83%), com cinco OE parciais. A homologação integral permanece pendente; consulte `RELATORIO-ENTREGA-FINALIZACAO-DEZ-CARTAS-v1.43.md`.

### Validação integrada das cinco OE — 2026-11-01

A suíte foi ampliada para 451 testes; os novos cenários validam OE-004, OE-012, OE-014, OE-015 e OE-016 conjuntamente, inclusive os invariantes financeiros, a proteção contra duplicações e os saldos fracionários. OE-012 passa a registrar `amountCents` no extrato. Consulte `RELATORIO-VALIDACAO-CINCO-OE-v1.43.md`. O resultado não equivale à homologação integral das 230 cartas.

### Continuação da v1.43 — OE-012 e OE-014

- A OE-014 passa a refinanciar o saldo integral em centavos, incluindo saldos fracionários, mantendo análise de crédito conservadora sobre o valor arredondado para cima e criando um contrato com o principal exato.
- A OE-012 permite selecionar uma empresa já existente na sala **quando sua avaliação é exatamente R$ 300.000 e há pelo menos 20% com vendedor externo (`origin`)**. A oferta demonstrativa permanece disponível. O direito de preferência continua protegendo os sócios durante duas rodadas.
- Estas correções não representam a homologação integral de todas as 230 cartas; a classificação da cobertura permanece conservadora.

## Fechamento funcional da v1.43 — 2026-11-01

O inventário funcional chegou a **230/230 cartas com rota identificada e sem pendência conhecida (100%)**, com **457 testes automatizados aprovados**. Foram integrados testes adicionais de catálogo, existência dos textos aprovados e sorteabilidade por ciclo, e mantidos os testes financeiros integrados das cinco OE finais. **Este fechamento não equivale à homologação manual de todas as alternativas**, prevista para a v2.0. Ver `RELATORIO-ENCERRAMENTO-FUNCIONAL-v1.43.md` e `RELATORIO-COBERTURA-PERCENTUAL-v1.43.md`.

## v1.44 — Integração de partida (primeiro bloco)
- O servidor agora inclui `progress` nas consultas de sala, com participantes ativos, sonhos realizados, ordem de conclusão e indicação de encerramento manual.
- O painel multiplayer apresenta o resumo de progresso e a posição de quem realizou o sonho.
- O relatório docente (schemaVersion 4) reúne a ordem de conclusão e indicadores de cartas sorteadas, decisões e respostas à educação financeira; exportação CSV expandida.
- Os indicadores pedagógicos são baseados nos eventos registrados, não representam notas ou conclusão de objetivos não verificados.
- Compatibilidade de leitura das salas de desenvolvimento: `winnerOrder` inicializado na recuperação quando ausente; não existem partidas reais a preservar.
- **A v1.44 não está concluída:** faltam testes de jornada completa no navegador, validação de pausas e reconexões sob concorrência, conferência visual dos dois tabuleiros, relatórios finais pedagógicos em PDF e demais itens previstos para jogo completo. Homologação geral e implantação pública permanecem para v2.0.


## v1.44 — Integração ampliada de continuidade de sala

- Recuperação de acesso do **professor** com código exclusivo de 24 caracteres hexadecimais fornecido na criação da sala. O código é persistido apenas como hash, e recuperar o acesso invalida o token docente anterior. O professor deve guardar seu código de recuperação; não é enviado por e-mail.
- A interface multiplayer expõe a recuperação do professor, além da recuperação já disponível para estudantes. O código de recuperação aparece no painel da sessão enquanto guardado pelo navegador.
- Teste HTTP de ciclo integrado: criação, dois participantes, início, pausa, **reinício do servidor com persistência**, recuperação de estudante e professor, invalidação de tokens antigos, retomada, exportação de relatórios JSON/CSV, encerramento docente e novo reinício confirmando estado final.
- Não se declara aqui a conclusão da v1.44: ainda faltam validação visual real nos navegadores, testes completos dos dois tabuleiros, exportação pedagógica PDF e homologação de segurança/concorrência da versão 2.0.

- Exportação docente adicional de **relatório HTML imprimível**, com participantes, profissões, sonhos, resultados, cartões e indicadores de educação financeira; o professor pode abrir o HTML e usar **Imprimir > Salvar como PDF**. Não há geração de PDF diretamente no servidor, nem certificação de dados para fins escolares.

## v1.44 — Validação integrada de partida (continuação)

A suíte cobre agora seis jogadores na mesma sala, limite de participantes, sequência de turnos e rodadas, pausa e retomada, persistência após reinício do servidor, os dois tabuleiros, transição por três fechamentos favoráveis e os seis sonhos com verificação de saldo. Consulte `RELATORIO-VALIDACAO-PARTIDA-v1.44.md`. A homologação manual de partidas completas e a v2.0 permanecem pendentes.


## Correção RC3 — turnos bloqueados em cartas MF
Eventos globais de mercado, incluindo MF-005, agora são aceitos pela validação financeira depois da aplicação automática. Isso corrige a falha “Partida financeira inconsistente” ao encerrar o turno. Veja `CORRECAO-TURNO-RC3.md`.
