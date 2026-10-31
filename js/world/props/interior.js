// Wnętrza: Kasyno „Złoty Bandyta” (poziom 3): automaty, stoły, bar, parkiet, scena DJ-a, loże, lustra, kasa, sejf, winda,
// kuchnia, zaplecze, dywany, żyrandol, rośliny, CCTV, gaśnica, WYJŚCIE. Przód rekwizytu patrzy w +Z, origin = środek podstawy
// (rekwizyty ścienne: origin przy ścianie, plecami do z=0, wystają w +Z). cat:'wnetrza'.
// Wymiary rzeczywiste (źródła: katalogi automatów typu Novomatic/Bally, regulaminowy stół ruletki 2,6x1,2 m, blat kuchenny 0,6 m
// głębokości / 0,9 m wysokości wg EN 1116, bar 1,1 m, stołek 0,75 m, winda osobowa 1,1x1,4 m w świetle -> tu 1,6x1,5 m, sejf bankowy).
// Neony/ekrany: MeshBasic (P.neon), mruganie = przygaszenie koloru, nigdy visible=false. Lustra: kolor + smugi (bez odbić).
// Budżety: duże <= 2500 trójkątów, drobne <= 600. Kolidery h >= 1,7 m = pełna osłona (nav.js).
import {defProp,atlas,neonTex,glowText,shade,mixc} from './lib.js';
import {DS} from '../../core/ds.js';
import {scene} from '../../render/renderer.js';
import {world} from '../state.js';

const PI=Math.PI,C='wnetrza';
const FONT=s=>s+'px Bangers, Impact, sans-serif';
const GOLD=0xd9a82a,BRASS=0xb8892a,WOOD=0x4a2a18,WOOD2=0x6b3e22,FELT=0x0e6a3a,RED=0x8a1624,STEEL=0xb4b9bd,STEELD=0x7e858a,DARK=0x1a1614,MIRROR=0xa6d2dc,CREAM=0xe9dfc4;
const S=(P,col,x,y,z,w,h,d,o)=>P.box(w,h,d,x,y,z,col,Object.assign({edges:false},o));
/** Cienki pręt/walec w zadanym kierunku osi. ax: 'x'|'y'|'z'. */
function rod(P,ax,r,len,x,y,z,col,seg=6,o={}){
  const rz=ax==='x'?PI/2:0,rx=ax==='z'?PI/2:0;
  return P.cylc(r,r,len,x,y,z,col,Object.assign({seg,rx,rz,edges:false,small:true},o));
}
/** Butelka: korpus + szyjka (otwarta u góry), do półek i skrzynek. */
function bottle(P,x,y,z,col,h=.2){
  P.cyl(.032,.032,h,x,y,z,col,{seg:5,edges:false,small:true});
  P.cyl(.011,.02,h*.55,x,y+h,z,col,{seg:4,open:true,edges:false,small:true});
}
/** Krzesło/stołek barowy z oparciem: (cx,cz) w świecie rekwizytu, ry obrót, front lokalny +Z. */
function chair(P,cx,cz,ry,col,seatCol=RED){
  const c=Math.cos(ry),s=Math.sin(ry),tf=(lx,lz)=>[cx+lx*c+lz*s,cz-lx*s+lz*c];
  const add=(w,h,d,lx,y,lz,cc)=>{const [px,pz]=tf(lx,lz);P.box(w,h,d,px,y,pz,cc,{ry,edges:false,small:true})};
  add(.44,.07,.44,0,.43,0,seatCol);
  for(const sx of [-.19,.19])for(const sz of [-.19,.19])add(.035,.43,.035,sx,0,sz,col);
  add(.44,.38,.05,0,.5,-.2,seatCol);
}

/* ============================ AUTOMAT ============================ */
// Jednoręki bandyta: 0,62 m szer., 1,85 m wys., 0,66 m głęb. + dźwignia (stronniczo 0,80 m szer.).
// Ekran 3 bębnów (MeshBasic), marquee mruga. Warianty: zloty, wisnie, siodemki. Pełna osłona (h 1,85).
const SLOT={
  zloty:{body:0x222026,trim:GOLD,name:'ZŁOTY BANDYTA',c1:'#ffd23c',c2:'#ff3b8b',syms:['7','BAR','7']},
  wisnie:{body:0x7a1620,trim:0xe8d8a0,name:'WIŚNIE',c1:'#ff4a5a',c2:'#ffe14a',syms:['●●','●●','●●']},
  siodemki:{body:0x1c2f66,trim:0xc0c8d8,name:'SIÓDEMKI 777',c1:'#59d4ff',c2:'#ff9c3b',syms:['7','7','7']},
};
defProp('automatBandyta',{name:'Automat jednoręki bandyta',cat:C,dims:[.82,1.85,.68],cover:true,variants:['zloty','wisnie','siodemki'],
  note:'Ekran 3 bębnów emisyjny (mruga marquee). Lewa/prawa dźwignia po stronie +X. Seed: wytarcia i wariant gdy brak variant.'},(P,o,r)=>{
  const v=SLOT[o.variant]?o.variant:r.pick(Object.keys(SLOT)),V=SLOT[v];
  S(P,DARK,0,0,0,.58,.1,.6);
  P.box(.62,.76,.66,0,.1,0,V.body,{edges:true});
  for(const sx of [-1,1])S(P,V.trim,sx*.3,.1,.33,.03,.76,.03);
  S(P,V.trim,0,.84,.335,.6,.03,.03);
  P.add(new THREE.BoxGeometry(.58,.05,.3),0,.93,.28,shade(V.body,.6),{rx:.4,edges:false});
  S(P,0x0c0c0c,0,.2,.36,.34,.1,.06);
  S(P,0x9a9ca0,0,.22,.4,.28,.012,.04);
  const btn=[0xd0342a,0xf0c030,0x3ac04a,0x3a8ad2,0xd0342a];
  for(let i=0;i<5;i++)P.cylc(.024,.024,.02,-.2+i*.1,.97,.34,btn[i],{seg:6,edges:false,small:true,rx:.4});
  P.box(.62,.63,.5,0,1.0,-.08,V.body,{edges:true});
  S(P,V.trim,0,1.04,.185,.56,.58,.03);
  const scr=neonTex('wn:slot:'+v,128,160,(g,w,h)=>{
    g.fillStyle='#07040c';g.fillRect(0,0,w,h);
    for(let i=0;i<3;i++){g.fillStyle='#f6efd8';g.fillRect(8+i*40,28,36,92);g.fillStyle='#1a1410';g.font=FONT(i===1&&v==='zloty'?24:36);g.textAlign='center';g.textBaseline='middle';
      if(v==='wisnie'){g.fillStyle='#d01020';g.beginPath();g.arc(26+i*40,64,9,0,7);g.arc(26+i*40,88,9,0,7);g.fill()}else g.fillText(V.syms[i],26+i*40,75)}
    g.strokeStyle=V.c2;g.lineWidth=3;g.beginPath();g.moveTo(4,74);g.lineTo(w-4,74);g.stroke();
    g.fillStyle=V.c1;g.font=FONT(18);g.textAlign='center';g.fillText('WYGRANA',w/2,14);g.font=FONT(16);g.fillStyle='#fff';g.fillText('x'+(v==='siodemki'?777:50),w/2,146);
  });
  P.neon(scr,.5,.55,0,1.33,.2+.004,{static:true});
  S(P,V.body,0,1.63,-.08,.64,.22,.5);
  const mq=neonTex('wn:slotm:'+v,256,64,(g,w,h)=>{g.fillStyle='#10060a';g.fillRect(0,0,w,h);g.strokeStyle=V.c1;g.lineWidth=4;g.strokeRect(3,3,w-6,h-6);glowText(g,V.name,w/2,h/2+2,FONT(v==='zloty'?36:40),V.c1)});
  P.neon(mq,.56,.17,0,1.74,.17+.004);
  for(const sx of [-1,1])P.sph(.035,sx*.26,1.88,0,r.pick([0xffe14a,0xff4a5a,0x59d4ff]),{ws:5,hs:4,hull:0,basic:true});
  P.cylc(.018,.018,.08,.335,.7,0,STEEL,{seg:6,rz:PI/2,edges:false,small:true});
  P.add(new THREE.CylinderGeometry(.013,.013,.42,5),.37,.9,.0,STEEL,{rx:-.28,edges:false,small:true});
  P.sph(.045,.37,1.1,-.06,0xd0201a,{ws:6,hs:4,hull:0,edges:false,small:true});
  P.colBox(.64,.68,1.85,0,0);
});

