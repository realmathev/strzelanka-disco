// Efekty strzału w świecie: chwilowe światło błysku, łuski (fizyka z usypianiem, InstancedMesh), dym z lufy (pula sprite'ów),
// smugi pocisków (InstancedMesh), iskry/pył/krew (2 x Points), dziury po kulach (InstancedMesh).
// Wszystko tworzone RAZ przy imporcie i dodane do sceny na stałe (stała liczba geometrii i dzieci sceny: testy wycieków),
// frustumCulled=false, więc GPU dostaje bufory już przy pierwszej klatce menu. Brak alokacji w pętli.
import {opt} from '../core/save.js';
import {scene} from '../render/renderer.js';
import {toon} from '../render/materials.js';
import {cnv,puffTex} from '../render/textures.js';
import {GLOBAL,SURFACES,fxk} from './tuning.js';

const GL=GLOBAL;
const v1=new THREE.Vector3(),v2=new THREE.Vector3(),v3=new THREE.Vector3(),q1=new THREE.Quaternion(),m1=new THREE.Matrix4(),e1=new THREE.Euler();
const ZAX=new THREE.Vector3(0,0,1),ONE=new THREE.Vector3(1,1,1),ZERO3=new THREE.Vector3(0,0,0);
const HIDE=new THREE.Matrix4().makeScale(0,0,0);
const shared=o=>{o.userData.shared=true;return o};

/* ───────── światło błysku ───────── */
export const flashLight=new THREE.PointLight(GL.light.color,0,GL.light.distance,GL.light.decay);
flashLight.name='gunfeel.flashLight';scene.add(flashLight);
let lightT=0,lightDur=.05,lightMax=0;
export function muzzleLight(pos,intensity,dur){const k=fxk('light',opt.fx);if(k<=0||intensity<=0)return;flashLight.position.copy(pos);lightMax=intensity*k*(.85+Math.random()*.3);lightDur=dur;lightT=dur}

