// Snajper z laserem: trzyma dystans (24–60 m), szuka osłon i zmienia pozycję po strzale. Strzał jest ZAPOWIEDZIANY:
// czerwony laser śledzi gracza ~1,6 s, potem zamarza (biały) na 0,45 s i dopiero strzela w zamrożony punkt — wystarczy zejść z linii.
import {S} from '../core/state.js';
import {sfx} from '../audio/sfx.js';
import {addTracer} from '../render/fx3d.js';
import {addFloater} from '../render/comicfx.js';
import {P} from '../player/player.js';
import {los} from '../player/collision.js';
import {humanBase} from './kit.js';
import * as nav from './nav.js';
import {enter,stopMove,moveToward,hitPlayer,noise,facePlayer} from './ai.js';
import {beam} from './proj.js';
import {makeHuman,reg,wv,aiOpts,rand,pick,SKIN,clamp} from './common.js';

const MZ=new THREE.Vector3(),AIM=new THREE.Vector3(),END=new THREE.Vector3(),TP=new THREE.Vector3();
const AIM_T=1.6,LOCK_T=.45;
function build(P_,meta,v){
  humanBase(P_,meta,{skin:v.skin,shirt:0x4a5a35,pants:0x3f4a30,sleeve:0x4a5a35,shoes:0x2b2418,hand:0x1a1a1d,pose:'aim',k:.94});
  const hy=meta.headY;
  for(const [x,y,z,c] of [[-.12,1.42,-.12,0x2f3a22],[.14,1.3,-.13,0x6a7a4a],[-.05,1.22,-.12,0x2f3a22],[.0,1.5,-.13,0x6a7a4a]])P_.body.box(c,.12,.1,.02,x,y,z,{t:0});   // łaty maskujące
  P_.body.limb(0x3f4a30,-.1,1.05,-.1,-.12,.8,-.1,.03,.03,{t:0});
  P_.head.cyl(0x4a5a35,.19,.19,.02,0,hy+.075,0,{t:.05},12);P_.head.sph(0x4a5a35,.112,0,hy+.095,0,{ky:.6,kz:1.1,t:.04}); // kapelusz bojowy (boonie)
  P_.head.box(0x2f3a22,.17,.05,.015,0,hy-.06,-.115,{t:0});                                        // szalik/maska pod oczami
  // karabin wyborowy: kolba, komora, lufa, luneta, laser
  P_.body.limb(0x2b2b2e,.06,1.4,-.1,.02,1.41,-1.15,.016,.016,{t:.05});
  P_.body.box(0x2b2b2e,.05,.09,.4,.07,1.38,-.35,{t:.05});P_.body.box(0x5a3d22,.05,.14,.3,.07,1.35,-.02,{t:.05});
  P_.body.cyl(0x15110e,.028,.028,.3,.07,1.47,-.38,{rx:Math.PI/2},8);                              // luneta
  P_.body.box(0xff2222,.02,.02,.04,.07,1.41,-1.18,{t:0});                                         // laser
}
reg('snajper','Snajper z laserem',(o={})=>{
  const w=o.wave||0,si=Math.floor(Math.random()*SKIN.length);
  const e=makeHuman({key:'snajper'+si,build:(P_,m)=>build(P_,m,{skin:SKIN[si]}),hp:wv(45,4,w),dmg:wv(28,1.6,w),radius:.45,scale:rand(.98,1.04),name:'Snajper',xp:16,
    cfg:{speed:wv(2.7,.04,w),turn:5,sight:90,fov:1.9,range:[24,60],melee:false,flank:0,cover:.55,fleeHp:.3,fleeTime:5,alertTime:9,hear:70,holdGround:true,lose:5,
      attack(e,dt,ctx){
        const a=e.ai;a.face=1;a.cd-=dt;
        switch(a.sub){
          case 0:                                                          // gotowość
            stopMove(e,dt);e.crouch=Math.min(.35,e.crouch+dt);
            if(ctx.dist<17){enter(e,'reposition');break}
            if(a.cd<=0&&ctx.sees&&ctx.dist>=18){a.sub=1;a.st=0;a.aimOk=true;AIM.set(P.pos.x,P.pos.y+1.1,P.pos.z);a.ax=AIM.x;a.ay=AIM.y;a.az=AIM.z;a.beam=e.beam=beam();a.tick=0;sfx('e_laser',0)}
            break;
          case 1:{                                                         // celowanie: laser śledzi, potem zamarza
            a.st+=dt;stopMove(e,dt);e.crouch=.35;
            MZ.copy(e.muzzle);e.torso.localToWorld(MZ);
            const lock=a.st>=AIM_T;
            if(!lock){const k=Math.min(1,dt*2.4);a.ax+=(P.pos.x-a.ax)*k;a.ay+=(P.pos.y+1.1-a.ay)*k;a.az+=(P.pos.z-a.az)*k}
            AIM.set(a.ax,a.ay,a.az);
            const clear=nav.gridLos(MZ.x,MZ.z,AIM.x,AIM.z)&&ctx.sees;
            if(!clear){a.noLos=(a.noLos||0)+dt;if(a.noLos>.6){e.beam.release();e.beam=null;a.sub=0;a.cd=rand(1,1.6);a.noLos=0;break}}else a.noLos=0;
            // wiązka wydłużona za punkt celowania, by wyglądała jak prawdziwy laser
            const dx=AIM.x-MZ.x,dy=AIM.y-MZ.y,dz=AIM.z-MZ.z,L=Math.hypot(dx,dy,dz)||1;
            e.beam.set(MZ.x,MZ.y,MZ.z,MZ.x+dx/L*(L+1.5),MZ.y+dy/L*(L+1.5),MZ.z+dz/L*(L+1.5),lock?.05:.025,lock?0xffffff:0xff2222,lock?1:.75);
            a.tick-=dt;if(a.tick<=0){a.tick=lock?.06:.28;sfx('e_laser',clamp(a.st/(AIM_T+LOCK_T),0,1))}
            e.glow=lock?.25:0;
            if(a.st>=AIM_T+LOCK_T){a.sub=2;a.st=0;e.glow=0;fire(e,MZ,AIM,ctx)}
            break}
          case 2:
            a.st+=dt;stopMove(e,dt);e.lean=-.25*(1-a.st/.6);
            if(a.st>=.6){a.sub=0;a.cd=rand(2.4,3.6);e.lean=0;if(Math.random()<.5)enter(e,'reposition')}
            break;
        }
      },
      states:{
        reposition:{                                                       // zmiana stanowiska: punkt 28–50 m od gracza z widokiem na niego
          enter(e){const a=e.ai;let best=null,bs=1e9;e.crouch=0;if(e.beam){e.beam.release();e.beam=null}
            for(let i=0;i<14;i++){const ang=rand(0,Math.PI*2),r=rand(28,50),x=P.pos.x+Math.cos(ang)*r,z=P.pos.z+Math.sin(ang)*r;
              if(!nav.isFree(x,z,0))continue;const d=Math.hypot(x-e.g.position.x,z-e.g.position.z);
              const vis=nav.gridLos(x,z,P.pos.x,P.pos.z);const s=d+(vis?0:60);if(s<bs&&d<60){bs=s;best={x,z}}}
            if(best){a.gx=best.x;a.gz=best.z}else{a.gx=e.g.position.x;a.gz=e.g.position.z}},
          update(e,dt,ctx){const a=e.ai;a.face=0;const d=moveToward(e,dt,a.gx,a.gz,e.cfg.speed*1.25,1);
            if(d<=1.2||a.t>9){enter(e,ctx.sees?'attack':'chase')}}},
      }},
    opts:aiOpts(o)});
  e.muzzle=new THREE.Vector3(.07,1.41-e.hipH,-1.2);
  return e;
},{drops:[{kind:'med',p:.18}],tableTags:['ranged','far'],
  onKill(e){if(e.beam){e.beam.release();e.beam=null}}});

