// Obrażenia, zabójstwa, rany gracza, śmierć.
import {rand,clamp,pick} from '../core/util.js';
import {save,opt,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {addFloater,announce} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {spawnPickup} from '../pickups/pickups.js';
import {absorbDamage} from '../pickups/armor.js';
import {comboMult} from './run.js';
import {showOver} from '../ui/screens.js';

export function damageEnemy(e,dmg,head,point){
  const G=S.G;
  e.hp-=dmg;e.flashT=.12;G.hitT=.14;G.hitHead=head;sfx(head?'head':'hit');
  if(+opt.dmgNum)addFloater(String(Math.round(dmg)),{world:point.clone(),size:head?30:22,life:.7,color:head?'#ff3b30':'#f4e7c5',vy:-50,rot:rand(-.2,.2)});
  DS.bus.emit('hit',{enemy:e,dmg,head,point});
  if(e.hp<=0)killEnemy(e,head);
}
export function killEnemy(e,head){
  const G=S.G;
  e.alive=false;e.mats.forEach(m=>m.emissive.setRGB(0,0,0));
  G.kills++;save.kills++;if(head)G.heads++;
  G.combo=G.comboT>0?G.combo+1:1;G.comboT=3.5;
  const base=e.boss?260+G.wave*20:12+G.wave*2;const val=Math.round(base*(head?1.5:1)*comboMult());
  const pos=e.g.position.clone();
  const n=e.boss?10:clamp(Math.round(val/10),2,6);for(let i=0;i<n;i++)spawnPickup('coin',pos,Math.ceil(val/n));
  if(Math.random()<(e.boss?1:.035))spawnPickup('key',pos,e.boss?2:1);
  sfx('kill');
  const words=head?['HEADSHOT!','W GŁOWĘ!','BLAM!']:['KLAP!','PAF!','ŁUP!'];
  addFloater(pick(words),{world:pos.clone().setY(e.boss?3.6:2.4),size:head?46:36,life:.9,color:head?'#d3242a':'#ffe14a',vy:-40,rot:rand(-.25,.25),burst:head});
  const streak={3:'TRZY NA RAZ!',5:'DISCO MASAKRA!',8:'BIESIADA OŁOWIU!',12:'KRÓL REMIZY!',16:'NIEPOWSTRZYMANY!'}[G.combo];
  if(streak)announce(streak,`Mnożnik ×${comboMult().toFixed(1)}`);
  if(e.boss)announce('BARON POKONANY!','+2 klucze leżą na ziemi');
  if(head&&opt.panels&&G.panelCD<=0){G.panelReq=e.g.localToWorld(new THREE.Vector3(0,e.headY||1.94,0));G.panelCD=5}
  G.shake+=.25;
  DS.bus.emit('kill',{enemy:e,head,value:val,combo:G.combo});
}
/** Rana gracza. Pancerz (pickups/armor.js) pochłania część obrażeń; zdarzenie 'damage' niesie obrażenia, które faktycznie trafiły w HP. */
export function hurt(d){const G=S.G;if(G.dead)return;d=absorbDamage(d);G.hp-=d;G.hurtT=.4;G.shake+=.3;sfx('hurt');if(G.hp<=0){G.hp=0;die()}
  DS.bus.emit('damage',{amount:d,hp:G.hp})}
export function die(){const G=S.G;G.dead=true;G.deadT=0;S.mouseDown=false;announce('POLEGŁEŚ','Fala '+G.wave);try{document.exitPointerLock()}catch(e){}
  if(G.wave>save.best)save.best=G.wave;persist();
  setTimeout(showOver,1400)}
