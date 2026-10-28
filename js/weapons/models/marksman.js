// Modele broni wyborowych: SVD Dragunow (z lunetą PSO-1) i Mosin wz. 91/30 (ds-weapon-modeler).
// Kontrakt i userData jak w pistols.js: DS.weapons.get(id).getViewModel()/getWorldModel()/sightAnchor/sightRear/sightFront/modelTris(),
// nazwane dzieci: muzzle, ejectionPort, sightAnchor, sightRear, sightFront, magazine (+ części ruchome poniżej).
// Układ: wylot w −Z, oś lufy y=0, z=0 przy tylnej ściance komory zamkowej. Wejście w mm.
//
// SVD (userData.setAds(on) chowa lunetę na czas ADS: gra rysuje wtedy siatkę PSO-1 z reticles.js):
//   części: bolt (= slide; rękojeść przeładowania, jedzie w +Z), magazine (10 nab., łuk do przodu, opada w dół), trigger, scope (luneta PSO-1).
//   REFERENCJA (en.wikipedia.org/wiki/SVD_Dragunov): dł. 1225, lufa 620, masa 4,3 kg, magazynek 10 nab. łukowy, hamulec-tłumik płomieni z długimi
//   szczelinami, kolba szkieletowa z otworem i policzkiem, PSO-1 4x24 (dł. ~375, eye relief ~70, oś ~70 nad osią lufy), siatka z podziałką
//   dalmierza (lewy dół), szewronami zasięgu i kreskami poprawek bocznych. Szyna boczna po lewej stronie komory.
//   Linia celowania ADS: oś lunety (y=70) równoległa do lufy: sightRear = okular, sightFront = obiektyw, oko 72 mm za okularem.
// Mosin wz. 91/30 (dł. 1232, lufa 730, masa 4 kg; en.wikipedia.org/wiki/Mosin%E2%80%93Nagant):
//   części: bolt (korpus zamka + trzonek ślizgają się w +Z), boltHandle (trzonek z kulą, obrót wokół Z: dodatnio = w górę),
//   magazine (płyta denna magazynka, zawias z przodu), trigger. Przyrządy: szczerbinka suwakowa z drabinką (celownik ramkowy)
//   i muszka w osłonie kolistej; linia y=32 nad osią lufy, promień celowania ~610 mm.
import {Asm,blueprint,box,cyl,prof,sect,quad,profH,lathe,ring,sph,cylO,part,curvePoly,sin01,cl01,at,nh,notchSight,reg,KM} from './marksman-kit.js';

const BP={};
const lerpY=(P,z)=>{ // y krawędzi wielokąta [z,y] dla danego z (pierwszy znaleziony odcinek)
  for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];if((a[0]-z)*(b[0]-z)<=0&&a[0]!==b[0])return a[1]+(b[1]-a[1])*(z-a[0])/(b[0]-a[0])}
  return 0;
};

