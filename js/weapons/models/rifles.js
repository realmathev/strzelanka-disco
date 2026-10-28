// Modele karabinów: AKM, M4A1, Beryl wz. 96 (ds-weapon-modeler). Kontrakt i konwencje jak w pistols.js / pistol-kit.js
// (wylot w −Z, oś lufy y=0, mm w kodzie -> metry na wyjściu; getViewModel/getWorldModel/sightAnchor/sightRear/sightFront/modelTris).
// Nazwane części: muzzle, ejectionPort, sightRear, sightFront, sightAnchor, magazine (+ bolt = zamek z rączką przeładowania,
// trigger; Beryl: stock = kolba składana w bok, pivot na zawiasie po lewej; fold = obrót stock.rotation.y od 0 do −π).
//
// REFERENCJE (mm; źródła w real.src danych broni):
//   AKM:   dł. 880, lufa ~415 (z hamulcem 440), promień celowania 378, masa 3,3 kg, mag. 30 szt. banan ~ 90 szer. x 255 (en.wikipedia.org/wiki/AKM)
//   M4A1:  dł. 838 (kolba wysunięta) / 757, lufa 368 (14,5"), promień celowania ~370 (celownik w rączce do noszenia), STANAG 30 (en.wikipedia.org/wiki/M4_carbine)
//   Beryl: dł. 943 (kolba rozłożona) / 700 złożona, lufa 457, masa 3,35 kg, szyna Picatinny na pokrywie, kolba składana w bok (en.wikipedia.org/wiki/FB_Beryl)
import {DS} from '../../core/ds.js';
import {Asm,blueprint,box,cyl,prof,sect,quad} from './pistol-kit.js';

const BP={};
const nh=p=>({g:p.g,h:null});
const sin01=t=>Math.sin(Math.min(1,Math.max(0,t))*Math.PI);
const at=(o,x,y,z)=>o.position.set(o.userData.p0.x+x,o.userData.p0.y+y,o.userData.p0.z+z);

/** Szczerbinka-U z dwóch słupków (jak w pistolach). */
function sightPosts(a,{z,y0,S,wTot=12,notch=4,len=8,mat='black'}){
  const pw=(wTot-notch)/2,h=S-y0;
  a.add([box(pw,h,len,-(notch/2+pw/2),y0+h/2,z,0,0,0,.7),box(pw,h,len,(notch/2+pw/2),y0+h/2,z,0,0,0,.7)],mat);
}
/** Dioptr: kwadratowa obwódka z otworem `hole`, środek otworu w (0,y,z). */
function aperture(a,{z,y,W=15,hole=6.4,len=5}){
  const b=(W-hole)/2;
  a.add([box(W,b,len,0,y+hole/2+b/2,z,0,0,0,.6),box(W,b,len,0,y-hole/2-b/2,z,0,0,0,.6),
    box(b,hole,len,-(hole/2+b/2),y,z,0,0,0,.6),box(b,hole,len,(hole/2+b/2),y,z,0,0,0,.6)],'black');
}
/** Muszka-słupek z białą kropką. */
function post(a,{z,y0,S,w=3,len=5,dot=true}){
  const h=S-y0;a.add(box(w,h,len,0,y0+h/2,z,0,0,0,.6),'black');
  if(dot)a.add(quad(w*.6,w*.6,0,S-1.5,z+len/2+.12,'+z'),'white');
}
/** Magazynek-banan z łańcuchów przód F i tył R ([z,y]); żebra poprzeczne co `rib` punkt (opcjonalnie). */
function curvedMag(a,F,R,w,mat,ribMat,ribs){
  const pts=F.concat(R.slice().reverse());
  a.add(prof(pts,w,0,[],0),mat);
  for(const i of ribs||[])a.add(prof([F[i],R[i],[R[i][0],R[i][1]-4],[F[i][0],F[i][1]-4]],w+1.6,0,[],0),ribMat||'black');
}
/** Zwęglone rowki (cienkie czarne decale) na bokach: n kresek od z0 co step; y środek, h wysokość; hw półszerokość. */
function slots(a,{n,z0,step,hw,y,h,w=2}){for(let i=0;i<n;i++)for(const s of [1,-1])a.add(quad(w,h,s*(hw+.06),y,z0+i*step,s>0?'+x':'-x'),'black')}
/** Szyna Picatinny: korpus + poprzeczne szczeliny (decale na górze). */
function picatinny(a,{z0,z1,y,W=21,h=4.5,step=9.5}){
  a.add(box(W,h,z1-z0,0,y+h/2,(z0+z1)/2,0,0,0,1),'steel');
  for(let z=z0+5;z<z1-3;z+=step)a.add(quad(W-1,2.6,0,y+h+.06,z,'+y'),'black');
}

