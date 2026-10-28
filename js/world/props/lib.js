// Biblioteka rekwizytów (właściciel: ds-world-modeler).
//
// Rekwizyt = opis części (klasa Parts) + metadane. defProp() rejestruje w DS.props definicję:
//   {id, name, dims, cover, make(opts) -> THREE.Group, place(opts) -> Object3D (stub), parts(opts) -> Parts}
// - make():  samodzielna grupa (viewer, podglad, instancing). Origin = środek podstawy, przód/„twarz” patrzy w +Z
//            (samochody: przód w -Z). userData: {id, seed, collider:[{x0,x1,z0,z1,h}], cover, tris, ink, size}.
// - place({x,y,z,rotY,seed,variant,...}): wkłada części do świata przez addPart (scalanie w kafelki), dopisuje
//            kolidery do world.colliders (chyba że collide:false); neony idą do sceny + world.neon.
// - DS.props.instance(id, transforms, {seed,opts,collide}): InstancedMesh dla powtarzalnych rekwizytów.
//
// Zasady scalania (ARCHITECTURE.md): z materiału liczy się tylko kolor i map.repeat, więc detale z teksturą (tablice,
// plakaty, siatka) to „decale” z jednego atlasu canvas (alphaTest, jeden draw call dla całego świata), a neony to osobne
// płaszczyzny MeshBasic (mruganie = przygaszenie koloru w animateWorld, nigdy visible=false).
import {DS} from '../../core/ds.js';
import {scene} from '../../render/renderer.js';
import {opt} from '../../core/save.js';
import {toon,inkMat,lineMat,outlines,noRay} from '../../render/materials.js';
import {cnv} from '../../render/textures.js';
import {mergeGeometries,posOnly} from '../../render/merge.js';
import {addPart} from '../batch.js';
import {world} from '../state.js';

/* ---------- narzędzia ---------- */
/** Deterministyczny generator (mulberry32) z pomocnikami. */
export function rng(seed){
  let s=(Math.floor(seed*1000)|0)+0x9e3779b9;s>>>=0;
  const r=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
  r.range=(a,b)=>a+r()*(b-a);r.int=(a,b)=>Math.floor(a+r()*(b-a+1));r.pick=a=>a[Math.floor(r()*a.length)];r.chance=p=>r()<p;
  return r;
}
export const shade=(c,f)=>new THREE.Color(c).multiplyScalar(f).getHex();
export const mixc=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t).getHex();
const indexed=g=>{if(g.index)return g;const n=g.attributes.position.count,ix=new(n>65535?Uint32Array:Uint16Array)(n);for(let i=0;i<n;i++)ix[i]=i;g.setIndex(new THREE.BufferAttribute(ix,1));return g};
const tri=g=>(g.index?g.index.count:g.attributes.position.count)/3;
const _e=new THREE.Euler(),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),SC=new THREE.Matrix4(),M2=new THREE.Matrix4();
function paintGeo(g,color){
  const n=g.attributes.position.count,a=new Float32Array(n*3),c=new THREE.Color(color);
  for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}
  g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;
}

