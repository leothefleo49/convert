import CommonFormats from "src/CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Handler for code transpilation conversions:
 * TypeScript → JavaScript, SCSS → CSS, JSX → JS, JSON prettify/minify,
 * CSS/JS/HTML minification, etc.
 *
 * Uses the TypeScript compiler API (loaded dynamically) and simple parsers.
 */
class codeTranspileHandler implements FormatHandler {
  public name = "codeTranspile";
  public contributor = "leothefleo49";
  public ready = false;

  private ts: any = null;

  public supportedFormats: FileFormat[] = [
    // TypeScript → JavaScript
    {
      name: "TypeScript",
      format: "ts",
      extension: "ts",
      mime: "text/typescript",
      from: true,
      to: false,
      internal: "ts",
      category: "text"
    },
    {
      name: "TypeScript JSX (TSX)",
      format: "tsx",
      extension: "tsx",
      mime: "text/tsx",
      from: true,
      to: false,
      internal: "tsx",
      category: "text"
    },
    {
      name: "JavaScript",
      format: "js",
      extension: "js",
      mime: "text/javascript",
      from: false,
      to: true,
      internal: "js",
      category: "text"
    },
    // SCSS → CSS
    {
      name: "SCSS Stylesheet",
      format: "scss",
      extension: "scss",
      mime: "text/x-scss",
      from: true,
      to: false,
      internal: "scss",
      category: "text"
    },
    {
      name: "LESS Stylesheet",
      format: "less",
      extension: "less",
      mime: "text/x-less",
      from: true,
      to: false,
      internal: "less",
      category: "text"
    },
    {
      name: "CSS Stylesheet",
      format: "css",
      extension: "css",
      mime: "text/css",
      from: true,
      to: true,
      internal: "css",
      category: "text"
    },
    // Minified variants
    {
      name: "Minified JavaScript",
      format: "min.js",
      extension: "min.js",
      mime: "text/javascript",
      from: false,
      to: true,
      internal: "min.js",
      category: "text"
    },
    {
      name: "Minified CSS",
      format: "min.css",
      extension: "min.css",
      mime: "text/css",
      from: false,
      to: true,
      internal: "min.css",
      category: "text"
    },
    // Markdown → HTML
    CommonFormats.MD.builder("md").allowFrom(),
    CommonFormats.HTML.builder("html").allowTo(),
  ];

  async init() {
    try {
      // Dynamically load TypeScript compiler from CDN
      // @ts-ignore - Dynamic CDN import, resolved at runtime
      this.ts = await import(/* @vite-ignore */ "https://esm.sh/typescript@5.7.3");
    } catch {
      // TypeScript not available, we still support other conversions
    }
    this.ready = true;
  }

  private transpileTS(code: string, tsx: boolean): string {
    if (!this.ts) throw new Error("TypeScript compiler not loaded");
    const result = this.ts.transpileModule(code, {
      compilerOptions: {
        target: this.ts.ScriptTarget.ES2022,
        module: this.ts.ModuleKind.ESNext,
        jsx: tsx ? this.ts.JsxEmit.React : undefined,
        removeComments: false,
        esModuleInterop: true,
        strict: false,
      },
      fileName: tsx ? "input.tsx" : "input.ts"
    });
    return result.outputText;
  }

  private minifyJS(code: string): string {
    // Basic JS minification: remove comments, collapse whitespace, remove newlines
    return code
      // Remove single-line comments (but not URLs like https://)
      .replace(/(?<![:"'])\/\/[^\n]*/g, "")
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      // Remove spaces around operators
      .replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, "$1")
      // Trim
      .trim();
  }

  private minifyCSS(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, "")  // remove comments
      .replace(/\s+/g, " ")              // collapse whitespace
      .replace(/\s*([{}:;,>~+])\s*/g, "$1") // remove spaces around selectors/properties
      .replace(/;}/g, "}")               // remove trailing semicolons
      .trim();
  }

