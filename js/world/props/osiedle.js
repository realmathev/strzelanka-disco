// Osiedle, część 2: plac zabaw (trzepak, piaskownica, huśtawka, zjeżdżalnia), ławka pod blokiem, wiata śmietnikowa,
// garaże blaszane, gablota, antena satelitarna, suszarka, wiata rowerowa, budka z piwem, trafostacja, murek ze schodami,
// plac z kostki. Wymiary w komentarzach przy rekwizytach (patrz też nagłówek estate.js). Przód patrzy w +Z.
// Budżet: drobne rekwizyty < 600 trójkątów. Neony: tylko MeshBasic (mruganie = przygaszenie koloru, nigdy visible=false).
import {defProp,atlas,neonTex,glowText,shade,mixc} from './lib.js';
import {dish,lcg} from './estate.js';

const PI=Math.PI;
const FONT=s=>s+'px Bangers, Impact, sans-serif';
const CYL=(rt,rb,h,seg=6,open=false)=>new THREE.CylinderGeometry(rt,rb,h,seg,1,open);

/** Rowerek: koła (torus), rama z cienkich prętów, kierownica i siodło. Origin w (x,z), oś roweru wzdłuż lokalnego X po obrocie ry. */
function bike(P,x,z,ry,col){
  const c=Math.cos(ry),s=Math.sin(ry),tf=(lx,lz=0)=>[x+lx*c+lz*s,z-lx*s+lz*c];
  for(const lx of [-.55,.55]){const [px,pz]=tf(lx);P.add(new THREE.TorusGeometry(.33,.022,3,9),px,.35,pz,0x1b1a1a,{ry,edges:false,small:true})}
  const bar=(x1,y1,x2,y2,cc=col)=>{const len=Math.hypot(x2-x1,y2-y1),[px,pz]=tf((x1+x2)/2);P.add(new THREE.BoxGeometry(len,.035,.035),px,(y1+y2)/2,pz,cc,{rz:Math.atan2(y2-y1,x2-x1),ry,edges:false,small:true})};
  bar(-.55,.35,-.18,.85);bar(-.18,.85,.42,.82);bar(.42,.82,.55,.35);bar(-.55,.35,.0,.38);bar(.0,.38,.42,.82);
  { const [px,pz]=tf(.45);P.add(new THREE.BoxGeometry(.04,.04,.5),px,.95,pz,0x222222,{ry,edges:false,small:true}) }
  { const [px,pz]=tf(-.2);P.add(new THREE.BoxGeometry(.24,.05,.1),px,.92,pz,0x1a1a1a,{ry,edges:false,small:true}) }
}

/* ============================ TRZEPAK ============================ */
// Trzepak: rura stalowa ø~64 mm, rama w kształcie A (nogi rozstawione w podstawie 0,8 m), górny drążek 2,4 m, drugi 1,5 m, szer. ~2,5 m.
defProp('trzepak',{name:'Trzepak',cat:'osiedle',dims:[2.5,2.4,.9],cover:false,
  note:'Seed: kolor, rdza, dywan na drążku. Pod drążkiem da się przejść (kolidery tylko na nogach).'},(P,o,r)=>{
  const c=o.color||r.pick([0x3f6fb0,0x4f8a4a,0xb8372a,0x8a8f94,0xd0a02a]),rust=0x8a4a22,R=.032,a=Math.atan2(.4,2.4);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*1.2;
    P.add(CYL(R,R,2.43,6,true),x,1.2,sz*.2,c,{rx:-sz*a,edges:false});
    P.add(CYL(R*1.12,R*1.12,.34,6,true),x,.16,sz*.38,rust,{rx:-sz*a,edges:false,small:true});
    P.box(.3,.08,.3,x,0,sz*.4,0x9a968a,{edges:false});
  }
  P.add(CYL(R,R,2.5,6),0,2.4,0,c,{rz:PI/2,edges:false});
  P.add(CYL(R,R,2.5,6),0,1.5,.15,c,{rz:PI/2,edges:false});
  P.add(CYL(R*.9,R*.9,2.5,6),0,.95,-.2,shade(c,.8),{rz:PI/2,edges:false});
  if(r.chance(.55)){
    const dy=atlas('estate:dywan',64,56,(g,w,h)=>{g.fillStyle='#a8322a';g.fillRect(0,0,w,h-6);g.fillStyle='#e8c060';g.fillRect(4,4,w-8,3);g.fillRect(4,h-14,w-8,3);
      g.strokeStyle='#1a1410';g.lineWidth=2;for(let i=0;i<4;i++){g.beginPath();g.arc(w/2,24,18-i*4,0,7);g.stroke()}g.strokeStyle='#e8d8a0';g.lineWidth=1.5;for(let x=2;x<w;x+=4){g.beginPath();g.moveTo(x,h-6);g.lineTo(x,h)}g.stroke()});
    const cx=r.range(-.6,.6);
    P.box(1.7,1.0,.025,cx,1.42,.0,0x7a2a28,{edges:false,small:true});
    P.decal(dy,1.7,1.0,cx,1.92,.02);P.decal(dy,1.7,1.0,cx,1.92,-.02,{ry:PI});
  }
  P.col(-1.3,-1.1,-.45,.45,2.4);P.col(1.1,1.3,-.45,.45,2.4);
});

