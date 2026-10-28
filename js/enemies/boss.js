// Szkielet bossów: pasek życia nad głową (2 siatki, współdzielone geometrie), fazy wg % HP z krótką nietykalnością i napisem,
// zdarzenia `bossHp` / `bossPhase` na szynie, silnik akcji (każda akcja: start/run/cool), idle z utrzymywaniem dystansu.
import {rand,clamp} from '../core/util.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {camera} from '../render/renderer.js';
import {announce,addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {moveToward,moveDir,stopMove,animateHuman} from './ai.js';
import {spawnEnemy} from './manager.js';

const sh=o=>(o.userData.shared=true,o);
const BAR_GEO=sh(new THREE.PlaneGeometry(1,1).translate(.5,0,0)),
  BAR_BACK=sh(new THREE.MeshBasicMaterial({color:0x15110e,side:THREE.DoubleSide,depthWrite:false})),
  BAR_FILL=sh(new THREE.MeshBasicMaterial({color:0xd3242a,side:THREE.DoubleSide,depthWrite:false})),
  BAR_GOLD=sh(new THREE.MeshBasicMaterial({color:0xffd34a,side:THREE.DoubleSide,depthWrite:false}));
const Q=new THREE.Quaternion();

/** Pasek HP bossa jako dziecko `e.g` (disposeObject sprząta go razem z bossem). */
export function addBossBar(e,y=2.5,w=1.8){
  const bar=new THREE.Group();bar.position.set(0,y,0);
  const back=new THREE.Mesh(BAR_GEO,BAR_BACK);back.scale.set(w+.1,.2,1);back.position.set(-w/2-.05,0,-.001);
  const fill=new THREE.Mesh(BAR_GEO,BAR_FILL);fill.scale.set(w,.14,1);fill.position.set(-w/2,0,0);
  for(const m of [back,fill]){m.raycast=()=>{};m.renderOrder=20}
  bar.add(back,fill);e.g.add(bar);e.bar={grp:bar,fill,w};
}
function updateBar(e){
  if(!e.bar)return;
  const f=clamp(e.hp/e.maxHp,0,1);e.bar.fill.scale.x=Math.max(.001,e.bar.w*f);
  e.bar.fill.material=e.invulT>0?BAR_GOLD:BAR_FILL;
  Q.copy(e.g.quaternion).invert().multiply(camera.quaternion);e.bar.grp.quaternion.copy(Q);
  e.bar.grp.scale.setScalar(1/(e.g.scale.y||1));
}
export function animateBoss(e,dt){
  animateHuman(e,dt);updateBar(e);
  if(e.invulT>0){e.invulT-=dt;e.glow=Math.max(e.glow,.18+.1*Math.sin(e.ai.age*30))}
}

/** Przejście do fazy n: nietykalność 1,4 s, napis, dźwięk, zdarzenie, efekt fazy (adds). */
export function enterPhase(e,n,{title,sub,onEnter}){
  e.phase=n;e.invulT=1.4;e.ai.sub=0;e.ai.cd=1.3;e.armT=0;e.lean=0;
  announce(title,sub);sfx('e_sting');
  DS.bus.emit('bossPhase',{enemy:e,phase:n,name:e.name});
  if(onEnter)onEnter(e);
}
/** Ranienie podczas nietykalności / luk w obronie jest w cfg.onHit bossa; ta funkcja zwraca zwrot obrażeń. */
export function bossOnHit(e,ev){
  if(e.invulT>0){e.hp+=ev.dmg;e.flashT=0;return}
  if(e.vuln)e.hp-=ev.dmg*.35;
}
/** Wołane w decide(): sprawdza progi faz (phases: [{at:.66,title,sub,onEnter}, ...]) i emituje bossHp. Zwraca true, gdy akcja trwa. */
export function bossThink(e,phases){
  const f=e.hp/e.maxHp;
  for(let i=0;i<phases.length;i++)if(e.phase===i+1&&f<phases[i].at){enterPhase(e,i+2,phases[i]);break}
  DS.bus.emit('bossHp',{enemy:e,hp:e.hp,max:e.maxHp,name:e.name,phase:e.phase});
  return e.ai.state==='attack'&&e.ai.sub===1;
}
/** Idle między akcjami: utrzymuje dystans [dmin,dmax] i krąży. */
export function idleMove(e,dt,ctx,dmin,dmax,spMul=1){
  const a=e.ai;a.sideT=(a.sideT||0)-dt;if(a.sideT<=0){a.sideT=rand(1,2.2);a.sideDir=Math.random()<.5?-1:1}
  if(ctx.dist>dmax){moveToward(e,dt,P.pos.x,P.pos.z,e.cfg.speed*spMul,dmax*.85);return}
  const rad=ctx.dist<dmin?-.8:0,vx=-ctx.nz*a.sideDir*.6+ctx.nx*rad,vz=ctx.nx*a.sideDir*.6+ctx.nz*rad,l=Math.hypot(vx,vz);
  if(l>.05)moveDir(e,dt,vx/l,vz/l,e.cfg.speed*.7*spMul);else stopMove(e,dt);
}
/**
 * Silnik akcji. actions: {nazwa:{start?(e,ctx), run(e,dt,ctx)->true gdy skończona, cool(e)->s przerwy}}. pick(e)->nazwa.
 * Użycie w cfg.attack: bossAttack(e,dt,ctx,actions,pick,{dmin,dmax}).
 */
export function bossAttack(e,dt,ctx,actions,pick,keep){
  const a=e.ai;a.face=1;a.cd-=dt;
  if(a.sub===0){
    idleMove(e,dt,ctx,keep.dmin,keep.dmax,e.phase>=3?1.3:1);
    if(e.forceAct&&actions[e.forceAct]){a.cd=0;a.act=e.forceAct;e.forceAct=null;a.sub=1;a.st=0;a.n=0;const F=actions[a.act];if(F.start)F.start(e,ctx);return}
    if(a.cd<=0&&(ctx.sees||a.lt<1.5)){a.act=pick(e);a.sub=1;a.st=0;a.n=0;const A=actions[a.act];if(A.start)A.start(e,ctx)}
  }else{
    const A=actions[a.act];a.st+=dt;
    if(A.run(e,dt,ctx)){a.sub=0;a.cd=A.cool(e);e.armT=0;e.lean=0;e.glow=0;if(A.end)A.end(e)}
  }
}
/** Dowołuje wroga `type` w pobliżu bossa (kółko 4–7 m wokół niego), z wiedzą o graczu. */
export function summon(e,type,n=1){
  for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),r=rand(4,7);if(S.G)spawnEnemy(type,{at:{x:e.g.position.x+Math.cos(a)*r,z:e.g.position.z+Math.sin(a)*r},aware:true})}
}
