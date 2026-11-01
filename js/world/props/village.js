// Wieś lat 90. (poziom 5 „Wiejska dyskoteka w lesie”): sala/remiza-dyskoteka, zabudowa gospodarcza, maszyny rolnicze, pole, drobnica.
// Wymiary (m) z rzeczywistości:
//  - Ursus C-360: dł. 3,57, szer. 1,80, rozstaw osi 2,12, opony 14.9-28 (tył) / 6.00-16 (przód) - tractordata.com;
//    Ursus C-330: ok. 3,1 x 1,7, opony 12.4-28 / 6.00-16 (wycena rzeczoznawcy 1991) - dane szacowane, +-10 cm.
//  - Bizon Z056: heder 4,2 m (3,3 m alt.), zbiornik 2500 l; gabaryty ok. 9 x 3,5 x 3,9 m z katalogów (szacunek).
//  - Bela okrągła ø1,5 x 1,2 m; kostka ok. 0,9 x 0,45 x 0,5 m; przyczepa D-47 ok. 4,2 x 2,1 m; ul Dadanta ok. 0,5 x 0,5 m;
//    sławojka ok. 1,1 x 1,2 x 2,3 m; stodoła 12 x 7 m; dom 10 x 7,5 m; słup energetyczny z gniazdem bociana ~9 m.
// Konwencja: pojazdy przód w -Z, budynki „twarz” w +Z. Neony: MeshBasic (P.neon), mruganie tylko przez kolor (lib/animateWorld).
import {defProp,atlas,neonTex,glowText,shade,mixc} from './lib.js';

const PI=Math.PI,TIRE=0x1b1a1a,DARK=0x2a2622;
const fr=(x,z,ry,t,n)=>[x+Math.cos(ry)*t+Math.sin(ry)*n,z-Math.sin(ry)*t+Math.cos(ry)*n];
const BASIC={basic:true};

/** Okno z ramą, szybą (MeshBasic, opcj. kolorowe światło), szprosami i parapetem. (x,y,z) = dół-środek, ry = obrót, patrzy w kier. (sin ry, cos ry). */
function win(P,x,y,z,w,h,ry,glass,o={}){
  const p=(t,n)=>fr(x,z,ry,t,n),fc=o.frame||0xf2efe6;
  P.box(w+.14,h+.14,.08,x,y-.07,z,fc,{ry,edges:false});
  let [a,b]=p(0,.045);P.box(w,h,.04,a,y,b,glass,{ry,...BASIC});
  [a,b]=p(0,.07);P.box(.04,h,.03,a,y,b,fc,{ry,...BASIC});P.box(w,.04,.03,a,y+h/2-.02,b,fc,{ry,...BASIC});
  [a,b]=p(0,.1);P.box(w+.3,.05,.22,a,y-.12,b,o.sill||0xb8b2a6,{ry,edges:false,small:true});
}
/** Dach dwuspadowy (kalenica wzdłuż Z) + trójkąty szczytów. y = górna krawędź ścian. */
function gable(P,w,d,y,ph,x,z,roofCol,wallCol,o={}){
  const ov=o.ov==null?.3:o.ov,ovz=o.ovz==null?.5:o.ovz,a=Math.atan2(ph,w/2),eave=ov*Math.tan(a),half=w/2+ov;
  const s=Math.hypot(half,ph+eave),ang=Math.atan2(ph+eave,half);
  for(const sg of [-1,1])P.box(s,.09,d+ovz,x+sg*half/2,y+(ph-eave)/2-.045,z,roofCol,{rz:-sg*ang,edges:o.edges});
  P.box(.28,.12,d+ovz,x,y+ph-.03,z,shade(roofCol,.75),{edges:false});
  P.prism([[-w/2,0],[w/2,0],[0,ph]],.2,x,y,z-d/2,wallCol,{edges:false});
  P.prism([[-w/2,0],[w/2,0],[0,ph]],.2,x,y,z+d/2-.2,wallCol,{edges:false});
}
function wheel(P,x,yc,z,R,w,rim,lugs){
  P.cylc(R,R,w,x,yc,z,TIRE,{seg:16,rz:PI/2,edges:false,hull:.03});
  P.cylc(R*.55,R*.55,w+.03,x,yc,z,rim,{seg:10,rz:PI/2,edges:false,small:true});
  P.cylc(R*.16,R*.16,w+.1,x,yc,z,0x6a6a6a,{seg:6,rz:PI/2,edges:false,small:true});
  for(let i=0;i<lugs;i++){const a=i/lugs*PI*2;P.add(new THREE.BoxGeometry(w*.92,R*.09,R*.17),x,yc+Math.cos(a)*(R+.005),z+Math.sin(a)*(R+.005),0x121212,{rx:a,edges:false,small:true})}
}
/** Koło drewniane z żelazną obręczą i szprychami (wóz). */
function woodWheel(P,x,yc,z,R,col){
  P.cylc(R,R,.07,x,yc,z,0x2c2c2c,{seg:14,rz:PI/2,edges:false,small:true});
  P.cylc(R*.9,R*.9,.05,x,yc,z,col,{seg:14,rz:PI/2,edges:false,small:true});
  P.cylc(.07,.07,.18,x,yc,z,shade(col,.7),{seg:6,rz:PI/2,edges:false,small:true});
  for(let i=0;i<4;i++)P.box(.045,R*1.8,.04,x,yc-R*.9,z,col,{rx:i*PI/4,edges:false,small:true});
}

/* ============================ SALA WIEJSKA / REMIZA-DYSKOTEKA ============================ */
// Remiza OSP z salą: 16 x 10 m, ściany 4,0 m, kalenica ok. 6,6 m, wieża do suszenia węży 2,4 x 2,4 x 9 m.
defProp('salaWiejska',{name:'Sala wiejska (remiza-dyskoteka)',cat:'wies',dims:[16.6,10.9,12.2],cover:true,variants:['zolta','zielona','szara'],
  note:'Wejście z daszkiem, neon DISCO (emisja), kolorowe światło w oknach, brama garażowa OSP, wieża na węże.'},(P,o,r)=>{
  const v=o.variant||r.pick(['zolta','zielona','szara']),wall={zolta:0xd8c27a,zielona:0xa9c29a,szara:0xb4b0a6}[v];
  const W=16,D=10,wh=4,y0=.4,roof=r.pick([0x8a3a2a,0x6a4a3a,0x5a6068]);
  const tex=neonTex('wies:disco',512,160,(g,w,h)=>{g.fillStyle='#14061a';g.fillRect(0,0,w,h);g.strokeStyle='#ff3ad0';g.shadowColor='#ff3ad0';g.shadowBlur=14;g.lineWidth=5;g.strokeRect(10,10,w-20,h-20);g.shadowBlur=0;glowText(g,'DISCO',w/2,h/2+4,'bold 104px Bangers, Impact, sans-serif','#ff4ad8','#ffd0f6')});
  const osp=atlas('wies:osp',256,64,(g,w,h)=>{g.fillStyle='#b8231a';g.fillRect(0,0,w,h);g.fillStyle='#f4efe0';g.fillRect(4,4,w-8,h-8);g.fillStyle='#b8231a';g.font='bold 40px Impact, Arial, sans-serif';g.textAlign='center';g.fillText('REMIZA OSP',w/2,h/2+14)});
  P.box(W+.3,y0,D+.3,0,0,0,0x8a8a84);                                     // cokół
  P.box(W,wh,D,0,y0,0,wall);                                               // ściany
  P.box(W+.04,.9,D+.04,0,y0,0,shade(wall,.82),{edges:false});              // pas dolny (cokół tynkowy)
  gable(P,W,D,y0+wh,2.4,0,0,roof,wall);
  // wejście: schody, drzwi dwuskrzydłowe, daszek na słupkach
  for(let i=0;i<2;i++)P.box(3.6-i*.4,.17,.5,0,i*.17,D/2+.55-i*.4,0x9a9a94,{edges:false});
  P.box(2.4,2.5,.12,0,y0+.1,D/2+.02,0x5a3a22);
  for(const sx of [-1,1]){P.box(.95,2.1,.05,sx*.55,y0+.2,D/2+.1,0xe6b25a,{...BASIC});P.box(.05,.5,.06,sx*.08,y0+1.0,D/2+.14,0xcfcfcf,{edges:false,small:true})}
  P.box(2.4,.08,.08,0,y0+2.62,D/2+.08,0xe9e4d4,{edges:false,small:true});
  P.box(4.6,.14,2.0,0,y0+2.9,D/2+.95,0x6a3a2a);
  for(const sx of [-1,1]){P.box(.14,2.9,.14,sx*2.1,y0,D/2+1.8,0x7a6a58);P.box(.08,.9,.08,sx*2.1,y0+2.1,D/2+1.3,0x7a6a58,{rx:.7,edges:false,small:true})}
  for(let i=0;i<9;i++)P.box(.1,.1,.1,-2.1+i*.525,y0+2.78,D/2+1.92,[0xfff0a0,0xff6a6a,0x7aff9a,0x7ab0ff][i%4],{...BASIC});
  P.neon(tex,4.6,1.44,0,y0+wh-.5,D/2+.075);                                  // DISCO
  P.box(4.9,1.7,.06,0,y0+wh-1.35,D/2+.02,0x1c1c20,{edges:false,small:true});
  for(const sx of [-1,1])P.box(.5,.8,.35,sx*3.4,y0+2.6,D/2+.2,0x161616,{small:true});  // głośniki
  P.decal(osp,2.8,.7,-5.3,y0+3.3,D/2+.02);
  // brama garażowa OSP
  P.box(3.4,3.0,.1,-5.3,y0,D/2+.03,0xb8301f);
  for(let i=0;i<6;i++)P.box(3.2,.04,.04,-5.3,y0+.4+i*.45,D/2+.1,0x8a2216,{edges:false,small:true});
  // okna frontu, boki, tył
  for(const [x,c] of [[-2.6,0xff5ac8],[3.9,0x4adfff],[6.4,0xffe04a]])win(P,x,y0+1.3,D/2,1.1,1.4,0,c);
  const cols=[0xff5ac8,0x4adfff,0xffe04a,0x6aff7a,0xa86aff];
  for(const sg of [-1,1])for(let i=0;i<4;i++)win(P,sg*W/2,y0+1.3,-3.6+i*2.4,1.1,1.4,sg*PI/2,r.pick(cols));
  win(P,-4,y0+1.3,-D/2,1.1,1.4,PI,0x7a96a0);win(P,4,y0+1.3,-D/2,1.1,1.4,PI,0x7a96a0);
  P.box(1.1,2.1,.1,0,y0,-D/2-.02,0x6a4a30);                                // drzwi ewakuacyjne
  // wieża na węże + dach namiotowy
  P.box(2.4,9,2.4,-6.4,y0,-3.6,wall);P.box(2.5,.25,2.5,-6.4,y0+8.5,-3.6,shade(wall,.8),{edges:false});
  P.cyl(0,1.7,1.5,-6.4,y0+9,-3.6,roof,{seg:4,ry:PI/4});
  for(let i=0;i<3;i++)P.box(.5,.9,.06,-6.4,y0+5+i*1.2,-2.38,0x2a2622,{edges:false,small:true});
  for(const sx of [-1,1])P.cyl(.05,.05,3.9,sx*(W/2-.06),y0,D/2+.04,0x7a7a74,{seg:5,edges:false,small:true}); // rury spustowe
  P.box(W+.6,.1,.12,0,y0+wh-.12,D/2+.45,0x7a7a74,{edges:false,small:true});                                 // rynna
  P.col(-W/2-.1,W/2+.1,-D/2-.1,D/2+.1,y0+wh);
});

