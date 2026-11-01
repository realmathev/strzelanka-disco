// Pociski i efekty wrogów: rzucane przedmioty po łuku (butelka, żeton, petarda), wybuchy, fale uderzeniowe, kałuże, wiązki (laser/telegraf).
// Geometrie i materiały stałe są współdzielone (`shared`). Wszystko jest sprzątane na `levelStart`/`levelEnd`/`levelUnload`
// (sceny nie zostają po biegu: tests/integration.js sprawdza liczbę dzieci sceny).
// Co-op: obrażenia liczy host dla każdego gracza (players.eachPlayer); host wysyła efekty (DS.net.fxEv), klient odtwarza je bez obrażeń
// (`replay`: pocisk znika przy uderzeniu, kałuże/wybuchy/zapłon przychodzą osobno od hosta). Wiązki klient dostaje w snapshocie (beamSnap/applyBeams).
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
import {eachPlayer,isLocal,hitOnce} from './players.js';

const sh=o=>(o.userData.shared=true,o);
const GEO={bottle:sh(new THREE.CylinderGeometry(.04,.05,.28,6)),chip:sh(new THREE.CylinderGeometry(.15,.15,.04,10)),petard:sh(new THREE.CylinderGeometry(.035,.035,.24,6)),
  puddle:sh(new THREE.CircleGeometry(1,18)),milk:sh(new THREE.SphereGeometry(.13,10,8)),jerry:sh(new THREE.BoxGeometry(.22,.32,.12)),ball:sh(new THREE.SphereGeometry(1,14,10)),ring:sh(new THREE.CylinderGeometry(1,1,1,36,1,true)),box:sh(new THREE.BoxGeometry(1,1,1))};
GEO.puddle.rotateX(-Math.PI/2);GEO.bimber=GEO.milk;
const pudMat=(c,o)=>sh(new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,depthWrite:false}));
const MAT={milk:sh(toon(0xf7f3e8)),bimber:sh(toon(0xe0b040,{emissive:0x221400})),jerry:sh(toon(0xd3242a)),pmilk:pudMat(0xf4f0e6,.85),pbimber:pudMat(0xd9a030,.8),pfuel:pudMat(0x4a3a18,.85),pfire:pudMat(0xff7a1a,.9),bottle:sh(toon(0x5f8a2a)),chip:sh(toon(0xd3242a)),petard:sh(toon(0xd3242a,{emissive:0x331100})),
  puddle:sh(new THREE.MeshBasicMaterial({color:0xd9a441,transparent:true,opacity:.8,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,depthWrite:false})),
  glass:sh(new THREE.MeshBasicMaterial({color:0xcfe9d6,transparent:true,opacity:.35,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,depthWrite:false}))};
const G_ACC=14;
const projs=[],puddles=[],fx=[],waves=[];
let stunT=0;                                   // ogłuszenie gracza (gwizdek): drżenie kamery + spowolnienie
const BEAMS=[];
const V=new THREE.Vector3();

/* ---------- co-op ---------- */
const client=()=>DS.net.isClient();
let nid=0;
/** Host: efekt do klientów (pole `ev` snapshotu). Kosmetyka z wnętrza efektu (napisy, dźwięki) nie idzie osobno: klient odtwarza całość. */
function fxEv(o){if(DS.net.isHost()&&DS.net.fxEv)DS.net.fxEv(o)}
function muted(fn){const t=S.fxTap;S.fxTap=null;try{return fn()}finally{S.fxTap=t}}
const q=v=>Math.round(v*100)/100;

/* ---------- pociski ---------- */
/**
 * Rzuca przedmiot `kind` ('bottle'|'chip'|'petard') z punktu `from` w punkt (tx,ty,tz) po łuku.
 * o: {speed (m/s poziomo), dmg, fuse (s, petarda), r (promień wybuchu), owner, splash (promień rozbryzgu)}
 */
