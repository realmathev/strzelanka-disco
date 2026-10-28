// Modele pistoletów: Glock 17, P-83 Wanad, Desert Eagle .50 AE, Colt Python .357 (ds-weapon-modeler).
//
// KONTRAKT (zgodny z buildGun w viewmodel.js):
//   DS.weapons.get(id).model({B,group,mat1,mat2,muzzle,hull}) dodaje do `group` pełny viewmodel i ustawia `muzzle` (Vector3, m).
//   mat1/mat2 (skórki) idą na główne metale: zamek/lufa = mat1, szkielet = mat2. Reszta (okładziny, muszka) ma własne materiały.
// DODATKOWO na definicji broni (DS.weapons.get(id)):
//   .getViewModel(mats?)  -> nowa THREE.Group (szczegółowy viewmodel, ≤1500 tri z konturami), mats = {m1,m2} opcjonalnie
//   .getWorldModel(mats?) -> nowa THREE.Group (uproszczony, ≤300 tri z konturem) do upuszczonej broni; ten sam układ osi
//   .sightAnchor          -> Vector3 (m): PUNKT OKA w ADS we współrzędnych modelu (leży na linii celowania, eyeRelief za szczerbinką)
//   .sightRear/.sightFront-> Vector3 (m): środek szczerbinki i szczyt muszki; (front − rear) jest równoległe do osi lufy (−Z)
//   .modelTris()          -> {view,viewHull,world,worldHull}
// Zwrócona grupa (i `group` z buildGun) ma `userData`: {parts:{nazwa:Object3D}, muzzle, sightAnchor, sightRear, sightFront,
//   eyeRelief, anim(t)} i nazwane dzieci: `muzzle`, `ejectionPort`, `sightAnchor`, `sightRear`, `sightFront`, `magazine`,
//   `slide`,`trigger` (pistolety) / `hammer`,`trigger`,`cylinder` (Python; jego `magazine` = dźwignia z bębnem, w parts także jako `cylinderSwing`).
//   Spoczynkowa pozycja każdej części: part.userData.p0 (Vector3). Zamek jedzie wzdłuż +Z, magazynek wzdłuż osi chwytu w dół,
//   kurek i spust obracają się wokół X, bęben wokół Z (swing: wokół Z w pivocie dźwigni, dodatnio = w lewo).
//
// REFERENCJE (wymiary w mm; źródła w real.src danych broni):
//   Glock 17: dł. 202, lufa 114, wys. 138, szer. 30 (zamek 25,5), promień celowania ~165, 17 nab. (en.wikipedia.org/wiki/Glock_17)
//   P-83 Wanad: dł. 165, lufa 90, wys. ~126, szer. ~30, 8 nab. 9×18, układ jak Walther PP (en.wikipedia.org/wiki/FB_P-83_Wanad)
//   Desert Eagle Mk XIX 6": dł. 273, lufa 152, wys. 149, szer. 32, masa 1,996 kg (en.wikipedia.org/wiki/Desert_Eagle)
//   Colt Python 6": dł. ~286, lufa 152, wys. ~140, bęben Ø ~36, 6 nab., pełny lug + żebro wentylowane (en.wikipedia.org/wiki/Colt_Python)
import {DS} from '../../core/ds.js';
import {Asm,blueprint,box,cyl,prof,sect,quad} from './pistol-kit.js';

const BP={}; // fabryki blueprintów po id broni
const nh=p=>({g:p.g,h:null}); // część bez konturu (modele świata: budżet 300 tri łącznie z konturami)

