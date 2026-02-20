import CommonFormats from "../CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Advanced CSV/TSV/SSV conversion handler.
 *
 * Supported conversions:
 *   CSV ↔ TSV  (tab-separated)
 *   CSV ↔ SSV  (semicolon-separated — European Excel format)
 *   CSV / TSV / SSV ↔ JSON  (array-of-objects, first row = headers)
 *   CSV / TSV / SSV → Markdown table
 *   CSV / TSV / SSV → HTML table
 *
 * Uses a proper RFC 4180 parser: handles quoted fields, embedded
 * commas/tabs/semicolons, escaped quotes, and CRLF/LF line endings.
 */
class csvConvertHandler implements FormatHandler {
  public name = "csvConvert";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    CommonFormats.CSV.supported("csv", true, true),
    {
      name: "TSV (Tab-Separated Values)",
      format: "tsv",
      extension: "tsv",
      mime: "text/tab-separated-values",
      from: true, to: true,
      internal: "tsv",
      category: "data",
      lossless: true,
    },
    {
      name: "SSV (Semicolon-Separated — European Excel CSV)",
      format: "ssv",
      extension: "csv",
      mime: "text/csv",
      from: true, to: true,
      internal: "ssv",
      category: "data",
      lossless: true,
    },
    CommonFormats.JSON.supported("json", true, true),
    {
      name: "Markdown Table",
      format: "mdtable",
      extension: "md",
      mime: "text/markdown",
      from: false, to: true,
      internal: "mdtable",
      category: "text",
      lossless: false,
    },
    {
      name: "HTML Table",
      format: "htmltable",
      extension: "html",
      mime: "text/html",
      from: false, to: true,
      internal: "htmltable",
      category: "document",
      lossless: false,
    },
  ];

  async init() { this.ready = true; }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const inFmt  = inputFormat.internal  ?? inputFormat.format;
    const outFmt = outputFormat.internal ?? outputFormat.format;
    const ext    = outputFormat.extension ?? outputFormat.format;

    return Promise.all(inputFiles.map(async (file) => {
      const text = new TextDecoder("utf-8").decode(file.bytes);
      const base = file.name.replace(/\.[^.]+$/, "");
      const out  = convertTable(text, inFmt, outFmt);
      return { name: `${base}.${ext}`, bytes: new TextEncoder().encode(out) };
    }));
  }
}

export default csvConvertHandler;

// ─── Delimiter map ────────────────────────────────────────────────────────────

const DELIMITERS: Record<string, string> = {
  csv: ",",
  tsv: "\t",
  ssv: ";",
};

// ─── RFC 4180 CSV parser ──────────────────────────────────────────────────────

/** Parse a delimited text into a 2-D array of strings. */
function parseDelimited(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuote = false;
  // Normalise CRLF
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (inQuote) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuote = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
        i++;
      } else if (src.slice(i, i + delim.length) === delim) {
        row.push(field);
        field = "";
        i += delim.length;
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Flush last field/row
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Filter out single empty trailing row
  if (rows.length > 0 && rows[rows.length - 1].every(c => c === "")) {
    rows.pop();
  }

  return rows;
}

/** Serialize a 2-D array back to a delimited string. */
function serializeDelimited(rows: string[][], delim: string): string {
  return rows.map(row =>
    row.map(cell => {
      // Quote if the cell contains the delimiter, double-quote, or newline
      if (cell.includes(delim) || cell.includes('"') || cell.includes("\n")) {
        return '"' + cell.replace(/"/g, '""') + '"';
      }
      return cell;
    }).join(delim)
  ).join("\n");
}

// ─── Conversion dispatch ──────────────────────────────────────────────────────

function convertTable(text: string, from: string, to: string): string {
  if (from === to) return text;

  // If both are delimited formats, just re-delimit
  if (from in DELIMITERS && to in DELIMITERS) {
    const rows = parseDelimited(text, DELIMITERS[from]);
    return serializeDelimited(rows, DELIMITERS[to]);
  }

  // Delimited → JSON (array of objects using first row as header)
  if (from in DELIMITERS && to === "json") {
    const rows = parseDelimited(text, DELIMITERS[from]);
    if (rows.length === 0) return "[]";
    const headers = rows[0];
    const objects = rows.slice(1).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
      return obj;
    });
    return JSON.stringify(objects, null, 2);
  }

  // JSON → Delimited (array of objects → rows)
  if (from === "json" && to in DELIMITERS) {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return text; }
    if (!Array.isArray(parsed) || parsed.length === 0) return "";
    const headers = Object.keys(parsed[0] as object);
    const rows: string[][] = [
      headers,
      ...(parsed as Record<string, unknown>[]).map(obj =>
        headers.map(h => String(obj[h] ?? ""))
      )
    ];
    return serializeDelimited(rows, DELIMITERS[to]);
  }

  // Delimited → Markdown table
  if (from in DELIMITERS && to === "mdtable") {
    const rows = parseDelimited(text, DELIMITERS[from]);
    if (rows.length === 0) return "";
    const escape = (s: string) => s.replace(/\|/g, "\\|");
    const colWidths = rows[0].map((_, ci) =>
      Math.max(...rows.map(r => (r[ci] ?? "").length), 3)
    );
    const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));
    const header    = "| " + rows[0].map((c, i) => pad(escape(c), colWidths[i])).join(" | ") + " |";
    const separator = "| " + colWidths.map(w => "-".repeat(w)).join(" | ") + " |";
    const body      = rows.slice(1).map(row =>
      "| " + row.map((c, i) => pad(escape(c), colWidths[i])).join(" | ") + " |"
    );
    return [header, separator, ...body].join("\n");
  }

  // Delimited → HTML table
  if (from in DELIMITERS && to === "htmltable") {
    const rows = parseDelimited(text, DELIMITERS[from]);
    if (rows.length === 0) return "<table></table>";
    const esc = (s: string) => s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    const thead = "<thead><tr>" +
      rows[0].map(c => `<th>${esc(c)}</th>`).join("") +
      "</tr></thead>";
    const tbody = "<tbody>" +
      rows.slice(1).map(row =>
        "<tr>" + row.map(c => `<td>${esc(c)}</td>`).join("") + "</tr>"
      ).join("\n") +
      "</tbody>";
    return `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><style>` +
      `table{border-collapse:collapse}th,td{border:1px solid #999;padding:6px 12px}` +
      `th{background:#f0f0f0;font-weight:bold}</style></head>\n` +
      `<body><table>\n${thead}\n${tbody}\n</table></body></html>`;
  }

  return text;
}
