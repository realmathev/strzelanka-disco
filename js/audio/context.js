// Wspólny kontekst WebAudio i pomocnicze obwiednie. A.ctx powstaje dopiero po geście (audio/init.js).
import {opt} from '../core/save.js';

/** A: {ctx, master, music, sfx, delay, fb, noise} */
export const A={ctx:null};
export const mtof=m=>440*Math.pow(2,(m-69)/12);
export function applyVolumes(){if(!A.ctx)return; A.music.gain.value=opt.music*.55; A.sfx.gain.value=opt.sfx*.9}
export function env(g,t,a,peak,dec,sus=0.0001){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(Math.max(sus,0.0001),t+a+dec)}
export function noiseSrc(t,dur){const s=A.ctx.createBufferSource();s.buffer=A.noise;s.start(t,Math.random()*.5);s.stop(t+dur);return s}
