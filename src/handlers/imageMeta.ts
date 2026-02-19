import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Image metadata / EXIF extractor.
 * Reads JPEG/PNG/TIFF/WebP files and extracts metadata to JSON or readable text.
 * Parses EXIF IFD0/IFD1 tags, GPS data, and basic image properties.
 */

function mkFmt(name: string, format: string, ext: string, mime: string, from: boolean, to: boolean): FileFormat {
  return { name, format, extension: ext, mime, from, to, internal: format, category: "image" };
}

// Standard EXIF tag names
const EXIF_TAGS: Record<number, string> = {
  0x010E: "ImageDescription", 0x010F: "Make", 0x0110: "Model",
  0x0112: "Orientation", 0x011A: "XResolution", 0x011B: "YResolution",
  0x0128: "ResolutionUnit", 0x0131: "Software", 0x0132: "DateTime",
  0x013B: "Artist", 0x8298: "Copyright",
  0x829A: "ExposureTime", 0x829D: "FNumber",
  0x8827: "ISOSpeedRatings", 0x9000: "ExifVersion",
  0x9003: "DateTimeOriginal", 0x9004: "DateTimeDigitized",
  0x920A: "FocalLength", 0xA001: "ColorSpace",
  0xA002: "PixelXDimension", 0xA003: "PixelYDimension",
  0xA405: "FocalLengthIn35mmFilm", 0xA420: "ImageUniqueID",
  0xA430: "CameraOwnerName", 0xA431: "BodySerialNumber",
  0xA432: "LensInfo", 0xA433: "LensMake", 0xA434: "LensModel",
};

const GPS_TAGS: Record<number, string> = {
  0x0000: "GPSVersionID", 0x0001: "GPSLatitudeRef", 0x0002: "GPSLatitude",
  0x0003: "GPSLongitudeRef", 0x0004: "GPSLongitude",
  0x0005: "GPSAltitudeRef", 0x0006: "GPSAltitude",
  0x0007: "GPSTimeStamp", 0x001D: "GPSDateStamp",
};

interface ExifData {
  [key: string]: string | number | number[] | undefined;
}

function readExifFromJPEG(bytes: Uint8Array): ExifData {
  const data: ExifData = {};

  // Find EXIF marker (APP1 = 0xFFE1)
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return data; // Not JPEG

  let offset = 2;
  while (offset < bytes.length - 4) {
    if (bytes[offset] !== 0xFF) break;
    const marker = bytes[offset + 1];
    const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];

    if (marker === 0xE1) {
      // Check for "Exif\0\0" header
      const exifHeader = String.fromCharCode(
        bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]
      );
      if (exifHeader === "Exif") {
        const tiffStart = offset + 10; // After marker(2) + length(2) + "Exif\0\0"(6)
        parseTIFF(bytes, tiffStart, data);
      }
      break;
    }

    offset += 2 + segLen;
  }

  return data;
}

function parseTIFF(bytes: Uint8Array, start: number, data: ExifData) {
  if (start + 8 > bytes.length) return;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endian = bytes[start] === 0x49 ? true : false; // true = little-endian (II), false = big-endian (MM)

  const getU16 = (o: number) => view.getUint16(start + o, endian);
  const getU32 = (o: number) => view.getUint32(start + o, endian);

  try {
    const ifd0Offset = getU32(4);
    parseIFD(bytes, start, ifd0Offset, data, EXIF_TAGS, getU16, getU32, endian);

    // Look for EXIF sub-IFD
    const numEntries = getU16(ifd0Offset);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifd0Offset + 2 + i * 12;
      const tag = getU16(entryOffset);
      if (tag === 0x8769) { // ExifIFDPointer
        const subOffset = getU32(entryOffset + 8);
        parseIFD(bytes, start, subOffset, data, EXIF_TAGS, getU16, getU32, endian);
      }
      if (tag === 0x8825) { // GPSInfoIFDPointer
        const gpsOffset = getU32(entryOffset + 8);
        parseIFD(bytes, start, gpsOffset, data, GPS_TAGS, getU16, getU32, endian);
      }
    }
  } catch {
    // Parsing error, return what we have
  }
}