/* ───────── łuski ───────── */
const SHELL_N=48;
// typ: [promień, długość, kolor]
const SHELL_T={p9:[.0048,.019,0xd9a541],p45:[.006,.024,0xd9a541],r556:[.0048,.045,0xd9a541],r762:[.0058,.039,0xc99b4a],r762R:[.0062,.054,0xc9953f],g12:[.0105,.062,0xc8322e]};
const shellGeo=shared(new THREE.CylinderGeometry(1,1,1,7,1));
const shellMat=shared(toon(0xffffff));
const shellMesh=new THREE.InstancedMesh(shellGeo,shellMat,SHELL_N);shellMesh.name='gunfeel.shells';shellMesh.frustumCulled=false;shellMesh.castShadow=false;
const col=new THREE.Color();
for(let i=0;i<SHELL_N;i++){shellMesh.setMatrixAt(i,HIDE);shellMesh.setColorAt(i,col.set(0xd9a541))}
shellMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);shellMesh.count=SHELL_N;scene.add(shellMesh);
const shells=[];for(let i=0;i<SHELL_N;i++)shells.push({on:false,p:new THREE.Vector3(),v:new THREE.Vector3(),r:new THREE.Vector3(),w:new THREE.Vector3(),s:new THREE.Vector3(),t:0,floor:0,bounces:0,sleep:false,g12:false});
let shellNext=0,shellsLive=0,dropSndT=0;
/** Wyrzut łuski z punktu `pos` (świat). right/up/back: osie kamery w świecie; base: prędkość gracza. */
export function ejectShell(type,pos,right,up,back,base,floorY){
  const T=SHELL_T[type];if(!T)return;const S=GL.shells,j=S.jitter;
  const idx=shellNext,s=shells[idx];shellNext=(shellNext+1)%SHELL_N;if(!s.on)shellsLive++;
  s.on=true;s.t=0;s.bounces=0;s.sleep=false;s.floor=floorY;s.g12=type==='g12';
  s.p.copy(pos);
  s.v.copy(right).multiplyScalar(S.eject[0]*(1+(Math.random()*2-1)*j)).addScaledVector(up,S.eject[1]*(1+(Math.random()*2-1)*j)).addScaledVector(back,S.eject[2]*(1+(Math.random()*2-1)*j));
  if(base)s.v.add(base);
  s.r.set(Math.random()*6,Math.random()*6,Math.random()*6);
  s.w.set((Math.random()*2-1)*S.spin,(Math.random()*2-1)*S.spin*.5,(Math.random()*2-1)*S.spin);
  s.s.set(T[0],T[1],T[0]);
  shellMesh.setColorAt(idx,col.set(T[2]));shellMesh.instanceColor.needsUpdate=true;
}
let shellSound=null;export function onShellDrop(fn){shellSound=fn}
function updateShells(dt,eye){
  if(!shellsLive)return;const S=GL.shells;let any=false;dropSndT-=dt;
  for(let i=0;i<SHELL_N;i++){const s=shells[i];if(!s.on)continue;any=true;s.t+=dt;
    if(!s.sleep){s.v.y+=S.gravity*dt;s.p.addScaledVector(s.v,dt);s.r.x+=s.w.x*dt;s.r.y+=s.w.y*dt;s.r.z+=s.w.z*dt;
      if(s.p.y<s.floor+s.s.x){s.p.y=s.floor+s.s.x;
        if(s.bounces===0&&shellSound&&dropSndT<=0&&eye&&eye.distanceToSquared(s.p)<64){shellSound(s.g12);dropSndT=.06}
        s.bounces++;s.v.y=-s.v.y*S.bounce;s.v.x*=S.friction;s.v.z*=S.friction;s.w.multiplyScalar(.5);
        if(s.bounces>=3||Math.abs(s.v.y)<.35){s.sleep=true;s.r.x=Math.PI/2;s.r.z=0}}}  // usypianie: łuska leży, bez fizyki
    let k=1;const life=S.life;if(s.t>life-.4)k=Math.max(0,(life-s.t)/.4);
    if(s.t>=life){s.on=false;shellsLive--;shellMesh.setMatrixAt(i,HIDE);continue}
    e1.set(s.r.x,s.r.y,s.r.z);q1.setFromEuler(e1);v1.copy(s.s).multiplyScalar(k);m1.compose(s.p,q1,v1);shellMesh.setMatrixAt(i,m1)}
  if(any)shellMesh.instanceMatrix.needsUpdate=true;
}

/* ───────── dym z lufy ───────── */
const SMOKE_N=14,smoke=[];
for(let i=0;i<SMOKE_N;i++){const m=new THREE.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false,opacity:0,color:GL.smoke.color});
  const s=new THREE.Sprite(m);s.visible=false;s.renderOrder=4;s.name='gunfeel.smoke';scene.add(s);smoke.push({s,t:0,life:1,on:false,v:new THREE.Vector3(),a:0,sz:.1})}
let smokeNext=0,smokeLive=0;
/** Obłoczek dymu w punkcie `pos` (świat), `amount` 0..1+ (z tuningu broni). */
export function puffSmoke(pos,amount,drift){
  const k=fxk('smoke',opt.fx)*amount;if(k<=.02)return;const G=GL.smoke;
  const o=smoke[smokeNext];smokeNext=(smokeNext+1)%SMOKE_N;if(!o.on)smokeLive++;
  o.on=true;o.t=0;o.life=G.life*(.8+Math.random()*.4);o.a=Math.min(.6,G.opacity*Math.min(1.6,k));o.sz=G.size*(.7+Math.min(1,k)*.5);
  o.s.position.copy(pos);o.v.set((Math.random()-.5)*.15,G.rise*(.7+Math.random()*.6),(Math.random()-.5)*.15);if(drift)o.v.addScaledVector(drift,.5);
  o.s.material.rotation=Math.random()*6;o.s.scale.set(o.sz,o.sz,1);o.s.material.opacity=o.a;o.s.visible=true;
}
function updateSmoke(dt){
  if(!smokeLive)return;const G=GL.smoke;
  for(const o of smoke){if(!o.on)continue;o.t+=dt;const u=o.t/o.life;
    if(u>=1){o.on=false;smokeLive--;o.s.visible=false;continue}
    o.s.position.addScaledVector(o.v,dt);o.v.multiplyScalar(1-Math.min(1,dt*1.5));const sc=o.sz*(1+u*G.grow*4);o.s.scale.set(sc,sc,1);
    o.s.material.opacity=o.a*(1-u)*(1-u);o.s.material.rotation+=dt*.4}
}

