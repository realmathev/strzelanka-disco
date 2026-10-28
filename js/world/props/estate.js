// Osiedle (blokowisko PRL): blok z wielkiej płyty, trzepak, plac zabaw, ławka, wiata śmietnikowa, garaże blaszane,
// gablota, antena satelitarna, suszarka, wiata rowerowa, budka z piwem, trafostacja, murek ze schodami, plac z kostki.
// Wymiary rzeczywiste (m), z typowych wyrobów / norm:
//  - Blok WK-70 / typ „Szczecin” i 5-piętrowiec z klatką: sekcja (klatka) ~12 m, trakt 11 m, kondygnacja 2,8 m (moduł),
//    11-piętrowiec ~32 m, balkon 2,2x1,2 m z balustradą 1,05 m, okno pokojowe 1,5x1,35 m z parapetem na 0,95 m.
//  - Trzepak: rura ø60 mm, górny drążek 2,4 m, szer. ~2,4 m; huśtawka podwójna ~2,6x2,2x1,8 m (PN-EN 1176 min. wys. 2,2 m);
//    zjeżdżalnia dziecięca: podest 1,2 m, rynna 0,5 m szer.; piaskownica 2,5x2,5 m, obrzeże 0,25-0,3 m;
//    ławka osiedlowa 1,8-2,0 m, siedzisko 0,45 m; kontener MGB 1100 = 1,37x1,07x1,33 m; blaszak 2,8x5,2 m, drzwi 2,5x2,0 m;
//    trafostacja kontenerowa ~3,0x2,5x2,6 m; schody zewn. wys. stopnia 0,17 m / głęb. 0,30 m; kostka granitowa 10x10 cm.
// Przód/„twarz” patrzy w +Z (jak reszta). Kolory komiksowe (toon + tusz). Detal z atlasu decali, neony tylko MeshBasic.
import {defProp,atlas,neonTex,rng,shade,mixc} from './lib.js';

const PI=Math.PI;
const FONT=s=>s+'px Bangers, Impact, sans-serif';
const lcg=s=>()=>{s=(s*16807)%2147483647;return s/2147483647};

