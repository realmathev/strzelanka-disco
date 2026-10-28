// Rdzeń feelingu broni: ADS, odrzut (sprężyny + krzywe, wzorce), ruch (sway, bob, sprint, skok/lądowanie, oddech),
// złożenie transformacji viewmodelu i kamery, kolejka efektów strzału. Liczby: tuning.js.
//
// Kolejność w klatce (game/loop.js): updateMovement -> updateWeapons (fire -> 'shot') -> ... -> updateCamera -> updateViewmodel
// -> HUD -> emit('update'). Ten moduł działa na 'update', czyli PO bazowej kamerze i viewmodelu, i nadpisuje ich wynik
// w tej samej klatce (zero opóźnienia): gunRoot.position/rotation i camera.position/rotation/fov liczone są tu od zera.
// Bazowe G.recoil/kick z weapons/viewmodel.js i losowy wstrząs z player.js są przez to zastąpione (shake czytany z G.shake).
// DS.player.camOffset i vmOffset nadal są dodawane (kontrakt ARCHITECTURE.md).
import {opt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {camera} from '../render/renderer.js';
import {addFloater} from '../render/comicfx.js';
import {world} from '../world/state.js';
import {gunMech,gunImpact,gunHit} from '../audio/gunsfx.js';
import {GLOBAL,weaponFeel,fxk} from './tuning.js';
import {Spring,Kicks,smoother,lerp,clamp01,wrapPi} from './math.js';
import {AN,animModel,animShot,animUpdate,animHooks,animClear,reloading} from './anim.js';
import * as FX from './fx.js';
import {drawOverlay,clearOverlay,marker,hitStop} from './overlay.js';

const GL=GLOBAL;
if(!('hitStop' in opt))opt.hitStop=1;   // Dostępność: 0 wyłącza hit-stop (prośba do ds-input-menus o przełącznik w UI)

/** Stan feelingu (debug: DS.gunfeel.F). */
export const F={ready:false,model:null,id:null,W:null,cfg:null,anchor:new THREE.Vector3(),port:null,reticle:null,setAds:null,
  ads:0,adsE:0,sprint:0,moveAmp:0,lastYaw:0,lastPitch:0,init:false,pendP:0,pendY:0,applied:0,
  lastShot:-9,burst:0,patLast:-1,punchP:0,punchY:0,ground:true,minVy:0,t:0,scope:0,scoped:false,
  ejects:[-1,-1,-1,-1],qLight:0,qSmoke:0,onomaT:0,burstSmoke:false};

/* ───────── sprężyny ───────── */
const sZ=new Spring(),sY=new Spring(),sRX=new Spring(),sRY=new Spring(),sRZ=new Spring(),kicks=new Kicks(GL.recoil.maxKicks);
const swX=new Spring(),swY=new Spring(),swRX=new Spring(),swRY=new Spring(),swRZ=new Spring();
const landG=new Spring(GL.jump.freq,GL.jump.damp),landC=new Spring(GL.jump.freq,GL.jump.damp);
const cpP=new Spring(GL.recoil.camFreq,GL.recoil.camDamp),cpY=new Spring(GL.recoil.camFreq,GL.recoil.camDamp),camK=new Spring(9,.5);
const ALL=[sZ,sY,sRX,sRY,sRZ,swX,swY,swRX,swRY,swRZ,landG,landC,cpP,cpY,camK];

const v1=new THREE.Vector3(),v2=new THREE.Vector3(),v3=new THREE.Vector3(),q1=new THREE.Quaternion(),e1=new THREE.Euler(),m1=new THREE.Matrix4();
const right=new THREE.Vector3(),up=new THREE.Vector3(),back=new THREE.Vector3(),pivot=new THREE.Vector3(),vel=new THREE.Vector3();
const rayc=new THREE.Raycaster(),tgt=[],ndc=new THREE.Vector2(),hitN=new THREE.Vector3(),muz=new THREE.Vector3();
const TAU=Math.PI*2;

/* ───────── hooki DS.player (owijki; patrz docs/requests/ds-gunfeel.md) ───────── */
const PL=DS.player;
{ // trwały podrzut z weapons/fire.js: mnożony przez recoilMul() (adrenalina) i rozłożony na ~3 klatki (suma bez zmian = balans)
  const add0=PL.addRecoil;
  PL.addRecoil=function(p,y){const m=PL.recoilMul?PL.recoilMul():1;if(!F.ready||!S.G)return add0.call(this,p*m,(y||0)*m);F.pendP+=p*m;F.pendY+=(y||0)*m};
  // ADS spowalnia: stosunek moveMultAds/moveMult z danych broni (bieg bez ADS bez zmian)
  const sp0=PL.speedMul;
  PL.speedMul=function(){const b=sp0?sp0.call(this):1,e=F.adsE;if(e<=0||!F.W)return b;const W=F.W;
    const r=W.moveMult>0&&W.moveMultAds>0?W.moveMultAds/W.moveMult:GL.ads.moveFallback;return b*lerp(1,r,e)};
  /** Mnożnik rozrzutu w NDC dla weapons/fire.js (jeszcze nieużywany, prośba #1): kąt rozrzutu w ADS = spread * adsSpread
   *  niezależnie od zoomu (kompensuje to, że fire.js losuje rozrzut w NDC, który węższy FOV sam zmniejsza). */
  PL.spreadMul=function(){const e=F.adsE;if(e<=0)return 1;const W=F.W||{};const m=lerp(1,W.adsSpread>0?W.adsSpread:GL.ads.spread,e);
    const f0=opt.fov*Math.PI/360,f1=f0*(PL.fovMul||1);return m*Math.tan(f0)/Math.tan(f1)};
}
PL.adsProgress=()=>F.adsE;

/* ───────── model broni ───────── */
function findModel(root){let m=null;for(const ch of root.children)if(ch!==PL.flash&&(ch.isGroup||ch.isMesh))m=ch;return m}
function setupModel(model,G){
  const W=DS.weapons.get(G.weapon),c=weaponFeel(G.weapon,W);F.model=model;F.id=G.weapon;F.W=W;F.cfg=c;
  for(const s of [sZ,sY,sRX,sRY,sRZ])s.set(c.kick.freq,c.kick.damp);
  const sf=GL.sway.freq/Math.sqrt(Math.max(.3,c.sway||1));for(const s of [swX,swY,swRX,swRY,swRZ])s.set(sf,GL.sway.damp);
  // punkt oka (sightAnchor) w układzie gunRoot
  const root=PL.viewmodel;const u=model&&model.userData||{};let a=model&&model.getObjectByName&&model.getObjectByName('sightAnchor');
  if(c.anchor)F.anchor.fromArray(c.anchor);
  else if(a){root.updateMatrixWorld(true);m1.copy(root.matrixWorld).invert();F.anchor.setFromMatrixPosition(a.matrixWorld).applyMatrix4(m1)}
  else if(u.sightAnchor)F.anchor.copy(u.sightAnchor);
  else if(W&&W.sightAnchor)F.anchor.copy(W.sightAnchor);
  else F.anchor.set(0,.08,.25);
  F.port=model&&model.getObjectByName&&model.getObjectByName('ejectionPort')||null;
  F.reticle=u.reticle||null;F.setAds=typeof u.setAds==='function'?u.setAds:null;F.scoped=false;
  animModel(model,c,W);
}

/* ───────── strzał ───────── */
function pattern(c){const p=c.patterns;let i=Math.floor(Math.random()*p.length);if(p.length>1&&i===F.patLast)i=(i+1)%p.length;F.patLast=i;return p[i]}
const jit=()=>1+(Math.random()*2-1)*GL.recoil.jitter;
function onShot(e){
  const G=S.G;if(!G||!F.cfg)return;const c=F.cfg,W=e&&e.def||F.W||{},k=c.kick;
  F.burst=G.time-F.lastShot<(W.rate||.1)*GL.recoil.burstGap?F.burst+1:0;F.lastShot=G.time;
  const pt=pattern(c),rm=PL.recoilMul?PL.recoilMul():1,ads=F.adsE,vk=fxk('vmKick',opt.fx)*rm;
  const kp=lerp(1,GL.ads.kickPos,ads)*vk,kz=lerp(1,GL.ads.kickZ,ads)*vk,kr=lerp(1,GL.ads.kickRot,ads)*vk,drift=k.drift?Math.sin(F.burst*.55)*k.drift:0;
  // viewmodel: sprężyny (ciężar, przeregulowanie) + krzywa (charakterystyczny kopniak); wszystko się sumuje
  sZ.kick(k.z*pt.z*jit()*kz);sY.kick(k.y*jit()*kp);sRX.kick(k.rx*pt.p*jit()*kr);sRY.kick(k.ry*(pt.y+drift)*jit()*kr);sRZ.kick(k.rz*pt.r*jit()*kr);
  kicks.add(k.curveZ*pt.z*jit()*kz,k.curveRx*pt.p*jit()*kr,k.attack,k.decay);
  // kamera: aim punch z danych (wraca z W.recoil.recovery) + kosmetyczny podrzut
  const rc=W.recoil||{},ap=(rc.pitch!=null?rc.pitch:(W.pitchKick||.01)*.6)*c.cam.punch*rm,ay=(rc.yaw!=null?rc.yaw:ap*.25)*c.cam.punch*rm;
  F.punchP+=ap*pt.p*jit();F.punchY+=ay*(pt.y+drift)*jit();
  camK.kick(c.cam.kick*fxk('camPunch',opt.fx)*pt.p*jit()*lerp(1,.6,ads));
  G.shake=Math.max(0,G.shake-(W.shake||0)*(1-c.cam.shakeKeep));
  // błysk (sprite z weapons/viewmodel.js: rozmiar i czas per broń), światło, dym, łuska -> kolejka (po złożeniu transformacji)
  const scoped=F.scope>0;
  const fl=PL.flash;if(fl){const s=c.flash.size*(.82+Math.random()*.36)*fxk('flash',opt.fx)*lerp(1,scoped?GL.ads.flashScope:GL.ads.flash,ads);fl.scale.set(s,s,1);fl.userData.t=c.flash.dur*(opt.fx?1:.7);fl.material.rotation=Math.random()*6}
  F.qLight=c.flash.light;F.qSmoke+=(W.auto?(Math.random()<c.flash.smoke?.6:0):c.flash.smoke)*(scoped?0:lerp(1,GL.ads.smoke,ads));
  if(c.shell!=='none'&&c.shellDelay>=0)queueEject(c.shellDelay,1);
  const ammo=G.ammo[G.weapon];animShot(ammo);
  impacts(e,W,c,G);
}
function queueEject(delay,n){for(let i=0;i<F.ejects.length;i++)if(F.ejects[i]<0){F.ejects[i]=delay;F.ejectN=n;return}F.ejects[0]=delay}

/** Trafienia w świat: weapons/fire.js nie podaje punktów (prośba #2), więc własny raycast (1 promień, śrut do 3). */
function impacts(e,W,c,G){
  const hits=e&&e.hits;const n=hits?hits.length:Math.min(3,W.pellets||1);
  tgt.length=0;for(let i=0;i<world.meshes.length;i++)tgt.push(world.meshes[i]);
  for(const en of G.enemies)if(en.alive)for(const m of en.meshes)tgt.push(m);
  const mz=e&&e.muzzle;const showTr=G.shots%Math.max(1,c.tracerEvery||1)===0;
  for(let i=0;i<n;i++){
    let h=null,end=v2;
    if(hits){h=hits[i];end.copy(h.point)}
    else{const s=(W.spread||0)*(PL.P.vel.length()>2?1.8:1)*(PL.P.ground?1:2)*(PL.spreadMul?PL.spreadMul():1);ndc.set((Math.random()*2-1)*s*2,(Math.random()*2-1)*s*2);
      rayc.setFromCamera(ndc,camera);rayc.far=120;const r=rayc.intersectObjects(tgt,false);h=r[0]||null;if(h)end.copy(h.point);else rayc.ray.at(120,end)}
    if(mz&&showTr&&i===0)FX.tracer(mz,end);
    if(h&&!(h.object.userData&&h.object.userData.enemy)){const surf=FX.surfaceOf(h,hitN);v3.subVectors(end,camera.position);const d=v3.length();v3.multiplyScalar(1/(d||1));
      FX.impact(end,hitN,surf,v3);if(i===0)gunImpact(surf,Math.min(GL.sound.impactDelayMax,d*GL.sound.impactDelayPerM),Math.max(.25,1-d/60))}
  }
}

/* ───────── trafienie, zabicie ───────── */
const ONO=['PAC!','CHLAST!','ŁUP!','BUCH!','PLASK!'],ONO_H=['TRACH!','CHRUP!','BAM!'];
function onHit(e){
  const G=S.G;if(!G||!e||!e.point)return;G.hitT=0;   // stary znacznik z comicfx: pokazuje go już celownik HUD
  v1.subVectors(e.point,camera.position);const d=v1.length();v1.multiplyScalar(1/(d||1));
  FX.blood(e.point,v1,e.head);
  gunHit(e.head,Math.min(GL.sound.hitDelayMax,d*GL.sound.hitDelayPerM),d>30?2400:0);
  if(e.head)marker('head');
  if(opt.onoma&&G.time-F.onomaT>GL.hit.onomaCooldown&&(e.head||Math.random()<GL.hit.onomaChance)){F.onomaT=G.time;
    const w=e.head?ONO_H:ONO;addFloater(w[Math.floor(Math.random()*w.length)],{world:e.point.clone(),size:e.head?30:24,life:.45,color:e.head?'#ff3b30':'#f4e7c5',vy:-70,rot:(Math.random()-.5)*.5})}
}
function onKill(e){
  marker('kill',e&&e.head);
  const k=fxk('hitStop',opt.fx)*(+opt.hitStop?1:0);if(k>0)hitStop((e&&e.head?GL.hit.stopHeadMs:GL.hit.stopMs)*k);
}

/* ───────── klatka ───────── */
function eject(n){
  if(!F.port||!F.cfg||F.cfg.shell==='none')return;const P=PL.P;
  F.port.getWorldPosition(v1);right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);back.set(0,0,1).applyQuaternion(camera.quaternion);
  vel.copy(P.vel);vel.y=P.vy||0;
  FX.ejectShell(F.cfg.shell,v1,right,up,back,vel,P.pos.y);
}
animHooks({sound:k=>gunMech(k),eject:n=>{if(F.cfg&&F.cfg.action==='revolver')ejectRevolver(n);else eject(n)}});
function ejectRevolver(n){if(!F.model)return;const P=PL.P;F.model.getWorldPosition(v1);right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,-1,0).applyQuaternion(camera.quaternion);back.set(0,0,1).applyQuaternion(camera.quaternion);
  vel.copy(P.vel);for(let i=0;i<Math.min(6,n);i++){v2.copy(v1).addScaledVector(right,(Math.random()-.5)*.03).addScaledVector(up,.03);FX.ejectShell('p45',v2,v3.copy(right).multiplyScalar(.15),up,back,vel,P.pos.y)}}