/* ───────── smugi ───────── */
const TR_N=20;
const trGeo=shared(new THREE.BoxGeometry(1,1,1));
const trMat=shared(new THREE.MeshBasicMaterial({color:0xfff0a0,transparent:true,opacity:.9,depthWrite:false,fog:false}));
const trMesh=new THREE.InstancedMesh(trGeo,trMat,TR_N);trMesh.name='gunfeel.tracers';trMesh.frustumCulled=false;trMesh.renderOrder=5;
for(let i=0;i<TR_N;i++)trMesh.setMatrixAt(i,HIDE);trMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(trMesh);
const tracers=[];for(let i=0;i<TR_N;i++)tracers.push({on:false,a:new THREE.Vector3(),d:new THREE.Vector3(),len:0,run:0});
let trNext=0,trLive=0;
/** Smuga lecąca z `a` do `b` (świat). */
export function tracer(a,b){
  const o=tracers[trNext];trNext=(trNext+1)%TR_N;if(!o.on)trLive++;
  o.on=true;o.a.copy(a);o.d.subVectors(b,a);o.len=o.d.length();if(o.len<.5){o.on=false;trLive--;return}o.d.multiplyScalar(1/o.len);o.run=0;
}
function updateTracers(dt){
  if(!trLive)return;const T=GL.tracer;
  for(let i=0;i<TR_N;i++){const o=tracers[i];if(!o.on)continue;o.run+=T.speed*dt;
    const head=Math.min(o.run,o.len),tail=Math.max(0,Math.min(o.run-T.len,o.len));
    if(tail>=o.len){o.on=false;trLive--;trMesh.setMatrixAt(i,HIDE);continue}
    const L=Math.max(.01,head-tail);v1.copy(o.a).addScaledVector(o.d,(head+tail)/2);q1.setFromUnitVectors(ZAX,o.d);v2.set(T.width,T.width,L);m1.compose(v1,q1,v2);trMesh.setMatrixAt(i,m1)}
  trMesh.instanceMatrix.needsUpdate=true;
}

