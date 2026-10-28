// Szerokość nadwozia = wymiar rzeczywisty (bez lusterek); lusterka (funkcja mirror) dodają ~6 cm z każdej strony.
// Samochody PRL/III RP. Przód auta w -Z (konwencja gry), szerokość wzdłuż X, origin = środek na gruncie.
// Wymiary: Fiat 126p 3054x1377x1335 mm (muzeum MIT Kraków), Polonez Caro 4318x1650x1420, rozstaw 2509 (autocentrum.pl),
// Passat B5 ok. 4675x1740x1459, rozstaw 2703 (kombi 4682; sedan o ~7 cm krótszy), Żuk A06 ok. 4,5x1,78x2,0 m (z pamięci/katalogów, ±5 cm).
// Nadwozie = wyciśnięty profil boczny z wycięciami nadkoli (sideProfile), szyby/słupki/dach osobno, koła, światła, tablice
// (decale z atlasu), szwy drzwi i rdza (decale z alfą). Seed: kolor, tablica, zużycie.
import {defProp,atlas,sideProfile,shade,rng} from './lib.js';

const PI=Math.PI;
const TIRE=0x1b1a1a;

/** Obrys nadwozia: top = od dolnego narożnika przodu, górą, do dolnego narożnika tyłu; dopisuje nadkola. */
function outline(top,axF,axR,ar,y0){
  // dół od tyłu ku przodowi (s rośnie): najpierw tylne nadkole, potem przednie
  const arch=cs=>{const a=[];for(let k=0;k<=6;k++){const t=PI-PI*k/6;a.push([cs+Math.cos(t)*ar,y0+Math.sin(t)*ar*1.02])}return a};
  return top.map(p=>p.slice()).concat(arch(axR),arch(axF));
}
const PLATES=(()=>{const r=rng(5),L='ABCDEFGHJKLMNPRSTUWXYZ',pre=['WA','KR','GD','PO','LU','WB','SK','LD','RZ','BI','OP','KT'];
  return pre.map(p=>p+' '+r.int(1000,9999)+L[r.int(0,L.length-1)])})();
function plate(seed){
  const t=PLATES[Math.abs(Math.floor(seed))%PLATES.length];
  return atlas('plate:'+t,128,28,(g,w,h)=>{g.fillStyle='#f4f4ee';g.fillRect(0,0,w,h);g.fillStyle='#1c3f94';g.fillRect(0,0,13,h);g.fillStyle='#fff';g.font='bold 8px sans-serif';g.fillText('PL',2,24);
    g.fillStyle='#111';g.font='bold 22px Arial, sans-serif';g.textAlign='center';g.fillText(t,w/2+7,22);g.strokeStyle='#111';g.lineWidth=1.5;g.strokeRect(.5,.5,w-1,h-1)});
}
/** Szwy drzwi, klamki, korek wlewu: decal na boku (przód auta po prawej gdy patrzysz z +X). */
function sideDecal(S,sign){
  return atlas('car:'+S.id+(sign>0?'R':'L'),512,96,(g,w,h)=>{
    const sx=s=>sign>0?(s+S.L/2)/S.L*w:(S.L/2-s)/S.L*w,y=yy=>h-(yy-S.y0)/(S.belt-S.y0)*h;
    g.strokeStyle='#15110e';g.lineWidth=2.5;g.lineJoin='round';
    for(const d of S.doors){const a=sx(d[0]),b=sx(d[1]),x0=Math.min(a,b),x1=Math.max(a,b);g.beginPath();g.rect(x0,6,x1-x0,h-14);g.stroke();
      g.fillStyle='#15110e';const hx=sign>0?x0+8:x1-24;g.fillRect(hx,14,16,4)}
    if(sign>0){g.beginPath();g.arc(sx(S.fuel),22,6,0,7);g.stroke()}
    g.lineWidth=1.5;g.beginPath();g.moveTo(0,h-3);g.lineTo(w,h-3);g.stroke();
  });
}
function rustDecal(k){
  return atlas('car:rust'+k,128,40,(g,w,h)=>{const r=rng(k+40);
    for(let i=0;i<14;i++){const x=r.range(0,w),y=r.range(h*.4,h),rad=r.range(3,11);g.fillStyle=r.pick(['#7a3b1e','#8a4a22','#5a2a14','#a0602c']);g.beginPath();g.ellipse(x,y,rad*1.6,rad*.7,0,0,7);g.fill()}
    g.fillStyle='#4a2410';for(let i=0;i<20;i++)g.fillRect(r.range(0,w),r.range(h*.5,h),r.range(1,4),r.range(1,3))});
}

