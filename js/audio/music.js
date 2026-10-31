// Proceduralne disco polo: instrumenty, utwory i sekwencer.
import {A,mtof,env,noiseSrc} from './context.js';
import {world} from '../world/state.js';

function kick(t){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);env(g,t,.002,1,.32);o.connect(g);g.connect(A.music);o.start(t);o.stop(t+.4)}
function hat(t,open){const c=A.ctx,s=noiseSrc(t,open?.25:.06),f=c.createBiquadFilter(),g=c.createGain();f.type='highpass';f.frequency.value=7500;env(g,t,.001,open?.22:.12,open?.2:.04);s.connect(f);f.connect(g);g.connect(A.music)}
function clap(t){const c=A.ctx,f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.frequency.value=1600;f.Q.value=.8;f.connect(g);g.connect(A.music);
  g.gain.setValueAtTime(0.0001,t);[0,.012,.024].forEach(o=>{g.gain.setValueAtTime(.5,t+o);g.gain.exponentialRampToValueAtTime(.05,t+o+.011)});g.gain.setValueAtTime(.4,t+.036);g.gain.exponentialRampToValueAtTime(.0001,t+.2);noiseSrc(t,.22).connect(f)}
function bass(t,m,dur){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o2.type='square';o.frequency.value=o2.frequency.value=mtof(m);o2.detune.value=-6;
  f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(260,t+dur);f.Q.value=6;env(g,t,.005,.38,dur);o.connect(f);o2.connect(f);f.connect(g);g.connect(A.music);o.start(t);o2.start(t);o.stop(t+dur+.05);o2.stop(t+dur+.05)}
function stab(t,notes,dur){const c=A.ctx,f=c.createBiquadFilter(),g=c.createGain();f.type='lowpass';f.frequency.value=2600;env(g,t,.004,.16,dur);f.connect(g);g.connect(A.music);
  notes.forEach(n=>[-9,9].forEach(dt=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(n);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+dur+.05)}))}
function lead(t,m,dur){const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),lfo=c.createOscillator(),lg=c.createGain(),f=c.createBiquadFilter(),g=c.createGain();
  o.type='square';o2.type='sawtooth';o.frequency.value=o2.frequency.value=mtof(m);o2.detune.value=8;lfo.frequency.value=5.5;lg.gain.value=7;lfo.connect(lg);lg.connect(o.detune);lg.connect(o2.detune);
  f.type='lowpass';f.frequency.value=3400;env(g,t,.01,.13,dur*.9,.04);g.gain.setValueAtTime(.04,t+dur);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.08);
  o.connect(f);o2.connect(f);f.connect(g);g.connect(A.music);g.connect(A.delay);[o,o2,lfo].forEach(x=>{x.start(t);x.stop(t+dur+.1)})}
const _=null;
export const TRACKS={
  A:{bpm:128,roots:[45,41,48,43],ch:[[57,60,64],[57,60,65],[55,60,64],[55,59,62]],mel:[
    [69,_,72,69,76,_,74,72],[72,_,69,_,72,74,72,69],[67,_,72,76,79,_,76,72],[74,_,71,67,71,74,76,_],
    [81,_,79,76,79,_,76,72],[77,_,76,72,69,72,76,_],[76,74,72,74,76,_,79,_],[79,77,76,74,71,_,69,_]]},
  B:{bpm:138,roots:[45,43,41,40],ch:[[57,60,64],[55,59,62],[57,60,65],[56,59,64]],mel:[
    [76,76,_,74,72,_,71,72],[74,74,_,72,71,_,67,71],[72,72,_,71,69,_,72,77],[76,_,74,_,71,_,68,_],
    [81,_,76,_,72,76,81,_],[79,_,74,_,71,74,79,_],[77,76,74,72,74,76,77,_],[76,_,80,_,83,_,80,_]]},
  C:{bpm:150,roots:[50,46,41,48],ch:[[62,65,69],[58,62,65],[60,65,69],[60,64,67]],mel:[
    [74,77,74,_,81,_,79,77],[77,74,70,_,74,_,77,_],[77,_,76,77,81,_,77,_],[79,_,76,_,72,_,76,79],
    [86,_,84,_,81,_,79,77],[82,_,81,_,77,_,74,_],[81,79,77,79,81,_,84,_],[79,_,76,_,72,74,76,_]]},
};
export const seq={step:0,next:0,track:'A',menu:true};
export function schedule(){
  if(!A.ctx)return; const T=TRACKS[seq.track], sd=60/T.bpm/4;
  if(seq.next<A.ctx.currentTime-.2)seq.next=A.ctx.currentTime+.05;
  while(seq.next<A.ctx.currentTime+.14){playStep(T,seq.step,seq.next,sd);seq.next+=sd;seq.step=(seq.step+1)%128}
}
function playStep(T,step,t,sd){
  const bar=Math.floor(step/16)%8, s=step%16, ci=bar%4, root=T.roots[ci];
  if(s%4===0){kick(t);bass(t,root,sd*1.6)}
  if(s%4===2){hat(t,true);stab(t,T.ch[ci],sd*1.4);bass(t,root+12,sd*1.2)}
  if(s===4||s===12)clap(t);
  if(s%2===1)hat(t,false);
  if(seq.menu&&bar<4)return;
  if(s%2===0){const row=T.mel[bar],i=s/2,n=row[i];if(n!=null){let len=1;while(i+len<8&&row[i+len]==null&&len<3)len++;lead(t,n,sd*2*len*.92)}}
  if(step===0&&!seq.menu)riser(t);
}
function riser(t){}
/** Zmienia utwór; menu=true wycisza melodię w pierwszych 4 taktach. */
/** Utwór w grze: opt.track 'L' = wg poziomu (`level.track`, a gdy brak: 'A'); inne wartości = wybór gracza. */
export function gameTrack(o){const t=o&&o.track;if(t!=='L')return t||'A';const L=world.level;return(L&&L.track&&TRACKS[L.track]&&L.track)||'A'}
export function setTrack(k,menu){if(seq.track!==k){seq.track=k;seq.step=0;if(A.ctx)seq.next=A.ctx.currentTime+.05}seq.menu=menu}
