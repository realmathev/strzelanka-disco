// Poziom 4: Dworzec i bocznica „Strzelnica Główna” (zmierzch). Właściciel katalogu: ds-level-designer.
//
// Arena 78 m od środka (156 x 156 m = 24 336 m2, ok. 3,45x Remiza). Zmierzch: fioletowo-bursztynowe niebo, nisko słońce od wschodu, neony, lampy peronowe.
// +X = wschód (prawo na planie), -Z = północ (góra planu). Gracz startuje na placu dworcowym (0,70) i patrzy na północ.
// Stacja czołowa: budynek dworca zamyka tory od południa, cztery tory idą na północ (tunele), pośrodku plac manewrowy z nastawnią, na wschodzie bocznica.
//
//  PLAN (1 znak ~ 3 m; [..] = budynek, | = tor, # = peron, = = droga/aleja, * = sekret, G = brama auto, X = przejazd z zaporą)
//  z=-78 ┌─ WARSZTATY ─ ......│tunel T1│....... [SRK*]...[nastaw]...[hangar].....│tunel T4│...... komin ─┐
//  z=-60 │ złomowisko       T1 │# T2   │  plac przed NASTAWNIĄ (boss)  │ T3 #│ T4    M2 ramp│ ostatni  │
//  z=-52 │ ═ aleja pod ═ wiadukt(3 łuki, WIADUKT)  │ wagony: SM42, ET22,   │ cysterna, węglarki │ M2 ═ ════ │
//  z=-36 │ ═ aleja pod ═ wiadukt   (G2: przerwa)   │ T5 + SM42 w środku    │                    │ ═XXX═ T7  │
//  z=-16 │ ═ aleja pod ═ wiadukt   (G1: przerwa)   │ wagon osobowy         │      rampa │ M1    │ zaplecze*  │
//  z=-12 │ garaże    │ droga zach.│  PERON 1-2 # │ tory 1-2 │ yard │ tory 3-4 │ # PERON 3-4 │ droga wsch. │ T7 SM42 │
//  z=+13 │ przejście*│ ────── koziły oporowe ───────── gantry „PERON 1-2 / 3-4” ───────────────  │ G (brama T7)    │
//  z=+23 │ wieża     │ [WC]     [   D W O R Z E C   (poczekalnia, kasa)   ]     [bagaże]  │ komin               │
//  z=+37 │           │ kiosk   plac dworcowy: taxi, wiaty, kioski, ławki, drzewa, neon-totem   │                   │
//  z=+78 └───────────── START (0,70): automaty leczące, neon „STRZELNICA GŁÓWNA” na dachu ───────────────────────┘
//  Wysokości: silnik ma płaską podłogę (y=0), więc perony (1,13 m) i rampy to osłony/ściany, a „piętra” są wizualne (wiadukt 6 m, nastawnia, wieża ciśnień,
//  komin, trakcja 9 m). Przejścia między torami: przerwy w składach i peronach (G1, G2), nie pod wagonami. Pętle: plac -> aleja zach. -> pas północny -> aleja wsch. -> plac;
//  skróty: aleje pod wiaduktem, przerwy peronowe, tunel T1 (ślepy), zejście służbowe (E).
//
// Znajdźki: 13 (4 kasety, 4 złote łańcuchy, 2 klucze, 3 plakaty), 3 sekrety (E: zejście służbowe, przekaźkownia za nastawnią, zaplecze magazynu),
// brama automatyczna bocznicy, 3 grupy wybuchowych beczek, 4 automaty leczące. Boss fali 5: pula tabeli (dziś Jednooki; Dyżurny Ruchu po dodaniu). Ukończenie: pokonanie bossa.
import {DS} from '../../core/ds.js';
import {save,persist} from '../../core/save.js';
import {S} from '../../core/state.js';
import {scene} from '../../render/renderer.js';
import {toon} from '../../render/materials.js';
import {groundTex} from '../../render/textures.js';
import {announce} from '../../render/comicfx.js';
import {A as AU} from '../../audio/context.js';
import {addBox} from '../build.js';
import {addPart} from '../batch.js';
import {world} from '../state.js';
import {setEnv,slab,facade,fence,room,slidingDoor,placeCollectibles,placeBarrels,healMachines,buildNav,collectStats,mergeIntoZones} from './common.js';

const ID='dworzec',ARENA=78,PI=Math.PI;
const put=(id,o)=>DS.props.get(id).place(o);
const C={asph:0x3f3d46,road:0x37353d,pav:0x9a9488,conc:0x8c887e,grav:0x6a665c,yard:0x77726a,steel:0x4b5058,deck:0x58524a,brick:0x9a4a36,dark:0x2a2832};

