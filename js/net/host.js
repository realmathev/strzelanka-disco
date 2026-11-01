// Host co-op: AI celuje w najbliższego widocznego gracza (podmiana stanu P na czas aktualizacji wroga), obrażenia obszarowe dla każdego
// gracza (forPlayers), trafienia zdalnych graczy -> damageEnemy, zabójstwa i asysty, rany/odrzut/ogłuszenie zdalnych graczy (pole `hu`),
// snapshot ~15 Hz: wrogowie (+ faza bossa), zdarzenia `ev` (rozgrywka i efekty), kosmetyka wrogów `fx` (napisy, dźwięki, smugi), wiązki `bm`, stan świata `ws`.
import {DS} from '../core/ds.js';
import {S} from '../core/state.js';
import {P} from '../player/player.js';
import {gridLos} from '../enemies/nav.js';
import {beamSnap} from '../enemies/proj.js';
import {damageEnemy} from '../game/combat.js';
import {N,rec,send,isHost} from './session.js';
import {q2,packAnim,STATES,MAX_EV,MAX_COS,sizeOf} from './proto.js';
import {worldState} from './world.js';

/* ---------- wybór celu i podmiana P ---------- */
const SV={x:0,y:0,z:0,vx:0,vy:0,vz:0,kx:0,kz:0,dead:false};
let cur=null;               // zdalny gracz podstawiony pod P (null = ja)
let tgtId=null;             // id celu AI liczonego właśnie wroga (forPlayers: czyCelAI)
const RETARGET=.5;
const fresh=r=>r.inRun&&performance.now()-r.lastIn<4000;
/** Kandydaci na cel: ja (jeśli stoję) i zdalni gracze w runie, nie leżący, z niedawnym `in`. */
function pickTarget(e){
  const G=S.G,p=e.g.position;
  let best=null,bs=Infinity;
  if(!G.dead){const d=Math.hypot(P.pos.x-p.x,P.pos.z-p.z);bs=d+(gridLos(p.x,p.z,P.pos.x,P.pos.z)?0:12);best=N.me}
  for(const r of N.players.values()){
    if(!fresh(r)||r.down)continue;
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
  tgtId=r&&r.inRun?r.id:N.me;
  if(!r||!r.inRun){cur=null;return}
  aimAt(r);
}
/** Podmienia P na gracza r (do końca unaim()). */
export function aimAt(r){
  if(cur)unaim();
  const G=S.G;
  SV.x=P.pos.x;SV.y=P.pos.y;SV.z=P.pos.z;SV.vx=P.vel.x;SV.vy=P.vel.y;SV.vz=P.vel.z;SV.kx=P.knock.x;SV.kz=P.knock.z;SV.dead=G.dead;
  P.pos.copy(r.pos);P.vel.copy(r.vel);P.knock.set(0,0,0);G.dead=r.down;cur=r;
}
export function unaim(){
  if(!cur)return;
  const G=S.G;P.pos.set(SV.x,SV.y,SV.z);P.vel.set(SV.vx,SV.vy,SV.vz);P.knock.x=SV.kx;P.knock.z=SV.kz;G.dead=SV.dead;cur=null;
}
/** Obrażenia obszarowe: fn(id, czyCelAI) kolejno dla mnie i każdego zdalnego gracza w runie (z podmianą P). */
export function forPlayers(fn){
  const prev=cur,tg=tgtId||N.me;
  if(prev)unaim();
  try{
    fn(N.me,tg===N.me);
    for(const r of N.players.values()){if(!fresh(r))continue;aimAt(r);try{fn(r.id,tg===r.id)}finally{unaim()}}
  }finally{if(prev)aimAt(prev)}
}

/* ---------- rany zdalnych graczy (przekierowanie hurt/knock/stun) ---------- */
const hurtQ=new Map();      // id -> [dmg, kx, kz, stun]
const hq=id=>{let q=hurtQ.get(id);if(!q){q=[0,0,0,0];hurtQ.set(id,q)}return q};
/** combat.hurt woła to najpierw: true = cios poszedł do zdalnego gracza (nie do mnie). */
export function redirectHurt(d){
  if(!cur||!isHost())return false;
  if(cur.down)return true;
  hq(cur.id)[0]+=Math.max(0,+d||0);
  return true;
}
export function redirectStun(t){if(!cur||!isHost())return false;const q=hq(cur.id);q[3]=Math.max(q[3],+t||0);return true}
const knock0=DS.player.knock;
DS.player.knock=function(v,z){
  if(cur&&isHost()){const kx=typeof v==='number'?v:v&&v.x||0,kz=typeof v==='number'?z||0:v&&v.z||0;const q=hq(cur.id);q[1]+=kx;q[2]+=kz;return}
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

/* ---------- zdarzenia, kosmetyka i snapshot ---------- */
const evQ=[],cosQ=[];
export function queueEv(v){if(evQ.length<MAX_EV*5)evQ.push(v)}
/** proj.js: efekt wroga (pocisk, kałuża, wybuch...) do odtworzenia u klientów. */
export function fxEv(v){queueEv(v)}
const qv=v=>[q2(v.x),q2(v.y),q2(v.z)];
const COLOR_RE=/^#[0-9a-fA-F]{3,8}$/;
/** S.fxTap w trakcie aktualizacji wrogów u hosta: napisy w świecie, zapowiedzi, dźwięki e_*, smugi strzałów wrogów, dym. */
export function tap(kind,a,b,c){
  if(cosQ.length>=MAX_COS*3)return;
  switch(kind){
    case 'fl':{const w=b&&b.world;if(!w||typeof a!=='string')return;cosQ.push({t:'fl',s:a.slice(0,60),a:qv(w),z:Math.round(b.size||24),c:COLOR_RE.test(b.color)?b.color:'#ffffff',l:q2(b.life||.8)});break}
    case 'an':if(typeof a==='string')cosQ.push({t:'an',s:a.slice(0,60),u:typeof b==='string'?b.slice(0,90):''});break;
    case 'sf':if(typeof a==='string'&&(/^e_[a-z_]{1,20}$/.test(a)||a==='enemyShot'))cosQ.push({t:'sf',s:a,v:typeof b==='number'&&isFinite(b)?q2(b):0});break;
    case 'tr':if(a&&b)cosQ.push({t:'tr',a:qv(a).concat(qv(b)),c:(c|0)&0xffffff});break;
    case 'pf':if(a)cosQ.push({t:'pf',a:qv(a)});break;
  }
}
let typeIdx=null;
function tIdx(t){if(!typeIdx){typeIdx=new Map();DS.enemies.ids().forEach((id,i)=>typeIdx.set(id,i))}const i=typeIdx.get(t);return i===undefined?0:i}
const wrap=a=>{a%=Math.PI*2;if(a>Math.PI)a-=Math.PI*2;if(a<-Math.PI)a+=Math.PI*2;return a};

let wsT=0;
/** Buduje snapshot. Wpis wroga: [eid,typ,wariant,x,z,ry,hp%,stan,anim(,boss: faza*10+nietykalny)]. */
export function buildSnap(withWorld){
  const G=S.G,e=[];
  for(const en of G.enemies){
    if(!en.alive||!en.eid||en.replica)continue;
    const p=en.g.position,st=STATES.indexOf(en.ai&&en.ai.state);
    const row=[en.eid,tIdx(en.type),en.variant===undefined?-1:en.variant,q2(p.x),q2(p.z),q2(wrap(en.g.rotation.y)),
      Math.max(0,Math.min(100,Math.round(en.hp/(en.maxHp||en.hp||1)*100))),st<0?0:st,packAnim(en.crouch,en.lean,en.armT)];
    if(en.boss)row.push(Math.min(9,en.phase|0||1)*10+(en.invulT>0?1:0));
    e.push(row);
    if(e.length>=60)break;
  }
  const d={k:'snap',t:Math.round(performance.now()),w:G.wave,q:Math.max(0,G.queue|0),e};
  if(evQ.length)d.ev=evQ.splice(0,MAX_EV);
  if(cosQ.length){d.fx=cosQ.splice(0,MAX_COS);cosQ.length=0}           // kosmetyka: nadmiar przepada
  if(hurtQ.size){d.hu=[];for(const [id,q] of hurtQ)d.hu.push([id,q2(Math.min(q[0],1000)),q2(Math.max(-40,Math.min(40,q[1]))),q2(Math.max(-40,Math.min(40,q[2]))),q2(Math.min(q[3],5))]);hurtQ.clear()}
  const bm=beamSnap();if(bm.length)d.bm=bm;
  if(withWorld){const ws=worldState();if(ws)d.ws=ws}
  return d;
}
let snapT=0;
/** Co klatkę u hosta: wysyłka snapshotu ~15 Hz (stan świata co ~0,5 s). */
export function hostTick(dt,hz){
  wsT-=dt;
  snapT-=dt;if(snapT>0)return;snapT=1/hz;
  const ww=wsT<=0;if(ww)wsT=.5;
  const d=buildSnap(ww),n=sizeOf(d);
  N.stats.snapBytes=n;if(n>N.stats.snapMax)N.stats.snapMax=n;N.stats.snaps++;
  send(d);
}
/** Natychmiastowa wysyłka (np. przed końcem runu albo zmianą poziomu), żeby zdarzenia nie przepadły. */
export function flushNow(){snapT=0;hostTick(0,15)}
export function resetHost(){evQ.length=0;cosQ.length=0;hurtQ.clear();cur=null;tgtId=null;snapT=0;wsT=0;typeIdx=null}

Object.assign(DS.net,{aim,unaim:()=>{unaim();tgtId=null},forPlayers,redirectHurt,redirectStun,trackDamage,buildSnap,fxEv,tap,
  /** Wszyscy w runie leżą (ja i zdalni z niedawnym `in`)? Fale czekają, koniec runu u hosta. */
  allDown(){const G=S.G;if(!G||!G.dead)return false;const now=performance.now();for(const r of N.players.values())if(r.inRun&&!r.down&&now-r.lastIn<10000)return false;return true},
});