/**
 * Lusterko zewnętrzne z ramieniem: cienka nóżka od burty (|x| = xb) i obudowa na jej końcu. Całkowite wysunięcie poza burtę
 * = arm + w - .005 (domyślnie ~6 cm), więc szerokość całkowita auta = szerokość nadwozia + ~12 cm (nie +20 cm jak dawniej).
 * sx = ±1 (strona), (y, z) = środek obudowy, z < 0 = ku przodowi auta.
 */
function mirror(P,sx,xb,y,z,color,{arm=.03,w=.035,h=.1,d=.14}={}){
  P.box(arm+.01,.022,.04,sx*(xb+arm/2-.005),y-.02,z+d*.2,0x15110e,{edges:false,small:true});   // ramię (czarne)
  P.box(w,h,d,sx*(xb+arm+w/2-.005),y-h/2,z,color,{edges:false,small:true});                      // obudowa
}

function buildCar(P,o,r,S){
  const {L,W,H,wr,tw,y0,axF,axR,ar}=S;
  const body=o.color!=null?o.color:r.pick(S.colors),dirt=shade(body,.55);
  // nadwozie + kontur-kadłub
  P.add(sideProfile(outline(S.top,axF,axR,ar,y0),W,.05),0,0,0,body,{hull:.018});
  if(S.upper)for(const u of S.upper)P.add(sideProfile(u.pts,u.w||W,.04),0,0,0,u.color!=null?u.color:body,{hull:.012});
  // podwozie widoczne w nadkolach
  P.box(W-.18,ar+.04,axF-axR+2*ar-.04,0,y0-.02,(-axF-axR)/2,0x1a1612,{edges:false,small:true});
  // szyby, dach, słupki
  const glass=r.chance(.25)?0x3a5360:0x6a93a6;
  P.add(sideProfile(S.glass,S.Wc,0),0,0,0,glass,{edges:false});
  for(const g of (S.glass2||[]))P.add(sideProfile(g.pts,g.w,0),0,0,0,glass,{edges:false});
  P.add(sideProfile(S.roof,S.roofW||S.Wc+.06,.025),0,0,0,body,{edges:false});
  for(const [s0,ya,s1,yb,th] of S.pillars){
    const dz=-(s1-s0),dy=yb-ya,len=Math.hypot(dz,dy),a=Math.atan2(dz,dy);
    for(const sx of [-1,1])P.box(.05,len,th,sx*(S.Wc/2-.015),(ya+yb)/2-len/2,-(s0+s1)/2,body,{rx:a,edges:false,small:true});
  }
  // koła
  const rim=S.rim||0xb8bcc0;
  for(const [ax,az] of [[axF,0],[axR,0]])for(const sx of [-1,1]){
    const x=sx*S.track/2,z=-ax;
    P.cylc(wr,wr,tw,x,wr,z,TIRE,{seg:10,rz:PI/2,hull:.06,edges:false});
    P.cylc(wr*.6,wr*.6,tw+.02,x,wr,z,rim,{seg:6,rz:PI/2,edges:false,small:true});
  }
  // zderzaki, światła, tablice
  S.detail(P,o,r,body);
  // decale boczne
  for(const sg of [-1,1]){
    P.decal(sideDecal(S,sg),L-.2,S.belt-y0-.04,sg*(W/2+.006),(S.belt+y0)/2,0,{ry:sg*PI/2});
  }
  const nr=Math.floor(r()*3.3);
  for(let i=0;i<nr;i++){const sg=r.chance(.5)?1:-1;P.decal(rustDecal(r.int(0,2)),r.range(.6,1.1),.22,sg*(W/2+.009),y0+.14,-r.range(-L/2+.8,L/2-.8),{ry:sg*PI/2})}
  P.colBox(W,L,H);P.cover=true;
}

