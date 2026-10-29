// Wspólne narzędzia poziomów (właściciel: ds-level-designer): oświetlenie/mgła z przywracaniem, płyty terenu, pokoje z drzwiami,
// znajdźki poziomu, wybuchowe beczki, graf nawigacji i scalanie kafelków w strefy (budżet draw calli).
// Zasada modułów: na poziomie modułu tylko importy z core/render/audio/world; reszta (enemies/proj, game/combat, pickups/machines)
// jest ładowana dynamicznie przy pierwszym użyciu, żeby nie tworzyć cykli.
import {DS} from '../../core/ds.js';
import {save,opt,persist} from '../../core/save.js';
import {S} from '../../core/state.js';
import {scene,hemi,sun,camera} from '../../render/renderer.js';
import {toon,hull,outlines,noRay} from '../../render/materials.js';
import {mergeGeometries} from '../../render/merge.js';
import {addFloater,announce} from '../../render/comicfx.js';
import {sfx} from '../../audio/sfx.js';
import {addPart} from '../batch.js';
import {addBox} from '../build.js';
import {world} from '../state.js';

/* ------------------------------------------------------------------ pory dnia, mgła, światło */
const _bg=new THREE.Color();
/**
 * Ustawia niebo/mgłę/światła poziomu i przywraca poprzednie przy `levelUnload`.
 * env: {sky, fogNear, hemi:[niebo,ziemia,nat.], sun:[kolor,nat.], sunDir:[x,y,z] (kierunek od gracza ku słońcu)}.
 * Cień słońca podąża za graczem (snap 4 m), dzięki czemu ±60 m wystarcza na dużą mapę.
 */
export function setEnv(env){
  const saved={bg:scene.background&&scene.background.clone(),fc:scene.fog.color.clone(),fn:scene.fog.near,
    hs:hemi.color.clone(),hg:hemi.groundColor.clone(),hi:hemi.intensity,sc:sun.color.clone(),si:sun.intensity,sp:sun.position.clone(),
    st:sun.target.position.clone()};
  _bg.set(env.sky);scene.background=_bg.clone();scene.fog.color.copy(_bg);scene.fog.near=env.fogNear||30;
  hemi.color.set(env.hemi[0]);hemi.groundColor.set(env.hemi[1]);hemi.intensity=env.hemi[2];
  sun.color.set(env.sun[0]);sun.intensity=env.sun[1];
  const d=env.sunDir||[30,55,18];SUN_OFF.set(d[0],d[1],d[2]);sun.target.position.set(0,0,0);sun.position.copy(SUN_OFF);
  const off=DS.bus.on('levelUnload',()=>{
    off();
    if(saved.bg)scene.background=saved.bg;scene.fog.color.copy(saved.fc);scene.fog.near=saved.fn;
    hemi.color.copy(saved.hs);hemi.groundColor.copy(saved.hg);hemi.intensity=saved.hi;
    sun.color.copy(saved.sc);sun.intensity=saved.si;sun.position.copy(saved.sp);sun.target.position.copy(saved.st);
    followSun=false;
  });
  followSun=true;
}
const SUN_OFF=new THREE.Vector3(30,55,18);let followSun=false;

