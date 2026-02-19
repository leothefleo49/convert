import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * QR Code generator handler.
 * Takes a text file and renders a QR code PNG image using the `qrcode` library.
 * Also supports decoding: given a QR code image, read the text (using BarcodeDetector API).
 */
class qrcodeHandler implements FormatHandler {
  public name = "qrcode";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    {
      name: "Plain Text",
      format: "text",
      extension: "txt",
      mime: "text/plain",
      from: true,
      to: true,
      internal: "text",
      category: "data"
    },
    {
      name: "QR Code PNG Image",
      format: "qrpng",
      extension: "png",
      mime: "image/png",
      from: true,
      to: true,
      internal: "qrpng",
      category: "image"
    }
  ];

  async init() {
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const results: FileData[] = [];

    for (const file of inputFiles) {

      if (inputFormat.internal === "text" && outputFormat.internal === "qrpng") {
        // Text → QR PNG
        const text = new TextDecoder().decode(file.bytes).trim();
        if (!text) throw new Error("Input text is empty");

        const QRCode = await import("qrcode");
        const dataURL: string = await QRCode.toDataURL(text, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 400,
          color: { dark: "#000000", light: "#FFFFFF" }
        });

        // dataURL is "data:image/png;base64,..."
        const b64 = dataURL.split(",")[1];
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        results.push({
          bytes,
          name: file.name.replace(/\.[^.]+$/, "") + "-qr.png"
        });

      } else if (inputFormat.internal === "qrpng" && outputFormat.internal === "text") {
        // QR PNG → Text (using BarcodeDetector API if available)
        const BarcodeDetectorCls = (globalThis as any).BarcodeDetector;
        if (!BarcodeDetectorCls) {
          throw new Error(
            "QR code decoding requires BarcodeDetector API (supported in Chrome/Edge 83+). " +
            "Use an image-to-text approach or a dedicated scanner app for other browsers."
          );
        }
        const detector = new BarcodeDetectorCls({ formats: ["qr_code"] });
        const blob = new Blob([file.bytes], { type: "image/png" });
        const bmp = await createImageBitmap(blob);
        const codes: { rawValue: string }[] = await detector.detect(bmp);
        if (!codes.length) throw new Error("No QR code detected in image");
        const text = codes.map(c => c.rawValue).join("\n");
        results.push({
          bytes: new TextEncoder().encode(text),
          name: file.name.replace(/\.[^.]+$/, "") + ".txt"
        });

      } else {
        throw new Error(`Unsupported conversion: ${inputFormat.format} → ${outputFormat.format}`);
      }
    }

    return results;
  }
}

export default qrcodeHandler;
