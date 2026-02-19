import CommonFormats from "src/CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Handler for converting between config/data formats: TOML, INI, .env, .properties ↔ JSON/YAML.
 * TOML parsing is done with a lightweight built-in parser.
 */
class configFormatHandler implements FormatHandler {
  public name = "configFormat";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    CommonFormats.JSON.builder("json").allowFrom().allowTo().markLossless(),
    CommonFormats.YML.builder("yaml").allowFrom().allowTo().markLossless(),
    {
      name: "TOML Configuration",
      format: "toml",
      extension: "toml",
      mime: "application/toml",
      from: true,
      to: true,
      internal: "toml",
      category: "data",
      lossless: true
    },
    {
      name: "INI Configuration",
      format: "ini",
      extension: "ini",
      mime: "text/x-ini",
      from: true,
      to: true,
      internal: "ini",
      category: "data",
      lossless: true
    },
    {
      name: "Environment Variables",
      format: "env",
      extension: "env",
      mime: "text/x-env",
      from: true,
      to: true,
      internal: "env",
      category: "data",
      lossless: true
    },
    {
      name: "Java Properties",
      format: "properties",
      extension: "properties",
      mime: "text/x-java-properties",
      from: true,
      to: true,
      internal: "properties",
      category: "data",
      lossless: true
    },
  ];

  async init() {
    this.ready = true;
  }

  // --- Parsers ---

  private parseINI(text: string): Record<string, any> {
    const result: Record<string, any> = {};
    let currentSection = "";
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith(";") || line.startsWith("#")) continue;
      const sectionMatch = line.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        if (!result[currentSection]) result[currentSection] = {};
        continue;
      }
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) continue;
      const key = line.substring(0, eqIndex).trim();
      let value: any = line.substring(eqIndex + 1).trim();
      // Try to parse numbers and booleans
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (/^-?\d+(\.\d+)?$/.test(value)) value = Number(value);
      // Remove surrounding quotes
      else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (currentSection) {
        result[currentSection][key] = value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private parseEnv(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) continue;
      const key = line.substring(0, eqIndex).trim();
      let value = line.substring(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
    return result;
  }

  private parseProperties(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || line.startsWith("!")) continue;
      // Properties use = or : as separator
      const match = line.match(/^([^=:]+)[=:]\s*(.*)/);
      if (match) {
        result[match[1].trim()] = match[2].trim();
      }
    }
    return result;
  }

  private parseTOML(text: string): Record<string, any> {
    const result: Record<string, any> = {};
    let currentTable: Record<string, any> = result;
    let currentPath: string[] = [];

    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      // Table header [section] or [section.subsection]
      const tableMatch = line.match(/^\[([^\]]+)\]$/);
      if (tableMatch) {
        const path = tableMatch[1].split(".").map(p => p.trim().replace(/^["']|["']$/g, ""));
        currentPath = path;
        let obj = result;
        for (const key of path) {
          if (!obj[key] || typeof obj[key] !== "object") obj[key] = {};
          obj = obj[key];
        }
        currentTable = obj;
        continue;
      }

      // Array of tables [[section]]
      const arrayTableMatch = line.match(/^\[\[([^\]]+)\]\]$/);
      if (arrayTableMatch) {
        const path = arrayTableMatch[1].split(".").map(p => p.trim().replace(/^["']|["']$/g, ""));
        let obj = result;
        for (let i = 0; i < path.length - 1; i++) {
          if (!obj[path[i]] || typeof obj[path[i]] !== "object") obj[path[i]] = {};
          obj = obj[path[i]];
        }
        const lastKey = path[path.length - 1];
        if (!Array.isArray(obj[lastKey])) obj[lastKey] = [];
        const newTable: Record<string, any> = {};
        obj[lastKey].push(newTable);
        currentTable = newTable;
        continue;
      }

      // Key = Value
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) continue;
      const key = line.substring(0, eqIndex).trim().replace(/^["']|["']$/g, "");
      const rawValue = line.substring(eqIndex + 1).trim();
      currentTable[key] = this.parseTOMLValue(rawValue);
    }

    return result;
  }

  private parseTOMLValue(raw: string): any {
    // String (basic)
    if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1).replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\").replace(/\\"/g, '"');
    if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
    // Boolean
    if (raw === "true") return true;
    if (raw === "false") return false;
    // Date/time (keep as string)
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
    // Number
    if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(raw)) return Number(raw);
    if (/^0x[\da-fA-F]+$/.test(raw)) return parseInt(raw, 16);
    if (/^0o[0-7]+$/.test(raw)) return parseInt(raw.slice(2), 8);
    if (/^0b[01]+$/.test(raw)) return parseInt(raw.slice(2), 2);
    if (raw === "inf" || raw === "+inf") return Infinity;
    if (raw === "-inf") return -Infinity;
    if (raw === "nan" || raw === "+nan" || raw === "-nan") return NaN;
    // Inline array
    if (raw.startsWith("[") && raw.endsWith("]")) {
      const inner = raw.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(",").map(v => this.parseTOMLValue(v.trim()));
    }
    // Inline table
    if (raw.startsWith("{") && raw.endsWith("}")) {
      const inner = raw.slice(1, -1).trim();
      if (!inner) return {};
      const obj: Record<string, any> = {};
      for (const pair of inner.split(",")) {
        const eq = pair.indexOf("=");
        if (eq === -1) continue;
        const k = pair.substring(0, eq).trim().replace(/^["']|["']$/g, "");
        const v = pair.substring(eq + 1).trim();
        obj[k] = this.parseTOMLValue(v);
      }
      return obj;
    }
    return raw;
  }

  // --- Serializers ---

  private toINI(data: Record<string, any>): string {
    const lines: string[] = [];
    const topLevel: [string, any][] = [];
    const sections: [string, Record<string, any>][] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        sections.push([key, value]);
      } else {
        topLevel.push([key, value]);
      }
    }
    for (const [k, v] of topLevel) lines.push(`${k}=${v}`);
    if (topLevel.length && sections.length) lines.push("");
    for (const [section, values] of sections) {
      lines.push(`[${section}]`);
      for (const [k, v] of Object.entries(values)) {
        lines.push(`${k}=${typeof v === "string" ? v : JSON.stringify(v)}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  private toEnv(data: Record<string, any>): string {
    const lines: string[] = [];
    const flat = this.flattenObject(data);
    for (const [k, v] of Object.entries(flat)) {
      const key = k.replace(/\./g, "_").toUpperCase();
      const val = typeof v === "string" ? v : JSON.stringify(v);
      lines.push(val.includes(" ") || val.includes('"') ? `${key}="${val}"` : `${key}=${val}`);
    }
    return lines.join("\n") + "\n";
  }

  private toProperties(data: Record<string, any>): string {
    const flat = this.flattenObject(data);
    return Object.entries(flat).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  }

  private toTOML(data: Record<string, any>, prefix = ""): string {
    const lines: string[] = [];
    const simple: [string, any][] = [];
    const tables: [string, Record<string, any>][] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        tables.push([key, value]);
      } else {
        simple.push([key, value]);
      }
    }

    for (const [k, v] of simple) {
      lines.push(`${k} = ${this.toTOMLValue(v)}`);
    }

    for (const [k, v] of tables) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      lines.push("");
      if (Array.isArray(v)) {
        for (const item of v) {
          lines.push(`[[${fullKey}]]`);
          if (typeof item === "object" && item !== null) {
            for (const [ik, iv] of Object.entries(item)) {
              lines.push(`${ik} = ${this.toTOMLValue(iv)}`);
            }
          }
        }
      } else {
        lines.push(`[${fullKey}]`);
        lines.push(this.toTOML(v, fullKey).trim());
      }
    }

    return lines.join("\n") + "\n";
  }

  private toTOMLValue(v: any): string {
    if (typeof v === "string") return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") return String(v);
    if (Array.isArray(v)) return `[${v.map(i => this.toTOMLValue(i)).join(", ")}]`;
    if (v && typeof v === "object") return `{${Object.entries(v).map(([k, val]) => `${k} = ${this.toTOMLValue(val)}`).join(", ")}}`;
    return JSON.stringify(v);
  }

  private flattenObject(obj: Record<string, any>, prefix = ""): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, fullKey));
      } else {
        result[fullKey] = typeof value === "string" ? value : JSON.stringify(value);
      }
    }
    return result;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    // Lazy import yaml only when needed
    const yaml = await import("@std/yaml");

    return inputFiles.map(file => {
      const text = new TextDecoder().decode(file.bytes);
      let data: any;

      // Parse input
      switch (inputFormat.internal) {
        case "json": data = JSON.parse(text); break;
        case "yaml": data = yaml.parse(text); break;
        case "toml": data = this.parseTOML(text); break;
        case "ini": data = this.parseINI(text); break;
        case "env": data = this.parseEnv(text); break;
        case "properties": data = this.parseProperties(text); break;
        default: throw new Error("Unsupported input format: " + inputFormat.internal);
      }

      // Serialize output
      let output: string;
      switch (outputFormat.internal) {
        case "json": output = JSON.stringify(data, null, 2); break;
        case "yaml": output = yaml.stringify(data); break;
        case "toml": output = this.toTOML(data); break;
        case "ini": output = this.toINI(data); break;
        case "env": output = this.toEnv(data); break;
        case "properties": output = this.toProperties(data); break;
        default: throw new Error("Unsupported output format: " + outputFormat.internal);
      }

      return {
        name: file.name.split(".")[0] + "." + outputFormat.extension,
        bytes: new TextEncoder().encode(output)
      };
    });
  }
}

export default configFormatHandler;
