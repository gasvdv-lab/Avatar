const VERSION = "0.3.0.1";
const TARGET_HEIGHT = 1.75;
const BODY_FACE_COUNT = 13379;

const SOURCES = [
  "https://cdn.jsdelivr.net/gh/makehumancommunity/makehuman@1f508f6083b2f823dab15de924b3bde72e08d77c/makehuman/data/3dobjs/base.obj",
  "https://raw.githubusercontent.com/makehumancommunity/makehuman/1f508f6083b2f823dab15de924b3bde72e08d77c/makehuman/data/3dobjs/base.obj"
];

const canvas = document.getElementById("viewport");
const statusEl = document.getElementById("status");
const gl = canvas.getContext("webgl", {antialias:true, alpha:true});

if (!gl) {
  statusEl.textContent = "WebGL is niet beschikbaar.";
  throw new Error("WebGL unavailable");
}

let yaw=-0.25, pitch=-0.04, zoom=1.0, drag=null, pinch=null;
let indexCount=0;

function parseOBJ(text) {
  const vertices=[];
  const triangles=[];
  let group="";
  let faceNo=0;
  let sawBodyGroup=false;

  for (const raw of text.split(/\r?\n/)) {
    const line=raw.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("v ")) {
      const p=line.split(/\s+/);
      vertices.push([+p[1],+p[2],+p[3]]);
      continue;
    }

    if (line.startsWith("g ")) {
      group=line.slice(2).trim();
      if (group==="body") sawBodyGroup=true;
      continue;
    }

    if (line.startsWith("f ")) {
      // Official MakeHuman metadata identifies the body group, and also
      // documents the body as the first 13,379 face records.
      const use = sawBodyGroup ? group==="body" : faceNo < BODY_FACE_COUNT;

      if (use) {
        const ids=line.split(/\s+/).slice(1).map(tok=>{
          let i=parseInt(tok.split("/")[0],10);
          if (i<0) i=vertices.length+i;
          else i-=1;
          return i;
        });
        for(let i=1;i<ids.length-1;i++) triangles.push([ids[0],ids[i],ids[i+1]]);
      }
      faceNo++;
    }
  }

  if (!vertices.length || !triangles.length)
    throw new Error("OBJ bevat geen bruikbare body geometry");

  return {vertices,triangles};
}

function normalizeMesh(mesh) {
  const mins=[Infinity,Infinity,Infinity], maxs=[-Infinity,-Infinity,-Infinity];
  for(const v of mesh.vertices) {
    for(let i=0;i<3;i++) { mins[i]=Math.min(mins[i],v[i]); maxs[i]=Math.max(maxs[i],v[i]); }
  }
  const ext=maxs.map((v,i)=>v-mins[i]);
  const up=ext.indexOf(Math.max(...ext));
  const center=mins.map((v,i)=>(v+maxs[i])/2);
  const s=TARGET_HEIGHT/ext[up];

  const out=mesh.vertices.map(v=>{
    const q=v.map((x,i)=>(x-center[i])*s);
    let x,y,z;
    if(up===0) [x,y,z]=[q[1],q[0],q[2]];
    else if(up===1) [x,y,z]=[q[0],q[1],q[2]];
    else [x,y,z]=[q[0],q[2],q[1]];
    return [x,y+TARGET_HEIGHT/2,z];
  });

  return {vertices:out,triangles:mesh.triangles};
}

function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}

function buildNormals(vertices,faces) {
  const n=Array.from({length:vertices.length},()=>[0,0,0]);
  for(const [a,b,c] of faces) {
    const q=cross(sub(vertices[b],vertices[a]),sub(vertices[c],vertices[a]));
    for(const i of [a,b,c]){n[i][0]+=q[0];n[i][1]+=q[1];n[i][2]+=q[2]}
  }
  return n.map(norm);
}

const VS=`attribute vec3 p;attribute vec3 n;uniform mat4 m;uniform mat4 vp;varying vec3 N;void main(){N=mat3(m)*n;gl_Position=vp*m*vec4(p,1.0);}`;
const FS=`precision mediump float;varying vec3 N;void main(){vec3 nn=normalize(N);vec3 L=normalize(vec3(-.6,.85,.55));float d=max(dot(nn,L),0.0);float toon=d>.64?.94:d>.32?.72:.48;float rim=pow(1.0-abs(nn.z),2.0)*.13;vec3 base=vec3(.55,.58,.62);gl_FragColor=vec4(base*toon+vec3(.12,.17,.22)*rim,1.0);}`;

