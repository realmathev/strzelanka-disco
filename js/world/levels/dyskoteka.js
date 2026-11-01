// Poziom 5: Wiejska dyskoteka w lesie (noc, księżyc, mgła). Właściciel katalogu: ds-level-designer.
//
// Arena 78 m od środka (156 x 156 m = 24 336 m2, ok. 3,45x Remiza). +X = wschód (prawo na planie), -Z = północ (góra planu).
// Gracz startuje na szosie przy przystanku PKS (0,72) i patrzy na północ: w oddali świeci neon DYSKOTEKA nad salą wiejską (remiza-dyskoteka).
//
//  PLAN (1 znak ~ 3 m; [..] = budynek, # = las, % = kukurydza (labirynt), ~ = pszenica, = = polna droga, * = sekret, B = boss)
//  z=-78 ##### las ###### [LEŚNICZÓWKA*] ########### ##### [ambona|ule] ###########################################
//  z=-64 #  ┌ stodoła ┐ ~~~ = droga północna (z=-60) ============================ %%%%%%%%%%%%%%%%%%%%%% #
//  z=-52 # [BIMBR.*]    =                 ognisko + stosy (polana)   =  %%% LABIRYNT Z KUKURYDZY (7 x 8 komórek) %% #
//  z=-42 # [STODOŁA]  =                   (-16,-46)                  =  %%%   polana z kombajnem (50,-43)    %%% #
//  z=-32 # zagroda: studnia, wóz, [obora]     [zaplecze DJ-a*]       =  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% #
//  z=-24 # [dom]  brama(auto)   =          [   S A L A   W I E J S K A   ]        = wjazd ... dziedziniec wsch.  #
//  z=-16 #                      =    scena DJ / parkiet+kula / bar / loże   [wieża OSP]  =                       #
//  z=-8  # ~~~ pole pszenicy ~~~ =          wejście, neon DYSKOTEKA, plac z ławkami      =                        #
//  z=+8  # ~~~                 =  PARKING (boss B): traktory, Maluchy, namiot z piwem   = skład maszyn: Bizon, Ursusy, bele #
//  z=+46 #                        =         droga wjazdowa z totemem                      =                         #
//  z=+60 # ============= szosa (przystanek PKS) ================================================================ #
//  z=+72 # domy       START (0,72): automaty leczące, neon na słupie                         remiza OSP, domy    #
//  Wysokości: silnik ma płaską podłogę, więc "piętra" są wizualne: wieża OSP 10 m, ambona, stogi, dach sali, bele. Pętle: parking -> droga zachodnia
//  -> droga północna -> droga wschodnia -> plac; przez salę (wejście i wyjście awaryjne); przez labirynt (3 wejścia, oczka z pętlami).
//  Zaułki: pole z kukurydzy, zagroda, stodoła, polanki w lesie (łańcuszek za płotem lasu, kapliczka), tył sali.
//
// Znajdźki: 13 (4 kasety, 4 złote łańcuchy, 2 klucze, 3 plakaty), 3 sekrety (E: zaplecze DJ-a, bimbrownia w stodole, leśniczówka), brama zagrody (auto) i
// wyjście awaryjne sali (auto), 4 grupy beczek wybuchowych, 4 automaty leczące. Boss fali 5: pula tabeli (dziś DJ; Sołtys po dodaniu). Ukończenie: pokonanie bossa.
import {DS} from '../../core/ds.js';
import {save,persist} from '../../core/save.js';
import {S} from '../../core/state.js';
import {scene,camera} from '../../render/renderer.js';
import {toon,noRay} from '../../render/materials.js';
import {groundTex} from '../../render/textures.js';
import {announce} from '../../render/comicfx.js';
import {mergeGeometries} from '../../render/merge.js';
import {A as AU} from '../../audio/context.js';
import {addBox} from '../build.js';
import {addPart} from '../batch.js';
import {world} from '../state.js';
import {setEnv,slab,facade,room,slidingDoor,placeCollectibles,placeBarrels,healMachines,buildNav,collectStats,mergeIntoZones} from './common.js';

const ID='dyskoteka',ARENA=78,PI=Math.PI;
const put=(id,o)=>DS.props.get(id).place(o);
/** Instancing rekwizytu; instancje trafialne raycastem (bez konturów) idą do world.meshes, żeby kule i wzrok wrogów nie przenikały przez płoty, kukurydzę itp. */
function inst(id,list,o){
  const g=DS.props.instance(id,list,o);
  for(const c of g.children){if(o&&o.noCast)c.castShadow=false;if(c.isInstancedMesh&&c.raycast!==noRay&&!(o&&o.noRay))world.meshes.push(c)}
  return g;
}
const C={grass:0x56703f,gravel:0x6e685a,park:0x5d5e64,road:0x4a4b52,dirt:0x7c6a4a,yard:0x74694f,plaza:0x8c877a,wall:0xd0b870,wood:0x6e4e2e,dark:0x2a2630,steel:0x4b5058,roof:0x6a3a2e};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

/* ------------------------------------------------------------------ definicja poziomu */
const L={
  id:ID,name:'Wiejska dyskoteka w lesie',arena:ARENA,
  desc:'Noc na wsi: sala wiejska z parkietem, sceną DJ-a i barem, parking z traktorami i Maluchami, zagroda ze stodołą, labirynt z kukurydzy i gęsty las. Boss na parkingu przed salą.',
  spawn:{x:0,z:72,yaw:0},
  starts:[{x:0,z:72,yaw:0,name:'Przystanek PKS'},{x:0,z:36,yaw:0,name:'Parking'},{x:0,z:-4,yaw:0,name:'Plac przed salą'},{x:0,z:-17,yaw:0,name:'Parkiet'},
    {x:-52,z:-34,yaw:PI/2,name:'Zagroda'},{x:51,z:-40,yaw:PI/2,name:'Polana w kukurydzy'},{x:-16,z:-40,yaw:0,name:'Ognisko'}],
  menuCam:{r:92,y:46,look:[0,2,-4]},
  track:'C',
  spawnZones:[
    {id:'parking-zach',x:-26,z:40,r:7,w:2,from:1},{id:'parking-wsch',x:26,z:38,r:7,w:2,from:1},{id:'las-zach',x:-73,z:44,r:7,w:1.5,from:1},
    {id:'las-wsch',x:73,z:40,r:7,w:1.5,from:1},{id:'skład-maszyn',x:52,z:12,r:8,w:1.8,from:2},{id:'pole-wejscie',x:41.5,z:-22.9,r:2.5,w:1.6,from:2},
    {id:'zagroda',x:-52,z:-30,r:5,w:1.6,from:2},{id:'pszenica',x:-56,z:16,r:7,w:1.5,from:2},{id:'las-pn',x:0,z:-73,r:8,w:1.4,from:3},
    {id:'ognisko',x:-16,z:-48,r:6,w:1.2,from:3},{id:'pole-srodek',x:49,z:-39.5,r:3,w:1.2,from:3},{id:'pole-pn',x:58.9,z:-63.5,r:2.2,w:1.2,from:4},
    {id:'stodola',x:-58.5,z:-47,r:1.8,w:1,from:4},{id:'sala',x:0,z:-16,r:4,w:1.2,from:4},{id:'za-sala',x:12,z:-40,r:5,w:1,from:5},
    {id:'parking-boss',x:0,z:24,r:8,w:1,from:1,boss:true},
  ],
  // Scenariusz fal: 1-2 gangsterzy i dresy z parkingu i lasu; 3-4 pijacy z namiotu, bandyci z pola; 5 BOSS na parkingu przed salą (osłony: traktory, przyczepa z sianem, bele);
  // 6-9 kierowcy Maluchów szarżują po parkingu, kamikadze z labiryntu; 10 BOSS (kolejny z puli); 11+ snajperzy z lasu i dachów, medycy.
  waves:{
    intro:'Godzina 22:40. Wiejska dyskoteka w lesie. Z sali bije bas, w namiocie leje się piwo, a Sołtys już czeka na parkingu.',
    plan:[{from:1,note:'gangsterzy i dresy z parkingu, lasu i szosy'},{from:3,note:'pijacy z namiotu piwnego, bandyci z pola'},
      {from:5,boss:'pula',note:'boss wchodzi na parking przed salą; osłony: traktory z kabiną, przyczepa z sianem, bele, Żuk, beczki'},
      {from:6,note:'kierowcy Maluchów, kamikadze z labiryntu'},{from:10,boss:'pula'},{from:11,note:'snajperzy z lasu, medycy'}],
    bossWave:5,bossArena:{x:0,z:24,hw:16,hd:14,gates:[{x:-20,z:8},{x:20,z:8},{x:-32,z:30},{x:32,z:30},{x:0,z:46},{x:-14,z:44},{x:14,z:44}]},
  },
  win:{kind:'boss',boss:'boss_soltys',reward:{coins:500,keys:1},text:'DYSKOTEKA ZDOBYTA!'},
  secrets:[{id:'zaplecze-dj',name:'Zaplecze DJ-a'},{id:'bimbrownia',name:'Bimbrownia w stodole'},{id:'lesniczowka',name:'Leśniczówka'}],
  build(){ buildDyskoteka(this) },
};
DS.levels.register(L);