/* ============================ tekstury (atlas) ============================ */
const WCOL=[['#efeadb','#9b9582'],['#7a4f2a','#3a2410'],['#efeadb','#9b9582'],['#efeadb','#9b9582']];
/** Rama okna z szybą przezroczystą (alfa); k: 0 białe, 1 brązowe, 2 firanka, 3 żaluzje. */
function winTex(k){return atlas('estate:win'+k,112,100,(g,w,h)=>{
  const [fc,dk]=WCOL[k];
  g.fillStyle=fc;g.fillRect(0,0,w,9);g.fillRect(0,h-9,w,9);g.fillRect(0,0,9,h);g.fillRect(w-9,0,9,h);g.fillRect(w/2-4,0,8,h);g.fillRect(0,h*.3,w,5);
  g.strokeStyle=dk;g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);g.strokeRect(9,9,w-18,h-18);g.beginPath();g.moveTo(w/2-4,9);g.lineTo(w/2-4,h-9);g.moveTo(w/2+4,9);g.lineTo(w/2+4,h-9);g.moveTo(9,h*.3);g.lineTo(w-9,h*.3);g.moveTo(9,h*.3+5);g.lineTo(w-9,h*.3+5);g.stroke();
  g.fillStyle=dk;g.fillRect(w/2+8,h*.58,4,13);
  if(k===2){const R=lcg(5);g.fillStyle='#f3eedc';g.fillRect(11,11,w/2-17,h-22);g.strokeStyle='#cfc7a8';g.lineWidth=1.5;for(let i=0;i<7;i++){g.beginPath();g.moveTo(14+i*6,12);g.lineTo(12+i*6+R()*3,h-12);g.stroke()}
    g.fillStyle='#d8c9a0';g.fillRect(w/2+9,11,w/2-20,h*.18)}
  if(k===3){g.fillStyle='#c9c2ac';g.fillRect(11,11,w-22,h*.5);g.strokeStyle='#8f8870';g.lineWidth=1.5;for(let y=14;y<h*.5+10;y+=5){g.beginPath();g.moveTo(11,y);g.lineTo(w-11,y);g.stroke()}
    g.fillStyle=fc;g.fillRect(w/2-4,0,8,h)}
})}
/** Drzwi balkonowe + okno (1,6 x 2,1 m). */
function bdoorTex(k){return atlas('estate:bdoor'+k,128,168,(g,w,h)=>{
  const [fc,dk]=WCOL[k===1?1:0];g.fillStyle=fc;
  g.fillRect(0,0,w,8);g.fillRect(0,h-8,w,8);g.fillRect(0,0,8,h);g.fillRect(w-8,0,8,h);g.fillRect(w*.5-4,0,8,h);g.fillRect(0,h*.22,w*.5,5);g.fillRect(w*.5,h*.34,w*.5,5);
  g.strokeStyle=dk;g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);g.strokeRect(8,8,w-16,h-16);g.beginPath();g.moveTo(w*.5-4,8);g.lineTo(w*.5-4,h-8);g.moveTo(w*.5+4,8);g.lineTo(w*.5+4,h-8);g.stroke();
  g.fillStyle=dk;g.fillRect(w*.5-14,h*.52,4,16);g.fillRect(w*.5+11,h*.55,4,13);
  if(k===2){g.fillStyle='#efe8d2';g.fillRect(10,h*.22+7,w*.5-16,h*.78-18)}
})}
const RAIL_C=['#3f78b4','#c24a2b','#4a8a4a','#d4aa2a','#7a8a92'];
/** Balustrada balkonu (front 2,2 m / bok 1,2 m): pręty, blacha falista, oszklona. */
function railTex(k,side){const w=side?96:176;return atlas('estate:rail'+k+(side?'s':''),w,84,(g,_w,h)=>{
  const c=RAIL_C[k%5];
  if(k<5){ // pręty + pochwyt
    g.fillStyle=c;g.fillRect(0,0,w,7);g.fillRect(0,h-9,w,9);g.fillRect(0,0,5,h);g.fillRect(w-5,0,5,h);for(let x=11;x<w-6;x+=10)g.fillRect(x,0,3,h);
    g.strokeStyle='rgba(20,15,10,.9)';g.lineWidth=1.6;g.strokeRect(.8,.8,w-1.6,h-1.6);
  }else if(k===5){ // blacha falista, kolorowa wstęga
    g.fillStyle='#d9d3bd';g.fillRect(0,0,w,h);g.fillStyle=RAIL_C[(w*3)%4];g.fillRect(0,h*.2,w,h*.8);
    g.strokeStyle='rgba(20,15,10,.45)';g.lineWidth=1.5;for(let x=4;x<w;x+=7){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}
    g.strokeStyle='rgba(20,15,10,.9)';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);
  }else{ // zabudowany szkłem (aluminiowe ramy, szyba jasna)
    g.fillStyle='#8fb7c9';g.fillRect(0,0,w,h);g.fillStyle='#e9e5d6';g.fillRect(0,0,w,6);g.fillRect(0,h-7,w,7);g.fillRect(0,0,6,h);g.fillRect(w-6,0,6,h);g.fillRect(w/2-3,0,6,h);
    g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=5;g.beginPath();g.moveTo(14,h-14);g.lineTo(44,12);g.moveTo(34,h-14);g.lineTo(64,12);g.stroke();
    g.strokeStyle='rgba(20,15,10,.9)';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);
  }
})}
/** Płyty: spoiny pionowe i poziome, zacieki, plamy (pasek 12 x 2,8 m, 32 px/m). */
function seamTex(){return atlas('estate:seam',384,90,(g,w,h)=>{
  const R=lcg(77);g.fillStyle='rgba(70,64,52,.85)';g.fillRect(0,h-3,w,3);g.fillRect(0,0,w,1.5);
  g.fillStyle='rgba(70,64,52,.75)';g.fillRect(w*(4.1/12),0,2,h);g.fillRect(w*(7.9/12),0,2,h);
  g.fillStyle='rgba(60,50,38,.62)';for(let i=0;i<9;i++){const x=R()*w,l=14+R()*40;g.fillRect(x,h-3-l,3+R()*3,l)}
  g.fillStyle='rgba(50,44,36,.58)';for(let i=0;i<5;i++)g.fillRect(R()*w,R()*h*.8,8+R()*18,4+R()*7);
})}
function crackTex(k){return atlas('estate:crack'+k,128,128,(g,w,h)=>{
  const R=lcg(31+k*13);g.strokeStyle='rgba(30,26,20,.92)';g.lineWidth=2.4;g.lineJoin='round';
  for(let b=0;b<2;b++){g.beginPath();let x=R()*w,y=0;g.moveTo(x,y);while(y<h){x+=(R()-.5)*34;y+=10+R()*16;g.lineTo(x,y)}g.stroke()}
  g.fillStyle='rgba(120,112,96,.9)';g.beginPath();g.arc(30+R()*60,40+R()*50,9+R()*6,0,7);g.fill()
})}
const TAGS=['ZONK','DISCO','ŁKS 4EVER','90s','PRL','TOMEK+ANIA'];
function grafTex(k){return atlas('estate:graf'+k,192,80,(g,w,h)=>{
  const cols=[['#ff3b8b','#2a0a3a'],['#33d6ff','#06223a'],['#ffd400','#3a2a00'],['#7cff4a','#0c2a06'],['#f4f0e0','#1a1410'],['#ff7a1a','#3a1000']];
  const [c,o]=cols[k%6];g.font=FONT(52);g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=9;g.strokeStyle=o;g.strokeText(TAGS[k%6],w/2,h/2);
  g.fillStyle=c;g.fillText(TAGS[k%6],w/2,h/2);g.lineWidth=2;g.strokeStyle='#fff';g.globalAlpha=.7;g.strokeText(TAGS[k%6],w/2-1,h/2-2)
})}
function doorTex(){return atlas('estate:drzwi',64,100,(g,w,h)=>{
  g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,w,h);
  g.strokeStyle='rgba(15,12,10,.9)';g.lineWidth=2;g.strokeRect(2,2,w-4,h-4);g.strokeRect(8,8,w-16,h*.5);
  g.fillStyle='#9ec0d0';g.fillRect(9,9,w-18,h*.5-2);g.strokeStyle='rgba(60,70,70,.9)';g.lineWidth=1;for(let i=1;i<6;i++){g.beginPath();g.moveTo(9+i*(w-18)/6,9);g.lineTo(9+i*(w-18)/6,h*.5+7);g.stroke();g.beginPath();g.moveTo(9,9+i*h*.5/6);g.lineTo(w-9,9+i*h*.5/6);g.stroke()}
  g.fillStyle='rgba(15,12,10,.9)';g.fillRect(8,h*.62,w-16,3);g.fillRect(8,h*.8,w-16,3);g.fillStyle='#d8d2bd';g.fillRect(w-14,h*.52,6,24)
})}
function domofonTex(){return atlas('estate:domofon',32,48,(g,w,h)=>{
  g.fillStyle='#bfc4c8';g.fillRect(0,0,w,h);g.fillStyle='#222';for(let i=0;i<5;i++)g.fillRect(4,4+i*3,24,1);
  for(let r=0;r<4;r++)for(let c=0;c<3;c++){g.fillStyle='#e9e5d6';g.fillRect(4+c*8,18+r*7,6,5)}g.fillStyle='#c04030';g.fillRect(4,h-6,24,4)
})}
function adresTex(){return atlas('estate:adres',64,32,(g,w,h)=>{
  g.fillStyle='#f2f0e8';g.fillRect(0,0,w,h);g.strokeStyle='#c01818';g.lineWidth=2.5;g.strokeRect(1.5,1.5,w-3,h-3);g.fillStyle='#c01818';g.font=FONT(22);g.textAlign='center';g.fillText('ul. Robotnicza',w/2,15);g.font=FONT(18);g.fillText('12 / klatka B',w/2,28)
})}
function nrTex(n){return atlas('estate:nr'+n,64,64,(g,w,h)=>{
  g.fillStyle='rgba(0,0,0,0)';g.fillStyle='#e9e3cf';g.beginPath();g.arc(32,32,30,0,7);g.fill();g.lineWidth=4;g.strokeStyle='#1a1410';g.stroke();
  g.fillStyle='#1a1410';g.font=FONT(40);g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),32,36)
})}
const tvTex=()=>neonTex('estate:tv',32,32,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#a8e4ff');gr.addColorStop(.5,'#4a9ae0');gr.addColorStop(1,'#2a54b8');g.fillStyle=gr;g.fillRect(0,0,w,h)});

/* ============================ pomocnicze ============================ */
const TAN=(a,b)=>Math.atan2(a,b);
/** Talerz satelitarny (stożek ścięty obrócony ku +Z), konwerter na ramieniu. cx,cy,cz = środek talerza. */
function dish(P,cx,cy,cz,col,R=.4,ry=0){
  const tilt=PI/2-.32,c=Math.cos(ry),s=Math.sin(ry);
  P.add(new THREE.CylinderGeometry(R,R*.08,R*.32,10,1,false),cx,cy,cz,col,{rx:tilt,ry,edges:false,small:true});
  const L=R*1.15,dy=Math.cos(tilt)*L,dz=Math.sin(tilt)*L;
  P.add(new THREE.CylinderGeometry(.012,.012,L,4,1,true),cx+dz*s,cy+dy/2,cz+dz*c,0x3a3d40,{rx:tilt,ry,edges:false,small:true});
  P.add(new THREE.CylinderGeometry(.03,.03,.08,6),cx+dz*s,cy+dy,cz+dz*c,0x23262a,{rx:tilt,ry,edges:false,small:true});
}

/* ============================ BLOK Z WIELKIEJ PŁYTY ============================ */
// Struktura: sekcja (klatka) 12 m: klatka schodowa pośrodku (okno półpiętra, na parterze drzwi z daszkiem, domofonem i lampą),
// po bokach balkony (drzwi balkonowe + okno) i okna pokojowe. Tył: okna kuchenne i pokojowe, bez balkonów.
// Szyby to płaszczyzny: oświetlone = basic (żółte światło, bez visible=false), ciemne = toon; ramy/firanki/żaluzje to decale.
defProp('blokMieszkalny',{name:'Blok z wielkiej płyty',cat:'osiedle',dims:[36.3,18.4,12.9],
  dimsV:{p5:[36.3,18.4,12.9],p11:[24.3,35.2,12.9],p4:[24.3,15.6,12.7]},variants:['p5','p11','p4'],cover:true,
  note:'p5: 5 pięter x3 klatki, p11: 11 pięter x2, p4: 4 piętra x2. Front (balkony, drzwi klatek) w +Z. opts.lit = odsetek zapalonych okien. Instancing: DS.props.instance (kontury kadłubowe).'},(P,o,r)=>{
  const V=o.variant||'p5',[F,S]={p5:[5,3],p11:[11,2],p4:[4,2]}[V]||[5,3];
  const FH=2.8,B=.6,SW=12,D=11,L=S*SW,H=B+F*FH,zf=D/2,top=H;
  const wall=o.wall||r.pick([0xd8d2b8,0xcfcab8,0xbfd0c4,0xe0c9a0,0xd2c0b0,0xc7ccd1]);
  const lit=o.lit!=null?o.lit:.22;
  const gDark=[0x31424f,0x273844,0x4b6579,0x3d5568],gLit=[0xffd36a,0xffc247,0xffe6a0,0xf7b05a];
  const sill=0xc9c5b8,railBase=r.int(0,6),plint=0x77736a;
  const wk=winTex(0),wkB=winTex(1),wkC=winTex(2),wkD=winTex(3),seam=seamTex();
  const winTexs=[wk,wk,wk,wkB,wkC,wkD];
  const tvt=tvTex();let tvs=0,dishes=0;
  // bryła
  P.box(L+.12,B,D+.12,0,0,0,plint);
  P.box(L,F*FH,D,0,B,0,wall);
  P.box(L+.34,.22,D+.34,0,top,0,shade(wall,.68),{edges:false});
  P.box(L+.34,.5,.14,0,top+.22,zf+.1,shade(wall,.8),{edges:false});P.box(L+.34,.5,.14,0,top+.22,-zf-.1,shade(wall,.8),{edges:false});
  P.box(.14,.5,D+.2,L/2+.1,top+.22,0,shade(wall,.8),{edges:false});P.box(.14,.5,D+.2,-L/2-.1,top+.22,0,shade(wall,.8),{edges:false});
  // szyba: back = ściana tylna (patrzy w -Z)
  const glass=(w,h,x,y,z,back)=>{const on=r.chance(lit);P.add(new THREE.PlaneGeometry(w,h),x,y,z+(back?-1:1)*.015,on?r.pick(gLit):r.pick(gDark),{basic:on,edges:false,ry:back?PI:0,small:true});return on};
  const deco=(rc,w,h,x,y,z,back,off=.03)=>P.decal(rc,w,h,x,y,z+(back?-1:1)*off,{ry:back?PI:0});
  // gable
  const nrs=[3,5,7,9,12,15,17,21],nrn=r.pick(nrs);
  for(const sd of [-1,1]){
    for(let f=0;f<F;f++)P.decal(seam,D-.3,FH,sd*(L/2+.012),B+f*FH+FH/2,0,{ry:sd*PI/2});
  }
  P.decal(nrTex(nrn),1.1,1.1,L/2+.03,top-1.4,2.5,{ry:PI/2});
  // rynny
  for(let k=0;k<=S;k++){const x=Math.max(-L/2+.25,Math.min(L/2-.25,-L/2+k*SW));for(const sz of [1,-1])P.cyl(.045,.045,H-.4,x,.3,sz*(zf+.07),0x6a6e70,{seg:5,open:true,edges:false,small:true})}
  for(let s=0;s<S;s++){
    const cx=-L/2+SW/2+s*SW;
    // ---- parter: klatka ----
    const dc=r.pick([0x4a6a5e,0x6a4a38,0x3a4f6a,0x5a5a4a]);
    P.box(1.75,2.4,.06,cx,B,zf+.03,shade(wall,.78),{edges:false});
    P.box(1.3,2.1,.08,cx,B,zf+.08,dc,{edges:false});
    P.decal(doorTex(),1.2,2.0,cx,B+1.05,zf+.13);
    P.box(.05,.34,.07,cx+.5,B+.9,zf+.16,0xcfcab8,{edges:false,small:true});
    P.box(2.7,.12,1.5,cx,B+2.55,zf+.75,0x8f8b80);
    P.box(.06,.5,.06,cx-1.25,B+2.1,zf+1.4,0x555a5e,{edges:false,small:true});P.box(.06,.5,.06,cx+1.25,B+2.1,zf+1.4,0x555a5e,{edges:false,small:true});
    P.box(2.2,.6,.7,cx,0,zf+.35,0x9a968a);P.box(2.0,.3,.5,cx,0,zf+.95,0x908c80,{edges:false});
    P.box(.18,.14,.12,cx-1.15,B+2.2,zf+.12,0xffe9a0,{basic:true});
    P.box(.22,.34,.04,cx+1.05,B+1.1,zf+.02,0x5a5a5a,{edges:false,small:true});P.decal(domofonTex(),.2,.32,cx+1.05,B+1.1,zf+.046);
    P.decal(adresTex(),.5,.25,cx+1.05,B+1.9,zf+.03);
    if(r.chance(.7))P.decal(grafTex(r.int(0,5)),1.0,.42,cx-1.55,B+.75,zf+.03);
    // ---- piętra ----
    for(let f=0;f<F;f++){
      const y0=B+f*FH;
      P.decal(seam,SW,FH,cx,y0+FH/2,zf+.012);P.decal(seam,SW,FH,cx,y0+FH/2,-zf-.012,{ry:PI});
      // klatka: okno półpiętra
      if(f>0){glass(.9,1.3,cx,y0+1.0,zf);P.decal(wk,1.0,1.4,cx,y0+1.0,zf+.03)}
      {glass(.9,1.3,cx,y0+1.0,-zf,true);P.decal(wk,1.0,1.4,cx,y0+1.0,-zf-.03,{ry:PI})}
      for(const sx of [-1,1]){
        // okno pokojowe (front) + parapet
        const x1=cx+sx*5.15,wy=y0+1.625;
        const on=glass(1.4,1.25,x1,wy,zf);P.decal(r.pick(winTexs),1.5,1.35,x1,wy,zf+.03);
        P.box(1.75,.05,.14,x1,y0+.9,zf+.07,sill,{edges:false,small:true});
        if(on&&tvs<3&&r.chance(.3)){tvs++;P.neon(tvt,.46,.36,x1-.35,wy-.1,zf+.045)}
        // balkon
        const bx=cx+sx*2.9,k=r.chance(.78)?railBase:r.int(0,6);
        P.box(2.2,.14,1.2,bx,y0-.14,zf+.6,0xa8a498);
        glass(1.5,2.0,bx,y0+1.03,zf);P.decal(bdoorTex(r.pick([0,0,0,1,2])),1.6,2.1,bx,y0+1.07,zf+.03);
        P.decal(railTex(k,false),2.2,1.04,bx,y0+.52,zf+1.21);
        P.decal(railTex(k,true),1.2,1.04,bx-1.1,y0+.52,zf+.6,{ry:-PI/2});P.decal(railTex(k,true),1.2,1.04,bx+1.1,y0+.52,zf+.6,{ry:PI/2});
        if(dishes<5&&r.chance(.06)){dishes++;dish(P,bx+.5,y0+.72,zf+1.08,0xe8e8e0,.38)}
        else if(r.chance(.09))P.box(.5,.62,.02,bx-.55+r()*1.1,y0+.15,zf+1.12,r.pick([0xe0e0e0,0xd24a3a,0x3a8ad2,0xf0c030]),{edges:false,small:true,rz:r.range(-.05,.05)});
        // tył: okna kuchenne i pokojowe
        const xb1=cx+sx*5.15,xb2=cx+sx*2.9;
        glass(1.4,1.25,xb1,wy,-zf,true);P.decal(r.pick(winTexs),1.5,1.35,xb1,wy,-zf-.03,{ry:PI});
        glass(.95,1.15,xb2,wy,-zf,true);P.decal(r.pick(winTexs),1.05,1.25,xb2,wy,-zf-.03,{ry:PI});
      }
    }
    // pęknięcia na płycie
    if(r.chance(.55))P.decal(crackTex(r.int(0,2)),1.4,1.4,cx+r.pick([-4.2,-1.3,1.3,4.2]),B+r.int(1,Math.max(1,F-1))*FH+.2,zf+.032);
    // dach: maszynownia / kominki, anteny
    if(V==='p11'){P.box(3.4,2.4,3.0,cx,top+.22,-.5,shade(wall,.72));P.box(3.5,.14,3.1,cx,top+2.62,-.5,0x4a4a48,{edges:false})}
    else{for(const dx of [-3.2,3.2])P.box(.9,1.1,.9,cx+dx,top+.22,-2,shade(wall,.65),{edges:false})}
    P.cyl(.28,.28,.55,cx+4.2,top+.22,2,0x7a7e80,{seg:6,edges:false,small:true});
    const ax=cx+r.range(-4,-2),az=r.range(-3,1);
    P.cyl(.025,.025,3.6,ax,top+.22,az,0x6a6e70,{seg:4,open:true,edges:false,small:true});
    for(let i=0;i<3;i++)P.box(1.3-i*.25,.03,.03,ax,top+.22+2.2+i*.55,az,0xb0b4b6,{edges:false,small:true,ry:.5});
  }
  P.colBox(L,D,H+.7);P.cover=true;
});

export {dish,lcg};
