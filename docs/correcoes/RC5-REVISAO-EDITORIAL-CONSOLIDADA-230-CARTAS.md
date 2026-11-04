# Revisão editorial consolidada — 230 cartas oficiais

## Escopo e resultado

Esta entrega conclui a **auditoria estrutural e editorial automatizada** da apresentação do catálogo oficial e corrige problemas identificados na análise. O inventário abaixo é produzido a partir dos textos cadastrados, sem editar a fonte aprovada nem as regras financeiras.

- **230/230 cartas** com título próprio e descrição não vazia na camada de apresentação.
- **230/230 cartas** sem marcadores de conteúdo individual incompleto.
- Rótulos de informação sem duplicação literal dentro de cada carta.
- Remoção verificada de marcas de escape monetário (`RR$`, `\$`) e negrito Markdown exposto (`**`).
- **567 testes automatizados aprovados** na base desta entrega, incluindo quatro testes novos de auditoria editorial.
- A revisão visual e a homologação das decisões no navegador não são substituídas por essa auditoria.

## Correções desta entrega

1. **GO-001 a GO-008:** remoção da categoria genérica que ocultava o nome real do imóvel; GO-001 também recupera o campo **Preço de aquisição** (R$ 35.000).
2. **PO-008 a PO-012 e PO-018 a PO-021:** textos narrativos antes extraídos como métricas genéricas passam a ser exibidos na descrição, evitando lacunas.
3. **EF-017:** o título **Participação Societária** deixa de ser descartado como categoria; a pergunta e a recompensa de R$ 300 passam a ser exibidas em seus campos correspondentes.
4. **Leitura de valores periódicos:** proteção contra acréscimo repetido de “financeiro (Dia do Pagamento)” em textos que já têm a explicação.
5. **Catálogo preservado:** textos oficiais, identificadores, cartas sorteadas, limites, contratos, contabilidade, pagamentos e demais efeitos não foram alterados.

## Correções de pacotes anteriores preservadas

- Padronização da apresentação compartilhada entre a modal do jogo e a página de revisão.
- Ajustes editoriais na EV-012, na cobrança da DI-006, na seção de rendimentos da PO-013 e na separação das informações da OE-013.
- Textos oficiais específicos de OE-006, OE-007, OE-008 e OE-009, fornecidos pelo responsável pelo projeto.
- Correção de mensagens, caracteres de moeda e valores de referência sem pagamentos fictícios.

## Contagem por categoria

| Categoria | Quantidade |
|---|---:|
| PO | 25 |
| GO | 20 |
| DI | 35 |
| MF | 30 |
| EV | 30 |
| EF | 30 |
| BE | 10 |
| GI | 25 |
| OE | 20 |
| FI | 5 |
| **Total** | **230** |

## Inventário da revisão de apresentação

Cada linha abaixo confirma a existência de título, descrição e campos. “OK” refere-se à **integridade estrutural da apresentação**, não à validação individual de todos os cenários financeiros.

