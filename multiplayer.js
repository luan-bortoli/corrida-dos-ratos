import { CORPORATE_EXPANSIONS } from "./src/corporate-expansion-catalog.js";
import { specialAcquisitionOffer } from "./src/special-opportunities.js";
import { grandInvestmentOffer } from "./src/grand-investments.js";
import { philanthropyOffer } from "./src/philanthropy.js";
import { formatCashBRL } from "./src/money-balance.js";
import { fixedIncomeOffer, FIXED_INCOME } from "./src/fixed-income.js";
import { officialSecurityOffer, OFFICIAL_SECURITIES } from "./src/official-securities.js";
import {
  officialSmallBusinessOffer,
  officialPOAssetOffer,
} from "./src/official-small-businesses.js";
import { officialCompanyOffer } from "./src/official-companies.js";
import { realEstateOffer } from "./src/real-estate.js";
import { lifeDecision } from "./src/life-decisions.js";
import { getCard } from "./src/catalog.js";
import { cardStatusFeedback, cardLearningDisplay } from "./src/card-presentation.js";
import { expenseQuote, expenseQuoteOuter } from "./src/official-effects.js";
import { PROFESSIONS, DREAMS, VERIFIED_ASSETS, INNER, OUTER } from "./src/data.js";
const $ = (id) => document.getElementById(id),
  money = (n) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(n);
$("profession").innerHTML = PROFESSIONS.map(
  (p) => `<option value="${p.id}">${p.name}</option>`,
).join("");
$("dream").innerHTML = Object.entries(DREAMS)
  .map(([id, d]) => `<option value="${id}">${d.name}</option>`)
  .join("");
$("sharedProfession").innerHTML = $("profession").innerHTML;
$("sharedDream").innerHTML = $("dream").innerHTML;
let sharedView = "teacher";
let sharedConsultPlayer = "";
let currentRoomMode = "individual";
let session = null;
try {
  session = JSON.parse(sessionStorage.getItem("cr-room-session"));
} catch {}
const msg = (x) => {
  $("message").textContent = x;
  // Exibe a resposta da operação dentro da carta enquanto ela estiver aberta.
  const cardFeedback = $("gameCardFeedback");
  if (cardFeedback && $("gameCardDialog")?.open) {
    cardFeedback.textContent = x;
    cardFeedback.hidden = false;
  }
};

// Permite conferir a senha digitada sem expô-la por padrão.
$("togglePassword").onclick = () => {
  const field = $("password");
  const button = $("togglePassword");
  const visible = field.type === "password";
  field.type = visible ? "text" : "password";
  button.setAttribute("aria-label", visible ? "Ocultar senha" : "Mostrar senha");
  button.setAttribute("title", visible ? "Ocultar senha" : "Mostrar senha");
  button.setAttribute("aria-pressed", String(visible));
  button.querySelector(".password-slash").hidden = !visible;
};

const gameDialog = $("gameCardDialog");
const marketDialog = $("marketDialog");
let marketTab = "assets",
  lastMarketRoom = null;
$("closeMarket").onclick = () => marketDialog.close();
for (const tab of document.querySelectorAll("[data-market-tab]"))
  tab.onclick = () => {
    marketTab = tab.dataset.marketTab;
    if (lastMarketRoom) renderMarket(lastMarketRoom);
  };