/* ============================ PIASKOWNICA ============================ */
// Piaskownica 2,5x2,5 m, obrzeże z dwóch desek (razem ~0,27 m), słupki narożne; wariant „grzybek” z daszkiem ø1,6 m.
defProp('piaskownica',{name:'Piaskownica',cat:'osiedle',dims:[2.6,2.0,2.6],variants:['zwykla','grzybek'],
  note:'Bez koliderów (płaska, można wejść). Zabawki wg seeda. Grzybek: słup ma kolider.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.45)?'grzybek':'zwykla'),s=2.5,wood=r.pick([0x8a6a3a,0xa8864a,0x6a8a4a,0x3f6fb0]);
  P.box(s-.1,.2,s-.1,0,0,0,r.pick([0xdcbf7e,0xd2b46c]),{edges:false});
  for(const y of [0,.14]){P.box(s,.13,.05,0,y,s/2-.025,wood,{edges:false});P.box(s,.13,.05,0,y,-s/2+.025,wood,{edges:false});P.box(.05,.13,s-.1,s/2-.025,y,0,wood,{edges:false});P.box(.05,.13,s-.1,-s/2+.025,y,0,wood,{edges:false})}
  for(const sx of [-1,1])for(const sz of [-1,1])P.box(.1,.32,.1,sx*(s/2-.03),0,sz*(s/2-.03),shade(wood,.8),{edges:false});
  P.ico(.3,.5,.22,.4,0xcfb36a,{sy:.45,hull:0,edges:false,small:true});
  P.cyl(.1,.075,.17,-.4,.2,.5,r.pick([0xd0342a,0x3a8ad2,0xf0c030]),{seg:8,edges:false,small:true});
  P.box(.05,.28,.02,-.1,.2,.6,0xd0342a,{rx:-1.3,edges:false,small:true});
  P.sph(.09,.7,.29,-.5,r.pick([0xf0c030,0xe0e0e0,0x3a8ad2]),{ws:6,hs:4,hull:0,edges:false,small:true});
  if(v==='grzybek'){
    P.cyl(.05,.05,1.55,.85,.2,-.85,0x7a5a3a,{seg:6,edges:false});
    const cap=r.pick([0xd0342a,0x3a8ad2,0xf0c030]);
    P.cyl(.04,.82,.4,.85,1.7,-.85,cap,{seg:10});
    for(const [dx,dz] of [[.35,0],[-.3,.25],[0,-.4],[.1,.3]])P.sph(.07,.85+dx,1.88-Math.hypot(dx,dz)*.2,-.85+dz,0xf4f0e0,{ws:5,hs:4,hull:0,edges:false,small:true});
    P.col(.78,.92,-.92,-.78,2.1);
  }
});

/* ============================ HUŚTAWKA ============================ */
// Huśtawka podwójna: rama A ~2,6 m szer., poprzeczka 2,2 m (PN-EN 1176), łańcuchy 1,6 m, siedziska gumowe 0,42 m.
defProp('hustawka',{name:'Huśtawka',cat:'osiedle',dims:[2.8,2.3,2.0],cover:false,
  note:'Seed: kolor ramy, wychylenie siedzisk. Kolidery tylko na stopkach ramy.'},(P,o,r)=>{
  const c=o.color||r.pick([0xc4271f,0x3f6fb0,0x3a8a4a,0xd0a02a,0x7a7e82]),a=Math.atan2(.9,2.2),hx=1.3;
  for(const sx of [-1,1])for(const sz of [-1,1]){
    P.add(CYL(.036,.036,2.38,6,true),sx*hx,1.1,sz*.45,c,{rx:-sz*a,edges:false});
    P.box(.28,.07,.28,sx*hx,0,sz*.9,0x9a968a,{edges:false,small:true});
  }
  P.add(CYL(.04,.04,2.75,6),0,2.2,0,c,{rz:PI/2,edges:false});
  for(const sx of [-.5,.5]){
    const t=r.range(-.35,.35),L=1.6,seat=r.pick([0x1b1a1a,0x1b1a1a,0xd0342a,0xf0c030]);
    for(const dx of [-.19,.19]){
      P.add(new THREE.BoxGeometry(.018,L,.018),sx+dx,2.2-L/2*Math.cos(t),-L/2*Math.sin(t),0x6a6e70,{rx:t,edges:false,small:true});
    }
    P.add(new THREE.BoxGeometry(.44,.045,.18),sx,2.2-L*Math.cos(t),-L*Math.sin(t),seat,{rx:t,edges:false});
  }
  P.col(-hx-.15,-hx+.15,-.95,.95,2.2);P.col(hx-.15,hx+.15,-.95,.95,2.2);
});

/* ============================ ZJEŻDŻALNIA ============================ */
// Zjeżdżalnia dziecięca: podest 1,2 m, rynna 0,5 m szer. i ~2,5 m dł. (kąt ~22°), drabinka z 5 szczebli, barierki 0,45 m.
defProp('zjezdzalnia',{name:'Zjeżdżalnia',cat:'osiedle',dims:[.9,2.0,4.3],cover:false,note:'Rynna ku +Z. Seed: kolor wieży i rynny.'},(P,o,r)=>{
  const tw=o.color||r.pick([0xc4271f,0x3f6fb0,0x3a8a4a,0xd0a02a]),bed=r.pick([0xb8c0c4,0xf0c030,0xd0d4d6]);
  const th=.78,a=Math.atan2(.95,2.3),len=Math.hypot(.95,2.3);
  for(const sx of [-1,1])for(const sz of [-1,1])P.box(.07,1.95,.07,sx*(th/2-.04),0,-1.4+sz*(th/2-.04),tw,{edges:false});
  P.box(th,.05,th,0,1.2,-1.4,shade(tw,.8));
  P.box(th,.06,.05,0,1.9,-1.4+th/2-.04,tw,{edges:false,small:true});
  for(const sx of [-1,1]){P.box(.05,.06,th,sx*(th/2-.04),1.5,-1.4,tw,{edges:false,small:true});P.box(.05,.4,th-.1,sx*(th/2-.04),1.55,-1.4,shade(tw,.9),{edges:false,small:true})}
  const mz=-1.0+1.15,my=1.2-.475;
  P.add(new THREE.BoxGeometry(.5,.04,len),0,my,mz,bed,{rx:a});
  for(const sx of [-1,1])P.add(new THREE.BoxGeometry(.04,.12,len),sx*.27,my+.07,mz,shade(bed,.85),{rx:a,edges:false,small:true});
  P.box(.5,.04,.5,0,.19,1.57,bed,{edges:false});
  P.box(.06,.2,.06,-.24,0,1.6,0x6a6e70,{edges:false,small:true});P.box(.06,.2,.06,.24,0,1.6,0x6a6e70,{edges:false,small:true});
  const la=Math.atan2(.6,1.2);
  for(const sx of [-1,1])P.add(new THREE.BoxGeometry(.05,1.34,.05),sx*.24,.6,-2.1,0x6a6e70,{rx:la,edges:false,small:true});
  for(let i=0;i<5;i++){const y=.2+i*.22;P.add(new THREE.BoxGeometry(.5,.04,.04),0,y,-2.4+y*.5,0x8a8e90,{edges:false,small:true})}
  P.col(-.4,.4,-2.5,1.85,1.3);
});

