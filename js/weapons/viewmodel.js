// Viewmodel: broń w dłoni przypięta do kamery, błysk wylotowy, skórki.
import {save} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {SKINS} from '../core/meta.js';
import {camera} from '../render/renderer.js';
import {toon,hull,disposeObject} from '../render/materials.js';
import {starTex} from '../render/textures.js';
import {P} from '../player/player.js';

export const gunMat1=toon(0x3a3835),gunMat2=toon(0x8a857c);
// Materiały skórek są współdzielone przez wszystkie modele: buildGun/disposeObject nie wolno ich zwalniać.
gunMat1.userData.shared=gunMat2.userData.shared=true;
/** Korzeń viewmodelu (dziecko kamery). Model zwrócony wylotem w −Z, jednostki: metry. */
export const gunRoot=new THREE.Group();camera.add(gunRoot);gunRoot.position.set(.22,-.2,-.42);
export const muzzleLocal=new THREE.Vector3();
export const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:starTex,depthTest:false,transparent:true}));flash.scale.set(.28,.28,1);flash.visible=false;flash.renderOrder=10;gunRoot.add(flash);
/** Addytywne przesunięcie/obrót viewmodelu (dla ds-gunfeel), dodawane po bazowej animacji. */
export const vmOffset={pos:new THREE.Vector3(),rot:new THREE.Vector3()};
let gunModel=null;

Object.assign(DS.player,{viewmodel:gunRoot,vmOffset,muzzleLocal,flash});

/** Buduje viewmodel broni `id`. Stary model jest zdejmowany i zwalniany (geometrie/materiały z pominięciem współdzielonych:
 *  `userData.shared`, gunMat1/2, inkMat, lineMat) razem z wpisami w `outlines`, więc zmiana broni nie przecieka.
 *  Broń bez `model()` dostaje prosty zastępczy klocek (gra się nie wywala). */
export function buildGun(id){
  if(gunModel){gunRoot.remove(gunModel);disposeObject(gunModel);gunModel=null}
  const g=new THREE.Group();
  const B=(w,h,d,x,y,z,m,rx=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.rotation.x=rx;hull(mesh,.09);g.add(mesh);return mesh};
  const W=DS.weapons.get(id);
  muzzleLocal.set(0,.02,-.25);
  if(W&&typeof W.model==='function')W.model({B,group:g,mat1:gunMat1,mat2:gunMat2,muzzle:muzzleLocal,hull});
  else B(.06,.1,.3,0,0,-.12,gunMat1);
  flash.position.copy(muzzleLocal);
  gunModel=g;gunRoot.add(g);
}
export function applySkin(){const s=SKINS.find(k=>k.id===save.skin)||SKINS[0];gunMat1.color.set(s.c1);gunMat2.color.set(s.c2);gunMat1.emissive.set(0);gunMat2.emissive.set(0);
  if(s.fx==='glow'){gunMat1.emissive.set(s.c1).multiplyScalar(.45);gunMat2.emissive.set(s.c2).multiplyScalar(.45)}
  if(s.fx==='gold')gunMat1.emissive.set(0x3a2600)}

/** Wygasza błysk wylotowy. */
export function tickFlash(dt){if(flash.visible){flash.userData.t-=dt;if(flash.userData.t<=0)flash.visible=false}}
/** Bazowa animacja broni (kołysanie, przeładowanie, odrzut) + efekty skórek. Wołane raz na klatkę gry. */
export function updateViewmodel(dt){
  const G=S.G,W=DS.weapons.get(G.weapon),o=vmOffset;
  const rl=G.reloadT>0?Math.sin(Math.min(1,(W.reload-G.reloadT)/W.reload)*Math.PI):0;
  gunRoot.position.set(.22+Math.cos(P.bob)*.012+o.pos.x,-.2+Math.abs(Math.sin(P.bob))*.012-rl*.12+o.pos.y,-.42+G.recoil*.06+o.pos.z);
  gunRoot.rotation.set(G.recoil*.18-rl*.8+o.rot.x,o.rot.y,rl*.4+o.rot.z);
  // skin fx
  const sk=SKINS.find(k=>k.id===save.skin);
  if(sk&&sk.fx==='rainbow'){gunMat1.color.setHSL((G.time*.25)%1,.8,.55);gunMat1.emissive.setHSL((G.time*.25+.5)%1,.8,.15)}
  if(sk&&sk.fx==='pulse')gunMat1.emissive.setRGB(.35+.25*Math.sin(G.time*4),.25+.18*Math.sin(G.time*4),0);
}
