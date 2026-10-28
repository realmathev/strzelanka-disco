// Wyposażenie ulicy (miasto i rynek): latarnie, ławki, wiata, kosze, śmietniki, płoty, barierki, hydrant.
// Wymiary w metrach, z typowych polskich wyrobów (ławka ~1,8 m, kontener MGB 1100 = 1,37x1,07x1,33 m,
// barierka U-12a 2,0x1,1 m, hydrant nadziemny DN80). Przód/„twarz” rekwizytu patrzy w +Z.
import {defProp,atlas,neonTex,glowText,shade,mixc} from './lib.js';

const PI=Math.PI;

/* ---------- Latarnia uliczna ---------- */
// „Kobra” ~7,5 m z wysięgnikiem 1,6 m (typowa uliczna sodówka) i niska osiedlowa z kulistym kloszem ~4,6 m.
defProp('lampaUliczna',{name:'Latarnia uliczna',cat:'ulica',dims:[.5,7.6,1.8],variants:['kobra','kula'],
  note:'Wysięgnik ku +Z. kobra 7,5 m, kula 4,6 m. Klosze i płytka lampy: MeshBasic (świecą).'},(P,o,r)=>{
  const v=o.variant||(r.chance(.65)?'kobra':'kula');
  const pole=r.pick([0x59635a,0x4b5258,0x6a6d66,0x3d4a40]),foot=0x8d8a82;
  if(v==='kobra'){
    P.cyl(.2,.24,.55,0,0,0,foot,{seg:8});
    P.cyl(.075,.1,6.75,0,.55,0,pole,{seg:8});
    P.cyl(.12,.12,.1,0,.55,0,shade(pole,.7),{seg:8});
    const a=PI/2-.2,len=1.65;
    P.cylc(.04,.055,len,0,7.2+Math.cos(a)*len/2,Math.sin(a)*len/2,pole,{seg:6,rx:a,edges:false});
    P.sph(.09,0,7.25,0,pole,{seg:6});
    const hz=Math.sin(a)*len+.05,hy=7.2+Math.cos(a)*len;
    P.sph(1,0,hy+.03,hz,0x8a9094,{sx:.17,sy:.08,sz:.46,hull:.08,ws:10});
    P.box(.28,.02,.66,0,hy-.06,hz,0xfff2b8,{basic:true});
    P.box(.12,.1,.12,0,hy-.02,hz-.4,shade(pole,.8),{edges:false,small:true});
    P.colBox(.45,.45,7.6);
  }else{
    P.cyl(.17,.21,.45,0,0,0,foot,{seg:8});
    P.cyl(.045,.07,3.55,0,.45,0,pole,{seg:8});
    P.cyl(.1,.1,.08,0,.45,0,shade(pole,.7),{seg:8});
    P.cyl(.13,.08,.14,0,4.0,0,shade(pole,.8),{seg:8});
    P.sph(.3,0,4.42,0,0xfff4d2,{basic:true,ws:10,hs:8});
    P.cyl(.02,.3,.2,0,4.62,0,shade(pole,.8),{seg:10});
    P.colBox(.4,.4,4.7);
  }
});

/* ---------- Ławka ---------- */
// Ławka miejska ~1,8x0,55x0,85 m, siedzisko 45 cm: nogi stalowe albo betonowe, deski drewniane (kolor wg seeda).
defProp('lawka',{name:'Ławka',cat:'ulica',dims:[1.8,.9,.55],variants:['stal','beton'],note:'Deski: kolor/braki wg seeda.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.5)?'stal':'beton'),len=o.len||1.8;
  const wood=r.pick([0x8b5a2b,0x3f6b3a,0x2f5f8f,0xb08a4a,0x7a3b2e]);
  const fr=v==='beton'?0xa9a59b:0x2c2f33,hx=len/2-.14;
  for(const sx of [-1,1]){
    if(v==='beton'){P.box(.1,.44,.46,sx*hx,0,.02,fr);P.box(.1,.9,.1,sx*hx,0,-.21,fr)}
    else{P.box(.05,.45,.05,sx*hx,0,.18,fr);P.box(.05,.9,.05,sx*hx,0,-.2,fr,{rx:-.05});P.box(.05,.04,.46,sx*hx,.43,0,fr);P.box(.05,.04,.5,sx*(hx+.04),.64,0,fr)}
  }
  for(const z of [.16,0,-.16]){if(!r.chance(.12))P.box(len-.1,.04,.13,0,.43,z,wood,{rx:.02})}
  for(const y of [.58,.74])if(!r.chance(.1))P.box(len-.1,.13,.03,0,y,-.25-(y-.58)*.2,wood,{rx:-.2});
  P.box(len-.1,.04,.04,0,.2,0,fr,{edges:false,small:true});
  P.colBox(len,.5,.5);
});

