import { financialSnapshot } from "./engine.js";

// Cada participante dispõe de até dois minutos em uma rodada demonstrativa.
// O cronômetro não encerra nem avança turnos: a decisão é sempre no fim da rodada.
export const PRESENTIAL_MINUTES_PER_PLAYER = 2;
export const PRESENTIAL_DURATION_MS = PRESENTIAL_MINUTES_PER_PLAYER * 60_000;

export function startPresentialTimer(now = Date.now(), playerCount = 2, durationOverrideMs = null) {
  const durationMs = durationOverrideMs ?? playerCount * PRESENTIAL_DURATION_MS;
  return {
    durationMs,
    deadline: now + durationMs,
    remainingMs: durationMs,
    activeSince: now,
    elapsedBeforePauseMs: 0,
    expired: false,
    continued: false,
    pendingDecision: false,
    ranking: null,
    roundsCompleted: 0,
  };
}

export function remainingPresentialMs(room, now = Date.now()) {
  const timer = room.presencialTimer;
  if (!timer) return null;
  if (timer.pendingDecision || room.status === "finished") return Math.max(0, timer.remainingMs ?? 0);
  if (room.status === "playing" && Number.isFinite(timer.deadline))
    return Math.max(0, timer.deadline - now);
  return Math.max(0, timer.remainingMs ?? 0);
}

export function pausePresentialTimer(room, now = Date.now()) {
  const timer = room.presencialTimer;
  if (!timer || timer.pendingDecision) return;
  timer.elapsedBeforePauseMs = elapsedPresentialMs(timer, now);
  timer.activeSince = null;
  timer.remainingMs = remainingPresentialMs(room, now);
  timer.deadline = null;
}

export function resumePresentialTimer(room, now = Date.now()) {
  const timer = room.presencialTimer;
  if (!timer || timer.pendingDecision) return;
  timer.deadline = now + (timer.remainingMs ?? timer.durationMs);
  timer.activeSince = now;
}

// Tempo efetivamente utilizado na rodada. Inclui a prorrogação necessária para
// que o último jogador encerre o turno, mas exclui pausas administrativas.
function elapsedPresentialMs(timer, now = Date.now()) {
  if (Number.isFinite(timer.elapsedBeforePauseMs)) {
    const active = Number.isFinite(timer.activeSince)
      ? Math.max(0, now - timer.activeSince)
      : 0;
    return Math.max(0, timer.elapsedBeforePauseMs + active);
  }
  // Compatibilidade com salas gravadas antes da inclusão do tempo decorrido.
  return Math.max(0, (timer.durationMs ?? 0) - (timer.remainingMs ?? timer.durationMs ?? 0));
}

// Não existe encerramento por expiração durante a rodada. Tempo esgotado
// sinaliza somente que a rodada deve terminar antes de qualquer escolha.
export function checkPresentialExpiry(room, now = Date.now()) {
  if (room.mode !== "shared" || room.status !== "playing" || !room.presencialTimer) return false;
  const timer = room.presencialTimer;
  if (timer.expired || remainingPresentialMs(room, now) > 0) return false;
  timer.expired = true;
  timer.remainingMs = 0;
  timer.deadline = null;
  return true;
}

// Só pode ser chamada depois que o último participante usar "Encerrar turno".
export function completePresentialRound(room, now = Date.now()) {
  if (room.mode !== "shared" || room.status !== "playing" || !room.presencialTimer)
    return false;
  const timer = room.presencialTimer;
  timer.elapsedBeforePauseMs = elapsedPresentialMs(timer, now);
  timer.activeSince = null;
  timer.remainingMs = remainingPresentialMs(room, now);
  timer.deadline = null;
  timer.expired = true;
  timer.pendingDecision = true;
  timer.roundsCompleted += 1;
  room.pausedRemaining = Math.max(0, (room.turnDeadline ?? now) - now);
  room.turnDeadline = null;
  room.status = "paused";
  return true;
}

// A senha autoriza apenas mais uma rodada, ao fim da qual a modal volta a abrir.
export function continuePresentialRound(room, now = Date.now()) {
  const timer = room.presencialTimer;
  timer.pendingDecision = false;
  timer.expired = false;
  timer.continued = true;
  timer.durationMs = room.order.length * PRESENTIAL_DURATION_MS;
  timer.remainingMs = timer.durationMs;
  timer.elapsedBeforePauseMs = 0;
  timer.activeSince = now;
  timer.deadline = now + timer.durationMs;
}

// Renda passiva registrada, sem incluir salário ou dividendos hipotéticos.
export function rankPresentialPlayers(room) {
  const rows = (room.players ?? [])
    .filter((p) => !p.withdrawn)
    .map((p) => {
      const financial = financialSnapshot(p.game);
      return {
        id: p.id,
        name: p.name,
        passive: financial.passive,
        expenses: financial.expenses,
        coverage: financial.expenses > 0 ? financial.passive / financial.expenses : Infinity,
        netWorth: financial.netWorthCostBasis,
      };
    });
  rows.sort(
    (a, b) =>
      b.passive - a.passive ||
      b.coverage - a.coverage ||
      b.netWorth - a.netWorth ||
      a.name.localeCompare(b.name, "pt-BR") ||
      a.id.localeCompare(b.id),
  );
  return rows.map((row, index) => ({ ...row, place: index + 1 }));
}

export function publicPresentialTimer(room, now = Date.now()) {
  if (room.mode !== "shared") return null;
  const timer = room.presencialTimer;
  return {
    durationSeconds: Math.round((timer?.durationMs ?? room.players.length * PRESENTIAL_DURATION_MS) / 1000),
    secondsRemaining: timer ? Math.ceil(remainingPresentialMs(room, now) / 1000) : null,
    secondsElapsed: timer ? Math.floor(elapsedPresentialMs(timer, now) / 1000) : null,
    expired: !!timer?.expired,
    continued: !!timer?.continued,
    pendingDecision: !!timer?.pendingDecision && room.status === "paused",
    waitingForTurn: !!timer?.expired && !timer.pendingDecision && room.status === "playing",
    roundsCompleted: timer?.roundsCompleted ?? 0,
    ranking: timer?.ranking ?? null,
  };
}
