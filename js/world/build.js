// Klocki do budowy świata, używane przez world/props i world/levels.
// Części nie są osobnymi siatkami: addBox/addPart zbierają je w kafelkach (world/batch.js), a loadLevel skleja
// je po build() w kilka siatek. Zwrócone obiekty to niewidoczne zaślepki (pozycja + userData), nie ma ich w scenie.
import {world} from './state.js';
import {addPart} from './batch.js';

/**
 * Prostopadłościan stojący na y (dół bryły = y), środek w (x,z).
 * mat: materiał toon albo {color,rx,ry} albo 6 takich (kolejność ścian BoxGeometry: +x,-x,+y,-y,+z,-z);
 *   liczy się tylko kolor i powtórzenie tekstury okien (rx>0), reszta materiału jest ignorowana.
 * o: {hull:t (kontur kadłubem zamiast krawędzi), collide:false, cast:false}
 */
export function addBox(w,h,d,x,y,z,mat,o={}){
  addPart(new THREE.BoxGeometry(w,h,d),new THREE.Matrix4().makeTranslation(x,y+h/2,z),mat,{cast:o.cast!==false,hull:o.hull||0});
  if(o.collide!==false)world.colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,h:y+h});
  const p=new THREE.Object3D();p.position.set(x,y+h/2,z);p.userData.box={w,h,d};return p;
}
/** Kamienica z oknami (tekstura powtarzana co ~4 m) i gzymsem. */
export function building(w,h,d,x,z,col){
  const ry=Math.max(1,Math.round(h/4)),rd=Math.round(d/4)||1,rw=Math.round(w/4)||1;
  const side=(rx)=>({color:col,rx,ry});
  const roof={color:new THREE.Color(col).multiplyScalar(.7)};
  const m=addBox(w,h,d,x,0,z,[side(rd),side(rd),roof,roof,side(rw),side(rw)]);
  addBox(w+.4,.5,d+.4,x,h,z,{color:0x3d3027},{collide:false,cast:false});
  return m;
}