/* ---------- Wiata przystankowa ---------- */
// Wiata ~3,2x1,5x2,5 m: szkło jako same ramy (widać przez nie) + smugi odblasków, lightbox z reklamą, rozkład jazdy, słup z tabliczką.
defProp('wiataPrzystankowa',{name:'Wiata przystankowa',cat:'ulica',dims:[3.4,2.75,1.8],cover:true,
  note:'Reklama w lightboxie to neon static (świeci stale). Znak „przystanek” na słupku obok.'},(P,o,r)=>{
  const fr=r.pick([0x6e757a,0x2f4f7a,0x3b3f44]),roof=shade(fr,.75),hx=1.55,zb=-.7,zf=.7;
  for(const sx of [-1,1])for(const sz of [zb,zf])P.box(.08,2.3,.08,sx*hx,0,sz,fr);
  P.box(3.4,.1,1.7,0,2.3,0,roof,{rx:.03});
  P.box(3.4,.18,.05,0,2.22,.86,fr,{edges:false});
  P.box(3.1,.05,.05,0,.18,zb,fr);P.box(3.1,.05,.05,0,2.2,zb,fr);
  for(const x of [-1.03,0,1.03])P.box(.04,2.0,.04,x,.2,zb,fr,{edges:false});
  for(const sx of [1])for(const y of [.18,1.2,2.2])P.box(.05,.05,1.4,sx*hx,y,0,fr,{edges:false});
  P.box(.04,2.0,.04,hx,.2,0,fr,{edges:false});
  // ławka we wnętrzu
  P.box(2.2,.05,.4,.1,.45,zb+.3,0x7a5a3a);P.box(.05,.45,.35,-.85,0,zb+.3,0x2c2f33,{edges:false});P.box(.05,.45,.35,1.05,0,zb+.3,0x2c2f33,{edges:false});
  // odblaski na szkle
  const gl=atlas('wiata:glare',256,128,(g,w,h)=>{g.fillStyle='#d8f4ff';for(const x of [40,110]){g.beginPath();g.moveTo(x+30,0);g.lineTo(x+60,0);g.lineTo(x+20,h);g.lineTo(x-10,h);g.fill()}});
  P.decal(gl,3.0,1.9,0,1.2,zb+.015);
  P.decal(gl,1.3,1.9,hx+.01,1.2,-0.05,{ry:PI/2});
  // rozkład jazdy
  const rz=atlas('wiata:rozklad',64,96,(g,w,h)=>{g.fillStyle='#f6f2e4';g.fillRect(0,0,w,h);g.fillStyle='#c01818';g.fillRect(0,0,w,14);g.fillStyle='#222';g.font='bold 9px sans-serif';g.fillText('ROZKŁAD',6,11);
    g.fillStyle='#555';for(let i=0;i<9;i++){g.fillRect(6,22+i*8,22,3);g.fillRect(34,22+i*8,22,3)}});
  P.decal(rz,.38,.56,-1.03,1.0,zb+.045);
  // lightbox z reklamą (świeci stale)
  P.box(.12,1.95,1.25,-hx-.1,.25,0,0x3b3f44);
  const ad=neonTex('wiata:ad'+(o.seed%3),256,384,(g,w,h)=>{
    const cols=[['#ff4fd8','#3a0a52'],['#ffe14a','#b8260e'],['#43f0ff','#0a2a6a']][o.seed%3];
    const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,cols[1]);gr.addColorStop(1,cols[0]);g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.arc(w/2,130,70,0,7);g.fill();g.fillStyle=cols[1];g.font='bold 60px Bangers, Impact, sans-serif';g.textAlign='center';g.fillText('DISCO',w/2,150);
    g.fillStyle='#fff';g.font='48px Bangers, Impact, sans-serif';g.fillText('POLO NIGHT',w/2,260);g.font='28px Bangers, Impact, sans-serif';g.fillText('SOBOTA 22:00',w/2,310);g.fillText('REMIZA OSP',w/2,350)});
  P.neon(ad,1.15,1.8,-hx-.165,1.15,0,{ry:-PI/2,static:true});
  // słup z tabliczką „przystanek”
  P.cyl(.035,.035,2.7,2.15,0,.5,0x555a5e,{seg:6,edges:false});
  P.box(.42,.52,.025,2.15,2.1,.5,0xf2c21c);
  const sg=atlas('wiata:znak',64,80,(g,w,h)=>{g.fillStyle='#f2c21c';g.fillRect(0,0,w,h);g.fillStyle='#111';g.lineWidth=3;g.strokeRect(2,2,w-4,h-4);
    g.fillRect(12,14,40,26);g.fillStyle='#f2c21c';g.fillRect(16,18,14,10);g.fillRect(34,18,14,10);g.fillStyle='#111';g.beginPath();g.arc(20,44,4,0,7);g.arc(44,44,4,0,7);g.fill();
    g.font='bold 9px sans-serif';g.textAlign='center';g.fillText('PRZYSTANEK',w/2,68)});
  P.decal(sg,.4,.5,2.15,2.1,.5+.016);P.decal(sg,.4,.5,2.15,2.1,.5-.016,{ry:PI});
  P.col(-hx-.05,hx+.05,zb-.05,zb+.05,2.3);P.col(hx-.05,hx+.05,zb,zf,2.3);P.col(-hx-.2,-hx+.05,-.65,.65,2.3);
  P.cover=true;
});

