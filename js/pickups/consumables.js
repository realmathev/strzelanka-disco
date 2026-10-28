// Leczenie z mapy: bandaż, adrenalina, jedzenie (zapiekanka, kebab, Żubr z kaucją). Właściciel: ds-healing.
// Każdy typ: DS.pickups.register (model, magnet, collect). Dropy i wagi: drops.js; liczby: config.js.
import {save,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {addFloater} from '../render/comicfx.js';
import {sfx,sfxBank} from '../audio/sfx.js';
import {CFG} from './config.js';
import {healPlayer,healFloater,startBandage,startAdrenaline} from './status.js';
import {modelBandage,modelAdrenaline,modelZapiekanka,modelKebab,modelZubr} from './models.js';

// Dźwięki syntezowane (rejestr audio/sfx.js). Nazwy unikalne, żeby nie kolidowały z bronią.
sfxBank.set('chomp',(c,out,t,arg,h)=>{h.nz(1400,'bandpass',.07,.6);h.tone('square',240,90,.08,.22,.08)});
sfxBank.set('burp',(c,out,t,arg,h)=>{h.tone('sawtooth',120,70,.45,.28);h.tone('sine',80,50,.5,.18,.05)});
sfxBank.set('inject',(c,out,t,arg,h)=>{h.tone('sawtooth',1800,400,.12,.2);h.tone('sine',880,880,.08,.15,.12)});
sfxBank.set('bandage',(c,out,t,arg,h)=>{h.nz(3000,'highpass',.2,.2);h.tone('triangle',600,600,.06,.12,.15)});
sfxBank.set('vest',(c,out,t,arg,h)=>{h.nz(500,'lowpass',.25,.4);h.tone('square',140,140,.1,.2,.1)});
sfxBank.set('machine',(c,out,t,arg,h)=>{h.tone('square',440,660,.12,.15);h.tone('square',660,990,.12,.15,.13)});

const big=(text,color,extra)=>addFloater(text,Object.assign({x:200,y:innerHeight-160,size:30,life:.9,color,vy:-30,burst:true},extra));
const healFx=n=>{const got=healPlayer(n);if(got>0)DS.bus.emit('heal',{amount:got,source:'pickup'});healFloater(got);return got};

DS.pickups.register({id:'bandage',magnet:3,
  mesh(){return modelBandage()},
  spin(m,dt){m.rotation.y+=dt},
  collect(p){startBandage(p.val);sfx('bandage');big('ZAWIĄZANE!','#f4efe4')}});

DS.pickups.register({id:'adrenaline',magnet:3,
  mesh(){return modelAdrenaline()},
  collect(p){healFx(p.val);startAdrenaline();sfx('inject');big('ADRENALINA!','#43c7ff')}});

DS.pickups.register({id:'zapiekanka',magnet:3,
  mesh(){return modelZapiekanka()},
  collect(p){healFx(p.val);sfx('chomp');big('MLASK!','#ffd84a')}});

DS.pickups.register({id:'kebab',magnet:3,
  mesh(){return modelKebab()},
  collect(p){healFx(p.val);sfx('chomp');big('CHRUP!','#6dbb4a')}});

// Żubr: leczy słabo, a butelka zwraca kaucję (ZD trafiają od razu do portfela i do runu).
DS.pickups.register({id:'zubr',magnet:3,
  mesh(){return modelZubr()},
  collect(p){const G=S.G;healFx(p.val);
    const dep=CFG.food.zubr.deposit;save.coins+=dep;G.earned+=dep;persist();
    sfx('burp');big('BEKNĘŁO!','#ffcc33',{y:innerHeight-200});
    addFloater('kaucja +'+dep,{x:innerWidth-110,y:120,size:22,life:.8,color:'#ffcc33',vy:-40})}});
