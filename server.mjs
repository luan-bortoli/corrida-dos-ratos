import { registerAcquiredCompanyLedgers } from "./src/acquired-company-ledgers.js";
import { registerDocumentedOperation } from "./src/corporate-operations.js";
import {
  ensureDiscountCompany,
  ensureDiscountOffers,
  openDiscountOffer,
  acceptDiscountOffer,
  expireDiscountOffers,
  publicDiscountOffers,
} from "./src/discount-share-offer.js";
import {
  proposeCorporateRenegotiation,
  executeApprovedCorporateRenegotiation,
} from "./src/corporate-renegotiation.js";
import {
  proposeCorporateExpansion,
  executeApprovedCorporateExpansion,
} from "./src/corporate-expansions.js";
import {
  openJointInvestment,
  acceptJointInvestment,
  declineJointInvestment,
  expireJointInvestments,
  publicJointInvestments,
} from "./src/joint-investments.js";
import { registerOwnedCompany, registerMissingOwnedCompanies } from "./src/owned-companies.js";
import { applyCorporateExpense, eligibleCorporateCompanies } from "./src/corporate-expenses.js";
import {
  ensureSecondary,
  listSecondary,
  cancelSecondary,
  buySecondary,
  publicSecondary,
  checkSecondary,
} from "./src/official-secondary.js";
import {
  applyGlobalMarketEvent,
  publicOfficialMarket,
  synchronizeOfficialPosition,
} from "./src/global-market.js";
import { ISSUE_UNITS } from "./src/official-securities.js";
import { fixedIncomeOffer } from "./src/fixed-income.js";
import {
  officialSmallBusinessOffer,
  officialPOAssetOffer,
} from "./src/official-small-businesses.js";
import { publicQuestion } from "./src/financial-quiz.js";
import { roomCardAudit } from "./src/card-audit.js";
import { buildTeacherReport, reportCSV } from "./src/reports.js";
import { roomProgress } from "./src/room-progress.js";
import {
  startPresentialTimer,
  pausePresentialTimer,
  resumePresentialTimer,
  checkPresentialExpiry,
  completePresentialRound,
  continuePresentialRound,
  rankPresentialPlayers,
  publicPresentialTimer,
} from "./src/presential-timer.js";
import { ensureSecurities, publicSecurities, checkSecurities } from "./src/securities.js";
import { ensureNPC, publicNPC, quoteNPC, buyShareNPC, checkNPC } from "./src/npc-market.js";
import http from "node:http";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomBytes, randomInt, createHash, timingSafeEqual } from "node:crypto";
import { join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureMarket,
  publishShareOffer,
  acceptShareOffer,
  expireShareOffers,
  publicShareOffers,
} from "./src/market.js";
import {
  ensureGovernance,
  openProposal,
  castVote,
  expireProposals,
  publicProposals,
} from "./src/governance.js";
import {
  createCompanies,
  checkCompanies,
  purchaseCompanyShare,
  closeCompanies,
  publicCompanies,
} from "./src/companies.js";
import {
  createGame,
  rollTurn,
  finishTurn,
  buyVerifiedAsset,
  purchaseRealEstate,
  purchaseOfficialCompany,
  purchaseOfficialSmallBusiness,
  purchaseOfficialPOAsset,
  subscribeFixedIncome,
  redeemFixedIncome,
  purchaseOfficialSecurity,
  financeRealEstate,
  answerEducationCard,
  chooseLifeEvent,
  resolvePhilanthropy,
  purchaseGrandInvestment,
  purchaseSpecialOpportunity,
  resolveExtraordinaryAmortization,
  resolveSpecialRefinancing,
  improveRentalProperty,
  contractCredit,
  prepayLoan,
  validateState,
  auditCash,
  quoteCredit,
} from "./src/engine.js";
const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3000);
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 10) {
  console.error("Defina ADMIN_PASSWORD com pelo menos 10 caracteres para iniciar o servidor.");
  process.exit(1);
}
const dataDir = resolve(process.env.DATA_DIR || join(root, ".room-data"));
await mkdir(dataDir, { recursive: true });
const dataFile = join(dataDir, "rooms.json");
let rooms = {};
try {
  rooms = JSON.parse(await readFile(dataFile, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const token = () => randomBytes(32).toString("hex");
const RECONNECT_TTL_MS = 10 * 60 * 1000;
const pendingReconnects = new Map();
const hash = (t) => createHash("sha256").update(t).digest("hex");
const equal = (a, b) => {
  const x = Buffer.from(hash(a));
  const y = Buffer.from(hash(b));
  return timingSafeEqual(x, y);
};
// Limits apply to authentication/recovery attempts, not regular gameplay polling.
const authAttempts = new Map();
function guardAuth(req, scope, limit = 8) {
  const now = Date.now(),
    windowMs = 60_000;
  const ip = req.socket.remoteAddress || "unknown";
  const key = `${ip}:${scope}`;
  const entry = authAttempts.get(key);
  if (!entry || now - entry.started >= windowMs) {
    authAttempts.set(key, { started: now, count: 1 });
    return;
  }
  if (entry.count >= limit) fail(429, "Muitas tentativas. Tente novamente em um minuto.");
  entry.count++;
  if (authAttempts.size > 2000)
    for (const [k, v] of authAttempts) if (now - v.started >= windowMs) authAttempts.delete(k);
}

const TURN_MS =
  process.env.NODE_ENV === "test" ? Number(process.env.TEST_TURN_MS || 120000) : 120000;
const PRESENCE_GRACE_MS =
  process.env.NODE_ENV === "test" ? Number(process.env.TEST_PRESENCE_GRACE_MS || 15000) : 15000;
// Presença é transitória: não gravar polling em disco nem usar ausência como desistência.
const lastSeen = new Map();
const presenceKey = (room, playerId) => room.code + ":" + playerId;
const playerOnline = (room, playerId) =>
  Date.now() - (lastSeen.get(presenceKey(room, playerId)) ?? roomPresenceStart) <=
  PRESENCE_GRACE_MS;
const roomPresenceStart = Date.now();
function markPresent(room, who) {
  if (who?.role === "player") lastSeen.set(presenceKey(room, who.playerId), Date.now());
}

const safe = (s) => ({
  id: s.id,
  name: s.name,
  professionId: s.game.professionId,
  dreamId: s.game.dreamId,
  circuit: s.game.circuit,
  position: s.game.position,
  turn: s.game.turn,
  closures: s.game.closures,
  won: s.game.won,
  withdrawn: !!s.withdrawn,
  pending: s.game.pending,
  cash: s.game.cash,
  streak: s.game.streak,
});
const publicGame = (game) => {
  if (!game) return null;
  const g = structuredClone(game);
  if (g.currentCard?.category === "EF") {
    g.currentCard.quizQuestion = publicQuestion(g.currentCard.id);
    if (g.cardEvents?.at(-1)?.resolution === "pending") delete g.currentCard.quizFeedback;
  }
  return g;
};
const snapshot = (room, who) => ({
  round: room.round ?? 1,
  turnDeadline: room.turnDeadline ?? null,
  secondsRemaining:
    room.status === "playing"
      ? Math.max(0, Math.ceil(((room.turnDeadline ?? Date.now()) - Date.now()) / 1000))
      : room.pausedRemaining == null
        ? null
        : Math.ceil(room.pausedRemaining / 1000),
  canTeacherAdvance:
    who?.role === "teacher" &&
    room.status === "playing" &&
    Date.now() >= (room.turnDeadline ?? Infinity),
  code: room.code,
  mode: room.mode || "individual",
  progress: roomProgress(room),
  presencial: publicPresentialTimer(room),
  status: room.status,
  paused: room.status === "paused",
  revision: room.revision,
  turnIndex: room.turnIndex,
  activePlayerId: room.order[room.turnIndex] || null,
  players: room.players.map((p) => ({
    ...safe(p),
    connected: !p.withdrawn && playerOnline(room, p.id),
  })),
  companies: publicCompanies(room),
  shareOffers: publicShareOffers(room),
  proposals: publicProposals(room),
  jointInvestments: publicJointInvestments(room),
  discountOffers: publicDiscountOffers(room),
  npcInvestors: publicNPC(room),
  securities: publicSecurities(room),
  officialMarket: publicOfficialMarket(room),
  secondaryMarket: publicSecondary(room),
  externalSellerCash: who?.role === "teacher" ? room.externalSellerCash : undefined,
  you: who?.role === "player" ? who.playerId : null,
  teacher: who?.role === "teacher",
  reconnectRequests:
    who?.role === "teacher"
      ? [...pendingReconnects.values()]
          .filter(
            (x) => x.roomCode === room.code && x.status === "pending" && x.expiresAt > Date.now(),
          )
          .map((x) => ({ id: x.id, name: x.name }))
      : undefined,
  game:
    who?.role === "player"
      ? publicGame(room.players.find((p) => p.id === who.playerId)?.game)
      : null,
});
// A visão presencial reutiliza a identidade administrativa, mas mostra apenas o
// estado do participante ativo. Nenhum token de jogador é compartilhado.
function visibleSnapshot(room, who, req) {
  if (
    room.mode === "shared" &&
    who.role === "teacher" &&
    req.headers["x-shared-view"] === "player"
  ) {
    const active = room.order[room.turnIndex];
    const requested = req.headers["x-shared-player"];
    // A consulta de outro participante serve para responder convites coletivos.
    // Não transfere o direito de lançar dado ou movimentar finanças fora do turno.
    const selected =
      requested && room.players.some((p) => p.id === requested && !p.withdrawn)
        ? requested
        : active;
    if (selected && room.players.some((p) => p.id === selected)) {
      return { ...snapshot(room, { role: "player", playerId: selected }), sharedAdmin: true };
    }
  }
  return { ...snapshot(room, who), sharedAdmin: room.mode === "shared" && who.role === "teacher" };
}
for (const room of Object.values(rooms)) {
  room.winnerOrder ??= [];
  room.players.forEach((p) => {
    p.withdrawn ??= false;
  });
  room.companies ??= createCompanies();
  room.externalSellerCash ??= 0;
  ensureMarket(room);
  ensureGovernance(room);
  ensureNPC(room);
  ensureSecurities(room);
  ensureSecondary(room);
  registerMissingOwnedCompanies(room);
  registerAcquiredCompanyLedgers(room);
  ensureDiscountOffers(room);
}
let chain = Promise.resolve();
function queue(fn) {
  const p = chain.then(fn);
  chain = p.catch(() => {});
  return p;
}
async function save() {
  const tmp = dataFile + ".tmp";
  await writeFile(tmp, JSON.stringify(rooms));
  await rename(tmp, dataFile);
}
function fail(code, msg) {
  const e = Error(msg);
  e.status = code;
  throw e;
}
function locate(code) {
  const r = rooms[code];
  if (!r) fail(404, "Sala não encontrada");
  return r;
}
function authorize(req, r) {
  const t = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!/^[a-f0-9]{64}$/.test(t)) fail(401, "Sessão não autorizada");
  const h = hash(t);
  if (r.teacherToken === h) return { role: "teacher" };
  const p = r.players.find((x) => x.tokenHash === h);
  if (p) return { role: "player", playerId: p.id };
  fail(403, "Acesso não autorizado para esta sala");
}
function teacher(who) {
  if (who.role !== "teacher") fail(403, "Somente professor");
}
function current(r, who) {
  if (who.role === "player" && r.players.find((p) => p.id === who.playerId)?.withdrawn)
    fail(403, "Você desistiu desta partida");
  if (r.status !== "playing") fail(409, "A sala precisa estar em andamento e sem pausa");
  const allowedShared = who.role === "teacher" && r.mode === "shared";
  if (!allowedShared && (who.role !== "player" || r.order[r.turnIndex] !== who.playerId))
    fail(403, "Não é o seu turno");
  return r.players.find((p) => p.id === (allowedShared ? r.order[r.turnIndex] : who.playerId));
}
function bodyOf(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 20000) {
        reject(Object.assign(Error("Corpo muito grande"), { status: 413 }));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(Error("JSON inválido"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}
function json(res, status, value) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(value));
}
function roomCode() {
  let code;
  do {
    code = randomBytes(4).toString("hex").toUpperCase();
  } while (rooms[code]);
  return code;
}
function turnAdvance(r) {
  const active = r.players.filter((p) => !p.game.won && !p.withdrawn).map((p) => p.id);
  r.order = r.order.filter((id) => active.includes(id));
  if (!r.order.length) {
    r.status = "finished";
    r.endReason ??= "natural";
    r.turnIndex = 0;
    return;
  }
  if (r.turnIndex >= r.order.length) r.turnIndex = 0;
}
// Resolve apenas operações obrigatórias; compras e decisões opcionais não são autorizadas por ausência.
function resolveAbsentPending(room, player) {
  if (!player?.game.pending) return;
  const card = player.game.currentCard;
  if (card?.corporateExpense?.requiresCompanySelection) {
    const eligible = [...(card.corporateExpense.eligibleCompanies || [])].sort((a, b) =>
      String(a.id).localeCompare(String(b.id)),
    );
    if (!eligible.length) throw Error("Despesa empresarial sem empresa elegível");
    const event = player.game.cardEvents?.at(-1);
    const result = applyCorporateExpense(
      room,
      player.id,
      card.id,
      event?.id ?? `TURN-${player.id}-${player.game.turn}`,
      eligible[0].id,
    );
    card.corporateExpense = result;
    card.effectExecuted = true;
    if (event) {
      event.resolution = "automatic";
      event.financialEffect = result.applicable;
    }
  }
  player.game = finishTurn(player.game);
  player.game.officialPOEnabled = true;
}
function nextActiveTurn(room) {
  if (!room.order.length) {
    room.status = "finished";
    room.turnDeadline = null;
    return;
  }
  room.turnIndex = (room.turnIndex + 1) % room.order.length;
  if (room.turnIndex === 0) {
    closeCompanies(room, room.round ?? 1);
    room.round = (room.round ?? 1) + 1;
    expireShareOffers(room);
    expireProposals(room);
    expireJointInvestments(room);
    expireDiscountOffers(room);
  }
  turnAdvance(room);
  room.turnDeadline = room.status === "playing" ? Date.now() + TURN_MS : null;
}
function skipAbsentTurn(room) {
  if (room.status !== "playing" || !room.order.length) return false;
  const id = room.order[room.turnIndex];
  if (!id || room.mode === "shared" || playerOnline(room, id)) return false;
  const p = room.players.find((x) => x.id === id);
  if (p) resolveAbsentPending(room, p);
  nextActiveTurn(room);
  return true;
}
async function api(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  let data = {};
  if (req.method === "POST") data = await bodyOf(req);
  if (req.method === "POST" && url.pathname === "/api/room/create") {
    guardAuth(req, "create", 12);
    if (typeof data.password !== "string" || !equal(data.password, password))
      fail(401, "Senha do professor incorreta");
    const code = roomCode(),
      secret = token(),
      teacherRecovery = randomBytes(12).toString("hex").toUpperCase();
    if (data.mode !== undefined && !["shared", "individual"].includes(data.mode))
      fail(400, "Modo de jogo inválido");
    rooms[code] = {
      code,
      mode: data.mode === "shared" ? "shared" : "individual",
      status: "lobby",
      teacherToken: hash(secret),
      teacherRecoveryHash: hash(teacherRecovery),
      players: [],
      order: [],
      winnerOrder: [],
      turnIndex: 0,
      round: 1,
      presencialTimer: null,
      turnDeadline: null,
      pausedRemaining: null,
      companies: createCompanies(),
      shareOffers: [],
      proposals: [],
      jointInvestments: [],
      discountOffers: [],
      npcInvestors: undefined,
      securities: [],
      secondaryOffers: [],
      secondaryTrades: [],
      secondaryVolumes: {},
      externalSellerCash: 0,
      revision: 1,
      createdAt: Date.now(),
    };
    await save();
    return json(res, 201, {
      code,
      token: secret,
      teacherRecoveryCode: teacherRecovery,
      room: snapshot(rooms[code], { role: "teacher" }),
    });
  }
  const code = parts[2];
  if (parts[0] !== "api" || parts[1] !== "room" || !code) fail(404, "Rota inexistente");
  const r = locate(code);
  if (req.method === "POST" && parts[3] === "admin-login") {
    guardAuth(req, `admin-login:${code}`, 8);
    if (typeof data.password !== "string" || !equal(data.password, password))
      fail(401, "Senha do administrador incorreta");
    const secret = token();
    r.teacherToken = hash(secret);
    r.revision++;
    await save();
    return json(res, 200, { code, token: secret, room: snapshot(r, { role: "teacher" }) });
  }
  if (req.method === "POST" && parts[3] === "reconnect-request") {
    guardAuth(req, `reconnect:${code}`, 10);
    const name = String(data.name || "").trim();
    if (name.length < 2 || name.length > 40) fail(400, "Nome inválido");
    const player = r.players.find(
      (x) => x.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
    );
    if (!player)
      fail(
        404,
        r.status === "lobby"
          ? "Jogador não encontrado nesta sala"
          : "Esta partida já começou e não aceita novos jogadores",
      );
    if (player.withdrawn) fail(409, "Este jogador desistiu definitivamente");
    const ticket = token(),
      id = randomBytes(9).toString("hex");
    pendingReconnects.set(id, {
      id,
      roomCode: code,
      playerId: player.id,
      name: player.name,
      ticketHash: hash(ticket),
      expiresAt: Date.now() + RECONNECT_TTL_MS,
      status: "pending",
    });
    return json(res, 202, { requestId: id, ticket, expiresInSeconds: 600 });
  }
  if (req.method === "POST" && parts[3] === "reconnect-status") {
    guardAuth(req, `reconnect-status:${code}`, 120);
    const request = pendingReconnects.get(String(data.requestId || ""));
    if (
      !request ||
      request.roomCode !== code ||
      request.ticketHash !== hash(String(data.ticket || ""))
    )
      fail(401, "Solicitação inválida");
    if (request.expiresAt <= Date.now()) {
      pendingReconnects.delete(request.id);
      fail(410, "Solicitação expirada");
    }
    if (request.status === "rejected") {
      pendingReconnects.delete(request.id);
      fail(403, "Retorno não autorizado pelo administrador");
    }
    if (request.status !== "approved") return json(res, 200, { status: "pending" });
    const player = r.players.find((x) => x.id === request.playerId);
    if (!player || player.withdrawn) {
      pendingReconnects.delete(request.id);
      fail(409, "Jogador indisponível");
    }
    const secret = token();
    player.tokenHash = hash(secret);
    r.revision++;
    pendingReconnects.delete(request.id);
    await save();
    return json(res, 200, {
      status: "approved",
      token: secret,
      playerId: player.id,
      name: player.name,
      room: snapshot(r, { role: "player", playerId: player.id }),
    });
  }

  if (req.method === "POST" && parts[3] === "join") {
    guardAuth(req, `join:${code}`, 20);
    if (r.mode === "shared") fail(403, "No modo presencial, o professor cadastra os jogadores");
    if (r.status !== "lobby") fail(409, "Sala já iniciada");
    if (r.players.length >= 6) fail(409, "Sala cheia");
    const name = String(data.name || "").trim();
    if (name.length < 2 || name.length > 40) fail(400, "Nome deve ter 2 a 40 caracteres");
    if (
      r.players.some((p) => p.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))
    )
      fail(409, "Este nome já está em uso");
    const game = createGame(data.professionId, data.dreamId),
      secret = token(),
      recovery = randomBytes(8).toString("hex").toUpperCase(),
      id = randomBytes(9).toString("hex");
    r.players.push({ id, name, game, tokenHash: hash(secret), recoveryHash: hash(recovery) });
    r.revision++;
    await save();
    return json(res, 201, {
      token: secret,
      recoveryCode: recovery,
      playerId: id,
      room: snapshot(r, { role: "player", playerId: id }),
    });
  }
  if (req.method === "POST" && parts[3] === "recover") {
    guardAuth(req, `recover:${code}`);
    const name = String(data.name || "").trim(),
      key = String(data.recoveryCode || "")
        .trim()
        .toUpperCase();
    if (!/^[A-F0-9]{16}$/.test(key)) fail(401, "Código de recuperação inválido");
    const p = r.players.find(
      (x) =>
        x.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") &&
        x.recoveryHash === hash(key),
    );
    if (!p) fail(401, "Nome ou código de recuperação inválido");
    if (p.withdrawn) fail(409, "O participante desistiu definitivamente desta partida");
    const secret = token();
    p.tokenHash = hash(secret);
    r.revision++;
    await save();
    return json(res, 200, {
      token: secret,
      playerId: p.id,
      room: snapshot(r, { role: "player", playerId: p.id }),
    });
  }
  if (req.method === "POST" && parts[3] === "recover-teacher") {
    guardAuth(req, `recover-teacher:${code}`);
    const key = String(data.recoveryCode || "")
      .trim()
      .toUpperCase();
    if (
      !/^[A-F0-9]{24}$/.test(key) ||
      !r.teacherRecoveryHash ||
      r.teacherRecoveryHash !== hash(key)
    )
      fail(401, "Código de recuperação do professor inválido");
    const secret = token();
    r.teacherToken = hash(secret);
    r.revision++;
    await save();
    return json(res, 200, { token: secret, room: snapshot(r, { role: "teacher" }) });
  }
  const who = authorize(req, r);
  if (parts[3] !== "leave" && parts[3] !== "withdraw") markPresent(r, who);
  if (req.method === "POST" && r.mode === "shared" && r.presencialTimer?.pendingDecision && !["finish-time", "continue-time", "shared-teacher-unlock"].includes(parts[3]))
    fail(409, "Rodada concluída. Informe a senha na modal do Administrador para prosseguir");
  if (req.method === "POST" && parts[3] === "shared-teacher-unlock") {
    teacher(who);
    guardAuth(req, `shared-unlock:${code}`, 20);
    if (r.mode !== "shared") fail(409, "Sala não presencial");
    if (typeof data.password !== "string" || !equal(data.password, password))
      fail(401, "Senha do professor incorreta");
    return json(res, 200, { authorized: true });
  }
  if (req.method === "POST" && parts[3] === "shared-add-player") {
    teacher(who);
    if (r.mode !== "shared") fail(409, "Esta sala não utiliza tela compartilhada");
    if (r.status !== "lobby") fail(409, "Adicione participantes antes de iniciar");
    if (r.players.length >= 6) fail(409, "Sala cheia");
    const name = String(data.name || "").trim();
    if (name.length < 2 || name.length > 40) fail(400, "Nome deve ter 2 a 40 caracteres");
    if (
      r.players.some((p) => p.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))
    )
      fail(409, "Este nome já está em uso");
    const game = createGame(data.professionId, data.dreamId);
    const id = randomBytes(9).toString("hex");
    r.players.push({ id, name, game, tokenHash: null, recoveryHash: null });
    r.revision++;
    await save();
    return json(res, 201, visibleSnapshot(r, who, req));
  }
  if (req.method === "POST" && parts[3] === "reconnect-review") {
    teacher(who);
    const request = pendingReconnects.get(String(data.requestId || ""));
    if (
      !request ||
      request.roomCode !== code ||
      request.expiresAt <= Date.now() ||
      request.status !== "pending"
    )
      fail(404, "Solicitação indisponível");
    if (data.decision !== "approve" && data.decision !== "reject") fail(400, "Decisão inválida");
    request.status = data.decision === "approve" ? "approved" : "rejected";
    r.revision++;
    return json(res, 200, visibleSnapshot(r, who, req));
  }

  if (req.method === "GET" && parts.length === 4 && parts[3] === "card-audit") {
    teacher(who);
    return json(res, 200, roomCardAudit(r));
  }
  if (req.method === "GET" && parts.length === 4 && parts[3] === "report") {
    teacher(who);
    const report = buildTeacherReport(r);
    if (url.searchParams.get("format") === "csv") {
      res.writeHead(200, {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="corrida-${r.code}-relatorio.csv"`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      res.end(reportCSV(report));
      return;
    }
    return json(res, 200, report);
  }
  if (req.method === "POST" && parts.length === 4 && parts[3] === "corporate-operation") {
    teacher(who);
    const result = registerDocumentedOperation(r, {
      companyId: data.companyId,
      type: data.type,
      amount: data.amount,
      document: data.document,
    });
    r.revision++;
    await save();
    return json(res, 200, { operation: result, room: visibleSnapshot(r, who, req) });
  }
  if (req.method === "POST" && parts.length === 4 && parts[3] === "leave") {
    if (who.role !== "player") fail(403, "Ação exclusiva do estudante");
    lastSeen.set(presenceKey(r, who.playerId), 0);
    if (skipAbsentTurn(r)) {
      r.revision++;
      await save();
    }
    return json(res, 200, { left: true });
  }
  if (req.method === "POST" && parts.length === 4 && parts[3] === "withdraw") {
    if (who.role !== "player") fail(403, "Ação exclusiva do estudante");
    const p = r.players.find((x) => x.id === who.playerId);
    if (!p || p.withdrawn) fail(409, "Participante já desistiu");
    if (r.status === "finished") fail(409, "A partida já está encerrada");
    const wasActive = r.status === "playing" && r.order[r.turnIndex] === p.id;
    if (wasActive) resolveAbsentPending(r, p);
    p.withdrawn = true;
    p.withdrawnAt = Date.now();
    lastSeen.set(presenceKey(r, p.id), 0);
    const idx = r.order.indexOf(p.id);
    if (idx !== -1) {
      r.order.splice(idx, 1);
      if (idx < r.turnIndex) r.turnIndex--;
    }
    if (!r.order.length) {
      if (r.status === "lobby") {
        if (r.players.every((x) => x.withdrawn)) {
          r.status = "finished";
          r.endReason = "all_withdrawn";
          r.turnDeadline = null;
        }
      } else {
        r.endReason = "all_withdrawn";
        turnAdvance(r);
        r.turnDeadline = null;
      }
    } else if (wasActive) {
      if (r.turnIndex >= r.order.length) {
        r.turnIndex = 0;
        closeCompanies(r, r.round ?? 1);
        r.round = (r.round ?? 1) + 1;
        expireShareOffers(r);
        expireProposals(r);
        expireJointInvestments(r);
        expireDiscountOffers(r);
      }
      turnAdvance(r);
      r.turnDeadline = r.status === "playing" ? Date.now() + TURN_MS : null;
    }
    r.revision++;
    await save();
    return json(res, 200, { withdrawn: true });
  }
  if (req.method === "GET" && parts.length === 3)
    return json(res, 200, visibleSnapshot(r, who, req));
  if (req.method !== "POST") fail(405, "Método não permitido");
  const action = parts[3];
  // Convidados podem responder a propostas durante o turno de outro jogador.
  if (
    req.method === "POST" &&
    ["joint-accept", "joint-decline", "discount-accept"].includes(action)
  ) {
    if (
      r.status !== "playing" ||
      (who.role !== "player" && !(r.mode === "shared" && who.role === "teacher"))
    )
      fail(403, "Participação indisponível");
    const actingPlayer = who.role === "teacher" ? String(data.playerId || "") : who.playerId;
    if (!r.players.some((p) => p.id === actingPlayer && !p.withdrawn))
      fail(403, "Participante inválido");
    if (action === "discount-accept")
      acceptDiscountOffer(r, actingPlayer, String(data.offerId || ""));
    else if (action === "joint-accept") {
      acceptJointInvestment(r, actingPlayer, String(data.proposalId || ""), Number(data.amount));
      registerAcquiredCompanyLedgers(r);
    } else declineJointInvestment(r, actingPlayer, String(data.proposalId || ""));
    for (const player of r.players)
      if (!validateState(player.game) || !auditCash(player.game).ok)
        fail(500, "Liquidação coletiva inconsistente");
    r.revision++;
    await save();
    return json(res, 200, visibleSnapshot(r, who, req));
  }
  if (
    ["start", "pause", "resume", "finish", "advance", "finish-time", "continue-time"].includes(
      action,
    )
  ) {
    teacher(who);
    if (action === "start") {
      if (r.status !== "lobby" || r.players.filter((p) => !p.withdrawn).length < 2)
        fail(409, "É necessário ter de 2 a 6 participantes na sala");
      r.status = "playing";
      r.order = r.players.filter((p) => !p.withdrawn).map((p) => p.id);
      r.turnIndex = 0;
      r.round = 1;
      r.turnDeadline = Date.now() + TURN_MS;
      if (r.mode === "shared")
        r.presencialTimer = startPresentialTimer(
          Date.now(),
          r.order.length,
          process.env.NODE_ENV === "test" && process.env.TEST_PRESENTIAL_MS
            ? Number(process.env.TEST_PRESENTIAL_MS)
            : null,
        );
    }
    if (action === "pause") {
      if (r.status !== "playing") fail(409, "Sala não está em andamento");
      pausePresentialTimer(r);
      r.pausedRemaining = Math.max(0, (r.turnDeadline ?? Date.now()) - Date.now());
      r.turnDeadline = null;
      r.status = "paused";
    }
    if (action === "resume") {
      if (r.status !== "paused") fail(409, "Sala não está pausada");
      if (r.presencialTimer?.pendingDecision)
        fail(409, "Aguardando senha e decisão do Administrador");
      r.status = "playing";
      resumePresentialTimer(r);
      r.turnDeadline = Date.now() + (r.pausedRemaining ?? TURN_MS);
      r.pausedRemaining = null;
    }
    if (action === "advance") {
      if (r.status !== "playing") fail(409, "Sala não está em andamento");
      if (!r.order.length) fail(409, "Não existem jogadores ativos");
      if (r.mode === "shared") fail(409, "Na demonstração presencial, cada participante deve encerrar seu turno pelo botão Encerrar turno");
      if (Date.now() < (r.turnDeadline ?? Infinity))
        fail(409, "O turno ainda está dentro do prazo");
      const id = r.order[r.turnIndex];
      const p = r.players.find((x) => x.id === id);
      if (p?.game.pending) {
        if (p.game.currentCard?.corporateExpense?.requiresCompanySelection)
          throw Error("Selecione a empresa antes de avançar o turno");
        p.game = finishTurn(p.game);
        p.game.officialPOEnabled = true;
      }
      if (p) {
        r.turnIndex = (r.turnIndex + 1) % r.order.length;
        if (r.turnIndex === 0) {
          closeCompanies(r, r.round ?? 1);
          r.round = (r.round ?? 1) + 1;
          expireShareOffers(r);
          expireProposals(r);
          expireJointInvestments(r);
          expireDiscountOffers(r);
        }
        turnAdvance(r);
      }
      r.turnDeadline = r.status === "playing" ? Date.now() + TURN_MS : null;
      checkPresentialExpiry(r);
    }
    if (action === "finish-time") {
      if (
        r.mode !== "shared" ||
        r.status !== "paused" ||
        !r.presencialTimer?.pendingDecision
      )
        fail(409, "Encerramento por tempo indisponível");
      guardAuth(req, `round-decision:${code}`, 20);
      if (typeof data.password !== "string" || !equal(data.password, password))
        fail(401, "Senha do Administrador incorreta");
      if (r.players.some((p) => !validateState(p.game) || !auditCash(p.game).ok))
        fail(409, "Situação financeira inconsistente");
      r.presencialTimer.ranking = rankPresentialPlayers(r);
      r.endReason = "time_limit";
      r.status = "finished";
      r.turnDeadline = null;
    }
    if (action === "continue-time") {
      if (
        r.mode !== "shared" ||
        r.status !== "paused" ||
        !r.presencialTimer?.pendingDecision
      )
        fail(409, "Continuação por tempo indisponível");
      guardAuth(req, `round-decision:${code}`, 20);
      if (typeof data.password !== "string" || !equal(data.password, password))
        fail(401, "Senha do Administrador incorreta");
      r.status = "playing";
      continuePresentialRound(r);
      r.turnDeadline = Date.now() + (r.pausedRemaining ?? TURN_MS);
      r.pausedRemaining = null;
    }
    if (action === "finish") {
      if (r.mode === "shared" && r.status !== "lobby")
        fail(409, "No modo presencial, encerre pelo ranking ao final de uma rodada completa");
      if (r.status === "finished") fail(409, "Sala já encerrada");
      r.status = "finished";
      r.endReason = "teacher";
      r.turnDeadline = null;
    }
  } else {
    const p = current(r, who);
    if (!validateState(p.game) || !auditCash(p.game).ok)
      fail(409, "Partida financeira inconsistente");
    try {
      switch (action) {
        case "company-buy":
          purchaseCompanyShare(r, p.id, String(data.companyId || ""));
          break;
        case "discount-open":
          openDiscountOffer(r, p.id, data.companyId ? String(data.companyId) : null);
          break;
        case "joint-open":
          openJointInvestment(r, p.id, Number(data.amount), data.invitees);
          break;
        case "proposal-open":
          openProposal(r, p.id, String(data.companyId || ""), String(data.title || ""));
          break;
        case "proposal-vote":
          castVote(r, p.id, String(data.proposalId || ""), String(data.vote || ""));
          executeApprovedCorporateExpansion(r, String(data.proposalId || ""));
          executeApprovedCorporateRenegotiation(r, String(data.proposalId || ""));
          break;
        case "corporate-expand":
          proposeCorporateExpansion(
            r,
            p.id,
            String(data.companyId || ""),
            String(data.cardId || ""),
          );
          break;
        case "share-offer":
          publishShareOffer(
            r,
            p.id,
            String(data.companyId || ""),
            Number(data.percent),
            Number(data.price),
          );
          break;
        case "share-accept":
          acceptShareOffer(r, p.id, String(data.offerId || ""));
          break;
        case "npc-buy": {
          const offer = r.shareOffers?.find((o) => o.id === String(data.offerId || ""));
          if (!offer || offer.sellerId !== p.id)
            fail(403, "Apenas o vendedor pode confirmar a venda");
          buyShareNPC(r, offer.id, String(data.investorId || ""), data.acceptCounter === true);
          break;
        }
        case "roll": {
          p.game = rollTurn({ ...p.game, officialPOEnabled: true }, randomInt(1, 7));
          if (p.game.currentCard?.category === "MF")
            applyGlobalMarketEvent(r, p.game.currentCard.id);
          if (p.game.currentCard?.category === "DI" && p.game.circuit === "outer") {
            const card = p.game.currentCard;
            const occurrence = p.game.cardEvents?.at(-1);
            const elig = eligibleCorporateCompanies(r, p.id);
            const result =
              elig.length > 1
                ? { requiresCompanySelection: true, eligibleCompanies: elig }
                : applyCorporateExpense(
                    r,
                    p.id,
                    card.id,
                    occurrence?.id ?? `TURN-${p.id}-${p.game.turn}`,
                  );
            if (result) {
              card.corporateExpense = result;
              if (!result.requiresCompanySelection) {
                card.effectExecuted = true;
                if (occurrence) {
                  occurrence.resolution = "automatic";
                  occurrence.financialEffect = result.applicable;
                }
              }
            }
          }
          break;
        }
        case "corporate-expense-select": {
          const card = p.game.currentCard;
          if (
            !p.game.pending ||
            p.game.circuit !== "outer" ||
            !card?.corporateExpense?.requiresCompanySelection ||
            !card.id?.startsWith("DI-")
          )
            throw Error("Não há despesa empresarial aguardando seleção");
          const occurrence = p.game.cardEvents?.at(-1);
          const result = applyCorporateExpense(
            r,
            p.id,
            card.id,
            occurrence?.id ?? `TURN-${p.id}-${p.game.turn}`,
            String(data.companyId || ""),
          );
          card.corporateExpense = result;
          card.effectExecuted = true;
          if (occurrence) {
            occurrence.resolution = "automatic";
            occurrence.financialEffect = result.applicable;
          }
          break;
        }
        case "answer-education":
          p.game = answerEducationCard(p.game, String(data.choice || ""));
          break;
        case "choose-life":
          p.game = chooseLifeEvent(p.game, String(data.choice || ""));
          break;
        case "philanthropy":
          p.game = resolvePhilanthropy(p.game, Number(data.amount));
          break;
        case "rental-improve":
          p.game = improveRentalProperty(p.game, String(data.ownershipId));
          break;
        case "corporate-renegotiate":
          proposeCorporateRenegotiation(r, p.id, String(data.companyId), Number(data.term));
          break;
        case "special-refinance":
          p.game = resolveSpecialRefinancing(p.game, String(data.loanId), Number(data.term));
          break;
        case "special-amortize":
          p.game = resolveExtraordinaryAmortization(
            p.game,
            String(data.loanId),
            Number(data.amount),
          );
          break;
        case "special-acquisition-buy":
          p.game = purchaseSpecialOpportunity(
            p.game,
            data.term === undefined
              ? {}
              : { term: Number(data.term), downPayment: Number(data.downPayment) },
          );
          registerAcquiredCompanyLedgers(r);
          break;
        case "grand-investment-buy":
          p.game = purchaseGrandInvestment(
            p.game,
            data.term === undefined
              ? {}
              : { term: Number(data.term), downPayment: Number(data.downPayment) },
          );
          registerAcquiredCompanyLedgers(r);
          break;
        case "official-po-buy":
          p.game = purchaseOfficialSmallBusiness(p.game);
          break;
        case "official-security-buy": {
          const id = p.game.currentCard?.id;
          const total = r.players.reduce(
            (sum, player) => sum + (player.game?.officialSecurities?.[id] ?? 0),
            0,
          );
          if (!Number.isSafeInteger(total) || total + Number(data.quantity) > ISSUE_UNITS)
            throw Error("Emissão oficial esgotada nesta sala.");
          p.game = purchaseOfficialSecurity(p.game, Number(data.quantity));
          synchronizeOfficialPosition(r, p.game, id);
          break;
        }
        case "secondary-list":
          listSecondary(r, p.id, String(data.securityId || ""), Number(data.units));
          break;
        case "secondary-cancel":
          cancelSecondary(r, p.id, String(data.offerId || ""));
          break;
        case "secondary-buy":
          buySecondary(r, p.id, String(data.offerId || ""), Number(data.units));
          break;
        case "fixed-subscribe":
          p.game = subscribeFixedIncome(p.game, Number(data.amount), r.fixedIncomeRateBonus ?? 0);
          break;
        case "fixed-redeem":
          p.game = redeemFixedIncome(p.game, String(data.contractId || ""));
          break;
        case "official-po-asset-buy":
          p.game = purchaseOfficialPOAsset(p.game);
          break;
        case "official-company-buy": {
          const cardId = p.game.currentCard?.id;
          p.game = purchaseOfficialCompany(p.game);
          registerOwnedCompany(r, p.id, cardId);
          break;
        }
        case "real-estate-buy":
          p.game = purchaseRealEstate(p.game);
          break;
        case "real-estate-finance":
          p.game = financeRealEstate(p.game, Number(data.term), Number(data.downPayment));
          break;
        case "buy":
          p.game = buyVerifiedAsset(p.game, String(data.assetId || ""));
          break;
        case "credit":
          p.game = contractCredit(p.game, Number(data.amount), Number(data.term));
          break;
        case "prepay":
          p.game = prepayLoan(p.game, String(data.loanId), Number(data.amount));
          break;
        case "end":
          if (p.game.currentCard?.corporateExpense?.requiresCompanySelection)
            throw Error("Selecione a empresa antes de encerrar o turno");
          p.game = finishTurn(p.game);
          p.game.officialPOEnabled = true;
          r.turnIndex = (r.turnIndex + 1) % r.order.length;
          if (r.turnIndex === 0) {
            closeCompanies(r, r.round ?? 1);
            r.round = (r.round ?? 1) + 1;
            expireShareOffers(r);
            expireProposals(r);
            expireJointInvestments(r);
            expireDiscountOffers(r);
          }
          turnAdvance(r);
          r.turnDeadline = r.status === "playing" ? Date.now() + TURN_MS : null;
          if (r.mode === "shared" && r.turnIndex === 0) completePresentialRound(r);
          break;
        default:
          fail(404, "Ação inexistente");
      }
    } catch (e) {
      if (!e.status) e.status = 409;
      throw e;
    }
    if (p.game.won && r.mode !== "shared") {
      r.winnerOrder ??= [];
      if (!r.winnerOrder.includes(p.id)) r.winnerOrder.push(p.id);
      const idx = r.order.indexOf(p.id);
      r.order.splice(idx, 1);
      if (idx < r.turnIndex) r.turnIndex--;
      turnAdvance(r);
      r.turnDeadline = r.status === "playing" ? Date.now() + TURN_MS : null;
    }
    if (
      !validateState(p.game) ||
      !auditCash(p.game).ok ||
      !checkCompanies(r.companies) ||
      !checkNPC(r) ||
      !checkSecondary(r)
    )
      fail(500, "Operação gerou inconsistência");
  }
  r.revision++;
  await save();
  return json(res, 200, visibleSnapshot(r, who, req));
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
};
const server = http.createServer((req, res) => {
  queue(async () => {
    try {
      res.setHeader("x-content-type-options", "nosniff");
      res.setHeader("referrer-policy", "no-referrer");
      res.setHeader("x-frame-options", "DENY");
      res.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
      res.setHeader(
        "content-security-policy",
        "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'",
      );
      const url = new URL(req.url, "http://localhost");
      if (req.method === "GET" && url.pathname === "/health") {
        return json(res, 200, { status: "ok" });
      }
      if (url.pathname.startsWith("/api/")) return await api(req, res, url);
      if (req.method !== "GET") fail(405, "Método não permitido");
      let path = url.pathname === "/" ? "/index.html" : url.pathname;
      const allowed = [
        "/index.html",
        "/individual.html",
        "/styles.css",
        "/multiplayer.html",
        "/multiplayer.js",
        "/revisao-cartas.html",
        "/revisao-cartas.js",
        "/revisao-cartas.css",
        "/senai-logo.png",
      ];
      const publicModule = /^\/src\/[a-z0-9-]+\.(?:js|json)$/i.test(path);
      if (!allowed.includes(path) && !publicModule) fail(404, "Arquivo não encontrado");
      const filePath = join(root, path);
      if (!existsSync(filePath)) fail(404, "Arquivo não encontrado");
      const bytes = await readFile(filePath);
      res.writeHead(200, {
        "content-type": mime[extname(path)] || "application/octet-stream",
        "x-content-type-options": "nosniff",
        "cache-control": "no-store",
      });
      res.end(bytes);
    } catch (e) {
      json(res, e.status || 500, { error: e.status ? e.message : "Erro interno" });
    }
  });
});
const absenceSweep = setInterval(() => {
  queue(async () => {
    let changed = false;
    for (const room of Object.values(rooms)) {
      if (checkPresentialExpiry(room)) {
        room.revision++;
        changed = true;
      }
      if (room.status !== "playing" || !room.turnDeadline || Date.now() < room.turnDeadline)
        continue;
      if (skipAbsentTurn(room)) {
        room.revision++;
        changed = true;
      }
    }
    if (changed) await save();
  });
}, 1000);
absenceSweep.unref();
server.listen(port, () => console.log(`Corrida dos Ratos: http://localhost:${port}`));
export { server };
