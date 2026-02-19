/**
 * pdftextract.ts
 * Extracts plain text from PDF files using pdfjs-dist (already bundled).
 *
 * This opens routes such as:
 *   PDF → TXT  (direct)
 *   PDF → TXT → (pandoc) → DOCX / ODT / Markdown / LaTeX / RST / …
 *
 * contributor: leothefleo49
 */
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

let _pdfjsLoaded = false;

class PdfTextExtractHandler implements FormatHandler {

  public name: string = "pdftextract";
  public contributor: string = "leothefleo49";

  public supportedFormats: FileFormat[] = [
    {
      name: "PDF Document",
      format: "pdf",
      extension: "pdf",
      mime: "application/pdf",
      from: true,
      to: false,
      category: "document",
      lossless: true,
    },
    {
      name: "Plain Text",
      format: "plain",
      extension: "txt",
      mime: "text/plain",
      from: false,
      to: true,
      category: "text",
      lossless: false, // text extraction is never fully lossless (no layout info)
    },
  ];

  public ready: boolean = true;

  async init() {
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    _outputFormat: FileFormat
  ): Promise<FileData[]> {
    // Dynamic import so Vite can tree-shake if not used
    const pdfjsLib = await import("pdfjs-dist");

    // Vite-friendly worker URL (Vite copies the worker as a separate chunk)
    if (!_pdfjsLoaded) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).href;
      _pdfjsLoaded = true;
    }

    const outputFiles: FileData[] = [];

    for (const file of inputFiles) {
      // pdfjs needs a copy of the bytes (it may detach the buffer)
      const data = new Uint8Array(file.bytes as ArrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;

      const pageParts: string[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        // Re-assemble text: preserve newlines from transform offsets
        let lastY: number | null = null;
        const lineTokens: string[] = [];
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const textItem = item as { str: string; transform: number[] };
          const y = textItem.transform[5];
          if (lastY !== null && Math.abs(y - lastY) > 2) {
            lineTokens.push("\n");
          }
          lineTokens.push(textItem.str);
          lastY = y;
        }
        pageParts.push(lineTokens.join(""));
      }

      const fullText = pageParts.join("\n\n─────────────────────\n\n");
      const bytes = new TextEncoder().encode(fullText);
      const name = file.name.replace(/\.pdf$/i, ".txt");
      outputFiles.push({ bytes, name });
    }

    return outputFiles;
  }
}

export default PdfTextExtractHandler;
