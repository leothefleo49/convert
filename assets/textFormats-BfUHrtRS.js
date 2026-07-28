import{C as p}from"./CommonFormats-B8gJ-G0w.js";class M{name="textFormats";contributor="leothefleo49";ready=!0;supportedFormats=[p.TEXT.supported("text",!0,!0),p.MD.supported("md",!0,!0),p.HTML.supported("html",!0,!0),p.CSV.supported("csv",!0,!0),p.JSON.supported("json",!0,!0)];async init(){this.ready=!0}async doConvert(t,n,r){return Promise.all(t.map(async l=>{const s=new TextDecoder("utf-8").decode(l.bytes),c=b(s,n.mime,r.mime),a=l.name.replace(/\.[^.]+$/,""),i=r.extension??r.format;return{name:`${a}.${i}`,bytes:new TextEncoder().encode(c)}}))}}function b(e,t,n){const r=f(t),l=f(n);if(r===l)return e;const s=`${r}→${l}`,c=j[s];return c?c(e):e}function f(e){return e.split(";")[0].trim().toLowerCase()}const j={"text/plain→text/html":d,"text/plain→text/markdown":e=>e,"text/plain→text/csv":T,"text/plain→application/json":w,"text/markdown→text/html":v,"text/markdown→text/plain":e=>e,"text/html→text/plain":k,"text/html→text/markdown":C,"text/csv→text/plain":J,"text/csv→application/json":O,"application/json→text/plain":$,"application/json→text/csv":_,"application/json→text/html":e=>d($(e)),"application/json→text/markdown":e=>"```json\n"+x(e)+"\n```"};function d(e){return`<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body><pre>${e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre></body></html>`}function T(e){return e.split(`
`).map(t=>`"${t.replace(/"/g,'""')}"`).join(`
`)}function w(e){const t=e.split(`
`);if(t.length===1)try{return JSON.parse(e),e}catch{}return JSON.stringify(t,null,2)}function v(e){const t=e.split(`
`),n=[];let r=!1,l="",s=[],c=!1;const a=()=>{c&&(n.push("</ul>"),c=!1)};for(let i=0;i<t.length;i++){const o=t[i];if(/^```/.test(o)){if(!r)a(),r=!0,l=o.slice(3).trim(),s=[];else{const u=s.join(`
`).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),S=l?` class="language-${l}"`:"";n.push(`<pre><code${S}>${u}</code></pre>`),r=!1}continue}if(r){s.push(o);continue}if(/^(\*{3,}|-{3,}|_{3,})\s*$/.test(o)){a(),n.push("<hr>");continue}const h=o.match(/^(#{1,6})\s+(.*)$/);if(h){a();const u=h[1].length;n.push(`<h${u}>${g(h[2])}</h${u}>`);continue}if(o.startsWith("> ")){a(),n.push(`<blockquote>${g(o.slice(2))}</blockquote>`);continue}const m=o.match(/^[-*+]\s+(.*)$/);if(m){c||(n.push("<ul>"),c=!0),n.push(`  <li>${g(m[1])}</li>`);continue}if(a(),!o.trim()){n.push("<br>");continue}n.push(`<p>${g(o)}</p>`)}if(r){const i=s.join(`
`).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");n.push(`<pre><code>${i}</code></pre>`)}return a(),`<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body>
${n.join(`
`)}
</body></html>`}function g(e){return e.replace(/!\[([^\]]*)\]\(([^)]*)\)/g,'<img alt="$1" src="$2">').replace(/\[([^\]]*)\]\(([^)]*)\)/g,'<a href="$2">$1</a>').replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/__([^_]+)__/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>").replace(/_([^_]+)_/g,"<em>$1</em>")}function k(e){return e.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,"").replace(/<script[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<br\s*\/?>/gi,`
`).replace(/<\/?(p|div|h[1-6]|li|tr|blockquote)[^>]*>/gi,`
`).replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\n{3,}/g,`

`).trim()}function C(e){return e.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,"").replace(/<script[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi,`# $1
`).replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi,`## $1
`).replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi,`### $1
`).replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi,`#### $1
`).replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi,`##### $1
`).replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi,`###### $1
`).replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi,"**$1**").replace(/<b[^>]*>([\s\S]*?)<\/b>/gi,"**$1**").replace(/<em[^>]*>([\s\S]*?)<\/em>/gi,"*$1*").replace(/<i[^>]*>([\s\S]*?)<\/i>/gi,"*$1*").replace(/<code[^>]*>([\s\S]*?)<\/code>/gi,"`$1`").replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,"[$2]($1)").replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi,"![$1]($2)").replace(/<li[^>]*>([\s\S]*?)<\/li>/gi,`- $1
`).replace(/<br\s*\/?>/gi,`
`).replace(/<\/?(p|div|ul|ol|blockquote)[^>]*>/gi,`
`).replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/\n{3,}/g,`

`).trim()}function y(e){const t=[];for(const n of e.split(`
`).filter(r=>r.trim())){const r=[];let l="",s=!1;for(let c=0;c<n.length;c++){const a=n[c];a==='"'?s&&n[c+1]==='"'?(l+='"',c++):s=!s:a===","&&!s?(r.push(l),l=""):l+=a}r.push(l),t.push(r)}return t}function J(e){return y(e).map(t=>t.join("	")).join(`
`)}function O(e){const t=y(e);if(t.length===0)return"[]";const n=t[0],r=t.slice(1).map(l=>{const s={};return n.forEach((c,a)=>{s[c]=l[a]??""}),s});return JSON.stringify(r,null,2)}function $(e){return x(e)}function _(e){let t;try{t=JSON.parse(e)}catch{return e}if(Array.isArray(t)&&t.length>0&&typeof t[0]=="object"&&t[0]!==null){const n=Object.keys(t[0]),r=s=>`"${String(s??"").replace(/"/g,'""')}"`;return[n.map(r).join(","),...t.map(s=>n.map(c=>r(s[c])).join(","))].join(`
`)}return Array.isArray(t)?t.map(n=>`"${String(n).replace(/"/g,'""')}"`).join(`
`):String(t)}function x(e){try{return JSON.stringify(JSON.parse(e),null,2)}catch{return e}}export{M as default,M as textFormatsHandler};