/* ============================ STODOŁA ============================ */
defProp('stodola',{name:'Stodoła',cat:'wies',dims:[8.1,6.6,12.9],cover:true,variants:['drewniana','ceglana'],
  note:'12 x 7 m, wrota dwuskrzydłowe z zastrzałami, luk na siano. Dach blacha.'},(P,o,r)=>{
  const v=o.variant||r.pick(['drewniana','ceglana']),W=7,D=12,wh=3.8,brick=v==='ceglana';
  const wood=r.pick([0x7a5a3a,0x6a5238,0x8a6a48]),roof=r.pick([0x7a7068,0x8a5a3a,0x5a5a58]);
  P.box(W,wh,D,0,0,0,brick?0x9a4a36:wood);
  if(brick)P.box(W+.04,1.0,D+.04,0,0,0,0x7a3a2a,{edges:false});
  gable(P,W,D,wh,2.7,0,0,roof,brick?0x9a4a36:wood,{ov:.5});
  if(!brick){
    for(const sg of [-1,1])for(let i=0;i<15;i++)P.box(.07,wh,.12,sg*(W/2+.03),0,-5.4+i*.77,shade(wood,.8),{edges:false,small:true});
    for(let i=0;i<9;i++)for(const sg of [-1,1])P.box(.12,1.0+.0,.06,-3.0+i*.75,wh-.05,sg*(D/2+.02)+0,shade(wood,.8),{edges:false,small:true});
  }
  const z=D/2;
  P.box(3.8,3.3,.12,0,0,z+.03,shade(wood,.75));
  for(const sx of [-1,1]){
    const cx=sx*.95;
    P.box(1.8,.12,.06,cx,.05,z+.1,shade(wood,.55),{edges:false,small:true});P.box(1.8,.12,.06,cx,3.1,z+.1,shade(wood,.55),{edges:false,small:true});
    P.box(2.1,.1,.05,cx,1.6,z+.1,shade(wood,.55),{rz:sx*.9,edges:false,small:true});
    P.box(.18,.4,.07,sx*.2,1.4,z+.14,0x2a2a2a,{edges:false,small:true});
  }
  P.box(.04,3.3,.1,0,0,z+.12,shade(wood,.5),{edges:false,small:true});
  P.box(1.0,.9,.1,0,wh+.6,z+.02,shade(wood,.6));P.box(.9,.8,.04,0,wh+.65,z+.08,0x1a1612,{edges:false,small:true}); // luk na siano
  P.box(.14,.12,.5,0,wh+1.5,z+.35,0x4a3a2a,{edges:false,small:true});                                           // belka z krążkiem
  P.box(1.1,2.0,.08,-3.5-.02,0,-1,shade(wood,.7),{ry:PI/2,small:true});                                           // drzwiczki boczne
  P.col(-W/2-.1,W/2+.1,-D/2-.1,D/2+.2,wh+.5);
});

/* ============================ OBORA / CHLEW ============================ */
defProp('obora',{name:'Obora / chlew',cat:'wies',dims:[6.3,4.5,14.5],cover:true,variants:['obora','chlew'],
  note:'14 x 5,5 m, bielone ściany, cokół z cegły, okienka, drzwi stajenne. Chlew: niższy, z wybiegiem.'},(P,o,r)=>{
  const v=o.variant||r.pick(['obora','chlew']),W=5.5,D=v==='obora'?14:10,wh=v==='obora'?2.7:2.3,ph=v==='obora'?1.7:1.3;
  const wall=r.pick([0xe4dfd0,0xd8d2bc,0xdfe0d4]),roof=r.pick([0x6a5a50,0x8a3a2a,0x5a5e62]);
  P.box(W,wh,D,0,0,0,wall);P.box(W+.05,.7,D+.05,0,0,0,0x8a4a38,{edges:false});
  gable(P,W,D,wh,ph,0,0,roof,wall,{ov:.35});
  const z=D/2;
  P.box(1.5,2.0,.1,-1.2,0,z+.03,0x4a6a8a);P.box(1.5,.9,.05,-1.2,1.1,z+.1,shade(0x4a6a8a,1.2),{edges:false,small:true});
  P.box(.12,.12,.05,-.7,1.0,z+.12,0x2a2a2a,{edges:false,small:true});
  win(P,1.3,1.1,z,.8,.6,0,0x6a8088);
  const n=v==='obora'?4:2;
  for(const sg of [-1,1])for(let i=0;i<n;i++)win(P,sg*W/2,1.2,-D/2+2+i*(D-4)/(n-1),.7,.5,sg*PI/2,0x5a6a70);
  P.box(1.0,1.0,1.0,2.0,wh+.3,0,shade(roof,.9),{edges:false,small:true}); // wywietrznik
  P.cyl(.1,.1,3.3,-1.0,0,-D/2+.8,0xb8b2a6,{seg:6,edges:false,small:true});
  if(v==='chlew'){for(let i=0;i<8;i++)P.box(.08,.9,.08,-3.2+i*.9,0,z+2.5,0x7a5a3a,{small:true,edges:false});P.box(.08,.08,6.6,-3.2,.85,z+1.2,0x7a5a3a,{edges:false,small:true})}
  P.col(-W/2-.1,W/2+.1,-D/2-.1,D/2+.1,wh+.4);
});

