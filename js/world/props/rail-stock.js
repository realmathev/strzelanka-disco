// Kolej, część 2 (tabor): lokomotywa spalinowa SM42, elektryczne ET22/EU07, wagon osobowy 120A („bonanza”/zielony),
// wagon kryty Gbs, węglarka Eaos, cysterna Zas, drezyna motorowa. cat:'kolej'.
// Wymiary rzeczywiste (PKP; wikipedia PKP class SM42/ET22/EU07 + dane producentów, weryfikacja częściowa):
//  - SM42: dł. z zderzakami 14,24 m, szer. 3,17 m, wys. ~4,3 m, układ B'B', koła ø1,05 m (źródło: opracowanie modernizacji 6Dg/A).
//  - ET22: dł. 19,24 m, szer. 3,0 m, wys. z pantografem złożonym ~4,65 m, Co'Co', koła ø1,25 m. EU07: dł. 16,52 m, Bo'Bo', ø1,25 m.
//  - wagon osobowy 111A/120A: dł. 24,5 m, szer. 2,9 m, wys. 4,05 m nad szyną, podłoga ~1,2 m, koła ø0,92 m, 2 wózki.
//  - Gbs (kryty, 2-osiowy): dł. ~10 m, szer. 2,8 m, wys. 3,95 m; Eaos (węglarka 4-osiowa): dł. 14 m, szer. 3,0 m, wys. ~3,5 m;
//    Zas (cysterna 2-osiowa): dł. ~9,6 m, zbiornik ø2,6 m, wys. z włazem ~4,05 m.
// Konwencja: tor wzdłuż Z, przód (kabina czołowa / maska długa) w +Z; GÓRA SZYNY = RT (0,37 m), więc pojazd stawiaj na tym samym
// (x,z) co tor, y=0. Wszystkie pojazdy: pełny kolider (nie wejdziesz na wagon) i osłona (h >= 1,7 m).
import {defProp,atlas,shade,mixc,sideProfile} from './lib.js';
import {PI,C,RT,COL,B,Bs,FONTA,okno,rail} from './rail.js';
const {STEEL,STEELD,DARK,RUST,WHITE,RED,YEL,CONCD,WOOD}=COL;
const V=(P,w,h,d,x,y,z,c,o)=>B(P,w,h,d,x,y+RT,z,c,o);       // pudełko z wysokością liczoną od GÓRY szyny
const VE=(P,w,h,d,x,y,z,c,o)=>P.box(w,h,d,x,y+RT,z,c,o);    // j.w., z konturem
const VS=(P,w,h,d,x,y,z,c,o)=>Bs(P,w,h,d,x,y+RT,z,c,o);