/* ───────────────────────────── SVD DRAGUNOW ───────────────────────────── */
const SVD_STOCK=[[12,-8],[150,-10],[300,-16],[404,-22],[412,-28],[412,-132],[404,-141],[250,-132],[84,-125],[34,-128],[22,-34],[12,-34]];
const SVD_HOLE=[[92,-60],[100,-46],[130,-41],[230,-43],[330,-49],[372,-60],[374,-90],[366,-110],[330,-114],[250,-108],[150,-99],[104,-94],[92,-80]];
function svd(){
  const SY=70,RE=-30,EYE=72,FR=-394,MUZ=-805;
  const mk=world=>{
    const root=new Asm('root');
    if(world){ // uproszczony model świata
      root.add(prof(SVD_STOCK,26,0,[],0),'wood');
      root.add([sect([[-20,-34],[20,-34],[20,6],[15,12],[-15,12],[-20,6]],-255,12),prof([[-470,2],[-250,2],[-250,-34],[-470,-26]],34,0,[],0)],'m1');
      root.add([nh(cyl(9,7.5,335,0,0,-637.5,6)),nh(cyl(11,10,56,0,0,-777,6))],'m1');
      root.add(nh(prof(curvePoly(-75,-30,125,38,.42,3),30,0,[],0)),'m2');
      root.add([cyl(17.5,17.5,320,0,SY,-215,6,'z',1.6)],'black');
      return root;
    }
    // ── komora zamkowa, pokrywa, tył
    root.add(sect([[-20,-34],[20,-34],[20,6],[15,12],[-15,12],[-20,6]],-255,12),'m1');
    root.add(sect([[-18,12],[18,12],[14,23],[-14,23]],-243,10),'m1');
    root.add(box(22,18,14,0,8,19,0,0,0,0),'m2');
    root.add(quad(64,10,20.05,-1,-152,'+x'),'black');                          // okno wyrzutowe
    root.add(box(3,14,90,21.5,-10,-80,0,0,0,0),'m2');                          // bezpiecznik (dźwignia po prawej)
    // ── kolba szkieletowa z policzkiem i stopką
    root.add(profH(SVD_STOCK,30,0,[SVD_HOLE],2),'wood');
    root.add(box(32,34,140,0,5,215),'woodDark');                               // policzek
    root.add(box(32,116,8,0,-80,416,0,0,0,0),'rubber');                                // stopka
    // ── łoże: dolne drewniane (z rowkami) + górne wentylowane
    root.add(prof([[-470,2],[-250,2],[-250,-34],[-306,-34],[-316,-28],[-326,-34],[-350,-34],[-360,-28],[-370,-34],[-420,-31],[-470,-26]],36),'wood');
    root.add(sect([[-16,-2],[16,-2],[19,10],[14,24],[-14,24],[-19,10]],-440,-262),'woodDark');
    for(let i=0;i<5;i++)for(const s of [1,-1])root.add(quad(18,5,s*19.1,12,-292-i*26,s>0?'+x':'-x'),'black'); // otwory wentylacyjne
    // ── lufa, gazowy blok, hamulec-tłumik płomieni, muszka
    root.add(box(24,30,22,0,4,-459),'m1');
    root.add(cyl(9,7.5,335,0,0,-637.5,8),'m1');
    root.add(lathe([[8.5,-805],[11,-803],[11,-770],[9.5,-760],[8.5,-748]],0,0,0,8,'z',1.2),'m1');
    for(let i=0;i<3;i++)for(const [fx,fy,fq] of [[0,11.1,'+y'],[11.1,0,'+x'],[-11.1,0,'-x']])
      root.add(fq==='+y'?quad(3,10,fx,fy,-788+i*13,'+y'):quad(10,3,fx,fy,-788+i*13,fq),'black');   // szczeliny
    root.add(box(14,13,16,0,10.5,-742,0,0,0,0),'m1');                                  // podstawa muszki
    root.add(box(3,16,4,0,25,-742,0,0,0,0),'black');
    // ── osłona spustu, spust, rączka przeładowania
    root.add(profH([[-56,-34],[-56,-64],[-46,-76],[16,-76],[26,-66],[30,-34]],8,0,
      [[[-48,-36],[-48,-62],[-42,-68],[14,-68],[20,-62],[24,-36]]],1.2),'m2');
    root.child('trigger',[0,-40,-22]).add(prof([[-27,-36],[-21,-36],[-14,-50],[-12,-60],[-18,-60],[-24,-48]],6,0,[],1.2),'black');
    const bo=root.child('bolt',[0,3,-130]);
    bo.add([box(14,8,22,28,5,-130),box(8,12,12,36,5,-130)],'m1');
    // ── magazynek 10 nab. (łuk do przodu)
    const mg=root.child('magazine',[0,-34,-75]);
    mg.add(prof(curvePoly(-75,-30,138,38,.5,5,41),34,0,[],1.8),'m2');
    // ── szyna boczna + luneta PSO-1 (osobna grupa, w ADS chowana)
    const sc=root.child('scope',[0,SY,-215]);
    notchSight(sc,{z:-266,y0:22,floor:28,top:37,wTot:14,notch:5,len:8,t:0});   // zapasowa szczerbinka mechaniczna (chowana razem z lunetą w ADS)
    sc.add([box(6,30,90,-23,-8,-170,0,0,0,1.2),box(26,30,44,-11,38,-170,0,0,0,1.2)],'grip');                // szyna boczna + mocowanie
    sc.add(cyl(19,21,24,0,SY,-42,8,'z',0),'rubber');                        // gumowa muszla
    sc.add(cyl(21,17.5,26,0,SY,-67,8,'z',1.6),'grip');                        // okular
    sc.add(cyl(17.5,17.5,200,0,SY,-180,8,'z',1.6),'grip');                    // tubus
    sc.add([cyl(19.5,19.5,10,0,SY,-120,8,'z',0),cyl(19.5,19.5,10,0,SY,-250,8,'z',0)],'steel');   // pierścienie
    sc.add([cyl(9,9,14,0,SY+22,-185,8,'y',0),cyl(7,7,10,23,SY,-185,6,'x',0)],'steel');            // bęben wysokości, pokrętło kierunku
    sc.add(cyl(17.5,24,56,0,SY,-308,8,'z',1.6),'grip');                       // dzwon obiektywu
    sc.add(cylO(23.5,23.5,58,0,SY,-365,8,'z',1.6),'grip');                    // osłona przeciwsłoneczna
    sc.add(part(new THREE.CircleGeometry(22*.001,10).rotateY(Math.PI),0,SY,-341),'glass');
    root.mark('muzzle',[0,0,MUZ]).mark('ejectionPort',[22,-1,-152]).mark('sightRear',[0,SY,RE]).mark('sightFront',[0,SY,FR]).mark('sightAnchor',[0,SY,RE+EYE]);
    return root;
  };
  return blueprint({id:'svd',view:mk(false),world:mk(true),muzzle:[0,0,MUZ],rear:[0,SY,RE],front:[0,SY,FR],eye:[0,SY,RE+EYE],eyeRelief:EYE,
    alias:{slide:'bolt'},
    anim:(p,t)=>{const k=sin01(t);at(p.bolt,0,0,.075*k);p.trigger.rotation.x=-.35*k;
      const d=Math.max(0,t-.5)*.3;at(p.magazine,0,-d,-d*.25)}});
}
BP.svd=svd;

