// Zieleń i małe elementy rynku: drzewa, krzewy, słup ogłoszeniowy, studnia, rower, donice.
import {defProp,atlas,shade,mixc} from './lib.js';

const PI=Math.PI;
const greens=[0x4f8a3a,0x5a9a3f,0x3f7a35,0x6aa845];

/** Gałąź/rura od punktu (x,y,z) w kierunku azymutu az i pochylenia tilt (od pionu), długość len; zwraca koniec. */
function limb(P,x,y,z,az,tilt,len,r0,r1,col){
  const dx=-Math.sin(tilt)*Math.cos(az),dy=Math.cos(tilt),dz=Math.sin(tilt)*Math.sin(az);
  P.cylc(r1,r0,len,x+dx*len/2,y+dy*len/2,z+dz*len/2,col,{seg:5,rz:tilt,ry:az,edges:false});
  return [x+dx*len,y+dy*len,z+dz*len];
}

/* ---------- Drzewo ---------- */
// lipa ~8 m (korona ø5 m), topola ~12 m, brzoza ~7 m, świerk ~7,5 m, martwe drzewo ~5 m. Korony z ikosaedrów (kontur-kadłub).
defProp('drzewo',{name:'Drzewo',cat:'zieleń',dims:[5,9,5],variants:['lipa','topola','brzoza','swierk','martwe'],cover:true,
  note:'Pień ma kolider, korona nie. Odmiana i odcienie wg seeda.'},(P,o,r)=>{
  const v=o.variant||r.pick(['lipa','lipa','topola','brzoza','swierk','martwe']),g0=r.pick(greens);
  const lean=r.range(-.04,.04);
  if(v==='lipa'){
    const bark=r.pick([0x5a4632,0x4a3a2a]);
    P.cyl(.17,.3,4.4,0,0,0,bark,{seg:7,rz:lean});
    P.cyl(.3,.38,.35,0,0,0,bark,{seg:7,edges:false});
    for(let i=0;i<3;i++)limb(P,0,3.5+i*.35,0,r.range(0,6.28),.7+r.range(0,.3),1.6,.1,.05,bark);
    const n=6+r.int(0,2);
    for(let i=0;i<n;i++){const a=i/n*PI*2+r.range(-.3,.3),rad=r.range(1.1,1.7),y=r.range(5.0,7.4);
      P.ico(r.range(1.4,2.0),Math.cos(a)*rad,y,Math.sin(a)*rad,mixc(g0,0x2f6a2a,r()*.5),{detail:0,ry:r()*3,rx:r()*3})}
    P.ico(1.6,0,7.4,0,shade(g0,1.1),{detail:0});
    P.colBox(.6,.6,4);
  }else if(v==='topola'){
    P.cyl(.14,.26,5,0,0,0,0x6a5a46,{seg:7,rz:lean});
    for(let i=0;i<6;i++)P.ico(1.0,r.range(-.25,.25),4.2+i*1.35,r.range(-.25,.25),mixc(g0,0x2f6a2a,r()*.5),{detail:0,sy:1.6-i*.08,sx:.85-i*.04,sz:.85-i*.04,ry:r()*3});
    P.colBox(.5,.5,4);
  }else if(v==='brzoza'){
    const c=0x6aa04a;
    P.cyl(.07,.13,5.2,0,0,0,0xe8e4d8,{seg:6,rz:lean});
    for(let i=0;i<9;i++)P.box(.12,.04+r()*.05,.12,0,.4+i*.5+r()*.2,0,0x1c1c1c,{ry:r()*3,small:true,edges:false,sx:1.2,sz:1.2});
    for(let i=0;i<2;i++)limb(P,0,3.6+i*.7,0,r.range(0,6.28),.55,1.6,.06,.03,0xe8e4d8);
    for(let i=0;i<4;i++){const a=i/4*PI*2+r.range(0,1);P.ico(r.range(1.0,1.4),Math.cos(a)*.9,r.range(4.6,6.4),Math.sin(a)*.9,mixc(0x9ac85a,c,r()*.7),{detail:0,ry:r()*3})}
    P.ico(1.2,0,6.6,0,0x9ac85a,{detail:0});
    P.colBox(.35,.35,4);
  }else if(v==='swierk'){
    const c=r.pick([0x2f5a35,0x2a4f30,0x35623a]);
    P.cyl(.14,.22,1.4,0,0,0,0x4a3a2a,{seg:6});
    [[2.0,2.4,.8],[1.65,2.2,2.0],[1.3,2.0,3.2],[.95,1.8,4.4],[.55,1.6,5.6]].forEach(([rad,h,y],i)=>P.cyl(.02,rad,h,0,y,0,mixc(c,0x3f7a45,i*.12),{seg:8,ry:r()*3,hull:.03,edges:false}));
    P.colBox(.5,.5,3);
  }else{
    const bark=0x5a4c3e;
    P.cyl(.1,.26,3.8,0,0,0,bark,{seg:6,rz:lean});
    let top=[0,3.6,0];
    for(let i=0;i<5;i++){const [ex,ey,ez]=limb(P,0,2.2+i*.4,0,r.range(0,6.28),.5+r.range(0,.5),1.8-i*.15,.07,.03,bark);
      if(r.chance(.7))limb(P,ex,ey,ez,r.range(0,6.28),.8,.9,.03,.015,bark)}
    limb(P,0,3.7,0,r.range(0,6.28),.2,1.3,.07,.03,bark);
    P.colBox(.5,.5,3);
  }
});

