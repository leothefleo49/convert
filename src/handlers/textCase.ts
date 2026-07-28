import CommonFormats from "../CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Text case & utility conversions.
 *
 * Pure-JS, dependency-free transformations on plain text:
 *   - camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE
 *   - Title Case, Sentence case, lowercase, UPPERCASE
 *   - URL slug (slugify)
 *   - Reverse text (by code points, so emoji stay intact)
 *   - Hex dump (offsets + hex bytes + ASCII gutter, like `hexdump -C`)
 *
 * These bridge into the existing text format graph so any text-bearing
 * format (markdown, html, csv, json, code, etc.) can be case-converted.
 */
class textCaseHandler implements FormatHandler {
  public name = "textCase";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    CommonFormats.TEXT.supported("text", true, true),
    {
      name: "camelCase",
      format: "camelcase",
      extension: "camel.txt",
      mime: "text/x-camelcase",
      from: false,
      to: true,
      internal: "camelcase",
      category: "text"
    },
    {
      name: "PascalCase",
      format: "pascalcase",
      extension: "pascal.txt",
      mime: "text/x-pascalcase",
      from: false,
      to: true,
      internal: "pascalcase",
      category: "text"
    },
    {
      name: "snake_case",
      format: "snakecase",
      extension: "snake.txt",
      mime: "text/x-snakecase",
      from: false,
      to: true,
      internal: "snakecase",
      category: "text"
    },
    {
      name: "kebab-case",
      format: "kebabcase",
      extension: "kebab.txt",
      mime: "text/x-kebabcase",
      from: false,
      to: true,
      internal: "kebabcase",
      category: "text"
    },
    {
      name: "CONSTANT_CASE",
      format: "constantcase",
      extension: "constant.txt",
      mime: "text/x-constantcase",
      from: false,
      to: true,
      internal: "constantcase",
      category: "text"
    },
    {
      name: "Title Case",
      format: "titlecase",
      extension: "title.txt",
      mime: "text/x-titlecase",
      from: false,
      to: true,
      internal: "titlecase",
      category: "text"
    },
    {
      name: "Sentence case",
      format: "sentencecase",
      extension: "sentence.txt",
      mime: "text/x-sentencecase",
      from: false,
      to: true,
      internal: "sentencecase",
      category: "text"
    },
    {
      name: "URL Slug",
      format: "slug",
      extension: "slug.txt",
      mime: "text/x-slug",
      from: false,
      to: true,
      internal: "slug",
      category: "text"
    },
    {
      name: "Reversed Text",
      format: "reverse",
      extension: "reverse.txt",
      mime: "text/x-reverse",
      from: false,
      to: true,
      internal: "reverse",
      category: "text"
    },
    {
      name: "Hex Dump",
      format: "hexdump",
      extension: "hexdump.txt",
      mime: "text/x-hexdump",
      from: false,
      to: true,
      internal: "hexdump",
      category: "data"
    },
    {
      name: "UPPERCASE",
      format: "uppercase",
      extension: "upper.txt",
      mime: "text/x-uppercase",
      from: false,
      to: true,
      internal: "uppercase",
      category: "text"
    },
    {
      name: "lowercase",
      format: "lowercase",
      extension: "lower.txt",
      mime: "text/x-lowercase",
      from: false,
      to: true,
      internal: "lowercase",
      category: "text"
    }
  ];

  async init() {
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return inputFiles.map(file => {
      const input = decoder.decode(file.bytes);
      const out = transform(input, outputFormat.internal);
      const base = file.name.replace(/\.[^.]+$/, "");
      return {
        bytes: encoder.encode(out),
        name: `${base}.${outputFormat.extension}`
      };
    });
  }
}

function transform(input: string, internal: string): string {
  switch (internal) {
    case "camelcase":     return toCamelCase(input);
    case "pascalcase":    return toPascalCase(input);
    case "snakecase":     return toSnakeCase(input);
    case "kebabcase":     return toKebabCase(input);
    case "constantcase":  return toSnakeCase(input).toUpperCase();
    case "titlecase":     return toTitleCase(input);
    case "sentencecase":  return toSentenceCase(input);
    case "slug":          return toSlug(input);
    case "reverse":       return reverseText(input);
    case "hexdump":       return hexDump(input);
    case "uppercase":     return input.toUpperCase();
    case "lowercase":     return input.toLowerCase();
    default:              return input;
  }
}

/** Split any text into word tokens, handling camelCase, snake_case, kebab-case, spaces, punctuation. */
function words(input: string): string[] {
  return input
    // insert space between lower/upper boundaries: "camelCase" → "camel Case"
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    // collapse sequences like "IDField" → "ID Field"
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function toCamelCase(input: string): string {
  const w = words(input);
  return w.map((word, i) =>
    i === 0
      ? word.toLowerCase()
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join("");
}

function toPascalCase(input: string): string {
  const w = words(input);
  return w.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join("");
}

function toSnakeCase(input: string): string {
  return words(input).map(w => w.toLowerCase()).join("_");
}

function toKebabCase(input: string): string {
  return words(input).map(w => w.toLowerCase()).join("-");
}

function toTitleCase(input: string): string {
  return input.replace(/\w\S*/g, txt =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

function toSentenceCase(input: string): string {
  const lower = input.toLowerCase();
  // Capitalize the first letter and any letter following [.!?] + whitespace.
  return lower.replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase());
}

function toSlug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function reverseText(input: string): string {
  // Split by code points so surrogate pairs (emoji) survive.
  return Array.from(input).reverse().join("");
}

function hexDump(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const chunk = bytes.subarray(offset, Math.min(offset + 16, bytes.length));
    const hexParts: string[] = [];
    for (let i = 0; i < 16; i++) {
      if (i === 8) hexParts.push("");
      hexParts.push(i < chunk.length ? chunk[i].toString(16).padStart(2, "0") : "  ");
    }
    const ascii = Array.from(chunk).map(b =>
      b >= 32 && b <= 126 ? String.fromCharCode(b) : "."
    ).join("");
    const offsetHex = offset.toString(16).padStart(8, "0");
    lines.push(`${offsetHex}  ${hexParts.join(" ")}  |${ascii}|`);
  }
  if (lines.length === 0) lines.push("00000000                ...               |..|");
  return lines.join("\n");
}

export default textCaseHandler;