$("closeGameCard").onclick = () => gameDialog.close();
$("roomOptions").onclick = () => {
  const list = $("roomOptionsList");
  list.hidden = !list.hidden;
  $("roomOptions").setAttribute("aria-expanded", String(!list.hidden));
};
$("cancelQuit").onclick = () => $("quitDialog").close();
$("quitRoom").onclick = () => {
  $("roomOptionsList").hidden = true;
  $("quitDialog").showModal();
};
const savedAccessKey = "cr-room-access-v2";
function allSavedAccess() {
  try {
    return JSON.parse(localStorage.getItem(savedAccessKey) || "{}");
  } catch {
    return {};
  }
}
function accessId(code, role, name = "") {
  return `${code.toUpperCase()}:${role}:${name.trim().toLocaleLowerCase("pt-BR")}`;
}
function persistAccess(s, name = "") {
  const all = allSavedAccess();
  all[accessId(s.code, s.role, name)] = { ...s, name };
  localStorage.setItem(savedAccessKey, JSON.stringify(all));
}
function dropAccess(s, name = "") {
  const all = allSavedAccess();
  delete all[accessId(s.code, s.role, name)];
  localStorage.setItem(savedAccessKey, JSON.stringify(all));
}
function exitToWelcome() {
  if (session) sessionStorage.setItem("cr-room-rejoin", JSON.stringify(session));
  session = null;
  sessionStorage.removeItem("cr-room-session");
  $("room").hidden = true;
  document.querySelector(".setup").hidden = false;
  $("topbarRoomMeta").hidden = true;
  $("roomHeaderCode").hidden = true;
  $("statusText").hidden = true;
  $("roomMenu").hidden = true;
  $("roomOptionsList").hidden = true;
  if (gameDialog.open) gameDialog.close();
  if (marketDialog.open) marketDialog.close();
  if ($("quitDialog").open) $("quitDialog").close();
  msg("Você saiu da sala. Seu progresso permanece registrado.");
}
$("teacherExitHome").onclick = () => {
  if (!session || session.role !== "teacher") return;
  if (!window.confirm("Sair da sala atual e voltar às modalidades? A sala permanecerá salva para acesso posterior.")) return;
  session = null;
  sessionStorage.removeItem("cr-room-session");
  sessionStorage.removeItem("cr-room-rejoin");
  sessionStorage.removeItem("cr-pending-reconnect");
  window.location.assign("/");
};
$("leaveRoom").onclick = async () => {
  if (!session) return;
  try {
    await req(`/api/room/${session.code}/leave`, "POST");
    exitToWelcome();
  } catch (e) {
    msg(e.message);
  }
};
$("confirmQuit").onclick = async () => {
  if (!session) return;
  try {
    const old = session;
    const playerName =
      (lastMarketRoom?.players || []).find((p) => p.id === lastMarketRoom?.you)?.name ||
      $("name").value;
    await req(`/api/room/${old.code}/withdraw`, "POST");
    dropAccess(old, playerName);
    exitToWelcome();
    sessionStorage.removeItem("cr-room-rejoin");
    $("rejoinRoom").hidden = true;
    msg("Desistência confirmada. Seu histórico foi preservado.");
  } catch (e) {
    $("quitDialog").close();
    msg(e.message);
  }
};
function openGameCard() {
  if (!$("currentCardPanel").hidden && !gameDialog.open) {
    $("gameCardFeedback").hidden = true;
    $("gameCardFeedback").textContent = "";
    gameDialog.showModal();
  }
}
async function req(path, method = "GET", body) {
  const response = await fetch(path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(session?.role === "teacher" && currentRoomMode === "shared" && sharedView === "player"
        ? {
            "x-shared-view": "player",
            ...(sharedConsultPlayer ? { "x-shared-player": sharedConsultPlayer } : {}),
          }
        : {}),
      ...(session ? { authorization: `Bearer ${session.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    const error = Error(result.error || "Erro na solicitação");
    error.status = response.status;
    throw error;
  }
  return result;
}
function store(s, name = "") {
  session = s;
  sessionStorage.setItem("cr-room-session", JSON.stringify(s));
  sessionStorage.removeItem("cr-room-rejoin");
  $("rejoinRoom").hidden = true;
  if (name) persistAccess(s, name);
}
const $roleAdmin = $("roleAdmin"),
  $rolePlayer = $("rolePlayer");
function selectLoginRole(role) {
  const admin = role === "admin";
  $("adminLogin").hidden = !admin;
  $("playerLogin").hidden = admin;
  $roleAdmin.classList.toggle("selected", admin);
  $rolePlayer.classList.toggle("selected", !admin);
  $roleAdmin.setAttribute("aria-pressed", String(admin));
  $rolePlayer.setAttribute("aria-pressed", String(!admin));
}
$roleAdmin.onclick = () => selectLoginRole("admin");
$rolePlayer.onclick = () => selectLoginRole("player");
function selectAdminMode(access) {
  $("adminCodeField").hidden = !access;
  $("adminLoginButton").hidden = !access;
  $("create").hidden = access;
  $("roomModeField").hidden = access || ["shared", "individual"].includes(requestedMode);
  $("adminCreateMode").classList.toggle("selected", !access);
  $("adminAccessMode").classList.toggle("selected", access);
}
const requestedMode = new URLSearchParams(window.location.search).get("mode");
if (requestedMode === "shared" || requestedMode === "individual") {
  $("roomMode").value = requestedMode;
  selectLoginRole("admin");
  selectAdminMode(false);
  if (requestedMode === "shared") {
    // Os participantes do modo presencial são cadastrados pelo professor.
    // Não há login independente de jogadores nessa modalidade.
    $("loginRoles").hidden = true;
    $("loginSubtitle").textContent = "Crie ou acesse uma sala para cadastrar os jogadores.";
  }
  $("chosenMode").hidden = false;
  $("chosenMode").textContent =
    requestedMode === "shared"
      ? "Modalidade: Presencial — Tela compartilhada"
      : "Modalidade: Multiplayer — Dispositivos individuais";
}
$("adminCreateMode").onclick = () => selectAdminMode(false);
$("adminAccessMode").onclick = () => selectAdminMode(true);
$("rejoinRoom").hidden = true;
$("rejoinRoom").onclick = async () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem("cr-room-rejoin"));
    session = saved;
    const r = await req(`/api/room/${saved.code}`);
    store(saved);
    render(r);
    msg("Você retornou à partida.");
  } catch (e) {
    session = null;
    msg(e.message);
  }
};
$("create").onclick = async () => {
  try {
    const mode = $("roomMode").value;
    const r = await req("/api/room/create", "POST", { password: $("password").value, mode });
    currentRoomMode = r.room.mode;
    sharedView = "teacher";
    store({ code: r.code, token: r.token, role: "teacher" }, "administrator");
    $("password").value = "";
    render(r.room);
    msg(
      r.room.mode === "shared"
        ? "Sala presencial criada. Cadastre os participantes antes de iniciar."
        : "Sala criada. Compartilhe o código com estudantes.",
    );
  } catch (e) {
    msg(e.message);
  }
};
$("adminLoginButton").onclick = async () => {
  try {
    const code = $("adminRoomCode").value.trim().toUpperCase();
    if (!/^[A-F0-9]{8}$/.test(code)) throw Error("Informe o código de 8 caracteres da sala");
    const r = await req(`/api/room/${code}/admin-login`, "POST", { password: $("password").value });
    currentRoomMode = r.room.mode;
    sharedView = "teacher";
    store({ code, token: r.token, role: "teacher" }, "administrator");
    $("password").value = "";
    render(r.room);
    msg("Acesso do administrador realizado.");
  } catch (e) {
    msg(e.message);
  }
};
let pendingReconnect = null;
function cancelPending() {
  pendingReconnect = null;
  sessionStorage.removeItem("cr-pending-reconnect");
  $("pendingReconnect").hidden = true;
}
async function reconnectStatus() {
  if (!pendingReconnect) return;
  try {
    const { code, requestId, ticket, name } = pendingReconnect;
    const result = await req(`/api/room/${code}/reconnect-status`, "POST", { requestId, ticket });
    if (result.status === "approved") {
      cancelPending();
      store({ code, token: result.token, role: "player" }, name);
      render(result.room);
      msg("Você retornou à partida.");
    }
  } catch (e) {
    cancelPending();
    msg(e.message);
  }
}
$("join").onclick = async () => {
  const code = $("code").value.trim().toUpperCase(),
    name = $("name").value.trim();
  try {
    if (!/^[A-F0-9]{8}$/.test(code)) throw Error("Informe o código de 8 caracteres da sala");
    if (name.length < 2 || name.length > 40) throw Error("Informe seu nome (2 a 40 caracteres)");
    const saved = allSavedAccess()[accessId(code, "player", name)];
    if (saved) {
      session = saved;
      try {
        const room = await req(`/api/room/${code}`);
        if (!room.players.find((p) => p.id === room.you)?.withdrawn) {
          store(saved, name);
          render(room);
          msg("Você retornou à partida.");
          return;
        }
      } catch (e) {
        session = null;
        if (e.status !== 401 && e.status !== 403) throw e;
      }
      session = null;
      dropAccess(saved, name);
    }
    try {
      const request = await req(`/api/room/${code}/reconnect-request`, "POST", { name });
      pendingReconnect = { code, name, requestId: request.requestId, ticket: request.ticket };
      sessionStorage.setItem("cr-pending-reconnect", JSON.stringify(pendingReconnect));
      $("pendingReconnect").hidden = false;
      msg("Aguarde a autorização do administrador para retornar.");
      return;
    } catch (e) {
      if (e.status !== 404) throw e;
      if (!e.message.includes("Jogador não encontrado")) throw e;
    }
    const result = await req(`/api/room/${code}/join`, "POST", {
      name,
      professionId: Number($("profession").value),
      dreamId: $("dream").value,
    });
    store({ code, token: result.token, role: "player" }, name);
    render(result.room);
    msg("Você entrou na sala.");
  } catch (e) {
    msg(e.message);
  }
};
// Mantidos apenas para compatibilidade com versões anteriores, sem controles de recuperação na tela.
$("recoverTeacher").onclick = () => {};
$("recover").onclick = () => {};
try {
  pendingReconnect = JSON.parse(sessionStorage.getItem("cr-pending-reconnect") || "null");
} catch {}
$("pendingReconnect").hidden = !pendingReconnect;
setInterval(() => {
  if (pendingReconnect && document.visibilityState === "visible") reconnectStatus();
}, 3000);
async function perform(action, body) {
  if (!session) return;
  try {
    if (
      session.role === "teacher" &&
      currentRoomMode === "shared" &&
      ["joint-accept", "joint-decline", "discount-accept"].includes(action)
    ) {
      body = { ...body, playerId: lastMarketRoom?.you };
    }
    const result = await req(`/api/room/${session.code}/${action}`, "POST", body);
    if (action === "start" && result.mode === "shared" && session.role === "teacher") {
      sharedView = "player";
      sharedConsultPlayer = "";
      render(await req(`/api/room/${session.code}`));
    } else {
      if (action === "end") {
        sharedConsultPlayer = "";
        if (currentRoomMode === "shared" && session.role === "teacher")
          render(await req(`/api/room/${session.code}`));
        else render(result);
      } else render(result);
    }
    msg("Operação registrada.");
  } catch (e) {
    msg(e.message);
  }
}
$("sharedGameView").onclick = async () => {
  if (currentRoomMode !== "shared" || !session || session.role !== "teacher") return;
  sharedView = "player";
  try {
    render(await req(`/api/room/${session.code}`));
  } catch (e) {
    msg(e.message);
  }
};
$("sharedConsultPlayer").onchange = async () => {
  sharedConsultPlayer = $("sharedConsultPlayer").value;
  if (currentRoomMode !== "shared" || !session || session.role !== "teacher") return;
  try {
    render(await req(`/api/room/${session.code}`));
  } catch (e) {
    msg(e.message);
  }
};
$("sharedTeacherView").onclick = async () => {
  if (currentRoomMode !== "shared" || !session || session.role !== "teacher") return;
  const password = window.prompt("Senha do professor para acessar a administração:");
  if (password === null) return;
  try {
    await req(`/api/room/${session.code}/shared-teacher-unlock`, "POST", { password });
    sharedView = "teacher";
    render(await req(`/api/room/${session.code}`));
  } catch (e) {
    msg(e.message);
  }
};
$("sharedAddPlayer").onclick = async () => {
  const name = $("sharedPlayerName").value.trim();
  if (!session || session.role !== "teacher") return;
  try {
    const r = await req(`/api/room/${session.code}/shared-add-player`, "POST", {
      name,
      professionId: Number($("sharedProfession").value),
      dreamId: $("sharedDream").value,
    });
    $("sharedPlayerName").value = "";
    render(r);
    msg(`${name} foi adicionado à sala.`);
  } catch (e) {
    msg(e.message);
  }
};
function renderReconnectRequests(r) {
  const area = $("teacherReconnectRequests"),
    panel = $("teacherReconnectPanel");
  if (!area || !panel) return;
  const requests = r.teacher ? r.reconnectRequests || [] : [];
  panel.hidden = !requests.length;
  area.replaceChildren();
  for (const request of requests) {
    const row = document.createElement("div");
    row.className = "event";
    const label = document.createElement("span");
    label.textContent = request.name + " solicita retorno à sala";
    row.append(label);
    for (const [decision, title] of [
      ["approve", "Autorizar"],
      ["reject", "Recusar"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "outline";
      button.textContent = title;
      button.onclick = () => perform("reconnect-review", { requestId: request.id, decision });
      row.append(button);
    }
    area.append(row);
  }
}
for (const a of ["start", "pause", "resume", "finish", "roll", "end"])
  $(a).onclick = () => perform(a);
$("buy").onclick = () => perform("buy", { assetId: window.currentOffer });
async function downloadTeacherReport(format) {
  if (!session || session.role !== "teacher") return;
  try {
    const response = await fetch(`/api/room/${session.code}/report?format=${format}`, {
      headers: { authorization: `Bearer ${session.token}` },
    });
    if (!response.ok) {
      const data = await response.json();
      throw Error(data.error || "Relatório indisponível");
    }
    const blob = await response.blob();
    const address = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = address;
    a.download = `corrida-${session.code}-relatorio.${format === "csv" ? "csv" : "json"}`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(address);
    msg("Relatório exportado.");
  } catch (e) {
    msg(e.message);
  }
}

$("reportPrint").onclick = async () => {
  if (!session || session.role !== "teacher") return;
  try {
    const report = await req(`/api/room/${session.code}/report`);
    const safe = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    const rows = (report.participants || [])
      .map(
        (p) =>
          `<tr><td>${safe(p.name)}</td><td>${safe(p.profession)}</td><td>${safe(p.dream)}</td><td>${p.completed ? "Sim" : "Não"}</td><td>${p.rank ?? "—"}</td><td>${Number(p.closures) || 0}</td><td>${Number(p.cardDraws) || 0}</td><td>${Number(p.educationCorrect) || 0}/${Number(p.educationAnswers) || 0}</td><td>${safe(p.cashFormatted)}</td></tr>`,
      )
      .join("");
    const winners =
      (report.progress?.winners || [])
        .map((w) => `<li>${Number(w.place) || 0}º — ${safe(w.name)}: ${safe(w.dream)}</li>`)
        .join("") || "<li>Nenhum sonho realizado até este relatório</li>";
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório da sala ${safe(report.roomCode)}</title><style>body{font:14px system-ui,Arial;max-width:1100px;margin:30px auto;padding:0 18px;color:#222}h1{font-size:26px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #aaa;padding:7px;text-align:left}th{background:#eee}footer{margin-top:26px;color:#555}button{padding:9px 15px;margin:10px 0}@media print{button{display:none}body{margin:0}table{font-size:10px}}</style></head><body><h1>Corrida dos Ratos — Relatório pedagógico</h1><p><strong>Sala:</strong> ${safe(report.roomCode)} · <strong>Rodada:</strong> ${Number(report.round) || 0} · <strong>Situação:</strong> ${safe(report.status)} · <strong>Participantes:</strong> ${Number(report.participantsCount) || 0}</p><h2>Ordem de realização dos sonhos</h2><ol>${winners}</ol><h2>Indicadores dos participantes</h2><table><thead><tr><th>Nome</th><th>Profissão</th><th>Sonho</th><th>Realizado</th><th>Posição</th><th>Fechamentos</th><th>Cartas</th><th>Educação financeira</th><th>Caixa (R$)</th></tr></thead><tbody>${rows}</tbody></table><footer><p>Os indicadores derivam dos eventos registrados. Não representam notas escolares, nem certificam a conciliação financeira integral.</p></footer><button onclick="window.print()">Imprimir / salvar como PDF</button></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" }),
      link = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = link;
    a.download = `corrida-${session.code}-relatorio-imprimivel.html`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(link), 3000);
    msg("Relatório HTML para impressão gerado. Abra-o e use Imprimir > Salvar como PDF.");
  } catch (e) {
    msg(e.message);
  }
};
$("reportJson").onclick = () => downloadTeacherReport("json");
$("reportCsv").onclick = () => downloadTeacherReport("csv");
$("corporateOperation").onclick = async () => {
  if (!session || session.role !== "teacher") return;
  try {
    const room = await req(`/api/room/${session.code}`);
    const list = (room.companies || []).map((c) => `${c.id}: ${c.name}`).join("\n");
    const companyId = prompt("Empresa (copie o ID):\n" + list);
    if (!companyId) return;
    const kind = prompt("Tipo: revenue (receita) ou expense (despesa)", "revenue");
    if (!kind) return;
    const amount = Number(prompt("Valor em reais inteiros, de 1 a 1.000.000", "100"));
    const document = prompt("Identificador único do comprovante (5 a 80 caracteres)");
    if (!document) return;
    const result = await req(`/api/room/${session.code}/corporate-operation`, "POST", {
      companyId,
      type: kind,
      amount,
      document,
    });
    render(result.room);
    msg(
      `Operação contabilizada: ${result.operation.type} de ${money(result.operation.amount)} em ${result.operation.companyId}.`,
    );
  } catch (e) {
    msg(e.message);
  }
};
$("cardAudit").onclick = async () => {
  if (!session || session.role !== "teacher") return;
  try {
    const report = await req(`/api/room/${session.code}/card-audit`);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corrida-${session.code}-auditoria-cartas.json`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    msg(
      `Inventário: ${report.totalActual} cartas; ${report.officialTextAvailable} com texto original; ${report.errors.length} inconsistências.`,
    );
  } catch (e) {
    msg(e.message);
  }
};

function render(r) {
  currentRoomMode = r.mode || "individual";
  const shared = r.mode === "shared" && session?.role === "teacher";
  $("sharedNavigation").hidden = true; // Navegação presencial fica no cabeçalho, sem faixa adicional.
  if (shared) {
    const consult = $("sharedConsultPlayer");
    const previous = sharedConsultPlayer;
    consult.replaceChildren(
      new Option("Jogador da vez", ""),
      ...r.players.filter((p) => !p.withdrawn).map((p) => new Option(p.name, p.id)),
    );
    consult.value = previous && r.players.some((p) => p.id === previous) ? previous : "";
    $("sharedConsultLabel").hidden = r.teacher || r.status !== "playing";
    $("sharedGameView").classList.toggle("selected", !r.teacher);
    $("sharedTeacherView").classList.toggle("selected", r.teacher);
    $("sharedRegistration").hidden = !r.teacher || r.status !== "lobby";
    $("sharedPlayerCount").textContent = `${r.players.length} de 6 jogadores cadastrados`;
    const registrationFull = r.players.length >= 6;
    // Evita interromper toda a renderização caso um arquivo HTML antigo permaneça
    // em cache ou uma tela não contenha todos os controles de cadastro presencial.
    for (const id of ["sharedPlayerName", "sharedProfession", "sharedDream", "sharedAddPlayer"]) {
      const field = $(id);
      if (field) field.disabled = registrationFull || r.status !== "lobby";
    }
    if (registrationFull) $("sharedPlayerCount").textContent += " · Limite atingido";
  } else $("sharedRegistration").hidden = true;
  $("room").hidden = false;
  document.querySelector(".setup").hidden = true;
  $("topbarRoomMeta").hidden = false;
  if ($("roomTitle")) $("roomTitle").textContent = "Corrida dos Ratos";
  $("roomHeaderCode").hidden = false;
  $("roomHeaderCode").textContent = "Sala " + r.code;
  $("statusText").hidden = false;
  $("statusText").textContent =
    {
      lobby: "Aguardando início",
      playing: "Em andamento",
      paused: "Partida pausada",
      finished: "Partida encerrada",
    }[r.status] || "Sala";
  $("roomMenu").hidden = !!r.teacher || !!r.sharedAdmin;
  $("quitRoom").hidden = !!r.players.find((p) => p.id === r.you)?.withdrawn;
  renderReconnectRequests(r);
  $("progressSummary").textContent = r.progress
    ? `Rodada ${r.progress.round} · ${r.progress.completedPlayers}/${r.progress.totalPlayers} sonhos realizados · ${r.progress.activePlayers} participantes ativos${r.progress.endedByTeacher ? " · encerramento pelo professor" : ""}${r.progress.allDreamsCompleted ? " · todos os sonhos realizados" : ""}`
    : "";
  $("players").replaceChildren(
    ...r.players.map((p) => {
      const e = document.createElement("div");
      e.className = "event";
      e.textContent = `${p.id === r.activePlayerId ? "▶ " : ""}${p.name} · ${PROFESSIONS.find((x) => x.id === p.professionId)?.name} · Casa ${p.position} · ${p.circuit === "outer" ? "Alta Velocidade" : "Corrida dos Ratos"}${p.withdrawn ? " · Desistiu da partida" : ""}${p.won ? " · Sonho realizado" + (r.progress?.winners.find((w) => w.id === p.id)?.place ? " · " + r.progress.winners.find((w) => w.id === p.id).place + "º lugar" : "") : ""}`;
      return e;
    }),
  );
  const companyArea = $("companies");
  companyArea.replaceChildren(
    ...(r.companies || [])
      .filter((c) => r.teacher || (r.you && Number(c.shares?.[r.you] || 0) > 0))
      .map((c) => {
        const el = document.createElement("div");
        el.className = "event";
        const label = document.createElement("p");
        label.textContent = r.teacher
          ? `${c.name} · reserva R$ ${c.reserveRequired} · caixa R$ ${c.cash} · fechamento: rodada ${c.lastClosedRound || "ainda não"} · últimos dividendos: ${money(c.distributions?.at(-1)?.paid || 0)}`
          : `${c.name} · sua participação: ${c.shares?.[r.you] || 0}%`;
        el.append(label);
        const me = r.players.find((p) => p.id === r.you);
        if (me) {
          const share = c.shares[me.id] || 0;
          const detail = document.createElement("p");
          detail.textContent = `Sua participação: ${share}% · oferta: ${c.offer.percent}% por ${money(c.offer.price)}`;
          if (r.teacher) el.append(detail);
          const button = document.createElement("button");
          button.textContent = "Comprar participação à vista";
          button.className = "outline";
          button.disabled = !(
            r.status === "playing" &&
            r.activePlayerId === me.id &&
            r.game?.pending &&
            r.game?.lastTile === "GO" &&
            r.game?.currentCard?.id === c.id &&
            r.game?.cardEvents?.at(-1)?.resolution === "pending" &&
            !r.game?.offerResolved &&
            r.game?.cash * 100 + (r.game?.secondaryCashCents ?? 0) >= c.offer.price * 100 &&
            c.shares.origin >= c.offer.percent
          );
          button.onclick = () => perform("company-buy", { companyId: c.id });
          if (r.teacher) el.append(button);
          if (share > 0) {
            const sell = document.createElement("button");
            sell.className = "outline";
            sell.textContent = "Anunciar participação";
            sell.disabled = !(r.status === "playing" && r.activePlayerId === me.id);
            sell.onclick = () => {
              const pct = Number(prompt(`Percentual para venda (máximo ${share}%)`, String(share)));
              const price = Number(prompt("Preço total solicitado em R$", "1000"));
              if (!Number.isSafeInteger(pct) || !Number.isSafeInteger(price))
                return msg("Informe números inteiros válidos");
              perform("share-offer", { companyId: c.id, percent: pct, price });
            };
            el.append(sell);
            const prop = document.createElement("button");
            prop.className = "outline";
            prop.textContent = "Propor deliberação";
            prop.disabled = !(r.status === "playing" && r.activePlayerId === me.id);
            prop.onclick = () => {
              const title = prompt(
                "Descrição da proposta societária (sem efeito financeiro automático)",
              );
              if (title) perform("proposal-open", { companyId: c.id, title });
            };
            el.append(prop);
          }
        }
        return el;
      }),
  );
  if (r.game?.currentCard?.corporateExpense?.requiresCompanySelection) {
    for (const company of r.game.currentCard.corporateExpense.eligibleCompanies) {
      const b = document.createElement("button");
      b.className = "outline";
      b.textContent = `Atribuir despesa a ${company.name}`;
      b.disabled = !(r.status === "playing" && r.activePlayerId === r.you);
      b.onclick = () => perform("corporate-expense-select", { companyId: company.id });
      companyArea.append(b);
    }
  }
  // Participações GI compartilhadas: convidados respondem mesmo fora de seu turno.
  for (const proposal of (r.jointInvestments || []).filter(
    (p) =>
      r.teacher ||
      (p.status === "open" &&
        (p.invitedIds?.includes(r.you) ||
          p.initiatorId === r.you ||
          Object.hasOwn(p.commitments || {}, r.you))),
  )) {
    const box = document.createElement("div");
    box.className = "event";
    const paid = Object.values(proposal.commitments).reduce((sum, v) => sum + v, 0);
    const caption = document.createElement("p");
    caption.textContent = `Proposta conjunta ${proposal.cardId} — ${proposal.companyName}: ${money(paid)} de ${money(proposal.offerCost)} comprometidos · ${proposal.status} · validade até rodada ${proposal.expiresRound}`;
    box.append(caption);
    if (
      r.you &&
      proposal.status === "open" &&
      proposal.invitedIds.includes(r.you) &&
      !Object.hasOwn(proposal.commitments, r.you) &&
      !proposal.declinedIds.includes(r.you) &&
      r.status === "playing"
    ) {
      const yes = document.createElement("button");
      yes.className = "outline";
      yes.textContent = "Confirmar aporte";
      yes.onclick = () => {
        const remaining = proposal.offerCost - paid;
        const answer = prompt(`Aporte em reais (até ${money(remaining)})`, String(remaining));
        if (answer !== null)
          perform("joint-accept", { proposalId: proposal.id, amount: Number(answer) });
      };
      box.append(yes);
      const no = document.createElement("button");
      no.className = "outline";
      no.textContent = "Recusar convite";
      no.onclick = () => perform("joint-decline", { proposalId: proposal.id });
      box.append(no);
    }
    companyArea.append(box);
  }
  const offersArea = $("shareOffers");
  offersArea.replaceChildren(
    ...(r.shareOffers || [])
      .filter((o) => o.status === "open" && (r.teacher || o.sellerId !== r.you))
      .map((o) => {
        const el = document.createElement("div");
        el.className = "event";
        const label = document.createElement("p");
        label.textContent = `${o.companyId} · ${o.percent}% por ${money(o.price)} · preferência até a rodada ${o.preferenceUntil} · expira após a rodada ${o.expiresRound}`;
        el.append(label);
        const me = r.players.find((p) => p.id === r.you);
        if (me && me.id !== o.sellerId) {
          const eligible =
            r.round > o.preferenceUntil || !o.eligible.length || o.eligible.includes(me.id);
          const btn = document.createElement("button");
          btn.className = "outline";
          btn.textContent = "Aceitar oferta";
          btn.disabled = !(
            r.status === "playing" &&
            r.activePlayerId === me.id &&
            eligible &&
            r.game?.cash >= o.price
          );
          btn.onclick = () => perform("share-accept", { offerId: o.id });
          el.append(btn);
        }
        return el;
      }),
  );
  const market = r.secondaryMarket || { offers: [], trades: [], volumes: {} };
  if (r.teacher) {
    const hasOfficialAssets = Object.values(r.game?.officialSecurities || {}).some((n) => n > 0);
    if (hasOfficialAssets || market.offers.length) {
      const marketTitle = document.createElement("h3");
      marketTitle.textContent = "Mercado secundário de ações e fundos";
      companyArea.append(marketTitle);
    }
    const canTrade = r.status === "playing" && r.activePlayerId === r.you;
    for (const [securityId, units] of Object.entries(r.game?.officialSecurities || {})) {
      if (!units) continue;
      const quote = r.officialMarket?.find((q) => q.id === securityId);
      const line = document.createElement("div");
      line.className = "event";
      line.textContent = `${securityId}: ${units} unidades; cotação R$ ${((quote?.priceCents ?? 0) / 100).toFixed(2)}`;
      const b = document.createElement("button");
      b.className = "outline";
      b.textContent = "Anunciar venda";
      b.disabled = !canTrade;
      b.onclick = () => {
        const value = prompt("Quantidade de unidades para anunciar:", String(units));
        if (value !== null) perform("secondary-list", { securityId, units: Number(value) });
      };
      line.append(b);
      companyArea.append(line);
    }
    for (const o of market.offers) {
      const line = document.createElement("div");
      line.className = "event";
      const name = r.players.find((p) => p.id === o.sellerId)?.name || "Estudante";
      line.textContent = `${name} oferece ${o.units} unidades ${o.securityId}; cotação atual R$ ${(o.priceCents / 100).toFixed(2)}`;
      if (o.sellerId === r.you) {
        const b = document.createElement("button");
        b.className = "outline";
        b.textContent = "Cancelar anúncio";
        b.disabled = !canTrade;
        b.onclick = () => perform("secondary-cancel", { offerId: o.id });
        line.append(b);
      } else if (r.you) {
        const b = document.createElement("button");
        b.className = "outline";
        b.textContent = "Comprar unidades";
        b.disabled = !canTrade;
        b.onclick = () => {
          const value = prompt("Quantidade de unidades para comprar:", "1");
          if (value !== null) perform("secondary-buy", { offerId: o.id, units: Number(value) });
        };
        line.append(b);
      }
      companyArea.append(line);
    }
  }
  const npcArea = $("npcInvestors");
  npcArea.replaceChildren(
    ...(r.teacher ? r.npcInvestors || [] : []).map((i) => {
      const el = document.createElement("div");
      el.className = "event";
      el.textContent = `${i.label}: ${money(i.cash)} disponíveis`;
      return el;
    }),
  );
  const npcOffersArea = $("npcOffers");
  npcOffersArea.replaceChildren(
    ...(r.shareOffers || [])
      .filter((o) => o.status === "open" && o.sellerId === r.you)
      .map((o) => {
        const el = document.createElement("div");
        el.className = "event";
        const label = document.createElement("p");
        label.textContent = `Oferta ${o.companyId}: ${o.percent}% por ${money(o.price)} (preferência até a rodada ${o.preferenceUntil})`;
        el.append(label);
        for (const inv of r.npcInvestors || []) {
          const b = document.createElement("button");
          b.className = "outline";
          b.textContent = `Negociar com ${inv.label} (pode oferecer menos)`;
          b.disabled = !(
            r.status === "playing" &&
            r.activePlayerId === r.you &&
            r.round > o.preferenceUntil &&
            inv.cash >= o.price &&
            r.round <= o.expiresRound
          );
          b.onclick = () => {
            const ref = (r.companies || []).find((c) => c.id === o.companyId);
            const profile = {
              conservador: { base: 80, min: 75, max: 90 },
              moderado: { base: 92, min: 85, max: 100 },
              arrojado: { base: 100, min: 90, max: 110 },
            }[inv.id];
            if (!ref || !profile) return;
            const value = Math.round((ref.valuation * o.percent) / 100),
              payout = ((ref.referenceDistribution || 0) * o.percent) / 100,
              rate = value > 0 ? (payout / value) * 100 : 0,
              adjust =
                (rate >= 2.5 ? 10 : rate >= 1.5 ? 5 : 0) -
                ((ref.referenceDistribution || 0) === 0 ? 5 : 0),
              pct = Math.max(profile.min, Math.min(profile.max, profile.base + adjust)),
              max = Math.floor((value * pct) / 100),
              counter = Math.min(o.price, max);
            if (counter <= 0 || inv.cash < counter)
              return msg("Comprador sem recursos ou sem contraproposta válida.");
            if (
              !confirm(
                "Confirmar venda de " +
                  o.percent +
                  "% por " +
                  money(counter) +
                  (counter < o.price ? " (contraproposta inferior ao anúncio)" : "") +
                  "?",
              )
            )
              return;
            perform("npc-buy", {
              offerId: o.id,
              investorId: inv.id,
              acceptCounter: counter < o.price,
            });
          };
          el.append(b);
        }
        npcOffersArea.append(el);
      }),
  );
  const proposalArea = $("proposals");
  proposalArea.replaceChildren(
    ...(r.proposals || [])
      .filter(
        (pr) =>
          r.teacher ||
          (pr.status === "open" &&
            Number((r.companies || []).find((c) => c.id === pr.companyId)?.shares?.[r.you] || 0) >
              0),
      )
      .map((pr) => {
        const el = document.createElement("div");
        el.className = "event";
        const t = document.createElement("p");
        t.textContent = `${pr.companyId} · ${pr.title} · ${pr.status} · prazo rodada ${pr.expiresRound}`;
        el.append(t);
        const me = r.players.find((p) => p.id === r.you);
        const co = r.companies?.find((c) => c.id === pr.companyId);
        if (
          me &&
          pr.status === "open" &&
          !me.won &&
          (co?.shares?.[me.id] || 0) > 0 &&
          !Object.hasOwn(pr.ballots, me.id) &&
          r.status === "playing" &&
          r.activePlayerId === me.id
        ) {
          for (const [vote, label] of [
            ["yes", "Aprovar"],
            ["no", "Rejeitar"],
            ["abstain", "Abster-se"],
          ]) {
            const b = document.createElement("button");
            b.className = "outline";
            b.textContent = label;
            b.onclick = () => perform("proposal-vote", { proposalId: pr.id, vote });
            el.append(b);
          }
        }
        return el;
      }),
  );
  $("teacherActions").hidden = !r.teacher;
  $("start").disabled = r.status !== "lobby";
  $("pause").disabled = r.status !== "playing";
  $("resume").disabled = r.status !== "paused";
  $("finish").disabled = r.status === "finished";
  const me = r.players.find((p) => p.id === r.you),
    active = r.players.find((p) => p.id === r.activePlayerId);
  $("timerInfo").textContent =
    r.status === "playing"
      ? `Restam ${r.secondsRemaining} segundos para a decisão`
      : "Temporizador suspenso";
  $("recoveryInfo").textContent = "";
  $("turnInfo").textContent = active ? "Decisões da jogada" : "Sem turnos ativos";
  const allowed = r.status === "playing" && !me?.withdrawn && me?.id === r.activePlayerId;
  $("playerActions").hidden = !allowed || !!me?.withdrawn;
  const g = r.game;
  const edu = $("educationQuestion");
  edu.replaceChildren();
  edu.hidden = true;
  if (g?.pending && g.currentCard?.category === "EF") {
    const q = g.currentCard.quizQuestion;
    const ev = g.cardEvents?.at(-1);
    edu.hidden = false;
    const title = document.createElement("p");
    title.textContent = q
      ? `${g.currentCard.id}: ${q.question}`
      : `${g.currentCard.id}: pergunta indisponível`;
    edu.append(title);
    if (q && ev?.resolution === "pending")
      q.options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.className = "outline";
        btn.textContent = `${"ABCD"[index]}) ${opt}`;
        btn.onclick = () => perform("answer-education", { choice: "ABCD"[index] });
        edu.append(btn);
      });
    else {
      const feedback = document.createElement("p");
      feedback.textContent = g.currentCard.quizFeedback
        ? `Resposta ${g.currentCard.quizFeedback.correct ? "correta" : "incorreta"}. Gabarito: ${g.currentCard.quizFeedback.correctAnswer}; recompensa ${money(g.currentCard.quizFeedback.reward)}.`
        : "Pergunta encerrada sem resposta.";
      edu.append(feedback);
    }
  }
  const life = $("lifeDecision");
  life.replaceChildren();
  life.hidden = true;
  if (g?.pending && g.currentCard?.category === "EV") {
    const d = lifeDecision(g.currentCard.id, g.circuit);
    const ev = g.cardEvents?.at(-1);
    if (d && ev?.resolution === "pending") {
      life.hidden = false;
      for (const [choice, label] of [
        ["accept", d.accept],
        ["reject", d.reject],
      ]) {
        const b = document.createElement("button");
        b.className = "outline";
        b.textContent = label;
        b.onclick = () => perform("choose-life", { choice });
        life.append(b);
      }
    } else if (g.currentCard?.lifeDecision) {
      life.hidden = false;
      life.textContent = "Decisão registrada: " + g.currentCard.lifeDecision.choice;
    }
  }
  const philanthropy = philanthropyOffer(g?.currentCard, g?.circuit);
  if (g?.pending && philanthropy) {
    life.hidden = false;
    const p = document.createElement("p");
    p.textContent = `Filantropia — ${philanthropy.project}. Impacto social estimado, sem benefício financeiro.`;
    life.append(p);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      for (const [amount, impact] of philanthropy.options) {
        const b = document.createElement("button");
        b.className = "outline";
        b.textContent = `Contribuir ${money(amount)} — ${impact} ${philanthropy.unit}`;
        b.disabled = amount * 100 > g.cash * 100 + (g.secondaryCashCents ?? 0);
        b.onclick = () => perform("philanthropy", { amount });
        life.append(b);
      }
      const b = document.createElement("button");
      b.textContent = "Não contribuir";
      b.onclick = () => perform("philanthropy", { amount: 0 });
      life.append(b);
    }
  }
  const cardOfferArea = $("companyOffer");
  cardOfferArea.replaceChildren();
  if (
    g?.pending &&
    g.currentCard?.id === "OE-015" &&
    g.cardEvents?.at(-1)?.resolution === "pending" &&
    allowed
  ) {
    const companies = (r.companies ?? []).filter(
      (c) => (c.shares?.[r.you] ?? 0) > 0 && c.pendingExpenses > 0,
    );
    const info = document.createElement("p");
    info.textContent =
      "OE-015 — renegociação de obrigações empresariais, sujeita à análise de capacidade e votação.";
    cardOfferArea.append(info);
    for (const c of companies) {
      for (const term of [6, 12, 24]) {
        const b = document.createElement("button");
        b.textContent = `Renegociar ${c.name} em ${term} fechamentos`;
        b.onclick = () => perform("corporate-renegotiate", { companyId: c.id, term });
        cardOfferArea.append(b);
      }
    }
  }
  const expansion = CORPORATE_EXPANSIONS[g?.currentCard?.id];
  if (
    g?.pending &&
    g.lastTile === "OE" &&
    expansion &&
    g.cardEvents?.at(-1)?.resolution === "pending" &&
    allowed
  ) {
    const heading = document.createElement("p");
    heading.textContent = `${g.currentCard.id} — investimento empresarial ${money(expansion.cost)}; projeção de resultado +${expansion.rate}%, condicionada a lucro verificado.`;
    cardOfferArea.append(heading);
    for (const company of (r.companies || []).filter(
      (c) =>
        (c.shares?.[r.you] || 0) > 0 &&
        expansion.match.test(c.name) &&
        (!expansion.requiresProfit || c.retainedProfit > 0),
    )) {
      const button = document.createElement("button");
      button.className = "outline";
      button.textContent = `Propor expansão em ${company.name} (${money(expansion.cost)})`;
      button.disabled = company.cash < expansion.cost;
      button.onclick = () =>
        perform("corporate-expand", { companyId: company.id, cardId: g.currentCard.id });
      cardOfferArea.append(button);
    }
  }
  if (
    g?.pending &&
    g.currentCard?.id === "OE-004" &&
    g.cardEvents?.at(-1)?.resolution === "pending" &&
    allowed
  ) {
    const assets = (g.assets ?? []).filter(
      (a) =>
        a.passive > 0 && a.kind !== "participation" && a.kind !== "company" && a.id !== "GO-006",
    );
    const info = document.createElement("p");
    info.textContent = "OE-004: reforma de R$ 20.000, com aluguel +15% no fechamento seguinte.";
    cardOfferArea.append(info);
    for (const a of assets) {
      const b = document.createElement("button");
      b.textContent = "Reformar " + a.name;
      b.disabled = g.cash * 100 + (g.secondaryCashCents ?? 0) < 2000000;
      b.onclick = () => perform("rental-improve", { ownershipId: a.ownershipId });
      cardOfferArea.append(b);
    }
  }
  if (
    g?.pending &&
    g.currentCard?.id === "OE-012" &&
    g.cardEvents?.at(-1)?.resolution === "pending" &&
    allowed
  ) {
    const info = document.createElement("p");
    info.textContent =
      "OE-012: participação de 20% por R$ 51.000. A transferência respeita preferência dos sócios atuais por duas rodadas.";
    cardOfferArea.append(info);
    const candidates = (r?.companies || []).filter(
      (c) => c.valuation === 300000 && (c.shares?.origin ?? 0) >= 20,
    );
    const chooser = document.createElement("select");
    const standard = document.createElement("option");
    standard.value = "";
    standard.textContent = "Oferta demonstrativa da carta";
    chooser.append(standard);
    for (const c of candidates) {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = `${c.name} (avaliação R$ 300.000)`;
      chooser.append(option);
    }
    cardOfferArea.append(chooser);
    const button = document.createElement("button");
    button.textContent = "Apresentar proposta de compra";
    button.onclick = () =>
      perform("discount-open", chooser.value ? { companyId: chooser.value } : {});
    cardOfferArea.append(button);
  }
  for (const offer of (r?.discountOffers || []).filter((o) => o.status === "open" && r.you)) {
    const eligible = offer.eligible.includes(r.you);
    const restricted = offer.eligible.length > 0 && r.round <= offer.preferenceUntil && !eligible;
    const info = document.createElement("p");
    info.textContent = `OE-012: oferta aberta R$ 51.000 por 20%; preferência até rodada ${offer.preferenceUntil}; encerra na rodada ${offer.expiresRound}.`;
    cardOfferArea.append(info);
    const buy = document.createElement("button");
    buy.textContent = "Exercer preferência / comprar OE-012";
    buy.className = "outline";
    buy.disabled = restricted || g?.cash * 100 + (g?.secondaryCashCents ?? 0) < 5100000;
    buy.onclick = () => perform("discount-accept", { offerId: offer.id });
    cardOfferArea.append(buy);
  }
  const special = specialAcquisitionOffer(g?.currentCard, g?.circuit);
  if (g?.pending && special) {
    const p = document.createElement("p");
    p.textContent = `${special.id} — ${special.name}, compra à vista por ${money(special.cost)}.`;
    cardOfferArea.append(p);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const b = document.createElement("button");
      b.textContent = "Comprar oportunidade especial";
      b.disabled =
        ["OE-007", "OE-009"].includes(special.id) ||
        g.cash * 100 + (g.secondaryCashCents ?? 0) < special.cost * 100;
      b.onclick = () => perform("special-acquisition-buy");
      cardOfferArea.append(b);
      if (["OE-007", "OE-009", "OE-017", "OE-020"].includes(special.id)) {
        const joint = document.createElement("button");
        joint.className = "outline";
        joint.textContent = "Propor aquisição conjunta";
        joint.onclick = () => {
          const invitees = r.players.filter((p) => p.id !== r.you && !p.won);
          if (!invitees.length) return msg("Não há estudante para convidar");
          const raw = prompt(
            "IDs dos convidados: " + invitees.map((p) => `${p.name} (${p.id})`).join(" | "),
            invitees.map((p) => p.id).join(","),
          );
          if (raw === null) return;
          const amountRaw = prompt(
            "Seu aporte em R$ (inferior ao preço total)",
            String(Math.floor(special.cost / 2)),
          );
          if (amountRaw === null) return;
          perform("joint-open", {
            invitees: raw
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            amount: Number(amountRaw),
          });
        };
        cardOfferArea.append(joint);
      }
      if (special.id === "OE-010") {
        for (const term of [6, 12, 24]) {
          const f = document.createElement("button");
          f.className = "outline";
          f.textContent = `Financiar imóvel em ${term}x`;
          f.onclick = () => {
            const minimum = Math.ceil(special.cost * 0.4);
            const raw = prompt(`Entrada mínima ${money(minimum)}`, String(minimum));
            if (raw === null) return;
            const downPayment = Number(raw);
            if (!Number.isSafeInteger(downPayment)) return msg("Entrada inválida");
            perform("special-acquisition-buy", { term, downPayment });
          };
          cardOfferArea.append(f);
        }
      }
    }
  }
  if (
    g?.pending &&
    g.currentCard?.id === "OE-016" &&
    g.cardEvents?.at(-1)?.resolution === "pending" &&
    allowed
  ) {
    const b = document.createElement("button");
    b.textContent = "Amortização extraordinária";
    b.onclick = () => {
      const loans = [
        ...(g.initialDebtCents > 0 ? [{ id: "initial", balance: g.initialDebtCents / 100 }] : []),
        ...(g.loans ?? []).filter((l) => l.balance > 0),
      ];
      if (!loans.length) return msg("Nenhuma dívida ativa");
      const id = prompt(
        "ID da dívida: " + loans.map((l) => `${l.id} (${money(l.balance)})`).join(" | "),
        loans[0].id,
      );
      if (id === null) return;
      const v = prompt("Amortização mínima R$ 1.000", "1000");
      if (v !== null) perform("special-amortize", { loanId: id, amount: Number(v) });
    };
    cardOfferArea.append(b);
  }
  if (
    g?.pending &&
    g.currentCard?.id === "OE-014" &&
    g.cardEvents?.at(-1)?.resolution === "pending" &&
    allowed
  ) {
    for (const loan of (g.loans ?? []).filter((l) => l.balance > 0)) {
      const t = document.createElement("p");
      t.textContent = `Contrato ${loan.id.slice(0, 8)}: saldo ${money(loan.balance)}`;
      cardOfferArea.append(t);
      for (const term of [6, 12, 24]) {
        const b = document.createElement("button");
        b.textContent = `Renegociar ${term}x`;
        b.onclick = () => perform("special-refinance", { loanId: loan.id, term });
        cardOfferArea.append(b);
      }
    }
  }
  // Ofertas societárias GO-016 a GO-020: apresentar decisões junto à carta sorteada.
  const goOffer = (r.companies || []).find(
    (c) =>
      c.id === g?.currentCard?.id &&
      g?.currentCard?.category === "GO" &&
      g?.lastTile === "GO" &&
      g?.circuit === "inner",
  );
  if (g?.pending && goOffer) {
    const available = goOffer.shares.origin >= goOffer.offer.percent;
    const info = document.createElement("p");
    info.textContent = `${goOffer.id} — ${goOffer.name}: adquirir ${goOffer.offer.percent}% por ${money(goOffer.offer.price)}. Avaliação da empresa: ${money(goOffer.valuation)}. Distribuição total de referência: ${money(goOffer.referenceDistribution)} por fechamento, condicionada ao lucro efetivamente apurado.`;
    cardOfferArea.append(info);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const cash = g.cash * 100 + (g.secondaryCashCents ?? 0);
      const direct = document.createElement("button");
      direct.textContent = "Adquirir participação à vista";
      direct.disabled = !available || cash < goOffer.offer.price * 100;
      direct.onclick = () => perform("company-buy", { companyId: goOffer.id });
      cardOfferArea.append(direct);
      const joint = document.createElement("button");
      joint.className = "outline";
      joint.textContent = "Propor aquisição conjunta";
      joint.disabled =
        !available || !(r.players || []).some((p) => p.id !== r.you && !p.won) || cash < 100;
      joint.onclick = () => {
        const invitees = r.players.filter((p) => p.id !== r.you && !p.won);
        const raw = prompt(
          "IDs dos convidados, separados por vírgula: " +
            invitees.map((p) => `${p.name} (${p.id})`).join(" | "),
          invitees.map((p) => p.id).join(","),
        );
        if (raw === null) return;
        const contribution = prompt(
          `Seu aporte (R$ 1 a R$ ${goOffer.offer.price - 1})`,
          String(Math.min(Math.floor(goOffer.offer.price / 2), Math.floor(cash / 100))),
        );
        if (contribution === null) return;
        perform("joint-open", {
          invitees: raw
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          amount: Number(contribution),
        });
      };
      cardOfferArea.append(joint);
      if (!available) {
        const note = document.createElement("p");
        note.textContent = "A participação oferecida já foi adquirida ou está indisponível.";
        cardOfferArea.append(note);
      }
    }
  }
  const grand = grandInvestmentOffer(g?.currentCard, g?.circuit);
  if (g?.pending && grand) {
    const p = document.createElement("p");
    p.textContent = `${grand.id} — ${grand.name}. Preço ${money(grand.cost)}. ${grand.kind === "company" ? "Lucro de referência sujeito a apuração" : "Renda inicial de referência"} ${money(grand.referencePassive)}.`;
    cardOfferArea.append(p);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const b = document.createElement("button");
      b.textContent = "Comprar à vista";
      b.disabled = g.cash * 100 + (g.secondaryCashCents ?? 0) < grand.cost * 100;
      b.onclick = () => perform("grand-investment-buy", {});
      cardOfferArea.append(b);
      if (grand.kind === "participation") {
        const joint = document.createElement("button");
        joint.className = "outline";
        joint.textContent = "Propor aquisição conjunta";
        joint.onclick = () => {
          const invitees = r.players.filter((p) => p.id !== r.you && !p.won);
          if (!invitees.length) return msg("Não há outro estudante para convidar");
          const raw = prompt(
            "IDs dos convidados, separados por vírgula: " +
              invitees.map((p) => `${p.name} (${p.id})`).join(" | "),
            invitees.map((p) => p.id).join(","),
          );
          if (raw === null) return;
          const ids = raw
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          const amount = Number(
            prompt(
              "Seu aporte inicial em reais (menor que o preço total)",
              String(Math.floor(grand.cost / 2)),
            ),
          );
          if (!Number.isSafeInteger(amount)) return msg("Aporte inválido");
          perform("joint-open", { invitees: ids, amount });
        };
        cardOfferArea.append(joint);
      }
      for (const term of grand.kind === "participation" ? [] : [6, 12, 24]) {
        const f = document.createElement("button");
        f.className = "outline";
        f.textContent = `Solicitar financiamento ${term}x`;
        f.onclick = () => {
          const min = Math.ceil((grand.cost * grand.minDown) / 100);
          const raw = prompt(`Entrada mínima: ${money(min)}`, String(min));
          if (raw === null) return;
          const downPayment = Number(raw);
          if (!Number.isSafeInteger(downPayment)) return msg("Entrada inválida");
          perform("grand-investment-buy", { term, downPayment });
        };
        cardOfferArea.append(f);
      }
    }
  }
  const sec = officialSecurityOffer(g?.currentCard, g?.circuit);
  if (g?.pending && sec && g.officialPOEnabled) {
    const line = document.createElement("p");
    const quote = room?.officialMarket?.find((x) => x.id === sec.id);
    line.textContent = `${sec.id} — ${sec.name}: cotação de referência R$ ${((quote?.priceCents ?? sec.price * 100) / 100).toFixed(2)}, limite ${sec.min}–${sec.max}, dividendo de referência R$ ${((quote?.dividendCents ?? sec.dividendCents) / 100).toFixed(2)} por unidade; compra primária segue preço da carta até migração integral do caixa para centavos; venda não garantida.`;
    cardOfferArea.append(line);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const b = document.createElement("button");
      b.textContent = "Comprar ações/cotas";
      b.onclick = () => {
        const answer = prompt(
          `Quantas ações/cotas deseja comprar? (mínimo ${sec.min}, máximo ${sec.max})`,
          String(sec.min),
        );
        if (answer === null) return;
        const quantity = Number(answer.trim());
        if (!answer.trim() || !Number.isSafeInteger(quantity) || quantity < sec.min || quantity > sec.max) {
          msg(`Quantidade inválida. Escolha de ${sec.min} a ${sec.max} ações/cotas.`);
          return;
        }
        perform("official-security-buy", { quantity });
      };
      cardOfferArea.append(b);
    }
  }
  const fixed = fixedIncomeOffer(g?.currentCard, g?.circuit);
  if (g?.pending && fixed && g.officialPOEnabled) {
    const p = document.createElement("p");
    p.textContent = `${fixed.id}: ${fixed.name}. Aplicação de ${money(fixed.min)} a ${money(fixed.max)}, passo ${money(fixed.step)}; ${fixed.distribution === "coupon" ? "cupom distribuído" : "rendimento acumulado"}.`;
    cardOfferArea.append(p);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const b = document.createElement("button");
      b.textContent = "Aplicar em renda fixa";
      b.onclick = () => {
        const a = prompt(
          `Valor (${fixed.min}–${fixed.max}, incremento ${fixed.step})`,
          String(fixed.min),
        );
        if (a !== null) perform("fixed-subscribe", { amount: Number(a) });
      };
      cardOfferArea.append(b);
    }
  }
  if (g && !g.pending && allowed) {
    for (const c of (g.fixedIncome ?? []).filter((x) => x.status === "active")) {
      const contract = FIXED_INCOME.find((x) => x.id === c.cardId);
      const p = document.createElement("p");
      p.textContent = `${c.cardId}: saldo ${money(c.balance)}, ${c.elapsed} fechamento(s).`;
      cardOfferArea.append(p);
      if (["full", "discount2"].includes(contract.early)) {
        const b = document.createElement("button");
        b.textContent = `Resgatar ${c.cardId}`;
        b.onclick = () => perform("fixed-redeem", { contractId: c.id });
        cardOfferArea.append(b);
      }
    }
  }
  const poAsset = officialPOAssetOffer(g?.currentCard, g?.circuit);
  if (poAsset && g?.pending && g.officialPOEnabled) {
    const p = document.createElement("p");
    p.textContent =
      poAsset.kind === "rental"
        ? `${poAsset.id} — ${poAsset.name}: ${money(poAsset.cost)}; renda inicial ${money(poAsset.passive)} por fechamento.`
        : `${poAsset.id} — ${poAsset.name}: ${money(poAsset.cost)}; preço-alvo ${money(poAsset.targetPrice)}, sem venda automática ou renda passiva.`;
    cardOfferArea.append(p);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const b = document.createElement("button");
      b.textContent =
        poAsset.kind === "rental"
          ? "Comprar equipamento para locação"
          : "Comprar estoque para revenda";
      b.className = "outline";
      b.disabled = g.cash < poAsset.cost;
      b.onclick = () => perform("official-po-asset-buy");
      cardOfferArea.append(b);
    }
  }
  const po = officialSmallBusinessOffer(g?.currentCard, g?.circuit);
  if (po && g?.pending && g.officialPOEnabled) {
    const p = document.createElement("p");
    p.textContent = `${po.id} — ${po.name}. Preço: ${money(po.cost)}; renda inicial: ${money(po.passive)} por fechamento.`;
    cardOfferArea.append(p);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const b = document.createElement("button");
      b.textContent = "Adquirir pequeno negócio";
      b.className = "outline";
      b.disabled = g.cash < po.cost;
      b.onclick = () => perform("official-po-buy");
      cardOfferArea.append(b);
    }
  }
  const company = officialCompanyOffer(g?.currentCard, g?.circuit);
  if (company && g?.pending) {
    const p = document.createElement("p");
    p.textContent = `${company.id} — ${company.name}. À vista: ${money(company.cost)}. Distribuição inicial de referência ${money(company.passive)} por fechamento; apuração empresarial futura.`;
    cardOfferArea.append(p);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const b = document.createElement("button");
      b.textContent = "Adquirir empresa à vista";
      b.className = "outline";
      b.disabled = g.cash < company.cost;
      b.onclick = () => perform("official-company-buy");
      cardOfferArea.append(b);
    }
  }
  const realEstateArea = $("realEstateOffer");
  realEstateArea.replaceChildren();
  const offer = realEstateOffer(g?.currentCard, g?.circuit);
  if (offer && g?.pending) {
    const info = document.createElement("p");
    info.textContent = `${offer.id} — ${offer.name}: ${money(offer.cost)} à vista; renda inicial ${money(offer.passive)} por fechamento (eventos de vacância ainda pendentes).`;
    realEstateArea.append(info);
    if (g.cardEvents?.at(-1)?.resolution === "pending" && allowed) {
      const b = document.createElement("button");
      b.textContent = "Comprar imóvel à vista";
      b.className = "outline";
      b.disabled = g.cash < offer.cost;
      b.onclick = () => perform("real-estate-buy");
      realEstateArea.append(b);
      for (const term of [6, 12, 24]) {
        const down = Math.ceil((offer.cost * offer.minDown) / 100);
        const b = document.createElement("button");
        b.className = "outline";
        b.textContent = `Solicitar financiamento ${term}x · entrada ${money(down)}`;
        b.onclick = () => {
          const response = prompt(
            `Entrada para ${offer.id} (mínimo R$ ${down}, máximo R$ ${offer.cost - 1})`,
            String(down),
          );
          if (response === null) return;
          const downPayment = Number(response);
          if (!Number.isSafeInteger(downPayment) || downPayment < down || downPayment >= offer.cost)
            return msg("Entrada inválida.");
          if (
            !confirm(
              `Solicitar análise de crédito para ${offer.id}, entrada ${money(downPayment)}, prazo ${term} fechamentos?`,
            )
          )
            return;
          perform("real-estate-finance", { term, downPayment });
        };
        realEstateArea.append(b);
      }
    }
  }
  if (g) {
    $("personal").textContent =
      `Caixa: ${formatCashBRL(g)} · Dívida inicial: ${money(g.debt)} · Fechamentos: ${g.closures} · Pendências: ${money((g.arrearsLiving || 0) + (g.arrearsLoan || 0))} · dividendos na janela atual: ${money(g.pendingCorporatePassive || 0)}`;
    $("roll").disabled = g.pending || g.won;
    $("end").disabled = !g.pending;
    const a = VERIFIED_ASSETS.find((x) => x.id === g.currentOffer);
    window.currentOffer = a?.id;
    $("buy").hidden = !(g.pending && a && !g.offerResolved);
    $("buy").disabled = !a || g.cash < a.cost;
    $("offerInfo").textContent = a
      ? `Oferta: ${a.name} por ${money(a.cost)} (renda ${money(a.passive)} por fechamento)`
      : g.pending && g.currentCard
        ? `Carta ${g.currentCard.id} (${g.currentCard.category}):\n${getCard(g.currentCard.id)?.text ?? "Texto indisponível"}\n${g.currentCard.effectExecuted ? "Efeito automático registrado no histórico; encerre o turno." : "Sem efeito automático implementado para esta carta; encerre o turno."}`
        : g.pending
          ? "Esta casa ainda não possui um evento implementado. Encerre o turno."
          : "";
  } else {
    $("personal").textContent = "Painel de acompanhamento dos estudantes.";
    $("offerInfo").textContent = "";
  }
  updateLayout(r);
}
if (session) {
  req(`/api/room/${session.code}`)
    .then(render)
    .catch((e) => {
      session = null;
      sessionStorage.removeItem("cr-room-session");
      msg(e.message);
    });
}
setInterval(() => {
  if (session && document.visibilityState === "visible")
    req(`/api/room/${session.code}`)
      .then(render)
      .catch((e) => msg(e.message));
}, 2500);