/* ============================ DOM WIEJSKI Z GANKIEM ============================ */
defProp('domWiejski',{name:'Dom wiejski z gankiem',cat:'wies',dims:[10.8,7.7,10],cover:true,variants:['tynk','cegla','bialy'],
  note:'10 x 7,5 m, eternit, okiennice, komin z anteną TV, ganek z daszkiem i ławką.'},(P,o,r)=>{
  const v=o.variant||r.pick(['tynk','cegla','bialy']),W=10,D=7.5,wh=3.0,wall={tynk:r.pick([0xd9c98a,0xc7d4a0,0xe0b8a0]),cegla:0xa8503a,bialy:0xe8e4d8}[v];
  const roof=r.pick([0x6a6a68,0x7a4a3a,0x5a5654]),shut=r.pick([0x3a6a9a,0x2f6a4a,0x8a3a2a,0x7a5a2a]);
  P.box(W+.2,.5,D+.2,0,0,0,0x8a8680);P.box(W,wh,D,0,.5,0,wall);
  gable(P,W,D,wh+.5,2.4,0,0,roof,wall,{ov:.4});
  const z=D/2,y=.5;
  for(const x of [-3.2,3.2]){win(P,x,y+1.0,z,1.0,1.3,0,0x6a8896);for(const sg of [-1,1])P.box(.45,1.3,.05,x+sg*.75,y+1.0,z+.05,shut,{edges:false,small:true});P.box(.8,.55,.03,x,y+1.45,z+.09,0xf4f0e4,{...BASIC})} // firanka
  for(const sg of [-1,1])for(let i=0;i<3;i++){win(P,sg*W/2,y+1.0,-2.4+i*2.4,.9,1.2,sg*PI/2,0x6a8896);}
  win(P,0,y+1.0,-D/2,.9,1.2,PI,0x6a8896);
  // ganek
  P.box(3.2,.3,2.0,0,0,z+1.0,0x9a968c);P.box(2.6,.1,1.6,0,.3,z+1.0,0x7a5a3a,{edges:false});
  for(const sx of [-1,1])P.box(.12,2.3,.12,sx*1.4,.3,z+1.85,0x7a5a3a);
  P.box(3.4,.1,2.3,0,2.7,z+1.0,roof,{rz:0});P.prism([[-1.7,0],[1.7,0],[0,.7]],.12,0,2.78,z+2.1,wall,{edges:false});
  P.box(1.1,2.1,.1,0,y+.1,z+.02,0x6a3e22);P.box(.06,.2,.07,.4,y+1.0,z+.1,0xcfcfcf,{edges:false,small:true});
  P.box(.9,.06,.4,.0,.75,z+1.65,0x8a6a42,{edges:false,small:true});
  // komin + antena
  P.box(.55,1.7,.55,2.5,wh+.5+.9,0,0xa8503a);P.box(.7,.1,.7,2.5,wh+.5+2.5,0,0x6a6460,{edges:false,small:true});
  P.cyl(.015,.015,1.6,2.5,wh+.5+2.6,0,0x8a8a8a,{seg:4,edges:false,small:true});
  for(let i=0;i<3;i++)P.box(.9-i*.2,.015,.015,2.5,wh+.5+3.0+i*.35,0,0x8a8a8a,{ry:.6,edges:false,small:true});
  for(const sx of [-1,1])P.cyl(.04,.04,3.0,sx*(W/2-.05),.5,z+.05,0xb8b2a6,{seg:5,edges:false,small:true});
  P.col(-W/2-.1,W/2+.1,-D/2-.1,D/2+.1,wh+.5);P.col(-1.6,1.6,D/2+.1,D/2+2.1,.9);
});

/* ============================ KAPLICZKA / KRZYŻ ============================ */
defProp('kapliczka',{name:'Kapliczka przydrożna',cat:'wies',dims:[1.2,3.2,1.2],cover:true,variants:['slupowa','krzyz'],
  note:'Kapliczka słupowa z figurką i zniczami albo krzyż drewniany z daszkiem i ogrodzeniem.'},(P,o,r)=>{
  const v=o.variant||r.pick(['slupowa','krzyz']);
  if(v==='slupowa'){
    const c=r.pick([0xc9c2b0,0xb8b4a6,0xd8d0b8]);
    P.box(1.1,.25,1.1,0,0,0,0x8a8a84);P.box(.75,1.2,.75,0,.25,0,c);P.box(.9,.1,.9,0,1.45,0,shade(c,.85),{edges:false});
    P.box(.7,.9,.7,0,1.55,0,c);P.box(.5,.65,.04,0,1.7,.33,0x2a3a5a,{edges:false});  // wnęka
    P.cyl(.06,.1,.4,0,1.72,.31,0xe8e4e0,{seg:6,edges:false,small:true});P.sph(.05,0,2.15,.31,0xe8c8a8,{ws:5,hs:4,hull:0});
    P.cyl(0,.14,.28,0,1.72,.31,0x3a5aa8,{seg:6,edges:false,small:true});
    P.add(new THREE.BoxGeometry(.5,.6,.04),0,1.7+.3,.36,0x8ab0c0,{...BASIC});
    P.prism([[-.5,0],[.5,0],[0,.55]],.8,0,2.45,-.4,0x6a4a3a);
    P.box(.05,.4,.05,0,3.0,0,0xcaa23a,{edges:false});P.box(.22,.05,.05,0,3.2,0,0xcaa23a,{edges:false});
    for(let i=0;i<3;i++)P.cyl(.04,.04,.12,-.25+i*.25,.32,.5,[0xe02a1a,0xe8e2d0,0xe02a1a][i],{seg:5,edges:false,small:true});
    P.box(.1,.1,.1,.0,.45,.52,0xff9a2a,{...BASIC});
    for(let i=0;i<6;i++)P.box(.08,.08,.08,r.range(-.3,.3),.27,.48+r()*.15,r.pick([0xf06aa8,0xf8f0e0,0xffd23a,0xe0392b]),{edges:false,small:true});
    P.colBox(1.1,1.1,3.1);
  }else{
    const w=r.pick([0x5a3e22,0x6a4a2a]);
    P.box(.18,3.2,.18,0,0,0,w);P.box(1.1,.16,.16,0,2.2,0,w);P.box(.7,.08,.05,0,2.35,.1,shade(w,1.2),{edges:false,small:true});
    P.prism([[-.7,0],[.7,0],[0,.45]],.5,0,3.2,-.25,0x6a3a2a);
    P.box(.12,.62,.05,0,1.55,.1,0xd8d0b8,{edges:false,small:true});P.box(.45,.08,.05,0,1.95,.1,0xd8d0b8,{edges:false,small:true}); // postać
    for(const [x,z] of [[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]])P.box(.08,.5,.08,x,0,z,0xe8e4d8,{small:true});
    for(const z of [-.6,.6])P.box(1.2,.05,.05,0,.38,z,0xe8e4d8,{edges:false,small:true});
    for(const x of [-.6,.6])P.box(.05,.05,1.2,x,.38,0,0xe8e4d8,{edges:false,small:true});
    P.box(.12,.12,.12,0,.2,.1,0xe02a1a,{...BASIC});
    P.colBox(1.3,1.3,3.2);
  }
});

/* ============================ PŁOT ============================ */
const siatkaTex=()=>atlas('wies:siatka',128,128,(g,w,h)=>{g.strokeStyle='#8a8f92';g.lineWidth=2;for(let i=-h;i<w+h;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i+h,h);g.stroke();g.beginPath();g.moveTo(i,h);g.lineTo(i+h,0);g.stroke()}});
defProp('plotWiejski',{name:'Płot wiejski',cat:'wies',dims:[3,1.4,.12],cover:false,variants:['sztachety','siatka','zerdzie'],defaults:{len:3},
  note:'opts.len = długość (m). Sztachety 1,1 m, siatka na słupkach 1,5 m, żerdzie. Do rzędów użyj DS.props.instance.'},(P,o,r)=>{
  const v=o.variant||r.pick(['sztachety','siatka','zerdzie']),L=o.len||3;
  if(v==='sztachety'){
    const c=r.pick([0xe8e0c8,0x8a6a42,0x6a8a4a,0xd8d8d0]);
    for(const x of [-L/2+.05,L/2-.05])P.box(.1,1.25,.1,x,0,0,shade(c,.8),{edges:false});
    for(const y of [.25,.8])P.box(L,.06,.05,0,y,-.06,shade(c,.7),{edges:false,small:true});
    const n=Math.floor(L/.14);for(let i=0;i<n;i++){const x=-L/2+.15+i*(L-.3)/(n-1),h=1.0+(r()<.1?-.12:0);P.box(.09,h,.025,x,.06,0,c,{edges:false});}
  }else if(v==='siatka'){
    const t=siatkaTex();
    for(const x of [-L/2+.04,L/2-.04])P.cyl(.035,.035,1.5,x,0,0,0x6a6a68,{seg:5,edges:false});
    P.box(L,.04,.04,0,1.45,0,0x6a6a68,{edges:false,small:true});P.box(L,.03,.03,0,.1,0,0x6a6a68,{edges:false,small:true});
    for(const sg of [-1,1])P.decal(t,L-.1,1.3,0,.15+.65,sg*.015,{ry:sg>0?0:PI});
  }else{
    for(const x of [-L/2+.06,0,L/2-.06])P.cyl(.06,.07,1.3,x,0,0,0x6a5a46,{seg:5,edges:false});
    for(const y of [.35,.7,1.05])P.cylc(.04,.04,L,0,y,.07,0x8a7a62,{seg:5,rz:PI/2,edges:false});
  }
  P.col(-L/2,L/2,-.07,.07,1.3);
});

/* ============================ BRAMA WJAZDOWA ============================ */
defProp('bramaWjazdowa',{name:'Brama wjazdowa',cat:'wies',dims:[5.0,2.2,.5],cover:false,variants:['zamknieta','otwarta'],
  note:'Dwa słupki z cegły + dwuskrzydłowa brama z kształtownika, 4 m światła.'},(P,o,r)=>{
  const v=o.variant||r.pick(['zamknieta','otwarta']),col=r.pick([0x2d6a3a,0x7a3a2a,0x3a4a6a]),open=v==='otwarta';
  for(const sx of [-1,1]){P.box(.45,2.1,.45,sx*2.2,0,0,0xa8503a);P.box(.6,.1,.6,sx*2.2,2.1,0,0x8a8680,{edges:false})}
  for(const sx of [-1,1]){
    const hx=sx*1.98,ph=open?1.15:0,dx=-sx*Math.cos(ph),dz=Math.sin(ph),ry=Math.atan2(-dz,dx),pt=u=>[hx+dx*u,dz*u];
    let [x,z]=pt(.975);P.box(1.95,.06,.06,x,.25,z,col,{ry,edges:false});P.box(1.95,.06,.06,x,1.55,z,col,{ry,edges:false});
    P.box(1.9,.04,.04,x,.95,z,col,{ry,edges:false,small:true});
    for(const u of [.03,1.92]){[x,z]=pt(u);P.box(.06,1.42,.06,x,.2,z,col,{ry,edges:false,small:true})}
    for(let i=1;i<8;i++){[x,z]=pt(i*.24);P.box(.03,1.3,.03,x,.25,z,col,{ry,edges:false,small:true})}
  }  P.col(-2.43,-1.97,-.23,.23,2.1);P.col(1.97,2.43,-.23,.23,2.1);
  if(!open)P.col(-1.97,1.97,-.05,.05,1.6);
});