/* ------------------------------------------------------------------ pomocnicy */
const sign=(text,color,bg,w,h,x,y,z,rotY=0)=>put('neonSign',{text,color,bg,w,h,x,y,z,rotY});
const crate=(x,z,s=1.8)=>put('crate',{x,z,s});
const stack=(x,z)=>{crate(x,z);crate(x+1.9,z+.2)};
const car=(id,x,z,r,c)=>put(id,{x,z,rotY:r,color:c});
const glow=(x,y,z,w,h,d,color)=>addPart(new THREE.BoxGeometry(w,h,d),new THREE.Matrix4().makeTranslation(x,y,z),{color},{basic:true,cast:false,receive:false,ray:false,edges:false});
const hasRect=(r,x,z,m=0)=>x>r[0]-m&&x<r[1]+m&&z>r[2]-m&&z<r[3]+m;

/** Dach dwuspadowy z szczytami. across = rozpiętość (prostopadle do kalenicy), along = długość kalenicy; axis 'z' = kalenica wzdłuż Z. y = górna krawędź ścian. */
function gableRoof(cx,cz,across,along,y,ph,color,wallColor,axis='z',ov=.5){
  const half=across/2+ov,a=Math.atan2(ph,half),s=Math.hypot(half,ph);
  const R=new THREE.Matrix4().makeRotationY(axis==='x'?PI/2:0),T=new THREE.Matrix4().makeTranslation(cx,0,cz);
  const M=(m)=>new THREE.Matrix4().multiplyMatrices(T,new THREE.Matrix4().multiplyMatrices(R,m));
  const slope=new THREE.BoxGeometry(s,.22,along+1);
  for(const sg of [-1,1]){
    const m=new THREE.Matrix4().makeTranslation(sg*half/2,y+ph/2,0).multiply(new THREE.Matrix4().makeRotationZ(-sg*a));
    addPart(slope,M(m),{color},{cast:true,edges:false});
  }
  addPart(new THREE.BoxGeometry(.4,.2,along+1.1),M(new THREE.Matrix4().makeTranslation(0,y+ph+.02,0)),{color:0x3a2a26},{cast:false,edges:false});
  const hw=across/2,hs=ph*(1-hw/half),sh=new THREE.Shape([new THREE.Vector2(-hw,0),new THREE.Vector2(hw,0),new THREE.Vector2(hw,hs),new THREE.Vector2(0,ph),new THREE.Vector2(-hw,hs)]);
  const tri=new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:false});if(!tri.index){const n=tri.attributes.position.count,ix=new Uint16Array(n);for(let i=0;i<n;i++)ix[i]=i;tri.setIndex(new THREE.BufferAttribute(ix,1))}
  for(const sg of [-1,1])addPart(tri,M(new THREE.Matrix4().makeTranslation(0,y,sg>0?along/2-.3:-along/2)),{color:wallColor},{cast:false,edges:false});
}
/**
 * Ściany prostokąta (grubość T) z przerwami. gaps: {n,s,w,e:[[od,do,wysokość otworu]]} (współrzędna wzdłuż ściany; wysokość >= h = brak nadproża).
 * plain=true: jednolity kolor (stodoła), inaczej fasada z oknami.
 */
function shell(x0,x1,z0,z1,h,T,col,gaps={},plain=false){
  const mk=(ax0,ax1,az0,az1,hh,y0,collide)=>plain?addBox(ax1-ax0,hh,az1-az0,(ax0+ax1)/2,y0,(az0+az1)/2,{color:col},{collide}):facade(ax0,ax1,az0,az1,hh,col,{y0,collide});
  const sides={n:['x',x0,x1,z0,z0+T],s:['x',x0,x1,z1-T,z1],w:['z',z0,z1,x0,x0+T],e:['z',z0,z1,x1-T,x1]};
  for(const k in sides){
    const [ax,lo,hi,f0,f1]=sides[k],gs=(gaps[k]||[]).slice().sort((p,q)=>p[0]-q[0]);let c=lo;
    const put1=(a,b,hh,y0,collide)=>{if(b-a<.05)return;ax==='x'?mk(a,b,f0,f1,hh,y0,collide):mk(f0,f1,a,b,hh,y0,collide)};
    for(const [a,b,dh] of gs){put1(c,a,h,0,true);if(dh<h)put1(a,b,h-dh,dh,false);c=b}
    put1(c,hi,h,0,true);
  }
}
/** Girlanda żarówek (InstancedMesh w world.bulbs: mruga przez animateWorld) między dwoma punktami, z zawieszeniem. */
const bulbs=[];
function garland(x0,y0,z0,x1,y1,z1,n=14,sag=.7){
  for(let i=0;i<n;i++){const t=i/(n-1);bulbs.push([x0+(x1-x0)*t,y0+(y1-y0)*t-Math.sin(t*PI)*sag,z0+(z1-z0)*t])}
}
function flushBulbs(){
  if(!bulbs.length)return;
  const im=new THREE.InstancedMesh(new THREE.SphereGeometry(.11,6,4),new THREE.MeshBasicMaterial({color:0xffffff,fog:false}),bulbs.length),m=new THREE.Matrix4(),c=new THREE.Color();
  bulbs.forEach((b,i)=>{im.setMatrixAt(i,m.makeTranslation(b[0],b[1],b[2]));im.setColorAt(i,c.setHex(0xfff2a8))});
  im.frustumCulled=false;im.raycast=noRay;scene.add(im);world.bulbs.push(im);
}