/* ------------------------------------------------------------------ geometria terenu */
/** Płaska płyta terenu (bez kolizji, bez konturu): droga, chodnik, trawa. y = spód, h = grubość (kolejność warstw: coraz wyższe y). */
export function slab(x0,x1,z0,z1,y,h,color,o={}){
  const w=x1-x0,d=z1-z0;
  addPart(new THREE.BoxGeometry(w,h,d),new THREE.Matrix4().makeTranslation((x0+x1)/2,y+h/2,(z0+z1)/2),{color},{cast:false,receive:true,ray:!!o.ray,edges:false});
}
/** Prostopadłościan z granic (x0..x1, z0..z1, od y0 do y1). o: collide=false, cast=false, hull. */
export function boxB(x0,x1,z0,z1,y0,y1,mat,o={}){
  return addBox(x1-x0,y1-y0,z1-z0,(x0+x1)/2,y0,(z0+z1)/2,mat,o);
}
/** Elewacja z oknami (jak building()): kolor ścian + powtórzenia tekstury okien. */
export function facade(x0,x1,z0,z1,h,color,{y0=0,collide=true,roof,cast=true}={}){
  const w=x1-x0,d=z1-z0,ry=Math.max(1,Math.round(h/4)),rd=Math.max(1,Math.round(d/4)),rw=Math.max(1,Math.round(w/4));
  const side=rx=>({color,rx,ry}),rf={color:roof!==undefined?roof:new THREE.Color(color).multiplyScalar(.65)};
  return addBox(w,h,d,(x0+x1)/2,y0,(z0+z1)/2,[side(rd),side(rd),rf,rf,side(rw),side(rw)],{collide,cast});
}
/**
 * Ogrodzenie z siatki/prętów: słupki + poprzeczki bez kolizji pełnej; kolider h=1.6 (nie zasłania widoku wrogom, blokuje ruch).
 * axis 'x' (wzdłuż X, stałe z) lub 'z'; gaps: [[od,do],...] przerwy (bramy) we współrzędnej wzdłuż osi.
 */
export function fence(axis,fixed,a0,a1,{gaps=[],color=0x6b7078,h=2.3,step=3}={}){
  const segs=[];let c=a0;
  for(const [g0,g1] of gaps.slice().sort((p,q)=>p[0]-q[0])){if(g0>c)segs.push([c,g0]);c=g1}
  if(c<a1)segs.push([c,a1]);
  for(const [s0,s1] of segs){
    const len=s1-s0,n=Math.max(1,Math.round(len/step)),st=len/n;
    for(let i=0;i<=n;i++){const p=s0+i*st;axis==='x'?addBox(.12,h,.12,p,0,fixed,{color},{collide:false,cast:false}):addBox(.12,h,.12,fixed,0,p,{color},{collide:false,cast:false})}
    const mid=(s0+s1)/2;
    for(const yy of [h-.12,h*.5,.25]){axis==='x'?addBox(len,.05,.05,mid,yy,fixed,{color},{collide:false,cast:false}):addBox(.05,.05,len,fixed,yy,mid,{color},{collide:false,cast:false})}
    world.colliders.push(axis==='x'?{x0:s0,x1:s1,z0:fixed-.1,z1:fixed+.1,h:1.6}:{x0:fixed-.1,x1:fixed+.1,z0:s0,z1:s1,h:1.6});
  }
}
/** Pomocnik rejestrujący kolider h<1.7 niezasłaniający widoku (np. żywopłot, murek). */
export function lowCol(x0,x1,z0,z1,h=1){world.colliders.push({x0,x1,z0,z1,h})}

/* ------------------------------------------------------------------ drzwi i pokoje */
let doors=[];
const doorMat=()=>toon(0x6d6a60);
/**
 * Przesuwne drzwi (rolety/skrzydło) w ścianie: lico w osi `axis` ('x' = ściana biegnie wzdłuż X, drzwi w z=fixed).
 * Przesuwają się w bok o `w` (chowają się w ścianie, która jest grubsza niż skrzydło). Kolider znika, gdy otwarte.
 * o: secret (otwierane klawiszem użycia), auto (otwiera się na zbliżenie), label, color, dir (+1/-1 kierunek przesuwu).
 */