/* ---------- Kosz uliczny ---------- */
// Stalowy kosz na słupku (ø~0,36 m, wys. ~1,2 m) albo betonowa tuba (ø~0,55 m, 0,8 m).
defProp('koszUliczny',{name:'Kosz uliczny',cat:'ulica',dims:[.5,1.25,.5],variants:['stal','beton'],note:'Czasem przewrócony popielniczek wg seeda.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.6)?'stal':'beton');
  if(v==='stal'){
    const c=r.pick([0x2c4a3a,0x2f3438,0x3a4a6a,0x6a2a22]);
    P.cyl(.03,.03,.95,0,0,0,0x3a3d40,{seg:6,edges:false});
    P.cyl(.16,.2,.1,0,.0,0,0x3a3d40,{seg:8,edges:false});
    P.cyl(.2,.17,.52,0,.62,0,c,{seg:10,hull:.05});
    P.cyl(.205,.205,.04,0,.82,0,shade(c,.6),{seg:10,edges:false});
    P.cyl(.02,.23,.1,0,1.14,0,shade(c,.75),{seg:10,edges:false});
    P.box(.12,.1,.08,0,1.0,.2,0x1a1a1a,{edges:false});
    P.colBox(.4,.4,1.2);
  }else{
    const c=r.pick([0xa9a59b,0x8f8b80]);
    P.cyl(.28,.31,.8,0,0,0,c,{seg:10});
    P.cyl(.29,.29,.05,0,.8,0,shade(c,.85),{seg:10,edges:false});
    P.cyl(.2,.2,.04,0,.82,0,0x1a1612,{seg:10,edges:false});
    for(let i=0;i<3;i++)P.box(.32,.04,.01,0,.2+i*.2,.285,shade(c,.7),{edges:false,small:true});
    P.colBox(.62,.62,.85);
  }
});

