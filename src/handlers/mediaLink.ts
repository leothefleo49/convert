import CommonFormats from "../CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Media Link handler.
 *
 * Turns a URL (from a text file or pasted directly) into:
 *   - the actual media file (image / video / audio) downloaded via Cobalt /
 *     Invidious / Piped APIs for social platforms, or via a CORS-proxy chain
 *     for direct media URLs,
 *   - a JSON metadata report (oEmbed + noembed + HTML meta fallback),
 *   - an HTML embed snippet (native iframes for YT/Vimeo/Twitch/Spotify/SoundCloud),
 *   - a Markdown link card with thumbnail,
 *   - the provider thumbnail image downloaded as a file.
 *
 * Supported platforms: YouTube (incl. Shorts & Music), Twitch, Vimeo,
 * SoundCloud, Spotify, Reddit, Facebook, Instagram, Messenger, TikTok,
 * Imgur, Gfycat, Streamable, Discord (incl. CDN), Twitter / X, Bluesky,
 * Pinterest, Loom, GitHub, and any provider listed by noembed.com.
 */

// ─── CORS proxy chain (used for direct media + metadata fetches) ─────────────

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
      lastErr = new Error(`HTTP ${resp.status} via proxy`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `All CORS proxies failed for ${url}. ` +
    (lastErr instanceof Error ? lastErr.message : String(lastErr))
  );
}

// ─── Platform detection ──────────────────────────────────────────────────────

interface PlatformInfo {
  provider: string;
  oembedUrl?: string;
  useNoembed: boolean;
  isDirectMedia?: boolean;
}

function detectPlatform(rawUrl: string): PlatformInfo {
  const host = rawUrl.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];

  if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("music.youtube.com")) {
    return { provider: "YouTube", oembedUrl: "https://www.youtube.com/oembed", useNoembed: true };
  }
  if (host.includes("twitch.tv"))  return { provider: "Twitch",      oembedUrl: "https://www.twitch.tv/oembed",     useNoembed: true };
  if (host.includes("vimeo.com"))  return { provider: "Vimeo",       oembedUrl: "https://vimeo.com/api/oembed.json", useNoembed: true };
  if (host.includes("soundcloud.com")) return { provider: "SoundCloud", oembedUrl: "https://soundcloud.com/oembed",  useNoembed: true };
  if (host.includes("spotify.com")) return { provider: "Spotify",    oembedUrl: "https://embed.spotify.com/oembed/", useNoembed: true };
  if (host.includes("reddit.com") || host.includes("redd.it"))   return { provider: "Reddit",     useNoembed: true };
  if (host.includes("facebook.com") || host.includes("fb.watch")) return { provider: "Facebook",  useNoembed: true };
  if (host.includes("instagram.com"))  return { provider: "Instagram", useNoembed: true };
  if (host.includes("messenger.com"))  return { provider: "Messenger",  useNoembed: true };
  if (host.includes("tiktok.com"))     return { provider: "TikTok",     useNoembed: true };
  if (host.includes("imgur.com"))      return { provider: "Imgur",      useNoembed: true };
  if (host.includes("gfycat.com"))     return { provider: "Gfycat",     useNoembed: true };
  if (host.includes("streamable.com")) return { provider: "Streamable", useNoembed: true };
  if (host.includes("discord.com") || host.includes("discordapp.com") || host.includes("discordapp.net")) {
    if (host.includes("cdn.discordapp.com") || host.includes("media.discordapp.net")) {
      return { provider: "Discord CDN", useNoembed: false, isDirectMedia: true };
    }
    return { provider: "Discord", useNoembed: true };
  }
  if (host.includes("twitter.com") || host.includes("x.com"))   return { provider: "Twitter / X", useNoembed: true };
  if (host.includes("bsky.app") || host.includes("bluesky"))    return { provider: "Bluesky",     useNoembed: true };
  if (host.includes("pinterest."))    return { provider: "Pinterest", useNoembed: true };
  if (host.includes("loom.com"))      return { provider: "Loom",       useNoembed: true };
  if (host.includes("github.com") || host.includes("gist.github")) return { provider: "GitHub",  useNoembed: true };
  return { provider: "Web", useNoembed: true, isDirectMedia: undefined };
}

function extFromUrl(url: string): string | null {
  const clean = url.split("?")[0].split("#")[0];
  const m = clean.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : null;
}