/* ---------- Fiat 126p ("Maluch") ---------- */
defProp('fiat126p',{name:'Fiat 126p (Maluch)',cat:'auta',dims:[1.38,1.34,3.06],cover:true,note:'3054x1377x1335 mm, silnik z tyłu (żaluzje na klapie). Przód w -Z.'},(P,o,r)=>{
  const L=3.054;
  buildCar(P,o,r,{id:'126p',L,W:1.377,H:1.35,wr:.25,tw:.14,y0:.19,axF:.92,axR:-.92,ar:.3,track:1.15,belt:.9,
    colors:[0xc2282b,0xe0b020,0x2d5fa8,0xe8e1c8,0xd86a22,0x4f8a5b,0x7a4a2d,0x8a2a4a],
    top:[[1.527,.19],[1.53,.5],[1.5,.66],[1.4,.75],[.82,.88],[0,.9],[-1.28,.92],[-1.46,.84],[-1.527,.62],[-1.527,.19]],
    glass:[[.82,.88],[.3,1.33],[-.95,1.33],[-1.24,.92]],Wc:1.16,
    roof:[[.36,1.28],[.27,1.355],[-.98,1.355],[-1.02,1.28]],
    pillars:[[.82,.88,.3,1.33,.06],[-.2,.9,-.2,1.33,.05],[-.95,1.33,-1.24,.92,.08]],
    doors:[[.78,-.28]],fuel:-1.0,
    detail(P,o,r,body){
      const pl=plate(o.seed);
      // zderzaki: wystają ~2 cm poza nadwozie (całkowita długość ≈ 3,05 m + 4 cm)
      P.box(1.3,.08,.07,0,.25,-1.512,0xb8bcc0,{edges:false});P.box(1.3,.08,.07,0,.25,1.512,0xb8bcc0,{edges:false});
      for(const sx of [-1,1]){
        P.cylc(.075,.075,.04,sx*.46,.6,-1.53,0xfff3c0,{seg:8,rx:PI/2,basic:true});
        P.box(.12,.05,.03,sx*.6,.5,-1.52,0xf0a020,{basic:true});
        P.box(.1,.17,.03,sx*.55,.7,1.53,0xd01818,{basic:true});
        mirror(P,sx,.6885,1.0,-.78,body,{h:.09,d:.11});   // małe lusterko na nóżce
      }
      for(let k=0;k<4;k++)P.box(.7,.025,.02,0,.62+k*.06,1.535,0x15110e,{edges:false,small:true});
      P.decal(pl,.52,.113,0,.4,-1.535,{ry:PI});P.decal(pl,.52,.113,0,.38,1.54);
    }});
});

/* ---------- FSO Polonez Caro ---------- */
defProp('polonez',{name:'FSO Polonez Caro',cat:'auta',dims:[1.65,1.42,4.32],cover:true,note:'4318x1650x1420 mm, rozstaw 2509 mm, hatchback. Przód w -Z.'},(P,o,r)=>{
  const L=4.318;
  buildCar(P,o,r,{id:'polonez',L,W:1.65,H:1.42,wr:.29,tw:.175,y0:.2,axF:1.27,axR:-1.24,ar:.35,track:1.36,belt:.92,
    colors:[0xc9b78a,0x4a6a4f,0x9a2a2a,0x2a3f6a,0xe8e4d8,0xd8742a,0x3a3a3c],
    top:[[2.159,.24],[2.16,.62],[2.1,.76],[1.9,.82],[.95,.88],[0,.92],[-1.95,.98],[-2.12,.9],[-2.159,.72],[-2.159,.24]],
    glass:[[.95,.88],[.35,1.38],[-.95,1.38],[-1.98,.96]],Wc:1.38,
    roof:[[.4,1.34],[.3,1.42],[-.95,1.42],[-1.02,1.34]],
    pillars:[[.95,.88,.35,1.38,.07],[-.15,.9,-.15,1.38,.05],[-.95,1.38,-1.98,.96,.12]],
    doors:[[.9,-.12],[-.12,-1.0]],fuel:-1.5,
    detail(P,o,r,body){
      const pl=plate(o.seed);
      P.box(1.6,.1,.08,0,.25,-2.14,0x2a2a2a,{edges:false});P.box(1.6,.1,.08,0,.25,2.14,0x2a2a2a,{edges:false});
      P.box(.7,.12,.03,0,.64,-2.17,0x1a1a1a,{edges:false,small:true});
      for(const sx of [-1,1]){
        P.box(.34,.13,.04,sx*.58,.68,-2.16,0xfff3c0,{basic:true});
        P.box(.4,.14,.04,sx*.55,.8,2.17,0xd01818,{basic:true});
        mirror(P,sx,.825,1.0,-.9,body);
      }
      P.decal(pl,.52,.113,0,.38,-2.165,{ry:PI});P.decal(pl,.52,.113,0,.55,2.175);
    }});
});

