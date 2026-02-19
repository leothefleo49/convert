import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Math notation conversion handler.
 * Converts between LaTeX math, AsciiMath, MathML, and plain Unicode math.
 */

function mkFmt(name: string, format: string, ext: string): FileFormat {
  return {
    name, format, extension: ext,
    mime: "text/plain",
    from: true, to: true,
    internal: format,
    category: "text"
  };
}

// --- LaTeX to Unicode mapping ---
const LATEX_TO_UNICODE: Record<string, string> = {
  "\\alpha": "\u03B1", "\\beta": "\u03B2", "\\gamma": "\u03B3", "\\delta": "\u03B4",
  "\\epsilon": "\u03B5", "\\zeta": "\u03B6", "\\eta": "\u03B7", "\\theta": "\u03B8",
  "\\iota": "\u03B9", "\\kappa": "\u03BA", "\\lambda": "\u03BB", "\\mu": "\u03BC",
  "\\nu": "\u03BD", "\\xi": "\u03BE", "\\pi": "\u03C0", "\\rho": "\u03C1",
  "\\sigma": "\u03C3", "\\tau": "\u03C4", "\\upsilon": "\u03C5", "\\phi": "\u03C6",
  "\\chi": "\u03C7", "\\psi": "\u03C8", "\\omega": "\u03C9",
  "\\Gamma": "\u0393", "\\Delta": "\u0394", "\\Theta": "\u0398",
  "\\Lambda": "\u039B", "\\Xi": "\u039E", "\\Pi": "\u03A0",
  "\\Sigma": "\u03A3", "\\Phi": "\u03A6", "\\Psi": "\u03A8", "\\Omega": "\u03A9",
  "\\infty": "\u221E", "\\pm": "\u00B1", "\\mp": "\u2213",
  "\\times": "\u00D7", "\\div": "\u00F7", "\\cdot": "\u00B7",
  "\\leq": "\u2264", "\\geq": "\u2265", "\\neq": "\u2260",
  "\\approx": "\u2248", "\\equiv": "\u2261", "\\sim": "\u223C",
  "\\subset": "\u2282", "\\supset": "\u2283", "\\subseteq": "\u2286", "\\supseteq": "\u2287",
  "\\in": "\u2208", "\\notin": "\u2209", "\\cup": "\u222A", "\\cap": "\u2229",
  "\\emptyset": "\u2205", "\\forall": "\u2200", "\\exists": "\u2203",
  "\\neg": "\u00AC", "\\land": "\u2227", "\\lor": "\u2228",
  "\\rightarrow": "\u2192", "\\leftarrow": "\u2190",
  "\\Rightarrow": "\u21D2", "\\Leftarrow": "\u21D0",
  "\\leftrightarrow": "\u2194", "\\Leftrightarrow": "\u21D4",
  "\\partial": "\u2202", "\\nabla": "\u2207",
  "\\sum": "\u2211", "\\prod": "\u220F", "\\int": "\u222B",
  "\\sqrt": "\u221A", "\\angle": "\u2220", "\\perp": "\u22A5",
  "\\parallel": "\u2225", "\\triangle": "\u25B3",
  "\\star": "\u22C6", "\\circ": "\u2218", "\\bullet": "\u2022",
  "\\dots": "\u2026", "\\cdots": "\u22EF", "\\vdots": "\u22EE", "\\ddots": "\u22F1",
  "\\lfloor": "\u230A", "\\rfloor": "\u230B", "\\lceil": "\u2308", "\\rceil": "\u2309",
  "\\langle": "\u27E8", "\\rangle": "\u27E9",
  "\\oplus": "\u2295", "\\otimes": "\u2297",
  "\\ell": "\u2113", "\\hbar": "\u210F", "\\Re": "\u211C", "\\Im": "\u2111",
  "\\aleph": "\u2135",
};

// Unicode superscript digits
const SUPERSCRIPTS: Record<string, string> = {
  "0": "\u2070", "1": "\u00B9", "2": "\u00B2", "3": "\u00B3",
  "4": "\u2074", "5": "\u2075", "6": "\u2076", "7": "\u2077",
  "8": "\u2078", "9": "\u2079", "+": "\u207A", "-": "\u207B",
  "n": "\u207F", "i": "\u2071",
};
const SUBSCRIPTS: Record<string, string> = {
  "0": "\u2080", "1": "\u2081", "2": "\u2082", "3": "\u2083",
  "4": "\u2084", "5": "\u2085", "6": "\u2086", "7": "\u2087",
  "8": "\u2088", "9": "\u2089", "+": "\u208A", "-": "\u208B",
};

// --- Conversion functions ---