const L={
  id:ID,name:'Dworzec i Bocznica',arena:ARENA,
  desc:'Zmierzch na stacji czołowej: poczekalnia, perony, składy jako labirynt, bocznica z magazynami, nastawnia, tunel i wiadukt. Boss na placu przed nastawnią.',
  spawn:{x:0,z:70,yaw:0},
  starts:[{x:0,z:70,yaw:0,name:'Plac dworcowy'},{x:0,z:31,yaw:0,name:'Poczekalnia'},{x:-22,z:-14,yaw:-PI/2,name:'Przejście przez peron'},
    {x:0,z:-22,yaw:0,name:'Plac manewrowy'},{x:33,z:-6,yaw:PI/2,name:'Bocznica'}],
  menuCam:{r:84,y:42,look:[0,2,-8]},
  track:'A',
  spawnZones:[
    {id:'plac-zach',x:-30,z:56,r:10,w:2.5,from:1},{id:'plac-wsch',x:32,z:58,r:10,w:2.5,from:1},{id:'poczekalnia',x:0,z:30,r:4,w:1,from:4},
    {id:'peron-zach',x:-33,z:-6,r:4.5,w:2,from:1},{id:'peron-wsch',x:33,z:-6,r:4.5,w:2,from:1},{id:'wiadukt',x:-56,z:-36,r:3.5,w:2,from:2},
    {id:'zlomowisko',x:-70,z:-26,r:5,w:1.5,from:3},{id:'bocznica',x:34,z:-46,r:5,w:2,from:2},{id:'zaplecze',x:67,z:-8,r:7,w:2,from:3},
    {id:'wsch-magazyny',x:67,z:-46,r:6,w:1.5,from:4},{id:'za-nastawnia',x:0,z:-72,r:5,w:1.2,from:4},{id:'tunel',x:-26,z:-72,r:2,w:1,from:6},
    {id:'plac-nastawnia',x:0,z:-30,r:8,w:1,from:1,boss:true},
  ],
  // Scenariusz fal: 1-2 gangsterzy z placu i alei; 3-4 dresy i bandyci na torach; 5 BOSS na placu przed nastawnią; 6-9 ochroniarze, kamikadze z bocznicy;
  // 10 BOSS (kolejny z puli); 11+ snajperzy na wiadukcie/wieży, medycy, kierowcy.
  waves:{
    intro:'Godzina 20:15. Dworzec „Strzelnica Główna”. Ostatni pociąg stoi na torze, a Dyżurny wie, kto go zatrzymał.',
    plan:[{from:1,note:'gangsterzy z placu dworcowego i alei'},{from:3,note:'dresy i bandyci między wagonami'},
      {from:5,boss:'pula',note:'boss wchodzi na plac przed nastawnią; osłony: skrzynki SRK, lokomotywa SM42 na torze 5, skrzynie, beczki'},
      {from:6,note:'ochroniarze, kamikadze z bocznicy'},{from:10,boss:'pula'},{from:11,note:'snajperzy, medycy, kierowcy z placu'}],
    bossWave:5,bossArena:{x:0,z:-30,hw:11,hd:13,gates:[{x:-15,z:-14},{x:15,z:-14},{x:-15,z:-37},{x:15,z:-37},{x:-4,z:-50},{x:10,z:-56}]},
  },
  win:{kind:'boss',boss:'boss_jednooki',reward:{coins:450,keys:1},text:'DWORZEC OCZYSZCZONY!'},
  secrets:[{id:'zejscie',name:'Zejście służbowe'},{id:'przekaznikownia',name:'Przekaźkownia'},{id:'magazyn',name:'Zaplecze magazynu'}],
  build(){ buildDworzec(this) },
};
DS.levels.register(L);

/* ------------------------------------------------------------------ pomocnicy */
const sign=(text,color,bg,w,h,x,y,z,rotY=0)=>put('neonSign',{text,color,bg,w,h,x,y,z,rotY});
const stack=(x,z)=>{put('crate',{x,z,s:1.6});put('crate',{x:x+1.7,z,s:1.6});put('crate',{x:x+.85,z,s:1.6,y:1.6})};
const car=(id,x,z,r,c)=>put(id,{x,z,rotY:r,color:c});
/** Brama z neonem nad torami: dwa słupy (kolizja) + belka na 7,4 m + szyld dwustronny. */
function gantry(x0,x1,z,text,color,bg){
  for(const x of [x0,x1])addBox(.45,8,.45,x,0,z,{color:C.steel},{});
  addBox(x1-x0,.5,.5,(x0+x1)/2,7.4,z,{color:C.steel},{collide:false});
  const w=Math.min(11,x1-x0-2);
  sign(text,color,bg,w,2.1,(x0+x1)/2,6.1,z+.3);sign(text,color,bg,w,2.1,(x0+x1)/2,6.1,z-.3,PI);
  for(const x of [(x0+x1)/2-w/2+.4,(x0+x1)/2+w/2-.4])addBox(.1,1.4,.1,x,6.6,z,{color:C.steel},{collide:false});
}
/** Wieża ciśnień: 4 nogi z kolizją (osłony), zbiornik na 12 m, stożkowy dach, czerwone światło ostrzegawcze. */
function waterTower(x,z){
  for(const [dx,dz] of [[-2.2,-2.2],[2.2,-2.2],[-2.2,2.2],[2.2,2.2]])addBox(.55,12,.55,x+dx,0,z+dz,{color:0x70757a},{cast:true});
  for(const k of [-1,1]){addBox(4.8,.14,.14,x,4.5,z+k*2.2,{color:0x5a5f64},{collide:false});addBox(.14,.14,4.8,x+k*2.2,7.5,z,{color:0x5a5f64},{collide:false})}
  addPart(new THREE.CylinderGeometry(3.4,3.4,5,16),new THREE.Matrix4().makeTranslation(x,14.5,z),{color:0x8f9aa0},{cast:true,edges:false});
  addPart(new THREE.CylinderGeometry(.1,3.7,1.9,16),new THREE.Matrix4().makeTranslation(x,17.95,z),{color:0x9a3a2a},{cast:true,edges:false});
  addPart(new THREE.SphereGeometry(.45,8,6),new THREE.Matrix4().makeTranslation(x,19.2,z),{color:0xff2a2a},{basic:true,cast:false,receive:false,ray:false,edges:false});
  sign('WODA',  '#43f0ff','#06202a',4.4,1.5,x,14.6,z+3.45);sign('WODA','#43f0ff','#06202a',4.4,1.5,x,14.6,z-3.45,PI);
}
/**
 * Segment wiaduktu kolejowego 7,6 x 12 m (tor po wzdłuż Z, góra szyny na 6,02 m), zbudowany lokalnie: id rekwizytu `wiadukt` z rail.js zostało nadpisane przez
 * road.js (wiadukt drogowy 39 m), więc poziom nie może na nim polegać. Przyczółki 1,6 m (kolizja) po obu końcach, prześwit alei 8,8 m wzdłuż X.
 */
