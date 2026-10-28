// Automaty na mapie: automat apteczny (cooldown) i stacja leczenia (jednorazowa w runie). Płatne w ZD, użycie: E.
// Poziom stawia je w build(world): placeHealMachine({kind:'vending'|'station', x, z, rotY}); clearHealMachines() sprząta.
import {save,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {P} from '../player/player.js';
import {scene} from '../render/renderer.js';
import {hull,disposeObject} from '../render/materials.js';
import {addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {world} from '../world/state.js';
import {CFG} from './config.js';
import {healPlayer,healFloater} from './status.js';
import {ensureArmor,emitArmor} from './armor.js';
import {buildMachine} from './models.js';

// Akcja 'use' (E, rebindowalna) jest zarejestrowana w input/actions.js; tu tylko ją czytamy przez DS.input.

const machines=[];

const near=()=>{let best=null,bd=CFG.useRange;
  for(const m of machines){const d=Math.hypot(P.pos.x-m.x,P.pos.z-m.z);if(d<bd){bd=d;best=m}}
  return best};
const at=m=>new THREE.Vector3(m.x,1.9,m.z);
function label(m){
  if(m.used)return 'PUSTO';
  if(m.cd>0)return 'ZA '+Math.ceil(m.cd)+' s';
  return CFG.machines[m.kind].price+' ZD  ['+DS.input.keyFor('use')+']';
}

/** Stawia automat/stację: model, kolizja (AABB z rotacją 0/90 st.), wpis do listy. */
export function placeHealMachine({kind='vending',x,z,rotY=0}){
  const g=buildMachine(kind);g.position.set(x,0,z);g.rotation.y=rotY;scene.add(g);
  hull(g.children[0],.04);
  const hw=kind==='vending'?.46:.36,hd=.33;
  const c=Math.abs(Math.cos(rotY)),s=Math.abs(Math.sin(rotY));
  const ex=c*hw+s*hd,ez=s*hw+c*hd;
  const collider={x0:x-ex,x1:x+ex,z0:z-ez,z1:z+ez,h:kind==='vending'?1.9:1.6};
  world.colliders.push(collider);
  const m={kind,g,x,z,collider,used:false,cd:0,promptT:0};
  machines.push(m);return m;
}
/** Usuwa wszystkie automaty ze sceny i kolizji. */
export function clearHealMachines(){
  for(const m of machines){disposeObject(m.g);const i=world.colliders.indexOf(m.collider);if(i>=0)world.colliders.splice(i,1)}
  machines.length=0;
}

function useMachine(m){
  const G=S.G,cfg=CFG.machines[m.kind];
  if(m.used||m.cd>0){sfx('error');return}
  ensureArmor(G);
  const needs=G.hp<G.maxHp||(cfg.armor&&G.armor<G.armorMax);
  if(!needs){sfx('error');addFloater('NIE TRZEBA',{world:at(m),size:22,life:.9,color:'#f4e7c5',vy:-20});return}
  if(save.coins<cfg.price){sfx('error');addFloater('BRAK ZD',{world:at(m),size:22,life:.9,color:'#ff3b30',vy:-20});return}
  save.coins-=cfg.price;persist();
  const got=healPlayer(cfg.heal);
  if(got>0)DS.bus.emit('heal',{amount:got,source:'pickup'});
  healFloater(got);
  if(cfg.armor){G.armor=G.armorMax;emitArmor()}
  if(m.kind==='vending')m.cd=cfg.cooldown;else m.used=true;
  sfx('machine');
  addFloater(m.kind==='vending'?'APTECZKA!':'STACJA!',{world:at(m),size:30,life:1,color:'#7dff9a',vy:-30,burst:true});
}

DS.bus.on('update',dt=>{
  const G=S.G;if(!G||G.dead)return;
  for(const m of machines){if(m.cd>0)m.cd=Math.max(0,m.cd-dt);if(m.promptT>0)m.promptT-=dt}
  const m=near();
  if(m&&m.promptT<=0){m.promptT=1.2;addFloater(label(m),{world:at(m),size:20,life:1.1,color:'#ffe14a',vy:-18})}
});
// Zmiana/przeładowanie poziomu: automaty znikają razem z mapą (poziom stawia je w build()).
DS.bus.on('levelUnload',clearHealMachines);
DS.bus.on('levelStart',()=>{for(const m of machines){m.used=false;m.cd=0;m.promptT=0}});

window.addEventListener('keydown',e=>{
  if(e.repeat||!DS.input.matches('use',e.code))return;
  const G=S.G;if(S.mode!=='game'||!G||G.paused||G.dead)return;
  const m=near();if(m)useMachine(m);
});
