// Droga, stacja paliw i autostrada (poziom 6 „Stacja paliw i autostrada”). cat:'droga'. Fikcyjne marki: stacja „PALIWEX”, „Bar u Zdzicha”.
// Wymiary rzeczywiste (m), Polska ok. 1999-2003 (zweryfikowane w sieci tam, gdzie wskazano; reszta z norm/katalogów, +-10 cm):
//  - Autosan H9-20/21: dł. ok. 10,0-12,0 (H9-20 ~10,0), szer. 2,5, wys. ~3,15, rozstaw osi ok. 4,7 (Wikipedia: Autosan H9) -> 10,0 x 2,5 x 3,15.
//  - Jelcz 315/325: dł. ok. 8,0-8,5, szer. 2,5, wys. kabiny ok. 2,9 (z plandeką ~3,5), rozstaw osi 4,1-4,5 (opracowania wyceny 325; ±10 cm).
//  - Zestaw TIR: ciągnik 4x2 + naczepa 13,6 m, szer. 2,55 (norma), wys. 4,0 (limit), dł. zestawu <= 16,5 m (dyrektywa 96/53/WE).
//  - Dystrybutor ok. 0,6 x 1,75 x 0,45; wiata stacji ok. 18 x 10 m, prześwit 4,8 m; pylon cenowy 6 m; toi-toi 1,1 x 1,2 x 2,3.
//  - Bariera energochłonna (W-beam) wys. 0,75-0,8 m, słupki co 2 m; ekran akustyczny 3,0-4,0 m; billboard standard 5,04 x 2,38 m.
//  - Bramownica: prześwit >= 5,0 m (pod znaki), wiadukt: prześwit 4,7-5,0 m, szer. jezdni 7,0 (+2x poboczy 0,75), pas 3,5 (2,5 awaryjny).
// Konwencja: pojazdy przód w -Z, budynki/znaki „twarz” w +Z. Neony (pylon, napisy) = MeshBasic (P.neon), mruganie tylko przez kolor.
import {defProp,atlas,neonTex,glowText,shade,mixc,sideProfile,rng} from './lib.js';

const PI=Math.PI,C='droga',TIRE=0x1b1a1a;
const STEEL=0x7c8186,STEELD=0x4b5055,CONC=0xa9a79f,CONCD=0x85837c,ASPH=0x45464a,RED=0xc8221a,YEL=0xf0c020,WHITE=0xe9e6dc,DARK=0x23211f;
const SM={edges:false,small:true},BAS={basic:true};
const S=(P,w,h,d,x,y,z,c,o)=>P.box(w,h,d,x,y,z,c,Object.assign({edges:false,small:true},o));      // drobny element (bez konturu)
const L=(P,w,h,d,x,y,z,c,o)=>P.box(w,h,d,x,y,z,c,Object.assign({basic:true},o));                       // świeci (MeshBasic)
const FNT=(n,f='Arial, Helvetica, sans-serif')=>`bold ${n}px ${f}`;
const IMP=(n)=>`${n}px Impact, Haettenschweiler, sans-serif`;
/** Ściana/prostopadłościan z zakresów (x0..x1, y0..y1) na osi z (środek zc, grubość t). */
const wallX=(P,x0,x1,y0,y1,zc,t,c,o)=>P.box(x1-x0,y1-y0,t,(x0+x1)/2,y0,zc,c,o);
const wallZ=(P,z0,z1,y0,y1,xc,t,c,o)=>P.box(t,y1-y0,z1-z0,xc,y0,(z0+z1)/2,c,o);
function wheel(P,x,yc,z,R,w,rim=0xa0a6aa,seg=10){
  P.cylc(R,R,w,x,yc,z,TIRE,{seg,rz:PI/2,hull:.04,edges:false});
  P.cylc(R*.55,R*.55,w+.02,x,yc,z,rim,{seg:6,rz:PI/2,edges:false,small:true});
}
const PLATES=(()=>{const r=rng(5),Lt='ABCDEFGHJKLMNPRSTUWXYZ',pre=['WA','KR','GD','PO','LU','WB','SK','LD','RZ','BI','OP','KT'];
  return pre.map(p=>p+' '+r.int(1000,9999)+Lt[r.int(0,Lt.length-1)])})();
function plate(seed){   // ten sam klucz i rysunek co w cars.js: wspólny prostokąt atlasu
  const t=PLATES[Math.abs(Math.floor(seed))%PLATES.length];
  return atlas('plate:'+t,128,28,(g,w,h)=>{g.fillStyle='#f4f4ee';g.fillRect(0,0,w,h);g.fillStyle='#1c3f94';g.fillRect(0,0,13,h);g.fillStyle='#fff';g.font='bold 8px sans-serif';g.fillText('PL',2,24);
    g.fillStyle='#111';g.font='bold 22px Arial, sans-serif';g.textAlign='center';g.fillText(t,w/2+7,22);g.strokeStyle='#111';g.lineWidth=1.5;g.strokeRect(.5,.5,w-1,h-1)});
}
/** Okno z ramą i smugami refleksów: tło przezroczyste poza ramą/refleksami (alphaTest), więc widać wnętrze. */
const frameWin=()=>atlas('droga:okno',128,128,(g,w,h)=>{g.fillStyle='#2f3a44';g.fillRect(0,0,w,h);g.fillStyle='#7da0b4';g.fillRect(8,8,w-16,h-16);
  const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#a8c8d8');gr.addColorStop(1,'#3c5666');g.fillStyle=gr;g.fillRect(8,8,w-16,h-16);
  g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(14,14);g.lineTo(52,14);g.lineTo(14,70);g.fill();g.fillStyle='#2f3a44';g.fillRect(w/2-3,8,6,h-16)});
/** Witryna sklepu: sama rama + refleksy, reszta przezroczysta (widać wnętrze). */
const shopGlass=()=>atlas('droga:witryna',512,96,(g,w,h)=>{g.strokeStyle='#3a4046';g.lineWidth=7;g.strokeRect(3,3,w-6,h-6);g.lineWidth=5;for(let x=w/5;x<w-10;x+=w/5){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}
  g.fillStyle='rgba(190,225,240,.9)';for(let x=40;x<w;x+=w/5){g.beginPath();g.moveTo(x,8);g.lineTo(x+22,8);g.lineTo(x-16,h-8);g.lineTo(x-38,h-8);g.fill()}
  g.fillStyle='#f4efe0';g.fillRect(w*.2+8,22,70,20);g.fillStyle='#c8221a';g.font=FNT(14);g.fillText('OTWARTE 24h',w*.2+10,38)});
const logoTex=(key,w,h,bg,fg,font,text,sub)=>atlas(key,w,h,(g,gw,gh)=>{if(bg){g.fillStyle=bg;g.fillRect(0,0,gw,gh)}g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
  let fs=+/(\d+)px/.exec(font)[1];g.font=font;while(g.measureText(text).width>gw-12&&fs>8){fs-=2;g.font=font.replace(/\d+px/,fs+'px')}
  
  g.fillText(text,gw/2,sub?gh*.42:gh/2+1);if(sub){g.font=FNT(Math.round(gh*.2));g.fillText(sub,gw/2,gh*.8)}});
const PALIWEX=()=>atlas('droga:paliwex',256,48,(g,w,h)=>{g.fillStyle='#c8221a';g.fillRect(0,0,w,h);g.fillStyle='#ffd21a';g.fillRect(0,0,w,5);g.fillRect(0,h-5,w,5);
  g.fillStyle='#fff';g.font=IMP(34);g.textAlign='center';g.textBaseline='middle';g.fillText('PALIWEX',w/2,h/2+2)});
/** Kabina ciężarówki/ciągnika (drzwi z szybą, klamka, szew): tło przezroczyste. */
const cabDoor=(flip)=>atlas('droga:kabina'+(flip?'L':'R'),128,112,(g,w,h)=>{g.save();if(flip){g.translate(w,0);g.scale(-1,1)}
  g.strokeStyle='#15110e';g.lineWidth=3;g.strokeRect(4,3,w-8,h-6);const gr=g.createLinearGradient(0,0,w,h*.6);gr.addColorStop(0,'#9cc0d2');gr.addColorStop(1,'#3b5566');
  g.fillStyle=gr;g.fillRect(14,9,w-34,h*.46);g.strokeRect(14,9,w-34,h*.46);g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.moveTo(20,12);g.lineTo(50,12);g.lineTo(26,h*.5);g.lineTo(20,h*.5);g.fill();
  g.fillStyle='#15110e';g.fillRect(w-30,h*.62,18,5);g.restore()});
const windshield=()=>atlas('droga:szyba',128,56,(g,w,h)=>{g.fillStyle='#15110e';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#a8cadc');gr.addColorStop(1,'#33505f');g.fillStyle=gr;g.fillRect(4,4,w-8,h-8);
  g.fillStyle='#15110e';g.fillRect(w/2-2,4,4,h-8);g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.moveTo(10,6);g.lineTo(40,6);g.lineTo(14,h-8);g.lineTo(8,h-8);g.fill()});
const wipers=(P,y,z,dir)=>{for(const sx of [-.5,.5])S(P,.55,.025,.03,sx,y,z+dir*.012,DARK,{rz:sx*.5})};

