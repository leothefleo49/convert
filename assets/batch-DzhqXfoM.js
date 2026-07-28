import{C as c}from"./CommonFormats-B8gJ-G0w.js";class m{name="batch";supportedFormats=[c.TEXT.supported("txt",!0,!1),c.BATCH.supported("bat",!1,!0,!0)];ready=!1;async init(){this.ready=!0}async doConvert(u,p,a){const o=[];for(const r of u){const i=new TextDecoder().decode(r.bytes);let s="";if(p.internal==="txt"&&a.internal==="bat"){const f=i.split(/\r?\n/),h=t=>{const e=[];for(const n of t)switch(n){case"%":e.push("%%");break;case"^":e.push("^^");break;case"&":e.push("^&");break;case"|":e.push("^|");break;case"<":e.push("^<");break;case">":e.push("^>");break;case"!":e.push("^^!");break;default:e.push(n)}return e.join("")};s=`@echo off\r
`;for(const t of f)t===""?s+=`echo.\r
`:s+=`echo ${h(t)}\r
`;s+=`pause\r
`}else throw new Error("Invalid output format.");const l=r.name.split(".").slice(0,-1).join(".")+"."+a.extension;o.push({name:l,bytes:new TextEncoder().encode(s)})}return o}}export{m as default};
