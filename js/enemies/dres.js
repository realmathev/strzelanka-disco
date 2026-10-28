// Dres: szybki wróg wręcz w dresie adidasowym. Biegnie zygzakiem, rozpędza się i szarżuje (zapowiedź: przykuca i ryczy),
// po chybieniu potyka się. Atakuje w stadzie (flankuje). Nie ucieka.
import {DS} from '../core/ds.js';
import {S} from '../core/state.js';
import {opt} from '../core/save.js';
import {addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {collide} from '../player/collision.js';
import {humanBase} from './kit.js';
import {enter,moveDir,moveToward,stopMove,hitPlayer,facePlayer,noise} from './ai.js';
import {makeHuman,reg,wv,aiOpts,meleeAttack,variantOf,rand,pick,SKIN,clamp} from './common.js';

const VARIANTS=[{jacket:0x1d3f8a,stripe:0xffffff},{jacket:0xb3262c,stripe:0xffffff},{jacket:0x1c1c1f,stripe:0xf4efe4}];
function build(P_,meta,v){
  const skin=v.skin;
  humanBase(P_,meta,{skin,shirt:v.jacket,pants:v.jacket,sleeve:v.jacket,shoes:0xf4efe4,pose:'guard',k:.98});
  for(const [L,sx] of [[P_.legL,-1],[P_.legR,1]])for(const z of [-.032,0,.032])
    L.limb(v.stripe,sx*(meta.hipX+.094),.88,z,sx*(meta.hipX*1.06+.072),.12,z,.009,.009,{t:0});   // trzy paski adidasa
  P_.body.cyl(v.jacket,.078,.088,.06,0,1.58,0);                                                      // kołnierz
  P_.body.box(0xeeeeee,.018,.46,.012,0,1.3,-.128,{t:0});                                              // zamek
  P_.body.limb(0xffd34a,-.1,1.55,-.12,0,1.36,-.14,.012,.012,{t:0});P_.body.limb(0xffd34a,.1,1.55,-.12,0,1.36,-.14,.012,.012,{t:0}); // złoty łańcuch
  P_.body.limb(v.stripe,-.235,1.48,-.02,-.26,1.2,-.1,.012,.012,{t:0});P_.body.limb(v.stripe,.235,1.48,-.02,.26,1.2,-.1,.012,.012,{t:0}); // paski na rękawach
  const hy=meta.headY;
  P_.head.sph(0x2a211c,.108,0,hy+.045,.004,{ky:.8,kz:1.13,t:0});                                     // krótki jeżyk
  P_.head.box(0x15110e,.05,.012,.02,-.04,hy+.045,-.122,{t:0});P_.head.box(0x15110e,.05,.012,.02,.04,hy+.045,-.122,{t:0}); // brwi
}

reg('dres','Dres',(o={})=>{
  const w=o.wave||0,vi=variantOf(o,VARIANTS.length);
  const v=Object.assign({skin:SKIN[vi]},VARIANTS[vi]);
  const e=makeHuman({key:'dres'+vi,build:(P_,m)=>build(P_,m,v),hp:wv(55,6,w),dmg:wv(9,.6,w),radius:.45,scale:rand(.97,1.05),name:'Dres',xp:9,
    cfg:{speed:wv(4.9,.07,w),turn:11,sight:38,fov:2.4,range:[1.1,1.9],melee:true,flank:.6,cover:0,fleeHp:0,alertTime:6,accel:12,
      decide(e,ctx){
        const a=e.ai;a.cd2-=.18;
        if((a.state==='chase'||a.state==='flank')&&ctx.sees&&a.cd2<=0&&ctx.dist<11&&ctx.dist>3.5){enter(e,'wind');return true}
        return false;
      },
      attack(e,dt,ctx){meleeAttack(e,dt,ctx,{reach:1.55,windup:.28,cool:.55,dmg:e.dmg*.8,knock:4,snd:null,hitSnd:'hurt'})},
      states:{
        wind:{enter(e){sfx('e_yell');e.ai.st=0;noise(e,28);if(opt.onoma)addFloater('ŁOOOO!',{world:e.g.localToWorld(new THREE.Vector3(0,2.3,0)),size:34,life:.6,color:'#ffe14a',vy:-30})},
          update(e,dt,ctx){const a=e.ai;a.st+=dt;stopMove(e,dt);facePlayer(e);e.crouch=Math.min(.8,a.st*3);e.lean=.5;e.glow=.18+.1*Math.sin(a.st*30);
            if(a.st>=.5){e.glow=0;e.crouch=0;a.dx=ctx.nx;a.dz=ctx.nz;enter(e,'charge')}}},
        charge:{enter(e){e.ai.st=0;e.ai.px=e.g.position.x;e.ai.pz=e.g.position.z;e.ai.hitDone=false},
          update(e,dt,ctx){const a=e.ai,p=e.g.position;a.st+=dt;
            a.face=2;a.faceYaw=Math.atan2(-a.dx,-a.dz);e.lean=.6;
            moveDir(e,dt,a.dx,a.dz,e.cfg.speed*2.1);
            if(!a.hitDone&&ctx.dist<1.3&&!S.G.dead){a.hitDone=true;if(hitPlayer(e,e.dmg)){P.vel.x+=a.dx*8;P.vel.z+=a.dz*8;sfx('hurt')}enter(e,'recover');e.ai.rec=.7;return}
            if(a.st>.25&&Math.hypot(p.x-a.px,p.z-a.pz)<.25*a.st*e.cfg.speed){enter(e,'recover');e.ai.rec=1.5;e.flinch=1;return}   // walnął w ścianę
            if(a.st>1.1){enter(e,'recover');e.ai.rec=.9}}},
        recover:{enter(e){e.ai.st=0;e.ai.rec=e.ai.rec||.8},
          update(e,dt,ctx){const a=e.ai;a.st+=dt;stopMove(e,dt);facePlayer(e);e.lean=.3-a.st*.2;
            if(a.st>=a.rec){a.rec=0;e.ai.cd2=rand(2.2,3.8);e.lean=0;enter(e,'chase')}}},
      }},
    opts:aiOpts(o)});
  return e;
},{drops:[{kind:'adrenaline',p:.14}],tableTags:['melee','fast']});