/* ============================ STUDNIA Z ŻURAWIEM ============================ */
defProp('studniaZuraw',{name:'Studnia z żurawiem',cat:'wies',dims:[5.0,4.6,1.4],cover:false,
  note:'Cembrowina z kręgów betonowych ø1,0 m, żuraw 4,6 m z przeciwwagą i wiadrem.'},(P,o,r)=>{
  const wood=r.pick([0x6a4a2a,0x5a3e22]);
  P.cyl(.55,.55,.55,0,0,0,0x9a968c,{seg:12});P.cyl(.55,.55,.55,0,.55,0,0xa8a49a,{seg:12});P.cyl(.6,.6,.08,0,1.1,0,0x8a867c,{edges:false,seg:12});
  P.cyl(.38,.38,.02,0,1.17,0,0x0a0a0a,{seg:12,edges:false,small:true});
  for(const sx of [-1,1])P.box(.14,3.6,.14,.8,0,sx*.35,wood,{rx:sx*.12,edges:false});
  const a=.28;P.box(5.2,.14,.14,.2,3.6,0,wood,{rz:a});   // belka
  P.box(.4,.4,.4,2.7,2.65,0,0x6a6a64,{small:true});     // przeciwwaga (kamień)
  P.cyl(.012,.012,2.6,-2.1,1.25,0,0x2a2218,{seg:4,edges:false,small:true});
  P.cyl(.14,.17,.28,-2.1,1.0,0,0x6a4a2a,{seg:8,edges:false,small:true});
  P.col(-.62,.62,-.62,.62,1.15);P.col(.65,.95,-.5,.5,3.7);
});

/* ============================ TRAKTORY URSUS ============================ */
const OUT={hull:.02};
function tractor(P,o,r,v){
  const c60=v!=='c330',cab=v==='c360kabina';
  const S=c60?{zf:-1.15,zr:.97,Rr:.70,Rf:.38,fr:-1.78,rr:1.79,wr:.4,tx:.7}:{zf:-1.0,zr:.8,Rr:.62,Rf:.34,fr:-1.55,rr:1.52,wr:.36,tx:.66};
  const body=o.color!=null?o.color:(c60?r.pick([0xc8441e,0xb8301f,0xd45a1e]):r.pick([0xb8301f,0x9a2a1a,0xc23a22]));
  const dark=0x2a2a2e,rim=r.pick([0xe8c030,0xb8301f,0x8a8a8a]);
  const {zf,zr,Rr,Rf}=S,hz0=S.fr+.12,hz1=zf+.9,hl=hz1-hz0,hm=(hz0+hz1)/2;
  for(const sg of [-1,1]){wheel(P,sg*S.tx,Rr,zr,Rr,S.wr,rim,12);wheel(P,sg*.66,Rf,zf,Rf,.17,rim,8)}
  P.cylc(.09,.09,1.4,0,Rr,zr,dark,{seg:8,rz:PI/2,edges:false,small:true});P.cylc(.06,.06,1.3,0,Rf,zf,dark,{seg:6,rz:PI/2,edges:false,small:true});
  P.box(.5,.22,zr-zf+.9,0,Rf*.9,(zr+zf)/2-.15,dark,{edges:false});                 // podłużnice
  P.box(.64,.52,hl,0,.6,hm,body);P.box(.5,.08,hl-.1,0,1.12,hm,shade(body,.85),{edges:false});   // maska
  P.box(.5,.4,.05,0,.7,hz0-.02,0x3a3a3e,{edges:false});                                 // atrapa
  for(let i=0;i<4;i++)P.box(.5,.025,.04,0,.55+i*.1,hz0-.05,0x9a9a9a,{edges:false,small:true});
  P.box(.9,.14,.1,0,.42,S.fr+.05,dark,{edges:false,small:true});
  for(const sg of [-1,1])P.sph(.07,sg*.27,.98,hz0-.03,0xfff4c0,{ws:6,hs:4,hull:0,...BASIC});
  P.box(.56,.55,zr-hz1+.4,0,.5,(hz1+zr+.4)/2,shade(body,.8));                           // obudowa skrzyni
  P.box(.5,.26,.5,0,1.12,hz1-.28,body,{edges:false});                                 // zbiornik
  for(const sg of [-1,1]){P.box(.52,.05,1.1,sg*S.tx,2*Rr+.04,zr,body,{edges:false});P.box(.05,.2,1.1,sg*(S.tx+.25),2*Rr-.1,zr,body,{edges:false,small:true})}
  P.box(.4,.08,.42,0,1.18,zr-.12,0x2a2a2a);P.box(.38,.34,.06,0,1.26,zr+.12,0x2a2a2a,{edges:false});P.cyl(.03,.03,.08,0,1.1,zr-.12,0x8a8a8a,{seg:5,edges:false,small:true});
  P.cylc(.02,.02,.55,0,1.2,zr-.78,dark,{seg:5,rx:.57,edges:false,small:true});
  P.add(new THREE.TorusGeometry(.19,.02,4,12),0,1.46,zr-.65,dark,{rx:-1.0,edges:false,small:true});
  P.cyl(.035,.035,1.0,.2,1.1,hz0+.5,0x4a4036,{seg:6,edges:false});P.cyl(.06,.035,.05,.2,2.1,hz0+.5,0x2a2a2a,{seg:6,edges:false,small:true});
  P.cyl(.09,.09,.32,-.2,1.12,hz0+.55,0x8a8a8a,{seg:8,edges:false,small:true});
  P.box(.14,.1,.7,0,.45,S.rr-.2,dark,{edges:false,small:true});
  for(const sg of [-1,1])P.cylc(.015,.015,.8,sg*.25,.55,S.rr-.45,0x555555,{seg:4,rx:PI/2-.15,edges:false,small:true});
  const ud=atlas('wies:ursus',128,32,(g,w,h)=>{g.fillStyle='#f4efe0';g.font='bold 24px Impact, Arial, sans-serif';g.textAlign='center';g.fillText('URSUS',w/2,26)});
  for(const sg of [-1,1])P.decal(ud,.5,.12,sg*.325,.9,hm,{ry:sg*PI/2});
  let h=1.5;
  if(cab){
    h=2.5;P.cover=true;
    for(const sx of [-1,1])for(const sz of [-1,1])P.box(.06,1.25,.06,sx*.52,1.15,zr+sz*.45-.1,dark,{edges:false,small:true});
    P.box(1.2,.07,1.15,0,2.4,zr-.1,shade(body,.7));
    for(const sg of [-1,1])P.box(.02,.95,.8,sg*.53,1.3,zr-.1,0x6a8a96,{...BASIC});
    P.box(1.0,.9,.02,0,1.3,zr+.46,0x6a8a96,{...BASIC});P.box(1.0,.9,.02,0,1.3,zr-.66,0x6a8a96,{...BASIC});
  }
  P.colBox(1.9,Math.abs(S.fr)+S.rr,h,0,(S.fr+S.rr)/2);
}
defProp('ursus',{name:'Ciągnik Ursus',cat:'wies',dims:[1.9,2.2,3.6],dimsV:{c330:[1.78,2.1,3.1],c360:[1.9,2.2,3.6],c360kabina:[1.9,2.5,3.6]},cover:false,variants:['c330','c360','c360kabina'],
  note:'C-330 (3,1 m), C-360 (3,57 x 1,8 m, rozstaw 2,12 m), C-360 z ROPS-kabiną (osłona). Przód w -Z.'},(P,o,r)=>{tractor(P,o,r,o.variant||r.pick(['c330','c360','c360kabina']))});

