// Scalanie geometrii (three r128 z CDN nie ma BufferGeometryUtils). Mniej siatek = mniej draw calli.
// Wszystkie scalane geometrie muszą mieć te same atrybuty i być obie indeksowane albo obie nie.

/** Skleja geometrie w jedną. `names`: atrybuty do przepisania (domyślnie position, normal, uv). */
export function mergeGeometries(geos,names=['position','normal','uv']){
  const indexed=geos[0].index!==null;let nv=0,ni=0;
  for(const g of geos){if((g.index!==null)!==indexed)throw new Error('mergeGeometries: mieszane indeksowanie');nv+=g.attributes.position.count;if(indexed)ni+=g.index.count}
  const out=new THREE.BufferGeometry();
  for(const n of names){
    const size=geos[0].attributes[n].itemSize,arr=new Float32Array(nv*size);let o=0;
    for(const g of geos){const a=g.attributes[n];if(!a||a.itemSize!==size)throw new Error('mergeGeometries: brak atrybutu '+n);arr.set(a.array,o);o+=a.array.length}
    out.setAttribute(n,new THREE.BufferAttribute(arr,size));
  }
  if(indexed){
    const idx=nv>65535?new Uint32Array(ni):new Uint16Array(ni);let io=0,vo=0;
    for(const g of geos){const s=g.index.array;for(let i=0;i<s.length;i++)idx[io+i]=s[i]+vo;io+=s.length;vo+=g.attributes.position.count}
    out.setIndex(new THREE.BufferAttribute(idx,1));
  }
  return out;
}

/** Kopia geometrii przesunięta/obrócona/skalowana macierzą `m` (THREE.Matrix4). */
export function bakeGeo(geo,m){return geo.clone().applyMatrix4(m)}

/** Dopisuje stały kolor wierzchołków (atrybut `color`, vec3) do geometrii (modyfikuje i zwraca ją). */
export function tintGeo(geo,color){
  const n=geo.attributes.position.count,c=new THREE.Color(color),a=new Float32Array(n*3);
  for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}
  geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;
}

/** Geometria tylko z pozycji (+ indeks): dla konturów-kadłubów (materiał basic, bez oświetlenia). */
export function posOnly(geo){const g=new THREE.BufferGeometry();g.setAttribute('position',geo.attributes.position);if(geo.index)g.setIndex(geo.index);return g}