export function slidingDoor(axis,fixed,center,w,h,o={}){
  const th=o.thick||.3,color=o.color||0x7a766a,dir=o.dir||1;
  const geo=axis==='x'?new THREE.BoxGeometry(w,h,th):new THREE.BoxGeometry(th,h,w);
  const mat=toon(color);const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;
  const px=axis==='x'?center:fixed,pz=axis==='x'?fixed:center;m.position.set(px,h/2,pz);scene.add(m);hull(m,.03);world.meshes.push(m);
  const col=axis==='x'?{x0:center-w/2,x1:center+w/2,z0:fixed-th/2,z1:fixed+th/2,h}:{x0:fixed-th/2,x1:fixed+th/2,z0:center-w/2,z1:center+w/2,h};
  world.colliders.push(col);
  const d={mesh:m,col,col0:Object.assign({},col),px,pz,axis,w,dir,t:0,target:0,secret:!!o.secret,auto:!!o.auto,label:o.label||'OTWÓRZ',range:o.range||2.8};
  doors.push(d);return d;
}
/**
 * Pokój z płaskim dachem i jednymi drzwiami. door: {side:'n'|'s'|'e'|'w', c: środek wzdłuż ściany, w, h, secret, label, color}.
 * Zwraca {x0,x1,z0,z1,h,door}. Wnętrze oświetlają emisyjne paski (MeshBasic), więc czytelne mimo cienia dachu.
 */
export function room(r){
  const T=.5,h=r.h||3.2,wall=r.wall||0x8d8a80,{x0,x1,z0,z1}=r,dr=r.door;
  const wl=(ax0,ax1,az0,az1)=>addBox(ax1-ax0,h,az1-az0,(ax0+ax1)/2,0,(az0+az1)/2,{color:wall});
  const sides={
    n:()=>[x0,x1,z0,z0+T,'x',z0+T/2,x0,x1], s:()=>[x0,x1,z1-T,z1,'x',z1-T/2,x0,x1],
    w:()=>[x0,x0+T,z0,z1,'z',x0+T/2,z0,z1], e:()=>[x1-T,x1,z0,z1,'z',x1-T/2,z0,z1],
  };
  let doorObj=null;
  for(const k of ['n','s','w','e']){
    const [a0,a1,b0,b1,ax,fixed,s0,s1]=sides[k]();
    if(dr&&dr.side===k){
      const c0=dr.c-dr.w/2,c1=dr.c+dr.w/2;
      if(ax==='x'){wl(s0,c0,b0,b1);wl(c1,s1,b0,b1);addBox(dr.w,h-dr.h,T,dr.c,dr.h,fixed,{color:wall},{collide:false})}
      else{wl(a0,a1,s0,c0);wl(a0,a1,c1,s1);addBox(T,h-dr.h,dr.w,fixed,dr.h,dr.c,{color:wall},{collide:false})}
      doorObj=slidingDoor(ax,fixed,dr.c,dr.w,dr.h,{secret:dr.secret,label:dr.label,color:dr.color||wall,dir:dr.dir||1,thick:T*.6,range:dr.range});
    }else wl(a0,a1,b0,b1);
  }
  addBox(x1-x0+.6,.35,z1-z0+.6,(x0+x1)/2,h,(z0+z1)/2,{color:r.roof||0x55524c},{collide:false});
  slab(x0+T,x1-T,z0+T,z1-T,.1,.03,r.floor||0x4a4640);
  // paski świetlne pod sufitem (emisja)
  const lc=r.light||0xfff0b0,lw=Math.min(x1-x0,z1-z0)-2*T-1;
  const horiz=(x1-x0)>=(z1-z0);
  for(const k of [-.28,.28]){
    const cx=horiz?(x0+x1)/2:(x0+x1)/2+k*(x1-x0-2*T),cz=horiz?(z0+z1)/2+k*(z1-z0-2*T):(z0+z1)/2;
    addPart(new THREE.BoxGeometry(horiz?x1-x0-2*T-1:.18,.06,horiz?.18:z1-z0-2*T-1),new THREE.Matrix4().makeTranslation(cx,h-.12,cz),{color:lc},{basic:true,cast:false,receive:false,ray:false,edges:false});
  }
  return {x0,x1,z0,z1,h,door:doorObj};
}