/* ============================ PYLON CENOWY ============================ */
defProp('pylonCen',{name:'Pylon cenowy stacji PALIWEX',cat:C,dims:[1.6,6.1,.7],cover:false,
  note:'Neon (emisja): logo + ceny PB95/ON/LPG, dwustronny. Słup 6,0 m. Instancing: tak (bez neonów).'},(P,o,r)=>{
  const tex=neonTex('droga:pylon',256,600,(g,w,h)=>{
    g.fillStyle='#c8221a';g.fillRect(0,0,w,h);g.fillStyle='#ffd21a';g.fillRect(0,0,w,10);g.fillRect(0,h-10,w,10);
    g.beginPath();g.arc(w/2,104,70,0,7);g.fill();g.fillStyle='#c8221a';g.font=IMP(96);g.textAlign='center';g.textBaseline='middle';g.fillText('P',w/2,108);
    glowText(g,'PALIWEX',w/2,214,IMP(52),'#ffffff','#ffffff');
    const rows=[['PB95','2,79','#ffd21a'],['ON','2,69','#7dff7d'],['LPG','1,29','#ff9a4a']];
    rows.forEach((rw,i)=>{const y=262+i*108;g.fillStyle='#14100c';g.fillRect(14,y,w-28,94);g.strokeStyle='#fff';g.lineWidth=3;g.strokeRect(14,y,w-28,94);
      g.fillStyle='#fff';g.font=FNT(26);g.textAlign='left';g.fillText(rw[0],24,y+49);g.textAlign='right';glowText(g,rw[1],w-22,y+49,FNT(50,'Courier New, monospace'),rw[2],'#fff')});
  });
  S(P,.46,2.7,.46,0,0,0,STEELD);P.box(.7,.5,.7,0,0,0,CONCD,{edges:false});
  P.box(1.5,3.6,.42,0,2.4,0,0xb01c14);
  S(P,1.58,.12,.5,0,6.0,0,STEELD);
  P.neon(tex,1.42,3.32,0,4.2,.218,{static:true});P.neon(tex,1.42,3.32,0,4.2,-.218,{ry:PI,static:true});
  P.colBox(.7,.7,6.0);
});

/* ============================ WIATA STACJI ============================ */
defProp('wiataStacji',{name:'Wiata stacji paliw',cat:C,dims:[18.5,5.5,10.4],cover:true,
  note:'Dach 18 x 10 m, prześwit 4,8 m, 4 kolumny (osłona), oświetlenie podwiatowe MeshBasic. Dystrybutory: DS.props.instance(\'dystrybutor\').'},(P,o,r)=>{
  const W=18,D=10,y=4.8,tx=PALIWEX();
  P.box(W,.35,D,0,y,0,0xe9e6dc);
  for(const sz of [-1,1])P.box(W+.4,.8,.25,0,y-.15,sz*(D/2+.075),RED);
  for(const sx of [-1,1])P.box(.25,.8,D,sx*(W/2+.075),y-.15,0,RED);
  for(const sz of [-1,1])S(P,W+.4,.1,.3,0,y-.12,sz*(D/2+.1),YEL);
  for(const sx of [-1,1])S(P,.3,.1,D,sx*(W/2+.1),y-.12,0,YEL);
  for(const sz of [-1,1])P.decal(tx,4.2,.77,-W/4,y+.26,sz*(D/2+.2),{ry:sz>0?0:PI}),P.decal(tx,4.2,.77,W/4,y+.26,sz*(D/2+.2),{ry:sz>0?0:PI});
  for(const sx of [-1,1])P.decal(tx,4.2,.77,sx*(W/2+.2),y+.26,0,{ry:sx*PI/2});
  for(const sx of [-6.5,-2.2,2.2,6.5])for(const sz of [-2.4,2.4])L(P,1.8,.05,.55,sx,y-.04,sz,0xfff6d0);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*6.5,z=sz*3.2;P.box(.55,4.8,.55,x,0,z,WHITE);S(P,.66,.9,.66,x,0,z,STEELD);S(P,.58,.08,.58,x,.9,z,YEL);S(P,.6,.3,.6,x,3.2,z,RED);
  }
  for(const sx of [-1,1])for(const sz of [-1,1])P.col(sx*6.5-.3,sx*6.5+.3,sz*3.2-.3,sz*3.2+.3,5.5);
});

/* ============================ DYSTRYBUTOR ============================ */
defProp('dystrybutor',{name:'Dystrybutor paliw (z wysepką)',cat:C,dims:[1.5,1.9,.95],cover:true,
  note:'Wysepka 1,4 x 0,9 m, korpus 0,62 x 1,72 x 0,42, dwa wyświetlacze, pistolety. Do instancingu (seed: kolor).'},(P,o,r)=>{
  const body=r.pick([0xd8d4c8,0xc8221a,0xe4e0d0]),acc=body===0xc8221a?0xf4efe0:RED;
  P.box(1.5,.16,.95,0,0,0,CONCD,{edges:false});S(P,1.52,.06,.97,0,.1,0,YEL);
  S(P,.2,.9,.2,.55,.16,.0,YEL);                               // słupek ochronny
  P.box(.62,1.62,.42,0,.16,0,body);P.box(.7,.12,.5,0,1.78,0,acc);S(P,.64,.1,.44,0,1.72,0,STEELD);
  for(const sz of [-1,1]){
    L(P,.4,.2,.03,0,1.25,sz*.215,0x1a2a1a);S(P,.3,.1,.02,0,1.3,sz*.23,0x7dff7d,BAS);
    S(P,.5,.2,.03,0,.85,sz*.215,acc);S(P,.18,.4,.14,-.4,.9,sz*.12,STEELD);S(P,.06,.35,.06,-.4,.9,sz*.13,DARK);
    S(P,.05,.5,.04,-.34,.6,sz*.18,DARK,{rz:.2});
  }
  P.colBox(.72,.52,1.85);
});

/* ============================ SKLEP STACJI ============================ */
defProp('sklepStacji',{name:'Sklep stacji paliw PALIWEX',cat:C,dims:[14.6,4.1,8.6],cover:true,
  note:'14 x 8 m, ściany 3,6 m. Witryna otwarta (rama + refleksy, widać wnętrze), kasa z ladą, 3 regały, lodówki. Wejście x=-4 od +Z. Neon: PALIWEX SKLEP 24h.'},(P,o,r)=>{
  const W=14,D=8,H=3.6,t=.25,zf=D/2-t/2,wall=r.pick([0xe4dfd0,0xd8d2bf,0xcfd6d2]),trim=RED;
  const win=frameWin(),glass=shopGlass(),tx=PALIWEX();
  P.box(W+.6,.12,D+.6,0,0,0,CONC,{edges:false});P.box(W-.1,.04,D-.1,0,.12,0,0xcfc8b4,{edges:false,small:true});
  // front (+Z): drzwi x -4.9..-3.1, witryna x -2.5..6.5
  wallX(P,-W/2,-4.9,.12,2.6,zf,t,wall);wallX(P,-3.1,-2.5,.12,2.6,zf,t,wall);wallX(P,6.5,W/2,.12,2.6,zf,t,wall);
  wallX(P,-2.5,6.5,.12,.9,zf,t,wall);wallX(P,-W/2,W/2,2.6,H,zf,t,shade(wall,.93));
  P.decal(glass,9,1.7,2,1.75,D/2+.01);S(P,9.2,.06,.3,2,.9,D/2+.1,STEEL);
  S(P,.06,.1,2.1,-4.9,.12,D/2,STEELD);S(P,.06,.1,2.1,-3.1,.12,D/2,STEELD);S(P,1.8,.04,.7,-4,.12,D/2+.4,0x3a6a3a);
  S(P,2.8,.1,1.3,-4,2.75,D/2+.65,trim);for(const sx of [-1,1])S(P,.1,2.7,.1,-4+sx*1.3,0,D/2+1.2,STEELD);
  S(P,.9,2.1,.05,-4.65,.15,D/2-.5,0x7aa0b4,{ry:1.0});
  // ściany boczne i tylna (okna jako decale z ramą)
  for(const sx of [-1,1]){wallZ(P,-D/2,D/2-t,.12,H,sx*(W/2-t/2),t,wall);
    for(const z of [-1.8,1.4])P.decal(win,1.3,1.1,sx*(W/2+.01),1.7,z,{ry:sx*PI/2})}
  wallX(P,-W/2+t,W/2-t,.12,H,-D/2+t/2,t,wall);S(P,1.1,2.1,.06,3,.14,-D/2-.01,STEELD);
  for(const x of [-3,5])P.decal(win,1.3,1.1,x,1.7,-D/2-.01,{ry:PI});
  // dach i szyld
  P.box(W+.6,.3,D+.6,0,H,0,0x6a6862);P.box(W+.7,.5,.3,0,H+.3,D/2+.3,trim);S(P,W+.7,.12,.34,0,H+.12,D/2+.3,YEL);
  S(P,1.4,.7,1.4,-3,H+.3,-1,0x9a9ea2);S(P,1.2,.6,1.2,3,H+.3,-.5,0x9a9ea2);
  P.neon(neonTex('droga:sklep',512,96,(g,w,h)=>{g.fillStyle='#10080c';g.fillRect(0,0,w,h);glowText(g,'PALIWEX  SKLEP  24h',w/2,h/2,IMP(62),'#ff5a4a','#ffe0d0')}),4.8,.9,2.2,3.1,D/2+.07);
  P.decal(tx,2.4,.45,-5.6,3.1,D/2+.02);
  // wnętrze: lada, kasa, półka z papierosami, regały, lodówki, lampy sufitowe
  P.box(.75,1.05,3.2,-5.5,.12,1.2,0x8a5a32);S(P,.85,.06,3.3,-5.5,1.17,1.2,0xcfcfc8);S(P,.4,.3,.35,-5.4,1.23,2.2,DARK);S(P,.35,.25,.3,-5.4,1.23,.4,0xe8e4d4);
  P.box(.4,2.0,3.2,-6.7,.12,1.2,0x6a4a2a);S(P,.04,.5,3,-6.48,1.3,1.2,0xd8c8a0,{...BAS});
  const gp=[0xd8442a,0xe8b020,0x3a8ad0,0x58a850,0xe8e4d4,0x9a4a8a];
  for(const [gx,gz,gl] of [[-1.6,-.8,3.6],[.8,-.8,3.6],[3.2,-.8,3.6]]){
    P.box(.5,1.8,gl,gx,.12,gz,0x8a8f94);
    for(const sx of [-1,1])for(let k=0;k<4;k++)S(P,.04,.22,gl-.2,gx+sx*.27,.35+k*.4,gz,gp[r.int(0,5)],BAS);
    S(P,.52,.06,gl,gx,1.9,gz,RED);
  }
  P.box(5.4,2.0,.7,1,.12,-3.55,0xe4e8ec);L(P,5.1,1.6,.04,1,.3,-3.18,0xb8e0f0);for(const x of [-0.8,.9,2.7])S(P,.05,1.7,.06,x,.3,-3.16,STEELD);
  for(const x of [-4,0,4])for(const z of [-2,1.5])L(P,1.4,.04,.4,x,H-.04,z,0xfff6d0);
  // kolidery
  P.col(-W/2,-4.9,D/2-t,D/2,H);P.col(-3.1,-2.5,D/2-t,D/2,H);P.col(6.5,W/2,D/2-t,D/2,H);P.col(-2.5,6.5,D/2-t,D/2,1.0);
  P.col(-W/2,-W/2+t,-D/2,D/2,H);P.col(W/2-t,W/2,-D/2,D/2,H);P.col(-W/2,W/2,-D/2,-D/2+t,H);
  P.col(-5.9,-5.1,-.4,2.8,1.05);P.col(-2.0,-1.2,-2.6,1.0,1.8);P.col(.4,1.2,-2.6,1.0,1.8);P.col(2.8,3.6,-2.6,1.0,1.8);P.col(-1.7,3.7,-3.9,-3.2,2.0);
});