function wheelset(P,z,r,seg=8,xs=.7175){
  for(const sx of [-1,1])P.add(new THREE.CylinderGeometry(r,r,.12,seg),sx*xs,RT+r,z,0x23201e,{rz:PI/2,edges:false,small:true});
  Bs(P,xs*2,.1,.1,0,RT+r-.05,z,STEELD);
}
function buffers(P,zEnd,dir,y,xs=.88,len=.3){
  for(const sx of [-1,1]){Bs(P,.14,.14,len,sx*xs,RT+y-.07,zEnd+dir*len/2,STEELD);P.add(new THREE.CylinderGeometry(.17,.17,.06,8),sx*xs,RT+y,zEnd+dir*len,STEEL,{rx:PI/2,edges:false,small:true})}
}
function bogie(P,zc,ax,r,seg){ // wózek: osie co `ax` m, ramki boczne
  const n=ax.length;
  for(const a of ax)wheelset(P,zc+a,r,seg);
  const z0=Math.min(...ax),z1=Math.max(...ax);
  for(const sx of [-1,1])Bs(P,.14,.28,z1-z0+.7,sx*.95,RT+r+.2,zc+(z0+z1)/2,STEELD);
  void n;
}
/** Reflektory (basic = świecą niezależnie od oświetlenia), 2 dolne + 1 górny. */
function heads(P,z,dir,y,top){
  for(const sx of [-1,1])P.add(new THREE.BoxGeometry(.24,.2,.06),sx*.9,RT+y,z+dir*.03,0xfff4c8,{basic:true});
  if(top)P.add(new THREE.BoxGeometry(.24,.2,.06),0,RT+top,z+dir*.03,0xfff4c8,{basic:true});
}
const numTex=(txt)=>atlas('rail:nr:'+txt,112,36,(g,w,h)=>{g.fillStyle='#e8e4d6';g.fillRect(0,0,w,h);g.strokeStyle='#222';g.lineWidth=3;g.strokeRect(1,1,w-2,h-2);g.fillStyle='#161616';g.font=FONTA(24);g.textAlign='center';g.textBaseline='middle';g.fillText(txt,w/2,h/2+1)});
const grill=()=>atlas('rail:kratki',128,96,(g,w,h)=>{g.fillStyle='#e0dcc8';g.fillRect(0,0,w,h);g.fillStyle='#262a2c';g.fillRect(6,6,w-12,h-12);g.fillStyle='#60666a';for(let y=12;y<h-8;y+=9)g.fillRect(8,y,w-16,3.5)});

/* ============================ LOKOMOTYWA SM42 ============================ */
// SM42: lokomotywa manewrowa, długa maska z przodu (+Z), kabina środkowa, krótka maska z tyłu. Układ B'B'.
const SM_PAL=[{b:0x2d5fa8,s:0xe8b81c,r:0x1d1d22},{b:0x2f7a4a,s:0xe8d8a0,r:0x23201e},{b:0xc86a1c,s:0x1d1d22,r:0x4a4a4e}];
defProp('lokSM42',{name:'Lokomotywa spalinowa SM42',cat:C,dims:[3.15,4.2,14.6],cover:true,
  note:'Przód (długa maska) +Z. Koła na RT=0,37 m: stawiaj na torze. Pełny kolider h 4,56 m. Seed: malowanie.'},(P,o,r)=>{
  const pal=o.pal||SM_PAL[Math.abs(Math.floor(o.seed))%3]||SM_PAL[0],wn=okno();
  VE(P,3.0,.45,13.7,0,.62,0,pal.r);
  for(const zc of [-3.9,3.9])bogie(P,zc,[-1,1],.525,8);
  V(P,1.8,.55,3.2,0,.12,0,DARK);
  VE(P,2.5,2.3,4.7,0,1.07,4.5,pal.b);V(P,2.54,.28,4.74,0,2.0,4.5,pal.s);V(P,2.3,.1,4.5,0,3.37,4.5,shade(pal.b,.75));
  VE(P,2.5,1.9,3.5,0,1.07,-3.25,pal.b);V(P,2.54,.28,3.54,0,1.95,-3.25,pal.s);V(P,1.5,.35,1.5,0,2.97,-3.3,pal.r);
  VE(P,3.0,3.0,3.6,0,1.07,.3,pal.b);V(P,3.04,.28,3.64,0,2.1,.3,pal.s);V(P,3.15,.12,3.8,0,4.07,.3,pal.r);
  P.cyl(.12,.14,.55,0,3.45+RT,3.0,DARK,{seg:6,edges:false,small:true});
  P.cyl(.1,.1,.35,.7,2.97+RT,-3.6,DARK,{seg:5,edges:false,small:true});
  for(const sx of [-1,1]){
    P.decal(wn,1.0,.9,sx*1.512,2.7+RT,.95,{ry:sx*PI/2});
    V(P,.04,2.0,.8,sx*1.51,1.2,-.95,shade(pal.b,.8),{small:true});P.decal(wn,.5,.55,sx*1.535,2.75+RT,-.95,{ry:sx*PI/2});
    Bs(P,.05,.8,.05,sx*1.55,RT+1.5,-.5,STEEL);
    for(const z of [-6.4,-4,0,3,6.4])Bs(P,.04,.9,.04,sx*1.43,RT+1.07,z,STEELD);
    Bs(P,.04,.04,13,sx*1.43,RT+1.95,0,STEELD);
  }
  P.decal(wn,2.3,.55,0,3.72+RT,2.115,{ry:0});P.decal(wn,2.3,.6,0,3.55+RT,-1.512,{ry:PI});
  P.decal(numTex('SM42-'+(1000+Math.abs(Math.floor(o.seed*37))%800)),.9,.3,1.262,2.6+RT,4.5,{ry:PI/2});
  V(P,3.0,.28,.2,0,.62,6.85,pal.r);V(P,3.0,.28,.2,0,.62,-6.85,pal.r);
  buffers(P,6.95,1,.76);buffers(P,-6.95,-1,.76);
  heads(P,6.85,1,1.9,3.2);heads(P,-5.0,-1,2.4);
  Bs(P,.08,.6,.08,0,RT+.9,6.95,STEELD);
  P.col(-1.6,1.6,-7.15,7.15,4.56);
});