// Interface de homologação v2.0: toda a apresentação é derivada do estado já retornado pelo servidor.
const TILE_LABELS = {
  PAY: "Pagamento",
  PO: "Pequena oportunidade",
  GO: "Grande oportunidade",
  GI: "Grande investimento",
  OE: "Oportunidade especial",
  DI: "Despesa inesperada",
  EV: "Evento da vida",
  EF: "Educação financeira",
  BE: "Benefício",
  MF: "Mercado financeiro",
  FI: "Filantropia",
};
const CATEGORY_LABELS = {
  PO: "Pequena Oportunidade",
  GO: "Grande Oportunidade",
  GI: "Grande Investimento",
  OE: "Oportunidade Especial",
  DI: "Despesa Inesperada",
  EV: "Evento da Vida",
  EF: "Educação Financeira",
  BE: "Benefício",
  MF: "Mercado Financeiro",
  FI: "Filantropia",
};
const cleanMarkdown = (value) =>
  String(value ?? "")
    .replace(/\\\$/g, "R$")
    .replace(/\*\*/g, "")
    .replace(/^\s*#{1,5}\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
function splitCardText(original, id) {
  const text = String(original ?? "")
    .replace(/\\\$/g, "R$")
    .replace(/\*\*/g, "")
    .replace(/^\s*#{1,5}\s*/gm, "")
    .replace(/\r/g, "");
  if (text.includes("\t")) {
    const columns = text
      .split("\t")
      .map((x) => cleanMarkdown(x))
      .filter(Boolean);
    if (columns[0] === id) columns.shift();
    const headline = columns.shift() || id;
    const parts = /^([^.!?]+)[.!?]\s*(.*)$/.exec(headline);
    const title = parts?.[1] || headline,
      description = parts?.[2] || "";
    const fields = [];
    if (columns[0]) fields.push(["Condição ou efeito descrito", columns[0]]);
    if (columns[1]) fields.push(["Aprendizado", columns[1]]);
    return { title, description, fields, raw: "" };
  }
  const lines = text
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x !== id);
  const categoryLines = new Set([
    "Pequeno negócio",
    "Imóvel",
    "Ações",
    "Renda fixa",
    "Grande investimento",
    "Oportunidade especial",
  ]);
  const title =
    lines.find((x, i) => i > 0 && !categoryLines.has(x) && !x.includes(":") && x.length < 100) ||
    lines.find((x) => x.length < 95 && !x.includes(":")) ||
    id;
  const after = lines.slice(lines.indexOf(title) + 1);
  const description =
    after.find(
      (x) =>
        !/(?:^|\s)(?:Investimento|Preço|Requisito|Decisão|Consequência|Risco|Liquidez|Aprendizagem|Aprendizado):/i.test(
          x,
        ),
    ) || "";
  const fields = [];
  const combined = after.filter((x) => x !== description).join(" ");
  for (const name of [
    "Investimento",
    "Preço",
    "Renda líquida inicial",
    "Renda inicial",
    "Requisito",
    "Decisão",
    "Consequência",
    "Risco",
    "Liquidez",
    "Aprendizagem",
    "Aprendizado",
  ]) {
    const re = new RegExp(
      `(?:^|[.;]\\s*|\\s)(` +
        name +
        `):\\s*([\\s\\S]*?)(?=(?:\\.\\s+|;\\s+)(?:Investimento|Preço|Renda líquida inicial|Renda inicial|Requisito|Decisão|Consequência|Risco|Liquidez|Aprendizagem|Aprendizado):|$)`,
      "i",
    );
    const m = combined.match(re);
    if (m) fields.push([name, m[2].trim().replace(/[.;]$/, "")]);
  }
  return {
    title: cleanMarkdown(title),
    description: cleanMarkdown(description),
    fields,
    raw: cleanMarkdown(combined),
  };
}
const displayLabel = (node, label, value) => {
  const block = document.createElement("div");
  block.className = "metric";
  const cap = document.createElement("span");
  cap.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = value;
  block.append(cap, strong);
  node.append(block);
};
// RC5 — Mercado contextual: as ações existentes continuam submetidas aos endpoints e regras do servidor.
const marketBRL = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    (Number(cents) || 0) / 100,
  );
