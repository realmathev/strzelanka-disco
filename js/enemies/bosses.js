// Bossowie z fazami (pełne: DJ, Jednooki Bandyta, Szef Ochrony; reszta w szkicu na końcu pliku).
// Boss poziomu: DS.enemies.table(levelId, fala).boss.pick(fala); po fali 5, 10, 15… (co `boss.every`) waves.js woła makeEnemy(true).
import {S} from '../core/state.js';
import {rand,clamp,pick} from '../core/util.js';
import {DS} from '../core/ds.js';
import {sfx} from '../audio/sfx.js';
import {addFloater,announce} from '../render/comicfx.js';
import {P} from '../player/player.js';
import {humanBase} from './kit.js';
import {fireAt,moveDir,moveToward,stopMove,noise,hitPlayer,facePlayer} from './ai.js';
import {throwProj,shockwave,beam,explode} from './proj.js';
import {addBossBar,animateBoss,bossOnHit,bossThink,bossAttack,summon} from './boss.js';
import {shieldHit} from './ochroniarz.js';
import {makeHuman,reg,wv,aiOpts,SKIN} from './common.js';

const MZ=new THREE.Vector3(),H=new THREE.Vector3();

/* ======================= DJ ======================= */
function buildDJ(P_,meta,v){
  humanBase(P_,meta,{skin:v.skin,shirt:0xc9ccd6,pants:0x15110e,sleeve:0xc9ccd6,shoes:0xf4efe4,pose:'down',k:1.15,armSep:true});
  const hy=meta.headY;
  for(const s of [-1,1])P_.body.box(0xff4fd8,.07,.34,.014,s*.1,1.4,-.13,{t:0});                  // klapy marynarki
  for(let i=0;i<14;i++)P_.body.box(i%2?0xffd34a:0xffffff,.025,.025,.01,rand(-.2,.2),1.2+rand(0,.3),-.13,{t:0});   // cekiny
  P_.body.limb(0xffd34a,-.12,1.55,-.12,0,1.34,-.15,.014,.014,{t:0});P_.body.limb(0xffd34a,.12,1.55,-.12,0,1.34,-.15,.014,.014,{t:0});
  for(const [L,sx] of [[P_.legL,-1],[P_.legR,1]])L.limb(0xff4fd8,sx*(meta.hipX+.094),.88,0,sx*(meta.hipX*1.06+.072),.12,0,.011,.011,{t:0});   // lampasy
  // słuchawki: pałąk i muszle
  const arc=[[-.14,hy,0],[-.125,hy+.12,0],[-.05,hy+.18,0],[.05,hy+.18,0],[.125,hy+.12,0],[.14,hy,0]];
  for(let i=0;i<arc.length-1;i++)P_.head.limb(0xff4fd8,...arc[i],...arc[i+1],.015,.015,{t:.05});
  for(const s of [-1,1]){P_.head.cyl(0xff4fd8,.085,.085,.05,s*.14,hy,0,{rz:Math.PI/2,t:.05},12);P_.head.cyl(0x15110e,.07,.07,.02,s*.115,hy,0,{rz:Math.PI/2,t:0},12)}
  P_.head.box(0x39e0ff,.22,.05,.03,0,hy+.025,-.125,{t:0});                                       // okulary-wizjer
  // mikrofon w prawej ręce
  const hx=meta.shoulder.x+.04;
  P_.arm.cyl(0x15110e,.012,.012,.18,hx,.94+.1,-.07,null,6);P_.arm.sph(0x8a8a90,.04,hx,.94+.2,-.07,{t:.05});
}
reg('boss_dj','DJ',(o={})=>{
  const w=o.wave||0,si=1;
  const e=makeHuman({key:'dj',build:(P_,m)=>buildDJ(P_,m,{skin:SKIN[si]}),meta:{arm:true},boss:true,hp:wv(640,55,w),dmg:wv(13,1,w),radius:.7,scale:1.3,name:'DJ',xp:170,
    cfg:{speed:wv(2.9,.04,w),turn:6,sight:70,fov:3.6,range:[3,30],melee:false,flank:0,cover:0,fleeHp:0,holdGround:true,hear:80,lose:8,
      decide(e){return bossThink(e,DJ_PHASES)},
      attack(e,dt,ctx){bossAttack(e,dt,ctx,DJ_ACT,djPick,{dmin:10,dmax:17})},
      animate:animateBoss,onHit:bossOnHit},
    opts:aiOpts(o),setup(e){e.phase=1;e.invulT=0}});
  addBossBar(e,2.55,1.9);return e;
},{drops:[{kind:'med',p:1},{kind:'vest',p:.6},{kind:'adrenaline',p:.5}],tableTags:['boss'],
  onKill(e){announce('DJ ZAMILKŁ!','Cisza po basie');}});