/* ============================ LOKOMOTYWY ELEKTRYCZNE ET22 / EU07 ============================ */
// Skrzyniowe, dwie kabiny czołowe, pantografy złożone, kratki wentylacyjne po bokach. ET22: Co'Co' 19,24 m; EU07: Bo'Bo' 16,52 m.
const EL={
  et22:{hl:9.4,ax:[-2.05,0,2.05],zc:5.3,pal:[{b:0x2f5a3c,s:0xe8c628},{b:0x9a4a1c,s:0xe8d8a0}],name:'ET22'},
  eu07:{hl:8.0,ax:[-1.4,1.4],zc:4.6,pal:[{b:0x2a4f94,s:0xe9e1b8},{b:0x3a6a54,s:0xe8c628}],name:'EU07'},
};
for(const [id,k] of Object.entries(EL)){
  defProp('lok'+id.toUpperCase(),{name:'Lokomotywa elektryczna '+k.name,cat:C,dims:[3.0,5.15,k.hl*2+.5],cover:true,
    note:'Przód +Z, pantografy złożone, koła na RT. Pełny kolider h 4,52 m. Seed: malowanie i numer.'},(P,o,r)=>{
    const pal=k.pal[Math.abs(Math.floor(o.seed))%2],hl=k.hl,y0=RT+1.0,y1=RT+4.15,wn=okno(),gr=grill();
    P.add(sideProfile([[-hl,y0],[hl,y0],[hl,y1-1.15],[hl-.55,y1],[-hl+.55,y1],[-hl,y1-1.15]],2.95,0),0,0,0,pal.b,{ry:PI});
    V(P,2.99,.38,hl*2-.4,0,1.55,0,pal.s);V(P,2.99,.2,hl*2-.4,0,1.0,0,shade(pal.b,.6));
    for(const zc of [-k.zc,k.zc])bogie(P,zc,k.ax,.625,8);
    V(P,2.2,.12,hl*2-3.6,0,4.15,0,0x6f7478);
    for(const sz of [-1,1]){
      const z0=sz*(hl-3.3);
      for(const sx of [-1,1])P.cyl(.07,.09,.3,sx*.6,y1,z0,0xc9a05a,{seg:5,edges:false,small:true});
      Bs(P,.06,.06,1.1,0,y1+.45,z0-sz*.2,STEELD,{rx:-sz*.45});Bs(P,.06,.06,1.0,0,y1+.7,z0+sz*.22,STEELD,{rx:sz*.5});Bs(P,1.9,.05,.14,0,y1+.88,z0+sz*.1,STEEL);
      P.decal(wn,1.1,.75,-.7,2.55+RT,sz*(hl+.012),{ry:sz>0?0:PI});P.decal(wn,1.1,.75,.7,2.55+RT,sz*(hl+.012),{ry:sz>0?0:PI});
      for(const sx of [-1,1]){
        P.decal(wn,.9,.8,sx*1.482,2.55+RT,sz*(hl-1.1),{ry:sx*PI/2});
        V(P,.04,2.05,.85,sx*1.48,1.2,sz*(hl-2.15),shade(pal.b,.75),{small:true});
      }
      heads(P,sz*hl,sz,1.45,3.3);buffers(P,sz*(hl+.02),sz,.9);V(P,3.0,.4,.2,0,.9,sz*(hl-.1),DARK);
    }
    const zs=id==='et22'?[-5.6,0,5.6]:[-4,4];
    for(const sx of [-1,1])for(const z of zs)P.decal(gr,2.5,1.6,sx*1.476,2.5+RT,z,{ry:sx*PI/2});
    P.decal(numTex(k.name+'-'+(100+Math.abs(Math.floor(o.seed*53))%800)),.9,.28,1.482,3.55+RT,hl-3.4,{ry:PI/2});
    P.col(-1.55,1.55,-hl-.3,hl+.3,4.52);
  });
}

