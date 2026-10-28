// Model LKM: PKM (ds-weapon-modeler). Kontrakt i userData jak w pistols.js / marksman.js.
// REFERENCJA (en.wikipedia.org/wiki/PK_machine_gun): dł. 1203, lufa 605 (z hamulcem), promień celowania 663, masa ~9 kg z dwójnogiem,
// komora zamkowa tłoczona z klapą podajnika (zawias z tyłu), cylinder gazowy POD lufą z regulatorem, dwójnóg przy przodzie cylindra
// (nogi składane do tyłu wzdłuż cylindra), uchwyt do noszenia/wymiany lufy po lewej stronie lufy, taśma 100/200/250 nab. z pudłem po lewej,
// kolba drewniana z otworem na kciuk i chwyt pistoletowy, rączka przeładowania po prawej stronie (jedzie w +Z), muszka w osłonie z uszami.
// Układ: wylot w −Z, oś lufy y=0, z=0 przy tylnej ściance komory zamkowej (komora z −262 do +46, kolba do +366). Wejście w mm.
//   części ruchome: bolt (rączka, +Z), cover (klapa podajnika, zawias z tyłu: rotation.x dodatnio = otwarcie), beltBox (= magazine; pudło + taśma),
//   belt (taśma, podrzut przy strzale), handle (uchwyt lufy: rotation.z ujemnie = w górę), bipod (rotation.x dodatnio = rozkładanie), trigger.
//   userData.toggles = [{label,set(on)}] (dwójnóg, uchwyt) – przełączniki w przeglądarce modeli; userData.setBipod(k 0..1) dla gry.
import {Asm,blueprint,box,cyl,prof,sect,quad,profH,lathe,sin01,cl01,at,nh,notchSight,reg} from './marksman-kit.js';

const BP={};
const STOCK=[[16,22],[46,22],[200,16],[354,6],[366,2],[366,-128],[358,-136],[230,-152],[130,-165],[92,-170],[50,-168],[30,-112],[16,-62]];
const HOLE=[[104,-62],[112,-44],[150,-36],[240,-32],[316,-38],[340,-54],[342,-98],[324,-112],[240,-122],[150,-130],[112,-134],[104,-118]];

