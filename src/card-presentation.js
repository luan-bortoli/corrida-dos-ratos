// Apresentação das cartas: não altera o estado nem executa efeitos financeiros.
export function automaticCardFeedback(card, event, game) {
  if (!card || event?.resolution !== "automatic") return null;
  const result = card.marketResult;
  if (card.id === "MF-014" && result?.global) {
    const owned = Number(game?.officialSecurities?.["PO-017"] || 0);
    return owned > 0
      ? "Efeito aplicado: a cotação das ações comerciais (PO-017) caiu 8%. Você possui " +
          owned +
          " unidade(s) afetada(s). O caixa não sofre desconto direto."
      : "Efeito aplicado ao mercado: a cotação das ações comerciais (PO-017) caiu 8%. Você não possui unidades desse ativo, portanto não houve alteração direta em sua carteira. O caixa não sofre desconto.";
  }
  if (result?.global)
    return "Evento de mercado registrado automaticamente para a sala. As mudanças atingem somente os investimentos elegíveis; consulte seus ativos para verificar seu impacto.";
  if (result && Number.isFinite(result.affected))
    return result.affected > 0
      ? "Efeito automático registrado nos seus investimentos elegíveis. Consulte os valores atualizados no tabuleiro ou no Mercado."
      : "Evento registrado automaticamente, mas você não possui investimentos elegíveis para esse efeito.";
  if (card.conditionalExpense?.applicable === false)
    return "Evento registrado automaticamente. Nenhum ativo elegível foi encontrado, portanto não houve cobrança.";
  return "Efeito automático registrado pelo jogo. Consulte a condição descrita na carta e os dados atualizados da sua partida.";
}

export function cardLearningDisplay(learning) {
  if (learning == null) return null;
  const value = String(learning).trim();
  if (!value) return null;
  if (/^(global|individual)$/i.test(value))
    return {
      label: "Abrangência",
      value:
        value.toLowerCase() === "global"
          ? "Global — afeta o mercado da sala"
          : "Individual — aplicada somente ao jogador elegível",
    };
  return { label: "Aprendizado", value };
}

// Mensagens de orientação compatíveis com a resolução registrada, sem inventar efeitos.
export function cardStatusFeedback({
  card,
  event,
  game,
  hasChoices = false,
  expense = null,
  hasAnswerFeedback = false,
  hasLifeFeedback = false,
}) {
  if (!card) return null;
  const resolution = event?.resolution || "pending";
  if (resolution === "automatic") {
    if (expense)
      return {
        text:
          "Despesa automática de " +
          expense.percent +
          "% do salário de referência (" +
          new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            expense.amount,
          ) +
          ") registrada na partida. O valor é pago com o caixa disponível e eventual diferença fica pendente.",
        kind: "success",
      };
    return {
      text:
        automaticCardFeedback(card, event, game) ||
        "Efeito registrado automaticamente pelo jogo. Confira as informações atualizadas.",
      kind: "success",
    };
  }
  if (resolution === "answer" || resolution === "unanswered")
    return hasAnswerFeedback
      ? null
      : {
          text:
            resolution === "answer"
              ? "Resposta registrada. Consulte o resultado da pergunta nesta janela."
              : "Pergunta encerrada sem resposta. Consulte o resultado nesta janela.",
          kind: "success",
        };
  if (resolution === "decision")
    return hasLifeFeedback
      ? null
      : {
          text: "Sua escolha foi registrada. Confira o resultado da decisão nesta janela.",
          kind: "success",
        };
  if (resolution === "decline")
    return {
      text: "Oportunidade recusada. Nenhuma aquisição opcional foi realizada.",
      kind: "neutral",
    };
  if (
    resolution === "purchase" ||
    resolution === "joint_purchase" ||
    resolution === "share_purchase"
  )
    return {
      text: "Aquisição registrada. Consulte seu patrimônio atualizado e o histórico da partida.",
      kind: "success",
    };
  if (
    resolution === "joint_proposal" ||
    resolution === "share_proposal" ||
    resolution === "corporate_proposal"
  )
    return {
      text: "Proposta registrada. Consulte o Mercado para acompanhar seu andamento.",
      kind: "success",
    };
  if (resolution === "philanthropy")
    return {
      text: "Decisão de contribuição registrada. Consulte os dados atualizados da partida.",
      kind: "success",
    };
  if (
    resolution === "refinance" ||
    resolution === "corporate_expansion" ||
    resolution === "rental_improvement"
  )
    return {
      text: "Operação registrada. Consulte os dados atualizados para conferir os efeitos.",
      kind: "success",
    };
  if (resolution === "acknowledge")
    return {
      text: "Carta registrada no histórico. Não há outras decisões disponíveis nesta jogada.",
      kind: "neutral",
    };
  if (expense)
    return {
      text:
        "Esta carta possui uma despesa automática de " +
        expense.percent +
        "% do salário de referência. Confira o valor e a situação do lançamento acima.",
      kind: "neutral",
    };
  if (hasChoices)
    return {
      text:
        card.category === "EF"
          ? "Selecione uma das alternativas abaixo para responder à pergunta."
          : "Escolha uma das opções disponíveis abaixo para registrar sua decisão.",
      kind: "neutral",
    };
  return {
    text: "Esta carta não apresenta opções de decisão disponíveis nesta jogada. Confira suas condições e, quando permitido, conclua o turno pelo tabuleiro.",
    kind: "neutral",
  };
}
