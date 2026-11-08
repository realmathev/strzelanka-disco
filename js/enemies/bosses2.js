// Bossowie poziomów 3-6 (pule w table.js): Sołtys (dyskoteka), Dyżurny Ruchu (dworzec), Szef Stacji (stacja paliw). Każdy: 3 fazy, własny model,
// ataki z zapowiedzią, XP 170-190, nagroda. Silnik akcji i fazy: boss.js (wzorzec: bosses.js).
import {S} from '../core/state.js';
import {rand,clamp,pick} from '../core/util.js';
import {DS} from '../core/ds.js';
import {sfx} from '../audio/sfx.js';
import {addFloater,announce} from '../render/comicfx.js';
import {P} from '../player/player.js';
import {humanBase} from './kit.js';
import {moveDir,stopMove,noise,hitPlayer} from './ai.js';
import {throwProj,shockwave,beam,explode,puddle,igniteFuel,stunPlayer} from './proj.js';
import {addBossBar,animateBoss,bossOnHit,bossBeforeHit,bossThink,bossAttack,summon} from './boss.js';
import * as nav from './nav.js';
import {makeHuman,reg,wv,aiOpts,SKIN} from './common.js';
import {eachPlayer,isDone,hitOnce,isLocal} from './players.js';
import {L} from '../core/i18n.js';

const MZ=new THREE.Vector3(),H=new THREE.Vector3();
const aliveOf=t=>{let n=0;if(S.G)for(const e of S.G.enemies)if(e.alive&&e.type===t)n++;return n};
const distP=e=>Math.hypot(P.pos.x-e.g.position.x,P.pos.z-e.g.position.z);
const above=(e,txt,color,size=36)=>addFloater(txt,{world:e.g.localToWorld(new THREE.Vector3(0,3.2,0)),size,life:.9,color,vy:-20});
const knockDir=(x,z,k)=>DS.player.knock({x:x*k*.7,z:z*k*.7});

/* ---------- wspólne: szarża bossa (zapowiedź → rozpęd → trafienie / ściana = okno obrażeń) ---------- */
function chargeStart(e,ctx){const a=e.ai;a.hitDone=false;a.dx=ctx.nx;a.dz=ctx.nz;a.vulnT=0;sfx('e_rev',0)}
function chargeRun(e,dt,ctx,o){
  const a=e.ai;
  if(a.vulnT>0){stopMove(e,dt);e.vuln=true;e.lean=.2;e.glow=0;a.vulnT-=dt;if(a.vulnT<=0){e.vuln=false;return true}return false}   // wjechał w mur: odsłonięty
  if(a.st<o.wind){
    stopMove(e,dt);e.lean=-.3;e.glow=.12+.1*Math.sin(a.st*40);
    if(a.st<o.wind-.25){a.dx=ctx.nx;a.dz=ctx.nz}                                         // celuje do ostatniej chwili, potem tor zablokowany
    a.face=2;a.faceYaw=Math.atan2(-a.dx,-a.dz);
    if(Math.floor(a.st*5)!==Math.floor((a.st-dt)*5))sfx('e_rev',a.st/o.wind);
    return false;
  }
  e.glow=0;e.lean=.6;e.armT=-.4;
  const p=e.g.position,px=p.x,pz=p.z;
  moveDir(e,dt,a.dx,a.dz,o.speed);
  eachPlayer((k,tgt)=>{if(isDone(a,'hitDone',k)||!((tgt?ctx.dist:distP(e))<o.hitR)||S.G.dead||!(P.pos.y<1.3))return;hitOnce(a,'hitDone',k);if(hitPlayer(e,e.dmg*o.dmg)){knockDir(a.dx,a.dz,o.knock);sfx(o.snd||'e_crash');if(isLocal(k))S.G.shake+=1}});
  if(a.st>o.wind+.45&&Math.hypot(p.x-px,p.z-pz)<o.speed*dt*.3){a.vulnT=o.stun||2.2;sfx('e_crash');S.G.shake+=.8;noise(e,30);return false}
  return a.st>=o.wind+o.dur||(a.hitDone&&a.st>o.wind+.5);
}