function railViaduct(x,z){
  const con=0xa8a49a,steel=0x5a6a6e,pb=(geo,px,py,pz,color)=>addPart(geo,new THREE.Matrix4().makeTranslation(px,py,pz),{color},{cast:false,receive:true,ray:false,edges:false});
  for(const zs of [-1,1])addBox(7.4,4.6,1.6,x,0,z+zs*5.2,{color:con});
  addBox(7.6,1.05,12,x,4.6,z,{color:0x8f8b82},{collide:false});
  addBox(3.9,.2,12,x,5.65,z,{color:0x5c5852},{collide:false,cast:false});
  for(const sx of [-1,1]){addBox(.12,1.0,12,x+sx*3.65,5.65,z,{color:steel},{collide:false,cast:false});addBox(.9,.12,12,x+sx*3.2,3.54,z,{color:steel},{collide:false,cast:false})}
  const slp=new THREE.BoxGeometry(2.6,.16,.26),rl=new THREE.BoxGeometry(.07,.17,12);
  for(let i=0;i<20;i++)pb(slp,x,5.77,z-5.7+i*.6,[0x4a3a2c,0x55422f,0x3e3128][i%3]);
  for(const sx of [-1,1])pb(rl,x+sx*.7175,5.935,z,0x6b4f3e);
}
/** Komin w czerwono-białe pasy, 38 m, z lampą ostrzegawczą. */
function chimney(x,z){
  for(let i=0;i<6;i++)addPart(new THREE.CylinderGeometry(1.45-i*.04,1.55-i*.04,6.4,12),new THREE.Matrix4().makeTranslation(x,3.2+i*6.4,z),{color:i%2?0xf2efe6:0xb8372a},{cast:true,edges:false});
  addPart(new THREE.CylinderGeometry(1.6,1.6,.5,12),new THREE.Matrix4().makeTranslation(x,38.6,z),{color:0x2a2a2a},{edges:false});
  addPart(new THREE.SphereGeometry(.6,8,6),new THREE.Matrix4().makeTranslation(x,39.4,z),{color:0xff2a2a},{basic:true,cast:false,receive:false,ray:false,edges:false});
  world.colliders.push({x0:x-1.6,x1:x+1.6,z0:z-1.6,z1:z+1.6,h:38});
}

