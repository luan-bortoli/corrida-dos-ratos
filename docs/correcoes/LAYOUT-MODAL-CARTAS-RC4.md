# Corrida dos Ratos — homologação do layout central e cartas em modal

Base: v2.0 RC4 com GO-016 corrigida e tabuleiro redesenhado.

## Mudanças

- Informações do sonho, caixa e indicadores financeiros no centro do tabuleiro; dívida inicial apenas quando existente.
- Casa atual exibida com número e nome conforme o circuito real.
- Carta, perguntas, alternativas e decisões no mesmo modal; abertura ao início de uma nova carta, sem reabrir a cada atualização da sala. Botão no tabuleiro permite reabrir.
- Lista de ativos e mercado secundário recolhida e oculta quando sem conteúdos relevantes ao jogador; empresas não adquiridas não são apresentadas como catálogo; ofertas da carta GO-016 seguem dentro das decisões.
- Texto da DI-006 esclarece que 5% do salário de referência é despesa inesperada, descontada do caixa, com diferença não paga registrada como pendência.
- Código pessoal de recuperação não exibido no painel financeiro, sem remoção da recuperação de sessão.
- Professor mantém controles próprios e indicadores administrativos.

## Cuidados de homologação

- Conferir em navegador desktop e celular a abertura e reabertura de modal após sorteio, fechamento e conclusão da carta.
- Testar GO-016 e cartas de educação financeira, eventos com escolhas e despesas automáticas.
- Verificar convites de investimento, ofertas e mercado quando pertinentes, inclusive fora do turno, já que ficam na seção contextual recolhível.
- Não houve alteração intencional nas regras de cálculo, autorização de turno e rotas de servidor.

Atualização: o detalhamento de despesas DI com cotação percentual oficial passou a mostrar explicitamente o percentual do salário, o valor em reais, a saída do caixa e o significado da pendência, não apenas a DI-006. A fonte da cobrança continua sendo `src/official-effects.js`.
