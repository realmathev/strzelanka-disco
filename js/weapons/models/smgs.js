// Modele pistoletów maszynowych: Uzi, MP5A3, PM-63 RAK (ds-weapon-modeler). Kontrakt i API jak w pistols.js
// (getViewModel/getWorldModel/sightAnchor/sightRear/sightFront/modelTris; części nazwane: muzzle, ejectionPort, sightAnchor, magazine, bolt...).
// Układ: wylot w −Z, +Y góra, +X prawo, oś lufy x=0,y=0. Wymiary w mm, linia celowania S nad osią lufy, oko = szczerbinka + EYE (z+).
//
// REFERENCJE (mm; źródła w real.src danych broni; en.wikipedia.org):
//   Uzi (IMI): dł. 470 (kolba złożona) / 640 (rozłożona), lufa 260, masa 3,5 kg, magazynek 32 w chwycie, kolba drutowa, grzebień chwytu
//     z bezpiecznikiem chwytowym, łoże-chwyt przedni pod lufą, kwadratowa tłoczona komora zamkowa, szczerbinka/muszka w „uszach”, promień celowania ~385.
//   MP5A3 (H&K): dł. 680 (kolba wysunięta), lufa 225, wys. 260, szer. 50, masa 2,54 kg, łoże polimerowe z żłobieniami, chwyt pistoletowy pochylony ~17°,
//     magazynek bananowy 30, dioptr obrotowy (bęben 4 otwory), muszka w kapturze (pierścień), rączka przeładowania z lewej, kolba dwupałąkowa wysuwana.
//   PM-63 RAK (Polska): dł. 333 (kolba złożona) / 583 (rozłożona), lufa 152, wys. 145–213, masa 1,6 kg, promień celowania 153 (obie szczerbinki na zamku),
//     tuleja-zamek wokół lufy ze „łyżkowym” kompensatorem, składany chwyt przedni z tworzywa, kolba z płaskowników, magazynek 25 w chwycie.
import {Asm,blueprint,box,cyl,prof,sect,quad,ring,lathe,sph,rbox,rcyl,nh,sightPosts,frontPost,sin01,clamp01,at,registerAll} from './long-kit.js';

const BP={};
const circ=(a,r,cx,cy)=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r];

