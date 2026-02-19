# Proposed New Conversions

A comprehensive list of new format conversions to add to the project, organized by category.

---

## 3D Models & Mesh Formats

### Import (From) → Export (To) via Three.js Loaders/Exporters

| Format | Extension | Description | Direction |
|--------|-----------|-------------|-----------|
| OBJ (Wavefront) | .obj | Universal mesh format | From & To |
| MTL (Material Library) | .mtl | OBJ material companion | From |
| FBX | .fbx | Autodesk exchange format | From |
| STL (Stereolithography) | .stl | 3D printing standard | From & To |
| PLY (Polygon) | .ply | Stanford triangle format | From |
| COLLADA | .dae | XML-based 3D format | From |
| USDZ | .usdz | Apple AR format | From & To |
| 3DS (3D Studio) | .3ds | Legacy Autodesk format | From |
| AMF (Additive Manufacturing) | .amf | 3D printing XML format | From |
| VRML | .wrl | Virtual Reality Modeling Language | From |
| X3D | .x3d | VRML successor | From |
| OFF (Object File Format) | .off | Simple polygon format | From |
| glTF (JSON) | .gltf | GL Transmission Format (text) | From & To |
| GLB (Binary glTF) | .glb | GL Transmission Format (binary) | From & To (already exists partially) |
| DRC (Draco) | .drc | Google compressed mesh | From & To |
| VOX (MagicaVoxel) | .vox | Voxel model format | From |
| Point Cloud (PCD) | .pcd | Point Cloud Data | From |
| Point Cloud (XYZ) | .xyz | Simple point cloud | From |
| SVG → 3D extrusion | .svg | Extrude 2D paths to 3D | From |

### 3D Printing Specific

| Conversion | Description |
|------------|-------------|
| STL ↔ OBJ | Standard mesh interchange |
| STL → 3MF | Modern 3D print format |
| 3MF → STL | Extract mesh from 3MF archive |
| OBJ → STL | Prepare model for printing |
| GLB → STL | glTF to printable mesh |
| PLY → STL | Point cloud/mesh to printable |
| AMF → STL | Additive manufacturing to standard |
| STL → PLY | Add vertex colors |
| Any 3D → thumbnail render (PNG/JPEG) | Visual preview of model |

### CAD & Engineering

| Format | Extension | Description | How |
|--------|-----------|-------------|-----|
| DXF | .dxf | AutoCAD exchange format | dxf-parser → SVG/JSON |
| STEP | .step/.stp | ISO CAD standard | opencascade.js (WASM) → GLB |
| IGES | .iges/.igs | Legacy CAD interchange | opencascade.js → GLB |
| STL (from STEP) | .stl | Tessellated CAD output | opencascade.js |
| SVG (from DXF) | .svg | 2D CAD to vector | dxf-parser |
| BREP | .brep | Boundary representation | opencascade.js |

---

## Code & Programming Language Conversions

### Web Development

| Conversion | Description | Library |
|------------|-------------|---------|
| TypeScript → JavaScript | TS transpilation | typescript compiler API |
| TSX → JavaScript | React TypeScript transpilation | typescript + babel |
| JSX → JavaScript | React transpilation | babel-standalone |
| SCSS → CSS | Sass preprocessing | sass.js (Dart Sass WASM) |
| SASS → CSS | Indented Sass syntax | sass.js |
| LESS → CSS | Less preprocessing | less.js |
| Stylus → CSS | Stylus preprocessing | stylus.js |
| Pug/Jade → HTML | Template to HTML | pug.js |
| Haml → HTML | Template to HTML | haml parser |
| EJS → HTML | Embedded JS templates | ejs.js |
| Handlebars → HTML | Template to HTML | handlebars.js |
| CoffeeScript → JavaScript | CS transpilation | coffeescript compiler |
| Elm → JavaScript | Elm compilation | elm compiler |
| PostCSS processing | CSS transforms | postcss |
| Tailwind classes → vanilla CSS | Utility to standard CSS | tailwind standalone |

### Data & Config Formats

| Conversion | Description | Library |
|------------|-------------|---------|
| TOML ↔ JSON | Config interchange | @iarna/toml |
| TOML ↔ YAML | Config interchange | @iarna/toml + yaml |
| INI ↔ JSON | Config interchange | ini parser |
| .env ↔ JSON | Environment vars to structured data | Simple parser |
| .properties ↔ JSON | Java properties to JSON | Simple parser |
| HCL → JSON | HashiCorp config (Terraform) | hcl parser |
| Protobuf (.proto) → JSON Schema | Schema conversion | protobuf.js |
| JSON Schema → TypeScript interfaces | Type generation | json-to-ts / quicktype |
| JSON → TypeScript types | Type inference | quicktype |
| GraphQL Schema → TypeScript | Type generation | graphql-codegen |
| OpenAPI/Swagger YAML ↔ JSON | API spec interchange | yaml + json |
| XML Schema (XSD) → TypeScript | Type generation | Parser |
| CSV → JSON/XML/YAML | Already exists, extend | Existing handlers |
| MessagePack ↔ JSON | Binary serialization | msgpack-lite |
| BSON ↔ JSON | MongoDB binary format | bson parser |
| CBOR ↔ JSON | Concise binary encoding | cbor-js |

### Niche & Game Development Languages

| Conversion | Description | How |
|------------|-------------|-----|
| GDScript → Python-like readable | Godot script formatting | Parser/formatter |
| Lua → formatted Lua | Lua beautifier | lua-fmt |
| Lua 5.1 ↔ Lua 5.4 syntax hints | Lua version migration | AST transform |
| GML (GameMaker Language) → readable/formatted | GameMaker script | Formatter |
| Haxe → JavaScript | Cross-platform game lang | haxe-js compiler |
| HLSL → GLSL | DirectX → OpenGL shaders | shader translator |
| GLSL → HLSL | OpenGL → DirectX shaders | shader translator |
| WGSL ↔ GLSL | WebGPU ↔ OpenGL shaders | naga/tint-based tools |
| ShaderLab → GLSL | Unity shaders | Parser |
| Unreal Material → GLSL/HLSL | UE material nodes | Parser |
| AngelScript → formatted | Game scripting language | Formatter |
| Squirrel → formatted | Game scripting (Valve) | Formatter |
| MoonScript → Lua | CoffeeScript-like for Lua | moonscript compiler |
| Teal → Lua | Typed Lua | teal compiler |
| Fennel → Lua | Lisp-like Lua | fennel compiler |
| Wren → formatted | Game scripting language | Formatter |
| ChaiScript → formatted | C++-embedded scripting | Formatter |
| Visual Scripting JSON → GDScript | Godot visual→text | Converter |
| Blueprint → C++ pseudocode | Unreal visual scripting | Parser |
| Scratch (SB3) → Python | Block code to text code | Converter |
| Scratch (SB3) → JavaScript | Block code to text code | Converter |
| Blockly JSON → Python/JS | Block-based code | Converter |

### Systems & General Programming

| Conversion | Description | How |
|------------|-------------|-----|
| Rust → formatted | Beautifier | rustfmt-wasm or formatter |
| C → formatted | Beautifier | clang-format-wasm |
| C++ → formatted | Beautifier | clang-format-wasm |
| Python 2 → Python 3 | Migration hints | AST-based rewriter |
| Assembly (x86) → readable annotated | Add comments/labels | Disassembly annotator |
| WebAssembly Text (.wat) ↔ WASM (.wasm) | Text ↔ binary WASM | wabt.js |
| Markdown → code blocks extraction | Pull code from docs | Parser |
| Jupyter Notebook (.ipynb) → Python (.py) | Extract code cells | JSON parser |
| Jupyter Notebook (.ipynb) → Markdown | Notebook to doc | JSON parser |
| Python (.py) → Jupyter Notebook (.ipynb) | Script to notebook | JSON builder |
| R Markdown (.Rmd) → Markdown | Remove R chunks / keep output | Parser |
| Swift → formatted | Beautifier | Formatter |
| Kotlin → formatted | Beautifier | Formatter |
| Go → formatted | Beautifier | Formatter |
| Dart → formatted | Beautifier | Formatter |
| Zig → formatted | Beautifier | Formatter |
| Nim → formatted | Beautifier | Formatter |
| Odin → formatted | Gamedev language | Formatter |
| V → formatted | Simple systems lang | Formatter |
| Carbon → formatted | Google's C++ successor | Formatter |
| Mojo → formatted | Python superset for AI | Formatter |

### Minification & Obfuscation

| Conversion | Description | How |
|------------|-------------|-----|
| JavaScript → minified JS | Minification | terser |
| CSS → minified CSS | Minification | csso / clean-css |
| HTML → minified HTML | Minification | html-minifier |
| JavaScript → obfuscated JS | Obfuscation | javascript-obfuscator |
| JSON → minified JSON | Remove whitespace | JSON.stringify |
| JSON → prettified JSON | Add indentation | JSON.stringify(,null,2) |
| SQL → formatted SQL | SQL beautifier | sql-formatter |
| XML → prettified XML | XML formatter | Parser |

---

## Language Translation (Natural Language)

