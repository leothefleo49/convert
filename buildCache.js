import puppeteer from "puppeteer";
import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(async (req, res) => {
  try {
    const reqPath = new URL(req.url, `http://${req.headers.host}`).pathname.replace("/convert/", "") || "index.html";
    const filePath = path.join(__dirname, "dist", reqPath);
    
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

server.listen(8080, async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await Promise.all([
      new Promise(resolve => {
        page.on("console", msg => {
          const text = msg.text();
          if (text === "Built initial format list.") resolve();
        });
      }),
      page.goto("http://localhost:8080/convert/index.html")
    ]);

    const cacheJSON = await page.evaluate(() => {
      return window.printSupportedFormatCache();
    });
    
    const outputPath = process.argv[2] || "cache.json";
    await fs.writeFile(outputPath, cacheJSON, "utf-8");

    await browser.close();
    server.close();
  } catch (err) {
    console.error(err);
    server.close();
    process.exit(1);
  }
});