/* ───────────────────────────── UZI ───────────────────────────── */
// z=0 mniej więcej na spuście. Komora zamkowa z=-215..186, wylot -270, kolba drutowa wyciągnięta do +385.
function uzi(){
  const S=38,EYE=190,ZR=150,ZF=-236;
  const Fz=y=>-4+(-30-y)*.1,Bz=y=>42+(-30-y)*.12;               // przedni/tylny pas chwytu
  const mk=world=>{
    const root=new Asm('root');
    // komora zamkowa (tłoczona, kwadratowa) + grzbiet pokrywy
    root.add(sect([[-22,-30],[22,-30],[26,-26],[26,16],[20,22],[-20,22],[-26,16],[-26,-26]],-215,186,world?0:2),'m1');
    root.add(sect([[-14,22],[14,22],[12,27],[-12,27]],-170,180,world?0:1.4),'m1');
    root.add(sect([[-18,-24],[18,-24],[22,-18],[22,12],[16,18],[-16,18],[-22,12],[-22,-18]],186,200,world?0:1.6),'m1');   // dekiel tylny
    root.add([cyl(19,19,34,0,0,-232,world?6:10,'z',world?0:2),cyl(9.5,9.5,26,0,0,-262,world?6:8,'z',world?0:1.4)],'m2'); // nakrętka lufy, nos lufy
    // chwyt pistoletowy z magazynkiem
    root.add(prof([[-4,-30],[42,-30],[46,-62],[54,-130],[6,-130],[2,-62]],34,0,[],world?0:2),'grip');
    // łoże przednie (chwyt przedni)
    root.add(prof([[-176,-27],[-134,-27],[-130,-60],[-136,-100],[-170,-100],[-178,-60]],30,0,[],world?0:1.8),'grip');
    if(world){
      root.add(nh(prof([[Fz(-130)+4,-60],[Bz(-130)-4,-60],[Bz(-240)-4,-240],[Fz(-240)+4,-240]],24,0,[],0)),'m1');
      root.add(nh(box(5,10,8,0,40,-236)),'black');root.add(nh(box(16,8,6,0,35,150)),'black');
      root.add(nh(box(4,4,176,-21,-14,278)),'m2');root.add(nh(box(4,4,176,21,-14,278)),'m2');
      root.add(nh(prof([[358,-6],[372,-6],[376,-100],[364,-100]],36,0,[],0)),'m1');
      return root;
    }
    // zamek: pokrętło napinające w szczelinie górnej pokrywy
    root.add(quad(7,128,0,27.05,-100,'+y'),'black');
    const bolt=root.child('bolt',[0,27,-100]);
    bolt.add([box(24,6,24,0,30,-100,0,0,0,1.2),box(10,4,18,0,26,-100,0,0,0,0)],'m2');
    // okno wyrzutowe (prawa strona), żebra tłoczenia
    root.add(quad(56,14,26.05,8,-62,'+x'),'black');
    root.add([quad(380,2.4,26.05,-12,-12,'+x'),quad(380,2.4,-26.05,-12,-12,'-x')],'black');
    root.mark('ejectionPort',[27,8,-62]);
    // bezpiecznik chwytowy, przełącznik rodzaju ognia
    root.add([box(14,34,6,0,-58,46.5,0,0,0,1.2),box(3,7,24,-27.5,-16,28,0,0,0,0)],'m2');
    root.add(prof([[-72,-27],[-72,-58],[-66,-64],[-14,-64],[-6,-58],[-4,-27]],8,0,
      [[[-64,-30],[-64,-55],[-61,-58],[-18,-58],[-12,-55],[-12,-30]]],1.2),'m2');
    for(let i=0;i<4;i++)root.add(quad(30,1.8,0,-45-i*12,-177.4+i*1.6,'-z'),'black');           // żłobienia przodu łoża
    // przyrządy: muszka w „uszach”, przeziernik z osłonami
    root.add([box(3,13,8,-8.5,36.5,ZF,0,0,0,0),box(3,13,8,8.5,36.5,ZF,0,0,0,0),box(2.6,S-19,4,0,19+(S-19)/2,ZF,0,0,0,0)],'black');
    root.add([ring(7,2.2,3,0,S,ZR,8,'z'),box(14,4,10,0,27+2,ZR,0,0,0,0),box(3,15,6,-9.5,34.5,ZR,0,0,0,0),box(3,15,6,9.5,34.5,ZR,0,0,0,0)],'black');
    // magazynek 32 (dziecko: spada wzdłuż osi chwytu)
    const mg=root.child('magazine',[0,-130,(Fz(-130)+Bz(-130))/2]);
    mg.add(prof([[Fz(-60)+4,-60],[Bz(-60)-4,-60],[Bz(-240)-4,-240],[Fz(-240)+4,-240]],24,0,[],1.6),'m1');
    mg.add(prof([[Fz(-240)+1,-240],[Bz(-240)-1,-240],[Bz(-247)-1,-247],[Fz(-247)+1,-247]],30,0,[],1.2),'black');
    for(let i=0;i<5;i++){const y=-150-i*17;mg.add([quad(32,2,12.05,y,(Fz(y)+Bz(y))/2,'+x'),quad(32,2,-12.05,y,(Fz(y)+Bz(y))/2,'-x')],'black')}
    root.child('trigger',[0,-34,-30]).add(prof([[-34,-34],[-29,-34],[-24,-46],[-26,-51],[-31,-48]],6,0,[],1),'black');
    // kolba drutowa (zawias z tyłu komory; rozłożona)
    const st=root.child('stock',[0,-14,190]);
    st.add([box(5,5,176,-21,-14,278,0,0,0,1),box(5,5,176,21,-14,278,0,0,0,1),box(44,5,5,0,-14,191,0,0,0,0)],'m1');
    st.add(prof([[360,-6],[372,-6],[376,-60],[376,-104],[364,-104],[362,-60]],38,0,[],1.6),'m1');
    root.mark('muzzle',[0,0,-272]).mark('sightRear',[0,S,ZR]).mark('sightFront',[0,S,ZF]).mark('sightAnchor',[0,S,ZR+EYE]);
    return root;
  };
  return blueprint({id:'uzi',view:mk(false),world:mk(true),muzzle:[0,0,-272],rear:[0,S,ZR],front:[0,S,ZF],eye:[0,S,ZR+EYE],eyeRelief:EYE,
    anim:(p,t)=>{const k=sin01(t),d=Math.max(0,t-.5)*.2;
      at(p.bolt,0,0,.032*k);p.trigger.rotation.x=-.35*k;at(p.magazine,0,-d,0)}});
}
BP.uzi=uzi;

