// Modele strzelb: Mossberg 500 (pompka) i Saiga-12 (półautomat AK) (ds-weapon-modeler). Kontrakt i API jak w pistols.js
// (getViewModel/getWorldModel/sightAnchor/sightRear/sightFront/modelTris; części: muzzle, ejectionPort, sightAnchor, magazine, pump/bolt, trigger).
// Układ: wylot w −Z, +Y góra, +X prawo, oś lufy x=0,y=0, z=0 mniej więcej na spuście. Wymiary w mm.
//
// REFERENCJE (mm; en.wikipedia.org/wiki/Mossberg_500, /Saiga-12):
//   Mossberg 500: dł. 917 (wariant z lufą 18,5"), lufa ~457, masa 3,18 kg, aluminiowa komora z krótką szyną/tang-safety na górze, rura magazynu
//     pod lufą (5+1 .. 8+1), pompka (forend) na prętach zamka, kulka mosiężna lub „ghost ring”, kolba z LOP ~356.
//   Saiga-12: dł. 1145, lufa 580 (wariant 12K: 430), masa 3,6 kg, wys. 190, kształt AK (tłoczona komora, tuleja gazowa nad lufą, szczerbinka
//     szczelinowa, słupek muszki na podstawie przy wylocie), magazynek pudełkowy 12/70 (naboje wzdłuż osi lufy => głębokość ~82), lufa gładka.
import {Asm,blueprint,box,cyl,prof,sect,quad,ring,sph,nh,sightPosts,sin01,clamp01,at,registerAll} from './long-kit.js';

const BP={};

/* ───────────────────────────── MOSSBERG 500 ───────────────────────────── */
// Komora z=-105..105, lufa do -560 (muzzle), kolba do +357. Pompka (pump) jedzie wzdłuż +Z po prętach zamka.
function mossberg500(){
  const S=30,EYE=200,ZR=62,ZF=-545;
  const mk=world=>{
    const root=new Asm('root'),T=world?0:2;
    root.add(sect([[-18,-44],[18,-44],[20,-36],[20,16],[14,24],[-14,24],[-20,16],[-20,-36]],-105,95,world?0:2),'m1');   // komora
    root.add(world?nh(cyl(14,11.5,455,0,0,-332.5,6)):cyl(14,11.5,455,0,0,-332.5,10,'z',1.6),'m1');                         // lufa
    root.add(world?nh(cyl(10,10,340,0,-27,-270,6)):cyl(10,10,340,0,-27,-270,8,'z',1.4),'m2');                              // rura magazynu
    // kolba i trzewik
    root.add(prof([[90,24],[140,16],[250,8],[330,2],[351,0],[348,-108],[296,-82],[220,-48],[160,-38],[120,-40],[90,-44]],30,0,[],world?1.4:2),'woodDark');
    root.add(prof([[351,0],[357,0],[354,-110],[348,-108]],30,0,[],world?0:1.4),'black');
    // zespół spustowy (płyta ze spustem)
    root.add(prof([[-50,-42],[-50,-76],[-44,-84],[8,-84],[16,-76],[28,-60],[70,-52],[95,-44],[95,-42]],10,0,
      world?[]:[[[-42,-44],[-42,-72],[-38,-76],[4,-76],[10,-72],[12,-44]]],world?0:1.2),'m2');
    // pompka (pump): grupa z pivotem w środku łoża
    const pump=world?root:root.child('pump',[0,-30,-250]);
    pump.add(sect([[-16,-6],[16,-6],[22,-14],[22,-38],[16,-52],[-16,-52],[-22,-38],[-22,-14]],-320,-180,world?0:2),'woodDark');
    pump.add([box(4,6,130,-14,-24,-115,0,0,0,0),box(4,6,130,14,-24,-115,0,0,0,0)],'m2');                                    // pręty zamka
    if(world){
      root.add(nh(box(6,22,10,0,22,ZF)),'black');root.add(nh(box(12,8,10,0,28,ZR)),'black');
      return root;
    }
    for(let i=0;i<8;i++)pump.add([quad(1.8,30,22.05,-30,-300+i*12,'+x'),quad(1.8,30,-22.05,-30,-300+i*12,'-x')],'black');   // żłobienia pompki
    // rura magazynu: zaślepka + obejma lufy
    root.add([cyl(11.5,11.5,10,0,-27,-445,8,'z',1.2),box(24,50,12,0,-12,-430,0,0,0,1.4)],'m2');
    // okno wyrzutowe, okno ładowania, bezpiecznik na tylnej części komory
    root.add(quad(75,17,20.05,6,-35,'+x'),'black');root.mark('ejectionPort',[21,6,-35]);
    root.add(quad(60,12,0,-44.05,-40,'+y'),'black');
    root.add([box(10,4,22,0,26,84,0,0,0,1),box(4,6,22,20.5,-38,-5,0,0,0,0)],'black');                                       // przycisk tang safety (góra), przycisk zwalniający zamek
    // przyrządy: muszka kulkowa na rampie + ghost ring na komorze
    root.add(prof([[-550,10],[-505,10],[-512,20],[-522,26],[-544,27]],6,0,[],1),'black');
    root.add(sph(2.8,0,S,ZF,6,0),'brass');
    root.add([ring(7,4.2,4,0,S,ZR,8,'z'),box(12,4,12,0,26,ZR,0,0,0,0)],'black');
    root.add(cyl(8.5,8.5,.6,0,0,-560.1,10,'z',0),'black');
    // spust
    root.child('trigger',[0,-46,-12]).add(prof([[-14,-46],[-9,-46],[-3,-60],[-5,-72],[-11,-70],[-13,-58]],6,0,[],1),'black');
    // nabój wsuwany do okna ładowania (animacja przeładowania; w spoczynku ukryty w komorze)
    const mg=root.child('magazine',[0,-18,-40]);
    mg.add(cyl(9.5,9.5,52,0,-18,-44,8,'z',0),'red');mg.add(cyl(9.8,9.8,12,0,-18,-12,8,'z',0),'brass');
    root.mark('muzzle',[0,0,-560]).mark('sightRear',[0,S,ZR]).mark('sightFront',[0,S,ZF]).mark('sightAnchor',[0,S,ZR+EYE]);
    return root;
  };
  return blueprint({id:'mossberg500',view:mk(false),world:mk(true),muzzle:[0,0,-560],rear:[0,S,ZR],front:[0,S,ZF],eye:[0,S,ZR+EYE],eyeRelief:EYE,
    anim:(p,t)=>{const k=sin01(t*1.4),d=sin01((t-.5)*2);
      at(p.pump,0,0,.075*k);p.trigger.rotation.x=-.35*sin01(t*3);at(p.magazine,0,-.062*d,0)}});
}
BP.mossberg500=mossberg500;