/* ============================ PRZYCZEPA ============================ */
defProp('przyczepa',{name:'Przyczepa rolnicza',cat:'wies',dims:[2.5,1.7,6.3],dimsV:{pusta:[2.5,1.7,6.3],siano:[2.5,3.0,6.5]},cover:false,variants:['pusta','siano'],
  note:'Jednoosiowa przyczepa ok. 4,2 x 2,1 m z dyszlem, burty 0,7 m. Wariant z sianem = osłona.'},(P,o,r)=>{
  const v=o.variant||r.pick(['pusta','siano']),col=r.pick([0x2f6a3a,0x9a2a1a,0x3a4a6a]),L=4.2,W=2.1;
  P.box(W,.1,L,0,.78,.3,0x4a4a48);
  P.box(W-.1,.04,L-.05,0,.88,.3,0x8a6a42,{edges:false,small:true});
  for(const sg of [-1,1]){P.box(.07,.65,L,sg*(W/2-.03),.9,.3,col);P.box(.07,.15,L+.04,sg*(W/2-.03),1.55,.3,shade(col,.8),{edges:false})}
  P.box(W,.65,.07,0,.9,.3-L/2+.03,col);P.box(W,.65,.07,0,.9,.3+L/2-.03,col);
  P.cylc(.06,.06,2.3,0,.5,.55,DARK,{seg:6,rz:PI/2,edges:false,small:true});
  for(const sg of [-1,1])wheel(P,sg*1.05,.5,.55,.5,.28,0x8a8a8a,8);
  P.box(.12,.12,1.9,0,.7,-L/2-.7,DARK,{rx:.05});P.box(.09,.5,.09,0,.4,-L/2-.3,DARK,{edges:false,small:true}); // dyszel + podpórka
  P.cyl(.12,.12,.08,0,.62,-L/2-1.62,0x6a6a6a,{seg:8,edges:false,small:true});
  P.box(.22,.1,.04,-.8,.95,.3+L/2+.04,0xc42018,{...BASIC});P.box(.22,.1,.04,.8,.95,.3+L/2+.04,0xc42018,{...BASIC});
  let h=1.0;
  if(v==='siano'){
    P.cover=true;h=3.2;
    for(let i=0;i<6;i++){const z=-1.6+i*.65+.3;P.ico(1.0,r.range(-.1,.1),1.9+r()*.3,z,mixc(0xc9a83a,0xa8882a,r()),{detail:0,sx:1.05,sy:.9,sz:.85})}
    P.box(1.9,.9,3.8,0,1.2,.3,0xb89a32,{edges:false});
  }
  P.colBox(W+.1,L+.2,h,0,.3);
});

/* ============================ KOMBAJN BIZON ============================ */
defProp('kombajnBizon',{name:'Kombajn Bizon Z056',cat:'wies',dims:[4.5,4,10.2],cover:true,
  note:'Heder 4,2 m z motowidłem, kabina, zbiornik na ziarno z rurą wyładowczą. Przód w -Z.'},(P,o,r)=>{
  const body=o.color!=null?o.color:r.pick([0xb8301f,0xa8281a]),gr=0x4a4a50,wh=0xd8d4c8,glass=0x6a8a96;
  // heder
  P.box(4.2,.12,1.4,0,.52,-3.95,gr);P.box(4.2,.9,.1,0,.52,-3.3,gr);
  for(const sg of [-1,1]){P.box(.1,.9,1.4,sg*2.1,.52,-3.95,shade(body,.9));P.cyl(0,.14,1.0,sg*2.12,.55,-4.9,0xe0e0d8,{seg:4,rx:-PI/2,edges:false,small:true})}
  P.box(4.2,.04,.14,0,.5,-4.6,0xd8c060,{edges:false,small:true});
  for(let i=0;i<5;i++){const a=i/5*PI*2;P.box(4.0,.06,.16,0,1.7+Math.cos(a)*.55,-4.0+Math.sin(a)*.55,0xe8c020,{rx:a,edges:false,small:true})}
  P.cylc(.07,.07,4.1,0,1.7,-4.0,0x6a6a6a,{seg:6,rz:PI/2,edges:false,small:true});
  for(const sg of [-1,1])P.box(.06,.08,1.5,sg*2.0,1.65,-3.7,gr,{rx:.12,edges:false,small:true});
  P.box(1.7,1.0,1.6,0,.7,-2.7,body,{rx:.1});                                    // podajnik
  // korpus
  P.box(2.8,1.7,3.6,0,1.0,-.2,body);P.box(2.5,.4,3.4,0,2.7,-.2,shade(body,.8),{edges:false});
  P.box(2.6,1.4,2.7,0,1.8,2.9,body);P.box(2.2,.5,2.4,0,3.2,2.9,shade(body,.8));
  P.box(2.8,.9,2.2,0,.95,3.3,gr);
  // kabina
  P.box(1.7,1.55,1.7,0,2.3,-1.9,wh);P.box(1.78,1.0,1.75,0,2.6,-1.9,glass,{...BASIC});P.box(1.9,.1,1.9,0,3.85,-1.9,shade(wh,.8));
  for(const sx of [-1,1])for(const sz of [-1,1])P.box(.08,1.0,.08,sx*.85,2.6,-1.9+sz*.85,wh,{edges:false,small:true});
  // zbiornik ziarna + rura wyładowcza
  P.box(2.4,.7,2.0,0,3.0,.5,shade(body,.9));
  P.cylc(.15,.15,3.4,1.0,3.75,.5,gr,{seg:8,rx:PI/2,edges:false});
  P.cylc(.15,.15,2.0,-.5,3.7,2.7,gr,{seg:8,rx:PI/2,ry:.3,edges:false,small:true});
  P.cyl(.07,.07,.9,.6,2.6,3.4,0x3a3a3a,{seg:6,edges:false,small:true});P.cyl(.09,.07,.1,.6,3.5,3.4,0x2a2a2a,{seg:6,edges:false,small:true});
  P.box(2.7,.1,.5,0,1.9,4.5,gr,{edges:false,small:true});
  // koła: duże przednie (napędowe), małe tylne (skrętne)
  for(const sg of [-1,1]){wheel(P,sg*1.35,.85,-1.4,.85,.6,0xb8301f,14);wheel(P,sg*1.1,.55,3.7,.55,.36,0xb8301f,10)}
  P.cylc(.12,.12,2.8,0,.85,-1.4,DARK,{seg:8,rz:PI/2,edges:false,small:true});
  for(const sx of [-.6,.6])P.sph(.1,sx,1.2,-4.62,0xfff4c0,{ws:5,hs:4,hull:0,...BASIC});
  P.col(-1.9,1.9,-3.0,4.6,3.8);P.col(-2.15,2.15,-5.0,-3.0,1.6);
});

/* ============================ SIANO ============================ */
defProp('belaOkragla',{name:'Bela okrągła',cat:'wies',dims:[1.25,1.5,1.5],cover:false,variants:['siano','folia','slama'],defaults:{},
  note:'ø1,5 m x 1,2 m, leży na boku. Folia = zielona/biała owijarka.'},(P,o,r)=>{
  const v=o.variant||r.pick(['siano','folia','slama']),c=v==='siano'?mixc(0xb89a3a,0x9a8830,r()):v==='slama'?0xd8c070:r.pick([0xe8eee8,0x3a5a3a]);
  P.cylc(.75,.75,1.2,0,.75,0,c,{seg:14,rz:PI/2,hull:.03});
  if(v==='siano'||v==='slama')for(let i=0;i<4;i++)P.cylc(.755,.755,.02,-.45+i*.3,.75,0,0x8a6a3a,{seg:14,rz:PI/2,edges:false,small:true});
  else for(let i=0;i<3;i++)P.cylc(.752,.752,.12,-.4+i*.4,.75,0,shade(c,.88),{seg:14,rz:PI/2,edges:false,small:true});
  P.colBox(1.5,1.2,1.5);
});
defProp('belaKostka',{name:'Bele - kostki',cat:'wies',dims:[1.9,1.9,1.1],cover:true,variants:['stos','pojedyncza'],
  note:'Kostka 0,9 x 0,5 x 0,45 m; stos 4 warstwy = osłona 1,8 m.'},(P,o,r)=>{
  const v=o.variant||r.pick(['stos','pojedyncza']);
  const bale=(x,y,z,ry)=>{P.box(.9,.45,.5,x,y,z,mixc(0xc9a83a,0xa8882a,r()),{ry,edges:false});for(const t of [-.15,.15])P.box(.92,.46,.02,x,y,z+t*.7,0x6a5a2a,{ry,edges:false,small:true})};
  if(v==='stos'){
    for(let l=0;l<4;l++){const sh=l%2?.2:0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)bale(-.45+i*.9+sh,l*.45,-.27+j*.54,0)}
    P.colBox(1.9,1.1,1.8);
  }else{bale(0,0,0,0);bale(.1,.45,0,.15);P.colBox(1.0,.6,.9)}
});
defProp('stogSiana',{name:'Stóg siana',cat:'wies',dims:[3.6,4.2,3.6],cover:true,
  note:'Kopiec ø3,5 m na paliku, h 3,8 m; kolce kolczastej siatki z drągów.'},(P,o,r)=>{
  P.cyl(.06,.06,4.2,0,0,0,0x6a5238,{seg:5,edges:false});
  const prof=[[1.7,0],[1.75,.5],[1.55,1.5],[1.2,2.5],[.5,3.3],[0,3.7]];
  P.lathe(prof,10,0,0,0,mixc(0xc9a83a,0xa8882a,r()),{hull:.02});
  for(let i=0;i<5;i++)P.box(.05,.05,.9,r.range(-.8,.8),r.range(.8,1.8),1.5,0xe0c868,{rx:r.range(-.4,.4),ry:r()*3,edges:false,small:true});
  P.colBox(2.9,2.9,3.6);
});
defProp('kopaSnopkow',{name:'Snopki w kopie',cat:'wies',dims:[1.1,1.4,1.1],cover:false,
  note:'Kopa 6 snopków oparta o siebie, związana powrósłem.'},(P,o,r)=>{
  const c=mixc(0xd8b84a,0xb8982a,r()*.6);
  for(let i=0;i<6;i++){const a=i/6*PI*2;P.cyl(.04,.1,1.3,Math.cos(a)*.18,0,Math.sin(a)*.18,mixc(c,0xe8d070,r()*.4),{seg:6,rx:Math.sin(a)*.12,rz:-Math.cos(a)*.12,edges:false})}
  P.cyl(.2,.2,.14,0,.8,0,0x7a5a2a,{seg:6,edges:false,small:true});
  P.cyl(0,.3,.35,0,1.2,0,c,{seg:6,edges:false});
  P.colBox(.7,.7,1.3);
});

