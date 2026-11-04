import { financialSnapshot } from "./engine.js";

export const PRESENTIAL_DURATION_MS = 20 * 60 * 1000;

export function startPresentialTimer(now = Date.now(), durationMs = PRESENTIAL_DURATION_MS) {
  return {
    durationMs,
    deadline: now + durationMs,
    remainingMs: durationMs,
    expired: false,
    continued: false,
    ranking: null,
  };
}

export function remainingPresentialMs(room, now = Date.now()) {
  const timer = room.presencialTimer;
  if (!timer) return null;
  if (timer.continued || timer.expired) return 0;
  if (room.status === "playing" && Number.isFinite(timer.deadline))
    return Math.max(0, timer.deadline - now);
  return Math.max(0, timer.remainingMs ?? 0);
}

export function pausePresentialTimer(room, now = Date.now()) {
  const timer = room.presencialTimer;
  if (!timer || timer.continued || timer.expired) return;
  timer.remainingMs = remainingPresentialMs(room, now);
  timer.deadline = null;
}

export function resumePresentialTimer(room, now = Date.now()) {
  const timer = room.presencialTimer;
  if (!timer || timer.continued || timer.expired) return;
  timer.deadline = now + (timer.remainingMs ?? timer.durationMs);
}

// A decisão de encerramento por tempo pertence exclusivamente ao administrador.
// Uma carta pendente não é interrompida; a pausa ocorrerá ao concluir o turno.
export function checkPresentialExpiry(room, now = Date.now()) {
  if (room.mode !== "shared" || room.status !== "playing" || !room.presencialTimer) return false;
  const timer = room.presencialTimer;
  if (timer.continued) return false;
  if (remainingPresentialMs(room, now) > 0 && !timer.expired) return false;
  const changed = !timer.expired || room.status === "playing";
  timer.expired = true;
  timer.remainingMs = 0;
  timer.deadline = null;
  const activeId = room.order[room.turnIndex];
  const activeGame = room.players.find((p) => p.id === activeId)?.game;
  if (!activeGame?.pending) {
    room.pausedRemaining = Math.max(0, (room.turnDeadline ?? now) - now);
    room.turnDeadline = null;
    room.status = "paused";
  }
  return changed;
}

// O critério não confunde salário com renda passiva e não inventa dividendos futuros.
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
    durationSeconds: Math.round((timer?.durationMs ?? PRESENTIAL_DURATION_MS) / 1000),
    secondsRemaining: timer ? Math.ceil(remainingPresentialMs(room, now) / 1000) : null,
    expired: !!timer?.expired,
    continued: !!timer?.continued,
    pendingDecision: !!timer?.expired && !timer.continued && room.status === "paused",
    waitingForTurn: !!timer?.expired && !timer.continued && room.status === "playing",
    ranking: timer?.ranking ?? null,
  };
}
