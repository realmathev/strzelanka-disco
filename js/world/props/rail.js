// Kolej, część 1 (infrastruktura): tor prosty/łuk/rozjazd, peron (+wiata), dworzec z poczekalnią i kasą, nastawnia, semafory,
// kozioł oporowy, tunel, wiadukt, zejście do przejścia, magazyn z rampą, rampa, wózek bagażowy, tablice, słup trakcyjny z siecią,
// budka dróżnika, zapora (szlaban), skrzynka przekaźnikowa. Tabor (lokomotywy, wagony, drezyna) jest w rail-stock.js. cat:'kolej'.
//
// Wymiary rzeczywiste (PKP, lata 80.-90.; źródła: wikipedia PKP class SM42/ET22/EU07, instrukcja Id-1 / Ie-1 o sygnalizacji,
// katalog szyn S49/60E1; weryfikacja częściowa, reszta z pamięci/typowych projektów):
//  - szerokość toru 1435 mm (osie szyn ±0,7175 m), szyna S49 wys. 149 mm (tu 0,17 m), podkład 2,6 x 0,26 x 0,16 m co 0,6 m,
//    podsypka (tłuczeń) szer. ~3,6 m u podstawy; GÓRA SZYNY w tych rekwizytach = 0,37 m nad gruntem (stała RT).
//  - peron wysoki: 0,76 m nad główką szyny -> górna płaszczyzna 1,13 m nad gruntem; pas bezpieczeństwa 0,8 m od krawędzi.
//  - zapora kolejowa (rogatka): zapora szer. 6 m, wys. 1,0-1,2 m; słup semafora ~5,8 m (kształtowy), 4,0 m (świetlny).
//  - sieć trakcyjna: drut jezdny 5,6 m nad szyną (dopuszczalnie 5,0-6,0), słup ~9 m, rozpiętość przęsła do 65 m.
// Konwencje: tor biegnie wzdłuż Z; przód rekwizytów patrzy w +Z; origin = środek podstawy. Pojazdy z rail-stock.js mają koła
// na wysokości RT, więc stawiaj je na tym samym (x,z) co tor, y=0. Neony: MeshBasic, mruganie = przygaszenie koloru
// (nigdy visible=false). Decale z atlasu: oszczędnie (kilka mini-tekstur, łącznie ~2% atlasu). Kolider h>=1,7 m = pełna osłona.
import {defProp,atlas,neonTex,shade,mixc} from './lib.js';

export const PI=Math.PI,C='kolej',RT=.37;
export const COL={CONC:0xb5b0a4,CONCD:0x8f8a7e,BRICK:0x9a4a36,PLAS:0xd8cc9c,ROOF:0x8a3a2a,TAR:0x3a3836,STEEL:0x7e858a,STEELD:0x4a5056,DARK:0x1d1b1a,
  RUST:0x7a4a2a,BAL:0x5c5852,WHITE:0xeeeae0,RED:0xc0392b,YEL:0xe8b81c,GREEN:0x2f6a40,WOOD:0x6b4a2c,GLASS:0x1d2a36};
const {CONC,CONCD,BRICK,PLAS,ROOF,TAR,STEEL,STEELD,DARK,RUST,BAL,WHITE,RED,YEL,WOOD,GLASS}=COL;
export const B=(P,w,h,d,x,y,z,c,o)=>P.box(w,h,d,x,y,z,c,Object.assign({edges:false},o));
export const Bs=(P,w,h,d,x,y,z,c,o)=>P.box(w,h,d,x,y,z,c,Object.assign({edges:false,small:true},o));
export const FONTA=s=>'bold '+s+'px Impact, "Arial Narrow", Arial, sans-serif';
/** Pudełko w lokalnym układzie obróconym o ry wokół (cx,cz). */
export function local(P,cx,cz,ry){const c=Math.cos(ry),s=Math.sin(ry);
  return (w,h,d,lx,y,lz,col,o)=>P.box(w,h,d,cx+lx*c+lz*s,y,cz-lx*s+lz*c,col,Object.assign({ry,edges:false,small:true},o))}
/** Okno 64x64 (ciemna szyba, ramy, szprosa) – wspólny decal dla budynków i kabin. */
export const okno=()=>atlas('rail:okno',64,64,(g,w,h)=>{g.fillStyle='#e0dac4';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#3a4c5c');gr.addColorStop(.5,'#1d2a36');gr.addColorStop(1,'#2a3a48');
  g.fillStyle=gr;g.fillRect(5,5,w-10,h-10);g.fillStyle='#e0dac4';g.fillRect(w/2-2,5,4,h-10);g.fillRect(5,h*.4,w-10,3);g.fillStyle='rgba(255,255,255,.18)';g.beginPath();g.moveTo(8,8);g.lineTo(26,8);g.lineTo(8,34);g.fill();
  g.strokeStyle='#8a8470';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2)});
export const zegarTex=()=>atlas('rail:zegar',128,128,(g)=>{g.fillStyle='#222';g.fillRect(0,0,128,128);g.fillStyle='#f4f0e0';g.beginPath();g.arc(64,64,58,0,7);g.fill();
  g.strokeStyle='#111';g.lineWidth=4;for(let i=0;i<12;i++){const a=i*PI/6;g.beginPath();g.moveTo(64+Math.sin(a)*48,64-Math.cos(a)*48);g.lineTo(64+Math.sin(a)*55,64-Math.cos(a)*55);g.stroke()}
  g.lineWidth=6;g.beginPath();g.moveTo(64,64);g.lineTo(64+Math.sin(-.6)*34,64-Math.cos(-.6)*34);g.stroke();g.lineWidth=4;g.beginPath();g.moveTo(64,64);g.lineTo(64+Math.sin(1.05)*48,64-Math.cos(1.05)*48);g.stroke();
  g.fillStyle='#b01818';g.beginPath();g.arc(64,64,4,0,7);g.fill()});
export const nameTex=name=>atlas('rail:nazwa:'+name,640,96,(g,w,h)=>{g.fillStyle='#f2efe2';g.fillRect(0,0,w,h);g.strokeStyle='#1a1a1a';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
  g.fillStyle='#16161a';g.textAlign='center';g.textBaseline='middle';let s=64;g.font=FONTA(s);while(g.measureText(name).width>w-50&&s>20){s-=2;g.font=FONTA(s)}g.fillText(name,w/2,h/2+3)});
export const NAZWA_DEF='STRZELNICA GŁÓWNA';
/** Ławka dworcowa 1,8 x 0,5 x 0,8 m (siedzisko 0,45 m), środek (cx,cz), front lokalny +Z. */
export function bench(P,cx,y,cz,ry,col=WOOD,len=1.8){
  const L=local(P,cx,cz,ry);L(len,.05,.46,0,y+.42,0,col);L(len,.38,.04,0,y+.5,-.22,col,{rx:-.12});
  for(const sx of [-1,1])L(.06,.42,.42,sx*(len/2-.06),y,0,STEELD);
}
/** Szyna: stopka + trzon z główką (2 pudełka, ~0,17 m wys.) od (x0,z0) do (x1,z1). */
export function rail(P,x0,z0,x1,z1,y,col){
  const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz)+.03,ry=Math.atan2(dx,dz),mx=(x0+x1)/2,mz=(z0+z1)/2;
  Bs(P,.15,.03,len,mx,y,mz,shade(col,.8),{ry});Bs(P,.07,.14,len,mx,y+.03,mz,col,{ry});
}
const SLP_W=[0x4a3a2c,0x55422f,0x3e3128],SLP_C=[0x9d998f,0x8f8b82];
const railCol=r=>r.pick([0x7a5a48,0x6b4f3e,0x80807c]);