/* ---- las: tanie świerki w InstancedMesh, dzielone na komórki (własny frustum culling), pnie trafialne raycastem ---- */
let cells=[];
function spruceGeos(){
  const tiers=[[2.3,2.9,3.1],[1.8,2.6,4.7],[1.25,2.3,6.2],[.7,1.5,7.5]],parts=[];
  for(const [r,h,y] of tiers){const g=new THREE.ConeGeometry(r,h,6,1,false);g.translate(0,y,0);parts.push(g)}
  const crown=mergeGeometries(parts.map(g=>g.toNonIndexed()),['position','normal','uv']);
  const trunk=new THREE.CylinderGeometry(.16,.27,2.6,5,1,true);trunk.translate(0,1.3,0);
  return {crown,trunk};
}
function buildForest(pts){
  const CELL=26,groups=new Map();
  for(const p of pts){const k=Math.floor((p.x+ARENA)/CELL)+','+Math.floor((p.z+ARENA)/CELL);let a=groups.get(k);if(!a){a=[];groups.set(k,a)}a.push(p)}
  const base=spruceGeos(),cm=toon(0xffffff),tm=toon(0x4a3626),m=new THREE.Matrix4(),q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),pp=new THREE.Vector3(),ss=new THREE.Vector3(),col=new THREE.Color();
  for(const list of groups.values()){
    const crown=new THREE.InstancedMesh(base.crown.clone(),cm,list.length),trunk=new THREE.InstancedMesh(base.trunk.clone(),tm,list.length);
    let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    list.forEach((p,i)=>{
      q.setFromAxisAngle(Y,p.ry);pp.set(p.x,0,p.z);ss.set(p.s*(.9+.25*(p.v-.5)),p.s,p.s*(.9+.25*(p.v-.5)));m.compose(pp,q,ss);
      crown.setMatrixAt(i,m);trunk.setMatrixAt(i,m);col.setHSL(.33+.04*p.v,.38+.1*p.v,.17+.07*(1-p.v));crown.setColorAt(i,col);
      world.colliders.push({x0:p.x-.3,x1:p.x+.3,z0:p.z-.3,z1:p.z+.3,h:4});
      x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);
    });
    for(const im of [crown,trunk]){im.frustumCulled=false;im.castShadow=false;im.receiveShadow=false;im.instanceMatrix.needsUpdate=true;scene.add(im)}
    crown.raycast=noRay;world.meshes.push(trunk);
    cells.push({ims:[crown,trunk],cx:(x0+x1)/2,cz:(z0+z1)/2,r:Math.hypot(x1-x0,z1-z0)/2+12});
  }
}
const _fr=new THREE.Frustum(),_pm=new THREE.Matrix4(),_sp=new THREE.Sphere();
function cullForest(){
  if(!cells.length)return;
  camera.updateMatrixWorld();_pm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_fr.setFromProjectionMatrix(_pm);
  const far=scene.fog?scene.fog.far:130,P=camera.position;
  for(const c of cells){
    _sp.center.set(c.cx,5,c.cz);_sp.radius=c.r;
    const v=Math.hypot(c.cx-P.x,c.cz-P.z)<far+c.r&&_fr.intersectsSphere(_sp);
    c.ims[0].visible=c.ims[1].visible=v;
  }
}

/** Labirynt z kukurydzy: DFS + dodatkowe przejścia (pętle), polana pośrodku, trzy wejścia. Zwraca {walls:[{x,z,rotY}], cells} */
const MZ={NX:7,NZ:8,PM:5.8,X0:27,Z0:-66.4};
function mazeWalls(){
  const {NX,NZ,PM,X0,Z0}=MZ,R=rng(2024);
  const H=Array.from({length:NZ+1},()=>Array(NX).fill(true)),V=Array.from({length:NZ},()=>Array(NX+1).fill(true));
  const seen=Array.from({length:NZ},()=>Array(NX).fill(false)),st=[[0,0]];seen[0][0]=true;
  while(st.length){
    const [i,j]=st[st.length-1],nb=[];
    if(i>0&&!seen[j][i-1])nb.push([i-1,j,'w']);if(i<NX-1&&!seen[j][i+1])nb.push([i+1,j,'e']);
    if(j>0&&!seen[j-1][i])nb.push([i,j-1,'n']);if(j<NZ-1&&!seen[j+1][i])nb.push([i,j+1,'s']);
    if(!nb.length){st.pop();continue}
    const [a,b,d]=nb[Math.floor(R()*nb.length)];seen[b][a]=true;
    if(d==='w')V[j][i]=false;else if(d==='e')V[j][i+1]=false;else if(d==='n')H[j][i]=false;else H[j+1][i]=false;
    st.push([a,b]);
  }
  for(let j=1;j<NZ;j++)for(let i=0;i<NX;i++)if(R()<.17)H[j][i]=false;
  for(let j=0;j<NZ;j++)for(let i=1;i<NX;i++)if(R()<.17)V[j][i]=false;
  for(const j of [3,4])for(const i of [3,4])V[j][i]=false;for(const i of [2,3,4])H[4][i]=false;     // polana 3x2 komórki
  V[3][2]=false;V[4][5]=false;H[3][4]=false;H[5][3]=false;                                    // wyjścia z polany
  H[0][3]=false;H[NZ][2]=false;H[NZ][5]=false;V[5][0]=false;                                // wejścia: północ, 2x południe, zachód
  const walls=[];
  for(let j=0;j<=NZ;j++)for(let i=0;i<NX;i++)if(H[j][i])walls.push({x:X0+(i+.5)*PM,z:Z0+j*PM,rotY:PI/2});
  for(let j=0;j<NZ;j++)for(let i=0;i<=NX;i++)if(V[j][i])walls.push({x:X0+i*PM,z:Z0+(j+.5)*PM,rotY:0});
  return walls;
}

