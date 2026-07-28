# CONVERSATION LOG — Convert.It.Now (leothefleo49/convert fork)

This file logs every user message across chat sessions, verbatim, followed by a concise summary.
Append-only. Never delete entries.

### Message 2

> https://fastdl.app/en4 how do websites like this do it perfectly for me? find some work around please. make it all work.

**Summary:**
- User wants the media-link feature to work as well as fastdl.app (Instagram downloader).
- Wants a real workaround for the client-side limitation (CORS / protected platforms).
- "Make it all work" — deliver actual working media downloads for Instagram and similar.

### Resolution notes (added during work)
- Researched fastdl.app: it's a server-side Instagram fetcher (their backend hits Instagram's CDN directly, no browser CORS). A pure client-side app cannot replicate that exactly.
- **Workaround found: Cobalt API.** Cobalt is the open-source equivalent of fastdl, supports Instagram/YouTube/TikTok/Facebook/Twitch/Twitter/Pinterest/Reddit/Snapchat/Vimeo/SoundCloud/Spotify/etc. Many community-run Cobalt instances have Cloudflare Turnstile DISABLED, meaning they accept direct cross-origin POST requests from a browser — no backend required.
- Rewrote `downloadViaCobalt` with: (a) current v11 API (`POST /` not `/api/json`), (b) prioritised list of Turnstile-disabled community instances from cobalt.directory (kittycat.boo, liubquanti.click, squair.xyz, xenon.zone, cjs.nz), (c) CORS-proxy fallback for the POST itself, (d) full picker handling so Instagram carousels / TikTok slideshows download EVERY photo/video (not just the first), (e) content-type sniffing for correct extensions.
- Image-target output now tries Cobalt first (returns the real photo) before falling back to thumbnail.
- Updated link-bar placeholder + hint to list all supported platforms and explain the Cobalt/proxy split.
- Build passes (`tsc --noEmit` + `vite build`).

---


### Message 1

> on my convert githuv I've been updating recently the media Link doesn't seem to be working well... like idk if it gets the link and actually retrieves the data within the media Link... should work with Instagram, Facebook, discord, YouTube(and yt shorts and music), messenger, twitch, and much more. fix it pls. also improve the UI of the area where you paste links or text etc to be smooth and not cut off anything even on small screens, just yeah make it work well. also add more conversions and file types please as well! thanks.

**Summary:**
- The media link feature in the Convert fork is not working / not actually fetching media data from pasted links.
- Wants it to support many platforms: Instagram, Facebook, Discord, YouTube (incl. Shorts & Music), Messenger, Twitch, and more.
- Improve the UI of the link/text paste area: smooth, responsive, nothing cut off even on small screens.
- Add more conversions and file types overall.
- Mode clarified: **Personal mode** (flexible, not full Play Store/dev-tool/auto-update machinery).
- Media approach clarified: **CORS proxy + oEmbed** for client-side fetching where possible.

### Resolution notes (added during work)
- Discovered a parallel session had already pushed a `mediaLink` handler + URL input UI to `origin/master`. Merged both approaches into one handler: kept Cobalt/Invidious/Piped download backends (better for YouTube/TikTok social media) AND added the CORS-proxy metadata/embed/markdown/thumbnail outputs. Unified the two duplicate URL input bars into the single integrated, responsive paste bar in the drop zone. Added `textCase` handler. Removed stray deploy `.ps1` scripts.
- Build passes (`tsc --noEmit` + `vite build`). Pushed as commit `ebc3836`.

---
