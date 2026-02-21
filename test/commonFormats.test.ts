import { test, after } from "node:test";
import assert from "node:assert";
import puppeteer from "puppeteer";
import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { FileData, FormatHandler, FileFormat, ConvertPathNode } from "../src/FormatHandler.js";
import CommonFormats from "../src/CommonFormats.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare global {
  interface Window {
    queryFormatNode: (testFunction: (value: ConvertPathNode) => boolean) => ConvertPathNode | undefined;
    tryConvertByTraversing: (files: FileData[], from: ConvertPathNode, to: ConvertPathNode) => Promise<{
      files: FileData[];
      path: ConvertPathNode[];
    } | null>;
  }
}

// Set up a basic webserver to host the distribution build
const server = http.createServer(async (req, res) => {
  try {
    let reqPath = new URL(req.url, `http://${req.headers.host}`).pathname.replace("/convert/", "") || "index.html";
    let filePath = path.join(__dirname, "..", "dist", reqPath);
    if (reqPath.startsWith("/test/")) {
      filePath = path.join(__dirname, "resources", reqPath.slice(6));
    }
    
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) throw new Error("Not a file");
    } catch {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const content = await fs.readFile(filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end("Server Error");
  }
});

await new Promise(resolve => server.listen(8080, resolve));

// Start puppeteer, wait for ready confirmation
const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});
const page = await browser.newPage();

await Promise.all([
  new Promise(resolve => {
    page.on("console", msg => {
      const text = msg.text();
      if (text === "Built initial format list.") resolve(null);
    });
  }),
  page.goto("http://localhost:8080/convert/index.html")
]);

console.log("Setup finished.");

const dummyHandler: FormatHandler = {
  name: "dummy",
  ready: true,
  async init () { },
  async doConvert (inputFiles, inputFormat, outputFormat, args) {
    return [];
  }
};

function attemptConversion (
  files: string[],
  from: FileFormat,
  to: FileFormat
) {
  return page.evaluate(async (testFileNames, from, to) => {
    const files: FileData[] = [];
    for (const fileName of testFileNames) {
      files.push({
        bytes: await fetch("/test/" + fileName).then(r => r.bytes()),
        name: fileName
      });
    }
    return await window.tryConvertByTraversing(files, from, to);
  },
    files,
    { format: from, handler: dummyHandler },
    { format: to, handler: dummyHandler }
  );
}

// ==================================================================
//                         START OF TESTS
// ==================================================================

test("png → jpeg", async () => {

  const conversion = await attemptConversion(
    ["colors_50x50.png"],
    CommonFormats.PNG,
    CommonFormats.JPEG
  );

  assert.ok(conversion);
  assert.deepStrictEqual(conversion!.path.map(c => c.format.mime), ["image/png", "image/jpeg"]);

});

test("png → svg", async () => {

  const conversion = await attemptConversion(
    ["colors_50x50.png"],
    CommonFormats.PNG,
    CommonFormats.SVG
  );

  assert.ok(conversion);
  assert.deepStrictEqual(conversion!.path.map(c => c.format.mime), ["image/png", "image/svg+xml"]);

});

test("mp4 → apng", async () => {

  const conversion = await attemptConversion(
    ["doom.mp4"],
    CommonFormats.MP4,
    CommonFormats.PNG
  );

  assert.ok(conversion);
  assert.deepStrictEqual(conversion!.path.map(c => c.format.format), ["mp4", "apng"]);
  assert.strictEqual(conversion?.files.length, 1);

});

test("png → mp4", async () => {

  const conversion = await attemptConversion(
    ["colors_50x50.png"],
    CommonFormats.PNG,
    CommonFormats.MP4
  );

  assert.ok(conversion);
  assert.deepStrictEqual(conversion!.path.map(c => c.format.mime), ["image/png", "video/mp4"]);

});

test("png → wav → mp3", async () => {

  const conversion = await attemptConversion(
    ["colors_50x50.png"],
    CommonFormats.PNG,
    CommonFormats.MP3
  );

  assert.ok(conversion);
  assert.deepStrictEqual(conversion!.path.map(c => c.format.mime), ["image/png", "audio/wav", "audio/mpeg"]);

});

test("mp3 → png → gif", async () => {

  const conversion = await attemptConversion(
    ["gaster.mp3"],
    CommonFormats.MP3,
    CommonFormats.GIF
  );

  assert.ok(conversion);
  assert.deepStrictEqual(conversion!.path.map(c => c.format.mime), ["audio/mpeg", "image/png", "image/gif"]);

});

test("docx → html → svg → png → pdf", async () => {

  const conversion = await attemptConversion(
    ["word.docx"],
    CommonFormats.DOCX,
    CommonFormats.PDF
  );

  assert.ok(conversion);
  assert.deepStrictEqual(conversion!.path.map(c => c.format.mime), [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/html", "image/svg+xml", "image/png", "application/pdf"
  ]);
  const fileSize = Object.values(conversion!.files[0].bytes).length;
  assert.ok(fileSize >= 55000 && fileSize <= 65000);

});

test("md → docx", async () => {

  const conversion = await attemptConversion(
    ["markdown.md"],
    CommonFormats.MD,
    CommonFormats.DOCX
  );

  assert.ok(conversion);
  assert.deepStrictEqual(conversion!.path.map(c => c.format.mime), [
    "text/markdown", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]);

});

// ==================================================================
//                          END OF TESTS
// ==================================================================


after(async () => {
  await browser.close();
  server.close();
});
