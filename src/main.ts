import type { FileFormat, FileData, FormatHandler, ConvertPathNode } from "./FormatHandler.js";
import normalizeMimeType from "./normalizeMimeType.js";
import { TraversionGraph } from "./TraversionGraph.js";

// Handlers are loaded DYNAMICALLY so the loading screen JS can run immediately.
// The static import would block ALL code until every handler module resolves.
let handlers: FormatHandler[] = [];

/** Files currently selected for conversion */
let selectedFiles: File[] = [];
/** Last file shown in preview — held so re-opening is possible */
let currentPreviewFile: File | null = null;
/** requestAnimationFrame id for the 3D preview render loop */
let previewAnimFrame: number | null = null;

// ── In-app console log capture ─────────────────────────────────────────────
// Intercept console.error / console.warn ASAP so errors from module loading
// and handler init are visible in the Settings → Error Log panel without
// requiring the user to open browser DevTools.
interface AppLogEntry { level: "error" | "warn"; msg: string; time: string; }
const appLogBuffer: AppLogEntry[] = [];

function _fmtArg(a: unknown): string {
  if (a instanceof Error) return `${a.message}${a.stack ? "\n" + a.stack : ""}`;
  if (typeof a === "object" && a !== null) { try { return JSON.stringify(a, null, 2); } catch { return String(a); } }
  return String(a);
}

function _appendAppLog(level: AppLogEntry["level"], args: unknown[]) {
  const msg = args.map(_fmtArg).join(" ");
  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => n.toString().padStart(2, "0")).join(":");
  appLogBuffer.push({ level, msg, time });
  // Update the badge count
  const badge = document.getElementById("log-badge");
  if (badge) {
    const count = appLogBuffer.filter(e => e.level === "error").length;
    badge.textContent = String(count);
    badge.classList.toggle("hidden", count === 0);
  }
  // Live-update the panel if it is open
  const list = document.getElementById("app-log-list");
  if (list) _renderAppLogInto(list);
}

function _renderAppLogInto(list: HTMLElement) {
  list.innerHTML = "";
  if (appLogBuffer.length === 0) {
    const empty = document.createElement("p");
    empty.className = "app-log-empty";
    empty.textContent = "No errors or warnings captured yet.";
    list.appendChild(empty);
    return;
  }
  for (const entry of [...appLogBuffer].reverse()) {
    const row = document.createElement("div");
    row.className = `app-log-row app-log-${entry.level}`;
    const time = document.createElement("span"); time.className = "app-log-time"; time.textContent = entry.time;
    const lbl  = document.createElement("span"); lbl.className  = "app-log-level"; lbl.textContent = entry.level.toUpperCase();
    const msgEl = document.createElement("span"); msgEl.className = "app-log-msg"; msgEl.textContent = entry.msg;
    row.append(time, lbl, msgEl);
    list.appendChild(row);
  }
}

// Replace console methods — originals are still called so DevTools still work
const _origConsoleError = console.error.bind(console);
const _origConsoleWarn  = console.warn.bind(console);
console.error = (...args) => { _origConsoleError(...args); _appendAppLog("error", args); };
console.warn  = (...args) => { _origConsoleWarn(...args);  _appendAppLog("warn",  args); };
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Whether to use "simple" mode.
 * - In **simple** mode, the input/output lists are grouped by file format.
 * - In **advanced** mode, these lists are grouped by format handlers, which
 *   requires the user to manually select the tool that processes the output.
 */
let simpleMode: boolean = true;

/** Handlers that support conversion from any formats (populated after handlers load). */
let conversionsFromAnyInput: ConvertPathNode[] = [];

const ui = {
  fileInput: document.querySelector("#file-input") as HTMLInputElement,
  fileSelectArea: document.querySelector("#file-area") as HTMLDivElement,
  convertButton: document.querySelector("#convert-button") as HTMLButtonElement,
  modeToggleButton: document.querySelector("#mode-button") as HTMLButtonElement,
  inputList: document.querySelector("#from-list") as HTMLDivElement,
  outputList: document.querySelector("#to-list") as HTMLDivElement,
  inputSearch: document.querySelector("#search-from") as HTMLInputElement,
  outputSearch: document.querySelector("#search-to") as HTMLInputElement,
  popupBox: document.querySelector("#popup") as HTMLDivElement,
  popupBackground: document.querySelector("#popup-bg") as HTMLDivElement,
  filterButtons: document.querySelectorAll(".filter-btn") as NodeListOf<HTMLButtonElement>,
  // New UI elements
  themeToggle: document.querySelector("#theme-toggle") as HTMLButtonElement,
  settingsToggle: document.querySelector("#settings-toggle") as HTMLButtonElement,
  settingsDrawer: document.querySelector("#settings-drawer") as HTMLDivElement,
  accentColors: document.querySelectorAll(".color-dot") as NodeListOf<HTMLButtonElement>,
  customAccent: document.querySelector("#custom-accent") as HTMLInputElement,
  previewPanel: document.querySelector("#preview-panel") as HTMLDivElement,
  previewContent: document.querySelector("#preview-content") as HTMLDivElement,
  previewClose: document.querySelector("#preview-close") as HTMLButtonElement,
  syncInfoBtn: document.querySelector("#sync-info-btn") as HTMLButtonElement,
  formatCount: document.querySelector("#format-count") as HTMLSpanElement,
  dropIcon: document.querySelector("#drop-icon") as HTMLDivElement,
  fileInfo: document.querySelector("#file-info") as HTMLDivElement,
  fileName: document.querySelector("#file-name") as HTMLSpanElement,
  fileSize: document.querySelector("#file-size") as HTMLSpanElement,
  fileTypeBadge: document.querySelector("#file-type-badge") as HTMLSpanElement,
  modeIndicator: document.querySelector("#mode-indicator") as HTMLSpanElement,
  previewBtn: document.querySelector("#preview-btn") as HTMLButtonElement,
};

/** Current contributor filter: "all", "new", or "original" */
let contributorFilter: string = "all";

