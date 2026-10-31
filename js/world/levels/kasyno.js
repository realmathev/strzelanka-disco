// Poziom 3: Kasyno „Złoty Bandyta” (wnętrze, noc). Właściciel katalogu: ds-level-designer.
//
// Arena 75 m od środka (150 x 150 m = 22 500 m2, ok. 3,2x Remiza). Noc: granatowe niebo, księżyc, mgła tylko daleko; wnętrze pod dachem
// (cień dachu gasi „księżyc”, więc światło daje emisja: paski sufitowe, neony, kula disco, żarówki). +X = wschód, -Z = północ.
// Gracz startuje na parkingu (0,66), patrzy na północ w kierunku wejścia z neonem „ZŁOTY BANDYTA”.
//
//  PLAN (1 znak ~ 3 m; [..] = pomieszczenie, ( ) = otwór/wejście, * = sekret)
//   z=-75 ┌ podwórze: kontenery, beczki, Maluchy ─────────── tył ──────────────────────────────┐
//   z=-66 │ ┌──────────KUCHNIA───────────┬───────── ZAPLECZE ────────┬────────MAGAZYN────────┐ │
//         │ │ blaty, chłodnia*, winda A* │ regały │ SKARBIEC* │ regały│ regały, winda B*      │ │
//   z=-46 │ │ (drzwi z podwórza)         ├─ korytarz za sceną ──────┤ (drzwi z podwórza)    │ │
//   z=-40 │ ├──────(kuchnia↔bar)─────────┼─── scena DJ ─────────────┼───────(do VIP)────────┤ │
//         │ │ BAR: lada, półki, stoliki, │  PARKIET 12x12 + kula     │ LOŻE VIP, lustra,     │ │
//         │ │ zaplecze baru (drzwi)      │  disco (ARENA BOSSA)      │ poker prywatny        │ │
//   z=-2  │ ├────────────────────────────┤                          ├───────────────────────┤ │
//         │ │ SALA AUTOMATÓW (4x2 wyspy) │ hall ↔ sale (otwory)      │ STOŁY: ruletki,       │ │
//         │ │ kolumny z lustrami         ├───── (3 otwory) ──────────┤ blackjack, poker      │ │
//   z=6   │ │                            │ FOYER: kasa, automaty     │                       │ │
//   z=30  │ └──(boczne wejście)──────────┴───(WEJŚCIE 8 m)───────────┴──(boczne wejście)────┘ │
//         │  PARKING: 2 rzędy aut, aleje, wieże neonowe „777”/„JACKPOT”, daszek, START (0,66)   │
//   z=75  └─────────────────────────────────────────────────────────────────────────────────────┘
//   Pętla zewnętrzna: parking -> aleja zachodnia -> podwórze -> aleja wschodnia -> parking (drzwi boczne/tylne są otwarte).
//   Skróty: winda A (kuchnia) <-> winda B (magazyn) na klawisz E; drzwi kuchni/magazynu; korytarz za sceną łączy skrzydła.
//
// Wysokości: silnik ma płaską podłogę (y=0), więc piętra są wizualne: sufit 5 m, antresola VIP jako wysokie lustra/kolumny (osłony 3,2 m),
// kula disco na 3 m, lampy i szyldy na 7-20 m. Brak wchodzenia; szczegóły i prośby: docs/requests/ds-level-designer.md.
//
// Znajdźki: 14 (4 kasety, 4 złote łańcuchy, 2 klucze, 4 plakaty-easter eggi), 3 sekrety (skarbiec, chłodnia, windy), 8 beczek/butli,
// 6 automatów leczących. Boss fali 5: Jednooki Bandyta (parkiet), fala 10: DJ. Ukończenie poziomu: pokonanie Jednookiego.
import {DS} from '../../core/ds.js';
import {save,persist,opt} from '../../core/save.js';
import {S} from '../../core/state.js';
import {scene} from '../../render/renderer.js';
import {toon} from '../../render/materials.js';
import {groundTex} from '../../render/textures.js';
import {announce,addFloater} from '../../render/comicfx.js';
import {setTrack} from '../../audio/music.js';
import {A as AU} from '../../audio/context.js';
import {sfx} from '../../audio/sfx.js';
import {addBox} from '../build.js';
import {addPart} from '../batch.js';
import {world} from '../state.js';
import {setEnv,slab,boxB,room,slidingDoor,placeCollectibles,placeBarrels,healMachines,buildNav,collectStats,mergeIntoZones,facade} from './common.js';

const ID='kasyno',ARENA=75,PI=Math.PI,H=5,T=.8;
const put=(id,o)=>DS.props.get(id).place(o);
const COL={plum:0x34162e,wall:0x5b2038,wallB:0x4a2a1c,wallK:0xcfd4d0,wallS:0x77726a,gold:0xd9a82a,dark:0x1c1424,roof:0x4a3a5e,
  asphalt:0x2a2832,lot:0x34323c,red:0x8e1a2c,purple:0x3a2058,green:0x1a6040,wood:0x5a3a24,vip:0x5a2470,tile:0xbcc6c4,conc:0x6e6a60,steel:0x2e343a};
const VAR=['zloty','wisnie','siodemki'];

const L={
  id:ID,name:'Kasyno Złoty Bandyta',arena:ARENA,
  desc:'Noc w kasynie: parkiet z kulą disco, sala automatów, bar, loże VIP, kuchnia, zaplecze i skarbiec. Boss: Jednooki Bandyta na parkiecie.',
  spawn:{x:0,z:66,yaw:0},
  starts:[{x:0,z:66,yaw:0,name:'Parking'},{x:0,z:18,yaw:0,name:'Foyer'},{x:0,z:-4,yaw:0,name:'Hall'},{x:-46,z:-20,yaw:PI/2,name:'Bar'}],
  menuCam:{r:78,y:36,look:[0,2,-10]},
  track:'C',
  enemies:{caps:{snajper:2},boss:{every:5,pool:['boss_jednooki','boss_dj']}},
  spawnZones:[
    {id:'parkiet',x:0,z:-18,r:11,w:3,from:1},{id:'automaty',x:-48,z:14,r:12,w:3,from:1},{id:'stoly',x:48,z:14,r:12,w:2.5,from:1},
    {id:'parking-w',x:-38,z:50,r:10,w:1.5,from:1},{id:'parking-e',x:38,z:50,r:10,w:1.5,from:1},
    {id:'foyer',x:0,z:18,r:7,w:1.5,from:3},{id:'bar',x:-46,z:-22,r:10,w:2,from:2},{id:'vip',x:48,z:-22,r:10,w:2,from:2},
    {id:'kuchnia',x:-48,z:-54,r:8,w:1.5,from:3},{id:'magazyn',x:48,z:-54,r:8,w:1.5,from:4},{id:'zaplecze',x:-20,z:-56,r:5,w:1,from:5},
    {id:'podworze',x:0,z:-72.5,r:2.2,w:.8,from:6},{id:'scena',x:0,z:-22,r:10,w:1,from:1,boss:true},
  ],
  // Scenariusz fal: 1-2 gangsterzy z parkingu i sal; 3-4 dresy, bandyci z obrzynem; 5 BOSS Jednooki na parkiecie; 6-9 ochroniarze z tarczami, pijacy z baru;
  // 10 BOSS DJ; 11+ snajperzy z lóż VIP, kamikadze, medycy; 15 BOSS Jednooki.
  waves:{
    intro:'Godzina 23:50. Kasyno „Złoty Bandyta”. Kula disco się kręci, a Jednooki czeka na parkiecie.',
    plan:[{from:1,note:'gangsterzy z parkingu i sali automatów'},{from:3,note:'dresy, bandyci z obrzynem przy stołach'},
      {from:5,boss:'boss_jednooki',note:'Jednooki Bandyta wchodzi na parkiet; osłony: kolumny z lustrami, stoliki, scena'},{from:6,note:'ochroniarze z tarczami, pijacy z baru'},
      {from:10,boss:'boss_dj',note:'DJ na scenie'},{from:11,note:'snajperzy w lożach VIP, kamikadze, medycy'},{from:15,boss:'boss_jednooki'}],
    bossWave:5,bossArena:{x:0,z:-22,hw:18,hd:13,gates:[{x:-30,z:-32},{x:-30,z:-14},{x:30,z:-32},{x:30,z:-14},{x:-19,z:-40},{x:19,z:-40},{x:0,z:6}]},
  },
  win:{kind:'boss',boss:'boss_jednooki',reward:{coins:400,keys:1},text:'KASYNO WYCZYSZCZONE!'},
  secrets:[{id:'skarbiec',name:'Skarbiec'},{id:'chlodnia',name:'Chłodnia'},{id:'windy',name:'Windy A i B'}],
  build(){ buildKasyno(this) },
};
DS.levels.register(L);