/* ---------- Krzew / żywopłot ---------- */
defProp('krzew',{name:'Krzew',cat:'zieleń',dims:[2.1,1.2,.9],variants:['krzak','zywoplot','rozkwitly'],cover:false,
  note:'Żywopłot (2,0 m) daje osłonę; opts.len = długość.'},(P,o,r)=>{
  const v=o.variant||r.pick(['krzak','zywoplot','rozkwitly']),g0=r.pick(greens);
  if(v==='zywoplot'){
    const len=o.len||2,n=Math.max(2,Math.round(len/.55));
    P.box(len,.18,.5,0,0,0,0x5a4632,{edges:false,small:true});
    for(let i=0;i<n;i++)P.ico(.5,-len/2+.25+i*(len-.5)/(n-1),.62+r()*.08,0,mixc(g0,0x2f6a2a,r()*.4),{detail:0,sy:.95,sz:.7,sx:1.0,ry:r()*3,hull:.05});
    P.col(-len/2,len/2,-.3,.3,1.0);P.cover=true;
  }else{
    const n=3+r.int(0,2);
    for(let i=0;i<n;i++){const a=i/n*PI*2+r(),rad=r.range(.2,.45);P.ico(r.range(.35,.55),Math.cos(a)*rad,.4+r()*.35,Math.sin(a)*rad,mixc(g0,0x2f6a2a,r()*.5),{detail:0,ry:r()*3})}
    if(v==='rozkwitly'){const fc=r.pick([0xf06aa8,0xf8f0e0,0xffd23a,0xc04ad8]);for(let i=0;i<9;i++){const a=r.range(0,6.28),rad=r.range(.2,.6);P.box(.07*2,.07*2,.07*2,Math.cos(a)*rad,(.35+r()*.6)-.07,Math.sin(a)*rad,fc,{ry:r()*3,edges:false,small:true})}}
    P.colBox(.7,.7,.9);
  }
});

