// Host co-op: AI celuje w najbliższego widocznego gracza (podmiana stanu P na czas aktualizacji wroga), trafienia zdalnych
// graczy -> damageEnemy, zabójstwa i asysty, rany zdalnych graczy (pole `hu` snapshotu), snapshot wrogów ~15 Hz (+ pole `ev`).
import {DS} from '../core/ds.js';
import {S} from '../core/state.js';
import {P} from '../player/player.js';
import {gridLos} from '../enemies/nav.js';
import {damageEnemy} from '../game/combat.js';
import {N,rec,send,isHost} from './session.js';
import {q2,packAnim,STATES,MAX_EV,sizeOf} from './proto.js';

/* ---------- wybór celu i podmiana P ---------- */
const SV={x:0,y:0,z:0,vx:0,vy:0,vz:0,kx:0,kz:0,dead:false};
let cur=null;               // zdalny gracz, w którego celuje aktualnie liczony wróg (null = ja)
const RETARGET=.5;
/** Kandydaci na cel: ja (jeśli stoję) i zdalni gracze w runie, nie leżący, z niedawnym `in`. */
function pickTarget(e){
  const G=S.G,p=e.g.position,now=performance.now();
  let best=null,bs=Infinity;
  if(!G.dead){const d=Math.hypot(P.pos.x-p.x,P.pos.z-p.z);bs=d+(gridLos(p.x,p.z,P.pos.x,P.pos.z)?0:12);best=N.me}
  for(const r of N.players.values()){
    if(!r.inRun||r.down||now-r.lastIn>4000)continue;
    const d=Math.hypot(r.pos.x-p.x,r.pos.z-p.z),s=d+(gridLos(p.x,p.z,r.pos.x,r.pos.z)?0:12);
    if(s<bs){bs=s;best=r.id}
  }
  return best||N.me;
}
/** Przed e.def.update: wybiera cel i (dla zdalnego) podstawia jego pozycję/prędkość/stan pod P i G.dead. */
export function aim(e,dt){
  e._tgT=(e._tgT||0)-dt;
  if(e._tgT<=0||!e._tg){e._tgT=RETARGET*(.8+Math.random()*.4);e._tg=pickTarget(e)}
  const r=e._tg!==N.me&&rec(e._tg);
  if(!r||!r.inRun){cur=null;return}
  aimAt(r);
}
/** Podmienia P na gracza r (do końca unaim()). Używane też przy trafieniach zdalnych (kierunek reakcji wroga). */
export function aimAt(r){
  const G=S.G;
  SV.x=P.pos.x;SV.y=P.pos.y;SV.z=P.pos.z;SV.vx=P.vel.x;SV.vy=P.vel.y;SV.vz=P.vel.z;SV.kx=P.knock.x;SV.kz=P.knock.z;SV.dead=G.dead;
  P.pos.copy(r.pos);P.vel.copy(r.vel);P.knock.set(0,0,0);G.dead=r.down;cur=r;
}
export function unaim(){
  if(!cur)return;
  const G=S.G;P.pos.set(SV.x,SV.y,SV.z);P.vel.set(SV.vx,SV.vy,SV.vz);P.knock.x=SV.kx;P.knock.z=SV.kz;G.dead=SV.dead;cur=null;
}

/* ---------- rany zdalnych graczy (przekierowanie hurt/knock) ---------- */
const hurtQ=new Map();      // id -> [dmg, kx, kz]
/** combat.hurt woła to najpierw: true = cios poszedł do zdalnego gracza (nie do mnie). */
export function redirectHurt(d){
  if(!cur||!isHost())return false;
  if(cur.down)return true;
  const q=hurtQ.get(cur.id)||[0,0,0];q[0]+=Math.max(0,+d||0);hurtQ.set(cur.id,q);
  return true;
}
// DS.player.knock: odrzut zdalnego celu też idzie siecią
const knock0=DS.player.knock;
DS.player.knock=function(v,z){
  if(cur&&isHost()){const kx=typeof v==='number'?v:v&&v.x||0,kz=typeof v==='number'?z||0:v&&v.z||0;const q=hurtQ.get(cur.id)||[0,0,0];q[1]+=kx;q[2]+=kz;hurtQ.set(cur.id,q);return}
  return knock0.apply(this,arguments);
};

