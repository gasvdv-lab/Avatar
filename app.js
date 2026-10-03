const VERSION = "0.4.0";
const TARGET_HEIGHT = 1.75;
const BODY_FACE_COUNT = 13379;

const SOURCES = [
  "https://cdn.jsdelivr.net/gh/makehumancommunity/makehuman@1f508f6083b2f823dab15de924b3bde72e08d77c/makehuman/data/3dobjs/base.obj",
  "https://raw.githubusercontent.com/makehumancommunity/makehuman/1f508f6083b2f823dab15de924b3bde72e08d77c/makehuman/data/3dobjs/base.obj"
];

const canvas = document.getElementById("viewport");
const statusEl = document.getElementById("status");
const gl = canvas.getContext("webgl", {antialias:true, alpha:false});

if (!gl) {
  statusEl.textContent = "WebGL is niet beschikbaar.";
  throw new Error("WebGL unavailable");
}

let yaw=-0.24, pitch=-0.035, zoom=1.0, drag=null, pinch=null;
const layers=[];

function parseOBJ(text) {
  const vertices=[];
  const triangles=[];
  let group="";
  let faceNo=0;
  let sawBodyGroup=false;

  for (const raw of text.split(/\r?\n/)) {
    const line=raw.trim();
    if(!line || line.startsWith("#")) continue;

    if(line.startsWith("v ")) {
      const p=line.split(/\s+/);
      vertices.push([+p[1],+p[2],+p[3]]);
      continue;
    }

    if(line.startsWith("g ")) {
      group=line.slice(2).trim();
      if(group==="body") sawBodyGroup=true;
      continue;
    }

    if(line.startsWith("f ")) {
      const use = sawBodyGroup ? group==="body" : faceNo < BODY_FACE_COUNT;
      if(use) {
        const ids=line.split(/\s+/).slice(1).map(tok=>{
          let i=parseInt(tok.split("/")[0],10);
          if(i<0) i=vertices.length+i;
          else i-=1;
          return i;
        });
        for(let i=1;i<ids.length-1;i++) triangles.push([ids[0],ids[i],ids[i+1]]);
      }
      faceNo++;
    }
  }
  if(!vertices.length || !triangles.length) throw new Error("Geen bruikbare HM08 body geometry");
  return {vertices,triangles};
}

function normalizeMesh(mesh) {
  const mins=[Infinity,Infinity,Infinity], maxs=[-Infinity,-Infinity,-Infinity];
  for(const v of mesh.vertices) {
    for(let i=0;i<3;i++) {
      mins[i]=Math.min(mins[i],v[i]);
      maxs[i]=Math.max(maxs[i],v[i]);
    }
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
    for(const i of[a,b,c]) {
      n[i][0]+=q[0];n[i][1]+=q[1];n[i][2]+=q[2];
    }
  }
  return n.map(norm);
}

function faceCentroid(vertices, f) {
  return [
    (vertices[f[0]][0]+vertices[f[1]][0]+vertices[f[2]][0])/3,
    (vertices[f[0]][1]+vertices[f[1]][1]+vertices[f[2]][1])/3,
    (vertices[f[0]][2]+vertices[f[1]][2]+vertices[f[2]][2])/3
  ];
}

// Extract a true clothing surface from HM08 triangles.
// Vertices are offset along the original body normals, so the clothing is
// a separate 3D mesh and not just a body color/shader trick.
function makeClothingLayer(mesh, selector, offset, color, name) {
  const baseNormals=buildNormals(mesh.vertices,mesh.triangles);
  const vmap=new Map();
  const vertices=[];
  const triangles=[];

  function getVertex(oldIndex) {
    if(vmap.has(oldIndex)) return vmap.get(oldIndex);
    const v=mesh.vertices[oldIndex];
    const n=baseNormals[oldIndex];
    const ni=vertices.length;
    vertices.push([
      v[0]+n[0]*offset,
      v[1]+n[1]*offset,
      v[2]+n[2]*offset
    ]);
    vmap.set(oldIndex,ni);
    return ni;
  }

  for(const f of mesh.triangles) {
    const c=faceCentroid(mesh.vertices,f);
    if(!selector(c)) continue;
    triangles.push([getVertex(f[0]),getVertex(f[1]),getVertex(f[2])]);
  }

  return {vertices,triangles,color,name};
}

function addBox(center,size,color,name) {
  const [cx,cy,cz]=center,[sx,sy,sz]=size;
  const x=sx/2,y=sy/2,z=sz/2;
  const v=[
    [cx-x,cy-y,cz-z],[cx+x,cy-y,cz-z],[cx+x,cy+y,cz-z],[cx-x,cy+y,cz-z],
    [cx-x,cy-y,cz+z],[cx+x,cy-y,cz+z],[cx+x,cy+y,cz+z],[cx-x,cy+y,cz+z],
  ];
  const f=[
    [0,1,2],[0,2,3],[4,6,5],[4,7,6],
    [0,4,5],[0,5,1],[3,2,6],[3,6,7],
    [1,5,6],[1,6,2],[0,3,7],[0,7,4]
  ];
  return {vertices:v,triangles:f,color,name};
}