/* ───────── cząstki (iskry + kawałki/pył/krew) ───────── */
const dotTex=new THREE.CanvasTexture(cnv(32,32,g=>{g.fillStyle='#15110e';g.beginPath();g.arc(16,16,15,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(16,16,10,0,7);g.fill()}));
function makePts(n,size,map,name){
  const geo=shared(new THREE.BufferGeometry()),pos=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++)pos[i*3+1]=-9999;
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(c,3).setUsage(THREE.DynamicDrawUsage));
  const mat=shared(new THREE.PointsMaterial({size,map,vertexColors:true,transparent:!!map,alphaTest:map?.4:0,depthWrite:true,sizeAttenuation:true}));
  const p=new THREE.Points(geo,mat);p.frustumCulled=false;p.name=name;p.renderOrder=3;scene.add(p);
  return {p,pos,c,n,vel:new Float32Array(n*3),life:new Float32Array(n),max:new Float32Array(n),c0:new Float32Array(n*3),grav:new Float32Array(n),next:0,live:0};
}
// rozmiar punktu w r128 (sizeAttenuation): px ≈ size * (wysokość/2) / odległość
const sparks=makePts(160,.07,null,'gunfeel.sparks'),chunks=makePts(200,.14,dotTex,'gunfeel.chunks');
const pc=new THREE.Color();
function emit(P,n,pos,dir,speed,spread,color,life,grav){
  for(let k=0;k<n;k++){const i=P.next;P.next=(P.next+1)%P.n;if(P.life[i]<=0)P.live++;
    v1.set(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).multiplyScalar(spread).add(dir).normalize().multiplyScalar(speed*(.45+Math.random()*.8));
    P.pos[i*3]=pos.x;P.pos[i*3+1]=pos.y;P.pos[i*3+2]=pos.z;P.vel[i*3]=v1.x;P.vel[i*3+1]=v1.y;P.vel[i*3+2]=v1.z;
    P.life[i]=P.max[i]=life*(.6+Math.random()*.7);P.grav[i]=grav;pc.set(color);const sh=.8+Math.random()*.3;
    P.c0[i*3]=pc.r*sh;P.c0[i*3+1]=pc.g*sh;P.c0[i*3+2]=pc.b*sh;P.c[i*3]=P.c0[i*3];P.c[i*3+1]=P.c0[i*3+1];P.c[i*3+2]=P.c0[i*3+2]}
}
function updatePts(P,dt,cool){
  if(!P.live)return;const drag=Math.max(0,1-GL.particles.drag*dt);
  for(let i=0;i<P.n;i++){if(P.life[i]<=0)continue;P.life[i]-=dt;const j=i*3;
    if(P.life[i]<=0){P.live--;P.pos[j+1]=-9999;continue}
    P.vel[j+1]+=P.grav[i]*dt;P.vel[j]*=drag;P.vel[j+1]*=drag;P.vel[j+2]*=drag;
    P.pos[j]+=P.vel[j]*dt;P.pos[j+1]+=P.vel[j+1]*dt;P.pos[j+2]+=P.vel[j+2]*dt;
    if(cool){const u=P.life[i]/P.max[i];P.c[j]=P.c0[j]*(.55+.45*u);P.c[j+1]=P.c0[j+1]*u*u;P.c[j+2]=P.c0[j+2]*u*u*u}}
  P.p.geometry.attributes.position.needsUpdate=true;P.p.geometry.attributes.color.needsUpdate=true;
}