const DJ_PHASES=[
  {at:.66,title:'REMIX!',sub:'DJ dokłada bitu i wzywa dresów',onEnter:e=>summon(e,'dres',2)},
  {at:.33,title:'DROP!',sub:'Lasery, bas i sanitariusz na backstage',onEnter:e=>{summon(e,'medyk',1);summon(e,'bandyta',1)}},
];
const djPick=e=>e.phase===1?pick(['bass','burst','burst']):e.phase===2?pick(['bass2','burst','bass']):pick(['laser','bass2','burst','laser']);
const wave1=(e,ctx)=>{shockwave(e.g.position.x,e.g.position.z,{speed:e.phase>=2?11:9,max:30,dmg:e.dmg*1.3,color:0xff4fd8})};
const DJ_ACT={
  bass:{start(e){sfx('e_bass');e.ai.did=false},run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.7*Math.min(1,a.st/.8);e.glow=.15+.1*Math.sin(a.st*30);
      if(a.st>=.8&&!a.did){a.did=true;wave1(e,ctx);e.armT=.7}return a.st>=1.3},cool:e=>e.phase>=2?rand(2,3):rand(3,4.2)},
  bass2:{start(e){e.ai.did=0},run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.7*Math.min(1,a.st/.8);e.glow=.2+.15*Math.sin(a.st*40);
      if(a.st>=.8&&a.did<1){a.did=1;wave1(e,ctx);e.armT=.7}
      if(a.st>=1.5&&a.did<2){a.did=2;wave1(e,ctx);e.armT=.7}
      return a.st>=2.0},cool:e=>rand(2,3)},
  burst:{run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-1.4;e.lean=-.1;
      const k=Math.floor(a.st/.22);
      if(k>a.n&&k<=4){a.n=k;e.armR.localToWorld(MZ.set(.0,-.35,-.1));fireAt(e,MZ,ctx.eye,{dmg:e.dmg*.7,acc:.55,color:0xff4fd8,tracers:1,vol:.8})}
      return a.st>=1.3},cool:e=>rand(1.3,2.2)},
  laser:{start(e){const a=e.ai;a.th=Math.atan2(P.pos.x-e.g.position.x,P.pos.z-e.g.position.z);a.dir=Math.random()<.5?-1:1;e.beams=[beam(),beam(),beam()];sfx('e_sting')},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.7;e.glow=.2;
      const live=a.st>1.2;if(live)a.th+=a.dir*.95*dt;
      e.beams.forEach((b,i)=>{const th=a.th+i*Math.PI*2/3,ex=e.g.position.x+Math.sin(th)*34,ez=e.g.position.z+Math.cos(th)*34;
        b.set(e.g.position.x,.9,e.g.position.z,ex,.9,ez,live?.14:.03,live?0xff4fd8:0xffffff,live?.85:.5);
        if(live&&!S.G.dead&&P.pos.y<1.4){const px=P.pos.x-e.g.position.x,pz=P.pos.z-e.g.position.z,ux=Math.sin(th),uz=Math.cos(th),t=px*ux+pz*uz,d=Math.abs(px*uz-pz*ux);
          if(t>0&&t<34&&d<.6&&(a.hitCd=(a.hitCd||0)-dt)<=0){a.hitCd=.45;hitPlayer(e,e.dmg*.55);sfx('hurt')}}});
      a.hitCd=(a.hitCd||0)-0;return a.st>=4.4},
    end(e){if(e.beams)e.beams.forEach(b=>b.release());e.beams=null},cool:e=>rand(2.5,3.5)},
};