/* ------------------------------------------------------------------ pomocnicy geometrii */
/** Ściana wzdłuż X na z=`z` od a do b; gaps: [[od,do]] to otwory (nadproże + złote słupki); lintel = wysokość nadproża. */
function wallX(z,a,b,{gaps=[],color=COL.wall,h=H,lintel=3.6,trim=true}={}){
  let c=a;
  for(const [g0,g1] of gaps.slice().sort((p,q)=>p[0]-q[0])){
    if(g0>c)addBox(g0-c,h,T,(c+g0)/2,0,z,{color});
    c=g1;
    if(h>lintel)addBox(g1-g0,h-lintel,T,(g0+g1)/2,lintel,z,{color},{collide:false});
    if(trim)for(const px of [g0-.15,g1+.15])addBox(.3,lintel,T+.2,px,0,z,{color:COL.gold},{collide:false,cast:false});
  }
  if(c<b)addBox(b-c,h,T,(c+b)/2,0,z,{color});
}
/** Ściana wzdłuż Z na x=`x` od a do b. */
function wallZ(x,a,b,{gaps=[],color=COL.wall,h=H,lintel=3.6,trim=true}={}){
  let c=a;
  for(const [g0,g1] of gaps.slice().sort((p,q)=>p[0]-q[0])){
    if(g0>c)addBox(T,h,g0-c,x,0,(c+g0)/2,{color});
    c=g1;
    if(h>lintel)addBox(T,h-lintel,g1-g0,x,lintel,(g0+g1)/2,{color},{collide:false});
    if(trim)for(const pz of [g0-.15,g1+.15])addBox(T+.2,lintel,.3,x,0,pz,{color:COL.gold},{collide:false,cast:false});
  }
  if(c<b)addBox(T,h,b-c,x,0,(c+b)/2,{color});
}
/** Emisyjny pasek (MeshBasic) pod sufitem. */
function strip(x0,x1,z0,z1,color,y=H-.07){
  addPart(new THREE.BoxGeometry(x1-x0,.06,z1-z0),new THREE.Matrix4().makeTranslation((x0+x1)/2,y,(z0+z1)/2),{color},{basic:true,cast:false,receive:false,ray:false,edges:false});
}
/** Pasek świetlny o podanym kolorze i gęstości: n równoległych pasków wzdłuż osi. */
function strips(x0,x1,z0,z1,n,color,axis='x'){
  for(let i=0;i<n;i++){
    const t=(i+.5)/n;
    if(axis==='x'){const z=z0+(z1-z0)*t;strip(x0+1,x1-1,z-.09,z+.09,color)}else{const x=x0+(x1-x0)*t;strip(x-.09,x+.09,z0+1,z1-1,color)}
  }
}
/** Łańcuch żarówek (InstancedMesh w world.bulbs: kolor przełącza animateWorld). */
function bulbs(list){
  const im=new THREE.InstancedMesh(new THREE.SphereGeometry(.13,6,4),new THREE.MeshBasicMaterial({color:0xffffff,fog:false}),list.length);
  const m=new THREE.Matrix4(),c=new THREE.Color(0xfff2a8);
  list.forEach(([x,y,z],i)=>{im.setMatrixAt(i,m.makeTranslation(x,y,z));im.setColorAt(i,c)});
  im.frustumCulled=false;im.raycast=()=>{};scene.add(im);world.bulbs.push(im);return im;
}

/* ------------------------------------------------------------------ powtarzalne układy */
let sk=0;
/** Wyspa automatów wzdłuż Z: dwa rzędy plecami do siebie, n sztuk po 0,66 m od zs. */
function islandZ(xc,zs,n,seed){
  for(let i=0;i<n;i++){
    const z=zs+.33+i*.66;
    put('automatBandyta',{x:xc-.35,z,rotY:-PI/2,variant:VAR[(i+seed)%3],seed:seed*31+i});
    put('automatBandyta',{x:xc+.35,z,rotY:PI/2,variant:VAR[(i+seed+1)%3],seed:seed*37+i});
  }
}
/** Rząd automatów wzdłuż Z przy ścianie (rotY: PI/2 = front na +X, -PI/2 = front na -X). */
function wallSlotsZ(x,zs,n,rotY,seed){
  for(let i=0;i<n;i++)put('automatBandyta',{x,z:zs+.33+i*.66,rotY,variant:VAR[(i+seed)%3],seed:seed*41+i});
}
const car=(id,x,z,r,c)=>put(id,{x,z,rotY:r,color:c});