/* ---------- Śmietnik ---------- */
// Kontener MGB 1100 (1,37x1,07x1,33 m) z pokrywą i kółkami albo pojemnik 240 l (0,58x0,74x1,07 m). Naklejka/graffiti wg seeda.
defProp('smietnik',{name:'Śmietnik',cat:'ulica',dims:[1.4,1.4,1.1],variants:['kontener','pojemnik'],cover:true,
  note:'Pokrywa czasem otwarta (seed). Daje osłonę.'},(P,o,r)=>{
  const v=o.variant||(r.chance(.65)?'kontener':'pojemnik');
  const body=r.pick([0x2e6b3a,0x6e7378,0x2a4f8a,0x6a4a2a,0x8a8a2a]),lid=r.chance(.6)?0x1d1f21:shade(body,.8);
  const sticker=atlas('smietnik:'+(o.seed%4),256,128,(g,w,h)=>{
    g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,w,h);const k=o.seed%4;
    g.fillStyle=['#f2f2f2','#f2c21c','#e8e8e8','#f2f2f2'][k];g.fillRect(10,10,100,56);g.fillStyle='#222';g.font='bold 15px sans-serif';
    g.fillText(['ZMIESZANE','SZKŁO','PAPIER','BIO'][k],16,34);g.font='10px sans-serif';g.fillText('ODPADY KOMUNALNE',16,52);
    g.strokeStyle=['#ff3b8b','#33d6ff','#ffd400','#7cff4a'][k];g.lineWidth=7;g.lineCap='round';g.beginPath();g.moveTo(130,100);g.bezierCurveTo(160,20,190,120,240,40);g.stroke();
    g.beginPath();g.moveTo(140,110);g.lineTo(230,100);g.stroke()});
  if(v==='kontener'){
    // prostopadłościan lekko zbieżny ku dołowi: graniastosłup 4-bokowy skalowany do 1,37 x 1,07
    P.cyl(.7071,.64,.92,0,.17,0,body,{seg:4,ry:PI/4,sx:1.37,sz:1.07});
    P.box(1.37,.06,1.07,0,1.07,0,shade(body,.8),{edges:false});
    const open=r.chance(.25);
    if(open)P.box(1.4,.06,1.08,0,1.55,-.95,lid,{rx:-1.15,ry:0});
    else P.box(1.4,.07,1.09,0,1.13,0,lid,{rx:.04});
    P.box(1.1,.05,.06,0,1.1,.58,0x15110e,{edges:false,small:true});
    for(const sx of [-1,1])for(const sz of [-1,1])P.cylc(.1,.1,.06,sx*.55,.1,sz*.4,0x15110e,{seg:8,rz:PI/2,edges:false,small:true});
    P.box(1.37,.06,1.07,0,.12,0,0x303030,{edges:false});
    P.decal(sticker,.9,.45,-.15,.7,.545);
    P.colBox(1.4,1.1,1.35);
  }else{
    P.cyl(.7071,.62,.9,0,.12,0,body,{seg:4,ry:PI/4,sx:.58,sz:.74});
    P.box(.62,.05,.78,0,1.0,0,lid,{rx:r.chance(.2)?-.5:.02});
    P.box(.4,.04,.04,0,.92,.4,0x15110e,{edges:false,small:true});
    for(const sx of [-1,1])P.cylc(.1,.1,.04,sx*.3,.1,-.28,0x15110e,{seg:8,rz:PI/2,edges:false,small:true});
    P.decal(sticker,.5,.25,0,.65,.372);
    P.colBox(.62,.78,1.05);
  }
});

