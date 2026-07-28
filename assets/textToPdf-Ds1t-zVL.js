import{C as f}from"./CommonFormats-B8gJ-G0w.js";class Q{name="textToPdf";contributor="leothefleo49";ready=!0;supportedFormats=[f.TEXT.supported("text",!0,!1),f.MD.supported("md",!0,!1),f.HTML.supported("html",!0,!1),f.PDF.supported("pdf",!1,!0)];async init(){this.ready=!0}async doConvert(h,g,y){return Promise.all(h.map(async p=>{let o=new TextDecoder("utf-8").decode(p.bytes);if(g.mime==="text/html"){const a=document.createElement("div");a.innerHTML=o,o=a.innerText||a.textContent||o}const r=q(o);return{name:p.name.replace(/\.[^.]+$/,"")+".pdf",bytes:r}}))}}const O=612,P=792,W=50,v=50,L=O-2*W,Y=P-2*v,H=.6;function q(A){const h=A.replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`),g=t=>[...t].map(e=>{const n=e.charCodeAt(0);return n>=32&&n<=255?e:"?"}).join(""),y=h.map(g),p=y.reduce((t,e)=>Math.max(t,e.length),1),o=Math.floor(L/(p*H)),r=Math.max(4,Math.min(11,o)),R=r*H,a=r*1.4,x=Math.floor(L/R),w=Math.floor(Y/a),u=[];for(const t of y)if(t.length<=x)u.push(t);else for(let e=0;e<t.length;e+=x)u.push(t.slice(e,e+x));const c=[];for(let t=0;t<u.length;t+=w)c.push(u.slice(t,t+w));c.length===0&&c.push([]);const l=new TextEncoder,D=t=>t.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)"),G=t=>{const e=P-v-r,n=["BT",`/F1 ${r} Tf`,`${W} ${e} Td`,`${a} TL`];for(const X of t)n.push(`(${D(X)}) Tj`),n.push("T*");return n.push("ET"),n.join(`
`)},i=c.length,I=c.map(G),E=Array.from({length:i},(t,e)=>4+2*e),M=Array.from({length:i},(t,e)=>5+2*e),N=E.map(t=>`${t} 0 R`).join(" "),s=[];s.push({num:1,raw:"<</Type /Catalog /Pages 2 0 R>>"}),s.push({num:2,raw:`<</Type /Pages /Kids [${N}] /Count ${i}>>`}),s.push({num:3,raw:"<</Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding>>"});for(let t=0;t<i;t++){s.push({num:E[t],raw:`<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${O} ${P}] /Contents ${M[t]} 0 R /Resources <</Font <</F1 3 0 R>>>>>>`});const e=I[t],n=l.encode(e).length;s.push({num:M[t],raw:`<</Length ${n}>>
stream
${e}
endstream`})}s.sort((t,e)=>t.num-e.num);const T=s[s.length-1].num,U=`%PDF-1.4
%âãÏÓ
`,z=s.map(t=>`${t.num} 0 obj
${t.raw}
endobj
`),$=l.encode(U);let b=$.length;const j=new Map,B=z.map((t,e)=>{j.set(s[e].num,b);const n=l.encode(t);return b+=n.length,n}),k=b;let m=`xref
0 ${T+1}
`;m+=`0000000000 65535 f 
`;for(let t=1;t<=T;t++){const e=j.get(t);e!==void 0?m+=`${String(e).padStart(10,"0")} 00000 n 
`:m+=`0000000000 65535 f 
`}const K=`trailer
<</Size ${T+1} /Root 1 0 R>>
startxref
${k}
%%EOF
`,C=l.encode(m),S=l.encode(K),V=$.length+B.reduce((t,e)=>t+e.length,0)+C.length+S.length,F=new Uint8Array(V);let _=0;const d=t=>{F.set(t,_),_+=t.length};return d($),B.forEach(d),d(C),d(S),F}export{Q as default};
