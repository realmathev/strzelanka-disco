// Rdzeń AI wrogów: automat stanów (patrol / czujność / pościg / flankowanie / osłona / ucieczka / atak + stany typu),
// percepcja (zasięg, kąt widzenia, linia wzroku z budżetem raycastów, słuch strzałów, krzyk do sąsiadów),
// poruszanie po ścieżkach z nav.js (bez ślizgania po ścianach), animacje proceduralne i śmierć „ragdoll-lite”.
// Typ wroga podaje tylko konfigurację (`cfg`) i hooki; ten plik nie zna konkretnych typów.
import {rand,clamp,pick} from '../core/util.js';
import {opt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {addFloater} from '../render/comicfx.js';
import {addTracer} from '../render/fx3d.js';
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {collide,los} from '../player/collision.js';
import {hurt} from '../game/combat.js';
import * as nav from './nav.js';

const DEF_CFG={
  speed:3.4,turn:9,sight:42,fov:2.2,near:3,hear:50,shoutR:22,think:.18,range:[6,14],melee:false,
  flank:.25,cover:.15,fleeHp:0,fleeTime:6,alertTime:7,lose:3.5,cls:0,radius:.5,patrolR:12,eyeY:1.6,
  react:[.35,.7],accel:10,
};
export const AI_BUDGET={los:3,nav:450};
let losLeft=0;
const ctx={dx:0,dz:0,dist:1,nx:0,nz:-1,eye:null,sees:false,ex:0,ez:0};
const T1=new THREE.Vector3(),T2=new THREE.Vector3();

/** Początek klatki: odnawia budżet raycastów i węzłów A*. */
export function beginFrame(){losLeft=AI_BUDGET.los;nav.tick(AI_BUDGET.nav)}

/** Inicjalizuje stan AI wroga. opts: {aware: zna położenie gracza od początku (fale), wave: wymusza pościg gdy za długo patroluje, home:{x,z}} */
export function initAI(e,cfg,opts={}){
  const c=e.cfg=Object.assign({},DEF_CFG,cfg);
  c.cosFov=Math.cos(c.fov/2);
  e.radius=e.radius||c.radius;
  e.ai={state:'patrol',t:0,age:0,thinkT:rand(0,c.think),sees:false,losCache:false,lx:0,lz:0,lt:99,hunt:0,relentless:!!opts.wave,patrolT:0,
    path:null,pi:0,pathPending:false,pathGoalX:0,pathGoalZ:0,pathAge:0,repathT:rand(0,.4),
    vx:0,vz:0,sp:0,want:0,moveYaw:0,face:1,faceYaw:0,
    stuckT:0,sx:0,sz:0,sideT:0,sideDir:1,
    gx:0,gz:0,wait:0,hurtT:99,fled:false,coverCD:0,react:0,reactDone:false,home:opts.home||null,sub:0,
    coverHold:0,look:0};
  e.walk=rand(0,6);e.walk0=rand(0,6);e.lean=0;e.flinch=0;e.crouch=0;e.flashT=0;e.glow=0;e.armT=0;e.slowT=0;
  e.hipH=e.hipH||.9;
  const a=e.ai;
  if(opts.aware){a.hunt=14+rand(0,6);a.state='chase'}
  return e;
}

/* ---------- pomocnicze (eksportowane dla typów) ---------- */
export const playerDist=e=>Math.hypot(P.pos.x-e.g.position.x,P.pos.z-e.g.position.z);
export function enter(e,state,arg){
  const a=e.ai,c=e.cfg;
  a.state=state;a.t=0;a.sub=0;
  switch(state){
    case 'patrol':a.wait=rand(.5,2);a.gx=a.gz=0;a.hasGoal=false;break;
    case 'alert':a.look=rand(-1,1);break;
    case 'flank':{
      const dx=e.g.position.x-P.pos.x,dz=e.g.position.z-P.pos.z,d=Math.hypot(dx,dz)||1,s=Math.random()<.5?-1:1,ang=s*rand(1.1,1.6);
      const ca=Math.cos(ang),sa=Math.sin(ang),r=Math.max(c.range[1]*.75,5);
      const fx=P.pos.x+(dx*ca-dz*sa)/d*r,fz=P.pos.z+(dx*sa+dz*ca)/d*r;
      const f=nav.nearestFree(fx,fz,c.cls,5);
      if(f){a.gx=f.x;a.gz=f.z}else{a.state='chase'}
      break}
    case 'cover':{
      const cv=nav.findCover(e.g.position.x,e.g.position.z,P.pos.x,P.pos.z,16,c.cls);
      if(cv){a.gx=cv.x;a.gz=cv.z;a.coverHold=rand(1.4,2.8)}else{a.state='chase';a.coverCD=3}
      break}
    case 'flee':{
      const dx=e.g.position.x-P.pos.x,dz=e.g.position.z-P.pos.z,d=Math.hypot(dx,dz)||1;
      let cv=nav.findCover(e.g.position.x,e.g.position.z,P.pos.x,P.pos.z,22,c.cls);
      if(cv&&Math.hypot(cv.x-P.pos.x,cv.z-P.pos.z)<Math.min(d+4,14))cv=null;
      if(cv){a.gx=cv.x;a.gz=cv.z}
      else{const f=nav.nearestFree(e.g.position.x+dx/d*20,e.g.position.z+dz/d*20,c.cls,8);if(f){a.gx=f.x;a.gz=f.z}else{a.gx=e.g.position.x+dx/d*10;a.gz=e.g.position.z+dz/d*10}}
      a.t=0;if(opt.onoma)addFloater(pick(['NIE BIJ!','MAMUSIU!','WYCOFKA!']),{world:T1.set(e.g.position.x,2.3,e.g.position.z).clone(),size:24,life:.8,color:'#f4e7c5',vy:-30});
      break}
  }
  const st=c.states&&c.states[state];if(st&&st.enter)st.enter(e,arg);
}
/** Ustaw cel obrotu na punkt (płynny obrót w updateAI). */
export function faceTo(e,x,z){const a=e.ai;a.face=2;a.faceYaw=Math.atan2(-(x-e.g.position.x),-(z-e.g.position.z))}
export const facePlayer=e=>{e.ai.face=1};
const angDiff=(a,b)=>{let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d};

/** Bezpośredni ruch w kierunku jednostkowym (ux,uz) z przyspieszeniem, kolizją i separacją od innych wrogów. */
export function moveDir(e,dt,ux,uz,speed){
  const a=e.ai,c=e.cfg,p=e.g.position;
  if(e.slowT>0)speed*=.55;
  const k=Math.min(1,dt*c.accel);
  a.vx+=(ux*speed-a.vx)*k;a.vz+=(uz*speed-a.vz)*k;
  p.x+=a.vx*dt;p.z+=a.vz*dt;collide(p,e.radius);
  separate(e,dt);
  const sp=Math.hypot(a.vx,a.vz);a.sp=sp;
  if(sp>.4&&speed>0)a.moveYaw=Math.atan2(-a.vx,-a.vz);
  a.want=speed>0?1:0;
}
export function stopMove(e,dt){moveDir(e,dt,0,0,0)}
function separate(e,dt){
  const G=S.G,p=e.g.position;
  for(const o of G.enemies){
    if(o===e||!o.alive)continue;
    const ox=p.x-o.g.position.x,oz=p.z-o.g.position.z,min=e.radius+o.radius;
    if(Math.abs(ox)>min||Math.abs(oz)>min)continue;
    const od=Math.hypot(ox,oz);
    if(od<min&&od>.001){const push=(min-od)*.5;p.x+=ox/od*push;p.z+=oz/od*push}
  }
}
/**
 * Idzie do (gx,gz): prosto, gdy droga wolna, inaczej po ścieżce z nav.js (A* liczony poza klatką). Zwraca pozostały dystans.
 * stop = odległość uznawana za dotarcie.
 */
export function moveToward(e,dt,gx,gz,speed,stop=.6){
  const a=e.ai,c=e.cfg,p=e.g.position;
  const dx=gx-p.x,dz=gz-p.z,d=Math.hypot(dx,dz);
  if(d<=stop){moveDir(e,dt,0,0,0);return d}
  let tx=gx,tz=gz;
  if(d<1.6||nav.walkable(p.x,p.z,gx,gz,c.cls)){
    if(a.path&&a.pathPending)nav.cancel(e);
    a.path=null;
  }else{
    a.pathAge+=dt;a.repathT-=dt;
    const stale=!a.path||Math.hypot(a.pathGoalX-gx,a.pathGoalZ-gz)>3||a.pathAge>5;
    if(stale&&!a.pathPending&&a.repathT<=0){nav.request(e,gx,gz,c.cls);a.repathT=.7+Math.random()*.3}
    if(a.path){
      while(a.pi<a.path.length-1&&Math.hypot(a.path[a.pi].x-p.x,a.path[a.pi].z-p.z)<.8)a.pi++;
      const w=a.path[a.pi];tx=w.x;tz=w.z;
      if(a.pi>=a.path.length-1&&Math.hypot(tx-p.x,tz-p.z)<.5){a.path=null}
    }else if(a.pathPending){speed*=.35}               // czekamy na A*: pełznij w stronę celu
  }
  let ux=tx-p.x,uz=tz-p.z;const dd=Math.hypot(ux,uz)||1;ux/=dd;uz/=dd;
  // wyjście z zacięcia: krótki unik w bok
  if(a.sideT>0){a.sideT-=dt;const sx=-uz*a.sideDir,sz=ux*a.sideDir;ux=ux*.4+sx;uz=uz*.4+sz;const l=Math.hypot(ux,uz)||1;ux/=l;uz/=l}
  moveDir(e,dt,ux,uz,speed);
  a.stuckT+=dt;
  if(a.stuckT>.7){
    const moved=Math.hypot(p.x-a.sx,p.z-a.sz);
    if(moved<speed*.7*.25&&a.sp<speed*.5+.1){a.sideT=.5;a.sideDir=Math.random()<.5?-1:1;a.path=null;a.repathT=0;a.pathAge=9}
    a.sx=p.x;a.sz=p.z;a.stuckT=0;
  }
  return d;
}

/** Obrażenia gracza od wroga (jedyne miejsce, które woła hurt). */
export function hitPlayer(e,dmg){const G=S.G;if(!G||G.dead)return false;hurt(dmg);return true}
/** Strzał hitscan wroga z punktu `from` (Vector3) do oczu gracza z rozrzutem; zwraca true, gdy trafił. */
export function fireAt(e,from,eye,{dmg,acc,spread=1.4,color=0xff5533,snd='enemyShot',vol=1,tracers=1}){
  const G=S.G;if(!G||G.dead)return false;
  const dist=from.distanceTo(eye);
  if(!los(from,eye))return false;
  const moveF=P.vel.length()>4?.65:1;
  const hit=Math.random()<acc*moveF*clamp(1.4-dist/40,.35,1.2);
  const end=T2.copy(eye);if(!hit){end.x+=rand(-spread,spread);end.y+=rand(-.6,.8);end.z+=rand(-spread,spread)}
  for(let i=0;i<tracers;i++)addTracer(from,end,color,.08);
  sfx(snd,clamp(1.3-dist/40,.25,1)*vol);
  if(hit)hurt(dmg*rand(.85,1.15));
  noise(e,30);
  return hit;
}
/** Hałas wroga (strzał, krzyk): budzi sąsiadów w promieniu r. */
export function noise(e,r){wakeAround(e.g.position.x,e.g.position.z,r,P.pos.x,P.pos.z,e)}
function wakeAround(x,z,r,tx,tz,except){
  const G=S.G;if(!G)return;
  for(const o of G.enemies){
    if(o===except||!o.alive||!o.ai)continue;
    const d=Math.hypot(o.g.position.x-x,o.g.position.z-z);
    if(d<r)wake(o,tx+rand(-2,2),tz+rand(-2,2));
  }
}
/** Budzi wroga: jeśli patroluje lub tylko się rozgląda, rusza w stronę (x,z). */
export function wake(o,x,z){
  const a=o.ai;if(!a||!o.alive||o.cfg.deaf)return;
  if(a.state==='patrol'||(a.state==='alert')){
    a.lx=x;a.lz=z;a.lt=0;a.gx=x;a.gz=z;a.hunt=Math.max(a.hunt,3);
    if(a.state==='patrol')enter(o,'alert');else a.t=0;
  }
}

/* ---------- percepcja ---------- */
function perceive(e,eye,dtThink){
  const a=e.ai,c=e.cfg,G=S.G,p=e.g.position;
  let sees=false;
  if(!G.dead&&ctx.dist<c.sight){
    const fx=-Math.sin(e.g.rotation.y),fz=-Math.cos(e.g.rotation.y);
    const dot=(ctx.dx*fx+ctx.dz*fz)/ctx.dist;
    const inView=ctx.dist<c.near||dot>c.cosFov||(a.state!=='patrol'&&a.state!=='alert'&&dot>-.2);
    if(inView&&nav.gridLos(p.x,p.z,P.pos.x,P.pos.z)){
      if(losLeft>0||ctx.dist<c.near){losLeft--;T1.set(p.x,p.y+c.eyeY*(e.g.scale.y||1),p.z);a.losCache=los(T1,eye)}
      sees=a.losCache;
    }
  }
  const prev=a.sees;a.sees=sees;
  if(sees){a.lx=P.pos.x;a.lz=P.pos.z;a.lt=0}else a.lt+=dtThink;
  if(sees&&!prev&&!a.reactDone&&(a.state==='patrol'||a.state==='alert')){
    a.reactDone=true;a.react=rand(c.react[0],c.react[1]);
    if(opt.onoma)addFloater(pick(['HEJ!','TO ON!','ŁAPAĆ GO!','O, FRAJER!']),{world:T1.set(p.x,2.4,p.z).clone(),size:26,life:.8,color:'#ffe14a',vy:-30});
    wakeAround(p.x,p.z,c.shoutR,P.pos.x,P.pos.z,e);
  }
  return sees;
}

/* ---------- decyzje (co ~0,18 s) ---------- */
function think(e,eye,dtThink){
  const a=e.ai,c=e.cfg,G=S.G;
  const sees=perceive(e,eye,dtThink);
  a.coverCD=Math.max(0,a.coverCD-dtThink);a.hurtT+=dtThink;
  if(G.dead){if(a.state!=='patrol')enter(e,'patrol');a.hunt=0;return}
  if(a.hunt>0){a.hunt-=dtThink;a.lx=P.pos.x;a.lz=P.pos.z}
  if(c.decide&&c.decide(e,ctx,dtThink))return;
  const hpF=e.hp/e.maxHp,st=c.states&&c.states[a.state];
  if(st&&st.locked&&st.locked(e))return;                          // stan typu, którego nie wolno przerwać
  if(c.fleeHp&&hpF<c.fleeHp&&!a.fled&&a.state!=='flee'){a.fled=true;enter(e,'flee');return}
  switch(a.state){
    case 'patrol':
      a.patrolT+=dtThink;
      if(a.react>0)break;
      if(sees||a.hunt>0){enter(e,'chase');break}
      if(a.relentless&&a.patrolT>9){a.hunt=6;a.patrolT=0}
      break;
    case 'alert':
      if(a.react>0)break;
      if(sees||a.hunt>0){enter(e,'chase');break}
      if(a.t>c.alertTime){a.patrolT=0;enter(e,'patrol')}
      break;
    case 'chase':{
      const d=ctx.dist,r=c.range;
      if(sees){
        if(!c.melee&&d<=r[1]*1.05&&d>=r[0]*.7){enter(e,'attack');break}
        if(c.melee&&d<=r[1]){enter(e,'attack');break}
        if(a.t>1.5&&d>r[1]*1.2&&Math.random()<c.flank*.35&&countAllies(e,16)>0){enter(e,'flank');break}
        if(c.cover&&a.hurtT<1.2&&a.coverCD<=0&&Math.random()<c.cover){enter(e,'cover');break}
      }else if(a.lt>c.lose&&a.hunt<=0){enter(e,'alert');a.gx=a.lx;a.gz=a.lz}
      break}
    case 'attack':
      if(!sees&&a.lt>1.2){enter(e,'chase');break}
      if(ctx.dist>c.range[1]*1.3||(!c.melee&&ctx.dist<c.range[0]*.5&&!c.holdGround)){enter(e,'chase');break}
      if(c.cover&&a.hurtT<1&&a.coverCD<=0&&Math.random()<c.cover*.6){enter(e,'cover')}
      break;
    case 'flank':
      if(a.t>6||(sees&&ctx.dist<c.range[1])){enter(e,sees?'attack':'chase')}
      break;
    case 'cover':
      if(a.t>12){a.coverCD=6;enter(e,'chase')}
      break;
    case 'flee':
      if(a.t>c.fleeTime||(a.hasArrived&&a.t>2)){a.coverCD=4;enter(e,sees||a.hunt>0?'chase':'alert')}
      break;
  }
}
function countAllies(e,r){
  let n=0;const G=S.G,p=e.g.position;
  for(const o of G.enemies)if(o!==e&&o.alive&&o.ai&&Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z)<r)n++;
  return n;
}
export {countAllies};

