// Gangster w marynarce (jedyny wróg pierwotnej gry) i jego boss „Baron Jackpot” (boss:true).
import {rand,pick,clamp} from '../core/util.js';
import {opt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {toon,hullGeo} from '../render/materials.js';
import {mergeGeometries,tintGeo,posOnly} from '../render/merge.js';
import {addTracer} from '../render/fx3d.js';
import {addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {collide,los} from '../player/collision.js';
import {hurt} from '../game/combat.js';

const SKINTONES=[0xf0c09a,0xe0a77d,0xc98b62,0xf5cfae];
// Geometrie współdzielone między wszystkimi gangsterami (flaga `shared`: disposeObject ich nie zwalnia).
const GEO={};
const geo=(k,make)=>GEO[k]||(GEO[k]=Object.assign(make(),{userData:{shared:true}}));
const box=(w,h,d)=>geo('b'+w+'/'+h+'/'+d,()=>new THREE.BoxGeometry(w,h,d));
const cyl=(a,b,h,s)=>geo('c'+a+'/'+b+'/'+h+'/'+s,()=>new THREE.CylinderGeometry(a,b,h,s));

const TMP=new THREE.Matrix4(),SCL=new THREE.Matrix4();
/** Skleja części {geo,c,x,y,z,t,rx} w geometrię o początku w (0,oy,0). hullOnly: wersja powiększona o t każdej części (kontur), tylko pozycje. */
function bake(list,ox,oy,oz,hullOnly){
  return mergeGeometries(list.map(p=>{TMP.makeRotationX(p.rx).setPosition(p.x-ox,p.y-oy,p.z-oz);
    if(hullOnly){SCL.makeScale(1+p.t,1+p.t,1+p.t);return posOnly(p.geo.clone().applyMatrix4(TMP.multiply(SCL)))}
    return tintGeo(p.geo.clone().applyMatrix4(TMP),p.c)}),hullOnly?['position']:['position','normal','color']);
}

DS.enemies.register({
  id:'gangster',name:'Bandyta',
  /** Buduje model i statystyki. Zwraca obiekt wroga (manager ustawia pozycję i dodaje do sceny). */
  create({boss=false,wave=0}={}){
    const g=new THREE.Group();const meshes=[];
    const suitCol=boss?0xe3a91a:pick([0xf2d024,0x2f6b4f,0x7a2533,0x3b4a6b,0xe8e2d2]);
    const C={suit:suitCol,pants:boss?0x15110e:0x2a2522,skin:pick(SKINTONES),dark:0x15110e,shirt:0xf4efe4,tie:0xd3242a,hat:boss?0xd3242a:0x3a2f28,gold:0xffd34a};
    // Jeden materiał na wroga (kolory w atrybucie wierzchołków), więc błysk trafienia (emissive) działa per wróg.
    // Części statyczne są scalone: korpus (+ręce, pistolet), głowa (+czapka, okulary) i dwie nogi (animowane przez biodra).
    // Razem 4 siatki + 3 kontury (korpus z głową, lewa noga, prawa noga) zamiast 15 siatek + 15 konturów.
    const mat=toon(0xffffff,{vertexColors:true});
    const parts={body:[],head:[],legL:[],legR:[]};
    const P_=(list,geo,c,x,y,z,t=.06,rx=0)=>list.push({geo,c,x,y,z,t,rx});
    for(const L of [parts.legL,parts.legR]){P_(L,box(.28,.86,.3),C.pants,0,-.43,0);P_(L,box(.3,.12,.42),C.dark,0,-.86,-.06)}
    P_(parts.body,box(.78,.82,.44),C.suit,0,1.26,0);
    P_(parts.body,box(.22,.5,.03),C.shirt,0,1.42,-.23,.02);
    P_(parts.body,box(.08,.42,.03),C.tie,0,1.36,-.25,.02);
    P_(parts.body,box(.2,.75,.24),C.suit,-.5,1.25,0);
    P_(parts.body,box(.2,.24,.72),C.suit,.44,1.46,-.3);
    P_(parts.body,box(.09,.15,.42),C.dark,.44,1.5,-.74);   // pistolet (punkt wylotu: obiekt `gun` niżej)
    P_(parts.head,geo('sph',()=>new THREE.SphereGeometry(.28,16,12)),C.skin,0,1.94,0,.08);
    P_(parts.head,box(.44,.09,.06),C.dark,0,1.97,-.25);
    P_(parts.head,box(.14,.06,.08),C.skin,0,1.84,-.27,.04);
    P_(parts.head,cyl(.38,.38,.04,18),C.hat,0,2.14,0);
    P_(parts.head,cyl(.22,.26,.24,18),C.hat,0,2.27,0);
    if(boss)P_(parts.body,geo('tor',()=>new THREE.TorusGeometry(.26,.04,6,16)),C.gold,0,1.6,-.12,.03,1.2);
    const hipL=new THREE.Group(),hipR=new THREE.Group();hipL.position.set(-.17,.86,0);hipR.position.set(.17,.86,0);g.add(hipL,hipR);
    const mk=(parent,list,part,oy=0)=>{const m=new THREE.Mesh(bake(list,0,oy,0),mat);m.position.set(0,oy,0);m.castShadow=true;m.userData.part=part;parent.add(m);meshes.push(m);return m};
    mk(g,parts.body,'body');mk(g,parts.head,'head',1.94);mk(hipL,parts.legL,'body');mk(hipR,parts.legR,'body');
    hullGeo(g,bake(parts.body.concat(parts.head),0,0,0,true));hullGeo(hipL,bake(parts.legL,0,0,0,true));hullGeo(hipR,bake(parts.legR,0,0,0,true));
    const gun=new THREE.Object3D();gun.position.set(.44,1.5,-.74);g.add(gun);
    if(boss)g.scale.setScalar(1.55);
    const w=wave;
    const e={g,meshes,mats:[mat],gun,hipL,hipR,boss,alive:true,dieT:0,
      hp:boss?520+w*45:62+w*7,maxHp:0,speed:boss?2.6:rand(2.8,3.4)+Math.min(w*.12,1.6),dmg:boss?14+w:5+w*.55,acc:boss?.55:.4+Math.min(w*.02,.25),
      shootT:rand(1.2,2.6),walk:rand(0,6),strafe:rand(-1,1),stepT:0,flashT:0,radius:boss?.8:.5,
      headY:1.94}; // wysokość środka głowy w układzie modelu (kadry komiksu)
    e.maxHp=e.hp;e.name=boss?'Baron Jackpot':'Bandyta';
    return e;
  },
  /** AI żywego wroga: dystans, krążenie, chód, błysk trafienia, strzał. eye = oczy gracza. */
  update(e,dt,eye){
    const G=S.G;
    const dx=P.pos.x-e.g.position.x,dz=P.pos.z-e.g.position.z,dist=Math.hypot(dx,dz)||1;
    e.g.rotation.y=Math.atan2(-dx,-dz);
    let vx=0,vz=0;const pref=e.boss?7:9;
    if(dist>pref){vx=dx/dist;vz=dz/dist}else if(dist<5){vx=-dx/dist*.6;vz=-dz/dist*.6}
    vx+=(-dz/dist)*e.strafe*.6;vz+=(dx/dist)*e.strafe*.6;
    if(Math.random()<dt*.4)e.strafe=rand(-1,1);
    const moving=Math.hypot(vx,vz)>.1;
    e.g.position.x+=vx*e.speed*dt;e.g.position.z+=vz*e.speed*dt;collide(e.g.position,e.radius);
    for(const o of G.enemies){if(o===e||!o.alive)continue;const ox=e.g.position.x-o.g.position.x,oz=e.g.position.z-o.g.position.z,od=Math.hypot(ox,oz),min=e.radius+o.radius;if(od<min&&od>.001){e.g.position.x+=ox/od*(min-od)*.5;e.g.position.z+=oz/od*(min-od)*.5}}
    if(moving){e.walk+=dt*9;e.hipL.rotation.x=Math.sin(e.walk)*.6;e.hipR.rotation.x=-Math.sin(e.walk)*.6;
      e.stepT-=dt;if(e.stepT<=0&&dist<24&&opt.onoma){e.stepT=.75;addFloater(pick(['tap','tap tap','tup']),{world:new THREE.Vector3(e.g.position.x,.3,e.g.position.z),size:18,life:.7,color:'#f4e7c5',vy:-10})}}
    if(e.flashT>0){e.flashT-=dt;const v=Math.max(e.flashT/.12,0);e.mats.forEach(m=>m.emissive.setRGB(v*.9,v*.15,v*.1))}
    e.shootT-=dt;
    if(e.shootT<=0&&!G.dead){
      e.shootT=e.boss?rand(.5,1.1):rand(1.1,2.4);
      const muzzle=e.gun.localToWorld(new THREE.Vector3(0,0,-.25));
      if(dist<45&&los(muzzle,eye)){
        const moveF=P.vel.length()>4?.65:1;const hit=Math.random()<e.acc*moveF*clamp(1.4-dist/40,.35,1.2);
        const end=eye.clone();if(!hit){end.x+=rand(-1.4,1.4);end.y+=rand(-.6,.8);end.z+=rand(-1.4,1.4)}
        addTracer(muzzle,end,0xff5533,.08);sfx('enemyShot',clamp(1.3-dist/40,.2,1));
        if(e.boss){for(let i=0;i<2;i++){const m2=end.clone();m2.x+=rand(-1,1);m2.z+=rand(-1,1);addTracer(muzzle,m2,0xff5533,.08)}}
        if(hit)hurt(e.dmg*rand(.85,1.15));
      }
    }
  },
});
