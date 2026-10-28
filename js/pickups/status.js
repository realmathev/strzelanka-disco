// Stany leczenia w runie: bandaż (leczenie w czasie) i adrenalina (timer). Stan trzymany w S.G,
// więc nowy run zaczyna czysty. Obsługa przez szynę: 'update' (dt) i 'damage'.
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {addFloater} from '../render/comicfx.js';
import {CFG} from './config.js';

const HP_POS=()=>({x:200,y:innerHeight-120});

/** Dodaje HP (nie powyżej maxHp), zwraca faktycznie dodane. Zdarzenie 'heal' emituje wołający. */
export function healPlayer(n){
  const G=S.G;if(!G||G.dead||!(n>0))return 0;
  const before=G.hp;G.hp=Math.min(G.maxHp,G.hp+n);return G.hp-before;
}
/** Pływający napis z HP przy pasku zdrowia. */
export function healFloater(got){
  if(got>0)addFloater('+'+Math.round(got)+' HP',Object.assign(HP_POS(),{size:26,life:.8,color:'#7dff9a',vy:-40}));
}
/** Bandaż: dokłada `total` HP do rozłożenia w czasie (CFG.bandage.dur). */
export function startBandage(total){
  const G=S.G;if(!G)return;
  const b=G.bandage||(G.bandage={left:0,acc:0});b.left+=total;
}
/** Adrenalina: timer, czyta go player/gunfeel (speed x sprintMul, recoil x recoilMul). */
export function startAdrenaline(){const G=S.G;if(G)G.adrenT=CFG.adrenaline.time}

DS.bus.on('update',dt=>{
  const G=S.G;if(!G||G.dead)return;
  if(G.adrenT>0)G.adrenT=Math.max(0,G.adrenT-dt);
  const b=G.bandage;
  if(b&&b.left>0){
    const step=Math.min(b.left,CFG.bandage.total/CFG.bandage.dur*dt);
    b.left=Math.max(0,b.left-step);b.acc+=healPlayer(step);
    // 'heal' emituje się co ~1 HP albo na końcu, nie co klatkę.
    if(b.acc>0&&(b.acc>=1||b.left<=0)){DS.bus.emit('heal',{amount:b.acc,source:'pickup'});b.acc=0}
  }
});
DS.bus.on('damage',()=>{
  const G=S.G;if(!G)return;G.sinceHit=0;
  const b=G.bandage;
  if(CFG.bandage.breakOnHit&&b&&b.left>0){
    b.left=0;if(b.acc>0)DS.bus.emit('heal',{amount:b.acc,source:'pickup'});b.acc=0;
    addFloater('PRZERWANE!',Object.assign(HP_POS(),{size:28,life:.9,color:'#ff3b30',vy:-30,burst:true}));
  }
});
