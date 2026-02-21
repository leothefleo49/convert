import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * JWT Decoder handler.
 * Converts a JSON Web Token (JWT) string into a formatted JSON object
 * containing the decoded Header and Payload.
 */
class jwtDecodeHandler implements FormatHandler {
  public name = "jwtDecode";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    {
      name: "JSON Web Token",
      format: "jwt",
      extension: "jwt",
      mime: "application/jwt",
      from: true,
      to: false,
      internal: "jwt",
      category: "data",
      lossless: true
    },
    {
      name: "Decoded JWT (JSON)",
      format: "jwt-json",
      extension: "json",
      mime: "application/json",
      from: false,
      to: true,
      internal: "jwt-json",
      category: "data",
      lossless: false
    }
  ];

  async init() {
    this.ready = true;
  }

  private decodeBase64Url(str: string): string {
    // Replace non-url compatible chars with base64 standard chars
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' to make it a multiple of 4
    const pad = str.length % 4;
    if (pad) {
      if (pad === 1) throw new Error('Invalid Base64Url string');
      str += new Array(5 - pad).join('=');
    }
    return atob(str);
  }

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    _outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => {
      const text = new TextDecoder().decode(file.bytes).trim();
      const parts = text.split('.');

      if (parts.length !== 3) {
        throw new Error("Invalid JWT format. Expected 3 parts separated by dots.");
      }

      try {
        const header = JSON.parse(this.decodeBase64Url(parts[0]));
        const payload = JSON.parse(this.decodeBase64Url(parts[1]));

        const result = {
          header,
          payload,
          signature: parts[2]
        };

        const baseName = file.name.replace(/\.[^.]+$/, "");
        return {
          name: `${baseName}_decoded.json`,
          bytes: new TextEncoder().encode(JSON.stringify(result, null, 2))
        };
      } catch (e) {
        throw new Error("Failed to decode JWT: " + (e instanceof Error ? e.message : String(e)));
      }
    });
  }
}

export default jwtDecodeHandler;
