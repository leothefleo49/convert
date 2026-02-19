import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Hash/checksum computation handler.
 * Takes any file and outputs its hash digest as a text file.
 * Supports MD5, SHA-1, SHA-256, SHA-384, SHA-512 via Web Crypto API,
 * plus CRC32 and Adler32 implemented in pure JS.
 */

function mkFmt(name: string, format: string, ext: string, from: boolean, to: boolean): FileFormat {
  return {
    name, format, extension: ext,
    mime: from ? "application/octet-stream" : "text/plain",
    from, to, internal: format, category: "data"
  };
}

// CRC32 lookup table
const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crc32Table[i] = c >>> 0;
}

function computeCRC32(bytes: Uint8Array): string {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = crc32Table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, "0");
}

function computeAdler32(bytes: Uint8Array): string {
  let a = 1, b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a).toString(16).padStart(8, "0");
}

async function computeWebCrypto(bytes: Uint8Array, algo: string): Promise<string> {
  const digest = await crypto.subtle.digest(algo, bytes as ArrayBufferView<ArrayBuffer>);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

class hashHandler implements FormatHandler {
  public name = "hashChecksum";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    mkFmt("Any File (for hashing)", "any-hash-input", "*", true, false),
    mkFmt("MD5 Hash", "md5", "md5.txt", false, true),
    mkFmt("SHA-1 Hash", "sha1", "sha1.txt", false, true),
    mkFmt("SHA-256 Hash", "sha256", "sha256.txt", false, true),
    mkFmt("SHA-384 Hash", "sha384", "sha384.txt", false, true),
    mkFmt("SHA-512 Hash", "sha512", "sha512.txt", false, true),
    mkFmt("CRC32 Checksum", "crc32", "crc32.txt", false, true),
    mkFmt("Adler-32 Checksum", "adler32", "adler32.txt", false, true),
    mkFmt("All Hashes Summary", "all-hashes", "hashes.txt", false, true),
  ];

  // Accept any file type as input
  public supportAnyInput = true;

  async init() {}

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const baseName = inputFile.name.split(".")[0];
      let result = "";

      switch (outputFormat.internal) {
        case "md5": {
          // Web Crypto doesn't support MD5 natively, implement simple MD5
          result = await computeMD5(inputFile.bytes);
          result = `${result}  ${inputFile.name}`;
          break;
        }
        case "sha1": {
          const hash = await computeWebCrypto(inputFile.bytes, "SHA-1");
          result = `${hash}  ${inputFile.name}`;
          break;
        }
        case "sha256": {
          const hash = await computeWebCrypto(inputFile.bytes, "SHA-256");
          result = `${hash}  ${inputFile.name}`;
          break;
        }
        case "sha384": {
          const hash = await computeWebCrypto(inputFile.bytes, "SHA-384");
          result = `${hash}  ${inputFile.name}`;
          break;
        }
        case "sha512": {
          const hash = await computeWebCrypto(inputFile.bytes, "SHA-512");
          result = `${hash}  ${inputFile.name}`;
          break;
        }
        case "crc32": {
          const hash = computeCRC32(inputFile.bytes);
          result = `${hash}  ${inputFile.name}`;
          break;
        }
        case "adler32": {
          const hash = computeAdler32(inputFile.bytes);
          result = `${hash}  ${inputFile.name}`;
          break;
        }
        case "all-hashes": {
          const lines: string[] = [];
          lines.push(`File: ${inputFile.name}`);
          lines.push(`Size: ${inputFile.bytes.length} bytes`);
          lines.push(`---`);
          lines.push(`MD5:     ${await computeMD5(inputFile.bytes)}`);
          lines.push(`SHA-1:   ${await computeWebCrypto(inputFile.bytes, "SHA-1")}`);
          lines.push(`SHA-256: ${await computeWebCrypto(inputFile.bytes, "SHA-256")}`);
          lines.push(`SHA-384: ${await computeWebCrypto(inputFile.bytes, "SHA-384")}`);
          lines.push(`SHA-512: ${await computeWebCrypto(inputFile.bytes, "SHA-512")}`);
          lines.push(`CRC32:   ${computeCRC32(inputFile.bytes)}`);
          lines.push(`Adler32: ${computeAdler32(inputFile.bytes)}`);
          result = lines.join("\n");
          break;
        }
      }

      outputFiles.push({
        name: baseName + "." + outputFormat.extension,
        bytes: new TextEncoder().encode(result)
      });
    }

    return outputFiles;
  }
}

/**
 * Pure JavaScript MD5 implementation (RFC 1321).
 * Web Crypto API doesn't support MD5, so we do it ourselves.
 */
async function computeMD5(bytes: Uint8Array): Promise<string> {
  // Helper functions
  const rotl = (x: number, n: number) => (x << n) | (x >>> (32 - n));

  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);

  // Pre-computed sine table
  const T = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  // Padding
  const bitLen = bytes.length * 8;
  const padLen = (bytes.length + 9 + 63) & ~63;
  const padded = new Uint8Array(padLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padLen - 8, bitLen & 0xFFFFFFFF, true);
  view.setUint32(padLen - 4, Math.floor(bitLen / 0x100000000), true);

  let a0 = 0x67452301, b0 = 0xEFCDAB89, c0 = 0x98BADCFE, d0 = 0x10325476;

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  for (let offset = 0; offset < padLen; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true);
    }

    let a = a0, b = b0, c = c0, d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = F(b, c, d); g = i; }
      else if (i < 32) { f = G(b, c, d); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = H(b, c, d); g = (3 * i + 5) % 16; }
      else { f = I(b, c, d); g = (7 * i) % 16; }

      const temp = d;
      d = c;
      c = b;
      b = (b + rotl((a + f + T[i] + M[g]) >>> 0, S[i])) >>> 0;
      a = temp;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const toHex = (n: number) => {
    const bytes = [(n & 0xff), (n >>> 8 & 0xff), (n >>> 16 & 0xff), (n >>> 24 & 0xff)];
    return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

export default hashHandler;