function update(dt){
  const G=S.G;if(!G||S.mode!=='game')return;
  const P=PL.P,root=PL.viewmodel;if(!P||!root)return;F.ready=true;F.t+=dt;
  if(!F.init){F.lastYaw=P.yaw;F.lastPitch=P.pitch;F.init=true}
  const model=findModel(root);if(model!==F.model||G.weapon!==F.id)setupModel(model,G);
  const c=F.cfg,W=F.W||{};
  /* trwały podrzut (fire.js) dojeżdża z ease-out */
  F.applied=0;
  if(F.pendP||F.pendY){const a=1-Math.exp(-GL.recoil.applyRate*dt);let dp=F.pendP*a,dy=F.pendY*a;if(Math.abs(F.pendP)<2e-5&&Math.abs(F.pendY)<2e-5){dp=F.pendP;dy=F.pendY}
    const p0=P.pitch;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch+dp));P.yaw+=dy;F.pendP-=dp;F.pendY-=dy;F.applied=P.pitch-p0}
  /* ADS */
  const I=DS.input,held=I.adsActive?I.adsActive():I.isDown('ads');
  const want=held&&!G.dead&&!(GL.ads.blockOnReload&&(G.reloadT>0||reloading()))?1:0;
  const at=Math.max(.05,c.adsTime||W.adsTime||.25);
  F.ads=want>F.ads?Math.min(1,F.ads+dt/at):Math.max(0,F.ads-dt*GL.ads.exitRate/at);
  const e=smoother(F.ads);F.adsE=e;
  const fovAds=c.adsFov||W.adsFov||.8,fm=lerp(1,fovAds,e);PL.fovMul=fm;const fov=opt.fov*fm;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix()}
  /* ruch */
  const spd=Math.hypot(P.vel.x,P.vel.z),sprintHeld=I.isDown('sprint');
  const amp=P.ground&&!G.dead?Math.min(1.6,spd/7)*(sprintHeld&&spd>GL.sprint.minSpeed?GL.bob.sprint:1):0;
  F.moveAmp+=(amp-F.moveAmp)*Math.min(1,dt*GL.bob.smooth);
  const sprinting=sprintHeld&&spd>GL.sprint.minSpeed&&F.ads<.05&&G.time-F.lastShot>GL.sprint.afterShot&&!reloading()&&!G.dead;
  F.sprint+=((sprinting?1:0)-F.sprint)*Math.min(1,dt*GL.sprint.rate);
  /* sway od myszy i od ruchu bocznego */
  let dy=wrapPi(P.yaw-F.lastYaw),dpp=P.pitch-F.lastPitch-F.applied;if(Math.abs(dy)>.6)dy=0;if(Math.abs(dpp)>.6)dpp=0;
  const ry=dt>0?Math.max(-20,Math.min(20,dy/dt)):0,rp=dt>0?Math.max(-20,Math.min(20,dpp/dt)):0;
  const SW=GL.sway,mass=c.sway||1,cl=(x,m)=>x<-m?-m:x>m?m:x;
  right.set(Math.cos(P.yaw),0,-Math.sin(P.yaw));const lat=(P.vel.x*right.x+P.vel.z*right.z)/7;
  swX.step(dt,cl(ry*SW.look*mass-lat*SW.strafe,SW.max));swY.step(dt,cl(-rp*SW.lookY*mass,SW.max));
  swRY.step(dt,cl(-ry*SW.rotY*mass,SW.maxRot));swRX.step(dt,cl(-rp*SW.rot*mass,SW.maxRot));swRZ.step(dt,cl(ry*SW.rot*.6*mass-lat*SW.strafeRoll,SW.maxRot));
  /* skok i lądowanie */
  if(F.ground&&!P.ground&&P.vy>0)landG.kick(GL.jump.lift);
  if(!P.ground)F.minVy=Math.min(F.minVy,P.vy);
  if(!F.ground&&P.ground){const im=-F.minVy;if(im>1){landG.kick(-Math.min(im*GL.jump.land,GL.jump.landMax));landC.kick(-Math.min(im*GL.jump.camLand,GL.jump.camMax)*fxk('bob',opt.fx))}F.minVy=0}
  F.ground=P.ground;landG.step(dt);landC.step(dt);
  /* odrzut */
  sZ.step(dt);sY.step(dt);sRX.step(dt);sRY.step(dt);sRZ.step(dt);kicks.step(dt);
  const rec=W.recoil&&W.recoil.recovery||8;const dec=Math.exp(-rec*dt);F.punchP*=dec;F.punchY*=dec;cpP.step(dt,F.punchP);cpY.step(dt,F.punchY);camK.step(dt);
  /* animacje w fazach */
  animUpdate(dt,G,W);
  /* ── złożenie viewmodelu ── */
  const hip=c.hip,hr=c.hipRot,A=F.anchor,ao=c.adsOffset,mm=lerp(1,GL.ads.motion,e),sp=F.sprint*(1-e),SP=GL.sprint,B=GL.bob,ph=P.bob,ma=F.moveAmp;
  const bobX=Math.sin(ph)*B.x*ma,bobY=-(1-Math.cos(2*ph))*.5*B.y*ma,bobRZ=Math.sin(ph)*B.rotZ*ma,bobRX=Math.sin(2*ph)*B.rotX*ma;
  const vo=PL.vmOffset;
  let px=lerp(hip[0],-A.x+ao[0],e)+(bobX+swX.x)*mm+SP.pos[0]*sp+AN.pos.x;
  let py=lerp(hip[1],-A.y+ao[1],e)+(bobY+swY.x)*mm+landG.x*(1-e*.6)+sY.x+SP.pos[1]*sp+AN.pos.y;
  let pz=lerp(hip[2],-A.z+ao[2],e)+sZ.x+kicks.a+SP.pos[2]*sp+AN.pos.z;
  const rx=hr[0]*(1-e)+(swRX.x+bobRX)*mm+sRX.x+kicks.b+SP.rot[0]*sp+AN.rot.x+(vo?vo.rot.x:0);
  const ryy=hr[1]*(1-e)+swRY.x*mm+sRY.x+SP.rot[1]*sp+AN.rot.y+(vo?vo.rot.y:0);
  const rz=hr[2]*(1-e)+(swRZ.x+bobRZ)*mm+sRZ.x+SP.rot[2]*sp+AN.rot.z+(vo?vo.rot.z:0);
  if(vo){px+=vo.pos.x;py+=vo.pos.y;pz+=vo.pos.z}
  root.rotation.set(rx,ryy,rz);
  pivot.fromArray(c.pivot);q1.setFromEuler(root.rotation);v1.copy(pivot).applyQuaternion(q1);
  // „FOV viewmodelu” bez osobnego przebiegu renderu: zoom ADS powiększa wszystko o m = tan(f0/2)/tan(f/2); ściskając broń
  // w x,y o 1/m (z bez zmian) dostajemy na ekranie ten sam obraz broni co przy FOV z opcji, a linia celowania (oś −Z) zostaje.
  const mz=Math.pow(Math.tan(opt.fov*Math.PI/360)/Math.tan(fov*Math.PI/360),GL.ads.vmFovComp),inv=1/mz;
  root.scale.set(inv,inv,1);
  root.position.set((px+pivot.x-v1.x)*inv,(py+pivot.y-v1.y)*inv,pz+pivot.z-v1.z);
  /* luneta: model chowa lunetę/broń, nakładka rysuje siatkę */
  let scope=null;
  if(F.reticle){const a=clamp01((e-GL.ads.scopeAt)/(1-GL.ads.scopeAt));F.scope=a;const on=a>0;
    if(on!==F.scoped){F.scoped=on;if(F.setAds)F.setAds(on)}
    if(model)model.visible=a<.999;
    if(on)scope=SCOPE.set(F.reticle,smoother(a),swX.x*-900*mm,swY.x*900*mm)}
  /* ── kamera ── */
  const o=PL.camOffset,sh=G.shake*GL.shake.scale*fxk('shake',opt.fx),t=F.t,fq=GL.shake.freq;
  const shP=sh?sh*(Math.sin(t*fq[0])*.6+Math.sin(t*fq[1]*1.7+1)*.4):0,shY=sh?sh*(Math.sin(t*fq[1]+2)*.6+Math.sin(t*fq[2]*2.3)*.4):0,shR=sh?sh*GL.shake.rollMul*Math.sin(t*fq[2]+4):0;
  const scoped=!!F.reticle&&F.scope>0,bA=(scoped?c.breathScope:c.breath)*e*(1+spd*GL.breath.moveMul),BR=GL.breath;
  const brP=bA?bA*(Math.sin(t*TAU*BR.f1)+.35*Math.sin(t*TAU*BR.f2+.7)):0,brY=bA?bA*.7*Math.sin(t*TAU*BR.f3+1.3):0;
  const hb=B.cam*Math.sin(ph*2)*ma*lerp(1,GL.ads.camBob,e)*fxk('bob',opt.fx),roll=G.dead?Math.min(G.deadT||0,1)*.5:0;
  camera.rotation.set(P.pitch+cpP.x+camK.x+brP+shP+o.pitch,P.yaw+cpY.x+brY+shY+o.yaw,roll+shR+B.camRoll*Math.sin(ph)*ma*(1-e)+o.roll);
  camera.position.set(P.pos.x+o.pos.x,P.pos.y+PL.EYE+hb+landC.x+o.pos.y,P.pos.z+o.pos.z);
  F.lastYaw=P.yaw;F.lastPitch=P.pitch;
  /* ── efekty z kolejki (wymagają aktualnych macierzy) ── */
  let needM=F.qLight>0||F.qSmoke>.3;for(let i=0;i<F.ejects.length;i++){if(F.ejects[i]>0)F.ejects[i]=Math.max(0,F.ejects[i]-dt);if(F.ejects[i]===0)needM=true}
  if(needM){camera.updateMatrixWorld(true);
    if(PL.flash)PL.flash.getWorldPosition(muz);
    if(F.qLight>0){FX.muzzleLight(muz,F.qLight,(c.flash.dur||.05)*1.5);F.qLight=0}
    if(F.qSmoke>.3){back.set(0,0,-1).applyQuaternion(camera.quaternion);v2.copy(muz).addScaledVector(back,.12);FX.puffSmoke(v2,Math.min(1.4,F.qSmoke),vel.copy(P.vel).multiplyScalar(.3));F.qSmoke=0}
    for(let i=0;i<F.ejects.length;i++)if(F.ejects[i]===0){F.ejects[i]=-1;eject(1)}}
  // dym po dłuższej serii: lufa „dymi” chwilę po puszczeniu spustu
  if(F.burst>=GL.smoke.burstAfter)F.burstSmoke=true;
  if(F.burstSmoke&&G.time-F.lastShot>.25&&G.time-F.lastShot<.27+dt){camera.updateMatrixWorld(true);if(PL.flash)PL.flash.getWorldPosition(muz);FX.puffSmoke(muz,1.2,null);F.burstSmoke=false}
  v3.copy(camera.position);FX.updateFx(dt,v3);
  drawOverlay(dt,scope,1-e*GL.ads.xhairFade);
}
const SCOPE={kind:'',a:0,dx:0,dy:0,set(k,a,dx,dy){this.kind=k;this.a=a;this.dx=dx;this.dy=dy;return this}};

/* ───────── cykl życia ───────── */
function resetAll(){
  for(const s of ALL)s.reset();kicks.reset();F.ads=F.adsE=F.sprint=F.moveAmp=0;F.pendP=F.pendY=0;F.punchP=F.punchY=0;F.burst=0;F.lastShot=-9;
  F.model=null;F.id=null;F.init=false;F.scoped=false;F.scope=0;F.ejects.fill(-1);F.qLight=0;F.qSmoke=0;F.burstSmoke=false;
  PL.fovMul=1;if(camera.fov!==opt.fov){camera.fov=opt.fov;camera.updateProjectionMatrix()}
  if(PL.viewmodel)PL.viewmodel.scale.set(1,1,1);
}
DS.bus.on('update',update);
DS.bus.on('shot',onShot);
DS.bus.on('hit',onHit);
DS.bus.on('kill',onKill);
DS.bus.on('levelStart',()=>{resetAll();FX.clearFx();clearOverlay()});
DS.bus.on('levelEnd',()=>{resetAll();animClear();FX.clearFx();clearOverlay();F.ready=false});
DS.bus.on('levelUnload',()=>FX.clearFx());
DS.bus.on('pause',on=>{if(on)clearOverlay()});
