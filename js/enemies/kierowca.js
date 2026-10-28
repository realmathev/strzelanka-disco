// Kierowca Malucha: Fiat 126p (3,05 × 1,37 m) z wąsatym kierowcą. Cykl: podjazd → rozgrzewanie silnika (dym, trzęsie się, zapowiedź) →
// SZARŻA w zablokowany kierunek (do 17 m/s, lekkie podsterowanie) → hamowanie → zawracanie. Uderzenie w ścianę ogłusza na 2,2 s:
// auto dymi, a kierowca (głowa w oknie, trafialna) dostaje +50% obrażeń. Okna to otwory (bez szyb), więc kierowcę widać i da się trafić.
import {S} from '../core/state.js';
import {rand,clamp,pick} from '../core/util.js';
import {sfx} from '../audio/sfx.js';
import {addFloater} from '../render/comicfx.js';
import {puff} from '../render/fx3d.js';
import {P} from '../player/player.js';
import {collide} from '../player/collision.js';
import {solidModel,assembleSolid,SKIN} from './kit.js';
import {initAI,updateAI,enter,moveDir,moveToward,stopMove,facePlayer,hitPlayer,noise} from './ai.js';
import {explode} from './proj.js';
import {wv,aiOpts} from './common.js';
import {DS} from '../core/ds.js';

const COLORS=[0xd3242a,0xe0c040,0x2d5fa8,0x4f8a5b,0xf4efe4,0xe07a2a];
const PX=new THREE.Vector3();
function build(P_,v){
  const c=v.color,dark=0x1a1a1d;
  P_.body.box(c,1.3,.46,2.95,0,.5,0);                                                      // dolna część nadwozia
  P_.body.box(c,1.26,.12,.85,0,.78,-1.0);                                                  // przedni bagażnik
  P_.body.box(c,1.24,.16,.7,0,.81,1.15);                                                   // pokrywa silnika
  P_.body.box(c,1.2,.06,1.3,0,1.28,.3);                                                    // dach
  for(const sx of [-1,1]){
    P_.body.box(c,.05,.5,.06,sx*.6,1.02,-.36,{rx:-.35,t:.03});                           // słupki A (skośne)
    P_.body.box(c,.05,.5,.07,sx*.6,1.02,.24,{t:.03});                                     // słupki B
    P_.body.box(c,.05,.5,.07,sx*.6,1.02,.92,{t:.03});                                     // słupki C
    P_.body.box(c,.04,.14,1.3,sx*.62,.82,.28,{t:.03});                                    // linia okien
  }
  P_.body.box(c,1.2,.05,.05,0,1.24,-.4,{t:.03});P_.body.box(c,1.2,.22,.05,0,.86,.95,{t:.03});  // rama szyby, tył
  P_.body.box(dark,.4,.42,.4,-.32,.74,.2,{t:0});P_.body.box(dark,.36,.04,.3,-.32,.96,-.12,{t:0});  // siedzenie, kierownica
  P_.body.cyl(dark,.17,.17,.03,-.32,.97,-.2,{rx:Math.PI/2.4},12);
  for(const sx of [-1,1])for(const z of [-.98,.92]){
    P_.body.cyl(0x15110e,.29,.29,.17,sx*.62,.29,z,{rz:Math.PI/2},12);
    P_.body.cyl(0xcfcfcf,.13,.13,.19,sx*.62,.29,z,{rz:Math.PI/2,t:0},10)}
  P_.body.box(dark,1.32,.09,.1,0,.4,-1.5);P_.body.box(dark,1.32,.09,.1,0,.4,1.5);          // zderzaki
  for(const sx of [-1,1]){P_.body.sph(0xfff3b0,.09,sx*.48,.64,-1.48,{kz:.5,t:0});P_.body.box(0xd3242a,.14,.07,.04,sx*.5,.62,1.49,{t:0})}  // światła
  P_.body.box(0x15110e,.38,.1,.02,0,.54,-1.5,{t:0});
  // kierowca (tors w oknie; głowa osobno: trafialna)
  P_.body.box(v.shirt,.4,.42,.25,-.32,.98,.13,{t:0});
  const hy=1.12;
  P_.head.sph(v.skin,.11,-.32,hy,.0,{ky:1.2,t:.06});
  P_.head.cyl(0x2b2b30,.12,.125,.04,-.32,hy+.12,0,{t:0},10);P_.head.box(0x2b2b30,.2,.012,.1,-.32,hy+.1,-.1,{t:0});   // kaszkiet
  P_.head.box(0x15110e,.1,.025,.02,-.32,hy-.045,-.115,{t:0});                                                       // wąsy
  P_.head.box(0x15110e,.03,.02,.02,-.36,hy+.02,-.11,{t:0});P_.head.box(0x15110e,.03,.02,.02,-.28,hy+.02,-.11,{t:0});
  return {headY:hy};
}