/* ------------------------------------------------------------------ budowa */
function buildDworzec(level){
  /* ---- niebo, mgła, światło: zmierzch ---- */
  setEnv({sky:0x9a5f86,fogNear:44,hemi:[0xf2b8a6,0x3e3a54,.68],sun:[0xff8e50,.82],sunDir:[48,22,28]});

  /* ---- teren ---- */
  const gt=groundTex.clone();gt.repeat.set(40,40);gt.needsUpdate=true;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,420),toon(0x6f6a60,{map:gt}));ground.rotation.x=-PI/2;ground.receiveShadow=true;scene.add(ground);world.meshes.push(ground);
  slab(-ARENA,ARENA,-ARENA,ARENA,0,.03,C.grav);
  slab(-58,58,38,78,.03,.03,C.asph);                       // plac dworcowy
  slab(-36,36,36,45,.06,.03,C.pav);                        // chodnik przed budynkiem
  slab(-42,42,14.8,23,.03,.03,C.conc);                     // hala peronowa przed kozłami
  slab(-38,-28.5,-76,14,.03,.03,C.road);slab(28,39,-76,14,.03,.03,C.road);   // drogi technologiczne wzdłuż torów
  slab(-14,14,-62,8,.03,.03,0x6e6a62);                     // plac manewrowy (utwardzony tłuczeń)
  slab(-18,18,-62,-56,.06,.03,C.conc);                     // plac przed nastawnią
  for(const [a,b] of [[-52.4,-43.6],[-40.4,-31.6],[-28.4,-19.6]])slab(-78,-38,a,b,.03,.03,C.road);   // aleje pod wiaduktem
  slab(33,78,-41,-35,.03,.03,C.road);                      // droga przejazdowa przez bocznicę
  slab(57.3,63,-78,14,.03,.03,C.road);                     // aleja za magazynami
  slab(-78,-44,16,40,.03,.03,C.yard);slab(40,78,14,40,.03,.03,C.yard);   // place gospodarcze
  for(const [x,a,b] of [[44,-41,-35]])slab(x-1.9,x+1.9,a,b,.37,.02,C.deck);   // przejazd przez tor T7
  // pasy ostrzegawcze przed peronami (żółte), prowadzą wzrok wzdłuż torów
  for(const x of [-22,22])slab(x-.06,x+.06,-60,12.5,1.15,.01,0xe8b81c);

  /* ---- obwód: mur i panorama miasta ---- */
  const wall={color:0x8a867a},E=ARENA+.6;
  addBox(2*ARENA+4,3.8,1,0,0,-E,wall,{collide:false,cast:false});addBox(2*ARENA+4,3.8,1,0,0,E,wall,{collide:false,cast:false});
  addBox(1,3.8,2*ARENA+4,-E,0,0,wall,{collide:false,cast:false});addBox(1,3.8,2*ARENA+4,E,0,0,wall,{collide:false,cast:false});
  const cols=[0xb9a68f,0xa9b0a4,0xc4a48c,0x9aa4b4,0xb59a8c,0xaaa292];let sk=0;
  const skyl=(x0,x1,z0,z1,h)=>facade(x0,x1,z0,z1,h,cols[sk++%cols.length],{collide:false,cast:false});
  for(let i=0;i<7;i++){const x=-72+i*24;skyl(x-8,x+8,-104,-92,22+(i*7)%16);skyl(x-8,x+8,92,104,20+(i*5)%18)}
  for(let i=0;i<7;i++){const z=-72+i*24;skyl(-104,-92,z-8,z+8,24+(i*9)%14);skyl(92,104,z-8,z+8,22+(i*4)%16)}

  /* ---- tory (instancing) ---- */
  const SEG=[9,-1,-11,-21,-31,-41,-51,-61,-71],tr=(x,n)=>SEG.slice(0,n).map(z=>({x,z}));
  DS.props.instance('torProsty',[...tr(-26,9),...tr(18,8),...tr(0,6),...tr(44,8)],{seed:7,opts:{variant:'beton'}});
  DS.props.instance('torProsty',[...tr(-18,8),...tr(26,9)],{seed:11,opts:{variant:'drewno'}});
  // trakcja: słupy po stronie zewnętrznej (T1, T3, T7 rotY=0: słup na -X), T2 i T4 odwrócone (słup na +X); sieć 40 m
  DS.props.instance('slupTrakcyjny',[{x:-26,z:-14},{x:-26,z:-54},{x:-18,z:14,rotY:PI},{x:-18,z:-26,rotY:PI},{x:18,z:-14},{x:18,z:-54},
    {x:26,z:14,rotY:PI},{x:26,z:-26,rotY:PI},{x:44,z:-14},{x:44,z:-54}],{seed:3,opts:{span:40}});
  // kozły oporowe: czoła T1-T5 od południa, końce T2/T3/T5/T7 od północy
  for(const x of [-26,-18,0,18,26])put('kozlOporowy',{x,z:13,rotY:0});
  for(const [x,z] of [[-18,-60],[18,-60],[0,-44.5],[44,-68]])put('kozlOporowy',{x,z,rotY:PI});

  /* ---- perony: wyspy z przerwami G1 (z -16..-12) i G2 (z -39..-35) ---- */
  for(const [x,rot] of [[-22,0],[22,PI]]){
    put('peron',{x,z:.25,rotY:rot,variant:'wiata',len:24.5,seed:x});
    put('peron',{x,z:-25.5,rotY:rot,variant:'goly',len:19,seed:x+1});
    put('peron',{x,z:-49.5,rotY:rot,variant:'wiata',len:21,seed:x+2});
  }
  // brame nad torami z neonami, drogowskazy
  gantry(-30,-14,10,'PERON 1-2','#ffe14a','#2a1a06');gantry(14,30,10,'PERON 3-4','#43f0ff','#06202a');

  /* ---- tabor: składy tworzą korytarze; przerwy 2-9 m ---- */
  put('wagonOsobowy',{x:-26,z:.8,variant:'zielony',seed:3});put('lokET22',{x:-26,z:-26,seed:2});put('lokEU07',{x:-26,z:-50,seed:1});
  put('weglarka',{x:-18,z:6,variant:'pelna'});put('cysterna',{x:-18,z:-7.8,seed:2});put('weglarka',{x:-18,z:-26,variant:'pusta'});put('lokSM42',{x:-18,z:-48});
  put('drezyna',{x:18,z:3});put('cysterna',{x:18,z:-26.5,seed:5});put('lokET22',{x:18,z:-48.5,seed:3});
  put('wagonKryty',{x:26,z:7});put('wagonKryty',{x:26,z:-6,seed:4});put('weglarka',{x:26,z:-26,variant:'pelna'});put('lokSM42',{x:26,z:-52});
  put('lokSM42',{x:0,z:-36});put('drezyna',{x:0,z:-18});                                  // T5: lokomotywa na środku areny bossa
  put('lokSM42',{x:44,z:-2});put('wagonKryty',{x:44,z:-17,seed:6});put('wagonKryty',{x:44,z:-28.5,seed:7});put('weglarka',{x:44,z:-56,variant:'pelna'});

  /* ---- tunele T1 i T4 ---- */
  put('tunelWylot',{x:-26,z:-64,rotY:0,seed:4});put('tunelWylot',{x:26,z:-64,rotY:0,seed:5});
  put('semaforKsztaltowy',{x:-29.5,z:-58,variant:'jedz'});put('semaforSwietlny',{x:29.5,z:-58,variant:'stoj'});
  addPart(new THREE.BoxGeometry(.3,.3,.3),new THREE.Matrix4().makeTranslation(-26,3.2,-72),{color:0xfff0b8},{basic:true,cast:false,receive:false,ray:false,edges:false});
  addPart(new THREE.BoxGeometry(.3,.3,.3),new THREE.Matrix4().makeTranslation(26,3.2,-72),{color:0xfff0b8},{basic:true,cast:false,receive:false,ray:false,edges:false});

  /* ---- dworzec z poczekalnią + neon na dachu (punkt orientacyjny) ---- */
  put('dworzec',{x:0,z:30,rotY:0,name:'STRZELNICA GŁÓWNA',seed:2});
  sign('STRZELNICA GŁÓWNA','#ffd23a','#2a0a14',13,3,0,11.2,36.5);for(const sx of [-5.5,5.5])addBox(.25,2.4,.25,sx,8.6,36.4,{color:C.steel},{collide:false});
  sign('DWORZEC','#ff4fd8','#1c0a26',9,2.4,0,11.2,23.5,PI);
  facade(-28,-20,27,32,3.4,0xb8b4a4);sign('WC','#43f0ff','#06202a',2.6,1.2,-24,2.8,32.08);
  facade(20,30,25,33,4.2,0xa05a44);sign('BAGAŻE','#ffe14a','#2a1a06',5,1.4,25,3.4,33.08);
  put('lawka',{x:-6,z:41,rotY:PI,variant:'beton'});put('lawka',{x:6,z:41,rotY:PI,variant:'beton'});
  put('lawka',{x:-8,z:20.5,rotY:PI,variant:'stal'});put('lawka',{x:8,z:20.5,rotY:PI,variant:'stal'});

  /* ---- plac dworcowy (start): kioski, taxi, wiaty, ławki, automaty ---- */
  put('kioskRuch',{x:-26,z:56,rotY:0});put('neonSzyld',{x:-26,y:1.75,z:57.45,rotY:0,variant:'otwarte'});
  put('kioskRuch',{x:30,z:50,rotY:PI});put('neonSzyld',{x:30,y:1.75,z:48.55,rotY:PI,variant:'disco'});
  put('wiataPrzystankowa',{x:-38,z:46,rotY:PI/2});put('wiataPrzystankowa',{x:40,z:64,rotY:-PI/2});
  car('polonez',-14,50,PI/2,0xe8c030);car('zukA06',14,56,PI/2,0xf4efe4);car('passatB5',-42,64,0,0x2d5fa8);car('fiat126p',44,72,PI,0xd3242a);
  car('polonez',-50,52,0,0x4f8a5b);car('passatB5',20,70,0,0x9aa0a8);car('fiat126p',-20,66,PI/2,0xe07a2a);
  for(const x of [-18,18])put('donica',{x,z:42,variant:'beton'});put('donica',{x:-3,z:56,variant:'skrzynia'});put('donica',{x:6,z:60,variant:'beton'});
  put('slupOgloszeniowy',{x:-20,z:46});put('koszUliczny',{x:-3,z:45});put('koszUliczny',{x:3,z:45});put('hydrant',{x:-12,z:66,rotY:0});
  put('smietnik',{x:-54,z:42,variant:'kontener'});put('smietnik',{x:56,z:42,variant:'pojemnik'});
  for(const [x,z] of [[-10,62],[10,66],[-30,70]])put('barierka',{x,z,rotY:PI/2,len:3});
  for(const [x,z,v] of [[-34,42,'lipa'],[34,42,'lipa'],[-52,70,'brzoza'],[52,74,'topola'],[-24,74,'lipa'],[26,76,'brzoza'],[-46,40,'brzoza'],[48,44,'lipa'],[0,76,'lipa'],[-40,76,'topola']])put('drzewo',{x,z,variant:v,seed:x*3+z});
  healMachines([{kind:'vending',x:-10.4,z:75.4,rotY:PI},{kind:'station',x:10.4,z:75.4,rotY:PI}]);
  // neonowy totem „DWORZEC” (widoczny z całej strefy startu) i szyld przy kasie
  addBox(.6,13,.6,-46,0,50,{color:C.steel},{});sign('DWORZEC PKP','#43f0ff','#06202a',8,2.4,-46,13.4,50.4);sign('DWORZEC PKP','#43f0ff','#06202a',8,2.4,-46,13.4,49.6,PI);
  addBox(.6,13,.6,46,0,56,{color:C.steel},{});sign('BIGOS 24H','#ff9a2a','#240a06',7,2.2,46,13.4,56.4);sign('BIGOS 24H','#ff9a2a','#240a06',7,2.2,46,13.4,55.6,PI);

  /* ---- hala peronowa, kozły, wózki, kioski ---- */
  put('kioskRuch',{x:-20,z:19,rotY:0});put('neonSzyld',{x:-20,y:1.75,z:20.45,rotY:0,variant:'piwo'});
  put('kioskRuch',{x:20,z:19,rotY:0});put('neonSzyld',{x:20,y:1.75,z:20.45,rotY:0,variant:'otwarte'});
  put('wozekBagazowy',{x:-8,z:17,rotY:.4});put('wozekBagazowy',{x:9,z:18,rotY:-.3});put('wozekBagazowy',{x:-34,z:19,rotY:PI/2});
  put('tablicaKolej',{x:-30.5,z:15.5,variant:'uwaga'});put('tablicaKolej',{x:30.5,z:15.5,variant:'uwaga'});
  put('skrzynkaPrzekaznikowa',{x:-12,z:11,variant:'szara'});put('skrzynkaPrzekaznikowa',{x:12,z:11,variant:'zielona'});
  put('semaforSwietlny',{x:-8,z:8,variant:'wolna'});put('semaforSwietlny',{x:8,z:8,variant:'stoj'});
  put('hydrant',{x:34,z:17,rotY:0});put('koszUliczny',{x:-35,z:17});

  /* ---- plac manewrowy i arena bossa (x -14..14, z -48..-18) ---- */
  for(const [x,z,v] of [[-6,-23,'szara'],[6,-25,'zielona'],[-10,-31,'szara'],[11,-34,'szara'],[-6,-42,'zielona'],[6,-43,'szara']])put('skrzynkaPrzekaznikowa',{x,z,variant:v,rotY:(x+z)%3});
  stack(-12,-45);stack(10.5,-46.5);stack(-12.5,-21);stack(9.5,-18.5);
  put('barrier',{x:-9,z:-37,w:3.2,d:.9});put('barrier',{x:9,z:-30,w:.9,d:3.2});put('barrier',{x:-3.5,z:-48,w:3,d:.9});
  put('semaforKsztaltowy',{x:-13.4,z:-26,variant:'jedz'});put('semaforSwietlny',{x:13,z:-22,variant:'stoj'});
  put('wozekBagazowy',{x:4,z:-12,rotY:.7});put('hydrant',{x:-13,z:-13,rotY:0});
  placeBarrels([{x:-10.5,z:-27},{x:-9.5,z:-27.9},{x:12,z:-40.5},{x:10.9,z:-41.2}]);          // skupisko 1: arena bossa
  healMachines([{kind:'station',x:12.6,z:-49,rotY:-PI/2}]);

  /* ---- nastawnia (punkt orientacyjny) i przekaźkownia (sekret 2) ---- */
  put('nastawnia',{x:0,z:-60,rotY:0,seed:3});
  sign('NASTAWNIA','#ff4a2a','#10060a',5,1.2,0,6.3,-57.0);
  const pr=room({x0:-18,x1:-8,z0:-68,z1:-58,h:3.2,wall:0x7a5a4a,roof:0x3a3836,floor:0x3a3632,light:0xffd080,door:{side:'e',c:-62,w:2.2,h:2.4,secret:true,label:'PRZEKAŹNIKOWNIA'}});
  sign('SRK','#ff7a3a','#240a06',2.6,1.1,-8.45,3.6,-62,PI/2);
  put('skrzynkaPrzekaznikowa',{x:-16,z:-60,variant:'szara'});put('skrzynkaPrzekaznikowa',{x:-14.4,z:-60,variant:'zielona'});put('skrzynkaPrzekaznikowa',{x:-16,z:-66,variant:'szara'});
  put('crate',{x:-10,z:-66.5,s:1.6});put('crate',{x:-11.7,z:-66.5,s:1.6});
  addBox(.16,1.2,3.6,-17.6,1,-63,{color:0x2a2e32},{collide:false});
  void pr;
  // zaułek za nastawnią, hangar SRK, krótkie pasy osłon
  facade(6,17,-76,-68,4.6,0x8a8478);sign('SRK WARSZTAT','#ffe14a','#2a1a06',6,1.4,11.5,3.9,-67.9);
  put('semaforSwietlny',{x:7,z:-64,variant:'wolna'});stack(8,-62.5);put('skrzynkaPrzekaznikowa',{x:15,z:-64,variant:'szara'});
  put('barrier',{x:-4,z:-72,w:3,d:.9});put('barrier',{x:2,z:-67,w:.9,d:3});put('smietnik',{x:-6,z:-76,variant:'kontener'});
  put('skrzynkaPrzekaznikowa',{x:-3,z:-75,variant:'zielona'});

  /* ---- aleje wzdłuż torów: zachodnia i wschodnia ---- */
  for(const [x,z,v] of [[-35,-20,'szara'],[-31,-45,'zielona'],[-36,-62,'szara'],[31,-22,'zielona'],[35,-53,'szara'],[31,-64,'zielona']])put('skrzynkaPrzekaznikowa',{x,z,variant:v});
  for(const [x,z,r] of [[-34,-27,0],[34,-30,0],[-33,3,PI/2],[33,-9,PI/2]])put('barierka',{x,z,rotY:r,len:3});
  put('wozekBagazowy',{x:33,z:-30,rotY:.5});put('wozekBagazowy',{x:-33,z:-53,rotY:-.4});
  put('tablicaKolej',{x:-30.5,z:-4,variant:'uwaga'});
  const lamps=[[-33,8],[-33,-14],[-33,-38],[-33,-62],[33,8],[33,-14],[33,-52],[33,-66],[-8,12],[8,12],[-12,-18],[12,-50],[-5.5,-65],[8,-60],[-44,-26],[-70,-38],[-70,-48],[-48,10],[-70,20],[50,-8],[50,-38],[66,-20],[66,-60],
    [-8,44],[8,44],[-28,60],[28,60],[-8,72],[8,72],[-48,48],[48,52]];
  DS.props.instance('lampaUliczna',lamps.map(([x,z])=>({x,z,rotY:x<0?-PI/2:PI/2})),{seed:5,opts:{variant:'kobra'}});

  /* ---- zachód: zejście do przejścia (sekret 1), wieża ciśnień, garaże, wiadukt, złomowisko ---- */
  put('przejscieZejscie',{x:-40.3,z:8,rotY:PI/2,seed:2});
  sign('PRZEJŚCIE PODZIEMNE','#43f0ff','#06202a',5.4,1.1,-38.2,3.6,8,PI/2);
  room({x0:-56,x1:-42.8,z0:1,z1:15,h:3.2,wall:0x6e6a62,roof:0x3a3836,floor:0x44403a,light:0xa0d8ff,door:{side:'e',c:8,w:2.2,h:2.4,secret:true,label:'ZEJŚCIE SŁUŻBOWE'}});
  sign('PRZEJŚCIE ZAMKNIĘTE','#ff4a2a','#10060a',5,1,-42.55,3.6,12,-PI/2);
  stack(-54,2.5);put('crate',{x:-53,z:12.8,s:1.6});put('crate',{x:-51.3,z:12.8,s:1.6});
  healMachines([{kind:'station',x:-54.6,z:8,rotY:PI/2}]);
  waterTower(-66,26);
  put('garazeBlaszane',{x:-68,z:-4,rotY:0,count:7,seed:9});put('garazeBlaszane',{x:-62,z:36,rotY:PI,count:5,seed:10});
  car('fiat126p',-52,28,PI/2,0xb5534f);car('zukA06',-48,20,0,0x9aa0a8);car('polonez',-74,16,PI/2,0xe0c040);
  put('stacjaTrafo',{x:-47,z:34,rotY:0,variant:'ceglana'});put('wiataSmietnikowa',{x:-72,z:30,rotY:PI/2,variant:'blacha'});
  for(const [x,z,v] of [[-74,10,'lipa'],[-60,14,'brzoza'],[-46,-8,'topola'],[-76,-14,'lipa'],[-50,-14,'brzoza']])put('drzewo',{x,z,variant:v,seed:x+z});
  // wiadukt (3 łuki): aleje E-W pod spodem; tor na górze kończy się kozłami na wysokości pomostu
  for(const z of [-48,-36,-24])railViaduct(-56,z);
  put('kozlOporowy',{x:-56,y:5.65,z:-20,rotY:0,collide:false});put('kozlOporowy',{x:-56,y:5.65,z:-52,rotY:PI,collide:false});
  sign('WIADUKT','#ffd23a','#2a1a06',5,1.2,-56,5.6,-17.0);
  // złomowisko w zachodnim zaułku i nad aleją
  stack(-72,-27);stack(-64,-21);stack(-74,-47);put('crate',{x:-66,z:-26,s:1.6});put('crate',{x:-76,z:-22,s:1.6});
  put('smietnik',{x:-77,z:-31,variant:'kontener'});put('smietnik',{x:-46,z:-50,variant:'pojemnik'});put('hydrant',{x:-45,z:-30,rotY:0});
  car('zukA06',-66,-36,0,0xe0c040);car('fiat126p',-48,-37,PI/2,0xd3242a);
  placeBarrels([{x:-75.2,z:-36.4},{x:-76.3,z:-35.5},{x:-75,z:-34.9}]);                         // skupisko 2: ślepy koniec alei
  facade(-76,-62,-76,-64,6,0x8a7468);sign('WARSZTATY PKP','#ff9a2a','#240a06',9,2.2,-69,5,-63.9);
  stack(-52,-62);put('barrier',{x:-44,z:-66,w:3.2,d:.9});
  car('polonez',-56,-60,PI/2,0x2d5fa8);
  // południowo-zachodni róg placu: wiata, skrzynie, auta (osłony co 6-10 m)
  put('wiataPrzystankowa',{x:-72,z:58,rotY:PI/2});stack(-70,50);stack(-64,66);car('passatB5',-68,72,0,0x4f8a5b);car('zukA06',-74,44,PI/2,0xb5534f);

  /* ---- wschód: brama bocznicy (auto), magazyny z rampami, przejazd z zaporą, zaplecze (sekret 3), komin ---- */
  fence('x',14,40,78,{gaps:[[41,47]],color:0x3e4248});
  slidingDoor('x',14,44,6,2.4,{auto:true,color:0x6a6e70,range:6,thick:.25});
  addBox(.4,4.2,.4,41,0,14,{color:C.steel},{});addBox(.4,4.2,.4,47,0,14,{color:C.steel},{});addBox(6.4,.5,.4,44,4.2,14,{color:C.steel},{collide:false});
  sign('BOCZNICA','#ffe14a','#2a1a06',5,1.2,44,5.35,14.3);
  put('magazynKolejowy',{x:53.3,z:-22,rotY:PI,seed:2});put('magazynKolejowy',{x:53.3,z:-54,rotY:PI,seed:3});
  put('rampa',{x:40.8,z:-4,rotY:PI});
  put('zaporaKolejowa',{x:39.8,z:-35.7,rotY:PI/2,variant:'zamknieta'});put('zaporaKolejowa',{x:48.2,z:-41.6,rotY:-PI/2,variant:'otwarta'});
  put('tablicaKolej',{x:38.6,z:-33.8,variant:'krzyz'});put('tablicaKolej',{x:49.5,z:-43.4,variant:'krzyz',rotY:PI});
  put('budkaDroznika',{x:34.5,z:-46,rotY:0,seed:2});sign('PRZEJAZD','#ff4a2a','#10060a',3.4,.9,34.5,3.6,-44.2);
  chimney(66,24);put('stacjaTrafo',{x:50,z:30,rotY:0,variant:'beton'});put('wiataSmietnikowa',{x:62,z:44,rotY:-PI/2,variant:'ceglana'});
  for(const [x,z,v] of [[70,40,'lipa'],[56,32,'brzoza'],[74,-72,'topola'],[62,-72,'lipa']])put('drzewo',{x,z,variant:v,seed:x+z});
  stack(60,-8);stack(69,-10);stack(66,-44);stack(72,-52);stack(61,4);put('crate',{x:74,z:-14,s:1.6});put('crate',{x:70,z:-36,s:1.6});
  put('smietnik',{x:73,z:-5,variant:'kontener'});put('smietnik',{x:60,z:2,variant:'pojemnik'});put('skrzynkaPrzekaznikowa',{x:76,z:-22,variant:'szara'});
  put('wozekBagazowy',{x:60,z:-33,rotY:-.5});put('wozekBagazowy',{x:62,z:-60,rotY:.9});
  car('zukA06',66,-40,PI/2,0x4f8a5b);car('polonez',72,-66,0,0xb5534f);car('fiat126p',60,-20,PI/2,0xe0c040);
  room({x0:63,x1:73,z0:-30,z1:-20,h:3.2,wall:0x8a5a42,roof:0x3d3a38,floor:0x3a3632,light:0xffc070,door:{side:'w',c:-25,w:2.2,h:2.4,secret:true,label:'ZAPLECZE MAGAZYNU',dir:-1}});
  sign('MAGAZYN 3','#ff7a3a','#240a06',4.4,1.1,62.55,3.6,-25,-PI/2);
  stack(69,-28.3);put('crate',{x:71.4,z:-21.5,s:1.6});put('crate',{x:65,z:-21.5,s:1.6});
  placeBarrels([{x:70,z:-38.4},{x:71.1,z:-38.8},{x:69.8,z:-39.6}]);                            // skupisko 3: plac za magazynem
  healMachines([{kind:'vending',x:77,z:-34,rotY:-PI/2}]);

  /* ---- znajdźki (id stabilne!) ---- */
  placeCollectibles(level,[
    {id:'dw-kaseta-1',type:'kaseta',x:-41.5,z:46,name:'Zenek: Pociąg do Szczęścia',hint:'za wiatą przystankową'},
    {id:'dw-kaseta-2',type:'kaseta',x:-26,z:-74.5,name:'Weekend: Tunel Miłości',hint:'ślepy koniec tunelu'},
    {id:'dw-kaseta-3',type:'kaseta',x:-56,z:-36,name:'Akcent: Pod Wiaduktem',hint:'środkowy łuk wiaduktu'},
    {id:'dw-kaseta-4',type:'kaseta',x:-51,z:8,name:'Boys: Ostatni Peron',hint:'zejście służbowe',secret:true},
    {id:'dw-lancuch-1',type:'lancuch',x:-22,z:-14,name:'Złoty łańcuch z przejścia przez peron',value:70},
    {id:'dw-lancuch-2',type:'lancuch',x:68,z:2,name:'Łańcuch spod rampy',value:80},
    {id:'dw-lancuch-3',type:'lancuch',x:-12.6,z:-42,name:'Łańcuch zza skrzyń na placu',value:90},
    {id:'dw-lancuch-4',type:'lancuch',x:-52,z:4,name:'Łańcuch z przejścia podziemnego',value:140,secret:true},
    {id:'dw-klucz-1',type:'klucz',x:-15,z:-64,name:'Klucz do skrzynki: przekaźkownia',secret:true},
    {id:'dw-klucz-2',type:'klucz',x:68,z:-26,name:'Klucz do skrzynki: zaplecze magazynu',secret:true},
    {id:'dw-plakat-1',type:'plakat',x:3.8,z:27,name:'Plakat: Odjazdy, wszystko opóźnione',hint:'poczekalnia',value:30},
    {id:'dw-plakat-2',type:'plakat',x:-36,z:-57,name:'Plakat: Zenek na Dniach Kolejarza',hint:'aleja zachodnia',value:30},
    {id:'dw-plakat-3',type:'plakat',x:74,z:-3,name:'Plakat: Przetarg na złom, wpisowe 5 zł',hint:'zaplecze bocznicy',value:30},
  ]);

  /* ---- nawigacja AI: osłony z rekwizytów (bez ścian), siatka z colliderów ---- */
  buildNav(level,{coverMax:27,coverMaxH:6,coverLimit:520,assign:true});
}