export function throwProj(kind,from,tx,ty,tz,o={}){
  const G=S.G;if(!G)return null;
  const mesh=new THREE.Mesh(GEO[kind],MAT[kind]);mesh.position.copy(from);mesh.castShadow=false;scene.add(mesh);
  const dx=tx-from.x,dz=tz-from.z,d=Math.hypot(dx,dz)||1,sp=o.speed||14,T=Math.max(.25,d/sp);
  const p={kind,mesh,vx:dx/T,vz:dz/T,vy:(ty-from.y+.5*G_ACC*T*T)/T,t:0,dmg:o.dmg||8,fuse:o.fuse||0,r:o.r||3.5,splash:o.splash||1.6,owner:o.owner,ignite:!!o.ignite,spin:rand(-12,12),rest:false};
  projs.push(p);
  if(DS.net.isHost()){p.nid=++nid;fxEv({t:'fx',f:'th',k:kind,id:p.nid,a:[q(from.x),q(from.y),q(from.z),q(tx),q(ty),q(tz),sp,o.fuse||0,o.r||3.5,o.ignite?1:0]})}
  return p;
}
function wallHit(x,y,z){
  for(const c of world.colliders)if(x>c.x0&&x<c.x1&&z>c.z0&&z<c.z1&&y<(c.h===undefined?9:c.h))return true;
  return false;
}
/** Rozbryzg: obrażenia każdemu graczowi na ziemi w promieniu r (w solo: jak dawniej, tylko gracz). */
function splash(x,z,r,dmg){eachPlayer(()=>{if(Math.hypot(P.pos.x-x,P.pos.z-z)<r&&P.pos.y<1)hurt(dmg)})}
function impact(p,direct){
  const x=p.mesh.position.x,z=p.mesh.position.z;
  if(p.replay){if(p.kind==='petard'){p.rest=true;p.vx=p.vy=p.vz=0;p.mesh.position.y=Math.max(p.mesh.position.y,.1);return false}return true}   // klient: efekty uderzenia przysyła host
  switch(p.kind){
    case 'bottle':{
      sfx('e_glass');addFloater('KRASZ!',{world:V.set(x,.8,z).clone(),size:30,life:.6,color:'#cfe9d6',vy:-30,rot:rand(-.2,.2)});
      puddle(x,z,{r:rand(1.1,1.5),life:7,dmg:p.dmg*.25});
      if(direct)hurt(p.dmg);else splash(x,z,p.splash,p.dmg*.5);
      break}
    case 'milk':case 'bimber':{
      sfx('e_splash');addFloater(p.kind==='milk'?'PLUM!':'BIMBER!',{world:V.set(x,.8,z).clone(),size:30,life:.6,color:p.kind==='milk'?'#f4f0e6':'#ffd34a',vy:-30,rot:rand(-.2,.2)});
      puddle(x,z,{r:rand(1.2,1.6),life:6,dmg:p.dmg*.22,kind:p.kind});
      if(direct)hurt(p.dmg);else splash(x,z,p.splash,p.dmg*.5);
      break}
    case 'jerry':{
      sfx('e_glass');addFloater('KANISTER!',{world:V.set(x,.8,z).clone(),size:30,life:.6,color:'#ff8a3a',vy:-30,rot:rand(-.2,.2)});
      puddle(x,z,{r:rand(1.9,2.3),life:10,dmg:0,kind:'fuel',fdmg:p.dmg*.3});
      if(direct)hurt(p.dmg*.5);
      if(p.ignite){explode(x,.4,z,{r:3.4,dmg:p.dmg*.6,shake:.6});igniteFuel(.25)}
      break}
    case 'chip':if(direct)hurt(p.dmg);addFloater('ŻETON!',{world:V.set(x,1,z).clone(),size:22,life:.5,color:'#ffe14a',vy:-30});break;
    case 'petard':p.rest=true;p.vx=p.vy=p.vz=0;p.mesh.position.y=Math.max(p.mesh.position.y,.1);return false;   // leży i syczy do końca lontu
  }
  return true;
}
function killProj(p){scene.remove(p.mesh);p.dead=true;if(p.nid&&!p.replay)fxEv({t:'fx',f:'pk',id:p.nid})}

/* ---------- kałuże ---------- */
/**
 * Kałuża: rodzaj `kind` = 'glass' (piwo z odłamkami, domyślna), 'milk', 'bimber' (rani gracza stojącego w środku, tykanie co 0,5 s),
 * 'fuel' (paliwo: nieszkodliwe, dopóki nie zostanie podpalone przez `igniteFuel`) albo 'fire' (płonące paliwo; `fdmg` = obrażenia za tykanie).
 */