DS.enemies.register({
  id:'kierowca',name:'Kierowca Malucha',xp:17,drops:[{kind:'adrenaline',p:.3},{kind:'med',p:.15}],tableTags:['vehicle','charge'],
  create(o={}){
    const w=o.wave||0,ci=Math.floor(Math.random()*COLORS.length),si=Math.floor(Math.random()*SKIN.length);
    const v={color:COLORS[ci],skin:SKIN[si],shirt:pick([0x6b7a8f,0xb5534f,0x8a8f6b])};
    const model=solidModel('maluch'+ci+'_'+si,P_=>build(P_,v));
    const e=assembleSolid(model);
    e.mats=[e.mat];e.alive=true;e.dieT=0;e.boss=false;e.hp=e.maxHp=wv(160,14,w);e.dmg=wv(26,1.5,w);e.radius=1.15;e.name='Kierowca Malucha';e.xp=17;e.hipH=0;e.headY=1.12;
    initAI(e,{speed:wv(5.2,.06,w),turn:3.2,sight:60,fov:3.2,near:6,range:[8,40],melee:false,flank:.1,cover:0,fleeHp:0,cls:1,radius:1.15,accel:3,alertTime:7,
      decide(e,ctx){
        const a=e.ai;a.cd2-=.18;
        if(a.state==='rev'||a.state==='charge'||a.state==='brake'||a.state==='crash')return true;
        if(ctx.sees&&a.cd2<=0&&ctx.dist>10&&ctx.dist<36){enter(e,'rev');return true}
        return false;
      },
      attack(e,dt,ctx){enter(e,'chase')},
      animate:animateCar,
      states:{
        rev:{enter(e){const a=e.ai;a.st=0;sfx('e_rev',0);noise(e,40);addFloater('BRRRRM!',{world:e.g.localToWorld(new THREE.Vector3(0,2.2,0)),size:40,life:.9,color:'#ffe14a',vy:-20,rot:-.1})},locked:e=>true,
          update(e,dt,ctx){const a=e.ai;a.st+=dt;stopMove(e,dt);facePlayer(e);e.shake=.03;e.pitch=.05*Math.min(1,a.st*3);
            if(Math.floor(a.st*14)!==Math.floor((a.st-dt)*14)){e.g.localToWorld(PX.set(rand(-.4,.4),.35,1.4));puff(PX)}
            if(Math.floor(a.st*4)!==Math.floor((a.st-dt)*4))sfx('e_rev',a.st/1.1);
            if(a.st>=1.1){const T=.25;let dx=P.pos.x+P.vel.x*T-e.g.position.x,dz=P.pos.z+P.vel.z*T-e.g.position.z;const l=Math.hypot(dx,dz)||1;a.dx=dx/l;a.dz=dz/l;a.sp0=0;enter(e,'charge')}}},
        charge:{enter(e){const a=e.ai;a.st=0;a.px=e.g.position.x;a.pz=e.g.position.z;a.hitDone=false;a.csp=0;sfx('e_rev',1)},locked:e=>true,
          update(e,dt,ctx){const a=e.ai,p=e.g.position;a.st+=dt;
            a.csp=Math.min(17,a.csp+dt*30);                           // rozpędza się do 17 m/s (~60 km/h) w ~0,6 s
            // lekkie podsterowanie (max ~0,5 rad/s), reszta to „tor wjazdu”
            const want=Math.atan2(ctx.dx,ctx.dz),cur=Math.atan2(a.dx,a.dz);let dd=want-cur;while(dd>Math.PI)dd-=Math.PI*2;while(dd<-Math.PI)dd+=Math.PI*2;
            const turn=clamp(dd,-.5*dt,.5*dt);a.dx=Math.sin(cur+turn);a.dz=Math.cos(cur+turn);e.roll=clamp(turn*30,-.08,.08);
            a.face=2;a.faceYaw=Math.atan2(-a.dx,-a.dz);e.g.rotation.y=a.faceYaw;      // pojazd skręca natychmiast w kierunku jazdy
            const px=p.x,pz=p.z;
            p.x+=a.dx*a.csp*dt;p.z+=a.dz*a.csp*dt;collide(p,e.radius);
            const moved=Math.hypot(p.x-px,p.z-pz);a.sp=a.csp;a.vx=a.dx*a.csp;a.vz=a.dz*a.csp;e.pitch=-.03;
            if(Math.floor(a.st*10)!==Math.floor((a.st-dt)*10)){e.g.localToWorld(PX.set(rand(-.4,.4),.3,1.5));puff(PX)}
            if(!a.hitDone&&!S.G.dead){
              // elipsa pojazdu ~ (0,7 × 1,5 m): kolizja z graczem
              const rx=P.pos.x-p.x,rz=P.pos.z-p.z,fwd=rx*a.dx+rz*a.dz,side=Math.abs(rx*a.dz-rz*a.dx);
              if(P.pos.y<1.1&&Math.abs(fwd)<1.9&&side<1.15){a.hitDone=true;if(hitPlayer(e,e.dmg)){P.vel.x+=a.dx*15;P.vel.z+=a.dz*15;S.G.shake+=1.2;sfx('e_crash');addFloater('BUM!',{world:new THREE.Vector3(P.pos.x,1.6,P.pos.z),size:50,life:.7,color:'#ff6a3a',vy:-30,burst:true})}}
            }
            if(a.st>.3&&moved<a.csp*dt*.35){e.stun=2.2;sfx('e_crash');S.G.shake+=.8;noise(e,35);enter(e,'crash');return}   // wjechał w ścianę
            if(a.st>2.3||Math.hypot(p.x-a.px,p.z-a.pz)>40){enter(e,'brake')}}},
        brake:{enter(e){e.ai.st=0},locked:e=>true,
          update(e,dt,ctx){const a=e.ai;a.st+=dt;a.csp=Math.max(0,a.csp-dt*22);const p=e.g.position;p.x+=a.dx*a.csp*dt;p.z+=a.dz*a.csp*dt;collide(p,e.radius);a.sp=a.csp;a.vx=a.dx*a.csp;a.vz=a.dz*a.csp;e.pitch=.04;
            if(a.csp<=0.2&&a.st>.5){a.vx=a.vz=0;a.sp=0;e.pitch=0;e.ai.cd2=rand(1.5,2.6);enter(e,'chase')}}},
        crash:{enter(e){e.ai.st=0;e.ai.vx=e.ai.vz=0;e.ai.sp=0;e.vuln=true},locked:e=>true,
          update(e,dt,ctx){const a=e.ai;a.st+=dt;a.sp=0;e.pitch=.06;e.shake=.04;
            if(Math.floor(a.st*8)!==Math.floor((a.st-dt)*8)){e.g.localToWorld(PX.set(rand(-.3,.3),.6,rand(-1.6,-1.2)));puff(PX)}
            if(a.st>=e.stun){e.vuln=false;e.pitch=0;e.ai.cd2=rand(1.5,2.5);enter(e,'chase')}}},
      }},aiOpts(o));
    return e;
  },
  update:updateAI,
  onHit(e,ev){if(e.vuln&&!ev.head)e.hp-=ev.dmg*.5},
  /** Wrak: dym, po 1,2 s wybuch wizualny (bez obrażeń), kadłub czernieje. */
  dying(e,dt){
    if(!e.dInit){e.dInit=true;e.glow=0;e.ai.sp=0;e.charT=0;if(e.beam&&e.beam.release)e.beam.release()}
    e.dieT+=dt;e.charT+=dt;const k=Math.min(e.dieT/.4,1);
    e.rig.rotation.x=.08*k;e.rig.rotation.z=.05*k;e.rig.position.y=-.05*k;
    const a=e.ai;if(a&&a.csp>0){a.csp=Math.max(0,a.csp-dt*20);e.g.position.x+=a.dx*a.csp*dt;e.g.position.z+=a.dz*a.csp*dt;collide(e.g.position,e.radius)}
    if(!e.burnt&&e.dieT>1.2){e.burnt=true;e.mat.color.setHex(0x3a3a3a);explode(e.g.position.x,.8,e.g.position.z,{r:3,dmg:0,shake:.5});}
    if(Math.floor(e.dieT*6)!==Math.floor((e.dieT-dt)*6)&&e.dieT<4){e.g.localToWorld(PX.set(rand(-.4,.4),.9,rand(-.5,.5)));puff(PX)}
    for(const m of e.mats)m.emissive.setRGB(0,0,0);
  },
});
function animateCar(e,dt){
  // przechyły i drgania silnika
  e.rig.rotation.x+=((e.pitch||0)-e.rig.rotation.x)*Math.min(1,dt*8);
  e.rig.rotation.z+=((e.roll||0)-e.rig.rotation.z)*Math.min(1,dt*8);
  e.rig.position.y=Math.abs(Math.sin(e.walk*.5))*.015*(e.ai.sp>1?1:0)+(e.shake?Math.sin(e.ai.age*90)*e.shake*.2:0);
  e.walk+=dt*e.ai.sp;
  if(e.shake>0)e.shake=Math.max(0,e.shake-dt*.04);
}
