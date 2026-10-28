// Statyczny świat scalany w kafelki: części dodawane przez addBox/addPart nie trafiają od razu do sceny,
// tylko do kubełków (kafelek TILE x TILE m, rodzaj). flushBatches() skleja każdy kubełek w JEDNĄ siatkę,
// więc budynek/skrzynia/ogrodzenie nie kosztują osobnych draw calli, a frustum culling nadal działa per kafelek.
// Kolory i powtórzenia tekstury okien są "wypieczone" w atrybutach wierzchołków (color, uv), dzięki czemu
// wszystkie części dzielą jeden materiał. Kontury: jeden scalony hull i jedne linie krawędzi na kafelek.
import {scene} from '../render/renderer.js';
import {opt} from '../core/save.js';
import {toon,inkMat,lineMat,outlines,noRay} from '../render/materials.js';
import {winCanvas} from '../render/textures.js';
import {mergeGeometries,posOnly} from '../render/merge.js';
import {world} from './state.js';

/** Bok kafelka [m]. Części dłuższe niż 2*TILE (np. chodnik wokół areny) trafiają do kubełka 'big'. */
export const TILE=16;
// Płaskie powierzchnie (dachy, skrzynie...) próbkują biały róg tekstury okien (lewy górny, piksel ~(4,4)).
const WU=.03,WV=.97;
const tex=new THREE.CanvasTexture(winCanvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
const triMat=toon(0xffffff,{map:tex,vertexColors:true});
const basicMat=new THREE.MeshBasicMaterial({vertexColors:true});
// Współdzielone przez wszystkie kafelki wszystkich poziomów: clearLevel (disposeObject) ich nie zwalnia.
triMat.userData.shared=basicMat.userData.shared=true;

/** Opis powierzchni: materiał toon (bierze color i map.repeat) albo {color, rx, ry} (rx>0 = okna powtórzone rx x ry). */
export function spec(m){
  if(m.isMaterial)return {c:m.color,rx:m.map?m.map.repeat.x:0,ry:m.map?m.map.repeat.y:0};
  return {c:new THREE.Color(m.color),rx:m.rx||0,ry:m.ry||0};
}

/** Wypieka kolor i UV w (sklonowanej) geometrii. specs: jeden spec albo tablica wg materialIndex grup. */
function paint(g,specs){
  const n=g.attributes.position.count,col=new Float32Array(n*3),uv=g.attributes.uv&&g.attributes.uv.array;
  const per=Array.isArray(specs),vs=per?new Array(n):null;
  if(per){const idx=g.index.array;for(const gr of g.groups){const s=specs[gr.materialIndex];for(let i=gr.start;i<gr.start+gr.count;i++)vs[idx[i]]=s}}
  for(let v=0;v<n;v++){const s=per?vs[v]:specs;col[v*3]=s.c.r;col[v*3+1]=s.c.g;col[v*3+2]=s.c.b;
    if(uv){if(s.rx){uv[v*2]*=s.rx;uv[v*2+1]*=s.ry}else{uv[v*2]=WU;uv[v*2+1]=WV}}}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
}

const B=new Map(),SC=new THREE.Matrix4();
function bucket(key,kind,init){let b=B.get(key);if(!b){b=Object.assign({kind,geos:[]},init);B.set(key,b)}return b}

/**
 * Dodaje część świata (geometria `geo` w układzie lokalnym, `matrix` = jej pozycja/obrót w świecie).
 * o: cast (cień, domyślnie true), receive (odbiera cień, true), ray (trafiana raycastem: trafia do world.meshes, true),
 *    hull:t (kontur-kadłub zamiast krawędzi), edges:false (bez konturu), basic:true (MeshBasic, kolor bez oświetlenia),
 *    group:'nazwa' (jeden globalny kubełek zamiast kafelków, np. koła aut).
 */
export function addPart(geo,matrix,mat,o={}){
  const cast=o.cast!==false,recv=o.receive!==false,ray=o.ray!==false;
  const g=geo.clone().applyMatrix4(matrix);g.computeBoundingBox();const bb=g.boundingBox;
  const big=bb.max.x-bb.min.x>2*TILE||bb.max.z-bb.min.z>2*TILE;
  const tile=big?'big':Math.floor((bb.min.x+bb.max.x)/2/TILE)+','+Math.floor((bb.min.z+bb.max.z)/2/TILE);
  const kind=o.basic?'basic':'tri';
  const b=bucket(o.group?'g:'+o.group:'t:'+tile+':'+kind+(cast?1:0)+(recv?1:0)+(ray?1:0),kind,{cast,recv,ray,names:o.basic?['position','color']:['position','normal','uv','color']});
  paint(g,Array.isArray(mat)?mat.map(spec):spec(mat));b.geos.push(g);
  if(o.hull){const t=1+o.hull;SC.makeScale(t,t,t);
    bucket('h:'+tile,'hull',{names:['position']}).geos.push(posOnly(geo.clone().applyMatrix4(new THREE.Matrix4().copy(matrix).multiply(SC))))}
  else if(o.edges!==false)bucket('e:'+tile,'line',{names:['position']}).geos.push(new THREE.EdgesGeometry(g,25));
}

/** Porzuca zebrane, niesklejone części (np. gdy build() poziomu rzucił wyjątek). */
export function resetBatches(){B.clear()}

/** Skleja zebrane części w siatki i dodaje je do sceny. Zwraca utworzone obiekty. Wołane po L.build() w loadLevel. */
export function flushBatches(){
  const made=[];
  for(const b of B.values()){
    const g=mergeGeometries(b.geos,b.names);let o;
    if(b.kind==='line'){o=new THREE.LineSegments(g,lineMat);o.raycast=noRay;o.visible=!!opt.outlines;outlines.push(o)}
    else if(b.kind==='hull'){o=new THREE.Mesh(g,inkMat);o.raycast=noRay;o.visible=!!opt.outlines;outlines.push(o)}
    else{o=new THREE.Mesh(g,b.kind==='basic'?basicMat:triMat);o.castShadow=b.cast;o.receiveShadow=b.recv;if(b.ray)world.meshes.push(o)}
    o.matrixAutoUpdate=false;scene.add(o);made.push(o);
  }
  B.clear();return made;
}