/* ============================ MYJNIA ============================ */
defProp('myjnia',{name:'Myjnia samochodowa (portalowa)',cat:C,dims:[5.5,4.8,9.5],cover:true,
  note:'Tunel 5 x 9 m, wys. 3,4 m, otwarty z obu końców (przejazd po osi Z). Szczotki, rama portalu, neon MYJNIA. Ściany boczne = osłona.'},(P,o,r)=>{
  const W=5,D=9,H=3.4,wall=r.pick([0x3a78b8,0xe4e0d0,0x58a0a8]),br=[0x2a6ad0,0xd8442a];
  P.box(W+.4,.1,D+.4,0,0,0,CONCD,{edges:false});
  for(const sx of [-1,1]){P.box(.22,H,D,sx*(W/2-.11),.1,0,wall);for(let z=-D/2+1;z<D/2;z+=2)S(P,.04,H-.2,.12,sx*(W/2+.01),.2,z,shade(wall,.8))}
  P.box(W+.5,.28,D+.5,0,H+.1,0,0x6a6862);
  for(const sz of [-1,1]){S(P,W,.5,.3,0,2.9,sz*(D/2-.15),wall);S(P,W,.12,.34,0,2.9,sz*(D/2-.15),YEL)}
  for(const z of [-3,3])L(P,.6,.04,1.6,0,H,z,0xfff6d0);
  // rama portalu + szczotki
  for(const sx of [-1,1]){S(P,.22,2.6,.35,sx*1.9,.1,0,STEEL);S(P,.3,.2,.5,sx*1.9,.1,0,STEELD);
    P.cyl(.3,.3,2.1,sx*1.2,.15,0,br[(sx+1)/2],{seg:8,hull:.04});for(let k=0;k<4;k++)S(P,.64,.04,.64,sx*1.2,.4+k*.5,0,0xf4efe0)}
  S(P,4.0,.3,.45,0,2.5,0,STEEL);P.cylc(.26,.26,2.6,0,2.2,0,0xd8442a,{seg:8,rz:PI/2,hull:.04});
  S(P,.12,.12,6,.0,3.05,-1.0,STEELD);for(let z=-3.6;z<-.6;z+=.8)S(P,.03,.3,.03,0,2.8,z,0x9ad0e8);
  S(P,.6,1.2,.5,2.0,.1,-3.6,STEELD);S(P,.5,.04,3.0,-1.4,.1,2.5,0x2a2622);
  S(P,3.6,1.0,.2,0,H+.38,D/2-.4,0x14202a);P.neon(neonTex('droga:myjnia',512,128,(g,w,h)=>{g.fillStyle='#061018';g.fillRect(0,0,w,h);glowText(g,'MYJNIA',w/2,h/2,IMP(96),'#3ad0ff','#dff8ff')}),3.4,.85,0,H+.45,D/2-.29);
  P.col(-W/2,-W/2+.22,-D/2,D/2,H+.3);P.col(W/2-.22,W/2,-D/2,D/2,H+.3);P.col(-2.0,-1.8,-.2,.2,2.7);P.col(1.8,2.0,-.2,.2,2.7);
});

/* ============================ STOS OPON ============================ */
function tyreStack(P,x,z,n,r,rot=0){
  for(let i=0;i<n;i++)P.cyl(.31,.31,.2,x+Math.sin(i*2.1+rot)*.012,i*.2,z,i%3===1?0x26231f:TIRE,{seg:8,hull:.03,edges:false});
  S(P,.34,.01,.34,x,n*.2,z,0x0e0e0e,{});
}
defProp('stosOpon',{name:'Stos opon',cat:C,dims:[1.5,1.7,1.1],cover:true,
  note:'3 stosy opon osobowych (ø0,63 x 0,20 m): 8, 5 i 3 szt. + opona oparta. Wysokość stosu do 1,6 m. Do warsztatu, wulkanizacji.'},(P,o,r)=>{
  tyreStack(P,-.4,-.15,r.int(7,8),0);tyreStack(P,.35,-.2,r.int(4,6),1);tyreStack(P,.1,.5,r.int(2,3),2);
  P.cylc(.31,.31,.2,-.55,.31,.55,TIRE,{seg:8,rx:PI/2-.15,hull:.03,edges:false});
  P.colBox(1.4,1.1,1.6,0,.1);
});

/* ============================ WARSZTAT / WULKANIZACJA ============================ */
defProp('warsztat',{name:'Warsztat z wulkanizacją',cat:C,dims:[13.0,6.1,8.7],cover:true,
  note:'12 x 8 m, ściany 4,4 m, 2 bramy (3,2 m, rolety podniesione), podnośnik 2-kolumnowy, stół, beczki, stos opon, szafa, kompresor. Wejścia od +Z.'},(P,o,r)=>{
  const W=12,D=8,H=4.4,t=.25,zf=D/2-t/2,wall=r.pick([0xb8b4a6,0xc4a878,0x9aa4a8]),win=frameWin();
  P.box(W+.6,.12,D+.6,0,0,0,CONC,{edges:false});P.box(W-.1,.04,D-.1,0,.12,0,0x7c7a74,{edges:false,small:true});
  // front: bramy x -5..-1.8 i -1.2..2.0, biuro x 3.6..5.6
  for(const [a,b] of [[-W/2,-5],[-1.8,-1.2],[2,3.6],[5.6,W/2]])wallX(P,a,b,.12,3.0,zf,t,wall);
  wallX(P,3.6,5.6,.12,1.0,zf,t,wall);wallX(P,3.6,5.6,2.4,3.0,zf,t,wall);wallX(P,-W/2,W/2,3.0,H,zf,t,shade(wall,.9));
  P.decal(win,1.8,1.4,4.6,1.7,D/2+.01);S(P,2.0,.06,.28,4.6,1.0,D/2+.1,STEEL);
  for(const cx of [-3.4,.4]){S(P,3.3,.9,.08,cx,2.1,D/2-.12,0x9a9ea2);for(let k=0;k<5;k++)S(P,3.3,.02,.1,cx,2.15+k*.18,D/2-.1,0x7a7e82);S(P,3.4,.2,.2,cx,3.0-.2,D/2-.15,STEELD)}
  S(P,1.0,2.1,.06,6.2,0,D/2-.14,0x5a3a22);
  P.decal(logoTex('droga:warsztatSzyld',512,64,'#f0c020','#14100c',IMP(32),'WARSZTAT  •  WULKANIZACJA  •  HAMOWNIA'),8.4,1.05,-.6,3.55,D/2+.02);
  P.neon(neonTex('droga:opony',256,64,(g,w,h)=>{g.fillStyle='#140808';g.fillRect(0,0,w,h);glowText(g,'OPONY 24h',w/2,h/2,IMP(46),'#ff4a3a','#ffd8d0')}),2.4,.6,4.6,2.7,D/2+.07);
  for(const sx of [-1,1]){wallZ(P,-D/2,D/2-t,.12,H,sx*(W/2-t/2),t,wall);}
  P.decal(win,1.3,1.1,-W/2-.01,2.0,-1.5,{ry:-PI/2});P.decal(win,1.3,1.1,W/2+.01,2.0,1.5,{ry:PI/2});
  wallX(P,-W/2+t,W/2-t,.12,H,-D/2+t/2,t,wall);
  P.box(W+.5,.3,D+.5,0,H,0,0x5c5e5c);S(P,W+.5,.4,.3,0,H+.3,D/2+.2,YEL);
  S(P,2.4,.9,.9,-3,H+.3,-1,0x9a9ea2);S(P,.4,1.4,.4,3,H+.3,-2,STEELD,{});
  // wnętrze: podnośnik 2-kolumnowy (x -3.4), stół roboczy, szafa, beczki, kompresor, stos opon
  for(const sx of [-1,1]){S(P,.34,3.3,.34,-3.4+sx*1.45,.12,.3,0xe08a1c);S(P,.8,.1,.6,-3.4+sx*1.45,.12,.3,STEELD);
    for(const sz of [-1,1])S(P,1.2,.08,.12,-3.4+sx*1.0,.35,.3+sz*.65,0xe08a1c,{ry:sz*.35})}
  S(P,3.1,.16,.28,-3.4,3.4,.3,0xe08a1c);
  P.box(2.6,.9,.7,4.2,.12,-3.5,0x8a5a32);S(P,2.7,.06,.8,4.2,1.0,-3.5,0xcfcfc8);S(P,.2,.3,.2,3.4,1.06,-3.45,STEELD);
  P.box(.9,1.9,.6,-5.2,.12,-3.5,RED);S(P,.04,1.5,.5,-4.74,.3,-3.5,0x8a1c14);
  for(const [bx,bz,bc] of [[-2.2,-3.4,0x2a5aa8],[-1.6,-3.5,RED],[-2.0,-2.8,0x2a5aa8]])P.cyl(.29,.29,.9,bx,.12,bz,bc,{seg:8});
  P.cylc(.3,.3,1.1,1.5,.55,-3.5,RED,{seg:8,rz:PI/2,hull:.03});S(P,.5,.5,.5,1.5,.9,-3.5,STEELD);
  tyreStack(P,5.2,-.3,7,3);tyreStack(P,5.3,-1.3,4,5);tyreStack(P,-5.3,1,5,7);
  for(const x of [-3,0,3])L(P,2.4,.04,.35,x,H-.03,-.5,0xfff6d0);
  // kolidery
  for(const [a,b] of [[-W/2,-5],[-1.8,-1.2],[2,3.6],[5.6,W/2]])P.col(a,b,D/2-t,D/2,H);P.col(3.6,5.6,D/2-t,D/2,1.0);
  P.col(-W/2,-W/2+t,-D/2,D/2,H);P.col(W/2-t,W/2,-D/2,D/2,H);P.col(-W/2,W/2,-D/2,-D/2+t,H);
  P.col(-5.0,-4.5,-.1,.7,3.4);P.col(-2.3,-1.8,-.1,.7,3.4);P.col(2.9,5.5,-3.9,-3.15,1.1);P.col(-5.7,-4.7,-3.85,-3.15,1.9);P.col(4.95,5.65,-1.6,-1.0,1.0);P.col(-5.65,-4.95,.65,1.35,1.0);P.col(-2.6,-1.3,-3.9,-2.5,.95);
  P.col(4.8,5.6,-.65,.05,1.5);P.col(5.5,6.3,-.9,-.1,1.0);
});

