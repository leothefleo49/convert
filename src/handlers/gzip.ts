import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";
import pako from "pako";

/**
 * GZIP compress / decompress handler.
 * Uses the `pako` library (already a project dependency).
 * Compress: any file → .gz
 * Decompress: .gz file → original file (strips .gz extension)
 */
class gzipHandler implements FormatHandler {
  public name = "gzip";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    {
      name: "GZIP Compressed Archive",
      format: "gz",
      extension: "gz",
      mime: "application/gzip",
      from: true,
      to: true,
      internal: "gz",
      category: "archive",
      lossless: true
    },
    {
      name: "Any File (for GZIP compression)",
      format: "any",
      extension: "bin",
      mime: "application/octet-stream",
      from: true,
      to: false,
      internal: "raw",
      category: "data"
    }
  ];

  async init() {
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => {
      if (outputFormat.internal === "gz") {
        // Compress
        const compressed = pako.gzip(file.bytes, { level: 6 });
        return {
          bytes: compressed,
          name: file.name + ".gz"
        };
      } else {
        // Decompress
        let decompressed: Uint8Array;
        try {
          decompressed = pako.ungzip(file.bytes);
        } catch {
          // Try inflate as fallback for raw deflate streams
          decompressed = pako.inflate(file.bytes);
        }
        // Strip .gz extension if present
        const outName = file.name.endsWith(".gz")
          ? file.name.slice(0, -3)
          : file.name + ".decompressed";
        return { bytes: decompressed, name: outName };
      }
    });
  }
}

export default gzipHandler;