/* ============================ RULETKA ============================ */
// Stół ruletki: 2,60 x 1,20 m, blat 0,95 m, koło ø0,9 m wbudowane z lewej strony, sukno z układem liczb (decal).
defProp('stolRuletki',{name:'Stół do ruletki',cat:C,dims:[2.6,1.08,1.2],cover:false,note:'Koło po stronie -X. Kolider niski (h 0,96): można się chować w przysiadzie.'},(P,o,r)=>{
  const wood=r.pick([WOOD,WOOD2]);
  P.box(2.5,.82,1.08,0,0,0,wood,{edges:true});
  S(P,GOLD,0,.1,.55,2.4,.03,.02);
  P.box(2.6,.13,1.2,0,.82,0,shade(wood,.7),{edges:true});
  S(P,FELT,0,.95,0,2.4,.02,1.0);
  const lay=atlas('wn:ruletka',256,128,(g,w,h)=>{
    g.fillStyle='#0e6a3a';g.fillRect(0,0,w,h);g.strokeStyle='#f1e7c3';g.lineWidth=2;g.strokeRect(4,4,w-8,h-8);
    g.font=FONT(15);g.textAlign='center';g.textBaseline='middle';
    for(let i=0;i<12;i++)for(let j=0;j<3;j++){const n=1+i*3+(2-j);const rd=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);
      g.fillStyle=rd?'#b8141c':'#0a0a0a';g.fillRect(20+i*17.5,20+j*22,16,20);g.fillStyle='#fff';g.fillText(n,28+i*17.5,31+j*22)}
    g.fillStyle='#0a0a0a';g.fillRect(8,30,10,40);g.fillStyle='#e8d8a0';g.fillText('0',13,50);
    g.fillStyle='#f1e7c3';g.font=FONT(12);g.fillText('1-12',66,98);g.fillText('13-24',128,98);g.fillText('25-36',190,98);
  });
  P.decal(lay,1.3,.65,.38,.963,.0,{rx:-PI/2});
  const wx=-.85;
  P.lathe([[0,0],[.43,0],[.46,.06],[.47,.1],[.4,.1],[.3,.05],[0,.05]],14,wx,.96,0,WOOD2);
  P.cyl(.36,.36,.012,wx,1.012,0,0x7a1018,{seg:16,edges:false,small:true});
  P.cyl(.27,.27,.012,wx,1.02,0,0x0c0c0c,{seg:16,edges:false,small:true});
  P.cyl(.2,.2,.012,wx,1.03,0,0xcdb06a,{seg:14,edges:false,small:true});
  P.cyl(.012,.06,.12,wx,1.04,0,GOLD,{seg:6,edges:false,small:true});
  P.sph(.014,wx+.31,1.05,.0,0xf4f0e0,{ws:5,hs:4,hull:0,edges:false,small:true});
  for(let i=0;i<4;i++)P.cyl(.03,.03,.03+i*.012,.1+r.range(0,1),.97,r.range(-.35,.35),r.pick([0xd01e1e,0x1e6ad0,0xf0c030,0x111111]),{seg:6,edges:false,small:true});
  P.colBox(2.6,1.2,.96);
});

/* ============================ STÓŁ KARCIANY ============================ */
// Blackjack: półokrągły 2,0 x 1,0 m (blat 0,92 m), 4 krzesła; poker: owal 2,3 x 1,25 m, 6 krzeseł.
defProp('stolKarciany',{name:'Stół do blackjacka/pokera',cat:C,dims:[2.8,1.0,1.85],dimsV:{blackjack:[2.8,1.0,1.85],poker:[3.95,1.0,2.4]},variants:['blackjack','poker'],cover:false,
  note:'Dealer za płaską stroną (-Z). Krzesła w zestawie. Kolider tylko na blacie.'},(P,o,r)=>{
  const v=o.variant||r.pick(['blackjack','poker']),wood=r.pick([WOOD,WOOD2]),cc=[0xd01e1e,0xf0f0f0,0x1e6ad0,0x111111,0xf0c030];
  if(v==='blackjack'){
    const half=(rad,h,y,col,e=true)=>P.add(new THREE.CylinderGeometry(rad,rad,h,18,1,false,-PI/2,PI),0,y+h/2,0,col,{edges:e});
    half(.98,.8,0,wood);half(1.0,.13,.8,shade(wood,.7));half(.88,.02,.93,FELT,false);
    P.box(2,.8,.04,0,0,0,wood,{edges:false});P.box(2.0,.13,.06,0,.8,-.03,shade(wood,.7),{edges:false});S(P,FELT,0,.93,-.12,1.76,.02,.2);
    const ar=[-.95,-.5,-.17,.17,.5,.95];
    for(let i=0;i<4;i++){const a=[-.9,-.3,.3,.9][i],px=Math.sin(a)*1.4,pz=Math.cos(a)*1.4;chair(P,px,pz,Math.atan2(-px,-pz),STEELD,RED)}
    for(let i=0;i<4;i++){const a=[-.9,-.3,.3,.9][i];S(P,0xf4f0e0,Math.sin(a)*.62,.945,Math.cos(a)*.62,.07,.004,.1,{ry:-a,small:true});
      P.cyl(.025,.025,.03+i*.01,Math.sin(a)*.7+.07,.945,Math.cos(a)*.7,cc[i],{seg:6,edges:false,small:true})}
    P.col(-1,1,-.05,1.0,.96);
  }else{
    P.add(new THREE.CylinderGeometry(1,1,.8,20),0,.4,0,wood,{sx:1.1,sz:.6,edges:false,hull:.02});
    P.add(new THREE.CylinderGeometry(1,1,.13,20),0,.865,0,shade(wood,.7),{sx:1.15,sz:.62,edges:false,hull:.02});
    P.add(new THREE.CylinderGeometry(1,1,.02,20),0,.94,0,FELT,{sx:1.02,sz:.52,edges:false});
    for(let i=0;i<6;i++){const a=i/6*PI*2+.5,px=Math.sin(a)*1.75,pz=Math.cos(a)*1.0;chair(P,px,pz,Math.atan2(-px,-pz),STEELD,r.pick([RED,0x1c2f66]));
      P.cyl(.03,.03,.03+(i%3)*.012,Math.sin(a)*.75,.95,Math.cos(a)*.42,cc[i%5],{seg:6,edges:false,small:true})}
    P.col(-1.2,1.2,-.68,.68,.96);
  }
});

/* ============================ BAR ============================ */
// Lada barowa: 3,6 m dł., blat 1,07 m (norma 1,1 m), głęb. 0,78 m, podnóżek mosiężny, listwa LED. Gdzie stołki: 'stolekBarowy'.
defProp('barLada',{name:'Lada barowa',cat:C,dims:[3.6,1.1,.85],cover:false,note:'Klient po stronie +Z. Seed: długość boazerii, kolor listwy.'},(P,o,r)=>{
  const L=o.len||3.6,wood=r.pick([WOOD,0x3a2016]);
  P.box(L-.1,1.0,.6,0,0,-.02,wood,{edges:true});
  for(let x=-L/2+.2;x<L/2-.1;x+=.3)S(P,shade(wood,1.35),x,.12,.285,.05,.76,.02);
  P.box(L,.07,.78,0,1.0,.04,shade(wood,.55),{edges:true});
  S(P,GOLD,0,.98,.32,L-.1,.025,.02);
  rod(P,'x',.025,L-.2,0,.17,.46,BRASS);
  for(let x=-L/2+.4;x<L/2;x+=1.0)S(P,BRASS,x,.02,.4,.04,.15,.04,{small:true});
  const c=r.pick(['#ff3b8b','#59d4ff','#ffe14a']);
  const led=neonTex('wn:bar:led'+c,256,16,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,c);gr.addColorStop(.5,'#fff');gr.addColorStop(1,c);g.fillStyle=gr;g.fillRect(0,2,w,h-4)});
  P.neon(led,L-.4,.04,0,.9,.296+.012);
  S(P,0x0c0c0c,.8,1.07,.05,.5,.005,.3,{small:true});
  for(let i=0;i<3;i++)P.cyl(.03,.026,.1,-L/2+.6+i*.9+r.range(-.2,.2),1.07,r.range(-.1,.2),0xd8e8e8,{seg:6,edges:false,small:true});
  P.colBox(L,.78,1.1,0,.04);
});