function latexToUnicode(latex: string): string {
  let result = latex;

  // Replace known commands
  const sortedKeys = Object.keys(LATEX_TO_UNICODE).sort((a, b) => b.length - a.length);
  for (const cmd of sortedKeys) {
    result = result.split(cmd).join(LATEX_TO_UNICODE[cmd]);
  }

  // Handle superscripts: ^{abc} or ^a
  result = result.replace(/\^{([^}]*)}/g, (_, content) =>
    [...content].map((c: string) => SUPERSCRIPTS[c] || c).join("")
  );
  result = result.replace(/\^([0-9a-z])/gi, (_, c) => SUPERSCRIPTS[c] || `^${c}`);

  // Handle subscripts: _{abc} or _a
  result = result.replace(/_{([^}]*)}/g, (_, content) =>
    [...content].map((c: string) => SUBSCRIPTS[c] || c).join("")
  );
  result = result.replace(/_([0-9])/g, (_, c) => SUBSCRIPTS[c] || `_${c}`);

  // Clean up braces and \frac
  result = result.replace(/\\frac{([^}]*)}{([^}]*)}/g, "($1)/($2)");
  result = result.replace(/[{}]/g, "");
  result = result.replace(/\\\s/g, " ");
  result = result.replace(/\\\\/g, "\n");

  return result.trim();
}

function latexToAsciiMath(latex: string): string {
  let result = latex;

  // Greek letters: \alpha -> alpha
  result = result.replace(/\\([a-zA-Z]+)/g, (_, name) => {
    if (LATEX_TO_UNICODE[`\\${name}`]) return name;
    if (name === "frac") return name; // handled below
    return name;
  });

  // \frac{a}{b} -> (a)/(b)
  result = result.replace(/frac{([^}]*)}{([^}]*)}/g, "($1)/($2)");

  // \sqrt{x} -> sqrt(x)
  result = result.replace(/sqrt{([^}]*)}/g, "sqrt($1)");

  // Braces to parens
  result = result.replace(/{/g, "(").replace(/}/g, ")");

  // Operators
  result = result.replace(/\\cdot/g, "*").replace(/\\times/g, "xx").replace(/\\div/g, "-:");
  result = result.replace(/\\leq/g, "<=").replace(/\\geq/g, ">=").replace(/\\neq/g, "!=");
  result = result.replace(/\\pm/g, "+-");
  result = result.replace(/\\sum/g, "sum").replace(/\\prod/g, "prod").replace(/\\int/g, "int");
  result = result.replace(/\\infty/g, "oo");

  // Clean
  result = result.replace(/\\\s/g, " ").replace(/\\\\/g, "\n");

  return result.trim();
}

function latexToMathML(latex: string): string {
  // Basic LaTeX -> MathML conversion
  let content = latex.trim();

  // Wrap in <math>
  let ml = "<math xmlns=\"http://www.w3.org/1998/Math/MathML\">\n";

  // Simple token-based approach
  const tokens = tokenizeLatex(content);
  ml += tokensToMathML(tokens);

  ml += "\n</math>";
  return ml;
}

function tokenizeLatex(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    if (input[i] === "\\") {
      let cmd = "\\";
      i++;
      while (i < input.length && /[a-zA-Z]/.test(input[i])) {
        cmd += input[i++];
      }
      tokens.push(cmd);
    } else if (input[i] === "{" || input[i] === "}" || input[i] === "^" || input[i] === "_") {
      tokens.push(input[i++]);
    } else if (/\s/.test(input[i])) {
      i++;
    } else {
      tokens.push(input[i++]);
    }
  }
  return tokens;
}

function tokensToMathML(tokens: string[]): string {
  let ml = "  <mrow>\n";
  let i = 0;

  while (i < tokens.length) {
    const t = tokens[i];

    if (t === "^") {
      // Superscript: wrap previous element
      i++;
      const sup = getNextGroup(tokens, i);
      ml += `    <msup><mo></mo><mn>${sup.text}</mn></msup>\n`;
      i = sup.nextIndex;
    } else if (t === "_") {
      i++;
      const sub = getNextGroup(tokens, i);
      ml += `    <msub><mo></mo><mn>${sub.text}</mn></msub>\n`;
      i = sub.nextIndex;
    } else if (t.startsWith("\\")) {
      const name = t.slice(1);
      if (LATEX_TO_UNICODE[t]) {
        ml += `    <mo>${LATEX_TO_UNICODE[t]}</mo>\n`;
      } else if (name === "frac") {
        i++;
        const num = getNextGroup(tokens, i);
        i = num.nextIndex;
        const den = getNextGroup(tokens, i);
        i = den.nextIndex;
        ml += `    <mfrac><mrow><mn>${num.text}</mn></mrow><mrow><mn>${den.text}</mn></mrow></mfrac>\n`;
        continue;
      } else if (name === "sqrt") {
        i++;
        const body = getNextGroup(tokens, i);
        i = body.nextIndex;
        ml += `    <msqrt><mn>${body.text}</mn></msqrt>\n`;
        continue;
      } else {
        ml += `    <mi>${name}</mi>\n`;
      }
      i++;
    } else if (/[0-9.]/.test(t)) {
      ml += `    <mn>${t}</mn>\n`;
      i++;
    } else if (/[a-zA-Z]/.test(t)) {
      ml += `    <mi>${t}</mi>\n`;
      i++;
    } else if (t === "{" || t === "}") {
      i++;
    } else {
      ml += `    <mo>${t}</mo>\n`;
      i++;
    }
  }

  ml += "  </mrow>";
  return ml;
}