function parseIFD(
  bytes: Uint8Array, tiffStart: number, ifdOffset: number,
  data: ExifData, tagMap: Record<number, string>,
  getU16: (o: number) => number, getU32: (o: number) => number,
  littleEndian: boolean
) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numEntries = getU16(ifdOffset);

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (tiffStart + entryOffset + 12 > bytes.length) break;

    const tag = getU16(entryOffset);
    const type = getU16(entryOffset + 2);
    const count = getU32(entryOffset + 4);

    const tagName = tagMap[tag];
    if (!tagName) continue;

    // Type sizes: 1=BYTE, 2=ASCII, 3=SHORT, 4=LONG, 5=RATIONAL, 7=UNDEFINED, 10=SRATIONAL
    const typeSize: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 10: 8 };
    const size = (typeSize[type] || 1) * count;
    const valueOffset = size <= 4 ? entryOffset + 8 : getU32(entryOffset + 8);

    try {
      if (type === 2) {
        // ASCII string
        let str = "";
        for (let j = 0; j < count - 1; j++) {
          str += String.fromCharCode(bytes[tiffStart + valueOffset + j]);
        }
        data[tagName] = str.trim();
      } else if (type === 3) {
        // SHORT
        data[tagName] = count === 1 ? getU16(valueOffset) : undefined;
      } else if (type === 4) {
        // LONG
        data[tagName] = count === 1 ? getU32(valueOffset) : undefined;
      } else if (type === 5) {
        // RATIONAL (unsigned)
        const num = view.getUint32(tiffStart + valueOffset, littleEndian);
        const den = view.getUint32(tiffStart + valueOffset + 4, littleEndian);
        data[tagName] = den !== 0 ? num / den : 0;
      }
    } catch {
      // Skip bad entries
    }
  }
}

function readPNGDimensions(bytes: Uint8Array): ExifData {
  const data: ExifData = {};

  // PNG header check
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50) return data;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // IHDR chunk starts at offset 8 (length) + 4 (type) = data at 16
  data["Width"] = view.getUint32(16, false);
  data["Height"] = view.getUint32(20, false);
  data["BitDepth"] = bytes[24];
  const colorTypes: Record<number, string> = {
    0: "Grayscale", 2: "RGB", 3: "Indexed", 4: "Grayscale+Alpha", 6: "RGBA"
  };
  data["ColorType"] = colorTypes[bytes[25]] || `Unknown (${bytes[25]})`;

  // Read text chunks
  let offset = 8;
  while (offset < bytes.length - 12) {
    const chunkLen = view.getUint32(offset, false);
    const chunkType = String.fromCharCode(
      bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]
    );

    if (chunkType === "tEXt" || chunkType === "iTXt") {
      const chunkData = bytes.slice(offset + 8, offset + 8 + chunkLen);
      const nullIdx = chunkData.indexOf(0);
      if (nullIdx > 0) {
        const key = new TextDecoder().decode(chunkData.slice(0, nullIdx));
        const value = new TextDecoder().decode(chunkData.slice(nullIdx + 1));
        data[key] = value;
      }
    }

    if (chunkType === "IEND") break;
    offset += 12 + chunkLen;
  }

  return data;
}

class imageMetadataHandler implements FormatHandler {
  public name = "imageMetadata";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    mkFmt("JPEG Image", "jpeg-meta", "jpg", "image/jpeg", true, false),
    mkFmt("PNG Image", "png-meta", "png", "image/png", true, false),
    mkFmt("Image Metadata JSON", "img-meta-json", "json", "application/json", false, true),
    mkFmt("Image Metadata Text", "img-meta-txt", "txt", "text/plain", false, true),
  ];

  async init() {}

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const baseName = inputFile.name.split(".")[0];
      let metadata: ExifData = {};

      if (inputFormat.internal === "jpeg-meta") {
        metadata = readExifFromJPEG(inputFile.bytes);
      } else if (inputFormat.internal === "png-meta") {
        metadata = readPNGDimensions(inputFile.bytes);
      }

      metadata["FileName"] = inputFile.name;
      metadata["FileSize"] = `${inputFile.bytes.length} bytes`;

      if (outputFormat.internal === "img-meta-json") {
        const json = JSON.stringify(metadata, null, 2);
        outputFiles.push({ name: baseName + "_metadata.json", bytes: new TextEncoder().encode(json) });
      } else {
        const lines = Object.entries(metadata)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}: ${v}`);
        outputFiles.push({ name: baseName + "_metadata.txt", bytes: new TextEncoder().encode(lines.join("\n")) });
      }
    }

    return outputFiles;
  }
}

export default imageMetadataHandler;