### Architecture
Use a **pluggable translation engine** approach so the community can easily add new languages. Possible backends:
- **LibreTranslate API** (open source, self-hostable)
- **Argos Translate** (offline, open source, Python-based models)
- **Bergamot** (Mozilla's client-side translation, runs in browser via WASM)
- **OpenAI / local LLM API** (optional, user-provided API key)

### Core Languages (Tier 1 — ship with these)

| # | Language | Code | Script |
|---|----------|------|--------|
| 1 | English | en | Latin |
| 2 | Spanish | es | Latin |
| 3 | French | fr | Latin |
| 4 | German | de | Latin |
| 5 | Italian | it | Latin |
| 6 | Portuguese | pt | Latin |
| 7 | Dutch | nl | Latin |
| 8 | Russian | ru | Cyrillic |
| 9 | Chinese (Simplified) | zh | Hanzi |
| 10 | Chinese (Traditional) | zh-TW | Hanzi |
| 11 | Japanese | ja | Kanji/Kana |
| 12 | Korean | ko | Hangul |
| 13 | Arabic | ar | Arabic |
| 14 | Hindi | hi | Devanagari |
| 15 | Turkish | tr | Latin |
| 16 | Polish | pl | Latin |
| 17 | Ukrainian | uk | Cyrillic |
| 18 | Vietnamese | vi | Latin |
| 19 | Thai | th | Thai |
| 20 | Indonesian | id | Latin |

### Extended Languages (Tier 2 — community can add easily)

| # | Language | Code |
|---|----------|------|
| 21 | Czech | cs |
| 22 | Romanian | ro |
| 23 | Hungarian | hu |
| 24 | Greek | el |
| 25 | Swedish | sv |
| 26 | Norwegian | no |
| 27 | Danish | da |
| 28 | Finnish | fi |
| 29 | Hebrew | he |
| 30 | Bengali | bn |
| 31 | Tamil | ta |
| 32 | Telugu | te |
| 33 | Urdu | ur |
| 34 | Persian (Farsi) | fa |
| 35 | Malay | ms |
| 36 | Tagalog/Filipino | tl |
| 37 | Swahili | sw |
| 38 | Catalan | ca |
| 39 | Croatian | hr |
| 40 | Serbian | sr |
| 41 | Slovak | sk |
| 42 | Bulgarian | bg |
| 43 | Lithuanian | lt |
| 44 | Latvian | lv |
| 45 | Estonian | et |
| 46 | Slovenian | sl |
| 47 | Icelandic | is |
| 48 | Irish (Gaeilge) | ga |
| 49 | Welsh | cy |
| 50 | Basque | eu |
| 51 | Galician | gl |
| 52 | Maltese | mt |
| 53 | Albanian | sq |
| 54 | Macedonian | mk |
| 55 | Bosnian | bs |
| 56 | Georgian | ka |
| 57 | Armenian | hy |
| 58 | Azerbaijani | az |
| 59 | Kazakh | kk |
| 60 | Uzbek | uz |
| 61 | Mongolian | mn |
| 62 | Nepali | ne |
| 63 | Sinhala | si |
| 64 | Burmese | my |
| 65 | Khmer | km |
| 66 | Lao | lo |
| 67 | Amharic | am |
| 68 | Yoruba | yo |
| 69 | Igbo | ig |
| 70 | Zulu | zu |
| 71 | Hausa | ha |
| 72 | Somali | so |
| 73 | Afrikaans | af |
| 74 | Maori | mi |
| 75 | Hawaiian | haw |
| 76 | Samoan | sm |
| 77 | Esperanto | eo |
| 78 | Latin | la |
| 79 | Sanskrit | sa |
| 80 | Pashto | ps |
| 81 | Kurdish | ku |
| 82 | Sindhi | sd |
| 83 | Punjabi | pa |
| 84 | Gujarati | gu |
| 85 | Marathi | mr |
| 86 | Kannada | kn |
| 87 | Malayalam | ml |
| 88 | Odia | or |
| 89 | Assamese | as |
| 90 | Tibetan | bo |
| 91 | Uyghur | ug |
| 92 | Javanese | jv |
| 93 | Sundanese | su |
| 94 | Cebuano | ceb |
| 95 | Hmong | hmn |
| 96 | Haitian Creole | ht |
| 97 | Luxembourgish | lb |
| 98 | Scots Gaelic | gd |
| 99 | Corsican | co |
| 100 | Frisian | fy |

### How to Make It Expandable to Hundreds of Languages
- Define a `TranslationProvider` interface that any backend can implement
- Store language definitions in a simple JSON config file (`languages.json`)
- Each language entry only needs: `{ code, name, nativeName, script, direction }`
- Adding a new language = one line in the JSON + the translation model/API supporting it
- Bergamot (Mozilla) already supports 18+ language pairs client-side
- LibreTranslate supports 30+ and is self-hostable
- Community can contribute new language pairs as separate model downloads

### Implementation Format
- Input: `.txt`, `.md`, `.html`, `.docx`, `.srt`, `.json` files containing text
- Output: Same format, translated
- MIME type: `text/plain` with language tag (e.g., `text/plain; lang=es`)
- Each translation direction = a conversion path (e.g., `text-en` → `text-es`)

---

## Gaming & Modding File Types

### Source Engine (Half-Life 2, CS:GO, CS2, TF2, Garry's Mod, Portal 1/2, L4D2)

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| VPK (Valve Pack) | .vpk | Game asset archive | → ZIP (extract) |
| BSP (Binary Space Partition) | .bsp | Map file | → OBJ/GLB (geometry), → JSON (entities) |
| VMT (Valve Material Type) | .vmt | Material definition (text-based) | ↔ JSON |
| VMF (Valve Map Format) | .vmf | Map source file (text) | → JSON, → OBJ (brushes) |
| VTF (Valve Texture Format) | .vtf | Texture file | → PNG/JPEG (already exists!) |
| MDL/VTX/VVD | .mdl | Source model | → GLB/OBJ |
| PCF (Particle) | .pcf | Particle system | → JSON |
| DMX (Data Model) | .dmx | Generic data format | → JSON |
| NAV (Navigation) | .nav | Bot navigation mesh | → JSON, → OBJ |
| GMA (Garry's Mod Addon) | .gma | Addon package | → ZIP |
| FGD (Forge Game Data) | .fgd | Entity definitions | → JSON |

### Bethesda Games (Skyrim, Fallout, Oblivion, Morrowind, Starfield)

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| NIF (NetImmerse File) | .nif | 3D mesh format | → GLB/OBJ |
| BSA (Bethesda Softworks Archive) | .bsa | Asset archive | → ZIP |
| BA2 | .ba2 | Fallout 4/Starfield archive | → ZIP |
| ESP/ESM/ESL | .esp/.esm/.esl | Plugin files | → JSON (record dump) |
| DDS (DirectDraw Surface) | .dds | Texture format | → PNG/JPEG |
| HKX (Havok) | .hkx | Animation data | → JSON |
| NIF → STL | .nif | For 3D printing game models | → STL |
| FUZ (Lip/Voice) | .fuz | Voice + lip sync | → WAV (audio extraction) |
| PSC (Papyrus Script) | .psc | Skyrim scripting | → formatted/annotated text |
| PEX (Compiled Papyrus) | .pex | Compiled scripts | → PSC (decompile) |
| STRINGS | .strings | Localization files | → JSON/CSV |

### Minecraft

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| MCWorld | .mcworld | Bedrock world export | → ZIP (it IS a zip) |
| MCPack | .mcpack | Bedrock resource pack | → ZIP |
| MCTemplate | .mctemplate | Bedrock world template | → ZIP |
| MCAddon | .mcaddon | Bedrock addon bundle | → ZIP |
| Schematic | .schematic | Legacy structure format | → JSON, → NBT, → GLB (render) |
| Schem (Sponge) | .schem | Modern structure format | → JSON, → NBT |
| Litematic | .litematic | Litematica structure | → JSON, → Schematic |
| NBT | .nbt/.dat | Named Binary Tag | ↔ JSON (already exists!) |
| Region file | .mca/.mcr | World chunk data | → JSON (chunk dump) |
| Resource Pack | .zip | Java resource pack | → Bedrock MCPack |
| .lang | .lang | Legacy localization | ↔ JSON |
| Structure Block NBT | .nbt | Structure block saves | → Schematic, → GLB |

### Unreal Engine

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| UAsset | .uasset | Unreal asset | → JSON (metadata) |
| UMap | .umap | Unreal map | → JSON (metadata) |
| PAK | .pak | Unreal archive | → ZIP (extract) |
| UMESH | .umesh | Unreal mesh | → GLB/OBJ |
| Blueprint | — | Visual scripting | → C++ pseudocode |

### Unity

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| UnityPackage | .unitypackage | Unity asset package | → ZIP |
| AssetBundle | .unity3d | Bundled assets | → extracted files |
| YAML Scene | .unity | Unity scene files | → JSON |
| AnimationClip | .anim | Unity animation | → JSON |
| Prefab | .prefab | Unity prefab (YAML) | → JSON |

### Godot Engine

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| TSCN | .tscn | Godot scene (text) | ↔ JSON |
| TRES | .tres | Godot resource (text) | ↔ JSON |
| GDScript | .gd | Godot scripting | → Python-like, → formatted |
| PCK | .pck | Godot pack file | → ZIP |
| Import | .import | Import metadata | → JSON |

### id Tech / Doom / Quake

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| WAD | .wad | Doom asset archive | → ZIP, → extract PNGs |
| PAK | .pak | Quake archive | → ZIP |
| BSP (id Tech) | .bsp | Quake/Doom 3 maps | → OBJ |
| MD2/MD3/MD5 | .md2/.md3/.md5 | Quake model formats | → GLB/OBJ |
| MAP | .map | Quake map source (text) | → JSON |

### Other Games

| Format | Game | Extension | Conversion |
|--------|------|-----------|------------|
| SB3 | Scratch | .sb3 | → HTML (already exists!), → JPEG/PNG |
| BSOR | Beat Saber | .bsor | → PNG/JSON (already exists!) |
| DEM | Portal 2 | .dem | → PNG/JSON (already exists!) |
| OSZ | osu! | .osz | → ZIP (already exists!) |
| OSK | osu! | .osk | → ZIP (already exists!) |
| OSR | osu! | .osr | → JSON (replay data) |
| OSB | osu! | .osb | → JSON (storyboard) |
| RPY | Ren'Py | .rpy | → formatted text |
| RPYC | Ren'Py | .rpyc | → RPY (decompile) |
| LOVE | LÖVE2D | .love | → ZIP (already exists!) |
| SM/SSC | StepMania | .sm/.ssc | ↔ JSON |
| CHART | Clone Hero/GH | .chart | ↔ JSON, → MIDI |
| PKG | Various | .pkg | → ZIP |
| VOX | MagicaVoxel | .vox | → GLB/OBJ/STL |
| BLEND | Blender | .blend | → JSON (metadata) |
| KRA | Krita | .kra | → PNG (flatten), → ZIP |
| ORA | OpenRaster | .ora | → PNG (flatten), → ZIP |
| ASE/ASEPRITE | Aseprite | .ase/.aseprite | → PNG, → GIF, → spritesheet |
| LDRAW | LEGO Digital | .ldr/.dat | → GLB/OBJ |
| CSG | Constructive Solid Geometry | .csg | → STL/OBJ |
| MAP | Trenchbroom | .map | → OBJ, → JSON |
| TMOD | Terraria | .tmod | → ZIP |
| RRES | Roblox | .rbxm/.rbxl | → JSON |

---

## Archive & Compression Formats

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| RAR | .rar | WinRAR archive | → ZIP |
| 7z | .7z | 7-Zip archive | → ZIP |
| TAR | .tar | Tape archive | → ZIP |
| TAR.GZ / TGZ | .tar.gz/.tgz | Gzipped tar | → ZIP |
| TAR.BZ2 | .tar.bz2 | Bzip2 tar | → ZIP |
| TAR.XZ | .tar.xz | XZ-compressed tar | → ZIP |
| TAR.ZST | .tar.zst | Zstandard tar | → ZIP |
| GZ (single file) | .gz | Gzip compressed | → original file |
| BZ2 (single file) | .bz2 | Bzip2 compressed | → original file |
| XZ (single file) | .xz | XZ compressed | → original file |
| ZSTD | .zst | Zstandard compressed | → original file |
| CAB | .cab | Windows Cabinet | → ZIP |
| ISO | .iso | Disc image | → ZIP |
| IMG | .img | Disk image | → ZIP / → ISO |
| DMG | .dmg | macOS disk image | → ZIP |
| DEB | .deb | Debian package | → ZIP (extract) |
| RPM | .rpm | Red Hat package | → ZIP (extract) |
| AppImage | .appimage | Linux portable app | → ZIP (extract) |
| CPIO | .cpio | Unix archive | → ZIP |
| ARJ | .arj | Legacy archive | → ZIP |
| ACE | .ace | WinACE archive | → ZIP |
| LZMA | .lzma | LZMA compressed | → original file |
| ZIP → 7z | .zip | Repack | → .7z |
| ZIP → TAR.GZ | .zip | Repack | → .tar.gz |

---

## Font Formats

| Conversion | Description | Library |
|------------|-------------|---------|
| TTF → WOFF | TrueType to Web Open Font | wawoff |
| TTF → WOFF2 | TrueType to compressed web font | wawoff2 |
| WOFF → TTF | Web font to TrueType | wawoff |
| WOFF2 → TTF | Compressed web font to TrueType | wawoff2 |
| OTF → TTF | OpenType to TrueType | opentype.js |
| TTF → OTF | TrueType to OpenType | opentype.js |
| OTF → WOFF/WOFF2 | OpenType to web fonts | opentype.js + wawoff2 |
| SVG font → TTF | SVG font to TrueType | svg2ttf |
| TTF → SVG font | TrueType to SVG font | ttf2svg |
| TTF → EOT | TrueType to Embedded OpenType | ttf2eot |
| BDF → TTF | Bitmap font to TrueType | bdf2ttf |
| PCF → BDF | X11 font to BDF | pcf2bdf |
| BMFont → PNG + JSON | Bitmap font atlas | BMFont parser |

---

## Ebook & Publishing

| Conversion | Description | How |
|------------|-------------|-----|
| EPUB → PDF | Ebook to print format | Pandoc or custom renderer |
| EPUB → HTML | Ebook to web page | Extract + combine chapters |
| EPUB → TXT | Ebook to plain text | Extract text content |
| EPUB → MOBI | Ebook for Kindle | kindlegen-equivalent |
| MOBI → EPUB | Kindle to standard | Parser |
| AZW3 → EPUB | Kindle format to standard | Parser |
| CBZ → PDF | Comic archive to PDF | Extract images → combine |
| CBR → PDF | RAR comic archive to PDF | Extract images → combine |
| CBZ ↔ CBR | Comic archive repack | Extract + repack |
| FB2 → EPUB | FictionBook to EPUB | Pandoc |
| DJVU → PDF | DjVu document to PDF | djvu.js |
| PDF → EPUB | Print to ebook | Reflow content |
| Markdown → EPUB | Write → ebook | Pandoc |
| HTML → EPUB | Web to ebook | Package as EPUB |

---

## Spreadsheet & Database

| Conversion | Description | How |
|------------|-------------|-----|
| XLSX → CSV | Excel to CSV | SheetJS (xlsx) |
| XLSX → JSON | Excel to JSON | SheetJS |
| XLSX → HTML table | Excel to web | SheetJS |
| CSV → XLSX | CSV to Excel | SheetJS |
| ODS → CSV/XLSX | LibreOffice Calc | SheetJS |
| TSV ↔ CSV | Tab-separated ↔ comma-separated | Simple parser |
| SQLite → JSON | Database to JSON | Already partially exists |
| SQLite → XLSX | Database to Excel | sql.js + SheetJS |
| JSON → SQLite | Structured data to DB | sql.js |
| Parquet → CSV/JSON | Columnar data format | parquet-wasm |
| Apache Arrow → CSV/JSON | In-memory analytics | arrow-js |

---

## Subtitle & Caption Formats

| Conversion | Description |
|------------|-------------|
| SRT ↔ VTT | SubRip ↔ WebVTT |
| SRT ↔ ASS/SSA | SubRip ↔ Advanced SubStation |
| SRT → TXT | Extract plain text from subtitles |
| VTT → SRT | WebVTT to SubRip |
| SUB/IDX → SRT | VobSub to text subtitles |
| SRT ↔ JSON | Structured subtitle data |
| SBV → SRT | YouTube captions to SubRip |
| DFXP/TTML → SRT | Broadcast captions to SubRip |
| LRC → SRT | Lyrics to subtitles |
| SRT → LRC | Subtitles to synced lyrics |

---

## GIS & Map Formats

| Conversion | Description | How |
|------------|-------------|-----|
| GeoJSON ↔ KML | Web geo ↔ Google Earth | Parser |
| GeoJSON ↔ GPX | Web geo ↔ GPS exchange | Parser |
| Shapefile (.shp) → GeoJSON | ESRI format to web | shp.js |
| TopoJSON ↔ GeoJSON | Compressed ↔ standard | topojson library |
| KML → GPX | Google Earth → GPS | Parser |
| OSM (OpenStreetMap) → GeoJSON | OSM data extract | osmtogeojson |
| GeoJSON → SVG | Map data to vector image | d3-geo |
| WKT ↔ GeoJSON | Well-Known Text ↔ JSON | wellknown.js |
| CSV (lat/lon) → GeoJSON | Tabular → geographic | Parser |

---

## Scientific & Data Formats

| Conversion | Description | How |
|------------|-------------|-----|
| HDF5 → JSON/CSV | Scientific data containers | h5wasm |
| NetCDF → JSON/CSV | Climate/science data | netcdf parser |
| FITS → PNG/JSON | Astronomy images/data | fitsjs |
| DICOM → PNG/JPEG | Medical imaging | dicom-parser |
| NIfTI → PNG slices | Neuroimaging | nifti-reader-js |
| MAT (MATLAB) → JSON | MATLAB data files | mat parser |
| NPY/NPZ → JSON | NumPy arrays | Parser |

---

## Music Production (Extending Existing)

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| MIDI | .mid | Musical notation | ↔ JSON, → WAV (synthesis), → sheet music PNG |
| ALS | .als | Ableton Live Set | → XML (already exists!) |
| FLP | .flp | FL Studio Project | → JSON (already exists!) |
| MusicXML | .musicxml | Sheet music standard | ↔ MIDI, → PDF/PNG/SVG |
| ABC Notation | .abc | Text music notation | → MIDI, → SVG (sheet) |
| LilyPond | .ly | Typesetting music | → PDF/SVG |
| Guitar Pro | .gp/.gp5/.gpx | Guitar tablature | → MIDI, → JSON |
| SoundFont | .sf2/.sf3 | Instrument samples | → JSON (metadata) |
| SFZ | .sfz | Sampler format (text) | ↔ JSON |
| Tracker → WAV | .mod/.xm/.it/.s3m | Tracker modules | → WAV (already via libopenmpt!) |

---

## Image Formats (Gaps in Current)

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| AVIF | .avif | AV1 Image Format | ↔ PNG/JPEG/WEBP |
| HEIC/HEIF | .heic/.heif | Apple photo format | → PNG/JPEG |
| JXL (JPEG XL) | .jxl | Next-gen JPEG | ↔ PNG/JPEG |
| RAW (various) | .cr2/.nef/.arw/.dng | Camera raw photos | → PNG/JPEG/TIFF |
| ICO | .ico | Windows icon | ↔ PNG |
| CUR | .cur | Windows cursor | ↔ PNG |
| ICNS | .icns | macOS icon | → PNG |
| TGA | .tga | Targa image (game textures) | ↔ PNG |
| EXR (OpenEXR) | .exr | HDR image format | → PNG/JPEG (tone mapped) |
| HDR (Radiance) | .hdr | HDR environment map | → PNG/JPEG, → EXR |
| PSD | .psd | Photoshop document | → PNG (flattened) |
| XCF | .xcf | GIMP native format | → PNG |
| PCX | .pcx | Legacy PC image | → PNG |
| Spritesheet | .png | Multiple sprites | → individual PNG frames |
| Individual PNGs | .png | Multiple images | → Spritesheet PNG |
| Image → Base64 string | any image | Data URI | → text |
| Base64 → Image | text | Data URI decode | → PNG/JPEG |

---

## Video (Gaps)

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| WEBM → GIF | .webm | Web video to animated image | FFmpeg |
| GIF → WEBM/MP4 | .gif | Animated image to video | FFmpeg |
| Video → frames (PNGs) | any video | Extract all frames | FFmpeg frame extraction |
| Frames → Video | .png sequence | Image sequence to video | FFmpeg |
| Video → Audio only | any video | Extract audio track | FFmpeg (already possible) |
| APNG ↔ GIF | .apng | Animated PNG | FFmpeg/canvas |
| Lottie (.json) → GIF/WEBM/APNG | .json | Animation format | lottie-web renderer |
| SVG animation → GIF | .svg | Animated SVG | Renderer |
| Screen recording → GIF | .webm | Dev tool | FFmpeg |

---

## Encoding & Cryptography

| Conversion | Description |
|------------|-------------|
| Base64 ↔ Binary | Encode/decode |
| Base32 ↔ Binary | Encode/decode |
| Hex ↔ Binary | Encode/decode |
| URL encoding ↔ Plain text | Encode/decode |
| HTML entities ↔ Plain text | Encode/decode |
| ROT13 ↔ Plain text | Simple cipher |
| Morse code ↔ Plain text | Encode/decode |
| Braille ↔ Plain text | Accessibility |
| Binary (0s and 1s) ↔ Text | Encode/decode |
| QR Code → PNG/SVG | Generate QR codes from text |
| Barcode → PNG/SVG | Generate barcodes from text |
| PNG/image → QR Code decode | Read QR codes |
| JWT decode → JSON | Parse JWT tokens |
| PEM ↔ DER | Certificate format conversion |
| Hash generation (MD5/SHA) | File → hash text |

---

## Accessibility

| Conversion | Description | How |
|------------|-------------|-----|
| Image → Alt text | AI-generated descriptions | Optional AI backend |
| PDF → accessible PDF (tagged) | Add accessibility tags | PDF manipulation |
| Audio → transcript (text) | Speech-to-text | Whisper.cpp WASM or API |
| Text → Audio (TTS) | Already exists via espeak-ng! | Extend with more voices |
| Braille → Text | Decode braille characters | Unicode mapping |
| Sign language GIF → description | Accessibility tool | AI-based |

---

## Summary — Total New Formats

| Category | Approximate New Formats |
|----------|------------------------|
| 3D Models & Mesh | ~25 formats |
| 3D Printing / CAD | ~15 conversions |
| Code & Programming | ~60+ conversions |
| Language Translation | 100 languages (10,000+ pairs) |
| Gaming / Modding | ~80+ formats across 10+ game engines |
| Archives | ~25 formats |
| Fonts | ~12 conversions |
| Ebooks | ~15 conversions |
| Spreadsheets & DB | ~12 conversions |
| Subtitles | ~12 conversions |
| GIS / Maps | ~10 conversions |
| Scientific | ~8 formats |
| Music Production | ~10 formats |
| Images (gaps) | ~15 formats |
| Video (gaps) | ~10 conversions |
| Encoding / Crypto | ~15 conversions |
| Accessibility | ~6 conversions |

**Grand total: ~300+ new format conversions**

---

## Robotics & IoT Data

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| ROS Bag | .bag / .db3 | Robot Operating System recorded data | → CSV, → JSON, → MP4 (video topics) |
| ROS Bag v2 | .bag | ROS1 bag files | → ROS2 .db3, → CSV |
| URDF | .urdf | Unified Robot Description Format (XML) | ↔ JSON, → GLB (3D visualization) |
| SDF (Simulation Description) | .sdf | Gazebo/Ignition world format | ↔ JSON, → URDF |
| XACRO | .xacro | URDF macro format | → URDF (expand macros) |
| PCD (Point Cloud Data) | .pcd | LiDAR/3D scanner output | → PLY, → GLB, → CSV (XYZ) |
| LAS/LAZ | .las/.laz | LiDAR point cloud standard | → PCD, → PLY, → CSV |
| E57 | .e57 | 3D scanning interchange | → PCD, → PLY |
| G-code | .gcode | CNC/3D printer instructions | → JSON (parsed), → 3D path GLB |
| STEP-NC | .stpnc | CNC machining data | → G-code, → JSON |
| RoboDK | .rdk | Robot simulation | → JSON, → URDF |
| Firmware HEX | .hex | Intel HEX microcontroller firmware | ↔ BIN (binary) |
| Firmware S-record | .srec/.s19 | Motorola S-record firmware | ↔ BIN, ↔ HEX |
| ELF | .elf | Executable and Linkable Format | → BIN, → disassembly text |
| UF2 | .uf2 | USB Flashing Format (Raspberry Pi Pico etc.) | ↔ HEX, ↔ BIN |
| DFU | .dfu | Device Firmware Update | ↔ BIN |
| CAN DBC | .dbc | CAN bus database | ↔ JSON |
| CAN BLF | .blf | CAN bus log | → CSV, → JSON |
| MDF (Measurement Data) | .mdf/.mf4 | ASAM MDF vehicle data | → CSV, → JSON, → Parquet |

---

## Measurements, Units & Unit Conversions

### Architecture
A universal unit converter that works on data files or standalone values. Input a CSV/JSON with measurements, output the same file with converted units.

| Category | Conversions |
|----------|-------------|
| **Length** | mm ↔ cm ↔ m ↔ km ↔ in ↔ ft ↔ yd ↔ mi ↔ nm (nautical) ↔ μm ↔ nm (nano) ↔ Å ↔ light-year ↔ parsec ↔ au |
| **Mass** | mg ↔ g ↔ kg ↔ tonne ↔ oz ↔ lb ↔ stone ↔ short ton ↔ long ton ↔ grain ↔ carat ↔ slug ↔ atomic mass unit |
| **Temperature** | °C ↔ °F ↔ K ↔ °R (Rankine) ↔ °De (Delisle) |
| **Volume** | mL ↔ L ↔ m³ ↔ gal (US) ↔ gal (UK) ↔ qt ↔ pt ↔ cup ↔ fl oz ↔ tbsp ↔ tsp ↔ bbl (barrel) ↔ cc |
| **Area** | mm² ↔ cm² ↔ m² ↔ km² ↔ in² ↔ ft² ↔ yd² ↔ acre ↔ hectare ↔ mi² |
| **Speed** | m/s ↔ km/h ↔ mph ↔ knot ↔ ft/s ↔ mach ↔ c (speed of light) |
| **Pressure** | Pa ↔ kPa ↔ MPa ↔ bar ↔ mbar ↔ atm ↔ psi ↔ mmHg ↔ torr ↔ inHg |
| **Energy** | J ↔ kJ ↔ cal ↔ kcal ↔ Wh ↔ kWh ↔ eV ↔ BTU ↔ ft·lbf ↔ erg |
| **Power** | W ↔ kW ↔ MW ↔ hp ↔ BTU/h ↔ ft·lbf/s |
| **Frequency** | Hz ↔ kHz ↔ MHz ↔ GHz ↔ THz ↔ rpm ↔ rad/s |
| **Data Size** | bit ↔ byte ↔ KB ↔ MB ↔ GB ↔ TB ↔ PB ↔ KiB ↔ MiB ↔ GiB ↔ TiB |
| **Time** | ns ↔ μs ↔ ms ↔ s ↔ min ↔ hr ↔ day ↔ week ↔ month ↔ year ↔ decade ↔ century |
| **Angle** | deg ↔ rad ↔ grad ↔ arcmin ↔ arcsec ↔ turn ↔ mrad |
| **Force** | N ↔ kN ↔ lbf ↔ dyn ↔ kgf ↔ pdl |
| **Torque** | N·m ↔ ft·lbf ↔ in·lbf ↔ kgf·m |
| **Electric** | A ↔ mA ↔ μA ↔ V ↔ mV ↔ kV ↔ Ω ↔ kΩ ↔ MΩ ↔ F ↔ μF ↔ nF ↔ pF ↔ H ↔ mH ↔ μH |
| **Flow Rate** | L/min ↔ L/s ↔ m³/s ↔ gal/min ↔ ft³/s |
| **Density** | kg/m³ ↔ g/cm³ ↔ lb/ft³ ↔ lb/gal |
| **Viscosity** | Pa·s ↔ cP (centipoise) ↔ St (stokes) ↔ cSt |
| **Radiation** | Sv ↔ mSv ↔ μSv ↔ rem ↔ Gy ↔ rad ↔ Bq ↔ Ci |
| **Fuel Economy** | mpg (US) ↔ mpg (UK) ↔ L/100km ↔ km/L |
| **Cooking** | cups ↔ tbsp ↔ tsp ↔ mL ↔ fl oz ↔ dash ↔ pinch |

### File-Based Unit Conversion
- Input: CSV/JSON with a column of measurements (e.g., `{"temp_f": [72, 85, 91]}`)
- Output: Same file with converted column (e.g., `{"temp_c": [22.2, 29.4, 32.8]}`)
- Bulk convert measurement data files between unit systems

---

## Electronics & Sensor Data

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| EagleCAD | .brd / .sch | PCB board & schematic | → JSON, → SVG (board render), → Gerber |
| KiCad PCB | .kicad_pcb | PCB layout | → SVG (board render), → Gerber, → JSON |
| KiCad Schematic | .kicad_sch | Circuit schematic | → SVG, → JSON |
| Gerber | .gbr/.grb | PCB fabrication files | → SVG (layer render), → PNG |
| Gerber Drill | .drl | Drill file | → JSON, → SVG |
| SPICE Netlist | .cir/.spice | Circuit simulation | ↔ JSON |
| EDIF | .edif | Electronic design interchange | → JSON |
| IBIS | .ibs | I/O Buffer Information | → JSON |
| Touchstone/S-parameter | .s1p/.s2p/.snp | RF/microwave measurements | → CSV, → JSON, → chart PNG |
| BSDL | .bsdl | Boundary Scan Description | → JSON |
| JEDEC | .jed | PLD programming file | → BIN, → JSON |
| Verilog | .v | Hardware description language | → formatted, → JSON AST |
| VHDL | .vhd/.vhdl | Hardware description language | → formatted, → JSON AST |
| SystemVerilog | .sv | Enhanced HDL | → formatted |
| Waveform VCD | .vcd | Value Change Dump (logic sim) | → CSV, → JSON, → SVG (waveform plot) |
| Waveform FST | .fst | Fast Signal Trace | → VCD, → CSV |
| Logic Analyzer (Saleae) | .logicdata | Logic analyzer captures | → CSV, → VCD |
| Sigrok | .sr | Open-source logic data | → CSV, → VCD |
| Arduino Sketch | .ino | Arduino code | → C++ (add headers), → formatted |
| PlatformIO Project | platformio.ini | IoT project config | → JSON |
| Oscilloscope CSV | .csv | Scope data export | → chart PNG/SVG, → JSON |
| IMU Data | .csv/.json | Accelerometer/gyro/mag | → 3D orientation GLB, → chart PNG |
| GPS NMEA | .nmea | GPS receiver sentences | → GPX, → GeoJSON, → KML, → CSV |
| RINEX | .obs/.nav | GNSS observation data | → CSV, → JSON |

---

## Graphs, Charts & Statistics

### Chart Generation (Data → Visual)

| Conversion | Description | Library |
|------------|-------------|---------|
| CSV → Bar Chart (PNG/SVG) | Tabular data to bar chart | Chart.js / D3.js |
| CSV → Line Chart (PNG/SVG) | Time series to line graph | Chart.js / D3.js |
| CSV → Pie Chart (PNG/SVG) | Categorical data to pie | Chart.js / D3.js |
| CSV → Scatter Plot (PNG/SVG) | XY data to scatter | D3.js |
| CSV → Heatmap (PNG/SVG) | Matrix data to heatmap | D3.js |
| CSV → Histogram (PNG/SVG) | Distribution visualization | D3.js |
| CSV → Box Plot (PNG/SVG) | Statistical summary | D3.js |
| CSV → Treemap (PNG/SVG) | Hierarchical data | D3.js |
| CSV → Radar Chart (PNG/SVG) | Multi-axis comparison | Chart.js |
| CSV → Sankey Diagram (SVG) | Flow visualization | D3-sankey |
| CSV → Bubble Chart (PNG/SVG) | 3-variable data | D3.js |
| CSV → Candlestick (PNG/SVG) | Financial OHLC data | D3.js / lightweight-charts |
| CSV → Gantt Chart (SVG) | Project timeline | D3.js |
| CSV → Network Graph (SVG) | Node-link relationships | D3-force |
| JSON → any chart type | Structured data charting | Chart.js / D3.js |

### Chart Reverse Engineering (Visual → Data)

| Conversion | Description | How |
|------------|-------------|-----|
| Chart PNG/JPEG → CSV | Extract data from chart images | CV-based chart parser |
| Plot SVG → CSV | Parse SVG paths/points to data | SVG parser |

### Statistics File Formats

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| SPSS | .sav/.zsav | Statistical analysis data | → CSV, → JSON, → XLSX |
| Stata | .dta | Stata data file | → CSV, → JSON |
| SAS | .sas7bdat | SAS data file | → CSV, → JSON |
| R Data | .rds/.rda/.RData | R statistical data | → CSV, → JSON |
| Parquet | .parquet | Columnar analytics format | ↔ CSV, ↔ JSON |
| Apache Arrow/Feather | .arrow/.feather | In-memory analytics | ↔ CSV, ↔ JSON, ↔ Parquet |
| ORC | .orc | Optimized Row Columnar | → CSV, → Parquet |
| Avro | .avro | Apache serialization | ↔ JSON, ↔ CSV |
| MATLAB Figure | .fig | MATLAB plot | → PNG/SVG |
| gnuplot Script | .gnuplot | gnuplot commands | → SVG/PNG (rendered) |
| Matplotlib pickle | .pkl | Saved Python plots | → PNG/SVG |
| Plotly JSON | .json | Plotly chart definition | → PNG/SVG (rendered), → HTML |
| Vega/Vega-Lite spec | .json | Declarative visualization | → PNG/SVG (rendered), → HTML |
| DOT (Graphviz) | .dot/.gv | Graph description language | → SVG, → PNG |
| Mermaid | .mmd | Text-based diagramming | → SVG, → PNG |
| PlantUML | .puml | UML diagram text format | → SVG, → PNG |
| D2 | .d2 | Modern diagram scripting | → SVG |
| CSV → summary statistics JSON | .csv | Calculate mean/median/mode/std/etc | → JSON report |

---

## Database Formats & Conversions

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| SQLite | .db/.sqlite/.sqlite3 | Embedded SQL database | → CSV (already partially exists), → JSON, → XLSX, → SQL dump |
| SQL Dump | .sql | SQL statements | → SQLite .db, → CSV, → JSON |
| MySQL Dump | .sql | MySQL-specific dump | → SQLite, → PostgreSQL SQL, → CSV |
| PostgreSQL Dump | .sql | PG-specific dump | → SQLite, → MySQL SQL, → CSV |
| MongoDB Export | .json/.bson | MongoDB data | → CSV, → SQLite, → JSON (normalized) |
| BSON | .bson | Binary JSON (MongoDB) | ↔ JSON |
| Redis RDB | .rdb | Redis snapshot | → JSON |
| LevelDB | .ldb | Key-value store | → JSON, → CSV |
| IndexedDB Export | .json | Browser DB export | → SQLite, → CSV |
| Firebase Export | .json | Firebase Realtime DB | → SQLite, → CSV |
| DynamoDB Export | .json | AWS DynamoDB | → CSV, → SQLite |
| Neo4j Export | .cypher | Graph database | → JSON (nodes/edges), → DOT |
| GraphML | .graphml | Graph database XML format | ↔ JSON, → DOT, → CSV (edges) |
| Access (MDB/ACCDB) | .mdb/.accdb | Microsoft Access database | → SQLite, → CSV, → XLSX |
| dBase (DBF) | .dbf | Legacy database format | → CSV, → JSON, → SQLite |
| FoxPro | .dbf | FoxPro tables | → CSV, → SQLite |
| Realm | .realm | Mobile database | → JSON, → SQLite |
| SQL ↔ SQL dialect conversion | .sql | MySQL ↔ PostgreSQL ↔ SQLite ↔ MSSQL syntax | Transpile SQL dialects |
| Entity Relationship Diagram → SQL | .json/.xml | ER diagram → CREATE TABLE | Schema generator |
| SQL schema → ER diagram SVG | .sql | DDL → visual diagram | Parser + D3/Mermaid |
| CSV → SQLite | .csv | Import tabular data to DB | sql.js |
| JSON → SQLite | .json | Import structured data to DB | sql.js |
| Prisma schema → SQL | .prisma | ORM schema → DDL | Parser |
| TypeORM entities → SQL | .ts | TypeScript entities → DDL | Parser |
| SQL → Prisma schema | .sql | Reverse engineer schema | Parser |

---

## Maps, GPS & Geospatial (Extended)

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| GeoJSON | .geojson | Web standard geodata | ↔ KML, ↔ GPX, → SVG, → TopoJSON |
| KML / KMZ | .kml/.kmz | Google Earth | ↔ GeoJSON, ↔ GPX |
| GPX | .gpx | GPS Exchange Format | ↔ KML, ↔ GeoJSON, → CSV, → JSON |
| Shapefile | .shp/.shx/.dbf | ESRI vector data | → GeoJSON, → KML, → SVG |
| GeoPackage | .gpkg | OGC SQLite-based geo DB | → GeoJSON, → CSV, → Shapefile |
| TopoJSON | .topojson | Compressed topology | ↔ GeoJSON |
| WKT / WKB | .wkt | Well-Known Text/Binary | ↔ GeoJSON |
| MapBox MBTiles | .mbtiles | Tiled map data | → individual PNG tiles, → GeoJSON |
| OSM XML | .osm | OpenStreetMap data | → GeoJSON, → JSON |
| OSM PBF | .pbf | OpenStreetMap binary | → GeoJSON, → CSV |
| NMEA GPS | .nmea | Raw GPS sentences | → GPX, → GeoJSON, → CSV |
| FIT | .fit | Garmin fitness/GPS data | → GPX, → CSV, → JSON, → GeoJSON |
| TCX | .tcx | Training Center XML (Garmin) | → GPX, → CSV, → GeoJSON |
| IGC | .igc | Glider/aviation GPS track | → GPX, → KML |
| SRT (DJI Drone) | .srt | DJI drone flight telemetry | → GPX, → CSV, → KML |
| GeoTIFF | .tiff/.tif | Georeferenced raster image | → PNG + metadata JSON |
| Leaflet/Mapbox GL JSON | .json | Map style definitions | ↔ other map style formats |
| Google Maps Timeline | .json | Google location history | → GPX, → KML, → GeoJSON |
| Apple Maps data | .json | Apple location export | → GPX, → GeoJSON |
| GPX → elevation profile PNG/SVG | .gpx | Render elevation chart | D3.js chart |
| GPS track → stats JSON | .gpx/.fit | Distance, elevation gain, speed, etc. | Calculator |
| Coordinate system conversions | — | WGS84 ↔ UTM ↔ MGRS ↔ state plane ↔ plus codes ↔ what3words | proj4js |

---

## Metadata Extraction & Conversion

| Conversion | Description | How |
|------------|-------------|-----|
| Image → EXIF JSON | Extract camera data, GPS, settings | exifr / piexifjs |
| Image → EXIF stripped | Remove all metadata (privacy) | Strip EXIF bytes |
| Image EXIF editing | Modify date, GPS, camera info | piexifjs |
| PDF → metadata JSON | Title, author, dates, page count | pdf-lib |
| Audio → ID3 tags JSON | Artist, album, track metadata | music-metadata |
| Audio ID3 editing | Modify MP3/FLAC/OGG tags | id3-writer |
| Video → metadata JSON | Duration, resolution, codecs, bitrate | FFmpeg / mediainfo |
| Office docs → metadata JSON | Author, dates, revision count | XML parsing |
| Font → metadata JSON | Family, style, glyph count, kerning | opentype.js |
| EPUB → metadata JSON | Title, author, ISBN, TOC | EPUB parser |
| EXE/DLL → metadata JSON | Version info, signatures, imports | PE parser |
| Any file → hash JSON | MD5, SHA-1, SHA-256, CRC32 | Web Crypto API |
| Any file → magic bytes / file type | Detect real format from bytes | file-type library |
| Strip all metadata from any file | Privacy tool | Format-specific strippers |
| IPTC/XMP extraction | Photo metadata standards | Parser |
| ICC Color Profile → JSON | Color profile info | Parser |
| EXIF GPS → Map image | Plot photo location on map | Leaflet + tile render |

---

## Multi-File & Folder Conversions

### Combine Multiple Files

| Conversion | Description |
|------------|-------------|
| Multiple images → PDF | Combine images into a multi-page PDF |
| Multiple images → GIF/APNG/WEBM | Create animation from image sequence |
| Multiple images → spritesheet PNG + JSON | Game dev asset packing |
| Multiple images → contact sheet / thumbnail grid | Overview mosaic |
| Multiple images → ZIP | Simple bundling |
| Multiple PDFs → single PDF | Merge PDF files |
| Split PDF → individual page PDFs | Split apart |
| Split PDF → individual page PNGs | Rasterize each page |
| Multiple CSVs → single CSV | Concatenate tabular data |
| Multiple CSVs → single XLSX (multi-sheet) | Each CSV = one sheet |
| Multiple JSONs → single JSON array | Merge data |
| Multiple text files → single text | Concatenate with separators |
| Multiple audio files → single audio | Concatenate/merge tracks |
| Multiple audio files → playlist (M3U/PLS) | Create playlist |
| Folder → ZIP/TAR.GZ/7z | Archive a directory |
| Folder → file tree JSON | Directory structure export |
| Folder → file tree text | `tree` command output |
| Folder structure → README.md | Auto-generate project docs |
| Multiple .ts/.js → single bundle | Simple bundler (esbuild) |
| HTML + CSS + JS → single HTML | Inline all assets |
| Website folder → MHTML/MHT | Web archive |
| Folder of Markdown → static site HTML | Simple site generator |
| Multiple SVGs → icon font (TTF/WOFF2) | Icon library creation |
| Multiple images → ICO (multi-resolution) | Windows icon from PNGs |
| Multiple images → ICNS (multi-resolution) | macOS icon from PNGs |
| Split audio → multiple tracks | Split by silence or chapters |
| Split video → clips | Split by timestamp |

---

## Big Company Proprietary Formats

### Google

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| Google Docs | (exported .docx) | Google Docs export | → Markdown, → PDF, → HTML, → TXT |
| Google Sheets | (exported .xlsx/.csv) | Google Sheets export | → CSV, → JSON, → XLSX |
| Google Slides | (exported .pptx) | Google Slides export | → PDF, → PNG (per slide), → HTML |
| Google Takeout | .zip/.tgz | Full Google data export | → organized folder, → JSON index |
| Google Contacts | .vcf/.csv | Contact export | → JSON, → CSV, ↔ vCard |
| Google Calendar | .ics | Calendar events | ↔ JSON, ↔ CSV |
| Google Keep | .json/.html | Notes export | → Markdown, → JSON |
| Chrome Bookmarks | Bookmarks (JSON) | Browser bookmarks | → HTML, → Markdown, → CSV |
| Google Earth KMZ | .kmz | Compressed KML | → KML, → GeoJSON |
| Protocol Buffers | .proto / .pb | Google serialization | .proto → JSON Schema, .pb → JSON |
| TensorFlow SavedModel | saved_model.pb | ML model | → JSON (metadata), → ONNX |
| TFRecord | .tfrecord | TensorFlow training data | → CSV, → JSON |
| Flutter/Dart pubspec | pubspec.yaml | Dart package config | → JSON |

### Microsoft

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| DOCX/XLSX/PPTX | .docx/.xlsx/.pptx | Office 365 (already partial) | Extend: → Markdown, → HTML, → JSON, → Google format |
| DOC (legacy) | .doc | Legacy Word | → DOCX, → PDF, → TXT |
| XLS (legacy) | .xls | Legacy Excel | → XLSX, → CSV |
| PPT (legacy) | .ppt | Legacy PowerPoint | → PPTX, → PDF, → PNG |
| Visio | .vsdx | Diagram format | → SVG, → PNG |
| OneNote | .one | Notes format | → PDF, → HTML, → Markdown |
| PST/OST | .pst/.ost | Outlook mail archive | → JSON (messages), → EML, → MBOX |
| EML | .eml | Email message | → JSON, → PDF, → HTML |
| MBOX | .mbox | Unix mail archive | → EML (individual), → JSON |
| MSG | .msg | Outlook message | → EML, → JSON, → PDF |
| LNK | .lnk | Windows shortcut | → JSON (target info) |
| REG | .reg | Windows registry export | ↔ JSON |
| MSI | .msi | Windows installer | → ZIP (extract), → JSON (metadata) |
| MSIX/APPX | .msix/.appx | Modern Windows app package | → ZIP |
| Windows Terminal settings | settings.json | Terminal config | → JSON (formatted) |
| Azure ARM Template | .json | Infrastructure as code | ↔ Bicep |
| Bicep | .bicep | Azure IaC | → ARM JSON |
| .NET project | .csproj/.fsproj | Project file | ↔ JSON |

### Apple

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| Pages | .pages | Apple word processor | → DOCX, → PDF, → HTML |
| Numbers | .numbers | Apple spreadsheet | → XLSX, → CSV |
| Keynote | .key | Apple presentation | → PPTX, → PDF, → PNG |
| IPA | .ipa | iOS app package | → ZIP (extract), → JSON (metadata) |
| PLIST | .plist | Property list (binary/XML) | ↔ JSON, binary ↔ XML plist |
| HEIC/HEIF | .heic/.heif | Apple photo format | → JPEG, → PNG |
| MOV (ProRes) | .mov | Apple video | → MP4, → WEBM |
| AAC | .aac/.m4a | Apple audio | → MP3, → WAV, → OGG |
| CAF | .caf | Core Audio Format | → WAV, → MP3 |
| HealthKit Export | export.xml | Apple Health data | → CSV, → JSON |
| Apple Shortcuts | .shortcut | Siri Shortcuts | → JSON (readable) |
| iWork Archive | various | Pages/Numbers/Keynote are ZIP-based | → ZIP |
| Xcode Project | .xcodeproj | Project file (plist-based) | → JSON |
| Xcode Storyboard | .storyboard | UI layout XML | → JSON |
| Core Data Model | .xcdatamodeld | Database model | → JSON schema, → SQL |
| Metal Shader | .metal | Apple GPU shader | → formatted |
| USDZ | .usdz | Apple AR format | ↔ GLB (already in 3D section) |
| .DS_Store | .DS_Store | macOS folder metadata | → JSON (parsed) |
| ICNS | .icns | macOS icon | → PNG (all sizes), → ICO |

### Adobe

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| PSD | .psd | Photoshop Document | → PNG (flattened), → layers as separate PNGs, → SVG |
| AI | .ai | Illustrator (usually PDF-based) | → SVG, → PDF, → PNG |
| INDD (partial) | .indd | InDesign | → JSON (metadata) |
| XD | .xd | Adobe XD design | → SVG, → PNG |
| SWF (legacy) | .swf | Flash | → HTML5 (partial), → PNG (first frame) |
| FLA (legacy) | .fla | Flash authoring | → ZIP (extract), → JSON |
| PDF form → JSON | .pdf | Extract form fields | → JSON (field values) |
| PDF → fillable HTML form | .pdf | Interactive form | → HTML |
| Animate (Lottie export) | .json | After Effects / Animate | → GIF, → APNG, → WEBM, → SVG |

### Other Companies

| Format | Company | Extension | Conversion |
|--------|---------|-----------|------------|
| Figma (exported) | Figma | .fig (local) | → SVG, → PNG |
| Sketch | Bohemian | .sketch | → SVG, → PNG, → Figma-compatible |
| Canva export | Canva | .pdf/.png | Standard formats |
| Notion export | Notion | .md/.html/.csv | → JSON, → DOCX |
| Obsidian vault | Obsidian | .md folder | → HTML, → PDF, → single Markdown |
| Slack export | Slack | .json/.zip | → Markdown, → HTML (formatted) |
| Discord data export | Discord | .json | → Markdown, → CSV, → HTML |
| Twitter/X archive | X | .zip/.json | → Markdown, → CSV, → HTML |
| Reddit data export | Reddit | .csv/.json | → Markdown, → HTML |
| WhatsApp chat export | WhatsApp | .txt/.zip | → JSON, → CSV, → HTML |
| Telegram export | Telegram | .json/.html | → Markdown, → CSV |
| Signal backup | Signal | .backup | → JSON (decrypted, needs key) |
| Trello export | Trello | .json | → CSV, → Markdown, → HTML |
| Jira export | Atlassian | .csv/.xml | → JSON, → Markdown |
| Asana export | Asana | .csv/.json | → Markdown, → JSON |
| Todoist export | Todoist | .csv | → JSON, → Markdown |

---

## App & Package Conversions

### Mobile App Packages

| Conversion | Description | How |
|------------|-------------|-----|
| APK → ZIP | Extract Android app contents | It's a ZIP (rename) |
| APK → IPA | Android → iOS | NOT directly possible (different platforms), but extract assets |
| IPA → ZIP | Extract iOS app contents | It's a ZIP |
| AAB → APK | Android App Bundle → APK | bundletool (complex) |
| APK → manifest JSON | Extract Android manifest | XML parser |
| IPA → Info.plist JSON | Extract iOS app info | Plist parser |
| XAPK → APK + OBB | Split APK extraction | ZIP extraction |
| APK/IPA → icon PNG | Extract app icons | ZIP + image extraction |
| APK → DEX → smali | Decompile Dalvik bytecode | baksmali/dex parser |

### Desktop App Packages

| Conversion | Description | How |
|------------|-------------|-----|
| MSIX/APPX → ZIP | Windows modern app | It's a ZIP |
| MSI → extracted files | Windows installer | MSI parser |
| DMG → extracted files | macOS disk image | DMG parser |
| AppImage → extracted files | Linux portable app | Extract squashfs |
| DEB → ZIP | Debian package extraction | ar + tar parser |
| RPM → ZIP | Red Hat package extraction | CPIO parser |
| Snap → extracted files | Ubuntu snap package | squashfs |
| Flatpak → extracted files | Linux Flatpak | OSTree extraction |
| EXE (NSIS) → extracted files | NSIS installer | 7z extraction |
| EXE (Inno Setup) → extracted files | Inno Setup installer | innounp |

### PWA & Web App

| Conversion | Description | How |
|------------|-------------|-----|
| manifest.json validation/generation | PWA manifest | JSON schema validation |
| Website → PWA | Add manifest + service worker | Template generator |
| HTML + assets → Chrome Extension ZIP | Package as extension | ZIP with manifest |
| HTML + assets → Firefox Addon XPI | Package as addon | ZIP with manifest |
| Chrome Extension → Firefox Addon | Extension cross-platform | Manifest v2↔v3 conversion |
| Website → Electron app (scaffold) | Web → desktop | Template generator |
| Website → Capacitor project (scaffold) | Web → mobile | Template generator |
| Website → TWA (scaffold) | Web → Android | Template generator |

---

## Web Files & Code

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| HAR (HTTP Archive) | .har | Network traffic recording | → CSV (requests), → JSON (formatted), → cURL commands |
| cURL command → code | text | cURL to fetch/axios/etc | Multi-language converter |
| Postman Collection | .json | API collection | → cURL, → OpenAPI, → HAR |
| Insomnia Export | .json/.yaml | API collection | → Postman, → cURL |
| OpenAPI/Swagger | .yaml/.json | API specification | ↔ Postman, → HTML docs, → TypeScript types, → client code |
| WSDL | .wsdl | SOAP web service | → JSON, → OpenAPI |
| GraphQL Schema | .graphql/.gql | API schema | → TypeScript, → JSON, → Markdown docs |
| .htaccess → nginx.conf | .htaccess | Apache → Nginx config | Parser/converter |
| nginx.conf → .htaccess | nginx.conf | Nginx → Apache config | Parser/converter |
| Docker Compose ↔ Kubernetes YAML | docker-compose.yml | Container orchestration | Kompose-like converter |
| Dockerfile → shell script | Dockerfile | Reproduce build locally | Parser |
| Terraform ↔ Pulumi | .tf / .ts | IaC conversion | Schema mapping |
| robots.txt → JSON | robots.txt | Parse crawler rules | Simple parser |
| sitemap.xml → JSON/CSV | sitemap.xml | Parse site structure | XML parser |
| RSS/Atom → JSON | .xml | Feed to structured data | Parser |
| OPML → JSON/Markdown | .opml | Feed collection/outline | Parser |
| MHTML → HTML + assets | .mhtml/.mht | Web archive → files | Parser |
| WARC → extracted files | .warc | Web archive format | Parser |
| Cookie file → JSON | cookies.txt | Netscape cookie format | Parser |
| .env → docker-compose env | .env | Environment migration | Template |
| package.json ↔ requirements.txt | — | JS ↔ Python dependencies (metadata only) | Parser |
| Webpack config → Vite config | webpack.config.js | Build tool migration | AST transform |
| CSS → Tailwind classes | .css | Reverse Tailwind | Matcher |

---

## Binary & Data Encoding Formats (Extended)

| Conversion | Description | How |
|------------|-------------|-----|
| Base64 ↔ binary file | Standard encoding | atob/btoa |
| Base32 ↔ binary | RFC 4648 | Parser |
| Base58 (Bitcoin) ↔ binary | Crypto address encoding | Parser |
| Base85 / Ascii85 ↔ binary | PostScript/PDF encoding | Parser |
| Hex string ↔ binary file | Hexadecimal | Parser |
| Octal dump ↔ binary | Octal representation | Parser |
| Binary string (0s and 1s) ↔ file | Raw binary text | Parser |
| URL encoding ↔ plain text | Percent encoding | encodeURIComponent |
| HTML entities ↔ plain text | Entity encoding | he.js |
| Unicode escape ↔ plain text | \uXXXX sequences | Parser |
| Punycode ↔ Unicode | International domain names | punycode.js |
| ROT13/ROT47 ↔ plain text | Simple rotation cipher | Rotator |
| Caesar cipher (configurable shift) | Classic cipher | Shifter |
| Vigenère cipher ↔ plain text | Polyalphabetic cipher | Key-based |
| Morse code ↔ text | Dots and dashes | Lookup table |
| Braille ↔ text | Unicode braille patterns | Mapping |
| NATO phonetic alphabet ↔ text | Alpha → Alfa, etc. | Mapping |
| Semaphore ↔ text | Flag positions | Image/text generator |
| Binary → hex dump (xxd format) | Like `xxd` output | Formatter |
| Hex dump → binary | Reverse xxd | Parser |
| ASCII art ↔ text (figlet) | Text banners | figlet.js |
| Text → QR code PNG/SVG | QR generation | qrcode.js |
| Image → QR decode | Read QR from image | jsQR |
| Text → barcode (Code128/EAN/UPC) PNG/SVG | Barcode generation | bwip-js |
| Image → barcode decode | Read barcode from image | ZXing-js |
| Text → Data Matrix PNG | 2D barcode | bwip-js |
| UUID/GUID generation | Generate from seed or random | crypto.randomUUID |
| JWT decode → JSON | Parse JWT without verification | Base64 parser |
| JWT parts → header.payload.signature breakdown | Visual JWT | Parser |
| ASN.1 DER ↔ PEM | Certificate encoding | asn1.js |
| PEM → JSON (certificate info) | Parse X.509 certificate | pkijs |
| SSH key → fingerprint/JSON | Parse SSH keys | sshpk |
| BitTorrent .torrent → JSON | Parse torrent metadata | parse-torrent |
| Bencode ↔ JSON | BitTorrent encoding | bencode parser |
| MessagePack ↔ JSON | Efficient binary serialization | msgpack-lite |
| CBOR ↔ JSON | IoT binary encoding | cbor-js |
| Protocol Buffers (raw) → JSON | Decode without schema (best-effort) | protobuf.js |
| Cap'n Proto → JSON | Another serialization format | Parser |
| FlatBuffers → JSON | Google serialization | Parser |
| Thrift → JSON | Apache serialization | Parser |
| UBJSON ↔ JSON | Universal Binary JSON | Parser |
| BSON ↔ JSON | MongoDB binary | bson parser |
| Ion ↔ JSON | Amazon's data format | ion-js |
| TOML ↔ JSON ↔ YAML ↔ INI | Config format roundtrip | Various parsers |
| EDN ↔ JSON | Clojure's data notation | edn-js |
| S-expressions ↔ JSON | Lisp notation | Parser |
| NDJSON ↔ JSON array | Newline-delimited JSON | Simple split/join |
| JSON Lines ↔ CSV | Streaming JSON to tabular | Parser |
| CSON ↔ JSON | CoffeeScript Object Notation | Parser |
| JSON5 ↔ JSON | Relaxed JSON | json5 library |
| HJSON ↔ JSON | Human JSON | hjson library |
| JSONC (with comments) → JSON | Strip comments | Parser |

---

## More Gaming & Modding

### Emulation / ROM Formats

| Format | System | Extension | Conversion |
|--------|--------|-----------|------------|
| NES ROM | NES | .nes | → JSON (header info), → CHR tiles PNG |
| SNES ROM | SNES | .sfc/.smc | → JSON (header info) |
| Game Boy ROM | GB/GBC | .gb/.gbc | → JSON (header), → tileset PNG |
| GBA ROM | GBA | .gba | → JSON (header info) |
| N64 ROM | N64 | .z64/.n64/.v64 | ↔ byte-swapped variants (z64↔n64↔v64) |
| NDS ROM | DS | .nds | → JSON (header), → extracted files |
| 3DS ROM | 3DS | .3ds/.cia | → JSON (metadata) |
| Genesis ROM | Mega Drive | .md/.gen | → JSON (header) |
| Save State | Various | .sav/.srm | → JSON (parsed, system-specific) |
| IPS Patch | ROM patching | .ips | Apply: ROM + IPS → patched ROM |
| UPS Patch | ROM patching | .ups | Apply: ROM + UPS → patched ROM |
| BPS Patch | ROM patching | .bps | Apply: ROM + BPS → patched ROM |
| xdelta Patch | Generic patching | .xdelta/.vcdiff | Apply: file + patch → patched file |
| Game Genie code ↔ address/value | Cheat code | text | ↔ JSON (decoded address + value) |
| GameShark code → JSON | Cheat code | text | → JSON (decoded) |

### Texture & Asset Formats (Game-Specific)

| Format | Game/Engine | Extension | Conversion |
|--------|-------------|-----------|------------|
| DDS | DirectX/everything | .dds | ↔ PNG/JPEG/TGA |
| PVR | PowerVR/iOS games | .pvr | → PNG |
| KTX / KTX2 | Khronos texture | .ktx/.ktx2 | → PNG, → DDS |
| ASTC | ARM/mobile GPUs | .astc | → PNG |
| ETC1/ETC2 | Android OpenGL | various | → PNG |
| BC1-BC7 (individual blocks) | DirectX compressed | — | → PNG |
| TGA | Game textures everywhere | .tga | ↔ PNG |
| BLP | World of Warcraft | .blp | → PNG |
| PAK (Quake/id Tech) | Quake series | .pak | → ZIP |
| WAD (Doom/GZDoom) | Doom modding | .wad | → ZIP, lumps → PNG/WAV |
| PK3 (Quake 3/id Tech 3) | Quake 3 | .pk3 | → ZIP (it IS a zip) |
| PK4 (Doom 3) | Doom 3 | .pk4 | → ZIP |
| UPK (Unreal Engine 3) | UE3 games | .upk | → extracted assets |
| PAK (Unreal Engine 4/5) | UE4/5 | .pak | → ZIP |
| RTON (PvZ 2) | Plants vs Zombies 2 | .rton | → JSON |
| CGB/AGB tilesets | Game Boy games | — | → PNG spritesheet |
| Sprite sheets ↔ individual frames | Any game | .png | Split/combine |
| Texture atlas + JSON → individual images | Phaser/Unity/etc | .json + .png | Splitter |
| Individual images + JSON → texture atlas | Packing | .png + .json | TexturePacker-like |

### Level/Map Editors

| Format | Game/Engine | Extension | Conversion |
|--------|-------------|-----------|------------|
| Tiled Map | Tiled editor | .tmx/.tmj | ↔ JSON, → PNG (rendered) |
| Tiled Tileset | Tiled editor | .tsx/.tsj | ↔ JSON |
| LDtk | LDtk editor | .ldtk | → JSON (already is), → PNG (rendered) |
| Ogmo Editor | Ogmo | .ogmo/.json | ↔ Tiled .tmx |
| Trenchbroom MAP | Quake mapping | .map | → OBJ, → JSON |
| Hammer VMF | Source maps | .vmf | → JSON, → OBJ (brushes) |
| Worldcraft RMF | Legacy Hammer | .rmf | → VMF, → JSON |
| RPG Maker Map | RPG Maker | .json/.rxdata | → PNG (rendered), → Tiled .tmx |
| GameMaker Room | GameMaker | .yy | → JSON, → PNG (rendered) |

### Modding Tools

| Conversion | Description |
|------------|-------------|
| Mod manifest generators | Create mod.json/manifest.json for various games |
| Config file conversions between mod loaders | Forge → Fabric, etc. (Minecraft) |
| Texture resizing for different game resolutions | 4K → 2K → 1K texture downscale |
| Normal map generation | Diffuse texture → normal map PNG |
| Height map → normal map | Grayscale → normal vectors |
| Sprite sheet → GIF | Animate sprite sheets |
| Color palette extraction → JSON/PNG | Extract dominant colors from image |
| Color palette → texture recolor | Apply palette swap to sprites |
| Localization file conversions | .lang ↔ .json ↔ .csv ↔ .po ↔ .xliff |
| i18n key extraction | Source code → translation template |

---

## Science & Math

### Mathematical Typesetting

| Conversion | Description |
|------------|-------------|
| LaTeX math → PNG/SVG | Render equations | KaTeX / MathJax |
| LaTeX math → MathML | Semantic math markup | KaTeX |
| MathML → LaTeX | Reverse conversion | Parser |
| AsciiMath → LaTeX → PNG/SVG | Simple math syntax | AsciiMath parser |
| Wolfram Language → LaTeX | Mathematica output | Parser |
| LaTeX full document → PDF/HTML | Document compilation | LaTeX.js or Pandoc |
| Jupyter Notebook → LaTeX | Notebook to paper | Parser |
| Graphing: equation string → plot PNG/SVG | y=mx+b → visual | Function plotter (D3/Canvas) |
| Graphing: CSV data → best-fit curve | Regression | Stats library |
| Matrix → LaTeX table | Array → formatted | Generator |
| Truth table generation → PNG/LaTeX | Boolean logic | Calculator |
| State machine DOT → diagram SVG | FSM visualization | Graphviz/D3 |

### Chemistry

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| MOL / MOL2 | .mol/.mol2 | Molecular structure | → SVG (2D structure), → 3Dmol GLB |
| SDF | .sdf | Structure-Data File | → MOL, → JSON, → SVG |
| PDB | .pdb | Protein Data Bank | → GLB (3D render), → JSON |
| CIF/mmCIF | .cif | Crystallographic data | → PDB, → GLB |
| SMILES → 2D structure SVG | text | Chemical notation → drawing | RDKit.js / OpenChemLib |
| InChI ↔ SMILES | text | Chemical identifier conversion | OpenChemLib |
| Chemical formula → molar mass JSON | text | Calculate molecular weight | Parser + periodic table |
| XYZ (molecular) | .xyz | Atomic coordinates | → PDB, → GLB, → MOL |
| CML (Chemical Markup) | .cml | XML chemistry | → JSON, → MOL |
| Gaussian output | .log/.out | Quantum chemistry results | → JSON, → XYZ |
| VASP POSCAR/CONTCAR | POSCAR | Crystal structure | → CIF, → XYZ |

### Physics & Engineering

| Conversion | Description |
|------------|-------------|
| Circuit diagram → SVG | From netlist/description |
| SPICE simulation → plot PNG/SVG | Render simulation results |
| FEA mesh → GLB | Finite Element Analysis visualization |
| CFD data → visualization PNG | Computational Fluid Dynamics |
| Signal processing: WAV → FFT plot PNG | Frequency spectrum |
| Signal processing: CSV → FFT/spectrogram | Time domain → frequency |
| Unit-aware calculations in JSON | Input with units → converted output |

### Biology & Medicine

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| FASTA | .fasta/.fa | DNA/protein sequences | → JSON, → formatted text, → stats |
| FASTQ | .fastq | Sequencing reads with quality | → FASTA (strip quality), → JSON |
| GenBank | .gb/.gbk | Annotated sequence | → FASTA, → JSON, → GFF |
| GFF/GTF | .gff/.gtf | Genome annotation | → JSON, → CSV, → BED |
| BED | .bed | Genomic intervals | → JSON, → CSV, → GFF |
| VCF (Variant Call) | .vcf | Genetic variants | → CSV, → JSON |
| SAM/BAM | .sam/.bam | Sequence alignment | → CSV (basic), → JSON |
| Newick tree | .nwk/.tree | Phylogenetic tree | → JSON, → SVG (tree diagram) |
| DICOM | .dcm | Medical imaging | → PNG/JPEG, → JSON (metadata) |
| NIfTI | .nii/.nii.gz | Neuroimaging | → PNG slices, → JSON (metadata) |
| HL7 FHIR | .json | Healthcare interoperability | → CSV, → formatted display |
| PDB (Protein) | .pdb | Protein 3D structure | → GLB (render), → JSON |

---

## Localization & Internationalization (i18n)

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| PO/POT (gettext) | .po/.pot | Unix localization standard | ↔ JSON, ↔ CSV, ↔ XLIFF |
| XLIFF | .xliff/.xlf | XML Localization Interchange | ↔ JSON, ↔ PO, ↔ CSV |
| ARB | .arb | Application Resource Bundle (Flutter) | ↔ JSON, ↔ PO |
| Strings (Apple) | .strings/.stringsdict | iOS/macOS localization | ↔ JSON, ↔ CSV, ↔ XLIFF |
| Android XML | strings.xml | Android localization | ↔ JSON, ↔ CSV, ↔ PO |
| RESX | .resx | .NET resource file | ↔ JSON, ↔ CSV |
| Properties (Java) | .properties | Java localization | ↔ JSON, ↔ CSV |
| QM/TS (Qt) | .ts/.qm | Qt localization | .ts → JSON, → CSV |
| ICU MessageFormat | text | Unicode message format | ↔ JSON |
| Crowdin/Phrase/Lokalise export | various | Translation platform exports | Normalize to JSON/CSV |
| i18next JSON | .json | i18next format | ↔ PO, ↔ CSV, ↔ XLIFF |
| Chrome Extension _locales | messages.json | Chrome i18n | ↔ CSV, ↔ PO |
| YAML (Rails i18n) | .yml | Ruby on Rails localization | ↔ JSON, ↔ PO |
| PHP arrays | .php | PHP localization | → JSON, → CSV |
| GNU MO (compiled gettext) | .mo | Compiled message catalog | → PO (decompile), → JSON |

---

## Calendar, Contact & Communication Formats

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| iCalendar | .ics | Calendar events | ↔ JSON, ↔ CSV, → HTML table |
| vCard | .vcf | Contact cards | ↔ JSON, ↔ CSV, → HTML |
| CardDAV/CalDAV exports | .vcf/.ics | Server exports | → JSON, → CSV |
| MBOX → individual EML | .mbox | Mail archive split | → individual .eml |
| EML → PDF | .eml | Email to document | Render email |
| MSG → EML | .msg | Outlook to standard | Parser |
| PST → MBOX | .pst | Outlook to Unix mail | Parser |
| CSV → vCard | .csv | Contacts import | Generator |
| JSON → iCalendar | .json | Events generation | Generator |
| Org-mode → iCalendar | .org | Emacs org agenda export | Parser |
| Todoist/Trello → iCalendar | .json | Task manager → calendar | Mapper |

---

## DevOps, Config & Infrastructure

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| Dockerfile → shell script | Dockerfile | Reproduce build steps | Parser |
| docker-compose.yml → K8s YAML | docker-compose.yml | Docker to Kubernetes | Kompose-like |
| Kubernetes YAML → Helm chart | .yaml | K8s to templated | Template extractor |
| Terraform HCL ↔ JSON | .tf | Infrastructure as Code | HCL parser |
| Ansible YAML → shell script | .yml | Playbook to script | Converter |
| CloudFormation → Terraform | .json/.yaml | AWS IaC migration | Mapper |
| Nginx conf → Caddy conf | nginx.conf | Web server migration | Parser |
| Apache .htaccess → Nginx | .htaccess | Web server migration | Parser |
| SSH config → JSON | ~/.ssh/config | Parse SSH config | Parser |
| Crontab → JSON/English | crontab | Parse cron schedules | Parser |
| systemd unit → JSON | .service | Parse service files | Parser |
| Supervisor conf → systemd | .conf | Process manager migration | Converter |
| Logstash conf → JSON | .conf | Log pipeline config | Parser |
| Prometheus rules → JSON | .rules/.yml | Monitoring rules | Parser |
| Grafana dashboard JSON ↔ YAML | .json | Dashboard definitions | Converter |
| CI/CD pipeline conversions | .yml | GitHub Actions ↔ GitLab CI ↔ Jenkins ↔ CircleCI | Mapper |
| .editorconfig → VS Code settings | .editorconfig | Editor config migration | Parser |
| ESLint config → Prettier config | .eslintrc | Linter config | Mapper |
| tsconfig.json → JSDoc config | tsconfig.json | TypeScript config extraction | Parser |

---

## Color & Design

| Conversion | Description |
|------------|-------------|
| HEX ↔ RGB ↔ HSL ↔ HSV ↔ CMYK ↔ LAB ↔ LCH ↔ OKLab ↔ OKLCH | Color space conversions |
| Color palette image → JSON (hex values) | Extract colors from image |
| JSON palette → PNG/SVG swatch | Render color palette |
| ASE (Adobe Swatch Exchange) → JSON | Adobe palette | → hex values |
| ACO (Adobe Color) → JSON | Photoshop palette | → hex values |
| GPL (GIMP Palette) ↔ JSON | GIMP colors | → hex values |
| PAL (various) → JSON | Generic palette format | → hex values |
| CSS variables → JSON palette | Extract custom properties | Parser |
| Tailwind config → color palette JSON | Extract theme colors | Parser |
| Image → CSS gradient | Approximate image as gradient | Analyzer |
| SVG → CSS (clip-path, gradients) | Vector to CSS | Parser |
| Figma tokens JSON → CSS variables | Design tokens | Converter |
| Style Dictionary → CSS/SCSS/JSON | Design token transform | Parser |
| Color blindness simulation | Image → simulated PNG for each type | Color filter |
| Contrast checker JSON | Two colors → WCAG compliance report | Calculator |

---

## Accessibility & Assistive Tech (Extended)

| Conversion | Description |
|------------|-------------|
| Text → Braille (Grade 1 & 2) | Unicode braille output | Mapping tables |
| Braille → Text | Reverse mapping | Mapping tables |
| Text → Speech (WAV/MP3) | Already exists (espeak-ng), extend voices | espeak-ng |
| Speech/Audio → Text transcript | Speech-to-text | Whisper.cpp WASM |
| PDF → tagged/accessible PDF | Add structure tags | pdf-lib |
| Image → alt text description | AI-generated | Optional AI backend |
| Video → audio description script | Scene description | Optional AI |
| Sign language reference → text | ASL/BSL lookup | Mapping |
| Color contrast fix | Adjust colors for WCAG AA/AAA | Color adjuster |
| Font → dyslexia-friendly font metrics | Analyze readability | opentype.js |
| HTML → ARIA-annotated HTML | Add accessibility attributes | Analyzer |
| Screen reader preview | How content sounds | TTS rendering |
| Closed captions (SRT) → open captions (burned in video) | Subtitle burning | FFmpeg |

---

## Financial & Business Formats

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| OFX/QFX | .ofx/.qfx | Open Financial Exchange (bank) | → CSV, → JSON, → QIF |
| QIF | .qif | Quicken Interchange Format | → CSV, → JSON, → OFX |
| MT940 (SWIFT) | .mt940/.sta | Bank statement (SWIFT) | → CSV, → JSON |
| CAMT.053 (ISO 20022) | .xml | Modern bank statement | → CSV, → JSON |
| BAI2 | .bai | US bank statement | → CSV, → JSON |
| CSV (bank statement) → categorized JSON | .csv | Auto-categorize transactions | Rule-based |
| Invoice PDF → JSON | .pdf | Extract invoice data | OCR / structured extraction |
| UBL/Peppol Invoice | .xml | Electronic invoice standard | → PDF, → JSON, → CSV |
| XBRL | .xbrl | Financial reporting | → JSON, → CSV |
| XLS/XLSX → OFX | .xlsx | Spreadsheet to financial | Generator |
| Stock data CSV → candlestick chart PNG | .csv | Financial visualization | Chart.js |
| Ledger/hledger/beancount | .journal/.beancount | Plain text accounting | ↔ CSV, ↔ JSON, → reports |

---

## Print & Publishing (Extended)

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| PDF/X → PDF (standard) | .pdf | Print-ready to screen | Strip print metadata |
| PDF → PDF/A (archival) | .pdf | Screen to archival | Add metadata |
| PostScript | .ps/.eps | Print language | → PDF, → SVG, → PNG |
| EPS → SVG | .eps | Encapsulated PostScript | → vector |
| SVG → EPS | .svg | Vector to PostScript | Converter |
| IDML | .idml | InDesign interchange | → HTML, → JSON |
| QXP (QuarkXPress) | .qxp | Legacy publishing | → JSON (metadata) |
| AFP | .afp | Advanced Function Presentation | → PDF |
| ZPL | .zpl | Zebra label printer language | → PNG/SVG (preview), → PDF |
| PDF → booklet layout PDF | .pdf | Reorder pages for printing | Page arranger |
| PDF → N-up PDF | .pdf | Multiple pages per sheet | Layout tool |
| Images → photo book PDF | multiple | Photo layout | Template-based |
| Markdown → print-ready PDF | .md | Typeset for print | CSS paged media |
| LaTeX → PDF | .tex | Academic publishing | LaTeX.js / Pandoc |
| Groff/Troff → PDF | .ms/.me | Unix typesetting | groff parser |
| Man page → HTML/PDF/Markdown | .1-.9 | Unix manual pages | mandoc |

---

## Operating System Specific

### Windows-Specific

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| Registry (.reg) ↔ JSON | .reg | Windows registry | Parser |
| PE (EXE/DLL) → resource extraction | .exe/.dll | Icons/strings/versions | PE parser |
| .lnk → JSON | .lnk | Shortcut target info | Parser |
| .inf → JSON | .inf | Driver/setup info | Parser |
| Event Log (.evtx) → CSV/JSON | .evtx | Windows event logs | Parser |
| PowerShell → Bash | .ps1 | Script conversion | AST-based heuristic |
| Batch (.bat) → PowerShell | .bat | Script modernization | Parser |
| WMI query → PowerShell | text | Query conversion | Mapper |
| Windows Theme (.theme) → JSON | .theme | Desktop theme | INI parser |
| .ico → .icns | .ico | Windows → macOS icon | Image conversion |

### Linux-Specific

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| Desktop Entry (.desktop) → JSON | .desktop | App launcher | INI-like parser |
| Bash → PowerShell | .sh | Script conversion | Heuristic |
| Bash → Python | .sh | Script modernization | Heuristic |
| fstab → JSON | fstab | Mount table | Parser |
| /etc/passwd → JSON | passwd | User database | Parser |
| AppArmor profile → JSON | — | Security policy | Parser |
| SELinux policy → JSON | — | Security policy | Parser |
| systemd timer → cron → JSON | various | Schedule conversions | Parser |
| Snap YAML → Flatpak YAML | snapcraft.yaml | Package format migration | Mapper |

### macOS-Specific

| Format | Extension | Description | Conversion |
|--------|-----------|-------------|------------|
| .plist (binary) ↔ .plist (XML) ↔ JSON | .plist | Apple property list | Parser |
| .DS_Store → JSON | .DS_Store | Folder metadata | Parser |
| .icns → .ico | .icns | macOS → Windows icon | Image conversion |
| .app bundle → metadata JSON | .app | App info extraction | Parser |
| Automator workflow → shell script | .workflow | Workflow conversion | Parser |
| AppleScript → JavaScript for Automation | .scpt | Script migration | Heuristic |
| Launch Agent/Daemon plist → systemd unit | .plist | macOS → Linux service | Mapper |
| Info.plist → manifest.json | .plist | iOS → PWA metadata | Mapper |

---

## Summary — Updated Totals

| Category | Approximate New Formats/Conversions |
|----------|-------------------------------------|
| 3D Models & Mesh | ~25 formats |
| 3D Printing / CAD | ~15 conversions |
| Code & Programming | ~60+ conversions |
| Language Translation | 100 languages (10,000+ pairs) |
| Gaming / Modding (all) | ~120+ formats across 15+ game engines + emulation |
| Archives | ~25 formats |
| Fonts | ~12 conversions |
| Ebooks & Publishing | ~30 conversions |
| Spreadsheets & DB / Database | ~50 conversions |
| Subtitles | ~12 conversions |
| GIS / Maps / GPS | ~30 conversions |
| Scientific (all) | ~60 formats |
| Music Production | ~12 formats |
| Images (gaps) | ~15 formats |
| Video (gaps) | ~10 conversions |
| Encoding / Binary / Serialization | ~60+ conversions |
| Accessibility | ~15 conversions |
| Robotics & IoT | ~20 formats |
| Measurements & Units | 200+ unit pairs across 25 categories |
| Electronics & Sensors | ~25 formats |
| Charts & Statistics | ~30 conversions |
| Metadata | ~20 conversions |
| Multi-file / Folder | ~30 conversions |
| Big Company Formats | ~80+ formats (Google/MS/Apple/Adobe/etc) |
| App & Package Conversion | ~25 conversions |
| Web & DevOps | ~50 conversions |
| Localization (i18n) | ~20 formats |
| Calendar/Contact/Email | ~15 conversions |
| Color & Design | ~20 conversions |
| Financial | ~15 formats |
| OS-Specific | ~30 conversions |

**Grand total: ~1,000+ new format conversions**

---

## Implementation Priority

### Phase 1 — Quick Wins (rename-based, simple parsers)
- MCWorld/MCPack/MCTemplate/MCAddon → ZIP (rename handler)
- GMA → ZIP, UnityPackage → ZIP, PCK → ZIP, PK3 → ZIP
- VTT ↔ SRT, subtitle conversions
- TOML/INI/.env ↔ JSON
- Base64/Hex/URL encoding conversions
- JSON prettify/minify/JSON5/JSONC
- Font conversions (TTF ↔ WOFF2)
- .plist binary ↔ XML ↔ JSON
- Color space conversions
- Unit conversions (pure math, no dependencies)
- Registry .reg ↔ JSON
- Morse/Braille/NATO phonetic
- ROM byte-swap (N64 z64↔n64↔v64)
- IPS/UPS/BPS patch application
- Localization format conversions (PO ↔ JSON ↔ CSV)
- NDJSON ↔ JSON array, JSON5 → JSON

### Phase 2 — Three.js Expansion (moderate effort, huge impact)
- Add OBJ, FBX, STL, PLY, DAE, 3DS, VRML loaders
- Add STL, OBJ, USDZ, PLY exporters
- Render any 3D model to image
- Normal map generation from textures
- DDS ↔ PNG texture conversion

### Phase 3 — Code Transpilers & Dev Tools (moderate effort)
- TypeScript → JavaScript
- SCSS/LESS → CSS
- CoffeeScript/Pug/Haml → output
- WAT ↔ WASM
- Jupyter ↔ Python
- JS/CSS/HTML minification
- DOT/Mermaid/PlantUML → SVG
- SQL dialect conversions
- HAR/cURL/Postman conversions
- CI/CD pipeline format conversions

### Phase 4 — Data Visualization (moderate effort, very visual)
- CSV/JSON → chart types (bar, line, pie, scatter, etc.)
- Graphing equations → plot images
- Oscilloscope/signal data → waveform SVG
- DOT (Graphviz) → SVG

### Phase 5 — Gaming Formats (high effort, community favorite)
- Source Engine: VPK, VMT, VMF, GMA, BSP
- Bethesda: BSA, BA2, NIF, ESP, DDS
- id Tech: WAD, PAK, MD2/MD3
- Godot: TSCN, TRES, PCK, GDScript
- Tiled/LDtk level editors
- Emulator ROM utilities
- Texture atlas splitting/packing
- Sprite sheet ↔ GIF/frames

### Phase 6 — Language Translation (high effort, massive value)
- Integrate Bergamot (Mozilla) for client-side translation
- Ship with 20 core languages
- Build pluggable architecture for community languages
- Target 100+ languages over time

### Phase 7 — Science, Robotics & Electronics
- Chemistry: SMILES/PDB/MOL → visualization
- Biology: FASTA/FASTQ/GenBank parsing
- Electronics: KiCad/Gerber → SVG, VCD → waveform
- Robotics: URDF, G-code, point clouds
- Medical: DICOM → PNG

### Phase 8 — Big Company & Platform Formats
- Apple Pages/Numbers/Keynote → standard formats
- Adobe PSD layer extraction
- Outlook PST/MSG → standard email
- Google Takeout processing
- Social media export parsing (Discord, Slack, WhatsApp, etc.)

### Phase 9 — Multi-file, Metadata & Everything Else
- Folder → archive types
- Multi-image → PDF/GIF/spritesheet
- PDF merge/split
- EXIF/ID3 extraction and stripping
- Financial format conversions
- Accessibility tools
- Print layout tools