/* ---------- atlas decali ---------- */
const AW=2048,AH=1024;
const atlasCv=cnv(AW,AH,()=>{});const actx=atlasCv.getContext('2d');
export const atlasTex=new THREE.CanvasTexture(atlasCv);atlasTex.minFilter=THREE.LinearFilter;atlasTex.generateMipmaps=false;
let ax=0,ay=0,rowH=0;const rects=new Map();
/** Rezerwuje prostokąt w atlasie i rysuje go raz (cache po kluczu). draw(ctx,w,h). Zwraca {u0,u1,v0,v1,w,h}. */
export function atlas(key,w,h,draw){
  let r=rects.get(key);if(r)return r;
  if(ax+w+2>AW){ax=0;ay+=rowH+2;rowH=0}
  if(ay+h>AH){console.warn('props atlas pełny:',key);return rects.values().next().value}
  const x=ax,y=ay;ax+=w+2;rowH=Math.max(rowH,h);
  actx.save();actx.translate(x,y);actx.beginPath();actx.rect(0,0,w,h);actx.clip();draw(actx,w,h);actx.restore();
  atlasTex.needsUpdate=true;
  r={u0:x/AW,u1:(x+w)/AW,v0:1-(y+h)/AH,v1:1-y/AH,w,h};rects.set(key,r);return r;
}
const decalMat=toon(0xffffff,{map:atlasTex,alphaTest:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
decalMat.userData.shared=true;
function remapUV(g,rc){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,rc.u0+uv.getX(i)*(rc.u1-rc.u0),rc.v0+uv.getY(i)*(rc.v1-rc.v0));return g}

/* ---------- neony ---------- */
const neonTexCache=new Map();
/** Tekstura neonu (canvas) z cache po kluczu. */
export function neonTex(key,w,h,draw){let t=neonTexCache.get(key);if(!t){t=new THREE.CanvasTexture(cnv(w,h,draw));neonTexCache.set(key,t)}return t}
/** Świecący napis: kilka przebiegów rozmycia + jasny rdzeń (rurka neonowa). */
export function glowText(g,text,x,y,font,color,core='#fff'){
  g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillStyle=color;g.shadowColor=color;
  for(const b of [34,18,8]){g.shadowBlur=b;g.fillText(text,x,y)}
  g.shadowBlur=0;g.lineWidth=3;g.strokeStyle=core;g.globalAlpha=.55;g.strokeText(text,x,y);g.globalAlpha=1;
}
function neonMesh(n){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(n.w,n.h),new THREE.MeshBasicMaterial({map:n.tex,fog:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));
  m.applyMatrix4(n.m);m.userData.neon=true;return m;
}

/* ---------- Parts: opis rekwizytu ---------- */
export class Parts{
  constructor(){this.parts=[];this.decals=[];this.neons=[];this.cols=[];this.cover=false}
  /** Ogólna część. o: rx,ry,rz (Euler YXZ), s lub sx/sy/sz, hull:t | edges:false, basic:true (bez oświetlenia), small:true (bez cienia/raycastu). */
  add(geo,x,y,z,color,o={}){
    indexed(geo);_e.set(o.rx||0,o.ry||0,o.rz||0,'YXZ');_q.setFromEuler(_e);
    const s=o.s||1;_s.set(o.sx||s,o.sy||s,o.sz||s);
    const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().copy(_q),new THREE.Vector3().copy(_s));
    if(o.basic){o=Object.assign({small:true,edges:false},o)}
    this.parts.push({geo,m,color,o});return this;
  }
  /** Prostopadłościan; y = dół bryły (gdy bez obrotu), obrót wokół środka. */
  box(w,h,d,x,y,z,color,o={}){return this.add(new THREE.BoxGeometry(w,h,d),x,y+h/2,z,color,o)}
  /** Walec/stożek ścięty (rt góra, rb dół); y = dół. o.seg = liczba boków. */
  cyl(rt,rb,h,x,y,z,color,o={}){return this.add(new THREE.CylinderGeometry(rt,rb,h,o.seg||10,1,!!o.open),x,y+h/2,z,color,o)}
  /** Jak cyl, ale y = środek (wygodne przy obrotach, np. koła). */
  cylc(rt,rb,h,x,yc,z,color,o={}){return this.add(new THREE.CylinderGeometry(rt,rb,h,o.seg||10,1,!!o.open),x,yc,z,color,o)}
  /** Kula/elipsoida (o.sx..); y = środek; domyślnie kontur-kadłub. */
  sph(r,x,y,z,color,o={}){return this.add(new THREE.SphereGeometry(r,o.ws||8,o.hs||6),x,y,z,color,Object.assign({hull:.05},o))}
  /** Niskopoligonowa bryła (ikosaedr), do koron drzew i krzewów. */
  ico(r,x,y,z,color,o={}){return this.add(new THREE.IcosahedronGeometry(r,o.detail||0),x,y,z,color,Object.assign({hull:.04},o))}
  /** Bryła obrotowa: pts = [[promień,y],...]. */
  lathe(pts,seg,x,y,z,color,o={}){return this.add(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg||10),x,y,z,color,o)}
  /** Wyciśnięty profil 2D (pts = [[x,y],...] w płaszczyźnie XY, głębokość wzdłuż +Z od z=0). */
  prism(pts,depth,x,y,z,color,o={}){
    const sh=new THREE.Shape(pts.map(p=>new THREE.Vector2(p[0],p[1])));
    return this.add(new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false,steps:1}),x,y,z,color,o);
  }
  /** Decal (płaszczyzna w+h patrzy w +Z) z prostokąta atlasu. o: rx,ry,rz. */
  decal(rc,w,h,x,y,z,o={}){return this.decalGeo(rc,new THREE.PlaneGeometry(w,h),x,y,z,o)}
  /** Decal na dowolnej geometrii (uv 0..1 mapowane do prostokąta atlasu), np. plakaty na słupie. */
  decalGeo(rc,geo,x,y,z,o={}){
    indexed(geo);remapUV(geo,rc);_e.set(o.rx||0,o.ry||0,o.rz||0,'YXZ');_q.setFromEuler(_e);
    this.decals.push({geo,m:new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().copy(_q),new THREE.Vector3(1,1,1))});return this;
  }
  /** Płaszczyzna neonowa (MeshBasic, patrzy w +Z). o.static:true = świeci stale (nie mruga). */
  neon(tex,w,h,x,y,z,o={}){
    _e.set(o.rx||0,o.ry||0,o.rz||0,'YXZ');_q.setFromEuler(_e);
    this.neons.push({tex,w,h,static:!!o.static,m:new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().copy(_q),new THREE.Vector3(1,1,1))});return this;
  }
  /** Kolider AABB w układzie lokalnym (obracany razem z rekwizytem). */
  col(x0,x1,z0,z1,h){this.cols.push({x0,x1,z0,z1,h});return this}
  colBox(w,d,h,x=0,z=0){return this.col(x-w/2,x+w/2,z-d/2,z+d/2,h)}

  stats(){let t=0;for(const p of this.parts)t+=tri(p.geo);for(const d of this.decals)t+=tri(d.geo);t+=this.neons.length*2;return t}

  /** Samodzielna grupa. inst:true = dla InstancedMesh (kontury tylko jako kadłub, bez decali i neonów). */
  toGroup(inst=false){
    const g=new THREE.Group(),T=[],Bk=[],H=[],E=[];
    for(const p of this.parts){
      const bg=p.geo.clone().applyMatrix4(p.m);paintGeo(bg,p.color);(p.o.basic?Bk:T).push(bg);
      if(p.o.hull||(inst&&!p.o.basic&&p.o.edges!==false)){
        const t=1+(p.o.hull||.025);SC.makeScale(t,t,t);M2.copy(p.m).multiply(SC);H.push(posOnly(p.geo.clone().applyMatrix4(M2)));
      }else if(p.o.edges!==false&&!p.o.basic)E.push(new THREE.EdgesGeometry(bg,25));
    }
    if(T.length){const m=new THREE.Mesh(mergeGeometries(T,['position','normal','uv','color']),propMat);m.castShadow=m.receiveShadow=true;g.add(m)}
    if(Bk.length){const m=new THREE.Mesh(mergeGeometries(Bk,['position','color']),basicVC);m.raycast=noRay;g.add(m)}
    if(H.length){const o=new THREE.Mesh(mergeGeometries(H,['position']),inkMat);o.raycast=noRay;o.visible=!!opt.outlines;outlines.push(o);g.add(o)}
    if(E.length){const l=new THREE.LineSegments(mergeGeometries(E,['position']),lineMat);l.raycast=noRay;l.visible=!!opt.outlines;outlines.push(l);g.add(l)}
    if(!inst){
      if(this.decals.length){const d=this.decals.map(x=>x.geo.clone().applyMatrix4(x.m));const m=new THREE.Mesh(mergeGeometries(d,['position','normal','uv']),decalMat);m.raycast=noRay;g.add(m)}
      for(const n of this.neons)g.add(neonMesh(n));
    }
    return g;
  }
}
// Wspólne materiały (współdzielone: disposeObject ich nie zwalnia).
export const propMat=toon(0xffffff,{vertexColors:true});propMat.userData.shared=true;
const basicVC=new THREE.MeshBasicMaterial({vertexColors:true});basicVC.userData.shared=true;