/* ---------- Słup ogłoszeniowy ---------- */
// Słup ogłoszeniowy ø~1,1 m, wys. ~2,9 m: warstwy plakatów (decal wokół walca), daszek stożkowy, cokół.
defProp('slupOgloszeniowy',{name:'Słup ogłoszeniowy',cat:'ulica',dims:[1.2,2.9,1.2],cover:true,note:'Plakaty losowane wg seeda (3 zestawy w atlasie).'},(P,o,r)=>{
  const k=Math.abs(Math.floor(o.seed))%3,rad=.55;
  const tex=atlas('slup:'+k,768,176,(g,w,h)=>{
    const R=(function(s){return()=>{s=(s*16807)%2147483647;return s/2147483647}})(k*97+11);
    g.fillStyle='#d9d2bd';g.fillRect(0,0,w,h);
    const words=['KONCERT','DISCO POLO','WYBORY','CYRK','ZABAWA','SPRZEDAM','BAL','DYSKOTEKA','LOMBARD','ZŁOTY ZĄB','NOC KASYNA','POKAZ'];
    const cols=['#e0392b','#f2c21c','#2d6cb0','#3a9a4a','#f06aa8','#f4f0e0','#e8742a','#6a3a9a'];
    for(let i=0;i<22;i++){
      const pw=70+R()*90,ph=70+R()*95,x=R()*(w-pw+40)-20,y=R()*(h-ph+30)-15,c=cols[Math.floor(R()*cols.length)];
      g.fillStyle=c;g.fillRect(x,y,pw,ph);g.strokeStyle='rgba(20,15,10,.7)';g.lineWidth=2;g.strokeRect(x,y,pw,ph);
      g.fillStyle=c==='#f4f0e0'||c==='#f2c21c'?'#1a1410':'#fff';g.font='bold '+Math.floor(14+R()*14)+'px Bangers, Impact, sans-serif';g.textAlign='center';
      const wd=words[Math.floor(R()*words.length)];g.fillText(wd,x+pw/2,y+ph*.45);
      g.font='9px sans-serif';g.fillText('SOBOTA '+(18+Math.floor(R()*5))+':00',x+pw/2,y+ph*.7);
      g.fillStyle='rgba(240,230,200,.8)';g.fillRect(x,y,pw*(.15+R()*.2),6);
    }
    g.fillStyle='rgba(30,20,10,.18)';for(let i=0;i<60;i++)g.fillRect(R()*w,R()*h,2+R()*10,1);
  });
  P.cyl(rad+.04,rad+.07,.3,0,0,0,0x4a4f4a,{seg:16,edges:false});
  P.cyl(rad,rad,2.2,0,.3,0,0x6a6a5e,{seg:16,edges:false});
  P.cyl(rad+.03,rad+.03,.08,0,2.46,0,0x3a3f3a,{seg:16,edges:false});
  P.cyl(.04,rad+.08,.34,0,2.54,0,0x3a3f3a,{seg:16});
  P.sph(.06,0,2.9,0,0x3a3f3a,{ws:6,hs:4});
  P.decalGeo(tex,new THREE.CylinderGeometry(rad+.008,rad+.008,1.95,16,1,true),0,1.45,0,{});
  P.colBox(1.15,1.15,2.9);
});

