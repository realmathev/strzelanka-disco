// Co-op: wspólny świat. Znajdźki z wrogów ma host (spawn/zniknięcie u wszystkich, `pick` = prośba klienta, efekt u zbierającego);
// drzwi, sekrety, windy, beczki i automaty: stan u hosta (`ws` w snapshocie co ~0,5 s), klient wysyła `use` i od razu pokazuje skutek u siebie.
// Znajdźki poziomu (kasety, plakaty...) zostają lokalne: każdy zbiera je do własnego zapisu.
import {DS} from '../core/ds.js';
import {S} from '../core/state.js';
import {world} from '../world/state.js';
import {disposeObject} from '../render/materials.js';
import {P} from '../player/player.js';
import {spawnPickup} from '../pickups/pickups.js';
import {machineList,markMachineUsed} from '../pickups/machines.js';
import {debugState,blowBarrel,hideBarrelAt} from '../world/levels/common.js';
import {N,send,handle,isHost} from './session.js';
import {queueEv} from './host.js';
import {q2} from './proto.js';

/* ---------- znajdźki ---------- */
let pseq=0;
/** pickups.js (host): 'spawn' | 'take' (zebrał host) | 'gone' (czas minął / limit). */
DS.net.onPickup=(p,what)=>{
  if(!DS.net.isHost())return;
  if(what==='spawn'){p.nid=++pseq;queueEv({t:'ps',id:p.nid,k:p.type,a:[q2(p.m.position.x),q2(p.m.position.z)],v:p.val})}
  else if(p.nid)queueEv({t:'pg',id:p.nid,by:what==='take'?N.me:null});
};
/** pickups.js (klient): gracz dotknął kopii znajdźki -> prośba do hosta (ponowienie po 1,5 s bez odpowiedzi). */
DS.net.requestPickup=p=>{if(!N.room)return;send({k:'pick',id:p.nid},N.room.host);setTimeout(()=>{p.req=false},1500)};
handle('pick',(d,from,r)=>{
  const G=S.G;if(!isHost()||!r||!r.inRun||r.down||!G)return;
  const i=G.pickups.findIndex(p=>p.nid===d.id&&!p.done&&!p.mirror);if(i<0)return;
  const p=G.pickups[i];
  if(Math.hypot(p.m.position.x-r.pos.x,p.m.position.z-r.pos.z)>4)return;   // za daleko od gracza (wg ostatniego `in`)
  p.done=true;disposeObject(p.m);G.pickups.splice(i,1);
  queueEv({t:'pg',id:p.nid,by:from});
});
const SP={x:0,z:0};
/** Klient: zdarzenia znajdziek od hosta. */
export function pickupEv(v){
  const G=S.G;if(!G)return;
  if(v.t==='ps'){if(!DS.pickups.has(v.k)||G.pickups.some(p=>p.nid===v.id))return;SP.x=v.a[0];SP.z=v.a[1];spawnPickup(v.k,SP,v.v,{nid:v.id});return}
  const i=G.pickups.findIndex(p=>p.nid===v.id&&p.mirror);if(i<0)return;
  const p=G.pickups[i];G.pickups.splice(i,1);disposeObject(p.m);
  if(v.by===N.me&&!G.dead){const def=DS.pickups.get(p.type);def.collect(p);DS.bus.emit('pickup',{type:p.type,value:p.val})}
}

/* ---------- obiekty świata ---------- */
const lifts=()=>(world.level&&world.level._lifts)||[];
const bits=(a,f)=>a.map(x=>f(x)?1:0).join('').slice(0,128);
/** Host: stan obiektów do snapshotu (null, gdy poziom ich nie ma). */
export function worldState(){
  const {doors,barrels}=debugState(),L=lifts(),M=machineList(),B=barrels?barrels.items:[];
  if(!doors.length&&!L.length&&!B.length&&!M.length)return null;
  return {d:bits(doors,d=>d.target),l:bits(L,l=>l.target).slice(0,16),b:bits(B,b=>b.dead),m:M.slice(0,32).map(m=>[Math.min(600,Math.round(m.cd*10)/10),m.used?1:0])};
}
const grace=new Map();   // 'd3' -> czas: po lokalnej akcji klient nie nadpisuje obiektu stanem hosta przez chwilę
const fresh=k=>(grace.get(k)||0)>performance.now();
/** Klient: stan od hosta. */
export function applyWs(w){
  const {doors}=debugState(),L=lifts(),M=machineList();
  (w.d||'').split('').forEach((c,i)=>{const d=doors[i];if(d&&!d.auto&&!fresh('d'+i))d.target=+c});
  (w.l||'').split('').forEach((c,i)=>{const l=L[i];if(l&&!fresh('l'+i))l.target=+c});
  (w.b||'').split('').forEach((c,i)=>{if(c==='1')hideBarrelAt(i)});
  (w.m||[]).forEach((x,i)=>{const m=M[i];if(m&&!fresh('m'+i)){m.cd=x[0];m.used=x[1]===1}});
}
/** Hook obiektów (common.js drzwi/beczki, kasyno windy, automaty): klient -> `use` do hosta; host: stan pójdzie w `ws`. */
DS.net.useObj=(o,i,v)=>{
  if(!DS.net.isClient()||!(i>=0)||!N.room)return;
  grace.set(o+i,performance.now()+1500);
  send({k:'use',o,i,v:v?1:0},N.room.host);
};
handle('use',(d,from,r)=>{
  if(!isHost()||!r||!r.inRun||!S.G)return;
  if(d.o==='d'){const dr=debugState().doors[d.i];if(dr&&!dr.auto)dr.target=d.v?1:0}
  else if(d.o==='l'){const l=lifts()[d.i];if(l)l.target=d.v?1:0}
  else if(d.o==='m')markMachineUsed(d.i);
  else if(d.o==='b')blowBarrel(d.i,from);
});
/** Drzwi automatyczne: otwierają się przy dowolnym graczu (ja + koledzy wg ostatniego `in`). */
DS.net.anyNear=(x,z,r)=>{
  if(Math.hypot(P.pos.x-x,P.pos.z-z)<r)return true;
  if(!DS.net.active())return false;
  for(const p of N.players.values())if(p.inRun&&Math.hypot(p.pos.x-x,p.pos.z-z)<r)return true;
  return false;
};
export function resetWorldSync(){grace.clear()}
