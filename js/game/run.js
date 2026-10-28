// Stan runu (S.G): tworzenie i sprzątanie.
import {save} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {scene} from '../render/renderer.js';
import {pruneOutlines,disposeObject} from '../render/materials.js';
import {world} from '../world/state.js';
import {resetPlayer} from '../player/player.js';
import {buildGun,applySkin} from '../weapons/viewmodel.js';
import {weaponIds} from '../weapons/fire.js';

/** Sprząta run. Emituje 'levelEnd' raz na run (reason: 'death' jeśli gracz leży, inaczej 'quit'). */
export function clearRun(){const G=S.G;if(!G)return;
  if(!G.ended){G.ended=true;DS.bus.emit('levelEnd',{level:world.level&&world.level.id,reason:G.dead?'death':'quit',wave:G.wave,kills:G.kills,earned:G.earned})}
  G.enemies.forEach(e=>disposeObject(e.g));G.pickups.forEach(p=>disposeObject(p.m));G.fx3d.forEach(f=>{scene.remove(f.o);f.o.material.dispose();if(f.o.geometry&&!f.grow)f.o.geometry.dispose()});G.enemies=[];G.pickups=[];G.fx3d=[];pruneOutlines()}
export function newRun(){
  clearRun();
  const maxHp=100+save.hpLvl*25;
  const G=S.G={wave:0,enemies:[],queue:0,spawnT:0,hp:maxHp,maxHp,weapon:'pistol',ammo:{},reloadT:0,fireT:0,kills:0,heads:0,combo:0,comboT:0,earned:0,
     between:1.2,shake:0,hurtT:0,hitT:0,recoil:0,pickups:[],fx3d:[],floaters:[],announce:null,dead:false,revived:false,panelCD:0,panelReq:null,time:0,shots:0,keysFound:0,boss:false};
  weaponIds().forEach(w=>G.ammo[w]=DS.weapons.get(w).mag);
  resetPlayer();
  buildGun('pistol');applySkin();
}
export function dmgMult(){return 1+save.dmgLvl*.1}
export function comboMult(){return 1+Math.min(S.G.combo,12)*.2}
