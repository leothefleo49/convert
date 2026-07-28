import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Media Link handler.
 *
 * Turns a URL (from a text file or pasted directly) into:
 *   - the actual media file at that URL (image / video / audio / pdf / etc.)
 *     fetched through a CORS proxy so it works from a static client-side app,
 *   - a JSON metadata report about the link (title, author, thumbnail, provider)
 *     using oEmbed / noembed for social platforms,
 *   - an HTML embed snippet ready to drop into a web page,
 *   - a Markdown link with thumbnail,
 *   - the provider thumbnail image downloaded as a file.
 *
 * Supported platforms for metadata: YouTube (incl. Shorts & Music), Twitch,
 * Facebook, Instagram, Messenger, Reddit, Vimeo, TikTok, SoundCloud, Spotify,
 * Gfycat, Imgur, Streamable, and any provider listed by noembed.com.
 *
 * Direct media URLs (ending in .png/.jpg/.mp4/.mp3/.pdf/.webm/.gif/.webp/.ogg/.wav/.mov)
 * are downloaded as the actual binary file and can then be routed through any
 * other converter (e.g. PNG → JPEG, MP4 → GIF, etc.).
 */

const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

/** Try each proxy in order until one succeeds. */
async function proxiedFetch(url: string, init?: RequestInit): Promise<Response> {
  let lastErr: unknown = null;
  for (const proxy of PROXIES) {
    try {
      const resp = await fetch(proxy(url), init);
      if (resp.ok) return resp;
      lastErr = new Error(`HTTP ${resp.status} via ${proxy.name}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `All CORS proxies failed for ${url}. ` +
    (lastErr instanceof Error ? lastErr.message : String(lastErr))
  );
}

interface PlatformInfo {
  provider: string;
  oembedUrl?: string;   // direct oEmbed endpoint
  useNoembed: boolean;  // fall back to noembed.com
  isDirectMedia?: boolean;
}

const MEDIA_EXT: Record<string, { mime: string; internal: string }> = {
  png:  { mime: "image/png",       internal: "image" },
  jpg:  { mime: "image/jpeg",      internal: "image" },
  jpeg: { mime: "image/jpeg",      internal: "image" },
  gif:  { mime: "image/gif",       internal: "image" },
  webp: { mime: "image/webp",      internal: "image" },
  bmp:  { mime: "image/bmp",       internal: "image" },
  svg:  { mime: "image/svg+xml",   internal: "svg" },
  ico:  { mime: "image/x-icon",    internal: "image" },
  mp4:  { mime: "video/mp4",       internal: "video" },
  webm: { mime: "video/webm",      internal: "video" },
  mov:  { mime: "video/quicktime", internal: "video" },
  mkv:  { mime: "video/x-matroska", internal: "video" },
  avi:  { mime: "video/x-msvideo", internal: "video" },
  m4v:  { mime: "video/x-m4v",     internal: "video" },
  mp3:  { mime: "audio/mpeg",      internal: "audio" },
  wav:  { mime: "audio/wav",       internal: "audio" },
  ogg:  { mime: "audio/ogg",       internal: "audio" },
  oga:  { mime: "audio/ogg",       internal: "audio" },
  flac: { mime: "audio/flac",      internal: "audio" },
  m4a:  { mime: "audio/mp4",       internal: "audio" },
  aac:  { mime: "audio/aac",       internal: "audio" },
  pdf:  { mime: "application/pdf", internal: "pdf" },
  json: { mime: "application/json", internal: "json" },
  txt:  { mime: "text/plain",      internal: "text" },
  html: { mime: "text/html",       internal: "html" },
  htm:  { mime: "text/html",       internal: "html" },
  csv:  { mime: "text/csv",        internal: "csv" },
  xml:  { mime: "application/xml", internal: "xml" },
  zip:  { mime: "application/zip", internal: "zip" },
};

function detectPlatform(rawUrl: string): PlatformInfo {
  const url = rawUrl.toLowerCase();
  const host = url.replace(/^https?:\/\//, "").split("/")[0];

  if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("music.youtube.com")) {
    return { provider: "YouTube", oembedUrl: "https://www.youtube.com/oembed", useNoembed: true };
  }
  if (host.includes("twitch.tv")) {
    return { provider: "Twitch", oembedUrl: "https://www.twitch.tv/oembed", useNoembed: true };
  }
  if (host.includes("vimeo.com")) {
    return { provider: "Vimeo", oembedUrl: "https://vimeo.com/api/oembed.json", useNoembed: true };
  }
  if (host.includes("soundcloud.com")) {
    return { provider: "SoundCloud", oembedUrl: "https://soundcloud.com/oembed", useNoembed: true };
  }
  if (host.includes("spotify.com")) {
    return { provider: "Spotify", oembedUrl: "https://embed.spotify.com/oembed/", useNoembed: true };
  }
  if (host.includes("reddit.com") || host.includes("redd.it")) {
    return { provider: "Reddit", useNoembed: true };
  }
  if (host.includes("facebook.com") || host.includes("fb.watch")) {
    return { provider: "Facebook", useNoembed: true };
  }
  if (host.includes("instagram.com")) {
    return { provider: "Instagram", useNoembed: true };
  }
  if (host.includes("messenger.com")) {
    return { provider: "Messenger", useNoembed: true };
  }
  if (host.includes("tiktok.com")) {
    return { provider: "TikTok", useNoembed: true };
  }
  if (host.includes("imgur.com")) {
    return { provider: "Imgur", useNoembed: true };
  }
  if (host.includes("gfycat.com")) {
    return { provider: "Gfycat", useNoembed: true };
  }
  if (host.includes("streamable.com")) {
    return { provider: "Streamable", useNoembed: true };
  }
  if (host.includes("discord.com") || host.includes("discordapp.com") || host.includes("discordapp.net")) {
    // Discord CDN links (cdn.discordapp.com / media.discordapp.net) are direct media.
    if (host.includes("cdn.discordapp.com") || host.includes("media.discordapp.net")) {
      return { provider: "Discord CDN", useNoembed: false, isDirectMedia: true };
    }
    return { provider: "Discord", useNoembed: true };
  }
  if (host.includes("twitter.com") || host.includes("x.com")) {
    return { provider: "Twitter / X", useNoembed: true };
  }
  if (host.includes("bsky.app") || host.includes("bluesky")) {
    return { provider: "Bluesky", useNoembed: true };
  }
  if (host.includes("pinterest.")) {
    return { provider: "Pinterest", useNoembed: true };
  }
  if (host.includes("loom.com")) {
    return { provider: "Loom", useNoembed: true };
  }
  if (host.includes("github.com") || host.includes("gist.github")) {
    return { provider: "GitHub", useNoembed: true };
  }
  return { provider: "Web", useNoembed: true, isDirectMedia: undefined };
}

function extFromUrl(url: string): string | null {
  const clean = url.split("?")[0].split("#")[0];
  const m = clean.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : null;
}

function mimeFromExt(ext: string): { mime: string; internal: string } | null {
  return MEDIA_EXT[ext] ?? null;
}

class mediaLinkHandler implements FormatHandler {
  public name = "mediaLink";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    // Input: a URL (as text). Either a .txt file containing one URL per line,
    // or a single URL fed in directly from the URL input bar.
    {
      name: "Media / Web Link (URL)",
      format: "url",
      extension: "url",
      mime: "text/uri-list",
      from: true,
      to: false,
      internal: "url",
      category: "data"
    },
    {
      name: "Plain Text (contains URL)",
      format: "text",
      extension: "txt",
      mime: "text/plain",
      from: true,
      to: false,
      internal: "text",
      category: "data"
    },
    // Outputs
    {
      name: "Media File (downloaded from URL)",
      format: "mediafile",
      extension: "bin",
      mime: "application/octet-stream",
      from: false,
      to: true,
      internal: "mediafile",
      category: "data"
    },
    {
      name: "Link Metadata (JSON)",
      format: "linkmeta",
      extension: "meta.json",
      mime: "application/json",
      from: false,
      to: true,
      internal: "linkmeta",
      category: "data"
    },
    {
      name: "HTML Embed Snippet",
      format: "htmlembed",
      extension: "embed.html",
      mime: "text/html",
      from: false,
      to: true,
      internal: "htmlembed",
      category: "document"
    },
    {
      name: "Markdown Link Card",
      format: "mdlink",
      extension: "link.md",
      mime: "text/markdown",
      from: false,
      to: true,
      internal: "mdlink",
      category: "text"
    },
    {
      name: "Thumbnail Image (PNG)",
      format: "thumbpng",
      extension: "thumb.png",
      mime: "image/png",
      from: false,
      to: true,
      internal: "thumbpng",
      category: "image"
    }
  ];

  async init() {
    this.ready = true;
  }

  /** Extract the first valid URL from a chunk of text. */
  private extractUrl(text: string): string | null {
    const m = text.match(/https?:\/\/[^\s"'<>\]\)]+/i);
    return m ? m[0] : null;
  }

  /** Fetch oEmbed-style metadata. Tries provider's own oEmbed, then noembed.com. */
  private async fetchMetadata(url: string, info: PlatformInfo): Promise<Record<string, unknown>> {
    // 1. Direct provider oEmbed
    if (info.oembedUrl) {
      try {
        const oembedReq = `${info.oembedUrl}?url=${encodeURIComponent(url)}&format=json`;
        const resp = await proxiedFetch(oembedReq);
        const data = await resp.json();
        if (data && (data.title || data.author_name || data.html)) {
          return { source: "oembed", provider: info.provider, originalUrl: url, ...data };
        }
      } catch { /* fall through to noembed */ }
    }
    // 2. noembed.com (aggregates many providers)
    if (info.useNoembed) {
      try {
        const resp = await proxiedFetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        const data = await resp.json();
        if (data && !data.error) {
          return { source: "noembed", provider: info.provider, originalUrl: url, ...data };
        }
      } catch { /* fall through */ }
    }
    // 3. Last resort: fetch the page HTML and pull <title> / <meta> tags.
    try {
      const resp = await proxiedFetch(url);
      const html = await resp.text();
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const descMatch = html.match(/<meta[^>]+name=["']description["']\s+content=["']([^"']*)["']/i)
        || html.match(/<meta[^>]+property=["']og:description["']\s+content=["']([^"']*)["']/i);
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["']\s+content=["']([^"']*)["']/i);
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["']\s+content=["']([^"']*)["']/i);
      const ogSiteMatch = html.match(/<meta[^>]+property=["']og:site_name["']\s+content=["']([^"']*)["']/i);
      return {
        source: "html-meta",
        provider: ogSiteMatch?.[1] || info.provider,
        originalUrl: url,
        title: ogTitleMatch?.[1] || titleMatch?.[1]?.trim() || url,
        description: descMatch?.[1] || null,
        thumbnail_url: ogImageMatch?.[1] || null,
        html: null
      };
    } catch (e) {
      return {
        source: "none",
        provider: info.provider,
        originalUrl: url,
        title: url,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }

  /** Build an iframe-based HTML embed snippet. */
  private buildEmbed(url: string, meta: Record<string, unknown>): string {
    const provider = String(meta.provider ?? "Web");
    const title = String(meta.title ?? url);

    // YouTube / YouTube Music / Shorts → use youtube-nocookie embed
    if (/youtube\.com|youtu\.be|music\.youtube\.com/i.test(url)) {
      const id = this.extractYouTubeId(url);
      if (id) {
        return `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${id}" title="${this.escapeHtml(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      }
    }
    // Vimeo
    if (/vimeo\.com/i.test(url)) {
      const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (id) return `<iframe src="https://player.vimeo.com/video/${id}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${this.escapeHtml(title)}"></iframe>`;
    }
    // Twitch
    if (/twitch\.tv/i.test(url)) {
      const parent = location.hostname || "localhost";
      const channel = url.match(/twitch\.tv\/([A-Za-z0-9_]+)/)?.[1];
      if (channel) return `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=${parent}" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620" title="${this.escapeHtml(title)}"></iframe>`;
    }
    // Spotify
    if (/spotify\.com/i.test(url)) {
      const embedUrl = url.replace("open.spotify.com/", "open.spotify.com/embed/");
      return `<iframe src="${this.escapeAttr(embedUrl)}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="${this.escapeHtml(title)}"></iframe>`;
    }
    // SoundCloud
    if (/soundcloud\.com/i.test(url)) {
      return `<iframe width="100%" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false" title="${this.escapeHtml(title)}"></iframe>`;
    }
    // Fallback: provider's own embed HTML if oEmbed returned one
    if (typeof meta.html === "string" && meta.html.trim()) {
      return meta.html;
    }
    // Generic fallback: an anchor card with thumbnail if available
    const thumb = typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
    return `<a href="${this.escapeAttr(url)}" target="_blank" rel="noopener" style="display:inline-block;max-width:480px;font-family:sans-serif;text-decoration:none;color:inherit;border:1px solid #ddd;border-radius:12px;overflow:hidden">
${thumb ? `  <img src="${this.escapeAttr(thumb)}" alt="" style="display:block;width:100%;height:auto">\n` : ""}  <div style="padding:12px">
    <strong>${this.escapeHtml(title)}</strong><br>
    <span style="color:#666;font-size:0.85rem">${this.escapeHtml(provider)} ↗</span>
  </div>
</a>`;
  }

  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|music\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
      /[?&]v=([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  private escapeAttr(s: string): string {
    return this.escapeHtml(s);
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const results: FileData[] = [];

    for (const file of inputFiles) {
      const text = new TextDecoder().decode(file.bytes).trim();
      const url = this.extractUrl(text);
      if (!url) {
        throw new Error(`No valid URL found in input "${file.name}". Expected an http(s) link.`);
      }

      const info = detectPlatform(url);

      // ── Output: HTML embed ──────────────────────────────
      if (outputFormat.internal === "htmlembed") {
        const meta = await this.fetchMetadata(url, info);
        const html = this.buildEmbed(url, meta);
        results.push({
          bytes: new TextEncoder().encode(html),
          name: file.name.replace(/\.[^.]+$/, "") + ".embed.html"
        });
        continue;
      }

      // ── Output: Markdown link card ──────────────────────
      if (outputFormat.internal === "mdlink") {
        const meta = await this.fetchMetadata(url, info);
        const title = String(meta.title ?? url);
        const thumb = typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
        const author = typeof meta.author_name === "string" ? meta.author_name : null;
        let md = `# ${title}\n\n`;
        md += `**Provider:** ${meta.provider ?? "Web"}  \n`;
        if (author) md += `**Author:** ${author}  \n`;
        md += `**URL:** ${url}\n\n`;
        if (thumb) md += `![${title}](${thumb})\n\n`;
        if (meta.description) md += `> ${String(meta.description).replace(/\n/g, "\n> ")}\n\n`;
        if (typeof meta.html === "string" && meta.html.trim()) {
          md += "## Embed\n\n```html\n" + meta.html + "\n```\n";
        }
        results.push({
          bytes: new TextEncoder().encode(md),
          name: file.name.replace(/\.[^.]+$/, "") + ".link.md"
        });
        continue;
      }

      // ── Output: metadata JSON ───────────────────────────
      if (outputFormat.internal === "linkmeta") {
        const meta = await this.fetchMetadata(url, info);
        results.push({
          bytes: new TextEncoder().encode(JSON.stringify(meta, null, 2)),
          name: file.name.replace(/\.[^.]+$/, "") + ".meta.json"
        });
        continue;
      }

      // ── Output: thumbnail PNG ───────────────────────────
      if (outputFormat.internal === "thumbpng") {
        const meta = await this.fetchMetadata(url, info);
        const thumb = typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
        if (!thumb) {
          throw new Error(`No thumbnail available for this link (${info.provider}).`);
        }
        const imgResp = await proxiedFetch(thumb);
        const buf = await imgResp.arrayBuffer();
        results.push({
          bytes: new Uint8Array(buf),
          name: file.name.replace(/\.[^.]+$/, "") + ".thumb.png"
        });
        continue;
      }

      // ── Output: media file (download the actual content) ──
      if (outputFormat.internal === "mediafile") {
        // Direct media URL? Fetch the binary.
        const ext = extFromUrl(url);
        const detected = ext ? mimeFromExt(ext) : null;
        const isDirect = info.isDirectMedia || (detected !== null);

        if (isDirect) {
          const resp = await proxiedFetch(url);
          const buf = await resp.arrayBuffer();
          const baseName = (() => {
            const fromPath = url.split("?")[0].split("/").pop() || "download";
            return decodeURIComponent(fromPath);
          })();
          results.push({
            bytes: new Uint8Array(buf),
            name: baseName
          });
          continue;
        }

        // Social / protected link: try to fetch the oEmbed thumbnail as the
        // "media" so the user still walks away with something real. If the
        // provider returned an embeddable HTML with a media src we cannot
        // reliably extract a direct media URL client-side, so we return the
        // thumbnail image as the media file.
        const meta = await this.fetchMetadata(url, info);
        const thumb = typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
        if (thumb) {
          try {
            const imgResp = await proxiedFetch(thumb);
            const buf = await imgResp.arrayBuffer();
            const thumbExt = extFromUrl(thumb) || "jpg";
            results.push({
              bytes: new Uint8Array(buf),
              name: file.name.replace(/\.[^.]+$/, "") + `-thumbnail.${thumbExt}`
            });
            continue;
          } catch {
            // fall through to error below
          }
        }
        throw new Error(
          `${info.provider} does not expose a direct downloadable media file from a browser. ` +
          `Convert this URL to "Link Metadata (JSON)" or "HTML Embed Snippet" instead. ` +
          `For the actual video/audio, use a desktop tool like yt-dlp.`
        );
      }

      throw new Error(`Unsupported media-link output: ${outputFormat.internal}`);
    }

    return results;
  }
}

export default mediaLinkHandler;
