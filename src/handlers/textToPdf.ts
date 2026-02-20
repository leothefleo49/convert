import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";
import CommonFormats from "../CommonFormats.ts";

/**
 * Converts plain text / markdown / HTML source to a PDF document.
 * Uses Courier (built-in Type1 PDF font) so no font embedding is needed.
 * Font size is auto-scaled to fit the widest line on one page-width.
 */
class textToPdfHandler implements FormatHandler {
  public name = "textToPdf";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    CommonFormats.TEXT.supported("text", true, false),
    CommonFormats.MD.supported("md", true, false),
    CommonFormats.HTML.supported("html", true, false),
    CommonFormats.PDF.supported("pdf", false, true),
  ];

  async init() {
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    _outputFormat: FileFormat
  ): Promise<FileData[]> {
    return Promise.all(
      inputFiles.map(async (file) => {
        let text = new TextDecoder("utf-8").decode(file.bytes);

        // Strip HTML tags if converting from HTML
        if (inputFormat.mime === "text/html") {
          const div = document.createElement("div");
          div.innerHTML = text;
          text = div.innerText || div.textContent || text;
        }

        const pdfBytes = buildTextPdf(text);
        const baseName = file.name.replace(/\.[^.]+$/, "");
        return { name: baseName + ".pdf", bytes: pdfBytes };
      })
    );
  }
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

const PAGE_W = 612;   // Letter width  (pts)
const PAGE_H = 792;   // Letter height (pts)
const MARGIN_H = 50;  // Horizontal margin (pts)
const MARGIN_V = 50;  // Vertical margin (pts)
const USABLE_W = PAGE_W - 2 * MARGIN_H;  // 512 pts
const USABLE_H = PAGE_H - 2 * MARGIN_V;  // 692 pts

// Courier character width per pt of font size (600 units / 1000-unit em)
const COURIER_CHAR_RATIO = 0.6;