/** Szczerbinka: dwa słupki + podstawa (y0..S), szczelina `notch`; kontur cienki (.7 mm), by nie zasłonił szczeliny. */
function sightPosts(a,{z,y0,S,wTot=12,notch=4,len=8,mat='black'}){
  const pw=(wTot-notch)/2,h=S-y0;
  a.add([box(pw,h,len,-(notch/2+pw/2),y0+h/2,z,0,0,0,.7),box(pw,h,len,(notch/2+pw/2),y0+h/2,z,0,0,0,.7),box(wTot,3,len,0,y0+1.5,z,0,0,0,.7)],mat);
}
/** Muszka (słupek) z białą kropką na tylnej ściance. */
function frontPost(a,{z,y0,S,w=3.6,len=7,dot=true}){
  const h=S-y0;a.add(box(w,h,len,0,y0+h/2,z,0,0,0,.7),'black');
  if(dot)a.add(quad(w*.6,w*.6,0,S-h*.4,z+len/2+.15,'+z'),'white');
}
/** Nacięcia (decale) po obu stronach: n kresek co `step` od z0, szer. 1.3 mm, półszerokość korpusu hw. */
function serr(a,{n,z0,step=4.4,hw,y,h}){for(let i=0;i<n;i++)for(const s of [1,-1])a.add(quad(1.3,h,s*(hw+.05),y,z0+i*step,s>0?'+x':'-x'),'black')}
const sin01=t=>Math.sin(Math.min(1,Math.max(0,t))*Math.PI);
const at=(o,x,y,z)=>o.position.set(o.userData.p0.x+x,o.userData.p0.y+y,o.userData.p0.z+z);

/** Wspólna animacja pistoletu półautomatycznego: t 0..1 = strzał (zamek, spust), t>.5 dodatkowo zrzut magazynka. */
function pistolAnim(slideBack,magDir,trig){
  return (p,t)=>{const k=sin01(t),d=Math.max(0,t-.5)*.2;
    at(p.slide,0,0,slideBack*k);p.trigger.rotation.x=-trig*k;
    at(p.magazine,0,-d*magDir[1],d*magDir[0])}
}

/* ───────────────────────────── GLOCK 17 ───────────────────────────── */
function glock17(){
  const S=28,EYE=200;                                 // linia celowania [mm] nad osią lufy; oko za szczerbinką
  const F=y=>-4+(-32-y)*.404,Bk=y=>43+(-34-y)*.295;   // przedni/tylny pas chwytu (kąt ~22°)
  const mk=world=>{
    const root=new Asm('root');
    root.add([
      prof([[-122,-10],[-122,-22],[-70,-22],[-70,-40],[-63,-46],[-14,-46],[-5,-39],[-2,-34],[0,-10]],22,0,
        [[[-63,-22],[-63,-39],[-58,-41],[-19,-41],[-11,-35],[-11,-22]]]),
      prof([[-4,-10],[57,-10],[57,-14],[54,-20],[46,-28],[43,-34],[Bk(-112),-112],[F(-112),-112],[F(-34),-34]],28),
    ],'m2');
    const sl=world?root:root.child('slide',[0,0,57]);
    sl.add(sect([[-12.5,-10],[12.5,-10],[12.5,16],[9,22],[-9,22],[-12.5,16]],-139,57),'m1');
    if(world){sl.add([box(5,6,9,0,25,48),box(3.6,6,7,0,25,-130)],'black');return root}
    sightPosts(sl,{z:48,y0:22,S,wTot:12,notch:4,len:9});
    frontPost(sl,{z:-130,y0:22,S});
    sl.add(cyl(4.8,4.8,.6,0,0,-139.1,10,'z',0),'black');                    // wylot lufy
    sl.add(quad(42,12,12.55,7,-47,'+x'),'black');                           // okno wyrzutowe
    serr(sl,{n:5,z0:22,hw:12.5,y:5,h:13});serr(sl,{n:3,z0:-122,hw:12.5,y:5,h:13});
    sl.mark('ejectionPort',[14,8,-47]);
    root.add([box(3,5,24,-12.6,-14,-18,0,0,0,0),cyl(3.3,3.3,3,-16.2,-44,6,8,'x',0)],'m1'); // zatrzask zamka, przycisk magazynka
    const mg=root.child('magazine',[0,-100,(F(-100)+Bk(-100))/2]);
    mg.add(prof([[F(-60)+2,-60],[Bk(-60)-2,-60],[Bk(-113)-2,-113],[F(-113)+2,-113]],22,0,[],0),'m2');
    mg.add(prof([[F(-113)-1,-113],[Bk(-113)+1,-113],[Bk(-122)+1,-122],[F(-122)-1,-122]],31),'black');
    root.child('trigger',[0,-22,-30]).add(prof([[-33,-22],[-28,-22],[-22,-35],[-20,-42],[-26,-42],[-30,-34]],7,0,[],1.4),'black');
    root.mark('muzzle',[0,0,-139]).mark('sightRear',[0,S,52.5]).mark('sightFront',[0,S,-130]).mark('sightAnchor',[0,S,52.5+EYE]);
    return root;
  };
  return blueprint({id:'glock17',view:mk(false),world:mk(true),muzzle:[0,0,-139],rear:[0,S,52.5],front:[0,S,-130],eye:[0,S,52.5+EYE],eyeRelief:EYE,
    anim:pistolAnim(.035,[.33,.94],.35)});
}
BP.glock17=glock17;

