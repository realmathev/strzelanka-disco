// Bandyta z obrzynem: średnio szybki, groźny z bliska. Podchodzi (często flankuje), zapowiada strzał pochyleniem i lufą w górę,
// kule rozrzutu słabną z dystansem (pełne obrażenia do ~5 m, zero po ~16 m).
import {S} from '../core/state.js';
import {sfx} from '../audio/sfx.js';
import {addTracer} from '../render/fx3d.js';
import {P} from '../player/player.js';
import {los} from '../player/collision.js';
import {humanBase} from './kit.js';
import {moveToward,moveDir,stopMove,hitPlayer,noise} from './ai.js';
import {makeHuman,reg,wv,aiOpts,rand,pick,SKIN,clamp} from './common.js';

const JACKETS=[0x3a2a20,0x2d2f33,0x4a3a22],BEANIES=[0x6b2024,0x1f3a5a,0x2a2a2a];
const MZ=new THREE.Vector3(),END=new THREE.Vector3();
function build(P_,meta,v){
  humanBase(P_,meta,{skin:v.skin,face:0x24242b,hand:0x1a1a1d,shirt:v.jacket,pants:0x30363f,sleeve:v.jacket,shoes:0x1a1410,pose:'shotgun',k:1.02});
  const hy=meta.headY;
  P_.head.box(v.skin,.15,.04,.01,0,hy+.02,-.121,{t:0});                                       // szczelina na oczy
  P_.head.box(0x15110e,.032,.02,.012,-.04,hy+.022,-.127,{t:0});P_.head.box(0x15110e,.032,.02,.012,.04,hy+.022,-.127,{t:0});
  P_.head.cyl(v.beanie,.112,.113,.075,0,hy+.075,0);P_.head.sph(v.beanie,.112,0,hy+.105,0,{ky:.72,kz:1.1,t:.03});   // czapka wełniana
  P_.body.limb(0x8a6a2a,-.2,1.56,-.13,.2,1.2,-.14,.022,.022,{t:0});                          // pas z nabojami
  for(let i=0;i<4;i++){const t=(i+.5)/4;P_.body.cyl(0xd3242a,.016,.016,.05,-.2+.4*t,1.56-.36*t,-.155,{rx:0},6)}
  // obrzyn: dwie lufy, kolba skrócona
  P_.body.limb(0x2b2b2e,.13,1.34,-.38,.03,1.37,-.82,.02,.02,{t:.05});P_.body.limb(0x2b2b2e,.09,1.33,-.38,-.01,1.36,-.82,.02,.02,{t:.05});
  P_.body.box(0x6b4a2a,.05,.08,.17,.14,1.32,-.34,{t:.05});
}
reg('bandyta','Bandyta z obrzynem',(o={})=>{
  const w=o.wave||0,si=Math.floor(Math.random()*SKIN.length),ji=Math.floor(Math.random()*JACKETS.length),bi=Math.floor(Math.random()*BEANIES.length);
  const e=makeHuman({key:'obrzyn'+si+'_'+ji+'_'+bi,build:(P_,m)=>build(P_,m,{skin:SKIN[si],jacket:JACKETS[ji],beanie:BEANIES[bi]}),
    hp:wv(70,7,w),dmg:wv(24,1.4,w),radius:.5,scale:rand(.98,1.05),name:'Bandyta z obrzynem',xp:13,
    cfg:{speed:wv(3.7,.07,w),turn:8,sight:42,fov:2.2,range:[3,9],melee:false,flank:.7,cover:.12,fleeHp:0,alertTime:7,holdGround:true,
      attack(e,dt,ctx){
        const a=e.ai;a.face=1;a.cd-=dt;
        switch(a.sub){
          case 0:{
            if(ctx.dist>8.5){moveToward(e,dt,P.pos.x,P.pos.z,e.cfg.speed,7.5);e.lean=0}
            else{                                                          // krąży w bok, nie stoi w miejscu
              a.sideT=(a.sideT||0)-dt;if(a.sideT<=0){a.sideT=rand(.8,1.6);a.sideDir=Math.random()<.5?-1:1}
              const sp=ctx.dist<4?-.4:.6;
              const vx=(-ctx.nz*a.sideDir+ctx.nx*sp*.5),vz=(ctx.nx*a.sideDir+ctx.nz*sp*.5),l=Math.hypot(vx,vz)||1;
              moveDir(e,dt,vx/l,vz/l,e.cfg.speed*.7);
            }
            if(a.cd<=0&&ctx.sees&&ctx.dist<10){a.sub=1;a.st=0;sfx('e_whoosh')}
            break}
          case 1:
            a.st+=dt;stopMove(e,dt);e.lean=-.2*(a.st/.5);e.armT=0;
            if(a.st>=.5){a.sub=2;a.st=0;shoot(e,ctx)}
            break;
          case 2:
            a.st+=dt;stopMove(e,dt);e.lean=.25*(1-a.st/.4);
            if(a.st>=.4){a.sub=0;a.cd=rand(1.6,2.4);e.lean=0}
            break;
        }
      }},
    opts:aiOpts(o)});
  e.muzzle=new THREE.Vector3(.02,1.37-e.hipH,-.84);
  return e;
},{drops:[{kind:'med',p:.14}],tableTags:['close']});

function shoot(e,ctx){
  const G=S.G;
  MZ.copy(e.muzzle);e.torso.localToWorld(MZ);
  sfx('e_blast');noise(e,34);
  const d=ctx.dist;
  for(let i=0;i<3;i++){END.set(P.pos.x+rand(-.8,.8),P.pos.y+rand(.6,1.6),P.pos.z+rand(-.8,.8));addTracer(MZ,END,0xffb347,.07)}
  if(G.dead||!los(MZ,ctx.eye))return;
  const f=clamp(1.15-d/14,0,1.15);                                    // 8 śrucin: skuteczność maleje z dystansem
  if(f>0&&Math.random()<clamp(.9-d/22,.15,.9)){hitPlayer(e,e.dmg*f*rand(.85,1.1))}
}