/* ---------- Studnia ---------- */
// Kamienna studnia ø~1,2 m, cembrowina 0,9 m, dachek dwuspadowy na słupkach, kołowrót z wiadrem.
defProp('studnia',{name:'Studnia',cat:'rynek',dims:[1.7,2.5,1.3],cover:true,note:'Cembrowina z 3 warstw kamienia, dach i kołowrót drewniane.'},(P,o,r)=>{
  const st=r.pick([0x9a9484,0x8a8474,0xa59e8a]),wood=r.pick([0x6a4a2a,0x5a3e22]);
  for(let i=0;i<3;i++)P.cyl(.62-i*.01,.63-i*.01,.3,0,i*.3,0,mixc(st,0x6a6454,i*.15),{seg:12,ry:r()});
  for(let i=0;i<14;i++){const a=i/14*PI*2,y=r.int(0,2)*.3+.15;P.box(.24,.15,.15,Math.cos(a)*.63,y-.07,Math.sin(a)*.63,mixc(st,0x6a6454,r()*.5),{ry:-a,edges:false,small:true})}
  P.cyl(.66,.66,.1,0,.9,0,shade(st,.9),{seg:12,edges:false});
  P.cyl(.44,.44,.02,0,.99,0,0x0a0a0a,{seg:12,edges:false,small:true});
  for(const sx of [-1,1])P.box(.11,2.2,.11,sx*.78,0,0,wood);
  P.cylc(.05,.05,1.56,0,1.55,0,wood,{seg:6,rz:PI/2,edges:false});
  P.cylc(.1,.1,.5,0,1.55,0,shade(wood,.8),{seg:8,rz:PI/2,edges:false});
  P.box(.04,.04,.34,.84,1.38,.1,wood,{edges:false,small:true});P.box(.12,.04,.04,.88,1.22,.3,wood,{edges:false,small:true});
  P.cyl(.012,.012,.55,0,1.0,.11,0x2a2218,{seg:4,edges:false,small:true});
  P.cyl(.1,.13,.22,0,.78,.11,0x4a3a2a,{seg:8,edges:false,small:true});
  for(const sx of [-1,1])P.box(1.0,.05,1.5,sx*.5,2.18,0,wood,{rz:-sx*.55});
  P.box(.1,.06,1.5,0,2.43,0,shade(wood,.7),{edges:false});
  P.col(-.9,.9,-.7,.7,.95);
});

/* ---------- Rower ---------- */
// Rower miejski 26": 1,75 x 0,6 x 1,05 m. Rama (męska/damka wg seeda), koła z szprychami, kierownica, siodełko, stopka.
defProp('rower',{name:'Rower',cat:'rynek',dims:[.6,1.1,1.75],variants:['meski','damka'],note:'Stoi na stopce. Przód w -Z.'},(P,o,r)=>{
  const v=o.variant||r.pick(['meski','damka']),fr=r.pick([0x2a5aa8,0xc4271f,0x2d6a3a,0xe0b020,0x303034,0xe8e4d8]);
  const R=.33,zr=.52,zf=-.52,bb=[.3,.1];
  const tube=(y0,z0,y1,z1,rad,col,x=0)=>{const dz=-(z1-z0),dy=y1-y0,len=Math.hypot(dz,dy);P.cylc(rad,rad,len,x,(y0+y1)/2,(z0+z1)/2,col,{seg:5,rx:Math.atan2(dz,dy)*-1,edges:false})};
  // koła: opona (torus) + piasta + dwie szprychy
  for(const z of [zr,zf]){
    P.add(new THREE.TorusGeometry(R-.02,.022,4,16),0,R,z,0x1c1c1c,{ry:PI/2,edges:false,hull:.02});
    P.cylc(.03,.03,.1,0,R,z,0x909498,{seg:6,rz:PI/2,edges:false,small:true});
    for(const a of [0,PI/2])P.box(.006,.6,.006,0,R-.3,z,0xb8bcc0,{rx:a+PI/4,edges:false,small:true});
  }
  const ht=[.97,-.4],seat=[.95,.2];
  tube(bb[0],bb[1],seat[0],seat[1],.018,fr);                     // rura podsiodłowa
  tube(bb[0],bb[1],ht[0]-.08,ht[1],.022,fr);                     // rura skośna
  if(v==='meski')tube(seat[0]-.05,seat[1]-.01,ht[0]-.02,ht[1],.018,fr); // rura górna
  else tube(.62,.14,.62,-.05,.018,fr),tube(.62,-.05,ht[0]-.08,ht[1],.018,fr);
  tube(bb[0],bb[1],R,zr,.014,fr,.05);tube(bb[0],bb[1],R,zr,.014,fr,-.05);           // widełki tylne dolne
  tube(seat[0]-.05,seat[1]-.01,R,zr,.012,fr,.05);tube(seat[0]-.05,seat[1]-.01,R,zr,.012,fr,-.05);
  tube(ht[0]+.02,ht[1],R,zf,.016,shade(fr,.6),.05);tube(ht[0]+.02,ht[1],R,zf,.016,shade(fr,.6),-.05); // widelec
  P.cylc(.016,.016,.58,0,1.08,ht[1]+.04,0x2a2a2a,{seg:5,rz:PI/2,edges:false});                    // kierownica
  tube(ht[0]+.02,ht[1],1.08,ht[1]+.04,.016,0x2a2a2a);
  for(const sx of [-1,1])P.cylc(.022,.022,.1,sx*.28,1.08,ht[1]+.04,0x111111,{seg:5,rz:PI/2,edges:false,small:true});
  tube(seat[0],seat[1],seat[0]+.06,seat[1]+.01,.014,0x888c90);
  P.sph(1,0,seat[0]+.08,seat[1]+.04,0x1c1c1c,{sx:.07,sy:.035,sz:.14,ws:6,hs:4,hull:.1});
  P.cylc(.07,.07,.02,.07,bb[0],bb[1],0x777b80,{seg:8,rz:PI/2,edges:false,small:true});               // zębatka
  for(const sx of [-1,1])P.box(.08,.02,.1,sx*.12,bb[0]-.08*sx,bb[1]+.08*sx,0x222222,{edges:false,small:true});
  tube(.28,.14,0,.28,.012,0x666a6e,.08);                                                            // stopka
  P.colBox(.6,1.75,.95);
});