/* ============================ WAGON OSOBOWY 120A ============================ */
// Wagon osobowy typu 120A/111A (przedziałowy; „bonanza” = czerwono-kremowe malowanie): 24,5 m, szer. 2,9 m, dach łukowy 4,05 m,
// 8 modułów okien po stronie, drzwi na końcach, 2 wózki ø0,92 m, 2 pary zderzaków.
defProp('wagonOsobowy',{name:'Wagon osobowy 120A',cat:C,dims:[3.04,4.2,24.6],variants:['zielony','bonanza'],cover:true,
  note:'Pełny kolider h 4,05 (nie wejdziesz do środka). Koła na RT. Seed: brud/wariant gdy brak variant.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.5)?'zielony':'bonanza'),L=12.0;
  const lo=v==='bonanza'?0x7a1c24:0x2c5a3a,hi=v==='bonanza'?0xe6dcae:0x2f6a42,roof=r.pick([0x8a8d90,0x6f7478]);
  const ow=atlas('rail:oknaWagon',160,64,(g,w,h)=>{g.fillStyle='#cfc9b4';g.fillRect(0,0,w,h);for(const x of [6,84]){const gr=g.createLinearGradient(x,0,x+70,h);gr.addColorStop(0,'#3c4e5c');gr.addColorStop(1,'#1d2a36');g.fillStyle=gr;g.fillRect(x,7,70,h-14);g.fillStyle='#cfc9b4';g.fillRect(x,h*.34,70,3);g.fillStyle='rgba(255,255,255,.2)';g.beginPath();g.moveTo(x+4,9);g.lineTo(x+26,9);g.lineTo(x+4,40);g.fill()}});
  const wn=okno();
  VE(P,2.86,.7,L*2-.2,0,1.2,0,lo);
  VE(P,2.86,1.65,L*2-.2,0,1.9,0,hi);V(P,2.9,.1,L*2,0,1.15,0,shade(lo,.8));
  if(v==='zielony')V(P,2.88,.18,L*2-.2,0,1.75,0,0xe8c628);
  V(P,2.86,.5,L*2-.2,0,3.55,0,lo);
  P.prism([[-1.43,0],[1.43,0],[1.18,.38],[.5,.52],[-.5,.52],[-1.18,.38]],L*2,0,3.55+RT,-L,roof);
  V(P,2.3,.35,L*2-1.8,0,.85,0,DARK);V(P,.9,.45,2.0,1.0,.45,2,DARK);V(P,.9,.45,2.0,-1.0,.45,-2,DARK);
  for(const zb of [-8.9,8.9])bogie(P,zb,[-1.25,1.25],.46,8);
  for(let i=0;i<8;i++){const z=-8.95+i*2.56;for(const sx of [-1,1])P.decal(ow,2.5,1.0,sx*1.435,2.5+RT,z,{ry:sx*PI/2})}
  for(const sz of [-1,1]){
    for(const sx of [-1,1]){
      V(P,.05,2.2,1.0,sx*1.45,1.2,sz*10.9,shade(lo,.7),{small:true});P.decal(wn,.55,.7,sx*1.478,2.9+RT,sz*10.9,{ry:sx*PI/2});
      Bs(P,.04,1.7,.04,sx*1.5,RT+1.2,sz*10.25,STEEL);Bs(P,.04,.04,.4,sx*1.5,RT+1.3,sz*10.25,STEEL);
      Bs(P,.06,.1,.5,sx*1.38,RT+.88,sz*10.9,STEELD);
    }
    buffers(P,sz*12.0,sz,.98,.9,.25);Bs(P,.18,.18,.3,0,RT+.9,sz*12.1,STEELD);V(P,2.8,.2,.2,0,.9,sz*11.9,DARK);
    P.cyl(.18,.2,.15,0,3.55+RT+.5,sz*5,STEELD,{seg:6,edges:false,small:true});
  }
  P.cyl(.18,.2,.15,0,3.55+RT+.5,0,STEELD,{seg:6,edges:false,small:true});
  P.col(-1.45,1.45,-12.3,12.3,4.42);
});