/* ------------------------------------------------------------------ budowa */
function buildDyskoteka(level){
  cells=[];bulbs.length=0;
  /* ---- noc: granatowe niebo, mgiełka, księżyc z lewej-północy ---- */
  setEnv({sky:0x0d1431,fogNear:24,hemi:[0x7f94d8,0x2c3a2a,.66],sun:[0xb4c6ff,.74],sunDir:[-44,30,-50]});
  const sky=new THREE.Group(),Rs=rng(31),sp=new Float32Array(3*460);
  for(let i=0;i<460;i++){let x=Rs()*2-1,y=Rs()*.95+.04,z=Rs()*2-1;const l=Math.hypot(x,y,z);sp[i*3]=x/l*320;sp[i*3+1]=y/l*320;sp[i*3+2]=z/l*320}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xdfe8ff,size:2.2,sizeAttenuation:false,fog:false,transparent:true,opacity:.9,depthWrite:false}));stars.frustumCulled=false;sky.add(stars);
  const md=new THREE.Vector3(-44,30,-50).normalize().multiplyScalar(300);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(11,18,12),new THREE.MeshBasicMaterial({color:0xf6f2de,fog:false}));moon.position.copy(md);moon.raycast=noRay;sky.add(moon);
  const halo=new THREE.Mesh(new THREE.CircleGeometry(40,28),new THREE.MeshBasicMaterial({color:0x90a8ff,fog:false,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending}));
  halo.position.copy(md).multiplyScalar(.99);halo.lookAt(0,0,0);halo.raycast=noRay;sky.add(halo);
  sky.traverse(o=>{o.frustumCulled=false});scene.add(sky);moonSky=sky;

  /* ---- teren ---- */
  const gt=groundTex.clone();gt.ownedByLevel=true;gt.repeat.set(46,46);gt.needsUpdate=true;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(460,460),toon(0x5d7a47,{map:gt}));ground.rotation.x=-PI/2;ground.receiveShadow=true;scene.add(ground);world.meshes.push(ground);
  slab(-ARENA,ARENA,-ARENA,ARENA,0,.03,C.grass);
  slab(-34,34,6,48,.03,.03,C.park);slab(-5,5,46,57,.03,.03,C.gravel);                       // parking + wjazd
  slab(-ARENA,ARENA,55,65,.03,.03,C.road);                                                  // szosa
  slab(-22,22,66,78,.03,.03,C.plaza);                                                       // plac startowy
  slab(-36,36,-9,7,.03,.03,C.plaza);                                                        // plac przed salą
  slab(-14,14,-8,-6.6,.06,.03,0xa09a8c);                                                    // schodek / opaska wejścia
  slab(33,68,-20,46,.03,.03,C.yard);                                                        // skład maszyn
  slab(-64,-42,-56,-3,.03,.03,C.yard);                                                      // zagroda
  slab(-30,-4,-58,-36,.03,.03,C.dirt);                                                      // polana z ogniskiem
  slab(-30,-23,-72,-62,.03,.03,C.dirt);slab(12,26,-80,-62,.03,.03,C.dirt);                  // polanki leśne
  for(const x of [-37])slab(x-2.2,x+2.2,-62,56,.03,.03,C.dirt);                             // droga zachodnia
  slab(-39,26,-62,-58,.03,.03,C.dirt);slab(20,24,-62,8,.03,.03,C.dirt);                     // droga północna i wschodnia
  slab(-40,-36,-10,-6,.03,.03,C.dirt);
  // pasy parkingu (jasne), prowadzą wzrok do sali
  for(let i=-3;i<=3;i++)if(i!==0)slab(i*8-.06,i*8+.06,6,12,.06,.01,0xcfcabb);
  // ściana lasu za drzewami (zasłania widok poza arenę) i żywopłot od południa
  const dk={color:0x13241a};
  addBox(2,18,2*ARENA+8,-ARENA-1,0,0,dk,{collide:false,cast:false});addBox(2,18,2*ARENA+8,ARENA+1,0,0,dk,{collide:false,cast:false});
  addBox(2*ARENA+8,18,2,0,0,-ARENA-1,dk,{collide:false,cast:false});addBox(2*ARENA+8,5,1.6,0,0,ARENA+.8,{color:0x24401f},{collide:false,cast:false});

  /* ---- SALA WIEJSKA (centrum): ściany z wejściem i wyjściem awaryjnym, dach, wnętrze, zaplecze DJ-a (sekret 1) ---- */
  const HX0=-10,HX1=10,HZ0=-26,HZ1=-8,HH=4.2,HT=.5,HW=0xc9b46c;
  shell(HX0,HX1,HZ0,HZ1,HH,HT,HW,{s:[[-2.2,2.2,3.0]],w:[[-12,-10,2.4]],n:[[-10,-3.5,HH]]});
  addBox(20.8,.4,18.8,0,HH,-17,{color:0x4a3a40},{collide:false});
  gableRoof(0,-17,20.8,18.8,HH+.4,2.8,C.roof,HW,'z',.9);
  slab(HX0+HT,HX1-HT,HZ0+HT,HZ1-HT,.03,.03,0x2c2230);
  const dj=room({x0:-10,x1:-3.5,z0:-32,z1:-25.5,h:3.4,wall:HW,roof:0x4a3a40,floor:0x2c2230,light:0xff70d8,door:{side:'s',c:-6.8,w:2,h:2.4,secret:true,label:'ZAPLECZE DJ-A',color:HW}});
  void dj;
  // kolorowe światło w oknach (emisja), lampiony pod sufitem
  for(const [c,x] of [[0x4adfff,-4.2],[0xffe04a,4.2],[0xff4ad8,6.6],[0x6aff7a,8.6]])glow(x,2.1,HZ1+.05,1.1,1.4,.06,c);
  for(const [c,z] of [[0xff4ad8,-23.5],[0x4adfff,-19],[0xffe04a,-14.5],[0xa86aff,-9]])glow(HX0-.04,2.1,z,.06,1.4,1.1,c);
  for(const [c,z] of [[0xff4ad8,-21],[0x4adfff,-17],[0xffe04a,-13],[0xa86aff,-9]])glow(HX1+.04,2.1,z,.06,1.4,1.1,c);
  for(const [c,x,z] of [[0xff4ad8,-5,-14],[0x4adfff,5,-14],[0xffe04a,-5,-21],[0x6aff7a,5,-21],[0xa86aff,0,-17.5]])glow(x,HH-.12,z,3.4,.08,.4,c);
  addBox(6.2,.2,3,0,3.3,-6.8,{color:0x7a3a2a},{collide:false});                              // daszek wejścia
  for(const sx of [-1,1])addBox(.28,3.3,.28,sx*2.9,0,-5.6,{color:C.wood});
  for(let i=0;i<10;i++)glow(-2.7+i*.6,3.15,-5.55,.12,.12,.12,[0xfff0a0,0xff6a6a,0x7aff9a,0x7ab0ff][i%4]);
  addBox(3.4,3.0,.1,-6.8,0,-7.93,{color:0xb8301f},{collide:false});                          // brama garażowa OSP (zamknięta)
  sign('REMIZA OSP','#f4efe0','#7a1a12',3.3,.7,-6.8,3.55,-7.85);
  sign('DISCO','#ff4ad8','#14061a',4.4,1.2,0,3.8,-7.9);
  // billboard DYSKOTEKA na dwóch słupach (punkt orientacyjny widoczny z całej mapy)
  for(const sx of [-1,1])addBox(.4,10.5,.4,sx*6.8,0,-7,{color:C.steel});
  addBox(14.6,.4,.4,0,10.4,-7,{color:C.steel},{collide:false});
  sign('DYSKOTEKA','#ff3ad0','#14061a',13,3.2,0,8.8,-6.7);sign('WIEJSKA ZABAWA','#43f0ff','#06202a',11,2.2,0,8.8,-7.3,PI);
  // wieża OSP przy północno-wschodnim narożniku
  addBox(2.6,10,2.6,11.6,0,-24.5,{color:HW});addBox(2.9,.5,2.9,11.6,10,-24.5,{color:0x7a6a50},{collide:false});
  addPart(new THREE.CylinderGeometry(0,2.2,2,4),new THREE.Matrix4().makeRotationY(PI/4).setPosition(11.6,11.5,-24.5),{color:C.roof},{cast:true,edges:false});
  addPart(new THREE.SphereGeometry(.4,8,6),new THREE.Matrix4().makeTranslation(11.6,12.8,-24.5),{color:0xff2a2a},{basic:true,cast:false,receive:false,ray:false,edges:false});
  for(let i=0;i<3;i++)glow(11.6,4.8+i*1.5,-23.14,.5,.9,.06,0xffd890);
  sign('OSP','#ff4a3a','#10060a',2,.9,11.6,8.6,-22.9);
  // wnętrze: parkiet z kulą, scena DJ-a, bar z półkami i stołkami, loże, stoliki, kolumny-osłony
  put('parkiet',{x:0,z:-17.6,w:8,d:8,seed:2});put('kulaDisco',{x:0,y:HH-1.65,z:-17.6,drop:.8});
  put('scenaDJ',{x:0,z:-24.2,rotY:0});
  put('barLada',{x:8.45,z:-18.5,rotY:-PI/2});put('barLada',{x:8.45,z:-14.9,rotY:-PI/2});
  put('barPolki',{x:9.24,z:-18.4,rotY:-PI/2});put('barPolki',{x:9.24,z:-15,rotY:-PI/2});
  DS.props.instance('stolekBarowy',[-19.7,-18.2,-16.7,-15.2,-13.9].map(z=>({x:7.4,z})),{seed:4});
  put('kanapaLoza',{x:-8.3,z:-20.4,rotY:PI/2,variant:'loza',seed:3});put('kanapaLoza',{x:-8.3,z:-14.6,rotY:PI/2,variant:'loza',seed:5});
  DS.props.instance('stolikKoktajlowy',[{x:-5.8,z:-16.8},{x:5.7,z:-22},{x:-2.5,z:-10.5},{x:3,z:-10.5}],{seed:6});
  for(const [x,z] of [[-5.9,-21.5],[5.9,-21.5],[-5.9,-12.2],[5.9,-12.2]])put('kolumnaLustrzana',{x,z});
  put('scianaLustra',{x:5.6,z:-25.4,rotY:0});
  put('gasnica',{x:-9.45,z:-9.2,rotY:PI/2});put('tablicaWyjscie',{x:-9.4,y:2.4,z:-11,rotY:PI/2});put('tablicaWyjscie',{x:0,y:3.2,z:-8.55,rotY:PI});
  // wyjście awaryjne (auto): zachodnia ściana sali
  slidingDoor('z',HX0+HT/2,-11,2,2.4,{auto:true,color:0x4e5660,range:3.4,thick:.25});
  // zaplecze DJ-a (wnętrze sekretu 1)
  put('regalMagazynowy',{x:-8.4,z:-31.1,rotY:0});put('lodowka',{x:-4.9,z:-31.1,rotY:0});crate(-9,-28.6,1.4);
  put('skrzynkaAlkohol',{x:-4.6,z:-29,rotY:.4});
  glow(-6.8,3.28,-28.8,.5,.06,.5,0xff70d8);
  // plac przed salą: ławki, donice, kapliczka, beczki, lampy, girlandy
  put('lawka',{x:-13,z:-3,rotY:PI,variant:'stal'});put('lawka',{x:13,z:-3,rotY:PI,variant:'stal'});put('lawka',{x:-24,z:-3,rotY:PI/2,variant:'beton'});
  put('donica',{x:-7,z:-4,variant:'skrzynia'});put('donica',{x:7,z:-4,variant:'skrzynia'});put('donica',{x:-18,z:3,variant:'beton'});put('donica',{x:18,z:3,variant:'beton'});
  put('kapliczka',{x:-28,z:-2,variant:'slupowa'});put('slupOgloszeniowy',{x:24,z:-4,seed:1});
  stack(-18,-6);stack(18,-7);crate(-28,5);crate(28,4);
  put('smietnik',{x:-12,z:-7.5,variant:'kontener'});put('koszUliczny',{x:14,z:-5});
  placeBarrels([{x:-21.5,z:-1},{x:-20.5,z:-.1}]);                                             // skupisko 1: plac
  put('slupBocian',{x:-30,z:8,seed:2});put('slupBocian',{x:30,z:8,seed:3});put('slupBocian',{x:0,z:-36,seed:1});
  garland(-6.8,5,-7.5,-30,8.2,8,18,1.1);garland(6.8,5,-7.5,30,8.2,8,18,1.1);garland(-30,8.2,8,30,8.2,8,30,1.5);garland(0,10.4,-7,-30,8.2,8,22,1.2);garland(0,10.4,-7,30,8.2,8,22,1.2);

  /* ---- PARKING (arena bossa): traktory, Maluchy, Polonezy, namiot z piwem, przyczepa z sianem, bele, beczki ---- */
  const cars=[['fiat126p',-24,12,.3,0xd3242a],['polonez',-31,16,PI/2,0x4f8a5b],['zukA06',-14,31,PI/2+.15,0xf4efe4],['fiat126p',-27,34,-.5,0xe07a2a],['passatB5',-30,43,.25,0x9aa0a8],
    ['polonez',-14,42,PI,0xb5534f],['fiat126p',18,11,-.4,0x2d5fa8],['polonez',27,17,PI/2,0xe8c030],['zukA06',26,31,0,0x4f8a5b],['fiat126p',31,42,PI/2,0xd3242a],['passatB5',14,43,PI*.9,0x2a2a30],
    ['fiat126p',9,13,.2,0xe8c030],['polonez',-9,12.5,-.1,0x2d5fa8],['fiat126p',-31,29.5,.9,0xf4efe4]];
  for(const c of cars)car(...c);
  put('ursus',{x:-8,z:22,rotY:PI/2+.3,variant:'c360kabina'});put('ursus',{x:10,z:26,rotY:-.5,variant:'c330'});put('ursus',{x:33,z:26,rotY:PI,variant:'c360'});
  put('ursus',{x:-20,z:21,rotY:.2,variant:'c360kabina'});
  put('przyczepa',{x:3,z:36,rotY:.15,variant:'siano'});put('przyczepa',{x:34,z:34,rotY:PI/2,variant:'pusta'});
  put('belaKostka',{x:-15,z:17,variant:'stos'});put('belaKostka',{x:15,z:35,variant:'stos'});put('belaKostka',{x:22,z:24,variant:'stos',rotY:PI/2});
  put('belaOkragla',{x:-4,z:44,variant:'siano'});put('belaOkragla',{x:6,z:8.5,variant:'folia'});
  put('namiotPiwny',{x:-31,z:22,rotY:PI/2});
  put('stolikKoktajlowy',{x:-27,z:19});put('stolikKoktajlowy',{x:-27,z:25.5});
  put('lawka',{x:-24.5,z:28,rotY:PI/2,variant:'beton'});
  placeBarrels([{x:3.2,z:18},{x:4.2,z:18.9},{x:-12,z:36.6}]);                                  // skupisko 2: arena bossa
  healMachines([{kind:'vending',x:-9,z:75.4,rotY:PI},{kind:'station',x:9,z:75.4,rotY:PI},{kind:'station',x:-33.3,z:36.5,rotY:PI/2}]);
  // totem na wjeździe + lampy parkingowe
  addBox(.6,13,.6,-11,0,52,{color:C.steel},{});sign('DYSKOTEKA >>>','#ff4ad8','#14061a',8,2.4,-11,13.4,52.4);sign('PIWO ZIMNE','#ffc02a','#1a1006',7,2.2,-11,13.4,51.6,PI);
  addBox(.6,10,.6,12,0,50,{color:C.steel},{});sign('PARKING 2 ZŁ','#43f0ff','#06202a',7,2,12,10.4,50.4);
  DS.props.instance('lampaUliczna',[[-18,10],[18,10],[-18,44],[18,44],[-33,38],[33,12],[0,50],[-8,60],[8,60],[-30,60],[30,60]].map(([x,z])=>({x,z,rotY:x<0?-PI/2:PI/2})),{seed:5,opts:{variant:'kobra'}});

  /* ---- szosa i start ---- */
  put('przystanekPKS',{x:18,z:69.5,rotY:PI});put('lawka',{x:-16,z:70,rotY:PI,variant:'beton'});
  put('domWiejski',{x:-40,z:72,rotY:PI,variant:'bialy'});put('domWiejski',{x:38,z:72,rotY:PI,variant:'tynk'});
  put('salaWiejska',{x:63,z:70,rotY:PI,variant:'zielona'});
  stack(-26,69);crate(24,73);put('studnia',{x:-30,z:72});
  car('polonez',-48,60,PI/2,0x9aa0a8);car('zukA06',-20,60.5,0,0x4f8a5b);car('fiat126p',10,59.5,PI,0xe07a2a);
  put('kapliczka',{x:-52,z:67,variant:'krzyz'});

  /* ---- ZAGRODA (zachód): dom, stodoła z wnętrzem (+ bimbrownia = sekret 2), obora, studnia, brama automatyczna ---- */
  put('domWiejski',{x:-56,z:-20,rotY:0,variant:'tynk'});
  put('obora',{x:-46.5,z:-13,rotY:0,variant:'obora'});
  const BX0=-64,BX1=-50,BZ0=-52,BZ1=-42,BH=4;
  shell(BX0,BX1,BZ0,BZ1,BH,.5,C.wood,{s:[[-60,-54,3.4]],n:[[-62,-54,BH]]},true);
  addBox(14.8,.4,10.8,-57,BH,-47,{color:0x4a3626},{collide:false});
  gableRoof(-57,-47,10.8,14.8,BH+.4,2.6,0x6a6e72,C.wood,'x',.6);
  room({x0:-62,x1:-54,z0:-59.5,z1:-51.5,h:3.2,wall:C.wood,roof:0x3a2a1c,floor:0x2e2418,light:0xffc070,door:{side:'s',c:-58,w:2.2,h:2.4,secret:true,label:'BIMBROWNIA',color:C.wood}});
  put('kuchenka',{x:-60.4,z:-58.6,rotY:0,wide:true});put('beczkaDeszczowa',{x:-55.4,z:-58.4,variant:'metal'});put('beczkaDeszczowa',{x:-55.4,z:-57.2,variant:'plastik'});
  put('skrzynkaAlkohol',{x:-58.5,z:-58.8,rotY:0});put('skrzynkaAlkohol',{x:-57.6,z:-58.8,rotY:.3});put('regalMagazynowy',{x:-61.1,z:-55.6,rotY:PI/2});
  glow(-58,3.05,-55.5,.5,.06,.5,0xffc070);
  put('ursus',{x:-55.5,z:-46.5,rotY:PI/2,variant:'c360kabina'});put('ursus',{x:-61.5,z:-46,rotY:PI/2,variant:'c330'});
  put('belaKostka',{x:-62.7,z:-50.6,variant:'stos'});put('belaKostka',{x:-51.4,z:-50.6,variant:'stos'});
  placeBarrels([{x:-62.6,z:-43.3},{x:-61.6,z:-43.9}]);                                        // skupisko 3: stodoła
  healMachines([{kind:'station',x:-51.4,z:-47,rotY:-PI/2}]);
  glow(-57,BH-.12,-47,10,.08,.4,0xffe0a0);glow(-57,BH-.12,-44.5,10,.08,.3,0xffe0a0);
  // dziedziniec
  put('studniaZuraw',{x:-50,z:-30,rotY:.5});put('wozDrabiniasty',{x:-45,z:-38,rotY:.6});put('ursus',{x:-58,z:-31,rotY:PI/2+.3,variant:'c330'});
  put('stogSiana',{x:-63,z:-12});put('stogSiana',{x:-57,z:-9});put('belaOkragla',{x:-52.5,z:-.5,variant:'folia'});put('belaOkragla',{x:-51,z:.4,variant:'siano'});
  put('slawojka',{x:-62,z:-38});put('stosDrewna',{x:-65,z:-24,rotY:PI/2});put('pieniekZSiekiera',{x:-51,z:-17});
  put('beczkaDeszczowa',{x:-61.6,z:-16.6,variant:'metal'});put('ul',{x:-64,z:-36,n:3});put('rampaMleczna',{x:-42.5,z:-8});
  stack(-52,-24);crate(-47,-47,1.8);crate(-45.4,-46,1.8);
  inst('plotWiejski',[...(()=>{const o=[];for(let z=-29.5;z>-54;z-=3)o.push({x:-42,z,rotY:PI/2});for(let z=-21.5;z<-3;z+=3)o.push({x:-42,z,rotY:PI/2});return o})()],{seed:3,opts:{variant:'zerdzie',len:3}});
  inst('plotWiejski',[...(()=>{const o=[];for(let x=-65;x<=-43;x+=3)if(x<-47||x>-41)o.push({x,z:-3,rotY:0});return o})()],{seed:5,opts:{variant:'sztachety',len:3}});
  slidingDoor('z',-42,-25.5,5,2.2,{auto:true,color:0x2f6a3a,range:6,thick:.25});
  addBox(.5,2.8,.5,-42,0,-28.3,{color:0xa8503a});addBox(.5,2.8,.5,-42,0,-22.7,{color:0xa8503a});addBox(.4,.4,5.9,-42,2.8,-25.5,{color:C.steel},{collide:false});
  sign('GOSPODARSTWO KOWALSKICH','#ffe14a','#2a1a06',6,1,-42.45,3.5,-25.5,PI/2);
  // pszenica (rzędy w InstancedMesh, przejezdna) + strachy, kopy
  {const rows=[];for(let z=6;z<=34;z+=2.2)for(let x=-65;x<=-47;x+=1.5)rows.push({x,z,rotY:0});const wg=DS.props.instance('rzadZboza',rows,{seed:9});wg.children.forEach(c=>c.castShadow=false);}
  put('strachNaWrobel',{x:-56,z:20,rotY:.4});put('kopaSnopkow',{x:-60,z:12});put('kopaSnopkow',{x:-52,z:28});put('kopaSnopkow',{x:-63,z:30});
  put('stogSiana',{x:-47,z:14});put('belaOkragla',{x:-45.5,z:38,variant:'slama'});stack(-44,3);
  put('slupBocian',{x:-44,z:-34,seed:4});

  /* ---- POLANA Z OGNISKIEM (północ) + droga północna ---- */
  put('ognisko',{x:-16,z:-46});put('stosDrewna',{x:-24,z:-41,rotY:.3});put('stosDrewna',{x:-9,z:-53,rotY:PI/2});put('pieniekZSiekiera',{x:-12,z:-41});
  put('belaOkragla',{x:-23,z:-52,variant:'siano'});put('belaOkragla',{x:-21.5,z:-53.2,variant:'folia'});put('wozDrabiniasty',{x:-26,z:-47,rotY:PI/2+.3});
  stack(-7,-44);put('kapliczka',{x:-3,z:-57,variant:'krzyz'});
  placeBarrels([{x:-9.5,z:-49},{x:-8.6,z:-49.9},{x:-10.4,z:-49.6}]);                          // skupisko 4: ognisko
  put('slawojka',{x:-28,z:-55});car('fiat126p',14,-42,PI/2,0x4f8a5b);put('rampaMleczna',{x:12,z:-30});put('rampaMleczna',{x:8,z:-28.6});
  stack(14,-36);put('belaKostka',{x:20,z:-52,variant:'stos',rotY:PI/2});
  // leśniczówka (sekret 3)
  room({x0:-34,x1:-25,z0:-73,z1:-65,h:3.2,wall:0x5a4028,roof:0x2e2a22,floor:0x3a2e22,light:0xffd080,door:{side:'s',c:-29.5,w:2,h:2.4,secret:true,label:'LEŚNICZÓWKA',color:0x5a4028}});
  sign('NADLEŚNICTWO','#7aff9a','#06140a',4.6,.9,-29.5,3.7,-64.8);
  put('kuchenka',{x:-32,z:-72,rotY:0});put('regalMagazynowy',{x:-27.2,z:-72.2,rotY:0});put('lodowka',{x:-33.2,z:-69,rotY:PI/2});crate(-26.4,-67.2,1.3);
  put('stosDrewna',{x:-26,z:-61.5,rotY:0});
  // ambona + pasieka
  put('ambona',{x:19,z:-74,rotY:PI});put('ul',{x:14,z:-69,n:4});put('ul',{x:14,z:-66,n:3});put('pieniekZSiekiera',{x:23,z:-68});
  put('slupBocian',{x:24,z:-64,seed:5});

  /* ---- SKŁAD MASZYN (wschód): kombajn, traktory, bele, stogi + wejście do labiryntu ---- */
  put('kombajnBizon',{x:50,z:24,rotY:PI/2,color:0xb8301f});put('ursus',{x:60,z:10,rotY:.8,variant:'c360kabina'});put('ursus',{x:40,z:12,rotY:-.4,variant:'c330'});
  put('przyczepa',{x:44,z:36,rotY:.3,variant:'siano'});put('przyczepa',{x:62,z:30,rotY:PI/2,variant:'pusta'});
  put('stogSiana',{x:40,z:-2});put('stogSiana',{x:62,z:-6});put('belaOkragla',{x:56,z:4,variant:'siano'});put('belaOkragla',{x:57.5,z:5,variant:'folia'});
  put('belaOkragla',{x:47,z:-10,variant:'slama'});put('wozDrabiniasty',{x:37,z:-12,rotY:.4});stack(64,-10);stack(36,22);put('belaKostka',{x:46,z:-1,variant:'stos'});
  put('stosDrewna',{x:66,z:20,rotY:PI/2});put('slawojka',{x:66,z:34});put('beczkaDeszczowa',{x:35,z:2,variant:'metal'});
  placeBarrels([{x:52,z:-14},{x:53,z:-14.9}]);
  put('slupBocian',{x:44,z:-17,seed:6});
  put('rampaMleczna',{x:22,z:-3});put('kapliczka',{x:23,z:-18,variant:'slupowa'});
  healMachines([{kind:'vending',x:35.4,z:4,rotY:-PI/2}]);
  sign('LABIRYNT KUKURYDZY','#ffd23a','#241a04',7,1.6,41.5,3.4,-18.2);addBox(.3,3.4,.3,38,0,-18.2,{color:C.wood},{collide:false});addBox(.3,3.4,.3,45,0,-18.2,{color:C.wood},{collide:false});
  car('polonez',30,-12,.3,0xb5534f);
  DS.props.instance('lampaUliczna',[[22,-14],[22,-40],[-37,-40],[-37,-14],[-37,20],[-4,-60],[22,-58],[38,-4],[56,18],[-20,-34]].map(([x,z])=>({x,z,rotY:x<0?-PI/2:PI/2})),{seed:6,opts:{variant:'kobra'}});
  garland(-37,5,20,-37,5,-14,20,.8);garland(22,5,-14,22,5,-40,18,.8);

  /* ---- LABIRYNT Z KUKURYDZY ---- */
  {const w=mazeWalls(),g=[[],[],[]];w.forEach((q,i)=>g[i%3].push(q));
   g.forEach((list,i)=>inst('poleZboza',list,{seed:11+i*7,noCast:true,opts:{variant:'kukurydza',w:1.6,d:MZ.PM}}));}
  // polana w labiryncie
  put('kombajnBizon',{x:47.3,z:-43.2,rotY:PI/2,color:0xa8281a});put('strachNaWrobel',{x:54,z:-47,rotY:.3});put('kopaSnopkow',{x:54.2,z:-39.6});put('kopaSnopkow',{x:53,z:-38.9});
  put('belaOkragla',{x:41,z:-39.6,variant:'siano'});
  placeBarrels([{x:53.6,z:-46.3},{x:54.4,z:-45.5}]);
  put('studnia',{x:41,z:-47});

  /* ---- KRZEWY / ŻYWOPŁOTY ---- */
  put('krzew',{x:-36,z:-2,variant:'zywoplot',len:4});put('krzew',{x:-37,z:34,variant:'rozkwitly'});put('krzew',{x:36,z:44,variant:'zywoplot',len:3});

  /* ---- drzewa "bohaterskie" przy drogach i polanach (osłony z kolizją, trafialne) ---- */
  const hero=[[-39,12,'brzoza'],[-35,-6,'lipa'],[-39,-34,'brzoza'],[-35,-52,'topola'],[24,-30,'brzoza'],[20,-10,'lipa'],[-4,-62,'brzoza'],[-30,-60,'swierk'],
    [-26,-56,'swierk'],[-5,-36,'brzoza'],[-12,-58,'topola'],[-22,-45,'brzoza'],[-8,-46,'lipa'],[-18,-38,'swierk'],[-14,-54,'swierk'],[-33,28,'lipa'],[36,50,'lipa'],
    [-60,2,'brzoza'],[-44,-45,'lipa'],[-66,-2,'swierk'],[34,-14,'topola'],[66,-14,'martwe'],[68,44,'lipa'],[-56,50,'brzoza'],[-24,52,'swierk'],[26,52,'lipa'],
    [48,50,'brzoza'],[-48,64,'topola'],[56,60,'lipa'],[12,-78+4,'swierk'],[30,-68,'swierk'],[-40,-70,'swierk']];
  for(const [x,z,v] of hero)put('drzewo',{x,z,variant:v,seed:Math.round(x*3+z)});
  // pomniki lasu: ścieżka do polanki z łańcuchem (zachód), kapliczka w lesie (południowy wschód)
  put('drzewo',{x:-75,z:-8,variant:'martwe',seed:4});put('kapliczka',{x:72,z:50,variant:'slupowa'});put('kopaSnopkow',{x:-72.2,z:-14});

  /* ---- las: gęsty pas na obrzeżach, polanki i dukty ---- */
  {
    const R=rng(5150),keep=[[-22,22,60,79],[-67,66,55,66],[-5.5,5.5,44,60],[-67,-35,-57,33],[10,67,-21,48],[25.5,68.4,-67.5,-18.4],[-31,-3,-60,-33],[-40,27,-64,-56],[-39,-35,-62,60],[19,25,-64,10],
      [-35,-20,-80,-62],[10,28,-80,-62],[-74,-62,-16,-8],[-76.5,-70,-15,-9],[67,76.5,46,54],[66,69,46,54],[-66,66,6,50],[-12,12,-34,-6],[-8,12,-40,-33],[-62,-34,-60,-52],[43,52,-79,-66],[-47,-33,66,79],[53,73,63,79],[31,45,65,79]];
    const belt=(x,z)=>x<-68.5||x>68.5||z<-68.5||z>74.5;
    const groves=[[-60,66,8],[-30,-74,10],[22,-72,9],[-5,-70,12],[44,-72,9],[72,62,10],[-72,-40,8]];
    const pts=[],grid=new Map(),mind=2.3,step=2.9,key=(x,z)=>Math.floor(x/mind)+','+Math.floor(z/mind);
    const near=(x,z)=>{const kx=Math.floor(x/mind),kz=Math.floor(z/mind);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=grid.get((kx+a)+','+(kz+b));if(l)for(const p of l)if(Math.hypot(p.x-x,p.z-z)<mind)return true}return false};
    for(let gx=-ARENA+1.2;gx<ARENA-.8;gx+=step)for(let gz=-ARENA+1.2;gz<ARENA-.8;gz+=step){
      const x=gx+(R()-.5)*step*.9,z=gz+(R()-.5)*step*.9;
      let ok=belt(x,z);if(!ok)for(const g of groves)if(Math.hypot(x-g[0],z-g[1])<g[2]&&R()<.7){ok=true;break}
      if(!ok)continue;
      if(keep.some(k=>hasRect(k,x,z,1.2)))continue;
      const depth=Math.min(x+ARENA,ARENA-x,z+ARENA,ARENA-z);if(depth>7&&R()<.3)continue;
      if(near(x,z))continue;
      const p={x,z,s:.95+R()*.75,ry:R()*6.28,v:R()};pts.push(p);const k=key(x,z);let l=grid.get(k);if(!l){l=[];grid.set(k,l)}l.push(p);
    }
    buildForest(pts);
  }
  flushBulbs();

  /* ---- znajdźki (id stabilne!) ---- */
  placeCollectibles(level,[
    {id:'dk-kaseta-1',type:'kaseta',x:-35,z:22,name:'Zenek: Wesele w Remizie',hint:'za namiotem z piwem'},
    {id:'dk-kaseta-2',type:'kaseta',x:47.5,z:-39.4,name:'Akcent: Kukurydza i Ty',hint:'polana w labiryncie z kukurydzy'},
    {id:'dk-kaseta-3',type:'kaseta',x:-52.2,z:-50,name:'Boys: Stodoła Tonie w Basach',hint:'w stodole za belami'},
    {id:'dk-kaseta-4',type:'kaseta',x:-6.5,z:-28.4,name:'DJ Wiesiek: Dyskoteka do Rana',hint:'zaplecze DJ-a',secret:true},
    {id:'dk-lancuch-1',type:'lancuch',x:6.2,z:-24.2,name:'Złoty łańcuch spod sceny',value:70},
    {id:'dk-lancuch-2',type:'lancuch',x:-19.5,z:-43,name:'Łańcuch przy ognisku',value:80},
    {id:'dk-lancuch-3',type:'lancuch',x:-72.6,z:-12,name:'Łańcuch z polanki w lesie',value:110,secret:true},
    {id:'dk-lancuch-4',type:'lancuch',x:-58,z:-56,name:'Łańcuch z bimbrowni',value:140,secret:true},
    {id:'dk-klucz-1',type:'klucz',x:-29.5,z:-69.5,name:'Klucz do skrzynki: leśniczówka',secret:true},
    {id:'dk-klucz-2',type:'klucz',x:19,z:-71,name:'Klucz do skrzynki: ambona',secret:true},
    {id:'dk-plakat-1',type:'plakat',x:-8.6,z:-23.2,name:'Plakat: Dziś gra DJ Wiesiek, wstęp 5 zł',hint:'sala, przy scenie',value:30},
    {id:'dk-plakat-2',type:'plakat',x:17,z:67.5,name:'Plakat: Odjazdy PKS, kursuje w święta',hint:'przystanek PKS',value:30},
    {id:'dk-plakat-3',type:'plakat',x:71,z:51,name:'Plakat: Zaginął kogut Zdzisiek',hint:'kapliczka w lesie',value:30,secret:true},
  ]);

  /* ---- nawigacja AI: osłony z rekwizytów (kolejność kolizji: budynki i parking pierwsze, las ostatni) ---- */
  buildNav(level,{coverMax:30,coverMaxH:12,coverLimit:900,assign:true});
}