/* ---------- Hydrant nadziemny ---------- */
// Hydrant nadziemny DN80: wys. ok. 0,95 m nad gruntem, dwa wyloty W75 po bokach, wylot Storz z przodu, tabliczka „H”.
defProp('hydrant',{name:'Hydrant nadziemny',cat:'ulica',dims:[.9,2.0,.4],variants:null,note:'Słupek z tabliczką orientacyjną (opts.sign=false = bez).'},(P,o,r)=>{
  const red=r.pick([0xc4271f,0xb02a1e,0xd0342a]),dark=0x2a2a2a;
  P.cyl(.14,.16,.08,0,0,0,dark,{seg:8});
  P.cyl(.085,.095,.62,0,.08,0,red,{seg:8});
  P.cyl(.11,.11,.05,0,.66,0,shade(red,.8),{seg:8,edges:false});
  P.sph(1,0,.74,0,red,{sx:.1,sy:.08,sz:.1,ws:8,hs:5});
  P.box(.05,.05,.05,0,.8,0,0x707070,{edges:false,small:true});
  for(const sx of [-1,1]){P.cylc(.05,.05,.18,sx*.15,.5,0,red,{seg:8,rz:PI/2,edges:false});P.cylc(.062,.062,.04,sx*.26,.5,0,dark,{seg:8,rz:PI/2,edges:false})}
  P.cylc(.07,.07,.14,0,.38,.14,red,{seg:8,rx:PI/2,edges:false});P.cylc(.085,.085,.04,0,.38,.23,dark,{seg:8,rx:PI/2,edges:false});
  if(o.sign!==false){
    P.cyl(.018,.018,2.0,.6,0,-.1,0x555a5e,{seg:6,edges:false});
    P.box(.26,.34,.02,.6,1.5,-.1,0xf2f2ec);
    const hs=atlas('hydrant:znak',52,68,(g,w,h)=>{g.fillStyle='#f6f4ea';g.fillRect(0,0,w,h);g.fillStyle='#c01818';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText('H',w/2,30);
      g.fillStyle='#111';g.font='bold 13px sans-serif';g.fillText('80',w/2,48);g.fillText('2,3',w/2,63);g.strokeStyle='#c01818';g.lineWidth=3;g.strokeRect(1.5,1.5,w-3,h-3)});
    P.decal(hs,.24,.32,.6,1.5,-.1+.012);
  }
  P.colBox(.34,.34,1.0);
});

/* ---------- Barierka U-12a ---------- */
// Barierka ochronna U-12a: 2,0 m długości, 1,1 m wysokości, stopy w kształcie U, poprzeczka biało-czerwona.
defProp('barierka',{name:'Barierka U-12a',cat:'ulica',dims:[2.1,1.1,.6],note:'opts.len = długość [m] (domyślnie 2,0).'},(P,o,r)=>{
  const len=o.len||2,hx=len/2-.04,rail=.022;
  const steel=r.chance(.5)?0xd8d8d0:0x9aa0a4;
  for(const sx of [-1,1]){
    P.cylc(rail,rail,1.1,sx*hx,.55,0,steel,{seg:6,edges:false});
    P.box(.04,.04,.6,sx*hx,0,0,steel,{edges:false});
  }
  const n=Math.max(4,Math.round(len/.25)),seg=(len-.08)/n;
  for(let i=0;i<n;i++)P.cylc(rail*1.1,rail*1.1,seg,-len/2+.04+seg*(i+.5),1.0,0,i%2?0xe8e8e0:0xc4271f,{seg:6,rz:PI/2,edges:false});
  P.cylc(rail,rail,len-.08,0,.5,0,steel,{seg:6,rz:PI/2,edges:false});
  P.cylc(rail,rail,len-.08,0,.2,0,steel,{seg:6,rz:PI/2,edges:false});
  P.col(-len/2,len/2,-.06,.06,1.1);
});