/* ------------------------------------------------------------------ znajdźki poziomu */
const KINDS={
  kaseta:{color:0xff4fd8,label:'KASETA',once:true,geo:()=>new THREE.BoxGeometry(.36,.06,.24),reward(){}},
  lancuch:{color:0xffd23a,label:'ZŁOTY ŁAŃCUCH',once:false,geo:()=>new THREE.TorusGeometry(.17,.045,6,14),reward(it){grantCoins(it.value||60)}},
  klucz:{color:0x43c7ff,label:'KLUCZ',once:true,geo:()=>new THREE.BoxGeometry(.14,.4,.06),reward(){save.keys++;if(S.G)S.G.keysFound++;persist()}},
  plakat:{color:0xfff0c8,label:'PLAKAT',once:true,geo:()=>new THREE.PlaneGeometry(.34,.46),reward(it){grantCoins(it.value||25)}},
};
function grantCoins(v){const G=S.G;if(!G)return;save.coins+=v;G.earned+=v;persist()}
let col=null;
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3(),_c=new THREE.Color(),Z0=new THREE.Matrix4().makeScale(0,0,0);
/**
 * Stawia znajdźki (InstancedMesh per rodzaj + słupy światła dla jawnych). items: [{id,type,x,z,y,name,hint,secret,value}],
 * id MUSI być stabilne (zapis postępu: save.lvFound[id]=true dla rodzajów jednorazowych: kaseta, klucz, plakat).
 */
export function placeCollectibles(level,items){
  level.collectibles=items;
  const byType={};for(const it of items){(byType[it.type]=byType[it.type]||[]).push(it)}
  const meshes={};let beamItems=items.filter(i=>!i.secret);
  for(const t in byType){
    const k=KINDS[t],list=byType[t];
    const mat=new THREE.MeshBasicMaterial({color:k.color,side:THREE.DoubleSide,fog:false});
    const im=new THREE.InstancedMesh(k.geo(),mat,list.length);im.frustumCulled=false;im.raycast=()=>{};scene.add(im);
    list.forEach((it,i)=>{it._k=t;it._i=i});meshes[t]=im;
  }
  let beams=null;
  if(beamItems.length){
    const bm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide});
    beams=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.2,3.2,8,1,true),bm,beamItems.length);beams.frustumCulled=false;beams.raycast=()=>{};
    beamItems.forEach((it,i)=>{it._b=i;_c.set(KINDS[it.type].color);beams.setColorAt(i,_c)});scene.add(beams);
  }
  col={level,items,meshes,beams,beamItems,t:0};
  for(const it of items)it.got=!!(KINDS[it.type].once&&(save.lvFound||{})[it.id]);
  refreshCol(0);
  return col;
}
function refreshCol(dt){
  if(!col)return;col.t+=dt;
  for(const it of col.items){
    const im=col.meshes[it._k];
    if(it.got){im.setMatrixAt(it._i,Z0);continue}
    const y=(it.y||0)+.95+Math.sin(col.t*2.2+it._i)*.1;
    _p.set(it.x,y,it.z);_e.set(it._k==='kaseta'?.5:0,col.t*1.8+it._i,it._k==='lancuch'?1.1:0);_q.setFromEuler(_e);_s.setScalar(1.25);
    im.setMatrixAt(it._i,_m.compose(_p,_q,_s));
  }
  for(const k in col.meshes)col.meshes[k].instanceMatrix.needsUpdate=true;
  if(col.beams){
    col.beamItems.forEach((it,i)=>{
      if(it.got)col.beams.setMatrixAt(i,Z0);
      else col.beams.setMatrixAt(i,_m.compose(_p.set(it.x,(it.y||0)+1.6,it.z),_q.identity(),_s.set(1,1,1)));
    });
    col.beams.instanceMatrix.needsUpdate=true;
  }
}
/** Liczniki: {found, total} wśród znajdziek poziomu (jednorazowych: z zapisu; reszta: w tym runie). */
export function collectStats(level){
  const it=level.collectibles||[];return {found:it.filter(i=>i.got).length,total:it.length};
}
function tryCollect(){
  const G=S.G;if(!col||!G||G.dead)return;
  const P=DS.player.P;
  for(const it of col.items){
    if(it.got)continue;
    if(Math.hypot(P.pos.x-it.x,P.pos.z-it.z)>(it.secret?1.6:1.5)||Math.abs(P.pos.y-(it.y||0))>1.6)continue;
    it.got=true;const k=KINDS[it._k];
    if(k.once){save.lvFound=save.lvFound||{};save.lvFound[it.id]=true;persist()}
    k.reward(it);sfx(it._k==='lancuch'?'coin':'key');
    const st=collectStats(col.level);
    announce(k.label+'!',(it.name||'')+(it.hint?' | '+it.hint:'')+'  ['+st.found+'/'+st.total+']');
    DS.bus.emit('collectible',{id:it.id,type:it.type,name:it.name,level:col.level.id,found:st.found,total:st.total});
  }
}

