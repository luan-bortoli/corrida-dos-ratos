# Corrida dos Ratos — RC5: Mercado integrado ao tabuleiro

## Objetivo

Substituir a seção expansível inferior **Ativos, empresas e mercado secundário** na interface do estudante por um painel compacto **Mercado** no centro do tabuleiro e uma modal com três abas, respeitando a proposta visual aprovada.

## Interface do estudante

- O painel **Mercado** mostra quantos tipos de ativos o estudante possui, o número de anúncios próprios ativos e ofertas de outros participantes atualmente visíveis para ele.
- **Abrir Mercado** abre uma modal com as abas **Meus investimentos**, **Meus anúncios** e **Ofertas disponíveis**; a modalidade não abre automaticamente.
- **Meus investimentos** mostra títulos oficiais, quantidade, cotação, valor de referência, empresas com participação e decisões societárias pertinentes.
- **Meus anúncios** mostra anúncios ativos de títulos e de participação empresarial; inclui cancelamento do anúncio de título e negociações com investidores fictícios quando aplicáveis.
- **Ofertas disponíveis** mostra anúncios ativos de outros estudantes, com controle de compra de títulos e aceitação de ofertas societárias quando permitido pelas regras de preferência e turno.
- Ofertas próprias não entram na lista de ofertas disponíveis. Convites societários e propostas continuam acessíveis nas interfaces pertinentes.
- Sinalização de **novas ofertas** baseada nos IDs de ofertas ainda não visualizadas naquela sessão e sala. A visualização é marcada somente após entrar na aba de ofertas aberta. É uma notificação local à sessão do navegador, não uma nova funcionalidade de persistência no servidor.
- O resumo apresenta também dividendos da janela atual.
- A seção expansível anterior não aparece mais ao estudante. A área e os recursos de administração do professor permanecem preservados.

## Funcionalidades preservadas

- Motor financeiro, baralhos, GO-016 e aquisição conjunta, operações empresariais, governança, mercado oficial, regras de liquidez, limites por rodada, saldo e titularidade, temporizador e administração de sala.
- Ações continuam utilizando os endpoints existentes `secondary-list`, `secondary-cancel`, `secondary-buy`, `share-offer`, `share-accept` e as operações societárias já implementadas.
- Consultar o mercado é permitido fora do próprio turno; ações com restrição de turno ficam desabilitadas e seguem validadas pelo servidor.
- Não foram criados preços fictícios ou compradores automáticos.

## Validação

- Testes automatizados: **494/494 aprovados**.
- Verificação sintática do módulo de interface aprovada.
- IDs do HTML verificados sem duplicidade.
- A revisão visual e os testes manuais em navegadores e dispositivos reais ainda são necessários na homologação.