/* ============================ ŁAWKA POD BLOKIEM ============================ */
// Ławka osiedlowa 1,9 x 0,55 x 0,85 m: lastrykowe boki, siedzisko z 3 desek (wys. 0,45 m), oparcie z 2 desek; łuski, butelka.
defProp('lawkaPodBlokiem',{name:'Ławka pod blokiem',cat:'osiedle',dims:[1.9,.85,.7],cover:false,
  note:'Deski: kolor/braki wg seeda; łuski po słoneczniku i butelka (decal).'},(P,o,r)=>{
  const len=o.len||1.9,hx=len/2-.12,wood=r.pick([0x3f6b3a,0x2f5f8f,0x8b5a2b,0x9a3a2a,0xb08a4a]),con=r.pick([0xa9a59b,0x98948a]);
  for(const sx of [-1,1]){
    P.box(.12,.44,.46,sx*hx,0,.03,con);
    P.box(.12,.85,.1,sx*hx,0,-.21,con,{rx:-.08});
  }
  for(const z of [.17,.03,-.11])if(!r.chance(.1))P.box(len-.04,.045,.13,0,.44,z,wood,{rx:.01,edges:false});
  for(const y of [.58,.74])if(!r.chance(.1))P.box(len-.04,.13,.035,0,y,-.27-(y-.58)*.22,wood,{rx:-.14,edges:false});
  const hu=atlas('estate:luski',96,64,(g,w,h)=>{const R=lcg(9);for(let i=0;i<70;i++){g.fillStyle=R()<.5?'#3a3128':'#1a1410';g.beginPath();g.ellipse(R()*w,R()*h,3,1.6,R()*3,0,7);g.fill()}
    g.fillStyle='#7ca8c8';g.fillRect(70,10,5,3)});
  P.decal(hu,.9,.6,.15,.012,.55,{rx:-PI/2});
  if(r.chance(.6))P.cyl(.035,.04,.2,hx-.35,0,.5,0x3a6a3a,{seg:6,edges:false,small:true});
  P.colBox(len,.55,.5);
});

/* ============================ WIATA ŚMIETNIKOWA ============================ */
// Wiata na 3 kontenery MGB 1100 (1,37x1,07x1,33 m): 4,6x1,7x2,0 m, ściany z blachy/cegły, dach jednospadowy, kosz na pokrywie.
defProp('wiataSmietnikowa',{name:'Śmietnik z wiatą',cat:'osiedle',dims:[4.8,2.2,2.0],cover:true,variants:['blacha','ceglana'],
  note:'3 kontenery z naklejkami, worki przed wiatą. Daje osłonę.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.5)?'blacha':'ceglana'),wl=v==='ceglana'?r.pick([0xa0502e,0x9a4a2c]):r.pick([0x6f8f6a,0x7a8a9a,0x8a7a5a]),W=4.6,D=1.7;
  P.box(W+.1,.12,D+.1,0,0,0,0x8f8b80,{edges:false});
  P.box(W,1.95,.1,0,.12,-D/2+.05,wl);P.box(.1,1.95,D,-W/2+.05,.12,0,wl);P.box(.1,1.95,D,W/2-.05,.12,0,wl);
  for(const sx of [-1,1])P.box(.1,.1,.1,sx*(W/2-.05),2.07,D/2-.05,shade(wl,.7),{edges:false,small:true});
  P.box(W+.3,.06,D+.4,0,2.07,.0,0x4a4a48,{rx:.05});
  P.box(W+.3,.1,.06,0,2.12,D/2+.2,0x4a4a48,{edges:false,small:true});
  const gr=atlas('estate:smietnik-graf',160,64,(g,w,h)=>{g.font=FONT(40);g.textAlign='center';g.textBaseline='middle';g.lineWidth=7;g.lineJoin='round';g.strokeStyle='#1a0a2a';g.strokeText('BLOK 12',w/2,h/2);g.fillStyle='#ff3b8b';g.fillText('BLOK 12',w/2,h/2)});
  P.decal(gr,1.1,.45,W/2+.012,1.0,0,{ry:PI/2});
  const cc=[0x2e6b3a,0x6e7378,0xd2b020,0x2a4f8a],lid=0x1d1f21;
  for(let i=0;i<3;i++){
    const x=-1.45+i*1.45,body=r.pick(cc),open=r.chance(.3);
    P.cyl(.7071,.64,.92,x,.17,-.1,body,{seg:4,ry:PI/4,sx:1.37,sz:1.07});
    P.box(1.37,.06,1.07,x,1.07,-.1,shade(body,.8),{edges:false});
    if(open)P.box(1.4,.06,1.08,x,1.5,-.55,lid,{rx:-1.15});else P.box(1.4,.07,1.09,x,1.13,-.1,lid,{rx:.03});
    for(const sx of [-1,1])P.cylc(.1,.1,.06,x+sx*.55,.1,.3,0x15110e,{seg:6,rz:PI/2,edges:false,small:true});
    P.box(.5,.2,.01,x,.7,.445,r.pick([0xf2f2f2,0xf2c21c]),{edges:false,small:true});
  }
  for(let i=0;i<2;i++)P.ico(.26,r.range(-1.8,1.8),.2,D/2+.3+r()*.2,0x161616,{sy:.8,detail:0,hull:.05});
  P.colBox(W+.1,D+.1,2.1);P.cover=true;
});

