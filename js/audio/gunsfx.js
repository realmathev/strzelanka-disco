// Warstwowe dźwięki broni, proceduralny Web Audio (właściciel: ds-gunfeel).
// Strzał = trzask (szum górnoprzepustowy + klik) + dudnienie (sinus z opadającą częstotliwością) + korpus (szum dolnoprzepustowy)
// + ogon pomieszczenia (wspólny ConvolverNode z generowaną odpowiedzią impulsową) + klik mechanizmu. Profil per kaliber.
// Liczby (profile kalibrów, głośności, filtry odległości) ustawia js/gunfeel przez setGunAudio(AUDIO z gunfeel/tuning.js).
// Przejęte nazwy w sfxBank: pistol/smg/shotgun/rifle (strzał bieżącej broni), empty (martwy spust), reload (cisza: fazy
// przeładowania gra gunfeel), hit/head (gunfeel gra je z opóźnieniem wg odległości z zdarzenia 'hit'), enemyShot (filtr odległości).
// Dopóki gunfeel nie wywoła setGunAudio, reload/hit/head grają jak dawniej.
import {opt} from '../core/save.js';
import {S} from '../core/state.js';
import {world} from '../world/state.js';
import {A,env,noiseSrc} from './context.js';
import {sfxBank} from './sfx.js';

const C={shotVol:1,calibers:{},weapon:{},byName:{},room:{default:{ir:1.2,decay:3,wet:1}},rand:{pitch:.03,vol:.08},mech:1,
  enemy:{near:9000,far:1100,farDist:45,vol:.32},hit:1,ready:false};
const GENERIC={crack:{hp:2400,bp:3800,q:.8,dur:.05,vol:.55},thump:{f0:140,f1:48,dur:.12,vol:.75},body:{lp:2300,dur:.14,vol:.6},tail:.25,mech:{d:.03,f:3000,vol:.1}};
/** Konfiguracja z gunfeel/tuning.js (AUDIO). Po wywołaniu gunsfx przejmuje reload/hit/head. */
export function setGunAudio(cfg){Object.assign(C,cfg);C.ready=true}
const rnd=(a,b)=>a+Math.random()*(b-a);
const hitGain=()=>{const v=+opt.hitVol;return isFinite(v)?Math.max(0,v)/.8:1};

/* ───────── pogłos (jeden na kontekst i poziom) ───────── */
let RV={ctx:null,key:'',send:null};
function reverbSend(){
  const c=A.ctx,lv=world.level&&world.level.id||'default',r=C.room[lv]||C.room.default;
  if(RV.ctx===c&&RV.key===lv)return RV.send;
  if(!RV.send||RV.ctx!==c){RV.conv=c.createConvolver();RV.send=c.createGain();RV.send.connect(RV.conv);RV.conv.connect(A.sfx)}
  const len=Math.max(1,Math.floor(c.sampleRate*r.ir)),buf=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<len;i++){const t=i/c.sampleRate;
    // wczesne odbicia (kilka „klaśnięć” w pierwszych 60 ms) + gęsty, wykładniczo gasnący ogon
    const er=(t>.011&&t<.013)||(t>.027&&t<.029)||(t>.047&&t<.049)?.5:0;
    d[i]=((Math.random()*2-1)*.55+er*(Math.random()<.5?-1:1))*Math.exp(-r.decay*t)*(t<.006?t/.006:1)}}
  RV.conv.buffer=buf;RV.send.gain.value=r.wet;RV.ctx=c;RV.key=lv;return RV.send;
}

/* ───────── klocki ───────── */
/** Szyna głosu: gain -> (lowpass) -> A.sfx, plus wysyłka do pogłosu. */
function bus(t,vol,lp,wet){
  const c=A.ctx,g=c.createGain();g.gain.value=vol;
  if(lp&&lp<16000){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;f.Q.value=.5;g.connect(f);f.connect(A.sfx)}else g.connect(A.sfx);
  if(wet>0){const s=c.createGain();s.gain.value=wet;g.connect(s);s.connect(reverbSend())}
  return g;
}
function noise(dst,t,dur,vol,type,f,q=.7,att=.0015,type2,f2,g2){
  const c=A.ctx,s=noiseSrc(t,dur+.06),fl=c.createBiquadFilter(),g=c.createGain();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
  let last=fl;s.connect(fl);if(type2){const f2n=c.createBiquadFilter();f2n.type=type2;f2n.frequency.value=f2;f2n.Q.value=1;if(g2!=null)f2n.gain.value=g2;fl.connect(f2n);last=f2n}
  env(g,t,att,Math.max(.0002,vol),dur);last.connect(g);g.connect(dst);
}
function tone(dst,t,type,f0,f1,dur,vol,att=.002){
  const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  env(g,t,att,Math.max(.0002,vol),dur);o.connect(g);g.connect(dst);o.start(t);o.stop(t+att+dur+.05);
}
const click=(d,t,f,vol,dur=.012,q=2.5)=>noise(d,t,dur,vol,'bandpass',f,q,.0008);
const thunk=(d,t,f,vol,dur=.05)=>{tone(d,t,'sine',f*1.6,f,dur,vol,.001);noise(d,t,dur*.6,vol*.6,'lowpass',f*4,.7,.001)};
const scrape=(d,t,f,vol,dur=.07)=>noise(d,t,dur,vol*2.2,'bandpass',f,1.4,.01);
const ping=(d,t,f,vol,dur=.12)=>{tone(d,t,'sine',f,f*.995,dur,vol,.001);tone(d,t,'sine',f*2.76,f*2.74,dur*.6,vol*.4,.001)};