| Carta | Título exibido | Campos | Estrutura |
|---|---|---:|---|
| PO-001 | Máquina de Lanches | 7 | OK |
| PO-002 | Carrinho de Café | 8 | OK |
| PO-003 | Loja Virtual de Produtos Artesanais | 8 | OK |
| PO-004 | Ponto de Recarga de Dispositivos | 8 | OK |
| PO-005 | Serviço de Impressões | 8 | OK |
| PO-006 | Quiosque de Acessórios | 8 | OK |
| PO-007 | Pequena Lavanderia Automatizada | 8 | OK |
| PO-008 | Aplicação de Liquidez Diária | 3 | OK |
| PO-009 | Título de Renda Fixa de Prazo Curto | 3 | OK |
| PO-010 | Título com Pagamento de Juros | 3 | OK |
| PO-011 | Aplicação com Prazo de 12 Meses | 3 | OK |
| PO-012 | Título de Renda Fixa Negociável | 3 | OK |
| PO-013 | Ações de Empresa de Energia | 7 | OK |
| PO-014 | Fundos | 9 | OK |
| PO-015 | Ações de Empresa de Tecnologia | 8 | OK |
| PO-016 | Fundos | 9 | OK |
| PO-017 | Ações de Empresa de Comércio | 9 | OK |
| PO-018 | Projetor para Eventos | 2 | OK |
| PO-019 | Kit de Ferramentas Profissionais | 2 | OK |
| PO-020 | Equipamentos para Festas | 2 | OK |
| PO-021 | Equipamento Fotográfico | 2 | OK |
| PO-022 | Lote de Livros Usados | 7 | OK |
| PO-023 | Bicicleta para Revenda | 7 | OK |
| PO-024 | Computador Recondicionado | 7 | OK |
| PO-025 | Lote de Móveis para Escritório | 7 | OK |
| GO-001 | Apartamento Compacto para Aluguel | 8 | OK |
| GO-002 | Sala Comercial | 8 | OK |
| GO-003 | Casa para Locação | 8 | OK |
| GO-004 | Pequeno Galpão | 8 | OK |
| GO-005 | Chalé para Hospedagem | 7 | OK |
| GO-006 | Terreno em Área de Expansão | 7 | OK |
| GO-007 | Conjunto de Lojas | 8 | OK |
| GO-008 | Prédio com Três Quitinetes | 8 | OK |
| GO-009 | Minimercado de Bairro | 8 | OK |
| GO-010 | Lavanderia de Bairro | 8 | OK |
| GO-011 | Pequena Padaria | 8 | OK |
| GO-012 | Agência de Serviços Digitais | 8 | OK |
| GO-013 | Oficina de Bicicletas | 8 | OK |
| GO-014 | Empresa de Energia Solar | 8 | OK |
| GO-015 | Distribuidora de Produtos | 8 | OK |
| GO-016 | Participação em Cafeteria | 9 | OK |
| GO-017 | Sócio de uma Academia | 7 | OK |
| GO-018 | Participação em Empresa de Aplicativos | 7 | OK |
| GO-019 | Sócio de uma Empresa de Reciclagem | 7 | OK |
| GO-020 | Investimento em Empresa de Logística | 7 | OK |
| DI-001 | Conserto da Geladeira | 2 | OK |
| DI-002 | Consulta de Urgência | 2 | OK |
| DI-003 | Problema no Transporte | 2 | OK |
| DI-004 | Vazamento na Residência | 2 | OK |
| DI-005 | Equipamento Eletrônico Danificado | 2 | OK |
| DI-006 | Conta de Energia Acima do Previsto | 2 | OK |
| DI-007 | Compra por Impulso | 2 | OK |
| DI-008 | Reparo na Bicicleta | 2 | OK |
| DI-009 | Material de Estudo Extra | 2 | OK |
| DI-010 | Serviço Doméstico Emergencial | 2 | OK |
| DI-011 | Deslocamento Inesperado | 2 | OK |
| DI-012 | Problema com o Celular | 2 | OK |
| DI-013 | Desperdício de Alimentos | 2 | OK |
| DI-014 | Despesa com Documentação | 2 | OK |
| DI-015 | Mudança de Residência | 2 | OK |
| DI-016 | Manutenção de Equipamento de Trabalho | 2 | OK |
| DI-017 | Taxa de Serviço Inesperada | 2 | OK |
| DI-018 | Tratamento Odontológico | 2 | OK |
| DI-019 | Reparo Estrutural Urgente | 2 | OK |
| DI-020 | Substituição de Equipamento Essencial | 2 | OK |
| DI-021 | Manutenção Extraordinária de Imóvel | 2 | OK |
| DI-022 | Despesa Jurídica Empresarial | 2 | OK |
| DI-023 | Viagem Não Planejada | 2 | OK |
| DI-024 | Reparo em Equipamento de Locação | 2 | OK |
| DI-025 | Despesa Administrativa Extra | 2 | OK |
| DI-026 | Despesa Familiar Importante | 2 | OK |
| DI-027 | Reforma Emergencial | 2 | OK |
| DI-028 | Cobrança Contratual Não Prevista no Orçamento | 2 | OK |
| DI-029 | Problema com Fornecedor | 2 | OK |
| DI-030 | Emergência Pessoal Excepcional | 2 | OK |
| DI-031 | Manutenção de Equipamento Empresarial | 2 | OK |
| DI-032 | Despesa com Documentação Patrimonial | 2 | OK |
| DI-033 | Serviço de Segurança Emergencial | 2 | OK |
| DI-034 | Transporte e Logística Extraordinários | 2 | OK |
| DI-035 | Despesa Pessoal Inesperada | 2 | OK |
| MF-001 | Alta nas Ações de Energia | 2 | OK |
| MF-002 | Queda no Setor de Tecnologia | 2 | OK |
| MF-003 | Mercado Imobiliário Aquecido | 2 | OK |
| MF-004 | Redução dos Dividendos | 2 | OK |
| MF-005 | Melhora nos Fundos Imobiliários | 2 | OK |
| MF-006 | Demanda por Locações de Equipamentos | 2 | OK |
| MF-007 | Oscilação Geral da Bolsa | 2 | OK |
| MF-008 | Recuperação do Comércio | 2 | OK |
| MF-009 | Juros de Novas Aplicações em Alta | 2 | OK |
| MF-010 | Queda nos Preços de Equipamentos | 2 | OK |
| MF-011 | Valorização de Fundos Diversificados | 2 | OK |
| MF-012 | Desocupação no Mercado de Aluguel | 2 | OK |
| MF-013 | Crescimento do Setor Energético | 2 | OK |
| MF-014 | Crise de Confiança no Comércio | 2 | OK |
| MF-015 | Recuperação dos Fundos Imobiliários | 2 | OK |
| MF-016 | Expansão do Setor Imobiliário | 2 | OK |
| MF-017 | Retração Imobiliária | 2 | OK |
| MF-018 | Crescimento do Setor de Tecnologia | 2 | OK |
| MF-019 | Concorrência no Comércio | 2 | OK |
| MF-020 | Recuperação da Logística | 2 | OK |
| MF-021 | Incerteza Econômica | 2 | OK |
| MF-022 | Valorização de Imóveis Comerciais | 2 | OK |
| MF-023 | Redução na Ocupação de Imóveis | 2 | OK |
| MF-024 | Crescimento dos Negócios Sustentáveis | 2 | OK |
| MF-025 | Pressão sobre as Empresas de Alimentação | 2 | OK |
| MF-026 | Melhora na Demanda por Serviços | 2 | OK |
| MF-027 | Queda no Mercado de Equipamentos | 2 | OK |
| MF-028 | Revalorização de Negócios Locais | 2 | OK |
| MF-029 | Expansão do Turismo | 2 | OK |
| MF-030 | Recessão Setorial na Tecnologia | 2 | OK |
| EV-001 | Promoção Profissional | 2 | OK |
| EV-002 | Curso de Qualificação | 2 | OK |
| EV-003 | Reorganização do Orçamento | 2 | OK |
| EV-004 | Mudança para Moradia Econômica | 2 | OK |
| EV-005 | Nova Responsabilidade Familiar | 2 | OK |
| EV-006 | Trabalho Temporário | 2 | OK |
| EV-007 | Transporte Compartilhado | 2 | OK |
| EV-008 | Aumento do Custo de Vida | 2 | OK |
| EV-009 | Bolsa de Estudos | 2 | OK |
| EV-010 | Mudança de Jornada | 2 | OK |
| EV-011 | Compra Planejada | 2 | OK |
| EV-012 | Revisão de Assinaturas | 2 | OK |
| EV-013 | Bonificação Profissional | 2 | OK |
| EV-014 | Oportunidade de Educação Complementar | 2 | OK |
| EV-015 | Revisão de Despesas Domésticas | 2 | OK |
| EV-016 | Novo Estilo de Vida | 2 | OK |
| EV-017 | Mudança de Residência | 2 | OK |
| EV-018 | Apoio a um Familiar | 2 | OK |
| EV-019 | Projeto Pessoal | 2 | OK |
| EV-020 | Revisão Patrimonial | 2 | OK |
| EV-021 | Apoio à Formação Profissional | 2 | OK |
| EV-022 | Despesas com Viagens | 2 | OK |
| EV-023 | Redução de Custos Residenciais | 2 | OK |
| EV-024 | Novo Compromisso Familiar | 2 | OK |
| EV-025 | Reorganização de Investimentos | 2 | OK |
| EV-026 | Convite para Mentoria | 2 | OK |
| EV-027 | Reforma para Maior Conforto | 2 | OK |
| EV-028 | Revisão de Despesas Recorrentes | 2 | OK |
| EV-029 | Apoio Comunitário | 2 | OK |
| EV-030 | Planejamento do Futuro | 2 | OK |
| EF-001 | Reserva de emergência | 1 | OK |
| EF-002 | Orçamento pessoal | 1 | OK |
| EF-003 | Ativos e passivos | 1 | OK |
| EF-004 | Juros de empréstimo | 1 | OK |
| EF-005 | Renda passiva | 1 | OK |
| EF-006 | Consumo consciente | 1 | OK |
| EF-007 | Lucro de um negócio | 1 | OK |
| EF-008 | Diversificação | 1 | OK |
| EF-009 | Liquidez | 1 | OK |
| EF-010 | Parcelamento | 1 | OK |
| EF-011 | Inflação | 1 | OK |
| EF-012 | Dívidas | 1 | OK |
| EF-013 | Patrimônio líquido | 1 | OK |
| EF-014 | Custo de oportunidade | 1 | OK |
| EF-015 | Independência financeira | 1 | OK |
| EF-016 | Valorização e renda | 1 | OK |
| EF-017 | Participação societária | 1 | OK |
| EF-018 | Votação empresarial | 1 | OK |
| EF-019 | Financiamento | 1 | OK |
| EF-020 | Liquidez patrimonial | 1 | OK |
| EF-021 | Fluxo de caixa | 1 | OK |
| EF-022 | Diversificação patrimonial | 1 | OK |
| EF-023 | Rendimento versus risco | 1 | OK |
| EF-024 | Amortização de dívidas | 1 | OK |
| EF-025 | Decisões societárias | 1 | OK |
| EF-026 | Reinvestimento | 1 | OK |
| EF-027 | Risco de concentração | 1 | OK |
| EF-028 | Filantropia | 1 | OK |
| EF-029 | Independência sustentável | 1 | OK |
| EF-030 | Retorno sobre investimento | 1 | OK |
| BE-001 | Reconhecimento Profissional | 4 | OK |
| BE-002 | Reembolso | 4 | OK |
| BE-003 | Economia temporária | 4 | OK |
| BE-004 | Incentivo educacional | 4 | OK |
| BE-005 | Economia recorrente | 4 | OK |
| BE-006 | Prêmio por Participação em Projeto | 4 | OK |
| BE-007 | Consultoria Financeira Gratuita | 5 | OK |
| BE-008 | Recompensa | 4 | OK |
| BE-009 | Economia temporária | 4 | OK |
| BE-010 | Recompensa por Planejamento Financeiro | 4 | OK |
| GI-001 | Edifício com Apartamentos | 5 | OK |
| GI-002 | Centro Comercial de Bairro | 5 | OK |
| GI-003 | Galpão Logístico | 5 | OK |
| GI-004 | Residencial para Estudantes | 5 | OK |
| GI-005 | Pousada de Pequeno Porte | 5 | OK |
| GI-006 | Imóvel Comercial em Região Valorizada | 5 | OK |
| GI-007 | Conjunto de Casas para Aluguel | 5 | OK |
| GI-008 | Terreno para Valorização | 5 | OK |
| GI-009 | Centro de Armazenamento | 5 | OK |
| GI-010 | Complexo de Salas Profissionais | 5 | OK |
| GI-011 | Rede de Cafeterias | 5 | OK |
| GI-012 | Empresa de Desenvolvimento de Software | 5 | OK |
| GI-013 | Indústria de Móveis | 5 | OK |
| GI-014 | Empresa de Energia Renovável | 5 | OK |
| GI-015 | Rede de Lavanderias | 5 | OK |
| GI-016 | Empresa de Logística Regional | 5 | OK |
| GI-017 | Plataforma de Ensino Digital | 5 | OK |
| GI-018 | Empresa de Reciclagem Industrial | 5 | OK |
| GI-019 | Sócio de um Centro Médico | 7 | OK |
| GI-020 | Participação em Empresa de Inteligência Artificial | 8 | OK |
| GI-021 | Investimento em Rede de Supermercados | 9 | OK |
| GI-022 | Sócio de Complexo de Hospedagem | 9 | OK |
| GI-023 | Participação em Indústria Alimentícia | 9 | OK |
| GI-024 | Sociedade em Empresa de Energia Solar | 9 | OK |
| GI-025 | Participação em Centro de Distribuição | 9 | OK |
| OE-001 | Ampliação de uma Cafeteria | 7 | OK |
| OE-002 | Modernização de Equipamentos | 7 | OK |
| OE-003 | Nova Unidade Comercial | 7 | OK |
| OE-004 | Ampliação de Imóvel para Locação | 7 | OK |
| OE-005 | Automatização de Operações | 7 | OK |
| OE-006 | Parceria de Distribuição | 8 | OK |
| OE-007 | Sociedade em Projeto Imobiliário | 7 | OK |
| OE-008 | Aliança de Empresas de Tecnologia | 8 | OK |
| OE-009 | Parceria em Energia Renovável | 7 | OK |
| OE-010 | Imóvel Comercial com Desconto | 8 | OK |
| OE-011 | Equipamentos Empresariais Usados | 7 | OK |
| OE-012 | Participação Societária com Desconto | 7 | OK |
| OE-013 | Pequena Empresa em Recuperação | 8 | OK |
| OE-014 | Renegociação de Financiamento Pessoal | 3 | OK |
| OE-015 | Reorganização de Dívida Empresarial | 3 | OK |
| OE-016 | Amortização Extraordinária | 3 | OK |
| OE-017 | Consórcio de Investimento Imobiliário | 9 | OK |
| OE-018 | Aquisição de Empresa Inovadora | 7 | OK |
| OE-019 | Projeto de Expansão Regional | 7 | OK |
| OE-020 | Investimento em Infraestrutura | 9 | OK |
| FI-001 | Educação para Todos | 6 | OK |
| FI-002 | Saúde na Comunidade | 6 | OK |
| FI-003 | Preservação Ambiental | 6 | OK |
| FI-004 | Empreendedorismo Social | 5 | OK |
| FI-005 | Combate à Fome | 6 | OK |

## Testes e validação manual recomendada

Comando: `npm test` (567/567 nesta entrega). Foram incluídos testes de inventário das 230 cartas, nomes e descrições de oito imóveis, textos de renda fixa/equipamentos e dados oficiais das oportunidades OE-006 a OE-009 e OE-013.

Na homologação visual, conferir ao menos **PO-008, PO-013, GO-001, GI-001, DI-006, EV-012, EF-001, EF-017, FI-001, OE-006, OE-007, OE-008, OE-009 e OE-013**, tanto na prévia quanto na partida. A auditoria automatizada não executa as decisões dessas cartas.

Os recursos societários de investidores fictícios e negociação de novas quotas em OE-006 a OE-009 ainda exigem homologação funcional específica; não foram considerados concluídos apenas por estarem descritos no catálogo.

## Instalação

Extrair este ZIP incremental diretamente na raiz da versão RC5 que já contém a atualização OE-006 a OE-009. Substituir os arquivos indicados e executar `npm test` e `npm start`. Não apagar dados persistidos, `.env` ou arquivos não listados no pacote.