/* ---------- działanie stanów (co klatkę) ---------- */
function act(e,dt){
  const a=e.ai,c=e.cfg,p=e.g.position;
  const st=c.states&&c.states[a.state];
  if(st&&st.update){st.update(e,dt,ctx);return}
  const sp=c.speed;
  switch(a.state){
    case 'patrol':{
      a.face=0;
      if(a.react>0){a.react-=dt;stopMove(e,dt);facePlayer(e);break}
      if(!a.home)a.home={x:p.x,z:p.z};
      if(a.wait>0){a.wait-=dt;stopMove(e,dt);a.face=0;break}
      if(!a.hasGoal){const q=nav.randomPoint(a.home.x,a.home.z,c.patrolR,c.cls);if(q){a.gx=q.x;a.gz=q.z;a.hasGoal=true}else{a.wait=1;break}}
      const d=moveToward(e,dt,a.gx,a.gz,sp*.42,.8);
      if(d<=.8){a.hasGoal=false;a.wait=rand(1,3.2)}
      break}
    case 'alert':{
      if(a.react>0){a.react-=dt;stopMove(e,dt);facePlayer(e);break}
      const d=Math.hypot(a.gx-p.x,a.gz-p.z);
      if(d>2.5){a.face=0;moveToward(e,dt,a.gx,a.gz,sp*.7,1.5)}
      else{stopMove(e,dt);a.look+=dt*.9;a.face=2;a.faceYaw=a.moveYaw+Math.sin(a.look*2.2)*1.2}   // rozgląda się
      break}
    case 'chase':{
      a.face=a.sees?1:0;
      if(a.react>0){a.react-=dt}
      let gx=a.sees||a.hunt>0?P.pos.x:a.lx,gz=a.sees||a.hunt>0?P.pos.z:a.lz;
      if(c.weave){const sw=Math.sin(a.age*1.7+e.walk0)*c.weave;gx+=-ctx.nz*sw;gz+=ctx.nx*sw}      // slalom (np. pijak)
      const stop=c.melee?Math.max(1.1,c.range[0]):(a.sees?c.range[1]*.9:1.5);        // strzelec staje dopiero, gdy widzi gracza
      moveToward(e,dt,gx,gz,sp,stop);
      break}
    case 'attack':{
      if(c.attack)c.attack(e,dt,ctx);else defaultAttack(e,dt);
      break}
    case 'flank':{
      a.face=a.sees?1:0;
      const d=moveToward(e,dt,a.gx,a.gz,sp*1.08,1.5);
      if(d<=1.6)enter(e,a.sees?'attack':'chase');
      break}
    case 'cover':{
      const d=Math.hypot(a.gx-p.x,a.gz-p.z);
      if(d>.8){a.face=0;e.crouch=Math.max(0,e.crouch-dt*4);moveToward(e,dt,a.gx,a.gz,sp*1.2,.6)}
      else{stopMove(e,dt);e.crouch=Math.min(1,e.crouch+dt*5);a.face=1;a.coverHold-=dt;if(a.coverHold<=0){e.crouch=0;a.coverCD=6;enter(e,'chase')}}
      break}
    case 'flee':{
      a.face=0;
      const d=moveToward(e,dt,a.gx,a.gz,sp*1.15,.8);
      if(d<=.9){a.hasArrived=true;stopMove(e,dt);a.face=1}
      if(ctx.dist<2.5&&a.t>1.5)enter(e,'attack');           // zapędzony w kozi róg walczy
      break}
    default:stopMove(e,dt);
  }
  if(a.state!=='cover'&&e.crouch>0)e.crouch=Math.max(0,e.crouch-dt*4);
}
function defaultAttack(e,dt){
  const a=e.ai,c=e.cfg;
  a.face=1;stopMove(e,dt);
}