/* ============================ STRACH NA WRÓBLE ============================ */
defProp('strachNaWrobel',{name:'Strach na wróble',cat:'wies',dims:[1.6,2.1,.4],cover:false,
  note:'Krzyż z żerdzi, stary płaszcz, słomiana głowa, kapelusz i wrona.'},(P,o,r)=>{
  const cl=r.pick([0x6a4a3a,0x3a4a6a,0x7a2a2a]);
  P.box(.07,2.0,.07,0,0,0,0x6a5238,{edges:false});P.box(1.5,.07,.07,0,1.35,0,0x6a5238,{edges:false});
  P.box(.5,.8,.22,0,.7,0,cl);for(const sg of [-1,1]){P.box(.3,.5,.1,sg*.55,.9,0,cl,{rz:-sg*.5,edges:false,small:true});P.box(.12,.2,.1,sg*.8,1.3,0,0xd8c070,{edges:false,small:true})}
  P.sph(.17,0,1.82,0,0xe0c070,{ws:6,hs:5});P.cyl(.28,.28,.03,0,1.95,0,0x2a2a2a,{seg:8,edges:false,small:true});P.cyl(.12,.13,.14,0,1.97,0,0x2a2a2a,{seg:8,edges:false,small:true});
  P.sph(.07,.75,1.5,0,0x151515,{sx:1.6,ws:5,hs:4,hull:0});
  P.colBox(.3,.3,2.0);
});

/* ============================ POLE ============================ */
defProp('poleZboza',{name:'Pole zboża / kukurydzy',cat:'wies',dims:[8,1.1,8],dimsV:{zboze:[8,1.1,8],kukurydza:[8,2.5,8]},cover:false,variants:['zboze','kukurydza'],defaults:{w:8,d:8},
  note:'Rzędy ułożone wzdłuż Z. opts.w/d = rozmiar płata. Kukurydza ma osłonę (rzędy kolidujące).'},(P,o,r)=>{
  const v=o.variant||r.pick(['zboze','kukurydza']),W=o.w||8,D=o.d||8;
  if(v==='zboze'){
    const sp=.5,n=Math.floor(W/sp),c=mixc(0xd8b84a,0xc8a838,r()*.8);
    for(let i=0;i<n;i++){const x=-W/2+sp/2+i*sp,h=.85+r()*.2;P.box(.34,h,D,x,0,0,mixc(c,0xb89a30,r()*.6),{edges:false});P.box(.36,.2,D*.98,x,h-.04,0,mixc(c,0xf0d870,r()*.5),{edges:false,small:true})}
  }else{
    P.cover=true;const sp=.8,n=Math.floor(W/sp),c=0x4f8a3a;
    for(let i=0;i<n;i++){const x=-W/2+sp/2+i*sp,h=2.1+r()*.3;
      P.box(.2,h,D,x,0,0,mixc(c,0x2f6a2a,r()*.6),{edges:false});P.box(.5,.04,D,x,h*.55,0,mixc(c,0x3f7a35,r()*.5),{rz:.5,edges:false,small:true});P.box(.5,.04,D,x,h*.7,0,mixc(c,0x3f7a35,r()*.5),{rz:-.5,edges:false,small:true});
      P.box(.22,.35,D*.98,x,h-.05,0,0xd8c070,{edges:false,small:true});
      P.col(x-.15,x+.15,-D/2,D/2,h);
    }
  }
});
defProp('rzadZboza',{name:'Rząd zboża (instancing)',cat:'wies',dims:[1.5,1.1,.4],cover:false,
  note:'Segment rzędu 1,5 m do DS.props.instance(\'rzadZboza\',[...]); ~50 tri.'},(P,o,r)=>{
  const c=mixc(0xd8b84a,0xc8a838,r()*.8);
  P.box(1.5,.8,.34,0,0,0,c,{edges:false});P.box(1.52,.22,.36,0,.8,0,0xe8cc5a,{edges:false});
  for(let i=0;i<3;i++)P.box(.04,.18,.04,-.5+i*.5,1.0,0,0xf0d870,{rz:.2,edges:false,small:true});
});

/* ============================ AMBONA ============================ */
defProp('ambona',{name:'Ambona myśliwska',cat:'wies',dims:[1.9,4.2,2.3],cover:true,
  note:'Kabina 1,3 x 1,3 m na 2,2 m palach, drabina, daszek, otwory strzelnicze.'},(P,o,r)=>{
  const wood=r.pick([0x6a4a2a,0x5a4a32,0x7a5a38]);
  for(const [x,z] of [[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]])P.cyl(.07,.09,2.3,x,0,z,wood,{seg:5,edges:false});
  P.box(.06,.06,1.5,-.6,1.0,0,shade(wood,.7),{rx:0,edges:false,small:true});
  P.box(1.5,.1,1.5,0,2.2,0,wood);
  for(const [w,d,x,z] of [[1.4,.06,0,-.68],[.06,1.4,-.68,0],[.06,1.4,.68,0]])P.box(w,1.0,d,x,2.3,z,wood);
  P.box(1.4,.5,.06,0,2.3,.68,wood);P.box(1.4,.06,.06,0,2.78,.68,shade(wood,.8),{edges:false});
  for(const sx of [-1,1])P.box(.1,.5,.1,sx*.7,2.82,.68,wood,{edges:false,small:true});
  P.box(1.7,.07,1.8,0,3.4,0,0x4a4a46,{rx:.1});
  for(const sg of [-1,1])P.box(.06,1.1,.08,sg*.2-.0,2.3,2.0,wood,{edges:false,small:true,rx:.4*0});
  P.box(.06,2.5,.06,.15,.0,1.1,shade(wood,.8),{rx:-.5,edges:false});P.box(.06,2.5,.06,-.15,.0,1.1,shade(wood,.8),{rx:-.5,edges:false});
  for(let i=0;i<6;i++)P.box(.4,.04,.05,0,.3+i*.33,1.05-i*.17*.4,wood,{edges:false,small:true});
  P.col(-.8,.8,-.8,.8,3.45);P.col(-.4,.4,.8,1.9,.6);
});

/* ============================ OGNISKO + PIEŃKI ============================ */
defProp('ognisko',{name:'Ognisko z ławkami z pni',cat:'wies',dims:[3.2,.9,3.2],cover:false,
  note:'Krąg z kamieni, polana, płomień z MeshBasic (emisja), 4 pnie do siedzenia.'},(P,o,r)=>{
  for(let i=0;i<9;i++){const a=i/9*PI*2;P.ico(.17,Math.cos(a)*.62,.12,Math.sin(a)*.62,r.pick([0x7a7a74,0x8a8a84,0x6a6a64]),{detail:0,sy:.7,ry:r()*3,hull:.04})}
  P.cyl(.55,.6,.04,0,0,0,0x1c1814,{seg:10,edges:false,small:true});
  for(let i=0;i<4;i++){const a=i/4*PI*2+.4;P.cylc(.06,.07,.9,Math.cos(a)*.15,.22,Math.sin(a)*.15,0x4a3624,{seg:5,rz:PI/2-.5,ry:a,edges:false})}
  P.cyl(0,.28,.7,0,.15,0,0xff7a1a,{seg:5,ry:.3,...BASIC});P.cyl(0,.17,.55,.04,.2,.03,0xffd24a,{seg:5,ry:.9,...BASIC});P.cyl(0,.09,.7,-.12,.15,0,0xff4a10,{seg:5,...BASIC});
  for(let i=0;i<4;i++){const a=i/4*PI*2+.8,x=Math.cos(a)*1.8,z=Math.sin(a)*1.8;P.cylc(.26,.28,.45,x,.22,z,0x6a4e34,{seg:8,edges:false});P.cyl(.2,.21,.03,x,.45,z,0xb89a6a,{seg:8,edges:false,small:true})}
  P.col(-.7,.7,-.7,.7,.3);
});
defProp('stosDrewna',{name:'Stos drewna',cat:'wies',dims:[2.4,1.6,1.3],cover:false,
  note:'Kloce 1,0 m ułożone w stos 2,2 x 1,5 m między czterema palikami; kilka kloców na wierzchu.'},(P,o,r)=>{
  const cols=[0x7a5a3a,0x8a6a44,0x6a4e30,0xa08050];
  for(let j=0;j<4;j++)for(let i=0;i<6;i++){const x=-.85+i*.34+(j%2?.17:0);P.cylc(.16,.16,1.0,x,.16+j*.3,0,cols[(i+j)%4],{seg:5,rx:PI/2,edges:false})}
  for(const sx of [-1,1])for(const sz of [-.55,.55])P.cyl(.05,.05,1.6,sx*1.2,0,sz,0x4a3a2a,{seg:4,edges:false,small:true});
  P.col(-1.2,1.2,-.6,.6,1.3);
});
defProp('pieniekZSiekiera',{name:'Pieniek z siekierą',cat:'wies',dims:[1.5,1.0,1.0],cover:false,
  note:'Kłoda do rąbania ø0,4 m z siekierą wbitą w górę, rozłupane polana obok.'},(P,o,r)=>{
  P.cyl(.2,.23,.55,0,0,0,0x7a5a3a,{seg:8,hull:.03});P.cyl(.19,.19,.02,0,.55,0,0xc4a070,{seg:8,edges:false,small:true});
  P.box(.04,.7,.04,.0,.5,.0,0x8a6a3a,{rx:.0,rz:.5,edges:false,small:true});P.box(.18,.14,.03,-.15,1.0,0,0x6a6e72,{rz:.5,edges:false,small:true});
  for(let i=0;i<4;i++)P.box(.12,.1,.4,.5+i*.14,0,.1,mixc(0xa08050,0x7a5a3a,r()),{ry:r()*.6-.3,rz:r()*.3,edges:false,small:true});
  P.cyl(.1,.1,.3,-.5,0,.3,0x8a6a44,{seg:6,edges:false,small:true});
  P.col(-.3,.3,-.3,.3,.55);
});

