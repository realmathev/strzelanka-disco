// Medyk-bandyta: leczy rannych sojuszników (wiązka, 1,1 s kanału, 28% ich HP; boss 10%) i trzyma się za ich plecami. PRIORYTETOWY CEL:
// zielony krzyż nad głową. Przerwany trafieniem w trakcie leczenia. Ma 4 ładunki; bez rannych sojuszników strzela słabym pistoletem.
import {S} from '../core/state.js';
import {sfx} from '../audio/sfx.js';
import {addFloater} from '../render/comicfx.js';
import {P} from '../player/player.js';
import {humanBase} from './kit.js';
import {mergeGeometries} from '../render/merge.js';
import * as nav from './nav.js';
import {enter,moveToward,moveDir,stopMove,facePlayer,fireAt,noise,animateHuman} from './ai.js';
import {beam} from './proj.js';
import {makeHuman,reg,wv,aiOpts,variantOf,rand,pick,SKIN,clamp} from './common.js';

const MZ=new THREE.Vector3(),A_=new THREE.Vector3(),B_=new THREE.Vector3();
// znacznik priorytetowego celu: zielony krzyż nad głową (osobna siatka, niehitowa, świeci własnym kolorem)
const CROSS=Object.assign(mergeGeometries([new THREE.BoxGeometry(.07,.24,.07),new THREE.BoxGeometry(.24,.07,.07)]),{userData:{shared:true}});
const CROSS_MAT=Object.assign(new THREE.MeshBasicMaterial({color:0x39ff6b}),{userData:{shared:true}});
function build(P_,meta,v){
  humanBase(P_,meta,{skin:v.skin,shirt:0xf4efe4,pants:0x2b4a3a,sleeve:0xf4efe4,shoes:0xf4efe4,hand:0x2a7fb5,pose:'aim',k:1});
  const hy=meta.headY;
  P_.body.box(0xd3242a,.05,.16,.012,0,1.38,-.128,{t:0});P_.body.box(0xd3242a,.16,.05,.012,0,1.38,-.128,{t:0});     // krzyż na piersi
  P_.body.box(0xd3242a,.3,.26,.14,0,1.32,.2,{t:.04});P_.body.box(0xffffff,.04,.14,.012,0,1.32,.275,{t:0});P_.body.box(0xffffff,.14,.04,.012,0,1.32,.275,{t:0}); // torba medyczna
  P_.body.box(0xd3242a,.04,.04,.04,-.24,1.55,0,{t:0});
  P_.head.box(0xb3262c,.16,.075,.15,0,hy-.055,-.06,{t:.03});                                                    // bandana zasłaniająca twarz
  P_.head.box(0x15110e,.2,.04,.02,0,hy+.025,-.122,{t:0});                                                       // ciemne okulary
  P_.head.box(0xb3262c,.22,.04,.22,0,hy+.095,0,{t:0});P_.head.sph(0x1a1a1f,.108,0,hy+.07,.012,{ky:.65,kz:1.08,t:0});
  // strzykawka w dłoni
  P_.body.limb(0xdff6ff,.1,1.34,-.5,.1,1.38,-.7,.014,.014,{t:0});
}
function woundedAlly(e){
  const G=S.G,p=e.g.position;let best=null,bs=1e9;
  for(const o of G.enemies){
    if(o===e||!o.alive||!o.ai)continue;
    if(o.hp>=o.maxHp*(o.boss?.9:.7))continue;
    const d=Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z);
    if(d>45)continue;
    const s=d+o.hp/o.maxHp*30;if(s<bs){bs=s;best=o}
  }
  return best;
}
reg('medyk','Medyk-bandyta',(o={})=>{
  const w=o.wave||0,si=variantOf(o,2);
  const e=makeHuman({key:'medyk'+si,build:(P_,m)=>build(P_,m,{skin:SKIN[si]}),hp:wv(55,5,w),dmg:wv(4,.4,w),radius:.45,scale:rand(.97,1.03),name:'Medyk-bandyta',xp:14,
    cfg:{speed:wv(3.6,.05,w),turn:8,sight:40,fov:2.4,range:[9,17],melee:false,flank:0,cover:.35,fleeHp:.3,fleeTime:6,alertTime:7,holdGround:true,
      animate(e,dt){animateHuman(e,dt);e.marker.rotation.y+=dt*2.5;e.marker.position.y=e.markerY+Math.sin(e.ai.age*3)*.04},
      decide(e,ctx){
        const a=e.ai;a.cd2-=.18;
        if(a.state==='heal')return true;
        if(e.charges>0&&a.cd2<=0&&a.state!=='flee'){const t=woundedAlly(e);if(t){e.target=t;enter(e,'heal');return true}}
        return false;
      },
      attack(e,dt,ctx){
        const a=e.ai;a.face=1;a.cd-=dt;
        const sw=Math.sin(a.age*1.5+e.walk0),sp=ctx.dist>15?.7:ctx.dist<10?-.6:0;
        const vx=-ctx.nz*sw*.5+ctx.nx*sp,vz=ctx.nx*sw*.5+ctx.nz*sp,l=Math.hypot(vx,vz);
        if(l>.05)moveDir(e,dt,vx/l,vz/l,e.cfg.speed*.6);else stopMove(e,dt);
        if(a.cd<=0&&ctx.sees){a.cd=rand(1.8,2.8);MZ.copy(e.muzzle);e.torso.localToWorld(MZ);fireAt(e,MZ,ctx.eye,{dmg:e.dmg,acc:.35,color:0x9be8ff,tracers:1})}
      },
      states:{
        heal:{enter(e){const a=e.ai;a.st=0;a.chan=false;a.hsub=0},locked:e=>true,
          update(e,dt,ctx){
            const a=e.ai,t=e.target,p=e.g.position;
            if(!t||!t.alive||t.hp>=t.maxHp){if(e.beam){e.beam.release();e.beam=null}e.ai.cd2=1;enter(e,'chase');return}
            const d=Math.hypot(t.g.position.x-p.x,t.g.position.z-p.z);
            if(!a.chan){                                               // dojście do rannego
              a.face=0;moveToward(e,dt,t.g.position.x,t.g.position.z,e.cfg.speed*1.25,4);
              if((d<5.5&&nav.gridLos(p.x,p.z,t.g.position.x,t.g.position.z))||a.t>9){
                if(a.t>9){e.ai.cd2=2;enter(e,'chase');return}
                a.chan=true;a.st=0;e.beam=beam();sfx('e_heal')}
              return}
            a.st+=dt;stopMove(e,dt);a.face=2;a.faceYaw=Math.atan2(-(t.g.position.x-p.x),-(t.g.position.z-p.z));e.lean=.15;e.armT=0;
            MZ.copy(e.muzzle);e.torso.localToWorld(MZ);
            A_.set(t.g.position.x,1.1*(t.g.scale.y||1),t.g.position.z);
            e.beam.set(MZ.x,MZ.y,MZ.z,A_.x,A_.y,A_.z,.05+.02*Math.sin(a.st*20),0x39ff6b,.85);
            t.glow=.35+.2*Math.sin(a.st*14);
            if(a.hurtT<.12&&a.st>.15){e.beam.release();e.beam=null;t.glow=0;e.ai.cd2=1.6;enter(e,'chase');return}   // trafiony: kanał przerwany
            if(a.st>=1.1){
              t.glow=0;const amt=t.maxHp*(t.boss?.1:.28);t.hp=Math.min(t.maxHp,t.hp+amt);e.charges--;
              addFloater('+'+Math.round(amt)+' HP',{world:A_.clone().setY(2.4),size:28,life:.8,color:'#7dff9a',vy:-40});sfx('e_heal');
              e.beam.release();e.beam=null;e.ai.cd2=3;e.lean=0;enter(e,'chase')}
          }},
      }},
    opts:aiOpts(o)});
  const mk=new THREE.Mesh(CROSS,CROSS_MAT);e.markerY=e.headY-e.hipH+.42;mk.position.set(0,e.markerY,0);mk.raycast=()=>{};e.torso.add(mk);e.marker=mk;
  e.charges=4;e.priority=true;e.muzzle=new THREE.Vector3(.1,1.38-e.hipH,-.7);
  return e;
},{drops:[{kind:'med',p:.6,val:35},{kind:'bandage',p:.25}],tableTags:['support','priority'],
  onKill(e){if(e.beam){e.beam.release();e.beam=null}if(e.target)e.target.glow=0;if(e.marker)e.marker.visible=false}});