/* ───────────────────────────── P-83 WANAD ───────────────────────────── */
// Układ jak Walther PP: gładki zamek z zaokrąglonym czołem, zewnętrzny kurek, owalny kabłąk, okładziny, magazynek z podstawką-podpórką.
function p83wanad(){
  const S=22,EYE=190;
  const F=y=>5+(-28-y)*.26,Bk=y=>52+(-30-y)*.2;
  const mk=world=>{
    const root=new Asm('root');
    root.add(prof([[-80,-9],[-80,-21],[-54,-21],[-54,-35],[-47,-41],[-22,-41],[-8,-37],[0,-31],[5,-26],[8,-9]],22,0,
      world?[]:[[[-47,-21],[-47,-34],[-42,-37],[-23,-37],[-12,-33],[-5,-27],[-3,-21]]]),'m2');
    root.add(prof([[5,-9],[58,-9],[60,-16],[55,-24],[52,-30],[Bk(-109),-109],[F(-109),-109],[5,-28]],26),'m2');
    if(!world)root.add(prof([[10,-20],[54,-20],[Bk(-104)-1,-104],[F(-104)+3,-104]],29,0,[],1.6),'grip');   // okładziny
    const sl=world?root:root.child('slide',[0,0,50]);
    sl.add(sect([[-12,-9],[12,-9],[12,12],[9,17],[-9,17],[-12,12]],-100,50),'m1');
    sl.add(box(3.2,4.5,12,0,19.25,-93,0,0,0,.8),'black');                       // muszka integralna (rampa)
    if(world){sl.add(box(8,4,8,0,19,44),'black');return root}
    sightPosts(sl,{z:44,y0:17,S,wTot:11,notch:3.6,len:8});
    sl.add(quad(1.6,2.4,0,19.6,-86.9,'+z'),'white');
    sl.add(cyl(4.4,4.4,.6,0,0,-100.1,10,'z',0),'black');
    sl.add(quad(44,13,12.05,4,-22,'+x'),'black');                               // okno wyrzutowe
    serr(sl,{n:6,z0:26,step:3.8,hw:12,y:3,h:14});
    sl.mark('ejectionPort',[13,5,-22]);
    sl.add(box(3.2,9,16,-13.6,5,34,0,0,0,0),'m1');                              // dźwignia bezpiecznika/kurka
    root.add(cyl(2.2,2.2,3,0,-100,58,8,'x',0),'black');                         // uchwyt na pasek
    const mg=root.child('magazine',[0,-95,(F(-95)+Bk(-95))/2]);
    mg.add(prof([[F(-60)+2,-60],[Bk(-60)-2,-60],[Bk(-110)-2,-110],[F(-110)+2,-110]],21,0,[],0),'m2');
    mg.add(prof([[F(-110)-5,-109],[Bk(-110)+1,-109],[Bk(-117)+1,-117],[F(-117)-5,-117]],28),'black'); // podstawka z podpórką
    root.child('trigger',[0,-24,-30]).add(prof([[-33,-24],[-28,-24],[-23,-35],[-24,-38],[-29,-35]],6,0,[],1.3),'black');
    const hm=root.child('hammer',[0,6,53]);
    hm.add(prof([[50,4],[50,14],[54,19],[61,19],[63,14],[58,6]],7,0,[],1.4),'m1');
    root.mark('muzzle',[0,0,-100]).mark('sightRear',[0,S,48]).mark('sightFront',[0,S,-93]).mark('sightAnchor',[0,S,48+EYE]);
    return root;
  };
  return blueprint({id:'p83wanad',view:mk(false),world:mk(true),muzzle:[0,0,-100],rear:[0,S,48],front:[0,S,-93],eye:[0,S,48+EYE],eyeRelief:EYE,
    anim:(p,t)=>{pistolAnim(.028,[.2,.98],.35)(p,t);p.hammer.rotation.x=-.5*sin01(t)}});
}
BP.p83wanad=p83wanad;