defProp('stolekBarowy',{name:'Stołek barowy',cat:C,dims:[.4,.78,.4],cover:false,note:'Pod instancing (DS.props.instance). Siedzisko 0,75 m.',variants:null},(P,o,r)=>{
  const col=o.color||r.pick([RED,0x1c2f66,0x1d4a2a,0x222222]);
  P.cyl(.2,.22,.03,0,0,0,STEELD,{seg:10,edges:false});
  P.cyl(.025,.025,.62,0,.03,0,STEEL,{seg:6,edges:false});
  P.cylc(.15,.15,.012,0,.3,0,STEEL,{seg:10,rx:0,edges:false,small:true});
  P.cyl(.18,.18,.07,0,.68,0,col,{seg:10,edges:false,hull:.02});
  P.cyl(.16,.18,.03,0,.65,0,STEELD,{seg:10,edges:false,small:true});
  P.colBox(.36,.36,.78);
});

// Półki z butelkami za barem: 3,4 x 2,3 x 0,45 m, 3 półki, lustro z tyłu, podświetlenie LED.
defProp('barPolki',{name:'Półki z butelkami',cat:C,dims:[3.4,2.3,.45],cover:false,
  note:'Przy ścianie (plecy w -Z). 36 butelek (kolor/ułożenie z seeda). Półki nie dają osłony (bez koliderów) – za ladą.'},(P,o,r)=>{
  const W=3.4,wood=WOOD;
  S(P,MIRROR,0,.3,-.2,W,1.9,.03);
  P.box(W+.1,.3,.45,0,0,0,wood,{edges:true});
  P.box(W+.1,.08,.46,0,2.18,.0,wood,{edges:true});
  for(const sx of [-1,1])S(P,wood,sx*(W/2+.02),.3,-.02,.06,1.9,.4);
  const cols=[0x2a6b2f,0x7a4a1a,0xd8e8e8,0x9a1c1c,0xe0b030,0x2a4a8a,0x3a1a10];
  const led=neonTex('wn:polki:led',256,16,(g,w,h)=>{g.fillStyle='#ffd8a0';g.fillRect(0,3,w,h-6)});
  for(let k=0;k<3;k++){
    const y=.72+k*.52;
    S(P,shade(wood,1.2),0,y-.03,.0,W,.04,.36);
    for(let i=0;i<12;i++){if(r.chance(.08))continue;bottle(P,-W/2+.2+i*(W-.4)/11,y,r.range(-.07,.05),r.pick(cols),r.range(.18,.26))}
    P.neon(led,W-.2,.025,0,y+.35,.12,{static:true});
  }
  const nm=neonTex('wn:polki:sign',256,64,(g,w,h)=>glowText(g,'BAR 24H',w/2,h/2,FONT(46),'#ff3b8b'));
  P.neon(nm,.9,.22,0,2.1,.24);
});

