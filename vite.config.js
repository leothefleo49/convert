import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

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
        server.middlewares.use((req, _res, next) => {
          if (req.url?.startsWith("/convert/")) {
            req.url = "/" + req.url.slice("/convert/".length);
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
