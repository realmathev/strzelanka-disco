// Poziom 6 (ostatni): Stacja paliw „PALIWEX” i autostrada (późny wieczór, pomarańczowe niebo). Właściciel katalogu: ds-level-designer.
//
// Arena 78 m od środka (156 x 156 m = 24 336 m2, ok. 3,45x Remiza). +X = wschód (prawo na planie), -Z = północ (góra planu). Gracz startuje na dojeździe (0,72) i patrzy na północ:
// w oddali pylon cenowy i maszt neonowy PALIWEX, za nimi wiata stacji z dystrybutorami i sklep z wnętrzem (centrum, plac bossa).
//
//  PLAN (1 znak ~ 3 m; [..] = budynek, T = naczepa TIR, | = autostrada, # = ekran/bariera (granica), * = sekret, G = brama auto, B = boss)
//  z=-78 ## pole / nieużytek: drzewa, bele, przyczepa, billboard ###  [bunkier*]  ###  północna droga polna  ######  A  ###
//  z=-60 #  krzaki  stogi        pacholki / budowa zjazdu                 billboard disco polo →  |  A4  |  jelcz   #
//  z=-44 #  ═══ droga dojazdowa do wiaduktu ══════════════════════════ ═══ [ W I A D U K T ] ══════ |  autobus |     #
//  z=-26 #  [kanał*]                 ┌── zbiorniki / skład paliw (G) ──┐   billboard Zdzicha → |  |  rozbite auta  #
//  z=-8  #  [WARSZTAT]  opony  |  [zaplecze*] [   S K L E P   PALIWEX   ]  [MOP: wiaty, toi-toi, BAR U ZDZICHA]     #
//  z=+10 #   podwórko    kompresor        plac przed wiatą (B: Szef Stacji, kałuże paliwa, osłony)           bariera  #
//  z=+18 #  [MYJNIA]    [  W I A T A  +  4 dystrybutory, auta przy pompach  ]    kebab | ciężarówka  | |  bramownica #
//  z=+34 #  złomowisko        pylon        ┌── PARKING TIR (labirynt naczep, 3 wejścia) ──┐                 #
//  z=+52 #  stare auta        maszt neon   └────────────────────────────────────────────────┘ wjazd na A4 #
//  z=+66 # ════════════════ droga dojazdowa (Maluchy, pachołki) ════════════════════════════════════════════ #
//  z=+72 #     START (0,72): automaty leczące, neon na maszcie; ekrany akustyczne dookoła                       #
//  Wysokości: silnik ma płaską podłogę, więc „piętra” są wizualne (wiadukt 6 m, wiata 4,8 m, pylon 6 m, maszt 17 m, billboardy 6 m, latarnie 11 m). Pętle: dojazd -> parking TIR -> MOP ->
//  plac stacji -> warsztat -> dojazd; autostrada (dwie jezdnie, przerwy w barierach) -> pole -> droga zachodnia. Skróty: przerwy serwisowe w barierach, brama składu paliw, pod wiaduktem.
//  Zaułki: za sklepem (zaplecze), za warsztatem (kanał), pomiędzy naczepami, złomowisko, krzaki na polu.
//
// Znajdźki: 13 (4 kasety, 4 złote łańcuchy, 2 klucze, 3 plakaty), 3 sekrety (E: zaplecze sklepu, kanał w warsztacie, bunkier na polu), brama automatyczna składu paliw,
// 5 grup beczek wybuchowych (14 sztuk), 7 automatów leczących. Boss fali 5: Szef Stacji (pula tabeli) na placu pod wiatą. Ukończenie: pokonanie bossa (ostatni poziom: ekran bez „Dalej”).
import {DS} from '../../core/ds.js';
import {save,persist} from '../../core/save.js';
import {S} from '../../core/state.js';
import {scene,camera} from '../../render/renderer.js';
import {toon,noRay} from '../../render/materials.js';
import {groundTex} from '../../render/textures.js';
import {announce} from '../../render/comicfx.js';
import {A as AU} from '../../audio/context.js';
import {addBox} from '../build.js';
import {addPart} from '../batch.js';
import {world} from '../state.js';
import {setEnv,slab,fence,room,slidingDoor,placeCollectibles,placeBarrels,healMachines,buildNav,collectStats,mergeIntoZones} from './common.js';

const ID='stacja',ARENA=78,PI=Math.PI;
const put=(id,o)=>DS.props.get(id).place(o);
/** Instancing rekwizytu; instancje trafialne raycastem (bez konturów) idą do world.meshes, żeby kule nie przenikały przez bariery i ekrany. */
function inst(id,list,o){
  const g=DS.props.instance(id,list,o);
  for(const c of g.children){if(o&&o.noCast)c.castShadow=false;if(c.isInstancedMesh&&c.raycast!==noRay&&!(o&&o.noRay))world.meshes.push(c)}
  return g;
}
const C={grass:0x7d7440,dry:0x8a7c48,asph:0x3f4044,apron:0x77746d,lot:0x36373b,conc:0x8d8a82,mop:0x6f6d66,yard:0x7a766c,dirt:0x7c6a46,steel:0x4b5058,screen:0x7f9a6a};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