function pkm(){
  const S=56,MUZ=-833,RE=-105,FR=-766,EYE=250;
  const mk=world=>{
    const root=new Asm('root');
    if(world){
      root.add(prof(STOCK,32,0,[],0),'wood');
      root.add([sect([[-29,-60],[29,-60],[29,12],[26,24],[-26,24],[-29,12]],-262,46),nh(cyl(15.5,13.5,560,0,0,-538,6))],'m1');
      root.add(nh(box(70,105,150,-69,-85,-140)),'olive');
      root.add(nh(cyl(11,11,300,0,-27,-440,5)),'m2');
      root.add(nh(box(4,26,4,0,40,-766)),'black');
      return root;
    }
    // ── komora zamkowa, tył, okna
    root.add(sect([[-29,-60],[29,-60],[29,12],[26,24],[-26,24],[-29,12]],-262,46),'m1');
    root.add([box(56,84,8,0,-18,50,0,0,0,0),box(40,40,24,0,0,-272,0,0,0,0)],'m1');
    root.add([quad(90,26,29.05,2,-150,'+x'),quad(60,20,-29.05,6,-140,'-x'),quad(80,5,29.05,-12,-60,'+x')],'black');   // okno wyrzutowe, okno podajnika, szczelina rączki
    // ── kolba z otworem na kciuk, stopka
    root.add(profH(STOCK,34,0,[HOLE],2),'wood');
    root.add(box(36,132,6,0,-63,369),'rubber');
    // ── chwyt: osłona spustu i spust
    root.add(profH([[-40,-60],[-38,-84],[-26,-98],[8,-98],[20,-84],[22,-60]],8,0,[[[-32,-62],[-30,-82],[-22,-90],[4,-90],[13,-80],[15,-62]]],1.2),'m1');
    root.child('trigger',[0,-62,5]).add(prof([[2,-60],[8,-60],[14,-74],[15,-84],[9,-84],[3,-72]],6,0,[],1.2),'black');
    // ── klapa podajnika (grupa, zawias z tyłu) z podstawą szczerbinki
    const cv=root.child('cover',[0,24,-34]);
    cv.add(sect([[-26,24],[26,24],[22,38],[-22,38]],-228,-36),'m1');
    cv.add([box(24,8,40,0,42,-105),box(10,3,70,0,39.5,-150,0,0,0,0)],'m2');
    notchSight(cv,{z:RE,y0:46,floor:50,top:60,wTot:18,notch:6,len:8,t:0});
    // ── lufa, hamulec, cylinder gazowy, dwójnóg, muszka
    root.add(cyl(15.5,13.5,560,0,0,-538,8),'m1');
    root.add([cyl(17,17,6,0,0,-306,8,'z',0),cyl(17,17,6,0,0,-322,8,'z',0)],'m2');
    root.add(lathe([[11,-833],[15,-829],[16.5,-812],[16.5,-800],[15,-796]],0,0,0,8,'z',1.2),'m1');
    for(let i=0;i<2;i++)for(const [fx,fy,fq] of [[0,16.6,'+y'],[16.6,0,'+x'],[-16.6,0,'-x']])
      root.add(fq==='+y'?quad(3,10,fx,fy,-820+i*12,'+y'):quad(10,3,fx,fy,-820+i*12,fq),'black');
    root.add(cyl(11,11,300,0,-27,-440,8),'m2');                                                  // cylinder gazowy pod lufą
    root.add([box(28,40,28,0,-12,-598),cyl(7,7,30,0,-27,-628,8,'z',1)],'m1');                    // blok gazowy z regulatorem, tłok
    root.add(box(24,29,40,0,27.5,-766),'m1');                                                    // podstawa muszki
    root.add(box(3.2,15,4,0,48.5,-766,0,0,0,0),'black');
    root.add([box(3,22,24,10,51,-766,0,0,0,0),box(3,22,24,-10,51,-766,0,0,0,0)],'m1');        // uszy osłony muszki
    // ── uchwyt do noszenia / wymiany lufy (po lewej, złożony wzdłuż lufy)
    const hd=root.child('handle',[0,0,-470]);
    hd.add([cyl(18,18,12,0,0,-400,8,'z',0),cyl(18,18,12,0,0,-540,8,'z',0),box(24,7,7,-26,0,-400,0,0,0,0),box(24,7,7,-26,0,-540,0,0,0,0)],'m2');
    hd.add(box(8,8,146,-37,0,-470,0,0,0,1.2),'rubber');
    // ── dwójnóg (złożony do tyłu wzdłuż cylindra gazowego)
    const bp=root.child('bipod',[0,-42,-585]);
    bp.add(box(62,10,14,0,-42,-585,0,0,0,0),'m1');
    for(const s of [1,-1]){bp.add(cyl(4,4,190,s*24,-42,-490,6,'z',0),'steel');bp.add(box(12,12,10,s*24,-42,-398),'rubber')}
    // ── rączka przeładowania (po prawej)
    root.child('bolt',[0,-12,-95]).add([box(16,10,24,38,-12,-95),box(10,6,6,32,-12,-95,0,0,0,0)],'m1');
    // ── pudło z taśmą (po lewej, pod oknem podajnika)
    const bb=root.child('beltBox',[-34,-50,-140]);
    bb.add(box(70,105,150,-69,-85,-140),'olive');
    bb.add(box(72,8,152,-69,-37,-140),'m2');
    for(const o of [-45,0,45])bb.add(quad(8,76,-104.05,-85,-140+o,'-x'),'black');
    const be=bb.child('belt',[-57,-10,-140]);
    for(let i=0;i<4;i++){
      const x=-73+10.6*i,y=-24+6.9*i;
      be.add(cyl(5.6,5.6,54,x,y,-140,5,'z',0),'brass');
      be.add(cyl(5.5,2.5,28,x,y,-181,4,'z',0),'steel');
    }
    be.add(box(48,3,8,-54,-14,-122,0,0,.58,0),'steel');
    root.mark('muzzle',[0,0,MUZ]).mark('ejectionPort',[30,2,-150]).mark('sightRear',[0,S,RE]).mark('sightFront',[0,S,FR]).mark('sightAnchor',[0,S,RE+EYE]);
    return root;
  };
  return blueprint({id:'pkm',view:mk(false),world:mk(true),muzzle:[0,0,MUZ],rear:[0,S,RE],front:[0,S,FR],eye:[0,S,RE+EYE],eyeRelief:EYE,
    alias:{magazine:'beltBox'},
    anim:(p,t)=>{
      const f=sin01(Math.min(1,t*2)),o=cl01((t-.5)/.1)-cl01((t-.9)/.1);
      at(p.bolt,0,0,.075*f);p.trigger.rotation.x=-.3*f;p.cover.rotation.x=1.1*o;
      at(p.belt,0,.003*f,0)}});
}
BP.pkm=pkm;

for(const id of Object.keys(BP)){
  const bp=BP[id]();
  reg(id,bp,(g,p)=>{
    g.userData.setBipod=k=>{p.bipod.rotation.x=1.75*cl01(k)};
    g.userData.toggles=[
      {label:'dwójnóg',set:on=>g.userData.setBipod(on?1:0)},
      {label:'uchwyt lufy',set:on=>{p.handle.rotation.z=on?-1.57:0}},
    ];
  });
}