const VS=`
attribute vec3 p;
attribute vec3 n;
uniform mat4 m;
uniform mat4 vp;
varying vec3 N;
void main(){
  N=mat3(m)*n;
  gl_Position=vp*m*vec4(p,1.0);
}
`;

const FS=`
precision mediump float;
varying vec3 N;
uniform vec3 baseColor;
void main(){
  vec3 nn=normalize(N);
  vec3 L=normalize(vec3(-.58,.88,.52));
  float d=max(dot(nn,L),0.0);
  float toon=d>.65?.95:d>.34?.76:.54;
  float rim=pow(1.0-abs(nn.z),2.0)*.10;
  gl_FragColor=vec4(baseColor*toon+vec3(.10,.12,.15)*rim,1.0);
}
`;

function compile(type,src) {
  const s=gl.createShader(type);
  gl.shaderSource(s,src);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

const prog=gl.createProgram();
gl.attachShader(prog,compile(gl.VERTEX_SHADER,VS));
gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,FS));
gl.linkProgram(prog);
if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);

const lp=gl.getAttribLocation(prog,"p");
const ln=gl.getAttribLocation(prog,"n");
const lm=gl.getUniformLocation(prog,"m");
const lvp=gl.getUniformLocation(prog,"vp");
const lcolor=gl.getUniformLocation(prog,"baseColor");

function uploadLayer(layer) {
  const normals=buildNormals(layer.vertices,layer.triangles);
  const V=new Float32Array(layer.vertices.flat());
  const N=new Float32Array(normals.flat());
  const maxIndex=Math.max(...layer.triangles.flat());
  if(maxIndex>65535) throw new Error("Mesh index exceeds WebGL1 uint16 limit");
  const I=new Uint16Array(layer.triangles.flat());

  const pb=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,pb);
  gl.bufferData(gl.ARRAY_BUFFER,V,gl.STATIC_DRAW);

  const nb=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,nb);
  gl.bufferData(gl.ARRAY_BUFFER,N,gl.STATIC_DRAW);

  const ib=gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,I,gl.STATIC_DRAW);

  layers.push({
    ...layer,
    positionBuffer:pb,
    normalBuffer:nb,
    indexBuffer:ib,
    indexCount:I.length
  });
}

function createSuit(body) {
  // Base visible body: only exposed head. This is actual body geometry.
  uploadLayer(makeClothingLayer(
    body,
    c => c[1] > 1.46,
    0.0,
    [0.66,0.68,0.70],
    "head"
  ));

  // Full blue pressure/utility undersuit, neck down.
  uploadLayer(makeClothingLayer(
    body,
    c => c[1] > 0.12 && c[1] < 1.48,
    0.012,
    [0.07,0.23,0.50],
    "blue undersuit"
  ));

  // White torso armor shell.
  uploadLayer(makeClothingLayer(
    body,
    c => c[1] > 0.91 && c[1] < 1.38 && Math.abs(c[0]) < 0.25,
    0.027,
    [0.86,0.88,0.90],
    "white torso armor"
  ));

  // Shoulder/upper-arm white panels.
  uploadLayer(makeClothingLayer(
    body,
    c => c[1] > 1.12 && c[1] < 1.38 && Math.abs(c[0]) > 0.18,
    0.024,
    [0.86,0.88,0.90],
    "shoulder panels"
  ));

  // Forearm guards, dark graphite.
  uploadLayer(makeClothingLayer(
    body,
    c => c[1] > 0.78 && c[1] < 1.10 && Math.abs(c[0]) > 0.28,
    0.023,
    [0.12,0.15,0.18],
    "forearm guards"
  ));

  // Gloves.
  uploadLayer(makeClothingLayer(
    body,
    c => c[1] > 0.61 && c[1] < 0.84 && Math.abs(c[0]) > 0.39,
    0.022,
    [0.08,0.10,0.12],
    "gloves"
  ));

  // Knee + shin guards.
  uploadLayer(makeClothingLayer(
    body,
    c => c[1] > 0.20 && c[1] < 0.60 && Math.abs(c[0]) < 0.19,
    0.022,
    [0.15,0.18,0.22],
    "leg protection"
  ));

  // Boots.
  uploadLayer(makeClothingLayer(
    body,
    c => c[1] < 0.22,
    0.028,
    [0.10,0.12,0.14],
    "boots"
  ));

  // Real 3D utility / armor modules.
  uploadLayer(addBox([0,1.14,0.16],[0.27,0.24,0.055],[0.86,0.88,0.90],"chest plate"));
  uploadLayer(addBox([0,0.88,0.12],[0.34,0.055,0.055],[0.10,0.12,0.14],"utility belt"));
  uploadLayer(addBox([0,1.18,-0.20],[0.31,0.43,0.13],[0.70,0.73,0.76],"life support backpack"));

  // Side utility pouches.
  uploadLayer(addBox([-0.20,0.86,0.06],[0.09,0.14,0.08],[0.22,0.24,0.27],"left pouch"));
  uploadLayer(addBox([ 0.20,0.86,0.06],[0.09,0.14,0.08],[0.22,0.24,0.27],"right pouch"));

  // Orange chest buckle/detail.
  uploadLayer(addBox([0,1.01,0.19],[0.075,0.045,0.025],[0.95,0.35,0.04],"orange buckle"));
}