/* ───────────────────────────────── rodzina AK: AKM + Beryl ───────────────────────────────── */
/**
 * v: {muzzleZ, rearZ, frontZ, wood, brake:'akm'|'beryl', stock:'wood'|'fold', rail, mag:{F,R,w,...}}
 * Geometria AK: odbiornik tłoczony (korpus + pokrywa z garbem), rurka gazowa nad lufą pod drewnianym/polimerowym łożem,
 * blok gazowy, kolec muszki z uszami w podstawie przy wylocie, szczerbinka na łuku przed odbiornikiem.
 */
function akFamily(id,v){
  const S=44,EYE=300,RZ=v.rearZ,FZ=v.frontZ,MZ=v.muzzleZ;
  const FUR=v.wood?'wood':'grip',FUR2=v.wood?'woodDark':'grip',REC=v.rec||'m2',M2=v.wood?'m2':'m1';
  const mk=world=>{
    const root=new Asm('root'),X=p=>world?nh(p):p;
    if(world)return akWorld(root,v,{FUR,FUR2,REC,M2,FZ,MZ,RZ});
    // — odbiornik: korpus tłoczony (wanna) + pokrywa z garbem tylnym —
    root.add(box(38,46,245,0,-9,-27.5,0,0,0,world?2.2:1.8),REC);
    const cov=[[-19,12],[19,12],[19,20],[15,28],[8,31],[-8,31],[-15,28],[-19,20]],cov2=[[-19,12],[19,12],[19,18],[14,23],[8,25],[-8,25],[-14,23],[-19,18]];
    root.add([sect(cov,-125,20,world?0:1.6),sect(cov2,20,95,world?0:1.6)],'m1');
    if(v.rail&&!world)picatinny(root,{z0:-118,z1:84,y:31,W:21});
    if(v.rail&&world)root.add(nh(box(21,4.5,202,0,33,-17)),'steel');
    // — lufa, rurka gazowa, blok gazowy —
    const barrelLen=-150-MZ;
    root.add(X(cyl(8,8,barrelLen,0,0,(-150+MZ)/2,world?6:8,'z',world?0:1.4)),'m1');
    root.add(X(cyl(10.5,10.5,205,0,22,-252,world?6:10,'z',0)),M2);
    root.add(X(box(24,32,24,0,12,-343,0,0,0,world?0:1.4)),M2);
    // — łoże —
    const up=[[-16,4],[16,4],[16,22],[12,33],[-12,33],[-16,22]],lo=[[-19,-27],[19,-27],[19,-8],[12,3],[-12,3],[-19,-8]];
    root.add([sect(up,-310,-150,world?2:1.6),sect(lo,-312,-150,world?2:1.6)],FUR);
    if(!world){
      slots(root,{n:4,z0:-290,step:14,hw:19,y:-14,h:15});slots(root,{n:3,z0:-285,step:18,hw:16,y:20,h:9});
      root.add(sect(lo.map(p=>[p[0]*1.04,p[1]*1.02]),-318,-310,0),'steel');
    }
    // — podstawa muszki przy wylocie + uszy + kolec; hamulec/kompensator —
    root.add(X(box(22,34,22,0,10,FZ,0,0,0,world?0:1.2)),M2);
    if(!world){
      root.add([box(2.8,22,12,9.6,38,FZ,0,0,0,.6),box(2.8,22,12,-9.6,38,FZ,0,0,0,.6)],'m1');
      post(root,{z:FZ+1,y0:26,S,w:3,len:5});
      root.add(cyl(2.5,2.5,190,0,-10,-418,6,'z',0),'steel');                                   // pręt czyszczący pod lufą
    }else root.add(nh(box(3,18,5,0,35,FZ)),'black');
    if(v.brake==='akm'){
      root.add(X(cyl(10,10,48,0,0,MZ+24,world?6:10,'z',world?0:1.2)),'m1');
      root.add(X(cyl(11.5,11.5,14,0,0,MZ+55,world?6:10,'z',0)),M2);
      if(!world)root.add([quad(4,30,0,10.05,MZ+24,'+y'),quad(30,4,10.05,0,MZ+24,'+x'),quad(30,4,-10.05,0,MZ+24,'-x')],'black');
    }else{
      root.add(X(cyl(11,11,76,0,0,MZ+38,world?6:12,'z',world?0:1.2)),'m1');
      root.add(X(cyl(11.8,11.8,8,0,0,MZ+78,world?6:12,'z',0)),M2);
      if(!world)for(let i=0;i<5;i++)root.add([quad(4,12,0,11.05,MZ+12+i*13,'+y'),quad(11,4,11.05,0,MZ+12+i*13,'+x'),quad(11,4,-11.05,0,MZ+12+i*13,'-x')],'black');
    }
    // — szczerbinka: nastawnik (łuk) na lufie przed odbiornikiem —
    const rz=RZ;
    if(!world){
      root.add(box(22,6,44,0,33,rz-26,0,0,0,.8),M2);                                     // podstawa szczerbinki
      root.add(prof([[rz-62,34],[rz+4,38],[rz+4,34]],20,0,[],.7),M2);                    // łuk (liść) rosnący ku tyłowi
      sightPosts(root,{z:rz,y0:38,S:S+3.5,wTot:17,notch:5.2,len:8});
    }else root.add(nh(box(18,9,10,0,40,rz)),'black');
    // — chwyt pistoletowy, kabłąk spustu —
    root.add(prof([[14,-32],[22,-70],[28,-100],[30,-120],[46,-120],[52,-98],[48,-62],[42,-32]],28,0,[],world?2:2),FUR2);
    if(!world){
      root.add(prof([[-26,-30],[-28,-44],[-18,-56],[2,-58],[14,-46],[16,-30]],6,0,
        [[[-21,-34],[-22,-43],[-15,-51],[1,-53],[9,-44],[10,-34]]],1.2),'m1');
      root.child('trigger',[0,-34,-8]).add(prof([[-12,-33],[-6,-33],[0,-46],[-3,-50],[-8,-45]],6,0,[],0),'black');
      root.add(box(2.6,6,112,20.3,-6,-4,0,0,0,.5),'m1');                                       // lewarek bezpiecznika (prawa)
      root.add(quad(86,12,19.06,14,-52,'+x'),'black');                                          // okno wyrzutowe (prawa)
    }
    // — zamek z rączką przeładowania (prawa) —
    if(!world){
      const bo=root.child('bolt',[0,14,-30]);
      bo.add(box(22,6,9,0,14,-38,0,0,0,0),'steel');                                               // przód ślizgu
      bo.add(quad(56,6,19.07,14,-50,'+x'),'steel');                                              // suwadło w oknie
      bo.add([box(10,6,6,22,14,-42,0,0,0,.7),box(8,10,10,27,14,-34,0,0,0,.7)],'m1');            // rączka + gałka
      root.mark('ejectionPort',[19.5,14,-52]);
    }
    // — magazynek —
    const mg=root.child('magazine',[0,-32,-45]),m=v.mag;
    if(world)mg.add(prof(m.F.concat(m.R.slice().reverse()),m.w,0,[],2.2),m.mat);
    else curvedMag(mg,m.F,m.R,m.w,m.mat,m.ribMat,m.ribs);
    if(!world&&m.floor)mg.add(prof([m.F[m.F.length-1],m.R[m.R.length-1],[m.R[m.R.length-1][0]+2,m.R[m.R.length-1][1]-9],[m.F[m.F.length-1][0]-2,m.F[m.F.length-1][1]-9]],m.w+3,0,[],1.2),'black');
    // — kolba —
    if(v.stock==='wood'){
      root.add(prof([[90,18],[140,14],[210,6],[262,8],[291,12],[294,-112],[268,-122],[226,-84],[160,-52],[90,-34]],34,0,[],world?2:2),'wood');
      root.add(box(36,126,5,0,-52,292.5,0,0,0,world?0:1.2),'black');
    }else{                                                                                     // składana w bok: szkielet z rur + płyta
      const st=root.child('stock',[-18,8,96]);
      st.add(prof([[92,24],[104,24],[104,-14],[92,-14]],24,-2,[],0),'m1');                       // blok mocowania/zawiasu przy odbiorniku
      st.add(X(cyl(6.2,6.2,236,0,10,214,world?6:8,'z',world?0:1.2)),'m1');                        // górna rura
      st.add(prof([[100,-14],[100,-28],[332,-88],[332,-74]],10,0,[],world?0:1.2),'m1');           // dolny rozpór skośny
      st.add(prof([[326,16],[342,16],[342,-92],[326,-92]],34,0,[],world?2:1.6),'grip');           // płyta oporowa
      if(!world)st.add(box(30,2.4,70,0,16.4,310,0,0,0,0),'black');
    }
    // — znaczniki do ADS —
    root.mark('muzzle',[0,0,MZ]).mark('sightRear',[0,S,rz]).mark('sightFront',[0,S,FZ]).mark('sightAnchor',[0,S,rz+EYE]);
    return root;
  };
  return blueprint({id,view:mk(false),world:mk(true),muzzle:[0,0,MZ],rear:[0,S,RZ],front:[0,S,FZ],eye:[0,S,RZ+EYE],eyeRelief:EYE,
    anim:(p,t)=>{const k=sin01(t*1.6);at(p.bolt,0,0,.03*k);p.trigger.rotation.x=-.3*k;
      const d=Math.max(0,t-.55)*.5;at(p.magazine,0,-d*.45,-d*.04)}});
}