function getNextGroup(tokens: string[], i: number): { text: string; nextIndex: number } {
  if (i >= tokens.length) return { text: "", nextIndex: i };
  if (tokens[i] === "{") {
    let depth = 1;
    let text = "";
    i++;
    while (i < tokens.length && depth > 0) {
      if (tokens[i] === "{") depth++;
      else if (tokens[i] === "}") { depth--; if (depth === 0) { i++; break; } }
      text += tokens[i];
      i++;
    }
    return { text, nextIndex: i };
  }
  return { text: tokens[i], nextIndex: i + 1 };
}

function unicodeToLatex(text: string): string {
  let result = text;
  // Reverse map
  const unicodeToCmd: Record<string, string> = {};
  for (const [cmd, uni] of Object.entries(LATEX_TO_UNICODE)) {
    unicodeToCmd[uni] = cmd;
  }
  // Sort by length descending to match longer sequences first
  const sortedUni = Object.keys(unicodeToCmd).sort((a, b) => b.length - a.length);
  for (const uni of sortedUni) {
    result = result.split(uni).join(unicodeToCmd[uni] + " ");
  }

  // Reverse superscripts
  const supReverse: Record<string, string> = {};
  for (const [k, v] of Object.entries(SUPERSCRIPTS)) supReverse[v] = k;
  for (const [uni, char] of Object.entries(supReverse)) {
    result = result.split(uni).join(`^{${char}}`);
  }

  // Reverse subscripts
  const subReverse: Record<string, string> = {};
  for (const [k, v] of Object.entries(SUBSCRIPTS)) subReverse[v] = k;
  for (const [uni, char] of Object.entries(subReverse)) {
    result = result.split(uni).join(`_{${char}}`);
  }

  return result.trim();
}

class mathNotationHandler implements FormatHandler {
  public name = "mathNotation";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    mkFmt("LaTeX Math", "latex-math", "tex"),
    mkFmt("AsciiMath", "asciimath", "txt"),
    mkFmt("MathML", "mathml", "xml"),
    mkFmt("Unicode Math", "unicode-math", "txt"),
  ];

  async init() {}

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const text = new TextDecoder().decode(inputFile.bytes);
      const baseName = inputFile.name.split(".")[0];
      let result = "";

      // First convert to LaTeX as intermediate
      let latex = text;
      if (inputFormat.internal === "unicode-math") {
        latex = unicodeToLatex(text);
      } else if (inputFormat.internal === "asciimath") {
        // Basic AsciiMath to LaTeX
        latex = text
          .replace(/sqrt\(([^)]*)\)/g, "\\sqrt{$1}")
          .replace(/oo/g, "\\infty")
          .replace(/\*\*/g, "^")
          .replace(/xx/g, "\\times")
          .replace(/-:/g, "\\div")
          .replace(/<=/g, "\\leq")
          .replace(/>=/g, "\\geq")
          .replace(/!=/g, "\\neq")
          .replace(/\+-/g, "\\pm");
      } else if (inputFormat.internal === "mathml") {
        // Basic MathML -> LaTeX (strip tags, extract content)
        latex = text
          .replace(/<math[^>]*>/g, "").replace(/<\/math>/g, "")
          .replace(/<mrow>/g, "").replace(/<\/mrow>/g, "")
          .replace(/<mn>([^<]*)<\/mn>/g, "$1")
          .replace(/<mi>([^<]*)<\/mi>/g, "$1")
          .replace(/<mo>([^<]*)<\/mo>/g, " $1 ")
          .replace(/<mfrac><mrow>([^<]*)<\/mrow><mrow>([^<]*)<\/mrow><\/mfrac>/g, "\\frac{$1}{$2}")
          .replace(/<msqrt>([^<]*)<\/msqrt>/g, "\\sqrt{$1}")
          .replace(/<msup><mo><\/mo><mn>([^<]*)<\/mn><\/msup>/g, "^{$1}")
          .replace(/<msub><mo><\/mo><mn>([^<]*)<\/mn><\/msub>/g, "_{$1}")
          .replace(/<[^>]+>/g, "")
          .trim();
      }

      // Then convert LaTeX to target
      switch (outputFormat.internal) {
        case "latex-math":
          result = latex;
          break;
        case "unicode-math":
          result = latexToUnicode(latex);
          break;
        case "asciimath":
          result = latexToAsciiMath(latex);
          break;
        case "mathml":
          result = latexToMathML(latex);
          break;
      }

      outputFiles.push({
        name: baseName + "." + outputFormat.extension,
        bytes: new TextEncoder().encode(result)
      });
    }

    return outputFiles;
  }
}

export default mathNotationHandler;
