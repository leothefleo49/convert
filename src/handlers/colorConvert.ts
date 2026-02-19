import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Color format conversions: HEX, RGB, HSL, HSV, CMYK, and named CSS colors.
 * Supports batch conversion of multiple color values (one per line).
 *
 * Input/Output text format: one color per line.
 * HEX: #ff5733 or ff5733
 * RGB: rgb(255, 87, 51) or 255 87 51
 * HSL: hsl(14, 100%, 60%) or 14 100 60
 * HSV: hsv(14, 80%, 100%) or 14 80 100
 * CMYK: cmyk(0, 66, 80, 0) or 0 66 80 0
 */

// ---- Color math helpers ----

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }
interface HSV { h: number; s: number; v: number; }
interface CMYK { c: number; m: number; y: number; k: number; }

function rgbToHex(c: RGB): string {
  const hex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`;
}

function hexToRgb(hex: string): RGB {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(c: RGB): HSL {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(c: HSL): RGB {
  const s = c.s / 100, l = c.l / 100;
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const h = c.h / 360;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function rgbToHsv(c: RGB): HSV {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToRgb(c: HSV): RGB {
  const s = c.s / 100, v = c.v / 100;
  const h = c.h / 360;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToCmyk(c: RGB): CMYK {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb(c: CMYK): RGB {
  const k = c.k / 100;
  return {
    r: Math.round(255 * (1 - c.c / 100) * (1 - k)),
    g: Math.round(255 * (1 - c.m / 100) * (1 - k)),
    b: Math.round(255 * (1 - c.y / 100) * (1 - k)),
  };
}

// ---- Parsing helpers ----

function parseHex(line: string): RGB | null {
  const m = line.match(/^#?([0-9a-f]{3,8})$/i);
  if (m && (m[1].length === 3 || m[1].length === 6)) return hexToRgb(m[1]);
  return null;
}

function parseRgb(line: string): RGB | null {
  const m = line.match(/rgba?\s*\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/i)
    || line.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}

function parseHsl(line: string): HSL | null {
  const m = line.match(/hsla?\s*\(\s*(\d+)\s*[,\s]\s*(\d+)%?\s*[,\s]\s*(\d+)%?/i)
    || (line.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/) ? null : null);
  if (!m) return null;
  return { h: +m[1], s: +m[2], l: +m[3] };
}

function parseHsv(line: string): HSV | null {
  const m = line.match(/hsva?\s*\(\s*(\d+)\s*[,\s]\s*(\d+)%?\s*[,\s]\s*(\d+)%?/i);
  if (!m) return null;
  return { h: +m[1], s: +m[2], v: +m[3] };
}

function parseCmyk(line: string): CMYK | null {
  const m = line.match(/cmyk\s*\(\s*(\d+)%?\s*[,\s]\s*(\d+)%?\s*[,\s]\s*(\d+)%?\s*[,\s]\s*(\d+)%?/i)
    || line.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
  if (!m) return null;
  return { c: +m[1], m: +m[2], y: +m[3], k: +m[4] };
}

function lineToRgb(line: string, inputFormat: string): RGB | null {
  line = line.trim();
  if (!line) return null;

  switch (inputFormat) {
    case "hex": return parseHex(line);
    case "rgb": return parseRgb(line);
    case "hsl": { const v = parseHsl(line); return v ? hslToRgb(v) : null; }
    case "hsv": { const v = parseHsv(line); return v ? hsvToRgb(v) : null; }
    case "cmyk": { const v = parseCmyk(line); return v ? cmykToRgb(v) : null; }
    default: return null;
  }
}

function rgbToOutput(rgb: RGB, outputFormat: string): string {
  switch (outputFormat) {
    case "hex": return rgbToHex(rgb);
    case "rgb": return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    case "hsl": { const v = rgbToHsl(rgb); return `hsl(${v.h}, ${v.s}%, ${v.l}%)`; }
    case "hsv": { const v = rgbToHsv(rgb); return `hsv(${v.h}, ${v.s}%, ${v.v}%)`; }
    case "cmyk": { const v = rgbToCmyk(rgb); return `cmyk(${v.c}%, ${v.m}%, ${v.y}%, ${v.k}%)`; }
    default: return rgbToHex(rgb);
  }
}

// ---- Handler ----

const TEXT = "text";

function mkFmt(name: string, format: string, ext: string): FileFormat {
  return {
    name, format, extension: ext,
    mime: "text/plain",
    from: true, to: true,
    internal: format,
    category: TEXT,
  };
}

class colorConvertHandler implements FormatHandler {
  public name = "colorConvert";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    mkFmt("HEX Color", "hex-color", "hex.txt"),
    mkFmt("RGB Color", "rgb-color", "rgb.txt"),
    mkFmt("HSL Color", "hsl-color", "hsl.txt"),
    mkFmt("HSV Color", "hsv-color", "hsv.txt"),
    mkFmt("CMYK Color", "cmyk-color", "cmyk.txt"),
  ];

  async init() { /* nothing to init */ }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const inFmt = inputFormat.internal.replace("-color", "");
    const outFmt = outputFormat.internal.replace("-color", "");
    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const text = new TextDecoder().decode(inputFile.bytes);
      const lines = text.split(/\r?\n/);
      const outputLines: string[] = [];

      for (const line of lines) {
        if (!line.trim()) { outputLines.push(""); continue; }
        const rgb = lineToRgb(line, inFmt);
        if (rgb) {
          outputLines.push(rgbToOutput(rgb, outFmt));
        } else {
          outputLines.push(`# Could not parse: ${line}`);
        }
      }

      const result = new TextEncoder().encode(outputLines.join("\n"));
      const baseName = inputFile.name.split(".")[0];
      outputFiles.push({ name: baseName + "." + outputFormat.extension, bytes: result });
    }

    return outputFiles;
  }
}

export default colorConvertHandler;