/* ============================ TOR PROSTY ============================ */
// Odcinek 10 m: podsypka (trapez), 17 podkładów (beton lub drewno wg seeda, lekko krzywe), 2 szyny S49. Góra szyny = RT.
// Do długich linii: DS.props.instance('torProsty',[{x,z,rotY},...]) co 10 m (podkłady i szyny dzielą geometrię).
defProp('torProsty',{name:'Tor prosty 10 m',cat:C,dims:[3.6,.37,10],cover:false,variants:['beton','drewno'],
  note:'Bez koliderów (można chodzić po torze). Oś toru x=0, wzdłuż Z; góra szyny 0,37 m. Seed: rodzaj/zużycie podkładów, rdza.'},(P,o,r)=>{
  const len=o.len||10,n=Math.round(len/.6),conc=o.variant?o.variant==='beton':r.chance(.5),rc=railCol(r);
  P.prism([[-1.8,0],[1.8,0],[1.4,.15],[-1.4,.15]],len,0,0,-len/2,BAL,{edges:false,small:true});
  for(let i=0;i<n;i++)Bs(P,2.6,.16,.26,r.range(-.03,.03),.04,-len/2+.3+i*.6,conc?r.pick(SLP_C):r.pick(SLP_W),{ry:r.range(-.025,.025)});
  for(const sx of [-1,1])rail(P,sx*.7175,-len/2,sx*.7175,len/2,.2,rc);
});

/* ============================ TOR – ŁUK ============================ */
// Łuk R=80 m, kąt 0,22 rad (~17,6 m): szyny jako 5 cięciw, podkłady promieniowo. Skręca w stronę +X, środek cięciwy = origin.
defProp('torLuk',{name:'Tor – łuk R80',cat:C,dims:[5.4,.37,17.6],cover:false,
  note:'Skręt ku +X (lustro: scale.x=-1 albo rotY=PI). Łuk R=80 m, kąt 12,6°. Bez koliderów.'},(P,o,r)=>{
  const R=o.R||80,A=o.ang||.22,conc=r.chance(.5),rc=railCol(r),pt=t=>[R*(1-Math.cos(t)),R*Math.sin(t)],nrm=t=>[Math.cos(t),-Math.sin(t)];
  const ts=i=>-A/2+A*i/5;
  for(let i=0;i<5;i++){
    const t0=ts(i),t1=ts(i+1),m=(t0+t1)/2,[a0,b0]=pt(t0),[a1,b1]=pt(t1),w=[Math.cos(m),-Math.sin(m)];
    const mx=(a0+a1)/2,mz=(b0+b1)/2,ln=Math.hypot(a1-a0,b1-b0)+.05,ry=Math.atan2(a1-a0,b1-b0);
    // trapez podsypki dla cięciwy – pudełko z obrotem (przybliżenie)
    Bs(P,3.1,.15,ln+.1,mx,0,mz,BAL,{ry});
    for(const sx of [-1,1]){const n0=nrm(t0),n1=nrm(t1);rail(P,a0+sx*.7175*n0[0],b0+sx*.7175*n0[1],a1+sx*.7175*n1[0],b1+sx*.7175*n1[1],.2,rc)}
    void w;
  }
  const n=Math.round(R*A/.65);
  for(let i=0;i<=n;i++){const t=-A/2+A*i/n,[x,z]=pt(t);Bs(P,2.6,.16,.26,x,.04,z,conc?r.pick(SLP_C):r.pick(SLP_W),{ry:t+r.range(-.02,.02)})}
});

/* ============================ ROZJAZD ============================ */
// Rozjazd zwyczajny lewo/prawo-wlotowy (uproszczony): tor zasadniczy 30 m prosto, zjazd w prawo (+X) promieniem R=110 m od z=-12,
// iglice, serce, podkłady rozjazdowe wydłużane ku odgałęzieniu. Skrócony (rzeczywisty 1:9 R=190 m ma ~33 m i boczne 3,7 m).
const BR=110,Z0=-12,lat=z=>z<Z0?0:(z-Z0)*(z-Z0)/(2*BR);
defProp('torRozjazd',{name:'Rozjazd (zjazd w prawo)',cat:C,dims:[7,1.1,30],cover:false,
  note:'Zjazd ku +X (zrób lustro scale.x=-1). Zasadniczy: x=0; odgałęzienie kończy się ok. 3 m obok. Bez koliderów.'},(P,o,r)=>{
  const rc=railCol(r),conc=r.chance(.5);
  P.prism([[-1.8,0],[5.2,0],[4.8,.15],[-1.4,.15]],30,0,0,-15,BAL,{edges:false,small:true});
  for(let z=-14.6;z<=14.8;z+=.85){const l=lat(z),L=2.6+l;Bs(P,L,.16,.27,l/2,.04,z,conc?r.pick(SLP_C):r.pick(SLP_W),{ry:r.range(-.015,.015)})}
  for(const sx of [-1,1])rail(P,sx*.7175,-15,sx*.7175,15,.2,rc);
  // odgałęzienie: 5 cięciw dla dwóch szyn
  const steps=[Z0,-6,0,6,11,15];
  for(let i=0;i<steps.length-1;i++){
    const za=steps[i],zb=steps[i+1];
    for(const sx of [-1,1])rail(P,sx*.7175+lat(za),za,sx*.7175+lat(zb),zb,.2,rc);
  }
  // iglice i serce (jaśniejsze, pogrubione fragmenty) + dźwignia nastawcza
  Bs(P,.05,.14,3.2,.7175+.02,.23,-11,shade(rc,1.4),{ry:.03});Bs(P,.05,.14,3.2,-.7175-.02,.23,-11,shade(rc,1.4),{ry:-.0});
  Bs(P,.22,.16,1.6,.7175+.55,.23,3.6,shade(rc,.7),{ry:-.17});
  Bs(P,.3,.5,.3,-1.3,0,-12,DARK);Bs(P,.05,.6,.05,-1.3,.5,-12,RED);
});

/* ============================ KOZIOŁ OPOROWY ============================ */
// Kozioł oporowy (bufor końcowy toru): belka buforowa 3,0 m, dwa słupy, sześć szyn pod kątem, zderzaki, pasy biało-czerwone, nasyp.
defProp('kozlOporowy',{name:'Kozioł oporowy',cat:C,dims:[3.2,1.7,4.3],cover:false,
  note:'Czoło (belka) ku +Z; tor wjeżdża od −Z. Kolider h 1,3 m na belce i słupach (nisko – bez osłony).'},(P,o,r)=>{
  P.prism([[-1.8,0],[1.8,0],[1.4,.15],[-1.4,.15]],4.2,0,0,-2.15,BAL,{edges:false,small:true});
  for(let i=0;i<7;i++)Bs(P,2.6,.16,.26,0,.04,-1.9+i*.6,r.pick(SLP_W));
  for(const sx of [-1,1])rail(P,sx*.7175,-2.1,sx*.7175,1.4,.2,railCol(r));
  for(const sx of [-1,1]){B(P,.3,1.15,.3,sx*1.15,.1,1.5,STEELD);Bs(P,.1,.1,1.7,sx*1.15,.45,.75,STEELD,{rx:.5})}
  for(let i=0;i<6;i++)P.box(.5,.32,.3,-1.25+i*.5,.9,1.55,i%2?WHITE:RED,{edges:false});
  P.add(new THREE.CylinderGeometry(.16,.16,.1,8),0,.78,1.75,STEEL,{rx:PI/2,edges:false,small:true});
  for(const sx of [-1,1])P.add(new THREE.CylinderGeometry(.17,.17,.1,8),sx*.5,.78,1.75,STEEL,{rx:PI/2,edges:false,small:true});
  P.col(-1.5,1.5,1.35,1.75,1.3);P.col(-1.3,-1.0,1.35,1.75,1.3);
});

