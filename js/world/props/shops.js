// Handel: kiosk Ruchu, witryny sklepowe, szyldy neonowe w kilku wariantach.
// Neony to płaszczyzny MeshBasic (świecą bez oświetlenia, fog:false); mruganie robi animateWorld przez przygaszenie koloru.
import {defProp,atlas,neonTex,glowText,shade,mixc} from './lib.js';

const PI=Math.PI;
const FONT=s=>s+'px Bangers, Impact, sans-serif';

/* ---------- Kiosk Ruchu ---------- */
// Kiosk „Ruchu” ok. 2,6 x 2,0 x 2,5 m (z szyldem 2,9 m): okienko z ladą i daszkiem, szyld RUCH (neon), gazety w okienku.
defProp('kioskRuch',{name:'Kiosk Ruchu',cat:'rynek',dims:[2.8,2.9,2.7],cover:true,
  note:'Front w +Z. Szyld RUCH = neon (mruga). Okienko z gazetami to decal.'},(P,o,r)=>{
  const pal=r.pick([[0xe8dcb5,0xc4271f],[0xb8cfe0,0x2d5fa8],[0xe8b070,0x7a3b1e]]),[wall,band]=pal;
  const W=2.6,D=2.0,Hh=2.5,zf=D/2;
  P.box(W,Hh,D,0,0,0,wall);
  P.box(W+.02,.14,D+.02,0,0,0,shade(wall,.6),{edges:false});
  P.box(W+.02,.32,D+.02,0,2.12,0,band,{edges:false});
  P.box(W+.3,.12,D+.3,0,Hh,0,0x3a3a3c);
  P.box(1.9,.5,.12,0,Hh+.12,zf-.4,0x2a2a2c,{edges:false});
  // okienko: rama + wystawa (decal) + lada
  P.box(1.84,1.14,.06,0,.93,zf+.001,0x3a3a3c,{edges:false});
  const disp=atlas('kiosk:display',256,128,(g,w,h)=>{
    g.fillStyle='#241a14';g.fillRect(0,0,w,h);
    const cols=['#e0392b','#f2c21c','#2d6cb0','#f4f0e0','#3a9a4a','#f06aa8','#e8742a'];
    for(let row=0;row<3;row++)for(let i=0;i<9;i++){g.fillStyle=cols[(i*3+row*2)%cols.length];g.fillRect(8+i*27,8+row*34,23,28);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(8+i*27,8+row*34+18,23,10);g.fillStyle='#fff';g.fillRect(11+i*27,12+row*34,17,3)}
    g.fillStyle='#d8c8a0';g.fillRect(0,h-16,w,16);g.fillStyle='#8a1a1a';for(let i=0;i<12;i++)g.fillRect(6+i*21,h-12,15,8)});
  P.decal(disp,1.7,1.0,0,.93,zf+.035);
  P.box(2.0,.06,.42,0,.96,zf+.2,0x8a6a3a);
  // daszek w paski
  for(let i=0;i<6;i++)P.box(.38,.05,.7,-.95+i*.38,2.12,zf+.38,i%2?0xf4f0e0:band,{rx:.28,edges:false});
  // szyld RUCH
  const sign=neonTex('kiosk:ruch',256,90,(g,w,h)=>{g.fillStyle='#f8f4e8';g.fillRect(0,0,w,h);g.strokeStyle='#c4271f';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
    g.fillStyle='#c4271f';g.font=FONT(78);g.textAlign='center';g.textBaseline='middle';g.fillText('RUCH',w/2,h/2+4);g.lineWidth=3;g.strokeStyle='#7a1010';g.strokeText('RUCH',w/2,h/2+4)});
  P.neon(sign,1.7,.6,0,Hh+.2,zf-.4+.07);
  // napisy na bocznej ścianie
  const side=atlas('kiosk:side',192,64,(g,w,h)=>{g.fillStyle='#1a1410';g.font=FONT(24);g.textAlign='center';g.fillText('GAZETY · BILETY',w/2,26);g.fillText('LOTTO · PAPIEROSY',w/2,54)});
  P.decal(side,1.4,.46,W/2+.01,1.2,-.1,{ry:PI/2});
  P.decal(side,1.4,.46,-W/2-.01,1.2,-.1,{ry:-PI/2});
  // drzwi na boku (szare, z klamką)
  P.box(.04,1.9,.8,-W/2-.012,.15,.55,0x5a5e62,{edges:false,small:true});
  P.colBox(W+.1,D,Hh);P.cover=true;
});

