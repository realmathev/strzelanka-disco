// Strzelanie hitscanem, przeładowanie, zmiana broni.
import {rand} from '../core/util.js';
import {save,opt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {camera} from '../render/renderer.js';
import {pruneOutlines} from '../render/materials.js';
import {addTracer,puff} from '../render/fx3d.js';
import {addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {world} from '../world/state.js';
import {P} from '../player/player.js';
import {gunRoot,muzzleLocal,flash,buildGun} from './viewmodel.js';
import {canonWeapon,slotOf,ownedWeapons,slotWeapons} from './slots.js';
import {damageEnemy} from '../game/combat.js';
import {dmgMult} from '../game/run.js';

const rayc=new THREE.Raycaster();
/** Id broni w kolejności slotów (kolejność rejestracji w DS.weapons). */
export function weaponIds(){return DS.weapons.ids()}

export function fire(){
  const G=S.G;const W=DS.weapons.get(G.weapon);
  if(G.reloadT>0||G.fireT>0||G.dead)return;
  if(G.ammo[G.weapon]<=0){sfx('empty');G.fireT=.25;startReload();return}
  G.fireT=W.rate;G.ammo[G.weapon]--;G.shots++;
  const moving=P.vel.length()>2?1.8:1;const air=P.ground?1:2;
  const targets=world.meshes.slice();for(const e of G.enemies)if(e.alive)targets.push(...e.meshes);
  const muzzle=gunRoot.localToWorld(muzzleLocal.clone());
  let hitAny=false;const hits=[],sm=DS.player.spreadMul?DS.player.spreadMul():1;
  for(let i=0;i<W.pellets;i++){
    const s=W.spread*moving*air*sm;rayc.setFromCamera({x:rand(-s,s)*2,y:rand(-s,s)*2},camera);
    const h=rayc.intersectObjects(targets,false)[0];
    const end=h?h.point:rayc.ray.at(120,new THREE.Vector3());
    if(h)hits.push({point:h.point.clone(),normal:h.face?h.face.normal.clone().transformDirection(h.object.matrixWorld):null,object:h.object,enemy:h.object.userData.enemy||null});
    if(i<3)addTracer(muzzle,end,0xffe14a,.05);
    if(h){const e=h.object.userData.enemy;
      if(e&&e.alive){hitAny=true;const head=h.object.userData.part==='head';damageEnemy(e,W.dmg*dmgMult()*(head?2.2:1)*(W.pellets>1?rand(.8,1.1):1),head,h.point)}
      else if(!e)puff(h.point)}
  }
  sfx(W.sfx||G.weapon);
  flash.visible=true;flash.material.rotation=rand(0,6);flash.userData.t=.05;
  G.recoil+=W.kick;DS.player.addRecoil(W.pitchKick,0);
  G.shake+=W.shake;
  if(opt.onoma&&(!W.auto||G.shots%6===0))addFloater(W.snd,{x:innerWidth*.62+rand(-20,30),y:innerHeight*.6+rand(-20,20),size:W.auto?34:44,life:.45,color:'#ffe14a',rot:rand(-.3,.1),burst:W.burst});
  if(G.ammo[G.weapon]===0)setTimeout(()=>{const g=S.G;if(g&&g.ammo[g.weapon]===0)startReload()},250);
  DS.bus.emit('shot',{weapon:G.weapon,def:W,hit:hitAny,muzzle,hits});
}
export function startReload(){const G=S.G,W=DS.weapons.get(G.weapon);if(G.reloadT>0||G.ammo[G.weapon]===W.mag)return;G.reloadT=W.reload;sfx('reload')}
/** Zmienia broń na `w` (musi być posiadana; stare id z zapisów, np. 'smg', są mapowane na aktualne). */
export function switchWeapon(w){const G=S.G;w=canonWeapon(w);if(!DS.weapons.has(w)||!ownedWeapons().includes(w)||G.weapon===w)return;
  (G.slotLast||(G.slotLast={}))[slotOf(G.weapon)]=G.weapon; // pamięć „ostatnia broń w slocie” (klawisz slotu wraca do niej)
  G.weapon=w;G.reloadT=0;G.fireT=.3;buildGun(w);pruneOutlines();sfx('reload')}
/** Klawisze 1-6: wybór slotu. Gdy bieżąca broń jest z tego slotu, przełącza na następną posiadaną z tego slotu;
 *  w przeciwnym razie wraca do ostatnio użytej broni slotu (albo pierwszej posiadanej). Zwraca true, gdy zmieniła broń. */
export function selectSlot(slot){
  const G=S.G,l=slotWeapons(slot);if(!l.length)return false;
  const i=l.indexOf(G.weapon);let w;
  if(i>=0){if(l.length<2)return false;w=l[(i+1)%l.length]}
  else{const last=G.slotLast&&G.slotLast[slot];w=l.includes(last)?last:l[0]}
  switchWeapon(w);return G.weapon===w;
}
/** Koniec przeładowania i ogień ciągły (wołane co klatkę). */
export function updateWeapons(dt){
  const G=S.G,W=DS.weapons.get(G.weapon);
  if(G.reloadT>0){G.reloadT-=dt;if(G.reloadT<=0)G.ammo[G.weapon]=W.mag}
  if(S.mouseDown&&W.auto)fire();
}