/* ============================ PERON ============================ */
// Peron wysoki 4,5 x 14 m, górna płaszczyzna 1,13 m nad gruntem (0,76 m nad szyną), płyta krawędziowa 0,5 m z białym pasem
// bezpieczeństwa 0,8 m od krawędzi. Krawędź od strony toru = −X (oś toru stawiaj na x=-4,0). Wariant „wiata”: dach 8 m, 2 ławki, zegar.
defProp('peron',{name:'Peron',cat:C,dims:[4.5,4.9,14],variants:['goly','wiata'],cover:false,
  note:'Krawędź od strony toru = −X, oś toru x=−4. Kolider h=1,13 (nie wejdziesz na peron bez schodów); collide:false = pusty peron do chodzenia po wyższym terenie.'},(P,o,r)=>{
  const v=o.variant||'goly',W=4.5,H=1.13,L=o.len||14,nm=o.name||NAZWA_DEF;
  P.box(W,H,L,0,0,0,r.pick([CONC,CONCD]));
  B(P,W-.1,.04,L-.1,0,H,0,r.pick([0x6e6c68,0x7a7870]));
  B(P,.5,.06,L,-W/2+.25,H+.02,0,0xd0cbbf);
  B(P,.1,.025,L-.4,-W/2+.8,H+.06,0,WHITE);
  for(let z=-L/2+1;z<L/2;z+=2)B(P,.5,.07,.03,-W/2+.25,H+.02,z,DARK);
  const cr=atlas('rail:pekniecia',256,128,(g,w,h)=>{g.strokeStyle='#26241f';g.lineCap='round';let s=7;const R=()=>(s=(s*16807)%2147483647)/2147483647;
    for(let k=0;k<5;k++){g.lineWidth=1+R()*2;g.beginPath();let x=R()*w,y=R()*h;g.moveTo(x,y);for(let i=0;i<7;i++){x+=(R()-.3)*34;y+=(R()-.5)*22;g.lineTo(x,y)}g.stroke()}
    g.fillStyle='rgba(30,28,22,.35)';for(let i=0;i<4;i++){g.beginPath();g.ellipse(R()*w,R()*h,10+R()*14,6+R()*8,R()*3,0,7);g.fill()}});
  for(let i=0;i<3;i++)P.decal(cr,2.4,1.2,r.range(-.8,.8),H+.062,r.range(-L/2+1.5,L/2-1.5),{rx:-PI/2,ry:r.range(0,PI)});
  const lamp=z=>{P.cyl(.04,.06,3.7,1.8,H,z,STEELD,{seg:5,edges:false,small:true});B(P,.5,.07,.2,1.58,H+3.7,z,STEELD,{small:true});P.add(new THREE.BoxGeometry(.4,.04,.14),1.58,H+3.66,z,0xfff0b8,{basic:true})};
  lamp(-L/2+2.2);lamp(L/2-2.2);
  P.cyl(.2,.17,.7,1.9,H,-L/2+.8,0x3a5a3a,{seg:6,edges:false,small:true});
  const ck=(z)=>{P.cyl(.04,.04,2.8,-1.4,H,z,STEELD,{seg:5,edges:false,small:true});B(P,1.1,1.1,.14,-1.4,H+2.55,z,0x222222,{small:true});
    const zt=zegarTex();P.decal(zt,1.0,1.0,-1.4,H+3.1,z+.08);P.decal(zt,1.0,1.0,-1.4,H+3.1,z-.08,{ry:PI})};
  ck(L/2-4.5);
  if(v==='wiata'){
    const rl=8.4,rz=0;
    for(const z of [-3.6,-1.2,1.2,3.6])B(P,.14,3.45,.14,1.55,H,z,STEELD);
    B(P,4.0,.14,rl,0,H+3.45,rz,r.pick([0x5a6a72,0x6a5a4a]),{rz:.035,small:false});
    B(P,.04,.35,rl,-1.99,H+3.38,rz,r.pick([0x7a2a22,0x2a5a7a]),{small:true});
    B(P,.06,1.7,rl-.4,1.95,H,rz,0x4a5258,{small:true});
    for(const z of [-2.4,2.4])bench(P,1.5,H,z,-PI/2,r.pick([0x3f6b3a,0x8b5a2b]));
    P.decal(nameTex(nm),3.0,.45,-1.97,H+3.15,rz-.9,{ry:-PI/2});
    P.cyl(.02,.02,3.4,1.0,H+.05,-.2,STEELD,{seg:4,edges:false,small:true});
    P.col(1.45,1.65,-3.7,-3.5,H+3.5);P.col(1.45,1.65,3.5,3.7,H+3.5);
  }
  P.col(-W/2,W/2,-L/2,L/2,H);
});