/* ---------- wspólne: pasy zagrożenia z zapowiedzią i przejazdem (skład, drezyna) ---------- */
function laneAdd(e,ox,oz,ux,uz,o){
  const a=e.ai;(a.lanes||(a.lanes=[])).push(Object.assign({ox,oz,ux,uz,t:0,hit:false,go:false,done:false,tb:beam(),sb:null},o));
  (e.beams||(e.beams=[])).push(a.lanes[a.lanes.length-1].tb);
}
/** Aktualizuje pasy; zwraca true, dopóki któryś jest aktywny. */
function laneTick(e,dt){
  const a=e.ai;let live=false;
  for(const L of a.lanes||[]){
    if(L.done)continue;L.t+=dt;live=true;
    const ex=L.ox+L.ux*L.len,ez=L.oz+L.uz*L.len;
    if(L.t<L.tele){const k=L.t/L.tele;L.tb.set(L.ox,.06,L.oz,ex,.06,ez,L.w,Math.sin(L.t*(12+k*24))>0?0xff3030:0xffffff,.25+.4*k,.05);continue}
    if(!L.go){L.go=true;L.tb.set(L.ox,.06,L.oz,ex,.06,ez,L.w,0xff3030,.22,.05);L.sb=beam();e.beams.push(L.sb);sfx(L.snd||'e_chug')}
    const s=(L.t-L.tele)*L.speed,a0=Math.max(0,s-L.seg),a1=Math.min(L.len,s);
    if(a0>=L.len){L.done=true;L.tb.release();L.sb.release();continue}
    L.sb.set(L.ox+L.ux*a0,L.h/2+.05,L.oz+L.uz*a0,L.ox+L.ux*a1,L.h/2+.05,L.oz+L.uz*a1,L.w,L.color,.95,L.h);
    eachPlayer(k=>{            // co-op: pas trafia każdego gracza na torze (raz)
      if(isDone(L,'hit',k)||S.G.dead)return;
      const px=P.pos.x-L.ox,pz=P.pos.z-L.oz,al=px*L.ux+pz*L.uz,lat=px*L.uz-pz*L.ux;
      if(Math.abs(lat)<L.w/2+.35&&al>a0-.3&&al<a1+.3&&P.pos.y<L.h-.15){hitOnce(L,'hit',k);if(hitPlayer(e,e.dmg*L.dmg)){const sg=lat>=0?1:-1;knockDir(L.uz*sg,-L.ux*sg,13);if(isLocal(k))S.G.shake+=1}}
    });
  }
  return live;
}
function laneEnd(e){const a=e.ai;if(e.beams)e.beams.forEach(b=>b.release());e.beams=null;a.lanes=null}

