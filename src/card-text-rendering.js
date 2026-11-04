// Leitura de apresentação das 230 cartas. O catálogo oficial e seus efeitos permanecem intactos.
export const normalizeCardText = (value) =>
  String(value ?? "")
    .replace(/R\s*\\\s*\$/gi, "R$")
    .replace(/\\\$/g, "$")
    .replace(/\bRR\$/g, "R$")
    .replace(/\\([.,;\-])/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^\s*#{1,5}\s*/gm, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

const flat = (text) => normalizeCardText(text).replace(/\s+/g, " ").trim();
const titleOf = (value, id) =>
  flat(value)
    .replace(new RegExp(`^${id}\\s*[—–-]\\s*`, "i"), "")
    .trim();
const FIELD_NAMES = [
  "Lucro líquido total distribuído inicialmente",
  "Lucro total inicialmente distribuído",
  "Distribuição inicial prevista",
  "Lucro distribuído inicial",
  "Participação oferecida",
  "Valor total da empresa",
  "Valor total do empreendimento",
  "Avaliação da empresa",
  "Rendimento da oferta",
  "Renda da participação",
  "Oferta",
  "Custo de compra",
  "Preço-alvo de revenda",
  "Renda líquida inicial",
  "Investimento necessário",
  "Rendimento mensal",
  "Efeito previsto",
  "Benefício estratégico",
  "Forma de aquisição",
  "Requisitos",
  "Decisões",
  "Consequência",
  "Aprendizagem",
  "Aprendizado",
  "Investimento",
  "Requisito",
  "Decisão",
  "Liquidez",
  "Contribuição",
  "Benefício",
  "Riscos",
  "Risco",
  "Risco e liquidez",
  "Conceito",
  "Preço",
  "Compra",
  "Renda inicial",
];
const fieldAlternation = FIELD_NAMES.map((name) =>
  name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
).join("|");
const FIELD_RE = new RegExp(`(?:^|[.·;]\\s*|\\s+)(?<label>${fieldAlternation})\\s*:\\s*`, "gi");
const headingNames = new Set([
  "compra e revenda",
  "extraordinária",
  "incentivo à organização",
  "pequeno negócio",
  "imóvel",
  "ações",
  "renda fixa",
  "grande investimento",
  "oportunidade especial",
  "empresa",
  "participação societária",
  "expansão",
  "bonificação",
  "educação financeira",
  "filantropia",
]);
const canonical = (label) =>
  ({ Requisitos: "Requisito", Decisões: "Decisão", Riscos: "Risco", Aprendizagem: "Aprendizado" })[
    label
  ] || label;
function addField(fields, label, value) {
  const v = flat(value).replace(/[.;·\s]+$/, "");
  if (v && !fields.some(([l, x]) => l === canonical(label) && x === v))
    fields.push([canonical(label), v]);
}
function parseSegments(text, fields) {
  const matches = [...text.matchAll(FIELD_RE)];
  if (!matches.length) return flat(text);
  const prefix = text.slice(0, matches[0].index).trim();
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const begin = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    addField(fields, match.groups.label, text.slice(begin, end));
  }
  return flat(prefix);
}
function parseTabLine(line, id) {
  const columns = line.split("\t").map(flat).filter(Boolean);
  if (columns[0] === id) columns.shift();
  const headline = titleOf(columns.shift() || id, id);
  const split = /^(.+?)[.!?]\s+(.+)$/.exec(headline);
  const title = split?.[1] || headline;
  const description = split?.[2] || "";
  const fields = [];
  if (id.startsWith("DI-")) {
    if (columns[0])
      addField(
        fields,
        "Despesa extra",
        /^\d+(?:[,.]\d+)?%$/.test(columns[0])
          ? `Cobrança adicional de ${columns[0]} do salário de referência da profissão.`
          : columns[0],
      );
    if (columns[1]) addField(fields, "Aprendizado", columns[1]);
  } else if (id.startsWith("GI-")) {
    if (columns[0]) addField(fields, "Investimento", columns[0]);
    if (columns[1]) addField(fields, "Renda inicial de referência", columns[1]);
    if (columns[2]) {
      const v = columns[2].split(/\s+(?=Riscos?\b|Conceito:)/i);
      if (v[0]) addField(fields, "Forma de aquisição", v[0]);
      for (const part of v.slice(1)) {
        if (/^Riscos?\s+de\b/i.test(part))
          addField(fields, "Risco", part.replace(/^Riscos?\s+/i, ""));
        else parseSegments(part, fields);
      }
    }
  } else if (id.startsWith("EV-")) {
    if (columns[0]) addField(fields, "Decisão e efeito", columns[0]);
    if (columns[1]) addField(fields, "Aprendizado", columns[1]);
  } else if (id.startsWith("MF-")) {
    if (columns[0]) addField(fields, "Efeito no mercado", columns[0]);
    if (columns[1]) addField(fields, "Abrangência", columns[1]);
  } else {
    if (columns[0]) addField(fields, "Efeito", columns[0]);
    if (columns[1]) addField(fields, "Aprendizado", columns[1]);
  }
  return { title: flat(title), description: flat(description), fields, raw: "" };
}
export function splitCardText(original, id) {
  const text = String(original ?? "")
    .replace(/\r/g, "")
    .replace(/\\\|/g, "|");
  // Algumas cartas de renda fixa são registradas como uma linha de tabela Markdown.
  if (text.trimStart().startsWith("|")) {
    const cols = text.split("|").map(flat).filter(Boolean);
    const headline = titleOf(cols[0] || id, id);
    const separated = /^(.+?)\.\s+(.+)$/.exec(headline);
    const title = separated?.[1] || headline;
    const description = separated?.[2] || "";
    const fields = [];
    if (cols[1]) {
      const intro = parseSegments(cols[1], fields);
      if (intro) addField(fields, "Condições da oportunidade", intro);
    }
    if (cols[2]) {
      const rest = parseSegments(cols[2], fields);
      if (rest) fields.unshift(["Rendimento e resgate", rest]);
    }
    return { title, description, fields, raw: "" };
  }
  // Apenas a linha inicial com tabulações é uma ficha; tabulações no corpo (FI) são tabelas.
  const firstLine = text.trim().split("\n")[0];
  if (firstLine.includes("\t") && firstLine.trim().startsWith(id))
    return parseTabLine(firstLine, id);
  if (!text.includes("\n") && !text.trimStart().startsWith(id)) {
    return {
      title: id,
      description:
        "O catálogo disponível contém apenas orientações gerais, sem texto individual da carta. Confira o conteúdo oficial antes de homologar.",
      fields: [["Trecho encontrado no catálogo", flat(text)]],
      raw: "",
      incomplete: true,
    };
  }
  const lines = normalizeCardText(text).split(/\n+/).map(flat).filter(Boolean);
  if (lines[0] === id) lines.shift();
  if (lines[0] && headingNames.has(lines[0].toLocaleLowerCase("pt-BR"))) lines.shift();
  let title = titleOf(lines.shift() || id, id);
  // Nas perguntas, a categoria temática é o título. "5% do salário" é a recompensa, não o título.
  if (id.startsWith("EF-")) {
    const reward = lines.find((line) => /\d+% do salário|R\$\s*300/i.test(line));
    const question = lines.find((line) => line.endsWith("?"));
    return {
      title,
      description: question || "",
      fields: reward ? [["Recompensa por acerto", reward]] : [],
      raw: "",
    };
  }
  const description = lines.length && !/^(?:[\w\s]+):/.test(lines[0]) ? lines.shift() : "";
  const fields = [];
  let raw = "";
  // Filantropia possui tabela de valores/impacto, não uma tabulação com cabeçalho de ficha.
  const donations = [];
  const useful = [];
  for (const line of lines) {
    if (/^Contribuição\s+Impacto simulado/i.test(line)) continue;
    if (id.startsWith("FI-") && /^R\$\s*[\d.]+\s+\d+\s+.+\s+apoiad[oa]s/i.test(line)) {
      donations.push(line);
      continue;
    }
    if (
      /^(?:\d+\.\s*(?:Categoria|Como|Funcionamento)|Funcionamento das participações|As sete oportunidades acima|Nesta categoria,|Proponho que o jogo)/i.test(
        line,
      )
    )
      break;
    useful.push(line);
  }
  // Cartas como PO-001 usam o rótulo numa linha e o valor na seguinte.
  const paired = [];
  const singleLabels = new Set(FIELD_NAMES.map((name) => name.toLocaleLowerCase("pt-BR")));
  for (let i = 0; i < useful.length; i++) {
    const line = useful[i];
    if (singleLabels.has(line.toLocaleLowerCase("pt-BR")) && useful[i + 1]) {
      paired.push(`${line}: ${useful[++i]}`);
    } else paired.push(line);
  }
  raw = parseSegments(paired.join("\n"), fields);
  if (donations.length) fields.unshift(["Contribuição e impacto social", donations.join(" · ")]);
  return { title, description, fields, raw: raw && !fields.length ? raw : "" };
}

// A estrutura de exibição é comum às páginas de revisão e de jogo.
export const CARD_METRIC_LABEL =
  /^(Investimento|Investimento necessário|Preço|Custo de compra|Preço-alvo de revenda|Rendimento mensal|Renda inicial|Renda líquida inicial|Renda inicial de referência|Rendimento da oferta|Renda da participação|Distribuição inicial prevista|Lucro distribuído inicial|Lucro total inicialmente distribuído|Lucro líquido total distribuído inicialmente|Participação oferecida|Valor total da empresa|Valor total do empreendimento|Avaliação da empresa|Oferta|Liquidez|Despesa extra|Efeito no mercado|Benefício|Recompensa por acerto)$/i;
export function normalizePresentedCard(content, id) {
  if (id === "EV-012") {
    return {
      ...content,
      description: content.description.replace(
        /serviços contratados que utiliza pouco/i,
        "assinaturas que utiliza pouco",
      ),
      fields: content.fields.map(([label, v]) => [
        label,
        v
          .replace(/Cancelar serviços:/gi, "Cancelar assinaturas:")
          .replace(/\bManter:/gi, "Manter assinaturas:"),
      ]),
    };
  }
  return content;
}