/* ============================ DWORZEC ============================ */
// Budynek dworca 26 x 11,5 x 9 m (typ międzywojenny z poczekalnią w osi): hala środkowa 10 m (tynk, dach dwuspadowy wzdłuż Z),
// skrzydła 8 m z dachami wzdłuż X. Wejście od placu (+Z, drzwi 2,6 m) i na peron (−Z). W hali: kasa biletowa (okienko,
// lada 1,05 m), ławki, rozkład jazdy, zegar, napis z nazwą stacji nad oboma wejściami. Można wejść do poczekalni.
defProp('dworzec',{name:'Dworzec kolejowy',cat:C,dims:[26.8,9.9,14.3],cover:true,
  note:'Wejście +Z (plac) i −Z (peron), hala środkowa dostępna. opts.name = napis stacji. Kolidery: skrzydła i ściany hali z przejściem.'},(P,o,r)=>{
  const nm=o.name||NAZWA_DEF,wall=r.pick([PLAS,0xe0d2a8,0xcfc59a,0xd9c9a0]),trim=shade(wall,.78),roof=r.pick([ROOF,0x7a3a30,0x5a4a46]);
  const wn=okno();
  P.box(10,.09,10.6,0,0,0,r.pick([0x8a7e6a,0xa49a82]),{edges:false});
  for(const sx of [-1,1]){
    P.box(8,5.0,11,sx*9,0,0,wall);
    B(P,8.15,1.0,11.15,sx*9,0,0,trim);B(P,8.5,.25,11.5,sx*9,4.9,0,shade(wall,.9));
    P.prism([[-6,0],[6,0],[0,2.1]],8.8,sx*9-4.4,5.1,0,roof,{ry:PI/2});
    for(const zs of [-1,1])for(const wx of [-2.4,.2,2.8]){
      const x=sx*9+wx,z=zs*5.55;P.decal(wn,1.1,1.9,x,2.55,z+zs*.012,{ry:zs>0?0:PI});B(P,1.3,.07,.22,x,1.55,z+zs*.1,CONC);
    }
    P.decal(wn,1.1,1.9,sx*13.02,2.55,0,{ry:sx*PI/2});B(P,.22,.07,1.3,sx*13.1,1.55,0,CONC);
    P.cyl(.05,.05,5,sx*13.1,0,4.6,STEEL,{seg:5,edges:false,small:true});
  }
  // hala: ściany przód/tył z przejściem 2,6 m
  for(const zs of [-1,1]){
    const z=zs*5.3;
    for(const sx of [-1,1])P.box(3.7,7.0,.4,sx*3.15,0,z,wall);
    P.box(2.6,3.6,.4,0,3.4,z,wall);
    B(P,.2,3.4,.45,-1.4,0,z+zs*.02,trim);B(P,.2,3.4,.45,1.4,0,z+zs*.02,trim);B(P,3.0,.2,.5,0,3.4,z+zs*.02,trim);
    B(P,10.4,.25,.5,0,6.9,z+zs*.02,shade(wall,.88));
    P.decal(nameTex(nm),6.2,.93,0,4.3,z+zs*.215,{ry:zs>0?0:PI});
    const zt=zegarTex();P.decal(zt,1.3,1.3,0,5.9,z+zs*.215,{ry:zs>0?0:PI});
    for(let i=0;i<3;i++)B(P,3.6-i*.4,.16,.5+i*.4,0,i*.16,z+zs*(.7+i*.25),CONC);
  }
  P.prism([[-5.6,0],[5.6,0],[0,2.4]],11.8,0,7.0,-5.9,roof);
  B(P,.35,.7,.35,2.5,9.2,0,shade(BRICK,1),{small:true});
  // wnętrze: kasa, ława, rozkład
  const ka=atlas('rail:kasa',256,128,(g,w,h)=>{g.fillStyle='#2f4a3a';g.fillRect(0,0,w,h);g.fillStyle='#f0e6b8';g.font=FONTA(26);g.textAlign='center';g.fillText('KASA BILETOWA',w/2,28);
    for(const x of [30,142]){g.fillStyle='#0f1a20';g.fillRect(x,44,84,60);g.strokeStyle='#caa860';g.lineWidth=4;g.strokeRect(x,44,84,60);g.fillStyle='#caa860';for(let i=0;i<7;i++)g.fillRect(x+8+i*11,50,3,48)}});
  P.decal(ka,3.6,1.8,-4.97,1.95,.9,{ry:PI/2});
  B(P,.75,1.05,4.6,-4.55,0,.9,WOOD);B(P,.8,.05,4.65,-4.55,1.05,.9,0x3a2a1a);
  const rz=atlas('rail:rozklad',192,128,(g,w,h)=>{g.fillStyle='#e8c224';g.fillRect(0,0,w,h);g.fillStyle='#161616';g.font=FONTA(22);g.textAlign='center';g.fillText('ODJAZDY',w/2,24);
    g.font='11px monospace';g.textAlign='left';for(let i=0;i<8;i++){g.fillText(String(5+i*2).padStart(2,'0')+'.'+(i*7%6)+'5  STRZELNICA',10,44+i*10)}});
  P.decal(rz,1.6,1.07,4.96,1.8,-1.5,{ry:-PI/2});
  for(const z of [-2.6,1.4])bench(P,2.4,.09,z,-PI/2,r.pick([0x6b4a2c,0x3f6b3a]),3.0);
  for(const z of [-2.5,2.5])P.add(new THREE.BoxGeometry(.5,.07,.2),0,6.0,z,0xfff0b8,{basic:true});
  P.col(-13,-5,-5.75,5.75,5.0);P.col(5,13,-5.75,5.75,5.0);
  for(const zs of [-1,1])for(const sx of [-1,1])P.col(sx>0?1.3:-5,sx>0?5:-1.3,zs*5.3-.2,zs*5.3+.2,7);
  P.col(-4.95,-4.15,-1.4,3.2,1.05);P.col(2.1,2.7,-4.1,-1.1,.6);P.col(2.1,2.7,-0.1,2.9,.6);
});

/* ============================ NASTAWNIA ============================ */
// Nastawnia piętrowa 6,4 x 5,6 x 7,3 m: parter ceglany 5,6 x 4,6 x 3,0 m (przekaźniki), piętro 6,4 x 5,2 x 2,5 m
// przeszklone z trzech stron (stół nastawczy), dach płaski z okapem, schody zewnętrzne ze stalową poręczą (11 stopni), lampa.
defProp('nastawnia',{name:'Nastawnia',cat:C,dims:[8.2,7.4,6.4],cover:true,
  note:'Schody po stronie +X, szyby piętra ku +Z (tor). Kolider: parter i piętro pełne; schody osobno.'},(P,o,r)=>{
  const br=r.pick([BRICK,0xa2563e,0x8a4a38]),wn=okno(),up=r.pick([0xd8d4c0,0xc8d4c8]);
  P.box(5.6,3.0,4.6,0,0,0,br);B(P,5.7,.4,4.7,0,.0,0,shade(br,.7));
  P.box(6.4,2.5,5.2,0,3.0,0,up);
  B(P,6.9,.22,5.7,0,5.5,0,TAR);B(P,6.6,.14,5.4,0,5.72,0,shade(TAR,1.4));
  for(const [x,z,ry,n] of [[0,2.62,0,4],[0,-2.62,PI,4]]){
    for(let i=0;i<n;i++)P.decal(wn,1.35,1.45,-2.35+i*1.57,4.3,z+(z>0?.012:-.012),{ry})
    B(P,6.3,.08,.18,0,3.5,z+(z>0?.1:-.1),CONC);
  }
  for(const sx of [-1,1]){for(let i=0;i<2;i++)P.decal(wn,1.3,1.45,sx*3.22,4.3,-1.0+i*2.0,{ry:sx*PI/2})}
  P.decal(wn,.9,1.3,-1.4,1.7,2.32,{ry:0});P.decal(wn,.9,1.3,1.2,1.7,-2.32,{ry:PI});
  B(P,1.0,2.1,.12,.0,0,2.34,0x4a3a2a);
  Bs(P,.08,.1,.1,.4,1.0,2.42,STEEL);
  // schody stalowe po +X: 11 stopni od z=-2.2 (dół) ku piętru
  const sx0=3.2,n=11,rise=3.0/n;
  for(let i=0;i<n;i++)B(P,1.0,.05,.28,sx0+.5,(i+1)*rise-.05,2.0-i*.3,STEELD,{small:true});
  const sa=Math.atan2(3.0,(n-1)*.3),sl=Math.hypot(3.0,(n-1)*.3);
  for(const dx of [-.5,.5]){Bs(P,.05,.05,sl,sx0+.5+dx,1.5+.9,2.0-(n-1)*.15,STEEL,{rx:sa});Bs(P,.05,.22,sl,sx0+.5+dx,1.5-.1,2.0-(n-1)*.15,STEELD,{rx:sa});
    for(const t of [0,.5,1])Bs(P,.04,.95,.04,sx0+.5+dx,t*3.0,2.0-t*(n-1)*.3,STEEL)}
  B(P,1.2,.06,1.0,sx0+.5,3.0-.04,-1.4,STEELD,{small:true});
  P.cyl(.02,.02,2.2,-2.6,5.5,-2.0,STEEL,{seg:4,edges:false,small:true});
  P.cyl(.05,.05,5.0,2.8,0,-2.4,STEEL,{seg:5,edges:false,small:true});
  Bs(P,.3,.16,.18,-1.0,5.9,-1,STEELD);P.add(new THREE.BoxGeometry(.4,.06,.2),0,3.5,2.8,0xfff0b8,{basic:true});
  P.col(-2.8,2.8,-2.3,2.3,3.0);P.col(-3.2,3.2,-2.6,2.6,5.5);P.col(sx0,sx0+1.0,-1.9,2.15,1.6);
});