/* ======================= SOŁTYS ======================= */
function buildSoltys(P_,meta,v){
  const k=1.3;
  humanBase(P_,meta,{skin:v.skin,shirt:0xf1ece0,pants:0x3b3f2c,sleeve:0xf1ece0,shoes:0x2f5f2a,pose:'down',k,armSep:true});
  const hy=meta.headY;
  P_.body.sph(0xf1ece0,.27,0,1.12,-.06,{kz:.85,ky:.85,t:.05});                                      // brzuch
  P_.body.box(0x5a3b24,.47*k,.3,.272,0,1.4,0,{t:.03});P_.body.box(0xf1ece0,.1,.3,.277,0,1.4,0,{t:0});   // kamizelka
  for(const s of [-1,1])P_.body.limb(0x3a2a1a,s*.15,1.55,-.14,s*.13,1.0,-.12,.014,.014,{t:0});       // szelki
  P_.body.limb(0xf4f4f4,-.25,1.56,-.15,.27,1.02,-.15,.05,.05,{t:.02});P_.body.limb(0xd3242a,-.25,1.56,-.17,.27,1.02,-.17,.022,.022,{t:0});   // szarfa biało-czerwona
  P_.body.box(0xc9a227,.09,.06,.02,0,.99,-.13,{t:0});                                                // sprzączka
  for(const [L,sx] of [[P_.legL,-1],[P_.legR,1]])L.limb(0x2f5f2a,sx*meta.hipX*1.05,.52,-.01,sx*meta.hipX*1.09,.04,0,.085,.07,{t:.02});   // gumowce
  P_.head.box(0x6b4a2a,.15,.035,.03,0,hy-.055,-.13,{t:0});P_.head.box(0x6b4a2a,.1,.015,.02,0,hy+.05,-.12,{t:0});   // wąsy, brwi
  P_.head.cyl(0xd9b860,.21,.21,.014,0,hy+.1,0,{t:.04},16);P_.head.cyl(0xd9b860,.11,.12,.1,0,hy+.15,0,{t:.04},14);P_.head.cyl(0xb02a2a,.122,.122,.025,0,hy+.115,0,{t:0},14);   // kapelusz słomkowy
  // widły w prawej ręce (część osobnej ręki)
  const hx=meta.shoulder.x+.04;
  P_.arm.limb(0x6b4a2a,hx,.6,-.07,hx,1.78,-.07,.02,.02,{t:.04});P_.arm.box(0x9a9aa2,.22,.025,.03,hx,1.8,-.07,{t:.05});
  for(const dx of [-.095,0,.095])P_.arm.limb(0x9a9aa2,hx+dx,1.8,-.07,hx+dx,2.02,-.07,.012,.006,{t:.05});
}
const SO_PHASES=[
  {at:.66,title:L('WYBORY SOŁTYSA!','VILLAGE ELECTION!'),sub:L('Pijacy głosują za sołtysem','The drunks vote for the Village Head'),onEnter:e=>{summon(e,'pijak',3)}},
  {at:.33,title:L('ŻNIWA!','HARVEST TIME!'),sub:L('Sołtys wsiada w ciągnik','The Village Head climbs onto his tractor'),onEnter:e=>{summon(e,'dres',2)}},
];
const soPick=e=>{
  const d=distP(e),pj=aliveOf('pijak');
  if(e.phase===1)return d<5?'fork':pick(['milk','milk','fork']);
  const l=e.phase===2?['milk','fork','call','quorum','milk']:['tractor','milk','tractor','fork','call','quorum'];
  let k=pick(l);if(k==='call'&&pj>=3)k='milk';if(k==='quorum'&&e.quorum>0)k='milk';if(k==='fork'&&d>9)k='milk';return k;
};
const SO_ACT={
  milk:{start(e){const a=e.ai;a.did=false;a.kind=Math.random()<.5?'milk':'bimber'},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.4*Math.min(1,a.st/.7);e.lean=-.25;
      if(a.st>=.7&&!a.did){a.did=true;e.armR.localToWorld(H.set(.04,-.1,-.2));sfx('e_throw');
        const n=e.phase>=3?5:3;for(let i=0;i<n;i++){const o=(i-(n-1)/2)*2.3;throwProj(a.kind,H,P.pos.x+ctx.nz*o+P.vel.x*.3,P.pos.y+.9,P.pos.z-ctx.nx*o+P.vel.z*.3,{speed:14,dmg:e.dmg*.8,owner:e})}
        e.armT=.8;e.lean=.5}
      return a.st>=1.3},cool:e=>e.phase>=3?rand(1,1.6):rand(1.6,2.4)},
  fork:{start(e,ctx){const a=e.ai;a.did=false;a.dx=ctx.nx;a.dz=ctx.nz},
    run(e,dt,ctx){const a=e.ai;a.face=1;
      if(a.st<.55){stopMove(e,dt);e.armT=-2.1*(a.st/.55);e.lean=-.3;a.dx=ctx.nx;a.dz=ctx.nz;return false}
      if(a.st<.85)moveDir(e,dt,a.dx,a.dz,10);else stopMove(e,dt);
      if(a.st>=.8&&!a.did){a.did=true;sfx('e_whoosh');e.armT=-1.45;e.lean=.7;if(ctx.dist<3.2&&hitPlayer(e,e.dmg*1.4)){knockDir(ctx.nx,ctx.nz,13);sfx('e_shove')}}
      return a.st>=1.4},cool:e=>rand(1,1.7)},
  call:{start(e){e.ai.did=false},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.7;e.lean=-.1;e.glow=.12;
      if(a.st>.8&&!a.did){a.did=true;sfx('e_oink');above(e,L('GŁOSOWANIE!','ALL IN FAVOUR!'),'#ffd34a');summon(e,'pijak',e.phase>=3?3:2)}
      return a.st>=1.5},cool:e=>rand(3.5,5)},
  quorum:{start(e){e.quorum=4;sfx('e_sting');above(e,L('KWORUM!','QUORUM!'),'#9fd3ea',40)},
    run(e,dt,ctx){stopMove(e,dt);e.armT=-2.7;return e.ai.st>=1.0},cool:e=>rand(2,3)},
  tractor:{start(e,ctx){chargeStart(e,ctx);above(e,'BRRRM!','#ffe14a',44)},
    run(e,dt,ctx){return chargeRun(e,dt,ctx,{wind:1.0,speed:14,dur:1.7,hitR:2.3,dmg:1.8,knock:16,stun:2.4})},end(e){e.vuln=false;e.glow=0},cool:e=>rand(2,3)},
};
function animateSoltys(e,dt){animateBoss(e,dt);if(e.quorum>0){e.quorum-=dt;e.glow=Math.max(e.glow,.14)}}
reg('boss_soltys',L('Sołtys','Village Head'),(o={})=>{
  const w=o.wave||0,si=3;
  const e=makeHuman({key:'soltys',build:(P_,m)=>buildSoltys(P_,m,{skin:SKIN[si]}),meta:{arm:true},boss:true,hp:wv(620,55,w),dmg:wv(13,1,w),radius:.8,scale:1.3,name:L('Sołtys','Village Head'),xp:175,
    cfg:{speed:wv(2.7,.04,w),turn:5,sight:70,fov:3.4,range:[3,26],melee:false,flank:0,cover:0,fleeHp:0,holdGround:true,hear:80,lose:8,
      decide(e){return bossThink(e,SO_PHASES)},
      attack(e,dt,ctx){bossAttack(e,dt,ctx,SO_ACT,soPick,{dmin:5,dmax:13})},
      animate:animateSoltys,
      beforeHit(e,ev){bossBeforeHit(e,ev);if(e.quorum>0&&ev.dmg>0){ev.dmg*=.2;sfx('e_block')}},onHit:bossOnHit},
    opts:aiOpts(o),setup(e){e.phase=1;e.invulT=0;e.quorum=0}});
  addBossBar(e,2.6,1.9);return e;
},{drops:[{kind:'med',p:1},{kind:'zubr',p:.8},{kind:'kebab',p:.5}],tableTags:['boss'],
  onKill(e){announce(L('SOŁTYS PADA!','THE VILLAGE HEAD IS DOWN!'),L('Wiec rozwiązany','Meeting adjourned'))}});