/* ============================ GARAŻE BLASZANE ============================ */
// Blaszak 2,8 x 5,2 m, wysokość z przodu 2,3 m, z tyłu 2,0 m (dach jednospadowy), drzwi dwuskrzydłowe 2,5 x 2,0 m, numer malowany farbą.
// Rząd garaży (opts.count 2..7, domyślnie 5); kolory, rdza, otwarte/pogięte drzwi wg seeda.
defProp('garazeBlaszane',{name:'Rząd garaży blaszanych',cat:'osiedle',dims:[14.3,2.4,6.7],cover:true,
  note:'opts.count = liczba garaży. Przód +Z. Jedno skrzydło bywa uchylone.'},(P,o,r)=>{
  const n=Math.max(2,Math.min(7,o.count||5)),W=2.8,D=5.2,pitch=W+.05,x0=-n*pitch/2+pitch/2;
  const pal=[0x6e8a5a,0x8a4a32,0x4a6a8a,0x9a9a8e,0xb09a62,0x7a3a30,0x5a7a7a];
  const g=lc=>atlas('estate:garaz'+lc,128,112,(c,w,h)=>{
    const R=lcg(40+lc);c.strokeStyle='rgba(20,15,10,.75)';c.lineWidth=2.5;c.strokeRect(3,3,w/2-5,h-6);c.strokeRect(w/2+2,3,w/2-5,h-6);
    c.lineWidth=2;c.beginPath();c.moveTo(6,h-8);c.lineTo(w/2-8,8);c.moveTo(w/2+5,8);c.lineTo(w-8,h-8);c.stroke();
    c.fillStyle='#3a3a38';c.fillRect(w/2-9,h*.5,5,16);c.fillRect(w/2+4,h*.5,5,16);
    c.fillStyle='rgba(240,236,220,.95)';c.fillRect(w*.58,8,34,24);c.fillStyle='#1a1410';c.font=FONT(24);c.textAlign='center';c.fillText(String(10+lc*3+Math.floor(R()*6)),w*.58+17,28);
    c.fillStyle='rgba(120,56,24,.85)';for(let i=0;i<6;i++)c.fillRect(R()*w,h-8-R()*30,4+R()*5,10+R()*30);
  });
  for(let i=0;i<n;i++){
    const x=x0+i*pitch,col=r.pick(pal),dcol=shade(col,.9);
    P.add(sideProfileGeo([[0,0],[D,0],[D,2.3],[0,2.0]].map(p=>[p[0],p[1]]),W),x,0,-D/2,col,{ry:PI,edges:false});
    P.add(new THREE.BoxGeometry(W+.1,.04,D+.25),x,2.17,0,shade(col,.7),{rx:-.0577,edges:false});
    P.box(W,.18,.1,x,0,D/2+.04,0x6a6a62,{edges:false,small:true});
    const open=r.chance(.17),leaf=W/2-.12;
    if(open){
      const a=r.range(.9,1.5);
      P.box(W-.2,1.98,.02,x,0,D/2+.012,0x15110e,{edges:false,small:true});
      P.add(new THREE.BoxGeometry(leaf,1.95,.04),x-W/2+.12+Math.cos(a)*leaf/2+.0,1.0,D/2+.03+Math.sin(a)*leaf/2,dcol,{ry:-a,edges:false});
      P.box(leaf,1.95,.04,x+.06+leaf/2,.04,D/2+.03,dcol,{edges:false});
    }else{
      P.box(leaf,1.98,.04,x-leaf/2-.0,.03,D/2+.03,dcol,{edges:false});P.box(leaf,1.98,.04,x+leaf/2,.03,D/2+.03,shade(dcol,.93),{edges:false});
      P.decal(g(i%4),W-.2,2.0,x,1.02,D/2+.06);
    }
    if(r.chance(.25))P.box(.4,.05,.04,x+r.range(-.8,.8),2.38,D/2,0x3a3a38,{edges:false,small:true});
  }
  P.colBox(n*pitch,D,2.3);P.cover=true;
});
// profil boczny wyciśnięty na szerokość width (przód w -Z, środek x=0) — kopia sideProfile z lib dla geometrii bez Parts
import {sideProfile} from './lib.js';
function sideProfileGeo(pts,w){return sideProfile(pts,w,0)}

/* ============================ GABLOTA OGŁOSZEŃ ============================ */
// Gablota spółdzielni 1,5 x 1,0 m na dwóch słupkach rurowych (wys. całk. 2,1 m), szyba, ogłoszenia (decal), daszek.
defProp('gablotaOgloszen',{name:'Gablota ogłoszeń',cat:'osiedle',dims:[1.7,2.2,.4],cover:false,note:'Ogłoszenia z atlasu (3 zestawy wg seeda).'},(P,o,r)=>{
  const k=Math.abs(Math.floor(o.seed))%3,fr=r.pick([0x4a4f4a,0x2f4a6a,0x6a3a2a]);
  const tex=atlas('estate:gablota'+k,256,160,(g,w,h)=>{
    const R=lcg(200+k);g.fillStyle='#5a4a32';g.fillRect(0,0,w,h);g.fillStyle='#e8e2c8';g.fillRect(6,6,w-12,26);g.fillStyle='#8a1a1a';g.font=FONT(22);g.textAlign='center';g.fillText('KOMUNIKATY ADMINISTRACJI',w/2,26);
    const cols=['#f4f0e0','#f2e08a','#bcd8ee','#f2b8c8','#cfe8c0'];
    for(let i=0;i<9;i++){const x=10+(i%3)*80+R()*8,y=40+Math.floor(i/3)*38+R()*4,pw=58+R()*12,ph=30+R()*4;g.fillStyle=cols[Math.floor(R()*5)];g.fillRect(x,y,pw,ph);g.fillStyle='#1a1410';for(let l=0;l<4;l++)g.fillRect(x+4,y+5+l*6,pw-8-R()*14,1.5);g.fillStyle='#c01818';g.fillRect(x+pw/2-1,y-1,3,3)}
  });
  for(const sx of [-1,1])P.cyl(.035,.035,2.1,sx*.72,0,0,0x555a5e,{seg:6,edges:false});
  P.box(1.6,1.1,.1,0,1.0,0,fr);
  P.decal(tex,1.42,.92,0,1.55,.056);
  P.box(1.7,.06,.3,0,2.06,.1,shade(fr,.7),{rx:.12,edges:false});
  const gl=atlas('estate:gablota-glare',64,64,(g,w,h)=>{g.fillStyle='#e8f6ff';g.beginPath();g.moveTo(8,0);g.lineTo(26,0);g.lineTo(6,h);g.lineTo(-12,h);g.fill();g.beginPath();g.moveTo(34,0);g.lineTo(42,0);g.lineTo(22,h);g.lineTo(14,h);g.fill()});
  P.decal(gl,1.42,.92,0,1.55,.062);
  P.colBox(1.7,.2,2.1);
});