function buildKasyno(level){
  /* ---- noc: granatowe niebo, mgła daleko, światło „księżyca” i ciepłe hemi pod dachem ---- */
  setEnv({sky:0x0b0a1e,fogNear:62,hemi:[0xd0b8ea,0x4a3a5e,1.0],sun:[0x8aa0ff,.55],sunDir:[-34,50,-26]});

  /* ---- teren: asfalt parkingu, podwórze ---- */
  const gt=groundTex.clone();gt.repeat.set(40,40);gt.needsUpdate=true;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,420),toon(0x4a4654,{map:gt}));ground.rotation.x=-PI/2;ground.receiveShadow=true;scene.add(ground);world.meshes.push(ground);
  slab(-ARENA,ARENA,-ARENA,ARENA,0,.03,COL.asphalt);
  slab(-ARENA,ARENA,31,ARENA,.03,.01,COL.lot);                                   // parking
  slab(-3.2,3.2,30.4,66,.04,.02,0x8e1426);                                       // czerwony dywan od wejścia
  slab(-3.5,-3.2,30.4,66,.06,.01,COL.gold);slab(3.2,3.5,30.4,66,.06,.01,COL.gold);
  for(const zz of [37.2,55.6])for(let x=-70;x<=70;x+=3.6){if(Math.abs(x)<10)continue;slab(x-.05,x+.05,zz-2.7,zz+2.7,.04,.005,0xe8e8dc)}   // linie miejsc
  slab(-ARENA,-66.5,-ARENA,31,.03,.01,0x3a3842);slab(66.5,ARENA,-ARENA,31,.03,.01,0x3a3842);slab(-ARENA,ARENA,-ARENA,-66.5,.03,.01,0x3a3842);   // aleje i podwórze

  /* ---- obwód: mur i panorama nocnego miasta ---- */
  const wall={color:0x3a3640},E=ARENA+.6;
  addBox(2*ARENA+4,3.8,1,0,0,-E,wall,{collide:false,cast:false});addBox(2*ARENA+4,3.8,1,0,0,E,wall,{collide:false,cast:false});
  addBox(1,3.8,2*ARENA+4,-E,0,0,wall,{collide:false,cast:false});addBox(1,3.8,2*ARENA+4,E,0,0,wall,{collide:false,cast:false});
  const cols=[0x2a2a44,0x33304a,0x3a2c46,0x28344a,0x2e2c40,0x40344a];
  const skyb=(x0,x1,z0,z1,h)=>facade(x0,x1,z0,z1,h,cols[sk++%cols.length],{collide:false,cast:false});
  for(let i=0;i<7;i++){const x=-72+i*24;skyb(x-8,x+8,-104,-92,24+(i*7)%20);skyb(x-8,x+8,92,104,22+(i*5)%22)}
  for(let i=0;i<7;i++){const z=-72+i*24;skyb(-104,-92,z-8,z+8,26+(i*9)%18);skyb(92,104,z-8,z+8,23+(i*4)%21)}
  const moon=new THREE.Mesh(new THREE.SphereGeometry(7,16,12),new THREE.MeshBasicMaterial({color:0xeef0ff,fog:false}));moon.position.set(70,86,-150);scene.add(moon);

  /* ---- budynek: podłogi pokoi ---- */
  slab(-30,30,6,30,.03,.01,COL.red);                                                // foyer
  slab(-66,-30,-2,30,.03,.01,COL.purple);slab(30,66,-2,30,.03,.01,COL.green);         // sala automatów, stoły
  slab(-30,30,-40,6,.03,.01,0x2a2040);                                              // hall z parkietem
  slab(-66,-30,-40,-2,.03,.01,COL.wood);slab(30,66,-40,-2,.03,.01,COL.vip);           // bar, VIP
  slab(-66,-30,-66,-40,.03,.01,COL.tile);slab(30,66,-66,-40,.03,.01,COL.conc);        // kuchnia, magazyn
  slab(-30,30,-66,-40,.03,.01,0x4a4650);slab(-8,8,-66,-46,.04,.01,COL.steel);       // zaplecze, skarbiec

  /* ---- dach (cień wnętrza) ---- */
  addPart(new THREE.BoxGeometry(135.2,.5,98.4),new THREE.Matrix4().makeTranslation(0,H+.25,-18),{color:COL.roof},{cast:false,receive:false,ray:false,edges:false});

  /* ---- ściany zewnętrzne ---- */
  wallX(30,-66.4,66.4,{color:COL.plum,gaps:[[-4,4],[-50,-46],[46,50]],trim:true});
  wallX(-66,-66.4,66.4,{color:COL.plum,gaps:[[-50,-46],[46,50]]});
  wallZ(-66,-66,30,{color:COL.plum,gaps:[[-24,-20]]});wallZ(66,-66,30,{color:COL.plum,gaps:[[-24,-20]]});
  // gzyms, attyka z szyldem i listwa LED na froncie
  addBox(135.2,.5,1.2,0,5.4,30.2,{color:COL.gold},{collide:false,cast:false});
  addBox(34,5.6,1.2,0,5.4,30,{color:0x24101e},{collide:false});
  addPart(new THREE.BoxGeometry(133,.14,.1),new THREE.Matrix4().makeTranslation(0,4.3,30.45),{color:0xff3b8b},{basic:true,cast:false,receive:false,ray:false,edges:false});
  addPart(new THREE.BoxGeometry(133,.14,.1),new THREE.Matrix4().makeTranslation(0,.4,30.45),{color:0x59d4ff},{basic:true,cast:false,receive:false,ray:false,edges:false});
  // daszek nad wejściem i słupki
  addBox(18,.3,7.4,0,4.4,34,{color:COL.gold},{collide:false});
  addPart(new THREE.BoxGeometry(17.6,.06,7),new THREE.Matrix4().makeTranslation(0,4.37,34),{color:0xfff0b0},{basic:true,cast:false,receive:false,ray:false,edges:false});
  for(const sx of [-8.6,8.6])addBox(.45,4.4,.45,sx,0,37.4,{color:COL.gold});
  bulbs([...Array(19).keys()].map(i=>[-9+i,4.2,37.8]));

  /* ---- ściany wewnętrzne: kolumny, stropy, pokoje ---- */
  wallZ(-30,6,30,{gaps:[[14,22]]});wallZ(30,6,30,{gaps:[[14,22]]});                 // foyer <-> sale (wewnątrz foyer)
  wallZ(-30,-2,6,{gaps:[[0,5]]});wallZ(30,-2,6,{gaps:[[0,5]]});                      // hall <-> sale
  wallZ(-30,-40,-2,{gaps:[[-37,-27],[-19,-9]]});wallZ(30,-40,-2,{gaps:[[-37,-27],[-19,-9]]});   // hall <-> bar / VIP
  wallZ(-30,-66,-40,{gaps:[[-54,-48]],color:COL.wallS});wallZ(30,-66,-40,{gaps:[[-54,-48]],color:COL.wallS});   // zaplecze <-> kuchnia / magazyn
  wallX(6,-30,30,{gaps:[[-9,9],[-27,-21],[21,27]]});                                 // foyer <-> hall
  wallX(-2,-66,-30,{gaps:[[-54,-48],[-38,-33]]});wallX(-2,30,66,{gaps:[[48,54],[33,38]]});     // sale <-> bar / VIP
  wallX(-40,-66,-30,{gaps:[[-52,-44]],color:COL.wallK});wallX(-40,30,66,{gaps:[[44,52]],color:COL.wallS});   // kuchnia / magazyn <-> bar / VIP
  wallX(-40,-30,30,{gaps:[[-22,-16],[16,22]]});                                      // ściana sceny
  // skarbiec: sekretne drzwi w ścianie korytarza
  wallZ(-8,-66,-46,{color:0x39434a,trim:false});wallZ(8,-66,-46,{color:0x39434a,trim:false});
  wallX(-46,-8,8,{color:0x39434a,gaps:[[-1.6,1.6]],lintel:3.4,trim:false});
  slidingDoor('x',-46,0,3.2,3.4,{secret:true,label:'SKARBIEC',color:0x8a949a,dir:1,thick:T*.6});

  /* ---- sufit: paski świetlne wg stref ---- */
  strips(-30,30,6,30,5,0xffd890);strips(-66,-30,-2,30,8,0xff4fd8,'z');strips(30,66,-2,30,8,0x59ff9c,'z');
  strips(-30,30,-40,6,4,0x7a3bff);strips(-66,-30,-40,-2,5,0xffa14a);strips(30,66,-40,-2,5,0xc07aff);
  strips(-66,-30,-66,-40,4,0xf4fbff);strips(30,66,-66,-40,4,0xcfe6ff);strips(-30,30,-66,-40,3,0xffe9b8);strips(-8,8,-66,-46,2,0xffd23a);

  /* ---- szyldy ---- */
  const neon=DS.props.get('neonSign');
  neon.place({text:'ZŁOTY BANDYTA',color:'#ffd23a',bg:'#2a0a24',w:24,h:4.6,x:0,y:8.3,z:30.7});
  neon.place({text:'KASYNO - DISCO',color:'#ff4fd8',bg:'#14061c',w:9,h:1.5,x:0,y:3.9,z:30.46});
  neon.place({text:'AUTOMATY 24H',color:'#43f0ff',bg:'#06202a',w:6,h:1.2,x:-48,y:4.25,z:30.46});
  neon.place({text:'STOŁY',color:'#37ff7a',bg:'#04180c',w:5,h:1.2,x:48,y:4.25,z:30.46});
  neon.place({text:'BAR 0-24',color:'#ffa14a',bg:'#240a06',w:5,h:1.2,x:-66.46,y:4.2,z:-22,rotY:-PI/2});
  neon.place({text:'VIP',color:'#c07aff',bg:'#14061c',w:4,h:1.2,x:66.46,y:4.2,z:-22,rotY:PI/2});
  neon.place({text:'DOSTAWA',color:'#f4fbff',bg:'#10161a',w:4.4,h:1,x:-48,y:4.0,z:-66.46,rotY:PI});
  neon.place({text:'PERSONEL',color:'#ffe14a',bg:'#2a1a06',w:4.4,h:1,x:48,y:4.0,z:-66.46,rotY:PI});
  neon.place({text:'AUTOMATY',color:'#ff4fd8',bg:'#14061c',w:6,h:1,x:-29.52,y:4.3,z:18,rotY:PI/2});
  neon.place({text:'STOŁY',color:'#37ff7a',bg:'#04180c',w:6,h:1,x:29.52,y:4.3,z:18,rotY:-PI/2});
  neon.place({text:'PARKIET',color:'#59d4ff',bg:'#06141c',w:8,h:1,x:0,y:4.3,z:6.46});
  neon.place({text:'BAR',color:'#ffa14a',bg:'#240a06',w:5,h:1.5,x:-29.52,y:3.95,z:-23,rotY:PI/2});
  neon.place({text:'VIP',color:'#c07aff',bg:'#14061c',w:5,h:1.5,x:29.52,y:3.95,z:-23,rotY:-PI/2});
  neon.place({text:'KUCHNIA',color:'#f4fbff',bg:'#10161a',w:5,h:1,x:-48,y:4.3,z:-39.56});
  neon.place({text:'MAGAZYN',color:'#ffe14a',bg:'#2a1a06',w:5,h:1,x:48,y:4.3,z:-39.56});
  neon.place({text:'DISCO POLO NON STOP',color:'#ff4fd8',bg:'#14061c',w:14,h:2.2,x:0,y:3.9,z:-39.55});
  const exit=DS.props.get('tablicaWyjscie');
  for(const [x,y,z,r] of [[0,3.7,29.6,PI],[-48,3.7,29.6,PI],[48,3.7,29.6,PI],[-48,3.7,-65.6,0],[48,3.7,-65.6,0],[-65.6,3.7,-22,PI/2],[65.6,3.7,-22,-PI/2]])exit.place({x,y,z,rotY:r});

  /* ---- parking: wieże neonowe, auta, latarnie, bariery ---- */
  for(const sx of [-26,26]){
    addBox(1.4,22,1.4,sx,0,38,{color:0x2a2030});
    addBox(.5,.3,.5,sx,22,38,{color:0xff2a2a},{collide:false});
  }
  neon.place({text:'777',color:'#ffd23a',bg:'#2a0a24',w:5.2,h:5.2,x:-26,y:17,z:38.8});neon.place({text:'777',color:'#ffd23a',bg:'#2a0a24',w:5.2,h:5.2,x:-26,y:17,z:37.2,rotY:PI});
  neon.place({text:'JACKPOT',color:'#43f0ff',bg:'#06202a',w:5.2,h:5.2,x:26,y:17,z:38.8});neon.place({text:'JACKPOT',color:'#43f0ff',bg:'#06202a',w:5.2,h:5.2,x:26,y:17,z:37.2,rotY:PI});
  const ids=['fiat126p','polonez','passatB5','zukA06'],cc=[0x15151a,0x7a1424,0xd9a82a,0xe8e8f0,0x2d3a8a,0x4a4a52,0x1d4a2a,0x6a1a5a];
  let k=0;
  for(const zz of [38.6,57.6])for(let x=-69;x<=69;x+=9){
    if(Math.abs(x)<12||(zz<45&&Math.abs(Math.abs(x)-26)<3.5))continue;
    k++;if((k*7)%5<2)continue;
    const jit=((k*13)%10)/10-.5;
    car(ids[k%4],x+jit*1.2,zz+jit*.8,(k%6===0)?PI:0,cc[k%cc.length]);
  }
  for(const [x,z,w,d] of [[-18,50,3.4,.9],[18,50,3.4,.9],[-48,48,.9,3.4],[48,48,.9,3.4],[-8,62,3.4,.9],[8,62,3.4,.9],[-62,66,3.4,.9],[62,66,3.4,.9]])put('barrier',{x,z,w,d});
  put('smietnik',{x:-70,z:72,variant:'kontener'});put('smietnik',{x:70,z:72,variant:'kontener'});put('hydrant',{x:-14,z:46,rotY:0});
  for(const [x,z] of [[-8,68],[8,68]])put('donica',{x,z,variant:'beton'});
  put('slupOgloszeniowy',{x:-9,z:44});
  DS.props.instance('lampaUliczna',[[-40,36],[40,36],[-40,52],[40,52],[-6,52],[6,52],[-62,44],[62,44],[-70,66],[70,66],[0,72]]
    .map(([x,z])=>({x,z,rotY:x<0?-PI/2:PI/2})),{seed:5,opts:{variant:'kobra'}});
  healMachines([{kind:'vending',x:-10,z:72.2,rotY:PI},{kind:'station',x:10,z:72.2,rotY:PI}]);

  /* ---- aleje boczne i podwórze (pętla zewnętrzna) ---- */
  car('zukA06',-71,-18,0,0x4a4a52);car('fiat126p',71,-40,0,0xd9a82a);car('polonez',-30,-71,PI/2,0xe8e8f0);
  put('smietnik',{x:-71.5,z:-32,variant:'kontener'});put('smietnik',{x:-71.5,z:-30,variant:'pojemnik'});put('smietnik',{x:71.5,z:-14,variant:'kontener'});
  put('smietnik',{x:-40,z:-71.5,variant:'kontener'});put('smietnik',{x:40,z:-71.5,variant:'kontener'});put('smietnik',{x:-56,z:-71.5,variant:'pojemnik'});
  for(const [x,z] of [[-70.5,-54],[-70.5,-53],[-71.5,-53.5],[70.5,-60],[71.5,-59],[8,-71],[9.2,-71.6]])put('crate',{x,z,s:1.6});
  for(const [x,z,w,d] of [[-71,-4,.9,3.4],[71,-30,.9,3.4],[0,-70,3.4,.9],[-20,-70.5,3.4,.9],[20,-70.5,3.4,.9],[71,24,.9,3.4],[-71,24,.9,3.4]])put('barrier',{x,z,w,d});
  DS.props.instance('lampaUliczna',[[-70,0],[70,-40],[-30,-71],[30,-71]].map(([x,z])=>({x,z,rotY:x<0?-PI/2:PI/2})),{seed:6,opts:{variant:'kobra'}});
  placeBarrels([{x:68,z:44},{x:69.2,z:44.4},{x:-72,z:-66},{x:-72,z:-64.9}]);

  /* ---- FOYER ---- */
  put('dywan',{x:0,z:18,y:.04,variant:'czerwony',w:10,d:14});
  put('kasaOkienko',{x:29.2,z:10,rotY:-PI/2});
  healMachines([{kind:'vending',x:-29.2,z:12,rotY:PI/2}]);
  wallSlotsZ(-29.2,22.8,8,PI/2,1);wallSlotsZ(29.2,22.8,8,-PI/2,2);wallSlotsZ(-29.2,7.2,3,PI/2,3);
  for(const [x,z] of [[-10,12],[10,12],[-10,25],[10,25]])put('kolumnaLustrzana',{x,z,seed:x+z});
  for(const [x,z,v] of [[-6,28.4,'palma'],[6,28.4,'palma'],[-26,7.5,'fikus'],[26,7.5,'fikus']])put('roslinaDonica',{x,z,variant:v});
  for(const x of [-14,14])put('zyrandol',{x,y:3.3,z:18,drop:1.0,seed:x});
  put('zyrandol',{x:0,y:3.3,z:18,drop:1.0,seed:9});
  put('kameraCCTV',{x:-29.5,y:3.2,z:28,rotY:PI/2});put('kameraCCTV',{x:29.5,y:3.2,z:28,rotY:-PI/2});
  put('gasnica',{x:-14,z:29.55,rotY:PI});put('gasnica',{x:14,z:29.55,rotY:PI});
  put('lawka',{x:-18,z:27,rotY:0,variant:'stal'});put('lawka',{x:18,z:27,rotY:0,variant:'stal'});

  /* ---- SALA AUTOMATÓW (zachód) ---- */
  for(const xc of [-60,-52,-44,-36]){islandZ(xc,2.4,7,Math.round(-xc));islandZ(xc,16.8,7,Math.round(-xc)+3)}
  for(const [x,z] of [[-56,12.5],[-48,12.5],[-40,12.5],[-33,12.5]])put('kolumnaLustrzana',{x,z,seed:x});
  for(const x of [-64,-60,-56,-46,-42])put('scianaLustra',{x,z:-1.5,rotY:0,seed:x});
  put('kanapaLoza',{x:-64.6,z:10,rotY:PI/2,variant:'kanapa'});put('kanapaLoza',{x:-64.6,z:14.5,rotY:PI/2,variant:'kanapa'});
  put('roslinaDonica',{x:-64,z:28,variant:'palma'});put('roslinaDonica',{x:-64,z:0,variant:'fikus'});put('roslinaDonica',{x:-32,z:28,variant:'fikus'});
  put('zyrandol',{x:-48,y:3.2,z:12.5,drop:1.0,seed:-48});
  put('kameraCCTV',{x:-65.5,y:3.3,z:1,rotY:PI/2});put('gasnica',{x:-38,z:29.55,rotY:PI});
  neon.place({text:'JACKPOT 777',color:'#ffd23a',bg:'#2a0a24',w:9,h:1.6,x:-65.52,y:3.6,z:20,rotY:PI/2});

  /* ---- STOŁY DO GRY (wschód) ---- */
  for(const x of [38,46,54,62])put('stolRuletki',{x,z:4,rotY:0,seed:x});
  for(const x of [40,52,62])put('stolKarciany',{x,z:12.5,rotY:0,variant:'blackjack',seed:x});
  for(const x of [43,57])put('stolKarciany',{x,z:23,rotY:PI,variant:'poker',seed:x});
  wallSlotsZ(65.2,5,6,-PI/2,5);wallSlotsZ(65.2,24,8,-PI/2,6);
  for(const [x,z] of [[48,8.5],[48,17.5],[34,9],[34,27],[64,19]])put('kolumnaLustrzana',{x,z,seed:x+z});
  for(const x of [40,44,56,60,64])put('scianaLustra',{x,z:-1.5,rotY:0,seed:x});
  for(const [x,z] of [[40,6.5],[58,17.5]])put('stolikKoktajlowy',{x,z,seed:x});
  put('roslinaDonica',{x:64,z:0,variant:'palma'});put('roslinaDonica',{x:32,z:28,variant:'palma'});put('roslinaDonica',{x:64,z:28,variant:'fikus'});
  put('zyrandol',{x:50,y:3.2,z:12.5,drop:1.0,seed:3});
  put('kameraCCTV',{x:65.5,y:3.3,z:1,rotY:-PI/2});put('gasnica',{x:38,z:29.55,rotY:PI});
  neon.place({text:'TURNIEJ POKERA',color:'#37ff7a',bg:'#04180c',w:9,h:1.6,x:65.52,y:3.6,z:15,rotY:-PI/2});

  /* ---- HALL: parkiet, kula disco, scena DJ-a (arena bossa) ---- */
  put('parkiet',{x:0,y:.04,z:-22,w:12,d:12,seed:4});
  put('scenaDJ',{x:0,z:-38.4,rotY:0});
  bulbs([...Array(15).keys()].map(i=>[-7+i,3.2,-37.2]));
  const ballP=DS.props.get('kulaDisco').make({drop:.6});ballP.position.set(0,3.0,-22);scene.add(ballP);L._ball=ballP;
  for(const [x,z] of [[-11,-31],[11,-31],[-11,-13],[11,-13],[-22,-4],[22,-4],[-5,-4],[5,-4]])put('kolumnaLustrzana',{x,z,seed:x+z});
  for(const [x,z] of [[-9,-24],[9,-24],[-15,-9],[15,-9],[-16,-33],[16,-33]])put('stolikKoktajlowy',{x,z,seed:x+z});
  for(const x of [-19,-15,-11,11,15,19])put('scianaLustra',{x,z:5.5,rotY:PI,seed:x});
  for(const z of [-25,-21]){put('scianaLustra',{x:-29.5,z,rotY:PI/2,seed:z});put('scianaLustra',{x:29.5,z,rotY:-PI/2,seed:z+1})}
  put('kanapaLoza',{x:-28.9,z:-5,rotY:PI/2,variant:'kanapa'});put('kanapaLoza',{x:28.9,z:-5,rotY:-PI/2,variant:'kanapa'});
  
  for(const [x,z] of [[-24,-37],[24,-37]])put('roslinaDonica',{x,z,variant:'palma'});
    for(const [x,z] of [[-14,-22],[14,-22]])put('zyrandol',{x,y:3.3,z,drop:1.0,seed:x+1});
  put('kameraCCTV',{x:-29.5,y:3.4,z:3,rotY:PI/2});put('kameraCCTV',{x:29.5,y:3.4,z:3,rotY:-PI/2});
  // reflektory: stożki światła nad parkietem (jeden InstancedMesh, ruszane w update)
  const bg=new THREE.CylinderGeometry(.12,1.5,5,12,1,true);bg.translate(0,-2.5,0);
  const bm=new THREE.InstancedMesh(bg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}),8);
  const bc=new THREE.Color();[0xff3b8b,0x59d4ff,0xffe14a,0xa855ff,0x3bff9c,0xff6a3b,0xff3b8b,0x59d4ff].forEach((c,i)=>bm.setColorAt(i,bc.set(c)));
  bm.frustumCulled=false;bm.raycast=()=>{};scene.add(bm);L._beams=bm;
  healMachines([{kind:'vending',x:-29.2,z:-3.6,rotY:PI/2}]);

  /* ---- BAR (zachód, środek) ---- */
  for(let i=0;i<4;i++)put('barLada',{x:-59.6,z:-37.9+i*3.6,rotY:PI/2,seed:i+1});
  for(let i=0;i<4;i++)put('barPolki',{x:-65.35,z:-37.9+i*3.6,rotY:PI/2,seed:i+5});
  DS.props.instance('stolekBarowy',[0,1,2,3,4].map(i=>({x:-58.3,z:-37.8+i*3.1})),{seed:3});
  for(const [x,z] of [[-50,-34],[-50,-24],[-42,-30],[-42,-20],[-52,-12],[-44,-7]])put('stolikKoktajlowy',{x,z,seed:x+z});
  for(const [x,z] of [[-36,-39.1],[-33,-39.1]])put('kanapaLoza',{x,z,rotY:0,variant:'kanapa'});
  for(const [x,z] of [[-52,-18],[-40,-25],[-45,-8],[-36,-14]])put('kolumnaLustrzana',{x,z,seed:x+z});
  put('kanapaLoza',{x:-64.8,z:-9,rotY:PI/2,variant:'kanapa'});
  put('zyrandol',{x:-44,y:3.3,z:-18,drop:1.0,seed:-44});
  healMachines([{kind:'station',x:-65.2,z:-13,rotY:PI/2}]);
  put('kameraCCTV',{x:-29.5,y:3.3,z:-38,rotY:PI/2});put('gasnica',{x:-65.5,z:-5,rotY:PI/2});

  /* ---- LOŻE VIP (wschód, środek) ---- */
  for(const z of [-37,-32,-14,-9])put('kanapaLoza',{x:63.6,z,rotY:-PI/2,variant:'loza',seed:z});
  for(const x of [34,38,42,56,60,64])put('scianaLustra',{x,z:-39.5,rotY:0,seed:x});
  put('stolKarciany',{x:42,z:-21,rotY:0,variant:'poker',seed:7});
  for(const [x,z] of [[38,-10],[50,-30],[52,-7],[44,-35]])put('kolumnaLustrzana',{x,z,seed:x+z});
  for(const [x,z] of [[56,-27],[56,-17],[50,-14]])put('stolikKoktajlowy',{x,z,seed:x+z});
  put('dywan',{x:48,z:-22,y:.04,variant:'granat',w:8,d:6});
  put('zyrandol',{x:48,y:3.3,z:-22,drop:1.0,seed:5});
  healMachines([{kind:'vending',x:65.2,z:-3.5,rotY:-PI/2}]);
  put('kameraCCTV',{x:65.5,y:3.3,z:-38,rotY:-PI/2});put('gasnica',{x:65.5,z:-5,rotY:-PI/2});
  put('roslinaDonica',{x:32.5,z:-38,variant:'fikus'});put('roslinaDonica',{x:32.5,z:-4,variant:'palma'});

  /* ---- KUCHNIA (północny zachód) ---- */
  const blat=(x,z,r,v)=>put('blatKuchenny',{x,z,rotY:r,variant:v,seed:x+z});
  for(const [x,v] of [[-57,'blat'],[-54.6,'zlew'],[-52.2,'blat'],[-43.6,'blat'],[-41.2,'zlew'],[-38.8,'blat']])blat(x,-65.3,0,v);
  for(const x of [-36.2,-35.5,-34.8])put('kuchenka',{x,z:-65.3,rotY:0,seed:x});
  put('lodowka',{x:-33.2,z:-65.2,rotY:0});put('lodowka',{x:-32.3,z:-65.2,rotY:0});put('lodowka',{x:-31.1,z:-61.5,rotY:-PI/2});put('lodowka',{x:-31.1,z:-60.6,rotY:-PI/2});
  blat(-58,-53.4,0,'blat');blat(-55.6,-53.4,0,'blat');blat(-58,-52.2,PI,'zlew');blat(-55.6,-52.2,PI,'blat');
  blat(-40,-55.4,0,'blat');blat(-37.6,-55.4,0,'blat');blat(-40,-54.2,PI,'blat');blat(-37.6,-54.2,PI,'zlew');
  for(const [x,z,r] of [[-37,-41.2,PI],[-34,-41.2,PI],[-50,-60,0],[-45,-48,PI/2]])put('regalMagazynowy',{x,z,rotY:r,seed:x});
  put('wozekMagazynowy',{x:-44,z:-58,rotY:.4,seed:2});put('wozekMagazynowy',{x:-48,z:-43,rotY:PI/2});
  for(const [x,z,y] of [[-32.2,-45.6,0],[-32.2,-44.2,0]])put('crate',{x,z,s:1.2,y});
  healMachines([{kind:'vending',x:-31,z:-58,rotY:-PI/2}]);
  placeBarrels([{x:-33.4,z:-57.2},{x:-33.2,z:-56.1}]);
  put('kameraCCTV',{x:-65.5,y:3.3,z:-50,rotY:PI/2});put('gasnica',{x:-65.5,z:-60,rotY:PI/2});
  // chłodnia (sekret 2): pokój w rogu, drzwi na E
  room({x0:-65.6,x1:-57.6,z0:-48,z1:-40.4,h:3.2,wall:0x8fa6ac,roof:0x2a3438,floor:0x9fb4ba,light:0xcfe8ff,
    door:{side:'e',c:-44.2,w:2.4,h:2.5,secret:true,label:'CHŁODNIA',dir:1}});
  for(const [x,z] of [[-64.2,-46.7],[-62.5,-46.7],[-64.2,-41.7]])put('skrzynkaAlkohol',{x,z,seed:x+z});
  put('regalMagazynowy',{x:-61,z:-47.1,rotY:0,seed:5});put('lodowka',{x:-64.9,z:-44,rotY:PI/2});
  placeBarrels([{x:-60.2,z:-41.9}]);
  neon.place({text:'-18 C',color:'#cfe8ff',bg:'#10202a',w:2.4,h:.8,x:-57.1,y:2.8,z:-47.3,rotY:PI/2});

  /* ---- MAGAZYN (północny wschód) ---- */
  for(const x of [36,44,52]){put('regalMagazynowy',{x,z:-57,rotY:0,seed:x});put('regalMagazynowy',{x,z:-56.5,rotY:PI,seed:x+1})}
  for(const x of [40,48,56]){put('regalMagazynowy',{x,z:-49,rotY:0,seed:x+2});put('regalMagazynowy',{x,z:-48.5,rotY:PI,seed:x+3})}
  for(const [x,z,y] of [[62,-55,0],[63.7,-55,0],[62.8,-55,1.6],[60,-45,0],[61.7,-45,0],[34,-62,0],[35.7,-62,0],[34.8,-62,1.6]])put('crate',{x,z,s:1.6,y});
  put('wozekMagazynowy',{x:56,z:-62,rotY:.3,seed:4});put('wozekMagazynowy',{x:58,z:-43,rotY:-.5,seed:5});
  DS.props.instance('skrzynkaAlkohol',[[64.5,-62],[64.5,-61.4],[64.5,-60.8]].map(([x,z],i)=>({x,z,y:i*.4})),{seed:2});
  healMachines([{kind:'station',x:65.2,z:-46,rotY:-PI/2}]);
  placeBarrels([{x:65,z:-52},{x:65,z:-50.9}]);
  put('kameraCCTV',{x:65.5,y:3.3,z:-50,rotY:-PI/2});put('gasnica',{x:65.5,z:-44,rotY:-PI/2});

  /* ---- ZAPLECZE: skrzydła i korytarz za sceną ---- */
  for(const [x,z,r] of [[-24,-62,0],[-18,-62,0],[-24,-50,PI],[-14,-52,PI/2]])put('regalMagazynowy',{x,z,rotY:r,seed:x+z});
  for(const [x,z,r] of [[24,-62,0],[18,-62,0],[24,-50,PI],[14,-52,-PI/2]])put('regalMagazynowy',{x,z,rotY:r,seed:x+z+1});
  put('wozekMagazynowy',{x:-14,z:-58,rotY:.8,seed:6});put('wozekMagazynowy',{x:14,z:-58,rotY:-.8,seed:7});
  for(const [x,z,y] of [[-28,-44,0],[-26.3,-44,0],[28,-44,0],[26.3,-44,0],[27.2,-44,1.6]])put('crate',{x,z,s:1.6,y});
  for(const [x,z] of [[-28,-64],[-26.3,-64],[28,-64],[26.3,-64]])put('crate',{x,z,s:1.6});
  put('kameraCCTV',{x:-10,y:3.4,z:-45.6,rotY:0});put('kameraCCTV',{x:10,y:3.4,z:-45.6,rotY:0});
  put('gasnica',{x:-29.55,z:-43,rotY:PI/2});put('gasnica',{x:29.55,z:-43,rotY:-PI/2});

  /* ---- SKARBIEC (sekret 1) ---- */
  put('drzwiSejfu',{x:0,z:-65.2,rotY:0,variant:'otwarte'});
  put('sejfKrata',{x:-5,z:-60.5,rotY:0});put('sejfKrata',{x:5.5,z:-56,rotY:PI});
  for(const [x,z,y] of [[-6.8,-51.5,0],[-5.1,-51.5,0],[-6,-51.5,1.6],[6.8,-62,0],[6.8,-63.7,0]])put('crate',{x,z,s:1.6,y});
  put('dywan',{x:0,z:-52,y:.05,variant:'zielony',w:5,d:4});
  put('kameraCCTV',{x:7.5,y:3.6,z:-47,rotY:-PI/2});

  /* ---- WINDY A i B (sekret 3): skrót kuchnia <-> magazyn ---- */
  placeLift(-62,-64.6,0);placeLift(62,-64.6,0);level._lifts=lifts;                  // do testów (tests/kasyno.js)
  neon.place({text:'WINDA A',color:'#ff4a2a',bg:'#10060a',w:2.2,h:.6,x:-62,y:3.2,z:-62.9});neon.place({text:'WINDA B',color:'#ff4a2a',bg:'#10060a',w:2.2,h:.6,x:62,y:3.2,z:-62.9});

  /* ---- znajdźki (id stabilne!) ---- */
  placeCollectibles(level,[
    {id:'ks-kaseta-1',type:'kaseta',x:25.5,z:26.5,name:'Zenek: Szczęśliwa Siódemka',hint:'foyer, za automatami'},
    {id:'ks-kaseta-2',type:'kaseta',x:-63.5,z:.6,name:'Akcent: Kasyno Miłości',hint:'sala automatów, narożnik'},
    {id:'ks-kaseta-3',type:'kaseta',x:61.5,z:-27,name:'Weekend: Złote Karty',hint:'między lożami VIP'},
    {id:'ks-kaseta-4',type:'kaseta',x:2,z:-52,name:'Boys: Skarbiec Disco',hint:'skarbiec',secret:true},
    {id:'ks-lancuch-1',type:'lancuch',x:-33,z:26.5,name:'Złoty łańcuch spod automatu',value:80},
    {id:'ks-lancuch-2',type:'lancuch',x:66.5,z:68,name:'Łańcuch spod limuzyny',value:80},
    {id:'ks-lancuch-3',type:'lancuch',x:16,z:-43,name:'Łańcuch zza sceny',value:90},
    {id:'ks-lancuch-4',type:'lancuch',x:-2,z:-62.5,name:'Łańcuch ze skarbca',value:150,secret:true},
    {id:'ks-klucz-1',type:'klucz',x:-63.5,z:-43.5,name:'Klucz do skrzynki: chłodnia',secret:true},
    {id:'ks-klucz-2',type:'klucz',x:62,z:-65.1,name:'Klucz do skrzynki: winda B',secret:true},
    {id:'ks-plakat-1',type:'plakat',x:63.4,z:1.8,name:'Plakat: Wielki Turniej Pokera (wpisowe 5 zł)',hint:'sala stołów',value:30},
    {id:'ks-plakat-2',type:'plakat',x:-70,z:-69.5,name:'Plakat: Sylwester z DJ Wojtkiem',hint:'podwórze za kuchnią',value:30},
    {id:'ks-plakat-3',type:'plakat',x:-62.5,z:-6.5,name:'Plakat: Zakaz wnoszenia własnego alkoholu',hint:'zaplecze baru',value:30},
    {id:'ks-plakat-4',type:'plakat',x:34,z:-64.2,name:'Plakat: Kontrola sanepidu, wszystko OK',hint:'magazyn',value:30},
  ]);

  /* ---- nawigacja AI: osłony z rekwizytów (bez ścian), siatka z colliderów ---- */
  buildNav(level,{coverMax:12,coverMaxH:4.2,coverLimit:520});
}