/* ============================ TIR (CIĄGNIK + NACZEPA) ============================ */
defProp('tir',{name:'TIR (ciągnik siodłowy + naczepa)',cat:C,dims:[2.8,4.0,17.0],cover:true,variants:['plandeka','chlodnia'],
  note:'Przód -Z, 16,4 m, szer. 2,55, wys. 4,0 (ciągnik 4x2 kabina cab-over, naczepa 13,6 m). plandeka: kolor plandeki z seeda; chłodnia: agregat na ścianie czołowej, drzwi tylne.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.5)?'plandeka':'chlodnia'),cab=r.pick([0xc8c8c0,0x2a5a9a,0xb8231a,0x2f6a3a,0xe6a81c]),
    tarp=r.pick([0x2f5aa0,0x2f7a4a,0x8a2430,0xd8d4c4,0x3a3e46]),isC=v==='chlodnia',body=isC?0xe8e8e2:tarp;
  const SD=cabDoor(true),SL=cabDoor(false);
  // ciągnik: rama, kabina (profil boczny), deflektor, światła, zderzak
  S(P,.95,.3,5.9,0,.8,-4.95,STEELD);
  P.add(sideProfile([[0,1.2],[2.3,1.2],[2.3,2.8],[2.12,3.2],[.9,3.25],[0,3.25]],2.45,.04),0,0,-5.95,cab,{hull:.012});
  P.add(sideProfile([[0,3.25],[1.5,3.25],[1.5,3.32],[.2,3.78],[0,3.78]],2.2,0),0,0,-5.95,shade(cab,.85),{edges:false});
  S(P,2.46,.12,2.3,0,1.1,-7.1,STEELD);
  S(P,1.3,.45,.05,0,1.5,-8.27,DARK);for(let k=0;k<4;k++)S(P,1.3,.02,.06,0,1.45+k*.1,-8.28,0x6a6e72);
  for(const sx of [-1,1]){L(P,.42,.2,.05,sx*.88,1.62,-8.27,0xfff4c8);S(P,.2,.12,.05,sx*1.08,1.35,-8.27,0xff9a2a,BAS);
    S(P,.1,.42,.18,sx*1.34,2.5,-7.95,DARK);S(P,.04,.14,.3,sx*1.34,2.3,-7.95,STEELD);
    P.decal(sx>0?SD:SL,1.35,1.2,sx*1.233,2.3,-6.95,{ry:sx*PI/2});
    S(P,.08,.3,.5,sx*1.25,.95,-6.6,STEELD);S(P,.3,.1,.3,sx*1.1,.8,-6.6,STEEL);
    P.cylc(.32,.32,1.2,sx*1.0,.78,-3.9,STEEL,{seg:8,rx:PI/2,hull:.03,edges:false});
    S(P,.3,.22,.4,sx*1.05,1.2,-3.2,STEELD);}
  P.decal(windshield(),2.2,.95,0,2.3,-8.256,{ry:PI});
  S(P,2.46,.36,.28,0,.5,-8.3,STEELD);S(P,2.3,.1,.1,0,.88,-8.3,0x9a9ea2);
  P.decal(plate(o.seed),.52,.11,0,.62,-8.451,{ry:PI});
  S(P,.12,2.7,.12,1.26,1.0,-5.7,0xb8bcc0);
  // piąte koło, wózek
  S(P,1.0,.12,1.1,0,1.3,-3.7,STEELD);S(P,1.2,.2,2.4,0,1.1,-3.2,STEELD);
  S(P,2.0,.12,.12,0,.46,-7.0,STEELD);S(P,2.0,.12,.12,0,.46,-3.0,STEELD);for(const z of [3.6,5.0,6.4])S(P,2.0,.1,.1,0,.45,z,STEELD);
  for(const sx of [-1,1]){wheel(P,sx*1.0,.52,-7.0,.52,.32);wheel(P,sx*1.0,.52,-3.0,.52,.55);S(P,.7,.4,.03,sx*1.0,.1,-2.35,DARK)}
  // naczepa: ramy, podłoga, zabudowa
  S(P,1.0,.3,13.6,0,1.0,1.4,STEELD);P.box(2.55,.18,13.6,0,1.2,1.4,shade(body,.55));
  for(const sx of [-1,1]){S(P,.12,.9,.12,sx*.9,.35,-3.0,STEELD);S(P,.35,.05,.35,sx*.9,.3,-3.0,STEELD)}
  const bz0=-5.3,bl=13.4;
  if(isC){P.box(2.55,2.65,bl,0,1.38,bz0+bl/2,body);
    S(P,2.2,1.0,.45,0,2.9,-5.55,0xc8ccd0);for(let k=0;k<5;k++)S(P,2.0,.03,.05,0,3.0+k*.15,-5.78,STEELD);S(P,.5,.4,.1,-.6,3.0,-5.8,STEEL);
    for(const sx of [-1,1]){S(P,.04,2.55,.05,sx*.2,1.45,bl+bz0+.02,STEEL);S(P,.06,.3,.06,sx*.05,2.4,bl+bz0+.04,STEEL)}
    S(P,2.55,.06,.05,0,1.5,bl+bz0+.02,STEELD);
  }else{
    P.prism([[-1.275,0],[1.275,0],[1.275,2.45],[1.12,2.62],[-1.12,2.62],[-1.275,2.45]],bl,0,1.38,bz0,body,{hull:.008});
    P.box(2.6,.35,bl,0,1.38,bz0+bl/2,shade(body,.55),{edges:false,small:true});
  }
  for(const sg of [-1,1]){
    P.decal(isC?logoTex('droga:tirChlS',384,120,null,'#1b4a9a',IMP(66),'FRIGO-TRANS','Chłodnie  Tel. 0-601 555 100'):logoTex('droga:tirPlS',384,120,null,'#f4efe0',IMP(66),'TRANS-KRAJ  Jan Nowak i Syn','Tel. 0-602 777 123'),5.6,1.76,sg*1.278,2.8,bz0+bl/2,{ry:sg*PI/2});
    if(!isC)for(let k=0;k<9;k++)S(P,.02,2.3,.05,sg*1.28,1.5,bz0+.8+k*1.45,shade(body,.55));
    for(const z of [.2,2.4,4.6,6.8,8.5])L(P,.05,.1,.25,sg*1.28,1.1,z,0xffa020);
  }
  for(const z of [3.6,5.0,6.4])for(const sx of [-1,1]){wheel(P,sx*1.0,.5,z,.5,.45);}
  for(const sx of [-1,1]){S(P,.5,.45,.04,sx*1.0,.1,7.2,DARK);S(P,.8,.16,.18,sx*.9,.85,2.3,STEELD)}
  S(P,2.4,.18,.12,0,.62,bz0+bl+.02,STEELD);S(P,2.55,.1,.1,0,.84,bz0+bl+.02,0xcc2020);
  for(const sx of [-1,1])L(P,.2,.4,.05,sx*1.1,1.4,bz0+bl+.03,0xd02020);
  P.decal(plate(o.seed+5),.52,.11,0,.72,bz0+bl+.05,{ry:0});
  P.col(-1.3,1.3,-8.45,-5.35,3.3);P.col(-1.3,1.3,-5.35,8.15,4.0);
});