/* ───────── dziury po kulach ───────── */
const DEC_N=GL.hit.decalMax;
const holeTex=new THREE.CanvasTexture(cnv(64,64,g=>{g.translate(32,32);g.fillStyle='#15110e';g.beginPath();
  for(let i=0;i<14;i++){const r=i%2?9:(16+Math.random()*12),a=i/14*Math.PI*2;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();
  g.fillStyle='#f4e7c5';g.beginPath();g.arc(-3,-3,3,0,7);g.fill()}));
const decMat=shared(new THREE.MeshBasicMaterial({map:holeTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,alphaTest:.05}));
const decGeo=shared(new THREE.PlaneGeometry(1,1));
const decMesh=new THREE.InstancedMesh(decGeo,decMat,DEC_N);decMesh.name='gunfeel.decals';decMesh.frustumCulled=false;decMesh.renderOrder=2;
for(let i=0;i<DEC_N;i++)decMesh.setMatrixAt(i,HIDE);scene.add(decMesh);
let decNext=0;
const q2=new THREE.Quaternion();
function decal(p,n,size){q1.setFromUnitVectors(ZAX,n);e1.set(0,0,Math.random()*6);q1.multiply(q2.setFromEuler(e1));
  v1.copy(p).addScaledVector(n,.004);v2.set(size,size,size);m1.compose(v1,q1,v2);decMesh.setMatrixAt(decNext,m1);decNext=(decNext+1)%DEC_N;decMesh.instanceMatrix.needsUpdate=true}

/* ───────── trafienia ───────── */
const nW=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
/** Rodzaj powierzchni z koloru wierzchołka (świat jest scalany z kolorami w atrybucie 'color') i normalnej. */
export function surfaceOf(h,nOut){
  const o=h.object,ca=o.geometry&&o.geometry.attributes&&o.geometry.attributes.color;let r=.6,g=.6,b=.6;
  if(ca&&h.face){const i=h.face.a;r=ca.getX(i);g=ca.getY(i);b=ca.getZ(i)}else if(o.material&&o.material.color){r=o.material.color.r;g=o.material.color.g;b=o.material.color.b}
  if(h.face){nW.copy(h.face.normal).transformDirection(o.matrixWorld)}else nW.copy(UP);if(nOut)nOut.copy(nW);
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx>0?(mx-mn)/mx:0;
  if(g>r*1.12&&g>b*1.12&&sat>.2)return 'foliage';
  if(nW.y>.7&&mx<.75)return 'ground';
  if(sat<.16)return mx<.42?'metal':'stone';
  if(r>g&&g>=b&&sat>.28&&mx<.8)return 'wood';
  return 'stone';
}
/** Ślad trafienia w świat: iskry/kawałki wg powierzchni + dziura. dir = kierunek lotu pocisku. */
export function impact(point,normal,surface,dir){
  const S=SURFACES[surface]||SURFACES.stone,k=fxk('particles',opt.fx);
  v3.copy(normal).multiplyScalar(1.2).addScaledVector(dir,-.4).normalize();
  if(S.sparks)emit(sparks,Math.round(S.sparks*k),point,v3,4.2,.75,S.spark,.28,GL.particles.gravity);
  if(S.chunks)emit(chunks,Math.round(S.chunks*k),point,v3,2.2,.65,S.chunk,.55,GL.particles.gravity);
  if(S.decal)decal(point,normal,GL.hit.decalSize*(.8+Math.random()*.4));
}
/** Krew (komiksowa: ciemnoczerwone kleksy) w punkcie trafienia wroga. */
export function blood(point,dir,head){
  const k=fxk('particles',opt.fx),n=Math.round((head?GL.hit.bloodHead:GL.hit.blood)*k);
  v3.copy(dir).multiplyScalar(.8).add(UP).normalize();
  emit(chunks,n,point,v3,head?3:2.2,.8,head?0xd3242a:0xa8161c,.6,GL.particles.gravity*1.3);
  if(head)emit(sparks,Math.round(4*k),point,v3,3,.6,0xffe14a,.18,GL.particles.gravity);
}

/* ───────── klatka i sprzątanie ───────── */
export function updateFx(dt,eye){
  if(lightT>0){lightT-=dt;const u=Math.max(0,lightT/lightDur);flashLight.intensity=lightMax*u*u}else if(flashLight.intensity!==0)flashLight.intensity=0;
  updateShells(dt,eye);updateSmoke(dt);updateTracers(dt);updatePts(sparks,dt,true);updatePts(chunks,dt,false);
}
export function clearFx(){
  lightT=0;flashLight.intensity=0;
  for(let i=0;i<SHELL_N;i++){shells[i].on=false;shellMesh.setMatrixAt(i,HIDE)}shellsLive=0;shellMesh.instanceMatrix.needsUpdate=true;
  for(const o of smoke){o.on=false;o.s.visible=false}smokeLive=0;
  for(let i=0;i<TR_N;i++){tracers[i].on=false;trMesh.setMatrixAt(i,HIDE)}trLive=0;trMesh.instanceMatrix.needsUpdate=true;
  for(const P of [sparks,chunks]){for(let i=0;i<P.n;i++){P.life[i]=0;P.pos[i*3+1]=-9999}P.live=0;P.p.geometry.attributes.position.needsUpdate=true}
  for(let i=0;i<DEC_N;i++)decMesh.setMatrixAt(i,HIDE);decMesh.instanceMatrix.needsUpdate=true;decNext=0;
}
/** Liczniki do debugowania (DS.gunfeel.fxStats()). */
export function fxStats(){return {shells:shellsLive,smoke:smokeLive,tracers:trLive,sparks:sparks.live,chunks:chunks.live,light:+flashLight.intensity.toFixed(2)}}