/* ------------------------------------------------------------------ zdarzenia poziomu: ambient, ukończenie */
let amb=null,hornT=0;
function stopAmbient(){if(amb){for(const n of amb){try{n.src.stop()}catch(e){}try{n.g.disconnect()}catch(e){}}amb=null}}
function startAmbient(){
  stopAmbient();
  if(!AU.ctx||!AU.noise)return;
  try{
    amb=[];
    for(const [type,f,gain] of [['lowpass',170,.075],['bandpass',900,.016]]){    // dudnienie taboru + wiatr po torach
      const src=AU.ctx.createBufferSource();src.buffer=AU.noise;src.loop=true;
      const fl=AU.ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;
      const g=AU.ctx.createGain();g.gain.value=gain;
      src.connect(fl);fl.connect(g);g.connect(AU.sfx||AU.master);src.start();amb.push({src,g});
    }
  }catch(e){amb=null}
  hornT=14;
}
/** Odległy sygnał lokomotywy (dwa tony), co 25-45 s w trakcie runu. */
function horn(){
  if(!AU.ctx||!AU.sfx&&!AU.master)return;
  try{
    const t=AU.ctx.currentTime,g=AU.ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+.12);g.gain.setValueAtTime(.05,t+1.1);g.gain.exponentialRampToValueAtTime(.0001,t+1.7);
    const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;g.connect(lp);lp.connect(AU.sfx||AU.master);
    for(const f of [196,247]){const o=AU.ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(g);o.start(t);o.stop(t+1.8)}
  }catch(e){}
}
const here=()=>world.level&&world.level.id===ID;
DS.bus.on('levelLoad',e=>{if(e&&e.level===ID)mergeIntoZones()});
DS.bus.on('levelStart',()=>{
  if(!here())return;
  startAmbient();
  const G=S.G;if(G){G.levelWon=false;setTimeout(()=>{if(S.G===G&&here()){const st=collectStats(L);announce('DWORZEC I BOCZNICA','Znajdźki '+st.found+'/'+st.total+'  |  3 sekrety')}},1800)}
});
DS.bus.on('levelEnd',stopAmbient);
DS.bus.on('levelUnload',stopAmbient);
DS.bus.on('update',dt=>{
  if(!amb||!here()||!S.G||S.G.paused)return;
  hornT-=dt;if(hornT<=0){hornT=25+Math.random()*20;horn()}
});
DS.bus.on('kill',({enemy:e})=>{
  const G=S.G;if(!G||!here()||!e||!e.boss||G.levelWon)return;       // boss z puli tabeli (Dyżurny Ruchu, Jednooki, DJ...) kończy poziom
  G.levelWon=true;
  save.coins+=L.win.reward.coins;save.keys+=L.win.reward.keys;G.earned+=L.win.reward.coins;G.keysFound+=L.win.reward.keys;
  save.levelsDone=save.levelsDone||{};save.levelsDone[ID]=true;persist();
  setTimeout(()=>{if(S.G===G)announce(L.win.text,'+'+L.win.reward.coins+' ZD i klucz. Gra toczy się dalej.')},1500);
  DS.bus.emit('levelComplete',{level:ID,wave:G.wave});
});
