// Awatary pozostałych graczy: proceduralna postać z kitu wrogów (koszula i czapka w kolorze gracza), broń świata
// (getWorldModel), nick nad głową (canvas -> sprite; tekst przez fillText, nigdy HTML), interpolacja ~100 ms, powalenie.
import {DS} from '../core/ds.js';
import {scene} from '../render/renderer.js';
import {disposeObject} from '../render/materials.js';
import {humanModel,assemble,humanBase,SKIN} from '../enemies/kit.js';
import {COLORS,COLOR_CSS,colorOf,nameOf} from './session.js';
import {DELAY} from './interp.js';

const tmp=new Float32Array(5);
const FLASH_GEO=new THREE.SphereGeometry(.07,6,4);FLASH_GEO.userData.shared=true;
const FLASH_MAT=new THREE.MeshBasicMaterial({color:0xffe14a});FLASH_MAT.userData.shared=true;
const HAND={x:.14,y:.46,z:-.46};   // prawa dłoń w układzie tułowia (poza 'aim' z kit.humanBase)

function avatarModel(ci){
  const col=COLORS[ci];
  return humanModel('coopAvatar'+ci,(P,m)=>{
    humanBase(P,m,{skin:SKIN[ci%SKIN.length],shirt:col,sleeve:col,pants:0x2b2f3a,pose:'aim'});
    P.head.cyl(col,.112,.118,.075,0,m.headY+.1,0);                 // czapka w kolorze gracza
    P.head.box(col,.2,.02,.11,0,m.headY+.07,-.13);                 // daszek
    P.body.box(0x15110e,.38,.05,.24,0,1.02,0,{t:0});               // pasek
  });
}

function nameTag(text,css,down){
  const c=document.createElement('canvas');c.width=256;c.height=64;
  const g=c.getContext('2d');g.font='bold 34px Bangers, "Barlow Condensed", sans-serif';g.textAlign='center';g.textBaseline='middle';
  const label=String(text).slice(0,18)+(down?' · LEŻY':'');
  g.lineWidth=7;g.strokeStyle='#15110e';g.strokeText(label,128,32);g.fillStyle=down?'#ff6b5a':css;g.fillText(label,128,32);
  const tex=new THREE.CanvasTexture(c);tex.ownedByLevel=true;            // disposeObject zwolni teksturę razem z materiałem
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));
  s.scale.set(1.6,.4,1);s.position.y=2.25;s.renderOrder=20;s.raycast=()=>{};
  return s;
}

function weaponModel(id){
  const W=id&&DS.weapons.get(id);let m=null;
  try{if(W&&W.getWorldModel)m=W.getWorldModel()}catch(e){m=null}
  if(!m){m=new THREE.Mesh(new THREE.BoxGeometry(.06,.12,.4),new THREE.MeshToonMaterial({color:0x2a2a2a}));m.position.z=-.15}
  m.traverse(o=>{o.raycast=()=>{};o.castShadow=false});
  return m;
}

/** Buduje awatar gracza `r` (rekord z session.js) i dodaje do sceny. */
export function buildAvatar(r){
  if(r.avatar)return r.avatar;
  const ci=colorOf(r.id),model=avatarModel(ci),a=assemble(model,{shadow:true});
  a.meshes.forEach(m=>{m.raycast=()=>{}});                           // awatar nie jest celem strzałów (brak ognia przyjacielskiego)
  a.ci=ci;a.walk=0;a.sp=0;a.lx=null;a.lz=null;a.downK=0;a.flashT=0;a.down=false;a.w=null;
  a.tag=nameTag(nameOf(r.id),COLOR_CSS[ci],false);a.g.add(a.tag);
  a.gunRoot=new THREE.Group();a.gunRoot.position.set(HAND.x,HAND.y,HAND.z);a.torso.add(a.gunRoot);
  a.flash=new THREE.Mesh(FLASH_GEO,FLASH_MAT);a.flash.visible=false;a.flash.raycast=()=>{};a.gunRoot.add(a.flash);
  setWeapon(a,r.w);
  a.g.position.copy(r.pos);
  scene.add(a.g);
  r.avatar=a;return a;
}
function setWeapon(a,id){
  if(a.w===id&&a.gun)return;
  if(a.gun){a.gunRoot.remove(a.gun);disposeObject(a.gun);a.gun=null}
  a.w=id;a.gun=weaponModel(id);a.gunRoot.add(a.gun);
  const mz=a.gun.getObjectByName&&a.gun.getObjectByName('muzzle');
  if(mz){mz.updateMatrixWorld(true);a.flash.position.setFromMatrixPosition(mz.matrix)}else a.flash.position.set(0,.03,-.45);
}
export function destroyAvatar(r){
  const a=r.avatar;if(!a)return;r.avatar=null;
  disposeObject(a.g);
}
/** Błysk wylotu (cudzy strzał). */
export function flashAvatar(r){if(r.avatar){r.avatar.flashT=.06;r.avatar.flash.visible=true}}

/** Co klatkę: interpolacja pozycji/obrotu, nogi, powalenie, broń, nick. */
export function updateAvatar(r,dt){
  const a=r.avatar;if(!a)return;
  a.model.last=performance.now();                                   // kit.pruneModels nie może zwolnić geometrii żywego awatara
  if(r.w!==a.w)setWeapon(a,r.w);
  const s=r.buf.sample(tmp,DELAY);
  if(s){
    const x=s[0],y=s[1],z=s[2];
    if(a.lx!==null&&dt>0){const v=Math.hypot(x-a.lx,z-a.lz)/dt;a.sp+=(Math.min(v,12)-a.sp)*Math.min(1,dt*10)}
    a.lx=x;a.lz=z;
    a.g.position.set(x,Math.max(0,y),z);a.g.rotation.y=s[3];
    a.torso.rotation.x=s[4]*.45*(1-a.downK);
  }
  // nogi
  a.walk+=dt*(1.5+a.sp*2.1);const amp=Math.min(1,a.sp/4.5)*.8*(1-a.downK),sw=Math.sin(a.walk);
  a.hipL.rotation.x=sw*amp;a.hipR.rotation.x=-sw*amp;
  // powalenie: leży na plecach, nick czerwony
  if(r.down!==a.down){a.down=r.down;a.g.remove(a.tag);disposeObject(a.tag);a.tag=nameTag(nameOf(r.id),COLOR_CSS[a.ci],a.down);a.g.add(a.tag)}
  a.downK+=((r.down?1:0)-a.downK)*Math.min(1,dt*6);
  a.rig.rotation.x=-a.downK*Math.PI/2*.94;a.rig.position.y=a.downK*.18;a.tag.position.y=2.25-a.downK*1.6;
  a.gunRoot.visible=a.downK<.5;
  if(a.flashT>0){a.flashT-=dt;if(a.flashT<=0)a.flash.visible=false}
}
