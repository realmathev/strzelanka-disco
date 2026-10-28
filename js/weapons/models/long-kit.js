// Dodatki do pistol-kit.js dla broni długich (PM i strzelby; ds-weapon-modeler). Autorstwo w MILIMETRACH, wyjście w metrach.
// Dochodzą: ring (obręcz z otworem: przeziernik, kaptur muszki), lathe (bryła obrotowa), sph (kulka), rbox/rcyl (obrócone bryły),
// pomocnicze przyrządy (szczerbinka z dwóch słupków, muszka-słupek), animacyjne at()/sin01 oraz wspólna rejestracja modeli.
// Część = {g, h} jak w pistol-kit (geometria zapieczona w układzie broni + opcjonalny kadłub konturu).
import {DS} from '../../core/ds.js';
import {Asm,blueprint,box,cyl,prof,sect,quad,arc} from './pistol-kit.js';
export {Asm,blueprint,box,cyl,prof,sect,quad,arc};

const MM=.001;
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1);

function ngeo(g){
  const n=g.index?g.toNonIndexed():g,o=new THREE.BufferGeometry();
  o.setAttribute('position',n.attributes.position);o.setAttribute('normal',n.attributes.normal);o.setAttribute('uv',n.attributes.uv);
  return o;
}
function inflate(g,t){
  g.computeBoundingBox();const b=g.boundingBox,p=g.attributes.position;
  const c=[(b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,(b.min.z+b.max.z)/2],sz=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z];
  const k=sz.map(s=>s>1e-5?(s+2*t)/s:1);
  for(let i=0;i<p.count;i++)p.setXYZ(i,(p.getX(i)-c[0])*k[0]+c[0],(p.getY(i)-c[1])*k[1]+c[1],(p.getZ(i)-c[2])*k[2]+c[2]);
  p.needsUpdate=true;return g;
}
function bake(geo,x,y,z,rx,ry,rz,t){
  const g=ngeo(geo);let h=null;
  if(t){h=g.clone();inflate(h,t*MM)}
  _m.compose(_v.set(x*MM,y*MM,z*MM),_q.setFromEuler(_e.set(rx||0,ry||0,rz||0)),_s);
  g.applyMatrix4(_m);if(h)h.applyMatrix4(_m);
  return {g,h};
}

/** Obręcz (rura krótka) o promieniach ro/ri, długości len wzdłuż osi `axis` ('z'|'x'), środek x,y,z. Wielokąt o `seg` bokach (bez konturu domyślnie). */
export function ring(ro,ri,len,x,y,z,seg=8,axis='z',t=0){
  const sh=new THREE.Shape(),ho=new THREE.Path();
  for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2+Math.PI/seg;const c=Math.cos(a),s=Math.sin(a);
    if(i)sh.lineTo(c*ro*MM,s*ro*MM);else sh.moveTo(c*ro*MM,s*ro*MM);
    if(i)ho.lineTo(c*ri*MM,s*ri*MM);else ho.moveTo(c*ri*MM,s*ri*MM)}
  sh.holes.push(ho);
  const g=new THREE.ExtrudeGeometry(sh,{depth:len*MM,bevelEnabled:false,curveSegments:1});
  g.translate(0,0,-len*MM/2);
  if(axis==='x')g.rotateY(Math.PI/2);
  return bake(g,x,y,z,0,0,0,t);
}
/** Bryła obrotowa wokół osi Z: pts = [[z,r],...] (mm, współrzędne broni), środek osi w (x,y). seg boków. */
export function lathe(pts,x=0,y=0,seg=10,t=0){
  const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[1]*MM,p[0]*MM)),seg);
  g.rotateX(Math.PI/2);
  return bake(g,x,y,0,0,0,0,t);
}
/** Kulka (muszka kulkowa). */
export const sph=(r,x,y,z,seg=6,t=0)=>bake(new THREE.SphereGeometry(r*MM,seg,Math.max(3,seg>>1)),x,y,z,0,0,0,t);
/** Prostopadłościan z obrotem rx,ry,rz [rad]. */
export const rbox=(w,h,d,x,y,z,rx=0,ry=0,rz=0,t=0)=>bake(new THREE.BoxGeometry(w*MM,h*MM,d*MM),x,y,z,rx,ry,rz,t);
/** Walec o osi Z obrócony o rx,ry,rz (np. nachylone pręty). r0 = promień z tyłu (+z), r1 = z przodu. */
export function rcyl(r0,r1,len,x,y,z,rx=0,ry=0,rz=0,seg=6,t=0){
  const g=new THREE.CylinderGeometry(r0*MM,r1*MM,len*MM,seg);g.rotateX(Math.PI/2);
  return bake(g,x,y,z,rx,ry,rz,t);
}
export const nh=p=>({g:p.g,h:null});

/** Szczerbinka z dwóch słupków i podstawy (szczelina `notch`), jak w pistoletach. */
export function sightPosts(a,{z,y0,S,wTot=12,notch=4,len=8,mat='black'}){
  const pw=(wTot-notch)/2,h=S-y0;
  a.add([box(pw,h,len,-(notch/2+pw/2),y0+h/2,z,0,0,0,0),box(pw,h,len,(notch/2+pw/2),y0+h/2,z,0,0,0,0),box(wTot,3,len,0,y0+1.5,z,0,0,0,0)],mat);
}
/** Muszka-słupek z podstawą (y0..S). */
export function frontPost(a,{z,y0,S,w=2.6,len=5,mat='black'}){const h=S-y0;a.add(box(w,h,len,0,y0+h/2,z,0,0,0,0),mat)}

export const sin01=t=>Math.sin(Math.min(1,Math.max(0,t))*Math.PI);
export const clamp01=t=>Math.min(1,Math.max(0,t));
/** Ustawia pozycję części względem bazowej (p0) o (x,y,z) metrów. */
export const at=(o,x,y,z)=>o.position.set(o.userData.p0.x+x,o.userData.p0.y+y,o.userData.p0.z+z);

/** Rejestruje modele z fabryk BP{id:()=>blueprint} na definicjach broni (ten sam kontrakt co pistols.js). */
export function registerAll(BP){
  for(const id of Object.keys(BP)){
    const W=DS.weapons.get(id);if(!W)continue;
    const bp=BP[id]();
    W.getViewModel=mats=>bp.view(mats);
    W.getWorldModel=mats=>bp.world(mats);
    W.sightAnchor=bp.sightAnchor;W.sightRear=bp.sightRear;W.sightFront=bp.sightFront;W.modelTris=()=>bp.tris();
    W.model=({group,mat1,mat2,muzzle})=>{
      const vm=bp.view({m1:mat1,m2:mat2});
      group.add(vm);Object.assign(group.userData,vm.userData);
      muzzle.copy(bp.muzzle);
    };
  }
}
