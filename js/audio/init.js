// Tworzy graf audio przy pierwszym geście użytkownika i startuje sekwencer.
import {A,applyVolumes} from './context.js';
import {seq,schedule} from './music.js';

export function audioInit(){
  if(A.ctx){A.ctx.resume();return}
  const C=window.AudioContext||window.webkitAudioContext; if(!C)return;
  A.ctx=new C(); const c=A.ctx;
  A.master=c.createGain(); A.master.connect(c.destination);
  const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; comp.connect(A.master);
  A.music=c.createGain(); A.sfx=c.createGain(); A.music.connect(comp); A.sfx.connect(comp);
  A.delay=c.createDelay(1); A.delay.delayTime.value=.33; A.fb=c.createGain(); A.fb.gain.value=.28;
  A.delay.connect(A.fb); A.fb.connect(A.delay); const dl=c.createGain(); dl.gain.value=.5; A.delay.connect(dl); dl.connect(A.music);
  const len=c.sampleRate; A.noise=c.createBuffer(1,len,c.sampleRate); const d=A.noise.getChannelData(0); for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  applyVolumes(); seq.next=c.currentTime+.1; setInterval(schedule,25);
}
