import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Unit conversion handler.
 * Converts between common measurement units across multiple categories.
 * Input: one value per line like "100 km" or just "100" (assumes base unit).
 * Output: converted values.
 *
 * Categories: Length, Weight/Mass, Temperature, Volume, Speed, Area, Data, Time, Pressure, Energy
 */

function mkFmt(name: string, format: string, ext: string): FileFormat {
  return {
    name, format, extension: ext,
    mime: "text/plain",
    from: true, to: true,
    internal: format,
    category: "data"
  };
}

// Conversion factors to base unit within each category
interface UnitDef {
  category: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
  label: string;
}

function linear(factor: number, label: string, category: string): UnitDef {
  return { category, label, toBase: v => v * factor, fromBase: v => v / factor };
}

const UNITS: Record<string, UnitDef> = {
  // Length (base: meters)
  "meters": linear(1, "m", "length"),
  "kilometers": linear(1000, "km", "length"),
  "centimeters": linear(0.01, "cm", "length"),
  "millimeters": linear(0.001, "mm", "length"),
  "micrometers": linear(1e-6, "\u00B5m", "length"),
  "nanometers": linear(1e-9, "nm", "length"),
  "miles": linear(1609.344, "mi", "length"),
  "yards": linear(0.9144, "yd", "length"),
  "feet": linear(0.3048, "ft", "length"),
  "inches": linear(0.0254, "in", "length"),
  "nautical-miles": linear(1852, "nmi", "length"),
  "light-years": linear(9.461e15, "ly", "length"),

  // Weight/Mass (base: kilograms)
  "kilograms": linear(1, "kg", "mass"),
  "grams": linear(0.001, "g", "mass"),
  "milligrams": linear(1e-6, "mg", "mass"),
  "metric-tons": linear(1000, "t", "mass"),
  "pounds": linear(0.453592, "lb", "mass"),
  "ounces": linear(0.0283495, "oz", "mass"),
  "stones": linear(6.35029, "st", "mass"),

  // Temperature (base: Celsius) - non-linear
  "celsius": {
    category: "temperature", label: "\u00B0C",
    toBase: v => v, fromBase: v => v
  },
  "fahrenheit": {
    category: "temperature", label: "\u00B0F",
    toBase: v => (v - 32) * 5 / 9, fromBase: v => v * 9 / 5 + 32
  },
  "kelvin": {
    category: "temperature", label: "K",
    toBase: v => v - 273.15, fromBase: v => v + 273.15
  },

  // Volume (base: liters)
  "liters": linear(1, "L", "volume"),
  "milliliters": linear(0.001, "mL", "volume"),
  "gallons-us": linear(3.78541, "gal", "volume"),
  "quarts-us": linear(0.946353, "qt", "volume"),
  "pints-us": linear(0.473176, "pt", "volume"),
  "cups-us": linear(0.236588, "cup", "volume"),
  "fluid-ounces-us": linear(0.0295735, "fl oz", "volume"),
  "tablespoons": linear(0.0147868, "tbsp", "volume"),
  "teaspoons": linear(0.00492892, "tsp", "volume"),
  "cubic-meters": linear(1000, "m\u00B3", "volume"),

  // Speed (base: m/s)
  "meters-per-second": linear(1, "m/s", "speed"),
  "kilometers-per-hour": linear(1 / 3.6, "km/h", "speed"),
  "miles-per-hour": linear(0.44704, "mph", "speed"),
  "knots": linear(0.514444, "kn", "speed"),
  "feet-per-second": linear(0.3048, "ft/s", "speed"),
  "mach": linear(343, "Mach", "speed"),

  // Area (base: square meters)
  "square-meters": linear(1, "m\u00B2", "area"),
  "square-kilometers": linear(1e6, "km\u00B2", "area"),
  "hectares": linear(1e4, "ha", "area"),
  "acres": linear(4046.86, "acre", "area"),
  "square-feet": linear(0.092903, "ft\u00B2", "area"),
  "square-miles": linear(2.59e6, "mi\u00B2", "area"),

  // Digital storage (base: bytes)
  "bytes": linear(1, "B", "data"),
  "kilobytes": linear(1024, "KB", "data"),
  "megabytes": linear(1048576, "MB", "data"),
  "gigabytes": linear(1073741824, "GB", "data"),
  "terabytes": linear(1099511627776, "TB", "data"),
  "bits": linear(0.125, "bit", "data"),
  "kibibytes": linear(1024, "KiB", "data"),
  "mebibytes": linear(1048576, "MiB", "data"),

  // Time (base: seconds)
  "seconds": linear(1, "s", "time"),
  "milliseconds": linear(0.001, "ms", "time"),
  "microseconds": linear(1e-6, "\u00B5s", "time"),
  "minutes": linear(60, "min", "time"),
  "hours": linear(3600, "h", "time"),
  "days": linear(86400, "d", "time"),
  "weeks": linear(604800, "wk", "time"),
  "years": linear(31557600, "yr", "time"),

  // Pressure (base: Pascals)
  "pascals": linear(1, "Pa", "pressure"),
  "kilopascals": linear(1000, "kPa", "pressure"),
  "bars": linear(100000, "bar", "pressure"),
  "atmospheres": linear(101325, "atm", "pressure"),
  "psi": linear(6894.76, "psi", "pressure"),
  "mmhg": linear(133.322, "mmHg", "pressure"),

  // Energy (base: Joules)
  "joules": linear(1, "J", "energy"),
  "kilojoules": linear(1000, "kJ", "energy"),
  "calories": linear(4.184, "cal", "energy"),
  "kilocalories": linear(4184, "kcal", "energy"),
  "watt-hours": linear(3600, "Wh", "energy"),
  "kilowatt-hours": linear(3600000, "kWh", "energy"),
  "electron-volts": linear(1.602e-19, "eV", "energy"),
  "btu": linear(1055.06, "BTU", "energy"),
};

