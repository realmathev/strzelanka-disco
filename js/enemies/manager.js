// Menedżer wrogów: spawn wg definicji z DS.enemies (poza polem widzenia gracza), tabela spawnu, aktualizacja, śmierć, dropy, sprzątanie.
import {rand,clamp} from '../core/util.js';
import {opt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {scene} from '../render/renderer.js';
import {disposeObject} from '../render/materials.js';
import {world} from '../world/state.js';
import {P} from '../player/player.js';
import {diffMul} from '../core/difficulty.js';
import {CFG as PCFG} from '../pickups/config.js';
import {spawnPickup} from '../pickups/pickups.js';
import * as nav from './nav.js';
import {beginFrame} from './ai.js';
import {pruneModels} from './kit.js';
import {updateProj,clearProj} from './proj.js';
import './table.js';

/** Pole widzenia gracza: połowa poziomego kąta kamery + zapas. */
function viewHalfAngle(){
  const aspect=(innerWidth||1280)/Math.max(1,innerHeight||720),v=(+opt.fov||75)*Math.PI/180;
  return Math.atan(Math.tan(v/2)*aspect)+.25;
}
/** Strefy spawnu poziomu dostępne w fali `wave` (bez stref bossa; `from` = pierwsza fala). Pusta tablica = użyj pierścienia. */
function zonesFor(wave){
  const z=world.level&&world.level.spawnZones;if(!Array.isArray(z)||!z.length)return null;
  let l=z.filter(q=>!q.boss&&(q.from||1)<=wave);if(!l.length)l=z.filter(q=>!q.boss);
  return l.length?l:null;
}
/** Losuje strefę z wagą `w` (domyślnie 1). */
function pickZone(l){let t=0;for(const q of l)t+=q.w>0?q.w:1;let r=Math.random()*t;for(const q of l){r-=q.w>0?q.w:1;if(r<0)return q}return l[l.length-1]}
/** Punkt startowy bossa: środek `level.waves.bossArena` (z rozrzutem w obrębie połowy wymiarów) albo strefa z `boss:true`. */
function bossPoint(){
  const L=world.level,ba=L&&L.waves&&L.waves.bossArena;
  if(ba&&isFinite(ba.x)&&isFinite(ba.z))return {x:ba.x+rand(-.35,.35)*(ba.hw||0),z:ba.z+rand(-.35,.35)*(ba.hd||0)};
  const bz=L&&Array.isArray(L.spawnZones)&&L.spawnZones.find(q=>q.boss);
  if(bz){const a=rand(0,Math.PI*2),r=Math.sqrt(Math.random())*(bz.r||0)*.5;return {x:bz.x+Math.cos(a)*r,z:bz.z+Math.sin(a)*r}}
  return null;
}
/** Stawia wroga: `opts.at`; boss w arenie bossa poziomu; inaczej w strefie `level.spawnZones` (waga, fala) albo — bez stref — w pierścieniu
 *  22–36 m od środka areny. Zawsze ≥16 m od gracza, na wolnej komórce i POZA polem widzenia gracza (jeśli się da). */
function placeEnemy(e,opts){
  const g=e.g,cls=(e.cfg&&e.cfg.cls)||0,A=world.arena;
  if(opts.at){const f=nav.nearestFree(opts.at.x,opts.at.z,cls,4);g.position.set(f?f.x:opts.at.x,0,f?f.z:opts.at.z);return}
  if(opts.boss){const p=bossPoint();if(p){const f=nav.nearestFree(p.x,p.z,cls,6);g.position.set(f?f.x:p.x,0,f?f.z:p.z);return}}
  const zones=zonesFor(opts.wave!==undefined?opts.wave:(S.G?S.G.wave:1));
  const lx=-Math.sin(P.yaw),lz=-Math.cos(P.yaw),half=viewHalfAngle();
  let best=null,bestAng=-1;
  for(let tries=0;tries<90;tries++){
    let x,z;
    if(zones){const q=pickZone(zones),a=rand(0,Math.PI*2),r=Math.sqrt(Math.random())*(q.r||8);x=clamp(q.x+Math.cos(a)*r,-A+3,A-3);z=clamp(q.z+Math.sin(a)*r,-A+3,A-3)}
    else{const a=rand(0,Math.PI*2),r=rand(22,36);x=clamp(Math.cos(a)*r,-A+3,A-3);z=clamp(Math.sin(a)*r,-A+3,A-3)}
    const dx=x-P.pos.x,dz=z-P.pos.z,d=Math.hypot(dx,dz);
    if(d<(tries<60?16:12)||!nav.isFree(x,z,cls))continue;
    const ang=Math.acos(clamp((dx*lx+dz*lz)/d,-1,1));
    const seen=ang<half&&nav.gridLos(P.pos.x,P.pos.z,x,z);
    if(!seen){g.position.set(x,0,z);return}
    if(ang>bestAng){bestAng=ang;best={x,z}}
  }
  if(best)g.position.set(best.x,0,best.z);                        // wszystko widoczne: weź punkt najbardziej z boku
  else if(zones){const q=pickZone(zones);const f=nav.nearestFree(q.x,q.z,cls,8);g.position.set(f?f.x:q.x,0,f?f.z:q.z)}   // nic nie przeszło: środek strefy
}

/** Tworzy wroga typu `type`. opts: {boss, wave, at:{x,z}, aware:false (patrol zamiast pościgu)}. Mnożniki trudności liczone raz tutaj. */
export function spawnEnemy(type,opts={}){
  const G=S.G,def=DS.enemies.get(type);
  const e=def.create(Object.assign({wave:G.wave},opts));e.def=def;e.type=type;
  if(e.xp===undefined&&def.xp!==undefined)e.xp=def.xp;
  e.meshes.forEach(m=>m.userData.enemy=e);
  // Trudność (opt.difficulty): mnożnik HP i obrażeń wroga, liczony raz przy spawnie.
  const dm=diffMul();if(dm.hp!==1){e.hp*=dm.hp;e.maxHp=(e.maxHp||e.hp/dm.hp)*dm.hp}if(dm.dmg!==1&&typeof e.dmg==='number')e.dmg*=dm.dmg;
  placeEnemy(e,opts);
  if(e.ai&&!e.ai.home)e.ai.home={x:e.g.position.x,z:e.g.position.z};
  scene.add(e.g);G.enemies.push(e);
  if(e.def.onSpawn)e.def.onSpawn(e);
  if(e.boss)DS.bus.emit('bossHp',{enemy:e,hp:e.hp,max:e.maxHp||e.hp,name:e.name,phase:e.phase||1});   // pasek HP od razu, bez czekania na pierwszą akcję bossa
  return e;
}

const aliveOfType=(G,t)=>{let n=0;for(const e of G.enemies)if(e.alive&&e.type===t)n++;return n};
/** Losuje typ z tabeli spawnu (wagi, limity per typ, wymóg sojuszników dla medyka). */
export function pickType(G,tb){
  let alive=0;for(const e of G.enemies)if(e.alive)alive++;
  let tot=0;const ok=[];
  for(const id in tb.weights){
    if(aliveOfType(G,id)>=(tb.caps[id]||99))continue;
    if(tb.needsAllies[id]&&alive<tb.needsAllies[id])continue;
    ok.push(id);tot+=tb.weights[id];
  }
  if(!ok.length)return 'gangster';
  let r=Math.random()*tot;for(const id of ok){r-=tb.weights[id];if(r<0)return id}
  return ok[ok.length-1];
}
/** Wołane przez game/waves.js: zwykły wróg wg tabeli spawnu poziomu albo boss poziomu (boss:true). */
export function makeEnemy(boss){
  const G=S.G,tb=DS.enemies.table(world.level&&world.level.id,G.wave);
  if(boss){const b=tb.boss.pick(G.wave);return spawnEnemy(b.type,Object.assign({boss:true},b.opts))}
  return spawnEnemy(pickType(G,tb),{boss:false});
}

const eye=new THREE.Vector3();
let pruneT=0;
/** Aktualizuje wszystkich wrogów; zwraca liczbę żywych. */
export function updateEnemies(dt){
  const G=S.G;
  eye.set(P.pos.x,P.pos.y+1.6,P.pos.z);
  beginFrame();
  let alive=0;
  for(const e of G.enemies){
    if(!e.alive){
      if(e.def.dying)e.def.dying(e,dt);
      else{e.dieT+=dt;const k=Math.min(e.dieT/.55,1);e.g.rotation.x=-k*Math.PI/2*(e.boss?.9:1);e.g.position.y=-k*.15}
      if(e.dieT>5){disposeObject(e.g);e.gone=true}continue}
    alive++;
    e.def.update(e,dt,eye);
    if(e.boss&&e.alive){e._bhT=(e._bhT||0)-dt;if(e._bhT<=0){e._bhT=.4;DS.bus.emit('bossHp',{enemy:e,hp:e.hp,max:e.maxHp||e.hp,name:e.name,phase:e.phase||1})}}   // podtrzymanie paska, gdy typ bossa nie emituje sam
  }
  G.enemies=G.enemies.filter(e=>!e.gone);
  updateProj(dt);
  pruneT+=dt;if(pruneT>4){pruneT=0;const used=new Set();for(const e of G.enemies)if(e.model)used.add(e.model);pruneModels(used)}   // zwalnia geometrie nieużywanych wariantów
  return alive;
}

/* ---------- zabójstwo: dropy typu i hook onKill ---------- */
const DROP_VAL=()=>({med:30,bandage:PCFG.bandage.total,adrenaline:PCFG.adrenaline.heal,vest:PCFG.vest.add,
  zapiekanka:PCFG.food.zapiekanka.heal,kebab:PCFG.food.kebab.heal,zubr:PCFG.food.zubr.heal});
DS.bus.on('kill',({enemy:e})=>{
  const d=e&&e.def;if(!d)return;
  if(d.onKill)d.onKill(e);
  const drops=e.drops||d.drops;if(!drops||!S.G)return;
  const val=DROP_VAL();
  for(const dr of drops)if(Math.random()<dr.p&&DS.pickups.has(dr.kind))spawnPickup(dr.kind,e.g.position.clone(),dr.val||val[dr.kind]||10);
});
DS.bus.on('levelLoad',()=>nav.resetNav());
DS.bus.on('levelUnload',()=>nav.resetNav());
// koniec biegu: zwolnij też zbuforowane modele wariantów (geometrie wracają do stanu sprzed biegu; kolejny bieg zbuduje je od nowa)
DS.bus.on('levelEnd',()=>{clearProj();pruneModels(new Set(),0)});