/* ============================ SEMAFOR KSZTAŁTOWY ============================ */
// Semafor kształtowy: słup kratowy ~5,8 m, ramię 1,3 m (czerwone z białym pasem), latarnia ze szkłami (czerwone/zielone/żółte).
// Wariant stoj = ramię poziomo (czerwone), jedz = ramię skośnie 45° ku górze (zielone światło). Światło emisyjne, nie mruga.
const lens=(key,col)=>neonTex('rail:lens:'+key,64,64,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);
  if(col){const gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'#fff');gr.addColorStop(.35,col);gr.addColorStop(.8,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr}
  else g.fillStyle='#161212';
  g.beginPath();g.arc(32,32,28,0,7);g.fill()});
defProp('semaforKsztaltowy',{name:'Semafor kształtowy',cat:C,dims:[1.8,6.0,.7],variants:['stoj','jedz'],cover:false,
  note:'Ramię wystaje ku +X. Latarnia świeci emisją (static). Kolider cienki (słup).'},(P,o,r)=>{
  const v=o.variant||r.pick(['stoj','jedz']),go=v==='jedz';
  P.cyl(.07,.1,5.7,0,0,0,r.pick([0x5a5e60,0x4a4e50]),{seg:6,edges:false});
  for(let y=.4;y<5.4;y+=.6)Bs(P,.28,.03,.03,0,y,.12,STEELD);
  B(P,.9,.1,.1,0,0,0,CONCD,{small:true});
  const ang=go?.78:0,L=1.3;
  for(let i=0;i<4;i++){const c=Math.cos(ang),s=Math.sin(ang),d=.15+(i+.5)*L/4;P.box(L/4,.26,.03,d*c,5.15+d*s,.08,i%2?WHITE:RED,{rz:ang,edges:false,small:true})}
  Bs(P,.08,.8,.05,.1,5.55,.07,RED,{rz:.0});
  P.box(.34,.7,.3,0,4.3,.2,DARK,{edges:false});
  P.neon(lens('r'+(go?0:1),go?null:'#ff2a1a'),.22,.22,0,4.85,.36,{static:true});
  P.neon(lens('g'+(go?1:0),go?'#3aff6a':null),.22,.22,0,4.55,.36,{static:true});
  P.neon(lens('y0',null),.22,.22,0,4.25,.36,{static:true});
  P.colBox(.3,.3,5.8,0,0);
});

/* ============================ SEMAFOR ŚWIETLNY ============================ */
// Semafor świetlny trójkomorowy (czerwone/żółte/zielone, soczewki ø0,2 m), słup 4,0 m, głowica 0,3 x 0,9 m, osłony przeciwsłoneczne, tabliczka.
defProp('semaforSwietlny',{name:'Semafor świetlny',cat:C,dims:[.6,4.6,.5],variants:['stoj','wolna','ostrzezenie'],cover:false,
  note:'Światła emisyjne (static). Kolider cienki.'},(P,o,r)=>{
  const v=o.variant||r.pick(['stoj','wolna','ostrzezenie']);
  P.cyl(.06,.08,4.0,0,0,0,r.pick([0x6a6e70,0x4a4e50]),{seg:6,edges:false});
  B(P,.3,.9,.28,0,3.55,.1,DARK);
  B(P,.2,.4,.04,0,3.0,.12,WHITE);
  const a=[['r','#ff2a1a',v==='stoj',4.2],['y','#ffc21a',v==='ostrzezenie',3.9],['g','#3aff6a',v==='wolna',3.6]];
  for(const [k,c,on,y] of a){P.neon(lens(k+(on?1:0),on?c:null),.2,.2,0,y,.25,{static:true});B(P,.26,.05,.14,0,y+.11,.3,DARK,{small:true})}
  B(P,.5,.04,.04,0,2.2,.05,STEEL,{small:true});
  P.colBox(.3,.3,4.0,0,0);
});

/* ============================ TUNEL – WYLOT ============================ */
// Portal tunelu jednotorowego: ściana czołowa 12 x 9,5 m (beton, gr. 1,2 m), światło otworu 5,2 m szer., h 5,8 m (półkole R=2,6 m),
// rękaw ciemny 12 m (zamknięty tyłem), skrzydła murów oporowych, zwornik, lampy. Przód (portal) ku +Z, tor wzdłuż Z przez środek.
defProp('tunelWylot',{name:'Tunel – wylot (portal)',cat:C,dims:[13.5,9.5,14],cover:true,
  note:'Tor przez otwór x=0. Wnętrze zamknięte czarną ścianą. Kolidery: dwa filary + rękaw boczny; otwór wolny.'},(P,o,r)=>{
  const hw=2.6,sp=3.2,con=r.pick([CONC,0xa8a49a,0x9a968c]);
  const arch=()=>{const p=new THREE.Path();p.moveTo(-hw,0);p.lineTo(-hw,sp);p.absarc(0,sp,hw,PI,0,true);p.lineTo(hw,0);p.lineTo(-hw,0);return p};
  const mk=(w,h,dep)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.lineTo(-w/2,0);s.holes.push(arch());return new THREE.ExtrudeGeometry(s,{depth:dep,bevelEnabled:false,curveSegments:8})};
  P.add(mk(12,9.5,1.2),0,0,-1.2,con);
  P.add(mk(8.6,7.6,12),0,0,-13.2,shade(con,.8),{edges:false});
  B(P,.7,.55,.4,0,sp+hw,.0,shade(con,1.15));
  B(P,12.2,.4,1.4,0,9.4,-.55,shade(con,1.12));
  B(P,5.2,.05,12,0,0,-7.2,0x4a4640,{small:true});
  B(P,5.4,6.3,.1,0,0,-13.1,0x050505,{small:true});
  for(const sx of [-1,1]){P.box(.8,7.2,4.6,sx*6.6,0,-1.2,shade(con,.95),{ry:sx*.0});B(P,.6,.2,.6,sx*2.2,4.2,-4,DARK);P.add(new THREE.BoxGeometry(.3,.08,.3),sx*2.55,4.2,-4,0xfff0b8,{basic:true})}
  const gr=atlas('rail:grafTunel',192,72,(g,w,h)=>{g.font=FONTA(46);g.textAlign='center';g.textBaseline='middle';g.lineWidth=8;g.lineJoin='round';g.strokeStyle='#101010';g.strokeText('ŁKS',w/2,h/2);g.fillStyle='#ff4a2a';g.fillText('ŁKS',w/2,h/2)});
  if(r.chance(.7))P.decal(gr,2.6,.98,-4.2,1.5,.03);
  P.col(-6,-hw-.05,-13.2,0.05,9.5);P.col(hw+.05,6,-13.2,0.05,9.5);P.col(-hw-.05,hw+.05,-13.3,-13.0,6);
});