/* ------------------------------------------------------------------ windy */
const lifts=[];let ride=null,tBeams=0;
const ZD=.68;
function placeLift(x,z,rotY){
  const stub=put('winda',{x,z,rotY}),u=stub.userData;
  const lf={x,z,rotY,c:Math.cos(rotY),s:Math.sin(rotY),L:u.doorL,R:u.doorR,col:u.doorCol,t:0,target:0};
  if(lf.col)lf.col0=Object.assign({},lf.col);
  lifts.push(lf);return lf;
}
const loc=(lf,P,o={})=>{const dx=P.pos.x-lf.x,dz=P.pos.z-lf.z;o.lx=dx*lf.c-dz*lf.s;o.lz=dx*lf.s+dz*lf.c;return o};
const inCab=l=>Math.abs(l.lx)<.8&&l.lz>-.72&&l.lz<.6;
const atDoor=l=>Math.abs(l.lx)<1.5&&l.lz>ZD+.1&&l.lz<ZD+2.8;
function resetLifts(){for(const lf of lifts){lf.t=lf.target=0;if(lf.col){lf.col.x0=lf.col0.x0;lf.col.x1=lf.col0.x1}lf.L.position.x=lf.R.position.x=0}ride=null}
let hintT=0;
const T0=new THREE.Vector3(),_lo={};