/* ---------- animacja ---------- */
export function animateHuman(e,dt){
  const a=e.ai,c=e.cfg;
  const sp=a.sp,k=Math.min(1,dt*10);
  e.walk+=dt*(1.5+sp*2.1);
  const amp=clamp(sp/4.5,0,1)*.8,s=Math.sin(e.walk);
  if(e.hipL){e.hipL.rotation.x=s*amp;e.hipR.rotation.x=-s*amp}
  if(e.torso){
    const run=clamp(sp/5,0,1);
    e.torso.position.y=e.hipH+Math.abs(s)*.04*clamp(sp/3,0,1.2)-e.crouch*.22;
    e.torso.rotation.z=s*.05*run;
    e.torso.rotation.y=-s*.14*run;
    e.torso.rotation.x+=(-(e.lean+run*.1)+e.flinch*.5-e.torso.rotation.x)*k;
    if(e.hipL){e.hipL.position.y=e.hipH-e.crouch*.22;e.hipR.position.y=e.hipH-e.crouch*.22;
      if(e.crouch>0){e.hipL.rotation.x-=e.crouch*.7;e.hipR.rotation.x-=e.crouch*.7}}
    if(e.armR)e.armR.rotation.x+=(e.armT-e.armR.rotation.x)*Math.min(1,dt*14);
  }
  e.flinch=Math.max(0,e.flinch-dt*5);
}
/** Błysk trafienia i poświata typu (emissive), liczniki statusów. */
function tickStatus(e,dt){
  if(e.flashT>0)e.flashT-=dt;
  if(e.slowT>0)e.slowT-=dt;
  const f=e.flashT>0?Math.max(e.flashT/.12,0):0,gl=e.glow||0;
  const r=Math.max(f*.9,gl),g=Math.max(f*.15,gl*.25),b=Math.max(f*.1,gl*.2);
  for(const m of e.mats)m.emissive.setRGB(r,g,b);
}

