// Zestaw do modeli wrogów: współdzielone geometrie, scalanie części w siatki, szkielet człowieka, składanie grupy.
// Modele są proceduralne. Części każdego wariantu (typ + paleta) są scalane RAZ w geometrie z kolorami wierzchołków
// (flaga `shared`, więc disposeObject ich nie zwalnia), a każdy wróg ma tylko własny materiał (błysk trafienia = emissive).
import {mergeGeometries,tintGeo,posOnly} from '../render/merge.js';
import {toon,hullGeo} from '../render/materials.js';

const GEO={};
const shared=g=>(g.userData.shared=true,g);
const cached=(k,mk)=>GEO[k]||(GEO[k]=shared(mk()));
const unitBox=()=>cached('box',()=>new THREE.BoxGeometry(1,1,1));
const unitSph=()=>cached('sph',()=>new THREE.SphereGeometry(1,14,10));
const cylG=(rt,rb,h,seg)=>cached('cyl'+rt+'/'+rb+'/'+h+'/'+seg,()=>new THREE.CylinderGeometry(rt,rb,h,seg));

const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),V=new THREE.Vector3(),SC=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0),D=new THREE.Vector3();

/** Lista części modelu. Układ: metry, stopy na y=0, przód w −Z. Opcje części: rx/ry/rz (rad), sx/sy/sz (skala), t (grubość konturu, 0 = bez konturu), q (kwaternion). */
export class Parts{
  constructor(){this.l=[]}
  add(geo,c,x,y,z,o){this.l.push({geo,c,x,y,z,o:o||{}});return this}
  box(c,w,h,d,x,y,z,o){return this.add(unitBox(),c,x,y,z,Object.assign({sx:w,sy:h,sz:d},o))}
  cyl(c,rt,rb,h,x,y,z,o,seg=8){return this.add(cylG(rt,rb,h,seg),c,x,y,z,o)}
  sph(c,r,x,y,z,o={}){return this.add(unitSph(),c,x,y,z,Object.assign({},o,{sx:r*(o.kx||1),sy:r*(o.ky||1),sz:r*(o.kz||1)}))}
  /** Walec od punktu a (promień r1) do b (promień r2): kończyny, lufy, kije. */
  limb(c,ax,ay,az,bx,by,bz,r1,r2,o,seg=7){
    D.set(ax-bx,ay-by,az-bz);const len=D.length();D.normalize();
    Q.setFromUnitVectors(Y,D);
    return this.add(cylG(r1,r2,+len.toFixed(3),seg),c,(ax+bx)/2,(ay+by)/2,(az+bz)/2,Object.assign({q:Q.clone()},o));
  }
}

function matrixOf(p,ox,oy,oz,grow){
  const o=p.o;
  if(o.q)Q.copy(o.q);else{E.set(o.rx||0,o.ry||0,o.rz||0,'YXZ');Q.setFromEuler(E)}
  SC.set((o.sx||1)*grow,(o.sy||1)*grow,(o.sz||1)*grow);V.set(p.x-ox,p.y-oy,p.z-oz);
  return M.compose(V,Q,SC);
}
/** Skleja części w jedną geometrię o początku w (ox,oy,oz). hull: wersja powiększona o t (kontur), tylko pozycje. */
function bake(lists,ox,oy,oz,hull){
  const geos=[];
  for(const P of lists)for(const p of P.l){
    if(hull){if(p.o.t===0)continue;geos.push(posOnly(p.geo.clone().applyMatrix4(matrixOf(p,ox,oy,oz,1+(p.o.t===undefined?.06:p.o.t)))))}
    else geos.push(tintGeo(p.geo.clone().applyMatrix4(matrixOf(p,ox,oy,oz,1)),p.c));
  }
  if(!geos.length)return null;
  return shared(mergeGeometries(geos,hull?['position']:['position','normal','color']));
}

const MODELS={};
/**
 * Model człowieka (buduje tylko raz na klucz). build(P,meta) wypełnia P.body, P.head, P.legL, P.legR (+ P.arm gdy meta.arm).
 * meta: {hipH, hipX, headY, shoulder:{x,y,z}, arm:bool}. Części nóg podawaj w układzie modelu (nogę prawą baker przesuwa o hipX).
 */
export function humanModel(key,build,meta0){
  if(MODELS[key])return MODELS[key];
  const meta=Object.assign({hipH:.9,hipX:.105,headY:1.66,shoulder:{x:.24,y:1.46,z:0},arm:false},meta0||{});
  const P={body:new Parts(),head:new Parts(),legL:new Parts(),legR:new Parts(),arm:new Parts()};
  build(P,meta);
  const m={meta,geo:{},hull:{},last:performance.now()};
  m.geo.body=bake([P.body],0,meta.hipH,0);
  m.geo.head=bake([P.head],0,meta.headY,0);
  m.geo.legL=bake([P.legL],-meta.hipX,meta.hipH,0);m.geo.legR=bake([P.legR],meta.hipX,meta.hipH,0);
  m.hull.upper=bake([P.body,P.head],0,meta.hipH,0,true);
  m.hull.legL=bake([P.legL],-meta.hipX,meta.hipH,0,true);m.hull.legR=bake([P.legR],meta.hipX,meta.hipH,0,true);
  if(meta.arm){const s=meta.shoulder;m.geo.arm=bake([P.arm],s.x,s.y,s.z);m.hull.arm=bake([P.arm],s.x,s.y,s.z,true)}
  return MODELS[key]=m;
}