const MEDIA_EXT: Record<string, { mime: string }> = {
  png: { mime: "image/png" }, jpg: { mime: "image/jpeg" }, jpeg: { mime: "image/jpeg" },
  gif: { mime: "image/gif" }, webp: { mime: "image/webp" }, bmp: { mime: "image/bmp" },
  svg: { mime: "image/svg+xml" }, ico: { mime: "image/x-icon" },
  mp4: { mime: "video/mp4" }, webm: { mime: "video/webm" }, mov: { mime: "video/quicktime" },
  mkv: { mime: "video/x-matroska" }, avi: { mime: "video/x-msvideo" }, m4v: { mime: "video/x-m4v" },
  mp3: { mime: "audio/mpeg" }, wav: { mime: "audio/wav" }, ogg: { mime: "audio/ogg" },
  oga: { mime: "audio/ogg" }, flac: { mime: "audio/flac" }, m4a: { mime: "audio/mp4" }, aac: { mime: "audio/aac" },
  pdf: { mime: "application/pdf" }, json: { mime: "application/json" }, txt: { mime: "text/plain" },
  html: { mime: "text/html" }, htm: { mime: "text/html" }, csv: { mime: "text/csv" },
  xml: { mime: "application/xml" }, zip: { mime: "application/zip" },
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export default class MediaLinkHandler implements FormatHandler {
  public name = "mediaLink";
  public contributor = "leothefleo49";
  public ready = false;

  public supportedFormats: FileFormat[] = [
    CommonFormats.URL.supported("url", true, false),
    CommonFormats.TEXT.supported("text", true, false),
    CommonFormats.MP4.supported("mp4", false, true),
    CommonFormats.WEBM.supported("webm", false, true),
    CommonFormats.GIF.supported("gif", false, true),
    CommonFormats.MP3.supported("mp3", false, true),
    CommonFormats.WAV.supported("wav", false, true),
    CommonFormats.PNG.supported("png", false, true),
    CommonFormats.JPEG.supported("jpeg", false, true),
    // Rich outputs (my additions)
    {
      name: "Link Metadata (JSON)",
      format: "linkmeta",
      extension: "meta.json",
      mime: "application/json",
      from: false, to: true,
      internal: "linkmeta",
      category: "data"
    },
    {
      name: "HTML Embed Snippet",
      format: "htmlembed",
      extension: "embed.html",
      mime: "text/html",
      from: false, to: true,
      internal: "htmlembed",
      category: "document"
    },
    {
      name: "Markdown Link Card",
      format: "mdlink",
      extension: "link.md",
      mime: "text/markdown",
      from: false, to: true,
      internal: "mdlink",
      category: "text"
    },
    {
      name: "Thumbnail Image (PNG)",
      format: "thumbpng",
      extension: "thumb.png",
      mime: "image/png",
      from: false, to: true,
      internal: "thumbpng",
      category: "image"
    }
  ];

  async init(): Promise<void> {
    this.ready = true;
  }

  // ── URL helpers ───────────────────────────────────────────────────────────

  private extractUrl(text: string): string | null {
    const m = text.match(/https?:\/\/[^\s"'<>\]\)]+/i);
    return m ? m[0] : null;
  }

  private extractYouTubeId(urlStr: string): string | null {
    try {
      const u = new URL(urlStr);
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.slice(1).split("?")[0].split("/")[0] || null;
      }
      if (u.hostname.includes("youtube.com") || u.hostname.includes("music.youtube.com")) {
        if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/shorts/")[1].split("?")[0].split("/")[0] || null;
        if (u.pathname.startsWith("/watch"))    return u.searchParams.get("v") || null;
        if (u.pathname.startsWith("/embed/"))   return u.pathname.split("/embed/")[1].split("?")[0].split("/")[0] || null;
        if (u.pathname.startsWith("/live/"))    return u.pathname.split("/live/")[1].split("?")[0].split("/")[0] || null;
      }
    } catch { /* not a valid URL */ }
    return null;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  private escapeAttr(s: string): string { return this.escapeHtml(s); }

  // ── Metadata (oEmbed / noembed / HTML meta) ───────────────────────────────

  private async fetchMetadata(url: string, info: PlatformInfo): Promise<Record<string, unknown>> {
    if (info.oembedUrl) {
      try {
        const resp = await proxiedFetch(`${info.oembedUrl}?url=${encodeURIComponent(url)}&format=json`);
        const data = await resp.json();
        if (data && (data.title || data.author_name || data.html)) {
          return { source: "oembed", provider: info.provider, originalUrl: url, ...data };
        }
      } catch { /* fall through */ }
    }
    if (info.useNoembed) {
      try {
        const resp = await proxiedFetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        const data = await resp.json();
        if (data && !data.error) {
          return { source: "noembed", provider: info.provider, originalUrl: url, ...data };
        }
      } catch { /* fall through */ }
    }
    // Last resort: fetch the page HTML and pull <title> / og:* meta tags.
    try {
      const resp = await proxiedFetch(url);
      const html = await resp.text();
      const titleMatch    = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const descMatch     = html.match(/<meta[^>]+name=["']description["']\s+content=["']([^"']*)["']/i)
                         || html.match(/<meta[^>]+property=["']og:description["']\s+content=["']([^"']*)["']/i);
      const ogImageMatch  = html.match(/<meta[^>]+property=["']og:image["']\s+content=["']([^"']*)["']/i);
      const ogTitleMatch  = html.match(/<meta[^>]+property=["']og:title["']\s+content=["']([^"']*)["']/i);
      const ogSiteMatch   = html.match(/<meta[^>]+property=["']og:site_name["']\s+content=["']([^"']*)["']/i);
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
        source: "none", provider: info.provider, originalUrl: url, title: url,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  }

  // ── Embed builder ─────────────────────────────────────────────────────────

  private buildEmbed(url: string, meta: Record<string, unknown>): string {
    const provider = String(meta.provider ?? "Web");
    const title = String(meta.title ?? url);

    if (/youtube\.com|youtu\.be|music\.youtube\.com/i.test(url)) {
      const id = this.extractYouTubeId(url);
      if (id) {
        return `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${id}" title="${this.escapeHtml(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      }
    }
    if (/vimeo\.com/i.test(url)) {
      const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (id) return `<iframe src="https://player.vimeo.com/video/${id}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${this.escapeHtml(title)}"></iframe>`;
    }
    if (/twitch\.tv/i.test(url)) {
      const parent = location.hostname || "localhost";
      const channel = url.match(/twitch\.tv\/([A-Za-z0-9_]+)/)?.[1];
      if (channel) return `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=${parent}" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620" title="${this.escapeHtml(title)}"></iframe>`;
    }
    if (/spotify\.com/i.test(url)) {
      const embedUrl = url.replace("open.spotify.com/", "open.spotify.com/embed/");
      return `<iframe src="${this.escapeAttr(embedUrl)}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="${this.escapeHtml(title)}"></iframe>`;
    }
    if (/soundcloud\.com/i.test(url)) {
      return `<iframe width="100%" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false" title="${this.escapeHtml(title)}"></iframe>`;
    }
    if (typeof meta.html === "string" && meta.html.trim()) return meta.html;

    const thumb = typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
    return `<a href="${this.escapeAttr(url)}" target="_blank" rel="noopener" style="display:inline-block;max-width:480px;font-family:sans-serif;text-decoration:none;color:inherit;border:1px solid #ddd;border-radius:12px;overflow:hidden">
${thumb ? `  <img src="${this.escapeAttr(thumb)}" alt="" style="display:block;width:100%;height:auto">\n` : ""}  <div style="padding:12px">
    <strong>${this.escapeHtml(title)}</strong><br>
    <span style="color:#666;font-size:0.85rem">${this.escapeHtml(provider)} ↗</span>
  </div>
</a>`;
  }

  // ── Media download via Cobalt / Invidious / Piped ─────────────────────────
  // (adapted from the previous remote implementation)

  private async downloadViaCobalt(
    targetUrl: string, isAudioOnly: boolean
  ): Promise<{ bytes: Uint8Array; mime: string; ext: string } | null> {
    const cobaltInstances = [
      "https://api.cobalt.tools",
      "https://cobalt.stream.gdn",
      "https://co.wuk.sh"
    ];
    for (const instance of cobaltInstances) {
      try {
        const resp = await fetch(`${instance}/api/json`, {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            url: targetUrl,
            downloadMode: isAudioOnly ? "audio" : "video",
            videoQuality: "max",
            audioFormat: "mp3"
          })
        });
        if (!resp.ok) continue;
        const data = await resp.json();
        let mediaDirectUrl: string | null = null;
        if (data.status === "redirect" || data.status === "tunnel" || data.status === "stream") {
          mediaDirectUrl = data.url;
        } else if (data.status === "picker" && Array.isArray(data.picker) && data.picker.length > 0) {
          mediaDirectUrl = data.picker[0].url;
        }
        if (mediaDirectUrl) {
          const mediaResp = await fetch(mediaDirectUrl);
          if (mediaResp.ok) {
            const buf = await mediaResp.arrayBuffer();
            const mime = mediaResp.headers.get("content-type") || (isAudioOnly ? "audio/mpeg" : "video/mp4");
            const ext = isAudioOnly ? "mp3" : "mp4";
            return { bytes: new Uint8Array(buf), mime, ext };
          }
        }
      } catch (e) {
        console.warn(`[mediaLink] Cobalt instance ${instance} failed:`, e);
      }
    }
    return null;
  }

  private async downloadYouTubeFallback(
    ytId: string, isAudioOnly: boolean
  ): Promise<{ bytes: Uint8Array; mime: string; ext: string } | null> {
    const apis = [
      `https://pipedapi.kavin.rocks/streams/${ytId}`,
      `https://inv.tux.pizza/api/v1/videos/${ytId}`,
      `https://invidious.nerdvpn.de/api/v1/videos/${ytId}`
    ];
    for (const api of apis) {
      try {
        const resp = await fetch(api);
        if (!resp.ok) continue;
        const data = await resp.json();
        let streamUrl: string | null = null;
        let mime = isAudioOnly ? "audio/mpeg" : "video/mp4";

        if (api.includes("pipedapi")) {
          if (isAudioOnly && data.audioStreams?.length) {
            streamUrl = data.audioStreams[0].url;
            mime = data.audioStreams[0].mimeType || mime;
          } else if (data.videoStreams?.length) {
            const stream = data.videoStreams.find((s: any) => s.videoOnly === false) || data.videoStreams[0];
            streamUrl = stream.url;
            mime = stream.mimeType || mime;
          }
        } else {
          if (isAudioOnly && data.adaptiveFormats?.length) {
            const audioFormat = data.adaptiveFormats.find((f: any) => f.type?.includes("audio"));
            if (audioFormat) streamUrl = audioFormat.url;
          } else if (data.formatStreams?.length) {
            streamUrl = data.formatStreams[0].url;
          }
        }
        if (streamUrl) {
          const mediaResp = await fetch(streamUrl);
          if (mediaResp.ok) {
            const buf = await mediaResp.arrayBuffer();
            return { bytes: new Uint8Array(buf), mime: mime.split(";")[0], ext: isAudioOnly ? "mp3" : "mp4" };
          }
        }
      } catch (e) {
        console.warn(`[mediaLink] YouTube API fallback ${api} failed:`, e);
      }
    }
    return null;
  }

  private async fetchThumbnail(urlStr: string): Promise<{ bytes: Uint8Array; mime: string; ext: string } | null> {
    const ytId = this.extractYouTubeId(urlStr);
    if (ytId) {
      const thumbUrls = [
        `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      ];
      for (const tUrl of thumbUrls) {
        try {
          const resp = await fetch(tUrl);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            return { bytes: new Uint8Array(buf), mime: "image/jpeg", ext: "jpg" };
          }
        } catch {}
      }
    }
    // Fallback: oEmbed / og:image thumbnail via proxy
    const info = detectPlatform(urlStr);
    const meta = await this.fetchMetadata(urlStr, info);
    const thumb = typeof meta.thumbnail_url === "string" ? meta.thumbnail_url : null;
    if (thumb) {
      try {
        const imgResp = await proxiedFetch(thumb);
        const buf = await imgResp.arrayBuffer();
        const ext = extFromUrl(thumb) || "jpg";
        return { bytes: new Uint8Array(buf), mime: imgResp.headers.get("content-type") || "image/jpeg", ext };
      } catch {}
    }
    return null;
  }

  // ── Main convert entry point ──────────────────────────────────────────────

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const results: FileData[] = [];

    for (const file of inputFiles) {
      const rawText = new TextDecoder().decode(file.bytes).trim();
      const url = this.extractUrl(rawText);
      if (!url) {
        throw new Error(
          `No valid media link found in input "${file.name}". ` +
          `Please paste a valid URL (YouTube, Instagram, Facebook, Twitch, TikTok, Discord, etc.).`
        );
      }

      const info = detectPlatform(url);

      // ── Output: metadata JSON ────────────────────────────────────────────
      if (outputFormat.internal === "linkmeta") {
        const meta = await this.fetchMetadata(url, info);
        results.push({
          bytes: new TextEncoder().encode(JSON.stringify(meta, null, 2)),
          name: file.name.replace(/\.[^.]+$/, "") + ".meta.json"
        });
        continue;
      }

      // ── Output: HTML embed ───────────────────────────────────────────────
      if (outputFormat.internal === "htmlembed") {
        const meta = await this.fetchMetadata(url, info);
        const html = this.buildEmbed(url, meta);
        results.push({
          bytes: new TextEncoder().encode(html),
          name: file.name.replace(/\.[^.]+$/, "") + ".embed.html"
        });
        continue;
      }

      // ── Output: Markdown link card ───────────────────────────────────────
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

      // ── Output: thumbnail PNG ────────────────────────────────────────────
      if (outputFormat.internal === "thumbpng") {
        const thumb = await this.fetchThumbnail(url);
        if (!thumb) throw new Error(`No thumbnail available for this link (${info.provider}).`);
        results.push({
          bytes: thumb.bytes,
          name: file.name.replace(/\.[^.]+$/, "") + ".thumb." + thumb.ext
        });
        continue;
      }

      // ── Output: actual media file (mp4/webm/gif/mp3/wav/png/jpeg) ────────
      const isAudioTarget = outputFormat.mime.startsWith("audio/");
      const isImageTarget = outputFormat.mime.startsWith("image/");
      const isVideoTarget = outputFormat.mime.startsWith("video/");

      let mediaResult: { bytes: Uint8Array; mime: string; ext: string } | null = null;

      // Direct media URL? Fetch the binary through the CORS proxy chain.
      const ext = extFromUrl(url);
      const detected = ext ? MEDIA_EXT[ext] : null;
      const isDirect = info.isDirectMedia || (detected !== null);

      if (isDirect) {
        try {
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
        } catch (e) {
          console.warn("[mediaLink] Direct fetch failed:", e);
        }
      }

      if (isImageTarget) {
        mediaResult = await this.fetchThumbnail(url);
      }

      if (!mediaResult && (isVideoTarget || isAudioTarget || isImageTarget)) {
        // Try Cobalt API first — works for many social platforms.
        mediaResult = await this.downloadViaCobalt(url, isAudioTarget);
        if (!mediaResult) {
          const ytId = this.extractYouTubeId(url);
          if (ytId) mediaResult = await this.downloadYouTubeFallback(ytId, isAudioTarget);
        }
      }

      // Last resort: plain direct fetch (for raw media links that survived CORS).
      if (!mediaResult) {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const contentType = resp.headers.get("content-type") || "";
            if (contentType.startsWith("video/") || contentType.startsWith("audio/") || contentType.startsWith("image/")) {
              const buf = await resp.arrayBuffer();
              const ext2 = contentType.split("/")[1]?.split(";")[0] || "bin";
              mediaResult = { bytes: new Uint8Array(buf), mime: contentType.split(";")[0], ext: ext2 };
            }
          }
        } catch (e) {
          console.warn("[mediaLink] Direct fetch failed:", e);
        }
      }

      if (!mediaResult || mediaResult.bytes.length === 0) {
        throw new Error(
          `Unable to download media from link: ${url}\n` +
          `The post/video may be private, the platform may be blocking automated access, ` +
          `or all download services may be rate-limited.\n` +
          `Try one of the other outputs instead: Link Metadata (JSON), HTML Embed Snippet, ` +
          `Markdown Link Card, or Thumbnail Image. ` +
          `For the actual video/audio file, a desktop tool like yt-dlp is more reliable.`
        );
      }

      const outName = `${file.name.replace(/\.[^/.]+$/, "") || "downloaded_media"}.${mediaResult.ext}`;
      results.push({ name: outName, bytes: mediaResult.bytes });
    }

    return results;
  }
}