/**
 * Filters a list of butttons to exclude those not matching a substring
 * and/or contributor filter.
 * @param list Button list (div) to filter.
 * @param string Substring for which to search.
 */
const filterButtonList = (list: HTMLDivElement, string: string) => {
  for (const button of Array.from(list.children)) {
    if (!(button instanceof HTMLButtonElement)) continue;
    const formatIndex = button.getAttribute("format-index");
    let hasExtension = false;
    if (formatIndex) {
      const format = allOptions[parseInt(formatIndex)];
      hasExtension = format?.format.extension.toLowerCase().includes(string);
    }
    const hasText = button.textContent?.toLowerCase().includes(string);
    const matchesSearch = hasExtension || hasText;

    // Contributor filter
    const isNew = button.getAttribute("data-contributor") !== null;
    let matchesContributor = true;
    if (contributorFilter === "new") matchesContributor = isNew;
    else if (contributorFilter === "original") matchesContributor = !isNew;

    if (!matchesSearch || !matchesContributor) {
      button.style.display = "none";
    } else {
      button.style.display = "";
    }
  }
}

/**
 * Handles search box input by filtering its parent container.
 * @param event Input event from an {@link HTMLInputElement}
 */
const searchHandler = (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const targetParentList = target.parentElement?.querySelector(".format-list");
  if (!(targetParentList instanceof HTMLDivElement)) return;

  const string = target.value.toLowerCase();
  filterButtonList(targetParentList, string);
};

// Assign search handler to both search boxes
ui.inputSearch.oninput = searchHandler;
ui.outputSearch.oninput = searchHandler;

// Contributor filter buttons
ui.filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    ui.filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    contributorFilter = btn.getAttribute("data-filter") || "all";
    filterButtonList(ui.inputList, ui.inputSearch.value.toLowerCase());
    filterButtonList(ui.outputList, ui.outputSearch.value.toLowerCase());
  });
});

// ──── Theme Toggle ────
function applyTheme(theme: string) {
  document.documentElement.setAttribute("data-theme", theme);
  if (ui.themeToggle) ui.themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
  try { localStorage.setItem("convert-theme", theme); } catch {}
}
// Restore saved theme
try {
  const savedTheme = localStorage.getItem("convert-theme") || "dark";
  applyTheme(savedTheme);
} catch { applyTheme("dark"); }

if (ui.themeToggle) {
  ui.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

// ──── Settings Drawer Toggle ────
if (ui.settingsToggle && ui.settingsDrawer) {
  ui.settingsToggle.addEventListener("click", () => {
    ui.settingsDrawer.classList.toggle("hidden");
    // Refresh the log panel whenever the drawer opens
    if (!ui.settingsDrawer.classList.contains("hidden")) {
      const list = document.getElementById("app-log-list");
      if (list) _renderAppLogInto(list);
    }
  });
}

// ──── Accent Color Picker ────
const customSlot1 = document.getElementById("custom-slot-1") as HTMLButtonElement;
const customSlot2 = document.getElementById("custom-slot-2") as HTMLButtonElement;
const customSlot3 = document.getElementById("custom-slot-3") as HTMLButtonElement;
const saveCustomBtn = document.getElementById("save-custom-color") as HTMLButtonElement;
let nextCustomSlot = 1;

function applyAccent(color: string) {
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--highlight-color", color);
  try { localStorage.setItem("convert-accent", color); } catch {}
  // Update active dot (presets + custom slots)
  ui.accentColors.forEach(dot => {
    dot.classList.toggle("active", dot.getAttribute("data-color") === color);
  });
  if (ui.customAccent) ui.customAccent.value = color;
}

function restoreCustomSlots() {
  try {
    const c1 = localStorage.getItem("convert-custom-color-1");
    const c2 = localStorage.getItem("convert-custom-color-2");
    const c3 = localStorage.getItem("convert-custom-color-3");
    if (c1 && customSlot1) {
      customSlot1.style.setProperty("background", c1, "important");
      customSlot1.setAttribute("data-color", c1);
      customSlot1.classList.add("has-color");
    }
    if (c2 && customSlot2) {
      customSlot2.style.setProperty("background", c2, "important");
      customSlot2.setAttribute("data-color", c2);
      customSlot2.classList.add("has-color");
    }
    if (c3 && customSlot3) {
      customSlot3.style.setProperty("background", c3, "important");
      customSlot3.setAttribute("data-color", c3);
      customSlot3.classList.add("has-color");
    }
  } catch {}
}
restoreCustomSlots();

// Restore saved accent
try {
  const savedAccent = localStorage.getItem("convert-accent") || "#6C5CE7";
  applyAccent(savedAccent);
} catch { applyAccent("#6C5CE7"); }

ui.accentColors.forEach(dot => {
  dot.addEventListener("click", () => {
    const color = dot.getAttribute("data-color");
    if (color) applyAccent(color);
  });
});
if (ui.customAccent) {
  ui.customAccent.addEventListener("input", () => {
    applyAccent(ui.customAccent.value);
  });
}
if (saveCustomBtn) {
  saveCustomBtn.addEventListener("click", () => {
    const color = ui.customAccent?.value;
    if (!color) return;
    const slot = nextCustomSlot === 1 ? customSlot1 : nextCustomSlot === 2 ? customSlot2 : customSlot3;
    const key = `convert-custom-color-${nextCustomSlot}`;
    if (slot) {
      slot.style.setProperty("background", color, "important");
      slot.setAttribute("data-color", color);
      slot.classList.add("has-color");
    }
    try { localStorage.setItem(key, color); } catch {}
    applyAccent(color);
    nextCustomSlot = nextCustomSlot >= 3 ? 1 : nextCustomSlot + 1;
  });
}

// ──── Upstream Manager ────
// ──── In-app log clear button ───────────────────────────────────────────────
const copyLogBtn = document.getElementById("copy-log-btn");
if (copyLogBtn) {
  copyLogBtn.addEventListener("click", () => {
    const text = appLogBuffer
      .map(e => `[${e.time}] ${e.level.toUpperCase()} ${e.msg}`)
      .join("\n");
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      (copyLogBtn as HTMLButtonElement).textContent = "Copied!";
      setTimeout(() => { (copyLogBtn as HTMLButtonElement).textContent = "Copy log"; }, 2000);
    }).catch(() => {});
  });
}
const clearLogBtn = document.getElementById("clear-log-btn");
if (clearLogBtn) {
  clearLogBtn.addEventListener("click", () => {
    appLogBuffer.length = 0;
    const list = document.getElementById("app-log-list");
    if (list) _renderAppLogInto(list);
    const badge = document.getElementById("log-badge");
    if (badge) { badge.textContent = "0"; badge.classList.add("hidden"); }
  });
}