/* ───────── strzał ───────── */
/** Strzał profilem kalibru `cal` (id z AUDIO.calibers albo obiekt). o: {dist [m], vol, delay [s], lp}. */
export function gunShot(cal,o={}){
  if(!A.ctx)return;const c=A.ctx,p=typeof cal==='object'&&cal?cal:(C.calibers[cal]||GENERIC);
  const dist=o.dist||0,t=c.currentTime+(o.delay||0)+.001,pr=1+rnd(-C.rand.pitch,C.rand.pitch),vr=(o.vol==null?1:o.vol)*(1+rnd(-C.rand.vol,C.rand.vol));
  const far=Math.min(1,dist/(C.enemy.farDist||45));
  const lp=o.lp||(dist>0?C.enemy.near+(C.enemy.far-C.enemy.near)*Math.sqrt(far):0);
  const d=bus(t,vr*(C.shotVol||1)/(1+dist/14),lp,(p.tail||0)*(1+far*.8));
  const k=p.crack;if(k&&k.vol>0){noise(d,t,k.dur,k.vol*(1-far*.7),'highpass',k.hp*pr,.7,.0008,'peaking',k.bp*pr,6);click(d,t,k.bp*.7*pr,k.vol*.35*(1-far),.006,1.2)}
  const h=p.thump;if(h&&h.vol>0)tone(d,t,'sine',h.f0*pr,h.f1*pr,h.dur,h.vol,.0015);
  const b=p.body;if(b&&b.vol>0)noise(d,t,b.dur,b.vol,'lowpass',b.lp*pr,.6,.002);
  const m=p.mech;if(m&&m.vol>0&&dist<1)click(d,t+m.d,m.f*pr,m.vol*C.mech,.01,3);
}
/** Martwy spust: klik spustu + suchy klik iglicy/kurka. */
export function gunDry(){if(!A.ctx)return;const t=A.ctx.currentTime+.001,d=bus(t,1.8*C.mech,0,.05);click(d,t,2600,.35,.008,3);click(d,t+.045,1700,.45,.012,2);tone(d,t+.045,'square',1100,900,.015,.04)}

/** Mechanika: magOut, magIn, boltBack, boltFwd, slideBack, slideRel, pumpBack, pumpFwd, shellIn, cylOut, cylIn, cylClick,
 *  coverOpen, coverClose, beltIn, boltUp, boltDown, draw, shellDrop, shellDropG. */