/* ============================ WAGON KRYTY Gbs ============================ */
// Wagon towarowy kryty 2-osiowy: pudło 9,0 x 2,8 m, ściany 2,2 m (deskowanie), dach łukowy do 3,95 m, 2 drzwi przesuwne po 1,8 m,
// hamulcowa platforma z balustradą, rozstaw osi 6,0 m.
defProp('wagonKryty',{name:'Wagon kryty Gbs',cat:C,dims:[3.08,3.95,10.9],cover:true,
  note:'Pełny kolider h 3,95. Seed: kolor/rdza deskowania. Koła na RT.'},(P,o,r)=>{
  const col=r.pick([0x6b3a26,0x7a4630,0x5a4a3a,0x4a5a3a]),roof=r.pick([0x5a5e60,0x4a4e50]),L=4.5;
  const dk=atlas('rail:deski'+(Math.abs(Math.floor(o.seed))%2),256,128,(g,w,h)=>{let s=11+Math.abs(Math.floor(o.seed))%2*7;const R=()=>(s=(s*16807)%2147483647)/2147483647;
    g.fillStyle='#5a3220';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle=`hsl(${14+R()*8},${40+R()*15}%,${24+R()*8}%)`;g.fillRect(x+1,0,14,h)}
    g.fillStyle='rgba(20,10,5,.5)';for(let i=0;i<9;i++)g.fillRect(R()*w,R()*h,2,10+R()*30);g.fillStyle='rgba(160,90,40,.4)';for(let i=0;i<5;i++){g.beginPath();g.ellipse(R()*w,R()*h,10+R()*20,6+R()*10,0,0,7);g.fill()}});
  VE(P,2.78,2.25,L*2,0,1.2,0,col);
  P.prism([[-1.4,0],[1.4,0],[1.1,.35],[.5,.5],[-.5,.5],[-1.1,.35]],L*2+.2,0,3.45+RT,-L-.1,roof);
  V(P,2.3,.3,L*2-1,0,.85,0,DARK);
  for(const z of [-3,3])wheelset(P,z,.5,8);
  for(const sx of [-1,1]){for(const z of [-3,3])Bs(P,.14,.3,1.4,sx*.95,RT+.7,z,STEELD);
    P.decal(dk,3.3,1.9,sx*1.395,2.3+RT,-3.0,{ry:sx*PI/2});P.decal(dk,3.3,1.9,sx*1.395,2.3+RT,3.0,{ry:sx*PI/2});
    V(P,.1,2.1,1.8,sx*1.44,1.25,0,shade(col,.85),{small:true});V(P,.08,.1,2.9,sx*1.5,3.35,0,STEELD);Bs(P,.08,.5,.08,sx*1.5,RT+1.8,.7,STEEL);
    V(P,.06,.08,3.0,sx*1.5,1.2,0,STEELD);}
  V(P,1.0,.08,1.2,0,1.12,-L-.5,WOOD);V(P,1.0,.9,.05,0,1.2,-L-1.05,STEELD,{small:true});
  Bs(P,.04,1.0,.04,-.45,RT+1.2,-L-.9,STEELD);Bs(P,.04,1.0,.04,.45,RT+1.2,-L-.9,STEELD);
  for(const sz of [-1,1]){buffers(P,sz*5.0,sz,.98,.9,.25);V(P,2.8,.2,.2,0,.9,sz*4.9,DARK)}
  P.col(-1.45,1.45,-5.3,5.3,4.32);
});