/**
 * Składa grupę wroga z zapisanego modelu: g -> rig -> {torso(body, head, arm?), hipL, hipR}. Jeden materiał na wroga (kolory w wierzchołkach).
 * Zwraca {g, rig, torso, hipL, hipR, armR, meshes, mat, headY}.
 */
export function assemble(model,{shadow=true}={}){
  model.last=performance.now();
  const meta=model.meta,mat=toon(0xffffff,{vertexColors:true});
  const g=new THREE.Group(),rig=new THREE.Group();g.add(rig);
  const torso=new THREE.Group();torso.position.set(0,meta.hipH,0);rig.add(torso);
  const meshes=[];
  const mk=(parent,geo,part,x,y,z,cast)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=cast;m.userData.part=part;parent.add(m);meshes.push(m);return m};
  mk(torso,model.geo.body,'body',0,0,0,shadow);                   // cień rzuca tylko korpus (budżet draw calli)
  mk(torso,model.geo.head,'head',0,meta.headY-meta.hipH,0,false);
  const hulls={upper:hullGeo(torso,model.hull.upper),legs:[]};
  let armR=null;
  if(model.geo.arm){const s=meta.shoulder;armR=new THREE.Group();armR.position.set(s.x,s.y-meta.hipH,s.z);torso.add(armR);
    mk(armR,model.geo.arm,'body',0,0,0,false);hulls.arm=hullGeo(armR,model.hull.arm)}
  const hipL=new THREE.Group(),hipR=new THREE.Group();
  hipL.position.set(-meta.hipX,meta.hipH,0);hipR.position.set(meta.hipX,meta.hipH,0);rig.add(hipL,hipR);
  mk(hipL,model.geo.legL,'body',0,0,0,false);mk(hipR,model.geo.legR,'body',0,0,0,false);
  hulls.legs.push(hullGeo(hipL,model.hull.legL),hullGeo(hipR,model.hull.legR));
  return {g,rig,torso,hipL,hipR,armR,meshes,mat,hulls,model,headY:meta.headY};
}

/** Prosty model niehumanoidalny (np. Maluch): części {body, head} -> dwie siatki + kontur. Zwraca {geo,hull} do `assembleSolid`. */
const SOLIDS={};
export function solidModel(key,build){
  if(SOLIDS[key])return SOLIDS[key];
  const P={body:new Parts(),head:new Parts()};const meta=build(P)||{};
  const headY=meta.headY||1.2;
  return SOLIDS[key]={meta,last:performance.now(),geo:{body:bake([P.body],0,0,0),head:bake([P.head],0,headY,0)},hull:{all:bake([P.body,P.head],0,0,0,true)}};
}
export function assembleSolid(model){
  model.last=performance.now();
  const mat=toon(0xffffff,{vertexColors:true}),g=new THREE.Group(),rig=new THREE.Group();g.add(rig);
  const meshes=[];
  const mk=(geo,part,y,cast)=>{const m=new THREE.Mesh(geo,mat);m.position.y=y;m.castShadow=cast;m.userData.part=part;rig.add(m);meshes.push(m);return m};
  mk(model.geo.body,'body',0,true);mk(model.geo.head,'head',model.meta.headY||1.2,false);
  const hulls={upper:hullGeo(rig,model.hull.all),legs:[]};
  return {g,rig,meshes,mat,hulls,model,headY:model.meta.headY||1.2};
}

/* ---------- szkielet człowieka ---------- */
export const HEAD_Y=1.66,SKIN=[0xf0c09a,0xe0a77d,0xc98b62,0xf5cfae];
const DARK=0x15110e;

/**
 * Wspólne ciało 1,78 m: nogi, miednica, tors, szyja, ręce w pozie, głowa z twarzą.
 * o: {skin, shirt, pants, shoes, sleeve (kolor rękawa), k (szerokość tułowia), pose:'down'|'aim'|'guard'|'shotgun'|'hands', armSep (prawa ręka jako osobna część)}
 * Dodatki typu (kamizelka, czapka, broń) dopisuje wołający do P.body/P.head.
 */
