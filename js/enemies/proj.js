// Pociski i efekty wrogów: rzucane przedmioty po łuku (butelka, żeton, petarda), wybuchy, fale uderzeniowe, kałuże, wiązki (laser/telegraf).
// Geometrie i materiały stałe są współdzielone (`shared`). Wszystko jest sprzątane na `levelStart`/`levelEnd`/`levelUnload`
// (sceny nie zostają po biegu: tests/integration.js sprawdza liczbę dzieci sceny).
import {rand,clamp} from '../core/util.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {scene} from '../render/renderer.js';
import {toon} from '../render/materials.js';
import {puff} from '../render/fx3d.js';
import {addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {world} from '../world/state.js';
import {hurt} from '../game/combat.js';
import * as nav from './nav.js';

const sh=o=>(o.userData.shared=true,o);
const GEO={bottle:sh(new THREE.CylinderGeometry(.04,.05,.28,6)),chip:sh(new THREE.CylinderGeometry(.15,.15,.04,10)),petard:sh(new THREE.CylinderGeometry(.035,.035,.24,6)),
  puddle:sh(new THREE.CircleGeometry(1,18)),ball:sh(new THREE.SphereGeometry(1,14,10)),ring:sh(new THREE.CylinderGeometry(1,1,1,36,1,true)),box:sh(new THREE.BoxGeometry(1,1,1))};
GEO.puddle.rotateX(-Math.PI/2);
const MAT={bottle:sh(toon(0x5f8a2a)),chip:sh(toon(0xd3242a)),petard:sh(toon(0xd3242a,{emissive:0x331100})),
  puddle:sh(new THREE.MeshBasicMaterial({color:0xd9a441,transparent:true,opacity:.8,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,depthWrite:false})),
  glass:sh(new THREE.MeshBasicMaterial({color:0xcfe9d6,transparent:true,opacity:.35,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,depthWrite:false}))};
const G_ACC=14;
const projs=[],puddles=[],fx=[],waves=[];
const BEAMS=[];
const V=new THREE.Vector3();

/* ---------- pociski ---------- */
/**
 * Rzuca przedmiot `kind` ('bottle'|'chip'|'petard') z punktu `from` w punkt (tx,ty,tz) po łuku.
 * o: {speed (m/s poziomo), dmg, fuse (s, petarda), r (promień wybuchu), owner, splash (promień rozbryzgu)}
 */
export function throwProj(kind,from,tx,ty,tz,o={}){
  const G=S.G;if(!G)return null;
  const mesh=new THREE.Mesh(GEO[kind],MAT[kind]);mesh.position.copy(from);mesh.castShadow=false;scene.add(mesh);
  const dx=tx-from.x,dz=tz-from.z,d=Math.hypot(dx,dz)||1,sp=o.speed||14,T=Math.max(.25,d/sp);
  const p={kind,mesh,vx:dx/T,vz:dz/T,vy:(ty-from.y+.5*G_ACC*T*T)/T,t:0,dmg:o.dmg||8,fuse:o.fuse||0,r:o.r||3.5,splash:o.splash||1.6,owner:o.owner,spin:rand(-12,12),rest:false};
  projs.push(p);return p;
}
function wallHit(x,y,z){
  for(const c of world.colliders)if(x>c.x0&&x<c.x1&&z>c.z0&&z<c.z1&&y<(c.h===undefined?9:c.h))return true;
  return false;
}
function impact(p,direct){
  const x=p.mesh.position.x,z=p.mesh.position.z;
  switch(p.kind){
    case 'bottle':{
      sfx('e_glass');addFloater('KRASZ!',{world:V.set(x,.8,z).clone(),size:30,life:.6,color:'#cfe9d6',vy:-30,rot:rand(-.2,.2)});
      puddle(x,z,{r:rand(1.1,1.5),life:7,dmg:p.dmg*.25});
      const dp=Math.hypot(P.pos.x-x,P.pos.z-z);
      if(direct)hurt(p.dmg);else if(dp<p.splash&&P.pos.y<1)hurt(p.dmg*.5);
      break}
    case 'chip':if(direct)hurt(p.dmg);addFloater('ŻETON!',{world:V.set(x,1,z).clone(),size:22,life:.5,color:'#ffe14a',vy:-30});break;
    case 'petard':p.rest=true;p.vx=p.vy=p.vz=0;p.mesh.position.y=Math.max(p.mesh.position.y,.1);return false;   // leży i syczy do końca lontu
  }
  return true;
}
function killProj(p){scene.remove(p.mesh);p.dead=true}

/* ---------- kałuże ---------- */
/** Kałuża piwa z odłamkami szkła: rani gracza stojącego w środku (tykanie co 0,5 s). */
export function puddle(x,z,{r=1.2,life=7,dmg=1.5}={}){
  while(puddles.length>=10){killPuddle(puddles.shift())}
  const m=new THREE.Mesh(GEO.puddle,MAT.puddle);m.position.set(x,.035,z);m.scale.set(r,1,r);m.rotation.y=rand(0,6);scene.add(m);
  puddles.push({mesh:m,x,z,r,life,t:0,dmg,tick:.3,warned:false});
}
function killPuddle(q){scene.remove(q.mesh)}

/* ---------- wybuchy i fale ---------- */
/** Wybuch w (x,y,z): obrażenia gracza malejące z odległością (mur zasłania w 70%), odrzut, błysk i dym. */
export function explode(x,y,z,{r=4.5,dmg=30,color=0xff9a2a,shake=1.1}={}){
  const G=S.G;if(!G)return;
  sfx('e_boom');
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false});
  const m=new THREE.Mesh(GEO.ball,mat);m.position.set(x,Math.max(y,.4),z);m.scale.setScalar(.3);scene.add(m);fx.push({mesh:m,mat,t:0,life:.38,r});
  for(let i=0;i<4;i++)puff(V.set(x+rand(-1,1),Math.max(y,.4)+rand(0,1),z+rand(-1,1)));
  addFloater('BUUM!',{world:V.set(x,2,z).clone(),size:56,life:.8,color:'#ffb12a',vy:-40,rot:rand(-.3,.3),burst:true});
  const px=P.pos.x,py=P.pos.y+.9,pz=P.pos.z,d=Math.hypot(px-x,py-y,pz-z);
  if(!G.dead&&d<r){
    let f=1-(d/r)*.7;if(!nav.gridLos(x,z,px,pz))f*=.3;
    hurt(dmg*f);G.shake+=shake*f;
    const dx=px-x,dz=pz-z,l=Math.hypot(dx,dz)||1;P.vel.x+=dx/l*9*f;P.vel.z+=dz/l*9*f;
  }else if(d<r*2)G.shake+=shake*.3;
}
/** Fala uderzeniowa po ziemi (DJ): pierścień rośnie od (x,z); gracz na ziemi w pasie fali dostaje obrażenia raz — trzeba skoczyć. */
export function shockwave(x,z,{speed=9,max=26,dmg=18,color=0xff4fd8,height=.55}={}){
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false});
  const m=new THREE.Mesh(GEO.ring,mat);m.position.set(x,height/2,z);m.scale.set(.5,height,.5);scene.add(m);
  waves.push({mesh:m,mat,x,z,r:.5,speed,max,dmg,height,hit:false});sfx('e_bass');
}