/* ------------------------------------------------------------------ wybuchowe beczki */
let barrels=null;const mods={};
import('../../enemies/proj.js').then(m=>{mods.proj=m}).catch(()=>{});
import('../../game/combat.js').then(m=>{mods.combat=m}).catch(()=>{});
import('../../pickups/machines.js').then(m=>{mods.machines=m}).catch(()=>{});
/** Beczki wybuchowe (jedna InstancedMesh). Trafienie strzałem -> wybuch (obrażenia wrogów i gracza, reakcja łańcuchowa). list: [{x,z}] */
export function placeBarrels(list){
  const geo=new THREE.CylinderGeometry(.3,.3,.95,10);
  const mat=toon(0xc2331f);
  const im=new THREE.InstancedMesh(geo,mat,list.length);im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;
  const items=list.map((b,i)=>{
    const c={x0:b.x-.34,x1:b.x+.34,z0:b.z-.34,z1:b.z+.34,h:.95};world.colliders.push(c);
    im.setMatrixAt(i,_m.makeTranslation(b.x,.475,b.z));
    return {x:b.x,z:b.z,col:c,col0:Object.assign({},c),dead:false};
  });
  im.instanceMatrix.needsUpdate=true;scene.add(im);world.meshes.push(im);
  // żółty pas ostrzegawczy: druga instancja o węższej wysokości
  const band=new THREE.InstancedMesh(new THREE.CylinderGeometry(.312,.312,.16,10),new THREE.MeshBasicMaterial({color:0xf2c21c}),list.length);band.frustumCulled=false;band.raycast=()=>{};
  items.forEach((b,i)=>band.setMatrixAt(i,_m.makeTranslation(b.x,.62,b.z)));band.instanceMatrix.needsUpdate=true;scene.add(band);
  barrels={im,band,items};return barrels;
}
function blow(b,depth=0){
  if(b.dead||!barrels)return;b.dead=true;
  const i=barrels.items.indexOf(b);barrels.im.setMatrixAt(i,Z0);barrels.band.setMatrixAt(i,Z0);
  barrels.im.instanceMatrix.needsUpdate=barrels.band.instanceMatrix.needsUpdate=true;
  b.col.x0+=1e5;b.col.x1+=1e5;
  const G=S.G;if(!G)return;
  if(mods.proj)mods.proj.explode(b.x,.6,b.z,{r:5.2,dmg:26,shake:1.1});
  const R=5.2;
  for(const e of G.enemies){
    if(!e.alive)continue;const d=Math.hypot(e.g.position.x-b.x,e.g.position.z-b.z);
    if(d<R&&mods.combat)mods.combat.damageEnemy(e,Math.round(110*(1-d/R*.55)),false,new THREE.Vector3(e.g.position.x,1.2,e.g.position.z));
  }
  for(const o of barrels.items)if(!o.dead&&Math.hypot(o.x-b.x,o.z-b.z)<3.2)setTimeout(()=>blow(o,depth+1),140+depth*60);
}