/* ---------- Płot ---------- */
// siatka (słupki ø6 cm co 2,5 m, siatka jako decal z alfą, 1,5 m), sztachety (1,2 m, drewno malowane), beton (płyty PRL, 2,0 m).
defProp('plot',{name:'Płot',cat:'ulica',dims:[2.6,1.5,.1],variants:['siatka','sztachety','beton'],note:'opts.len = długość [m], moduły co 2,5 m (siatka/beton) — zawsze pełne moduły.'},(P,o,r)=>{
  const v=o.variant||r.pick(['siatka','sztachety','beton']),mod=2.5,N=Math.max(1,Math.round((o.len||2.5)/mod)),len=N*mod,x0=-len/2;
  if(v==='siatka'){
    const post=r.pick([0x2f4a33,0x555a5e,0x7a3b2e]);
    const mesh=atlas('plot:siatka',256,128,(g,w,h)=>{g.strokeStyle='#b9c0c4';g.lineWidth=1.4;
      for(let i=-h;i<w+h;i+=7){g.beginPath();g.moveTo(i,0);g.lineTo(i+h,h);g.stroke();g.beginPath();g.moveTo(i+h,0);g.lineTo(i,h);g.stroke()}
      g.strokeStyle='#7e868a';g.lineWidth=4;g.strokeRect(0,0,w,h)});
    for(let i=0;i<=N;i++)P.cyl(.03,.03,1.55,x0+i*mod,0,0,post,{seg:6,edges:false});
    P.cylc(.015,.015,len,0,1.5,0,post,{seg:5,rz:PI/2,edges:false});P.cylc(.012,.012,len,0,.08,0,post,{seg:5,rz:PI/2,edges:false});
    for(let i=0;i<N;i++){const cx=x0+(i+.5)*mod;P.decal(mesh,mod-.06,1.4,cx,.8,.012);P.decal(mesh,mod-.06,1.4,cx,.8,-.012,{ry:PI})}
    P.col(-len/2,len/2,-.06,.06,1.5);
  }else if(v==='sztachety'){
    const c=r.pick([0xe8e4d6,0x8a6a3a,0x4a7a4a,0x9a4a2a]),post=shade(c,.8);
    const step=.14,n=Math.floor(len/step);
    for(let i=0;i<=N;i++)P.box(.1,1.35,.1,x0+i*mod,0,-.02,post,{edges:false});
    for(const y of [.25,.85])P.box(len,.06,.04,0,y,-.07,post,{edges:false});
    for(let i=0;i<n;i++){
      if(r.chance(.07))continue;const x=x0+.07+i*step,tilt=r.chance(.1)?r.range(-.08,.08):0,hh=r.range(1.08,1.14);
      P.box(.09,hh,.025,x,.05,.02,c,{rz:tilt,edges:false});P.cyl(0,.0635,.07,x,.05+hh,.02,c,{seg:4,ry:PI/4,sz:.4,edges:false,rz:tilt});
    }
    P.col(-len/2,len/2,-.08,.08,1.2);
  }else{
    const c=r.pick([0xb4b0a6,0xa8a49a,0xc2beb2]);
    const stain=atlas('plot:beton',256,128,(g,w,h)=>{g.strokeStyle='rgba(30,25,20,.9)';g.lineWidth=2;for(let i=0;i<3;i++){g.beginPath();let x=Math.random()*w,y=Math.random()*h;g.moveTo(x,y);for(let k=0;k<6;k++){x+=(Math.random()-.5)*40;y+=(Math.random()-.5)*20;g.lineTo(x,y)}g.stroke()}
      g.fillStyle='rgba(60,45,30,.8)';for(let i=0;i<8;i++)g.fillRect(Math.random()*w,Math.random()*h,10+Math.random()*30,2)});
    for(let i=0;i<=N;i++)P.box(.14,2.1,.14,x0+i*mod,0,0,shade(c,.9));
    for(let i=0;i<N;i++){const cx=x0+(i+.5)*mod;for(let k=0;k<4;k++)P.box(mod-.14,.45,.06,cx,.05+k*.47,0,shade(c,1-.05*(k%2)),{edges:k===0});
      P.decal(stain,mod-.2,1.5,cx,1.0,.034);}
    P.col(-len/2,len/2,-.08,.08,2.05);P.cover=true;
  }
});