/* ======================= DYŻURNY RUCHU ======================= */
function buildDyzurny(P_,meta,v){
  const k=1.15;
  humanBase(P_,meta,{skin:v.skin,shirt:0x1f2d4d,pants:0x1b2438,sleeve:0x1f2d4d,shoes:0x15110e,pose:'down',k,armSep:true});
  const hy=meta.headY;
  P_.body.box(0xdfe6ea,.14,.12,.02,0,1.52,-.125,{t:0});                                              // kołnierzyk koszuli
  for(const s of [-1,1])for(let i=0;i<4;i++)P_.body.sph(0xd8dbe0,.013,s*.05,1.46-i*.1,-.131,{t:0});  // guziki
  P_.body.box(0xeeeeee,.37*k,.05,.235,0,1.06,0);P_.body.box(0xc9a227,.06,.05,.02,0,1.06,-.125,{t:0});   // pas z klamrą
  for(const s of [-1,1])P_.body.box(0xc9a227,.1,.02,.07,s*.2,1.55,0,{t:0});                           // naramienniki
  P_.body.box(0x5a3b24,.1,.22,.28,-.3,.96,0,{t:.03});P_.body.limb(0x3a2a1a,.2,1.56,-.13,-.3,1.05,-.1,.02,.02,{t:0});   // torba na pasku
  P_.body.limb(0xcfd3d8,-.18,1.5,-.13,-.1,1.3,-.14,.006,.006,{t:0});P_.body.sph(0xcfd3d8,.026,-.1,1.29,-.14,{t:0});    // gwizdek na łańcuszku
  P_.head.cyl(0xd3242a,.118,.128,.09,0,hy+.095,0);P_.head.cyl(0xd3242a,.14,.12,.03,0,hy+.145,0,{t:.04},12);   // czerwona czapka dyżurnego
  P_.head.cyl(0x1f2d4d,.13,.13,.03,0,hy+.065,0,{t:0});P_.head.box(0x111111,.14,.012,.09,0,hy+.06,-.14,{t:0});P_.head.sph(0xffd34a,.018,0,hy+.115,-.125,{t:0});
  P_.head.box(0x15110e,.1,.02,.02,0,hy-.06,-.125,{t:0});                                             // wąsik
  // lizak (tarcza sygnałowa) w prawej ręce
  const hx=meta.shoulder.x+.04;
  P_.arm.limb(0xf4efe4,hx,.6,-.07,hx,1.68,-.07,.016,.016,{t:.05});
  P_.arm.cyl(0xd3242a,.17,.17,.03,hx,1.8,-.07,{rx:Math.PI/2,t:.04},18);P_.arm.cyl(0xf4efe4,.1,.1,.034,hx,1.8,-.07,{rx:Math.PI/2,t:0},18);
}
const DY_PHASES=[
  {at:.66,title:L('OPÓŹNIENIE POCIĄGU!','TRAIN DELAYED!'),sub:L('Drezyna wjeżdża na tor','A handcar rolls onto the track'),onEnter:e=>{summon(e,'ochroniarz',1);summon(e,'kamikadze',1)}},
  {at:.33,title:L('ROZJAZDY!','JUNCTION!'),sub:L('Tory krzyżują się na tobie','All tracks lead to you'),onEnter:e=>{summon(e,'dres',2);summon(e,'snajper',1)}},
];
const dyPick=e=>{
  const d=distP(e);
  if(d<4.5&&Math.random()<.6)return 'lizak';
  if(e.phase===1)return pick(['sklad','sklad','gwizdek']);
  if(e.phase===2)return pick(['sklad','drezyna','gwizdek','drezyna']);
  return pick(['rozjazd','drezyna','sklad','gwizdek','rozjazd']);
};
const dirTo=(ang)=>[Math.sin(ang),Math.cos(ang)];
const DY_ACT={
  sklad:{start(e,ctx){const a=e.ai;laneEnd(e);sfx('e_horn');
      const ang=Math.atan2(ctx.nx,ctx.nz)+(Math.random()<.5?1:-1)*(Math.PI/2+rand(-.35,.35)),[ux,uz]=dirTo(ang),LN=34;
      laneAdd(e,P.pos.x-ux*LN/2,P.pos.z-uz*LN/2,ux,uz,{len:LN,w:3,h:2.8,seg:9,speed:38,tele:e.longTele?1.5:(e.phase>=3?1.0:1.25),dmg:1.3,color:0x5b6b8a});
      e.longTele=0;above(e,L('SEMAFOR!','RED SIGNAL!'),'#ff5a4a')},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.4;e.glow=.1+.1*Math.sin(a.st*28);return !laneTick(e,dt)},end(e){laneEnd(e);e.glow=0},cool:e=>rand(1.6,2.4)},
  drezyna:{start(e,ctx){laneEnd(e);sfx('e_horn');const [ux,uz]=[ctx.nx,ctx.nz],LN=36;
      laneAdd(e,e.g.position.x-ux*2,e.g.position.z-uz*2,ux,uz,{len:LN,w:2,h:.9,seg:4.2,speed:21,tele:e.longTele?1.5:.95,dmg:1.1,color:0xb05a1a});
      e.longTele=0;above(e,L('DREZYNA!','HANDCAR!'),'#ffb12a')},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-1.6;e.glow=.08;return !laneTick(e,dt)},end(e){laneEnd(e);e.glow=0},cool:e=>rand(1.6,2.4)},
  rozjazd:{start(e,ctx){laneEnd(e);sfx('e_horn');const base=Math.atan2(ctx.nx,ctx.nz),LN=34;
      for(const s of [-1,1]){const [ux,uz]=dirTo(base+s*.75);laneAdd(e,P.pos.x-ux*LN/2,P.pos.z-uz*LN/2,ux,uz,{len:LN,w:2.4,h:2.2,seg:9,speed:36,tele:1.5,dmg:1.2,color:0x6b5b8a})}
      above(e,L('ROZJAZD!','SWITCH!'),'#ff5a4a',42)},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.6;e.glow=.1+.1*Math.sin(a.st*30);return !laneTick(e,dt)},end(e){laneEnd(e);e.glow=0},cool:e=>rand(2,3)},
  gwizdek:{start(e){e.ai.did=false;sfx('e_horn')},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.lean=-.15;e.armT=-2.6;e.glow=a.st<.85?.1+.15*Math.sin(a.st*35):0;
      if(a.st>=.85&&!a.did){a.did=true;sfx('e_whistle');noise(e,40);
        let heard=false;
        eachPlayer((k,tgt)=>{if((tgt?ctx.dist:distP(e))<28&&nav.gridLos(e.g.position.x,e.g.position.z,P.pos.x,P.pos.z)){heard=true;stunPlayer(1.8);hitPlayer(e,e.dmg*.35);if(isLocal(k))S.G.shake+=1.5;addFloater(L('DZWONI W USZACH!','EARS RINGING!'),{world:new THREE.Vector3(P.pos.x,1.7,P.pos.z),size:30,life:1,color:'#ffe14a',vy:-20})}});
        if(!heard)above(e,L('FIIIU!','FWEEEET!'),'#cfd3d8',30);
        e.armT=.5}
      if(a.st>=1.5){if(e.phase>=2&&!e.forceAct){e.forceAct=Math.random()<.5?'drezyna':'sklad';e.longTele=1}return true}return false},cool:e=>rand(2,3)},
  lizak:{start(e){e.ai.did=false},
    run(e,dt,ctx){const a=e.ai;a.face=1;stopMove(e,dt);
      if(a.st<.5){e.armT=-2.0*(a.st/.5);e.lean=-.3}
      else if(!a.did){a.did=true;sfx('e_whoosh');e.armT=1.0;e.lean=.7;if(ctx.dist<3.4&&hitPlayer(e,e.dmg*1.2)){knockDir(ctx.nx,ctx.nz,12);sfx('e_shove')}}
      return a.st>=1.1},cool:e=>rand(.8,1.4)},
};
reg('boss_dyzurny',L('Dyżurny Ruchu','Station Dispatcher'),(o={})=>{
  const w=o.wave||0,si=0;
  const e=makeHuman({key:'dyzurny',build:(P_,m)=>buildDyzurny(P_,m,{skin:SKIN[si]}),meta:{arm:true},boss:true,hp:wv(600,55,w),dmg:wv(14,1,w),radius:.7,scale:1.32,name:L('Dyżurny Ruchu','Station Dispatcher'),xp:180,
    cfg:{speed:wv(2.9,.04,w),turn:6,sight:70,fov:3.6,range:[3,30],melee:false,flank:0,cover:0,fleeHp:0,holdGround:true,hear:80,lose:8,
      decide(e){return bossThink(e,DY_PHASES)},
      attack(e,dt,ctx){bossAttack(e,dt,ctx,DY_ACT,dyPick,{dmin:8,dmax:16})},
      animate:animateBoss,beforeHit:bossBeforeHit,onHit:bossOnHit},
    opts:aiOpts(o),setup(e){e.phase=1;e.invulT=0}});
  addBossBar(e,2.6,1.9);return e;
},{drops:[{kind:'vest',p:1},{kind:'med',p:.9},{kind:'adrenaline',p:.5}],tableTags:['boss'],
  onKill(e){announce(L('DYŻURNY PADA!','THE DISPATCHER IS DOWN!'),L('Pociąg odjeżdża bez niego','The train leaves without him'))}});