/* ---------- Volkswagen Passat B5 ---------- */
defProp('passatB5',{name:'VW Passat B5 (sedan)',cat:'auta',dims:[1.74,1.45,4.68],cover:true,note:'ok. 4675x1740x1450, rozstaw 2703 mm, limuzyna. Przód w -Z.'},(P,o,r)=>{
  const L=4.675;
  // Limuzyna (3 bryły): dłuższa i wyższa kabina niż dawniej: dach płaski 1,6 m (było 1,3), słupki bliżej pionu (szyba przednia
  // ~40°, tylna ~40°), linia szyb 0,97-1,0 m, bagażnik z wyraźnym pokładem. Wysokość całkowita ~1,45 m.
  buildCar(P,o,r,{id:'passat',L,W:1.74,H:1.45,wr:.31,tw:.195,y0:.2,axF:1.4,axR:-1.3,ar:.37,track:1.5,belt:.94,rim:0xc8ccd0,
    colors:[0xa8adb2,0x1c1e22,0x2d4a3b,0x1f2f5a,0x5a1f2b,0xe8e8e8,0x6a5a3a],
    top:[[2.337,.25],[2.34,.58],[2.28,.72],[2,.82],[1.02,.94],[0,.97],[-1.75,1.0],[-2.25,.99],[-2.337,.88],[-2.337,.25]],
    glass:[[1.02,.94],[.4,1.4],[-1.25,1.4],[-1.75,1.0]],Wc:1.5,
    roof:[[.45,1.36],[.38,1.445],[-1.28,1.445],[-1.36,1.36]],
    pillars:[[1.02,.94,.4,1.4,.07],[-.1,.97,-.1,1.4,.06],[-1.25,1.4,-1.75,1.0,.12]],
    doors:[[1.0,-.1],[-.1,-1.1]],fuel:-1.9,
    detail(P,o,r,body){
      const pl=plate(o.seed);
      P.box(1.7,.1,.06,0,.27,-2.31,shade(body,.8),{edges:false});P.box(1.7,.1,.06,0,.27,2.31,shade(body,.8),{edges:false});
      P.box(.5,.09,.03,0,.68,-2.34,0xbfc3c6,{edges:false,small:true});
      for(const sx of [-1,1]){
        P.box(.46,.13,.04,sx*.6,.72,-2.3,0xfff3c0,{basic:true});
        P.box(.4,.12,.04,sx*.58,.8,2.33,0xd01818,{basic:true});
        mirror(P,sx,.87,1.04,-.98,body,{d:.15});
      }
      P.decal(pl,.52,.113,0,.42,-2.345,{ry:PI});P.decal(pl,.52,.113,0,.76,2.34);
    }});
});

/* ---------- Żuk A06 (furgon) ---------- */
defProp('zukA06',{name:'FSO Żuk A06',cat:'auta',dims:[1.78,2.0,4.5],cover:true,note:'ok. 4,5x1,78x2,0 m, rozstaw 2,9 m, furgon. Przód w -Z.'},(P,o,r)=>{
  const L=4.5,W=1.78;
  // Furgon z JEDNĄ ciągłą linią dachu: dach kabiny i nadwozia z tyłu na tej samej wysokości (1,98 m), bez wyższej „skrzyni”
  // nad kabiną (dawniej paka 1,99 m wyższa od dachu kabiny 1,82 m dawała sylwetkę ciężarówki). Szyba przednia stroma (~66°).
  buildCar(P,o,r,{id:'zuk',L,W,H:2.0,wr:.36,tw:.18,y0:.3,axF:1.45,axR:-1.45,ar:.42,track:1.5,belt:1.05,rim:0x8a8f94,
    colors:[0x6f9ec2,0xe8e2cc,0x6b7a4a,0xb8b02a,0xc2402a],
    top:[[2.25,.3],[2.27,.85],[2.2,1],[1.65,1.05],[.55,1.08],[-2.1,1.08],[-2.25,1],[-2.25,.3]],
    upper:[{pts:[[.5,1.05],[.5,1.98],[-2.15,1.98],[-2.25,1.9],[-2.25,1.05]]}],
    glass:[[1.65,1.05],[1.28,1.9],[.55,1.9],[.55,1.05]],Wc:1.74,
    roof:[[1.34,1.9],[1.28,1.98],[.5,1.98],[.5,1.9]],roofW:W,
    pillars:[[1.65,1.05,1.28,1.9,.08],[.6,1.05,.6,1.92,.07]],
    doors:[[1.55,.62]],fuel:-1.2,
    detail(P,o,r,body){
      const pl=plate(o.seed);
      P.box(1.7,.12,.09,0,.3,-2.225,0x8a8f94,{edges:false});P.box(1.7,.12,.09,0,.3,2.225,0x8a8f94,{edges:false});
      P.box(.7,.25,.03,0,.7,-2.27,0xbfc3c6,{edges:false,small:true});
      for(const sx of [-1,1]){
        P.cylc(.09,.09,.05,sx*.62,.8,-2.26,0xfff3c0,{seg:8,rx:PI/2,basic:true});
        P.box(.12,.2,.04,sx*.7,.95,2.26,0xd01818,{basic:true});
        // duże lusterko vanowe na dłuższej nóżce, przy słupku A (dawniej stało omyłkowo z tyłu, z=+1,5)
        mirror(P,sx,.89,1.55,-1.42,0x15110e,{arm:.05,w:.03,h:.2,d:.13});
      }
      P.decal(pl,.52,.113,0,.38,-2.275,{ry:PI});P.decal(pl,.52,.113,0,.5,2.275);
      // tylne drzwi dwuskrzydłowe: szew pionowy
      P.box(.02,1.1,.015,0,.85,2.255,0x15110e,{edges:false,small:true});
    }});
});