/* ------------------------------------------------------------------ automaty leczące */
/** Stawia automaty (pickups/machines.js ładowane dynamicznie; jeśli moduł jeszcze nie gotowy, dostawia po jego wczytaniu). */
export function healMachines(list){
  const lvl=world.level,go=()=>{if(world.level!==lvl||!mods.machines)return;for(const m of list)mods.machines.placeHealMachine(m)};
  if(mods.machines)go();else import('../../pickups/machines.js').then(m=>{mods.machines=m;go()});
}

/* ------------------------------------------------------------------ graf nawigacji i osłony */
/**
 * Buduje `level.nav`: graf waypointów (siatka co `step` m, odfiltrowana kolizjami; łącza tylko czyste odcinki) + lista osłon
 * wokół pełnych/średnich colliderów. Wołać po postawieniu wszystkich colliderów w build().
 */
export function buildNav(level,{step=9,link=14,pad=.75,arena,graph=false}={}){
  const A=arena||world.arena,cols=world.colliders;
  const inside=(x,z,p)=>{for(const c of cols){if(c.h<=0)continue;if(x>c.x0-p&&x<c.x1+p&&z>c.z0-p&&z<c.z1+p)return true}return false};
  const clear=(x0,z0,x1,z1,p)=>{const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/.6);for(let i=1;i<n;i++){const t=i/n;if(inside(x0+(x1-x0)*t,z0+(z1-z0)*t,p))return false}return true};
  const points=[];
  for(let x=-A+4;x<=A-4;x+=step)for(let z=-A+4;z<=A-4;z+=step){
    // małe przesunięcie, jeśli punkt leży w kolizji
    let ok=!inside(x,z,pad),px=x,pz=z;
    if(!ok)for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2],[2,-2],[-2,2],[3.5,0],[-3.5,0],[0,3.5],[0,-3.5]]){if(!inside(x+dx,z+dz,pad)){px=x+dx;pz=z+dz;ok=true;break}}
    if(ok&&Math.abs(px)<A-2&&Math.abs(pz)<A-2)points.push({x:px,z:pz});
  }
  const links=[];
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    const a=points[i],b=points[j],d=Math.hypot(a.x-b.x,a.z-b.z);
    if(d<=link&&clear(a.x,a.z,b.x,b.z,pad-.15))links.push([i,j]);
  }
  // osłony: punkty tuż za pełnymi/średnimi przeszkodami (h>=1.3), po jednym przy każdym boku i narożniku
  const cover=[];
  for(const c of cols){
    if(c.h<1.3||c.x0>1e4||c.x1-c.x0>40||c.z1-c.z0>40)continue;
    const cx=(c.x0+c.x1)/2,cz=(c.z0+c.z1)/2,o=1.05;
    for(const [x,z] of [[c.x0-o,cz],[c.x1+o,cz],[cx,c.z0-o],[cx,c.z1+o],[c.x0-o,c.z0-o],[c.x1+o,c.z0-o],[c.x0-o,c.z1+o],[c.x1+o,c.z1+o]])
      if(Math.abs(x)<A-1.5&&Math.abs(z)<A-1.5&&!inside(x,z,.5))cover.push({x:Math.round(x*10)/10,z:Math.round(z*10)/10});
  }
  const cv=[];const seen=new Set();for(const p of cover){const k=Math.round(p.x/1.5)+','+Math.round(p.z/1.5);if(!seen.has(k)){seen.add(k);cv.push(p)}}
  // Graf waypointów (points/links) tylko na życzenie (graph:true): tryb grafu w enemies/nav.js wraca do linii prostej, gdy cel stoi w komórce\n  // zablokowanej (gracz przy ścianie), więc domyślnie zostaje siatka A* + lista osłon (test: 12/12 wrogów dochodzi z rogów mapy).\n  level.nav=graph?{points,links,cover:cv.slice(0,420)}:{cover:cv.slice(0,420)};
  return level.nav;
}