/* ============================ WIADUKT KOLEJOWY ============================ */
// Segment wiaduktu: pomost 12 x 7,4 m (dźwigary stalowe 1,0 m + płyta betonowa), podpory-przyczółki 1,6 m gr., światło przejazdu 8,4 m,
// h pod pomostem 4,6 m, balustrady 1,1 m. Tor na górze (y=5,6). Przejazd drogowy/pieszy pod spodem wzdłuż X.
defProp('wiadukt',{name:'Wiadukt kolejowy (segment)',cat:C,dims:[7.6,6.4,12],cover:true,
  note:'Pod spodem przejazd wzdłuż X; tor po górze wzdłuż Z (y=5,6). Kolider: dwa przyczółki; pomost nad głową.'},(P,o,r)=>{
  const con=r.pick([CONC,CONCD]),steel=r.pick([0x5a6a6e,0x6a5a4a,0x4a5a68]);
  for(const zs of [-1,1])P.box(7.4,4.6,1.6,0,0,zs*5.2,con);
  B(P,7.6,.4,12,0,4.6,0,shade(con,.9));
  for(const sx of [-1,1]){B(P,.22,1.0,12,sx*3.2,4.6-1.0,0,steel);B(P,.9,.12,12,sx*3.2,4.6-1.06,0,steel);}
  B(P,7.4,.65,12,0,5.0,0,shade(con,1.05));
  B(P,3.9,.2,12,0,5.65,0,BAL);
  for(const sx of [-1,1]){B(P,.12,1.0,12,sx*3.65,5.65,0,steel);B(P,.2,.1,12,sx*3.65,6.62,0,shade(steel,1.2),{small:true})}
  for(let i=0;i<20;i++)Bs(P,2.6,.16,.26,0,5.85-.01,-5.7+i*.6,SLP_W[i%3]);
  for(const sx of [-1,1])rail(P,sx*.7175,-6,sx*.7175,6,6.0-.15,0x6b4f3e);
  P.col(-3.7,3.7,-6,-4.4,5.65);P.col(-3.7,3.7,4.4,6,5.65);
});

/* ============================ ZEJŚCIE DO PRZEJŚCIA PODZIEMNEGO ============================ */
// Wejście do przejścia podziemnego pod torami: dwa murki 1,2 m z poręczą, zadaszenie 2,6 m, znak „przejście”, czarny otwór ze schodami (iluzja).
defProp('przejscieZejscie',{name:'Zejście do przejścia podziemnego',cat:C,dims:[3.8,3.2,5.4],cover:true,
  note:'Wejście ku +Z; schody w dół pokazane jako ciemny otwór w gruncie. Kolider: murki i dach.'},(P,o,r)=>{
  const con=r.pick([CONC,CONCD]),L=5.0;
  for(const sx of [-1,1]){P.box(.4,1.25,L,sx*1.7,0,0,con);B(P,.55,.1,L+.1,sx*1.7,1.25,0,shade(con,1.12));Bs(P,.05,.05,L,sx*1.46,1.62,0,STEEL);for(const z of [-2.2,0,2.2])Bs(P,.05,.4,.05,sx*1.46,1.25,z,STEEL)}
  B(P,3.0,.04,L-.4,0,.02,0,0x0a0a0a,{small:true});
  for(let i=0;i<8;i++)B(P,3.0,.02,.06,0,.045,-2.1+i*.58,i%2?0x2a2a2a:0x3a3a3a,{small:true});
  const gz=r.chance(.6);
  if(gz){B(P,3.6,.2,2.4,0,3.0,-L/2+1.4,0x4a5258);for(const sx of [-1,1])B(P,.2,3.0,.2,sx*1.7,0,-L/2+.4,STEELD)}
  const sg=atlas('rail:przejscie',192,64,(g,w,h)=>{g.fillStyle='#1c4f9a';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font=FONTA(24);g.textAlign='center';g.textBaseline='middle';g.fillText('PRZEJŚCIE PODZIEMNE',w/2,h/2)});
  P.decal(sg,1.7,.57,0,2.5,L/2-.15,{ry:0});
  P.col(-1.95,-1.45,-L/2,L/2,1.3);P.col(1.45,1.95,-L/2,L/2,1.3);
});

/* ============================ MAGAZYN Z RAMPĄ ============================ */
// Magazyn kolejowy 8 x 20 m, ściany 5,2 m (cegła), dach dwuspadowy z blachy (kalenica 6,9 m), 4 wrota przesuwne 3,0 x 3,0 m,
// rampa załadunkowa 3,2 m szer. na 1,1 m (wys. wagonu) z okapem na słupach 2,4 m, paleta/skrzynie, rynny.
defProp('magazynKolejowy',{name:'Magazyn kolejowy z rampą',cat:C,dims:[11.8,7.0,20.5],cover:true,
  note:'Rampa po stronie +X (od toru). Napis na szczycie +Z (decal). Kolidery: korpus, rampa niska, słupy okapu.'},(P,o,r)=>{
  const br=r.pick([BRICK,0xa0583c,0x8d5a42]),wn=okno(),roof=r.pick([0x6a7276,0x7a6a5a,0x5a6a62]),Lz=20,Wx=8;
  P.box(Wx,5.2,Lz,0,0,0,br);B(P,Wx+.1,.8,Lz+.1,0,0,0,shade(br,.7));
  P.prism([[-5.0,0],[5.0,0],[0,1.8]],Lz+.6,0,5.2,-(Lz+.6)/2,roof);
  B(P,Wx+.3,.14,Lz+.3,0,5.15,0,shade(br,.85));
  for(let i=0;i<4;i++){const z=-7.2+i*4.8;
    B(P,.1,3.05,3.1,Wx/2+.04,.15,z,r.pick([0x4a5a3a,0x5a4a3a,0x3f5f7a]));
    Bs(P,.12,.1,3.6,Wx/2+.12,3.28,z,STEELD);Bs(P,.1,.1,.4,Wx/2+.12,1.5,z+1.1,STEEL);
  }
  for(let i=0;i<5;i++)P.decal(wn,.9,.6,-Wx/2-.012,3.8,-8+i*4,{ry:-PI/2});
  const tb=atlas('rail:magazyn',256,64,(g,w,h)=>{g.fillStyle='#f0ebd8';g.fillRect(0,0,w,h);g.strokeStyle='#222';g.lineWidth=5;g.strokeRect(3,3,w-6,h-6);g.fillStyle='#161616';g.font=FONTA(40);g.textAlign='center';g.textBaseline='middle';g.fillText('MAGAZYN 3',w/2,h/2+2)});
  P.decal(tb,3.4,.85,0,3.8,Lz/2+.012,{ry:0});
  // rampa + okap
  P.box(3.2,1.1,Lz,Wx/2+1.6,0,0,CONC);B(P,.12,.28,Lz,Wx/2+3.15,.4,0,0x1a1a1a,{small:true});B(P,3.3,.08,Lz+.1,Wx/2+1.6,1.1,0,0x6a6862);
  B(P,3.8,.12,Lz+.4,Wx/2+1.9,4.0,0,roof,{rz:.05,small:false});
  for(let z=-9;z<=9.1;z+=4.5)B(P,.14,2.9,.14,Wx/2+3.4,1.1,z,STEELD);
  Bs(P,.1,.1,Lz,Wx/2+3.4,3.95,0,STEEL);
  for(const sz of [-1,1]){P.cyl(.05,.05,5.2,Wx/2-.1,0,sz*(Lz/2-.2),STEEL,{seg:5,edges:false,small:true})}
  B(P,1.0,.14,1.2,Wx/2+1.8,1.18,-4,0x8a6a3a,{small:true});B(P,.9,.8,.9,Wx/2+1.4,1.18,-3,0x9a7a4a,{small:true});B(P,.8,.6,.8,Wx/2+2.4,1.18,5,0x7a5a3a,{small:true});
  P.cyl(.3,.3,.9,Wx/2+2.4,1.18,-7,0x2a3a5a,{seg:8,edges:false,small:true});
  P.col(-Wx/2,Wx/2,-Lz/2,Lz/2,5.2);P.col(Wx/2,Wx/2+3.2,-Lz/2,Lz/2,1.1);
  for(let z=-9;z<=9.1;z+=4.5)P.col(Wx/2+3.33,Wx/2+3.47,z-.07,z+.07,2.5);
});

