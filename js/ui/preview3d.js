// Podgląd 3D broni w Ekwipunku: osobny, mały renderer (własna scena), model z DS.weapons.get(id).model().
// Obrót: automatyczny (wyłączony przy ograniczeniu animacji), przeciągnięcie myszą/dotykiem, strzałki na canvasie.
import {toon,pruneOutlines,inkMat,lineMat} from '../render/materials.js';
import {DS} from '../core/ds.js';
import {motionReduced} from './uiopts.js';

let R=null,scene=null,cam=null,pivot=null,holder=null,canvasEl=null,raf=0,ink=null;
let rot=-.6,auto=true,drag=null,curId=null,curSkin=null,lastW=0,lastH=0,failed=false;

function init(canvas){
  if(R&&canvasEl===canvas)return true;
  if(failed)return false;
  try{
    R=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
    R.setClearColor(0x000000,0);
    scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(28,1,.01,20);
    scene.add(new THREE.HemisphereLight(0xfff1d0,0x6b5640,.95));
    const d=new THREE.DirectionalLight(0xffffff,.8);d.position.set(1.5,2.5,2);scene.add(d);
    pivot=new THREE.Group();scene.add(pivot);
    ink=new THREE.MeshBasicMaterial({color:0x15110e,side:THREE.BackSide});
    canvasEl=canvas;
    canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,r:rot};canvas.setPointerCapture(e.pointerId);auto=false});
    canvas.addEventListener('pointermove',e=>{if(drag){rot=drag.r+(e.clientX-drag.x)*.012}});
    const end=()=>{drag=null};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
    canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){rot-=.2;auto=false;e.preventDefault();e.stopPropagation()}else if(e.key==='ArrowRight'){rot+=.2;auto=false;e.preventDefault();e.stopPropagation()}});
    return true;
  }catch(err){failed=true;R=null;return false}
}
function clearHolder(){
  if(!holder)return;pivot.remove(holder);
  // Geometrie/materiały oznaczone userData.shared (kity modeli broni) i globalne tusze zostają.
  holder.traverse(o=>{if(o.geometry&&!(o.geometry.userData&&o.geometry.userData.shared))o.geometry.dispose();const ms=o.material&&(Array.isArray(o.material)?o.material:[o.material]);if(ms)for(const m of ms)if(m!==ink&&m!==inkMat&&m!==lineMat&&!(m.userData&&m.userData.shared))m.dispose()});
  holder=null;pruneOutlines();
}
/** Ustawia model broni `id` w kolorach skórki `skin` ({c1,c2}). Zwraca false, gdy brak modelu/WebGL. */
export function setWeapon(canvas,id,skin){
  if(!init(canvas))return false;
  const def=DS.weapons.get(id);
  if(!def||typeof def.model!=='function')return false;
  clearHolder();
  const m1=toon(skin.c1),m2=toon(skin.c2);
  const g=new THREE.Group();
  const hull=(mesh,t)=>{const o=new THREE.Mesh(mesh.geometry,ink);o.scale.setScalar(1+t);mesh.add(o);return o};
  const B=(w,h,d,x,y,z,m,rx=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.rotation.x=rx;hull(mesh,.09);g.add(mesh);return mesh};
  try{def.model({B,group:g,mat1:m1,mat2:m2,muzzle:new THREE.Vector3(),hull})}catch(err){return false}
  // wyśrodkuj i dopasuj kamerę do bryły
  const box=new THREE.Box3().setFromObject(g),c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3());
  g.position.sub(c);holder=new THREE.Group();holder.add(g);pivot.add(holder);
  const r=Math.max(s.x,s.z,s.y*1.2)/2||.3;
  cam.userData.dist=r/Math.sin(cam.fov*Math.PI/360)*1.15;
  curId=id;curSkin=skin;
  return true;
}
function frame(t){
  raf=requestAnimationFrame(frame);
  if(!R||!holder)return;
  const w=canvasEl.clientWidth,h=canvasEl.clientHeight;if(!w||!h)return;
  if(w!==lastW||h!==lastH){lastW=w;lastH=h;R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
  if(auto&&!drag&&!motionReduced())rot+=.012;
  pivot.rotation.y=-Math.PI/2+rot;pivot.rotation.x=.12;
  const a=cam.aspect,d=cam.userData.dist*(a<1.3?1.3/a:1);
  cam.position.set(0,0,d);cam.lookAt(0,0,0);
  R.render(scene,cam);
}
export function startPreview(){auto=!motionReduced();if(!raf)raf=requestAnimationFrame(frame)}
export function stopPreview(){if(raf){cancelAnimationFrame(raf);raf=0}drag=null}
/** Czy dostępny jest model 3D dla broni. */
export const hasModel=id=>{const d=DS.weapons.get(id);return !!d&&typeof d.model==='function'&&!failed};