/* ======================= SZEF STACJI ======================= */
function buildSzefStacji(P_,meta,v){
  const k=1.28;
  humanBase(P_,meta,{skin:v.skin,shirt:0xe8731a,pants:0xe8731a,sleeve:0xe8731a,shoes:0x1c1c1c,hand:0x2b2b30,pose:'aim',k,armSep:true});
  const hy=meta.headY;
  for(const y of [1.3,1.1])P_.body.box(0xdfe6ea,.46*k,.03,.275,0,y,0,{t:0});                          // odblaski
  P_.body.box(0x0b0b0b,.37*k,.05,.24,0,1.02,0);P_.body.box(0xd3242a,.15,.075,.02,.13,1.46,-.135,{t:0});P_.body.box(0xffffff,.1,.02,.022,.13,1.46,-.137,{t:0});   // pas, logo PALIWEX
  P_.body.box(0xe8731a,.5*k,.06,.27,0,1.55,0,{t:.02});                                                // kołnierz
  for(const [L,sx] of [[P_.legL,-1],[P_.legR,1]]){L.cyl(0xdfe6ea,.083,.08,.035,sx*meta.hipX*1.05,.52,-.01,{t:0});L.cyl(0xdfe6ea,.078,.075,.03,sx*meta.hipX*1.02,.78,-.005,{t:0})}   // odblaski na nogach
  P_.body.box(0xd3242a,.3,.38,.16,0,1.28,.2,{t:.03});P_.body.box(0x15110e,.1,.04,.1,0,1.5,.2,{t:0});    // kanister-plecak
  P_.body.limb(0x15110e,.1,1.2,.27,.3,.9,.18,.02,.02,{t:0});P_.body.limb(0x15110e,.3,.9,.18,.34,.7,-.08,.02,.02,{t:0});   // wąż
  P_.head.sph(0xf2c200,.125,0,hy+.07,0,{ky:.75,kz:1.1,t:.05});P_.head.cyl(0xf2c200,.145,.145,.015,0,hy+.07,0,{t:.04},14);   // kask
  P_.head.box(0xd9a800,.03,.02,.2,0,hy+.19,0,{t:0});P_.head.box(0xffffff,.05,.03,.02,0,hy+.12,-.13,{t:0});
  P_.head.box(0x15110e,.2,.045,.02,0,hy+.02,-.122,{t:0});P_.head.box(0x2b2b2e,.14,.04,.02,0,hy-.075,-.12,{t:0});   // gogle, zarost
  // pistolet do tankowania w prawej ręce (kierunek −Z w układzie ręki; wylot: (-.1,-.04,-1.02))
  const hx=meta.shoulder.x-.1,hy2=1.46-.1;
  P_.arm.box(0x15110e,.045,.12,.05,hx,hy2-.07,-.45,{rx:.2,t:.05});P_.arm.box(0xf2c200,.07,.1,.24,hx,hy2+.01,-.62,{t:.05});
  P_.arm.limb(0xb0b4ba,hx,hy2+.03,-.74,hx,hy2+.05,-1.02,.02,.016,{t:.05});P_.arm.limb(0x15110e,hx,hy2-.02,-.5,hx+.05,hy2-.3,-.1,.018,.018,{t:0});
}
const SS_PHASES=[
  {at:.66,title:L('DOSTAWA PALIWA!','FUEL DELIVERY!'),sub:L('Kierowca wjeżdża na stację','A driver pulls into the station'),onEnter:e=>{summon(e,'kierowca',1)}},
  {at:.33,title:L('ZBIORNIK POD CIŚNIENIEM!','TANK UNDER PRESSURE!'),sub:L('Szef nie żałuje benzyny','The boss isn\'t stingy with the petrol'),onEnter:e=>{summon(e,'kamikadze',2)}},
];
const ssPick=e=>{
  const d=distP(e);
  if(e.phase===1)return pick(['strumien','kanister','strumien']);
  const l=e.phase===2?['strumien','kanister','kanister','call']:['strumien','kanister','pump','call','pump'];
  let k=pick(l);if(k==='call'&&aliveOf('kierowca')>=1)k='kanister';if(k==='pump'&&d>9)k='strumien';return k;
};
const ssMuzzle=e=>e.armR.localToWorld(MZ.set(-.1,-.04,-1.02));
const SS_ACT={
  strumien:{start(e,ctx){const a=e.ai;a.ang=Math.atan2(ctx.nx,ctx.nz);a.dropT=0;a.hissT=0;sfx('e_hiss')},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-.05;e.lean=-.05;
      if(a.st<.5){e.glow=.08;return false}
      const T=a.st-.5,dur=e.phase>=3?2.2:1.8;
      let d=Math.atan2(ctx.nx,ctx.nz)-a.ang;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;a.ang+=clamp(d,-1.3*dt,1.3*dt);
      const len=Math.min(Math.max(ctx.dist+1,5),3+T*9),ux=Math.sin(a.ang),uz=Math.cos(a.ang);
      ssMuzzle(e);const ex=e.g.position.x+ux*len,ez=e.g.position.z+uz*len;
      if(!e.beams)e.beams=[beam()];
      e.beams[0].set(MZ.x,MZ.y,MZ.z,ex,.12,ez,.07,0xe8d070,.75);
      if((a.dropT-=dt)<=0){a.dropT=.13;puddle(ex,ez,{r:.9,life:9,dmg:0,kind:'fuel',fdmg:e.dmg*.3})}
      if((a.hissT-=dt)<=0){a.hissT=.35;sfx('e_hiss')}
      return T>=dur},
    end(e){if(e.beams)e.beams.forEach(b=>b.release());e.beams=null;if(!e.forceAct)e.forceAct='podpal'},cool:e=>rand(.4,.8)},
  podpal:{start(e){e.ai.did=false;above(e,L('ZAPAŁKA!','MATCH STRUCK!'),'#ff8a3a',34)},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-.05;const thr=e.phase>=3?.7:1.1;
      if(a.st<thr)e.glow=.15+.1*Math.sin(a.st*30);
      else if(!a.did){a.did=true;e.glow=0;igniteFuel(.1)}
      return a.st>=thr+.7},cool:e=>rand(1.2,2)},
  kanister:{start(e){e.ai.did=false},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.4*Math.min(1,a.st/.7);e.lean=-.25;
      if(a.st>=.7&&!a.did){a.did=true;e.armR.localToWorld(H.set(.04,-.1,-.2));sfx('e_throw');
        const n=e.phase>=2?3:2;for(let i=0;i<n;i++){const o=(i-(n-1)/2)*2.8;throwProj('jerry',H,P.pos.x+ctx.nz*o+P.vel.x*.3,P.pos.y+.6,P.pos.z-ctx.nx*o+P.vel.z*.3,{speed:14,dmg:e.dmg*.9,ignite:e.phase>=2,owner:e})}
        e.armT=.8;e.lean=.5}
      return a.st>=1.3},cool:e=>e.phase>=3?rand(1.1,1.8):rand(1.6,2.4)},
  pump:{start(e){e.ai.did=false;sfx('e_sting');above(e,L('UCIEKAJ!','RUN!'),'#ff3b30',44)},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.7;e.lean=-.2;e.glow=.1+.3*Math.min(1,a.st/1.4)*(0.6+.4*Math.sin(a.st*40));
      if(a.st>=1.4&&!a.did){a.did=true;e.glow=0;explode(e.g.position.x,.6,e.g.position.z,{r:7,dmg:e.dmg*1.8,shake:1.4});shockwave(e.g.position.x,e.g.position.z,{speed:11,max:14,dmg:e.dmg*.9,color:0xff8a3a});igniteFuel(.1)}
      return a.st>=1.9},cool:e=>rand(2.5,3.5)},
  call:{start(e){e.ai.did=false},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.7;e.glow=.1;
      if(a.st>.8&&!a.did){a.did=true;sfx('e_horn');above(e,L('DOSTAWA!','DELIVERY!'),'#ffd34a');summon(e,'kierowca',1)}
      return a.st>=1.4},cool:e=>rand(4,6)},
};
reg('boss_szef_stacji',L('Szef Stacji','Station Boss'),(o={})=>{
  const w=o.wave||0,si=1;
  const e=makeHuman({key:'szefstacji',build:(P_,m)=>buildSzefStacji(P_,m,{skin:SKIN[si]}),meta:{arm:true},boss:true,hp:wv(700,60,w),dmg:wv(12,.9,w),radius:.8,scale:1.32,name:L('Szef Stacji','Station Boss'),xp:185,
    cfg:{speed:wv(2.7,.04,w),turn:5,sight:70,fov:3.4,range:[3,26],melee:false,flank:0,cover:0,fleeHp:0,holdGround:true,hear:80,lose:8,
      decide(e){return bossThink(e,SS_PHASES)},
      attack(e,dt,ctx){bossAttack(e,dt,ctx,SS_ACT,ssPick,{dmin:6,dmax:14})},
      animate:animateBoss,beforeHit:bossBeforeHit,onHit:bossOnHit},
    opts:aiOpts(o),setup(e){e.phase=1;e.invulT=0}});
  addBossBar(e,2.6,1.9);return e;
},{drops:[{kind:'med',p:1},{kind:'vest',p:.8},{kind:'adrenaline',p:.6}],tableTags:['boss'],
  onKill(e){announce(L('SZEF STACJI PADA!','THE STATION BOSS IS DOWN!'),L('Stacja zamknięta do odwołania','Station closed until further notice'))}});