/* ============================ AUTOBUS PKS (AUTOSAN H9) ============================ */
const bodyOutline=(top,axF,axR,ar,y0)=>{const arch=cs=>{const a=[];for(let k=0;k<=6;k++){const t=PI-PI*k/6;a.push([cs+Math.cos(t)*ar,y0+Math.sin(t)*ar*1.02])}return a};return top.map(p=>p.slice()).concat(arch(axR),arch(axF))};
const busSide=(flip)=>atlas('droga:busSide'+(flip?'L':'R'),640,132,(g,w,h)=>{
  const X=(s,wd)=>flip?w-s-wd:s;   // s od tyłu ku przodowi (prawa burta); flip = lewa burta (przód po lewej)
  g.fillStyle='#15110e';
  const pane=(s0,s1,y0,y1)=>{const x=X(s0*64,(s1-s0)*64),wd=(s1-s0)*64;g.fillStyle='#14100c';g.fillRect(x-2,y0-2,wd+4,y1-y0+4);
    const gr=g.createLinearGradient(x,y0,x+wd,y1);gr.addColorStop(0,'#9cc0d2');gr.addColorStop(1,'#33505f');g.fillStyle=gr;g.fillRect(x,y0,wd,y1-y0);
    g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.moveTo(x+4,y0);g.lineTo(x+wd*.4,y0);g.lineTo(x+wd*.1,y1);g.lineTo(x+4,y1);g.fill()};
  g.fillStyle='#14100c';g.fillRect(0,18,w,4);
  for(const [a,b] of [[.4,1.8],[2.0,3.4],[3.6,4.9],[5.2,6.6],[6.8,8.2]])pane(a,b,22,76);
  pane(.35,1.0,22,76);
  for(const [a,b] of [[8.55,9.2],[9.25,9.85]]){pane(a,b,22,h-16)}       // drzwi przednie (2 skrzydła, szyby do dołu)
  for(const [a,b] of [[4.95,5.45]]){pane(a,b,22,h-16);pane(5.5,6.0,22,h-16)};
  g.strokeStyle='#14100c';g.lineWidth=3;g.strokeRect(X(8.5*64,1.4*64),20,1.4*64,h-34);
});
defProp('autosanH9',{name:'Autobus PKS Autosan H9',cat:C,dims:[2.7,3.25,10.2],cover:true,variants:['kremowy','bialy','zolty'],
  note:'Przód -Z. 10,0 x 2,5 x 3,15 m, rozstaw osi 4,7 (Wikipedia). Drzwi po prawej (+X): przednie i środkowe. Lakier z wariantu; tablica kierunku i PKS.'},(P,o,r)=>{
  const v=o.variant||r.pick(['kremowy','bialy','zolty']),pal={kremowy:[0xe4dcc0,0x9a2a20],bialy:[0xe8e8e2,0x2a5a9a],zolty:[0xe0b83a,0x4a3a2a]}[v],bc=pal[0],sc=pal[1];
  const y0=.42,ar=.58,axF=2.8,axR=-1.9,Wd=2.5;
  const top=[[5,y0],[5,2.55],[4.92,2.95],[4.6,3.15],[-4.7,3.15],[-5,2.95],[-5,y0]];
  P.add(sideProfile(bodyOutline(top,axF,axR,ar,y0),Wd,.05),0,0,0,bc,{hull:.012});
  S(P,1.6,.5,5.8,0,y0,-(axF+axR)/2,0x1a1612,{});
  for(const sg of [-1,1]){
    S(P,.03,.34,9.7,sg*1.255,.95,0,sc);S(P,.03,.05,9.7,sg*1.255,.91,0,shade(sc,.7));
    P.decal(busSide(sg<0),9.6,1.98,sg*1.258,2.0,0,{ry:sg*PI/2});
    P.decal(logoTex('droga:pks',160,56,null,'#f4efe0',IMP(44),'PKS'),1.0,.3,sg*1.262,1.12,-.45,{ry:sg*PI/2});
    for(const [ax,al] of [[axF,0],[axR,0]]){wheel(P,sg*1.0,.5,-ax,.5,.34,0x9aa0a4,10)}
    S(P,.1,.28,.12,sg*1.3,2.4,-4.8,DARK);
    for(const z of [-4.7,4.7])L(P,.04,.1,.3,sg*1.256,.62,z,0xffa020);
  }
  P.decal(windshield(),2.3,1.2,0,2.0,-5.007,{ry:PI});S(P,2.4,.5,.14,0,.4,-5.03,STEELD);
  const dest=r.pick(['ZAKOPANE','KRAKÓW','RZESZÓW','OPOLE','KIELCE']);
  P.decal(logoTex('droga:dest'+dest,192,40,'#0e0a08','#ffb030',FNT(30),dest),1.7,.34,0,2.88,-5.008,{ry:PI});
  for(const sx of [-1,1]){L(P,.3,.2,.05,sx*.95,.85,-5.03,0xfff4c8);L(P,.15,.14,.05,sx*1.07,.85,-5.03,0xff9a2a)}
  S(P,1.2,.3,.05,0,.9,-5.03,DARK);P.decal(plate(o.seed+2),.52,.11,0,.58,-5.06,{ry:PI});wipers(P,1.2,-5.02,-1);
  P.decal(windshield(),1.6,.8,0,2.1,5.01,{});S(P,2.4,.5,.12,0,.42,5.03,STEELD);S(P,1.4,.9,.05,0,.9,5.03,0x2a2622);for(let k=0;k<5;k++)S(P,1.4,.02,.05,0,1.0+k*.14,5.06,STEELD);
  for(const sx of [-1,1])L(P,.22,.34,.05,sx*1.0,1.1,5.04,0xd02020);P.decal(plate(o.seed+9),.52,.11,0,.7,5.06,{});
  S(P,1.0,.1,1.5,0,3.15,-1,0xd8d6d0);S(P,.9,.12,1.2,0,3.15,3,0xd8d6d0);
  P.col(-1.3,1.3,-5.05,5.05,3.2);
});

/* ============================ JELCZ ============================ */
defProp('jelcz',{name:'Jelcz 315 (ciężarówka z plandeką)',cat:C,dims:[2.66,3.7,8.3],cover:true,variants:['plandeka','skrzynia'],
  note:'Przód -Z, 8,0 x 2,5 m, 4x2, kabina z długą atrapą. plandeka: przykryta (3,6 m); skrzynia: otwarta z ładunkiem (burty 0,55 m).'},(P,o,r)=>{
  const v=o.variant||r.pick(['plandeka','skrzynia']),cab=r.pick([0x4a5a3a,0x2a5a9a,0xc86a1c,0x8a8d90,0x7a1c24]),tarp=r.pick([0x6a7a4a,0x3a5a7a,0x8a6a3a]);
  S(P,.95,.3,7.7,0,.8,.0,STEELD);
  P.add(sideProfile([[0,1.15],[1.9,1.15],[1.9,2.5],[1.82,2.85],[.3,2.9],[0,2.9]],2.35,.04),0,0,-2.1,cab,{hull:.012});
  for(const sg of [-1,1]){
    P.decal(cabDoor(sg>0),1.2,1.05,sg*1.178,2.15,-2.9,{ry:sg*PI/2});
    wheel(P,sg*1.0,.5,-2.9,.5,.3);wheel(P,sg*1.0,.5,1.6,.5,.52);
    S(P,.1,.38,.16,sg*1.28,2.3,-3.7,DARK);L(P,.36,.2,.05,sg*.82,1.3,-4.03,0xfff4c8);
    P.cylc(.3,.3,1.0,sg*.95,.75,.2,STEEL,{seg:8,rx:PI/2,hull:.03,edges:false});S(P,.5,.4,.03,sg*1.0,.1,2.2,DARK);
  }
  S(P,1.7,.5,.06,0,1.1,-4.03,0x2a2622);for(let k=0;k<5;k++)S(P,1.7,.02,.07,0,1.15+k*.09,-4.03,0x9a9ea2);
  S(P,2.4,.3,.3,0,.55,-4.1,STEELD);P.decal(windshield(),2.1,.85,0,2.1,-4.012,{ry:PI}),P.decal(plate(o.seed+3),.52,.11,0,.6,-4.27,{ry:PI});
  S(P,.12,2.3,.12,1.2,1.0,-1.9,0xb8bcc0);
  // skrzynia ładunkowa
  P.box(2.45,.2,5.8,0,1.15,1.1,0x6a4a2a,{});
  const bz=-1.8,bl=5.8;
  P.box(2.45,1.2,.05,0,1.35,bz,0x7a5a34,{edges:false});
  for(const sg of [-1,1])P.box(.05,.55,bl,sg*1.2,1.35,bz+bl/2,0x7a5a34,{edges:false});
  P.box(2.45,.55,.05,0,1.35,bz+bl,0x7a5a34,{edges:false});
  if(v==='plandeka'){P.prism([[-1.22,0],[1.22,0],[1.22,1.5],[1.05,1.75],[-1.05,1.75],[-1.22,1.5]],bl,0,1.9,bz,tarp,{hull:.01});
    for(let k=0;k<5;k++)S(P,2.5,.04,.04,0,1.95+k*.05,bz+.5+k*1.15,shade(tarp,.6));
    P.decal(logoTex('droga:jelczP',256,70,null,'#f0e8d0',IMP(46),'ROLMEX  Skup i Transport'),3.6,.98,1.226,2.7,bz+bl/2,{ry:PI/2});P.decal(logoTex('droga:jelczP',256,70,null,'#f0e8d0',IMP(46),'ROLMEX  Skup i Transport'),3.6,.98,-1.226,2.7,bz+bl/2,{ry:-PI/2});}
  else{for(let i=0;i<6;i++)P.box(.9,.5,.8,(i%2?.55:-.55),1.35+Math.floor(i/2)*.5,bz+1+Math.floor(i/2)*1.7,r.pick([0xb8864a,0x9a6e3a,0x6a4a2a]));
    for(let i=0;i<3;i++)P.box(2.2,.15,.6,0,1.35,bz+bl-.6-i*.65,0xc09a5a,{edges:false,small:true});}
  S(P,2.4,.15,.1,0,.65,4.0,STEELD);for(const sx of [-1,1])L(P,.2,.3,.05,sx*1.05,.8,4.03,0xd02020);P.decal(plate(o.seed+4),.52,.11,0,.7,4.05,{});
  P.col(-1.3,1.3,-4.15,-1.8,2.95);P.col(-1.3,1.3,-1.8,4.05,v==='plandeka'?3.75:2.4);
});