/* ---------- wiązki (laser snajpera, telegrafy bossów) ---------- */
/** Wiązka z puli. Zwraca {mesh,mat,set(ax,ay,az,bx,by,bz,w,color,opacity),release()}. */
export function beam(){
  let b=BEAMS.find(q=>!q.used);
  if(!b){const mat=new THREE.MeshBasicMaterial({color:0xff2222,transparent:true,opacity:.8,depthWrite:false});const mesh=new THREE.Mesh(GEO.box,mat);mesh.raycast=()=>{};mesh.frustumCulled=false;
    b={mesh,mat,used:false,
      set(ax,ay,az,bx,by,bz,w=.04,color,opacity){
        const m=this.mesh;m.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);
        const len=Math.hypot(bx-ax,by-ay,bz-az)||.01;m.scale.set(w,w,len);m.lookAt(bx,by,bz);
        if(color!==undefined)this.mat.color.setHex(color);if(opacity!==undefined)this.mat.opacity=opacity;
      },
      release(){if(this.used){this.used=false;scene.remove(this.mesh)}}};
    BEAMS.push(b)}
  b.used=true;scene.add(b.mesh);return b;
}

/* ---------- aktualizacja ---------- */
export function updateProj(dt){
  const G=S.G;if(!G)return;
  for(const p of projs){
    p.t+=dt;const m=p.mesh;
    if(p.kind==='petard'){
      p.fuse-=dt;
      if(p.fuse<=0){explode(m.position.x,m.position.y,m.position.z,{r:p.r,dmg:p.dmg,shake:.7});killProj(p);continue}
      const blink=Math.sin(p.t*30)>0?.9:.2;MAT.petard.emissive.setRGB(blink,blink*.35,0);
      if(Math.floor(p.t*5)!==Math.floor((p.t-dt)*5))sfx('e_fuse',p.t/(p.t+p.fuse));
    }
    if(!p.rest){
      p.vy-=G_ACC*dt;m.position.x+=p.vx*dt;m.position.y+=p.vy*dt;m.position.z+=p.vz*dt;
      m.rotation.x+=p.spin*dt;m.rotation.z+=p.spin*.6*dt;
      const pos=m.position;
      if(p.kind!=='petard'&&!G.dead&&Math.hypot(pos.x-P.pos.x,pos.z-P.pos.z)<.6&&pos.y>P.pos.y&&pos.y<P.pos.y+1.9){if(impact(p,true))killProj(p);continue}
      if(pos.y<=.12){pos.y=.12;if(impact(p,false))killProj(p);continue}
      if(wallHit(pos.x,pos.y,pos.z)){if(p.kind==='petard'){p.vx*=-.2;p.vz*=-.2;p.vy=Math.abs(p.vy)*.2}else{if(impact(p,false))killProj(p);continue}}
    }
    if(p.t>8){killProj(p)}
  }
  compact(projs);
  for(const q of puddles){
    q.t+=dt;const k=q.t>q.life-1?Math.max(0,q.life-q.t):1;
    q.mesh.scale.set(q.r*k,1,q.r*k);
    if(!G.dead&&P.pos.y<.4&&Math.hypot(P.pos.x-q.x,P.pos.z-q.z)<q.r*.9){
      q.tick-=dt;if(q.tick<=0){q.tick=.5;hurt(q.dmg);if(!q.warned){q.warned=true;addFloater('SZKŁO!',{world:V.set(P.pos.x,1.6,P.pos.z).clone(),size:26,life:.6,color:'#cfe9d6',vy:-30})}}
    }
    if(q.t>=q.life){killPuddle(q);q.dead=true}
  }
  compact(puddles);
  for(const f of fx){
    f.t+=dt;const k=f.t/f.life,s=.3+(f.r*.55-.3)*Math.min(1,k*2.2);f.mesh.scale.setScalar(s);f.mat.opacity=.9*Math.max(0,1-k);
    if(f.t>=f.life){scene.remove(f.mesh);f.mat.dispose();f.dead=true}
  }
  compact(fx);
  for(const w of waves){
    w.r+=w.speed*dt;w.mesh.scale.set(w.r,w.height,w.r);w.mat.opacity=.7*(1-w.r/w.max);
    if(!w.hit&&!G.dead&&P.pos.y<.45){
      const d=Math.hypot(P.pos.x-w.x,P.pos.z-w.z);
      if(Math.abs(d-w.r)<.9){w.hit=true;hurt(w.dmg);const dx=P.pos.x-w.x,dz=P.pos.z-w.z,l=Math.hypot(dx,dz)||1;P.vel.x+=dx/l*7;P.vel.z+=dz/l*7;G.shake+=.6}
    }
    if(w.r>=w.max){scene.remove(w.mesh);w.mat.dispose();w.dead=true}
  }
  compact(waves);
}
function compact(a){let j=0;for(let i=0;i<a.length;i++)if(!a[i].dead)a[j++]=a[i];a.length=j}

/** Usuwa wszystko, co wrogowie rozrzucili po scenie (koniec biegu, nowy bieg, zmiana poziomu). */
export function clearProj(){
  for(const p of projs)scene.remove(p.mesh);projs.length=0;
  for(const q of puddles)killPuddle(q);puddles.length=0;
  for(const f of fx){scene.remove(f.mesh);f.mat.dispose()}fx.length=0;
  for(const w of waves){scene.remove(w.mesh);w.mat.dispose()}waves.length=0;
  for(const b of BEAMS)b.release();
}
export const projCount=()=>({projs:projs.length,puddles:puddles.length,fx:fx.length,waves:waves.length,beams:BEAMS.filter(b=>b.used).length});
DS.bus.on('levelStart',clearProj);DS.bus.on('levelEnd',clearProj);DS.bus.on('levelUnload',clearProj);