/* ---------- decale w świecie (jedna siatka dla wszystkich rekwizytów) ---------- */
const dec={geos:[],mesh:null,dirty:false};
function addDecals(list){dec.geos.push(...list);if(!dec.dirty){dec.dirty=true;queueMicrotask(rebuildDecals)}}
function rebuildDecals(){
  dec.dirty=false;if(!dec.geos.length)return;
  const g=mergeGeometries(dec.geos,['position','normal','uv']);
  if(!dec.mesh){dec.mesh=new THREE.Mesh(g,decalMat);dec.mesh.raycast=noRay}
  else{dec.mesh.geometry.dispose();dec.mesh.geometry=g}
  if(dec.mesh.parent!==scene)scene.add(dec.mesh);
}
/** Czyści decale świata (wołać przy zmianie poziomu razem ze sprzątaniem sceny). */
export function resetPropDecals(){dec.geos.length=0;if(dec.mesh){scene.remove(dec.mesh);dec.mesh.geometry.dispose();dec.mesh=null}}

/* ---------- rejestracja ---------- */
let autoSeed=1;
const Tm=new THREE.Matrix4(),Mm=new THREE.Matrix4();
function worldCol(c,x,y,z,rotY){
  const s=Math.sin(rotY),co=Math.cos(rotY);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(const [px,pz] of [[c.x0,c.z0],[c.x1,c.z0],[c.x0,c.z1],[c.x1,c.z1]]){
    const wx=x+px*co+pz*s,wz=z-px*s+pz*co;x0=Math.min(x0,wx);x1=Math.max(x1,wx);z0=Math.min(z0,wz);z1=Math.max(z1,wz)}
  return {x0,x1,z0,z1,h:y+c.h};
}
/**
 * Rejestruje rekwizyt. meta: {name, dims:[szer,wys,głęb] z rzeczywistości, cover, note, variants:[...]}.
 * build(P:Parts, o:opcje, r:rng) wypełnia części; P.cover i P.col() ustawiają osłonę i kolizję.
 */