/* ============================ RAMPA ZAŁADUNKOWA ============================ */
// Wolnostojąca rampa betonowa 3,0 x 1,1 x 12 m (wysokość podłogi wagonu), krawędź stalowa, odboje z opon, pochylnia na końcu.
defProp('rampa',{name:'Rampa załadunkowa',cat:C,dims:[3.0,1.2,13.6],cover:false,
  note:'Krawędź od toru = −X. Kolider h 1,1 (niska osłona).'},(P,o,r)=>{
  P.box(3.0,1.1,12,0,0,0,r.pick([CONC,CONCD]));B(P,3.1,.08,12.1,0,1.1,0,0x6a6862);
  B(P,.14,.14,12.1,-1.5,1.0,0,STEELD);
  for(let z=-5.5;z<=5.6;z+=2.2)P.add(new THREE.TorusGeometry(.17,.07,4,8),-1.6,.6,z,0x161616,{ry:PI/2,edges:false,small:true});
  P.add(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(1.6,0),new THREE.Vector2(0,1.1)]),{depth:3.0,bevelEnabled:false}),-1.5,0,6,r.pick([CONC,CONCD]),{ry:PI/2,edges:false});
  P.col(-1.5,1.5,-6,6,1.1);
});

/* ============================ WÓZEK BAGAŻOWY ============================ */
// Wózek peronowy PKP 0,7 x 1,7 m, podłoga drewniana 0,5 m, 2 duże koła ø0,6 z tyłu, mały przód, dyszel; walizki, paczka.
defProp('wozekBagazowy',{name:'Wózek bagażowy',cat:C,dims:[.85,1.5,2.5],cover:false,note:'Seed: bagaż. Kolider niski.'},(P,o,r)=>{
  B(P,.7,.07,1.6,0,.5,0,WOOD);
  for(const sx of [-1,1]){P.add(new THREE.CylinderGeometry(.3,.3,.05,10),sx*.4,.3,-.5,STEELD,{rz:PI/2,edges:false,small:true});P.add(new THREE.CylinderGeometry(.18,.18,.04,8),sx*.33,.18,.7,STEELD,{rz:PI/2,edges:false,small:true})}
  Bs(P,.04,.04,.9,0,.5,1.3,STEELD,{rx:.5});Bs(P,.5,.04,.04,0,.72,1.7,STEELD);
  Bs(P,.05,.9,.05,-.33,.57,-.78,STEELD);Bs(P,.05,.9,.05,.33,.57,-.78,STEELD);
  for(const [x,z,s] of [[-.1,-.4,1],[.15,.15,.8],[0,.6,.9]])if(r.chance(.8))Bs(P,.5*s,.3*s,.7*s,x,.57,z,r.pick([0x6a4a2a,0x2a3a5a,0x7a2a22]),{ry:r.range(-.3,.3)});
  P.colBox(.8,1.7,.6,0,.2);
});

/* ============================ TABLICE KOLEJOWE ============================ */
// „Uwaga pociąg” (tablica 0,9 x 0,6 m na słupku 2,2 m) i krzyż św. Andrzeja (ostrzeżenie na przejeździe, ramiona 1,2 m, pas biało-czerwony).
defProp('tablicaKolej',{name:'Tablica „Uwaga pociąg” / krzyż',cat:C,dims:[1.05,2.8,.1],dimsV:{uwaga:[.95,2.2,.1],krzyz:[1.05,2.8,.1]},variants:['uwaga','krzyz'],cover:false,
  note:'Twarz ku +Z, dwustronnie. Kolider cienki.'},(P,o,r)=>{
  const v=o.variant||'uwaga';
  P.cyl(.04,.045,v==='krzyz'?2.4:2.2,0,0,0,r.pick([0x5a5e60,0x7a7e80]),{seg:5,edges:false});
  if(v==='uwaga'){
    const t=atlas('rail:uwaga',256,160,(g,w,h)=>{g.fillStyle='#f4f0e0';g.fillRect(0,0,w,h);g.strokeStyle='#c01818';g.lineWidth=12;g.strokeRect(6,6,w-12,h-12);
      g.fillStyle='#161616';g.font=FONTA(40);g.textAlign='center';g.fillText('UWAGA',w/2,50);g.fillText('POCIĄG',w/2,96);
      g.fillStyle='#161616';g.fillRect(78,112,100,24);g.fillRect(150,104,24,10);g.beginPath();g.arc(98,138,7,0,7);g.arc(156,138,7,0,7);g.fill()});
    B(P,.92,.62,.04,0,1.6,0,WHITE);P.decal(t,.9,.56,0,1.91,.025);P.decal(t,.9,.56,0,1.91,-.025,{ry:PI});
  }else{
    for(const s of [-1,1]){
      const a=s*.78;for(let i=0;i<4;i++){const d=(i-1.5)*.32;P.box(.32,.2,.05,d*Math.cos(a),2.3-.1+d*Math.sin(a),0,i%2?WHITE:RED,{rz:a,edges:false})}
    }
  }
  P.colBox(.2,.2,2.2,0,0);
});