/* ───────────────────────────── DESERT EAGLE .50 AE ───────────────────────────── */
// Masywny prostokątny zamek, trapezowa lufa z żebrem (szyna), wielki kabłąk, szeroki chwyt z gumowymi okładzinami.
function deagle50(){
  const S=31,EYE=210;
  const F=y=>(y+40)*-.402,Bk=y=>50+(-34-y)*.269;
  const mk=world=>{
    const root=new Asm('root');
    // szkielet: dolna „wanna” sięga aż do wylotu (klin lufy leży na niej), duży kabłąk
    root.add(prof([[-214,-14],[-214,-27],[-122,-33],[-112,-36],[-76,-36],[-76,-50],[-68,-57],[-14,-57],[-4,-48],[0,-40],[2,-14]],30,0,
      world?[]:[[[-69,-28],[-69,-49],[-63,-52],[-18,-52],[-9,-44],[-6,-36],[-6,-28]]]),'m2');
    root.add(prof([[2,-14],[58,-14],[57,-22],[50,-34],[Bk(-127),-127],[F(-127),-127],[0,-40]],28),'m2');
    if(!world)root.add(prof([[8,-32],[48,-32],[Bk(-120)-3,-120],[F(-120)+3,-120]],32,0,[],1.8),'grip');
    // lufa: klin (trójkątny przekrój, wąski u góry, szeroki u dołu) widoczny przed zamkiem na ~100 mm
    root.add(sect([[-15,-14],[15,-14],[10.5,10],[8,22],[-8,22],[-10.5,10]],-215,-116),'m2');
    root.add(sect([[-12,-14],[12,-14],[9,6],[-9,6]],-217,-212),'steel');                                    // czoło lufy (wąski pierścień)
    root.add(box(13,3.2,99,0,23.6,-165.5,0,0,0,1.2),'steel');                                              // żebro (szyna) lufy
    const sl=world?root:root.child('slide',[0,0,58]);
    const SL=[[-14.5,-14],[14.5,-14],[14.5,16],[12,22],[-12,22],[-14.5,16]];
    if(world){sl.add(sect(SL,-118,58),'m1');root.add(nh(box(4,6.5,8,0,28,-206)),'black');sl.add(nh(box(9,8,9,0,26,50)),'black');return root}
    // zamek: masywny prostopadłościan; w środku wycięte duże okno wyrzutowe (prawa górna ćwiartka)
    const NOTCH=[[-14.5,-14],[14.5,-14],[14.5,-1],[1.5,-1],[1.5,22],[-12,22],[-14.5,16]];
    sl.add([sect(SL,-118,-88),sect(NOTCH,-88,-24),sect(SL,-24,58)],'m1');
    sightPosts(sl,{z:50,y0:22,S,wTot:15,notch:5,len:9});
    frontPost(root,{z:-206,y0:25,S,w:4,len:8});
    root.add(cyl(7.2,7.2,.6,0,0,-217.1,12,'z',0),'black');                                                 // wylot
    for(let i=0;i<10;i++)root.add(quad(13,1,0,25.25,-212+i*9.5,'+y'),'black');                              // nacięcia szyny
    // duże okno wyrzutowe: ciemne wnętrze + odsłonięty komorowy blok lufy (stal) i wyrzutnik
    sl.add(quad(64,22,1.55,10.5,-56,'+x'),'black');                                                        // ciemna ściana wnęki
    sl.add(quad(13,64,8,-1.05,-56,'+y'),'black');                                                           // dno wnęki
    root.add(box(12,5,40,8,-2.5,-62,0,0,0,.8),'steel');                                                     // odsłonięta komora lufy (nieruchoma)
    root.add(box(9,3,14,8,2.5,-76,0,0,0,0),'brass');                                                        // łuska w komorze
    serr(sl,{n:6,z0:20,hw:14.5,y:4,h:17});
    sl.mark('ejectionPort',[15.5,8,-52]);
    // bezpiecznik-kurek: dwustronny krótki lewarek na szkielecie + mały kurek wystający z tyłu zamka
    root.add([box(4,6,22,-16.2,-6,26,0,0,0,0),box(4,6,22,16.2,-6,26,0,0,0,0),cyl(3.5,3.5,3,-14.8,-44,10,8,'x',0)],'m1');
    root.child('hammer',[0,8,58]).add(prof([[58,2],[58,13],[63,15],[67,10],[65,2]],9,0,[],1.2),'steel');
    const mg=root.child('magazine',[0,-110,(F(-110)+Bk(-110))/2]);
    mg.add(prof([[F(-70)+2,-70],[Bk(-70)-2,-70],[Bk(-127)-2,-127],[F(-127)+2,-127]],22,0,[],0),'m2');
    mg.add(prof([[F(-127)-1,-127],[Bk(-127)+1,-127],[Bk(-133)+1,-133],[F(-133)-1,-133]],30),'m1');
    root.child('trigger',[0,-30,-36]).add(prof([[-39,-30],[-33,-30],[-27,-42],[-25,-50],[-32,-50],[-37,-40]],8,0,[],1.4),'black');
    root.mark('muzzle',[0,0,-215]).mark('sightRear',[0,S,54.5]).mark('sightFront',[0,S,-206]).mark('sightAnchor',[0,S,54.5+EYE]);
    return root;
  };
  return blueprint({id:'deagle50',view:mk(false),world:mk(true),muzzle:[0,0,-215],rear:[0,S,54.5],front:[0,S,-206],eye:[0,S,54.5+EYE],eyeRelief:EYE,
    anim:(p,t)=>{pistolAnim(.045,[.26,.97],.3)(p,t);p.hammer.rotation.x=-.7*sin01(t*1.5)}});
}
BP.deagle50=deagle50;

