// Poziom 2: Blokowisko (Osiedle Słoneczne, PRL). Właściciel katalogu: ds-level-designer.
//
// Arena 78 m od środka (156 x 156 m = 24 336 m2, ok. 3,4x Remiza). Wieczór: różowo-miedziane niebo, niskie ciepłe słońce, neony.
// +X = wschód (prawo na planie), -Z = północ (góra planu). Gracz startuje na południu (0,70) i patrzy na północ.
//
//  PLAN (+X wschód, -Z północ; 1 znak ~ 5 m; [..] = budynek, * = sekret)
//        -78 ........................................................................ +78
//  -78  |[D wieża1 BLOKOWISKO]  bazar   [PAWILON 24H neony]   | ORLIK: boisko, płyty, beczki |
//  -50  |                       ═════ ul. Tylna ═════════════╪═ bramy; reflektory; KOMIN ⌂  |
//  -34  |[E wieża2]      [   BLOK 12 (A)   ]                 .  skwer, trafo  [kotłownia*] |
//   -6  | błonia  [B]  ┌ dziedziniec: słup DISCO POLO, plac zabaw, trzepaki ┐ [C]  skwer   |
//       | piwnica* ... └─ wiaty, trafo, Maluchy, murek ze schodami ─────────┘               |
//   26  | tyły garaży: garaż 13*        oś N-S (jezdnia)             PARKING 3 rzędy [F p5] |
//   48  | ══ garaże: uliczka 1 ══ ┤ poprzeczna ├ ════                  budka z piwem, wiaty  |
//   64  | ══ garaże: uliczka 2 ══   [Delikatesy] BRAMA [Monopolowy]                       |
//   78  |_____________ START (0,70): wjazd, automaty, neon OSIEDLE SŁONECZNE ______________|
//
// Wysokości: silnik ma płaską podłogę (y=0, tylko skok), więc "piętra" są oddane wizualnie: wieże 11-piętrowe z neonami, dachy garaży,
// komin 38 m, a zamiast piwnic są trzy ukryte pokoje (E przy drzwiach). Szczegóły i prośby: docs/requests/ds-level-designer.md.
//
// Znajdźki: 13 (4 kasety, 4 złote łańcuchy, 2 klucze, 3 plakaty-easter eggi), 3 sekrety, 6 beczek wybuchowych na 3 skupiskach, 4 automaty.
import {DS} from '../../core/ds.js';
import {save,persist,opt} from '../../core/save.js';
import {S} from '../../core/state.js';
import {scene} from '../../render/renderer.js';
import {toon} from '../../render/materials.js';
import {groundTex} from '../../render/textures.js';
import {announce} from '../../render/comicfx.js';
import {setTrack} from '../../audio/music.js';
import {A as AU} from '../../audio/context.js';
import {addBox} from '../build.js';
import {addPart} from '../batch.js';
import {world} from '../state.js';
import {setEnv,slab,boxB,facade,fence,lowCol,room,placeCollectibles,placeBarrels,healMachines,buildNav,collectStats,mergeIntoZones} from './common.js';

const ID='blokowisko',ARENA=78,PI=Math.PI;
const put=(id,o)=>DS.props.get(id).place(o);
const ROAD=0x46424e,PAV=0xb4ab9a,GRASS=0x587a42,YARD=0x4e4a54,LOT=0x403d48,SAND=0xcdb784,CONC=0x9b958a;