/* ============================ PRZYSTANEK PKS ============================ */
defProp('przystanekPKS',{name:'Przystanek PKS (betonowy)',cat:'wies',dims:[4.4,3.2,1.9],cover:true,
  note:'Betonowa wiata 3,4 x 1,6 m z ławką, tablicą PKS na słupku, graffiti i rozkładem jazdy.'},(P,o,r)=>{
  const c=r.pick([0xa8a49a,0x9a968c,0xb4b0a4]);
  const pks=atlas('wies:pks',128,128,(g,w,h)=>{g.fillStyle='#1e4a9a';g.fillRect(0,0,w,h);g.fillStyle='#f4f0e0';g.font='bold 52px Arial, sans-serif';g.textAlign='center';g.fillText('PKS',w/2,70);g.font='bold 18px Arial, sans-serif';g.fillText('PRZYSTANEK',w/2,100);g.strokeStyle='#f4f0e0';g.lineWidth=4;g.strokeRect(4,4,w-8,h-8)});
  const rozk=atlas('wies:rozklad',128,160,(g,w,h)=>{g.fillStyle='#f0ecd8';g.fillRect(0,0,w,h);g.fillStyle='#222';g.font='bold 12px Arial';g.fillText('ROZKŁAD JAZDY',10,18);for(let i=0;i<10;i++){g.fillRect(10,28+i*13,50,2);g.fillRect(70,28+i*13,40,2)}});
  const graf=atlas('wies:graf',160,80,(g,w,h)=>{g.font='bold 40px Bangers, Impact, sans-serif';g.fillStyle='#e02a8a';g.fillText('WIEŚ',8,40);g.fillStyle='#2ad0e0';g.fillText('POWER',20,74);g.strokeStyle='#111';g.lineWidth=2;g.strokeText('WIEŚ',8,40)});
  P.box(3.4,2.3,.16,0,0,-.7,c);for(const sx of [-1,1])P.box(.16,2.3,1.56,sx*1.62,0,.1,c);
  P.box(3.8,.2,1.9,0,2.3,0,shade(c,1.08),{rx:-.04});
  P.box(2.9,.06,.4,0,.45,-.45,0x8a6a42);for(const sx of [-1,1])P.box(.08,.45,.35,sx*1.3,0,-.45,0x4a4a48,{edges:false,small:true});
  P.cyl(.04,.04,3.2,2.2,0,.5,0x6a6a6a,{seg:6,edges:false});P.decal(pks,.6,.6,2.2,2.9,.55);P.decal(pks,.6,.6,2.2,2.9,.45,{ry:PI});
  P.decal(rozk,.5,.6,-.9,1.0,-.61);
  P.decal(graf,1.2,.6,1.74,1.3,.3,{ry:PI/2});P.decal(graf,1.0,.5,-1.72,1.0,-.1,{ry:-PI/2});
  P.col(-1.7,1.7,-.78,-.62,2.4);P.col(-1.7,-1.54,-.62,.88,2.4);P.col(1.54,1.7,-.62,.88,2.4);
});

/* ============================ DROBNICA ============================ */
defProp('rampaMleczna',{name:'Rampa mleczna z bańkami',cat:'wies',dims:[1.4,1.1,1.0],cover:false,
  note:'Drewniana platforma 1,2 x 0,9 m na słupkach, 5 bańek 40 l (ø0,33 x 0,65 m).'},(P,o,r)=>{
  const wood=0x7a5a3a;
  for(const sx of [-1,1])for(const sz of [-1,1])P.box(.1,.8,.1,sx*.55,0,sz*.4,wood,{edges:false});
  P.box(1.3,.08,1.0,0,.8,0,wood);P.box(1.35,.05,.1,0,.88,.0,shade(wood,.8),{edges:false,small:true});
  for(let i=0;i<5;i++){const x=-.5+i*.25*1.0,z=i%2?-.15:.15;const c=r.pick([0xb8bcc0,0xa8acb0,0x7a9aa0]);
    P.cyl(.14,.17,.5,x,.88,z,c,{seg:8,hull:.03});P.cyl(.09,.14,.1,x,1.38,z,shade(c,.9),{seg:8,edges:false,small:true});P.cyl(.1,.1,.05,x,1.48,z,shade(c,.7),{seg:8,edges:false,small:true})}
  P.col(-.7,.7,-.5,.5,.9);
});
defProp('beczkaDeszczowa',{name:'Beczka na deszczówkę',cat:'wies',dims:[.7,2.2,.8],cover:false,variants:['metal','plastik'],
  note:'Beczka 200 l (ø0,58 x 0,9 m) pod rynną, z kranikiem.'},(P,o,r)=>{
  const v=o.variant||r.pick(['metal','plastik']),c=v==='metal'?r.pick([0x2f5a8a,0x3a6a4a]):0x1e3a5a;
  P.cyl(.29,.29,.9,0,.05,0,c,{seg:12,hull:.03});P.cyl(.3,.3,.04,0,.3,0,shade(c,.7),{seg:12,edges:false,small:true});P.cyl(.3,.3,.04,0,.7,0,shade(c,.7),{seg:12,edges:false,small:true});
  P.cyl(.27,.27,.02,0,.95,0,0x0a1a2a,{seg:12,edges:false,small:true});
  P.cyl(.025,.025,.1,0,.2,.33,0x9a8a2a,{seg:5,rx:PI/2,edges:false,small:true});
  P.box(.12,2.0,.12,.0,.95,-.4,0xb8b2a6,{edges:false});P.box(.06,.3,.06,0,.95,-.3,0xb8b2a6,{rx:.8,edges:false,small:true});
  P.col(-.32,.32,-.32,.32,.95);
});
defProp('ul',{name:'Ul (pasieka)',cat:'wies',dims:[.55,.95,.55],cover:false,defaults:{n:1},
  note:'Ul Dadanta: korpus + nadstawka na podstawce, daszek z blachy. opts.n = ile uli w rzędzie (1.. 6).'},(P,o,r)=>{
  const n=Math.max(1,Math.min(6,o.n|0||1)),cols=[0xf2f0e6,0x4a8ac8,0xe8c030,0x4aa84a,0xd84a3a,0xe8e8e0];
  for(let i=0;i<n;i++){const x=(i-(n-1)/2)*.8,c=r.pick(cols);
    for(const sx of [-1,1])P.box(.06,.35,.06,x+sx*.22,0,0,0x6a4a2a,{edges:false,small:true});
    P.box(.5,.25,.5,x,.35,0,c);P.box(.5,.22,.5,x,.6,0,shade(c,.92));P.box(.56,.07,.56,x,.82,0,0x8a8e92,{edges:false});
    P.box(.3,.03,.05,x,.38,.26,0x1a1612,{edges:false,small:true});
  }
  P.col(-(n*.8)/2,(n*.8)/2,-.3,.3,.9);
});
defProp('wozDrabiniasty',{name:'Wóz drabiniasty',cat:'wies',dims:[1.7,1.8,4.8],cover:false,
  note:'Drewniany wóz konny: podłoga 3,2 x 1,3 m, drabiny burt 0,8 m, koła 1,1/0,85 m, dyszel.'},(P,o,r)=>{
  const w=r.pick([0x7a5a3a,0x8a6a44,0x6a4a2a]),acc=r.pick([0x2f6a3a,0xb8301f,0x3a4a6a]);
  P.box(1.3,.1,3.2,0,.7,0,w);for(const sx of [-1,1])P.box(.08,.12,3.2,sx*.6,.55,0,shade(w,.7),{edges:false,small:true});
  for(const sg of [-1,1]){
    P.box(.05,.06,3.3,sg*.68,1.5,0,w,{edges:false});P.box(.05,.06,3.3,sg*.68,.85,0,w,{edges:false,small:true});
    for(let i=0;i<8;i++)P.box(.05,.7,.05,sg*.68,.82,-1.55+i*.44,w,{edges:false,small:true});
  }
  P.box(1.4,.5,.06,0,.78,-1.64,acc,{edges:false});P.box(1.4,.5,.06,0,.78,1.64,acc,{edges:false});
  P.cylc(.05,.05,1.5,0,.55,-.9,DARK,{seg:5,rz:PI/2,edges:false,small:true});P.cylc(.05,.05,1.5,0,.42,1.05,DARK,{seg:5,rz:PI/2,edges:false,small:true});
  for(const sg of [-1,1]){woodWheel(P,sg*.78,.42,-1.05+.0,.42,w);woodWheel(P,sg*.78,.55,.9,.55,w)}
  P.cylc(.05,.05,2.2,0,.62,-2.5,w,{seg:5,rx:PI/2+.0,edges:false});P.cylc(.03,.03,.9,0,.62,-3.4,0x8a7a62,{seg:4,rz:PI/2,edges:false,small:true});
  P.box(.9,.12,.5,0,.84,-1.15,acc,{edges:false,small:true});
  P.col(-.85,.85,-1.85,1.85,1.2);
});
defProp('slupBocian',{name:'Słup z lampą i gniazdem bociana',cat:'wies',dims:[2.6,10,2.6],cover:true,
  note:'Słup wirowany ~9 m z wysięgnikiem i lampą sodową, na szczycie gniazdo ø1,6 m z bocianem.'},(P,o,r)=>{
  const c=r.pick([0x9a9890,0xa8a69c]);
  P.cyl(.1,.17,9,0,0,0,c,{seg:8,edges:false});P.cyl(.17,.2,.5,0,0,0,0x7a7870,{seg:8,edges:false,small:true});
  P.box(1.4,.08,.08,.0,7.6,0,0x4a4a4a,{edges:false,small:true});
  P.box(.9,.08,.08,.0,7.2,0,0x4a4a4a,{ry:1.6,edges:false,small:true});
  P.box(.7,.12,.3,.9,7.5,0,0x7a7a78,{edges:false});P.box(.4,.05,.2,.95,7.42,0,0xffd890,{...BASIC});
  for(let i=0;i<3;i++)P.box(.05,.1,.05,-.55+i*.4,7.1,0,0x4a4a4a,{edges:false,small:true});
  P.cyl(.7,.5,.4,0,8.6,0,0x6a4e34,{seg:9,edges:false});P.cyl(.78,.7,.12,0,8.95,0,0x8a6a44,{seg:9,edges:false,small:true});
  for(let i=0;i<9;i++){const a=i/9*PI*2;P.box(.05,.05,.9,Math.cos(a)*.7,9.0,Math.sin(a)*.7,0x7a5a3a,{ry:-a+PI/2,rx:.2,edges:false,small:true})}
  P.box(.16,.4,.26,.05,9.1,0,0xf4f4ee,{edges:false});P.box(.07,.35,.07,.05,9.5,-.15,0xf4f4ee,{rx:.3,edges:false,small:true});P.box(.04,.04,.35,.05,9.82,-.38,0xd02a1a,{edges:false,small:true});
  P.box(.02,.4,.02,-.1,8.85,.05,0xd02a1a,{edges:false,small:true});
  P.col(-.25,.25,-.25,.25,9);
});
defProp('slawojka',{name:'Sławojka',cat:'wies',dims:[1.2,2.4,1.3],cover:true,
  note:'Drewniana wygódka 1,1 x 1,2 x 2,2 m, daszek pulpitowy, półksiężyc nad drzwiami.'},(P,o,r)=>{
  const w=r.pick([0x7a5a3a,0x8a6a44,0x6a8a6a,0x9a9a8a]);
  P.box(1.1,2.2,1.2,0,0,0,w);for(let i=0;i<8;i++)P.box(.02,2.2,.03,-.5+i*.143,0,.605,shade(w,.7),{edges:false,small:true});
  P.box(1.3,.06,1.5,0,2.2,0,0x5a5e62,{rx:-.12});
  P.box(.7,1.7,.05,0,.1,.62,shade(w,.8));P.box(.04,.12,.05,.25,.95,.66,0x2a2a2a,{edges:false,small:true});
  P.sph(.1,0,1.95,.63,0x0a0a0a,{ws:6,hs:4,hull:0,sx:.6,sz:.15,edges:false,small:true});
  P.box(.4,.05,.1,0,2.0,.63,0x1a1612,{edges:false,small:true});
  P.colBox(1.2,1.3,2.3);
});