/* ───────────────────────────── COLT PYTHON 6" ───────────────────────────── */
// Pełny lug z żebrem wentylowanym, rampa muszki, regulowana szczerbinka, kurek z ostrogą, drewniany chwyt z zaokrąglonym trzonkiem.
// Bęben: grupa cylinderSwing (pivot dźwigni, wypada w lewo) z zagnieżdżoną grupą cylinder (obrót wokół osi).
/** Przekrój bębna z rowkami (flutes): n rowków, R promień, d głębokość, w półszerokość rowka [rad]. Punkty [x,y] mm. */
function flutedCyl(R,d,zf,zr,t,n=6,w=.2){
  const pts=[],P=(a,r)=>pts.push([Math.cos(a)*r,Math.sin(a)*r]);
  for(let k=0;k<n;k++){const c=(k+.5)*2*Math.PI/n,L=Math.PI/n;
    P(c-w,R);P(c-w*.45,R-d);P(c+w*.45,R-d);P(c+w,R);P(c+L,R);}
  return sect(pts,zf,zr,t);
}
function python357(){
  const S=34,EYE=235,RC=21;                       // linia celowania nad osią [mm]; promień bębna
  const mk=world=>{
    const root=new Asm('root');
    const X=p=>world?nh(p):p;
    if(world){                                                                                  // uproszczony model świata (≤300 tri)
      root.add(nh(cyl(14,13,158,0,0,-141,6,'z',0)),'m1');
      root.add(nh(box(20,18,150,0,-16,-143)),'m2');
      root.add(nh(box(8,10,150,0,19,-145)),'m1');
      root.add([nh(box(26,4,52,0,23.5,-43)),nh(box(26,4,52,0,-25,-43))],'m1');
      root.add(prof([[-17,25.5],[50,25.5],[56,-6],[48,-16],[14,-27],[-17,-27]],26,0,[],2),'m1');
      root.add(prof([[-24,-22],[-24,-50],[16,-50],[16,-22],[10,-22],[10,-44],[-18,-44],[-18,-22]],6,0,[],0),'m1');
      root.add(prof([[10,-24],[16,-72],[40,-100],[59,-68],[54,-14],[24,-4]],28,0,[],2),'wood');
      root.child('cylinder',[0,0,-40]).add(nh(cyl(RC,RC,48,0,0,-40,8,'z',0)),'m2');
      root.add(nh(box(4,8,10,0,29,-204)),'black');
      root.mark('muzzle',[0,0,-220]);return root;
    }
    // — lufa 6" (Ø 26-30): gruba, z pełnym lugiem pod spodem i żebrem wentylowanym na górze —
    root.add(X(cyl(14.5,13,158,0,0,-141,world?6:10)),'m1');                                    // lufa
    root.add(prof([[-218,-6],[-218,-16],[-200,-21],[-70,-26],[-62,-26],[-62,-6]],21,0,[],world?0:1.6),'m2'); // pełny lug (underlug)
    root.add(X(box(8,10.5,150,0,19.25,-145,0,0,0,1.2)),'m1');                                  // żebro wentylowane
    root.add(X(box(26,3.5,52,0,23.75,-43,0,0,0,1.4)),'m1');                                    // górny pas ramy nad bębnem
    root.add(X(box(26,4.5,52,0,-24.75,-43,0,0,0,1.4)),'m1');                                   // dno ramy pod bębnem
    root.add(X(box(26,52,8,0,0,-68,0,0,0,1.6)),'m1');                                          // przód ramy (okno bębna za nim)
    root.add(prof([[-17,25.5],[50,25.5],[53,17],[51,6],[56,-6],[48,-16],[24,-24],[14,-27],[-17,-27]],26,0,[],2),'m1'); // rama (tył, osłona mechanizmu)
    // — kabłąk: owalny pierścień zrośnięty z ramą od przodu i z chwytem od tyłu —
    root.add(prof([[-24,-22],[-28,-36],[-24,-46],[-14,-52],[2,-53],[12,-46],[16,-34],[18,-22]],8,0,
      [[[-19,-28],[-22,-36],[-19,-43],[-12,-47],[0,-48],[8,-43],[11,-34],[11,-28]]],world?0:1.4),'m1');
    // — chwyt: drewniany, kompaktowy; rake ~16°, plecy chwytu wynurzają się z ramy —
    root.add(prof([[10,-24],[12,-48],[16,-72],[24,-92],[40,-100],[54,-93],[59,-68],[58,-40],[54,-14],[48,-4],[24,-4]],28,0,[],world?2:2.2),'wood');
    root.add([quad(8,8,14.05,-60,36,'+x'),quad(8,8,-14.05,-60,36,'-x')],'gold');             // medalion
    root.add(cyl(5,5,.6,0,0,-220.1,10,'z',0),'black');                                          // wylot
    for(let i=0;i<13;i++)for(const s of [1,-1])root.add(quad(4.6,5.2,s*4.05,19.5,-211+i*10.4,s>0?'+x':'-x'),'black'); // okna żebra
    root.add(prof([[-190,24.5],[-198,32],[-205,34],[-209,24.5]],3.6,0,[],.7),'black');          // rampa muszki
    root.add(quad(1.8,7,0,29,-209.05,'-z'),'red');
    root.add(box(16,3.5,14,0,27.25,38,0,0,0,.7),'m1');                                          // podstawa regulowanej szczerbinki
    sightPosts(root,{z:38,y0:29,S,wTot:14,notch:4.4,len:7});
    root.add(box(3,7,12,-13.6,2,-8,0,0,0,0),'m1');                                              // zatrzask bębna (lewa strona)
    // kurek: gruby, z ostrogą sięgającą za ramę
    root.child('hammer',[0,8,48]).add(prof([[44,10],[46,20],[52,26],[60,27.5],[65,24],[60,18],[57,8]],9,0,[],1.4),'m1');
    root.child('trigger',[0,-22,-4]).add(prof([[-6,-22],[0,-22],[6,-32],[7,-42],[1,-42],[-4,-30]],6,0,[],1.3),'black');
    // — bęben (Ø 39, 6 rowków) w ruchomej dźwigni; swing wokół Z w lewo —
    const sw=root.child('magazine',[-17,-17,-40]);       // = cylinderSwing (alias w parts)
    sw.add(box(8,6,50,-17,-23,-40,0,0,0,0),'m1');                                              // dźwignia (crane)
    const cy=sw.child('cylinder',[0,0,-40]);
    cy.add(flutedCyl(RC,2.6,-58,-22,0),'m2');                                                 // korpus z rowkami
    cy.add([cyl(RC,RC,6,0,0,-61,14,'z',1.4),cyl(RC-1.5,RC-1.5,5,0,0,-19.5,12,'z',0),cyl(13,13,5,0,0,-15,10,'z',0)],'m1'); // pierścień czołowy, zapadki
    for(let i=0;i<6;i++){const a=i*Math.PI/3;cy.add(cyl(3.6,3.6,.6,Math.cos(a)*12.5,Math.sin(a)*12.5,-64.2,8,'z',0),'black')} // komory
    root.mark('muzzle',[0,0,-220]).mark('ejectionPort',[13,2,-40]).mark('sightRear',[0,S,41.5]).mark('sightFront',[0,S,-203]).mark('sightAnchor',[0,S,41.5+EYE]);
    return root;
  };
  return blueprint({id:'python357',view:mk(false),world:mk(true),muzzle:[0,0,-220],rear:[0,S,41.5],front:[0,S,-203],eye:[0,S,41.5+EYE],eyeRelief:EYE,
    alias:{cylinderSwing:'magazine'},
    anim:(p,t)=>{p.hammer.rotation.x=.6*sin01(t*2);p.trigger.rotation.x=-.4*sin01(t*2);
      p.cylinderSwing.rotation.z=1.35*Math.max(0,Math.min(1,(t-.5)*4));p.cylinder.rotation.z=-t*Math.PI/3}});
}
BP.python357=python357;

/* ───────────────────────────── rejestracja ───────────────────────────── */
function register(id){
  const W=DS.weapons.get(id);if(!W)return;
  const bp=BP[id]();
  W.getViewModel=mats=>bp.view(mats);
  W.getWorldModel=mats=>bp.world(mats);
  W.sightAnchor=bp.sightAnchor;W.sightRear=bp.sightRear;W.sightFront=bp.sightFront;W.modelTris=()=>bp.tris();
  W.model=({group,mat1,mat2,muzzle})=>{
    const vm=bp.view({m1:mat1,m2:mat2});
    group.add(vm);Object.assign(group.userData,vm.userData); // userData także na `group` z buildGun
    muzzle.copy(bp.muzzle);
  };
}
for(const id of Object.keys(BP))register(id);