/* ---------- Witryna sklepowa ---------- */
const SHOPS={
  spozywczy:{t:'SPOŻYWCZY',sign:0x2a6a3a,items:['#e0392b','#f2c21c','#f4f0e0','#3a9a4a','#8a5a2a','#2d6cb0']},
  miesny:{t:'MIĘSNY',sign:0x8a1a1a,items:['#e87a7a','#c94a4a','#f0b0a0','#8a2a2a','#f4f0e0']},
  apteka:{t:'APTEKA',sign:0x1f7a4a,items:['#f4f0e0','#3a9a4a','#d8d8e0','#2d6cb0','#f2c21c']},
  fryzjer:{t:'FRYZJER',sign:0x3a2a6a,items:['#f4f0e0','#8a6aca','#222','#c0c0d0','#f06aa8']},
  alkohole:{t:'ALKOHOLE 24H',sign:0x1a1a2a,items:['#2a6a2a','#e8c040','#7a2a1a','#d8f0d0','#3a5a9a','#f4f0e0']},
};
// Witryna ~4,2 x 3,4 m, głębokość 0,6 m. Tył (z=0) przylega do ściany budynku; front w +Z.
defProp('witryna',{name:'Witryna sklepowa',cat:'rynek',dims:[4.2,3.4,1.5],variants:Object.keys(SHOPS),cover:true,
  note:'Moduł do przyłożenia do ściany: tył w z=0. Wystawa i szyld jako decale, markiza w paski, mrugający OTWARTE.'},(P,o,r)=>{
  const v=o.variant||r.pick(Object.keys(SHOPS)),S=SHOPS[v],W=4.2;
  const frame=r.pick([0x8a8478,0x6a5a4a,0x3a3a3c]);
  P.box(W,.55,.4,0,0,.2,0x6a6458);
  for(const sx of [-1,1])P.box(.3,3.0,.45,sx*(W/2-.15),0,.225,frame);
  P.box(W,.5,.55,0,2.75,.275,S.sign);
  const sg=atlas('witryna:sign:'+v,256,40,(g,w,h)=>{g.fillStyle='#f4f0e0';g.font=FONT(34);g.textAlign='center';g.textBaseline='middle';g.fillText(S.t,w/2,h/2+2)});
  P.decal(sg,3.4,.45,-.0,2.98,.555);
  const win=atlas('witryna:win:'+v,192,128,(g,w,h)=>{
    g.fillStyle='#2b2f38';g.fillRect(0,0,w,h);g.fillStyle='#7a8a96';g.fillRect(0,0,w,6);
    const rr=(function(s){return()=>{s=(s*16807)%2147483647;return s/2147483647}})(v.length*31+7);
    for(let row=0;row<3;row++){g.fillStyle='#5a4630';g.fillRect(6,28+row*34,w-12,3);
      for(let i=0;i<9;i++){g.fillStyle=S.items[Math.floor(rr()*S.items.length)];const bw=10+rr()*10,bh=14+rr()*12;g.fillRect(10+i*19,26+row*34-bh,bw,bh)}}
    g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=6;g.beginPath();g.moveTo(w*.2,h);g.lineTo(w*.45,0);g.stroke();g.beginPath();g.moveTo(w*.5,h);g.lineTo(w*.62,0);g.stroke();
    g.fillStyle='#f2c21c';g.fillRect(w-62,h-34,50,22);g.fillStyle='#c4271f';g.font=FONT(16);g.textAlign='center';g.fillText('PROMOCJA',w-37,h-17)});
  P.box(2.55,1.72,.1,-.55,.6,.05,0x2a2a2c,{edges:false});
  P.decal(win,2.4,1.6,-.55,1.46,.108);
  // drzwi
  P.box(1.0,2.2,.1,1.45,.1,.05,0x2a2a2c,{edges:false});
  const door=atlas('witryna:door',64,128,(g,w,h)=>{g.fillStyle='#364250';g.fillRect(4,4,w-8,h-8);g.fillStyle='#8aa0b0';g.fillRect(8,8,w-16,60);g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.moveTo(14,68);g.lineTo(30,8);g.lineTo(42,8);g.lineTo(26,68);g.fill();
    g.fillStyle='#d8d8d8';g.fillRect(w-16,60,5,26);g.fillStyle='#f2c21c';g.fillRect(14,92,36,16);g.fillStyle='#111';g.font='bold 9px sans-serif';g.textAlign='center';g.fillText('WEJŚCIE',32,104)});
  P.decal(door,.92,2.1,1.45,1.15,.108);
  // markiza w paski
  const ac=r.pick([0xc4271f,0x2d5fa8,0x3a8a4a,0xe0a020]);
  for(let i=0;i<9;i++)P.box(.47,.04,1.0,-W/2+.235+i*.4667,2.42,.68,i%2?0xf4f0e0:ac,{rx:.3,edges:false});
  P.box(W,.1,.04,0,2.25,1.14,ac,{edges:false,small:true});
  // mrugające OTWARTE w oknie
  const op=neonTex('witryna:otwarte',128,44,(g,w,h)=>{g.fillStyle='#16080e';g.fillRect(0,0,w,h);g.strokeStyle='#ff3b8b';g.lineWidth=3;g.strokeRect(3,3,w-6,h-6);glowText(g,'OTWARTE',w/2,h/2+2,FONT(30),'#ff3b8b')});
  P.neon(op,.7,.24,-1.35,.9,.12);
  P.col(-W/2,W/2,0,.55,3.3);P.cover=true;
});

