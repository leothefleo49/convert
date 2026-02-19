import CommonFormats from "src/CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Handler for encoding/decoding conversions:
 * Base64, Hex, Binary (0s and 1s), URL encoding, HTML entities,
 * and data URI handling.
 */
class encodingHandler implements FormatHandler {
  public name = "encoding";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    CommonFormats.TEXT.builder("text").allowFrom().allowTo().markLossless(),
    {
      name: "Base64 Encoded Text",
      format: "base64",
      extension: "b64",
      mime: "text/x-base64",
      from: true,
      to: true,
      internal: "base64",
      category: "data",
      lossless: true
    },
    {
      name: "Hexadecimal Dump",
      format: "hex",
      extension: "hex",
      mime: "text/x-hex",
      from: true,
      to: true,
      internal: "hex",
      category: "data",
      lossless: true
    },
    {
      name: "Binary String (0s and 1s)",
      format: "binary",
      extension: "bin.txt",
      mime: "text/x-binary-string",
      from: true,
      to: true,
      internal: "binary",
      category: "data",
      lossless: true
    },
    {
      name: "URL Encoded Text",
      format: "urlencoded",
      extension: "urlenc.txt",
      mime: "text/x-url-encoded",
      from: true,
      to: true,
      internal: "urlencoded",
      category: "data",
      lossless: true
    },
    {
      name: "HTML Entities Encoded",
      format: "html-entities",
      extension: "entities.txt",
      mime: "text/x-html-entities",
      from: true,
      to: true,
      internal: "html-entities",
      category: "data",
      lossless: true
    },
    {
      name: "JSON Minified",
      format: "json-min",
      extension: "min.json",
      mime: "application/json",
      from: false,
      to: true,
      internal: "json-min",
      category: "data",
      lossless: true
    },
    {
      name: "JSON Pretty-Printed",
      format: "json-pretty",
      extension: "json",
      mime: "application/json",
      from: false,
      to: true,
      internal: "json-pretty",
      category: "data",
      lossless: true
    },
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
      // Decode input to raw bytes
      let rawBytes: Uint8Array;
      switch (inputFormat.internal) {
        case "text":
          rawBytes = file.bytes;
          break;
        case "base64": {
          const b64 = new TextDecoder().decode(file.bytes).trim();
          const binary = atob(b64);
          rawBytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) rawBytes[i] = binary.charCodeAt(i);
          break;
        }
        case "hex": {
          const hexStr = new TextDecoder().decode(file.bytes).replace(/[\s\n\r]/g, "");
          rawBytes = new Uint8Array(hexStr.length / 2);
          for (let i = 0; i < rawBytes.length; i++) {
            rawBytes[i] = parseInt(hexStr.substring(i * 2, i * 2 + 2), 16);
          }
          break;
        }
        case "binary": {
          const binStr = new TextDecoder().decode(file.bytes).replace(/[\s\n\r]/g, "");
          rawBytes = new Uint8Array(Math.ceil(binStr.length / 8));
          for (let i = 0; i < rawBytes.length; i++) {
            rawBytes[i] = parseInt(binStr.substring(i * 8, i * 8 + 8).padEnd(8, "0"), 2);
          }
          break;
        }
        case "urlencoded": {
          const decoded = decodeURIComponent(new TextDecoder().decode(file.bytes).trim());
          rawBytes = new TextEncoder().encode(decoded);
          break;
        }
        case "html-entities": {
          const html = new TextDecoder().decode(file.bytes);
          const decoded = html
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
            .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
          rawBytes = new TextEncoder().encode(decoded);
          break;
        }
        default:
          rawBytes = file.bytes;
      }

      // Encode output
      let outputBytes: Uint8Array;
      switch (outputFormat.internal) {
        case "text":
          outputBytes = rawBytes;
          break;
        case "base64": {
          let binary = "";
          for (let i = 0; i < rawBytes.length; i++) binary += String.fromCharCode(rawBytes[i]);
          outputBytes = new TextEncoder().encode(btoa(binary));
          break;
        }
        case "hex": {
          const hexLines: string[] = [];
          for (let i = 0; i < rawBytes.length; i += 16) {
            const slice = rawBytes.slice(i, i + 16);
            const hex = Array.from(slice).map(b => b.toString(16).padStart(2, "0")).join(" ");
            const ascii = Array.from(slice).map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : ".").join("");
            hexLines.push(`${i.toString(16).padStart(8, "0")}  ${hex.padEnd(48)}  |${ascii}|`);
          }
          outputBytes = new TextEncoder().encode(hexLines.join("\n") + "\n");
          break;
        }
        case "binary": {
          const binLines: string[] = [];
          for (let i = 0; i < rawBytes.length; i += 4) {
            const slice = rawBytes.slice(i, i + 4);
            binLines.push(Array.from(slice).map(b => b.toString(2).padStart(8, "0")).join(" "));
          }
          outputBytes = new TextEncoder().encode(binLines.join("\n") + "\n");
          break;
        }
        case "urlencoded": {
          const text = new TextDecoder().decode(rawBytes);
          outputBytes = new TextEncoder().encode(encodeURIComponent(text));
          break;
        }
        case "html-entities": {
          const text = new TextDecoder().decode(rawBytes);
          const encoded = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
          outputBytes = new TextEncoder().encode(encoded);
          break;
        }
        case "json-min": {
          const text = new TextDecoder().decode(rawBytes);
          outputBytes = new TextEncoder().encode(JSON.stringify(JSON.parse(text)));
          break;
        }
        case "json-pretty": {
          const text = new TextDecoder().decode(rawBytes);
          outputBytes = new TextEncoder().encode(JSON.stringify(JSON.parse(text), null, 2));
          break;
        }
        default:
          outputBytes = rawBytes;
      }

      return {
        name: file.name.split(".")[0] + "." + outputFormat.extension,
        bytes: outputBytes
      };
    });
  }
}

export default encodingHandler;
