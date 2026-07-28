import{C as B}from"./CommonFormats-B8gJ-G0w.js";const k=750,X=150,I=2e4;function H(N){const r=document.createElement("div");r.style.all="initial",r.style.visibility="hidden",r.style.position="fixed",document.body.appendChild(r);const s=r.attachShadow({mode:"closed"}),e=document.createElement("div");return e.innerHTML=N,s.appendChild(e),e}class L{name="pyturtle";supportedFormats;ready=!1;async init(){this.supportedFormats=[{name:"Python Turtle program",format:"py",extension:"py",mime:"text/x-python",from:!1,to:!0,internal:"pyTurtle",category:"code",lossless:!1},B.SVG.builder("svg").allowFrom()],this.ready=!0}createContainer(r){const s=document.createElement("div");s.style.all="initial",s.style.visibility="hidden",s.style.position="fixed",document.body.appendChild(s);const e=s.attachShadow({mode:"closed"}),c=document.createElement("div");return c.innerHTML=r,e.appendChild(c),c}async doConvert(r,s,e){if(s.internal!=="svg")throw"Invalid input format.";if(e.internal!=="pyTurtle")throw"Invalid output format.";const c=[],d=new TextEncoder,g=new TextDecoder;for(const T of r){const{name:v,bytes:S}=T,$=g.decode(S),C=H($).querySelector("svg"),b=L.convert_program(C),w=d.encode(b),f=v.split(".")[0]+".py";c.push({name:f,bytes:w})}return c}static convert_program(r){let s=Array.from(r.querySelectorAll("path, circle, rect, ellipse, line, polyline, polygon"));s.length>k&&(s=s.slice(0,k));const e=r.createSVGPoint(),c=t=>!t||t==="none"||t==="transparent"?null:t.startsWith("rgb")?"#"+t.match(/\d+/g).slice(0,3).map(l=>parseInt(l).toString(16).padStart(2,"0")).join(""):t;let d=[],g=[];const T=t=>{let n=1/0;for(const l of t)l<n&&(n=l);return n},v=t=>{let n=-1/0;for(const l of t)l>n&&(n=l);return n};for(const t of s){if(d.length>=I)break;const n=window.getComputedStyle(t),l=c(t.getAttribute("fill")||n.fill),M=c(t.getAttribute("stroke")||n.stroke),E=parseFloat(t.getAttribute("stroke-width")||n.strokeWidth||"1"),_=t.getScreenCTM();if(!_)continue;const p=t.tagName.toLowerCase();if(p==="circle"||p==="ellipse"){const y=t.getBBox(),u=y.width/2,a=y.height/2,m=y.x+u,o=y.y+a;e.x=m,e.y=o+a;const h=e.matrixTransform(_);g.push({type:"circle",x:h.x,y:-h.y,r:u,fill:l,stroke:M,sw:E}),d.push({x:h.x,y:-h.y})}else{let y=[];if(p==="path"){const u=t.getAttribute("d");if(u===null)continue;y=u.split(/(?=[Mm])/).filter(a=>a.trim())}else y=[t];for(const u of y){if(d.length>=I)break;let a=[];const m=p==="path"?document.createElementNS("http://www.w3.org/2000/svg","path"):t;if(p==="path"&&m.setAttribute("d",u.toString()),p==="path"||p==="polyline"||p==="polygon"){document.body.appendChild(m);const o=m.getTotalLength(),h=Math.max(o/X,.5);for(let x=0;x<=o;x+=h){const F=m.getPointAtLength(x);e.x=F.x,e.y=F.y;const P=e.matrixTransform(_);a.push({x:P.x,y:-P.y})}p==="path"&&document.body.removeChild(m)}else{const o=t.getBBox();[{x:o.x,y:o.y},{x:o.x+o.width,y:o.y},{x:o.x+o.width,y:o.y+o.height},{x:o.x,y:o.y+o.height}].forEach(x=>{e.x=x.x,e.y=x.y;const F=e.matrixTransform(_);a.push({x:F.x,y:-F.y})})}a.length>0&&(d.push(...a),g.push({type:"path",points:a,fill:l,stroke:M,sw:E}))}}}const S=d.map(t=>t.x),$=d.map(t=>t.y),A=T(S),C=v(S),b=T($),w=v($),f=Math.max(C-A,w-b)*.1;let i=`import turtle

`;i+=`s = turtle.Screen()
t = turtle.Turtle()
t.speed(0)
turtle.tracer(0, 0)
`,isFinite(f)&&isFinite(A)&&isFinite(b)&&isFinite(w)&&(i+=`s.setworldcoordinates(${A-f}, ${b-f}, ${C+f}, ${w+f})

`);for(const t of g)if(t){if(i+=`t.penup()
t.pensize(${t.sw})
t.pencolor("${t.stroke||"black"}")
`,t.fill&&(i+=`t.fillcolor("${t.fill}")
`),t.type==="circle"&&t.x)i+=`t.goto(${t.x.toFixed(2)}, ${t.y.toFixed(2)})
t.setheading(0)
`,t.fill&&(i+=`t.begin_fill()
`),i+=`t.circle(${t.r.toFixed(2)})
`,t.fill&&(i+=`t.end_fill()
`);else{if(t.points==null)continue;t.fill&&(i+=`t.begin_fill()
`),i+=`t.goto(${t.points[0].x.toFixed(2)}, ${t.points[0].y.toFixed(2)})
t.pendown()
`;for(let n=1;n<t.points.length;n++)i+=`t.goto(${t.points[n].x.toFixed(2)}, ${t.points[n].y.toFixed(2)})
`;i+=`t.goto(${t.points[0].x.toFixed(2)}, ${t.points[0].y.toFixed(2)})
`,t.fill&&(i+=`t.end_fill()
`)}i+=`t.penup()

`}return i+=`t.hideturtle()
turtle.update()
turtle.done()`,i}}export{L as default};