/* ============================ WĘGLARKA Eaos ============================ */
// Wagon otwarty wysokoburtowy 4-osiowy: pudło 13,4 x 2,9 m, burty 2,1 m nad podłogą (podłoga 1,25 m), żebra, węgiel (heap), 2 wózki.
defProp('weglarka',{name:'Węglarka Eaos',cat:C,dims:[3.07,3.5,14.0],variants:['pelna','pusta'],cover:true,
  note:'Burty 3,35 m nad szyną: osłona. Wariant pelna = hałda węgla. Kolider h 3,4.'},(P,o,r)=>{
  const full=(o.variant||r.pick(['pelna','pusta']))==='pelna',col=r.pick([0x6a3a2a,0x5a3a30,0x4a4a46,0x7a4a30]),L=6.6;
  V(P,2.4,.4,L*2-1,0,.8,0,DARK);V(P,2.9,.16,L*2,0,1.2,0,shade(col,.7));
  P.box(.12,2.1,L*2,1.43,1.36+RT,0,col,{edges:true});P.box(.12,2.1,L*2,-1.43,1.36+RT,0,col,{edges:true});
  P.box(2.78,2.1,.12,0,1.36+RT,-L+.06,col,{edges:true});P.box(2.78,2.1,.12,0,1.36+RT,L-.06,col,{edges:true});
  for(const sx of [-1,1]){for(let i=0;i<7;i++)Bs(P,.07,2.0,.1,sx*1.5,RT+1.4,-5.4+i*1.8,shade(col,.75));V(P,.1,.12,L*2+.1,sx*1.45,3.46-.14,0,shade(col,.6),{small:true})}
  if(full){P.ico(1.35,0,3.1+RT,0,0x15161a,{sx:1.0,sy:.45,sz:4.5,detail:1,hull:0,edges:false});}
  else B(P,2.6,.1,L*2-.4,0,1.3+RT,0,0x3a2a22,{small:true});
  for(const zb of [-4.7,4.7])bogie(P,zb,[-.9,.9],.45,8);
  for(const sz of [-1,1]){buffers(P,sz*6.7,sz,.98,.9,.25);V(P,2.8,.2,.2,0,.9,sz*6.6,DARK)}
  P.col(-1.5,1.5,-6.9,6.9,3.85);
});

