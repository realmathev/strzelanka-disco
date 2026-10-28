// Dodatki do zestawu pistol-kit.js dla broni długich: wyborowe i LKM (ds-weapon-modeler).
// Te same konwencje: milimetry na wejściu, metry w wyjściu, wylot w −Z, oś lufy y=0, część = {g,h}.
// Dochodzą: profil z dziurami z poprawnym konturem (profH), łuk magazynka (curvePoly), walec pusty/otwarty (cylO, ring),
// tokarka (lathe), kula (sph), wspólna rejestracja blueprintu na definicji broni (reg).
import {DS} from '../../core/ds.js';
import {Asm,blueprint,box,cyl,prof,sect,quad,arc,KM} from './pistol-kit.js';
export {Asm,blueprint,box,cyl,prof,sect,quad,arc,KM};

const MM=.001;
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1);

// dodatkowe materiały (współdzielone); nie zmieniają istniejących kluczy KM
if(!KM.olive){
  KM.olive=new THREE.MeshToonMaterial({color:0x5b6340,gradientMap:KM.m1.gradientMap});
  KM.glass=new THREE.MeshBasicMaterial({color:0x7fb6d0});
  KM.rubber=new THREE.MeshToonMaterial({color:0x201e1c,gradientMap:KM.m1.gradientMap});
  for(const k of ['olive','glass','rubber'])KM[k].userData.shared=true;
}

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
function place(g,x,y,z,rx,ry,rz){
  _m.compose(_v.set(x*MM,y*MM,z*MM),_q.setFromEuler(_e.set(rx||0,ry||0,rz||0)),_s);g.applyMatrix4(_m);
}
/** Dowolna geometria three (w mm-owych jednostkach już przeskalowana na metry) -> część {g,h} z konturem t [mm]. */
export function part(geo,x=0,y=0,z=0,rx=0,ry=0,rz=0,t=0){
  const g=ngeo(geo);let h=null;if(t){h=g.clone();inflate(h,t*MM)}
  place(g,x,y,z,rx,ry,rz);if(h)place(h,x,y,z,rx,ry,rz);return {g,h};
}
/** Walec/stożek, opcjonalnie otwarty (bez den). r0 = strona +oś, r1 = strona −oś (jak cyl). */
export function cylO(r0,r1,len,x,y,z,seg=8,axis='z',t=0,open=true){
  const g=new THREE.CylinderGeometry(r0*MM,r1*MM,len*MM,seg,1,open);
  if(axis==='z')g.rotateX(Math.PI/2);else if(axis==='x')g.rotateZ(-Math.PI/2);
  return part(g,x,y,z,0,0,0,t);
}
/** Tokarka: punkty [r, pozycja_na_osi] (mm) rosnąco wzdłuż osi. axis 'z' (domyślnie) lub 'y'. */
export function lathe(pts,x,y,z,seg=10,axis='z',t=0){
  const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0]*MM,p[1]*MM)),seg);
  if(axis==='z')g.rotateX(Math.PI/2);else if(axis==='x')g.rotateZ(-Math.PI/2);
  return part(g,x,y,z,0,0,0,t);
}
/** Pierścień (rurka z grubością): rin, rout, długość, oś. */
export function ring(rin,rout,len,x,y,z,seg=10,axis='z',t=0){
  const l=len/2;return lathe([[rin,-l],[rout,-l],[rout,l],[rin,l],[rin,-l]],x,y,z,seg,axis,t);
}
export function sph(r,x,y,z,ws=7,hs=5,t=0){return part(new THREE.SphereGeometry(r*MM,ws,hs),x,y,z,0,0,0,t)}