export function puddle(x,z,{r=1.2,life=7,dmg=1.5,kind='glass',fdmg=3}={}){
  while(puddles.length>=18){killPuddle(puddles.shift())}
  const m=new THREE.Mesh(GEO.puddle,MAT[kind==='glass'?'puddle':'p'+kind]);m.position.set(x,.035+(kind==='fire'?.01:0),z);m.scale.set(r,1,r);m.rotation.y=rand(0,6);scene.add(m);
  puddles.push({mesh:m,x,z,r,life,t:0,dmg,fdmg,kind,ign:0,tick:.3,tk:null,wn:null});
  fxEv({t:'fx',f:'pu',k:kind,a:[q(x),q(z),q(r),q(life)]});
}
function killPuddle(q){scene.remove(q.mesh)}
function ignite(q){
  q.kind='fire';q.mesh.material=MAT.pfire;q.dmg=q.fdmg;q.life=q.t+3.6;q.tick=.15;q.tk=null;q.ign=0;
  for(const o of puddles)if(o.kind==='fuel'&&!o.ign&&Math.hypot(o.x-q.x,o.z-q.z)<q.r+o.r+.5)o.ign=rand(.12,.3);   // ogień biegnie po paliwie
}
/** Podpala wszystkie kałuże paliwa (z rozrzutem opóźnień, więc ogień przebiega wzdłuż strumienia). */
export function igniteFuel(delay=.3){
  let n=0;for(const q of puddles)if(q.kind==='fuel'){q.ign=delay+rand(0,.4);n++}
  fxEv({t:'fx',f:'ig',a:[q2(delay)]});
  if(n)sfx('e_ignite');return n;
}
const q2=v=>Math.round(v*100)/100;
/** Ogłuszenie gracza na `t` s (gwizdek): wstrząs kamery i spowolnienie ruchu; krótsze trwanie nie skraca dłuższego.
 *  Co-op (host): ogłuszenie zdalnego celu idzie do niego siecią (DS.net.redirectStun). */
export function stunPlayer(t){if(DS.net.redirectStun&&DS.net.redirectStun(t))return;stunT=Math.max(stunT,t)}
export const isStunned=()=>stunT>0;

/* ---------- wybuchy i fale ---------- */
/** Wybuch w (x,y,z): obrażenia każdego gracza malejące z odległością (mur zasłania w 70%), odrzut, błysk i dym. */
export function explode(x,y,z,{r=4.5,dmg=30,color=0xff9a2a,shake=1.1}={}){
  const G=S.G;if(!G)return;
  fxEv({t:'fx',f:'ex',a:[q(x),q(y),q(z),q(r),color,q(shake)]});
  muted(()=>{
    sfx('e_boom');
    const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false});
    const m=new THREE.Mesh(GEO.ball,mat);m.position.set(x,Math.max(y,.4),z);m.scale.setScalar(.3);scene.add(m);fx.push({mesh:m,mat,t:0,life:.38,r});
    for(let i=0;i<4;i++)puff(V.set(x+rand(-1,1),Math.max(y,.4)+rand(0,1),z+rand(-1,1)));
    addFloater('BUUM!',{world:V.set(x,2,z).clone(),size:56,life:.8,color:'#ffb12a',vy:-40,rot:rand(-.3,.3),burst:true});
  });
  if(client()){const d=Math.hypot(P.pos.x-x,P.pos.y+.9-y,P.pos.z-z);if(!G.dead&&d<r*2)G.shake+=shake*(d<r?1-(d/r)*.7:.3);return}   // klient: tylko wstrząs
  eachPlayer(k=>{
    const px=P.pos.x,py=P.pos.y+.9,pz=P.pos.z,d=Math.hypot(px-x,py-y,pz-z),loc=isLocal(k);
    if(!G.dead&&d<r){
      let f=1-(d/r)*.7;if(!nav.gridLos(x,z,px,pz))f*=.3;
      hurt(dmg*f);if(loc)G.shake+=shake*f;
      const dx=px-x,dz=pz-z,l=Math.hypot(dx,dz)||1;DS.player.knock({x:(dx/l*9*f)*.7,z:(dz/l*9*f)*.7});
    }else if(d<r*2&&loc)G.shake+=shake*.3;
  });
}
/** Fala uderzeniowa po ziemi (DJ): pierścień rośnie od (x,z); gracz na ziemi w pasie fali dostaje obrażenia raz — trzeba skoczyć. */
export function shockwave(x,z,{speed=9,max=26,dmg=18,color=0xff4fd8,height=.55}={}){
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false});
  const m=new THREE.Mesh(GEO.ring,mat);m.position.set(x,height/2,z);m.scale.set(.5,height,.5);scene.add(m);
  waves.push({mesh:m,mat,x,z,r:.5,speed,max,dmg,height,hit:false});
  fxEv({t:'fx',f:'sw',a:[q(x),q(z),q(speed),q(max),color,q(height)]});
  muted(()=>sfx('e_bass'));
}

