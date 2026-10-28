// Efekty dźwiękowe syntezowane na żywo. Nazwy broni = id broni (sfx(G.weapon)).
import {opt} from '../core/save.js';
import {A,mtof,env,noiseSrc} from './context.js';

/** Dodatkowe efekty rejestrowane przez inne moduły (np. audio/gunsfx.js): name -> fn(ctx, out, t, arg, helpers). */
export const sfxBank=new Map();

const hitGain=()=>{const v=+opt.hitVol;return isFinite(v)?Math.max(0,v)/.8:1};
export function sfx(name,arg){
  if(!A.ctx)return; const c=A.ctx,t=c.currentTime;
  const out=A.sfx;
  const tone=(type,f1,f2,dur,vol,delay=0)=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f1,t+delay);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+delay+dur);env(g,t+delay,.003,vol,dur);o.connect(g);g.connect(out);o.start(t+delay);o.stop(t+delay+dur+.05)};
  const nz=(freq,type,dur,vol,q=1)=>{const s=noiseSrc(t,dur+.05),f=c.createBiquadFilter(),g=c.createGain();f.type=type;f.frequency.value=freq;f.Q.value=q;env(g,t,.002,vol,dur);s.connect(f);f.connect(g);g.connect(out)};
  const custom=sfxBank.get(name);if(custom){custom(c,out,t,arg,{tone,nz,env,noiseSrc,mtof});return}
  switch(name){
    case 'pistol':nz(2400,'lowpass',.18,.9);tone('sine',180,50,.14,.8);break;
    case 'smg':nz(3000,'lowpass',.09,.6);tone('sine',140,60,.07,.5);break;
    case 'shotgun':nz(1500,'lowpass',.45,1);tone('sine',110,35,.3,1);break;
    case 'rifle':nz(2600,'lowpass',.13,.75);tone('square',120,50,.08,.35);break;
    case 'empty':tone('square',900,700,.03,.15);break;
    case 'reload':tone('square',500,300,.04,.12);tone('square',800,600,.04,.12,.25);break;
    // opt.hitVol (0..1, domyślnie .8) skaluje dźwięki trafień; przy .8 głośność jak dawniej.
    case 'hit':{const v=hitGain();if(v>0)tone('triangle',900,600,.05,.22*v);break}
    case 'head':{const v=hitGain();if(v>0){tone('sine',1400,1400,.08,.3*v);tone('sine',2100,2100,.12,.25*v,.05)}break}
    case 'kill':tone('square',300,120,.15,.18);break;
    case 'coin':tone('square',1318,1318,.06,.12);tone('square',1760,1760,.12,.12,.06);break;
    case 'enemyShot':nz(1800,'lowpass',.12,.25*(arg||1));break;
    case 'hurt':tone('sawtooth',220,90,.25,.35);nz(600,'lowpass',.2,.4);break;
    case 'tick':tone('square',arg||1600,0,.015,.08);break;
    case 'win':[0,4,7,12,16].forEach((n,i)=>tone('square',mtof(72+n),0,.12,.14,i*.08));break;
    case 'jackpot':for(let i=0;i<14;i++)tone('square',mtof(72+[0,4,7,12][i%4]+12*Math.floor(i/4)%24),0,.09,.12,i*.06);break;
    case 'lose':tone('triangle',300,150,.3,.15);break;
    case 'buy':tone('square',880,0,.06,.12);tone('square',1320,0,.1,.12,.07);break;
    case 'error':tone('sawtooth',160,0,.18,.2);break;
    case 'reveal':[0,4,7,11,14,19].forEach((n,i)=>tone('sawtooth',mtof(67+n+(arg||0)),0,.14,.12,i*.07));break;
    case 'wave':tone('sawtooth',200,800,.6,.15);nz(4000,'bandpass',.6,.15,.5);break;
    case 'heal':tone('sine',600,1200,.25,.2);break;
    case 'key':tone('triangle',1000,0,.08,.2);tone('triangle',1500,0,.15,.2,.08);break;
  }
}