/* ============================ ANTENA SATELITARNA ============================ */
// Talerz offsetowy ø~80 cm na wysięgniku, konwerter LNB; wariant „sciana” (uchwyt na ścianie) i „balkon” (zaciśnięty na balustradzie).
defProp('antenaSat',{name:'Antena satelitarna',cat:'osiedle',dims:[1.3,1.1,.8],variants:['sciana','balkon'],cover:false,
  note:'Wariant balkon: odcinek balustrady 1,2 m z talerzem. Kolor talerza wg seeda.'},(P,o,r)=>{
  const v=o.variant||'sciana',col=r.pick([0xe8e8e0,0xcfd2d4,0xb8bcc0,0x8a8e90]);
  if(v==='sciana'){
    P.box(.5,.7,.04,0,0,0,0xa8a498,{edges:false});
    P.box(.08,.08,.28,0,.55,.14,0x555a5e,{edges:false,small:true});P.box(.06,.5,.06,0,.2,.2,0x555a5e,{edges:false,small:true});
    dish(P,0,.9,.4,col,.4,0);
  }else{
    P.box(1.2,.05,.1,0,.95,0,0x555a5e,{edges:false});P.box(1.2,.05,.1,0,0,0,0x555a5e,{edges:false});
    for(let i=0;i<7;i++)P.box(.025,.95,.025,-.55+i*.185,0,0,0x555a5e,{edges:false,small:true});
    P.box(.12,.1,.12,.35,.98,.0,0x3a3d40,{edges:false,small:true});
    P.box(.04,.4,.04,.35,1.0,.02,0x555a5e,{edges:false,small:true});
    dish(P,.35,1.3,.35,col,.4,0);
  }
  P.colBox(1.2,.3,1.1,0,0);
});

/* ============================ SUSZARKA NA PRANIE ============================ */
// parasolowa (obrotowa, ø~1,9 m, maszt 1,8 m) z praniem; składana (stojak 1,5 x 1,0 x 0,55 m).
defProp('suszarka',{name:'Suszarka na pranie',cat:'osiedle',dims:[2.0,1.9,2.0],variants:['parasolowa','skladana'],cover:false,
  note:'Pranie: kolory wg seeda.'},(P,o,r)=>{
  const v=o.variant||'parasolowa',cl=()=>r.pick([0xe8e0d0,0xd0342a,0x3a8ad2,0xf0c030,0x4f9a5a,0xd878a8,0xf4f4f4]);
  if(v==='parasolowa'){
    const lines=atlas('estate:susz',128,128,(g,w,h)=>{g.strokeStyle='rgba(20,15,10,.9)';g.lineWidth=2.5;for(let a=0;a<4;a++){const t=a*PI/4;g.beginPath();g.moveTo(w/2-Math.cos(t)*62,h/2-Math.sin(t)*62);g.lineTo(w/2+Math.cos(t)*62,h/2+Math.sin(t)*62);g.stroke()}
      g.lineWidth=1.6;for(const rr of [25,40,55]){g.beginPath();g.arc(w/2,h/2,rr,0,7);g.stroke()}});
    P.cyl(.05,.05,.2,0,0,0,0x555a5e,{seg:6,edges:false});
    P.cyl(.025,.025,1.75,0,.2,0,0x6a6e70,{seg:6,edges:false});
    P.cyl(.07,.05,.12,0,1.75,0,0x333638,{seg:6,edges:false,small:true});
    for(let i=0;i<4;i++)P.add(CYL(.012,.012,2.0,4,true),0,1.78,0,0x6a6e70,{rz:PI/2-.08,ry:i*PI/4,edges:false,small:true});
    P.decal(lines,1.95,1.95,0,1.7,0,{rx:-PI/2});P.decal(lines,1.95,1.95,0,1.7,0,{rx:PI/2});
    for(let i=0;i<7;i++){const a=r.range(0,PI*2),rad=r.range(.55,.9);P.box(.38,.55,.025,Math.cos(a)*rad,1.0,Math.sin(a)*rad,cl(),{ry:a+PI/2,edges:false,small:true})}
    P.colBox(.25,.25,1.9);
  }else{
    for(const sz of [-1,1])for(const sx of [-1,1]){P.add(new THREE.BoxGeometry(.025,1.15,.025),sx*.7,.57,sz*.2,0xe8e8e0,{rx:-sz*.28,edges:false,small:true})}
    for(const y of [1.12,.85,.6,.35])P.box(1.5,.02,.025,0,y,0,0xe8e8e0,{edges:false,small:true});
    for(const sz of [-1,1])P.box(1.5,.02,.025,0,.35+(sz>0?.03:-.03),sz*.2*.5,0xd8d8d0,{edges:false,small:true});
    for(let i=0;i<5;i++)P.box(.36,.5,.02,-.55+i*.28,.62+(i%2)*.27,r.range(-.03,.03),cl(),{edges:false,small:true});
    P.colBox(1.55,.55,1.2);
  }
});