/** Strzał w ZAMROŻONY punkt: trafia tylko, jeśli gracz nadal stoi na linii (ciało ~0,7 m od promienia) i nic go nie zasłania. */
function fire(e,from,aim,ctx){
  const G=S.G;
  if(e.beam){e.beam.release();e.beam=null}
  sfx('e_snipe');noise(e,45);
  const dx=aim.x-from.x,dy=aim.y-from.y,dz=aim.z-from.z,L=Math.hypot(dx,dy,dz)||1,ux=dx/L,uy=dy/L,uz=dz/L;
  END.set(from.x+ux*90,from.y+uy*90,from.z+uz*90);addTracer(from,END,0xffffff,.12);
  if(G.dead)return;
  // odległość środka ciała gracza od promienia
  const px=P.pos.x-from.x,py=P.pos.y+1.0-from.y,pz=P.pos.z-from.z,t=px*ux+py*uy+pz*uz;
  const cx=from.x+ux*t-P.pos.x,cy=from.y+uy*t-(P.pos.y+1.0),cz=from.z+uz*t-P.pos.z,miss=Math.hypot(cx,cy,cz);
  if(t>0&&miss<.75){
    if(los(from,TP.set(P.pos.x,P.pos.y+1.5,P.pos.z))||los(from,TP.set(P.pos.x,P.pos.y+.9,P.pos.z)))hitPlayer(e,e.dmg);
  }else addFloater('MINĄŁ!',{world:new THREE.Vector3(P.pos.x,1.9,P.pos.z),size:26,life:.6,color:'#f4e7c5',vy:-30});
}