/* ---------- Donica ---------- */
// Betonowa donica ø~0,85 m, wys. 0,6 m albo drewniana skrzynia 1,2x0,4x0,45 m z kwiatami.
defProp('donica',{name:'Donica',cat:'rynek',dims:[1.2,1.0,.85],variants:['beton','skrzynia'],cover:false,note:'Rośliny i kwiaty wg seeda.'},(P,o,r)=>{
  const v=o.variant||r.pick(['beton','skrzynia']),g0=r.pick(greens),fc=r.pick([0xf06aa8,0xf8f0e0,0xffd23a,0xe0392b,0xc04ad8]);
  if(v==='beton'){
    const c=r.pick([0xa9a59b,0x9a968c,0xb6b0a2]);
    P.cyl(.42,.34,.6,0,0,0,c,{seg:10});P.cyl(.46,.46,.08,0,.6,0,shade(c,.9),{seg:10,edges:false});
    P.cyl(.38,.38,.02,0,.67,0,0x3a2a1a,{seg:10,edges:false,small:true});
    for(let i=0;i<4;i++){const a=i/4*PI*2+r();P.ico(r.range(.25,.35),Math.cos(a)*.18,.85+r()*.2,Math.sin(a)*.18,mixc(g0,0x2f6a2a,r()*.5),{detail:0})}
    for(let i=0;i<7;i++){const a=r.range(0,6.28),rad=r.range(.1,.3);P.box(.06*2,.06*2,.06*2,Math.cos(a)*rad,(.95+r()*.25)-.06,Math.sin(a)*rad,fc,{ry:r()*3,edges:false,small:true})}
    P.colBox(.9,.9,.65);
  }else{
    const w=r.pick([0x8b5a2b,0x6a4a2a,0x3f6b3a]);
    P.box(1.2,.42,.4,0,0,0,w);P.box(1.24,.05,.44,0,.42,0,shade(w,.8),{edges:false});
    P.box(1.12,.03,.32,0,.46,0,0x3a2a1a,{edges:false,small:true});
    for(let i=0;i<5;i++)P.ico(r.range(.14,.2),-.45+i*.225,.58+r()*.1,r.range(-.05,.05),mixc(g0,0x2f6a2a,r()*.5),{detail:0});
    for(let i=0;i<8;i++)P.box(.11,.11,.11,r.range(-.52,.52),.62+r()*.1,r.range(-.1,.1),r.chance(.7)?fc:0xffffff,{ry:r()*3,edges:false,small:true});
    P.colBox(1.24,.44,.45);
  }
});

