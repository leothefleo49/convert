import CommonFormats from "../CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";
import { SimpleTTS } from "./espeakng.js/js/espeakng-simple.js";

/** Rejects after `ms` milliseconds with a timeout error. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

/** Returns the best MediaRecorder MIME type available for audio, or null. */
function getBestAudioMime(): string | null {
  const candidates = [
    "audio/ogg;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

export class espeakngHandler implements FormatHandler {
  public name: string = "espeakng";
  public ready: boolean = true;
  #tts: SimpleTTS | undefined = undefined;

  public supportedFormats: FileFormat[] = [
    CommonFormats.TEXT.supported("text", true, false),
    CommonFormats.WAV.supported("wav", false, true),
    // OGG and WebM output via MediaRecorder (when browser supports it)
    { name: "OGG Audio (eSpeak TTS)",  format: "ogg",  extension: "ogg",  mime: "audio/ogg",   from: false, to: true, lossless: false, internal: "ogg"  },
    { name: "WebM Audio (eSpeak TTS)", format: "webm", extension: "webm", mime: "audio/webm",  from: false, to: true, lossless: false, internal: "webm" },
  ];

  async init() {
    this.ready = true;
  }

  // Lazy-load the TTS engine with a 45-second timeout
  async getTTS(): Promise<SimpleTTS> {
    if (this.#tts == undefined) {
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          try {
            this.#tts = new SimpleTTS({
              defaultVoice: "en",
              defaultRate: 350,
              defaultPitch: 200,
              enhanceAudio: true,
            });
            this.#tts.onReady(() => resolve());
          } catch (e) {
            reject(e);
          }
        }),
        45_000,
        "eSpeak-NG WASM init"
      );
    }
    return this.#tts!;
  }

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const tts = await this.getTTS();
    const outMime = outputFormat.mime;

    return Promise.all(
      inputFiles.map(async (file) => {
        // Synthesise speech → AudioBuffer (60s timeout per file)
        const audio = await withTimeout(
          new Promise<AudioBuffer>((resolve, reject) => {
            try {
              tts.speak(
                new TextDecoder().decode(file.bytes),
                (samples: Float32Array, _sampleRate: number) => {
                  resolve(SimpleTTS.createAudioBuffer(samples, tts.sampleRate) as AudioBuffer);
                }
              );
            } catch (e) {
              reject(e);
            }
          }),
          60_000,
          "eSpeak-NG synthesis"
        );

        const baseName = file.name.split(".")[0];

        // WAV output — direct from AudioBuffer
        if (outMime === "audio/wav") {
          return {
            name: baseName + ".wav",
            bytes: new Uint8Array(audioBufferToWav(audio)),
          };
        }

        // OGG / WebM — record the AudioBuffer through MediaRecorder
        const recMime = getBestAudioMime();
        if (recMime && (outMime === "audio/ogg" || outMime === "audio/webm")) {
          const bytes = await encodeAudioBufferViaRecorder(audio, recMime);
          const ext = recMime.startsWith("audio/ogg") ? "ogg" : "webm";
          return { name: baseName + "." + ext, bytes };
        }

        // Fallback: return WAV for any unhandled output type
        return {
          name: baseName + ".wav",
          bytes: new Uint8Array(audioBufferToWav(audio)),
        };
      })
    );
  }
}

/** Plays an AudioBuffer through a MediaStreamDestination and records it. */
async function encodeAudioBufferViaRecorder(
  buffer: AudioBuffer,
  mimeType: string
): Promise<Uint8Array> {
  const ctx  = new AudioContext({ sampleRate: buffer.sampleRate });
  const dest = ctx.createMediaStreamDestination();
  const src  = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(dest);

  const recorder = new MediaRecorder(dest.stream, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.start();
    src.start();
    // Stop recording just after the buffer finishes playing
    src.onended = () => { recorder.stop(); ctx.close(); };
  });

  const blob = new Blob(chunks, { type: mimeType });
  return new Uint8Array(await blob.arrayBuffer());
}

// below code taken from https://github.com/Experience-Monks/audiobuffer-to-wav/blob/master/index.js
//
// changes: type annotations were added, local-scoped functions, var → let
function audioBufferToWav (buffer: AudioBuffer, opt: { float32?: boolean } = {}): ArrayBuffer {
  function writeString (view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  function interleave (inputL: Float32Array, inputR: Float32Array): Float32Array {
    let length = inputL.length + inputR.length
    let result = new Float32Array(length)

    let index = 0
    let inputIndex = 0

    while (index < length) {
      result[index++] = inputL[inputIndex]
      result[index++] = inputR[inputIndex]
      inputIndex++
    }
    return result
  }

  function writeFloat32 (output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 4) {
      output.setFloat32(offset, input[i], true)
    }
  }

  function floatTo16BitPCM (output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
  }
  function encodeWAV (samples: Float32Array, format: number, sampleRate: number, numChannels: number, bitDepth: number): ArrayBuffer {
    let bytesPerSample = bitDepth / 8
    let blockAlign = numChannels * bytesPerSample

    let buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
    let view = new DataView(buffer)

    /* RIFF identifier */
    writeString(view, 0, 'RIFF')
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true)
    /* RIFF type */
    writeString(view, 8, 'WAVE')
    /* format chunk identifier */
    writeString(view, 12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, format, true)
    /* channel count */
    view.setUint16(22, numChannels, true)
    /* sample rate */
    view.setUint32(24, sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true)
    /* bits per sample */
    view.setUint16(34, bitDepth, true)
    /* data chunk identifier */
    writeString(view, 36, 'data')
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true)
    if (format === 1) { // Raw PCM
      floatTo16BitPCM(view, 44, samples)
    } else {
      writeFloat32(view, 44, samples)
    }

    return buffer
  }

  let numChannels = buffer.numberOfChannels
  let sampleRate = buffer.sampleRate
  let format = opt.float32 ? 3 : 1
  let bitDepth = format === 3 ? 32 : 16

  let result: Float32Array
  if (numChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1))
  } else {
    result = buffer.getChannelData(0)
  }

  return encodeWAV(result, format, sampleRate, numChannels, bitDepth)
}

export default espeakngHandler;