/* ============================ WIATA ROWEROWA ============================ */
// Wiata na rowery 4,2 x 2,0 x 2,3 m: stalowe słupki, dach z poliwęglanu (lekko spadzisty), stojak „grzebień” na 5 kół, rowery wg seeda.
defProp('wiataRowerowa',{name:'Wiata na rowery',cat:'osiedle',dims:[4.4,2.5,2.2],cover:true,note:'0-2 rowery wg seeda; dach przezroczysty-zielony.'},(P,o,r)=>{
  const st=r.pick([0x3a4a5a,0x555a5e,0x3a6a4a]),W=4.2,D=2.0;
  for(const sx of [-1,1])for(const sz of [-1,1])P.box(.08,2.3-(sz>0?.18:0),.08,sx*(W/2-.04),0,sz*(D/2-.04),st,{edges:false});
  P.box(W,.05,.08,0,2.12,D/2-.04,st,{edges:false,small:true});P.box(W,.05,.08,0,2.3,-D/2+.04,st,{edges:false,small:true});
  P.box(W+.1,.04,D+.2,0,2.2,0,0x6fb8a8,{rx:.07,edges:false});
  for(const x of [-W/2+.04,0,W/2-.04])P.box(.05,.05,D,x,2.14,0,st,{rx:.07,edges:false,small:true});
  P.box(W-.1,1.0,.02,0,.25,-D/2+.02,shade(st,1.1),{edges:false,small:true});
  P.box(W-.4,.04,.05,0,.1,.5,st,{edges:false,small:true});
  const xs=[-1.6,-.8,0,.8,1.6];
  for(const x of xs)P.box(.03,.35,.03,x,.1,.5,0x8a8e90,{edges:false,small:true});
  const nb=r.int(0,2),s0=r.int(0,4);for(let i=0;i<nb;i++)bike(P,xs[(s0+i*2)%5],.2,PI/2+r.range(-.15,.15),r.pick([0xc4271f,0x3f6fb0,0x3a8a4a,0xd0a02a]));
  P.col(-W/2,W/2,-D/2,-D/2+.15,2.3);P.col(-W/2,-W/2+.15,-D/2,D/2,2.3);P.col(W/2-.15,W/2,-D/2,D/2,2.3);P.cover=true;
});

/* ============================ BUDKA Z PIWEM ============================ */
// Budka (pawilon handlowy) ~2,8 x 2,2 x 2,4 m z okienkiem sprzedaży, daszkiem w paski, neonem „PIWO”, stolikiem z parasolem i skrzynkami.
defProp('budkaPiwna',{name:'Budka z piwem',cat:'osiedle',dims:[4.6,3.2,4.6],cover:true,
  note:'Neon PIWO mruga (przygaszenie koloru). Stolik z parasolem i 2 krzesłami przed budką.'},(P,o,r)=>{
  const wall=r.pick([0x2f6aa8,0xd89a2a,0x4a8a4a,0xb8372a,0x7a5aa8]),W=2.8,D=2.2,Hh=2.4,zf=D/2,band=0xf4f0e0;
  P.box(W,Hh,D,0,0,0,wall);P.box(W+.04,.2,D+.04,0,0,0,shade(wall,.55),{edges:false});
  P.box(W+.3,.14,D+.3,0,Hh,0,0x3a3a3c);P.box(W+.32,.3,.1,0,Hh-.3,zf+.15,band,{edges:false,small:true});
  P.box(1.9,1.0,.06,0,1.05,zf+.01,0x15110e,{edges:false});
  for(const sx of [-1,1])P.box(.08,1.12,.08,sx*.99,.99,zf+.04,0xe8e0c8,{edges:false,small:true});
  P.box(2.06,.08,.08,0,2.05,zf+.04,0xe8e0c8,{edges:false,small:true});P.box(2.1,.08,.46,0,.97,zf+.25,0x8a6a3a);
  for(const x of [-.4,.4])P.cyl(.025,.03,.22,x,1.05,zf+.3,0xc0c4c6,{seg:6,edges:false,small:true});
  for(let i=0;i<7;i+=1)P.box(.4,.05,.8,-1.2+i*.4,Hh-.55,zf+.46,i%2?band:0xc4271f,{rx:.3,edges:false});
  for(const sx of [-1,1])P.cyl(.025,.025,1.6,sx*1.15,0,zf+.8,0x555a5e,{seg:5,open:true,edges:false,small:true});
  const nt=neonTex('estate:piwo',256,96,(g,w,h)=>{g.fillStyle='#08060c';g.fillRect(0,0,w,h);glowText(g,'PIWO',w/2,h/2+4,FONT(78),'#ffd23a','#fff6c0')});
  P.neon(nt,1.6,.6,0,Hh+.5,zf-.2);
  P.box(.07,.55,.07,-.7,Hh+.14,zf-.3,0x2a2a2c,{edges:false,small:true});P.box(.07,.55,.07,.7,Hh+.14,zf-.3,0x2a2a2c,{edges:false,small:true});
  const menu=atlas('estate:piwo-menu',128,64,(g,w,h)=>{g.fillStyle='#f4f0e0';g.fillRect(0,0,w,h);g.strokeStyle='#c01818';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);g.fillStyle='#1a1410';g.font=FONT(20);g.textAlign='center';g.fillText('ZIMNE PIWO',w/2,24);g.font=FONT(16);g.fillText('BEZ ALKOHOLU NIE',w/2,42);g.fillText('DLA NIELETNICH',w/2,58)});
  P.decal(menu,.9,.45,-.9,.45,zf+.026);
  P.box(.04,1.9,.8,W/2+.012,.15,-.2,0x4a4e52,{edges:false,small:true});
  // stolik z parasolem i krzesłami
  const tx=1.7,tz=zf+1.1;
  P.cyl(.45,.45,.035,tx,.74,tz,0xf0f0ea,{seg:10,edges:false});P.cyl(.03,.03,.74,tx,0,tz,0xf0f0ea,{seg:6,open:true,edges:false,small:true});P.cyl(.22,.22,.03,tx,0,tz,0xf0f0ea,{seg:8,edges:false,small:true});
  P.cyl(.02,.02,2.0,tx,0,tz,0x9a9a92,{seg:5,open:true,edges:false,small:true});
  const um=r.pick([0xd0342a,0xf0c030,0x3a8ad2]);P.cyl(.03,1.1,.32,tx,1.95,tz,um,{seg:8,edges:false});
  for(const a of [-.5,2.6]){const cx=tx+Math.cos(a)*.7,cz=tz+Math.sin(a)*.7;
    P.box(.4,.04,.4,cx,.44,cz,0xf0f0ea,{edges:false,small:true,ry:-a});P.box(.4,.4,.04,cx+Math.cos(a)*.18,.46,cz+Math.sin(a)*.18,0xf0f0ea,{edges:false,small:true,ry:-a+PI/2});
    P.box(.05,.44,.05,cx,0,cz,0xe0e0d8,{edges:false,small:true})}
  const crate=r.pick([0xc4271f,0x2f6aa8]);for(let i=0;i<3;i++)P.box(.5,.25,.35,-1.55,i*.26,zf+.4,i%2?shade(crate,.9):crate,{edges:false,ry:r.range(-.1,.1)});
  for(let i=0;i<3;i++)P.cyl(.035,.04,.2,-1.7+i*.12,.78,zf+.38,0x6a4a1a,{seg:5,edges:false,small:true});
  P.col(-W/2,W/2+.05,-D/2,D/2,Hh);P.col(tx-.55,tx+.55,tz-.55,tz+.55,.8);P.cover=true;
});