/* ───────────────────────────── SAIGA-12 ───────────────────────────── */
// Kształt AK: komora z=-160..186, lufa 580 do -790, łoże drewniane, magazynek pudełkowy 12/70 (głęb. ~82), kolba stała do +358.
function saiga12(){
  const S=46,EYE=300,ZR=-125,ZF=-765;
  const zc=y=>-70-55*Math.pow(clamp01((-30-y)/200),1.8);                                      // linia środkowa magazynka (wygięcie do przodu)
  const mk=world=>{
    const root=new Asm('root'),T=world?0:2;
    root.add(sect([[-18,-30],[18,-30],[20,-26],[20,12],[-20,12],[-20,-26]],-160,186,T),'m1');                        // komora (tłoczona)
    root.add(sect([[-18,10],[18,10],[18,18],[12,27],[-12,27],[-18,18]],-95,186,T),'m1');                              // pokrywa
    root.add(world?nh(cyl(13.5,13.5,640,0,0,-470,6)):cyl(13.5,13.5,640,0,0,-470,10,'z',1.6),'m1');                    // lufa gładka
    root.add(sect([[-14,10],[14,10],[16,24],[10,34],[-10,34],[-16,24]],-330,-165,world?0:2),'wood');                  // osłona górna
    root.add(sect([[-18,12],[18,12],[26,0],[26,-14],[18,-26],[-18,-26],[-26,-14],[-26,0]],-410,-160,world?0:2),'wood');  // łoże dolne
    // magazynek pudełkowy 12/70
    const pts=[],ys=[-40,-90,-140,-190,-232];
    for(const y of ys)pts.push([zc(y)-41,y]);
    for(let i=ys.length-1;i>=0;i--)pts.push([zc(ys[i])+41,ys[i]]);
    // chwyt pistoletowy, kabłąk, kolba
    root.add(prof([[30,-27],[80,-27],[108,-152],[70,-156],[48,-100],[32,-60]],30,0,[],world?0:2),'grip');
    root.add(prof([[170,26],[270,22],[340,14],[352,12],[350,-96],[334,-100],[270,-60],[170,-36]],34,0,[],world?1.4:2),'wood');
    root.add(box(36,104,8,0,-44,356,0,0,0,world?0:1.4),'black');
    root.add(box(38,24,90,0,-42,-70,0,0,0,world?0:1.6),'m2');                                                         // gniazdo magazynka
    if(world){
      root.add(nh(prof(pts,30,0,[],0)),'m2');
      root.add(nh(box(10,34,12,0,30.5,ZF)),'black');root.add(nh(box(20,20,8,0,36,ZR)),'black');
      root.add(nh(box(26,24,28,0,18,-482)),'m1');
      return root;
    }
    root.add(cyl(8,8,150,0,22,-405,8,'z',1.2),'m1');                                                                  // rura gazowa
    root.add(box(24,24,28,0,18,-482,0,0,0,1.6),'m1');                                                                 // tuleja gazowa
    root.add(cyl(15,15,20,0,0,-780,8,'z',1.2),'m2');                                                                  // gwint wylotu
    root.add(cyl(10.5,10.5,.6,0,0,-790.1,10,'z',0),'black');
    // przyrządy: szczerbinka na podstawie przed pokrywą, muszka w skrzydełkach przy wylocie
    root.add(box(30,14,70,0,19,-130,0,0,0,1.4),'m1');
    sightPosts(root,{z:ZR,y0:26,S,wTot:18,notch:5,len:6});
    root.add([box(16,20,18,0,23.5,ZF,0,0,0,1.4),box(2.6,12.5,4,0,39.75,ZF,0,0,0,0),box(3,16,8,-8.5,41.5,ZF,0,0,0,0),box(3,16,8,8.5,41.5,ZF,0,0,0,0)],
      'black');
    // detale komory
    root.add([quad(300,3,20.05,-12,10,'+x'),quad(300,3,-20.05,-12,10,'-x')],'black');
    root.add(quad(100,6,20.05,10,-40,'+x'),'black');
    root.add(box(2.5,11,140,21.3,1,15,0,0,0,.8),'m2');                                                                 // dźwignia bezpiecznika
    root.mark('ejectionPort',[21,8,-10]);
    // zamek: rączka przeładowania po prawej
    const bolt=root.child('bolt',[22,10,-30]);
    bolt.add([box(6,5,10,22,10,-30,0,0,0,0),box(12,9,16,29,12,-30,0,0,0,1.2)],'m1');
    // spust i kabłąk
    root.add(prof([[-40,-27],[-40,-70],[-34,-80],[18,-80],[26,-72],[30,-27]],8,0,
      [[[-32,-30],[-32,-66],[-28,-72],[14,-72],[20,-66],[22,-30]]],1.2),'m2');
    root.child('trigger',[0,-34,-12]).add(prof([[-14,-34],[-8,-34],[-2,-50],[-4,-62],[-10,-60],[-13,-48]],6,0,[],1),'black');
    // magazynek (dziecko)
    const mg=root.child('magazine',[0,-120,zc(-120)]);
    mg.add(prof(pts,30,0,[],1.6),'m2');
    mg.add(prof([[zc(-232)-43,-232],[zc(-232)+43,-232],[zc(-232)+43,-240],[zc(-232)-43,-240]],36,0,[],1.2),'black');
    for(let i=0;i<5;i++){const y=-70-i*32;mg.add([quad(60,2.4,15.05,y,zc(y),'+x'),quad(60,2.4,-15.05,y,zc(y),'-x')],'black')}
    root.mark('muzzle',[0,0,-790]).mark('sightRear',[0,S,ZR]).mark('sightFront',[0,S,ZF]).mark('sightAnchor',[0,S,ZR+EYE]);
    return root;
  };
  return blueprint({id:'saiga12',view:mk(false),world:mk(true),muzzle:[0,0,-790],rear:[0,S,ZR],front:[0,S,ZF],eye:[0,S,ZR+EYE],eyeRelief:EYE,
    anim:(p,t)=>{const k=sin01(t),d=Math.max(0,t-.5)*.2;
      at(p.bolt,0,0,.07*k);p.trigger.rotation.x=-.35*k;at(p.magazine,0,-d*.95,d*.3)}});
}
BP.saiga12=saiga12;

registerAll(BP);