/* ------------------------------------------------------------------ definicja poziomu */
const L={
  id:ID,name:'Stacja paliw i autostrada',arena:ARENA,
  desc:'Późny wieczór nad A4: stacja PALIWEX z wiatą i sklepem, MOP z parkingiem TIR-ów (labirynt naczep), warsztat, myjnia, Bar u Zdzicha, wiadukt i pole przy drodze. Boss pod wiatą stacji.',
  spawn:{x:0,z:72,yaw:0},
  starts:[{x:0,z:72,yaw:0,name:'Dojazd'},{x:0,z:9,yaw:0,name:'Plac przed wiatą'},{x:31.9,z:55.5,yaw:PI/2,name:'Parking TIR'},{x:-34,z:8,yaw:0,name:'Podwórko warsztatu'},
    {x:62,z:3,yaw:0,name:'Autostrada'},{x:-40,z:-52,yaw:-PI/2,name:'Pole przy drodze'},{x:38,z:22,yaw:PI/2,name:'MOP'}],
  menuCam:{r:96,y:48,look:[0,2,6]},
  track:'B',
  spawnZones:[
    {id:'droga-zach',x:-52,z:66,r:6,w:1.8,from:1},{id:'droga-wsch',x:32,z:66,r:6,w:1.8,from:1},{id:'tir-1',x:21.3,z:44,r:2.6,w:1.8,from:1},{id:'tir-2',x:34.3,z:46,r:2.6,w:1.6,from:2},
    {id:'tir-wsch',x:47.6,z:44,r:2.4,w:1.4,from:2},{id:'tir-pd',x:30,z:56,r:3.2,w:1.4,from:3},{id:'hwy-pd',x:60,z:46,r:5,w:1.8,from:1},{id:'hwy-srodek',x:68.5,z:0,r:5,w:1.6,from:2},
    {id:'hwy-pn',x:60,z:-68,r:6,w:1.6,from:3},{id:'mop',x:42,z:27,r:3,w:1.2,from:2},{id:'warsztat',x:-34,z:8,r:4,w:1.6,from:2},{id:'warsztat-tyl',x:-46,z:-16,r:3,w:1.2,from:4},
    {id:'zlomowisko',x:-64,z:14,r:7,w:1.6,from:2},{id:'pole-1',x:-46,z:-56,r:8,w:1.6,from:3},{id:'pole-2',x:-20,z:-62,r:7,w:1.4,from:3},{id:'pole-3',x:-66,z:-38,r:6,w:1.2,from:4},
    {id:'zbiorniki',x:17.5,z:-19.5,r:2.4,w:1.2,from:4},{id:'wiadukt',x:28,z:-40,r:3.5,w:1.4,from:3},{id:'za-sklepem',x:-12,z:-22,r:5,w:1.2,from:4},{id:'pn-droga',x:22,z:-62,r:6,w:1.2,from:5},
    {id:'stacja-boss',x:0,z:10,r:8,w:1,from:1,boss:true},
  ],
  // Scenariusz fal: 1-2 gangsterzy i dresy z dojazdu i parkingu TIR; 3-4 bandyci z autostrady i pola, pijacy z MOP-u; 5 BOSS Szef Stacji pod wiatą (osłony: auta przy pompach, kompresor,
  // opony, donice, beczki); 6-9 kierowcy Maluchów i kamikadze z autostrady; 10 BOSS (kolejny z puli); 11+ snajperzy z wiaduktu i pola, medycy.
  waves:{
    intro:'Godzina 5:40, świt nad A4. Stacja PALIWEX nigdy nie zamyka, a Szef Stacji nie lubi gości, którzy nie tankują.',
    plan:[{from:1,note:'gangsterzy i dresy z dojazdu, parkingu TIR i autostrady'},{from:3,note:'bandyci z pola, pijacy z MOP-u'},
      {from:5,boss:'pula',note:'Szef Stacji pod wiatą; osłony: auta przy pompach, kompresor, opony, donice, beczki; uważaj na kałuże paliwa'},
      {from:6,note:'kierowcy Maluchów i kamikadze z autostrady'},{from:10,boss:'pula'},{from:11,note:'snajperzy z wiaduktu i pola, medycy'}],
    bossWave:5,bossArena:{x:0,z:12,hw:15,hd:10,gates:[{x:-22,z:10},{x:22,z:10},{x:-18,z:28},{x:18,z:28},{x:0,z:-8},{x:-8,z:36},{x:8,z:36}]},
  },
  win:{kind:'boss',boss:'boss_szef_stacji',reward:{coins:800,keys:2},text:'STACJA ZDOBYTA!'},
  secrets:[{id:'zaplecze-sklepu',name:'Zaplecze sklepu'},{id:'kanal',name:'Kanał w warsztacie'},{id:'bunkier',name:'Bunkier na polu'}],
  build(){ buildStacja(this) },
};
DS.levels.register(L);

