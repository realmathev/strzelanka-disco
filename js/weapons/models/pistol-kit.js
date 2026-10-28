// Zestaw narzędzi do modeli pistoletów (ds-weapon-modeler). Autorstwo w MILIMETRACH, wyjście w metrach.
// Układ: wylot w −Z, +Y góra, +X prawo, oś lufy = y 0. Geometria budowana RAZ (cache), instancje współdzielą bufory.
//
// Pojęcia:
//  * część  = {g, h}: geometria (zapieczona w układzie broni) + opcjonalny kadłub konturu (h, napompowany o `t` mm).
//  * Asm    = zespół z własnym pivotem (grupa three). Części w jednym zespole są scalane per materiał w JEDNĄ siatkę,
//             a kontury wszystkich części w jeden kadłub (hullGeo) => mało draw calli.
//  * Zespoły-dzieci (zamek, magazynek, kurek, bęben...) to osobne grupy z pivotem w podanym punkcie (współrzędne broni, mm).
import {toon,hullGeo} from '../../render/materials.js';
import {mergeGeometries} from '../../render/merge.js';

const MM=.001, HT=2.2; // mm -> m; domyślna grubość konturu [mm]
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1);

/** Wspólne materiały (współdzielone przez wszystkie modele). m1/m2 podstawia gra (skórki), tu tylko domyślne. */
export const KM={
  m1:toon(0x3a3835), m2:toon(0x8a857c),
  black:toon(0x171615), grip:toon(0x2c2a28), wood:toon(0x8a5530), woodDark:toon(0x5e3a1f),
  brass:toon(0xd2a93e), chrome:toon(0xc9cdd1), steel:toon(0x6f747a),
  white:new THREE.MeshBasicMaterial({color:0xf4f1e6}), red:new THREE.MeshBasicMaterial({color:0xe0361f}),
  gold:toon(0xe0b040),
};
for(const k in KM)KM[k].userData.shared=true;

/** Geometria nieindeksowana z atrybutami position/normal/uv (wymóg scalania). */
function ngeo(g){
  const n=g.index?g.toNonIndexed():g,o=new THREE.BufferGeometry();
  o.setAttribute('position',n.attributes.position);o.setAttribute('normal',n.attributes.normal);o.setAttribute('uv',n.attributes.uv);
  return o;
}
/** Pompuje geometrię o t [m] na każdą stronę względem środka jej bbox (kontur w tuszu). */
function inflate(g,t){
  g.computeBoundingBox();const b=g.boundingBox,p=g.attributes.position;
  const c=[(b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,(b.min.z+b.max.z)/2],sz=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z];
  const k=sz.map(s=>s>1e-5?(s+2*t)/s:1);
  for(let i=0;i<p.count;i++){p.setXYZ(i,(p.getX(i)-c[0])*k[0]+c[0],(p.getY(i)-c[1])*k[1]+c[1],(p.getZ(i)-c[2])*k[2]+c[2])}
  p.needsUpdate=true;return g;
}
function bake(geo,x,y,z,rx,ry,rz,t){
  const g=ngeo(geo);let h=null;
  if(t){h=g.clone();inflate(h,t*MM)}
  _m.compose(_v.set(x*MM,y*MM,z*MM),_q.setFromEuler(_e.set(rx||0,ry||0,rz||0)),_s);
  g.applyMatrix4(_m);if(h)h.applyMatrix4(_m);
  return {g,h};
}

/** Prostopadłościan w,h,d (mm) o środku x,y,z; obrót rx,ry,rz [rad]; t = grubość konturu (0 = bez konturu). */
export const box=(w,h,d,x,y,z,rx,ry,rz,t=HT)=>bake(new THREE.BoxGeometry(w*MM,h*MM,d*MM),x,y,z,rx,ry,rz,t);
/** Walec/stożek wzdłuż osi `axis` ('z'|'x'|'y'). r0 = promień od strony +oś (z: tył), r1 = od −oś (z: przód). */
export function cyl(r0,r1,len,x,y,z,seg=8,axis='z',t=HT){
  const g=new THREE.CylinderGeometry(r0*MM,r1*MM,len*MM,seg);
  if(axis==='z')g.rotateX(Math.PI/2);else if(axis==='x')g.rotateZ(-Math.PI/2);
  return bake(g,x,y,z,0,0,0,t);
}
/** Sylwetka z boku: punkty [z,y] (mm), wyciągnięta na szerokość w wokół x. holes: tablice punktów [z,y] (otwory). */
export function prof(pts,w,x=0,holes=[],t=HT){
  const V=a=>new THREE.Vector2(-a[0]*MM,a[1]*MM);
  const sh=new THREE.Shape(pts.map(V));for(const h of holes)sh.holes.push(new THREE.Path(h.map(V)));
  const g=new THREE.ExtrudeGeometry(sh,{depth:w*MM,bevelEnabled:false,curveSegments:1});
  g.rotateY(Math.PI/2);g.translate(-w/2*MM,0,0);
  return bake(g,x,0,0,0,0,0,t);
}
/** Przekrój (punkty [x,y] mm) wyciągnięty wzdłuż Z od zf (przód, mniejsze) do zr (tył). */
export function sect(pts,zf,zr,t=HT){
  const sh=new THREE.Shape(pts.map(a=>new THREE.Vector2(a[0]*MM,a[1]*MM)));
  const g=new THREE.ExtrudeGeometry(sh,{depth:(zr-zf)*MM,bevelEnabled:false,curveSegments:1});
  g.translate(0,0,zf*MM);return bake(g,0,0,0,0,0,0,t);
}
/** Płaski „decal” w×h (mm) zwrócony ścianą face: '+x','-x','+y','+z','-z'. Bez konturu. */
export function quad(w,h,x,y,z,face='+x'){
  const g=new THREE.PlaneGeometry(w*MM,h*MM);
  if(face==='+x')g.rotateY(Math.PI/2);else if(face==='-x')g.rotateY(-Math.PI/2);else if(face==='+y')g.rotateX(-Math.PI/2);else if(face==='-z')g.rotateY(Math.PI);
  return bake(g,x,y,z,0,0,0,0);
}
/** Punkty łuku [z,y] (mm) środek cz,cy, promień r, kąty a0..a1 [rad] (0 = +z, rośnie ku +y), n odcinków. */
export function arc(cz,cy,r,a0,a1,n=4){const o=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;o.push([cz+Math.cos(a)*r,cy+Math.sin(a)*r])}return o}

