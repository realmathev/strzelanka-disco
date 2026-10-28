// Kamizelka (pancerz = osobny pasek, pochłania część obrażeń) i regeneracja tarczy po czasie bez ciosów.
// Stan w S.G: armor, armorMax, sinceHit. Zdarzenie 'armor' {armor, max} (HUD rysuje pasek).
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {opt} from '../core/save.js';
import {addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {CFG} from './config.js';
import {modelVest} from './models.js';

/** Upewnia pola pancerza w bieżącym runie (S.G tworzony na nowo przy każdym runie). */
export function ensureArmor(G){
  if(G.armor===undefined){G.armor=0;G.armorMax=CFG.vest.max;G.sinceHit=0}
  return G;
}
export function emitArmor(){
  const G=S.G;if(!G)return;ensureArmor(G);
  DS.bus.emit('armor',{armor:Math.round(G.armor),max:G.armorMax});
}
/** Wołane przed odjęciem HP (combat.hurt): zwraca obrażenia, które faktycznie trafiają w HP. */
export function absorbDamage(d){
  const G=S.G;if(!G||!(d>0))return d;ensureArmor(G);G.sinceHit=0;
  if(G.armor<=0)return d;
  const soak=Math.min(G.armor,d*CFG.vest.absorb);
  G.armor-=soak;emitArmor();
  return d-soak;
}

DS.pickups.register({id:'vest',magnet:3,
  mesh(){return modelVest()},
  collect(p){const G=S.G;ensureArmor(G);
    G.armor=Math.min(G.armorMax,G.armor+p.val);sfx('vest');
    addFloater('KAMIZELKA!',{x:200,y:innerHeight-160,size:28,life:.9,color:'#7fb2ff',vy:-30,burst:true});
    emitArmor()}});

DS.bus.on('update',dt=>{
  const G=S.G;if(!G||G.dead)return;ensureArmor(G);
  G.sinceHit+=dt;
  if(G.armor>0&&G.armor<G.armorMax&&G.sinceHit>=CFG.shield.delay){
    const before=Math.floor(G.armor);
    const r=CFG.shield.regen[opt.difficulty]??CFG.shield.regen.normal;
    G.armor=Math.min(G.armorMax,G.armor+r*dt);
    if(Math.floor(G.armor)!==before)emitArmor();
  }
});
DS.bus.on('levelStart',()=>{const G=S.G;if(G){ensureArmor(G);emitArmor()}});