/* ---------- wiązki (laser snajpera, telegrafy bossów) ---------- */
/** Wiązka z puli. Zwraca {mesh,mat,set(ax,ay,az,bx,by,bz,w,color,opacity),release()}. */
export function beam(){
  let b=BEAMS.find(q=>!q.used);
  if(!b){const mat=new THREE.MeshBasicMaterial({color:0xff2222,transparent:true,opacity:.8,depthWrite:false});const mesh=new THREE.Mesh(GEO.box,mat);mesh.raycast=()=>{};mesh.frustumCulled=false;
    b={mesh,mat,used:false,args:null,
      set(ax,ay,az,bx,by,bz,w=.04,color,opacity,h){
        const m=this.mesh;m.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);
        const len=Math.hypot(bx-ax,by-ay,bz-az)||.01;m.scale.set(w,h===undefined?w:h,len);m.lookAt(bx,by,bz);
        if(color!==undefined)this.mat.color.setHex(color);if(opacity!==undefined)this.mat.opacity=opacity;
        this.args=[ax,ay,az,bx,by,bz,w,h===undefined?w:h];
      },
      release(){if(this.used){this.used=false;this.args=null;scene.remove(this.mesh)}}};
    BEAMS.push(b)}
  b.used=true;scene.add(b.mesh);return b;
}
/** Host: aktywne wiązki do snapshotu [[ax,ay,az,bx,by,bz,w,h,kolor,krycie]…]. */
export function beamSnap(){
  const out=[];
  for(const b of BEAMS)if(b.used&&b.args){const a=b.args;out.push([q(a[0]),q(a[1]),q(a[2]),q(a[3]),q(a[4]),q(a[5]),q(a[6]),q(a[7]),b.mat.color.getHex(),q(b.mat.opacity)]);if(out.length>=16)break}
  return out;
}
/** Klient: odwzorowuje wiązki hosta (lista z beamSnap). */
export function applyBeams(list){
  const used=BEAMS.filter(b=>b.used);
  for(let i=0;i<list.length;i++){const a=list[i],b=used[i]||beam();b.set(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[8],a[9],a[7])}
  for(let i=list.length;i<used.length;i++)used[i].release();
}

/* ---------- odtwarzanie efektów hosta (klient) ---------- */
const VF=new THREE.Vector3();
/** Klient: efekt z `ev` hosta {f, k, id, a}. Argumenty sprawdzone wcześniej (net/proto.js). */
export function replayFx(v){
  const a=v.a||[];
  switch(v.f){
    case 'th':{if(!GEO[v.k])return;const p=throwProj(v.k,VF.set(a[0],a[1],a[2]),a[3],a[4],a[5],{speed:a[6],fuse:a[7],r:a[8],ignite:!!a[9]});if(p){p.nid=v.id;p.replay=true}break}
    case 'pk':{for(const p of projs)if(p.nid===v.id&&!p.dead){scene.remove(p.mesh);p.dead=true}break}
    case 'pu':if(['glass','milk','bimber','fuel','fire'].includes(v.k))puddle(a[0],a[1],{r:a[2],life:a[3],dmg:0,kind:v.k,fdmg:0});break;
    case 'ig':igniteFuel(a[0]);break;
    case 'ex':explode(a[0],a[1],a[2],{r:a[3],dmg:0,color:a[4],shake:a[5]});break;
    case 'sw':shockwave(a[0],a[1],{speed:a[2],max:a[3],dmg:0,color:a[4],height:a[5]});break;
  }
}

