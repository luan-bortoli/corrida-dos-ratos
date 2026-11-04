// Extração da estrutura textual equivalente à utilizada na interface multiplayer.
const cleanMarkdown = (value) =>
  String(value ?? "")
    .replace(/\\\$/g, "R$")
    .replace(/\*\*/g, "")
    .replace(/^\s*#{1,5}\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
export function splitCardText(original, id) {
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
