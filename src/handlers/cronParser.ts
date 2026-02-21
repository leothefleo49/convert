import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Cron Expression Parser handler.
 * Converts a cron expression into a human-readable description.
 */
class cronParserHandler implements FormatHandler {
  public name = "cronParser";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    {
      name: "Cron Expression",
      format: "cron",
      extension: "cron",
      mime: "text/x-cron",
      from: true,
      to: false,
      internal: "cron",
      category: "data",
      lossless: true
    },
    {
      name: "Human-Readable Cron",
      format: "cron-human",
      extension: "txt",
      mime: "text/plain",
      from: false,
      to: true,
      internal: "cron-human",
      category: "data",
      lossless: false
    }
  ];

  async init() {
    this.ready = true;
  }

  private parseCron(cron: string): string {
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5) {
      throw new Error("Invalid cron expression. Expected at least 5 parts.");
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const parsePart = (part: string, type: string) => {
      if (part === "*") return `every ${type}`;
      if (part.includes("/")) {
        const [base, step] = part.split("/");
        return `every ${step} ${type}s starting from ${base === "*" ? "0" : base}`;
      }
      if (part.includes("-")) {
        const [start, end] = part.split("-");
        return `every ${type} from ${start} through ${end}`;
      }
      if (part.includes(",")) {
        return `at ${type}s ${part.replace(/,/g, ", ")}`;
      }
      return `at ${type} ${part}`;
    };

    const minStr = parsePart(minute, "minute");
    const hrStr = parsePart(hour, "hour");
    const domStr = parsePart(dayOfMonth, "day of the month");
    const monStr = parsePart(month, "month");
    const dowStr = parsePart(dayOfWeek, "day of the week");

    return `This cron expression runs:\n- ${minStr}\n- ${hrStr}\n- ${domStr}\n- ${monStr}\n- ${dowStr}`;
  }

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    _outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => {
      const text = new TextDecoder().decode(file.bytes).trim();
      
      try {
        const result = this.parseCron(text);
        const baseName = file.name.replace(/\.[^.]+$/, "");
        return {
          name: `${baseName}_explained.txt`,
          bytes: new TextEncoder().encode(result)
        };
      } catch (e) {
        throw new Error("Failed to parse cron: " + (e instanceof Error ? e.message : String(e)));
      }
    });
  }
}

export default cronParserHandler;