/* ---------- aktualizacja ---------- */
export function updateProj(dt){
  const G=S.G;if(!G)return;
  const cl=client();
  for(const p of projs){
    p.t+=dt;const m=p.mesh;
    if(p.kind==='petard'){
      p.fuse-=dt;
      if(p.fuse<=0){if(!p.replay)explode(m.position.x,m.position.y,m.position.z,{r:p.r,dmg:p.dmg,shake:.7});killProj(p);continue}
      const blink=Math.sin(p.t*30)>0?.9:.2;MAT.petard.emissive.setRGB(blink,blink*.35,0);
      if(Math.floor(p.t*5)!==Math.floor((p.t-dt)*5))sfx('e_fuse',p.t/(p.t+p.fuse));
    }
    if(!p.rest){
      p.vy-=G_ACC*dt;m.position.x+=p.vx*dt;m.position.y+=p.vy*dt;m.position.z+=p.vz*dt;
      m.rotation.x+=p.spin*dt;m.rotation.z+=p.spin*.6*dt;
      const pos=m.position;
      if(p.kind!=='petard'&&!p.replay){
        let done=false,kill=false;
        eachPlayer(()=>{if(done||G.dead)return;if(Math.hypot(pos.x-P.pos.x,pos.z-P.pos.z)<.6&&pos.y>P.pos.y&&pos.y<P.pos.y+1.9){done=true;kill=impact(p,true)}});
        if(done){if(kill)killProj(p);continue}
      }
      if(pos.y<=.12){pos.y=.12;if(impact(p,false))killProj(p);continue}
      if(wallHit(pos.x,pos.y,pos.z)){if(p.kind==='petard'){p.vx*=-.2;p.vz*=-.2;p.vy=Math.abs(p.vy)*.2}else{if(impact(p,false))killProj(p);continue}}
    }
    if(p.t>8){killProj(p)}
  }
  compact(projs);
  for(const q of puddles){
    q.t+=dt;const k=q.t>q.life-1?Math.max(0,q.life-q.t):1;
    if(q.ign>0&&(q.ign-=dt)<=0)ignite(q);
    const fl=q.kind==='fire'?1+.1*Math.sin(q.t*22+q.x):1;
    q.mesh.scale.set(q.r*k*fl,1,q.r*k*fl);
    if(q.dmg>0&&!cl)eachPlayer(pk=>{
      if(G.dead||!(P.pos.y<(q.kind==='fire'?.9:.4))||!(Math.hypot(P.pos.x-q.x,P.pos.z-q.z)<q.r*.9))return;
      const tk=q.tk||(q.tk={});if(tk[pk]===undefined)tk[pk]=q.tick;
      tk[pk]-=dt;if(tk[pk]<=0){tk[pk]=.5;hurt(q.dmg);const wn=q.wn||(q.wn={});if(!wn[pk]){wn[pk]=true;const W={fire:['PŁOMIENIE!','#ff8a3a'],milk:['MLEKO!','#f4f0e6'],bimber:['BIMBER!','#ffd34a']}[q.kind]||['SZKŁO!','#cfe9d6'];addFloater(W[0],{world:V.set(P.pos.x,1.6,P.pos.z).clone(),size:26,life:.6,color:W[1],vy:-30})}}
    });
    if(q.t>=q.life){killPuddle(q);q.dead=true}
  }
  compact(puddles);
  if(stunT>0){stunT-=dt;if(!G.dead){G.shake=Math.max(G.shake,Math.min(2.4,stunT*2));const k=Math.exp(-dt*5);P.vel.x*=k;P.vel.z*=k}}
  for(const f of fx){
    f.t+=dt;const k=f.t/f.life,s=.3+(f.r*.55-.3)*Math.min(1,k*2.2);f.mesh.scale.setScalar(s);f.mat.opacity=.9*Math.max(0,1-k);
    if(f.t>=f.life){scene.remove(f.mesh);f.mat.dispose();f.dead=true}
  }
  compact(fx);
  for(const w of waves){
    w.r+=w.speed*dt;w.mesh.scale.set(w.r,w.height,w.r);w.mat.opacity=.7*(1-w.r/w.max);
    if(!cl)eachPlayer(pk=>{
      if(G.dead||!(P.pos.y<.45))return;
      const d=Math.hypot(P.pos.x-w.x,P.pos.z-w.z);
      if(Math.abs(d-w.r)<.9&&hitOnce(w,'hit',pk)){hurt(w.dmg);const dx=P.pos.x-w.x,dz=P.pos.z-w.z,l=Math.hypot(dx,dz)||1;DS.player.knock({x:(dx/l*7)*.7,z:(dz/l*7)*.7});if(isLocal(pk))G.shake+=.6}
    });
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
  stunT=0;
}
export const projCount=()=>({projs:projs.length,puddles:puddles.length,fx:fx.length,waves:waves.length,beams:BEAMS.filter(b=>b.used).length});
DS.bus.on('levelStart',clearProj);DS.bus.on('levelEnd',clearProj);DS.bus.on('levelUnload',clearProj);