/* ------------------------------------------------------------------ pomocnicy */
const sign=(text,color,bg,w,h,x,y,z,rotY=0)=>put('neonSign',{text,color,bg,w,h,x,y,z,rotY});
const crate=(x,z,s=1.6,y)=>put('crate',{x,z,s,y});
const stack=(x,z)=>{crate(x,z);crate(x+1.7,z+.1)};
const car=(id,x,z,r,c)=>put(id,{x,z,rotY:r,color:c});
const glow=(x,y,z,w,h,d,color)=>addPart(new THREE.BoxGeometry(w,h,d),new THREE.Matrix4().makeTranslation(x,y,z),{color},{basic:true,cast:false,receive:false,ray:false,edges:false});
/** Odcinki 4 m wzdłuż Z (bariery, ekrany): środek co 4 m od z0 do z1, z pominięciem przerw gaps:[[od,do],...]. */
function seg4(x,z0,z1,gaps=[],rotY=0){
  const out=[];for(let z=z0+2;z<z1;z+=4){if(gaps.some(g=>z>g[0]&&z<g[1]))continue;out.push({x,z,rotY})}return out;
}
/** Wolne miejsce (brak kolidera w promieniu r). */
function free(x,z,r){for(const c of world.colliders){if(c.x0>1e4)continue;if(x>c.x0-r&&x<c.x1+r&&z>c.z0-r&&z<c.z1+r)return false}return true}
/** Rozsiewa rekwizyty z odstępem `gap` w prostokącie rect=[x0,x1,z0,z1]; makers: funkcje (x,z,R) stawiające obiekt. Zwraca liczbę postawionych. */
function scatter(rect,n,makers,{gap=7,seed=1,r=1.6,skip=[]}={}){
  const R=rng(seed),pts=[];let tries=0;
  while(pts.length<n&&tries++<n*40){
    const x=rect[0]+R()*(rect[1]-rect[0]),z=rect[2]+R()*(rect[3]-rect[2]);
    if(skip.some(k=>x>k[0]&&x<k[1]&&z>k[2]&&z<k[3]))continue;
    if(pts.some(p=>Math.hypot(p[0]-x,p[1]-z)<gap)||!free(x,z,r))continue;
    pts.push([x,z]);makers[Math.floor(R()*makers.length)](x,z,R);
  }
  return pts.length;
}

/** Walec poziomy (zbiornik) z kolizją: oś wzdłuż X (alongX) albo Z. */
function tank(x,z,len,rad,alongX,color){
  const g=new THREE.CylinderGeometry(rad,rad,len,14);
  const m=new THREE.Matrix4().makeTranslation(x,rad+.5,z).multiply(alongX?new THREE.Matrix4().makeRotationZ(PI/2):new THREE.Matrix4().makeRotationX(PI/2));
  addPart(g,m,{color},{cast:true,edges:false});
  for(const s of [-.3,.3]){const px=alongX?x+s*len:x,pz=alongX?z:z+s*len;addBox(alongX?.5:rad*1.4,.5,alongX?rad*1.4:.5,px,0,pz,{color:0x4a4a48},{collide:false,cast:false})}
  world.colliders.push(alongX?{x0:x-len/2,x1:x+len/2,z0:z-rad,z1:z+rad,h:rad*2+.5}:{x0:x-rad,x1:x+rad,z0:z-len/2,z1:z+len/2,h:rad*2+.5});
}

/* ---- niebo: gradient zachodu słońca (kopuła z kolorami wierzchołków) + tarcza słońca ze zorzą ---- */
let skyG=null;
const SUN_DIR=[-50,19,-26];
function buildSky(){
  const R=300,geo=new THREE.SphereGeometry(R,24,14),pos=geo.attributes.position,col=new Float32Array(pos.count*3),c=new THREE.Color(),c2=new THREE.Color();
  const stops=[[0,0xf29a4e],[.1,0xf0805a],[.26,0xc8607a],[.52,0x7a4a86],[1,0x34305e]];
  for(let i=0;i<pos.count;i++){
    const t=Math.max(0,pos.getY(i)/R);let k=0;while(k<stops.length-2&&t>stops[k+1][0])k++;
    const a=stops[k],b=stops[k+1],u=Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0])));
    c.set(a[1]);c2.set(b[1]);c.lerp(c2,u);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const dome=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));dome.renderOrder=-10;dome.raycast=noRay;
  const g=new THREE.Group();g.add(dome);
  const d=new THREE.Vector3(...SUN_DIR).normalize().multiplyScalar(R*.93);
  const sun=new THREE.Mesh(new THREE.CircleGeometry(15,24),new THREE.MeshBasicMaterial({color:0xfff2c0,fog:false,depthWrite:false}));sun.position.copy(d);sun.lookAt(0,0,0);sun.raycast=noRay;g.add(sun);
  for(const [rad,op,color] of [[45,.38,0xffb060],[110,.2,0xff8a4a],[190,.1,0xff6a4a]]){
    const h=new THREE.Mesh(new THREE.CircleGeometry(rad,28),new THREE.MeshBasicMaterial({color,fog:false,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));
    h.position.copy(d).multiplyScalar(.99);h.lookAt(0,0,0);h.raycast=noRay;g.add(h);
  }
  g.traverse(o=>{o.frustumCulled=false});scene.add(g);skyG=g;
}