const L={
  id:ID,name:'Blokowisko',arena:ARENA,
  desc:'Osiedle z wielkiej płyty: trzepaki, garaże, śmietniki, Maluchy i ukryte piwnice. Boss: Szef Ochrony na Orliku.',
  spawn:{x:0,z:70,yaw:0},
  starts:[{x:0,z:70,yaw:0,name:'Wjazd'},{x:-22,z:-8,yaw:PI/2,name:'Dziedziniec'},{x:50,z:-44,yaw:PI,name:'Przy Orliku'}],
  menuCam:{r:62,y:30,look:[0,6,0]},
  track:'B',
  // Wrogowie: tabela klimatu 'blokowisko' (js/enemies/table.js) + pula bossów poziomu. Boss co 5 fal: Szef Ochrony -> Jednooki -> DJ.
  enemies:{boss:{every:5,pool:['boss_szef_ochrony','boss_jednooki','boss_dj']}},
  // Strefy spawnu (dla waves/manager: spawn {x,z,r} z wagą; dziś manager losuje pierścień 22-36 m od środka, który wypada na dziedzińcu).
  spawnZones:[
    {id:'dziedziniec',x:0,z:-4,r:16,w:3,from:1},{id:'bazar',x:-32,z:-56,r:10,w:2,from:1},{id:'tylna',x:20,z:-45,r:12,w:2,from:2},
    {id:'blonia',x:-58,z:12,r:12,w:2,from:2},{id:'parking',x:44,z:50,r:14,w:3,from:1},{id:'garaze',x:-45,z:48,r:10,w:2,from:3},
    {id:'skwer',x:50,z:-8,r:10,w:1.5,from:4},{id:'orlik',x:49,z:-63,r:12,w:1,from:5,boss:true},
  ],
  // Scenariusz fal: 1-2 gangsterzy z dziedzińca; 3-4 dresy spod trzepaków, bandyci z obrzynem; 5 BOSS Szef Ochrony (Orlik);
  // 6-9 pijacy i kamikadze z garaży; 10 BOSS Jednooki; 11+ snajperzy na dachach, kierowcy Maluchów, medyk; 15 BOSS DJ.
  waves:{
    intro:'Godzina 22:40. Osiedle Słoneczne. Dresy pod trzepakiem, a Szef Ochrony pilnuje Orlika.',
    plan:[{from:1,note:'gangsterzy z dziedzińca, bez limitu'},{from:3,note:'dresy spod trzepaków, bandyci z obrzynem'},
      {from:5,boss:'boss_szef_ochrony',note:'Szef Ochrony wchodzi od Orlika; osłony: płyty betonowe, beczki'},{from:6,note:'pijacy z garaży, kamikadze'},
      {from:10,boss:'boss_jednooki'},{from:11,note:'kierowcy Maluchów (parking), snajperzy, medycy'},{from:15,boss:'boss_dj'}],
    bossWave:5,bossArena:{x:49,z:-63,hw:22,hd:12,gates:[{x:26,z:-64},{x:38,z:-52},{x:72,z:-57}]},
  },
  // Ukończenie poziomu: pokonanie Szefa Ochrony (fala 5). Gra toczy się dalej (tryb bez końca), a nagroda jest raz na run.
  win:{kind:'boss',boss:'boss_szef_ochrony',reward:{coins:300,keys:1},text:'BLOKOWISKO WYCZYSZCZONE!'},
  secrets:[{id:'piwnica',name:'Piwnica Ziomka'},{id:'garaz13',name:'Garaż nr 13'},{id:'kotlownia',name:'Kotłownia'}],
  build(){ buildBlokowisko(this) },
};
DS.levels.register(L);