/* ───────────────────────────── MP5A3 ───────────────────────────── */
// z=0 na spuście. Komora z=-82..200, mufa/dekiel do 240, lufa do -258, łoże A3 z=-212..-84, kolba dwupałąkowa do +422.
function mp5a3(){
  const S=44,EYE=170,ZR=160,ZF=-244;
  const zc=y=>-52-32*Math.pow(clamp01((-40-y)/172),1.7);        // linia środkowa magazynka bananowego
  const mk=world=>{
    const root=new Asm('root'),T=world?0:2;
    root.add(sect([[-18,-22],[18,-22],[24,-12],[24,10],[17,22],[-17,22],[-24,10],[-24,-12]],-82,200,T),'m1');           // komora
    root.add(world?nh(cyl(22,22,40,0,-2,220,6)):cyl(22,22,40,0,-2,220,10,'z',1.8),'m1');                                 // tuleja tylna
    root.add(box(44,24,56,0,-34,-52,0,0,0,world?0:1.6),'m1');                                                             // gniazdo magazynka
    root.add(sect([[-18,12],[18,12],[26,4],[26,-26],[19,-40],[-19,-40],[-26,-26],[-26,4]],-212,-84,T),'grip');            // łoże A3
    root.add(world?nh(cyl(8,8,60,0,0,-232,6)):cyl(8,8,60,0,0,-228,8,'z',1.4),'m2');                                       // lufa
    root.add(world?nh(cyl(11.5,11.5,26,0,0,-245,6)):cyl(11.5,11.5,26,0,0,-245,10,'z',1.6),'m2');                          // zespół wylotowy
    // chwyt pistoletowy + kabłąk (jedna część polimerowa)
    root.add(prof([[-26,-20],[64,-20],[96,-132],[52,-134],[24,-76],[-18,-76],[-27,-68]],36,0,
      world?[]:[[[-18,-26],[10,-26],[20,-46],[22,-66],[18,-70],[-14,-70],[-22,-64],[-22,-30]]],T),'grip');
    // magazynek bananowy 30
    const pts=[];const ys=[-40,-90,-140,-180,-212];
    for(const y of ys)pts.push([zc(y)-20,y]);
    for(let i=ys.length-1;i>=0;i--)pts.push([zc(ys[i])+20,ys[i]]);
    // przyrządy (muszka w kapturze, przeziernik w bębnie)
    const front=[ring(9.5,7,8,0,S,ZF,8,'z'),box(2.4,8,3,0,S-3.5,ZF,0,0,0,0),box(8,S-9.5-11.5,10,0,11.5+(S-9.5-11.5)/2,ZF,0,0,0,0)];
    const rear=[ring(6.5,3.2,3,0,S,ZR,8,'z'),box(24,13,34,0,28.5,150,0,0,0,0)];
    if(world){
      root.add(nh(prof(pts,24,0,[],0)),'m1');
      root.add(nh(box(8,8,10,0,S-4,ZF)),'black');root.add(nh(box(22,22,20,0,33,150)),'m1');
      root.add(nh(box(4,4,190,-17,-8,320)),'m2');root.add(nh(box(4,4,190,17,-8,320)),'m2');
      root.add(nh(prof([[412,26],[424,20],[428,-56],[412,-56]],34,0,[],0)),'grip');
      return root;
    }
    root.add(front,'black');
    root.add(rear,'black');
    root.add(cyl(9.5,9.5,18,0,S,150,10,'x',1.4),'m1');                                                                   // bęben dioptru
    root.add([quad(80,13,24.05,3,22,'+x')],'black');root.mark('ejectionPort',[25,3,22]);
    for(let i=0;i<3;i++)root.add([quad(3,26,27.05,-18,-150+i*18,'+x'),quad(3,26,-27.05,-18,-150+i*18,'-x')],'black'); // żłobienia łoża
    root.add(box(3,6,22,-25.7,-10,12,0,0,0,0),'m2');                                                                      // przełącznik
    // rączka przeładowania (lewa, nad łożem)
    const bolt=root.child('bolt',[-19,16,-92]);
    bolt.add([cyl(5,5,70,-19,16,-127,6,'z',1.2),box(7,13,14,-19,24,-96,0,0,0,1.2)],'m2');
    // magazynek
    const mg=root.child('magazine',[0,-120,zc(-120)]);
    mg.add(prof(pts,24,0,[],1.6),'m1');
    mg.add(prof([[zc(-212)-22,-212],[zc(-212)+22,-212],[zc(-212)+22,-220],[zc(-212)-22,-220]],30,0,[],1.2),'black');
    for(let i=0;i<4;i++){const y=-100-i*28;mg.add([quad(34,2,12.05,y,zc(y),'+x'),quad(34,2,-12.05,y,zc(y),'-x')],'black')}
    root.child('trigger',[0,-26,-8]).add(prof([[-10,-26],[-4,-26],[2,-44],[1,-58],[-5,-56],[-9,-42]],6,0,[],1),'black');
    // kolba wysuwana (dwa pałąki + stopka)
    const st=root.child('stock',[0,-8,240]);
    st.add([box(5,5,190,-17,-8,335,0,0,0,1),box(5,5,190,17,-8,335,0,0,0,1)],'m2');
    st.add(prof([[412,26],[424,20],[428,-56],[412,-56]],34,0,[],1.6),'grip');
    root.mark('muzzle',[0,0,-258]).mark('sightRear',[0,S,ZR]).mark('sightFront',[0,S,ZF]).mark('sightAnchor',[0,S,ZR+EYE]);
    return root;
  };
  return blueprint({id:'mp5a3',view:mk(false),world:mk(true),muzzle:[0,0,-258],rear:[0,S,160],front:[0,S,-244],eye:[0,S,160+EYE],eyeRelief:EYE,
    anim:(p,t)=>{const k=sin01(t),d=Math.max(0,t-.5)*.2;
      at(p.bolt,0,0,.05*k);p.trigger.rotation.x=-.35*k;at(p.magazine,0,-d*.95,-d*.3)}});
}
BP.mp5a3=mp5a3;