// ──── Error banner "Copy errors" button ─────────────────────────────────────
const copyErrorsBtn = document.getElementById("copy-errors-btn");
if (copyErrorsBtn) {
  copyErrorsBtn.addEventListener("click", () => {
    const items = document.querySelectorAll("#error-banner .error-item-text");
    const text = Array.from(items).map(el => el.textContent).join("\n");
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        copyErrorsBtn.textContent = "Copied!";
        setTimeout(() => { copyErrorsBtn.textContent = "Copy errors"; }, 2000);
      });
    }
  });
}

if (ui.syncInfoBtn) {
  ui.syncInfoBtn.addEventListener("click", () => {
    window.showPopup(`
      <div class="upstream-manager">
        <h2>Upstream Manager</h2>
        <p class="um-subtitle">Keep your fork synced with <b>p2r3/convert</b> without losing your work</p>

        <div class="um-section">
          <h3>Quick Sync</h3>
          <div class="um-step">
            <div class="um-step-num">1</div>
            <div class="um-step-content">
              <p>Fetch the latest changes from upstream</p>
              <code class="um-cmd" title="Click to copy" onclick="navigator.clipboard.writeText(this.textContent)">git fetch upstream</code>
            </div>
          </div>
          <div class="um-step">
            <div class="um-step-num">2</div>
            <div class="um-step-content">
              <p>See what changed before merging</p>
              <code class="um-cmd" title="Click to copy" onclick="navigator.clipboard.writeText(this.textContent)">git log --oneline upstream/master..HEAD</code>
              <code class="um-cmd" title="Click to copy" onclick="navigator.clipboard.writeText(this.textContent)">git log --oneline HEAD..upstream/master</code>
            </div>
          </div>
          <div class="um-step">
            <div class="um-step-num">3</div>
            <div class="um-step-content">
              <p>Merge upstream into your branch (keeps your commits on top)</p>
              <code class="um-cmd" title="Click to copy" onclick="navigator.clipboard.writeText(this.textContent)">git merge upstream/master</code>
            </div>
          </div>
          <div class="um-step">
            <div class="um-step-num">4</div>
            <div class="um-step-content">
              <p>Push your updated fork</p>
              <code class="um-cmd" title="Click to copy" onclick="navigator.clipboard.writeText(this.textContent)">git push origin master</code>
            </div>
          </div>
        </div>

        <div class="um-section">
          <h3>Compare Side-by-Side</h3>
          <div class="um-step">
            <div class="um-step-content">
              <p>View diff of what upstream changed vs your code</p>
              <code class="um-cmd" title="Click to copy" onclick="navigator.clipboard.writeText(this.textContent)">git diff HEAD...upstream/master</code>
              <p style="margin-top:6px">Or open the compare view on GitHub:</p>
              <code class="um-cmd" onclick="window.open(this.textContent,'_blank')" style="cursor:pointer;text-decoration:underline">https://github.com/leothefleo49/convert/compare/master...p2r3:convert:master</code>
            </div>
          </div>
        </div>

        <div class="um-section">
          <h3>Cherry-Pick Specific Changes</h3>
          <div class="um-step">
            <div class="um-step-content">
              <p>Pick individual commits without taking everything:</p>
              <code class="um-cmd" title="Click to copy" onclick="navigator.clipboard.writeText(this.textContent)">git log --oneline upstream/master -20</code>
              <code class="um-cmd" title="Click to copy" onclick="navigator.clipboard.writeText(this.textContent)">git cherry-pick &lt;commit-hash&gt;</code>
            </div>
          </div>
        </div>

        <div class="um-section">
          <h3>View Upstream Activity</h3>
          <div class="um-step">
            <div class="um-step-content">
              <p>Check the original repo for recent commits, tags, and releases:</p>
              <code class="um-cmd" onclick="window.open(this.textContent,'_blank')" style="cursor:pointer;text-decoration:underline">https://github.com/p2r3/convert/commits/master</code>
              <code class="um-cmd" onclick="window.open(this.textContent,'_blank')" style="cursor:pointer;text-decoration:underline">https://github.com/p2r3/convert/tags</code>
              <code class="um-cmd" onclick="window.open(this.textContent,'_blank')" style="cursor:pointer;text-decoration:underline">https://github.com/p2r3/convert/releases</code>
            </div>
          </div>
        </div>

        <div class="um-tip">
          <strong>Tip:</strong> If a merge has conflicts, VS Code highlights them. Edit the conflicting files, then
          <code style="color:var(--accent)">git add .</code> and <code style="color:var(--accent)">git commit</code>.
          Your custom handlers in <code style="color:var(--accent)">src/handlers/</code> will almost never conflict
          since they're separate files.
        </div>

        <div class="um-actions">
          <button class="um-btn-primary" onclick="window.hidePopup()">Done</button>
          <button class="um-btn-secondary" onclick="window.open('https://github.com/leothefleo49/convert/compare/master...p2r3:convert:master','_blank')">Open GitHub Compare</button>
        </div>
      </div>
    `);
  });
}

// ──── Preview Close ────
if (ui.previewClose) {
  ui.previewClose.addEventListener("click", () => {
    ui.previewPanel.classList.add("hidden");
    stopPreviewAnimation();
    ui.previewContent.innerHTML = "";
  });
}

