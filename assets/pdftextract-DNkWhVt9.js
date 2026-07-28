const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/pdf-o3H-DcAz.js","assets/index-BqqtKfMZ.js","assets/index-pAZ7kYwu.css"])))=>i.map(i=>d[i]);
import{_ as b}from"./index-BqqtKfMZ.js";let p=!1;class v{name="pdftextract";contributor="leothefleo49";supportedFormats=[{name:"PDF Document",format:"pdf",extension:"pdf",mime:"application/pdf",from:!0,to:!1,internal:"pdf",category:"document",lossless:!0},{name:"Plain Text",format:"plain",extension:"txt",mime:"text/plain",from:!1,to:!0,internal:"txt",category:"text",lossless:!1}];ready=!0;async init(){this.ready=!0}async doConvert(m,T,h){const s=await b(()=>import("./pdf-o3H-DcAz.js"),__vite__mapDeps([0,1,2]));p||(s.GlobalWorkerOptions.workerSrc=new URL("/convert/assets/pdf.worker-n-vTvQZi.mjs",import.meta.url).href,p=!0);const a=[];for(const t of m){const u=new Uint8Array(t.bytes.buffer.slice(t.bytes.byteOffset,t.bytes.byteOffset+t.bytes.byteLength)),r=await s.getDocument({data:u}).promise,i=[];for(let e=1;e<=r.numPages;e++){const g=await(await r.getPage(e)).getTextContent();let n=null;const o=[];for(const f of g.items){if(!("str"in f))continue;const l=f,c=l.transform[5];n!==null&&Math.abs(c-n)>2&&o.push(`
`),o.push(l.str),n=c}i.push(o.join(""))}const d=i.join(`

─────────────────────

`),x=new TextEncoder().encode(d),y=t.name.replace(/\.pdf$/i,".txt");a.push({bytes:x,name:y})}return a}}export{v as default};
