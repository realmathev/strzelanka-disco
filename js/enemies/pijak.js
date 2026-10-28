// Pijak z butelkami: chwiejny slalom, rzuca butelkami po łuku (zapowiedź: zamach nad głowę), butelka rozbija się w kałużę
// z odłamkami, która rani stojącego w niej gracza. Z bliska tłucze butelką. Po śmierci zostawia kałużę po wódce.
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {humanBase} from './kit.js';
import {stopMove,moveToward,moveDir,hitPlayer,noise,facePlayer} from './ai.js';
import {throwProj,puddle} from './proj.js';
import {makeHuman,reg,wv,aiOpts,meleeAttack,rand,pick,SKIN,clamp} from './common.js';

const HAND=new THREE.Vector3(),TGT=new THREE.Vector3();
function build(P_,meta,v){
  const k=1.12;
  humanBase(P_,meta,{skin:v.skin,shirt:0xe8e2d2,pants:0x5c6168,sleeve:v.skin,shoes:0x3b2f27,pose:'down',k,armSep:true});
  const hy=meta.headY;
  P_.body.sph(0xe8e2d2,.23,0,1.1,-.05,{kz:.85,ky:.85,t:.05});                                     // brzuch piwny
  P_.body.box(0x8a6a3a,.14,.1,.01,.08,1.3,-.14,{t:0});P_.body.box(0x8a6a3a,.1,.08,.01,-.1,1.12,-.27,{t:0});   // plamy po piwie
  P_.head.box(0xc4574a,.04,.05,.04,0,hy-.02,-.14,{t:.04});                                          // czerwony nos
  P_.head.sph(0xb8b8b0,.108,0,hy+.05,.01,{ky:.7,kz:1.1,t:0});                                       // siwe, zmierzwione włosy
  P_.head.box(0x6d6d66,.15,.045,.02,0,hy-.075,-.12,{t:0});                                          // zarost
  // butelka Żubra w prawej ręce (część osobnej ręki: unosi się razem z nią)
  const hx=meta.shoulder.x+.04,hyy=1.46-.52;
  P_.arm.cyl(0x5f8a2a,.034,.04,.22,hx,hyy+.08,-.07,null,8);P_.arm.cyl(0x5f8a2a,.012,.03,.1,hx,hyy+.23,-.07,null,8);P_.arm.box(0xf4efe4,.07,.07,.07,hx,hyy+.08,-.07,{t:0});
}
reg('pijak','Pijak z butelkami',(o={})=>{
  const w=o.wave||0,si=Math.floor(Math.random()*SKIN.length);
  const e=makeHuman({key:'pijak'+si,build:(P_,m)=>build(P_,m,{skin:SKIN[si]}),meta:{arm:true},hp:wv(60,6,w),dmg:wv(10,.7,w),radius:.55,scale:rand(.96,1.03),name:'Pijak',xp:8,
    cfg:{speed:wv(2.5,.05,w),turn:5,sight:34,fov:2.4,range:[6,20],melee:false,flank:.1,cover:.1,fleeHp:0,alertTime:6,weave:3.2,holdGround:true,
      attack(e,dt,ctx){
        const a=e.ai;a.face=1;a.cd-=dt;
        switch(a.sub){
          case 0:{
            if(ctx.dist<2.6){                                              // z bliska: tłucze butelką
              stopMove(e,dt);if(a.cd<=0){a.sub=4;a.st=0;e.armT=-2.4;sfx('e_whoosh')}break}
            // chwiejny krok na boki, trzyma dystans
            const sw=Math.sin(a.age*1.9+e.walk0),sp=ctx.dist>14?.6:ctx.dist<8?-.5:0;
            const vx=-ctx.nz*sw+ctx.nx*sp,vz=ctx.nx*sw+ctx.nz*sp,l=Math.hypot(vx,vz)||1;
            moveDir(e,dt,vx/l,vz/l,e.cfg.speed*.55*Math.min(1,l));e.lean=sw*.08;
            if(a.cd<=0&&ctx.sees&&ctx.dist>5){a.sub=1;a.st=0}
            break}
          case 1:                                                          // zamach nad głowę
            a.st+=dt;stopMove(e,dt);e.armT=-2.7*Math.min(1,a.st/.7);e.lean=-.3*Math.min(1,a.st/.7);
            if(a.st>=.7){a.sub=2;a.st=0;
              e.armR.localToWorld(HAND.set(.04,-.35,-.07));
              const T=Math.max(.35,ctx.dist/13);TGT.set(P.pos.x+P.vel.x*T,P.pos.y+.9,P.pos.z+P.vel.z*T);
              throwProj('bottle',HAND,TGT.x,TGT.y,TGT.z,{speed:13,dmg:e.dmg,owner:e});sfx('e_throw');noise(e,22);e.armT=1.0;e.lean=.5}
            break;
          case 2:a.st+=dt;stopMove(e,dt);if(a.st>=.3){a.sub=3;a.st=0;e.armT=0;e.lean=0}break;
          case 3:a.st+=dt;stopMove(e,dt);if(a.st>=.5){a.sub=0;a.cd=rand(2.2,3.4)}break;
          case 4:                                                          // cios butelką
            a.st+=dt;stopMove(e,dt);
            if(a.st>=.45&&!a.hit){a.hit=true;e.armT=1.1;e.lean=.6;if(ctx.dist<2.8){if(hitPlayer(e,e.dmg*.7)){P.vel.x+=ctx.nx*4;P.vel.z+=ctx.nz*4;sfx('e_glass')}}}
            if(a.st>=.9){a.sub=0;a.hit=false;a.cd=rand(1.2,2);e.armT=0;e.lean=0}
            break;
        }
      }},
    opts:aiOpts(o)});
  return e;
},{drops:[{kind:'zubr',p:.35}],tableTags:['ranged','hazard'],
  onKill(e){puddle(e.g.position.x,e.g.position.z,{r:1.1,life:6,dmg:1.2})}});
