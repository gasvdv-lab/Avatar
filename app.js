\
const canvas = document.getElementById("viewport");
const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
const statusEl = document.getElementById("status");

if (!gl) {
  statusEl.textContent = "WebGL wordt niet ondersteund op dit toestel.";
  throw new Error("WebGL unavailable");
}

let meshData;
let yaw = -0.32;
let pitch = -0.03;
let zoom = 1.0;
let drag = null;
let pinchDistance = null;

const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uViewProj;

varying vec3 vNormal;
varying vec3 vWorld;

void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  vWorld = world.xyz;
  vNormal = mat3(uModel) * aNormal;
  gl_Position = uViewProj * world;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec3 vNormal;
varying vec3 vWorld;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L1 = normalize(vec3(-0.65, 0.85, 0.55));
  vec3 L2 = normalize(vec3(0.55, 0.25, -0.75));

  float key = max(dot(N, L1), 0.0);
  float fill = max(dot(N, L2), 0.0) * 0.22;
  float rim = pow(1.0 - max(abs(N.z), 0.0), 2.0) * 0.18;

  float toon = key > 0.62 ? 0.88 :
               key > 0.30 ? 0.68 :
                            0.48;

  vec3 base = vec3(0.68, 0.71, 0.75);
  vec3 color = base * (toon + fill) + vec3(0.12,0.17,0.22) * rim;
  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSource));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program));
}
gl.useProgram(program);

const loc = {
  position: gl.getAttribLocation(program, "aPosition"),
  normal: gl.getAttribLocation(program, "aNormal"),
  model: gl.getUniformLocation(program, "uModel"),
  viewProj: gl.getUniformLocation(program, "uViewProj"),
};

const positionBuffer = gl.createBuffer();
const normalBuffer = gl.createBuffer();
const indexBuffer = gl.createBuffer();

let indexCount = 0;

function vec3sub(a,b){ return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function cross(a,b){
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
function normalize(v){
  const l=Math.hypot(v[0],v[1],v[2])||1;
  return [v[0]/l,v[1]/l,v[2]/l];
}

function buildNormals(vertices, triangles) {
  const normals = Array.from({length:vertices.length},()=>[0,0,0]);
  for (const [ia,ib,ic] of triangles) {
    const a=vertices[ia], b=vertices[ib], c=vertices[ic];
    const n=cross(vec3sub(b,a),vec3sub(c,a));
    for (const i of [ia,ib,ic]) {
      normals[i][0]+=n[0]; normals[i][1]+=n[1]; normals[i][2]+=n[2];
    }
  }
  return normals.map(normalize);
}

function uploadMesh(data) {
  const positions = new Float32Array(data.vertices.flat());
  const normals = new Float32Array(buildNormals(data.vertices, data.triangles).flat());
  const indices = new Uint16Array(data.triangles.flat());

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc.position);
  gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc.normal);
  gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  indexCount = indices.length;
}

function mat4Identity(){
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}
function mat4Mul(a,b){
  const out=new Array(16).fill(0);
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) for(let k=0;k<4;k++)
    out[c*4+r]+=a[k*4+r]*b[c*4+k];
  return out;
}
function mat4Perspective(fovy,aspect,near,far){
  const f=1/Math.tan(fovy/2), nf=1/(near-far);
  return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0];
}
function mat4Translate(x,y,z){
  const m=mat4Identity(); m[12]=x;m[13]=y;m[14]=z; return m;
}
function mat4RotateX(a){
  const c=Math.cos(a),s=Math.sin(a);
  return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
}
function mat4RotateY(a){
  const c=Math.cos(a),s=Math.sin(a);
  return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
}
function mat4Scale(s){
  return [s,0,0,0, 0,s,0,0, 0,0,s,0, 0,0,0,1];
}

function resize() {
  const dpr=Math.min(devicePixelRatio||1,2);
  const rect=canvas.getBoundingClientRect();
  const w=Math.max(1,Math.round(rect.width*dpr));
  const h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w || canvas.height!==h){
    canvas.width=w; canvas.height=h;
  }
  gl.viewport(0,0,w,h);
  draw();
}

function draw() {
  if(!meshData || !indexCount) return;

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect=canvas.width/canvas.height;
  const projection=mat4Perspective(Math.PI/4,aspect,.1,20);
  const view=mat4Translate(0,-0.87,-3.45);

  let model=mat4Mul(mat4RotateY(yaw),mat4RotateX(pitch));
  model=mat4Mul(model,mat4Scale(zoom));

  gl.uniformMatrix4fv(loc.model,false,new Float32Array(model));
  gl.uniformMatrix4fv(loc.viewProj,false,new Float32Array(mat4Mul(projection,view)));

  gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);
}

async function load() {
  try {
    const response=await fetch(`body_mesh.json?v=013`,{cache:"no-store"});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    meshData=await response.json();
    uploadMesh(meshData);
    statusEl.textContent =
      `${meshData.spec.style} · ${meshData.vertices.length} vertices · ${meshData.triangles.length} triangles`;
    resize();
  } catch(err) {
    console.error(err);
    statusEl.textContent="Bodydata kon niet geladen worden.";
  }
}

canvas.addEventListener("pointerdown", e=>{
  canvas.setPointerCapture(e.pointerId);
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};
});
canvas.addEventListener("pointermove", e=>{
  if(!drag || drag.id!==e.pointerId) return;
  const dx=e.clientX-drag.x, dy=e.clientY-drag.y;
  yaw+=dx*.012;
  pitch=Math.max(-.7,Math.min(.7,pitch+dy*.007));
  drag.x=e.clientX; drag.y=e.clientY;
  draw();
});
canvas.addEventListener("pointerup", e=>{
  if(drag?.id===e.pointerId) drag=null;
});
canvas.addEventListener("pointercancel", ()=>drag=null);

canvas.addEventListener("touchstart", e=>{
  if(e.touches.length===2){
    const a=e.touches[0],b=e.touches[1];
    pinchDistance=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  }
},{passive:true});

canvas.addEventListener("touchmove", e=>{
  if(e.touches.length===2){
    e.preventDefault();
    const a=e.touches[0],b=e.touches[1];
    const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
    if(pinchDistance){
      zoom*=d/pinchDistance;
      zoom=Math.max(.65,Math.min(1.7,zoom));
      draw();
    }
    pinchDistance=d;
  }
},{passive:false});

canvas.addEventListener("touchend",()=>pinchDistance=null);

document.querySelectorAll("[data-view]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const v=btn.dataset.view;
    if(v==="front"){yaw=0;pitch=-.03;}
    if(v==="three"){yaw=-Math.PI/4;pitch=-.03;}
    if(v==="side"){yaw=-Math.PI/2;pitch=-.03;}
    if(v==="back"){yaw=Math.PI;pitch=-.03;}
    if(v==="reset"){yaw=-.32;pitch=-.03;zoom=1;}
    draw();
  });
});

window.addEventListener("resize",resize);
load();
