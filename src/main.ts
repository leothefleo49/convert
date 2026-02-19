import type { FileFormat, FileData, FormatHandler, ConvertPathNode } from "./FormatHandler.js";
import normalizeMimeType from "./normalizeMimeType.js";
import handlers from "./handlers";
import { TraversionGraph } from "./TraversionGraph.js";

/** Files currently selected for conversion */
let selectedFiles: File[] = [];
/**
 * Whether to use "simple" mode.
 * - In **simple** mode, the input/output lists are grouped by file format.
 * - In **advanced** mode, these lists are grouped by format handlers, which
 *   requires the user to manually select the tool that processes the output.
 */
let simpleMode: boolean = true;

/** Handlers that support conversion from any formats. */
const conversionsFromAnyInput: ConvertPathNode[] = handlers
.filter(h => h.supportAnyInput && h.supportedFormats)
.flatMap(h => h.supportedFormats!
  .filter(f => f.to)
  .map(f => ({ handler: h, format: f})))

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
  if (ui.themeToggle) ui.themeToggle.textContent = theme === "dark" ? "☀" : "☽";
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
  });
}

// ──── Accent Color Picker ────
function applyAccent(color: string) {
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--highlight-color", color);
  try { localStorage.setItem("convert-accent", color); } catch {}
  // Update active dot
  ui.accentColors.forEach(dot => {
    dot.classList.toggle("active", dot.getAttribute("data-color") === color);
  });
  if (ui.customAccent) ui.customAccent.value = color;
}
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

// ──── Upstream Manager ────
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
    ui.previewContent.innerHTML = "";
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

/** Show a preview of the selected file */
function showFilePreview(file: File) {
  const url = URL.createObjectURL(file);
  ui.previewContent.innerHTML = "";

  if (file.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = file.name;
    ui.previewContent.appendChild(img);
    ui.previewPanel.classList.remove("hidden");
  } else if (file.type.startsWith("audio/")) {
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    ui.previewContent.appendChild(audio);
    ui.previewPanel.classList.remove("hidden");
  } else if (file.type.startsWith("video/")) {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.style.maxWidth = "100%";
    ui.previewContent.appendChild(video);
    ui.previewPanel.classList.remove("hidden");
  } else if (file.type === "application/pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.className = "pdf-frame";
    ui.previewContent.appendChild(iframe);
    ui.previewPanel.classList.remove("hidden");
  } else if (file.type.startsWith("text/") || file.name.match(/\.(txt|md|json|xml|csv|tsv|yaml|yml|toml|ini|log|sh|bat|py|js|ts|html|css|sql|conf|cfg)$/i)) {
    file.text().then(text => {
      const pre = document.createElement("pre");
      pre.textContent = text.slice(0, 50000); // limit preview size
      ui.previewContent.appendChild(pre);
      ui.previewPanel.classList.remove("hidden");
    });
  }
  // else: no preview available, keep hidden
}

// Map clicks in the file selection area to the file input element
ui.fileSelectArea.onclick = () => {
  ui.fileInput.click();
};

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
  ui.popupBox.innerHTML = html;
  ui.popupBox.style.display = "block";
  ui.popupBackground.style.display = "block";
}
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
  if (loadingStatus) loadingStatus.textContent = `Loading tools... ${pct}%`;
  if (loadingBarFill) loadingBarFill.style.width = pct + "%";
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

    if (!window.supportedFormatCache.has(handler.name)) {
      updateLoading(loadedCount, totalHandlers, handler.name);
      // Yield so the browser actually paints the progress update
      await yieldToUI();

      try {
        await withTimeout(handler.init(), 8000, handler.name);
        logLoading(`✓ ${handler.name}`, "log-ok");
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        logLoading(`⊘ ${handler.name} — ${reason}`, "log-skip");
        console.warn(`Skipping handler "${handler.name}":`, e);
        continue;
      }
      if (handler.supportedFormats) {
        window.supportedFormatCache.set(handler.name, handler.supportedFormats);
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
  try {
    const resp = await fetch("cache.json");
    if (resp.ok) {
      const cacheJSON = await resp.json();
      window.supportedFormatCache = new Map(cacheJSON);
      console.log("[convert] Loaded format cache from cache.json");
    } else {
      throw new Error("No cache.json");
    }
  } catch {
    console.warn(
      "Missing supported format precache.\n\n" +
      "Consider saving the output of printSupportedFormatCache() to cache.json."
    );
  }
  try {
    await buildOptionList();
    console.log("[convert] Built initial format list.");
  } catch (e) {
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
    if (simpleMode) {
      ui.modeToggleButton.textContent = "Advanced mode";
    } else {
      ui.modeToggleButton.textContent = "Simple mode";
    }
    buildOptionList();
  });
}

async function attemptConvertPath (files: FileData[], path: ConvertPathNode[]) {

  ui.popupBox.innerHTML = `<h2>Finding conversion route...</h2>
    <p>Trying <b>${path.map(c => c.format.format).join(" → ")}</b>...</p>`;

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
      console.error(handler.name, `${path[i].format.format} → ${path[i + 1].format.format}`, e);
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
      `<p>Path used: <b>${output.path.map(c => c.format.format).join(" → ")}</b>.</p>\n` +
      `<button onclick="window.hidePopup()">OK</button>`
    );

  } catch (e) {

    window.hidePopup();
    alert("Unexpected error while routing:\n" + e);
    console.error(e);

  }

};