export function defProp(id,meta,build){
  const def={
    id,name:meta.name||id,cat:meta.cat||'',dims:meta.dims||null,variants:meta.variants||null,note:meta.note||'',
    parts(opts={}){
      const o=Object.assign({},meta.defaults,opts);if(o.seed==null)o.seed=autoSeed++;
      const r=rng(o.seed*7919+id.length*131),P=new Parts();P.cover=!!meta.cover;P.opts=o;build(P,o,r);return P;
    },
    make(opts={}){
      const P=def.parts(opts),g=P.toGroup(false);
      let ink=0;g.traverse(c=>{if(c.isMesh&&c.material===inkMat)ink+=tri(c.geometry)});
      g.userData=Object.assign(g.userData,{id,seed:P.opts.seed,collider:P.cols.map(c=>Object.assign({},c)),cover:P.cover,tris:P.stats(),ink,declared:def.dims});
      return g;
    },
    place(opts={}){
      const P=def.parts(opts),{x=0,y=0,z=0,rotY=0}=opts;
      Tm.makeRotationY(rotY).setPosition(x,y,z);
      for(const p of P.parts){
        Mm.multiplyMatrices(Tm,p.m);const o=p.o;
        addPart(p.geo,Mm,{color:p.color},{cast:o.cast!==false&&!o.small,receive:o.receive!==false,ray:o.ray!==false&&!o.small,hull:o.hull,edges:o.edges,basic:o.basic,group:o.group});
      }
      if(P.decals.length)addDecals(P.decals.map(d=>d.geo.clone().applyMatrix4(Mm.multiplyMatrices(Tm,d.m))));
      for(const n of P.neons){const m=neonMesh(n);m.applyMatrix4(Tm);scene.add(m);if(!n.static)world.neon.push(m)}
      const cols=[];
      if(opts.collide!==false)for(const c of P.cols){const w=worldCol(c,x,y,z,rotY);world.colliders.push(w);cols.push(w)}
      const stub=new THREE.Object3D();stub.position.set(x,y,z);stub.rotation.y=rotY;
      stub.userData={id,seed:P.opts.seed,collider:cols,cover:P.cover};return stub;
    },
  };
  DS.props.register(def);return def;
}