/* ======================= JEDNOOKI BANDYTA ======================= */
function buildJednooki(P_,meta,v){
  humanBase(P_,meta,{skin:v.skin,shirt:0xf4efe4,pants:0x15110e,sleeve:0xf4efe4,shoes:0x15110e,pose:'aim',k:1.3,armSep:true});
  const hy=meta.headY,k=1.3;
  P_.body.box(0xc9a227,.46*k,.44,.265,0,1.32,0,{t:.03});                                           // złota kamizelka
  P_.body.box(0x15110e,.06,.44,.272,0,1.32,0,{t:0});
  P_.body.limb(0xffd34a,-.17,1.52,-.14,.18,1.28,-.14,.014,.014,{t:0});P_.body.sph(0xffd34a,.03,.18,1.28,-.145,{t:0});   // łańcuch zegarka
  P_.body.box(0xffd34a,.09,.07,.02,0,1.04,-.11,{t:0});                                                // sprzączka
  P_.head.box(0x15110e,.13,.1,.02,-.045,hy+.02,-.124,{t:0});                                          // przepaska na oku
  P_.head.limb(0x15110e,-.1,hy+.1,-.06,.1,hy+.14,.04,.008,.008,{t:0});
  P_.head.cyl(0x15110e,.15,.15,.012,0,hy+.09,0,{t:.05},14);P_.head.cyl(0x15110e,.095,.105,.15,0,hy+.17,0,{t:.05},14);   // melonik
  P_.head.cyl(0xd3242a,.098,.098,.04,0,hy+.13,0,{t:0},14);
  P_.head.limb(0x6b4a2a,.0,hy-.07,-.12,.06,hy-.06,-.24,.012,.012,{t:0});P_.head.sph(0xff7a1a,.012,.062,hy-.06,-.245,{t:0});   // cygaro
  // rewolwer (część prawej ręki): lufa, bęben, rękojeść
  const hx=meta.shoulder.x-.1,hy2=1.46-.1;
  P_.arm.limb(0x2b2b2e,hx,hy2+.02,-.5,hx,hy2+.06,-1.12,.026,.022,{t:.05});P_.arm.cyl(0x2b2b2e,.055,.055,.12,hx,hy2+.02,-.55,{rx:Math.PI/2,t:.05},10);P_.arm.box(0x6b4a2a,.05,.12,.07,hx,hy2-.07,-.44,{rx:.3,t:.05});
}
reg('boss_jednooki','Jednooki Bandyta',(o={})=>{
  const w=o.wave||0,si=2;
  const e=makeHuman({key:'jednooki',build:(P_,m)=>buildJednooki(P_,m,{skin:SKIN[si]}),meta:{arm:true},boss:true,hp:wv(560,52,w),dmg:wv(11,.9,w),radius:.75,scale:1.38,name:'Jednooki Bandyta',xp:180,
    cfg:{speed:wv(3.1,.04,w),turn:7,sight:70,fov:3.4,range:[3,26],melee:false,flank:0,cover:0,fleeHp:0,holdGround:true,hear:80,lose:8,
      decide(e){return bossThink(e,JO_PHASES)},
      attack(e,dt,ctx){bossAttack(e,dt,ctx,JO_ACT,joPick,{dmin:7,dmax:13})},
      animate:animateBoss,onHit:bossOnHit},
    opts:aiOpts(o),setup(e){e.phase=1;e.invulT=0}});
  addBossBar(e,2.5,1.9);return e;
},{drops:[{kind:'med',p:1},{kind:'vest',p:.6},{kind:'kebab',p:.5}],tableTags:['boss'],
  onKill(e){announce('JEDNOOKI PADA!','Wszystkie trzy siódemki na raz')}});