class unitConvertHandler implements FormatHandler {
  public name = "unitConvert";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = Object.entries(UNITS).map(([key, def]) =>
    mkFmt(`${key.replace(/-/g, " ")} (${def.label})`, `unit-${key}`, "txt")
  );

  async init() {}

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const outputFiles: FileData[] = [];

    const inKey = inputFormat.internal.replace("unit-", "");
    const outKey = outputFormat.internal.replace("unit-", "");
    const inDef = UNITS[inKey];
    const outDef = UNITS[outKey];

    if (!inDef || !outDef) {
      throw new Error(`Unknown unit: ${inKey} or ${outKey}`);
    }
    if (inDef.category !== outDef.category) {
      throw new Error(`Cannot convert between ${inDef.category} and ${outDef.category}`);
    }

    for (const inputFile of inputFiles) {
      const text = new TextDecoder().decode(inputFile.bytes);
      const lines = text.split(/\r?\n/);
      const outputLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) { outputLines.push(""); continue; }

        // Extract numeric value — strip any unit suffix
        const numMatch = trimmed.match(/^(-?[\d.]+(?:e[+-]?\d+)?)/i);
        if (!numMatch) {
          outputLines.push(`# Could not parse: ${line}`);
          continue;
        }

        const value = parseFloat(numMatch[1]);
        const baseValue = inDef.toBase(value);
        const converted = outDef.fromBase(baseValue);

        // Smart formatting
        let formatted: string;
        if (Math.abs(converted) >= 1e10 || (Math.abs(converted) < 1e-6 && converted !== 0)) {
          formatted = converted.toExponential(6);
        } else {
          formatted = parseFloat(converted.toFixed(8)).toString();
        }

        outputLines.push(`${formatted} ${outDef.label}`);
      }

      const result = new TextEncoder().encode(outputLines.join("\n"));
      const baseName = inputFile.name.split(".")[0];
      outputFiles.push({ name: baseName + `_${outKey}.txt`, bytes: result });
    }

    return outputFiles;
  }
}

export default unitConvertHandler;