export function gunMech(kind,vol=1,delay=0){
  if(!A.ctx)return;const t=A.ctx.currentTime+delay+.001,v=vol*C.mech,d=bus(t,v,0,.08);
  switch(kind){
    case 'magOut':click(d,t,1900,.4);scrape(d,t+.015,900,.25,.09);break;
    case 'magIn':scrape(d,t,1100,.22,.05);thunk(d,t+.05,170,.5,.06);click(d,t+.055,2300,.45);break;
    case 'boltBack':case 'slideBack':scrape(d,t,1300,.3,.06);click(d,t+.06,2000,.45);break;
    case 'boltFwd':case 'slideRel':click(d,t,2400,.55,.014);thunk(d,t+.004,210,.35,.05);break;
    case 'pumpBack':scrape(d,t,800,.4,.08);click(d,t+.07,1500,.55,.016);thunk(d,t+.07,150,.3);break;
    case 'pumpFwd':scrape(d,t,950,.35,.06);click(d,t+.06,2100,.6,.016);thunk(d,t+.06,180,.35);break;
    case 'shellIn':click(d,t,1500,.35,.014);thunk(d,t+.01,240,.25,.04);break;
    case 'cylOut':click(d,t,2800,.35);scrape(d,t+.01,1800,.15,.05);break;
    case 'cylIn':thunk(d,t,260,.35,.05);click(d,t,3200,.4);break;
    case 'cylClick':click(d,t,3600,.25,.008,4);break;
    case 'coverOpen':click(d,t,1300,.45,.02);thunk(d,t+.01,140,.35,.08);break;
    case 'coverClose':thunk(d,t,120,.6,.09);click(d,t,1600,.55,.02);break;
    case 'beltIn':for(let i=0;i<5;i++)click(d,t+i*.025,2400+i*120,.18,.01,3);break;
    case 'boltUp':click(d,t,2200,.35);break;
    case 'boltDown':click(d,t,1800,.45);thunk(d,t,200,.2,.04);break;
    case 'draw':scrape(d,t,2600,.12,.12);click(d,t+.12,2200,.25);break;
    case 'shellDrop':ping(d,t,rnd(3800,5200),.06,.09);ping(d,t+rnd(.05,.09),rnd(4200,5600),.035,.06);break;
    case 'shellDropG':thunk(d,t,rnd(300,380),.12,.04);thunk(d,t+rnd(.06,.1),rnd(320,420),.06,.03);break;
  }
}
/** Trafienie w powierzchnię świata (stone/metal/wood/ground/foliage), z opóźnieniem wg odległości. */
export function gunImpact(surface,delay=0,vol=1){
  if(!A.ctx)return;const t=A.ctx.currentTime+delay+.001,d=bus(t,.5*vol,0,.12);
  switch(surface){
    case 'metal':click(d,t,3200,.45,.01);ping(d,t,rnd(1800,2600),.12,.18);break;
    case 'wood':thunk(d,t,rnd(380,460),.35,.04);click(d,t,1100,.25,.02);break;
    case 'ground':noise(d,t,.06,.3,'lowpass',700,.7,.002);break;
    case 'foliage':noise(d,t,.05,.18,'bandpass',2600,.8,.004);break;
    default:click(d,t,2500,.35,.016,1.2);noise(d,t,.05,.18,'lowpass',1500,.7,.002);
  }
}
/** Potwierdzenie trafienia wroga (jak dawne 'hit'/'head' + „plask”), z małym opóźnieniem. */
export function gunHit(head,delay=0,lp=0){
  if(!A.ctx)return;const v=hitGain()*C.hit;if(v<=0)return;const t=A.ctx.currentTime+delay+.001,d=bus(t,1,lp,0);
  if(head){tone(d,t,'sine',1400,1400,.08,.3*v);tone(d,t+.05,'sine',2100,2100,.12,.25*v);noise(d,t,.04,.18*v,'bandpass',1500,1.2,.001)}
  else{tone(d,t,'triangle',900,600,.05,.22*v);noise(d,t,.035,.16*v,'bandpass',1200,1.1,.001)}
}

/* ───────── przejęcie nazw w sfxBank ───────── */
let lastShots=-1,lastG=null;
function shotName(name){
  const G=S.G;let cal=C.byName[name];
  // ten sam synchroniczny fire(): G.shots właśnie wzrosło, a G.fireT = W.rate. Inaczej to ktoś inny (np. granat z perku woła 'shotgun').
  if(G&&(G!==lastG||G.shots!==lastShots)&&G.shots>0&&G.fireT>0){lastG=G;lastShots=G.shots;cal=C.weapon[G.weapon]||cal}
  return cal;
}
for(const n of ['pistol','smg','shotgun','rifle'])sfxBank.set(n,()=>gunShot(shotName(n)));
sfxBank.set('empty',()=>gunDry());
sfxBank.set('reload',(c,out,t,arg,{tone})=>{if(C.ready)return;tone('square',500,300,.04,.12);tone('square',800,600,.04,.12,.25)});
sfxBank.set('hit',(c,out,t,arg,{tone})=>{if(C.ready)return;const v=hitGain();if(v>0)tone('triangle',900,600,.05,.22*v)});
sfxBank.set('head',(c,out,t,arg,{tone})=>{if(C.ready)return;const v=hitGain();if(v>0){tone('sine',1400,1400,.08,.3*v);tone('sine',2100,2100,.12,.25*v,.05)}});
// arg = clamp(1.3 - dist/40, .2, 1) z enemies: odtwarzamy odległość, filtrujemy wysokie i lekko opóźniamy (prędkość dźwięku, max 80 ms).
sfxBank.set('enemyShot',(c,out,t,arg)=>{const a=arg==null?1:+arg||1,dist=Math.max(2,(1.3-a)*40);
  gunShot(C.calibers.r762||GENERIC,{dist,vol:C.enemy.vol*(.6+a*.6),delay:Math.min(.08,dist/343)})});