/* ============================ BARIERA ENERGOCHŁONNA ============================ */
defProp('barieraEnergo',{name:'Bariera energochłonna (segment 4 m)',cat:C,dims:[.2,.82,4.0],cover:true,
  note:'Odbojnica W-beam 0,31 m na słupkach C co 2 m, wys. do 0,8 m (norma 0,75-0,8). Segment 4 m wzdłuż Z. Instancing: tak.'},(P,o,r)=>{
  P.prism([[-.015,.46],[0,.46],[.05,.5],[.05,.55],[0,.59],[0,.63],[.05,.67],[.05,.72],[0,.76],[-.015,.76]],4,0,0,-2,r.chance(.5)?0xaeb2b4:0x9aa0a4,{edges:false});
  for(const z of [-1.9,0,1.9]){S(P,.1,.82,.07,-.07,0,z,STEELD);S(P,.1,.14,.1,-.03,.54,z,STEELD)}
  P.colBox(.25,4,.8,.0,0);
});

/* ============================ EKRAN AKUSTYCZNY ============================ */
defProp('ekranAkustyczny',{name:'Ekran akustyczny (segment 4 m)',cat:C,dims:[.35,3.6,4.0],cover:true,
  note:'Słupki HEB co 4 m, cokół betonowy 1,2 m, panele absorpcyjne do 3,5 m (perforowane) + przezroczysty pas górny. Pełna osłona (h 3,6). Instancing: tak.'},(P,o,r)=>{
  const col=r.pick([0x6a8a5a,0x8a8d90,0x9a8a6a]);
  P.box(.34,1.2,4.0,0,0,0,CONC);for(const z of [-1.95,1.95])S(P,.3,3.6,.2,0,0,z,STEELD);
  P.box(.18,2.0,3.8,0,1.2,0,col);S(P,.2,.12,3.8,0,3.3,0,shade(col,.7));
  for(let k=0;k<8;k++)S(P,.2,.05,3.6,0,1.35+k*.24,0,shade(col,.8));
  P.col(-.2,.2,-2,2,3.6);
});

/* ============================ BRAMOWNICA Z TABLICAMI ============================ */
const boardTex=(k)=>atlas('droga:tablica'+k,320,148,(g,w,h)=>{
  const motor=k<3,bg=motor?'#0b4aa8':'#0a6a3a';g.fillStyle='#f4f4ee';g.fillRect(0,0,w,h);g.fillStyle=bg;g.fillRect(5,5,w-10,h-10);
  const sets=[[['KRAKÓW','112'],['KATOWICE','3']],[['WROCŁAW','203'],['OPOLE','38']],[['WARSZAWA','180'],['ŁÓDŹ','72']]][k%3];
  g.fillStyle='#fff';g.textBaseline='middle';
  g.fillStyle='#d8201a';g.fillRect(14,14,48,26);g.fillStyle='#fff';g.font=FNT(22);g.textAlign='center';g.fillText(motor?'A4':'DK94',38,28);
  sets.forEach((s,i)=>{const y=62+i*40;g.fillStyle='#fff';g.font=FNT(30);g.textAlign='left';g.fillText(s[0],20,y);g.textAlign='right';g.fillText(s[1]+' km',w-18,y)});
  g.beginPath();g.moveTo(w-52,34);g.lineTo(w-34,14);g.lineTo(w-16,34);g.lineTo(w-26,34);g.lineTo(w-26,40);g.lineTo(w-42,40);g.lineTo(w-42,34);g.fill()});
defProp('bramownica',{name:'Bramownica z tablicami kierunkowymi',cat:C,dims:[17.5,8.6,1.0],cover:false,
  note:'Rozpiętość 16 m, prześwit 5,5 m, kratownica 0,9 m, 2 tablice 4,8 x 2,2 (niebieskie A/S albo zielone DK). Seed: napisy. Słupy z koliderem.'},(P,o,r)=>{
  const Wd=16,y=5.6,k=Math.abs(Math.floor(o.seed))%3,m=r.chance(.5)?0:3;
  for(const sx of [-1,1]){const x=sx*(Wd/2+.4);P.box(.7,.35,.7,x,0,0,CONCD,{edges:false});P.cyl(.18,.24,y+.6,x,.35,0,STEEL,{seg:8});S(P,.14,.14,.7,x,y-.4,.0,STEELD)}
  for(const z of [-.36,.36]){S(P,Wd+.8,.1,.1,0,y,z,STEELD);S(P,Wd+.8,.1,.1,0,y+.8,z,STEELD)}
  for(let i=0;i<16;i++){const x=-Wd/2+.4+i*(Wd-.4)/15;S(P,.06,.86,.08,x,y,.0,STEEL,{});S(P,.05,1.0,.05,x,y,.36,STEEL,{rx:0,rz:(i%2?.7:-.7)});S(P,.05,1.0,.05,x,y,-.36,STEEL,{rz:(i%2?.7:-.7)})}
  for(const [i,x] of [[0,-3.8],[1,3.8]]){
    P.box(4.8,2.2,.12,x,y+.8,.55,0x8a8d90,{edges:false});P.decal(boardTex(m+(k+i)%3),4.7,2.14,x,y+1.9,.611,{});
    for(const dx of [-2,2])S(P,.08,.5,.12,x+dx,y+.8,.4,STEELD);
  }
  P.col(-Wd/2-.75,-Wd/2-.05,-.35,.35,y+.9);P.col(Wd/2+.05,Wd/2+.75,-.35,.35,y+.9);
});

/* ============================ BILLBOARD ============================ */
const adTex=(k)=>atlas('droga:ad'+k,512,240,(g,w,h)=>{
  const mid=(t,y,f,c='#fff',st)=>{g.font=f;g.textAlign='center';g.textBaseline='middle';if(st){g.lineWidth=7;g.strokeStyle=st;g.lineJoin='round';g.strokeText(t,w/2,y)}g.fillStyle=c;g.fillText(t,w/2,y)};
  if(k===0){const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#ff2fb0');gr.addColorStop(1,'#5a1ad0');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,230,60,.9)';for(let i=0;i<14;i++){const a=i/14*PI*2;g.beginPath();g.moveTo(w*.82,h*.5);g.lineTo(w*.82+Math.cos(a)*190,h*.5+Math.sin(a)*190);g.lineTo(w*.82+Math.cos(a+.1)*190,h*.5+Math.sin(a+.1)*190);g.fill()}
    mid('ŻÓŁTE KANAPKI',70,IMP(74),'#ffe83a','#2a0a50');mid('NOWA PŁYTA „Kocham Cię jak Fiata”',138,FNT(30),'#fff','#2a0a50');mid('TRASA 2000  •  BILETY W KASACH',196,FNT(26),'#ffe83a','#2a0a50')}
  else if(k===1){g.fillStyle='#0a1a3a';g.fillRect(0,0,w,h);const gr=g.createRadialGradient(w*.5,h*.5,10,w*.5,h*.5,260);gr.addColorStop(0,'#2ad8ff');gr.addColorStop(1,'#0a1a3a');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='#e8f4ff';g.beginPath();g.arc(66,70,46,0,7);g.fill();g.strokeStyle='#4a6a8a';g.lineWidth=2;for(let i=-40;i<=40;i+=16){g.beginPath();g.moveTo(66+i,26);g.lineTo(66+i,114);g.stroke();g.beginPath();g.moveTo(22,70+i);g.lineTo(110,70+i);g.stroke()}
    mid('DISCO POLO',84,IMP(88),'#ffffff','#e8208a');mid('NON STOP',152,IMP(70),'#ffe83a','#e8208a');mid('Radio DISKO-FM 99,9  •  24 h przebojów',212,FNT(26),'#fff','#0a1a3a')}
  else{g.fillStyle='#e8b800';g.fillRect(0,0,w,h);g.fillStyle='#c8221a';g.fillRect(0,0,w,64);g.fillRect(0,h-48,w,48);
    mid('BAR u ZDZICHA',34,IMP(60),'#fff0c0','#4a0a08');mid('ZAPIEKANKI 3 zł • KEBAB 6 zł',112,IMP(44),'#c8221a');mid('PIWO • FRYTKI • KAWA',160,FNT(34),'#3a2400');mid('MOP „Dąbrowa” – zjazd za 2 km  →',h-24,FNT(26),'#fff0c0')}
});
defProp('billboard',{name:'Billboard 5 x 2,4 m (disco polo)',cat:C,dims:[5.4,6.3,1.4],cover:false,
  note:'Standard 5,04 x 2,38 m na słupie ø0,5, podest z lampami. Awers: reklama zależna od seeda (3 projekty: zespół, radio DISKO-FM, Bar u Zdzicha); rewers: inna. Kolider tylko słup.'},(P,o,r)=>{
  const k=Math.abs(Math.floor(o.seed))%3,y=3.2;
  P.cyl(.25,.28,y+.1,0,0,0,STEEL,{seg:8});S(P,.9,.15,.9,0,0,0,CONCD);
  P.box(5.4,2.7,.22,0,y,0,0x3a3e42);P.decal(adTex(k),5.04,2.38,0,y+1.35,.125,{});P.decal(adTex((k+1)%3),5.04,2.38,0,y+1.35,-.125,{ry:PI});
  S(P,5.4,.06,.7,0,y-.04,.4,STEELD);S(P,5.4,.3,.04,0,y+.02,.75,STEELD,{});
  for(const sx of [-1.8,0,1.8]){S(P,.04,.04,1.0,sx,y+2.7,.45,STEELD,{rx:.5});L(P,.3,.1,.14,sx,y+3.0,.85,0xfff6d0)}
  for(const sx of [-1,1])S(P,.06,.9,.06,sx*2.5,y-.9,.3,STEELD,{rz:0});
  P.colBox(.6,.6,6.0);
});

