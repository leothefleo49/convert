import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import fs from "fs";

// Maps /wasm/<file> and /js/<file> to their source locations for dev mode
const DEV_STATIC_MAP = {
  wasm: {
    "pandoc.wasm":       "src/handlers/pandoc/pandoc.wasm",
    "reflo_bg.wasm":     "node_modules/@flo-audio/reflo/reflo_bg.wasm",
    "magick.wasm":       "node_modules/@imagemagick/magick-wasm/dist/magick.wasm",
    "libopenmpt.wasm":   "src/handlers/libopenmpt/libopenmpt.wasm",
    "libopenmpt.js":     "src/handlers/libopenmpt/libopenmpt.js",
  },
  js: {
    "espeakng.worker.js":   "src/handlers/espeakng.js/js/espeakng.worker.js",
    "espeakng.worker.data": "src/handlers/espeakng.js/js/espeakng.worker.data",
  }
};

export default defineConfig(({ command }) => ({
  optimizeDeps: {
    exclude: [
      "@ffmpeg/ffmpeg",
      "@sqlite.org/sqlite-wasm",
    ],
    include: [
      "buffer"
    ]
  },
  resolve: {
    alias: {
      // Allow handlers to `import { Buffer } from 'buffer'` in the browser
      buffer: "buffer/"
    }
  },
  // Use "/" for local dev, "/convert/" for production build
  base: command === "serve" ? "/" : "/convert/",
  plugins: [
    // In dev mode the wasm/js assets are served at root (/) not at /convert/,
    // but the handler source files hard-code /convert/wasm and /convert/js.
    // This middleware rewrites those prefixes so dev requests succeed.
    {
      name: "dev-base-rewrite",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Rewrite /convert/ prefix (used in production) → / for dev
          if (req.url?.startsWith("/convert/")) {
            req.url = "/" + req.url.slice("/convert/".length);
          }

          // Serve /wasm/<file> and /js/<file> directly from source in dev mode
          const match = req.url?.match(/^\/(wasm|js)\/(.+)$/);
          if (match) {
            const [, dir, file] = match;
            const srcPath = DEV_STATIC_MAP[dir]?.[file];
            // Also handle ffmpeg-core.* dynamically
            const ffmpegMatch = dir === "wasm" && file.match(/^ffmpeg-core\./);
            const absPath = srcPath
              ? path.resolve(server.config.root, srcPath)
              : ffmpegMatch
              ? path.resolve(server.config.root, `node_modules/@ffmpeg/core/dist/esm/${file}`)
              : null;
            if (absPath && fs.existsSync(absPath)) {
              const ext = file.split(".").pop();
              const mimeMap = {
                wasm: "application/wasm",
                js: "application/javascript",
                data: "application/octet-stream",
              };
              res.setHeader("Content-Type", mimeMap[ext] || "application/octet-stream");
              res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
              res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
              fs.createReadStream(absPath).pipe(res);
              return;
            }
          }
          next();
        });
      }
    },
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@flo-audio/reflo/reflo_bg.wasm",
          dest: "wasm"
        },
        {
          src: "src/handlers/pandoc/pandoc.wasm",
          dest: "wasm"
        },
        {
          src: "node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.*",
          dest: "wasm"
        },
        {
          src: "node_modules/@imagemagick/magick-wasm/dist/magick.wasm",
          dest: "wasm"
        },
        {
          src: "src/handlers/libopenmpt/libopenmpt.wasm",
          dest: "wasm"
        },
        {
          src: "src/handlers/libopenmpt/libopenmpt.js",
          dest: "wasm"
        },
        {
          src: "src/handlers/espeakng.js/js/espeakng.worker.js",
          dest: "js"
        },
        {
          src: "src/handlers/espeakng.js/js/espeakng.worker.data",
          dest: "js"
        }
      ]
    }),
    tsconfigPaths()
  ]
}));
