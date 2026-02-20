#!/usr/bin/env node
/**
 * Minimal local HTTP server for the Convert Anything offline build.
 *
 * IMPORTANT: Sets Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy
 * headers so FFmpeg WebAssembly (which needs SharedArrayBuffer) works correctly.
 * These headers cannot be set when opening files directly from disk (file://),
 * which is why this tiny server is needed.
 *
 * Usage:  node serve.js
 * Then open your browser to:  http://localhost:8080/
 *
 * You can change the port:
 *   PORT=9000 node serve.js        (Mac / Linux)
 *   set PORT=9000 && node serve.js (Windows)
 */

"use strict";

const http = require("http");
const fs   = require("fs");
const path = require("path");
const { exec } = require("child_process");

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT || "8080", 10);

const MIME = {
  ".html":  "text/html; charset=utf-8",
  ".css":   "text/css",
  ".js":    "application/javascript",
  ".mjs":   "application/javascript",
  ".json":  "application/json",
  ".wasm":  "application/wasm",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".gif":   "image/gif",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".txt":   "text/plain",
  ".md":    "text/markdown",
  ".data":  "application/octet-stream",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer(function (req, res) {
  // Strip query string and decode URI
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split("?")[0]); }
  catch { urlPath = req.url.split("?")[0]; }

  // Default to index
  if (urlPath === "/" || urlPath === "") urlPath = "/index.html";

  // Resolve and guard against path traversal
  const filePath = path.resolve(ROOT, "." + urlPath);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Security headers required for SharedArrayBuffer (FFmpeg WASM multithreading)
  res.setHeader("Cross-Origin-Opener-Policy",   "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy",  "require-corp");
  res.setHeader("Cross-Origin-Resource-Policy",  "cross-origin");

  fs.stat(filePath, function (err, stat) {
    if (err || !stat.isFile()) {
      // SPA fallback: serve index.html for unknown paths
      const index = path.join(ROOT, "index.html");
      fs.readFile(index, function (e2, data) {
        if (e2) { res.writeHead(404); res.end("Not Found"); return; }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
      });
      return;
    }

    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";

    // Enable caching for WASM / large assets
    if (ext === ".wasm" || ext === ".data") {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }

    res.writeHead(200, { "Content-Type": mime, "Content-Length": stat.size });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, "127.0.0.1", function () {
  const url = "http://localhost:" + PORT + "/";
  const line = "─".repeat(50);

  console.log("\n" + line);
  console.log("  Convert Anything — Offline Mode");
  console.log(line);
  console.log("  Open this URL in your browser:\n");
  console.log("    " + url + "\n");
  console.log("  Press Ctrl+C to stop the server.");
  console.log(line + "\n");

  // Try to open browser automatically
  const platform = process.platform;
  const openCmd  = platform === "darwin"  ? "open"
                 : platform === "win32"   ? "start"
                 : "xdg-open";

  try {
    if (platform === "win32") {
      exec('start "" "' + url + '"');
    } else {
      exec(openCmd + " " + url);
    }
  } catch (_) {
    // If auto-open fails, the URL is already printed above
  }
});

server.on("error", function (err) {
  if (err.code === "EADDRINUSE") {
    console.error("\nERROR: Port " + PORT + " is already in use.");
    console.error("Try a different port:  PORT=" + (PORT + 1) + " node serve.js\n");
  } else {
    console.error("\nServer error:", err.message);
  }
  process.exit(1);
});
