import{C as $}from"./CommonFormats-B8gJ-G0w.js";import{J as k}from"./jszip.min-CvikmDYY.js";import{a as S}from"./index-DwMjlS4a.js";import{n as j}from"./index-BqqtKfMZ.js";import"./_commonjsHelpers-Cpj98o6Y.js";function b(d){const i=String(d??"").toLowerCase(),n=S,l=n.getType?.(i)??n.get?.(i)??n.default?.getType?.(i)??n.default?.get?.(i)??null;return j(l??"application/octet-stream")}class B{name="sb3tohtml";supportedFormats;ready=!1;async init(){this.supportedFormats=[{name:"Scratch 3 Project",format:"sb3",extension:"sb3",mime:"application/x.scratch.sb3",from:!0,to:!1,internal:"sb3"},$.HTML.builder("html").allowTo()],this.ready=!0}async doConvert(i){const n=i[0],l=await k.loadAsync(n.bytes),y=await l.file("project.json").async("string"),x=JSON.parse(y);function g(s){const p=new Uint8Array(s),c=32768;let t="";for(let a=0;a<p.length;a+=c)t+=String.fromCharCode(...p.subarray(a,a+c));return btoa(t)}const e=[];e.push(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${r(n.name.replace(/\.sb3$/i,""))}</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; background: #fff; padding: 24px; }
  .project { max-width: 1200px; margin: 0 auto; }
  .target { margin-bottom: 48px; border-bottom: 1px solid #ddd; padding-bottom: 24px; }
  .target h2 { margin: 0 0 12px 0; }
  .costume-grid, .sound-grid { display:flex; flex-wrap:wrap; gap:16px; align-items:flex-start; }
  .asset { width:220px; display:flex; flex-direction:column; align-items:center; }
  pre.blocks { white-space: pre-wrap; word-break: break-word; background:#f7f7f7; padding:12px; border-radius:6px; }
</style>
</head>
<body>
<div class="project">
<h1>${r(n.name.replace(/\.sb3$/i,""))}</h1>
`);for(const s of x.targets||[]){e.push('<section class="target">');const p=s.isStage?"Stage":`Sprite: ${r(s.name||"unnamed")}`;e.push(`<h2>${p}</h2>`);const c=[];if(s.blocks){const t=s.blocks;for(const a in t){const o=t[a];o&&o.topLevel===!0&&o.parent===null&&o.shadow!==!0&&typeof o.opcode=="string"&&c.push(JSON.stringify(o,null,2))}}if(c.length>0&&e.push(`<pre class="blocks">${r(c.join(`

`))}</pre>`),s.costumes&&s.costumes.length>0){e.push(`<h3>${s.isStage?"Backdrops":"Costumes"}</h3>`),e.push('<div class="costume-grid">');for(const t of s.costumes){const a=`${t.assetId}.${t.dataFormat}`,o=l.file(a);if(!o)continue;const m=await o.async("arraybuffer"),u=b(t.dataFormat||a),f=g(m),h=`data:${u};base64,${f}`;e.push(`<div class="asset">
            <div style="margin-bottom:6px;font-size:13px;text-align:center;">${r(t.name||"")}</div>
            <img src="${h}" alt="${r(t.name||"")}" style="max-width:200px;max-height:200px;object-fit:contain;background:#fff;display:block;" />
          </div>`)}e.push("</div>")}if(s.sounds&&s.sounds.length>0){e.push("<h3>Sounds</h3>"),e.push('<div class="sound-grid">');for(const t of s.sounds){const a=t.md5ext||`${t.assetId}.${t.format}`,o=l.file(a);if(!o){e.push(`<div class="asset"><div>${r(t.name||"(missing audio)")}</div></div>`);continue}const m=await o.async("arraybuffer"),u=b(t.format||a),f=g(m),h=`data:${u};base64,${f}`;e.push(`<div class="asset">
            <div style="margin-bottom:6px;font-size:13px;text-align:center;">${r(t.name||"")}</div>
            <audio controls src="${h}">Your browser does not support the audio element.</audio>
          </div>`)}e.push("</div>")}e.push("</section>")}e.push(`</div>
</body>
</html>`);const v=e.join(`
`),w=new TextEncoder().encode(v);return[{name:n.name.replace(/\.sb3$/i,"")+".html",bytes:new Uint8Array(w)}]}}function r(d){return String(d??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}export{B as default};