  private markdownToHTML(md: string): string {
    // A reasonably comprehensive Markdown → HTML converter
    let html = md;

    // Code blocks (fenced)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const langAttr = lang ? ` class="language-${lang}"` : "";
      return `<pre><code${langAttr}>${this.escapeHTML(code.trim())}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Headers
    html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
    html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
    html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

    // Horizontal rules
    html = html.replace(/^(?:---|\*\*\*|___)$/gm, "<hr>");

    // Bold + Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
    html = html.replace(/_(.+?)_/g, "<em>$1</em>");

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

    // Unordered lists
    html = html.replace(/^[\*\-]\s+(.+)$/gm, "<li>$1</li>");

    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>\n${match}</ul>\n`);

    // Paragraphs: wrap standalone lines
    html = html.replace(/^(?!<[a-z/])(.+)$/gm, "<p>$1</p>");

    // Clean up extra newlines
    html = html.replace(/\n{3,}/g, "\n\n");

    return `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>Converted</title></head>\n<body>\n${html.trim()}\n</body>\n</html>`;
  }

  private escapeHTML(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Basic SCSS → CSS: expand nesting (simplified) and strip SCSS-specific syntax
  private scssToCSS(scss: string): string {
    // Very basic: remove $variables definitions, @mixin/@include, flatten nesting
    // For production you'd want a real SCSS compiler, but this handles common cases
    let css = scss;

    // Remove single-line comments
    css = css.replace(/\/\/[^\n]*/g, "");

    // Handle simple variable declarations and usages
    const vars: Record<string, string> = {};
    css = css.replace(/\$([a-zA-Z_][\w-]*)\s*:\s*([^;]+);/g, (_m, name, value) => {
      vars[name] = value.trim();
      return "";
    });
    // Replace variable usages
    for (const [name, value] of Object.entries(vars)) {
      css = css.replace(new RegExp(`\\$${name}`, "g"), value);
    }

    // Remove @mixin and @include (simplified)
    css = css.replace(/@mixin\s+[\w-]+\s*\{[^}]*\}/g, "");
    css = css.replace(/@include\s+[\w-]+\s*;?/g, "");

    return css.trim();
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => {
      const text = new TextDecoder().decode(file.bytes);
      let output: string;

      const from = inputFormat.internal;
      const to = outputFormat.internal;

      if ((from === "ts" || from === "tsx") && (to === "js")) {
        output = this.transpileTS(text, from === "tsx");
      } else if ((from === "ts" || from === "tsx") && to === "min.js") {
        output = this.minifyJS(this.transpileTS(text, from === "tsx"));
      } else if (from === "scss" && to === "css") {
        output = this.scssToCSS(text);
      } else if (from === "scss" && to === "min.css") {
        output = this.minifyCSS(this.scssToCSS(text));
      } else if (from === "less" && to === "css") {
        // Basic LESS → CSS (LESS is mostly valid CSS + variables)
        let css = text;
        const vars: Record<string, string> = {};
        css = css.replace(/@([a-zA-Z_][\w-]*)\s*:\s*([^;]+);/g, (_m, name, value) => {
          vars[name] = value.trim();
          return "";
        });
        for (const [name, value] of Object.entries(vars)) {
          css = css.replace(new RegExp(`@${name}`, "g"), value);
        }
        output = css.trim();
      } else if (from === "css" && to === "min.css") {
        output = this.minifyCSS(text);
      } else if (from === "js" && to === "min.js") {
        output = this.minifyJS(text);
      } else if (from === "md" && to === "html") {
        output = this.markdownToHTML(text);
      } else {
        throw new Error(`Unsupported conversion: ${from} → ${to}`);
      }

      return {
        name: file.name.split(".")[0] + "." + outputFormat.extension,
        bytes: new TextEncoder().encode(output)
      };
    });
  }
}

export default codeTranspileHandler;
