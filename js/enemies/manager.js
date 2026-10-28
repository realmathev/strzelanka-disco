// Menedżer wrogów: spawn wg definicji z DS.enemies, animacja śmierci, sprzątanie.
import {rand,clamp} from '../core/util.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {scene} from '../render/renderer.js';
import {disposeObject} from '../render/materials.js';
import {world} from '../world/state.js';
import {P} from '../player/player.js';
import {diffMul} from '../core/difficulty.js';

/** Tworzy wroga typu `type` i stawia go 22–36 m od środka, ≥16 m od gracza, poza colliderami. */
export function spawnEnemy(type,opts={}){
  const G=S.G,def=DS.enemies.get(type);
  const e=def.create(Object.assign({wave:G.wave},opts));e.def=def;e.type=type;
  e.meshes.forEach(m=>m.userData.enemy=e);
  // Trudność (opt.difficulty): mnożnik HP i obrażeń wroga, liczony raz przy spawnie.
  const dm=diffMul();if(dm.hp!==1){e.hp*=dm.hp;e.maxHp=(e.maxHp||e.hp/dm.hp)*dm.hp}if(dm.dmg!==1&&typeof e.dmg==='number')e.dmg*=dm.dmg;
  const A=world.arena,g=e.g;
  for(let tries=0;tries<30;tries++){const a=rand(0,Math.PI*2),r=rand(22,36);const x=clamp(Math.cos(a)*r,-A+3,A-3),z=clamp(Math.sin(a)*r,-A+3,A-3);
    if(Math.hypot(x-P.pos.x,z-P.pos.z)>16&&!world.colliders.some(c=>x>c.x0-1&&x<c.x1+1&&z>c.z0-1&&z<c.z1+1)){g.position.set(x,0,z);break}}
  scene.add(g);G.enemies.push(e);return e;
}
/** Zgodność z pierwotnym kodem fal: zwykły gangster albo boss. */
export function makeEnemy(boss){return spawnEnemy('gangster',{boss})}

const eye=new THREE.Vector3();
/** Aktualizuje wszystkich wrogów; zwraca liczbę żywych. */
export function updateEnemies(dt){
  const G=S.G;
  eye.set(P.pos.x,P.pos.y+1.6,P.pos.z);
  let alive=0;
  for(const e of G.enemies){
    if(!e.alive){
      if(e.def.dying)e.def.dying(e,dt);
      else{e.dieT+=dt;const k=Math.min(e.dieT/.55,1);e.g.rotation.x=-k*Math.PI/2*(e.boss?.9:1);e.g.position.y=-k*.15}
      if(e.dieT>5){disposeObject(e.g);e.gone=true}continue}
    alive++;
    e.def.update(e,dt,eye);
  }
  G.enemies=G.enemies.filter(e=>!e.gone);
  return alive;
}
