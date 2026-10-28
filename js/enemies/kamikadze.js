// Kamikadze z petardami: chudy szaleniec z pękiem dynamitu. Biegnie na gracza, z dystansu rzuca petardę (lont 1,5 s), z bliska
// odpala lont (0,9 s: miga, piszczy, przyspiesza) i wybucha przy graczu. Zastrzelony z daleka — jego ładunek też wybucha
// po 0,45 s (rzut oka na zamek: nie stój przy trupie). Samobójczy wybuch nie daje XP ani zabójstwa.
import {S} from '../core/state.js';
import {sfx} from '../audio/sfx.js';
import {addFloater} from '../render/comicfx.js';
import {P} from '../player/player.js';
import {humanBase} from './kit.js';
import {enter,moveDir,moveToward,stopMove,facePlayer,noise,dyingHuman} from './ai.js';
import {throwProj,explode} from './proj.js';
import {makeHuman,reg,wv,aiOpts,variantOf,rand,pick,SKIN,clamp} from './common.js';
import {DS} from '../core/ds.js';

const V=new THREE.Vector3(),H=new THREE.Vector3();
function build(P_,meta,v){
  humanBase(P_,meta,{skin:v.skin,shirt:0x1a1a1f,pants:0x3a3f4a,sleeve:0x1a1a1f,shoes:0xd3242a,pose:'hands',k:.88});
  const hy=meta.headY;
  P_.body.box(0x2b2b2b,.4,.34,.1,0,1.33,-.15,{t:.04});                                              // kamizelka
  for(let i=0;i<6;i++){P_.body.cyl(0xd3242a,.03,.03,.3,-.15+i*.06,1.33,-.215,null,6);P_.body.box(0xf4efe4,.062,.03,.062,-.15+i*.06,1.33,-.215,{t:0})}
  P_.body.box(0x15110e,.1,.08,.04,0,1.33,-.25,{t:0});P_.body.box(0x39ff6b,.03,.03,.02,.02,1.34,-.275,{t:0});   // zegar z zielonym diodą
  P_.body.limb(0xffe14a,.1,1.44,-.22,.2,1.58,-.1,.008,.008,{t:0});P_.body.sph(0xffa21a,.025,.2,1.59,-.1,{t:0});     // lont z iskrą
  P_.head.sph(0x15110e,.1,0,hy+.07,.01,{ky:.8,kz:1.1,t:0});                                           // zmierzwione włosy
  for(let i=-2;i<=2;i++)P_.head.box(0x15110e,.03,.1,.03,i*.04,hy+.16,0,{rx:0,rz:i*.25,t:0});         // kolce
  P_.head.box(0xd3242a,.22,.035,.22,0,hy+.065,0,{t:0});                                               // opaska
  P_.head.box(0xffffff,.045,.045,.01,-.04,hy+.022,-.13,{t:0});P_.head.box(0xffffff,.045,.045,.01,.04,hy+.022,-.13,{t:0}); // wytrzeszczone oczy
}
function blast(e,dmgMul){
  if(e.exploded)return;e.exploded=true;
  explode(e.g.position.x,.9,e.g.position.z,{r:e.blastR,dmg:e.dmg*dmgMul,shake:1.2});
}
reg('kamikadze','Kamikadze z petardami',(o={})=>{
  const w=o.wave||0,si=variantOf(o,2);
  const e=makeHuman({key:'kamikadze'+si,build:(P_,m)=>build(P_,m,{skin:SKIN[si]}),hp:wv(40,4,w),dmg:wv(42,2.2,w),radius:.42,scale:rand(.96,1.0),name:'Kamikadze',xp:9,
    cfg:{speed:wv(5.6,.08,w),turn:11,sight:46,fov:2.5,range:[.5,3.4],melee:true,flank:.3,cover:0,fleeHp:0,alertTime:6,accel:12,
      decide(e,ctx){
        const a=e.ai;a.cd2-=.18;
        if(a.state==='fuse'||a.state==='toss')return true;
        if(ctx.sees&&ctx.dist<3.8){enter(e,'fuse');return true}
        if((a.state==='chase'||a.state==='flank')&&ctx.sees&&a.cd2<=0&&ctx.dist>8&&ctx.dist<15){enter(e,'toss');return true}
        return false;
      },
      attack(e,dt,ctx){e.ai.face=1;moveToward(e,dt,P.pos.x,P.pos.z,e.cfg.speed,1)},
      states:{
        toss:{enter(e){e.ai.st=0;e.ai.thrown=false},locked:e=>true,
          update(e,dt,ctx){const a=e.ai;a.st+=dt;stopMove(e,dt);facePlayer(e);e.lean=-.3*Math.min(1,a.st/.4);
            if(a.st>=.45&&!a.thrown){a.thrown=true;e.lean=.6;e.torso.localToWorld(H.set(.2,.5,-.35));
              const T=Math.max(.4,ctx.dist/12);throwProj('petard',H,P.pos.x+P.vel.x*T*.5,P.pos.y+.2,P.pos.z+P.vel.z*T*.5,{speed:12,fuse:1.5,r:3.4,dmg:e.dmg*.4});sfx('e_throw');noise(e,24)}
            if(a.st>=.8){a.cd2=rand(4,6);e.lean=0;enter(e,'chase')}}},
        fuse:{enter(e){const a=e.ai;a.st=0;a.blink=0;sfx('e_fuse',0);addFloater('TIK TIK TIK',{world:e.g.localToWorld(new THREE.Vector3(0,2.3,0)),size:30,life:.8,color:'#ff5a3a',vy:-20})},locked:e=>true,
          update(e,dt,ctx){const a=e.ai;a.st+=dt;a.face=1;
            moveToward(e,dt,P.pos.x,P.pos.z,e.cfg.speed*1.25,.8);e.lean=.4;
            const p=Math.sin(a.st*(18+a.st*16))>0;e.glow=p?.9:.15;
            a.blink-=dt;if(a.blink<=0){a.blink=.18;sfx('e_fuse',a.st)}
            if(a.st>=.9||ctx.dist<1.3){blast(e,1);e.def.silentDie(e)}}},
      }},
    opts:aiOpts(o)});
  e.blastR=4.6;
  return e;
},{drops:[{kind:'adrenaline',p:.1}],tableTags:['suicide'],
  /** Samobójczy wybuch: ciało znika, bez zdarzenia kill (bez XP, combo i dropów). */
  silentDie(e){e.alive=false;e.dieT=5.01;e.glow=0;e.g.visible=false;S.G.shake+=.4},
  /** Zastrzelony: ładunek wybucha po 0,45 s od śmierci (słabiej niż samobójczy). */
  dying(e,dt){
    if(!e.exploded){e.fuseT=(e.fuseT===undefined?.45:e.fuseT)-dt;e.glow=Math.sin(e.dieT*40)>0?.8:.1;
      if(e.fuseT<=0){blast(e,.6);e.g.visible=false;e.glow=0}}
    dyingHuman(e,dt);
  }});
