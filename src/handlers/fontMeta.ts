import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Font metadata extraction and basic format conversions.
 * Extracts font metadata to JSON/TXT, converts between font-related text formats.
 * Also handles CSS @font-face generation from font files.
 */

function mkFmt(name: string, format: string, ext: string, mime: string, from: boolean, to: boolean): FileFormat {
  return { name, format, extension: ext, mime, from, to, internal: format, category: "font" };
}

class fontHandler implements FormatHandler {
  public name = "fontHandler";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    mkFmt("TrueType Font", "ttf", "ttf", "font/ttf", true, false),
    mkFmt("OpenType Font", "otf", "otf", "font/otf", true, false),
    mkFmt("WOFF Font", "woff", "woff", "font/woff", true, false),
    mkFmt("WOFF2 Font", "woff2", "woff2", "font/woff2", true, false),
    mkFmt("Font Metadata JSON", "font-meta-json", "json", "application/json", false, true),
    mkFmt("Font Metadata Text", "font-meta-txt", "txt", "text/plain", false, true),
    mkFmt("CSS @font-face", "font-css", "css", "text/css", false, true),
    mkFmt("Base64 Data URI", "font-datauri", "txt", "text/plain", false, true),
  ];

  async init() {}

  private parseTTFTables(bytes: Uint8Array): Record<string, string> {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const meta: Record<string, string> = {};

    try {
      const numTables = view.getUint16(4);
      let nameTableOffset = 0;
      let nameTableLength = 0;

      for (let i = 0; i < numTables; i++) {
        const offset = 12 + i * 16;
        const tag = String.fromCharCode(
          view.getUint8(offset), view.getUint8(offset + 1),
          view.getUint8(offset + 2), view.getUint8(offset + 3)
        );
        if (tag === "name") {
          nameTableOffset = view.getUint32(offset + 8);
          nameTableLength = view.getUint32(offset + 12);
          break;
        }
      }

      if (nameTableOffset === 0) return meta;

      const nameCount = view.getUint16(nameTableOffset + 2);
      const stringOffset = nameTableOffset + view.getUint16(nameTableOffset + 4);

      const nameIds: Record<number, string> = {
        0: "copyright", 1: "fontFamily", 2: "fontSubfamily",
        3: "uniqueId", 4: "fullName", 5: "version",
        6: "postScriptName", 7: "trademark", 8: "manufacturer",
        9: "designer", 10: "description", 11: "vendorURL",
        12: "designerURL", 13: "license", 14: "licenseURL",
        16: "preferredFamily", 17: "preferredSubfamily"
      };

      for (let i = 0; i < nameCount; i++) {
        const recordOffset = nameTableOffset + 6 + i * 12;
        if (recordOffset + 12 > bytes.length) break;

        const platformId = view.getUint16(recordOffset);
        const nameId = view.getUint16(recordOffset + 6);
        const length = view.getUint16(recordOffset + 8);
        const strOff = view.getUint16(recordOffset + 10);

        if (!(nameId in nameIds)) continue;

        const start = stringOffset + strOff;
        if (start + length > bytes.length) continue;

        let str = "";
        if (platformId === 3 || platformId === 0) {
          // UTF-16BE
          for (let j = 0; j < length; j += 2) {
            str += String.fromCharCode(view.getUint16(start + j));
          }
        } else {
          // Latin-1
          for (let j = 0; j < length; j++) {
            str += String.fromCharCode(view.getUint8(start + j));
          }
        }

        if (str.trim() && !meta[nameIds[nameId]]) {
          meta[nameIds[nameId]] = str.trim();
        }
      }
    } catch {
      // Parsing failed, return what we have
    }

    return meta;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const baseName = inputFile.name.split(".")[0];
      const meta = this.parseTTFTables(inputFile.bytes);
      const fontFamily = meta.fontFamily || baseName;

      meta.fileSize = `${inputFile.bytes.length} bytes`;
      meta.sourceFormat = inputFormat.format.toUpperCase();
      meta.fileName = inputFile.name;

      switch (outputFormat.internal) {
        case "font-meta-json": {
          const json = JSON.stringify(meta, null, 2);
          outputFiles.push({ name: baseName + ".json", bytes: new TextEncoder().encode(json) });
          break;
        }
        case "font-meta-txt": {
          const lines = Object.entries(meta).map(([k, v]) => `${k}: ${v}`);
          outputFiles.push({ name: baseName + ".txt", bytes: new TextEncoder().encode(lines.join("\n")) });
          break;
        }
        case "font-css": {
          const b64 = btoa(String.fromCharCode(...inputFile.bytes));
          const mimeMap: Record<string, string> = {
            ttf: "font/truetype", otf: "font/opentype",
            woff: "font/woff", woff2: "font/woff2"
          };
          const mime = mimeMap[inputFormat.format] || "application/octet-stream";
          const css = `@font-face {\n  font-family: '${fontFamily}';\n  src: url('data:${mime};base64,${b64}') format('${inputFormat.format}');\n  font-weight: normal;\n  font-style: normal;\n  font-display: swap;\n}\n`;
          outputFiles.push({ name: baseName + ".css", bytes: new TextEncoder().encode(css) });
          break;
        }
        case "font-datauri": {
          const b64 = btoa(String.fromCharCode(...inputFile.bytes));
          const mimeMap: Record<string, string> = {
            ttf: "font/truetype", otf: "font/opentype",
            woff: "font/woff", woff2: "font/woff2"
          };
          const mime = mimeMap[inputFormat.format] || "application/octet-stream";
          const uri = `data:${mime};base64,${b64}`;
          outputFiles.push({ name: baseName + ".txt", bytes: new TextEncoder().encode(uri) });
          break;
        }
      }
    }

    return outputFiles;
  }
}

export default fontHandler;