const JO_PHASES=[
  {at:.66,title:'ŻETONY!',sub:'Jednooki rzuca kasyno w ruch',onEnter:e=>{}},
  {at:.33,title:'JACKPOT!',sub:'Losuje trzy ataki naraz',onEnter:e=>summon(e,'bandyta',2)},
];
const joPick=e=>e.phase===1?pick(['sixgun','sixgun','sixgun']):e.phase===2?pick(['sixgun','chips','dash','chips']):pick(['jackpot','sixgun','jackpot','chips']);
const gunMuzzle=e=>e.armR.localToWorld(MZ.set(-.1,-.04,-1.12));
const JO_ACT={
  sixgun:{start(e){e.ai.n=0},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);
      if(a.n<6){e.armT=-.05;e.lean=-.08;
        if(a.st>=.5+a.n*.3){a.n++;gunMuzzle(e);fireAt(e,MZ,ctx.eye,{dmg:e.dmg,acc:.72,color:0xffd34a,snd:'enemyShot',tracers:1});e.armR.rotation.x-=.15}
        return false}
      // przeładowanie: luka w obronie (+35% obrażeń), ramię w górze
      e.vuln=true;e.armT=-1.3;e.lean=.1;
      if(a.st>=2.5+(e.phase>=3?0:.8)){e.vuln=false;return true}return false},end(e){e.vuln=false},cool:e=>e.phase>=3?rand(.7,1.2):rand(1.2,1.8)},
  chips:{run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-1.5;
      if(a.st>.5&&!a.did){a.did=true;e.armR.localToWorld(H.set(-.1,-.1,-.5));sfx('e_throw');
        for(let i=-1;i<=1;i++){throwProj('chip',H,P.pos.x+ctx.nz*i*2.2+P.vel.x*.4,P.pos.y+.9,P.pos.z-ctx.nx*i*2.2+P.vel.z*.4,{speed:15,dmg:e.dmg*.85})}}
      if(a.st>1.2){a.did=false;return true}return false},cool:e=>rand(1.5,2.2)},
  dash:{start(e,ctx){const a=e.ai;a.hitDone=false;const l=Math.hypot(P.pos.x-e.g.position.x,P.pos.z-e.g.position.z)||1;a.dx=(P.pos.x-e.g.position.x)/l;a.dz=(P.pos.z-e.g.position.z)/l;sfx('e_yell')},
    run(e,dt,ctx){const a=e.ai;e.armT=-.4;
      if(a.st<.5){stopMove(e,dt);e.glow=.2+.1*Math.sin(a.st*40);e.lean=-.3;a.face=2;a.faceYaw=Math.atan2(-a.dx,-a.dz);return false}   // zapowiedź: ugina się
      e.glow=0;e.lean=.7;moveDir(e,dt,a.dx,a.dz,11);
      if(!a.hitDone&&ctx.dist<1.9&&!S.G.dead){a.hitDone=true;if(hitPlayer(e,e.dmg*1.8)){P.vel.x+=a.dx*10;P.vel.z+=a.dz*10;sfx('e_shove')}}
      return a.st>=1.2||a.hitDone&&a.st>.7},cool:e=>rand(1.2,2)},
  jackpot:{start(e){const a=e.ai;const K=['SIÓDEMKA','DZWONEK','WIŚNIE','GWIAZDA'];a.reels=[pick(K),pick(K),pick(K)];if(Math.random()<.2)a.reels=[a.reels[0],a.reels[0],a.reels[0]];
      a.q=a.reels.slice();if(a.reels[0]===a.reels[1]&&a.reels[1]===a.reels[2])a.q=[a.reels[0],a.reels[0],a.reels[0],a.reels[0]];a.qi=0;
      addFloater(a.reels.join(' | '),{world:e.g.localToWorld(new THREE.Vector3(0,3.1,0)),size:34,life:1.6,color:'#ffe14a',vy:-10});
      if(a.q.length>3)announce('TRZY '+a.reels[0]+'!','Ataki x4');sfx('jackpot')},
    run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=-2.4;e.glow=.2+.15*Math.sin(a.st*25);
      if(a.st<1.0)return false;
      const idx=Math.floor((a.st-1.0)/.9);
      if(idx<a.q.length&&idx>=a.qi){a.qi=idx+1;doReel(e,a.q[idx],ctx)}
      return a.st>=1.0+a.q.length*.9+.2},end(e){e.glow=0},cool:e=>rand(1.8,2.6)},
};
function doReel(e,kind,ctx){
  switch(kind){
    case 'SIÓDEMKA':for(let i=0;i<3;i++)setTimeout(()=>{if(e.alive&&S.G){gunMuzzle(e);fireAt(e,MZ,P.pos.clone().setY(P.pos.y+1.5),{dmg:e.dmg*.8,acc:.8,color:0xffd34a,tracers:1})}},i*130);break;
    case 'DZWONEK':shockwave(e.g.position.x,e.g.position.z,{speed:10,max:26,dmg:e.dmg*1.2,color:0xffd34a});break;
    case 'WIŚNIE':e.armR.localToWorld(H.set(-.1,-.1,-.5));for(let i=-1;i<=1;i++)throwProj('chip',H,P.pos.x+ctx.nz*i*2.4,P.pos.y+.9,P.pos.z-ctx.nx*i*2.4,{speed:15,dmg:e.dmg*.8});sfx('e_throw');break;
    case 'GWIAZDA':summon(e,'dres',1);break;
  }
}