function id(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
function mul(a,b){const o=new Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
function per(f,a,n,z){const s=1/Math.tan(f/2),d=1/(n-z);return[s/a,0,0,0,0,s,0,0,0,0,(z+n)*d,-1,0,0,2*z*n*d,0]}
function tr(x,y,z){const m=id();m[12]=x;m[13]=y;m[14]=z;return m}
function ry(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]}
function rx(a){const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]}
function sc(s){return[s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1]}

function draw() {
  if(!layers.length) return;

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(1,1,1,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  const P=per(Math.PI/4,canvas.width/canvas.height,.1,20);
  const view=tr(0,-.87,-3.55);
  let model=mul(ry(yaw),rx(pitch));
  model=mul(model,sc(zoom));

  gl.uniformMatrix4fv(lm,false,new Float32Array(model));
  gl.uniformMatrix4fv(lvp,false,new Float32Array(mul(P,view)));

  for(const layer of layers) {
    gl.bindBuffer(gl.ARRAY_BUFFER,layer.positionBuffer);
    gl.enableVertexAttribArray(lp);
    gl.vertexAttribPointer(lp,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,layer.normalBuffer);
    gl.enableVertexAttribArray(ln);
    gl.vertexAttribPointer(ln,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,layer.indexBuffer);
    gl.uniform3fv(lcolor,new Float32Array(layer.color));
    gl.drawElements(gl.TRIANGLES,layer.indexCount,gl.UNSIGNED_SHORT,0);
  }
}

function resize() {
  const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();
  canvas.width=Math.max(1,Math.round(r.width*d));
  canvas.height=Math.max(1,Math.round(r.height*d));
  gl.viewport(0,0,canvas.width,canvas.height);
  draw();
}

async function fetchBase() {
  let lastErr;
  for(const url of SOURCES) {
    try {
      statusEl.textContent="HM08 astronaut body laden…";
      const response=await fetch(url,{cache:"force-cache"});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const text=await response.text();
      const body=normalizeMesh(parseOBJ(text));
      createSuit(body);
      statusEl.textContent=`Future colony suit · ${layers.length} echte 3D-lagen · 175 cm`;
      resize();
      return;
    } catch(err) {
      lastErr=err;
      console.warn(url,err);
    }
  }
  statusEl.textContent="Body kon niet geladen worden: "+(lastErr?.message||"onbekend");
}

canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY}};
canvas.onpointermove=e=>{
  if(!drag||drag.id!==e.pointerId)return;
  yaw+=(e.clientX-drag.x)*.012;
  pitch=Math.max(-.7,Math.min(.7,pitch+(e.clientY-drag.y)*.007));
  drag.x=e.clientX;drag.y=e.clientY;
  draw();
};
canvas.onpointerup=e=>{if(drag?.id===e.pointerId)drag=null};

canvas.addEventListener("touchstart",e=>{
  if(e.touches.length===2) {
    const a=e.touches[0],b=e.touches[1];
    pinch=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  }
},{passive:true});

canvas.addEventListener("touchmove",e=>{
  if(e.touches.length===2) {
    e.preventDefault();
    const a=e.touches[0],b=e.touches[1];
    const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
    if(pinch) {
      zoom*=d/pinch;
      zoom=Math.max(.6,Math.min(1.8,zoom));
      draw();
    }
    pinch=d;
  }
},{passive:false});

canvas.addEventListener("touchend",()=>pinch=null);

document.querySelectorAll("button").forEach(b=>b.onclick=()=>{
  const v=b.dataset.view;
  if(v==="front")yaw=0;
  if(v==="three")yaw=-Math.PI/4;
  if(v==="side")yaw=-Math.PI/2;
  if(v==="back")yaw=Math.PI;
  if(v==="reset"){yaw=-.24;pitch=-.035;zoom=1}
  draw();
});

window.onresize=resize;
resize();
fetchBase();