/* ------------------------------------------------------------------ budowa */
function buildStacja(level){
  /* ---- pora dnia: pomarańczowe niebo, nisko słońce z zachodu ---- */
  setEnv({sky:0xf29a4e,fogNear:42,hemi:[0xffc690,0x5a4a52,.74],sun:[0xffa45c,.95],sunDir:SUN_DIR});
  buildSky();

  /* ---- teren ---- */
  const gt=groundTex.clone();gt.ownedByLevel=true;gt.repeat.set(46,46);gt.needsUpdate=true;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(460,460),toon(0x7b7242,{map:gt}));ground.rotation.x=-PI/2;ground.receiveShadow=true;scene.add(ground);world.meshes.push(ground);
  slab(-ARENA,ARENA,-ARENA,ARENA,0,.03,C.grass);
  slab(-76,-8,-76,-40,.03,.03,C.dry);slab(-8,46,-76,-46,.03,.03,C.dry);                      // pole / nieużytek
  slab(-24,24,2,60,.03,.03,C.apron);                                                           // plac stacji i dojazd do parkingu
  slab(-16,16,3,30,.06,.03,C.conc);                                                            // forecourt: plac pod wiatą (arena bossa)
  slab(24,50,32,60,.06,.03,C.lot);slab(12,24,32,60,.06,.03,C.lot);                             // parking TIR
  slab(33,52,0,31,.03,.03,C.mop);                                                              // MOP
  slab(-50,-18,-13,12,.03,.03,C.yard);                                                         // podwórko warsztatu
  slab(13,35,-27,-7,.03,.03,C.yard);                                                           // skład paliw
  slab(-12,52,-27,-13,.03,.03,C.apron);slab(-12,43,-45,-35,.03,.03,C.asph);                    // zaplecze stacji, droga do wiaduktu
  slab(-76,-52,-30,60,.03,.03,C.dirt);slab(-76,-8,-56,-48,.06,.03,C.dirt);                                                         // złomowisko
  slab(45,76,52,71,.03,.03,0x45464a);                                                          // wjazd na autostradę
  for(let i=-2;i<=2;i++)slab(i*4-.07,i*4+.07,6,12,.09,.01,0xe8e4d0);                           // pasy przed sklepem
  // ściany-ekrany wokół areny (granica, zasłania widok poza mapę): wschód to prawdziwe ekrany akustyczne (instancing), reszta bloki
  const sc={color:C.screen},cb={color:C.conc};
  for(const [x,z,w,d] of [[-ARENA+1.2,0,.5,2*ARENA],[0,-ARENA+1.2,2*ARENA,.5],[0,ARENA-1.2,2*ARENA,.5]]){addBox(w,3.4,d,x,1.2,z,sc,{cast:false});addBox(w+.1,1.2,d+.1,x,0,z,cb,{collide:true,cast:false})}
  const dk={color:0x8a5a4a};
  addBox(2,9,2*ARENA+10,-ARENA-2,0,0,dk,{collide:false,cast:false});addBox(2,9,2*ARENA+10,ARENA+3,0,0,dk,{collide:false,cast:false});
  addBox(2*ARENA+10,9,2,0,0,-ARENA-2,dk,{collide:false,cast:false});addBox(2*ARENA+10,9,2,0,0,ARENA+3,dk,{collide:false,cast:false});

  /* ---- AUTOSTRADA (wschód): dwie jezdnie ekspresowe, bariery z przerwami serwisowymi, ekrany, latarnie, wiadukt, bramownice ---- */
  for(let z=-73,i=1;z<52;z+=10,i++){put('jezdnia',{x:58,z,rotY:PI,variant:'ekspresowa',seed:i});put('jezdnia',{x:69,z,rotY:0,variant:'ekspresowa',seed:i+20})}
  inst('barieraEnergo',[...seg4(52,-78,52,[[-47,-33],[19,31],[-4,8]],PI),...seg4(63.5,-78,52,[[8,18],[-58,-48],[-47,-33]],0),...seg4(63.5,-78,52,[[8,18],[-58,-48],[-47,-33]],PI),...seg4(75.4,-78,52,[[-47,-33]],0)],{seed:2,noCast:true});
  inst('ekranAkustyczny',seg4(76.9,-78,78,[],0),{seed:3,noCast:true});
  inst('latarniaAutostrady',[-70,-54,-22,-6,18,34].map(z=>({x:63.5,z,rotY:0})),{seed:4,noCast:true,opts:{variant:'podwojna'}});
  inst('slupekKm',seg4(51.2,-70,50,[],0).filter((_,i)=>i%5===0).map(o=>({...o,rotY:PI/2})),{seed:5});
  put('wiaduktDrogowy',{x:63,z:-40,rotY:0});
  put('bramownica',{x:63.5,z:38,rotY:0,seed:0});put('bramownica',{x:63.5,z:-66,rotY:0,seed:4});
  put('znakStacjaPaliw',{x:50.4,z:34,rotY:PI/2});
  // wraki i ciężarówki na jezdniach (osłony co ~10 m)
  car('passatB5',56.5,44,.22,0x2a2a30);put('tir',{x:59.5,z:24,rotY:0,variant:'plandeka',seed:4});car('polonez',55,6,PI-.3,0xb5534f);put('autosanH9',{x:60,z:-14,rotY:.04,variant:'kremowy',seed:3});
  put('jelcz',{x:59,z:-62,rotY:.08,variant:'skrzynia',seed:5});car('fiat126p',60,-26,.5,0x2d5fa8);car('zukA06',57,-50,-.3,0xf4efe4);car('polonez',56.4,-72,.1,0x9aa0a8);
  put('tir',{x:68,z:34,rotY:0,variant:'chlodnia',seed:6});car('zukA06',72,12,-.4,0x4f8a5b);car('passatB5',66,-5,.1,0xd3242a);put('jelcz',{x:70,z:-22,rotY:PI,variant:'plandeka',seed:7});
  car('polonez',66.5,-52,.2,0xe8c030);put('tir',{x:68.5,z:-66,rotY:PI+.04,variant:'plandeka',seed:8});car('fiat126p',72,50,-.2,0xe07a2a);car('fiat126p',66,-34,.3,0xf4efe4);
  placeBarrels([{x:57,z:-6},{x:58,z:-5.2}]);                                                   // grupa 1: wrak na autostradzie
  healMachines([{kind:'vending',x:50.8,z:-18,rotY:PI/2}]);
  // pachołki zamykające pas przy wiadukcie i przy wjeździe
  inst('pacholek',[...[0,1,2,3,4].map(i=>({x:53.2,z:-60+i*1.4})),...[0,1,2,3].map(i=>({x:44+i*1.5,z:-31.5}))],{seed:7,noCast:true});
  // billboardy wzdłuż autostrady (twarzą do jezdni)
  put('billboard',{x:47,z:-10,rotY:PI/2,seed:2});put('billboard',{x:47,z:-58,rotY:PI/2,seed:0});put('billboard',{x:47.5,z:28,rotY:PI/2,seed:1});

  /* ---- DOJAZD i START ---- */
  for(let x=-70,i=40;x<=40;x+=10,i++)put('jezdnia',{x,z:66,rotY:PI/2,variant:'lokalna',seed:i});
  put('pylonCen',{x:-14,z:52,rotY:0});
  addBox(.55,17,.55,14,0,52,{color:C.steel},{});
  sign('PALIWEX','#ffd21a','#7a1010',9,2.6,14,16,52.4);sign('PALIWEX','#ffd21a','#7a1010',9,2.6,14,16,51.6,PI);
  sign('OTWARTE 24h','#ff9a4a','#1a0c04',6.4,1.3,14,13.6,52.4);sign('OTWARTE 24h','#ff9a4a','#1a0c04',6.4,1.3,14,13.6,51.6,PI);
  addBox(.3,9,.3,-30,0,76,{color:C.steel},{collide:false});sign('PALIWEX  ZJAZD','#7aff9a','#06140a',7,1.6,-30,9.4,75.6);
  healMachines([{kind:'vending',x:-10,z:75,rotY:PI},{kind:'station',x:10,z:75,rotY:PI}]);
  car('fiat126p',-24,64,PI/2,0xe07a2a);car('polonez',18,67.5,-PI/2,0x4f8a5b);car('zukA06',-48,68,PI/2,0x9aa0a8);car('passatB5',44,64,PI/2,0x2d5fa8);
  inst('pacholek',[...[0,1,2,3,4,5].map(i=>({x:-6+i*1.5,z:60.2})),{x:-10,z:57},{x:-9,z:56}],{seed:6});
  stack(-30,72);stack(30,73);crate(-44,73);

  /* ---- STACJA: sklep z wnętrzem (+ zaplecze = sekret 1), wiata z dystrybutorami, kompresor, auta przy pompach, osłony ---- */
  put('sklepStacji',{x:4,z:0,rotY:0,seed:2});
  put('wiataStacji',{x:0,z:18,rotY:0});
  inst('dystrybutor',[{x:-3.5,z:15},{x:3.5,z:15},{x:-3.5,z:21},{x:3.5,z:21}],{seed:3});
  car('passatB5',-3.5,18,.05,0xc8c8c0);car('polonez',3.5,18.2,PI+.08,0xb8231a);
  put('wysepkaKompresor',{x:-12,z:8,rotY:0});put('donica',{x:-6,z:8.5,variant:'beton'});put('donica',{x:6,z:8.5,variant:'beton'});
  put('stosOpon',{x:14.5,z:9,rotY:.3,seed:2});put('stosOpon',{x:-16.5,z:14,rotY:-.4,seed:3});stack(-15,24.5);stack(13,25);
  put('smietnik',{x:12.5,z:6.5,variant:'kontener'});put('koszUliczny',{x:-2,z:6});
  placeBarrels([{x:-10.2,z:11},{x:-9.3,z:11.9},{x:12.2,z:20}]);                                // grupa 2: plac bossa
  healMachines([{kind:'station',x:-5.5,z:-4.9,rotY:PI}]);
  // zaplecze sklepu (sekret 1)
  room({x0:0,x1:8,z0:-14,z1:-7,h:3.2,wall:0xcfd6d2,roof:0x4a4640,floor:0x4a4a44,light:0xfff0b0,door:{side:'s',c:4,w:2,h:2.4,secret:true,label:'ZAPLECZE SKLEPU',color:0xcfd6d2}});
  put('regalMagazynowy',{x:1.9,z:-13.1,rotY:0});put('lodowka',{x:6.2,z:-13.1,rotY:0});crate(7,-9.4,1.3);put('skrzynkaAlkohol',{x:3.4,z:-8.6,rotY:.4});put('skrzynkaAlkohol',{x:4.4,z:-8.6,rotY:-.2});
  glow(4,3.08,-10.5,.5,.06,.5,0xfff0b0);
  inst('lampaUliczna',[[-18,6],[18,6],[-18,30],[18,30],[-24,46],[24,50],[0,-18],[-8,-30],[16,-30],[-26,-28],[30,-42]].map(([x,z])=>({x,z,rotY:x<0?-PI/2:PI/2})),{seed:5,noCast:true,opts:{variant:'kobra'}});

  /* ---- MYJNIA i WARSZTAT (zachód): podwórko, opony, kompresor, kanał = sekret 2 ---- */
  put('myjnia',{x:-28,z:24,rotY:0});
  put('warsztat',{x:-34,z:-4,rotY:0,seed:3});
  put('stosOpon',{x:-46,z:-1,rotY:.4,seed:4});put('stosOpon',{x:-22,z:3,rotY:-.2,seed:5});put('wysepkaKompresor',{x:-22,z:10,rotY:PI/2});
  car('fiat126p',-42,6,.4,0xd3242a);car('polonez',-30,9.6,-.15,0xe8c030);car('zukA06',-46,-8,PI/2,0x4f8a5b);stack(-47,10);
  placeBarrels([{x:-44.5,z:-10.6},{x:-43.6,z:-9.8}]);                                          // grupa 3: za warsztatem
  healMachines([{kind:'station',x:-18.4,z:-1,rotY:PI/2}]);
  room({x0:-40,x1:-32,z0:-17,z1:-10.5,h:3.2,wall:0x9aa4a8,roof:0x4a4640,floor:0x2e2d2a,light:0xffc070,door:{side:'s',c:-36,w:2.2,h:2.4,secret:true,label:'KANAŁ',color:0x9aa4a8}});
  put('regalMagazynowy',{x:-38.8,z:-16.1,rotY:0});put('stosOpon',{x:-33.3,z:-15.6,rotY:.2,seed:6});crate(-39,-12.2,1.2);put('skrzynkaAlkohol',{x:-34.6,z:-11.8,rotY:.5});
  glow(-36,3.08,-13.7,.5,.06,.5,0xffc070);
  sign('MYJNIA  I  WULKANIZACJA','#3ad0ff','#061018',6.4,1.2,-37,6.8,-8.6);

  /* ---- SKŁAD PALIW (fence + brama auto): zbiorniki, beczki, skrzynie ---- */
  fence('x',-7,13,35,{gaps:[[21,27]]});fence('x',-27,13,35);fence('z',13,-27,-7,{gaps:[[-20,-16]]});fence('z',35,-27,-7,{gaps:[[-22,-18]]});
  slidingDoor('x',-7,24,6,2.6,{auto:true,color:0x4e5660,range:6.5,thick:.25});
  for(const x of [20.8,27.2])addBox(.4,2.9,.4,x,0,-7,{color:0xa8503a});addBox(7,.3,.3,24,2.9,-7,{color:C.steel},{collide:false});
  sign('SKŁAD PALIW','#ff4a3a','#10060a',5.6,.9,24,3.8,-6.9);
  tank(24,-23,10,1.5,true,0xb0b4ba);tank(24,-16,8,1.3,true,0xc8221a);tank(31,-19.5,6,1.1,false,0xb0b4ba);
  crate(16,-24,1.6);crate(17.7,-23.8,1.6);put('stosOpon',{x:17,z:-10.5,rotY:.5,seed:7});stack(28,-10.5);
  placeBarrels([{x:15.5,z:-14},{x:16.5,z:-14.9},{x:15.8,z:-16}]);                              // grupa 4: skład paliw

  /* ---- MOP: wiaty, toi-toi, Bar u Zdzicha, ławki, billboard ---- */
  put('wiataMop',{x:42,z:5.8,rotY:0});put('wiataMop',{x:42,z:25.5,rotY:0});
  put('budkaKebab',{x:44.5,z:15.4,rotY:-PI/2,seed:4});
  for(const z of [1.5,3.2,4.9])put('toiToi',{x:49.3,z,rotY:-PI/2,variant:z>3?'zielona':'niebieska'});
  put('lawka',{x:36,z:16,rotY:PI/2,variant:'beton'});put('donica',{x:36,z:12,variant:'beton'});put('donica',{x:36,z:20,variant:'beton'});put('smietnik',{x:48.5,z:15,variant:'kontener'});
  healMachines([{kind:'vending',x:34.2,z:28,rotY:PI/2}]);
  sign('MOP  DĄBROWA','#43f0ff','#06202a',5,1.1,42,4.4,3.4);
  placeBarrels([{x:49,z:24},{x:49.9,z:24.9}]);                                                 // grupa 5: MOP

  /* ---- PARKING TIR: labirynt naczep (rzędy równoległe w przesunięciu, rząd poprzeczny od południa, auta w alejkach) ---- */
  const T=(x,z,r,v,s)=>put('tir',{x,z,rotY:r,variant:v,seed:s});
  T(18,44,0,'plandeka',11);T(24.5,45,0,'chlodnia',12);T(31,43,0,'plandeka',13);T(37.5,46,0,'chlodnia',14);T(44,42,0,'plandeka',15);
  T(22,59,PI/2,'chlodnia',16);T(42,59,PI/2,'plandeka',17);
  put('jelcz',{x:8,z:42,rotY:0,variant:'plandeka',seed:9});put('autosanH9',{x:24,z:63.4,rotY:PI/2,variant:'bialy',seed:5});
  car('passatB5',27.7,53,.1,0x9aa0a8);car('fiat126p',34.3,40,.06,0xe07a2a);car('zukA06',21.3,38,.1,0x4f8a5b);
  put('stosOpon',{x:47.5,z:55,rotY:.4,seed:8});crate(40.7,52,1.5);
  sign('PARKING  TIR  24h','#43f0ff','#06202a',7,1.6,30,8.8,32.2);for(const x of [26.5,33.5])addBox(.3,8,.3,x,0,32.2,{color:C.steel},{collide:false});
  inst('latarniaAutostrady',[{x:30,z:51},{x:20,z:36},{x:46,z:38}],{seed:9,noCast:true,opts:{variant:'pojedyncza'}});

  /* ---- ZŁOMOWISKO (zachód) i POLE przy drodze (północ): zaułki, osłony, bunkier = sekret 3 ---- */
  car('polonez',-64,18,.7,0x9aa0a8);car('fiat126p',-60,26,-.5,0xb5534f);car('zukA06',-70,34,1.4,0xd3c9a8);car('passatB5',-62,46,.2,0x2a2a30);car('fiat126p',-70,6,-1.1,0x4f8a5b);
  put('stosOpon',{x:-58,z:12,rotY:.2,seed:9});put('stosOpon',{x:-72,z:20,rotY:.9,seed:10});stack(-60,36);stack(-72,48);crate(-56,28,1.8);
  placeBarrels([{x:-66,z:30},{x:-65,z:30.9}]);healMachines([{kind:'station',x:-54.5,z:19,rotY:PI/2}]);
  room({x0:-72,x1:-64,z0:-68,z1:-61,h:3.2,wall:0x5a5a4a,roof:0x2e2a22,floor:0x3a3a30,light:0xffd080,door:{side:'s',c:-68,w:2,h:2.4,secret:true,label:'BUNKIER',color:0x5a5a4a}});
  crate(-70.4,-67,1.4);put('regalMagazynowy',{x:-65.5,z:-67,rotY:0});put('skrzynkaAlkohol',{x:-69,z:-62.8,rotY:.2});glow(-68,3.08,-64.5,.5,.06,.5,0xffd080);
  sign('SKŁAD  ROLNY','#ffe14a','#2a1a06',4.4,.9,-68,3.8,-60.7);
  put('billboard',{x:-44,z:-46,rotY:0,seed:1});put('billboard',{x:6,z:-50,rotY:0,seed:0});
  inst('pacholek',[...[0,1,2,3,4,5,6].map(i=>({x:8+i*1.4,z:-48.8})),{x:26,z:-38},{x:26.5,z:-40.5},{x:26,z:-43}],{seed:8});

  /* ---- rozsiane osłony: drzewa, krzewy, bele, stogi, przyczepy na polu; ciężarówki i auta w strefach otwartych ---- */
  const tree=v=>(x,z,R)=>put('drzewo',{x,z,variant:v,seed:Math.round(x*3+z)});
  const bush=(x,z)=>put('krzew',{x,z,variant:'rozkwitly'});
  const bale=(v)=>(x,z)=>put('belaOkragla',{x,z,variant:v});
  const hay=(x,z)=>put('stogSiana',{x,z});const trailer=(x,z,R)=>put('przyczepa',{x,z,rotY:R()*6.28,variant:R()<.5?'pusta':'siano'});
  const kopa=(x,z)=>put('kopaSnopkow',{x,z});const stk=(x,z)=>stack(x,z);
  const fieldMk=[tree('brzoza'),tree('topola'),tree('martwe'),bush,bush,bale('siano'),bale('slama'),hay,trailer,kopa,stk];
  const keepRoad=[[-80,80,60,72]];
  scatter([-74,-10,-74,-47],24,fieldMk,{gap:7.5,seed:11,skip:[[-73,-61,-69,-58],[-78,-8,-56,-47.5]]});
  scatter([-74,-52,-46,-30],8,fieldMk,{gap:8,seed:12});
  scatter([-8,46,-74,-49],16,[tree('brzoza'),tree('topola'),bush,bale('folia'),hay,stk,trailer],{gap:8,seed:13});
  scatter([-74,-52,-28,58],14,[tree('lipa'),bush,(x,z)=>stk(x,z),(x,z,R)=>car(['fiat126p','polonez','zukA06'][Math.floor(R()*3)],x,z,R()*6.28,[0xd3242a,0x9aa0a8,0x4f8a5b,0xe8c030][Math.floor(R()*4)])],{gap:8.5,seed:14,skip:keepRoad});
  scatter([-18,12,-40,-14],6,[tree('brzoza'),bush,stk],{gap:8,seed:15});
  scatter([-24,-4,32,58],4,[tree('lipa'),bush],{gap:9,seed:16,skip:keepRoad});
  scatter([-74,-30,40,58],6,[tree('lipa'),tree('topola'),bush],{gap:9,seed:17,skip:keepRoad});
  scatter([-8,50,-34,-14],5,[(x,z)=>stk(x,z),bush],{gap:9,seed:18,skip:[[12,36,-28,-6]]});
  scatter([46,56,-10,34],3,[bush],{gap:9,seed:19});
  for(const [x,z,v] of [[-76,64,'brzoza'],[-72,74,'topola'],[70,74,'lipa'],[-40,74,'brzoza'],[40,75,'topola']])put('drzewo',{x,z,variant:v,seed:Math.round(x+z)});

  /* ---- znajdźki (id stabilne!) ---- */
  placeCollectibles(level,[
    {id:'st-kaseta-1',type:'kaseta',x:40.2,z:12.6,name:'Skaner: Tankuj na Gaz',hint:'przed budką Bar u Zdzicha'},
    {id:'st-kaseta-2',type:'kaseta',x:34.3,z:49,name:'Sweet Noise Dance: Kierowca TIR-a',hint:'alejka w labiryncie naczep'},
    {id:'st-kaseta-3',type:'kaseta',x:4,z:-11.2,name:'Pectus: Zaplecze Nocą',hint:'zaplecze sklepu',secret:true},
    {id:'st-kaseta-4',type:'kaseta',x:-31,z:-55,name:'Weekend: Droga w Pole',hint:'przy beli na polu'},
    {id:'st-lancuch-1',type:'lancuch',x:6.2,z:-.2,name:'Złoty łańcuch spod lady',hint:'sklep PALIWEX',value:70},
    {id:'st-lancuch-2',type:'lancuch',x:21.3,z:41,name:'Łańcuch między naczepami',value:80},
    {id:'st-lancuch-3',type:'lancuch',x:68.6,z:-31,name:'Łańcuch pod wiaduktem',value:100},
    {id:'st-lancuch-4',type:'lancuch',x:-34.8,z:-12.9,name:'Łańcuch z kanału',value:140,secret:true},
    {id:'st-klucz-1',type:'klucz',x:-38.4,z:-14.3,name:'Klucz do skrzynki: kanał',secret:true},
    {id:'st-klucz-2',type:'klucz',x:-68.6,z:-66,name:'Klucz do skrzynki: bunkier',secret:true},
    {id:'st-plakat-1',type:'plakat',x:.8,z:2.4,name:'Plakat: Hot-dog 2 zł do północy',hint:'wejście do sklepu',value:30},
    {id:'st-plakat-2',type:'plakat',x:46,z:-11.5,name:'Plakat: Żółte Kanapki na żywo',hint:'billboard przy A4',value:30},
    {id:'st-plakat-3',type:'plakat',x:-46,z:-48.5,name:'Plakat: Zaginął kogut Zdzisiek',hint:'billboard na polu',value:30},
  ]);

  /* ---- nawigacja AI: osłony z rekwizytów ---- */
  buildNav(level,{coverMax:30,coverMaxH:12,coverLimit:1200,assign:true});
}