function marketInfo(r) {
  const owned = Object.entries(r.game?.officialSecurities || {}).filter(([, n]) => Number(n) > 0);
  const companies = (r.companies || []).filter((c) => Number(c.shares?.[r.you] || 0) > 0);
  const ownSec = (r.secondaryMarket?.offers || []).filter((o) => o.sellerId === r.you);
  const ownShares = (r.shareOffers || []).filter(
    (o) => o.status === "open" && o.sellerId === r.you,
  );
  const incomingSec = (r.secondaryMarket?.offers || []).filter((o) => o.sellerId !== r.you);
  const incomingShares = (r.shareOffers || []).filter(
    (o) =>
      o.status === "open" &&
      o.sellerId !== r.you &&
      (r.round > o.preferenceUntil || !o.eligible?.length || o.eligible?.includes(r.you)),
  );
  return {
    owned,
    companies,
    ownSec,
    ownShares,
    incomingSec,
    incomingShares,
    assets: owned.length + companies.length + (r.game?.assets || []).length + (r.game?.fixedIncome || []).filter((a) => a.status === "active").length,
    ads: ownSec.length + ownShares.length,
    offers: incomingSec.length + incomingShares.length,
    ids: [...incomingSec.map((o) => "sec:" + o.id), ...incomingShares.map((o) => "share:" + o.id)],
  };
}
function marketSeenKey(r) {
  return "cr-market-seen:" + r.code + ":" + r.you;
}
function marketUnseen(r, info) {
  let seen = [];
  try {
    seen = JSON.parse(sessionStorage.getItem(marketSeenKey(r)) || "[]");
  } catch {}
  return info.ids.filter((id) => !seen.includes(id)).length;
}
function marketMarkSeen(r, info) {
  sessionStorage.setItem(marketSeenKey(r), JSON.stringify(info.ids));
}
function marketBox(title, description, action, actionText, disabled, extra = "") {
  const card = document.createElement("div");
  card.className = "market-item";
  const heading = document.createElement("strong");
  heading.textContent = title;
  card.append(heading);
  const desc = document.createElement("p");
  desc.textContent = description;
  card.append(desc);
  if (extra) {
    const foot = document.createElement("small");
    foot.textContent = extra;
    card.append(foot);
  }
  if (action) {
    const button = document.createElement("button");
    button.className = "outline";
    button.type = "button";
    button.textContent = actionText;
    button.disabled = disabled;
    button.onclick = action;
    card.append(button);
  }
  return card;
}
function makeMarketHub(r) {
  const info = marketInfo(r),
    hub = document.createElement("div");
  hub.className = "board-market-hub";
  const label = document.createElement("div");
  label.className = "board-market-label";
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "▣";
  const t = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = "Mercado";
  const caption = document.createElement("small");
  caption.textContent = "Investimentos e negociações";
  t.append(name, caption);
  label.append(icon, t);
  const stats = document.createElement("div");
  stats.className = "board-market-stats";
  stats.textContent = `Ativos ${info.assets} · Anúncios ${info.ads} · Ofertas ${info.offers}`;
  const button = document.createElement("button");
  button.className = "board-market-open";
  button.textContent = "Abrir Mercado →";
  button.type = "button";
  button.onclick = () => {
    marketTab = "assets";
    renderMarket(r);
    if (!marketDialog.open) marketDialog.showModal();
  };
  hub.append(label, stats, button);
  const unseen = marketUnseen(r, info);
  if (unseen > 0) {
    const badge = document.createElement("span");
    badge.className = "board-market-notice";
    badge.textContent = `${unseen} nova${unseen === 1 ? " oferta" : "s ofertas"}`;
    hub.append(badge);
  }
  return hub;
}
function renderMarket(r) {
  lastMarketRoom = r;
  if (r.teacher || !r.you) return;
  const info = marketInfo(r),
    body = $("marketSectionBody");
  const defs = {
    assets: ["Meus investimentos", "Seu patrimônio por categoria. Valor investido não significa dinheiro disponível para saque ou venda."],
    ads: ["Meus anúncios", "Acompanhe anúncios ativos e negociações com investidores."],
    offers: [
      "Ofertas disponíveis",
      "Anúncios de outros participantes que você pode consultar. Compras respeitam preferência, saldo e turno.",
    ],
  };
  const [title, help] = defs[marketTab];
  $("marketSectionTitle").textContent = title;
  $("marketSectionHelp").textContent = help;
  for (const [key, count] of [
    ["Assets", info.assets],
    ["Ads", info.ads],
    ["Offers", info.offers],
  ]) {
    $("marketTab" + key + "Count").textContent = count;
    $("marketTotal" + key).textContent = count;
  }
  $("marketTotalDividends").textContent = money(r.game?.pendingCorporatePassive || 0);
  for (const tab of document.querySelectorAll("[data-market-tab]"))
    tab.setAttribute("aria-selected", String(tab.dataset.marketTab === marketTab));
  // Mantém os controles originais conectados ao DOM entre trocas de abas e atualizações.
  const parking = $("businessPanel").querySelector(".business-content");
  for (const id of ["companies", "proposals", "npcOffers", "shareOffers"]) {
    const el = $(id);
    if (el && el.parentElement !== parking) parking.append(el);
  }
  body.replaceChildren();
  const canTrade =
    r.status === "playing" &&
    r.activePlayerId === r.you &&
    !r.players.find((p) => p.id === r.you)?.withdrawn;
  if (marketTab === "assets") {
    // Carteira unificada: apresenta apenas posições pertencentes ao jogador atual.
    // Os valores são informativos; compras, resgates e vendas continuam no servidor.
    const section = (heading) => {
      const title = document.createElement("h4");
      title.className = "market-portfolio-heading";
      title.textContent = heading;
      body.append(title);
    };
    const ownedAssets = r.game?.assets || [];
    const groups = [
      ["Pequenos negócios", (a) => a.source === "official_small_business" || a.kind === "small_business"],
      ["Imóveis e equipamentos de locação", (a) => ["official_real_estate", "official_rental"].includes(a.source) || ["real_estate", "rental"].includes(a.kind)],
      ["Estoques para revenda", (a) => a.source === "official_resale_stock" || a.kind === "resale"],
      ["Empresas e outros investimentos", (a) => true],
    ];
    const accounted = new Set();
    for (const [heading, match] of groups) {
      const positions = ownedAssets.filter((a, index) => !accounted.has(index) && match(a))
        .map((asset) => ({ asset, index: ownedAssets.indexOf(asset) }));
      if (!positions.length) continue;
      section(heading);
      for (const { asset, index } of positions) {
        accounted.add(index);
        const details = [`Valor de aquisição: ${money(asset.cost || 0)}`];
        if (typeof asset.passive === "number" && asset.passive > 0) {
          details.push(`Renda de referência: ${money(asset.passive)} por fechamento`);
        } else {
          details.push("Sem rendimento recorrente confirmado");
        }
        if (asset.targetPrice) details.push(`Preço-alvo para revenda: ${money(asset.targetPrice)} (não garantido)`);
        if (asset.loanId) details.push("Aquisição com financiamento");
        body.append(marketBox(`${asset.id || "Ativo"} — ${asset.name || "Investimento"}`, details.join(" · "), null, null, true,
          "Registro patrimonial. Operações somente quando autorizadas pelas regras do jogo."));
      }
    }
    const fixedContracts = (r.game?.fixedIncome || []).filter((c) => c.status === "active");
    if (fixedContracts.length) {
      section("Investimentos de renda fixa");
      for (const contract of fixedContracts) {
        const offer = FIXED_INCOME.find((a) => a.id === contract.cardId);
        const details = [
          `Aplicado: ${money(contract.principal)}`,
          `Saldo contratado: ${money(contract.balance)}`,
          `Períodos decorridos: ${contract.elapsed || 0}`,
        ];
        if (offer?.term) details.push(`Prazo: ${offer.term} fechamentos`);
        body.append(marketBox(`${contract.cardId} — ${offer?.name || "Renda fixa"}`, details.join(" · "), null, null, true,
          "Resgate sujeito às condições do contrato; consulte as ações disponíveis na partida."));
      }
    }
    if (info.owned.length) section("Ações e fundos");
    for (const [id, units] of info.owned) {
      const sec = OFFICIAL_SECURITIES.find((x) => x.id === id),
        quote = r.officialMarket?.find((q) => q.id === id),
        price = quote?.priceCents ?? (sec?.price || 0) * 100;
      // Unidades já ofertadas continuam no patrimônio, mas não podem ser anunciadas novamente.
      const reserved = info.ownSec
        .filter((o) => o.securityId === id)
        .reduce((sum, o) => sum + o.units, 0);
      const available = Math.max(0, units - reserved);
      const card = marketBox(
        `${id} — ${sec?.name || "Investimento"}`,
        `${units} unidade${units !== 1 ? "s" : ""} · ${reserved} anunciada${reserved !== 1 ? "s" : ""} · ${available} ${available === 1 ? "disponível" : "disponíveis"} para venda · Cotação ${marketBRL(price)} · Valor de referência ${marketBRL(price * units)}`,
        () => {
          if (!available) return;
          const raw = prompt(`Quantidade para anunciar (máximo ${available})`, String(available));
          if (raw === null) return;
          const n = Number(raw);
          if (!Number.isSafeInteger(n) || n <= 0 || n > available)
            return msg("Informe uma quantidade válida");
          perform("secondary-list", { securityId: id, units: n });
        },
        available === 0 ? "Todas anunciadas" : "Anunciar venda",
        !canTrade || available === 0,
        `Tipo: ${sec?.kind === "fund" ? "Fundo" : "Ações"}`,
      );
      body.append(card);
    }
    // Reaproveita controles societários e convites existentes, sem duplicar as regras de negócio.
    const companyArea = $("companies");
    if (companyArea.childElementCount) {
      const box = document.createElement("div");
      box.className = "market-legacy";
      const h = document.createElement("h4");
      h.textContent = "Empresas e participações";
      box.append(h, companyArea);
      body.append(box);
    }
    const proposals = $("proposals");
    if (proposals.childElementCount) {
      const box = document.createElement("div");
      box.className = "market-legacy";
      const h = document.createElement("h4");
      h.textContent = "Propostas e votações";
      box.append(h, proposals);
      body.append(box);
    }
  } else if (marketTab === "ads") {
    for (const o of info.ownSec) {
      body.append(
        marketBox(
          `${o.securityId} — anúncio ativo`,
          `${o.units} unidade(s) · Cotação ${marketBRL(o.priceCents)}`,
          () => perform("secondary-cancel", { offerId: o.id }),
          "Cancelar anúncio",
          !canTrade,
        ),
      );
    }
    for (const o of info.ownShares) {
      body.append(
        marketBox(
          `Participação ${o.companyId}`,
          `${o.percent}% por ${money(o.price)} · Preferência até a rodada ${o.preferenceUntil}`,
          null,
          null,
          true,
          "Oferta válida até a rodada " + o.expiresRound,
        ),
      );
    }
    const npc = $("npcOffers");
    if (npc.childElementCount) {
      const box = document.createElement("div");
      box.className = "market-legacy";
      const h = document.createElement("h4");
      h.textContent = "Negociação com investidores fictícios";
      box.append(h, npc);
      body.append(box);
    }
  } else {
    for (const o of info.incomingSec) {
      const seller = r.players.find((p) => p.id === o.sellerId)?.name || "Outro estudante";
      body.append(
        marketBox(
          `${o.securityId} — oferta de ${seller}`,
          `${o.units} unidade(s) · Cotação ${marketBRL(o.priceCents)}`,
          () => {
            const raw = prompt(`Quantidade para comprar (até ${o.units})`, "1");
            if (raw === null) return;
            const n = Number(raw);
            if (!Number.isSafeInteger(n) || n <= 0 || n > o.units)
              return msg("Informe uma quantidade válida");
            perform("secondary-buy", { offerId: o.id, units: n });
          },
          "Comprar unidades",
          !canTrade || r.game?.cash * 100 + (r.game?.secondaryCashCents || 0) < o.priceCents,
          "A disponibilidade e os limites serão validados pelo jogo.",
        ),
      );
    }
    const share = $("shareOffers");
    if (share.childElementCount) {
      const box = document.createElement("div");
      box.className = "market-legacy";
      const h = document.createElement("h4");
      h.textContent = "Participações empresariais";
      box.append(h, share);
      body.append(box);
    }
    if (marketDialog.open) marketMarkSeen(r, info);
  }
  if (!body.childElementCount) {
    const empty = document.createElement("p");
    empty.className = "market-empty";
    empty.textContent =
      marketTab === "assets"
        ? "Você ainda não possui investimentos."
        : marketTab === "ads"
          ? "Você não possui anúncios ativos."
          : "Nenhuma oferta disponível para você neste momento.";
    body.append(empty);
  }
}
// A tela administrativa presencial reutiliza os controles já existentes,
// sem duplicar endpoints ou operações financeiras.
const adminMainPanel = document.querySelector("#room .main-panel");
const adminSidePanel = document.querySelector("#room .side-panel");
const adminTeacherPanel = $("teacherPanel");
const adminActionPanel = $("teacherActions");
const adminActionOrder = Array.from(adminActionPanel.children);
const adminExit = document.querySelector(".teacher-exit-actions");
const sharedNavActions = document.querySelector(".shared-navigation-actions");
const sharedNavContainer = $("sharedNavigation");
const playerAvatarColors = ["#f0bd6b", "#5fcab3", "#9d96ec", "#ef848c", "#78baf4", "#e6d579"];
function playerAvatarColor(room, player) {
  return playerAvatarColors[Math.max(0, room.players.indexOf(player)) % playerAvatarColors.length];
}
function playerAvatarInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0).toLocaleUpperCase("pt-BR")).join("");
}

