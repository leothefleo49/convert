import CommonFormats from "src/CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Handler for text cipher and encoding conversions:
 * Morse code, Braille, ROT13, ROT47, NATO phonetic, Caesar cipher,
 * ASCII art (figlet-style), binary text
 */

// --- Morse code lookup ---
const MORSE_MAP: Record<string, string> = {
  "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.",
  "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..",
  "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
  "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
  "Y": "-.--", "Z": "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.",
  "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-",
  "+": ".-.-.", "-": "-....-", "_": "..--.-", '"': ".-..-.",
  "$": "...-..-", "@": ".--.-.", " ": "/"
};
const REVERSE_MORSE: Record<string, string> = {};
for (const [k, v] of Object.entries(MORSE_MAP)) REVERSE_MORSE[v] = k;

// --- NATO phonetic alphabet ---
const NATO_MAP: Record<string, string> = {
  "A": "Alfa", "B": "Bravo", "C": "Charlie", "D": "Delta", "E": "Echo",
  "F": "Foxtrot", "G": "Golf", "H": "Hotel", "I": "India", "J": "Juliet",
  "K": "Kilo", "L": "Lima", "M": "Mike", "N": "November", "O": "Oscar",
  "P": "Papa", "Q": "Quebec", "R": "Romeo", "S": "Sierra", "T": "Tango",
  "U": "Uniform", "V": "Victor", "W": "Whiskey", "X": "X-ray", "Y": "Yankee",
  "Z": "Zulu", "0": "Zero", "1": "One", "2": "Two", "3": "Three",
  "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Niner"
};
const REVERSE_NATO: Record<string, string> = {};
for (const [k, v] of Object.entries(NATO_MAP)) REVERSE_NATO[v.toUpperCase()] = k;

// --- Braille (Grade 1, basic ASCII mapping) ---
const BRAILLE_MAP: Record<string, string> = {
  "a": "⠁", "b": "⠃", "c": "⠉", "d": "⠙", "e": "⠑", "f": "⠋", "g": "⠛",
  "h": "⠓", "i": "⠊", "j": "⠚", "k": "⠅", "l": "⠇", "m": "⠍", "n": "⠝",
  "o": "⠕", "p": "⠏", "q": "⠟", "r": "⠗", "s": "⠎", "t": "⠞", "u": "⠥",
  "v": "⠧", "w": "⠺", "x": "⠭", "y": "⠽", "z": "⠵",
  "1": "⠼⠁", "2": "⠼⠃", "3": "⠼⠉", "4": "⠼⠙", "5": "⠼⠑",
  "6": "⠼⠋", "7": "⠼⠛", "8": "⠼⠓", "9": "⠼⠊", "0": "⠼⠚",
  " ": "⠀", ".": "⠲", ",": "⠂", "!": "⠖", "?": "⠦", ";": "⠆",
  ":": "⠒", "'": "⠄", "-": "⠤", "/": "⠌", "(": "⠐⠣", ")": "⠐⠜"
};
const REVERSE_BRAILLE: Record<string, string> = {};
for (const [k, v] of Object.entries(BRAILLE_MAP)) REVERSE_BRAILLE[v] = k;