/* ------------------------------------------------------------------ scalanie kafelków w strefy (budżet draw calli) */
// batch.js skleja świat per kafelek 16 m (frustum culling, mały raycast). Duża mapa daje wtedy setki siatek, a wrogowie kosztują ok. 7 calli
// każdy, więc po flushu sklejamy kafelki w strefy REG x REG m według rodzaju (materiał, cień): kilkadziesiąt siatek, culling nadal działa
// per strefa. Siatki trafiane raycastem zostają jako niewidoczne "proxy" kafelkowe w world.meshes (mały koszt promienia), a widoczne są
// scalone kopie. Szyldy neonowe o tej samej teksturze (np. telewizory w blokach) łączą się w jedną siatkę.
let macro=[];
const REG=56,TILE=16;
function regionOf(x){return Math.max(0,Math.min(2,Math.floor((x+78)/REG)))}
export function mergeIntoZones(){
  const kids=scene.children.filter(o=>o.matrixAutoUpdate===false&&o.geometry&&(o.isMesh||o.isLineSegments));
  const groups=new Map();
  for(const o of kids){
    const g=o.geometry;g.computeBoundingBox();const bb=g.boundingBox;
    if(bb.max.x-bb.min.x>2*TILE||bb.max.z-bb.min.z>2*TILE)continue;               // 'big' (teren, mur) zostaje
    const kind=o.isLineSegments?'line':(o.material&&o.material.side===THREE.BackSide?'ink':'mesh');
    const key=kind+'|'+regionOf((bb.min.x+bb.max.x)/2)+','+regionOf((bb.min.z+bb.max.z)/2)+'|'+(kind==='mesh'?o.material.uuid+(o.castShadow?1:0)+(o.receiveShadow?1:0):'')+'|'+(g.index?'i':'n');
    let a=groups.get(key);if(!a){a=[];groups.set(key,a)}a.push(o);
  }
  for(const list of groups.values()){
    if(list.length<2)continue;
    const first=list[0],names=['position','normal','uv','color'].filter(n=>first.geometry.attributes[n]);
    const geo=mergeGeometries(list.map(o=>o.geometry),names);
    const m=first.isLineSegments?new THREE.LineSegments(geo,first.material):new THREE.Mesh(geo,first.material);
    m.castShadow=first.castShadow;m.receiveShadow=first.receiveShadow;m.matrixAutoUpdate=false;
    if(first.isLineSegments||first.material.side===THREE.BackSide){m.raycast=noRay;m.visible=!!opt.outlines;outlines.push(m)}
    scene.add(m);macro.push(m);
    for(const o of list){
      scene.remove(o);
      const ix=outlines.indexOf(o);if(ix>=0)outlines.splice(ix,1);
      if(world.meshes.indexOf(o)<0)o.geometry.dispose();                          // proxy raycastu zostaje w world.meshes
    }
  }
  // neony o wspólnej teksturze -> jedna siatka
  const byTex=new Map();
  for(const o of scene.children){
    if(!o.isMesh||o.matrixAutoUpdate===false||!o.userData||!o.userData.neon||!o.material.map)continue;
    const k=o.material.map.uuid+(world.neon.indexOf(o)>=0?'a':'s');let a=byTex.get(k);if(!a){a=[];byTex.set(k,a)}a.push(o);
  }
  for(const list of byTex.values()){
    if(list.length<2)continue;
    const first=list[0],geos=list.map(o=>{o.updateMatrix();const g=o.geometry.clone();g.applyMatrix4(o.matrix);return g});
    const m=new THREE.Mesh(mergeGeometries(geos,['position','normal','uv']),first.material);m.matrixAutoUpdate=false;m.userData.neon=true;
    const anim=world.neon.indexOf(first)>=0;
    scene.add(m);macro.push(m);if(anim)world.neon.push(m);
    for(const o of list){scene.remove(o);o.geometry.dispose();const ix=world.neon.indexOf(o);if(ix>=0)world.neon.splice(ix,1);if(o!==first)o.material.dispose()}
    first.material.userData.keep=true;
  }
}
function disposeMacro(){for(const m of macro){scene.remove(m);m.geometry.dispose()}macro=[]}
/* ------------------------------------------------------------------ pętla poziomu */
const T0=new THREE.Vector3();
function nearestDoor(){
  const P=DS.player.P;let best=null,bd=1e9;
  for(const d of doors){const dist=Math.hypot(P.pos.x-d.px,P.pos.z-d.pz);if(dist<d.range&&dist<bd){bd=dist;best=d}}
  return best;
}
/** Do testów/QA: wewnętrzne obiekty bieżącego poziomu (drzwi, beczki, znajdźki). */
export function debugState(){return {doors,barrels,col}}
let hintT=0;
DS.bus.on('update',dt=>{
  if(!col&&!doors.length&&!barrels)return;
  const G=S.G;
  if(followSun){const P=DS.player.P,sx=Math.round(P.pos.x/4)*4,sz=Math.round(P.pos.z/4)*4;sun.target.position.set(sx,0,sz);sun.position.set(sx+SUN_OFF.x,SUN_OFF.y,sz+SUN_OFF.z)}
  refreshCol(dt);tryCollect();
  const P=DS.player.P;
  for(const d of doors){
    if(d.auto)d.target=Math.hypot(P.pos.x-d.px,P.pos.z-d.pz)<d.range+.4?1:0;
    d.t+=(d.target-d.t)*Math.min(1,dt*5);
    const o=d.t*d.w*d.dir*.96;
    d.mesh.position.set(d.px+(d.axis==='x'?o:0),d.mesh.position.y,d.pz+(d.axis==='z'?o:0));
    const open=d.t>.55;d.col.x0=d.col0.x0+(open?1e5:0);d.col.x1=d.col0.x1+(open?1e5:0);
  }
  hintT-=dt;
  if(G&&!G.dead&&hintT<=0){const d=nearestDoor();if(d&&d.secret&&d.target===0){hintT=1.4;addFloater(d.label+'  ['+DS.input.keyFor('use')+']',{world:T0.set(d.px,1.6,d.pz).clone(),size:20,life:1.2,color:'#ffe14a',vy:-18})}}
});
addEventListener('keydown',e=>{
  if(e.repeat||!DS.input.matches('use',e.code))return;
  const G=S.G;if(S.mode!=='game'||!G||G.paused||G.dead)return;
  const d=nearestDoor();if(d&&!d.auto){d.target=d.target?0:1;sfx('tick',d.target?700:500)}
});
// strzał w beczkę
DS.bus.on('shot',e=>{
  if(!barrels||!e||!e.hits)return;
  for(const h of e.hits){
    if(h.object!==barrels.im)continue;
    let best=null,bd=1.4;for(const b of barrels.items){if(b.dead)continue;const d=Math.hypot(b.x-h.point.x,b.z-h.point.z);if(d<bd){bd=d;best=b}}
    if(best)blow(best);
  }
});
function resetRun(){
  for(const d of doors){d.t=d.target=0;d.col.x0=d.col0.x0;d.col.x1=d.col0.x1}
  if(barrels){barrels.items.forEach((b,i)=>{b.dead=false;b.col.x0=b.col0.x0;b.col.x1=b.col0.x1;barrels.im.setMatrixAt(i,_m.makeTranslation(b.x,.475,b.z));barrels.band.setMatrixAt(i,_m.makeTranslation(b.x,.62,b.z))});
    barrels.im.instanceMatrix.needsUpdate=barrels.band.instanceMatrix.needsUpdate=true}
  if(col){for(const it of col.items)it.got=!!(KINDS[it.type].once&&(save.lvFound||{})[it.id])}
}
DS.bus.on('levelStart',resetRun);
DS.bus.on('levelEnd',resetRun);

DS.bus.on('levelUnload',()=>{doors=[];col=null;barrels=null;followSun=false;disposeMacro()});