/** Aktualizacja jednego żywego wroga. eye = oczy gracza. */
export function updateAI(e,dt,eye){
  const a=e.ai,c=e.cfg,p=e.g.position;
  a.t+=dt;a.age+=dt;
  ctx.dx=P.pos.x-p.x;ctx.dz=P.pos.z-p.z;ctx.dist=Math.hypot(ctx.dx,ctx.dz)||.001;ctx.nx=ctx.dx/ctx.dist;ctx.nz=ctx.dz/ctx.dist;ctx.eye=eye;ctx.sees=a.sees;
  tickStatus(e,dt);
  a.thinkT-=dt;
  if(a.thinkT<=0){const td=c.think*rand(.8,1.3);a.thinkT=td;think(e,eye,td);ctx.sees=a.sees}
  act(e,dt);
  // obrót
  const want=a.face===1?Math.atan2(-ctx.dx,-ctx.dz):a.face===2?a.faceYaw:(a.sp>.4?a.moveYaw:e.g.rotation.y);
  const dy=angDiff(e.g.rotation.y,want),step=c.turn*dt;
  e.g.rotation.y+=Math.abs(dy)<step?dy:Math.sign(dy)*step;
  if(c.animate)c.animate(e,dt);else animateHuman(e,dt);
}

/* ---------- trafienie i śmierć ---------- */
DS.bus.on('hit',ev=>{
  const e=ev.enemy;if(!e||!e.ai)return;
  e.flinch=Math.min(1,e.flinch+(ev.dmg>25?1:.55));
  if(ev.dmg>30)e.slowT=Math.max(e.slowT,.25);
  const p=e.g.position,dx=p.x-P.pos.x,dz=p.z-P.pos.z,d=Math.hypot(dx,dz)||1;
  e.hitDirX=dx/d;e.hitDirZ=dz/d;e.lastDmg=ev.dmg;
  const a=e.ai;a.hurtT=0;
  if(a.state==='patrol'||a.state==='alert'){a.lx=P.pos.x;a.lz=P.pos.z;a.hunt=Math.max(a.hunt,5);a.reactDone=true;a.react=0;enter(e,'chase');wakeAround(p.x,p.z,e.cfg.shoutR,P.pos.x,P.pos.z,e)}
  if(e.cfg.onHit)e.cfg.onHit(e,ev);
});
// strzał gracza: słyszą go wrogowie w zasięgu `hear` (zapytanie o kierunek jest niedokładne: ±3 m)
DS.bus.on('shot',()=>{
  const G=S.G;if(!G)return;
  for(const o of G.enemies){
    if(!o.alive||!o.ai)continue;
    const d=Math.hypot(o.g.position.x-P.pos.x,o.g.position.z-P.pos.z);
    if(d<o.cfg.hear)wake(o,P.pos.x+rand(-3,3),P.pos.z+rand(-3,3));
  }
});

