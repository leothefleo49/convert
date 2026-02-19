import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Text statistics handler.
 * Converts any text file to a JSON report containing:
 * word count, character count, line count, sentence count,
 * paragraph count, estimated reading time, unique words, and more.
 */
class textStatsHandler implements FormatHandler {
  public name = "textStats";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    {
      name: "Plain Text",
      format: "text",
      extension: "txt",
      mime: "text/plain",
      from: true,
      to: false,
      internal: "text",
      category: "data"
    },
    {
      name: "Markdown",
      format: "md",
      extension: "md",
      mime: "text/markdown",
      from: true,
      to: false,
      internal: "md",
      category: "data"
    },
    {
      name: "Text Statistics (JSON report)",
      format: "textstats",
      extension: "stats.json",
      mime: "application/json",
      from: false,
      to: true,
      internal: "textstats",
      category: "data"
    }
  ];

  async init() {
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    _outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => {
      const text = new TextDecoder().decode(file.bytes);

      // Strip markdown syntax for word counting if needed
      const plain = text
        .replace(/```[\s\S]*?```/g, " ")       // code blocks
        .replace(/`[^`]+`/g, " ")               // inline code
        .replace(/!\[.*?\]\(.*?\)/g, " ")       // images
        .replace(/\[.*?\]\(.*?\)/g, " ")        // links
        .replace(/^#+\s+/gm, "")               // headings
        .replace(/[*_~]{1,3}/g, "")            // bold/italic/strike
        .replace(/^\s*[-*+]\s+/gm, "")         // lists
        .replace(/^\s*>\s+/gm, "");            // blockquotes

      const lines = text.split(/\r?\n/);
      const words = plain.match(/\b\w+\b/g) ?? [];
      const sentences = plain.match(/[^.!?]+[.!?]+/g) ?? [];
      const paragraphs = text.split(/\r?\n\r?\n/).filter(p => p.trim().length > 0);

      const wordFreq: Record<string, number> = {};
      for (const w of words) {
        const key = w.toLowerCase();
        wordFreq[key] = (wordFreq[key] ?? 0) + 1;
      }

      const uniqueWords = Object.keys(wordFreq).length;
      const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ word, count }));

      const avgWordLen = words.length
        ? words.reduce((sum, w) => sum + w.length, 0) / words.length
        : 0;

      // ~200-250 wpm average adult reading speed
      const readingTimeSec = Math.ceil((words.length / 225) * 60);
      const speakingTimeSec = Math.ceil((words.length / 150) * 60);

      const stats = {
        file: file.name,
        characters: {
          total: text.length,
          noSpaces: text.replace(/\s/g, "").length
        },
        words: {
          total: words.length,
          unique: uniqueWords,
          averageLength: Math.round(avgWordLen * 10) / 10
        },
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        lines: {
          total: lines.length,
          nonEmpty: lines.filter(l => l.trim().length > 0).length
        },
        readingTime: {
          seconds: readingTimeSec,
          formatted: `${Math.floor(readingTimeSec / 60)}m ${readingTimeSec % 60}s`
        },
        speakingTime: {
          seconds: speakingTimeSec,
          formatted: `${Math.floor(speakingTimeSec / 60)}m ${speakingTimeSec % 60}s`
        },
        topWords
      };

      return {
        bytes: new TextEncoder().encode(JSON.stringify(stats, null, 2)),
        name: file.name.replace(/\.[^.]+$/, "") + ".stats.json"
      };
    });
  }
}

export default textStatsHandler;