/* ======================= SZEF OCHRONY ======================= */
function buildSzef(P_,meta,v){
  humanBase(P_,meta,{skin:v.skin,shirt:0x14161b,pants:0x0e0f12,sleeve:0x14161b,shoes:0x0a0a0c,pose:'hands',k:1.3});
  const k=1.3,hy=meta.headY;
  P_.body.box(0xc8f000,.47*k,.3,.27,0,1.4,0,{t:.03});P_.body.box(0xdfe6ea,.48*k,.035,.275,0,1.34,0,{t:0});P_.body.box(0xdfe6ea,.48*k,.035,.275,0,1.47,0,{t:0});
  P_.body.box(0xffd34a,.07,.07,.02,.14,1.46,-.14,{t:0});                                              // złota gwiazda szefa
  P_.body.box(0x0b0b0b,.37*k,.05,.24,0,1.06,0);
  P_.head.cyl(0x14161b,.118,.123,.07,0,hy+.09,0);P_.head.sph(0x14161b,.116,0,hy+.095,0,{ky:.6,kz:1.1,t:.04});
  P_.head.box(0x111111,.13,.012,.08,0,hy+.075,-.125,{t:0});P_.head.box(0xffd34a,.04,.04,.012,0,hy+.115,-.125,{t:0});
  P_.head.box(0x15110e,.2,.05,.02,0,hy+.02,-.122,{t:0});                                              // przyciemniane okulary
  P_.body.box(0x86c5e6,.9,1.15,.04,-.02,1.1,-.5,{t:.03});P_.body.box(0x2b3540,.94,.05,.06,-.02,1.7,-.5,{t:0});P_.body.box(0x2b3540,.94,.05,.06,-.02,.55,-.5,{t:0});
  P_.body.box(0x2b3540,.05,1.2,.06,-.47,1.12,-.5,{t:0});P_.body.box(0x2b3540,.05,1.2,.06,.43,1.12,-.5,{t:0});
  P_.body.box(0xffffff,.6,.11,.012,-.02,1.3,-.525,{t:0});
}
reg('boss_szef_ochrony','Szef Ochrony',(o={})=>{
  const w=o.wave||0,si=0;
  const e=makeHuman({key:'szef',build:(P_,m)=>buildSzef(P_,m,{skin:SKIN[si]}),boss:true,hp:wv(720,62,w),dmg:wv(15,1.1,w),radius:.8,scale:1.33,name:'Szef Ochrony',xp:190,
    cfg:{speed:wv(2.7,.04,w),turn:3.2,sight:60,fov:3,range:[2,22],melee:true,flank:0,cover:0,fleeHp:0,holdGround:true,hear:70,lose:8,
      decide(e){return bossThink(e,SZ_PHASES)},
      attack(e,dt,ctx){bossAttack(e,dt,ctx,SZ_ACT,szPick,{dmin:3,dmax:9})},
      animate:animateBoss,onHit(e,ev){if(e.invulT>0){e.hp+=ev.dmg;return}shieldHit(e,ev,{front:.4,block:.9,back:.35})}},
    opts:aiOpts(o),setup(e){e.phase=1;e.invulT=0}});
  addBossBar(e,2.6,2);return e;
},{drops:[{kind:'vest',p:1},{kind:'med',p:1}],tableTags:['boss'],onKill(e){announce('SZEF OCHRONY PADA!','Tarcza pęka')}});
const SZ_PHASES=[
  {at:.66,title:'WZYWAM POSIŁKI!',sub:'Ochroniarze wchodzą na salę',onEnter:e=>summon(e,'ochroniarz',2)},
  {at:.33,title:'TRYB SZTURMOWY!',sub:'Szef nie hamuje',onEnter:e=>summon(e,'bandyta',2)},
];
const szPick=e=>e.phase===1?pick(['rush','bash','bash']):e.phase===2?pick(['rush','bash','guards']):pick(['rush','rush','bash','guards']);
const SZ_ACT={
  bash:{run(e,dt,ctx){const a=e.ai;a.face=1;
      if(a.st<.1&&ctx.dist>2.2){moveToward(e,dt,P.pos.x,P.pos.z,e.cfg.speed*1.4,1.8);a.st=0;if(a.t>6)return true;return false}
      stopMove(e,dt);e.lean=a.st<.7?-.35:.7;
      if(a.st>=.7&&!a.did){a.did=true;sfx('e_whoosh');if(ctx.dist<2.7){if(hitPlayer(e,e.dmg)){P.vel.x+=ctx.nx*13;P.vel.z+=ctx.nz*13;sfx('e_shove')}}}
      if(a.st>=1.3){a.did=false;return true}return false},cool:e=>rand(1,1.6)},
  rush:{start(e,ctx){const a=e.ai;a.hitDone=false;const l=ctx.dist||1;a.dx=ctx.nx;a.dz=ctx.nz;sfx('e_yell')},
    run(e,dt,ctx){const a=e.ai;
      if(a.st<.7){stopMove(e,dt);e.lean=-.4;e.glow=.18+.1*Math.sin(a.st*40);a.face=2;a.faceYaw=Math.atan2(-a.dx,-a.dz);return false}
      e.glow=0;e.lean=.6;moveDir(e,dt,a.dx,a.dz,e.phase>=3?10:8);
      if(!a.hitDone&&ctx.dist<2.1&&!S.G.dead){a.hitDone=true;if(hitPlayer(e,e.dmg*1.5)){P.vel.x+=a.dx*14;P.vel.z+=a.dz*14;sfx('e_shove');S.G.shake+=.8}}
      return a.st>=1.9||a.hitDone&&a.st>1.1},cool:e=>rand(1.8,2.8)},
  guards:{start(e){e.ai.did=false},run(e,dt,ctx){const a=e.ai;stopMove(e,dt);e.armT=0;e.lean=-.1;e.glow=.12;
      if(a.st>.8&&!a.did){a.did=true;summon(e,'ochroniarz',1);sfx('e_sting');addFloater('POMOCY!',{world:e.g.localToWorld(new THREE.Vector3(0,3.2,0)),size:36,life:.8,color:'#c8f000',vy:-20})}
      return a.st>=1.4},cool:e=>rand(3,4.5)},
};

/* ======================= SZKICE (jeszcze niezarejestrowane) =======================
 * Sołtys (dyskoteka wiejska): gruby, w garniturze i z szarfą; faza 1: rzuca kiełbasami (jak żetony), faza 2: wzywa dresy i pijaków
 *   (głosowanie = tarcza „kworum” co 15 s), faza 3: szarża traktorem (jak Maluch, większy).
 * Dyżurny Ruchu (dworzec): mundur kolejarza, lizak/semafor w ręce; telegrafowane pasy zagrożenia (jak laser DJ) na torach, nadjeżdżający skład
 *   jako fala po ziemi (shockwave wzdłuż osi), faza 3: przełącza „rozjazdy” = losowa strona areny jest śmiertelna.
 * Szef Stacji (stacja paliw): kombinezon i kanister; ogniste kałuże (puddle z DOT większym), wybuchające beczki (explode), faza 3: tir w szarży.
 * Wymagają poziomów (ds-level-designer) i dodatkowych rekwizytów (ds-world-modeler); kontrakt tabeli: DS.enemies.table + level.enemies.
 */
