import type { FormatHandler } from "../FormatHandler.ts";

/**
 * Load all handlers using per-file dynamic imports.
 * Each import is isolated in try/catch so ONE broken module cannot
 * prevent all other formats from loading — previously a single bad
 * top-level import here would silently wipe out every format.
 */
export async function loadHandlers(
  log: (msg: string, cls: string) => void
): Promise<FormatHandler[]> {
  const all: FormatHandler[] = [];

  async function load(name: string, fn: () => Promise<FormatHandler | FormatHandler[]>) {
    try {
      const result = await fn();
      const list = Array.isArray(result) ? result : [result];
      all.push(...list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`[err] ${name}: ${msg}`, "log-err");
      console.error(`[handler:${name}]`, e);
    }
  }

  await load("svgTrace",         async () => new (await import("./svgTrace.ts")).default());
  await load("canvasToBlob",     async () => new (await import("./canvasToBlob.ts")).default());
  await load("meyda",            async () => new (await import("./meyda.ts")).default());
  await load("htmlEmbed",        async () => new (await import("./htmlEmbed.ts")).default());
  await load("FFmpeg",           async () => new (await import("./FFmpeg.ts")).default());
  await load("pdftoimg",         async () => new (await import("./pdftoimg.ts")).default());
  await load("pdftextract",      async () => new (await import("./pdftextract.ts")).default());
  await load("ImageMagick",      async () => new (await import("./ImageMagick.ts")).default());
  await load("rename",           async () => { const m = await import("./rename.ts"); return [m.renameZipHandler, m.renameTxtHandler]; });
  await load("envelope",         async () => new (await import("./envelope.ts")).default());
  await load("svgForeignObject", async () => new (await import("./svgForeignObject.ts")).default());
  await load("qoi-fu",           async () => new (await import("./qoi-fu.ts")).default());
  await load("sppd",             async () => new (await import("./sppd.ts")).default());
  await load("threejs",          async () => new (await import("./threejs.ts")).default());
  await load("sqlite",           async () => new (await import("./sqlite.ts")).default());
  await load("vtf",              async () => new (await import("./vtf.ts")).default());
  await load("mcmap",            async () => new (await import("./mcmap.ts")).default());
  await load("jszip",            async () => new (await import("./jszip.ts")).default());
  await load("als",              async () => new (await import("./als.ts")).default());
  await load("qoa-fu",           async () => new (await import("./qoa-fu.ts")).default());
  await load("pyTurtle",         async () => new (await import("./pyTurtle.ts")).default());
  await load("json",             async () => { const m = await import("./json.ts"); return [new m.fromJsonHandler(), new m.toJsonHandler()]; });
  await load("nbt",              async () => new (await import("./nbt.ts")).default());
  await load("petozip",          async () => new (await import("./petozip.ts")).default());
  await load("flptojson",        async () => new (await import("./flptojson.ts")).default());
  await load("flo",              async () => new (await import("./flo.ts")).default());
  await load("cgbi-to-png",      async () => new (await import("./cgbi-to-png.ts")).default());
  await load("batToExe",         async () => new (await import("./batToExe.ts")).default());
  await load("textEncoding",     async () => new (await import("./textEncoding.ts")).default());
  await load("sb3tohtml",        async () => new (await import("./sb3tohtml.ts")).default());
  await load("libopenmpt",       async () => new (await import("./libopenmpt.ts")).default());
  await load("lzh",              async () => new (await import("./lzh.ts")).default());
  await load("pandoc",           async () => new (await import("./pandoc.ts")).default());
  await load("espeakng",         async () => new (await import("./espeakng.js" as string)).default());
  await load("texttoshell",      async () => new (await import("./texttoshell.ts")).default());
  await load("batch",            async () => new (await import("./batch.ts")).default());
  await load("bsor",             async () => new (await import("./bsor.ts")).default());
  await load("renameGameZip",    async () => new (await import("./renameGameZip.ts")).default());
  await load("subtitle",         async () => new (await import("./subtitle.ts")).default());
  await load("configFormat",     async () => new (await import("./configFormat.ts")).default());
  await load("encoding",         async () => new (await import("./encoding.ts")).default());
  await load("textCipher",       async () => new (await import("./textCipher.ts")).default());
  await load("codeTranspile",    async () => new (await import("./codeTranspile.ts")).default());
  await load("threejs3d",        async () => new (await import("./threejs3d.ts")).default());
  await load("colorConvert",     async () => new (await import("./colorConvert.ts")).default());
  await load("fontMeta",         async () => new (await import("./fontMeta.ts")).default());
  await load("hashChecksum",     async () => new (await import("./hashChecksum.ts")).default());
  await load("imageMeta",        async () => new (await import("./imageMeta.ts")).default());
  await load("mathNotation",     async () => new (await import("./mathNotation.ts")).default());
  await load("unitConvert",      async () => new (await import("./unitConvert.ts")).default());
  await load("gzip",             async () => new (await import("./gzip.ts")).default());
  await load("qrcode",           async () => new (await import("./qrcode.ts")).default());
  await load("textStats",        async () => new (await import("./textStats.ts")).default());

  return all;
}

// Empty default export kept for backward compatibility
const handlers: FormatHandler[] = [];
export default handlers;