/* ============================ SŁUP TRAKCYJNY Z SIECIĄ ============================ */
// Słup trakcyjny kratowy ~9 m (przekrój 0,35 m), wysięgnik 3,3 m, izolatory, drut jezdny na 5,6 m, lina nośna na 6,9 m, wieszaki,
// przęsło 50 m ku +Z (wolne od koliderów poza słupem). Do instancingu: DS.props.instance('slupTrakcyjny',[{x,z,rotY}...]) co `span` metrów.
defProp('slupTrakcyjny',{name:'Słup trakcyjny z siecią',cat:C,dims:[3.9,9.0,50],cover:false,
  note:'Słup przy x=−3,3 względem osi toru (x=0); sieć ku +Z na długość opts.span (50 m). Instancing: transformy co span m.'},(P,o,r)=>{
  const span=o.span||50,mast=r.pick([0x7a7e80,0x6a6e70]);
  const mx=-3.3;
  B(P,.55,.35,.55,mx,0,0,CONCD);
  for(const [dx,dz] of [[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]])P.cyl(.025,.04,9.0,mx+dx,.3,dz,mast,{seg:4,edges:false});
  for(let y=.7;y<8.8;y+=.9)Bs(P,.32,.03,.03,mx,y,-.15,mast);
  Bs(P,.05,.05,.04,mx,9.15,0,mast,{});
  Bs(P,3.3,.08,.08,mx+1.65,6.9,0,mast);Bs(P,3.0,.06,.06,mx+1.5,5.9,0,mast,{rz:.0});
  Bs(P,.05,1.2,.05,mx+3.0,5.7,0,mast);
  for(const y of [5.65,6.85])P.cyl(.04,.05,.35,mx+3.15,y-.05,0,0x7a4a2a,{seg:5,edges:false,small:true});
  const n=5,seg=span/n;
  for(let i=0;i<n;i++){
    const z0=i*seg,z1=z0+seg,s0=i?(.02+.5*Math.sin(PI*i/n)*0):0;
    const sag=z=>.55*(1-Math.pow((z/span-.5)*2,2))*.35,yz=z=>6.9-sag(z)*1.0;
    const ya=yz(z0),yb=yz(z1),len=Math.hypot(seg,yb-ya);
    Bs(P,.025,.025,len,mx+3.15,(ya+yb)/2,(z0+z1)/2,STEEL,{rx:-Math.atan2(yb-ya,seg)});
    Bs(P,.03,.03,seg,mx+3.15,5.62,(z0+z1)/2,0xa0663a);
    void s0;
    if(i)Bs(P,.012,yz(z0)-5.6,.012,mx+3.15,5.62,z0,STEEL);
  }
  P.colBox(.5,.5,9,mx,0);
});

/* ============================ BUDKA DRÓŻNIKA ============================ */
// Budka dróżnika (dom dróżnika na przejeździe) 4,2 x 3,4 m, ściany 2,8 m, dach dwuspadowy z papy (kalenica 4,2 m), komin, drzwi, 2 okna, lampa naftowa.
defProp('budkaDroznika',{name:'Budka dróżnika',cat:C,dims:[4.6,4.8,3.8],cover:true,note:'Drzwi ku +Z. Wariant tynk/cegła wg seeda.'},(P,o,r)=>{
  const wl=r.pick([PLAS,BRICK,0xcfc8a6]),wn=okno(),roof=r.pick([TAR,ROOF]);
  P.box(4.2,2.8,3.4,0,0,0,wl);B(P,4.3,.6,3.5,0,0,0,shade(wl,.7));
  P.prism([[-2.4,0],[2.4,0],[0,1.4]],3.9,0,2.8,-1.95,roof,{ry:0});
  P.box(.5,1.6,.5,1.4,3.0,-.8,BRICK,{edges:true});
  B(P,.9,2.0,.1,-.9,0,1.72,0x4a3a2a);Bs(P,.08,.1,.08,-.6,1.0,1.8,STEEL);
  P.decal(wn,1.0,1.1,1.0,1.7,1.72,{ry:0});P.decal(wn,1.0,1.1,-1.0,1.7,-1.72,{ry:PI});P.decal(wn,.9,1.1,2.112,1.7,0,{ry:PI/2});
  B(P,1.2,.06,.2,1.0,1.1,1.8,CONC);
  Bs(P,.18,.28,.12,.4,2.0,1.78,DARK);P.add(new THREE.BoxGeometry(.1,.14,.04),.4,2.0,1.85,0xffd070,{basic:true});
  B(P,1.6,.14,.7,0,0,2.0,CONC);
  P.colBox(4.2,3.4,2.8,0,0);
});

/* ============================ ZAPORA KOLEJOWA (SZLABAN) ============================ */
// Zapora przejazdowa: słup-skrzynia 0,5 x 1,2 m, wysięgnik 6,0 m (biało-czerwony, 8 pasów), 3 lampy czerwone mrugające + lampa na słupie.
// Warianty: zamknieta (poziomo, kolider na całej długości), otwarta (ramię pionowo).
defProp('zaporaKolejowa',{name:'Zapora kolejowa (szlaban)',cat:C,dims:[6.5,1.6,.6],dimsV:{otwarta:[.6,7.2,.6],zamknieta:[6.5,1.6,.6]},variants:['zamknieta','otwarta'],cover:false,
  note:'Ramię ku +X. Lampy mrugają (neon, przygaszenie). Zamknięta: kolider niski h 1,2.'},(P,o,r)=>{
  const open=o.variant==='otwarta',a=open?1.45:0;
  B(P,.55,1.1,.5,0,0,0,r.pick([0x8a8e90,0xa09a8a]));B(P,.5,.2,.5,0,1.1,0,STEELD);
  P.box(.3,.3,.3,0,1.35,0,DARK,{edges:false});
  const n=8,L=6.0;
  for(let i=0;i<n;i++){const d=.4+(i+.5)*(L-.4)/n,c=Math.cos(a),s=Math.sin(a);
    P.box((L-.4)/n,.14,.1,d*c,1.2+d*s-.05,0,i%2?WHITE:RED,{rz:a,edges:false,small:true})}
  const lt=neonTex('rail:lampaR',64,64,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);const gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'#fff');gr.addColorStop(.4,'#ff2a1a');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(32,32,30,0,7);g.fill()});
  for(const [d,sz] of [[.8,1],[3.2,1],[5.8,1]]){const c=Math.cos(a),s=Math.sin(a);P.neon(lt,.2,.2,d*c,1.34+d*s,.07,{rz:0});P.neon(lt,.2,.2,d*c,1.34+d*s,-.07,{ry:PI})}
  P.neon(lt,.2,.2,0,1.85,.18);P.neon(lt,.2,.2,0,1.85,-.18,{ry:PI});
  Bs(P,.14,.4,.14,0,1.5,0,STEELD);
  if(open)P.col(-.3,.3,-.3,.3,1.4);else{P.col(-.3,.3,-.3,.3,1.4);P.col(.3,L,-.1,.1,1.25)}
});

/* ============================ SKRZYNKA PRZEKAŹNIKOWA ============================ */
// Szafa/skrzynka przekaźnikowa (sygnalizacja SRK): 1,1 x 1,5 x 0,6 m, dwuskrzydłowe drzwi, zamek, daszek, podstawa betonowa 0,2 m, ostrzeżenie.
defProp('skrzynkaPrzekaznikowa',{name:'Skrzynka przekaźnikowa',cat:C,dims:[1.1,1.75,.7],cover:false,variants:['szara','zielona'],note:'Drzwi ku +Z. Kolider h 1,75.'},(P,o,r)=>{
  const col=(o.variant||r.pick(['szara','zielona']))==='zielona'?0x4a6a54:0x8a9094;
  B(P,1.15,.2,.75,0,0,0,CONC);
  P.box(1.0,1.45,.6,0,.2,0,col,{edges:true});B(P,1.1,.07,.7,0,1.62,0,shade(col,.8));
  B(P,.02,1.35,.02,0,.25,.31,DARK,{small:true});
  for(const sx of [-1,1]){Bs(P,.04,.3,.04,sx*.45,.7,.32,STEELD);Bs(P,.04,.3,.04,sx*.45,1.2,.32,STEELD)}
  Bs(P,.08,.12,.04,.08,.9,.32,STEEL);
  Bs(P,.2,.26,.02,-.3,1.1,.31,YEL);Bs(P,.05,.14,.01,-.3,1.14,.32,DARK);
  P.col(-.55,.55,-.38,.38,1.7);
});