// ──── Preview Re-open Button ────
if (ui.previewBtn) {
  ui.previewBtn.addEventListener("click", () => {
    if (currentPreviewFile) {
      // If panel is hidden, re-show it; showFilePreview handles the flicker guard
      ui.previewPanel.classList.remove("hidden");
      showFilePreview(currentPreviewFile);
    }
  });
}

// ──── Drag-over visual feedback ────
ui.fileSelectArea.addEventListener("dragenter", (e) => {
  e.preventDefault();
  ui.fileSelectArea.classList.add("drag-over");
});
ui.fileSelectArea.addEventListener("dragleave", () => {
  ui.fileSelectArea.classList.remove("drag-over");
});
ui.fileSelectArea.addEventListener("dragover", (e) => {
  e.preventDefault();
});
ui.fileSelectArea.addEventListener("drop", () => {
  ui.fileSelectArea.classList.remove("drag-over");
});

/** Format a byte size to a human-readable string */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

/** Cancel any running 3D render loop and dispose renderer */
function stopPreviewAnimation() {
  if (previewAnimFrame !== null) {
    cancelAnimationFrame(previewAnimFrame);
    previewAnimFrame = null;
  }
  const c = ui.previewContent.querySelector("canvas") as HTMLCanvasElement & { __threeRenderer?: { dispose(): void } };
  if (c?.__threeRenderer) { c.__threeRenderer.dispose(); c.__threeRenderer = undefined; }
}

/** Render a 3D model in the preview panel using Three.js */
async function show3DPreview(file: File) {
  const container = document.createElement("div");
  container.className = "preview-3d";
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const label = document.createElement("p");
  label.textContent = "Loading 3D model...";
  label.className = "preview-3d-label";
  container.appendChild(label);
  ui.previewContent.appendChild(container);
  ui.previewPanel.classList.remove("hidden");
  try {
    const THREE = await import("three");
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16162a);
    const w = container.clientWidth || 560, h = Math.round(w * 0.6) || 340;
    canvas.width = w; canvas.height = h;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.001, 10000);
    camera.position.set(0, 1, 3);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    (canvas as HTMLCanvasElement & { __threeRenderer?: { dispose(): void } }).__threeRenderer = renderer;
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const d1 = new THREE.DirectionalLight(0xffffff, 1.2); d1.position.set(5, 8, 5); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xaaaaff, 0.4); d2.position.set(-5, -3, -5); scene.add(d2);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.05;
    const url = URL.createObjectURL(file);
    const ext = file.name.split(".").pop()?.toLowerCase();
    let object: THREE.Object3D | null = null;
    try {
      if (ext === "glb" || ext === "gltf") {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const gltf = await new Promise<any>((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
        object = gltf.scene;
      } else if (ext === "obj") {
        const { OBJLoader } = await import("three/addons/loaders/OBJLoader.js");
        object = await new Promise<THREE.Object3D>((res, rej) => (new OBJLoader()).load(url, res, undefined, rej));
        object.traverse(c => { if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: 0x888888 }); });
      } else if (ext === "stl") {
        const { STLLoader } = await import("three/addons/loaders/STLLoader.js");
        const geo = await new Promise<THREE.BufferGeometry>((res, rej) => new STLLoader().load(url, res, undefined, rej));
        object = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x7799ff }));
      } else if (ext === "ply") {
        const { PLYLoader } = await import("three/addons/loaders/PLYLoader.js");
        const geo = await new Promise<THREE.BufferGeometry>((res, rej) => new PLYLoader().load(url, res, undefined, rej));
        geo.computeVertexNormals();
        object = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x7799ff, vertexColors: (geo.attributes.color !== undefined) }));
      }
    } finally { URL.revokeObjectURL(url); }
    if (object) {
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      object.position.sub(center);
      const scale = 2 / maxDim; object.scale.set(scale, scale, scale);
      scene.add(object);
      scene.add(new THREE.GridHelper(4, 10, 0x333355, 0x222244));
      label.style.display = "none";
      stopPreviewAnimation();
      function animate() { previewAnimFrame = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
      animate();
    } else {
      label.textContent = "Cannot render this 3D format.";
    }
  } catch (e) {
    label.textContent = `3D preview failed: ${e}`;
    console.error("3D preview:", e);
  }
}