/** Uproszczony model świata rodziny AK (≤300 tri z konturami): bryły zamiast przekrojów, kontur tylko na największych. */
function akWorld(root,v,{FUR,FUR2,REC,M2,FZ,MZ,RZ}){
  root.add(box(38,46,245,0,-9,-27.5,0,0,0,2.2),REC);
  root.add(nh(box(36,18,215,0,22,-17)),'m1');
  if(v.rail)root.add(nh(box(21,4.5,200,0,33.3,-17)),'steel');
  root.add(box(34,56,160,0,3,-231,0,0,0,2),FUR);
  root.add(nh(box(15,15,-310-MZ,0,0,(-310+MZ)/2)),'m1');
  root.add(nh(box(22,34,22,0,10,FZ)),M2);
  root.add(nh(box(3,18,5,0,35,FZ)),'black');
  root.add(nh(v.brake==='akm'?box(19,19,48,0,0,MZ+24):box(22,22,76,0,0,MZ+38)),'m1');
  root.add(nh(box(18,9,10,0,40,RZ)),'black');
  root.add(prof([[14,-32],[26,-110],[48,-120],[50,-96],[42,-32]],28,0,[],2),FUR2);
  const m=v.mag,mg=root.child('magazine',[0,-32,-45]);
  mg.add(prof([m.F[0],m.F[3],m.F[5],m.R[5],m.R[3],m.R[0]],m.w,0,[],0),m.mat);
  if(v.stock==='wood'){
    root.add(prof([[90,18],[210,6],[291,12],[294,-112],[226,-84],[90,-34]],34,0,[],2),'wood');
    root.add(nh(box(36,126,5,0,-52,292.5)),'black');
  }else{
    const st=root.child('stock',[-18,8,96]);
    st.add(nh(box(12,12,236,0,10,214)),'m1');
    st.add(prof([[100,-14],[100,-28],[332,-88],[332,-74]],10,0,[],0),'m1');
    st.add(prof([[326,16],[342,16],[342,-92],[326,-92]],34,0,[],2),'grip');
  }
  return root;
}
const AKM_MAG={mat:'m1',ribMat:'steel',w:38,floor:true,ribs:[1,2,3,4],
  F:[[-82,-30],[-86,-70],[-98,-120],[-124,-170],[-160,-212],[-172,-224]],R:[[-12,-30],[-18,-70],[-32,-120],[-58,-170],[-96,-212],[-110,-228]]};