/* ---------- trafienia zdalne, asysty ---------- */
const HIT_POINT=new THREE.Vector3();
/** Host: trafienia od gracza `from` (z wiadomości `shot`): [eid, dmg, head]. Nieistniejące/martwe eid są pomijane. */
export function applyRemoteHits(list,from){
  const G=S.G,r=rec(from);if(!G||!r||!r.inRun)return 0;
  let n=0;
  for(const h of list){
    const e=findEnemy(h[0]);if(!e)continue;
    const dmg=Math.min(h[1],3000);if(!(dmg>0))continue;
    HIT_POINT.set(e.g.position.x,1.2,e.g.position.z);
    aimAt(r);try{damageEnemy(e,dmg,h[2]===1,HIT_POINT,from)}finally{unaim()}
    n++;
  }
  return n;
}
function findEnemy(eid){const G=S.G;for(const e of G.enemies)if(e.eid===eid&&e.alive&&!e.replica)return e;return null}
/** combat.damageEnemy: kto ile zadał (asysty ≥25% maks. HP). */
export function trackDamage(e,dmg,by){
  if(!isHost()||!(dmg>0))return;
  const id=by==null?N.me:by;(e.dmgBy||(e.dmgBy={}))[id]=(e.dmgBy[id]||0)+dmg;
}
export function assistsOf(e,killer){
  const out=[],m=(e.maxHp||e.hp||1)*.25,d=e.dmgBy||{};
  for(const id in d)if(id!==killer&&d[id]>=m)out.push(id);
  return out;
}

/* ---------- zdarzenia i snapshot ---------- */
const evQ=[];
export function queueEv(v){if(evQ.length<MAX_EV*4)evQ.push(v)}
let typeIdx=null;
function tIdx(t){if(!typeIdx){typeIdx=new Map();DS.enemies.ids().forEach((id,i)=>typeIdx.set(id,i))}const i=typeIdx.get(t);return i===undefined?0:i}
const wrap=a=>{a%=Math.PI*2;if(a>Math.PI)a-=Math.PI*2;if(a<-Math.PI)a+=Math.PI*2;return a};

/** Buduje snapshot (wrogowie żywi, zdarzenia od ostatniego, rany). Zwraca obiekt wiadomości. */
export function buildSnap(){
  const G=S.G,e=[];
  for(const en of G.enemies){
    if(!en.alive||!en.eid||en.replica)continue;
    const p=en.g.position,st=STATES.indexOf(en.ai&&en.ai.state);
    e.push([en.eid,tIdx(en.type),en.variant===undefined?-1:en.variant,q2(p.x),q2(p.z),q2(wrap(en.g.rotation.y)),
      Math.max(0,Math.min(100,Math.round(en.hp/(en.maxHp||en.hp||1)*100))),st<0?0:st,packAnim(en.crouch,en.lean,en.armT)]);
    if(e.length>=60)break;
  }
  const d={k:'snap',t:Math.round(performance.now()),w:G.wave,q:Math.max(0,G.queue|0),e};
  if(evQ.length)d.ev=evQ.splice(0,MAX_EV);
  if(hurtQ.size){d.hu=[];for(const [id,q] of hurtQ)d.hu.push([id,q2(Math.min(q[0],1000)),q2(Math.max(-40,Math.min(40,q[1]))),q2(Math.max(-40,Math.min(40,q[2])))]);hurtQ.clear()}
  return d;
}
let snapT=0;
/** Co klatkę u hosta: wysyłka snapshotu ~15 Hz. */
export function hostTick(dt,hz){
  snapT-=dt;if(snapT>0)return;snapT=1/hz;
  const d=buildSnap(),n=sizeOf(d);
  N.stats.snapBytes=n;if(n>N.stats.snapMax)N.stats.snapMax=n;N.stats.snaps++;
  send(d);
}
export function resetHost(){evQ.length=0;hurtQ.clear();cur=null;snapT=0;typeIdx=null}

Object.assign(DS.net,{aim,unaim,redirectHurt,trackDamage,buildSnap,
  /** Wszyscy w runie leżą (ja i zdalni z niedawnym `in`)? Fale czekają, koniec runu u hosta. */
  allDown(){const G=S.G;if(!G||!G.dead)return false;const now=performance.now();for(const r of N.players.values())if(r.inRun&&!r.down&&now-r.lastIn<10000)return false;return true},
});