const DV=new THREE.Vector3();
/** „Ragdoll-lite”: ciało przewraca się zgodnie z kierunkiem trafienia, ślizga się i traci pęd, kończyny się rozkładają. */
export function dyingHuman(e,dt){
  const a=e.ai,g=e.g;
  if(!e.dInit){
    e.dInit=true;
    const hx=e.hitDirX===undefined?0:e.hitDirX,hz=e.hitDirZ===undefined?1:e.hitDirZ;
    const power=e.blast?e.blast:clamp(2.2+(e.lastDmg||20)*.06,2.2,6);
    e.dvx=hx*power;e.dvz=hz*power;e.dspin=rand(-1,1)*(e.blast?5:1.6);
    const ry=g.rotation.y,fx=-Math.sin(ry),fz=-Math.cos(ry),rx=Math.cos(ry),rz=-Math.sin(ry);
    e.fallX=clamp(-(hx*fx+hz*fz),-1,1);e.fallZ=clamp(-(hx*rx+hz*rz),-1,1);
    if(Math.abs(e.fallX)<.35&&Math.abs(e.fallZ)<.35)e.fallX=.6;
    e.splay=rand(.3,1.0);e.crouch=0;e.glow=0;
    if(e.beam&&e.beam.release){e.beam.release();e.beam=null}
    if(e.beams){e.beams.forEach(b=>b.release());e.beams=null}
    if(e.onDieInit)e.onDieInit(e);
  }
  e.dieT+=dt;
  const k=Math.min(e.dieT/.55,1),ease=1-(1-k)*(1-k);
  g.position.x+=e.dvx*dt;g.position.z+=e.dvz*dt;collide(g.position,e.radius*.7);
  const fr=Math.exp(-dt*3.2);e.dvx*=fr;e.dvz*=fr;
  g.rotation.y+=e.dspin*dt;e.dspin*=Math.exp(-dt*2.5);
  if(e.rig){
    e.rig.rotation.x=e.fallX*ease*1.5;e.rig.rotation.z=e.fallZ*ease*1.5;
    // zwiotczałe kończyny
    if(e.hipL){e.hipL.rotation.x+=((-e.splay*.5*ease)-e.hipL.rotation.x)*Math.min(1,dt*12);e.hipR.rotation.x+=((e.splay*.35*ease)-e.hipR.rotation.x)*Math.min(1,dt*12);
      e.hipL.rotation.z=-e.splay*.25*ease;e.hipR.rotation.z=e.splay*.25*ease}
    if(e.torso){e.torso.rotation.x*=Math.exp(-dt*8);e.torso.rotation.z*=Math.exp(-dt*8);e.torso.rotation.y*=Math.exp(-dt*8)}
    if(e.armR)e.armR.rotation.x+=(1.2-e.armR.rotation.x)*Math.min(1,dt*8);
  }
  g.position.y=.2*ease-(e.dieT>3.8?(e.dieT-3.8)*.5:0);
  for(const m of e.mats)m.emissive.setRGB(0,0,0);
}