/* ============================ TRAFOSTACJA ============================ */
// Stacja transformatorowa kontenerowa/murowana 3,0 x 2,5 x 2,6 m (+ dach dwuspadowy 0,5 m), dwuskrzydłowe drzwi stalowe 1,4 x 2,0 m,
// kratki wentylacyjne, tablice ostrzegawcze „UWAGA! WYSOKIE NAPIĘCIE”, numer stacji.
defProp('stacjaTrafo',{name:'Transformator osiedlowy (trafostacja)',cat:'osiedle',dims:[3.3,3.4,4.3],variants:['beton','ceglana'],cover:true,
  note:'Drzwi ku +Z. Graffiti i rdza wg seeda.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.5)?'beton':'ceglana'),wall=v==='beton'?r.pick([0xb9b5a8,0xaaa69a]):r.pick([0xb2563a,0xa84c34]);
  const W=3.0,D=2.5,Hh=2.6;
  P.box(W+.24,.18,D+.24,0,0,0,0x6e6a60);P.box(W,Hh,D,0,.18,0,wall);
  P.box(W+.1,.1,D+.1,0,Hh+.18,0,shade(wall,.7),{edges:false});
  P.prism([[-W/2-.15,0],[W/2+.15,0],[0,.52]],D+.35,0,Hh+.28,-D/2-.17,0x4a4e50);
  const door=atlas('estate:trafo-d',200,280,(g,w,h)=>{
    g.strokeStyle='rgba(15,12,10,.9)';g.lineWidth=3;g.strokeRect(3,3,w/2-5,h-6);g.strokeRect(w/2+2,3,w/2-5,h-6);
    for(let i=0;i<9;i++){g.fillStyle='rgba(15,12,10,.85)';g.fillRect(16,20+i*7,w/2-32,3);g.fillRect(w/2+16,20+i*7,w/2-32,3)}
    g.fillStyle='rgba(60,60,58,.95)';g.fillRect(w/2-14,h*.5,6,26);g.fillRect(w/2+8,h*.5,6,26);
    g.fillStyle='#f2c21c';g.beginPath();g.moveTo(w*.25,110);g.lineTo(w*.25+28,160);g.lineTo(w*.25-28,160);g.closePath();g.fill();g.lineWidth=3;g.strokeStyle='#111';g.stroke();
    g.fillStyle='#111';g.beginPath();g.moveTo(w*.25+4,120);g.lineTo(w*.25-8,142);g.lineTo(w*.25,142);g.lineTo(w*.25-5,156);g.lineTo(w*.25+10,134);g.lineTo(w*.25+2,134);g.closePath();g.fill();
    g.fillStyle='#f4f0e0';g.fillRect(w*.55,100,w*.4,44);g.strokeStyle='#c01818';g.lineWidth=2;g.strokeRect(w*.55,100,w*.4,44);g.fillStyle='#1a1410';g.font=FONT(15);g.textAlign='center';g.fillText('UWAGA!',w*.75,118);g.font=FONT(11);g.fillText('WYSOKIE NAPIĘCIE',w*.75,130);g.fillText('ZAKAZ WSTĘPU',w*.75,141);
    g.fillStyle='#e8e2c8';g.fillRect(w*.58,200,w*.34,26);g.fillStyle='#1a1410';g.font=FONT(16);g.fillText('TS-'+(14+0),w*.75,218);
  });
  P.box(.7,2.1,.05,-.36,.18,D/2+.025,0x5a6a62,{edges:false});P.box(.7,2.1,.05,.36,.18,D/2+.025,shade(0x5a6a62,.92),{edges:false});
  P.decal(door,1.4,2.0,0,1.23,D/2+.06);
  const lv=atlas('estate:trafo-l',96,64,(g,w,h)=>{g.fillStyle='#1a1410';g.fillRect(0,0,w,h);g.fillStyle='#6a6e70';for(let i=0;i<9;i++)g.fillRect(4,4+i*6.6,w-8,3.6)});
  for(const sx of [-1,1]){P.decal(lv,.8,.55,sx*(W/2+.012),1.6,0,{ry:sx*PI/2});}
  P.decal(lv,.6,.4,-1.0,2.15,D/2+.03);P.decal(lv,.6,.4,1.0,2.15,D/2+.03);
  if(r.chance(.6)){const gk=atlas('estate:trafo-g',160,64,(g,w,h)=>{g.font=FONT(46);g.textAlign='center';g.textBaseline='middle';g.lineWidth=7;g.lineJoin='round';g.strokeStyle='#1a0a2a';g.strokeText('DISCO',w/2,h/2);g.fillStyle='#33d6ff';g.fillText('DISCO',w/2,h/2)});P.decal(gk,1.4,.55,W/2+.02,.75,.4,{ry:PI/2})}
  P.box(.14,.04,2.4,0,0,D/2+.4,0x2a2a2a,{edges:false,small:true});
  P.cyl(.02,.02,2.4,-W/2-.08,.18,-D/2+.2,0x555a5e,{seg:4,open:true,edges:false,small:true});
  P.colBox(W+.24,D+.24,Hh+.7);P.cover=true;
});