/**
 * Instancing powtarzalnego rekwizytu: DS.props.instance('lampaUliczna',[{x,z,rotY,s,y},...],{seed,opts,collide}).
 * Kontury tylko jako kadłub (bez linii krawędzi), bez decali i neonów. Zwraca Group w scenie.
 */
export function instance(id,transforms,o={}){
  const def=DS.props.get(id);if(!def||!def.parts)throw new Error('DS.props.instance: brak rekwizytu '+id);
  const P=def.parts(Object.assign({seed:o.seed},o.opts)),proto=P.toGroup(true),grp=new THREE.Group(),n=transforms.length;
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),p=new THREE.Vector3(),s=new THREE.Vector3();
  for(const ch of proto.children){
    if(!ch.isMesh)continue;
    const im=new THREE.InstancedMesh(ch.geometry,ch.material,n);im.castShadow=ch.castShadow;im.receiveShadow=ch.receiveShadow;im.frustumCulled=false;
    for(let i=0;i<n;i++){const t=transforms[i];q.setFromAxisAngle(Y,t.rotY||0);p.set(t.x||0,t.y||0,t.z||0);s.setScalar(t.s||1);m.compose(p,q,s);im.setMatrixAt(i,m)}
    im.instanceMatrix.needsUpdate=true;if(ch.material===inkMat){im.raycast=noRay;im.visible=!!opt.outlines;outlines.push(im)}else if(ch.material===basicVC)im.raycast=noRay;
    grp.add(im);
  }
  if(o.collide!==false)for(const t of transforms)for(const c of P.cols)world.colliders.push(worldCol(c,t.x||0,t.y||0,t.z||0,t.rotY||0));
  grp.userData={id,count:n,cover:P.cover};scene.add(grp);return grp;
}
DS.props.instance=instance;
DS.props.resetDecals=resetPropDecals;

/* ---------- profil boczny (samochody itp.) ---------- */
/**
 * Wyciska profil boczny pts=[[s,y],...] (s rośnie ku PRZODOWI) na szerokość `width`; przód ląduje w -Z, szerokość wzdłuż X
 * (środek na x=0). bevel>0: sfazowane krawędzie (bez powiększania sylwetki).
 */
export function sideProfile(pts,width,bevel=0){
  const sh=new THREE.Shape(pts.map(p=>new THREE.Vector2(p[0],p[1])));
  const o=bevel>0?{depth:width-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelOffset:-bevel,bevelSegments:1,steps:1}:{depth:width,bevelEnabled:false,steps:1};
  const g=new THREE.ExtrudeGeometry(sh,o);g.translate(0,0,bevel>0?-(width-2*bevel)/2:-width/2);
  g.rotateY(Math.PI/2);return indexed(g);
}