/* ------------------------------------------------------------------ zdarzenia poziomu: niebo, ambient, ukończenie */
let moonSky=null,amb=null,beatT=0,owlT=0;
function stopAmbient(){if(amb){for(const n of amb){try{n.src.stop()}catch(e){}try{n.g.disconnect()}catch(e){}}amb=null}}
function startAmbient(){
  stopAmbient();
  if(!AU.ctx||!AU.noise)return;
  try{
    amb=[];
    for(const [type,f,gain,q] of [['lowpass',210,.05,1],['bandpass',4800,.014,9]]){      // szum lasu + świerszcze
      const src=AU.ctx.createBufferSource();src.buffer=AU.noise;src.loop=true;
      const fl=AU.ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
      const g=AU.ctx.createGain();g.gain.value=gain;
      src.connect(fl);fl.connect(g);g.connect(AU.sfx||AU.master);src.start();amb.push({src,g});
      if(type==='bandpass'){const lfo=AU.ctx.createOscillator(),lg=AU.ctx.createGain();lfo.frequency.value=17;lg.gain.value=gain*.9;lfo.connect(lg);lg.connect(g.gain);lfo.start();amb.push({src:lfo,g:lg})}
    }
  }catch(e){amb=null}
  beatT=0;owlT=12;
}
/** Przytłumiony bas z sali (kick 128 BPM), głośniejszy blisko sali. */
function kick(vol){
  if(!AU.ctx||!AU.sfx&&!AU.master)return;
  try{
    const t=AU.ctx.currentTime,o=AU.ctx.createOscillator(),g=AU.ctx.createGain(),lp=AU.ctx.createBiquadFilter();
    o.type='sine';o.frequency.setValueAtTime(118,t);o.frequency.exponentialRampToValueAtTime(40,t+.13);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.24);lp.type='lowpass';lp.frequency.value=220;
    o.connect(g);g.connect(lp);lp.connect(AU.sfx||AU.master);o.start(t);o.stop(t+.26);
  }catch(e){}
}
function owl(){
  if(!AU.ctx||!AU.sfx&&!AU.master)return;
  try{
    const t=AU.ctx.currentTime;
    for(const [d,f] of [[0,392],[.55,349]]){
      const o=AU.ctx.createOscillator(),g=AU.ctx.createGain();o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.03,t+d+.08);g.gain.exponentialRampToValueAtTime(.0001,t+d+.45);
      o.connect(g);g.connect(AU.sfx||AU.master);o.start(t+d);o.stop(t+d+.5);
    }
  }catch(e){}
}
const here=()=>world.level&&world.level.id===ID;
DS.bus.on('levelLoad',e=>{if(e&&e.level===ID)mergeIntoZones()});
DS.bus.on('levelUnload',()=>{stopAmbient();cells=[];moonSky=null});
DS.bus.on('levelStart',()=>{
  if(!here())return;
  startAmbient();
  const G=S.G;if(G){G.levelWon=false;setTimeout(()=>{if(S.G===G&&here()){const st=collectStats(L);announce('WIEJSKA DYSKOTEKA W LESIE','Znajdźki '+st.found+'/'+st.total+'  |  3 sekrety')}},1800)}
});
DS.bus.on('levelEnd',stopAmbient);
DS.bus.on('update',dt=>{
  if(!here())return;
  if(moonSky)moonSky.position.copy(camera.position);
  cullForest();
  if(!amb||!S.G||S.G.paused)return;
  const P=DS.player.P,d=Math.hypot(P.pos.x,P.pos.z+17);
  beatT-=dt;if(beatT<=0){beatT=60/128;const v=.16*Math.pow(Math.max(0,1-d/75),1.6);if(v>.004)kick(v)}
  owlT-=dt;if(owlT<=0){owlT=22+Math.random()*25;owl()}
});
const winOnKill=({enemy:e})=>{
  const G=S.G;if(!G||!here()||!e||!e.boss||G.levelWon)return;       // boss z puli tabeli (Sołtys, DJ...) kończy poziom
  G.levelWon=true;
  save.coins+=L.win.reward.coins;save.keys+=L.win.reward.keys;G.earned+=L.win.reward.coins;G.keysFound+=L.win.reward.keys;
  save.levelsDone=save.levelsDone||{};save.levelsDone[ID]=true;persist();
  setTimeout(()=>{if(S.G===G)announce(L.win.text,'+'+L.win.reward.coins+' ZD i klucz. Gra toczy się dalej.')},1500);
  DS.bus.emit('levelComplete',{level:ID,wave:G.wave});
};
DS.bus.on('kill',winOnKill);DS.bus.on('netKill',winOnKill);   // co-op: boss zabity przez zdalnego gracza też kończy poziom (u hosta)
