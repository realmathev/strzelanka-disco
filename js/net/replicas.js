// Klient co-op: repliki wrogów ze snapshotów hosta. Te same fabryki modeli (def.create) bez AI, interpolacja ~100 ms,
// animacja chodu (ai.animateReplica) i śmierci (def.dying). Zdarzenia hosta (fala, czysta fala, zabójstwo) z pola `ev`.
import {DS} from '../core/ds.js';
import {S} from '../core/state.js';
import {scene} from '../render/renderer.js';
import {disposeObject} from '../render/materials.js';
import {P} from '../player/player.js';
import {animateReplica} from '../enemies/ai.js';
import {N,rec,handle,isHost} from './session.js';
import {SampleBuf,DELAY} from './interp.js';
import {validEnemy,validEv,unpackAnim,STATES,isNum} from './proto.js';

const reps=new Map();            // eid -> wróg-replika (ten sam obiekt jest w S.G.enemies, więc strzały fire.js trafiają w repliki)
const bad=new Set();             // eid, których nie udało się zbudować (nie próbujemy co snapshot)
const tmp=new Float32Array(3),AN={crouch:0,lean:0,arm:0};
let hooks={onKill:null,onWave:null,onClear:null,onHurt:null};
export function setReplicaHooks(h){hooks=Object.assign(hooks,h)}
export const replicaCount=()=>reps.size;
export const getReplica=eid=>reps.get(eid)||null;

function create(eid,ti,va,x,z,ry){
  const G=S.G,id=DS.enemies.ids()[ti],def=id&&DS.enemies.get(id);
  if(!def||bad.has(eid))return null;
  let e;
  try{e=def.create({wave:G.wave,variant:va>=0?va:undefined,aware:false,boss:false})}catch(err){bad.add(eid);console.warn('replika',id,err);return null}
  e.def=def;e.type=id;e.replica=true;e.eid=eid;e.variant=va;
  if(!e.ai)e.ai={sp:0,age:0,state:'other'};          // typ bez rdzenia AI (pierwotny Bandyta 'gangster'): minimalny stan do animacji
  if(e.xp===undefined&&def.xp!==undefined)e.xp=def.xp;
  e.meshes.forEach(m=>m.userData.enemy=e);
  e.g.position.set(x,0,z);e.g.rotation.y=ry;
  e.rbuf=new SampleBuf(3,[2]);e.rlx=x;e.rlz=z;
  scene.add(e.g);G.enemies.push(e);reps.set(eid,e);
  return e;
}
function removeRep(e){
  reps.delete(e.eid);disposeObject(e.g);e.gone=true;
  const G=S.G;if(G){const i=G.enemies.indexOf(e);if(i>=0)G.enemies.splice(i,1)}
}

/** Snapshot od hosta (~15 Hz). */
handle('snap',(d,from)=>{
  if(!N.room||from!==N.room.host||isHost()||!N.inRun)return;
  const G=S.G;if(!G||S.mode!=='game')return;
  // zdarzenia najpierw (zabójstwo przed zniknięciem wroga ze snapshotu)
  if(d.ev)for(const v of d.ev)if(validEv(v))applyEv(v);
  if(d.hu)for(const h of d.hu){if(Array.isArray(h)&&h[0]===N.me&&isNum(h[1],0,1000)&&isNum(h[2],-40,40)&&isNum(h[3],-40,40))hooks.onHurt&&hooks.onHurt(h[1],h[2],h[3])}
  G.queue=d.q;if(d.w>G.wave)G.wave=d.w;
  N.stats.snaps++;
  const seen=new Set();
  for(const a of d.e){
    if(!validEnemy(a))continue;
    const [eid,ti,va,x,z,ry,hp,st]=a;seen.add(eid);
    let e=reps.get(eid);
    if(!e){e=create(eid,ti,va,x,z,ry);if(!e)continue}
    if(!e.alive)continue;
    e.rbuf.push(d.t,[x,z,ry]);
    e.hp=e.maxHp*hp/100;e.ai.state=STATES[st];
    unpackAnim(a[8],AN);e.crouch=AN.crouch;e.lean=AN.lean;e.armT=AN.arm;
  }
  // żywa replika, której nie ma w snapshocie: host ją usunął bez zabójstwa (np. wybuch kamikadze) -> znika
  for(const e of [...reps.values()])if(e.alive&&!seen.has(e.eid)){e.alive=false;removeRep(e)}
});

function applyEv(v){
  const G=S.G;
  if(v.t==='wave'){if(v.w>=G.wave){G.wave=v.w;G.boss=false;hooks.onWave&&hooks.onWave(v)}}
  else if(v.t==='clear'){hooks.onClear&&hooks.onClear(v)}
  else if(v.t==='kill'){
    const e=reps.get(v.id);if(!e||!e.alive)return;
    // kierunek upadku: od zabójcy
    const k=v.by===N.me?P.pos:(rec(v.by)&&rec(v.by).pos);
    if(k){const dx=e.g.position.x-k.x,dz=e.g.position.z-k.z,l=Math.hypot(dx,dz)||1;e.hitDirX=dx/l;e.hitDirZ=dz/l}
    hooks.onKill&&hooks.onKill(e,v);
  }
}

/** Co klatkę (zamiast updateEnemies u klienta): interpolacja, animacja, śmierć. Zwraca liczbę żywych replik. */
export function updateReplicas(dt){
  const G=S.G;let alive=0;
  for(let i=G.enemies.length-1;i>=0;i--){
    const e=G.enemies[i];
    if(!e.replica){continue}
    if(!e.alive){
      if(e.def.dying)e.def.dying(e,dt);
      else{e.dieT+=dt;const k=Math.min(e.dieT/.55,1);e.g.rotation.x=-k*Math.PI/2;e.g.position.y=-k*.15}
      if(e.dieT>5)removeRep(e);
      continue;
    }
    alive++;
    const s=e.rbuf.sample(tmp,DELAY);
    if(s){
      const x=s[0],z=s[1];
      if(dt>0){const v=Math.hypot(x-e.rlx,z-e.rlz)/dt;e.ai.sp+=(Math.min(v,20)-e.ai.sp)*Math.min(1,dt*10)}
      e.rlx=x;e.rlz=z;e.g.position.x=x;e.g.position.z=z;e.g.rotation.y=s[2];
    }
    const dist=Math.hypot(P.pos.x-e.g.position.x,P.pos.z-e.g.position.z);
    if(e.cfg)animateReplica(e,dt,dist);
    else{                                             // bez cfg: nogi z prędkości, błysk trafienia
      e.walk=(e.walk||0)+dt*9*Math.min(1,e.ai.sp/2);if(e.hipL){const s=Math.sin(e.walk)*.6*Math.min(1,e.ai.sp/1.5);e.hipL.rotation.x=s;e.hipR.rotation.x=-s}
      if(e.flashT>0){e.flashT-=dt;const f=Math.max(e.flashT/.12,0);for(const m of e.mats)m.emissive.setRGB(f*.9,f*.15,f*.1)}
    }
  }
  return alive;
}
/** Sprzątanie (koniec runu): obiekty zwalnia clearRun (S.G.enemies), tu tylko indeks. */
export function clearReplicas(){reps.clear();bad.clear()}