/** Show a preview of the selected file */
function showFilePreview(file: File) {
  // If the panel is already open and showing the same file, just make it visible
  if (
    !ui.previewPanel.classList.contains("hidden") &&
    currentPreviewFile === file
  ) {
    ui.previewPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
  currentPreviewFile = file;
  stopPreviewAnimation();
  ui.previewContent.innerHTML = "";
  if (ui.previewBtn) ui.previewBtn.classList.remove("hidden");

  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  // 3D models
  if (["glb", "gltf", "obj", "stl", "ply"].includes(ext)) {
    show3DPreview(file);
    return;
  }

  const url = URL.createObjectURL(file);

  // SVG — inline for full rendering
  if (ext === "svg" || file.type === "image/svg+xml") {
    file.text().then(svgText => {
      URL.revokeObjectURL(url);
      const div = document.createElement("div"); div.className = "preview-svg";
      div.innerHTML = svgText;
      ui.previewContent.appendChild(div);
      ui.previewPanel.classList.remove("hidden");
    }); return;
  }

  // Regular images
  if (file.type.startsWith("image/") || ["webp","bmp","ico","tiff","tif","avif"].includes(ext)) {
    const img = document.createElement("img");
    img.src = url; img.alt = file.name;
    img.onload = () => URL.revokeObjectURL(url);
    ui.previewContent.appendChild(img);
    ui.previewPanel.classList.remove("hidden"); return;
  }

  // Audio
  if (file.type.startsWith("audio/") || ["mp3","wav","ogg","flac","m4a","aac","opus","wma","qoa"].includes(ext)) {
    const audio = document.createElement("audio");
    audio.src = url; audio.controls = true;
    audio.onended = () => URL.revokeObjectURL(url);
    ui.previewContent.appendChild(audio);
    ui.previewPanel.classList.remove("hidden"); return;
  }

  // Video
  if (file.type.startsWith("video/") || ["mp4","webm","mkv","avi","mov","wmv"].includes(ext)) {
    const video = document.createElement("video");
    video.src = url; video.controls = true; video.style.maxWidth = "100%";
    video.onended = () => URL.revokeObjectURL(url);
    ui.previewContent.appendChild(video);
    ui.previewPanel.classList.remove("hidden"); return;
  }

  // PDF
  if (file.type === "application/pdf" || ext === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = url; iframe.className = "pdf-frame";
    ui.previewContent.appendChild(iframe);
    ui.previewPanel.classList.remove("hidden"); return;
  }

  // Fonts — render sample text
  if (["ttf","otf","woff","woff2"].includes(ext)) {
    const fontFace = new FontFace("_PreviewFont", `url(${url})`);
    fontFace.load().then(loaded => {
      document.fonts.add(loaded);
      const div = document.createElement("div"); div.className = "preview-font";
      div.innerHTML =
        `<p style="font-family:'_PreviewFont';font-size:2rem">The quick brown fox jumps over the lazy dog</p>` +
        `<p style="font-family:'_PreviewFont';font-size:1.3rem">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>` +
        `<p style="font-family:'_PreviewFont';font-size:1.3rem">abcdefghijklmnopqrstuvwxyz</p>` +
        `<p style="font-family:'_PreviewFont';font-size:1rem">0123456789 !@#$%^&*()-=+[]{}|;':,./<>?</p>`;
      ui.previewContent.appendChild(div);
      ui.previewPanel.classList.remove("hidden");
      URL.revokeObjectURL(url);
    }).catch(() => URL.revokeObjectURL(url));
    return;
  }

  // CSV / TSV — render as table
  if (["csv","tsv"].includes(ext)) {
    const sep = ext === "tsv" ? "\t" : ",";
    file.text().then(text => {
      URL.revokeObjectURL(url);
      const rows = text.split("\n").slice(0, 60).filter(r => r.trim());
      const table = document.createElement("table"); table.className = "preview-csv";
      rows.forEach((row, i) => {
        const tr = document.createElement("tr");
        row.split(sep).forEach(col => {
          const cell = document.createElement(i === 0 ? "th" : "td");
          cell.textContent = col.replace(/^"|"$/g, "");
          tr.appendChild(cell);
        });
        table.appendChild(tr);
      });
      const w = document.createElement("div"); w.className = "preview-csv-wrapper";
      w.appendChild(table);
      ui.previewContent.appendChild(w);
      ui.previewPanel.classList.remove("hidden");
    }); return;
  }

  // JSON — pretty-print
  if (ext === "json") {
    file.text().then(text => {
      URL.revokeObjectURL(url);
      let display = text;
      try { display = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      const pre = document.createElement("pre"); pre.textContent = display.slice(0, 100000);
      ui.previewContent.appendChild(pre);
      ui.previewPanel.classList.remove("hidden");
    }); return;
  }

  // Text files
  if (
    file.type.startsWith("text/") ||
    file.name.match(/\.(txt|md|xml|yaml|yml|toml|ini|log|sh|bat|py|js|ts|html|css|sql|conf|cfg|srt|vtt|ass|lrc|sbv|env|properties)$/i)
  ) {
    file.text().then(text => {
      URL.revokeObjectURL(url);
      const pre = document.createElement("pre"); pre.textContent = text.slice(0, 100000);
      ui.previewContent.appendChild(pre);
      ui.previewPanel.classList.remove("hidden");
    }); return;
  }

  // No preview available
  URL.revokeObjectURL(url);
}

// Map clicks in the file selection area to the file input element.
// If a <button> (or any child of one, e.g. the SVG icon inside #preview-btn)
// was clicked, let that button handle its own event — don't also open the file picker.
ui.fileSelectArea.addEventListener("click", (e) => {
  if (e.target instanceof Element && e.target.closest("button")) return;
  ui.fileInput.click();
});

/**
 * Validates and stores user selected files. Works for both manual
 * selection and file drag-and-drop.
 * @param event Either a file input element's "change" event,
 * or a "drop" event.
 */
const fileSelectHandler = (event: Event) => {

  let inputFiles;

  if (event instanceof DragEvent) {
    inputFiles = event.dataTransfer?.files;
    if (inputFiles) event.preventDefault();
  } else if (event instanceof ClipboardEvent) {
    inputFiles = event.clipboardData?.files;
  } else {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    inputFiles = target.files;
  }

  if (!inputFiles) return;
  const files = Array.from(inputFiles);
  if (files.length === 0) return;

  if (files.some(c => c.type !== files[0].type)) {
    return alert("All input files must be of the same type.");
  }
  files.sort((a, b) => a.name === b.name ? 0 : (a.name < b.name ? -1 : 1));
  selectedFiles = files;

  // Update the file info bar (keep the drop zone intact)
  ui.fileSelectArea.classList.add("has-file");
  if (ui.dropIcon) ui.dropIcon.style.display = "none";
  const h2 = ui.fileSelectArea.querySelector("h2");
  if (h2) h2.textContent = files.length > 1 ? `${files[0].name} ... and ${files.length - 1} more` : files[0].name;
  const p = ui.fileSelectArea.querySelector("p");
  if (p) p.style.display = "none";

  // Show file info badges
  if (ui.fileInfo) {
    ui.fileInfo.classList.remove("hidden");
    ui.fileName.textContent = files[0].name;
    ui.fileSize.textContent = formatFileSize(files[0].size);
    const ext = files[0].name.split(".").pop()?.toUpperCase() || files[0].type || "FILE";
    ui.fileTypeBadge.textContent = ext;
  }

  // Show file preview
  showFilePreview(files[0]);

  // Common MIME type adjustments (to match "mime" library)
  let mimeType = normalizeMimeType(files[0].type);

  // Find a button matching the input MIME type.
  const buttonMimeType = Array.from(ui.inputList.children).find(button => {
    if (!(button instanceof HTMLButtonElement)) return false;
    return button.getAttribute("mime-type") === mimeType;
  });
  // Click button with matching MIME type.
  if (mimeType && buttonMimeType instanceof HTMLButtonElement) {
    buttonMimeType.click();
    ui.inputSearch.value = mimeType;
    filterButtonList(ui.inputList, ui.inputSearch.value);
    return;
  }

  // Fall back to matching format by file extension if MIME type wasn't found.
  const fileExtension = files[0].name.split(".").pop()?.toLowerCase();

  const buttonExtension = Array.from(ui.inputList.children).find(button => {
    if (!(button instanceof HTMLButtonElement)) return false;
    const formatIndex = button.getAttribute("format-index");
    if (!formatIndex) return;
    const format = allOptions[parseInt(formatIndex)];
    return format.format.extension.toLowerCase() === fileExtension;
  });
  if (buttonExtension instanceof HTMLButtonElement) {
    buttonExtension.click();
    ui.inputSearch.value = buttonExtension.getAttribute("mime-type") || "";
  } else {
    ui.inputSearch.value = fileExtension || "";
  }

  filterButtonList(ui.inputList, ui.inputSearch.value);

};

// Add the file selection handler to both the file input element and to
// the window as a drag-and-drop event, and to the clipboard paste event.
ui.fileInput.addEventListener("change", fileSelectHandler);
window.addEventListener("drop", fileSelectHandler);
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("paste", fileSelectHandler);

/**
 * Display an on-screen popup.
 * @param html HTML content of the popup box.
 */
window.showPopup = function (html: string) {
  ui.popupBox.innerHTML = `<button class="popup-close" onclick="window.hidePopup()">&times;</button>` + html;
  ui.popupBox.style.display = "block";
  ui.popupBackground.style.display = "block";
}
// Click backdrop to close popup
ui.popupBackground.addEventListener("click", () => {
  window.hidePopup();
});
/**
 * Hide the on-screen popup.
 */
window.hidePopup = function () {
  ui.popupBox.style.display = "none";
  ui.popupBackground.style.display = "none";
}

const allOptions: Array<{ format: FileFormat, handler: FormatHandler }> = [];

window.supportedFormatCache = new Map();
window.traversionGraph = new TraversionGraph();

window.printSupportedFormatCache = () => {
  const entries = [];
  for (const entry of window.supportedFormatCache) {
    entries.push(entry);
  }
  return JSON.stringify(entries, null, 2);
}


/** Race a promise against a timeout. Rejects if the promise doesn't settle in time. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} took longer than ${ms}ms`)), ms)
    )
  ]);
}

// ──── Loading Screen ────
const loadingScreen = document.getElementById("loading-screen");
const loadingStatus = document.getElementById("loading-status");
const loadingBarFill = document.getElementById("loading-bar-fill");
const loadingDetail = document.getElementById("loading-detail");
const loadingLog = document.getElementById("loading-log");

function updateLoading(current: number, total: number, handlerName: string) {
  const pct = Math.round((current / total) * 100);
  if (loadingStatus) loadingStatus.textContent = `Initializing tools... ${pct}%`;
  // Switch from indeterminate shimmer to real progress on first call
  if (loadingBarFill) {
    loadingBarFill.classList.add("determinate");
    loadingBarFill.style.width = pct + "%";
  }
  if (loadingDetail) loadingDetail.textContent = handlerName;
}

function logLoading(msg: string, cls: string = "") {
  if (!loadingLog) return;
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = msg;
  loadingLog.appendChild(line);
  loadingLog.scrollTop = loadingLog.scrollHeight;
}

function dismissLoading() {
  if (!loadingScreen) return;
  loadingScreen.classList.add("fade-out");
  setTimeout(() => loadingScreen.classList.add("hidden"), 500);
}

/** Show a persistent error banner below the top bar with a per-item dismiss button */
function showBootError(msg: string) {
  const banner = document.getElementById("error-banner");
  if (!banner) return;
  const item = document.createElement("div");
  item.className = "error-item";
  const text = document.createElement("span");
  text.className = "error-item-text";
  text.textContent = msg;
  const close = document.createElement("button");
  close.className = "error-item-close";
  close.textContent = "\u00d7";
  close.title = "Dismiss";
  close.onclick = () => {
    item.remove();
    if (!banner.querySelector(".error-item")) banner.classList.add("hidden");
  };
  item.append(text, close);
  banner.appendChild(item);
  banner.classList.remove("hidden");
}

/** Yield to the browser so it can repaint */
function yieldToUI(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

async function buildOptionList () {

  allOptions.length = 0;
  ui.inputList.innerHTML = "";
  ui.outputList.innerHTML = "";

  const totalHandlers = handlers.length;
  let loadedCount = 0;

  for (const handler of handlers) {
    loadedCount++;

    // Always update progress bar, even for fast/static handlers
    updateLoading(loadedCount, totalHandlers, handler.name);

    if (!window.supportedFormatCache.has(handler.name)) {
      // Many handlers set supportedFormats in their constructor — no init needed
      if (handler.supportedFormats && handler.supportedFormats.length > 0) {
        window.supportedFormatCache.set(handler.name, handler.supportedFormats);
        logLoading(`[ok] ${handler.name} (ready)`, "log-ok");
        // Yield every 5 static handlers so the bar actually repaints
        if (loadedCount % 5 === 0) await yieldToUI();
      } else {
        // Handler needs init() to populate its format list (e.g. FFmpeg, ImageMagick)
        await yieldToUI();

        try {
          await withTimeout(handler.init(), 12000, handler.name);
          logLoading(`[ok] ${handler.name}`, "log-ok");
        } catch (e) {
          const reason = e instanceof Error ? e.message : String(e);
          logLoading(`[skip] ${handler.name} -- ${reason}`, "log-skip");
          console.warn(`Skipping handler "${handler.name}":`, e);
        }
        // Cache whatever formats became available (even if init partially failed)
        if (handler.supportedFormats && handler.supportedFormats.length > 0) {
          window.supportedFormatCache.set(handler.name, handler.supportedFormats);
        }
      }
    }
    const supportedFormats = window.supportedFormatCache.get(handler.name);
    if (!supportedFormats) {
      console.warn(`Handler "${handler.name}" doesn't support any formats.`);
      continue;
    }
    for (const format of supportedFormats) {

      if (!format.mime) continue;

      allOptions.push({ format, handler });

      // In simple mode, display each input/output format only once
      let addToInputs = true, addToOutputs = true;
      if (simpleMode) {
        addToInputs = !Array.from(ui.inputList.children).some(c => {
          const currFormat = allOptions[parseInt(c.getAttribute("format-index") || "")]?.format;
          return currFormat?.mime === format.mime && currFormat?.format === format.format;
        });
        addToOutputs = !Array.from(ui.outputList.children).some(c => {
          const currFormat = allOptions[parseInt(c.getAttribute("format-index") || "")]?.format;
          return currFormat?.mime === format.mime && currFormat?.format === format.format;
        });
        if ((!format.from || !addToInputs) && (!format.to || !addToOutputs)) continue;
      }

      const newOption = document.createElement("button");
      newOption.setAttribute("format-index", (allOptions.length - 1).toString());
      newOption.setAttribute("mime-type", format.mime);

      // Tag buttons from contributed handlers
      if (handler.contributor) {
        newOption.setAttribute("data-contributor", handler.contributor);
      }

      const formatDescriptor = format.format.toUpperCase();
      if (simpleMode) {
        // Hide any handler-specific information in simple mode
        const cleanName = format.name
          .split("(").join(")").split(")")
          .filter((_, i) => i % 2 === 0)
          .filter(c => c != "")
          .join(" ");
        newOption.appendChild(document.createTextNode(`${formatDescriptor} - ${cleanName} (${format.mime})`));
      } else {
        newOption.appendChild(document.createTextNode(`${formatDescriptor} - ${format.name} (${format.mime}) ${handler.name}`));
      }

      // Add "NEW" badge for contributed formats
      if (handler.contributor) {
        const badge = document.createElement("span");
        badge.className = "new-badge";
        badge.textContent = "NEW";
        newOption.appendChild(badge);
      }

      const clickHandler = (event: Event) => {
        if (!(event.target instanceof HTMLButtonElement)) return;
        const targetParent = event.target.parentElement;
        const previous = targetParent?.getElementsByClassName("selected")?.[0];
        if (previous) previous.className = "";
        event.target.className = "selected";
        const allSelected = document.getElementsByClassName("selected");
        if (allSelected.length === 2) {
          ui.convertButton.className = "";
        } else {
          ui.convertButton.className = "disabled";
        }
      };

      if (format.from && addToInputs) {
        const clone = newOption.cloneNode(true) as HTMLButtonElement;
        clone.onclick = clickHandler;
        ui.inputList.appendChild(clone);
      }
      if (format.to && addToOutputs) {
        const clone = newOption.cloneNode(true) as HTMLButtonElement;
        clone.onclick = clickHandler;
        ui.outputList.appendChild(clone);
      }

    }
  }
  window.traversionGraph.init(window.supportedFormatCache, handlers);
  filterButtonList(ui.inputList, ui.inputSearch.value);
  filterButtonList(ui.outputList, ui.outputSearch.value);

  // Update stats bar
  if (ui.formatCount) {
    const totalInputs = ui.inputList.querySelectorAll("button").length;
    const totalOutputs = ui.outputList.querySelectorAll("button").length;
    const myCount = ui.inputList.querySelectorAll("button[data-contributor]").length
      + ui.outputList.querySelectorAll("button[data-contributor]").length;
    ui.formatCount.textContent = `${totalInputs} input formats · ${totalOutputs} output formats · ${myCount} contributed by you`;
  }

}

(async () => {
  console.log("[convert] Starting initialization...");

  // ── Phase 1: dynamically import handler modules ──
  if (loadingStatus) loadingStatus.textContent = "Loading modules...";
  if (loadingDetail) loadingDetail.textContent = "Fetching converter engines (first load is slowest)";
  logLoading("Importing handler modules...", "");

  // Import each handler individually via loadHandlers() — this prevents
  // one broken module from wiping out the entire format list.
  const { loadHandlers } = await import("./handlers/index.ts").then(
    m => m as typeof import("./handlers/index.ts")
  ).catch(() => ({ loadHandlers: undefined }));

  if (!loadHandlers) {
    const errMsg = "Failed to import handler module loader. Check the console for details.";
    logLoading(`[err] ${errMsg}`, "log-err");
    showBootError(errMsg);
    // Don't dismiss — let user read loading log
    if (loadingStatus) loadingStatus.textContent = "Load failed — see log above";
    if (loadingBarFill) { loadingBarFill.style.background = "#ef4444"; loadingBarFill.style.width = "100%"; }
    const btn = document.createElement("button");
    btn.textContent = "Dismiss";
    btn.style.cssText = "margin-top:16px;padding:8px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer";
    btn.onclick = () => dismissLoading();
    document.getElementById("loading-card")?.appendChild(btn);
    return;
  }

  let handlerErrors = 0;
  handlers = await loadHandlers((msg, cls) => {
    logLoading(msg, cls);
    if (cls === "log-err") handlerErrors++;
  });
  logLoading(`[ok] ${handlers.length} handler(s) ready (${handlerErrors} failed)`, handlers.length > 0 ? "log-ok" : "log-err");
  console.log(`[convert] ${handlers.length} handlers loaded, ${handlerErrors} failed`);
  if (handlerErrors > 0) showBootError(`${handlerErrors} handler(s) failed to load — some formats may be missing. Open Settings → Error Log for details.`);

  // Build conversionsFromAnyInput now that handlers are available
  conversionsFromAnyInput = handlers
    .filter(h => h.supportAnyInput && h.supportedFormats)
    .flatMap(h => h.supportedFormats!
      .filter(f => f.to)
      .map(f => ({ handler: h, format: f })));

  // ── Phase 2: load format cache ──
  try {
    const resp = await fetch("cache.json");
    if (resp.ok) {
      const cacheJSON = await resp.json();
      window.supportedFormatCache = new Map(cacheJSON);
      logLoading("[ok] Format cache loaded from cache.json", "log-ok");
      console.log("[convert] Loaded format cache from cache.json");
    } else {
      throw new Error("No cache.json");
    }
  } catch {
    logLoading("[skip] No cache -- will init handlers individually", "log-skip");
    console.warn(
      "Missing supported format precache.\n\n" +
      "Consider saving the output of printSupportedFormatCache() to cache.json."
    );
  }

  // ── Phase 3: init individual handlers ──
  try {
    await buildOptionList();
    const totalInputs = ui.inputList.querySelectorAll("button").length;
    if (totalInputs === 0 && handlers.length > 0) {
      showBootError("Handlers loaded but no formats were registered. Open Settings → Error Log for details.");
    }
    console.log("[convert] Built initial format list.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    showBootError(`Error building format list: ${msg}`);
    console.error("[convert] Error building option list:", e);
  } finally {
    // Always dismiss: first loading screen, then popup as backup
    dismissLoading();
    window.hidePopup();
  }
})();

if (ui.modeToggleButton) {
  ui.modeToggleButton.addEventListener("click", () => {
    simpleMode = !simpleMode;
    const modeText = simpleMode ? "Simple mode" : "Advanced mode";
    ui.modeToggleButton.textContent = simpleMode ? "Advanced mode" : "Simple mode"; // The button shows what you switch TO
    if (ui.modeIndicator) ui.modeIndicator.textContent = modeText;
    buildOptionList();
  });
}

async function attemptConvertPath (files: FileData[], path: ConvertPathNode[]) {

  ui.popupBox.innerHTML = `<h2>Finding conversion route...</h2>
    <p>Trying <b>${path.map(c => c.format.format).join(" -> ")}</b>...</p>`;

  for (let i = 0; i < path.length - 1; i ++) {
    const handler = path[i + 1].handler;
    try {
      let supportedFormats = window.supportedFormatCache.get(handler.name);
      if (!handler.ready) {
        try {
          await handler.init();
        } catch (_) { return null; }
        if (handler.supportedFormats) {
          window.supportedFormatCache.set(handler.name, handler.supportedFormats);
          supportedFormats = handler.supportedFormats;
        }
      }
      if (!supportedFormats) throw `Handler "${handler.name}" doesn't support any formats.`;
      const inputFormat = supportedFormats.find(c => c.mime === path[i].format.mime && c.from)!;
      files = (await Promise.all([
        handler.doConvert(files, inputFormat, path[i + 1].format),
        // Ensure that we wait long enough for the UI to update
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      ]))[0];
      if (files.some(c => !c.bytes.length)) throw "Output is empty.";
    } catch (e) {
      console.log(path.map(c => c.format.format));
      console.error(handler.name, `${path[i].format.format} -> ${path[i + 1].format.format}`, e);
      ui.popupBox.innerHTML = `<h2>Finding conversion route...</h2>
        <p>Looking for a valid path...</p>`;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return null;
    }
  }

  return { files, path };

}

window.tryConvertByTraversing = async function (
  files: FileData[],
  from: ConvertPathNode,
  to: ConvertPathNode
) {
  for await (const path of window.traversionGraph.searchPath(from, to, simpleMode)) {
    // Use exact output format if the target handler supports it
    if (path.at(-1)?.handler === to.handler) {
      path[path.length - 1] = to;
    }
    const attempt = await attemptConvertPath(files, path);
    if (attempt) return attempt;
  }
  return null;
}

function downloadFile (bytes: Uint8Array, name: string, mime: string) {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
}

ui.convertButton.onclick = async function () {

  const inputFiles = selectedFiles;

  if (inputFiles.length === 0) {
    return alert("Select an input file.");
  }

  const inputButton = document.querySelector("#from-list .selected");
  if (!inputButton) return alert("Specify input file format.");

  const outputButton = document.querySelector("#to-list .selected");
  if (!outputButton) return alert("Specify output file format.");

  const inputOption = allOptions[Number(inputButton.getAttribute("format-index"))];
  const outputOption = allOptions[Number(outputButton.getAttribute("format-index"))];

  const inputFormat = inputOption.format;
  const outputFormat = outputOption.format;

  try {

    const inputFileData = [];
    for (const inputFile of inputFiles) {
      const inputBuffer = await inputFile.arrayBuffer();
      const inputBytes = new Uint8Array(inputBuffer);
      if (inputFormat.mime === outputFormat.mime) {
        downloadFile(inputBytes, inputFile.name, inputFormat.mime);
        continue;
      }
      inputFileData.push({ name: inputFile.name, bytes: inputBytes });
    }

    window.showPopup("<h2>Finding conversion route...</h2>");
    // Delay for a bit to give the browser time to render
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const output = await window.tryConvertByTraversing(inputFileData, inputOption, outputOption);
    if (!output) {
      window.hidePopup();
      alert("Failed to find conversion route.");
      return;
    }

    for (const file of output.files) {
      downloadFile(file.bytes, file.name, outputFormat.mime);
    }

    window.showPopup(
      `<h2>Converted ${inputOption.format.format} to ${outputOption.format.format}!</h2>` +
      `<p>Path used: <b>${output.path.map(c => c.format.format).join(" -> ")}</b>.</p>\n` +
      `<button onclick="window.hidePopup()">OK</button>`
    );

  } catch (e) {

    window.hidePopup();
    alert("Unexpected error while routing:\n" + e);
    console.error(e);

  }

};
