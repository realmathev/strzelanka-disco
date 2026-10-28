// Dźwięki wrogów (syntezowane): rejestrowane w sfxBank, wołane przez sfx('e_...'). Zero plików audio.
import {sfxBank} from '../audio/sfx.js';

const def=(name,fn)=>sfxBank.set(name,fn);
// h = {tone(type,f1,f2,dur,vol,delay), nz(freq,type,dur,vol,q)}
def('e_yell',(c,o,t,a,h)=>{h.tone('sawtooth',260,520,.28,.22);h.tone('square',200,380,.3,.1)});          // dres: szarża
def('e_whoosh',(c,o,t,a,h)=>{h.nz(900,'bandpass',.18,.28,1.2)});                                          // zamach
def('e_blast',(c,o,t,a,h)=>{h.nz(1100,'lowpass',.5,1);h.tone('sine',90,30,.35,1)});                       // obrzyn
def('e_laser',(c,o,t,a,h)=>{h.tone('sine',1800+(a||0)*900,1900+(a||0)*900,.05,.1)});                       // snajper: tik lasera
def('e_snipe',(c,o,t,a,h)=>{h.nz(3000,'lowpass',.25,1);h.tone('sine',70,28,.45,1);h.nz(500,'lowpass',.7,.35)});
def('e_throw',(c,o,t,a,h)=>{h.nz(1200,'bandpass',.12,.2,2);h.tone('triangle',500,300,.1,.1)});
def('e_glass',(c,o,t,a,h)=>{h.nz(5200,'highpass',.2,.45,1.5);h.tone('triangle',2400,1500,.12,.2);h.tone('triangle',3100,1800,.1,.14,.04)});
def('e_fuse',(c,o,t,a,h)=>{h.nz(5000,'highpass',.12,.15);h.tone('square',1400+(a||0)*500,0,.04,.1)});
def('e_boom',(c,o,t,a,h)=>{h.nz(700,'lowpass',.7,1);h.tone('sine',90,24,.6,1.1);h.nz(2500,'lowpass',.2,.5)});
def('e_block',(c,o,t,a,h)=>{h.tone('square',420,210,.07,.22);h.nz(2200,'bandpass',.06,.3,3)});
def('e_heal',(c,o,t,a,h)=>{h.tone('sine',520,780,.18,.16);h.tone('sine',780,1040,.18,.14,.12)});
def('e_rev',(c,o,t,a,h)=>{h.tone('sawtooth',60+(a||0)*90,90+(a||0)*140,.3,.22);h.nz(300,'lowpass',.3,.2)});
def('e_crash',(c,o,t,a,h)=>{h.nz(500,'lowpass',.35,.9);h.tone('square',160,50,.2,.35)});
def('e_bass',(c,o,t,a,h)=>{h.tone('sine',110,38,.5,1);h.nz(200,'lowpass',.4,.5)});                         // DJ: bas
def('e_sting',(c,o,t,a,h)=>{[0,3,7,12].forEach((n,i)=>h.tone('sawtooth',h.mtof(55+n),0,.2,.16,i*.07))});    // boss: faza
def('e_shove',(c,o,t,a,h)=>{h.nz(400,'lowpass',.15,.6);h.tone('sine',120,60,.12,.4)});
