// Materiały toon i kontury komiksowe (tusz).
import {opt} from '../core/save.js';
import {scene} from './renderer.js';

export const gradTex=(()=>{const t=new THREE.DataTexture(new Uint8Array([60,150,255]),3,1,THREE.LuminanceFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t})();
/** Materiał toon z 3-stopniowym gradientem. */
export const toon=(c,x)=>new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:gradTex},x||{}));
export const inkMat=new THREE.MeshBasicMaterial({color:0x15110e,side:THREE.BackSide});
export const lineMat=new THREE.LineBasicMaterial({color:0x15110e});
/** Wszystkie obiekty konturów (przełączane opcją `outlines`). */
export const outlines=[];
export const noRay=()=>{};
/** Kontur „odwrócony kadłub”: kopia siatki w tuszu, BackSide, powiększona o t. Dla obiektów zaokrąglonych. */
export function hull(mesh,t){const o=new THREE.Mesh(mesh.geometry,inkMat);o.scale.setScalar(1+t);o.raycast=noRay;o.visible=!!opt.outlines;mesh.add(o);outlines.push(o);return o}
/** Kontur z gotowej geometrii kadłuba (np. scalonej z wielu części, już powiększonej): dziecko `parent`, tusz, BackSide. */
export function hullGeo(parent,geo){const o=new THREE.Mesh(geo,inkMat);o.raycast=noRay;o.visible=!!opt.outlines;parent.add(o);outlines.push(o);return o}
/** Kontur liniami krawędzi (EdgesGeometry, próg 25°). Dla brył kanciastych. */
export function edges(mesh){const l=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,25),lineMat);l.raycast=noRay;l.visible=!!opt.outlines;mesh.add(l);outlines.push(l)}
/** Zdejmuje `root` ze sceny i zwalnia jego geometrie/materiały (z pominięciem współdzielonych:
 *  `userData.shared`, inkMat, lineMat) oraz usuwa jego kontury z listy `outlines`. */
export function disposeObject(root){
  scene.remove(root);
  const dead=new Set();
  root.traverse(o=>{dead.add(o);if(o.isInstancedMesh&&o.dispose)o.dispose();
    if(o.geometry&&!o.isSprite&&!(o.geometry.userData&&o.geometry.userData.shared))o.geometry.dispose(); // Sprite: geometria wspólna dla całego three

    const ms=o.material&&(Array.isArray(o.material)?o.material:[o.material]);
    if(ms)for(const m of ms)if(m!==inkMat&&m!==lineMat&&!(m.userData&&m.userData.shared))m.dispose()});
  for(let i=outlines.length-1;i>=0;i--)if(dead.has(outlines[i]))outlines.splice(i,1);
}
/** Usuwa z listy kontury obiektów odpiętych od sceny. */
export function pruneOutlines(){for(let i=outlines.length-1;i>=0;i--){let p=outlines[i];while(p.parent)p=p.parent;if(p!==scene)outlines.splice(i,1)}}