/* ============================ PARKIET ============================ */
// Parkiet taneczny: domyślnie 6 x 6 m, płyty 1 m w kratkę świecące (jedna płaszczyzna MeshBasic = 2 trójkąty, mruga całością).
defProp('parkiet',{name:'Parkiet taneczny',cat:C,dims:[6.2,.06,6.2],cover:false,
  note:'Opcje: w,d (m, domyślnie 6x6). Emisja przez neon (mruganie przez kolor). Bez koliderów.'},(P,o,r)=>{
  const w=o.w||6,d=o.d||6,pal=r.pick([['#ff3b8b','#59d4ff'],['#ffe14a','#a855ff'],['#3bff9c','#ff6a3b']]);
  const tex=neonTex('wn:parkiet:'+w+'x'+d+pal.join(''),Math.min(64*w,512),Math.min(64*d,512),(g,cw,ch)=>{
    const tw=cw/w,th=ch/d;
    for(let i=0;i<w;i++)for(let j=0;j<d;j++){const c=pal[(i+j)%2];g.fillStyle=c;g.fillRect(i*tw,j*th,tw,th);
      const gr=g.createRadialGradient(i*tw+tw/2,j*th+th/2,2,i*tw+tw/2,j*th+th/2,tw*.7);gr.addColorStop(0,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(0,0,0,.1)');g.fillStyle=gr;g.fillRect(i*tw,j*th,tw,th)}
    g.fillStyle='#120a14';for(let i=0;i<=w;i++)g.fillRect(i*tw-1.5,0,3,ch);for(let j=0;j<=d;j++)g.fillRect(0,j*th-1.5,cw,3);
  });
  P.box(w+.2,.04,d+.2,0,0,0,0x1a1218,{edges:false});
  P.neon(tex,w,d,0,.045,0,{rx:-PI/2});
  for(const [sx,sz,bw,bd] of [[0,1,w+.2,.1],[0,-1,w+.2,.1],[1,0,.1,d],[-1,0,.1,d]])S(P,BRASS,sx*(w/2+.1),0,sz*(d/2+.1),bw,.06,bd,{small:true});
});

/* ============================ KULA DISCO ============================ */
// Kula lustrzana ø0,7 m (ikosaedr 320 ścian) na pręcie 0,8 m z silniczkiem; y=0 = dół kuli.
defProp('kulaDisco',{name:'Kula disco',cat:C,dims:[.7,1.65,.7],cover:false,note:'opts.drop = długość zawiesia (m). Obrót: ustaw obiekt w poziomie (rotation.y) – to jedna siatka.'},(P,o,r)=>{
  const d=o.drop||.8;
  P.add(new THREE.IcosahedronGeometry(.35,1),0,.35,0,0xcfdde8,{hull:.02});
  P.cyl(.015,.015,d,0,.7,0,STEELD,{seg:5,edges:false,small:true});
  P.cyl(.07,.07,.1,0,.7+d,0,0x222222,{seg:8,edges:false,small:true});
  P.cyl(.04,.1,.05,0,.7+d+.1,0,STEELD,{seg:8,edges:false,small:true});
  for(let i=0;i<6;i++){const a=i*PI/3;P.sph(.03,Math.sin(a)*.32,.35+Math.cos(a*2)*.18,Math.cos(a)*.32,0xffffff,{ws:4,hs:3,hull:0,basic:true})}
});

/* ============================ SCENA DJ-a ============================ */
// Podest 4,0 x 0,35 x 2,2 m, konsoleta 1,7 x 1,0 x 0,7 m (2 gramofony + mikser), 2 kolumny 0,6 x 1,3 x 0,5 m, neon DJ.
defProp('scenaDJ',{name:'Scena DJ-a',cat:C,dims:[4.0,2.55,2.2],cover:false,note:'Przód w +Z. Konsoleta (h 1,0) i kolumny (h 1,3) mają kolidery; podest h 0,35. Neon DJ + listwa LED mrugają.'},(P,o,r)=>{
  P.box(4,.35,2.2,0,0,0,0x1a1520,{edges:true});
  const led=neonTex('wn:dj:led',256,16,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#a855ff');gr.addColorStop(.5,'#59d4ff');gr.addColorStop(1,'#ff3b8b');g.fillStyle=gr;g.fillRect(0,2,w,h-4)});
  P.neon(led,3.8,.05,0,.18,1.1+.012);
  P.box(1.7,.95,.7,0,.35,-.55,0x24202a,{edges:true});
  S(P,0x0c0c0c,0,1.3,-.55,1.76,.03,.76);
  for(const sx of [-.55,.55]){P.cyl(.2,.2,.02,sx,1.33,-.5,0x151515,{seg:14,edges:false,small:true});P.cyl(.18,.18,.01,sx,1.35,-.5,0x8a1018,{seg:14,edges:false,small:true})}
  S(P,0x333038,0,1.33,-.5,.4,.08,.5);
  for(let i=0;i<4;i++)P.cylc(.015,.015,.03,-.12+i*.08,1.4,-.5,r.pick([0xff3b8b,0x59d4ff,0xffe14a]),{seg:5,edges:false,small:true,basic:true});
  S(P,0x333038,0,1.05,-.2,1.5,.1,.04);
  for(const sx of [-1,1]){
    P.box(.6,1.3,.5,sx*1.55,.35,-.5,0x141414,{edges:true});
    P.cylc(.2,.2,.03,sx*1.55,.85,-.24,0x2a2a2a,{seg:12,rx:PI/2,edges:false,small:true});
    P.cylc(.09,.09,.03,sx*1.55,1.4,-.24,0x2a2a2a,{seg:10,rx:PI/2,edges:false,small:true});
    P.cylc(.05,.05,.02,sx*1.55,.85,-.23,STEELD,{seg:8,rx:PI/2,edges:false,small:true});
  }
  S(P,0x15101a,0,1.65,-1.02,3.6,.9,.06);
  const dj=neonTex('wn:dj:sign',256,128,(g,w,h)=>{g.fillStyle='#07040c';g.fillRect(0,0,w,h);glowText(g,'DJ',w/2,h/2+4,FONT(110),'#59d4ff')});
  P.neon(dj,1.4,.7,0,2.05,-.98);
  P.col(-2,2,-1.1,1.1,.35);P.col(-.88,.88,-.9,-.2,1.0);P.col(-1.9,-1.2,-.8,-.2,1.65);P.col(1.2,1.9,-.8,-.2,1.65);
});

/* ============================ KANAPY / LOŻE ============================ */
// Kanapa 2,0 x 0,85 x 0,9 m (siedzisko 0,45 m); loża: łuk 2,8 x 1,0 x 1,5 m ze stolikiem.
defProp('kanapaLoza',{name:'Kanapa / loża',cat:C,dims:[2.0,.9,.9],dimsV:{kanapa:[2.0,.93,.86],loza:[2.9,1.0,1.8]},variants:['kanapa','loza'],cover:false,
  note:'Pluszowy welur (kolor z seeda), złote nóżki. Loża wokół stolika; kolider h 0,9 – niska osłona.'},(P,o,r)=>{
  const v=o.variant||r.pick(['kanapa','loza']),col=o.color||r.pick([RED,0x1c2f66,0x1d4a2a,0x4a1a5a]);
  if(v==='kanapa'){
    for(const sx of [-1,1])for(const sz of [-1,1])P.cyl(.025,.035,.12,sx*.9,0,sz*.35,GOLD,{seg:5,edges:false,small:true});
    P.box(2.0,.3,.85,0,.12,0,col,{edges:true});
    P.box(1.9,.18,.64,0,.42,.1,shade(col,1.15),{edges:false});
    P.box(2.0,.5,.22,0,.42,-.31,col,{edges:true,rx:-.08});
    for(const sx of [-1,1])P.box(.16,.34,.85,sx*.92,.42,0,shade(col,.9),{edges:true});
    for(let i=0;i<5;i++)S(P,GOLD,-.7+i*.35,.7,-.42,.03,.03,.03,{small:true});
    P.colBox(2.0,.9,.9);
  }else{
    const R=1.15;
    for(let i=0;i<9;i++){const a=-PI*.46+i*(PI*.92/8),sx=Math.sin(a),cz=-Math.cos(a),x=sx*R,z=cz*R+.45,ry=PI-a;
      P.box(.46,.42,.5,x,0,z,shade(col,.9),{edges:false,ry});P.box(.4,.1,.46,x,.42,z,shade(col,1.15),{edges:false,ry,small:true});
      P.box(.48,.95,.16,x+sx*.28,.0,z+cz*.28,col,{edges:false,ry})}    P.cyl(.4,.4,.04,0,.6,.45,0x1a1014,{seg:12,edges:false});P.cyl(.05,.07,.58,0,.04,.45,GOLD,{seg:6,edges:false});
    P.colBox(2.9,1.65,.9,0,0);
  }
});

/* ============================ STOLIK KOKTAJLOWY ============================ */
// Wysoki stolik ø0,6 m, h 1,05 m, z świeczką-lampką i szklankami.
defProp('stolikKoktajlowy',{name:'Stolik koktajlowy',cat:C,dims:[.62,1.15,.62],cover:false,note:'Pod instancing. Lampka stołowa (MeshBasic) i szklanki wg seeda.'},(P,o,r)=>{
  P.cyl(.28,.3,.04,0,0,0,GOLD,{seg:10,edges:false});
  P.cyl(.025,.025,1.0,0,.04,0,GOLD,{seg:6,edges:false});
  P.cyl(.31,.31,.04,0,1.01,0,o.color||r.pick([0x1a1014,0x2a1a10,0xe8e0d0]),{seg:12,hull:.02});
  P.cyl(.035,.035,.08,0,1.05,0,0xe8d0a0,{seg:6,edges:false,small:true});
  P.sph(.02,0,1.15,0,0xffc84a,{ws:4,hs:3,hull:0,basic:true});
  for(let i=0;i<2;i++)P.cyl(.03,.026,.09,r.range(-.18,.18),1.05,r.range(-.18,.18),r.pick([0xe0f0f0,0xf0a040]),{seg:6,edges:false,small:true});
  P.colBox(.62,.62,1.05);
});

/* ============================ KOLUMNA / ŚCIANA Z LUSTRAMI ============================ */
// Kolumna 0,6 x 3,2 x 0,6 m (cokół i kapitel złote), lustra jako jasny kolor + smugi (bez odbić). Pełna osłona.
function mirrorDecal(){
  return atlas('wn:lustro',64,128,(g,w,h)=>{g.fillStyle='#a6d2dc';g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.55)';
    g.beginPath();g.moveTo(10,0);g.lineTo(26,0);g.lineTo(6,h);g.lineTo(-10,h);g.fill();g.beginPath();g.moveTo(36,0);g.lineTo(42,0);g.lineTo(22,h);g.lineTo(16,h);g.fill();
    g.fillStyle='rgba(30,70,90,.25)';g.fillRect(0,h*.7,w,h*.3)});
}
defProp('kolumnaLustrzana',{name:'Kolumna z lustrami',cat:C,dims:[.7,3.2,.7],cover:true,note:'Pełna osłona (h 3,2). Seed: kolor złoceń.'},(P,o,r)=>{
  const gold=r.pick([GOLD,BRASS]),md=mirrorDecal();
  P.box(.7,.25,.7,0,0,0,gold,{edges:true});P.box(.7,.2,.7,0,3.0,0,gold,{edges:true});P.box(.62,.06,.62,0,2.94,0,shade(gold,.8),{edges:false,small:true});
  P.box(.52,2.7,.52,0,.25,0,0x333a40,{edges:false});
  for(let i=0;i<4;i++){const a=i*PI/2,s=Math.sin(a),c=Math.cos(a);
    P.decal(md,.46,2.5,s*.264,1.6,c*.264,{ry:a});
    S(P,gold,s*.27+c*.24,.3,c*.27-s*.24,.05,2.6,.05);}
  P.colBox(.7,.7,3.2);
});
defProp('scianaLustra',{name:'Ściana z lustrami',cat:C,dims:[4.0,3.0,.2],cover:true,note:'Segment 4 m: 4 lustra w złotych ramach. Przy ścianie (plecy -Z). Pełna osłona.'},(P,o,r)=>{
  const md=mirrorDecal(),gold=r.pick([GOLD,BRASS]);
  P.box(4,.2,.2,0,0,0,WOOD,{edges:true});P.box(4,.15,.2,0,2.85,0,gold,{edges:true});
  S(P,0x2a3238,0,.2,-.02,4,2.65,.12);
  for(let i=0;i<4;i++){const x=-1.5+i;
    P.decal(md,.9,2.5,x,1.5,.062);
    for(const sx of [-.47,.47])S(P,gold,x+sx,.2,.07,.06,2.65,.03);
    S(P,gold,x,.2,.07,.9,.05,.03);S(P,gold,x,2.8,.07,.9,.05,.03)}
  P.colBox(4,.2,3.0);
});

/* ============================ KASA / OKIENKO ============================ */
// Kasa-okienko: 2,4 x 2,5 x 0,8 m: lada 1,05 m, krata mosiężna (pręty co 0,1 m), tablica KASA, szuflada na żetony.
defProp('kasaOkienko',{name:'Kasa z kratą',cat:C,dims:[2.4,2.5,.8],cover:true,note:'Klient w +Z. Pełna osłona (h 2,5). Neon KASA mruga.'},(P,o,r)=>{
  const wood=r.pick([WOOD,0x3a2016]);
  P.box(2.4,1.05,.8,0,0,0,wood,{edges:true});
  P.box(2.4,.06,.9,0,1.05,.03,shade(wood,.6),{edges:true});
  S(P,0x9a9ca0,0,.85,.41,.5,.12,.02);
  S(P,0x0a0a0a,0,.88,.42,.3,.04,.01);
  P.box(2.4,.5,.8,0,2.0,0,wood,{edges:true});
  for(const sx of [-1,1])S(P,wood,sx*1.15,1.1,0,.1,.95,.8);
  for(let x=-1.0;x<=1.0;x+=.1)S(P,BRASS,x,1.11,.3,.016,.9,.016,{small:true});
  S(P,BRASS,0,1.45,.3,2.0,.03,.03,{small:true});S(P,BRASS,0,1.88,.3,2.0,.03,.03,{small:true});
  S(P,0x15101a,0,1.12,-.1,2.2,.9,.04);
  const k=neonTex('wn:kasa',256,64,(g,w,h)=>{g.fillStyle='#10060a';g.fillRect(0,0,w,h);g.strokeStyle='#ffd23c';g.lineWidth=4;g.strokeRect(3,3,w-6,h-6);glowText(g,'KASA',w/2,h/2+3,FONT(52),'#ffd23c')});
  P.neon(k,1.2,.3,0,2.25,.42);
  P.cyl(.03,.03,.02,.9,1.11,.1,0xe8d8a0,{seg:6,edges:false,small:true});
  for(let i=0;i<3;i++)P.cyl(.03,.03,.03+i*.01,-.6+i*.08,1.11,.15,r.pick([0xd01e1e,0x1e6ad0,0x222222]),{seg:6,edges:false,small:true});
  P.colBox(2.4,.8,2.5);
});

/* ============================ SEJF ============================ */
// Drzwi sejfu: rama 2,4 x 2,4 x 0,7 m, tarcza ø1,8 m gr. 0,3 m z 8 ryglami, koło + pokrętło szyfrowe. Warianty: zamkniete/otwarte.
defProp('drzwiSejfu',{name:'Drzwi sejfu',cat:C,dims:[2.4,2.4,.8],dimsV:{zamkniete:[2.4,2.4,.92],otwarte:[3.4,2.4,1.9]},variants:['zamkniete','otwarte'],cover:true,
  note:'Wnęka pod ścianą (plecy -Z). Otwarte: tarcza odsunięta na zawiasie (+X). Kolider tylko na ramie – otwór: wnętrze.'},(P,o,r)=>{
  const open=o.variant==='otwarte',steel=r.pick([0x6a7378,0x5c666b]);
  for(const [x,w] of [[-1.1,.2],[1.1,.2]])P.box(w,2.4,.8,x,0,0,steel,{edges:true});
  P.box(2.4,.2,.8,0,2.2,0,steel,{edges:true});P.box(2.4,.15,.8,0,0,0,steel,{edges:true});
  S(P,0x15151a,0,.15,-.3,2.0,2.05,.1);
  let cx=0,cz=.2,ry=0;
  if(open){cx=1.7;cz=.55;ry=-1.2}
  const cs=Math.cos(ry),sn=Math.sin(ry),T=(lx,ly,lz)=>[cx+lx*cs+lz*sn,1.2+ly,cz-lx*sn+lz*cs];
  P.add(new THREE.CylinderGeometry(.92,.92,.3,22),cx,1.2,cz,0x8c969c,{rx:PI/2,ry:ry,hull:.02});
  P.add(new THREE.CylinderGeometry(.74,.74,.04,22),...T(0,0,.17),0x6a7378,{rx:PI/2,ry:ry,edges:false});
  for(let i=0;i<8;i++){const a=i*PI/4;const [x,y,z]=T(Math.sin(a)*.88,Math.cos(a)*.88,0);
    P.add(new THREE.BoxGeometry(.14,.14,.4),x,y,z,0x3d4448,{ry:ry,edges:false,small:true})}
  const [hx,hy,hz]=T(0,0,.24);
  P.add(new THREE.CylinderGeometry(.1,.1,.08,10),hx,hy,hz,GOLD,{rx:PI/2,ry:ry,edges:false});
  for(let i=0;i<3;i++){const a=i*PI/3+.3;const [x,y,z]=T(0,0,.3);
    P.add(new THREE.BoxGeometry(.05,.62,.05),x,y,z,0x2a2a2a,{rz:a,ry:ry,edges:false,small:true})}
  const [dx,dy,dz]=T(.45,.25,.2);P.add(new THREE.CylinderGeometry(.07,.07,.04,10),dx,dy,dz,STEEL,{rx:PI/2,ry:ry,edges:false,small:true});
  P.col(-1.2,-1.0,-.4,.4,2.4);P.col(1.0,1.2,-.4,.4,2.4);P.col(-1.0,1.0,-.4,-.3,2.4);
  if(!open)P.col(-1.0,1.0,-.3,.35,2.4);
});

// Sejf z kratą (klatka depozytowa): 3,2 x 2,6 x 1,6 m, kraty stalowe co 0,15 m z 3 stron, przód z wejściem 1,0 m, wewnątrz sztaby i paczki.
defProp('sejfKrata',{name:'Sejf z kratą',cat:C,dims:[3.2,2.6,1.6],cover:false,
  note:'Wejście od +Z (szerokość 1,0 m). Kraty blokują ruch, nie widok (kolidery h 2,6 > 1,7 = nav uzna za osłonę; wrogowie strzelają przez kraty – po stronie poziomu). Wewnątrz sztaby złota.'},(P,o,r)=>{
  const W=3.2,D=1.6,H=2.6,bar=(x,z,col=STEELD)=>S(P,col,x,0,z,.03,H,.03,{small:true});
  S(P,0x2a2a2e,0,0,0,W,.05,D);
  for(let x=-W/2;x<=W/2+.01;x+=.2){bar(x,-D/2);if(Math.abs(x)>.55)bar(x,D/2)}
  for(let z=-D/2;z<=D/2+.01;z+=.2){bar(-W/2,z);bar(W/2,z)}
  for(const y of [.05,1.3,H-.06])for(const [x,z,w,d] of [[0,-D/2,W,.06],[-W/2,0,.06,D],[W/2,0,.06,D]])S(P,STEEL,x,y,z,w,.06,d,{small:true});
  S(P,STEEL,0,H-.06,D/2,W,.06,.06,{small:true});S(P,STEEL,-.52,0,D/2,.08,H,.08);S(P,STEEL,.52,0,D/2,.08,H,.08);
  S(P,0x3a3a40,0,H-.3,D/2,1.0,.04,.04,{small:true});
  P.box(.14,.2,.06,.36,1.1,D/2+.01,0x2a2a2a,{edges:false,small:true});
  for(let x=-W/2+.1;x<W/2-.1;x+=.3)for(let y=0;y<4;y++){if(r.chance(.2))continue;
    S(P,mixc(0x9aa0a6,0x6a7076,r()),x,.5+y*.2,-D/2+.1,.26,.18,.14,{small:true})}
  for(let i=0;i<3;i++)for(let j=0;j<=i;j++)P.box(.2,.06,.1,-.9+j*.22-i*.11,.05+(2-i)*.06,.1,GOLD,{edges:false,small:true});
  P.box(.4,.2,.25,.9,.05,.2,0x2f6a3a,{edges:false,small:true});
  P.col(-W/2,-.55,-D/2,-D/2+.1,H);P.col(.55,W/2,-D/2,-D/2+.1,H);
  P.col(-W/2,W/2,-D/2,-D/2+.1,H);P.col(-W/2,-W/2+.1,-D/2,D/2,H);P.col(W/2-.1,W/2,-D/2,D/2,H);
  P.col(-W/2,-.55,D/2-.1,D/2,H);P.col(.55,W/2,D/2-.1,D/2,H);
});

/* ============================ WINDA ============================ */
// Kabina: wnętrze 1,6 x 2,3 x 1,5 m (rama zewn. 1,9 x 2.6 x 1,6), drzwi rozsuwane po 0,55 m. Oś drzwi: doorL/doorR.
// Parts nie umie „nazwanych części”, więc rama = defProp, a drzwi = osobny rekwizyt (windaDrzwi); make()/place() składają całość.
const ELV={W:1.9,H:2.6,D:1.6,ZD:.68}; // ZD = z płaszczyzny drzwi
defProp('windaRama',{name:'Winda – rama kabiny',cat:'wnetrza-czesc',dims:[1.9,2.6,1.6],cover:true,note:'Część windy (bez drzwi).'},(P,o,r)=>{
  const {W,H,D}=ELV,wall=r.pick([0x8a8f94,0xa8864a,0x7a7e82]);
  P.box(W,.1,D,0,0,0,0x3a3a40,{edges:false});
  P.box(W,.15,D,0,H-.15,0,0x6a6e72,{edges:false});
  S(P,0x2a2a2e,0,.1,-.7,W-.2,H-.3,.04);
  S(P,wall,-W/2+.05,.1,0,.1,H-.25,D);S(P,wall,W/2-.05,.1,0,.1,H-.25,D);
  S(P,wall,0,.1,-.75,W-.2,H-.25,.06);
  S(P,MIRROR,0,.9,-.71,1.2,1.3,.02);
  rod(P,'x',.02,1.4,0,1.0,-.67,BRASS,6);rod(P,'z',.02,1.3,-.82,1.0,0,BRASS,6);rod(P,'z',.02,1.3,.82,1.0,0,BRASS,6);
  S(P,0x15151a,.7,1.0,-.6,.05,.3,.12);
  for(let i=0;i<4;i++)P.cylc(.014,.014,.02,.7,1.0+i*.05,-.54,i===2?0xffe14a:0xcccccc,{seg:5,rx:PI/2,edges:false,small:true,basic:i===2});
  S(P,0xfff1c0,0,H-.2,0,.7,.04,.7,{basic:true});
  for(const sx of [-1,1])S(P,STEELD,sx*.77,.1,ELV.ZD,.38,H-.2,.14);
  S(P,STEELD,0,H-.35,ELV.ZD,W,.2,.14);
  const ind=neonTex('wn:winda:ind',128,48,(g,w,h)=>{g.fillStyle='#10060a';g.fillRect(0,0,w,h);glowText(g,'▲ 2 ▼',w/2,h/2+2,FONT(34),'#ff4a2a')});
  P.neon(ind,.38,.14,0,H-.35+.1,ELV.ZD+.075,{static:true});
  P.col(-W/2,-W/2+.1,-D/2,D/2,H);P.col(W/2-.1,W/2,-D/2,D/2,H);P.col(-W/2,W/2,-D/2,-D/2+.1,H);
  P.col(-W/2,-.5,ELV.ZD-.07,ELV.ZD+.07,H);P.col(.5,W/2,ELV.ZD-.07,ELV.ZD+.07,H);
});
defProp('windaDrzwi',{name:'Winda – skrzydło drzwi',cat:'wnetrza-czesc',dims:[.55,2.1,.05],cover:false,note:'Pivot na krawędzi środka; przesuwanie po X.'},(P,o,r)=>{
  const s=o.side==='R'?1:-1;
  P.box(.55,2.1,.04,s*.275,.1,0,0xb8bcc0,{edges:true});
  S(P,0x9aa0a4,s*.275,.1,.025,.45,1.9,.01,{small:true});
  S(P,0x6a6e72,s*.05,.9,.04,.03,.4,.02,{small:true});
});
const windaRama=DS.props.get('windaRama');
const windaDef={
  id:'winda',name:'Winda (kabina + drzwi)',cat:C,dims:[1.9,2.6,1.6],cover:true,variants:null,
  note:'Grupa z dziećmi doorL, doorR (position.x = 0 zamknięte; otwarte: doorL.x = -0,55, doorR.x = +0,55). place() zwraca stub z userData.doorL/doorR/doorCol.',
  parts:o=>windaRama.parts(o),
  make(opts={}){
    const g=windaRama.make(opts),dl=DS.props.get('windaDrzwi'),L=dl.make({side:'L'}),R=dl.make({side:'R'});
    L.name='doorL';R.name='doorR';L.position.z=R.position.z=ELV.ZD;g.add(L,R);g.userData.doorL=L;g.userData.doorR=R;
    g.userData.tris+=L.userData.tris+R.userData.tris;g.userData.collider=g.userData.collider.concat([{x0:-.55,x1:.55,z0:ELV.ZD-.03,z1:ELV.ZD+.03,h:2.2,door:true}]);return g;
  },
  place(opts={}){
    const stub=windaRama.place(opts),dl=DS.props.get('windaDrzwi'),h=new THREE.Group();
    h.position.set(opts.x||0,opts.y||0,opts.z||0);h.rotation.y=opts.rotY||0;
    const L=dl.make({side:'L'}),R=dl.make({side:'R'});L.position.z=R.position.z=ELV.ZD;L.name='doorL';R.name='doorR';
    if(opts.open){L.position.x=-.55;R.position.x=.55}
    h.add(L,R);scene.add(h);
    let doorCol=null;
    if(opts.collide!==false&&!opts.open){
      const s=Math.sin(opts.rotY||0),c=Math.cos(opts.rotY||0),px=.55,pz=ELV.ZD+.03,mz=ELV.ZD-.03,xs=[],zs=[];
      for(const [lx,lz] of [[-px,mz],[px,mz],[-px,pz],[px,pz]]){xs.push((opts.x||0)+lx*c+lz*s);zs.push((opts.z||0)-lx*s+lz*c)}
      doorCol={x0:Math.min(...xs),x1:Math.max(...xs),z0:Math.min(...zs),z1:Math.max(...zs),h:(opts.y||0)+2.2};
      world.colliders.push(doorCol);
    }
    Object.assign(stub.userData,{id:'winda',doorL:L,doorR:R,doorHolder:h,doorCol,cover:true});return stub;
  },
};
DS.props.register(windaDef);

/* ============================ KUCHNIA ============================ */
// Blat: moduł 2,4 x 0,9 x 0,65 m (szafki 0,6 m, blat 0,04 m). Zlew: dwukomorowy 1,2 m. Kuchenka 0,6 x 0,9 x 0,6 (EN 60335). Lodówka 0,8 x 1,85 x 0,72.
defProp('blatKuchenny',{name:'Blat kuchenny',cat:C,dims:[2.4,.95,.65],dimsV:{blat:[2.4,.95,.65],zlew:[2.4,1.2,.65]},variants:['blat','zlew'],cover:false,
  note:'Plecami do ściany (-Z). Wariant zlew: dwukomorowy zlew nierdzewny i bateria.'},(P,o,r)=>{
  const v=o.variant||r.pick(['blat','zlew']),fr=r.pick([0xd8d4c8,0x6a8a7a,0x9a9a9a]);
  P.box(2.4,.86,.6,0,0,-.02,fr,{edges:true});
  S(P,0x1a1a1a,0,0,.29,2.4,.08,.02);
  for(let i=0;i<4;i++){S(P,shade(fr,.88),-.9+i*.6,.1,.285,.54,.7,.015);S(P,STEEL,-.9+i*.6+.2,.7,.3,.1,.02,.02,{small:true})}
  P.box(2.4,.04,.66,0,.86,0,0x7a6a58,{edges:true});
  if(v==='zlew'){
    S(P,STEEL,-.3,.89,0,1.1,.01,.5);
    for(const sx of [-.57,0]){S(P,0x4a5258,-.3+sx+.285,.8,0,.5,.1,.42,{small:true})}
    S(P,STEEL,-.3,.9,0,1.15,.015,.54,{small:true});S(P,0x2a3238,-.58,.84,0,.5,.07,.42,{small:true});S(P,0x2a3238,.0,.84,0,.5,.07,.42,{small:true});
    P.cyl(.02,.02,.28,-.3,.9,-.2,STEEL,{seg:6,edges:false,small:true});P.add(new THREE.BoxGeometry(.04,.04,.2),-.3,1.18,-.1,STEEL,{edges:false,small:true});
  }else{
    for(let i=0;i<3;i++)P.cyl(.1,.1,.02+i*.02,-.8+i*.35,.9,0,r.pick([STEEL,0xd8d4c8]),{seg:8,edges:false,small:true});
    S(P,0x4a2a18,.8,.9,0,.4,.04,.25,{small:true});
  }
  P.colBox(2.4,.65,.95);
});
defProp('kuchenka',{name:'Kuchenka z piekarnikiem',cat:C,dims:[.6,.95,.62],cover:false,note:'4 palniki, piekarnik z szybką. Wersja industrialna 0,9 m szer. po opts.wide.'},(P,o,r)=>{
  const w=o.wide?.9:.6;
  P.box(w,.86,.6,0,0,0,STEEL,{edges:true});
  S(P,0x1a1a1a,0,.86,0,w,.03,.6);
  const q=w/4;
  for(const sx of [-1,1])for(const sz of [-1,1]){P.cyl(.09,.09,.015,sx*w*.24,.89,sz*.14,0x111111,{seg:9,edges:false,small:true});P.cyl(.04,.04,.02,sx*w*.24,.905,sz*.14,STEELD,{seg:7,edges:false,small:true})}
  S(P,0x15151a,0,.12,.299,w-.12,.5,.012);S(P,0x6a7076,0,.62,.3,w-.1,.03,.03,{small:true});
  for(let i=0;i<4;i++)P.cylc(.022,.022,.03,-w*.36+i*w*.24,.74,.31,0x222222,{seg:6,rx:PI/2,edges:false,small:true});
  S(P,0x15151a,0,.9,-.28,w,.05,.04);
  P.colBox(w,.62,.95);
});
defProp('lodowka',{name:'Lodówka',cat:C,dims:[.8,1.88,.72],cover:true,note:'Dwudrzwiowa, h 1,88 m = pełna osłona. Magnesy (seed).'},(P,o,r)=>{
  const c=o.color||r.pick([0xe8e8e2,0xb8bcc0,0xd8c8a0]);
  P.box(.8,1.88,.72,0,0,0,c,{edges:true});
  S(P,shade(c,.7),0,1.25,.36,.8,.012,.01);
  S(P,STEELD,.32,1.3,.37,.03,.45,.03,{small:true});S(P,STEELD,.32,.6,.37,.03,.5,.03,{small:true});
  S(P,0x1a1a1a,0,0,.34,.8,.07,.04);
  for(let i=0;i<4;i++)S(P,r.pick([0xd0342a,0x3a8ad2,0xf0c030,0x3ac04a]),-.2+r.range(0,.3),1.4+r.range(0,.3),.372,.06,.06,.01,{small:true});
  P.colBox(.8,.72,1.88);
});
// Zaplecze
defProp('regalMagazynowy',{name:'Regał magazynowy',cat:C,dims:[1.8,2.1,.5],cover:true,note:'Stalowy regał 1,8 x 2,1 x 0,5 m, 4 półki, skrzynki i butelki wg seeda. Pełna osłona.'},(P,o,r)=>{
  const post=0x2a4a8a;
  for(const sx of [-1,1])for(const sz of [-1,1])S(P,post,sx*.88,0,sz*.22,.05,2.1,.05);
  for(let k=0;k<4;k++){const y=.15+k*.6;S(P,0xd0b070,0,y,0,1.8,.04,.5);
    for(let i=0;i<3;i++){const t=r();if(t<.5)S(P,r.pick([0xb08a50,0xa07a40]),-.6+i*.6,y+.04,0,.5,.3,.36,{small:true});
      else if(t<.8)for(let j=0;j<3;j++)bottle(P,-.65+i*.6+j*.1,y+.04,r.range(-.1,.1),r.pick([0x2a6b2f,0xd8e8e8,0x9a1c1c]),.2);
      else S(P,0xe8e0d0,-.6+i*.6,y+.04,0,.45,.2,.3,{small:true})}}
  S(P,post,0,0,-.22,1.8,.03,.02,{small:true});
  P.colBox(1.8,.5,2.1);
});
defProp('skrzynkaAlkohol',{name:'Skrzynka z alkoholem',cat:C,dims:[.5,.38,.34],cover:false,note:'Pod instancing. 6 szyjek butelek z folią, drewniane listwy.'},(P,o,r)=>{
  const wood=r.pick([0xb08a50,0xa07a40]);
  P.box(.5,.2,.34,0,0,0,wood,{edges:true});
  for(let i=0;i<6;i++){const x=-.17+(i%3)*.17,z=(i<3?-.08:.08);
    P.cyl(.024,.03,.14,x,.2,z,r.pick([0x2a6b2f,0xd8e8e8,0x7a4a1a]),{seg:5,edges:false,small:true});
    P.cyl(.01,.02,.05,x,.34,z,0xd9a82a,{seg:4,edges:false,small:true})}
  S(P,0xe8e0d0,0,.08,.171,.3,.08,.005,{small:true});
  P.colBox(.5,.34,.34);
});
defProp('wozekMagazynowy',{name:'Wózek magazynowy',cat:C,dims:[.95,1.1,.55],cover:false,note:'Platforma 0,9 x 0,5 m na 4 kołach, rączka 1,1 m, skrzynki z seeda.'},(P,o,r)=>{
  const col=r.pick([0x2a4a8a,0x8a1624,0x3a3a3e]);
  P.box(.9,.04,.5,0,.12,0,col,{edges:true});
  for(const sx of [-1,1])for(const sz of [-1,1])P.cylc(.065,.065,.04,sx*.38,.065,sz*.2,0x111111,{seg:8,rz:PI/2,rx:0,edges:false,small:true});
  for(const sz of [-1,1])S(P,STEELD,-.43,.16,sz*.22,.03,.94,.03,{small:true});
  rod(P,'z',.016,.5,-.43,1.1,0,STEEL,6);
  for(let i=0;i<3;i++)S(P,r.pick([0xb08a50,0xa07a40,0xd8d0c0]),.05+(i%2)*.3-.1,.16+Math.floor(i/2)*.3,r.range(-.05,.05),.4,.28,.4,{small:true});
  P.colBox(.95,.55,1.1);
});

/* ============================ DYWAN ============================ */
// Dywan 4 x 3 m (gr. 1 cm) z jednego decalu 192x144 w atlasie: obramowanie, medalion, wzór; warianty kolorystyczne.
const DYW={czerwony:['#7a1018','#d9a82a','#2a0a0e'],zielony:['#0e4a2c','#e8d8a0','#082818'],granat:['#1c2f66','#ffb347','#0a1230']};
defProp('dywan',{name:'Dywan wzorzysty',cat:C,dims:[4.0,.02,3.0],variants:Object.keys(DYW),cover:false,note:'Bez koliderów. opts.w/d skaluje (m).'},(P,o,r)=>{
  const v=DYW[o.variant]?o.variant:r.pick(Object.keys(DYW)),[a,b,k]=DYW[v],w=o.w||4,d=o.d||3;
  const rc=atlas('wn:dywan:'+v,192,144,(g,cw,ch)=>{
    g.fillStyle=a;g.fillRect(0,0,cw,ch);g.strokeStyle=b;g.lineWidth=5;g.strokeRect(5,5,cw-10,ch-10);g.strokeStyle=k;g.lineWidth=3;g.strokeRect(14,14,cw-28,ch-28);
    g.lineWidth=2;g.strokeStyle=b;for(let x=22;x<cw-22;x+=14){g.beginPath();g.moveTo(x,20);g.lineTo(x+7,28);g.lineTo(x+14,20);g.stroke();g.beginPath();g.moveTo(x,ch-20);g.lineTo(x+7,ch-28);g.lineTo(x+14,ch-20);g.stroke()}
    g.save();g.translate(cw/2,ch/2);g.fillStyle=k;g.beginPath();g.moveTo(0,-40);g.lineTo(62,0);g.lineTo(0,40);g.lineTo(-62,0);g.fill();
    g.strokeStyle=b;g.lineWidth=3;g.stroke();g.fillStyle=b;for(let i=0;i<8;i++){g.rotate(PI/4);g.beginPath();g.ellipse(0,-18,5,12,0,0,7);g.fill()}g.restore();
    g.fillStyle=b;for(let i=0;i<14;i++){g.fillRect(2,4+i*10,3,5);g.fillRect(cw-5,4+i*10,3,5)}
  });
  P.box(w,.012,d,0,0,0,shade(new THREE.Color(a).getHex(),.8),{edges:false,small:true});
  P.decal(rc,w-.04,d-.04,0,.014,0,{rx:-PI/2});
});

/* ============================ ŻYRANDOL ============================ */
// Żyrandol ø1,1 m, 8 ramion ze świecami (żarówki MeshBasic), kryształki; y=0 = dół (dolny kryształ), łańcuch w górę 0,8 m (opts.drop).
defProp('zyrandol',{name:'Żyrandol',cat:C,dims:[1.1,1.4,1.1],cover:false,note:'Origin = dolny punkt. opts.drop = długość łańcucha.'},(P,o,r)=>{
  const d=o.drop||.8,n=8,gold=r.pick([GOLD,BRASS]);
  P.cyl(.02,.02,d,0,.62,0,0x333333,{seg:4,edges:false,small:true});
  P.cyl(.04,.12,.14,0,.3,0,gold,{seg:8,edges:false});
  P.ico(.05,0,.22,0,0xe8f4ff,{detail:0,hull:0});
  P.cyl(.01,.01,.35,0,.0,0,gold,{seg:4,edges:false,small:true});
  P.add(new THREE.TorusGeometry(.5,.015,4,16),0,.5,0,gold,{rx:PI/2,edges:false,small:true});
  for(let i=0;i<n;i++){const a=i/n*PI*2,x=Math.sin(a)*.5,z=Math.cos(a)*.5;
    P.cyl(.025,.025,.1,x,.5,z,0xf0e8d0,{seg:5,edges:false,small:true});
    P.sph(.025,x,.64,z,0xffe9a0,{ws:4,hs:3,hull:0,basic:true});
    P.add(new THREE.CylinderGeometry(.006,.006,.18,3),Math.sin(a)*.25,.56,Math.cos(a)*.25,gold,{rz:Math.cos(a)*1.2,rx:-Math.sin(a)*1.2,edges:false,small:true});
    P.ico(.03,x,.44,z,0xe8f4ff,{detail:0,hull:0});P.ico(.025,x*.9,.38,z*.9,0xd8e8f8,{detail:0,hull:0})}
  for(let i=0;i<4;i++)P.ico(.04,Math.sin(i*PI/2)*.14,.16,Math.cos(i*PI/2)*.14,0xe8f4ff,{detail:0,hull:0});
});

/* ============================ ROŚLINY ============================ */
// Donica ø0,45 m, h 0,5 m + palma kentia (1,9 m) albo fikus (1,6 m).
defProp('roslinaDonica',{name:'Roślina w donicy',cat:C,dims:[.9,1.9,.9],dimsV:{palma:[1.26,2.2,1.2],fikus:[1.0,1.78,.9]},variants:['palma','fikus'],cover:false,
  note:'Kolider tylko donica (h 0,5). Liście z seeda.'},(P,o,r)=>{
  const v=o.variant||r.pick(['palma','fikus']),pot=r.pick([0xe8e0d0,0x2a2a30,GOLD,0x8a3a22]);
  P.cyl(.2,.17,.5,0,0,0,pot,{seg:10,hull:.03});P.cyl(.2,.2,.04,0,.5,0,shade(pot,.8),{seg:10,edges:false,small:true});
  P.cyl(.18,.18,.02,0,.51,0,0x2a1a10,{seg:8,edges:false,small:true});
  const lf=r.pick([0x2f7a38,0x3a8a40,0x286a2c]);
  if(v==='palma'){
    P.cyl(.025,.035,1.2,0,.5,0,0x6a5030,{seg:5,edges:false,small:true});
    for(let i=0;i<8;i++){const a=i/8*PI*2+r()*.3,tilt=.8+r()*.4;
      const L=.8+r()*.2;P.add(new THREE.BoxGeometry(.14,.015,L),Math.sin(a)*L*.4,1.75-L*.15,Math.cos(a)*L*.4,lf,{ry:a,rx:-tilt,sx:1,edges:false,small:true});}
    P.add(new THREE.BoxGeometry(.12,.015,.5),0,1.95,0,lf,{rx:-1.5,edges:false,small:true});
  }else{
    P.cyl(.03,.045,.55,0,.5,0,0x5a4026,{seg:5,edges:false,small:true});
    for(const [x,y,z,s] of [[0,1.35,0,.42],[.25,1.1,.1,.3],[-.25,1.15,-.1,.3],[.05,1.0,.25,.28],[-.05,1.55,.1,.25]])P.ico(s,x,y,z,r.pick([lf,shade(lf,1.15)]),{detail:0,hull:.04});
  }
  P.colBox(.45,.45,.5);
});

/* ============================ CCTV, GAŚNICA, WYJŚCIE ============================ */
// Kamera kopułkowa/tubowa na wsporniku: 0,15 x 0,18 x 0,45 m, wspornik do ściany (z=0), dioda REC (MeshBasic).
defProp('kameraCCTV',{name:'Kamera CCTV',cat:C,dims:[.18,.3,.5],cover:false,note:'Montuj na ścianie (plecy -Z) na wys. ~2,5 m. Obrót: yaw w place(rotY). Dioda czerwona = MeshBasic.'},(P,o,r)=>{
  S(P,0x2a2a2e,-.07,-.03,0,.14,.06,.02,{small:true});
  P.box(.06,.06,.2,0,.2,.1,0x3a3a3e,{edges:false,small:true});
  P.cylc(.05,.055,.28,0,.15,.3,r.pick([0xdad8d0,0x2a2a2e]),{seg:9,rx:PI/2,hull:.03});
  P.cylc(.045,.045,.012,0,.15,.45,0x050510,{seg:9,rx:PI/2,edges:false,small:true});
  P.cylc(.025,.025,.012,0,.15,.456,0x1a3a6a,{seg:7,rx:PI/2,edges:false,small:true});
  P.sph(.012,.03,.2,.38,0xff2a1a,{ws:4,hs:3,hull:0,basic:true});
});
// Gaśnica proszkowa 6 kg: ø0,16 m, h 0,5 m, uchwyt ścienny, znak (decal 64x64) 0,25 m.
defProp('gasnica',{name:'Gaśnica ze znakiem',cat:C,dims:[.25,1.2,.2],cover:false,note:'Plecami do ściany (-Z); gaśnica na wys. 0,9-1,4 m, znak na 1,9 m.'},(P,o,r)=>{
  S(P,0x333333,0,.9,0,.12,.5,.02,{small:true});
  P.cyl(.08,.08,.46,0,.92,.1,0xc4161c,{seg:10,hull:.03});
  P.cyl(.04,.07,.06,0,1.38,.1,0xc4161c,{seg:10,edges:false,small:true});
  P.cyl(.02,.02,.06,0,1.44,.1,STEELD,{seg:6,edges:false,small:true});
  S(P,0x222222,0,1.44,.1,.12,.02,.04,{small:true});
  P.add(new THREE.TorusGeometry(.06,.01,3,8),.1,1.3,.1,0x222222,{ry:PI/2,edges:false,small:true});
  S(P,0xf4f0e0,0,1.06,.18,.1,.16,.005,{small:true});
  const sg=atlas('wn:gasnica',64,64,(g,w,h)=>{g.fillStyle='#c4161c';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.fillRect(4,4,w-8,h-8);g.fillStyle='#c4161c';g.beginPath();g.moveTo(32,10);g.quadraticCurveTo(48,30,40,48);g.lineTo(24,48);g.quadraticCurveTo(16,30,32,10);g.fill()});
  P.decal(sg,.25,.25,0,1.95,.012);
});
// Tablica „WYJŚCIE”: 0,6 x 0,22 m, zielone podświetlenie (MeshBasic, nie mruga – wymóg przepisów).
defProp('tablicaWyjscie',{name:'Tablica WYJŚCIE',cat:C,dims:[.62,.24,.08],cover:false,note:'Montuj na wys. ~2,3 m nad drzwiami; origin = dół tablicy przy ścianie. Emisja stała.'},(P,o,r)=>{
  P.box(.62,.24,.05,0,0,0,0x20262a,{edges:true});
  const t=neonTex('wn:wyjscie',256,96,(g,w,h)=>{g.fillStyle='#0d6b35';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font=FONT(48);g.textAlign='center';g.textBaseline='middle';g.fillText('WYJŚCIE',w/2+14,h/2+3);
    g.beginPath();g.arc(30,28,6,0,7);g.fill();g.fillRect(25,36,10,24);g.beginPath();g.moveTo(44,50);g.lineTo(64,44);g.lineTo(64,56);g.fill()});
  P.neon(t,.58,.2,0,.12,.028,{static:true});
});
