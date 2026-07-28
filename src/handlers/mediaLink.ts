import CommonFormats from "../CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

export default class MediaLinkHandler implements FormatHandler {
  public name: string = "mediaLink";
  public contributor: string = "leothefleo49";
  public ready: boolean = false;

  public supportedFormats: FileFormat[] = [
    CommonFormats.URL.supported("url", true, false),
    CommonFormats.TEXT.supported("text", true, false),
    CommonFormats.MP4.supported("mp4", false, true),
    CommonFormats.MP3.supported("mp3", false, true),
    CommonFormats.WAV.supported("wav", false, true),
    CommonFormats.PNG.supported("png", false, true),
    CommonFormats.JPEG.supported("jpeg", false, true),
  ];

  async init(): Promise<void> {
    this.ready = true;
  }

  /**
   * Helper to parse a YouTube video ID from various YouTube URL formats
   * (youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, music.youtube.com/watch?v=ID)
   */
  private extractYouTubeId(urlStr: string): string | null {
    try {
      const u = new URL(urlStr);
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.slice(1).split("?")[0].split("/")[0] || null;
      }
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname.startsWith("/shorts/")) {
          return u.pathname.split("/shorts/")[1].split("?")[0].split("/")[0] || null;
        }
        if (u.pathname.startsWith("/watch")) {
          return u.searchParams.get("v") || null;
        }
        if (u.pathname.startsWith("/embed/")) {
          return u.pathname.split("/embed/")[1].split("?")[0].split("/")[0] || null;
        }
      }
    } catch {
      // Not a valid URL object
    }
    return null;
  }

  /**
   * Download media via Cobalt API or public mirrors
   */
  private async downloadViaCobalt(
    targetUrl: string,
    isAudioOnly: boolean
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
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
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

  /**
   * Download YouTube audio/video via Invidious / Piped API fallbacks
   */
  private async downloadYouTubeFallback(
    ytId: string,
    isAudioOnly: boolean
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
            // Find combined video+audio or highest video stream
            const stream = data.videoStreams.find((s: any) => s.videoOnly === false) || data.videoStreams[0];
            streamUrl = stream.url;
            mime = stream.mimeType || mime;
          }
        } else {
          // Invidious format
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
            return {
              bytes: new Uint8Array(buf),
              mime: mime.split(";")[0],
              ext: isAudioOnly ? "mp3" : "mp4"
            };
          }
        }
      } catch (e) {
        console.warn(`[mediaLink] YouTube API fallback ${api} failed:`, e);
      }
    }

    return null;
  }

  /**
   * Fetch image thumbnail for video links
   */
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

    return null;
  }

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const results: FileData[] = [];

    for (const file of inputFiles) {
      const rawText = new TextDecoder().decode(file.bytes).trim();
      // Extract URL from input text if embedded or prefixed
      const urlMatch = rawText.match(/https?:\/\/[^\s"']+/i);
      if (!urlMatch) {
        throw new Error("No valid media link found in input. Please paste a valid URL (YouTube, Instagram, Facebook, etc.).");
      }

      const mediaUrl = urlMatch[0];
      const isAudioTarget = outputFormat.mime.startsWith("audio/");
      const isImageTarget = outputFormat.mime.startsWith("image/");
      const isVideoTarget = outputFormat.mime.startsWith("video/");

      let mediaResult: { bytes: Uint8Array; mime: string; ext: string } | null = null;

      if (isImageTarget) {
        mediaResult = await this.fetchThumbnail(mediaUrl);
      }

      if (!mediaResult && (isVideoTarget || isAudioTarget || isImageTarget)) {
        // Try Cobalt API first
        mediaResult = await this.downloadViaCobalt(mediaUrl, isAudioTarget);

        // Fallback for YouTube links if Cobalt failed or rate limited
        if (!mediaResult) {
          const ytId = this.extractYouTubeId(mediaUrl);
          if (ytId) {
            mediaResult = await this.downloadYouTubeFallback(ytId, isAudioTarget);
          }
        }
      }

      // If direct media download still fails, attempt direct fetch (for raw video/image links)
      if (!mediaResult) {
        try {
          const resp = await fetch(mediaUrl);
          if (resp.ok) {
            const contentType = resp.headers.get("content-type") || "";
            if (contentType.startsWith("video/") || contentType.startsWith("audio/") || contentType.startsWith("image/")) {
              const buf = await resp.arrayBuffer();
              const ext = contentType.split("/")[1]?.split(";")[0] || "bin";
              mediaResult = { bytes: new Uint8Array(buf), mime: contentType.split(";")[0], ext };
            }
          }
        } catch (e) {
          console.warn("[mediaLink] Direct fetch failed:", e);
        }
      }

      if (!mediaResult || mediaResult.bytes.length === 0) {
        throw new Error(
          `Unable to download media from link: ${mediaUrl}. Ensure the post/video is public and accessible.`
        );
      }

      const outName = `${file.name.replace(/\.[^/.]+$/, "") || "downloaded_media"}.${mediaResult.ext}`;
      results.push({
        name: outName,
        bytes: mediaResult.bytes,
      });
    }

    return results;
  }
}