/* ───────────────────────────── PM-63 RAK ───────────────────────────── */
// Zamek-tuleja (bolt, alias slide) niesie obie szczerbinki. Chwyt przedni (foregrip) i kolba (stock) składane.
function pm63rak(){
  const S=38,EYE=140,ZR=3,ZF=-150;
  const Fz=y=>20+(-30-y)*.1,Bz=y=>78+(-30-y)*.12;
  const mk=world=>{
    const root=new Asm('root'),T=world?0:2;
    // rama dolna (m2) + chwyt
    root.add(sect([[-16,-30],[16,-30],[19,-12],[-19,-12]],-75,150,T),'m2');
    root.add(prof([[20,-30],[78,-30],[82,-70],[90,-112],[34,-112],[28,-70]],32,0,[],T),'grip');
    if(world){
      root.add(nh(prof([[Fz(-112)+4,-80],[Bz(-112)-4,-80],[Bz(-178)-4,-178],[Fz(-178)+4,-178]],22,0,[],0)),'m1');
    }
    // zamek-tuleja
    const sl=world?root:root.child('bolt',[0,5,0]);
    sl.add(sect([[-20,-12],[20,-12],[23,-4],[23,18],[15,28],[-15,28],[-23,18],[-23,-4]],-150,163,world?0:2),'m1');
    sl.add(world?nh(cyl(13,13,22,0,5,-161,6)):cyl(13,13,22,0,5,-161,8,'z',1.4),'m1');
    sl.add(world?nh(prof([[-172,14],[-150,28],[-150,14]],10,0,[],0)):prof([[-172,14],[-150,28],[-150,14]],10,0,[],1.2),'m1');   // łyżkowy kompensator
    if(world){
      sl.add(nh(box(3,10,6,0,32,ZF)),'black');sl.add(nh(box(14,10,6,0,33,ZR)),'black');
      root.add(nh(box(3,14,250,-17,-6,283)),'m2');root.add(nh(box(3,14,250,17,-6,283)),'m2');
      root.add(nh(prof([[400,12],[410,12],[412,-60],[402,-60]],36,0,[],0)),'m1');
      root.add(nh(prof([[-68,-28],[-44,-28],[-42,-60],[-44,-112],[-66,-114],[-70,-60]],22,0,[],0)),'grip');
      return root;
    }
    sl.add(quad(70,12,23.05,8,0,'+x'),'black');sl.add(quad(30,6,0,28.05,60,'+y'),'black');
    for(let i=0;i<5;i++)sl.add([quad(2,10,23.05,4,-120+i*8,'+x'),quad(2,10,-23.05,4,-120+i*8,'-x')],'black');             // żłobienia
    // przyrządy: muszka-słupek w obsadzie, szczerbinka składana
    sl.add([box(3.6,S-28,6,0,28+(S-28)/2,ZF,0,0,0,0),box(10,3,10,0,29.5,ZF,0,0,0,0)],'black');
    sightPosts(sl,{z:ZR,y0:29,S,wTot:20,notch:5,len:5});
    sl.add(box(22,3,10,0,29.5,ZR,0,0,0,0),'black');
    root.mark('ejectionPort',[24,8,0]);
    root.add(box(3,8,24,-17,-20,108,0,0,0,0),'m1');                                                                      // bezpiecznik (lewa strona, za chwytem)
    // kabłąk i spust
    root.add(prof([[-34,-27],[-34,-52],[-29,-62],[10,-62],[16,-54],[20,-27]],8,0,[[[-27,-30],[-27,-50],[-24,-56],[6,-56],[12,-50],[14,-30]]],1.2),'m2');
    root.child('trigger',[0,-30,2]).add(prof([[0,-30],[6,-30],[11,-44],[9,-52],[3,-50],[-1,-42]],6,0,[],1),'black');
    // magazynek 25 w chwycie
    const mg=root.child('magazine',[0,-112,(Fz(-112)+Bz(-112))/2]);
    mg.add(prof([[Fz(-70)+5,-70],[Bz(-70)-5,-70],[Bz(-178)-5,-178],[Fz(-178)+5,-178]],22,0,[],1.6),'m1');
    mg.add(prof([[Fz(-178)+2,-178],[Bz(-178)-2,-178],[Bz(-185)-2,-185],[Fz(-185)+2,-185]],28,0,[],1.2),'black');
    // składany chwyt przedni
    const fg=root.child('foregrip',[0,-28,-56]);
    fg.add(prof([[-68,-28],[-44,-28],[-42,-60],[-44,-112],[-66,-114],[-70,-60]],22,0,[],1.8),'grip');
    for(let i=0;i<3;i++)fg.add(quad(22,1.6,0,-50-i*16,-66.05-i*.1,'-z'),'black');
    // kolba z płaskowników (wysuwana wzdłuż z)
    const st=root.child('stock',[0,-6,150]);
    st.add([box(3,14,250,-17,-6,283,0,0,0,1),box(3,14,250,17,-6,283,0,0,0,1)],'m2');
    st.add(prof([[400,12],[410,12],[412,-60],[402,-60]],36,0,[],1.6),'m1');
    root.mark('muzzle',[0,0,-172]).mark('sightRear',[0,S,ZR]).mark('sightFront',[0,S,ZF]).mark('sightAnchor',[0,S,ZR+EYE]);
    return root;
  };
  return blueprint({id:'pm63rak',view:mk(false),world:mk(true),muzzle:[0,0,-172],rear:[0,S,ZR],front:[0,S,ZF],eye:[0,S,ZR+EYE],eyeRelief:EYE,
    alias:{slide:'bolt'},
    anim:(p,t)=>{const k=sin01(t),d=Math.max(0,t-.5)*.2;
      at(p.bolt,0,0,.03*k);p.trigger.rotation.x=-.35*k;at(p.magazine,0,-d,0)}});
}
BP.pm63rak=pm63rak;

registerAll(BP);