function updateSharedAdminScreen(r) {
  const sharedAdmin = r.mode === "shared" && !!r.teacher;
  $("room").classList.toggle("shared-admin-room", sharedAdmin);
  // Após começar, o cadastro deixa de ser necessário: o tabuleiro ocupa a área inteira.
  $("room").classList.toggle("shared-admin-expanded", sharedAdmin && r.status !== "lobby");
  // O cabeçalho está fora de #room; sua aparência precisa acompanhar a área ativa.
  document.body.classList.toggle("shared-admin-header", sharedAdmin);
  $("sharedAdminBoardHeader").hidden = !sharedAdmin;
  if (r.mode === "shared") {
    if (sharedNavActions.parentElement !== $("topbarRoomMeta")) $("topbarRoomMeta").append(sharedNavActions);
  } else if (sharedNavActions.parentElement !== sharedNavContainer) {
    sharedNavContainer.append(sharedNavActions);
  }
  if (sharedAdmin) {
    if (adminTeacherPanel.parentElement !== adminSidePanel) adminSidePanel.append(adminTeacherPanel);
    if (adminExit.parentElement !== document.querySelector(".topbar-room-meta")) {
      $("topbarRoomMeta").append(adminExit);
    }
    const controls = $("sharedAdminBoardControls");
    for (const id of ["start", "pause", "resume", "finish", "reportPrint"]) {
      controls.append($(id));
    }
    $("teacherActions").hidden = true;
    $("start").hidden = r.status !== "lobby";
    $("start").disabled = r.status !== "lobby" || r.players.filter(p => !p.withdrawn).length < 2;
    $("pause").hidden = r.status !== "playing";
    $("resume").hidden = r.status !== "paused";
    $("finish").hidden = r.status === "finished";
    $("reportPrint").hidden = r.status === "lobby";
    $("sharedAdminBoardSubtitle").textContent = `${r.round || 1}ª rodada · ${r.players.length} de 6 participantes`;
  } else {
    if (adminTeacherPanel.parentElement !== adminMainPanel) adminMainPanel.append(adminTeacherPanel);
    if (adminExit.parentElement !== adminTeacherPanel) adminTeacherPanel.insertBefore(adminExit, adminActionPanel);
    for (const element of adminActionOrder) adminActionPanel.append(element);
    for (const id of ["start", "pause", "resume", "finish", "reportPrint"]) $(id).hidden = false;
    adminActionPanel.hidden = !r.teacher;
  }
}
function drawBoard(r) {
  const el = $("boardVisual");
  const current =
    r.game?.circuit === "outer"
      ? "outer"
      : r.players.find((p) => p.id === r.activePlayerId)?.circuit === "outer"
        ? "outer"
        : "inner";
  const tiles = current === "outer" ? OUTER : INNER;
  const isCompactCircuit = current === "inner";
  const cols = 13,
    rows = isCompactCircuit ? 5 : 13;
  el.classList.toggle("board-rectangular", isCompactCircuit);
  el.style.setProperty("--board-side", String(cols));
  el.style.setProperty("--board-cols", String(cols));
  el.style.setProperty("--board-rows", String(rows));
  el.replaceChildren();
  $("boardCircuit").textContent =
    current === "outer" ? "Alta Velocidade · 48 casas" : "Corrida dos Ratos · 32 casas";
  // A ordem das casas é mantida: topo, lado direito, base e lado esquerdo.
  const coords = [];
  for (let x = 1; x <= cols; x++) coords.push([1, x]);
  for (let y = 2; y <= rows; y++) coords.push([y, cols]);
  for (let x = cols - 1; x >= 1; x--) coords.push([rows, x]);
  for (let y = rows - 1; y >= 2; y--) coords.push([y, 1]);
  tiles.forEach((code, i) => {
    const [y, x] = coords[i];
    const tile = document.createElement("div");
    const occupants = r.players.filter((p) => p.circuit === current && p.position === i + 1);
    const dream = code.startsWith("DREAM:");
    tile.className =
      "board-cell" +
      (occupants.length ? " occupied" : "") +
      (dream ? " dream-cell" : "") +
      (code === "PAY" ? " pay-cell" : "");
    tile.style.gridColumn = x;
    tile.style.gridRow = y;
    tile.title = `Casa ${i} · ${dream ? "Sonho" : TILE_LABELS[code] || code}${occupants.length ? " · " + occupants.map((p) => p.name).join(", ") : ""}`;
    const number = document.createElement("span");
    number.className = "tile-number";
    number.textContent = i;
    const type = document.createElement("strong");
    type.className = "tile-type";
    type.textContent = dream ? "★" : code;
    tile.append(number, type);
    if (occupants.length) {
      const holder = document.createElement("div");
      holder.className = "player-dots";
      occupants.forEach((p, n) => {
        const dot = document.createElement("span");
        dot.className = "player-dot";
        dot.style.background = playerAvatarColor(r, p);
        dot.textContent = playerAvatarInitials(p.name);
        dot.title = p.name;
        holder.append(dot);
      });
      tile.append(holder);
    }
    el.append(tile);
  });
  const center = document.createElement("div");
  center.className = "board-center";
  center.style.gridColumn = `2 / ${cols}`;
  center.style.gridRow = `2 / ${rows}`;
  const heading = document.createElement("strong");
  heading.textContent = current === "outer" ? "ALTA VELOCIDADE" : "CORRIDA DOS RATOS";
  const sub = document.createElement("span");
  sub.textContent = `Rodada ${r.round}`;
  const legend = document.createElement("div");
  legend.className = "board-legend";
  r.players
    .filter((p) => p.circuit === current)
    .forEach((p) => {
      const tag = document.createElement("span");
      tag.textContent = `● ${p.name}`;
      tag.style.color = playerAvatarColor(r, p);
      legend.append(tag);
    });
  if (!isCompactCircuit) center.append(heading, sub);
  if (r.teacher && r.mode === "shared") {
    center.classList.add("shared-admin-board-center");
    const wait = document.createElement("div");
    wait.className = "shared-admin-board-wait";
    const title = document.createElement("strong");
    title.textContent = r.status === "lobby" ? "Aguardando jogadores" :
      r.status === "paused" ? "Partida pausada" :
      r.status === "finished" ? "Partida encerrada" : "Partida em andamento";
    const description = document.createElement("span");
    description.textContent = r.status === "lobby"
      ? "Cadastre de 2 a 6 participantes para iniciar."
      : r.status === "playing"
        ? `Vez de ${r.players.find(p => p.id === r.activePlayerId)?.name || "um jogador"}`
        : `Rodada ${r.round}`;
    const names = document.createElement("div");
    names.className = "shared-admin-board-names";
    if (r.players.length) {
      for (const player of r.players) {
        const entry = document.createElement("span");
        entry.className = "shared-admin-player-entry";
        const avatar = document.createElement("span");
        avatar.className = "shared-admin-player-avatar";
        avatar.style.backgroundColor = playerAvatarColor(r, player);
        avatar.textContent = playerAvatarInitials(player.name);
        avatar.setAttribute("aria-hidden", "true");
        const fullName = document.createElement("span");
        fullName.textContent = player.name;
        entry.append(avatar, fullName);
        names.append(entry);
      }
    } else names.textContent = "Nenhum participante cadastrado";
    wait.append(title, description, names);
    center.append(wait);
    el.append(center);
    return;
  }
  const active = r.players.find((p) => p.id === r.activePlayerId),
    me = r.players.find((p) => p.id === r.you),
    g = r.game;
  const canPlay = r.status === "playing" && !!me && !me.withdrawn && me.id === r.activePlayerId;
  const currentTurn = document.createElement("div");
  currentTurn.className = "board-turn-name";
  currentTurn.textContent = active
    ? canPlay
      ? (r.sharedAdmin ? "Vez de " : "Sua vez, ") + active.name
      : "Vez de " + active.name
    : "Aguardando jogadores";
  const clock = document.createElement("div");
  clock.className = "board-clock";
  clock.setAttribute("role", "timer");
  const remaining = Math.max(0, Number(r.secondsRemaining) || 0),
    fraction = r.status === "playing" ? Math.min(1, remaining / 120) : 0;
  clock.style.setProperty("--timer-progress", String(Math.round(fraction * 100)) + "%");
  const clockIcon = document.createElement("span");
  clockIcon.textContent = "◷";
  clockIcon.setAttribute("aria-hidden", "true");
  const clockText = document.createElement("strong");
  clockText.textContent =
    r.status === "playing"
      ? `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`
      : r.status === "paused"
        ? "Pausado"
        : "—:—";
  clock.append(clockIcon, clockText);
  clock.classList.toggle("time-critical", r.status === "playing" && remaining <= 20);
  const dieButton = document.createElement("button");
  dieButton.type = "button";
  dieButton.className = "board-die-button";
  dieButton.setAttribute("aria-label", "Lançar dado");
  dieButton.title = "Lançar dado";
  dieButton.disabled = !canPlay || !!g?.pending || !!g?.won;
  const last = Number(g?.lastRoll);
  const face = Number.isInteger(last) && last >= 1 && last <= 6 ? last : 5;
  const pipMap = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };
  const die = document.createElement("span");
  die.className = "die-face";
  die.setAttribute("aria-hidden", "true");
  for (let i = 1; i <= 9; i++) {
    const pip = document.createElement("i");
    if (pipMap[face].includes(i)) pip.className = "pip";
    die.append(pip);
  }
  dieButton.append(die);
  dieButton.onclick = () => {
    if (dieButton.disabled) return;
    dieButton.classList.add("rolling");
    $("roll").click();
  };
  const diceLabel = document.createElement("span");
  diceLabel.className = "board-die-label";
  diceLabel.textContent =
    g?.pending && last
      ? `Resultado: ${last}`
      : canPlay
        ? "Clique no dado para lançar"
        : g?.lastRoll
          ? `Último dado: ${last}`
          : "Aguarde sua vez";
  const tileInfo = document.createElement("span");
  tileInfo.className = "board-tile-info";
  tileInfo.textContent = active
    ? `Casa nº ${active.position - 1} - ${active.circuit === current ? (tiles[active.position - 1]?.startsWith("DREAM:") ? "Sonho" : TILE_LABELS[tiles[active.position - 1]] || "Casa especial") : "Outro circuito"}`
    : "Partida aguardando início";
  const endButton = document.createElement("button");
  endButton.className = "board-finish-button";
  endButton.type = "button";
  const resolved =
    !!g?.cardEvents?.at(-1)?.resolution && g.cardEvents.at(-1).resolution !== "pending";
  endButton.textContent = resolved ? "Concluir turno" : "Recusar / concluir turno";
  endButton.hidden = !canPlay || !g?.pending;
  endButton.onclick = () => {
    $("end").click();
  };
  const step = document.createElement("span");
  step.className = "board-step";
  step.textContent = canPlay
    ? g?.pending
      ? resolved
        ? "Decisão registrada"
        : "Resolva a carta ou conclua o turno"
      : "Lance o dado para avançar"
    : r.status === "paused"
      ? "Partida pausada"
      : r.status === "lobby"
        ? "Aguardando início"
        : "Acompanhe a jogada";
  const summary = document.createElement("div");
  summary.className = "board-finance-summary";
  if (me && !r.teacher && g) {
    const dream = DREAMS[me.dreamId];
    const chips = [
      ["Meu sonho", dream?.name || "A definir"],
      ["Caixa", formatCashBRL(g)],
    ];
    if (Number(g.debt) > 0) chips.push(["Dívida inicial", money(g.debt)]);
    chips.push(["Fechamentos", String(g.closures || 0)]);
    const arrears = Number(g.arrearsLiving || 0) + Number(g.arrearsLoan || 0);
    chips.push(
      ["Pendências", money(arrears)],
      ["Dividendos na janela atual", money(g.pendingCorporatePassive || 0)],
    );
    for (const [label, value] of chips) {
      const c = document.createElement("div");
      c.className = "board-finance-item";
      const small = document.createElement("small");
      small.textContent = label;
      const strong = document.createElement("b");
      strong.textContent = value;
      c.append(small, strong);
      summary.append(c);
    }
  }
  const showCard = document.createElement("button");
  showCard.type = "button";
  showCard.className = "board-card-trigger";
  showCard.textContent =
    g?.currentCard?.id && g?.pending
      ? `${g.currentCard.category === "EF" ? "Ver pergunta" : "Ver carta"} ${g.currentCard.id} e decisões`
      : "Ver carta da jogada";
  showCard.hidden = !g?.pending || !g?.currentCard || r.teacher;
  showCard.onclick = openGameCard;
  if (isCompactCircuit) {
    // O painel horizontal evita uma pilha de controles no espaço central do circuito.
    const left = document.createElement("div");
    left.className = "board-rect-turn";
    left.append(sub, currentTurn, clock, dieButton, diceLabel);
    const middle = document.createElement("div");
    middle.className = "board-rect-decision";
    middle.append(tileInfo, step);
    const actions = document.createElement("div");
    actions.className = "board-rect-actions";
    actions.append(showCard, endButton);
    middle.append(actions);
    const right = document.createElement("div");
    right.className = "board-rect-finances";
    right.append(summary);
    if (!r.teacher && me) right.append(makeMarketHub(r));
    center.append(left, middle, right);
  } else {
    center.append(
      currentTurn,
      clock,
      dieButton,
      diceLabel,
      tileInfo,
      step,
      showCard,
      endButton,
      summary,
    );
  }
  if (!isCompactCircuit && !r.teacher && me) {
    const hub = makeMarketHub(r);
    center.append(hub);
  }
  if (r.teacher) {
    const legend = document.createElement("div");
    legend.className = "board-legend";
    r.players
      .filter((p) => p.circuit === current)
      .forEach((p) => {
        const tag = document.createElement("span");
        tag.textContent = `● ${p.name}`;
        tag.style.color = ["#f0bd6b", "#5fcab3", "#9d96ec", "#ef848c", "#78baf4", "#e6d579"][
          r.players.indexOf(p) % 6
        ];
        legend.append(tag);
      });
    center.append(legend);
  }
  el.append(center);
}
function updateLayout(r) {
  $("room").classList.toggle("player-room", !r.teacher);
  updateSharedAdminScreen(r);
  $("teacherPanel").hidden = !r.teacher;
  $("turnPanel").hidden = !r.teacher && !(r.game?.pending && r.activePlayerId === r.you);
  $("financeHeading").textContent = r.teacher
    ? "Acompanhamento da turma"
    : r.sharedAdmin
      ? "Finanças do jogador da vez"
      : "Minhas finanças";
  const active = r.players.find((p) => p.id === r.activePlayerId),
    g = r.game,
    me = r.players.find((p) => p.id === r.you);
  drawBoard(r);
  const pending = Boolean(g?.pending),
    alreadyResolved = Boolean(
      g?.cardEvents?.at(-1)?.resolution && g.cardEvents.at(-1).resolution !== "pending",
    );
  $("end").textContent =
    pending && !alreadyResolved ? "Recusar / encerrar turno" : "Encerrar turno";
  $("turnStage").textContent =
    r.status === "paused"
      ? "Pausada"
      : r.status === "finished"
        ? "Encerrada"
        : r.status === "lobby"
          ? "Aguardando início"
          : !active
            ? "Aguardando"
            : pending
              ? alreadyResolved
                ? "Decisão registrada"
                : "Aguardando decisão"
              : "Lançar dado";
  const move = $("moveSummary");
  move.replaceChildren();
  if (active) {
    displayLabel(
      move,
      "Casa atual",
      `${active.position} · ${active.circuit === "outer" ? "Alta Velocidade" : "Corrida dos Ratos"}`,
    );
    displayLabel(
      move,
      "Tipo de casa",
      TILE_LABELS[g?.lastTile] ||
        (g?.lastTile?.startsWith("DREAM:")
          ? "Sonho"
          : pending
            ? "Carta / evento"
            : "Aguardando dado"),
    );
  }
  const card = g?.currentCard;
  const cardPanel = $("currentCardPanel");
  cardPanel.hidden = !pending || !card;
  if (!cardPanel.hidden) {
    const approved = getCard(card.id);
    const content = splitCardText(approved?.text, card.id);
    // Harmoniza os nomes das opções da EV-012 com os botões sem modificar o texto oficial arquivado.
    if (card.id === "EV-012")
      content.fields = content.fields.map(([label, value]) => [
        label,
        value
          .replace("Cancelar serviços:", "Cancelar assinaturas:")
          .replace("Manter:", "Manter assinaturas:"),
      ]);
    $("cardIdentifier").textContent = card.id;
    $("cardCategory").textContent = CATEGORY_LABELS[card.category] || card.category;
    $("cardTitle").textContent = content.title;
    const fixedCard = FIXED_INCOME.find((x) => x.id === card.id);
    const cardIntroduction = fixedCard
      ? `Você pode aplicar de ${money(fixedCard.min)} a ${money(fixedCard.max)}, em valores de ${money(fixedCard.step)}. Consulte as condições de rendimento, prazo e resgate antes de decidir.`
      : "Leia as condições desta oportunidade e avalie os riscos antes de decidir.";
    $("cardTitle").textContent = fixedCard ? fixedCard.name : content.title;
    $("cardDescription").textContent = content.description || cardIntroduction;
    const isExpense = card.category === "DI";
    const expenseParts = isExpense ? String(approved?.text ?? "").split("\t") : [];
    const salary = PROFESSIONS[me?.professionId]?.salary;
    const expense =
      isExpense && Number.isSafeInteger(salary)
        ? g.circuit === "inner"
          ? expenseQuote(card.id, salary)
          : expenseQuoteOuter(card.id, salary)
        : null;
    if (isExpense && expenseParts.length >= 3) {
      const match = /^([^.!?]+)[.!?]\s*(.*)$/.exec(expenseParts[1]);
      $("cardTitle").textContent = match?.[1] || expenseParts[1];
      $("cardDescription").textContent =
        match?.[2] || "Uma despesa inesperada ocorreu durante a partida.";
    }
    const metrics = $("cardMetrics"),
      sections = $("cardSections");
    metrics.replaceChildren();
    sections.replaceChildren();
    if (expense) {
      displayLabel(
        metrics,
        `Despesa extra (${expense.percent}% do salário)`,
        money(expense.amount),
      );
      displayLabel(metrics, "Efeito financeiro", "Valor descontado do caixa");
      const line = document.createElement("div");
      line.className = "card-field";
      const title = document.createElement("strong");
      title.textContent = "O que acontece com seu dinheiro?";
      const detail = document.createElement("p");
      detail.textContent = `Esta carta cobra ${money(expense.amount)} como despesa extra (${expense.percent}% do salário de referência da sua profissão). O valor é descontado do caixa automaticamente; se faltar saldo, a diferença vira pendência. Não é um ganho nem um desconto a seu favor.`;
      line.append(title, detail);
      sections.append(line);
      if (expenseParts[3]) {
        const tip = document.createElement("div");
        tip.className = "card-field";
        const label = document.createElement("strong");
        label.textContent = "Aprendizado";
        const val = document.createElement("p");
        val.textContent = expenseParts[3];
        tip.append(label, val);
        sections.append(tip);
      }
    }
    const summary = expense
      ? []
      : content.fields.filter(([label]) =>
          /Investimento|Preço|Renda inicial|Renda líquida inicial|Liquidez/i.test(label),
        );
    summary.forEach(([label, value]) => displayLabel(metrics, label, value));
    for (const [label, value] of expense
      ? []
      : content.fields.filter(
          ([label]) =>
            !/Investimento|Preço|Renda inicial|Renda líquida inicial|Liquidez|Aprendizagem|Aprendizado/i.test(
              label,
            ),
        )) {
      const section = document.createElement("div");
      section.className = "card-field";
      const title = document.createElement("strong");
      title.textContent = label;
      const desc = document.createElement("p");
      desc.textContent = value;
      section.append(title, desc);
      sections.append(section);
    }
    if (!expense && !content.fields.length && content.raw) {
      const section = document.createElement("p");
      section.className = "card-fallback";
      section.textContent = content.raw;
      sections.append(section);
    }
    const learning = content.fields.find(([label]) => /Aprendizagem|Aprendizado/i.test(label));
    const learningInfo = cardLearningDisplay(learning?.[1]);
    $("cardLearning").hidden = !learningInfo;
    $("cardLearning").textContent = learningInfo
      ? `${learningInfo.label} · ${learningInfo.value}`
      : "";
    const direct =
      officialSmallBusinessOffer(card, g.circuit) ||
      officialCompanyOffer(card, g.circuit) ||
      realEstateOffer(card, g.circuit) ||
      officialPOAssetOffer(card, g.circuit) ||
      grandInvestmentOffer(card, g.circuit) ||
      specialAcquisitionOffer(card, g.circuit);
    const event = g.cardEvents?.at(-1);
    const cash = g.cash * 100 + (g.secondaryCashCents ?? 0);
    const eligibility = $("cardEligibility");
    const hasChoices =
      ["educationQuestion", "lifeDecision", "companyOffer", "realEstateOffer"].some((id) => {
        const area = $(id);
        return (
          area &&
          !area.hidden &&
          [...area.querySelectorAll("button")].some((button) => !button.hidden)
        );
      }) ||
      (!$("buy").hidden && !$("buy").disabled);
    const hasAnswerFeedback =
      card.category === "EF" &&
      Boolean(g.currentCard?.quizFeedback || event?.resolution === "unanswered");
    const hasLifeFeedback = card.category === "EV" && Boolean(g.currentCard?.lifeDecision);
    const feedback = cardStatusFeedback({
      card,
      event,
      game: g,
      hasChoices,
      expense,
      hasAnswerFeedback,
      hasLifeFeedback,
    });
    eligibility.hidden = !feedback;
    if (feedback) {
      eligibility.textContent = feedback.text;
      eligibility.className =
        "eligibility-hint" + (feedback.kind === "success" ? " success-hint" : "");
    }
    if (feedback && event?.resolution === "pending" && direct?.cost && hasChoices) {
      const ok = cash >= direct.cost * 100;
      eligibility.textContent += ` Caixa: ${formatCashBRL(g)} · Valor à vista: ${money(direct.cost)}. ${ok ? "Saldo suficiente para a opção à vista." : "Saldo insuficiente para a opção à vista."}`;
      if (!ok) eligibility.classList.add("error-hint");
    }
  }
  const hint = $("actionHint");
  if (r.teacher)
    hint.textContent =
      "Acompanhe o turno dos estudantes. Os controles administrativos estão no painel do professor.";
  else if (!me) hint.textContent = "Você está acompanhando a partida.";
  else if (r.status === "paused") hint.textContent = "A sala está pausada pelo professor.";
  else if (r.activePlayerId !== r.you)
    hint.textContent = r.sharedAdmin
      ? `Consultando ${me?.name || "participante"}: responda convites, se houver. As jogadas continuam com ${active?.name || "o jogador da vez"}.`
      : `Aguarde: agora é a vez de ${active?.name || "outro participante"}.`;
  else if (!pending) hint.textContent = "Lance o dado para avançar e descobrir a próxima casa.";
  else if (alreadyResolved)
    hint.textContent = "A decisão foi processada. Encerre o turno para continuar.";
  else
    hint.textContent =
      "Confira a carta abaixo. Execute uma das ações disponíveis ou encerre o turno se não quiser realizar a oportunidade.";
  const dream = DREAMS[me?.dreamId];
  $("dreamSummary").replaceChildren();
  if (dream) {
    const title = document.createElement("strong");
    title.textContent = `Meu sonho · ${dream.name}`;
    const detail = document.createElement("p");
    detail.textContent = me?.won
      ? "Sonho realizado!"
      : `Objetivo para a Alta Velocidade${dream.cost ? ` · ${money(dream.cost)}` : ""}`;
    $("dreamSummary").append(title, detail);
  }
  // Modal: a carta e as decisões usam um único fluxo, sem repetir texto abaixo do tabuleiro.
  if (!r.teacher) {
    const host = $("gameCardBody");
    if ($("currentCardPanel").parentElement !== host) {
      host.append($("currentCardPanel"));
    }
    if ($("playerActions").parentElement !== host) {
      host.append($("playerActions"));
    }
    if ($("turnPanel").parentElement !== document.querySelector("#room .main-panel")) {
      document.querySelector("#room .main-panel").append($("turnPanel"));
    }
    $("turnPanel").hidden = true;
    $("financePanel").hidden = true;
    $("limitsPanel").hidden = true;
    // Mercado do estudante é acessado pelo tabuleiro; componentes antigos ficam preservados para o professor.
    $("businessPanel").hidden = true;
    $("businessPanel").open = false;
    renderMarket(r);
    if ((!pending || !card || r.status === "finished") && gameDialog.open) gameDialog.close();
  } else {
    if (marketDialog.open) marketDialog.close();
    $("financePanel").hidden = false;
    $("businessPanel").hidden = false;
    $("limitsPanel").hidden = false;
  }
}