function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
const prog=gl.createProgram();gl.attachShader(prog,compile(gl.VERTEX_SHADER,VS));gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);gl.useProgram(prog);
const lp=gl.getAttribLocation(prog,"p"), ln=gl.getAttribLocation(prog,"n"), lm=gl.getUniformLocation(prog,"m"), lvp=gl.getUniformLocation(prog,"vp");

function upload(mesh) {
  const normals=buildNormals(mesh.vertices,mesh.triangles);
  const V=new Float32Array(mesh.vertices.flat());
  const N=new Float32Array(normals.flat());

  const maxIndex=Math.max(...mesh.triangles.flat());
  if(maxIndex>65535) throw new Error("Mesh index exceeds WebGL1 uint16 limit");
  const I=new Uint16Array(mesh.triangles.flat());

  function attr(data,loc){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0)}
  attr(V,lp); attr(N,ln);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,I,gl.STATIC_DRAW);
  indexCount=I.length;
}

function id(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
function mul(a,b){const o=new Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
function per(f,a,n,z){const s=1/Math.tan(f/2),d=1/(n-z);return[s/a,0,0,0,0,s,0,0,0,0,(z+n)*d,-1,0,0,2*z*n*d,0]}
function tr(x,y,z){const m=id();m[12]=x;m[13]=y;m[14]=z;return m}
function ry(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]}
function rx(a){const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]}
function sc(s){return[s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1]}

function draw() {
  if(!indexCount) return;
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const P=per(Math.PI/4,canvas.width/canvas.height,.1,20);
  const view=tr(0,-.87,-3.45);
  let model=mul(ry(yaw),rx(pitch)); model=mul(model,sc(zoom));
  gl.uniformMatrix4fv(lm,false,new Float32Array(model));
  gl.uniformMatrix4fv(lvp,false,new Float32Array(mul(P,view)));
  gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);
}

function resize() {
  const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();
  canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));
  gl.viewport(0,0,canvas.width,canvas.height);draw();
}

async function fetchBase() {
  let lastErr;
  for(const url of SOURCES) {
    try {
      statusEl.textContent="HM08 basemesh downloaden…";
      const r=await fetch(url,{cache:"force-cache"});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const text=await r.text();
      const mesh=normalizeMesh(parseOBJ(text));
      upload(mesh);
      statusEl.textContent=`HM08 body · ${mesh.vertices.length} upstream vertices · ${mesh.triangles.length} render triangles · 175 cm`;
      resize();
      return;
    } catch(e) {
      lastErr=e;
      console.warn("Basemesh source failed",url,e);
    }
  }
  statusEl.textContent="HM08 kon niet geladen worden: "+(lastErr?.message||"onbekende fout");
}

canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY}};
canvas.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.012;pitch=Math.max(-.7,Math.min(.7,pitch+(e.clientY-drag.y)*.007));drag.x=e.clientX;drag.y=e.clientY;draw()};
canvas.onpointerup=e=>{if(drag?.id===e.pointerId)drag=null};
canvas.addEventListener("touchstart",e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];pinch=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}},{passive:true});
canvas.addEventListener("touchmove",e=>{if(e.touches.length===2){e.preventDefault();const a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(pinch){zoom*=d/pinch;zoom=Math.max(.6,Math.min(1.8,zoom));draw()}pinch=d}},{passive:false});
canvas.addEventListener("touchend",()=>pinch=null);

document.querySelectorAll("button").forEach(b=>b.onclick=()=>{
  const v=b.dataset.view;
  if(v==="front")yaw=0;
  if(v==="three")yaw=-Math.PI/4;
  if(v==="side")yaw=-Math.PI/2;
  if(v==="back")yaw=Math.PI;
  if(v==="reset"){yaw=-.25;pitch=-.04;zoom=1}
  draw();
});

window.onresize=resize;
resize();
fetchBase();