/* ------------------------------------------------------------------ zdarzenia poziomu: niebo, ambient, ukończenie */
let amb=null,passT=0;
function stopAmbient(){if(amb){for(const n of amb){try{n.src.stop()}catch(e){}try{n.g.disconnect()}catch(e){}}amb=null}}
function startAmbient(){
  stopAmbient();
  if(!AU.ctx||!AU.noise)return;
  try{
    amb=[];
    for(const [type,f,gain,q] of [['lowpass',300,.055,.8],['bandpass',2100,.01,3]]){      // szum A4 + syk opon
      const src=AU.ctx.createBufferSource();src.buffer=AU.noise;src.loop=true;
      const fl=AU.ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
      const g=AU.ctx.createGain();g.gain.value=gain;
      src.connect(fl);fl.connect(g);g.connect(AU.sfx||AU.master);src.start();amb.push({src,g});
    }
  }catch(e){amb=null}
  passT=3;
}
/** Przejazd auta po autostradzie: szum z przemiatanym filtrem, głośniej blisko jezdni. */
function carPass(vol){
  if(!AU.ctx||!AU.noise||!AU.sfx&&!AU.master)return;
  try{
    const t=AU.ctx.currentTime,src=AU.ctx.createBufferSource();src.buffer=AU.noise;
    const fl=AU.ctx.createBiquadFilter();fl.type='bandpass';fl.Q.value=2.5;fl.frequency.setValueAtTime(260,t);fl.frequency.exponentialRampToValueAtTime(1100,t+1.1);fl.frequency.exponentialRampToValueAtTime(240,t+2.6);
    const g=AU.ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+1.1);g.gain.exponentialRampToValueAtTime(.0001,t+2.6);
    src.connect(fl);fl.connect(g);g.connect(AU.sfx||AU.master);src.start(t);src.stop(t+2.7);
  }catch(e){}
}
const here=()=>world.level&&world.level.id===ID;
DS.bus.on('levelLoad',e=>{if(e&&e.level===ID)mergeIntoZones()});
DS.bus.on('levelUnload',()=>{stopAmbient();skyG=null});
DS.bus.on('levelStart',()=>{
  if(!here())return;
  startAmbient();
  const G=S.G;if(G){G.levelWon=false;setTimeout(()=>{if(S.G===G&&here()){const st=collectStats(L);announce('STACJA PALIW I AUTOSTRADA','Znajdźki '+st.found+'/'+st.total+'  |  3 sekrety  |  ostatni poziom')}},1800)}
});
DS.bus.on('levelEnd',stopAmbient);
DS.bus.on('update',dt=>{
  if(!here())return;
  if(skyG)skyG.position.copy(camera.position);
  if(!amb||!S.G||S.G.paused)return;
  passT-=dt;if(passT<=0){passT=5+Math.random()*8;const P=DS.player.P,d=Math.abs(P.pos.x-63);const v=.09*Math.pow(Math.max(0,1-d/80),1.4);if(v>.004)carPass(v)}
});
const winOnKill=({enemy:e})=>{
  const G=S.G;if(!G||!here()||!e||!e.boss||G.levelWon)return;       // boss z puli tabeli (Szef Stacji, Jednooki) kończy poziom
  G.levelWon=true;
  save.coins+=L.win.reward.coins;save.keys+=L.win.reward.keys;G.earned+=L.win.reward.coins;G.keysFound+=L.win.reward.keys;
  save.levelsDone=save.levelsDone||{};save.levelsDone[ID]=true;persist();
  setTimeout(()=>{if(S.G===G)announce(L.win.text,'+'+L.win.reward.coins+' ZD i '+L.win.reward.keys+' klucze. To był ostatni poziom, gra toczy się dalej.')},1500);
  DS.bus.emit('levelComplete',{level:ID,wave:G.wave});
};
DS.bus.on('kill',winOnKill);DS.bus.on('netKill',winOnKill);   // co-op: boss zabity przez zdalnego gracza też kończy poziom (u hosta)
