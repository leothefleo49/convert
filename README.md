# Convert Anything — leothefleo49's Enhanced Fork

> **Based on [p2r3/convert](https://github.com/p2r3/convert) — the truly universal file converter — with a huge pile of extra features added on top.**

**Live demo:**
👉 **https://leothefleo49.github.io/convert** *(or run it on your own computer — see below)*

---

## What does this app do?

It converts files. Like, **basically everything to everything.**

Most file converters online are boring — they only let you go image-to-image or video-to-video, and they make you upload your files to some random server. This app does neither of those things.

- **Your files never leave your computer.** Everything runs right inside your browser.
- **It can convert across totally different formats** — video to PDF, PNG to MP3, Markdown to speech, text to QR code, and hundreds more.
- **It finds a path automatically** — if there's any way to get from format A to format B (even through several intermediate steps), it'll figure it out.

---

## The Quickest Way to Try It

**No install needed.** Open your browser and go to:

```
https://leothefleo49.github.io/convert
```

1. Click the blue box (or drag your file onto the page)
2. Pick the output format you want
3. Hit **Convert**
4. Download your result

Done.

---

## One-Click Download — Pre-Built Offline ZIP

Don't want to install Node.js or deal with any of that? **Download a pre-built release** — just unzip and double-click.

> **👉 [Go to Releases](https://github.com/leothefleo49/convert/releases) → click the `.zip` file under the latest release**

Inside the ZIP:

| File | What it does |
|---|---|
| `start.bat` | **Windows** — double-click to launch |
| `launch.sh` | **Mac / Linux** — double-click or `bash launch.sh` |
| `serve.js` | Manual launch — `node serve.js` from any terminal |
| `README-offline.txt` | Quick reference guide |
| everything else | The built app itself |

Once it starts, your browser opens automatically to `http://localhost:8080/`. From that point on you need **zero internet** — everything runs on your machine.

**One requirement:** [Node.js LTS](https://nodejs.org) must be installed (free, one-time).

### Creating a release in your own fork

If you've forked this repo, you can publish your own release ZIP with one click:

1. On GitHub, click the **Actions** tab
2. Click **"Build & Release Offline Package"** in the left list
3. Click **"Run workflow"** (top right)
4. Fill in a version tag like `v1.0.0` and click **Run workflow**

GitHub will build the app, package it into a ZIP, and publish it as a Release automatically. Anyone can then download it from your repo's Releases page.

> **Mac / Linux users:** run `bash launch.sh` from the unzipped folder.

---

## Download and Run It Yourself (Offline / Local)

You may want a local copy if you'd like it to work offline, or if you just prefer not to rely on a hosted site.

### Option A — Download as a ZIP (easiest, no Git needed)

1. Go to **https://github.com/leothefleo49/convert**
2. Click the green **`<> Code`** button near the top-right of the page
3. Click **"Download ZIP"**
4. Unzip the downloaded file somewhere on your computer (right-click → Extract All on Windows)

Then follow the **Run It Locally** steps below.

### Option B — Clone with Git

If you have Git installed:

```bash
git clone --recursive https://github.com/leothefleo49/convert.git
cd convert
```

> The `--recursive` flag is important — it pulls in some required sub-libraries. Without it, a few converters won't work.

---

## Run It Locally — Step by Step (Beginner Friendly)

### Step 1 — Install Node.js

Node.js is a program that runs JavaScript outside of the browser. You need it to run the app's development server.

1. Go to **https://nodejs.org**
2. Download the version labeled **"LTS — Recommended For Most Users"**
3. Run the installer (click Next → Next → Finish like any normal program)

To check it worked, open a terminal:
- **Windows:** Press `Win + R`, type `cmd`, press Enter
- **Mac:** Open the Terminal app from Applications → Utilities

Then type:
```
node --version
```

You should see something like `v22.x.x`. If you do, you're good.

### Step 2 — Open the project folder in your terminal

On **Windows**: open File Explorer, navigate to the `convert` folder you downloaded/unzipped, then Shift + Right-click inside it and choose **"Open in Terminal"** (or "Open PowerShell window here").

On **Mac/Linux**: open Terminal and type `cd ` (with a space), then drag the folder into the terminal window and press Enter.

### Step 3 — Install dependencies

In the terminal (inside the `convert` folder), run:

```bash
npm install
```

This downloads all the libraries the app needs. It might take 1–3 minutes the first time. You'll see a progress indicator. You only need to do this once.

### Step 4 — Start the app

```bash
npm run dev
```

You'll see something like:

```
  VITE v7.x.x  ready in 500ms

  ➜  Local:   http://localhost:5182/convert/
  ➜  Network: use --host to expose
```

Open **http://localhost:5182/convert/** in your browser.

The app is now running entirely on your own computer! Press `Ctrl+C` in the terminal to stop it.

### First-time tip

On your very first load, the app needs to build an internal list of all supported formats. This can take 30–60 seconds. If the format dropdowns seem empty, just wait — you'll see a **"Built initial format list"** message appear at the bottom of the page when it's done. After that, every reload is instant.

---

## What's New in This Fork

This fork adds a large number of new conversions and improvements on top of the original p2r3/convert.

### Complete Format Support

This fork includes every format from the original p2r3/convert **plus** a large set of new ones. Here's the full picture:

#### Original formats (from p2r3/convert)

| Category | What you can convert |
|---|---|
| **Images** | PNG, JPEG, WebP, GIF, BMP, TIFF, HEIC, AVIF, SVG, ICO, QOI, VTF (Valve Texture), CgBI (iPhone PNG) → any of the above |
| **Video** | MP4, WebM, MKV, AVI, MOV, WMV, FLV, OGV, 3GP, TS → any video or audio format |
| **Audio** | MP3, WAV, OGG/Vorbis, FLAC, Opus, AAC, M4A, QOA, FLO, ALS (Ableton Live), MOD/XM/IT/S3M tracker music → any audio |
| **Documents** | PDF → images / text / Word; DOCX ↔ Markdown / HTML; PPTX (build from images) |
| **3D models** | OBJ, STL, GLTF, GLB, FBX, DAE, PLY, 3MF — view and convert between them |
| **Data / code** | JSON ↔ YAML ↔ CSV; ZIP ↔ any files; NBT (Minecraft) ↔ JSON; SQLite → JSON / CSV |
| **Esoteric** | Scratch (.sb3) → HTML, Minecraft map image, PE (.exe) → ZIP, BAT → EXE, Python Turtle → SVG, BSOR Beat Saber replay → video |
| **Text utilities** | Text → speech (eSpeak), text encoding (UTF-8/16/32/Latin), text → shell script |
| **Re-label** | Rename file extensions without conversion — ZIP ↔ DOCX/XLSX/PPTX/JAR/CBZ etc. |

#### New formats added in this fork

| Feature | What it converts |
|---|---|
| **CSV / TSV / SSV ↔ JSON** | Full RFC 4180 CSV parser — handles quoted fields, embedded commas, multi-line values |
| **CSV / TSV / SSV → Markdown table** | Clean pipe-table output, auto-padded columns |
| **CSV / TSV / SSV → HTML table** | Styled HTML with proper escaping |
| **CSV ↔ TSV ↔ SSV** | Re-delimit between comma, tab, and semicolon (European Excel) formats |
| **Text / Markdown / HTML → PDF** | Pure in-browser PDF generation, auto-scales font to fit, no upload needed |
| **Subtitle converter** | SRT ↔ VTT ↔ ASS/SSA ↔ SBV ↔ LRC lyrics — all directions |
| **Config file converter** | JSON ↔ YAML ↔ TOML ↔ INI ↔ .env ↔ .properties — losslessly |
| **Code transpiler** | TypeScript → JS, TSX → JS, SCSS → CSS, JSX → JS, minify/prettify HTML/CSS/JS/JSON |
| **Text ciphers** | Text ↔ Morse code, Braille (Grade 1), ROT13, ROT47, NATO phonetic, Caesar cipher, binary |
| **Color converter** | HEX ↔ RGB ↔ HSL ↔ HSV ↔ CMYK — paste one color or a hundred, one per line |
| **Unit converter** | Length, Weight, Temperature, Volume, Speed, Area, Data size, Time, Pressure, Energy |
| **Hash / checksum** | Any file → MD5, SHA-1, SHA-256, SHA-384, SHA-512, CRC32, Adler32 |
| **QR Code** | Text → QR code PNG; QR code image → text |
| **Text format bridging** | Markdown ↔ HTML ↔ Plain text ↔ CSV ↔ JSON (lightweight, offline) |
| **Text statistics** | Any text → word count, line count, character count, reading time |
| **Image metadata** | Any image → full EXIF/metadata JSON export |
| **Font metadata** | TTF / OTF / WOFF → JSON (name, family, version, glyph list) |
| **Math notation** | LaTeX ↔ MathML ↔ plain-text math |
| **Encoding / decoding** | Base64, URL encoding, HTML entities — encode and decode |
| **GZip** | Any file → .gz archive; .gz → original |
| **PDF text extractor** | Text-based PDFs → plain text instantly, no OCR needed |
| **Game zip renamer** | Standardizes ROM / game archive filenames |
| **Extra 3D formats** | Additional Three.js-powered 3D model conversions |

### Better Output Quality

The original used FFmpeg and ImageMagick defaults, which are pretty mediocre. This fork sets proper quality settings across the board:

- **Audio (FFmpeg):** MP3 → VBR highest quality (`-q:a 0`), Ogg Vorbis → `q:a 9` (~320kbps), Opus → 192k VBR, AAC → 256k, FLAC → maximum compression, WAV → lossless PCM
- **Images (ImageMagick):** Quality set to 95 (default is ~75) for JPEG, WebP, and HEIC
- **PDF → image:** Renders at 2× resolution (144 DPI instead of 72 DPI) — text is actually sharp
- **Video (FFmpeg):** WebM/MKV → uses CRF 24 with VP9 for much better-looking video

### More Conversions Actually Work

The original search algorithm would time out and fail on certain cross-format conversions (like PNG → MP3 or PDF → PPTX). This fork replaces it with an **A\* pathfinding algorithm** using a category-distance heuristic. Routes that needed 500,000+ iterations now complete in under 1,000. Some conversions that were simply broken before now work.

### Contributor Stats and Filter Buttons

The bottom of the page shows a live counter like:

```
302 in · 286 out | p2r3: 253 · leothefleo49: 49
```

Filter buttons let you show only formats from a specific contributor — great for seeing exactly what's been added in this fork versus the original.

### Sync Manager

In the settings panel there's a **Sync Manager** that shows how many commits behind this fork is from the upstream p2r3/convert repo, and lets you trigger a sync workflow with one click (for repo owners with GitHub Actions set up).

---

## How to Fork This and Make It Your Own

Forking means creating your own copy on GitHub that you can customize however you want — and you can still pull in updates from this repo any time new features come out.

### Step 1 — Fork on GitHub

1. Go to **https://github.com/leothefleo49/convert**
2. Click the **Fork** button near the top-right corner
3. Select your GitHub account and click **Create fork**

You now have your own copy at `https://github.com/YOUR-USERNAME/convert`.

### Step 2 — Update the config file

Open `src/fork-config.ts` and set the `owner` field to your GitHub username:

```ts
export const FORK_CONFIG = {
  owner: "YOUR-USERNAME",   // ← put your GitHub username here
  repo: "convert",
  branch: "master",
  syncSources: [
    {
      owner: "p2r3",
      repo: "convert",
      branch: "master",
      displayName: "p2r3 (original)",
      workflowFile: "",  // status display only — no direct sync from grandparent needed
    },
    {
      owner: "leothefleo49",
      repo: "convert",
      branch: "master",
      displayName: "leothefleo49 (parent)",
      workflowFile: "sync-from-parent.yml",  // your GitHub Actions workflow
    },
  ],
};
```

### Step 3 — Set up auto-sync (optional but nice)

Copy `.github/workflows/sync-upstream.yml` to `.github/workflows/sync-from-parent.yml` and change the upstream repo URL inside it to `leothefleo49/convert`. Now whenever you click the "Sync from Parent" button in the app's settings panel, it'll automatically pull in the latest updates from this fork.

### Step 4 — Tag things you add

If you add new handlers, put `public contributor = "your-username"` in your handler class. It'll automatically show up in the stats bar and filter buttons for anyone using your fork.

### Fork chains work at any depth

```
p2r3/convert → leothefleo49/convert → your-fork → a-fork-of-your-fork → ...
```

Each fork only needs to sync from its immediate parent. When leothefleo49 syncs from p2r3 and you sync from leothefleo49, you automatically get p2r3's changes too. The Sync Manager shows a status card for every ancestor so you can see how up-to-date you are at every level.

---

## Adding a New File Format (For Developers)

Each supported conversion is a "handler" — a TypeScript file in `src/handlers/`. Here's the bare minimum skeleton:

```ts
// src/handlers/myFormat.ts
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

class myFormatHandler implements FormatHandler {
  public name = "myFormat";
  public contributor = "your-username";  // shows up in stats bar + filter buttons
  public ready = true;

  public supportedFormats: FileFormat[] = [
    {
      name: "My Cool Format",
      format: "myformat",
      extension: "mfmt",
      mime: "application/x-myformat",
      from: true,   // can be used as input
      to: true,     // can be used as output
      internal: "myformat",
      category: "data",
      lossless: true
    }
  ];

  async init() { this.ready = true; }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => ({
      name: file.name.replace(/\.[^.]+$/, "") + ".mfmt",
      bytes: file.bytes  // ← replace with your actual conversion logic
    }));
  }
}

export default myFormatHandler;
```

Then register it in `src/handlers/index.ts`:

```ts
await load("myFormat", async () => new (await import("./myFormat.ts")).default());
```

For full details on the handler API, see the comments in [src/FormatHandler.ts](src/FormatHandler.ts). Existing handlers in `src/handlers/` are also great examples to copy from.

**Adding npm packages:** just run `npm install package-name` like normal.

---

## Self-Hosting with Docker

If you want to put this on your own server so anyone can access it:

```bash
# From the repository root:
docker compose -f docker/docker-compose.yml up -d
```

Access it at `http://localhost:8080/convert/`

To build from your local source code instead of the prebuilt image:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml up --build -d
```

The first build is slow (it installs Chromium for the format cache generator). Later builds are fast due to Docker layer caching.

---

## Troubleshooting

**`npm install` fails or says it can't find npm**
Make sure Node.js is installed (v18 or newer). Run `node --version` to check. If not installed, go to https://nodejs.org.

**Format dropdowns are empty or the page says "loading"**
This is normal on first run — it's building the internal format list. Wait up to 60 seconds and look for a "Built initial format list" message at the bottom of the page. After that, every future load is instant.

**A conversion fails or produces a weird file**
Some edge cases exist. If something converts but looks wrong (corrupted, wrong format, garbled content), that's worth reporting as a bug. If it just says "no route found", that particular conversion path may genuinely not exist yet.

**`npm run dev` says port already in use**
Another process is using port 5182. Either stop that process or change the port in `package.json` by editing `--port 5182` to a different number.

---

## License

GPL-2.0 — same as the original. See [LICENSE](LICENSE).

Original project: [p2r3/convert](https://github.com/p2r3/convert) by p2r3  
This fork: [leothefleo49/convert](https://github.com/leothefleo49/convert) by leothefleo49