function buildBlokowisko(level){
  /* ---- niebo, mgła, światło: wieczór ---- */
  setEnv({sky:0xc4789a,fogNear:46,hemi:[0xffcfae,0x56486a,.74],sun:[0xffa868,.95],sunDir:[-44,34,-30]});

  /* ---- teren ---- */
  const gt=groundTex.clone();gt.repeat.set(40,40);gt.needsUpdate=true;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,420),toon(0x8a8272,{map:gt}));ground.rotation.x=-PI/2;ground.receiveShadow=true;scene.add(ground);world.meshes.push(ground);
  slab(-ARENA,ARENA,-ARENA,ARENA,0,.03,GRASS);
  // jezdnie i place
  slab(-6,6,-27,78,.03,.03,ROAD);                       // oś N-S
  slab(-60,78,-49,-43,.03,.03,ROAD);                    // ul. Tylna
  slab(-30,30,64,78,.03,.03,YARD);                      // wjazd
  slab(30,60,28,76,.03,.03,LOT);                        // parking
  slab(-78,-30,45,51,.03,.03,ROAD);slab(-78,-30,61.4,67.4,.03,.03,ROAD);slab(-56,-50,39.8,72.6,.03,.03,ROAD);slab(-78,-30,72.6,78,.03,.03,ROAD);
  slab(-10,10,56,64,.03,.03,ROAD);
  // chodniki
  slab(-20,20,-30.5,-27,.06,.03,PAV);slab(-34.5,-31,-14,10,.06,.03,PAV);slab(31,34.5,-14,10,.06,.03,PAV);slab(-34.5,34.5,-1.5,1.5,.06,.03,PAV);
  slab(-46,-18,-58,-50,.06,.03,PAV);slab(-14,14,-62,-58,.06,.03,PAV);slab(54,76,-24,2,.06,.03,PAV);slab(-62,-44,-16,10,.06,.03,PAV);
  slab(-31,-13,-27,-11,.06,.03,SAND);                    // plac zabaw
  // Orlik: murawa i linie
  slab(28,70,-74,-54,.03,.03,0x3f8040);
  for(const [a,b,c,d] of [[28,70,-64.12,-63.88],[48.88,49.12,-74,-54],[28,29,-74,-54],[69,70,-74,-54],[28,70,-55,-54],[28,70,-74,-73]])slab(a,b,c,d,.06,.015,0xe8e8dc);
  slab(28,38,-69,-59,.06,.015,0xe8e8dc);slab(28.15,37.85,-68.85,-59.15,.058,.02,0x3f8040);slab(60,70,-69,-59,.06,.015,0xe8e8dc);slab(60.15,69.85,-68.85,-59.15,.058,.02,0x3f8040);

  /* ---- obwód: mur i panorama miasta za nim ---- */
  const wall={color:CONC},E=ARENA+.6;
  addBox(2*ARENA+4,3.8,1,0,0,-E,wall,{collide:false,cast:false});addBox(2*ARENA+4,3.8,1,0,0,E,wall,{collide:false,cast:false});
  addBox(1,3.8,2*ARENA+4,-E,0,0,wall,{collide:false,cast:false});addBox(1,3.8,2*ARENA+4,E,0,0,wall,{collide:false,cast:false});
  const cols=[0xcdbfa6,0xb9c4b8,0xd2b6a0,0xaab4c4,0xc9a999,0xbfb7a6];
  let sk=0;
  const sky=(x0,x1,z0,z1,h)=>facade(x0,x1,z0,z1,h,cols[sk++%cols.length],{collide:false,cast:false});
  for(let i=0;i<7;i++){const x=-72+i*24;sky(x-8,x+8,-104,-92,26+(i*7)%18);sky(x-8,x+8,92,104,24+(i*5)%20)}
  for(let i=0;i<7;i++){const z=-72+i*24;sky(-104,-92,z-8,z+8,28+(i*9)%16);sky(92,104,z-8,z+8,25+(i*4)%19)}

  /* ---- bloki z wielkiej płyty ---- */
  put('blokMieszkalny',{x:0,z:-36,rotY:0,variant:'p5',seed:11});            // A: front ku południu (dziedziniec)
  put('blokMieszkalny',{x:-40,z:-2,rotY:PI/2,variant:'p4',seed:12});        // B: front ku wschodowi
  put('blokMieszkalny',{x:40,z:-2,rotY:-PI/2,variant:'p4',seed:13});        // C: front ku zachodowi
  put('blokMieszkalny',{x:-58,z:-62,rotY:0,variant:'p11',seed:14});         // D: wieża 1
  put('blokMieszkalny',{x:-68,z:-34,rotY:PI/2,variant:'p11',seed:15});      // E: wieża 2
  put('blokMieszkalny',{x:66,z:30,rotY:-PI/2,variant:'p5',seed:16});        // F: wschodnia płyta nad parkingiem
  const neon=DS.props.get('neonSign');
  neon.place({text:'BLOKOWISKO',color:'#ff4fd8',bg:'#1c0a26',w:18,h:4.6,x:-58,y:35.4,z:-62.2});for(const sx of [-6,6])addBox(.4,1.6,.4,-58+sx,32.2,-62.4,{color:0x55595e},{collide:false});
  neon.place({text:'DISCO POLO',color:'#43f0ff',bg:'#06202a',w:12,h:3.4,x:-62.3,y:34.4,z:-34,rotY:PI/2});
  neon.place({text:'OSIEDLE 1000-LECIA',color:'#ffe14a',bg:'#2a1a06',w:12,h:2.6,x:0,y:17.3,z:-30.4});for(const sx of [-5,5])addBox(.3,1.2,.3,sx,15.3,-30.6,{color:0x55595e},{collide:false});

  /* ---- start: wjazd, brama, sklepy ---- */
  facade(-26,-10,56,64,5.2,0xc9b79a);facade(10,26,56,64,5.2,0xb9c4b8);          // Delikatesy, Monopolowy (fronty ku północy... okna dookoła)
  for(const sx of [-1,1]){addBox(.6,7.8,.6,sx*8.2,0,60,{color:0x6a6e70});}
  addBox(17.4,.8,.8,0,7,60,{color:0x6a6e70},{collide:false});
  neon.place({text:'OSIEDLE SŁONECZNE',color:'#ffd23a',bg:'#2a0a14',w:13,h:3,x:0,y:8.7,z:59.55,rotY:PI});
  neon.place({text:'OSIEDLE SŁONECZNE',color:'#ffd23a',bg:'#2a0a14',w:13,h:3,x:0,y:8.7,z:60.45});
  put('neonSzyld',{x:-18,y:1.55,z:64.05,rotY:0,variant:'bar'});
  put('neonSzyld',{x:18,y:1.55,z:64.05,rotY:0,variant:'piwo'});
  healMachines([{kind:'vending',x:-10.4,z:75.4,rotY:PI},{kind:'station',x:10.4,z:75.4,rotY:PI}]);
  put('hydrant',{x:12,z:66,rotY:0});put('smietnik',{x:-20,z:67,rotY:0,variant:'kontener'});put('wiataPrzystankowa',{x:22,z:72,rotY:PI/2});

  /* ---- dziedziniec: słup neonowy, plac, plac zabaw, trzepaki ---- */
  put('placKostka',{x:0,z:-6,variant:'szara'});put('placKostka',{x:0,z:10,variant:'czerwona'});
  boxB(-2,2,-8,-4,0,1.1,{color:0x8d8a80});boxB(-.7,.7,-6.7,-5.3,1.1,15,{color:0x77736a});
  for(const [x,z,r] of [[0,-4.7,0],[0,-7.3,PI],[.77,-6,PI/2],[-.77,-6,-PI/2]])neon.place({text:'DISCO POLO',color:'#ff9a2a',bg:'#240a06',w:7.4,h:2.6,x:x,y:12,z:z,rotY:r});
  put('piaskownica',{x:-26,z:-22,variant:'zwykla'});put('piaskownica',{x:-19,z:-22,variant:'grzybek'});
  put('zjezdzalnia',{x:-27,z:-15,rotY:0});put('hustawka',{x:-19,z:-15,rotY:0});
  for(const [x,z,r] of [[-30,-19,PI/2],[-22,-12.5,0],[-14,-18,-PI/2]])put('lawkaPodBlokiem',{x,z,rotY:r});
  for(const x of [14,20,26])put('trzepak',{x,z:-20,rotY:0,seed:x});
  for(const [x,z,r] of [[-30,8,PI/2],[30,-6,-PI/2],[11,22,PI],[-11,22,PI]])put('wiataSmietnikowa',{x,z,rotY:r,variant:'blacha'});
  put('stacjaTrafo',{x:-16,z:3,rotY:0,variant:'beton'});put('stacjaTrafo',{x:18,z:10,rotY:PI/2,variant:'ceglana'});
  for(const [x,z,r] of [[-6.5,-6,PI/2],[6.5,-6,-PI/2],[0,-11,0]])put('lawka',{x,z,rotY:r,variant:'beton'});
  put('murekSchody',{x:-24,z:14,rotY:0});put('wiataRowerowa',{x:24,z:-7,rotY:-PI/2});
  put('gablotaOgloszen',{x:-9,z:-30.2,rotY:0});put('gablotaOgloszen',{x:9,z:-30.2,rotY:0});put('slupOgloszeniowy',{x:-3.5,z:18});
  put('antenaSat',{x:-16,z:-30.15,rotY:0,variant:'sciana'});
  for(const [x,z,r] of [[8,3,PI],[-9,-16,0]])put('suszarka',{x,z,seed:x});
  // pojazdy (osłony niepełne, ok. 1,4 m)
  const car=(id,x,z,r,c)=>put(id,{x,z,rotY:r,color:c});
  car('fiat126p',-27,-3,0,0xd3242a);car('polonez',-27,4,0,0x2d5fa8);car('passatB5',27,12,0,0x9aa0a8);car('fiat126p',28,-2,0,0xe0c040);car('zukA06',23,21,PI/2,0xf4efe4);
  car('fiat126p',-14,-24,PI/2,0x4f8a5b);car('polonez',9,-24,PI/2,0xb5534f);
  // drzewa i krzewy
  const tree=(x,z,v)=>put('drzewo',{x,z,variant:v||'lipa',seed:x*3+z});
  for(const [x,z,v] of [[-31,-26],[31,-25,'topola'],[-31,18,'brzoza'],[31,19],[-8,24,'lipa'],[8,25,'brzoza'],[-50,-12,'lipa'],[-52,10,'brzoza'],[-56,-2,'topola'],
    [50,-20,'lipa'],[52,-6,'brzoza'],[55,6,'topola'],[48,-34,'lipa'],[-40,-28,'topola'],[-44,-52,'brzoza'],[22,-38,'lipa'],[74,-32,'topola'],[-74,10,'lipa'],[-72,24,'brzoza'],[74,60,'topola'],[-26,56,'lipa'],[28,54,'brzoza']])tree(x,z,v);
  for(const [x,z] of [[-33,-5],[-33,6],[33,-8],[33,4],[-17,-29],[17,-29]])put('krzew',{x,z,variant:'zywoplot',rotY:0});

  /* ---- lampy (instancing) ---- */
  const lamps=[[-9,68],[9,68],[-8,40],[8,40],[-8,20],[8,20],[-8,0],[8,0],[8,-20],[-8,-20],[34,40],[34,60],[58,40],[58,60],[-26,-40],[-10,-40],[12,-40],[-26,70],[26,70],[20,-56],[-20,-56],[-62,12],[-62,-12],[52,-30],[52,0],[-53,48],[-53,64.4],[-53,76]];
  DS.props.instance('lampaUliczna',lamps.map(([x,z])=>({x,z,rotY:x<0?-PI/2:PI/2})),{seed:5,opts:{variant:'kobra'}});

  /* ---- garaże: dwie uliczki x dwa odcinki, uliczka poprzeczna, ślepa uliczka na zachodzie ---- */
  for(const cx of [-66,-40]){
    put('garazeBlaszane',{x:cx,z:42.4,rotY:0,count:7,seed:cx});put('garazeBlaszane',{x:cx,z:58.8,rotY:0,count:7,seed:cx+1});
    put('garazeBlaszane',{x:cx,z:53.6,rotY:PI,count:7,seed:cx+2});put('garazeBlaszane',{x:cx,z:70,rotY:PI,count:7,seed:cx+3});
  }
  car('fiat126p',-74,48,PI/2,0xe07a2a);car('polonez',-45,47.5,PI/2,0x2d5fa8);car('fiat126p',-38,64.5,PI/2,0xf4efe4);car('zukA06',-60,64.4,PI/2,0x4f8a5b);
  put('smietnik',{x:-77,z:46.5,variant:'kontener'});put('smietnik',{x:-31.5,z:62.5,variant:'pojemnik'});put('koszUliczny',{x:-53,z:56});
  put('wiataSmietnikowa',{x:-53,z:74.8,rotY:PI,variant:'ceglana'});
  placeBarrels([{x:-76.2,z:62},{x:-76.2,z:63.1},{x:-75,z:62.5}]);          // skupisko 1: ślepa uliczka (ostrzał z daleka)
  // garaż 13 (sekret 2): za garażami, roleta E
  const g13=room({x0:-77,x1:-67,z0:26,z1:35,h:3.1,wall:0x8a7d68,roof:0x4a4a48,light:0xffd9a0,door:{side:'s',c:-72,w:2.6,h:2.4,secret:true,label:'GARAŻ NR 13'}});
  put('polonez',{x:-74.2,z:30,rotY:0,color:0x6a1a1a});
  put('crate',{x:-69,z:28.5,s:1.6});put('crate',{x:-70.7,z:28.5,s:1.6});put('crate',{x:-69.8,z:28.5,s:1.6,y:1.6});
  neon.place({text:'13',color:'#ff2a2a',bg:'#1a0606',w:2.2,h:1.6,x:-69,y:2.1,z:34.7,rotY:PI});
  put('crate',{x:-60,z:37.4,s:1.6});put('crate',{x:-61.7,z:37.4,s:1.6});put('barrier',{x:-62,z:30,w:4,d:.9});

  /* ---- błonia i piwnica (sekret 1) ---- */
  const cel=room({x0:-58,x1:-45.6,z0:-9,z1:5,h:3.2,wall:0x8d8a80,roof:0x55524c,light:0xff9a6a,door:{side:'s',c:-52,w:2.2,h:2.3,secret:true,label:'WEJŚCIE DO PIWNICY'}});
  neon.place({text:'PIWNICA',color:'#43f0ff',bg:'#06202a',w:3.2,h:1,x:-52,y:2.6,z:-8.4,rotY:0});
  put('crate',{x:-47.6,z:-7.5,s:1.6});put('crate',{x:-47.6,z:-5.8,s:1.6});put('crate',{x:-55,z:-6.5,s:1.6});
  healMachines([{kind:'station',x:-56.4,z:-1,rotY:PI/2}]);
  put('crate',{x:-49.4,z:7,s:1.6});put('crate',{x:-47.7,z:7,s:1.6});put('crate',{x:-48.5,z:7,s:1.6,y:1.6});   // ukrywają drzwi z boku
  for(const x of [-70,-64,-58])put('trzepak',{x,z:16,rotY:0,seed:x});for(const x of [-68,-62])put('trzepak',{x,z:22,rotY:PI,seed:x+9});
  put('suszarka',{x:-52,z:18,variant:'parasolowa'});put('suszarka',{x:-48,z:21,variant:'skladana'});
  put('lawkaPodBlokiem',{x:-60,z:19,rotY:0});put('lawkaPodBlokiem',{x:-54,z:19,rotY:0});
  put('wiataSmietnikowa',{x:-48,z:14,rotY:PI/2,variant:'ceglana'});put('wiataRowerowa',{x:-72,z:4,rotY:PI/2});
  car('fiat126p',-62,-8,PI/2,0xb5534f);car('zukA06',-68,-12,0,0x9aa0a8);car('polonez',-73,-2,PI/2,0xe0c040);
  put('budkaPiwna',{x:-56,z:24,rotY:0});
  placeBarrels([{x:-62,z:4},{x:-61,z:5.1}]);                                 // skupisko 2: pod ścianą bloku

  /* ---- wieże D/E: podwórko, zaułki ---- */
  put('trzepak',{x:-56,z:-48,rotY:0});put('lawkaPodBlokiem',{x:-52,z:-52.5,rotY:PI});put('suszarka',{x:-60,z:-52});
  put('stacjaTrafo',{x:-47,z:-35,rotY:0,variant:'beton'});put('wiataSmietnikowa',{x:-66,z:-18,rotY:0,variant:'blacha'});
  put('gablotaOgloszen',{x:-61.7,z:-26,rotY:-PI/2});
  car('polonez',-54,-40,PI/2,0x2d5fa8);car('fiat126p',-44,-24,0,0xd3242a);

  /* ---- bazar i pawilon handlowy ---- */
  const bz=[[-42,-55,0,'spozywczy'],[-36,-55,0,'alkohole'],[-30,-55,0,'miesny'],[-24,-56,0,'fryzjer'],[-39,-62,PI,'apteka'],[-31,-62,PI,'spozywczy']];
  for(const [x,z,r,v] of bz)put('witryna',{x,z,rotY:r,variant:v});
  for(const [x,z,s,y] of [[-42,-60,1.6],[-40.3,-60,1.6],[-41.2,-60,1.6,1.6],[-26,-60,1.6],[-26,-58.3,1.6],[-35,-66,1.6],[-33.3,-66,1.6]])put('crate',{x,z,s,y:y||0});
  car('zukA06',-45,-45.5,0,0xf4efe4);car('passatB5',-20,-46,PI/2,0x2d5fa8);
  facade(-12,14,-74,-62,5.6,0xc9b79a);
  for(const [x,v] of [[-9.5,'spozywczy'],[-5,'apteka'],[-.5,'alkohole'],[4,'fryzjer'],[8.5,'miesny']])put('witryna',{x,z:-61.94,rotY:0,variant:v});
  put('kioskRuch',{x:-14.5,z:-57,rotY:0});put('kioskRuch',{x:16,z:-57,rotY:0});
  neon.place({text:'PAWILON 24H',color:'#43f0ff',bg:'#06202a',w:10,h:2.4,x:1,y:7.3,z:-61.9});
  put('neonSzyld',{x:-14.5,y:1.75,z:-55.55,rotY:0,variant:'otwarte'});put('neonSzyld',{x:16,y:1.75,z:-55.55,rotY:0,variant:'disco'});
  put('slupOgloszeniowy',{x:-2,z:-56});put('smietnik',{x:2,z:-75.4,variant:'kontener'});put('smietnik',{x:-6,z:-75.4,variant:'pojemnik'});
  car('polonez',-4,-47,0,0xb5534f);car('fiat126p',6,-48,0,0x2d5fa8);
  put('lawka',{x:-7,z:-60.5,rotY:PI,variant:'stal'});put('lawka',{x:9,z:-60.5,rotY:PI,variant:'stal'});
  healMachines([{kind:'vending',x:12.4,z:-60.4,rotY:0}]);

  /* ---- Orlik: boisko z płotem, płytami i beczkami (arena bossa) ---- */
  fence('x',-76,26,72,{color:0x3e4248});fence('x',-52,26,72,{gaps:[[36,42],[58,64]],color:0x3e4248});
  fence('z',26,-76,-52,{gaps:[[-68,-60]],color:0x3e4248});fence('z',72,-76,-52,{gaps:[[-59,-55]],color:0x3e4248});
  const slabs=[[38,-57.5,4,.5],[38,-70.5,4,.5],[49,-60,.5,4],[49,-68,.5,4],[60,-57.5,4,.5],[60,-70.5,4,.5],[44,-64,.5,3],[54,-64,.5,3]];
  for(const [x,z,w,d] of slabs)addBox(w,2.2,d,x,0,z,{color:0xa7a296},{hull:.03});
  for(const [x,z,w,d] of [[33,-61,3.4,.9],[65,-67,3.4,.9],[33,-67,.9,3.4],[65,-61,.9,3.4]])put('barrier',{x,z,w,d});
  for(const gx of [29,69]){for(const gz of [-66.4,-61.6])addBox(.12,2.4,.12,gx,0,gz,{color:0xeeeeee},{collide:false,cast:false});addBox(.12,.12,4.9,gx,2.4,-64,{color:0xeeeeee},{collide:false,cast:false})}
  for(const [x,z] of [[28.5,-54.6],[69.5,-54.6],[28.5,-75.4],[69.5,-75.4]]){
    addBox(.35,12,.35,x,0,z,{color:0x55595e},{collide:false});
    addPart(new THREE.BoxGeometry(2.6,.7,.5),new THREE.Matrix4().makeTranslation(x,12.3,z),{color:0xfff4c0},{basic:true,cast:false,receive:false,ray:false,edges:false});
  }
  neon.place({text:'ORLIK',color:'#37ff7a',bg:'#04180c',w:12,h:3,x:49,y:6.2,z:-75.4});
  neon.place({text:'KS BLOK 1000',color:'#ffe14a',bg:'#2a1a06',w:9,h:2.2,x:49,y:6.2,z:-52.6,rotY:PI});
  placeBarrels([{x:31,z:-71},{x:32.2,z:-71.4},{x:67,z:-57}]);                // skupisko 3: narożniki Orlika
  put('lawka',{x:49,z:-77.2,rotY:0,variant:'beton'});
  car('zukA06',33,-47,PI/2,0x4f8a5b);car('passatB5',66,-47,PI/2,0x9aa0a8);

  /* ---- skwer wschodni, kotłownia z kominem (sekret 3) ---- */
  const bo=room({x0:58,x1:72,z0:-16,z1:-4,h:6.4,wall:0x9c4a3a,roof:0x3d3a38,floor:0x3a3632,light:0xffb070,door:{side:'w',c:-10,w:2.2,h:2.8,secret:true,label:'WEJDŹ DO KOTŁOWNI',dir:-1}});
  addBox(3.2,3.6,3.2,67,0,-10,{color:0x6d7276},{hull:.03});addBox(5,.8,2,64,0,-7,{color:0x4a4e52});
  addBox(.5,3,.5,63,0,-5.5,{color:0x8a8e92},{collide:false});
  for(let i=0;i<6;i++){                                                                // komin 38 m, czerwono-białe pasy
    addPart(new THREE.CylinderGeometry(1.45-i*.04,1.55-i*.04,6.4,12),new THREE.Matrix4().makeTranslation(65,3.2+i*6.4,-20),{color:i%2?0xf2efe6:0xb8372a},{cast:true,edges:false});
  }
  addPart(new THREE.CylinderGeometry(1.6,1.6,.5,12),new THREE.Matrix4().makeTranslation(65,38.6,-20),{color:0x2a2a2a},{edges:false});
  addPart(new THREE.SphereGeometry(.6,8,6),new THREE.Matrix4().makeTranslation(65,39.4,-20),{color:0xff2a2a},{basic:true,cast:false,receive:false,ray:false,edges:false});
  world.colliders.push({x0:63.4,x1:66.6,z0:-21.6,z1:-18.4,h:38});
  neon.place({text:'KOTŁOWNIA',color:'#ff7a3a',bg:'#240a06',w:7,h:1.8,x:58-.45,y:4.9,z:-10,rotY:-PI/2});
  for(const [x,z,r] of [[50,-18,0],[50,-10,PI],[56,-26,PI/2]])put('lawkaPodBlokiem',{x,z,rotY:r});
  put('stacjaTrafo',{x:52,z:-26,rotY:0,variant:'ceglana'});put('wiataSmietnikowa',{x:76,z:-26,rotY:-PI/2,variant:'blacha'});
  put('trzepak',{x:52,z:-2,rotY:PI/2});put('trzepak',{x:52,z:5,rotY:PI/2});put('donica',{x:58,z:-1,variant:'beton'});put('donica',{x:62,z:-1,variant:'skrzynia'});
  car('polonez',70,-24,0,0xb5534f);

  /* ---- parking (3 rzędy aut, aleje, budka z piwem), płyta F ---- */
  const ids=['fiat126p','polonez','passatB5','zukA06'],cc=[0xd3242a,0x2d5fa8,0xe0c040,0x4f8a5b,0xf4efe4,0xe07a2a,0x9aa0a8,0xb5534f];
  let k=0;
  for(const z of [38,52,66])for(const x of [36,38.8,41.6,47.5,50.3,53.1]){
    if((x*3+z)%11<2)continue;                                                    // luki w rzędach
    const id=ids[k++%4];car(id,x,z+((k%3)-1)*.5,(k%5===0)?PI:0,cc[k%cc.length]);
  }
  put('budkaPiwna',{x:57,z:33,rotY:-PI/2});put('wiataPrzystankowa',{x:44.5,z:30.5,rotY:0});put('wiataRowerowa',{x:57,z:74,rotY:PI});
  put('smietnik',{x:58.5,z:72,variant:'kontener'});put('hydrant',{x:30.8,z:56,rotY:PI/2});put('koszUliczny',{x:44,z:46});
  put('wiataSmietnikowa',{x:58,z:48,rotY:-PI/2,variant:'ceglana'});
  healMachines([{kind:'vending',x:31.5,z:36,rotY:PI/2}]);
  put('lawkaPodBlokiem',{x:59.4,z:24,rotY:-PI/2});put('lawkaPodBlokiem',{x:59.4,z:42,rotY:-PI/2});

  /* ---- znajdźki (id stabilne!) ---- */
  placeCollectibles(level,[
    {id:'bl-kaseta-1',type:'kaseta',x:21,z:-35,name:'Zenek: Biesiada na Blokowisku',hint:'zaułek za blokiem 12'},
    {id:'bl-kaseta-2',type:'kaseta',x:-62,z:-54,name:'Bayer Full: Śpiewały Dzieci z Klatki',hint:'zaułek między wieżami'},
    {id:'bl-kaseta-3',type:'kaseta',x:-50,z:-6.5,name:'Piękni i Młodzi: Piwnica Imprezowa',hint:'ukryta piwnica',secret:true},
    {id:'bl-kaseta-4',type:'kaseta',x:68.5,z:-72.5,name:'Boys: Orlik Tonight',hint:'bramka Orlika'},
    {id:'bl-lancuch-1',type:'lancuch',x:-76.8,z:59.2,name:'Złoty łańcuch z Garaży',value:80},
    {id:'bl-lancuch-2',type:'lancuch',x:56,z:58,name:'Łańcuch spod Poloneza',value:80},
    {id:'bl-lancuch-3',type:'lancuch',x:-23,z:-24.5,name:'Łańcuch z piaskownicy',value:60},
    {id:'bl-lancuch-4',type:'lancuch',x:70,z:-7,name:'Łańcuch z kotłowni',value:120,secret:true},
    {id:'bl-klucz-1',type:'klucz',x:-70.5,z:31.5,name:'Klucz do skrzynki: garaż 13',secret:true},
    {id:'bl-klucz-2',type:'klucz',x:61,z:-12,name:'Klucz do skrzynki: kotłownia',secret:true},
    {id:'bl-plakat-1',type:'plakat',x:-1,z:-75.2,name:'Plakat: Zenek Live (bilet 5 zł)',hint:'tyły pawilonu',value:30},
    {id:'bl-plakat-2',type:'plakat',x:31.6,z:70,name:'Plakat: Maluch, mały ale wariat',hint:'parking',value:30},
    {id:'bl-plakat-3',type:'plakat',x:-58,z:-20,name:'Plakat: Wybory 4 czerwca 1989',hint:'pod wieżą 2',value:30},
  ]);

  /* ---- nawigacja AI (graf waypointów + osłony) ---- */
  buildNav(level);
}