const grow=(P,t)=>{ // skala konturu względem środka bbox o t mm na stronę (t<0 = zmniejsz)
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}
  const cx=(x0+x1)/2,cy=(y0+y1)/2,kx=(x1-x0+2*t)/(x1-x0),ky=(y1-y0+2*t)/(y1-y0);
  return P.map(p=>[(p[0]-cx)*kx+cx,(p[1]-cy)*ky+cy]);
};
/** Jak prof(), ale kontur zachowuje otwory (obrys na zewnątrz powiększony, w otworach zmniejszony) – dla szkieletowych kolb. */
export function profH(pts,w,x=0,holes=[],t=2.2){
  const V=a=>new THREE.Vector2(-a[0]*MM,a[1]*MM);
  const mk=(P,H,d)=>{const sh=new THREE.Shape(P.map(V));for(const h of H)sh.holes.push(new THREE.Path(h.map(V)));
    const g=new THREE.ExtrudeGeometry(sh,{depth:d*MM,bevelEnabled:false,curveSegments:1});g.rotateY(Math.PI/2);g.translate(-d/2*MM,0,0);return ngeo(g)};
  const g=mk(pts,holes,w);let h=null;
  if(t)h=mk(grow(pts,t),holes.map(c=>grow(c,-t*.8)),w+2*t);
  place(g,x,0,0);if(h)place(h,x,0,0);return {g,h};
}
/** Sylwetka łukowego pudełka magazynka (punkty [z,y]): górny środek (zc,yTop), długość wzdłuż łuku len, grubość (z) thick,
 *  kąt gięcia bend [rad] w stronę −Z (do przodu), n odcinków, thickEnd = grubość na dole (domyślnie jak u góry). */
export function curvePoly(zc,yTop,len,thick,bend,n=5,thickEnd=thick){
  const R=len/bend,Cz=zc-R,rear=[],front=[];
  for(let i=0;i<=n;i++){
    const f=i/n,a=bend*f,th=(thick+(thickEnd-thick)*f)/2;
    const pz=Cz+R*Math.cos(a),py=yTop-R*Math.sin(a),nz=Math.cos(a),ny=-Math.sin(a);
    rear.push([pz+nz*th,py+ny*th]);front.push([pz-nz*th,py-ny*th]);
  }
  return rear.concat(front.reverse());
}
/** Środek łuku w funkcji f (0..1) – do ustawiania np. kart na dole magazynka. */
export function curveAt(zc,yTop,len,bend,f){const R=len/bend,a=bend*f;return [zc-R+R*Math.cos(a),yTop-R*Math.sin(a)]}

/** Wspólne pomocniki animacji. */
export const sin01=t=>Math.sin(Math.min(1,Math.max(0,t))*Math.PI);
export const cl01=t=>Math.min(1,Math.max(0,t));
export const at=(o,x,y,z)=>o.position.set(o.userData.p0.x+x,o.userData.p0.y+y,o.userData.p0.z+z);
/** Część bez konturu (modele świata). */
export const nh=p=>({g:p.g,h:null});

/** Szczerbinka dwusłupkowa z podstawą: posty od y0 do top, podstawa (mostek) do floor. */
export function notchSight(a,{z,y0,floor,top,wTot=12,notch=4,len=8,mat='black',t=.7}){
  const pw=(wTot-notch)/2;
  a.add([box(pw,top-y0,len,-(notch/2+pw/2),(y0+top)/2,z,0,0,0,t),box(pw,top-y0,len,(notch/2+pw/2),(y0+top)/2,z,0,0,0,t),
    box(wTot,floor-y0,len,0,(y0+floor)/2,z,0,0,0,t)],mat);
}

/** Rejestracja blueprintu na definicji broni (kontrakt jak w pistols.js). extra(g, parts) dopisuje userData (np. setAds, przełączniki). */
export function reg(id,bp,extra){
  const W=DS.weapons.get(id);if(!W)return;
  const wrap=mats=>{const g=bp.view(mats);if(extra)extra(g,g.userData.parts);return g};
  W.getViewModel=wrap;
  W.getWorldModel=mats=>bp.world(mats);
  W.sightAnchor=bp.sightAnchor;W.sightRear=bp.sightRear;W.sightFront=bp.sightFront;W.modelTris=()=>bp.tris();
  W.model=({group,mat1,mat2,muzzle})=>{
    const vm=wrap({m1:mat1,m2:mat2});
    group.add(vm);Object.assign(group.userData,vm.userData);
    muzzle.copy(bp.muzzle);
  };
}