/* ---------- Szyldy neonowe ---------- */
const NEON={
  otwarte:{w:1.3,h:.56,tex:()=>neonTex('szyld:otwarte',256,110,(g,w,h)=>{
    g.fillStyle='#1a0a14';g.fillRect(0,0,w,h);g.strokeStyle='#ff3b8b';g.shadowColor='#ff3b8b';g.shadowBlur=14;g.lineWidth=5;g.strokeRect(8,8,w-16,h-16);g.shadowBlur=0;
    glowText(g,'OTWARTE',w/2,h/2-6,FONT(58),'#ff3b8b');glowText(g,'NON STOP',w/2,h-24,FONT(22),'#43f0ff')})},
  bar:{w:2.0,h:.72,tex:()=>neonTex('szyld:bar',512,184,(g,w,h)=>{
    g.fillStyle='#10141f';g.fillRect(0,0,w,h);
    for(let x=14;x<w;x+=26){for(const y of [12,h-12]){g.fillStyle=(x/26|0)%2?'#ffe14a':'#ff9a3a';g.shadowColor=g.fillStyle;g.shadowBlur=10;g.beginPath();g.arc(x,y,6,0,7);g.fill()}}
    for(let y=38;y<h-20;y+=26){for(const x of [12,w-12]){g.fillStyle=(y/26|0)%2?'#ffe14a':'#ff9a3a';g.shadowColor=g.fillStyle;g.shadowBlur=10;g.beginPath();g.arc(x,y,6,0,7);g.fill()}}
    g.shadowBlur=0;glowText(g,'BAR',w/2,70,FONT(104),'#43f0ff');glowText(g,'U ZDZICHA',w/2,142,FONT(46),'#ff4fd8')})},
  piwo:{w:1.1,h:.8,tex:()=>neonTex('szyld:piwo',320,232,(g,w,h)=>{
    g.fillStyle='#0a1020';g.fillRect(0,0,w,h);
    g.strokeStyle='#ffb21a';g.shadowColor='#ffb21a';g.shadowBlur=18;g.lineWidth=6;g.lineJoin='round';
    g.strokeRect(24,50,80,86);g.beginPath();g.moveTo(104,64);g.quadraticCurveTo(140,64,140,96);g.quadraticCurveTo(140,124,104,124);g.stroke();
    g.fillStyle='rgba(255,178,26,.35)';g.fillRect(27,80,74,53);g.beginPath();g.arc(40,46,13,0,7);g.arc(64,40,15,0,7);g.arc(88,46,13,0,7);g.stroke();
    g.shadowBlur=0;glowText(g,'PIWO',w*.7,62,FONT(70),'#ff4fd8');glowText(g,'ZIMNE',w*.7,122,FONT(50),'#43f0ff');glowText(g,'♦  ♦  ♦',w/2,198,FONT(34),'#ffe14a')})},
  disco:{w:1.1,h:1.1,tex:()=>neonTex('szyld:disco',256,256,(g,w,h)=>{
    g.fillStyle='#14081e';g.fillRect(0,0,w,h);g.strokeStyle='#43f0ff';g.shadowColor='#43f0ff';g.shadowBlur=14;g.lineWidth=4;
    g.beginPath();g.arc(w/2,100,64,0,7);g.stroke();for(let i=-3;i<=3;i++){g.beginPath();g.ellipse(w/2,100,Math.abs(i)*21,64,0,0,7);g.stroke();g.beginPath();g.moveTo(w/2-64,100+i*20);g.lineTo(w/2+64,100+i*20);g.stroke()}
    g.beginPath();g.moveTo(w/2,20);g.lineTo(w/2,8);g.stroke();g.shadowBlur=0;
    for(const [x,y] of [[34,40],[222,60],[40,150],[220,150],[200,22]]){g.fillStyle='#ffe14a';g.shadowColor='#ffe14a';g.shadowBlur=10;g.beginPath();for(let k=0;k<8;k++){const a=k*PI/4,rr=k%2?3:11;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.fill()}
    g.shadowBlur=0;glowText(g,'DISCO',w/2,214,FONT(72),'#ff4fd8')})},
  apteka:{w:.95,h:.95,tex:()=>neonTex('szyld:apteka',256,256,(g,w,h)=>{
    g.fillStyle='#06180e';g.fillRect(0,0,w,h);g.fillStyle='#37ff7a';g.shadowColor='#37ff7a';g.shadowBlur=26;
    const a=70,c=w/2;g.beginPath();g.rect(c-a/2,28,a,h-56);g.rect(28,c-a/2,w-56,a);g.fill();g.shadowBlur=0;
    g.fillStyle='#0b3a22';g.beginPath();g.rect(c-a/2+12,40,a-24,h-80);g.rect(40,c-a/2+12,w-80,a-24);g.fill();
    glowText(g,'APTEKA',c,c+3,FONT(40),'#c8ffe0')})},
};
// Szyld montowany do ściany w z=0, front w +Z. apteka = krzyż wysięgnikowy (dwustronny, wystaje ku +Z, płaszczyzna YZ).
defProp('neonSzyld',{name:'Szyld neonowy',cat:'neony',dims:[2.0,1.0,.25],variants:Object.keys(NEON),
  note:'Warianty: otwarte, bar, piwo, disco, apteka (krzyż dwustronny). Mruganie = przygaszenie koloru w animateWorld.'},(P,o,r)=>{
  const v=o.variant||r.pick(Object.keys(NEON)),S=NEON[v],t=S.tex(),dark=0x1e1e24;
  const y=o.y!=null?o.y:S.h/2+.05;
  if(v==='apteka'){
    const L=.9;
    P.box(.06,.06,L,0,y+.1,L/2,dark,{edges:false});P.box(.1,.1,.08,0,y+.1,.04,dark,{edges:false});
    P.box(.1,S.h+.06,.5,0,y-.45+.03,.9,dark,{edges:false});
    P.neon(t,S.w*.5,S.h,.055,y+.0,.9,{ry:PI/2});P.neon(t,S.w*.5,S.h,-.055,y+.0,.9,{ry:-PI/2});
    P.col(-.1,.1,0,L,y+S.h/2);
  }else{
    P.box(S.w+.12,S.h+.12,.1,0,y-S.h/2-.06,.05,dark);
    for(const sx of [-1,1])P.box(.05,.05,.12,sx*(S.w/2-.1),y-S.h/2-.12,.0,dark,{edges:false,small:true});
    P.neon(t,S.w,S.h,0,y,.108);
    P.col(-S.w/2,S.w/2,0,.12,y+S.h/2);
  }
});
