import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Date & Time conversion handler.
 *
 * Converts any recognisable date/timestamp text between common formats:
 *   • Unix timestamp (seconds)
 *   • Unix timestamp (milliseconds)
 *   • ISO 8601 UTC  (2024-06-01T12:00:00.000Z)
 *   • ISO 8601 local (2024-06-01T14:00:00+02:00)
 *   • RFC 2822  (Sat, 01 Jun 2024 12:00:00 +0000)
 *   • HTTP date / RFC 7231  (Sat, 01 Jun 2024 12:00:00 GMT)
 *   • Human-readable (Saturday, June 1, 2024 at 12:00:00 PM UTC)
 *
 * Input: a plain-text file whose entire trimmed content is one of:
 *   - A raw integer (Unix seconds or milliseconds, auto-detected)
 *   - Any string parseable by the ECMAScript Date constructor
 */
class dateTimeHandler implements FormatHandler {
  public name = "dateTime";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    {
      name: "Date / Timestamp (text)",
      format: "datetime-text",
      extension: "datetime.txt",
      mime: "text/x-datetime",
      from: true,
      to: false,
      internal: "datetime-text",
      category: "data",
      lossless: true
    },
    {
      name: "Unix Timestamp (seconds)",
      format: "unix-s",
      extension: "unix.txt",
      mime: "text/x-unix-timestamp",
      from: true,
      to: true,
      internal: "unix-s",
      category: "data",
      lossless: true
    },
    {
      name: "Unix Timestamp (milliseconds)",
      format: "unix-ms",
      extension: "unixms.txt",
      mime: "text/x-unix-timestamp-ms",
      from: true,
      to: true,
      internal: "unix-ms",
      category: "data",
      lossless: true
    },
    {
      name: "ISO 8601 (UTC)",
      format: "iso8601-utc",
      extension: "iso8601.txt",
      mime: "text/x-iso8601",
      from: true,
      to: true,
      internal: "iso8601-utc",
      category: "data",
      lossless: true
    },
    {
      name: "ISO 8601 (local timezone)",
      format: "iso8601-local",
      extension: "iso8601local.txt",
      mime: "text/x-iso8601-local",
      from: true,
      to: true,
      internal: "iso8601-local",
      category: "data",
      lossless: true
    },
    {
      name: "RFC 2822 / Email Date",
      format: "rfc2822",
      extension: "rfc2822.txt",
      mime: "text/x-rfc2822",
      from: true,
      to: true,
      internal: "rfc2822",
      category: "data",
      lossless: true
    },
    {
      name: "HTTP Date (RFC 7231)",
      format: "httpdate",
      extension: "httpdate.txt",
      mime: "text/x-httpdate",
      from: true,
      to: true,
      internal: "httpdate",
      category: "data",
      lossless: true
    },
    {
      name: "Human-Readable Date",
      format: "human-date",
      extension: "human.txt",
      mime: "text/x-human-date",
      from: false,
      to: true,
      internal: "human-date",
      category: "data",
      lossless: false
    }
  ];

  async init() {
    this.ready = true;
  }

  /** Parse the input text to a Date object. Throws on failure. */
  private parse(raw: string): Date {
    const trimmed = raw.trim();

    // Pure integer → Unix timestamp
    if (/^-?\d+$/.test(trimmed)) {
      const n = parseInt(trimmed, 10);
      // Heuristic: if the absolute value is > 1e10 treat as milliseconds
      const ms = Math.abs(n) > 1e10 ? n : n * 1000;
      return new Date(ms);
    }

    // ISO 8601 or RFC 2822 or any JS-parseable string
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) {
      throw new Error(`Cannot parse date: "${trimmed}"`);
    }
    return d;
  }

  /** Format a Date to the requested output internal format. */
  private format(d: Date, fmt: string): string {
    switch (fmt) {
      case "unix-s":
        return String(Math.floor(d.getTime() / 1000));

      case "unix-ms":
        return String(d.getTime());

      case "iso8601-utc":
        return d.toISOString();

      case "iso8601-local": {
        // Manual local ISO string with offset
        const pad = (n: number, w = 2) => String(n).padStart(w, "0");
        const off = -d.getTimezoneOffset();
        const sign = off >= 0 ? "+" : "-";
        const absOff = Math.abs(off);
        const hh = pad(Math.floor(absOff / 60));
        const mm = pad(absOff % 60);
        return (
          d.getFullYear() + "-" +
          pad(d.getMonth() + 1) + "-" +
          pad(d.getDate()) + "T" +
          pad(d.getHours()) + ":" +
          pad(d.getMinutes()) + ":" +
          pad(d.getSeconds()) + "." +
          pad(d.getMilliseconds(), 3) +
          sign + hh + ":" + mm
        );
      }

      case "rfc2822":
        // toUTCString gives "Sat, 01 Jun 2024 12:00:00 GMT"
        // Replace "GMT" with "+0000" for strict RFC 2822
        return d.toUTCString().replace("GMT", "+0000");

      case "httpdate":
        return d.toUTCString();

      case "human-date":
        return d.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
          hour12: true
        });

      default:
        return d.toISOString();
    }
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => {
      const text = new TextDecoder().decode(file.bytes).trim();
      let date: Date;

      // If input is already unix-ms, parse directly
      if (inputFormat.internal === "unix-ms") {
        date = new Date(parseInt(text, 10));
      } else if (inputFormat.internal === "unix-s") {
        date = new Date(parseInt(text, 10) * 1000);
      } else {
        date = this.parse(text);
      }

      const result = this.format(date, outputFormat.internal ?? outputFormat.format);

      const baseName = file.name.replace(/\.[^.]+$/, "");
      return {
        name: `${baseName}.${outputFormat.extension ?? "txt"}`,
        bytes: new TextEncoder().encode(result)
      };
    });
  }
}

export default dateTimeHandler;