/* ───────────────────────────── MOSIN wz. 91/30 ───────────────────────────── */
const MOS_STOCK=[[-765,-3],[-140,-3],[-140,-8],[0,-8],[60,-10],[130,-12],[220,-22],[310,-32],[395,-44],[395,-148],[330,-124],[250,-100],[170,-84],
  [110,-78],[70,-72],[35,-60],[-30,-54],[-140,-52],[-300,-45],[-500,-40],[-765,-34]];
const MOS_BOT=[[330,-124],[250,-100],[170,-84],[110,-78],[70,-72],[35,-60],[-30,-54],[-140,-52],[-300,-45],[-500,-40],[-765,-34]];
function mosin9130(){
  const S=32,MUZ=-831,RE=-205,FR=-815,EYE=350;
  const mk=world=>{
    const root=new Asm('root');
    if(world){
      root.add(prof(MOS_STOCK,34,0,[],0),'wood');
      root.add([nh(cyl(11,7.5,724,0,0,-469,6)),sect([[-17,-30],[17,-30],[17,2],[14,12],[8,16],[-8,16],[-14,12],[-17,2]],-140,-8)],'m1');
      root.add([box(36,106,6,0,-96,398,0,0,0,0),nh(box(30,18,4,0,-4,48))],'m2');
      root.add(nh(box(2.6,32,3,0,16,-815)),'black');
      return root;
    }
    // ── komora zamkowa i tył
    root.add(sect([[-17,-30],[17,-30],[17,2],[14,12],[8,16],[-8,16],[-14,12],[-17,2]],-140,-8),'m1');
    root.add(cyl(13,13,10,0,0,-3,8,'z',1.2),'m1');
    root.add([quad(12,64,0,16.05,-88,'+y'),quad(54,10,17.05,5,-78,'+x')],'black');              // okno ładownicze
    // ── drewno: kolba z łożem, nakładka, opaski
    root.add(prof(MOS_STOCK,36),'wood');
    root.add(sect([[-15,-4],[15,-4],[15,10],[10,17],[-10,17],[-15,10]],-540,-335),'woodDark');
    const band=(z,top=14)=>{const b=lerpY(MOS_BOT,z)-2;root.add(box(41,top-b,9,0,(top+b)/2,z),'m2')};
    band(-335,19);band(-545,19);
    root.add(box(38,46,16,0,-12,-757),'m2');                                                    // nakładka dziobowa
    root.add(box(36,106,6,0,-96,398),'m2');                                                     // stopka
    // ── lufa, mocowanie bagnetu, muszka w osłonie
    root.add(cyl(11,7.5,724,0,0,-469,10),'m1');
    root.add([cyl(11.2,11.2,22,0,0,-790,10,'z',1.4),box(6,10,22,0,15,-790,0,0,0,1)],'m2');        // tulejka-gniazdo bagnetu + zaczep
    root.add(cyl(8.2,8.2,6,0,0,-828,10,'z',0),'m1');
    root.add([box(16,22,22,0,2,-815),box(4,4,16,0,14.5,-815,0,0,0,.6)],'m1');
    root.add(ring(7,10.5,16,0,26,-815,10,'z',0),'m1');
    root.add(box(2.6,18,3,0,23,-815,0,0,0,.7),'black');
    // ── szczerbinka suwakowa z drabinką
    root.add(box(26,16,34,0,6,-185),'m1');
    root.add(box(15,3,128,0,15.5,-248,0,0,0,1),'m2');
    for(let i=0;i<4;i++)root.add(quad(9,5,0,17.05,-228-i*22,'+y'),'black');
    notchSight(root,{z:RE,y0:20,floor:25,top:37,wTot:14,notch:6,len:8});
    // ── spust i osłona
    root.add(profH([[-34,-47],[-32,-60],[-22,-72],[12,-72],[24,-62],[28,-47]],6,0,[[[-26,-49],[-24,-58],[-18,-66],[10,-66],[19,-58],[22,-49]]],1.2),'m2');
    root.child('trigger',[0,-48,-8]).add(prof([[-14,-48],[-8,-48],[-2,-58],[-1,-66],[-7,-66],[-13,-56]],5,0,[],1),'black');
    root.child('magazine',[0,-47,-120]).add(box(26,6,86,0,-47,-77),'m2');                       // płyta denna magazynka
    // ── zamek: korpus + kurek, trzonek z kulą (osobna grupa)
    const bo=root.child('bolt',[0,0,-15]);
    bo.add(cyl(10,10,56,0,0,13,8,'z',1.4),'m2');
    bo.add([cyl(6,6,12,0,0,47,8,'z',0),cyl(9,9,6,0,0,56,8,'z',0)],'steel');
    const bh=bo.child('boltHandle',[0,0,-15]);
    bh.add([box(38,7,8,27,2,-15,0,0,0,1.2),box(7,34,8,46,-14,-10,-.4,0,0,1.2)],'m1');
    bh.add(sph(10,46,-36,-3,7,5,1.4),'m1');
    root.mark('muzzle',[0,0,MUZ]).mark('ejectionPort',[18,5,-78]).mark('sightRear',[0,S,RE]).mark('sightFront',[0,S,FR]).mark('sightAnchor',[0,S,RE+EYE]);
    return root;
  };
  return blueprint({id:'mosin9130',view:mk(false),world:mk(true),muzzle:[0,0,MUZ],rear:[0,S,RE],front:[0,S,FR],eye:[0,S,RE+EYE],eyeRelief:EYE,
    anim:(p,t)=>{
      const lift=cl01(t/.2)-cl01((t-.7)/.2),back=cl01((t-.2)/.25)-cl01((t-.45)/.25);
      p.boltHandle.rotation.z=1.5*lift;at(p.bolt,0,0,.11*back);p.trigger.rotation.x=-.3*sin01(t*4);
      p.magazine.rotation.x=.9*cl01((t-.85)/.1)}});
}
BP.mosin9130=mosin9130;

for(const id of Object.keys(BP)){
  const bp=BP[id]();
  reg(id,bp,id==='svd'?(g,p)=>{
    g.userData.reticle='pso1';g.userData.viewFov=22;         // FOV ADS w przeglądarce modeli; w grze: adsFov z danych broni
    g.userData.setAds=on=>{p.scope.visible=!on};              // luneta nie zasłania widoku przez okular
  }:null);
}

