// Kolizje walca (promień r) z AABB świata oraz linia wzroku.
import {clamp} from '../core/util.js';
import {world} from '../world/state.js';

/** Wypycha punkt p (Vector3, używa x/z) poza collidery i przycina do areny. */
export function collide(p,r){
  const A=world.arena;
  for(const c of world.colliders){const cx=clamp(p.x,c.x0,c.x1),cz=clamp(p.z,c.z0,c.z1);const dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;
    if(d2<r*r){if(d2>1e-8){const d=Math.sqrt(d2);p.x=cx+dx/d*r;p.z=cz+dz/d*r}else{const l=p.x-c.x0,rr=c.x1-p.x,b=p.z-c.z0,f=c.z1-p.z,m=Math.min(l,rr,b,f);if(m===l)p.x=c.x0-r;else if(m===rr)p.x=c.x1+r;else if(m===b)p.z=c.z0-r;else p.z=c.z1+r}}}
  p.x=clamp(p.x,-A+r,A-r);p.z=clamp(p.z,-A+r,A-r);
}

const rayc=new THREE.Raycaster(),dir=new THREE.Vector3();
/** true, jeśli między punktami nie ma statycznej geometrii. */
export function los(from,to){dir.subVectors(to,from);const d=dir.length();dir.normalize();rayc.set(from,dir);rayc.far=d;const h=rayc.intersectObjects(world.meshes,false);rayc.far=Infinity;return !h.length}
