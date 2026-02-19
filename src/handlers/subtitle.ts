import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Handler for converting between subtitle formats: SRT, VTT, ASS/SSA, LRC, SBV.
 */
class subtitleHandler implements FormatHandler {
  public name = "subtitle";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    {
      name: "SubRip Subtitle",
      format: "srt",
      extension: "srt",
      mime: "application/x-subrip",
      from: true,
      to: true,
      internal: "srt",
      category: "text"
    },
    {
      name: "WebVTT Subtitle",
      format: "vtt",
      extension: "vtt",
      mime: "text/vtt",
      from: true,
      to: true,
      internal: "vtt",
      category: "text"
    },
    {
      name: "Advanced SubStation Alpha",
      format: "ass",
      extension: "ass",
      mime: "text/x-ssa",
      from: true,
      to: true,
      internal: "ass",
      category: "text"
    },
    {
      name: "SubViewer / YouTube Captions",
      format: "sbv",
      extension: "sbv",
      mime: "text/x-sbv",
      from: true,
      to: true,
      internal: "sbv",
      category: "text"
    },
    {
      name: "LRC Lyrics",
      format: "lrc",
      extension: "lrc",
      mime: "text/x-lrc",
      from: true,
      to: true,
      internal: "lrc",
      category: "text"
    },
    {
      name: "Plain Text (transcript)",
      format: "txt",
      extension: "txt",
      mime: "text/plain",
      from: false,
      to: true,
      internal: "txt",
      category: "text"
    },
  ];

  async init() {
    this.ready = true;
  }

  // --- Unified subtitle cue type ---
  private parseCues(text: string, format: string): { start: number; end: number; text: string }[] {
    switch (format) {
      case "srt": return this.parseSRT(text);
      case "vtt": return this.parseVTT(text);
      case "ass": return this.parseASS(text);
      case "sbv": return this.parseSBV(text);
      case "lrc": return this.parseLRC(text);
      default: return [];
    }
  }

  private parseSRT(text: string) {
    const cues: { start: number; end: number; text: string }[] = [];
    const blocks = text.trim().split(/\n\s*\n/);
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      if (lines.length < 2) continue;
      const timeMatch = lines.find(l => l.includes("-->"));
      if (!timeMatch) continue;
      const idx = lines.indexOf(timeMatch);
      const [startStr, endStr] = timeMatch.split("-->");
      const start = this.parseSRTTime(startStr.trim());
      const end = this.parseSRTTime(endStr.trim());
      const content = lines.slice(idx + 1).join("\n").trim();
      if (content) cues.push({ start, end, text: content });
    }
    return cues;
  }

  private parseVTT(text: string) {
    // Remove WEBVTT header
    const cleaned = text.replace(/^WEBVTT[^\n]*\n/, "").trim();
    const blocks = cleaned.split(/\n\s*\n/);
    const cues: { start: number; end: number; text: string }[] = [];
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      const timeMatch = lines.find(l => l.includes("-->"));
      if (!timeMatch) continue;
      const idx = lines.indexOf(timeMatch);
      const [startStr, endStr] = timeMatch.split("-->");
      const start = this.parseSRTTime(startStr.trim());
      const end = this.parseSRTTime(endStr.trim().split(" ")[0]); // remove position hints
      const content = lines.slice(idx + 1).join("\n").trim();
      if (content) cues.push({ start, end, text: content });
    }
    return cues;
  }

  private parseASS(text: string) {
    const cues: { start: number; end: number; text: string }[] = [];
    const lines = text.split("\n");
    for (const line of lines) {
      if (!line.startsWith("Dialogue:")) continue;
      const parts = line.substring(9).split(",");
      if (parts.length < 10) continue;
      const start = this.parseASSTime(parts[1].trim());
      const end = this.parseASSTime(parts[2].trim());
      const content = parts.slice(9).join(",").replace(/\{[^}]*\}/g, "").trim();
      if (content) cues.push({ start, end, text: content });
    }
    return cues;
  }

  private parseSBV(text: string) {
    const cues: { start: number; end: number; text: string }[] = [];
    const blocks = text.trim().split(/\n\s*\n/);
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      if (lines.length < 2) continue;
      const timeLine = lines[0];
      if (!timeLine.includes(",")) continue;
      const [startStr, endStr] = timeLine.split(",");
      const start = this.parseSRTTime(startStr.trim());
      const end = this.parseSRTTime(endStr.trim());
      const content = lines.slice(1).join("\n").trim();
      if (content) cues.push({ start, end, text: content });
    }
    return cues;
  }

  private parseLRC(text: string) {
    const cues: { start: number; end: number; text: string }[] = [];
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]\s*(.*)$/);
      if (!match) continue;
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = match[3] ? parseInt(match[3].padEnd(3, "0")) : 0;
      const start = min * 60 + sec + ms / 1000;
      const content = match[4].trim();
      if (!content) continue;
      // LRC doesn't have explicit end times; use next cue's start or +5s
      let end = start + 5;
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/);
        if (next) {
          end = parseInt(next[1]) * 60 + parseInt(next[2]) + (next[3] ? parseInt(next[3].padEnd(3, "0")) / 1000 : 0);
          break;
        }
      }
      cues.push({ start, end, text: content });
    }
    return cues;
  }

  // --- Time parsing helpers ---
  private parseSRTTime(str: string): number {
    // Handles both , and . as decimal separator
    // Format: HH:MM:SS,mmm or HH:MM:SS.mmm or MM:SS.mmm
    const cleaned = str.replace(",", ".");
    const parts = cleaned.split(":");
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(cleaned) || 0;
  }

  private parseASSTime(str: string): number {
    // Format: H:MM:SS.cc (centiseconds)
    const parts = str.split(":");
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    }
    return 0;
  }

  // --- Time formatting helpers ---
  private formatSRTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  }

  private formatVTTTime(seconds: number): string {
    return this.formatSRTTime(seconds).replace(",", ".");
  }

  private formatASSTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.round((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }

  private formatLRCTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.round((seconds % 1) * 100);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }

  // --- Serializers ---
  private toSRT(cues: { start: number; end: number; text: string }[]): string {
    return cues.map((c, i) =>
      `${i + 1}\n${this.formatSRTTime(c.start)} --> ${this.formatSRTTime(c.end)}\n${c.text}`
    ).join("\n\n") + "\n";
  }

  private toVTT(cues: { start: number; end: number; text: string }[]): string {
    const lines = ["WEBVTT", ""];
    for (const c of cues) {
      lines.push(`${this.formatVTTTime(c.start)} --> ${this.formatVTTTime(c.end)}`);
      lines.push(c.text);
      lines.push("");
    }
    return lines.join("\n");
  }

  private toASS(cues: { start: number; end: number; text: string }[]): string {
    const header = `[Script Info]
Title: Converted Subtitle
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,10,10,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    const dialogues = cues.map(c =>
      `Dialogue: 0,${this.formatASSTime(c.start)},${this.formatASSTime(c.end)},Default,,0,0,0,,${c.text.replace(/\n/g, "\\N")}`
    ).join("\n");
    return header + dialogues + "\n";
  }

  private toSBV(cues: { start: number; end: number; text: string }[]): string {
    return cues.map(c =>
      `${this.formatVTTTime(c.start)},${this.formatVTTTime(c.end)}\n${c.text}`
    ).join("\n\n") + "\n";
  }

  private toLRC(cues: { start: number; end: number; text: string }[]): string {
    return cues.map(c =>
      `[${this.formatLRCTime(c.start)}]${c.text.replace(/\n/g, " ")}`
    ).join("\n") + "\n";
  }

  private toTXT(cues: { start: number; end: number; text: string }[]): string {
    return cues.map(c => c.text).join("\n") + "\n";
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => {
      const text = new TextDecoder().decode(file.bytes);
      const cues = this.parseCues(text, inputFormat.internal);

      let output: string;
      switch (outputFormat.internal) {
        case "srt": output = this.toSRT(cues); break;
        case "vtt": output = this.toVTT(cues); break;
        case "ass": output = this.toASS(cues); break;
        case "sbv": output = this.toSBV(cues); break;
        case "lrc": output = this.toLRC(cues); break;
        case "txt": output = this.toTXT(cues); break;
        default: throw new Error("Unsupported output format: " + outputFormat.internal);
      }

      return {
        name: file.name.split(".")[0] + "." + outputFormat.extension,
        bytes: new TextEncoder().encode(output)
      };
    });
  }
}

export default subtitleHandler;