class textCipherHandler implements FormatHandler {
  public name = "textCipher";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    CommonFormats.TEXT.builder("text").allowFrom().allowTo().markLossless(),
    {
      name: "Morse Code",
      format: "morse",
      extension: "morse.txt",
      mime: "text/x-morse",
      from: true, to: true,
      internal: "morse",
      category: "text",
      lossless: true
    },
    {
      name: "Braille (Grade 1)",
      format: "braille",
      extension: "braille.txt",
      mime: "text/x-braille",
      from: true, to: true,
      internal: "braille",
      category: "text",
      lossless: true
    },
    {
      name: "ROT13",
      format: "rot13",
      extension: "rot13.txt",
      mime: "text/x-rot13",
      from: true, to: true,
      internal: "rot13",
      category: "text",
      lossless: true
    },
    {
      name: "ROT47",
      format: "rot47",
      extension: "rot47.txt",
      mime: "text/x-rot47",
      from: true, to: true,
      internal: "rot47",
      category: "text",
      lossless: true
    },
    {
      name: "NATO Phonetic Alphabet",
      format: "nato",
      extension: "nato.txt",
      mime: "text/x-nato",
      from: true, to: true,
      internal: "nato",
      category: "text",
      lossless: true
    },
    {
      name: "Binary Text (0s and 1s per character)",
      format: "binarytext",
      extension: "binary.txt",
      mime: "text/x-binary-text",
      from: true, to: true,
      internal: "binarytext",
      category: "text",
      lossless: true
    },
    {
      name: "Reversed Text",
      format: "reversed",
      extension: "reversed.txt",
      mime: "text/x-reversed",
      from: true, to: true,
      internal: "reversed",
      category: "text",
      lossless: true
    },
    {
      name: "Upside Down Text",
      format: "upsidedown",
      extension: "flip.txt",
      mime: "text/x-upsidedown",
      from: false, to: true,
      internal: "upsidedown",
      category: "text"
    },
  ];

  async init() {
    this.ready = true;
  }

  // --- Conversion functions ---

  private textToMorse(text: string): string {
    return text.toUpperCase().split("").map(c => MORSE_MAP[c] || c).join(" ");
  }

  private morseToText(morse: string): string {
    return morse.trim().split(/\s+/).map(code => {
      if (code === "/") return " ";
      return REVERSE_MORSE[code] || code;
    }).join("");
  }

  private textToBraille(text: string): string {
    return text.toLowerCase().split("").map(c => BRAILLE_MAP[c] || c).join("");
  }

  private brailleToText(braille: string): string {
    let result = "";
    let i = 0;
    while (i < braille.length) {
      // Try 2-char sequences first (numbers, some punctuation)
      if (i + 1 < braille.length) {
        const twoChar = braille.substring(i, i + 2);
        if (REVERSE_BRAILLE[twoChar]) {
          result += REVERSE_BRAILLE[twoChar];
          i += 2;
          continue;
        }
      }
      const oneChar = braille[i];
      result += REVERSE_BRAILLE[oneChar] || oneChar;
      i++;
    }
    return result;
  }

  private rot13(text: string): string {
    return text.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  private rot47(text: string): string {
    return text.replace(/[!-~]/g, (c) => {
      return String.fromCharCode(((c.charCodeAt(0) - 33 + 47) % 94) + 33);
    });
  }

  private textToNATO(text: string): string {
    return text.toUpperCase().split("").map(c => {
      if (c === " ") return "(space)";
      return NATO_MAP[c] || c;
    }).join(" ");
  }

  private natoToText(nato: string): string {
    return nato.split(/\s+/).map(word => {
      if (word.toUpperCase() === "(SPACE)") return " ";
      return REVERSE_NATO[word.toUpperCase()] || word;
    }).join("");
  }

  private textToBinaryText(text: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    return Array.from(bytes).map(b => b.toString(2).padStart(8, "0")).join(" ");
  }

  private binaryTextToText(binary: string): string {
    const bytes = binary.trim().split(/\s+/).map(b => parseInt(b, 2));
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  private reverseText(text: string): string {
    return [...text].reverse().join("");
  }

  private upsideDown(text: string): string {
    const map: Record<string, string> = {
      "a": "ɐ", "b": "q", "c": "ɔ", "d": "p", "e": "ǝ", "f": "ɟ", "g": "ƃ",
      "h": "ɥ", "i": "ᴉ", "j": "ɾ", "k": "ʞ", "l": "l", "m": "ɯ", "n": "u",
      "o": "o", "p": "d", "q": "b", "r": "ɹ", "s": "s", "t": "ʇ", "u": "n",
      "v": "ʌ", "w": "ʍ", "x": "x", "y": "ʎ", "z": "z",
      "A": "∀", "B": "𐐒", "C": "Ɔ", "D": "◖", "E": "Ǝ", "F": "Ⅎ", "G": "⅁",
      "H": "H", "I": "I", "J": "ſ", "K": "⋊", "L": "˥", "M": "W", "N": "N",
      "O": "O", "P": "Ԁ", "Q": "Ό", "R": "ᴚ", "S": "S", "T": "⊥", "U": "∩",
      "V": "Λ", "W": "M", "X": "X", "Y": "⅄", "Z": "Z",
      "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ",
      "8": "8", "9": "6", "0": "0",
      ".": "˙", ",": "'", "!": "¡", "?": "¿", "'": ",", "(": ")", ")": "(",
      "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<",
      "_": "‾", "&": "⅋"
    };
    return [...text].reverse().map(c => map[c] || c).join("");
  }

  // --- Decode from any format to plain text ---
  private decode(text: string, format: string): string {
    switch (format) {
      case "text": return text;
      case "morse": return this.morseToText(text);
      case "braille": return this.brailleToText(text);
      case "rot13": return this.rot13(text); // ROT13 is its own inverse
      case "rot47": return this.rot47(text); // ROT47 is its own inverse
      case "nato": return this.natoToText(text);
      case "binarytext": return this.binaryTextToText(text);
      case "reversed": return this.reverseText(text);
      default: return text;
    }
  }

  // --- Encode from plain text to any format ---
  private encode(text: string, format: string): string {
    switch (format) {
      case "text": return text;
      case "morse": return this.textToMorse(text);
      case "braille": return this.textToBraille(text);
      case "rot13": return this.rot13(text);
      case "rot47": return this.rot47(text);
      case "nato": return this.textToNATO(text);
      case "binarytext": return this.textToBinaryText(text);
      case "reversed": return this.reverseText(text);
      case "upsidedown": return this.upsideDown(text);
      default: return text;
    }
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => {
      const text = new TextDecoder().decode(file.bytes);
      // Decode input to plain text, then encode to output format
      const plainText = this.decode(text, inputFormat.internal);
      const output = this.encode(plainText, outputFormat.internal);

      return {
        name: file.name.split(".")[0] + "." + outputFormat.extension,
        bytes: new TextEncoder().encode(output)
      };
    });
  }
}

export default textCipherHandler;