/* ------------------------------------------------------------------ zdarzenia poziomu: muzyka, ambient, ukończenie */
let amb=null;
function stopAmbient(){if(amb){try{amb.src.stop()}catch(e){}try{amb.g.disconnect()}catch(e){}amb=null}}
function startAmbient(){
  stopAmbient();
  if(!AU.ctx||!AU.noise)return;
  try{
    const src=AU.ctx.createBufferSource();src.buffer=AU.noise;src.loop=true;
    const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;
    const g=AU.ctx.createGain();g.gain.value=.05;                                   // wiatr między blokami
    src.connect(lp);lp.connect(g);g.connect(AU.sfx||AU.master);src.start();amb={src,g};
  }catch(e){amb=null}
}
const here=()=>world.level&&world.level.id===ID;
DS.bus.on('levelLoad',e=>{if(e&&e.level===ID)mergeIntoZones()});         // kafelki 16 m -> strefy (budżet draw calli)
DS.bus.on('levelStart',()=>{
  if(!here())return;
  if(L.track&&opt.track==='A')setTrack(L.track,false);                               // domyślny utwór -> "Ołowiane Wesele" (nie nadpisuje wyboru gracza)
  startAmbient();
  const G=S.G;if(G){G.levelWon=false;setTimeout(()=>{if(S.G===G&&here()){const st=collectStats(L);announce('BLOKOWISKO','Znajdźki '+st.found+'/'+st.total+'  |  3 sekrety')}},1800)}
});
DS.bus.on('levelEnd',stopAmbient);
DS.bus.on('levelUnload',stopAmbient);
DS.bus.on('kill',({enemy:e})=>{
  const G=S.G;if(!G||!here()||!e||e.type!==L.win.boss||G.levelWon)return;
  G.levelWon=true;
  save.coins+=L.win.reward.coins;save.keys+=L.win.reward.keys;G.earned+=L.win.reward.coins;G.keysFound+=L.win.reward.keys;
  save.levelsDone=save.levelsDone||{};save.levelsDone[ID]=true;persist();
  setTimeout(()=>{if(S.G===G)announce(L.win.text,'+'+L.win.reward.coins+' ZD i klucz. Gra toczy się dalej.')},1500);
  DS.bus.emit('levelComplete',{level:ID,wave:G.wave});
});