export function humanBase(P,meta,o){
  const k=o.k||1,skin=o.skin,hand=o.hand===undefined?o.skin:o.hand,face=o.face===undefined?o.skin:o.face,shirt=o.shirt,sleeve=o.sleeve===undefined?shirt:o.sleeve,pants=o.pants,shoes=o.shoes===undefined?DARK:o.shoes;
  for(const [L,sx] of [[P.legL,-1],[P.legR,1]]){
    const x=sx*meta.hipX;
    L.limb(pants,x,.92,0,x*1.05,.5,-.01,.095,.075,null);              // udo
    L.limb(pants,x*1.05,.5,-.01,x*1.08,.1,.0,.072,.055,null);          // łydka
    L.box(shoes,.105,.085,.27,x*1.1,.045,-.06);                          // but
  }
  P.body.box(pants,.34*k,.16,.22,0,.95,0);                               // miednica
  P.body.box(shirt,.36*k,.26,.23,0,1.18,0);                              // brzuch/talia
  P.body.box(shirt,.44*k,.3,.25,0,1.4,0);                                // klatka/ramiona
  P.body.cyl(skin,.05,.055,.1,0,1.56,0);                                 // szyja
  // ręce
  const sh=meta.shoulder,sy=sh.y,sxw=sh.x*k;sh.x=sxw;               // bark przesuwa się razem z szerokością tułowia
  const POSE={
    down:{r:[[.0,0,0],[.03,-.28,-.02],[.04,-.52,-.07]],l:[[.0,0,0],[-.03,-.28,-.02],[-.04,-.52,-.07]]},
    aim:{r:[[0,0,0],[.05,-.22,-.22],[-.1,-.1,-.52]],l:[[0,0,0],[-.04,-.26,-.22],[.3,-.12,-.5]]},
    shotgun:{r:[[0,0,0],[.04,-.24,-.2],[-.1,-.12,-.4]],l:[[0,0,0],[.0,-.3,-.28],[.29,-.12,-.62]]},
    guard:{r:[[0,0,0],[.07,-.2,-.14],[-.12,.05,-.3]],l:[[0,0,0],[-.07,-.2,-.14],[.12,.05,-.3]]},
    hands:{r:[[0,0,0],[.04,-.25,-.12],[.02,-.2,-.38]],l:[[0,0,0],[-.04,-.25,-.12],[-.02,-.2,-.38]]},  // ręce przed sobą
  };
  const pose=POSE[o.pose||'down'];
  const arm=(Pt,pts,sgn,asRel,color,handC)=>{          // pts: przesunięcia względem barku (znak X już uwzględniony)
    const ox=asRel?0:sgn*sxw,oy=asRel?0:sy,oz=0;
    const b=[ox+pts[1][0],oy+pts[1][1],oz+pts[1][2]],c=[ox+pts[2][0],oy+pts[2][1],oz+pts[2][2]];
    Pt.limb(color,ox,oy,oz,b[0],b[1],b[2],.062,.05,null);
    Pt.limb(color,b[0],b[1],b[2],c[0],c[1],c[2],.05,.042,null);
    Pt.sph(handC,.05,c[0],c[1],c[2],{t:.1});
  };
  // lewa ręka zawsze w korpusie; prawa w korpusie albo osobna (animowana)
  const L=pose.l.map(p=>[p[0],p[1],p[2]]),R=pose.r.map(p=>[p[0],p[1],p[2]]);
  arm(P.body,L,-1,false,sleeve,hand);
  if(o.armSep)arm(P.arm,R,1,false,sleeve,hand);else arm(P.body,R,1,false,sleeve,hand);
  // głowa z twarzą
  const hy=meta.headY;
  P.head.sph(face,.105,0,hy,0,{ky:1.28,kz:1.15,t:.08});
  P.head.box(DARK,.032,.02,.02,-.04,hy+.02,-.118,{t:0});P.head.box(DARK,.032,.02,.02,.04,hy+.02,-.118,{t:0});   // oczy
  P.head.box(face,.03,.045,.04,0,hy-.02,-.135,{t:.05});                                                          // nos
  P.head.box(0x8a3b32,.06,.012,.015,0,hy-.07,-.125,{t:0});                                                       // usta
  return {sh};
}
/** Wariant koloru z listy (deterministyczny z indeksu). */
export const pickN=(list,n)=>list[n%list.length];

/**
 * Zwalnia geometrie modeli (humanModel/solidModel), z których nikt nie korzysta: `inUse` = Set modeli żywych/leżących wrogów,
 * `maxIdle` ms bez użycia. Dzięki temu warianty modeli nie rosną w nieskończoność (renderer.info.memory.geometries).
 */
export function pruneModels(inUse,maxIdle=10000){
  const now=performance.now();let freed=0;
  for(const store of [MODELS,SOLIDS])for(const k in store){
    const m=store[k];if(inUse.has(m)||now-m.last<maxIdle)continue;
    for(const g of Object.values(m.geo))if(g)g.dispose();
    for(const g of Object.values(m.hull))if(g)g.dispose();
    delete store[k];freed++;
  }
  return freed;
}