/* ============================ POLNA DROGA ============================ */
defProp('drogaPolna',{name:'Polna droga (pas)',cat:'wies',dims:[4.4,.05,24],cover:false,defaults:{len:24},
  note:'Pas gruntu 4,2 m: koleiny, trawa pośrodku, ragged brzegi (decal alfa). opts.len = długość, wzdłuż Z.'},(P,o,r)=>{
  const L=o.len||24,n=Math.max(1,Math.round(L/4)),segL=L/n;
  const t=atlas('wies:droga',256,256,(g,w,h)=>{
    const R=(function(s){return()=>{s=(s*16807)%2147483647;return s/2147483647}})(77);
    g.clearRect(0,0,w,h);
    g.fillStyle='#8f7a58';g.beginPath();g.moveTo(14,0);for(let y=0;y<=h;y+=16)g.lineTo(10+R()*10,y);for(let y=h;y>=0;y-=16)g.lineTo(w-10-R()*10,y);g.closePath();g.fill();
    g.fillStyle='#6f5c40';g.fillRect(52,0,36,h);g.fillRect(w-88,0,36,h);
    g.fillStyle='#5a7a3a';g.fillRect(100,0,56,h);
    for(let i=0;i<260;i++){g.fillStyle=R()<.5?'rgba(60,45,30,.5)':'rgba(180,150,100,.5)';g.fillRect(14+R()*(w-28),R()*h,1+R()*4,1+R()*3)}
    g.fillStyle='#78924a';for(let i=0;i<40;i++)g.fillRect(100+R()*56,R()*h,2,4+R()*5);
  });
  for(let i=0;i<n;i++)P.decal(t,4.4,segL,0,.03,-L/2+segL/2+i*segL,{rx:-PI/2});
});

/* ============================ NAMIOT PIWNY ============================ */
defProp('namiotPiwny',{name:'Namiot z piwem (przed dyskoteką)',cat:'wies',dims:[6.4,3.4,4.4],cover:false,
  note:'Namiot 6 x 4 m w pasy, lada z kranami, beczki, skrzynki, stolik; neon PIWO. Front w +Z.'},(P,o,r)=>{
  const a=r.pick([0xc8301f,0x2a5aa8,0x2f7a3a]);
  const tex=neonTex('wies:piwo',256,96,(g,w,h)=>{g.fillStyle='#1a1006';g.fillRect(0,0,w,h);glowText(g,'PIWO',w/2,h/2+4,'bold 66px Bangers, Impact, sans-serif','#ffc02a','#fff4c0')});
  for(const [x,z] of [[-3.2,-1.9],[3.2,-1.9],[-3.2,1.9],[3.2,1.9]])P.cyl(.04,.04,2.2,x,0,z,0x8a8e92,{seg:5,edges:false});
  for(const z of [-1.9,1.9])P.cyl(.04,.04,3.2,0,0,z,0x8a8e92,{seg:5,edges:false,small:true});
  const ang=Math.atan2(1.0,3.2),s=Math.hypot(3.2,1.0);
  for(const sg of [-1,1])for(let i=0;i<8;i++){const z=-1.75+i*.5,c=i%2?0xf4f0e6:a;
    P.box(s,.03,.5,sg*1.6,2.685,z,c,{rz:-sg*ang,edges:false,small:true});P.box(.03,.3,.5,sg*3.2,1.9,z,c,{edges:false,small:true})}
  P.box(.18,.08,4.1,0,3.18,0,0xe8e4d8,{edges:false,small:true});  P.box(4.4,1.1,.7,0,0,-1.3,0x6a4a2a);P.box(4.6,.06,.9,0,1.1,-1.3,0x8a6a42,{edges:false});
  for(let i=0;i<3;i++){P.cyl(.02,.02,.2,-.8+i*.8,1.16,-1.2,0xc0c0c0,{seg:5,edges:false,small:true});P.box(.1,.1,.2,-.8+i*.8,1.3,-1.15,0x1a1a1a,{edges:false,small:true})}
  for(const x of [-2.0,-1.5,2.0])P.cyl(.2,.2,.5,x,0,-1.9,0xb8bcc0,{seg:8,edges:false});
  for(let i=0;i<3;i++)P.box(.5,.3,.35,1.5+i*.55,0,-1.9,0xc8841e,{edges:false,small:true});
  P.cyl(.35,.3,.7,1.2,0,.6,0x2a5aa8,{seg:8,edges:false});P.cyl(.4,.4,.04,1.2,.7,.6,0xe8e4d8,{seg:8,edges:false});
  for(const [x,z] of [[.6,.6],[1.8,.6],[1.2,1.2]])P.cyl(.14,.12,.45,x,0,z,0xe0e0d8,{seg:6,edges:false,small:true});
  for(let i=0;i<10;i++)P.box(.09,.09,.09,-2.8+i*.62,2.45-Math.sin(i/9*PI)*.1,2.0,[0xfff0a0,0xff6a6a,0x7aff9a][i%3],{...BASIC});
  P.neon(tex,1.9,.7,0,2.0,-1.9,{ry:0});
  P.col(-2.3,2.3,-1.65,-.95,1.1);
});