/* ============================ MUREK ZE SCHODAMI ============================ */
// Murek oporowy (wys. 1,2 m, gr. 0,4 m) z biegiem schodów 2,0 m szer.: 7 stopni po 0,17 x 0,30 m, policzki skośne, poręcze rurowe 0,9 m.
defProp('murekSchody',{name:'Murek ze schodami',cat:'osiedle',dims:[6.5,2.2,3.6],cover:true,note:'Schody ku +Z (wyjście z terenu wyżej ku -Z). Kolider: cały murek z tarasem i schodami.'},(P,o,r)=>{
  const wall=r.pick([0xa9a59b,0xb6b2a6,0x9a968a]),cap=shade(wall,1.1),n=7,rise=.17,run=.3,H=n*rise;
  for(const sx of [-1,1]){
    P.box(2.2,H,.4,sx*2.1,0,-.2,wall);P.box(2.3,.07,.5,sx*2.1,H,-.2,cap,{edges:false});
  }
  P.box(6.4,H,1.0,0,0,-.9,shade(wall,.85),{edges:false});P.box(6.4,.06,1.0,0,H,-.9,0x6a8a4a,{edges:false});
  for(let i=0;i<n;i++)P.box(2.0,(i+1)*rise,run,0,0,run/2+(n-1-i)*run,shade(wall,1.05-.01*(i%2)));
  for(const sx of [-1,1]){
    P.add(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(-n*run,0),new THREE.Vector2(0,H)]),{depth:.22,bevelEnabled:false}),sx>0?1.0:-1.22,0,0,wall,{ry:PI/2,edges:false});
    const ang=Math.atan2(n*run,H),ln=Math.hypot(n*run,H);
    P.add(CYL(.025,.025,ln,5,true),sx*1.11,H/2+.92,n*run/2,0x4a5a6a,{rx:-ang,edges:false,small:true});
    for(const t of [.05,.5,.95])P.box(.04,.9,.04,sx*1.11,H*(1-t),t*n*run,0x4a5a6a,{edges:false,small:true});
  }
  const gr=atlas('estate:murek-graf',192,80,(g,w,h)=>{g.font=FONT(54);g.textAlign='center';g.textBaseline='middle';g.lineWidth=8;g.lineJoin='round';g.strokeStyle='#1a1410';g.strokeText('ŁÓDŹ',w/2,h/2);g.fillStyle='#ffd400';g.fillText('ŁÓDŹ',w/2,h/2)});
  if(r.chance(.6))P.decal(gr,1.5,.62,-2.1,.65,.012,{});
  P.col(-3.2,3.2,-1.4,0,H+.1);P.col(-1.1,1.1,0,n*run,H);
  P.cover=true;
});

/* ============================ PLAC Z KOSTKI BRUKOWEJ ============================ */
// Plac wybrukowany kostką granitową 10x10 cm (płaty 2x2 m z atlasu, część wykruszona), obrzeże betonowe 12x15 cm, studzienka, kępy chwastów.
defProp('placKostka',{name:'Plac z kostki brukowej',cat:'osiedle',dims:[8.3,.2,8.3],variants:['szara','czerwona'],cover:false,
  note:'opts.size = bok [m] (zaokrąglany do 2 m). Bez koliderów. Decale leżą 5 cm nad gruntem.'},(P,o,r)=>{
  const pal=(o.variant||r.pick(['szara','czerwona']))==='czerwona'?1:0,N=Math.max(1,Math.round((o.size||8)/2)),S=N*2;
  const tex=(k)=>atlas('estate:kostka'+pal+k,256,256,(g,w,h)=>{
    const R=lcg(100+pal*7+k*3),base=pal?['#8f5a48','#9a6450','#7d4c3c','#a47060']:['#8c8f90','#7c8082','#9a9c9b','#6f7374','#a4a29a'],s=12.8;
    g.fillStyle=pal?'#3a2a24':'#3c3f40';g.fillRect(0,0,w,h);
    for(let row=0;row<21;row++){const off=(row%2)*s/2;for(let c=-1;c<21;c++){
      if(k===1&&((row>4&&row<9&&c>8&&c<14)||(row>14&&c<4))){g.fillStyle=R()<.5?'#5a4a30':'#3d5a2c';g.fillRect(c*s+off,row*s,s-1,s-1);continue}
      g.fillStyle=base[Math.floor(R()*base.length)];g.fillRect(c*s+off+1,row*s+1,s-2.5,s-2.5)}}
    g.fillStyle='rgba(20,18,14,.18)';for(let i=0;i<6;i++){g.beginPath();g.ellipse(R()*w,R()*h,14+R()*20,8+R()*10,R()*3,0,7);g.fill()}
  });
  P.box(S,.04,S,0,0,0,0x3c3f40,{edges:false});
  for(let ix=0;ix<N;ix++)for(let iz=0;iz<N;iz++)P.decal(tex(r.chance(.25)?1:0),2,2,-S/2+1+ix*2,.045,-S/2+1+iz*2,{rx:-PI/2,rz:r.int(0,3)*PI/2});
  const cu=0xa9a59b;
  P.box(S+.24,.15,.12,0,0,S/2+.06,cu,{edges:false});P.box(S+.24,.15,.12,0,0,-S/2-.06,cu,{edges:false});P.box(.12,.15,S,S/2+.06,0,0,cu,{edges:false});P.box(.12,.15,S,-S/2-.06,0,0,cu,{edges:false});
  const mh=atlas('estate:wlaz',64,64,(g,w,h)=>{g.fillStyle='#2a2a2a';g.beginPath();g.arc(32,32,30,0,7);g.fill();g.strokeStyle='#6a6a62';g.lineWidth=2;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(8,32+i*7);g.lineTo(56,32+i*7);g.stroke()}g.beginPath();g.arc(32,32,26,0,7);g.stroke()});
  P.decal(mh,.7,.7,r.range(-S/3,S/3),.05,r.range(-S/3,S/3),{rx:-PI/2});
  for(let i=0;i<5;i++)P.box(.1,.14,.1,r.pick([-1,1])*(S/2-.02)*r.range(.2,1),0,r.pick([-1,1])*(S/2+.04),0x4a7a32,{rz:r.range(-.3,.3),edges:false,small:true});
});
