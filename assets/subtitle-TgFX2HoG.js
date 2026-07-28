class T{name="subtitle";contributor="leothefleo49";ready=!0;supportedFormats=[{name:"SubRip Subtitle",format:"srt",extension:"srt",mime:"application/x-subrip",from:!0,to:!0,internal:"srt",category:"text"},{name:"WebVTT Subtitle",format:"vtt",extension:"vtt",mime:"text/vtt",from:!0,to:!0,internal:"vtt",category:"text"},{name:"Advanced SubStation Alpha",format:"ass",extension:"ass",mime:"text/x-ssa",from:!0,to:!0,internal:"ass",category:"text"},{name:"SubViewer / YouTube Captions",format:"sbv",extension:"sbv",mime:"text/x-sbv",from:!0,to:!0,internal:"sbv",category:"text"},{name:"LRC Lyrics",format:"lrc",extension:"lrc",mime:"text/x-lrc",from:!0,to:!0,internal:"lrc",category:"text"},{name:"Plain Text (transcript)",format:"txt",extension:"txt",mime:"text/plain",from:!1,to:!0,internal:"txt",category:"text"}];async init(){this.ready=!0}parseCues(e,t){switch(t){case"srt":return this.parseSRT(e);case"vtt":return this.parseVTT(e);case"ass":return this.parseASS(e);case"sbv":return this.parseSBV(e);case"lrc":return this.parseLRC(e);default:return[]}}parseSRT(e){const t=[],n=e.trim().split(/\n\s*\n/);for(const s of n){const r=s.trim().split(`
`);if(r.length<2)continue;const a=r.find(c=>c.includes("-->"));if(!a)continue;const i=r.indexOf(a),[o,m]=a.split("-->"),p=this.parseSRTTime(o.trim()),l=this.parseSRTTime(m.trim()),u=r.slice(i+1).join(`
`).trim();u&&t.push({start:p,end:l,text:u})}return t}parseVTT(e){const n=e.replace(/^WEBVTT[^\n]*\n/,"").trim().split(/\n\s*\n/),s=[];for(const r of n){const a=r.trim().split(`
`),i=a.find(S=>S.includes("-->"));if(!i)continue;const o=a.indexOf(i),[m,p]=i.split("-->"),l=this.parseSRTTime(m.trim()),u=this.parseSRTTime(p.trim().split(" ")[0]),c=a.slice(o+1).join(`
`).trim();c&&s.push({start:l,end:u,text:c})}return s}parseASS(e){const t=[],n=e.split(`
`);for(const s of n){if(!s.startsWith("Dialogue:"))continue;const r=s.substring(9).split(",");if(r.length<10)continue;const a=this.parseASSTime(r[1].trim()),i=this.parseASSTime(r[2].trim()),o=r.slice(9).join(",").replace(/\{[^}]*\}/g,"").trim();o&&t.push({start:a,end:i,text:o})}return t}parseSBV(e){const t=[],n=e.trim().split(/\n\s*\n/);for(const s of n){const r=s.trim().split(`
`);if(r.length<2)continue;const a=r[0];if(!a.includes(","))continue;const[i,o]=a.split(","),m=this.parseSRTTime(i.trim()),p=this.parseSRTTime(o.trim()),l=r.slice(1).join(`
`).trim();l&&t.push({start:m,end:p,text:l})}return t}parseLRC(e){const t=[],n=e.split(`
`);for(let s=0;s<n.length;s++){const r=n[s].match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]\s*(.*)$/);if(!r)continue;const a=parseInt(r[1]),i=parseInt(r[2]),o=r[3]?parseInt(r[3].padEnd(3,"0")):0,m=a*60+i+o/1e3,p=r[4].trim();if(!p)continue;let l=m+5;for(let u=s+1;u<n.length;u++){const c=n[u].match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/);if(c){l=parseInt(c[1])*60+parseInt(c[2])+(c[3]?parseInt(c[3].padEnd(3,"0"))/1e3:0);break}}t.push({start:m,end:l,text:p})}return t}parseSRTTime(e){const t=e.replace(",","."),n=t.split(":");return n.length===3?parseFloat(n[0])*3600+parseFloat(n[1])*60+parseFloat(n[2]):n.length===2?parseFloat(n[0])*60+parseFloat(n[1]):parseFloat(t)||0}parseASSTime(e){const t=e.split(":");return t.length===3?parseFloat(t[0])*3600+parseFloat(t[1])*60+parseFloat(t[2]):0}formatSRTTime(e){const t=Math.floor(e/3600),n=Math.floor(e%3600/60),s=Math.floor(e%60),r=Math.round(e%1*1e3);return`${String(t).padStart(2,"0")}:${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(r).padStart(3,"0")}`}formatVTTTime(e){return this.formatSRTTime(e).replace(",",".")}formatASSTime(e){const t=Math.floor(e/3600),n=Math.floor(e%3600/60),s=Math.floor(e%60),r=Math.round(e%1*100);return`${t}:${String(n).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(r).padStart(2,"0")}`}formatLRCTime(e){const t=Math.floor(e/60),n=Math.floor(e%60),s=Math.round(e%1*100);return`${String(t).padStart(2,"0")}:${String(n).padStart(2,"0")}.${String(s).padStart(2,"0")}`}toSRT(e){return e.map((t,n)=>`${n+1}
${this.formatSRTTime(t.start)} --> ${this.formatSRTTime(t.end)}
${t.text}`).join(`

`)+`
`}toVTT(e){const t=["WEBVTT",""];for(const n of e)t.push(`${this.formatVTTTime(n.start)} --> ${this.formatVTTTime(n.end)}`),t.push(n.text),t.push("");return t.join(`
`)}toASS(e){const t=`[Script Info]
Title: Converted Subtitle
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,10,10,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`,n=e.map(s=>`Dialogue: 0,${this.formatASSTime(s.start)},${this.formatASSTime(s.end)},Default,,0,0,0,,${s.text.replace(/\n/g,"\\N")}`).join(`
`);return t+n+`
`}toSBV(e){return e.map(t=>`${this.formatVTTTime(t.start)},${this.formatVTTTime(t.end)}
${t.text}`).join(`

`)+`
`}toLRC(e){return e.map(t=>`[${this.formatLRCTime(t.start)}]${t.text.replace(/\n/g," ")}`).join(`
`)+`
`}toTXT(e){return e.map(t=>t.text).join(`
`)+`
`}async doConvert(e,t,n){return e.map(s=>{const r=new TextDecoder().decode(s.bytes),a=this.parseCues(r,t.internal);let i;switch(n.internal){case"srt":i=this.toSRT(a);break;case"vtt":i=this.toVTT(a);break;case"ass":i=this.toASS(a);break;case"sbv":i=this.toSBV(a);break;case"lrc":i=this.toLRC(a);break;case"txt":i=this.toTXT(a);break;default:throw new Error("Unsupported output format: "+n.internal)}return{name:s.name.split(".")[0]+"."+n.extension,bytes:new TextEncoder().encode(i)}})}}export{T as default};