/* ------------------------------------------------------------------ zdarzenia poziomu: ambient, światła, windy, ukończenie */
let amb=null;
function stopAmbient(){if(amb){for(const n of amb){try{n.src.stop()}catch(e){}try{n.g.disconnect()}catch(e){}}amb=null}}
function startAmbient(){
  stopAmbient();
  if(!AU.ctx||!AU.noise)return;
  try{
    amb=[];
    for(const [type,f,gain] of [['lowpass',240,.07],['bandpass',700,.022]]){   // dudnienie basu zza ścian + gwar sali
      const src=AU.ctx.createBufferSource();src.buffer=AU.noise;src.loop=true;
      const fl=AU.ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;
      const g=AU.ctx.createGain();g.gain.value=gain;
      src.connect(fl);fl.connect(g);g.connect(AU.sfx||AU.master);src.start();amb.push({src,g});
    }
  }catch(e){amb=null}
}
const here=()=>world.level&&world.level.id===ID;
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s1=new THREE.Vector3(1,1,1);
DS.bus.on('levelLoad',e=>{if(e&&e.level===ID)mergeIntoZones()});
DS.bus.on('levelUnload',()=>{lifts.length=0;ride=null;L._ball=null;L._beams=null});
DS.bus.on('levelStart',()=>{
  if(!here())return;
  resetLifts();
  if(L.track&&opt.track==='A')setTrack(L.track,false);
  startAmbient();
  const G=S.G;if(G){G.levelWon=false;setTimeout(()=>{if(S.G===G&&here()){const st=collectStats(L);announce('KASYNO ZŁOTY BANDYTA','Znajdźki '+st.found+'/'+st.total+'  |  3 sekrety')}},1800)}
});
DS.bus.on('levelEnd',()=>{stopAmbient();resetLifts()});
DS.bus.on('levelUnload',stopAmbient);
DS.bus.on('update',dt=>{
  if(!here())return;
  // kula disco i reflektory
  if(L._ball)L._ball.rotation.y+=dt*.9;
  const bm=L._beams;
  if(bm){
    tBeams+=dt;
    for(let i=0;i<bm.count;i++){
      const a=i/bm.count*PI*2,px=Math.cos(a)*4.5,pz=-22+Math.sin(a)*4.5;
      _e.set(Math.sin(tBeams*.9+i*1.7)*.55,0,Math.cos(tBeams*.7+i*1.3)*.55);_q.setFromEuler(_e);_p.set(px,H-.1,pz);
      bm.setMatrixAt(i,_m.compose(_p,_q,_s1));
    }
    bm.instanceMatrix.needsUpdate=true;
  }
  // windy
  const G=S.G,P=DS.player.P;
  for(const lf of lifts){
    lf.t+=(lf.target-lf.t)*Math.min(1,dt*4);
    lf.L.position.x=-.55*lf.t*.98;lf.R.position.x=.55*lf.t*.98;
    if(lf.col){const open=lf.t>.6;lf.col.x0=lf.col0.x0+(open?1e5:0);lf.col.x1=lf.col0.x1+(open?1e5:0)}
  }
  if(ride){
    P.vel.set(0,0,0);P.pos.x=ride.px;P.pos.z=ride.pz;ride.t-=dt;
    if(ride.t<=0){
      const o=ride.to;P.pos.x=o.x-.05*o.s;P.pos.z=o.z-.05*o.c;P.yaw=o.rotY+PI;P.pitch=0;P.vel.set(0,0,0);
      o.target=1;ride=null;sfx('key');addFloater('WINDA',{world:T0.set(P.pos.x,2.2,P.pos.z).clone(),size:22,life:1.2,color:'#ffe14a',vy:-18});
    }
    return;
  }
  hintT-=dt;
  if(G&&!G.dead&&hintT<=0){
    for(const lf of lifts){const l=loc(lf,P,_lo);
      if(inCab(l)||atDoor(l)){hintT=1.6;addFloater((inCab(l)&&lf.t>.8?'JAZDA':'WINDA')+'  ['+DS.input.keyFor('use')+']',{world:T0.set(lf.x+ZD*lf.s,1.7,lf.z+ZD*lf.c).clone(),size:20,life:1.3,color:'#ffe14a',vy:-18});break}}
  }
});
addEventListener('keydown',e=>{
  if(e.repeat||!DS.input.matches('use',e.code))return;
  const G=S.G;if(S.mode!=='game'||!G||G.paused||G.dead||!here()||ride||!lifts.length)return;
  const P=DS.player.P;
  for(const lf of lifts){
    const l=loc(lf,P,_lo);
    if(inCab(l)){
      if(lf.t>.8&&lifts.length>1){const o=lifts.find(q=>q!==lf);lf.target=0;o.target=0;ride={to:o,t:1.3,px:P.pos.x,pz:P.pos.z};sfx('tick',420)}
      else{lf.target=lf.target?0:1;sfx('tick',lf.target?700:500)}
      return;
    }
    if(atDoor(l)){lf.target=lf.target?0:1;sfx('tick',lf.target?700:500);return}
  }
});
DS.bus.on('kill',({enemy:e})=>{
  const G=S.G;if(!G||!here()||!e||e.type!==L.win.boss||G.levelWon)return;
  G.levelWon=true;
  save.coins+=L.win.reward.coins;save.keys+=L.win.reward.keys;G.earned+=L.win.reward.coins;G.keysFound+=L.win.reward.keys;
  save.levelsDone=save.levelsDone||{};save.levelsDone[ID]=true;persist();
  setTimeout(()=>{if(S.G===G)announce(L.win.text,'+'+L.win.reward.coins+' ZD i klucz. Gra toczy się dalej.')},1500);
  DS.bus.emit('levelComplete',{level:ID,wave:G.wave});
});