/* ============================ MOP: WIATA, TOI-TOI, BUDKA ============================ */
defProp('wiataMop',{name:'Wiata MOP z ławkami i koszami',cat:C,dims:[7.4,3.6,4.6],cover:true,
  note:'Wiata 7 x 4 m na 6 słupach, dach dwuspadowy, 2 zestawy stół+ławki (2,0 x 0,8, ławy 0,3 x 0,45 m), 2 kosze, tablica MOP.'},(P,o,r)=>{
  const W=7,D=4,ph=1.0,wood=r.pick([0x7a4a2a,0x8a5a32,0x6a4a34]),roof=r.pick([0x3a6a4a,0x6a2a22,0x4a5a68]);
  P.box(W+.6,.1,D+.6,0,0,0,CONC,{edges:false});
  for(const sx of [-1,1])for(const z of [-D/2+.2,0,D/2-.2])P.box(.2,2.4,.2,sx*(W/2-.2),.1,z,wood);
  const a=Math.atan2(ph,W/2),s=Math.hypot(W/2+.3,ph);for(const sg of [-1,1])P.box(s,.1,D+.8,sg*(W/4+.1),2.5+ph/2,0,roof,{rz:-sg*a});
  S(P,W+.1,.08,.1,0,2.5,D/2-.2,wood);
  for(const [x,z] of [[-1.7,0],[1.7,0]]){
    P.box(2.0,.06,.8,x,.76,z,wood);for(const sz of [-1,1]){P.box(2.0,.05,.3,x,.45,z+sz*.65,wood);S(P,.06,.45,.3,x-.9,0,z+sz*.65,STEELD);S(P,.06,.45,.3,x+.9,0,z+sz*.65,STEELD)}
    for(const sx of [-1,1])S(P,.06,.7,.7,x+sx*.85,.1,z,STEELD);
  }
  for(const sx of [-1,1]){P.cyl(.22,.2,.8,sx*(W/2+.1),.1,-D/2+.1,0x3a6a4a,{seg:8});S(P,.46,.04,.46,sx*(W/2+.1),.9,-D/2+.1,STEELD)}
  S(P,.12,2.4,.12,-W/2-.5,.1,D/2,STEELD);P.decal(logoTex('droga:mop',192,96,'#0b4aa8','#fff',FNT(40),'MOP','Miejsce Obsługi Podróżnych'),1.4,.7,-W/2-.5,2.1,D/2+.07);
  for(const sx of [-1,1])for(const sz of [-1,1])P.col(sx*(W/2-.2)-.12,sx*(W/2-.2)+.12,sz*(D/2-.2)-.12,sz*(D/2-.2)+.12,3.6);
  P.col(-2.7,-.7,-.4,.4,.85);P.col(.7,2.7,-.4,.4,.85);
});
defProp('toiToi',{name:'Toaleta przenośna (toi-toi)',cat:C,dims:[1.15,2.35,1.25],cover:true,variants:['niebieska','zielona'],
  note:'1,1 x 1,2 x 2,3 m, wentylator na dachu, wskaźnik wolne/zajęte. Pełna osłona (h 2,3).'},(P,o,r)=>{
  const v=o.variant||r.pick(['niebieska','zielona']),c=v==='niebieska'?0x2a6ac0:0x3a8a4a;
  P.box(1.1,.12,1.2,0,0,0,0xd8d4c8,{edges:false});P.box(1.02,2.1,1.1,0,.12,0,c);P.box(1.1,.1,1.2,0,2.22,0,0xe8e4d8);
  S(P,.7,1.9,.04,0,.2,.575,shade(c,1.25),{});S(P,.06,.14,.05,.25,1.1,.6,STEELD);S(P,.1,.1,.03,-.2,1.5,.6,r.chance(.5)?0xd02020:0x20a030,BAS);
  S(P,.24,.16,.24,.25,2.3,-.2,STEELD);P.cyl(.12,.12,.06,.25,2.46,-.2,0x9a9ea2,{seg:8,edges:false,small:true});
  P.colBox(1.1,1.2,2.3);
});
defProp('budkaKebab',{name:'Budka „Bar u Zdzicha” (kebab, zapiekanki)',cat:C,dims:[5.7,3.9,3.4],cover:true,
  note:'Pawilon 4,0 x 2,4 x 2,7 m, okno wydawcze z markizą, neon BAR u ZDZICHA, szyld z menu, komin grilla, stolik z parasolem. Seed: kolor.'},(P,o,r)=>{
  const c=r.pick([0xd8d4c8,0xc8a838,0xa8b8a0,0xc88a68]),aw=r.pick([RED,0x2a6a3a,0x2a5aa8]);
  P.box(4.2,.15,2.7,0,0,0,CONC,{edges:false});P.box(4,2.7,2.4,0,.15,-.1,c);P.box(4.2,.18,2.8,0,2.85,-.1,shade(c,.7));
  S(P,.3,.9,.3,1.3,3.0,-.8,STEELD);
  for(let k=0;k<8;k++)S(P,.5,.04,.7,-1.75+k*.5,2.0,1.4,k%2?0xf4efe0:aw,{rx:.5});
  wallX(P,-2,2,.15,1.05,1.12,.05,shade(c,.8),{edges:false});S(P,2.2,.05,.5,-.6,1.05,1.25,0xcfcfc8,{});
  P.box(2.2,.9,.04,-.6,1.1,1.12,0x1a1612,{edges:false,small:true});L(P,2.0,.7,.03,-.6,1.2,1.14,0xffd890);
  P.cyl(.1,.17,.7,-.5,1.3,1.0,0x9a6a3a,{seg:6,edges:false});S(P,.04,.9,.04,-.5,1.25,1.0,STEELD);
  S(P,.05,2.1,.9,-2.02,.15,.2,0x5a3a22);
  P.decal(atlas('droga:menuKebab',192,144,(g,w,h)=>{g.fillStyle='#f4ecd0';g.fillRect(0,0,w,h);g.fillStyle='#7a1c14';g.fillRect(0,0,w,34);g.fillStyle='#f4ecd0';g.font=IMP(28);g.textAlign='center';g.textBaseline='middle';g.fillText('MENU',w/2,18);g.fillStyle='#7a1c14';g.font=FNT(17);g.textAlign='left';[['KEBAB','6 zł'],['ZAPIEKANKA','3 zł'],['FRYTKI','2 zł'],['PIWO','2,50']].forEach((m,i)=>{g.fillText(m[0],10,56+i*26);g.textAlign='right';g.fillText(m[1],w-10,56+i*26);g.textAlign='left'})}),1.3,.98,1.3,1.5,1.13);
  P.neon(neonTex('droga:zdzich',384,96,(g,w,h)=>{g.fillStyle='#10060a';g.fillRect(0,0,w,h);glowText(g,'BAR u ZDZICHA',w/2,h/2,IMP(58),'#ffcc2a','#fff4c8')}),2.0,.5,-.6,2.55,1.14);
  // stolik z parasolem
  P.cyl(.4,.4,.05,2.7,.72,1.0,0xe8e4d8,{seg:8,edges:false});S(P,.06,.72,.06,2.7,0,1.0,STEELD);P.cyl(.05,.9,.28,2.7,2.05,1.0,aw,{seg:8,edges:false,small:true});S(P,.04,2.0,.04,2.7,.1,1.0,STEELD);
  P.col(-2.0,2.0,-1.3,1.1,3.0);P.col(2.25,3.15,.55,1.45,.8);
});

