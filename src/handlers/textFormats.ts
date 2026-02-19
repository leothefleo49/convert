import CommonFormats from "../CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Pure-JS text format bridging handler.
 *
 * Provides lightweight, dependency-free conversions between text-based formats
 * so the route graph can chain them with heavier tools (pandoc, FFmpeg, etc.).
 *
 * Supported conversions:
 *  text/plain      → text/html, text/markdown, text/csv, application/json
 *  text/html       → text/plain, text/markdown
 *  text/markdown   → text/plain, text/html
 *  text/csv        → text/plain, application/json
 *  application/json → text/plain, text/csv
 */
export class textFormatsHandler implements FormatHandler {
  public name = "textFormats";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    // Each format is both a potential input and output
    CommonFormats.TEXT.supported("text",  true, true),
    CommonFormats.MD.supported("md",      true, true),
    CommonFormats.HTML.supported("html",  true, true),
    CommonFormats.CSV.supported("csv",    true, true),
    CommonFormats.JSON.supported("json",  true, true),
  ];

  async init() { this.ready = true; }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    return Promise.all(
      inputFiles.map(async (file) => {
        const inputText = new TextDecoder("utf-8").decode(file.bytes);
        const outputText = convert(inputText, inputFormat.mime, outputFormat.mime);
        const baseName  = file.name.replace(/\.[^.]+$/, "");
        const ext       = outputFormat.extension ?? outputFormat.format;
        return { name: `${baseName}.${ext}`, bytes: new TextEncoder().encode(outputText) };
      })
    );
  }
}

// ─── Conversion logic (pure functions) ───────────────────────────────────────

function convert(text: string, from: string, to: string): string {
  const f = normMime(from);
  const t = normMime(to);

  if (f === t) return text;

  // Build a key for the dispatch table
  const key = `${f}→${t}`;
  const fn = dispatch[key];
  if (fn) return fn(text);

  // Fallback: return as-is (shouldn't happen when the graph traversal is correct)
  return text;
}

function normMime(mime: string): string {
  // Strip charset parameters, lower-case
  return mime.split(";")[0].trim().toLowerCase();
}

// ─── Dispatch table ───────────────────────────────────────────────────────────

type Conv = (input: string) => string;

const dispatch: Record<string, Conv> = {
  // Plain text → others
  "text/plain→text/html":        plainToHtml,
  "text/plain→text/markdown":    (s) => s,               // plain text is valid markdown
  "text/plain→text/csv":         plainToCsv,
  "text/plain→application/json": plainToJson,

  // Markdown → others
  "text/markdown→text/html":     markdownToHtml,
  "text/markdown→text/plain":    (s) => s,               // markdown is readable as plain text

  // HTML → others
  "text/html→text/plain":        htmlToPlain,
  "text/html→text/markdown":     htmlToMarkdown,

  // CSV → others
  "text/csv→text/plain":         csvToPlain,
  "text/csv→application/json":   csvToJson,

  // JSON → others
  "application/json→text/plain": jsonToPlain,
  "application/json→text/csv":   jsonToCsv,
  "application/json→text/html":  (s) => plainToHtml(jsonToPlain(s)),
  "application/json→text/markdown": (s) => "```json\n" + prettyJson(s) + "\n```",
};

// ─── Individual converters ────────────────────────────────────────────────────

/** Wraps plain text in a minimal HTML document. */
function plainToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>\n<html><head><meta charset="utf-8"></head><body><pre>${escaped}</pre></body></html>`;
}

/** Each line becomes a CSV row (single-column). */
function plainToCsv(text: string): string {
  return text
    .split("\n")
    .map((line) => `"${line.replace(/"/g, '""')}"`)
    .join("\n");
}

/** Wraps lines in a JSON array of strings. */
function plainToJson(text: string): string {
  const lines = text.split("\n");
  // If it's a single line and already valid JSON, pass through
  if (lines.length === 1) {
    try { JSON.parse(text); return text; } catch { /* fall through */ }
  }
  return JSON.stringify(lines, null, 2);
}

// ── Minimal Markdown → HTML ──────────────────────────────────────────────────
// Handles: headings, bold, italic, inline code, fenced code blocks, hr, lists, links, images, blockquotes

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks
    if (/^```/.test(line)) {
      if (!inCode) {
        flushList();
        inCode = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        const escaped = codeLines.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const langAttr = codeLang ? ` class="language-${codeLang}"` : "";
        out.push(`<pre><code${langAttr}>${escaped}</code></pre>`);
        inCode = false;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) { flushList(); out.push("<hr>"); continue; }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      out.push(`<h${level}>${inlineMarkdown(hMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      out.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    const liMatch = line.match(/^[-*+]\s+(.*)$/);
    if (liMatch) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`  <li>${inlineMarkdown(liMatch[1])}</li>`);
      continue;
    }

    flushList();

    // Empty line → paragraph break
    if (!line.trim()) { out.push("<br>"); continue; }

    out.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  if (inCode) {
    const escaped = codeLines.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    out.push(`<pre><code>${escaped}</code></pre>`);
  }
  flushList();

  return `<!DOCTYPE html>\n<html><head><meta charset="utf-8"></head><body>\n${out.join("\n")}\n</body></html>`;
}

/** Applies inline markdown: bold, italic, inline code, links, images. */
function inlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g,  '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g,               "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g,         "<strong>$1</strong>")
    .replace(/__([^_]+)__/g,             "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g,             "<em>$1</em>")
    .replace(/_([^_]+)_/g,              "<em>$1</em>");
}

// ── HTML → plain text ─────────────────────────────────────────────────────────

function htmlToPlain(html: string): string {
  // Use a regex-based approach (no DOM available in workers / test envs)
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|h[1-6]|li|tr|blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── HTML → Markdown ───────────────────────────────────────────────────────────

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "#### $1\n")
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "##### $1\n")
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "###### $1\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, "![$1]($2)")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|ul|ol|blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── CSV ↔ plain / JSON ────────────────────────────────────────────────────────

/** Parse a simple CSV into a 2-D array of strings. */
function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  for (const row of csv.split("\n").filter((r) => r.trim())) {
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQ && row[i + 1] === '"') { cur += '"'; i++; }
        else { inQ = !inQ; }
      } else if (ch === "," && !inQ) {
        cells.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    rows.push(cells);
  }
  return rows;
}

function csvToPlain(csv: string): string {
  return parseCsv(csv)
    .map((row) => row.join("\t"))
    .join("\n");
}

function csvToJson(csv: string): string {
  const rows = parseCsv(csv);
  if (rows.length === 0) return "[]";
  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });
  return JSON.stringify(data, null, 2);
}

function jsonToPlain(json: string): string {
  return prettyJson(json);
}

function jsonToCsv(json: string): string {
  let data: unknown;
  try { data = JSON.parse(json); } catch { return json; }

  // Array of objects → CSV with header row
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
    const headers = Object.keys(data[0] as object);
    const escCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      headers.map(escCell).join(","),
      ...(data as Record<string, unknown>[]).map((row) =>
        headers.map((h) => escCell(row[h])).join(",")
      ),
    ];
    return rows.join("\n");
  }

  // Array of primitives → single-column CSV
  if (Array.isArray(data)) {
    return data.map((v) => `"${String(v).replace(/"/g, '""')}"`).join("\n");
  }

  // Scalar / other → stringify as plain
  return String(data);
}

function prettyJson(json: string): string {
  try { return JSON.stringify(JSON.parse(json), null, 2); } catch { return json; }
}

export default textFormatsHandler;
