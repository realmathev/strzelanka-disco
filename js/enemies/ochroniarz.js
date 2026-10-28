// Ochroniarz z tarczą: wolny, twardy. Tarcza pochłania 85% obrażeń z przodu (trafienia w głowę nie), od tyłu dostaje więcej.
// Obraca się powoli, więc da się go obejść. Atak: pchnięcie tarczą (odrzut).
import {DS} from '../core/ds.js';
import {addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {humanBase} from './kit.js';
import {makeHuman,reg,wv,aiOpts,meleeAttack,variantOf,rand,pick,SKIN} from './common.js';

let blockMsgT=0;
export function shieldHit(e,ev,{front=.5,block=.85,back=.3}={}){
  if(ev.head)return;                                              // głowa wystaje nad tarczą
  const p=e.g.position,fx=-Math.sin(e.g.rotation.y),fz=-Math.cos(e.g.rotation.y),dx=P.pos.x-p.x,dz=P.pos.z-p.z,d=Math.hypot(dx,dz)||1;
  const dot=(dx*fx+dz*fz)/d;
  if(dot>front){e.hp+=ev.dmg*block;e.shieldT=.12;sfx('e_block');
    const now=performance.now();if(now-blockMsgT>350){blockMsgT=now;addFloater(pick(['BLOK!','TARCZA!','PUK!']),{world:ev.point.clone(),size:26,life:.5,color:'#9fd3ea',vy:-30})}}
  else if(dot<-.35){e.hp-=ev.dmg*back}                              // od tyłu: bez ochrony i z premią
}

function build(P_,meta,v){
  humanBase(P_,meta,{skin:v.skin,shirt:0x1c1f26,pants:0x14161b,sleeve:0x1c1f26,shoes:0x0e0e10,pose:'hands',k:1.14});
  const k=1.14,hy=meta.headY;
  P_.body.box(0xc8f000,.47*k,.3,.27,0,1.4,0,{t:.03});                                // kamizelka odblaskowa
  P_.body.box(0xdfe6ea,.48*k,.035,.275,0,1.34,0,{t:0});P_.body.box(0xdfe6ea,.48*k,.035,.275,0,1.47,0,{t:0});
  P_.body.box(0x0b0b0b,.37*k,.05,.24,0,1.06,0);                                      // pas
  P_.body.limb(0x111111,.2,1.02,-.05,.23,.72,-.12,.02,.02,{t:0});                    // pałka
  P_.body.box(0x111111,.04,.08,.03,-.24,1.5,-.1,{t:0});                              // krótkofalówka
  P_.head.cyl(0x1c1f26,.115,.12,.06,0,hy+.085,0);P_.head.sph(0x1c1f26,.113,0,hy+.09,0,{ky:.55,kz:1.1,t:.04});  // czapka
  P_.head.box(0x111111,.12,.012,.08,0,hy+.075,-.125,{t:0});P_.head.box(0xffd34a,.03,.03,.012,0,hy+.115,-.125,{t:0}); // daszek, odznaka
  // tarcza taktyczna z przezroczystego poliwęglanu + ramka + napis
  P_.body.box(0x86c5e6,.72,.95,.035,-.02,1.12,-.47,{t:.03});
  P_.body.box(0x2b3540,.76,.04,.05,-.02,1.62,-.47,{t:0});P_.body.box(0x2b3540,.76,.04,.05,-.02,.64,-.47,{t:0});
  P_.body.box(0x2b3540,.04,.99,.05,-.38,1.12,-.47,{t:0});P_.body.box(0x2b3540,.04,.99,.05,.34,1.12,-.47,{t:0});
  P_.body.box(0xffffff,.5,.09,.012,-.02,1.28,-.49,{t:0});
}
const SKINS=SKIN;
reg('ochroniarz','Ochroniarz z tarczą',(o={})=>{
  const w=o.wave||0,si=variantOf(o,2);
  return makeHuman({key:'ochroniarz'+si,build:(P_,m)=>build(P_,m,{skin:SKINS[si]}),hp:wv(110,10,w),dmg:wv(8,.5,w),radius:.6,scale:rand(1.03,1.08),name:'Ochroniarz',xp:15,
    cfg:{speed:wv(2.3,.04,w),turn:2.4,sight:36,fov:2.3,range:[1.5,2.3],melee:true,flank:0,cover:0,fleeHp:0,alertTime:8,accel:6,
      attack(e,dt,ctx){meleeAttack(e,dt,ctx,{reach:2.1,windup:.6,cool:1.1,dmg:e.dmg,knock:10,snd:'e_shove',hitSnd:'hurt'})},
      onHit(e,ev){shieldHit(e,ev)}},
    opts:aiOpts(o)});
},{drops:[{kind:'vest',p:.22}],tableTags:['tank','shield']});