/* ============================ DROBNICA: słupek km, pachołek, kompresor, znak ============================ */
defProp('slupekKm',{name:'Słupek kilometrowy',cat:C,dims:[.14,1.0,.12],cover:false,note:'Słupek hektometrowy/kilometrowy 1,0 m, biały z czarnymi pasami i czerwoną czapką. Instancing: tak.'},(P,o,r)=>{
  P.box(.14,.7,.1,0,0,0,0xe8e8e2,{edges:false});S(P,.15,.12,.11,0,.7,0,RED);S(P,.15,.08,.11,0,.45,0,0x15110e);S(P,.15,.08,.11,0,.2,0,0x15110e);
  P.col(-.1,.1,-.1,.1,1.0);
});
defProp('pacholek',{name:'Pachołek drogowy',cat:C,dims:[.4,.75,.4],cover:false,note:'Stożek 0,75 m z pasami odblaskowymi i podstawą 0,4 x 0,4. Instancing: tak.'},(P,o,r)=>{
  S(P,.4,.04,.4,0,0,0,0x15110e);P.cyl(.035,.15,.72,0,.04,0,0xf06a1c,{seg:8,edges:false});P.cyl(.07,.1,.1,0,.4,0,0xf4f4ee,{seg:8,edges:false,small:true});P.cyl(.05,.065,.06,0,.5,0,0xf4f4ee,{seg:8,edges:false,small:true});
  P.col(-.2,.2,-.2,.2,.75);
});
defProp('wysepkaKompresor',{name:'Wysepka z kompresorem, odkurzaczem i koszem',cat:C,dims:[3.4,2.0,1.2],cover:true,
  note:'Wysepka 3,2 x 1,0 x 0,16 m: kompresor/pompka do opon (słupek 1,8 m, manometr), odkurzacz, kosz 120 l.'},(P,o,r)=>{
  P.box(3.2,.16,1.1,0,0,0,CONCD,{edges:false});S(P,3.22,.05,1.12,0,.12,0,YEL);
  P.box(.55,1.75,.4,-1.0,.16,0,0x2a5aa8);S(P,.4,.4,.02,-1.0,1.2,.21,0xf4efe0,{});P.cylc(.12,.12,.04,-1.0,1.55,.215,0xf4efe0,{seg:10,rx:PI/2,edges:false,small:true});S(P,.3,.06,.02,-1.0,1.08,.215,DARK);
  for(let k=0;k<6;k++)S(P,.3,.05,.05,-.85,.7+k*.05,.24,DARK,{rz:.0});
  P.box(.5,1.5,.38,.2,.16,0,0xd8d4c8);S(P,.34,.3,.02,.2,1.1,.2,DARK);S(P,.12,.12,.12,.2,.8,.25,RED,{});
  P.cyl(.28,.26,.9,1.2,.16,0,0x6a7a6a,{seg:10,hull:.03});S(P,.6,.05,.6,1.2,1.06,0,STEELD);S(P,.34,.04,.34,1.2,1.1,0,0x15110e);
  P.col(-1.3,-.7,-.25,.25,1.9);P.col(-.1,.5,-.22,.22,1.7);P.col(.9,1.5,-.3,.3,1.1);
});
defProp('znakStacjaPaliw',{name:'Znak „STACJA PALIW” (informacyjny)',cat:C,dims:[.95,3.0,.1],cover:false,
  note:'Znak niebieski 0,9 x 0,9 m (symbol dystrybutora, odległość 300 m) na słupie ø60, dwustronny. Pasek PALIWEX u dołu. Kolider słup.'},(P,o,r)=>{
  const tx=atlas('droga:znakStacja',192,192,(g,w,h)=>{g.fillStyle='#f4f4ee';g.fillRect(0,0,w,h);g.fillStyle='#0b4aa8';g.fillRect(8,8,w-16,h-16);g.fillStyle='#fff';
    g.fillRect(60,34,50,86);g.fillStyle='#0b4aa8';g.fillRect(68,42,34,22);g.fillStyle='#fff';g.fillRect(110,50,12,50);g.fillRect(118,50,20,8);g.fillRect(132,50,8,50);g.fillRect(66,120,38,8);
    g.font=FNT(24);g.textAlign='center';g.fillText('STACJA PALIW',w/2,150);g.font=FNT(22);g.fillText('300 m',w/2,176)});
  S(P,.06,3.0,.06,0,0,0,0x6a7a80);P.box(.9,.9,.05,0,2.1,.04,0xf4f4ee,{edges:false});P.decal(tx,.9,.9,0,2.55,.067,{});P.decal(tx,.9,.9,0,2.55,.013,{ry:PI});
  P.colBox(.3,.3,3.0);
});

/* ============================ JEZDNIA, WIADUKT, LATARNIA ============================ */
defProp('jezdnia',{name:'Odcinek jezdni z liniami (10 m)',cat:C,dims:[9.3,.06,10.0],dimsV:{lokalna:[9.3,.06,10],ekspresowa:[11.3,.06,10]},cover:false,variants:['lokalna','ekspresowa'],
  note:'Segment 10 m wzdłuż Z: asfalt, linie krawędziowe (ciągłe), oś/pasy (przerywane 4 m / 8 m... skrócone), łaty i pęknięcia. lokalna 7 m + pobocza; ekspresowa 2 pasy 3,5 + awaryjny. Kolider: brak.'},(P,o,r)=>{
  const v=o.variant||'lokalna',Wd=v==='lokalna'?8.5:10.5,xs=0,asph=r.pick([0x45464a,0x4a4a4e,0x3e4044]);
  P.box(Wd,.04,10,xs,0,0,asph,{edges:false,small:true});
  const line=(x,w,z0,z1,c)=>P.box(w,.012,z1-z0,x,.04,(z0+z1)/2,c,{edges:false,small:true});
  if(v==='lokalna'){line(-3.5,.15,-5,5,0xe8e8e2);line(3.5,.15,-5,5,0xe8e8e2);for(const z of [-4.5,-.5])line(0,.15,z,z+4,0xe8e8e2)}
  else{line(-4.75,.15,-5,5,0xe8e8e2);line(2.25,.2,-5,5,0xe8e8e2);for(const z of [-4.5,.5])line(-1.25,.15,z,z+3,0xe8e8e2)}
  for(let i=0;i<r.int(2,4);i++)P.box(r.range(.8,2),.014,r.range(.8,2.6),r.range(-3,3),.04,r.range(-4,4),shade(asph,r.range(.8,1.15)),{edges:false,small:true});
  for(let i=0;i<r.int(1,3);i++)P.cyl(r.range(.15,.35),r.range(.15,.35),.016,r.range(-3,3),.04,r.range(-4,4),0x2a2b2e,{seg:7,edges:false,small:true});
  for(const sx of [-1,1])S(P,.4,.03,10,xs+sx*(Wd/2+.2),0,0,0x8a8062);
});
defProp('wiaduktDrogowy',{name:'Wiadukt drogowy (segment)',cat:C,dims:[39.0,7.6,10.0],cover:true,
  note:'Pomost 24 x 10 m na wys. 5,0-6,2 m (prześwit 4,8-5,0 m), dwa rzędy 3 podpór, belki, parapety betonowe 0,9 m + poręcz, nasypy po obu końcach (+8 m). Wzdłuż X. Kolidery: podpory i parapety.'},(P,o,r)=>{
  const L0=24,Wd=10,y=5.0,th=1.2,emb=r.pick([0x6f7f4a,0x7a8a52]);
  P.box(L0,.4,Wd,0,y+.8,0,CONC);for(const z of [-3.5,-1.2,1.2,3.5])S(P,L0,.8,.5,0,y,z,CONCD);
  P.box(L0,.1,Wd,0,y+1.2,0,ASPH,{edges:false,small:true});
  for(const sz of [-1,1]){P.box(L0,.9,.3,0,y+1.3,sz*(Wd/2-.15),CONC);S(P,L0,.06,.06,0,y+2.3,sz*(Wd/2-.15),STEEL);for(let x=-L0/2+.5;x<L0/2;x+=2)S(P,.06,.4,.06,x,y+2.2-.0,sz*(Wd/2-.15),STEEL,{})}
  for(const sx of [-1,1])for(const z of [-3.5,0,3.5]){const x=sx*7;P.cyl(.45,.5,y,x,0,z,CONC,{seg:8});S(P,1.2,.4,1.0,x,y-.4,z,CONCD)}
  for(const sx of [-1,1]){S(P,.6,y,Wd,sx*8.8,0,0,CONC,{edges:true});P.prism([[0,0],[sx*11,0],[0,y+.7]],Wd,sx*8.5,0,-Wd/2,emb,{edges:false})}
  for(const sx of [-1,1]){for(const z of [-3.5,0,3.5])P.col(sx*7-.5,sx*7+.5,z-.5,z+.5,y);P.col(Math.min(sx*8.5,sx*12),Math.max(sx*8.5,sx*12),-Wd/2,Wd/2,y+.7);P.col(Math.min(sx*12,sx*15),Math.max(sx*12,sx*15),-Wd/2,Wd/2,3.4);P.col(Math.min(sx*15,sx*19.5),Math.max(sx*15,sx*19.5),-Wd/2,Wd/2,1.6)}
});
defProp('latarniaAutostrady',{name:'Latarnia autostradowa (maszt 11 m)',cat:C,dims:[5.2,11.4,.5],dimsV:{pojedyncza:[3.0,11.4,.5],podwojna:[5.2,11.4,.5]},cover:false,variants:['pojedyncza','podwojna'],
  note:'Maszt stożkowy 11 m, 1 lub 2 wysięgniki 2,2 m z oprawami sodowymi (MeshBasic). Wysięgniki wzdłuż X. Instancing: tak.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.5)?'pojedyncza':'podwojna');
  P.box(.6,.4,.6,0,0,0,CONCD,{edges:false});P.cyl(.07,.17,11.0,0,.4,0,0x8a8e90,{seg:8});S(P,.34,.8,.34,0,.4,0,STEELD);
  for(const sg of (v==='podwojna'?[-1,1]:[1])){S(P,2.2,.07,.08,sg*1.1,11.1,0,0x8a8e90,{rz:sg*-.12});S(P,.9,.16,.35,sg*2.15,11.12,0,0x9a9ea2,{});L(P,.8,.04,.3,sg*2.15,11.07,0,0xffd890)}
  P.colBox(.7,.7,11.5);
});