const BERYL_MAG={mat:'grip',ribMat:'black',w:30,floor:true,ribs:[1,2,3,4],
  F:[[-78,-30],[-80,-70],[-88,-120],[-102,-170],[-122,-208],[-128,-216]],R:[[-12,-30],[-14,-70],[-22,-120],[-38,-170],[-60,-208],[-68,-216]]};

BP.akm=()=>akFamily('akm',{muzzleZ:-590,rearZ:-140,frontZ:-518,wood:true,brake:'akm',stock:'wood',mag:AKM_MAG});
BP.beryl96=()=>akFamily('beryl96',{muzzleZ:-600,rearZ:-140,frontZ:-522,wood:false,brake:'beryl',stock:'fold',rail:true,mag:BERYL_MAG,rec:'m1'});

/* ───────────────────────────────── M4A1 ───────────────────────────────── */
// Płaski górny z szyną Picatinny + uchwyt do noszenia z dioptrem A2, okrągłe łoże, kolec muszki A2 na bloku gazowym,
// hamulec-klatka A2, kolba teleskopowa (wysunięta), STANAG prosty z lekkim łukiem.
function m4a1(){
  const S=66,EYE=100,RZ=46,FZ=-346,MZ=-535;
  const mk=world=>{
    const root=new Asm('root'),X=p=>world?nh(p):p;
    if(world)return m4World(root,{S,RZ,FZ,MZ});
    root.add(sect([[-17,-8],[17,-8],[17,14],[13,20],[-13,20],[-17,14]],-150,86,world?2:1.6),'m2');                    // górny
    root.add(box(30,26,196,0,-21,-2,0,0,0,world?2.2:1.8),'m1');                                                     // dolny
    root.add(box(32,16,76,0,-42,-40,0,0,0,world?0:1.6),'m1');                                                       // gniazdo magazynka
    if(world)root.add(nh(box(21,4.5,236,0,22,-32)),'steel');else picatinny(root,{z0:-150,z1:86,y:20,W:21,step:14});
    // uchwyt do noszenia z dioptrem w tylnej części
    root.add(prof([[-64,24],[-64,44],[-52,54],[-20,57],[8,58],[12,62],[48,62],[52,56],[60,48],[60,24]],18,0,
      world?[]:[[[-50,27],[-50,43],[-30,50],[0,50],[3,27]]],world?2:1.6),'m1');
    // lufa, osłona (okrągłe łoże), blok gazowy z kolcem muszki, hamulec
    root.add(X(cyl(8.5,8.5,390,0,0,-340,world?6:8,'z',world?0:1.2)),'m1');
    const hg=[[-23,-10],[-10,-23],[10,-23],[23,-10],[23,10],[10,23],[-10,23],[-23,10]];
    root.add(sect(hg,-328,-142,world?2:1.8),'grip');
    root.add(X(sect(hg.map(p=>[p[0]*1.1,p[1]*1.1]),-148,-138,0)),'steel');                                          // pierścień delta
    root.add(X(box(22,26,26,0,12,FZ,0,0,0,world?0:1.2)),'m1');
    if(!world){
      slots(root,{n:7,z0:-312,step:24,hw:23,y:0,h:16,w:4});
      root.add([box(2.6,45,14,7.8,47.5,FZ,0,0,0,.6),box(2.6,45,14,-7.8,47.5,FZ,0,0,0,.6)],'m1');
      post(root,{z:FZ+1,y0:25,S,w:3,len:5});
      // dioptr A2 w obudowie z uszami
      aperture(root,{z:RZ,y:S,W:15,hole:6.4,len:5});
      root.add([box(2.6,16,18,9,62,RZ-4,0,0,0,.6),box(2.6,16,18,-9,62,RZ-4,0,0,0,.6)],'m1');
      root.add(quad(18,4,0,23.06,86,'+y'),'black');
    }else root.add([nh(box(3,40,5,0,45,FZ)),nh(box(14,8,8,0,67,RZ))],'black');
    root.add(X(cyl(10.5,10.5,55,0,0,-507.5,world?6:10,'z',world?0:1.2)),'m1');                                      // klatka A2
    if(!world)for(let i=0;i<4;i++)root.add([quad(5,16,10.6,0,-492-i*9.5,'+x'),quad(5,16,-10.6,0,-492-i*9.5,'-x'),quad(16,5,0,10.6,-492-i*9.5,'+y')],'black');
    // chwyt, kabłąk, spust, magazynek
    root.add(prof([[40,-34],[44,-62],[54,-94],[60,-118],[82,-122],[86,-108],[82,-84],[78,-60],[78,-34]],27,0,[],world?2:2),'grip');
    if(!world){
      root.add(prof([[-8,-31],[-10,-46],[0,-54],[24,-54],[38,-44],[40,-31]],6,0,
        [[[-3,-35],[-4,-44],[2,-49],[22,-49],[32,-42],[33,-35]]],1.2),'m1');
      root.child('trigger',[0,-34,6]).add(prof([[0,-33],[6,-33],[11,-46],[8,-51],[3,-45]],6,0,[],0),'black');
      root.add(quad(40,13,17.06,8,12,'+x'),'black');                                                                  // okno wyrzutowe
      root.add([box(8,9,18,19.5,6,50,0,0,0,.6),cyl(4.2,4.2,5,17.5,-22,-22,8,'x',.6)],'m1');                          // kapsel asyst., zatrzask mag.
      const bo=root.child('bolt',[0,22,92]);
      bo.add([box(24,5,24,0,23.5,98,0,0,0,.8),box(9,7,12,0,28,106,0,0,0,.8)],'m1');                                  // rączka przeładowania T
      bo.add(quad(30,6,17.07,8,14,'+x'),'steel');                                                                     // suwadło w oknie
      root.mark('ejectionPort',[18,8,12]);
    }
    const mg=root.child('magazine',[0,-50,-46]);
    const F=[[-80,-50],[-84,-110],[-94,-160],[-98,-196]],R=[[-14,-50],[-18,-110],[-28,-160],[-33,-196]];
    if(world)mg.add(prof(F.concat(R.slice().reverse()),24,0,[],2.2),'steel');
    else{curvedMag(mg,F,R,24,'steel','black',[1,2,3]);mg.add(prof([F[3],R[3],[R[3][0]+1,R[3][1]-8],[F[3][0]-1,F[3][1]-8]],27,0,[],1.2),'black')}
    // lufa rury buforowej i kolba teleskopowa
    root.add(X(cyl(12.5,12.5,184,0,-2,188,world?6:10,'z',0)),'m1');
    root.add(prof([[106,10],[190,12],[265,14],[300,18],[303,-52],[262,-42],[182,-30],[128,-18],[106,-14]],34,0,[],world?2:2),'grip');
    root.add(box(38,72,6,0,-17,303.5,0,0,0,world?0:1.2),'black');
    if(!world)root.add(box(10,8,16,0,-22,125,0,0,0,.6),'m1');                                                          // dźwignia blokady kolby
    root.mark('muzzle',[0,0,MZ]).mark('sightRear',[0,S,RZ]).mark('sightFront',[0,S,FZ]).mark('sightAnchor',[0,S,RZ+EYE]);
    return root;
  };
  return blueprint({id:'m4a1',view:mk(false),world:mk(true),muzzle:[0,0,MZ],rear:[0,S,RZ],front:[0,S,FZ],eye:[0,S,RZ+EYE],eyeRelief:EYE,
    anim:(p,t)=>{const k=sin01(t*1.6);at(p.bolt,0,0,28*.001*k);p.trigger.rotation.x=-.3*k;
      const d=Math.max(0,t-.55)*.5;at(p.magazine,0,-d*.45,0)}});
}
BP.m4a1=m4a1;
/** Uproszczony model świata M4A1 (≤300 tri). */
function m4World(root,{FZ,MZ,RZ}){
  root.add(box(34,28,236,0,6,-32,0,0,0,2),'m2');
  root.add(nh(box(21,4.5,236,0,22,-32)),'steel');
  root.add(prof([[-64,24],[-64,48],[-20,57],[12,62],[52,56],[60,24]],18,0,[],0),'m1');
  root.add(box(46,46,190,0,0,-235,0,0,0,2),'grip');
  root.add(nh(box(17,17,350,0,0,-310)),'m1');
  root.add(nh(box(22,26,26,0,12,FZ)),'m1');
  root.add(nh(box(3,40,5,0,45,FZ)),'black');
  root.add(nh(box(21,21,55,0,0,-507.5)),'m1');
  root.add(nh(box(14,8,8,0,67,RZ)),'black');
  root.add(box(30,26,196,0,-21,-2,0,0,0,2),'m1');
  root.add(prof([[40,-34],[62,-118],[86,-122],[78,-34]],27,0,[],2),'grip');
  const mg=root.child('magazine',[0,-50,-46]);
  mg.add(prof([[-80,-50],[-98,-196],[-33,-196],[-14,-50]],24,0,[],0),'steel');
  root.add(nh(box(25,25,184,0,-2,188)),'m1');
  root.add(prof([[106,10],[265,14],[300,18],[303,-52],[182,-30],[106,-14]],34,0,[],2),'grip');
  root.add(nh(box(38,72,6,0,-17,303.5)),'black');
  return root;
}

/* ───────────────────────────── rejestracja ───────────────────────────── */
function register(id){
  const W=DS.weapons.get(id);if(!W)return;
  const bp=BP[id]();
  W.getViewModel=mats=>bp.view(mats);
  W.getWorldModel=mats=>bp.world(mats);
  W.sightAnchor=bp.sightAnchor;W.sightRear=bp.sightRear;W.sightFront=bp.sightFront;W.modelTris=()=>bp.tris();
  W.model=({group,mat1,mat2,muzzle})=>{
    const vm=bp.view({m1:mat1,m2:mat2});
    group.add(vm);Object.assign(group.userData,vm.userData);
    muzzle.copy(bp.muzzle);
  };
}
for(const id of Object.keys(BP))register(id);