function buildTextPdf(text: string): Uint8Array {
  // Normalise line endings
  const rawLines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // Replace non-Latin-1 chars; PDF WinAnsiEncoding covers 0x20–0xFF
  const safeLine = (s: string) =>
    [...s]
      .map((c) => {
        const code = c.charCodeAt(0);
        if (code >= 0x20 && code <= 0xff) return c;
        return "?";
      })
      .join("");

  const lines = rawLines.map(safeLine);

  // Auto-scale font: fit the widest line into USABLE_W, clamped to [4, 11]
  const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 1);
  const fsByWidth = Math.floor(USABLE_W / (maxLen * COURIER_CHAR_RATIO));
  const fs = Math.max(4, Math.min(11, fsByWidth));
  const charW = fs * COURIER_CHAR_RATIO;
  const lineH = fs * 1.4;
  const maxCols = Math.floor(USABLE_W / charW);
  const maxRows = Math.floor(USABLE_H / lineH);

  // Hard-wrap any line exceeding maxCols
  const wrappedLines: string[] = [];
  for (const line of lines) {
    if (line.length <= maxCols) {
      wrappedLines.push(line);
    } else {
      for (let i = 0; i < line.length; i += maxCols) {
        wrappedLines.push(line.slice(i, i + maxCols));
      }
    }
  }

  // Split into pages
  const pages: string[][] = [];
  for (let i = 0; i < wrappedLines.length; i += maxRows) {
    pages.push(wrappedLines.slice(i, i + maxRows));
  }
  if (pages.length === 0) pages.push([]);

  // ── Build PDF objects ─────────────────────────────────────────────────────
  // Object numbering:
  //   1 = Catalog
  //   2 = Pages (parent)
  //   3 = Courier font resource
  //   4 + 2*i = Page object  (i = 0..pages.length-1)
  //   5 + 2*i = Content stream

  const enc = new TextEncoder();

  // Escape a string for use inside a PDF text-string: ( ) \
  const escPdf = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  // Build content stream for one page
  const buildStream = (pageLines: string[]): string => {
    const topY = PAGE_H - MARGIN_V - fs;
    const parts: string[] = [
      "BT",
      `/F1 ${fs} Tf`,
      `${MARGIN_H} ${topY} Td`,
      `${lineH} TL`,
    ];
    for (const line of pageLines) {
      parts.push(`(${escPdf(line)}) Tj`);
      parts.push("T*");
    }
    parts.push("ET");
    return parts.join("\n");
  };

  const numPages = pages.length;
  const contentStreams = pages.map(buildStream);

  // Page and content stream object numbers
  const pageObjs = Array.from({ length: numPages }, (_, i) => 4 + 2 * i);
  const contObjs = Array.from({ length: numPages }, (_, i) => 5 + 2 * i);

  // Pages-dict /Kids list
  const kidsArr = pageObjs.map((n) => `${n} 0 R`).join(" ");

  // Each object as a raw string (body only; we prepend "N 0 obj\n" and append "\nendobj\n")
  interface Obj { num: number; raw: string }
  const objs: Obj[] = [];

  objs.push({ num: 1, raw: `<</Type /Catalog /Pages 2 0 R>>` });
  objs.push({ num: 2, raw: `<</Type /Pages /Kids [${kidsArr}] /Count ${numPages}>>` });
  objs.push({ num: 3, raw: `<</Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding>>` });

  for (let i = 0; i < numPages; i++) {
    objs.push({
      num: pageObjs[i],
      raw:
        `<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}]` +
        ` /Contents ${contObjs[i]} 0 R /Resources <</Font <</F1 3 0 R>>>>>>`,
    });
    const stream = contentStreams[i];
    const streamBytes = enc.encode(stream).length;
    objs.push({
      num: contObjs[i],
      raw: `<</Length ${streamBytes}>>\nstream\n${stream}\nendstream`,
    });
  }

  // Sort by object number so the xref is in order
  objs.sort((a, b) => a.num - b.num);
  const totalObjs = objs[objs.length - 1].num; // highest object number used

  // ── Assemble the byte array, tracking xref offsets ───────────────────────
  const headerStr = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const objStrings = objs.map(
    (o) => `${o.num} 0 obj\n${o.raw}\nendobj\n`
  );

  // Offset computation (all in UTF-8 bytes, but we only use ASCII + 4 header bytes)
  const headerBytes = enc.encode(headerStr);
  let bytePos = headerBytes.length;

  const xrefOffsets = new Map<number, number>();
  const objByteArrays = objStrings.map((s, idx) => {
    xrefOffsets.set(objs[idx].num, bytePos);
    const b = enc.encode(s);
    bytePos += b.length;
    return b;
  });

  const xrefPos = bytePos;

  // xref table
  let xref = `xref\n0 ${totalObjs + 1}\n`;
  xref += "0000000000 65535 f \n"; // Free list head
  for (let i = 1; i <= totalObjs; i++) {
    const off = xrefOffsets.get(i);
    if (off !== undefined) {
      xref += `${String(off).padStart(10, "0")} 00000 n \n`;
    } else {
      // Object number gap (shouldn't happen with our numbering) — treat as free
      xref += "0000000000 65535 f \n";
    }
  }

  const trailerStr =
    `trailer\n<</Size ${totalObjs + 1} /Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF\n`;

  // Merge all parts into one Uint8Array
  const xrefBytes = enc.encode(xref);
  const trailerBytes = enc.encode(trailerStr);

  const totalSize =
    headerBytes.length +
    objByteArrays.reduce((s, b) => s + b.length, 0) +
    xrefBytes.length +
    trailerBytes.length;

  const result = new Uint8Array(totalSize);
  let pos = 0;
  const write = (b: Uint8Array) => { result.set(b, pos); pos += b.length; };

  write(headerBytes);
  objByteArrays.forEach(write);
  write(xrefBytes);
  write(trailerBytes);

  return result;
}

export default textToPdfHandler;