/** Zespół (grupa three z pivotem w punkcie `pivot` [mm, współrzędne broni]). */
export class Asm{
  constructor(name,pivot=[0,0,0]){this.name=name;this.pivot=pivot;this.items=[];this.kids=[];this.marks=[]}
  /** p: część lub tablica części; mat: klucz materiału (m1,m2,black,grip,wood,...). */
  add(p,mat='m1'){if(Array.isArray(p))p.forEach(q=>this.add(q,mat));else this.items.push({p,mat});return this}
  child(name,pivot){const a=new Asm(name,pivot);this.kids.push(a);return a}
  /** Nazwany znacznik (Object3D) w punkcie pos [mm]. */
  mark(name,pos){this.marks.push({name,pos});return this}
}

/** Zamienia Asm w gotowe, współdzielone bufory (raz). */
function compile(a,pp=[0,0,0]){
  const px=a.pivot[0]*MM,py=a.pivot[1]*MM,pz=a.pivot[2]*MM,byMat={},hulls=[];
  for(const {p,mat} of a.items){
    (byMat[mat]||(byMat[mat]=[])).push(p.g.clone().translate(-px,-py,-pz));
    if(p.h)hulls.push(p.h.clone().translate(-px,-py,-pz));
  }
  const geos={};let tris=0,hullTris=0;
  for(const k in byMat){const g=mergeGeometries(byMat[k]);g.userData.shared=true;geos[k]=g;tris+=g.attributes.position.count/3}
  let hull=null;if(hulls.length){hull=mergeGeometries(hulls);hull.userData.shared=true;hullTris=hull.attributes.position.count/3}
  return {name:a.name,pos:[px-pp[0]*MM,py-pp[1]*MM,pz-pp[2]*MM],geos,hull,tris,hullTris,
    marks:a.marks.map(m=>({name:m.name,pos:[m.pos[0]*MM-px,m.pos[1]*MM-py,m.pos[2]*MM-pz]})),
    kids:a.kids.map(k=>compile(k,a.pivot))};
}
function inst(c,mats,parts){
  const g=new THREE.Group();g.name=c.name;g.position.set(c.pos[0],c.pos[1],c.pos[2]);parts[c.name]=g;
  for(const k in c.geos){const m=new THREE.Mesh(c.geos[k],mats[k]||KM[k]);m.name=c.name+'.'+k;g.add(m)}
  if(c.hull){const h=hullGeo(g,c.hull);h.userData.hull=true}
  for(const m of c.marks){const o=new THREE.Object3D();o.name=m.name;o.position.set(m.pos[0],m.pos[1],m.pos[2]);g.add(o);parts[m.name]=o}
  for(const k of c.kids)g.add(inst(k,mats,parts));
  return g;
}
function sumTris(c){let a=c.tris,b=c.hullTris;for(const k of c.kids){const s=sumTris(k);a+=s[0];b+=s[1]}return [a,b]}

/**
 * Plan modelu. spec: {id, view:Asm, world:Asm, muzzle:[x,y,z] mm, eye:[x,y,z] mm (punkt oka w ADS), rear:[..] (szczerbinka), front:[..] (szczyt muszki),
 * eyeRelief, anim(parts,t)}. Zwraca obiekt z metodami: view(mats) / world(mats) -> THREE.Group z userData {parts, muzzle, sightAnchor, ...}.
 */
export function blueprint(spec){
  let cv=null,cw=null;
  const V=a=>new THREE.Vector3(a[0]*MM,a[1]*MM,a[2]*MM);
  const make=(c,mats,world)=>{
    const m=Object.assign({},KM,mats||{}),parts={},g=inst(c,m,parts);g.name=spec.id+(world?'.world':'.view');
    for(const k in parts)parts[k].userData.p0=parts[k].position.clone(); // pozycja bazowa (spoczynkowa) dla animacji
    if(spec.alias)for(const k in spec.alias)parts[k]=parts[spec.alias[k]];
    g.userData.parts=parts;g.userData.muzzle=V(spec.muzzle);
    if(!world){
      g.userData.sightAnchor=V(spec.eye);g.userData.sightRear=V(spec.rear);g.userData.sightFront=V(spec.front);g.userData.eyeRelief=spec.eyeRelief*MM;
      g.userData.anim=t=>spec.anim&&spec.anim(parts,t);
    }
    return g;
  };
  return {
    id:spec.id,spec,
    muzzle:V(spec.muzzle),sightAnchor:V(spec.eye),sightRear:V(spec.rear),sightFront:V(spec.front),
    view(mats){return make(cv||(cv=compile(spec.view)),mats,false)},
    world(mats){return make(cw||(cw=compile(spec.world)),mats,true)},
    tris(){const a=sumTris(cv||(cv=compile(spec.view))),b=sumTris(cw||(cw=compile(spec.world)));return {view:a[0],viewHull:a[1],world:b[0],worldHull:b[1]}},
  };
}