/* ============================ CYSTERNA Zas ============================ */
// Cysterna 2-osiowa: zbiornik ø2,6 m dł. 7,2 m z półkulistymi dnami, właz z kopułą, pomost z balustradą, drabinki, wspornik na ramie;
// pas ostrzegawczy. Wariant: czarna / srebrna / rdzawa wg seeda.
defProp('cysterna',{name:'Cysterna Zas',cat:C,dims:[2.95,4.3,10.1],cover:true,note:'Zbiornik ø2,6, wys. całk. 4,05 m. Pełny kolider h 4,0. Seed: kolor zbiornika.'},(P,o,r)=>{
  const tank=r.pick([0x1f2022,0xaeb4b6,0x6a3a24,0x2c3a4a]),yc=2.4+RT;
  V(P,2.4,.3,8.4,0,.85,0,DARK);V(P,2.7,.14,9.4,0,1.15,0,STEELD);
  P.add(new THREE.CylinderGeometry(1.3,1.3,7.2,16),0,yc,0,tank,{rx:PI/2});
  for(const sz of [-1,1])P.sph(1.3,0,yc,sz*3.6,tank,{ws:12,hs:5,sz:.45,hull:.03,edges:false});
  P.add(new THREE.CylinderGeometry(1.32,1.32,.45,16),0,yc,0,r.pick([YEL,WHITE,RED]),{rx:PI/2,edges:false,small:true});
  for(const z of [-2.5,2.5])V(P,1.8,.9,.5,0,1.28,z,shade(tank,.7),{small:true});
  P.cyl(.4,.45,.35,0,3.7+RT,0,shade(tank,.85),{seg:8,edges:false});P.cyl(.3,.3,.06,0,4.04+RT,0,STEELD,{seg:8,edges:false,small:true});
  V(P,.5,.05,6,0,3.72,0,STEELD,{small:true});
  for(const sx of [-.28,.28])Bs(P,.03,.5,5.2,sx,RT+3.78,0,STEELD);
  for(const z of [-3,3])wheelset(P,z,.5,8);
  for(const sx of [-1,1])for(const z of [-3,3])Bs(P,.14,.3,1.4,sx*.95,RT+.7,z,STEELD);
  for(const sz of [-1,1]){for(let i=0;i<5;i++)Bs(P,.6,.04,.04,1.25,RT+1.0+i*.3,sz*3.9,STEELD);buffers(P,sz*4.75,sz,.98,.9,.25);V(P,2.8,.2,.2,0,.9,sz*4.65,DARK)}
  P.col(-1.45,1.45,-5.0,5.0,4.42);
});

/* ============================ DREZYNA MOTOROWA ============================ */
// Drezyna motorowa (typ MDK/„drezyna dróżnicza”): platforma 3,0 x 1,5 m na 4 kołach ø0,5 m, kabinka silnikowa, siedzisko, szyba, żółte malowanie.
defProp('drezyna',{name:'Drezyna motorowa',cat:C,dims:[2.0,2.1,3.4],cover:false,note:'Przód +Z, koła na RT. Kolider h 1,6 (nie wejdziesz).'},(P,o,r)=>{
  const col=r.pick([0xe8b81c,0xd0782a,0x3a6aa0]);
  for(const z of [-.95,.95])wheelset(P,z,.25,8);
  VE(P,1.5,.18,3.0,0,.46,0,DARK);
  V(P,1.4,.8,1.2,0,.64,-.9,col,{});P.box(1.4,.08,1.2,0,.64+.8+RT,-.9,shade(col,.7),{edges:false});
  V(P,1.3,.5,.9,0,.64,.6,shade(col,.85));
  V(P,.5,.08,.5,0,1.14,.6,0x3a2a1a);V(P,.5,.4,.08,0,1.2,.35,0x3a2a1a);
  Bs(P,.05,.8,.05,-.65,RT+.64,1.4,STEELD);Bs(P,.05,.8,.05,.65,RT+.64,1.4,STEELD);Bs(P,1.3,.05,.05,0,RT+1.4,1.4,STEELD);
  Bs(P,1.3,.5,.04,0,RT+1.6,-.3,0x1d2a36);
  Bs(P,.05,.05,.7,-.68,RT+1.6+.2,-.6,STEELD);
  buffers(P,1.5,1,.55,.5,.15);buffers(P,-1.5,-1,.55,.5,.15);
  heads(P,1.5,1,.95);
  P.col(-.8,.8,-1.7,1.7,1.7);
});
