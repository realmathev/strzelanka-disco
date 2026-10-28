// Gracz: ruch, skok, kamera FPS i hooki dla feelingu broni.
import {rand} from '../core/util.js';
import {opt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {camera} from '../render/renderer.js';
import {world} from '../world/state.js';
import {collide} from './collision.js';
import {CFG} from '../pickups/config.js';

export const EYE=1.62; // wysokość oczu [m]
/** pos: stopy gracza; yaw/pitch w radianach; bob: faza kołysania. */
export const P={pos:new THREE.Vector3(0,0,30),vel:new THREE.Vector3(),vy:0,yaw:0,pitch:0,ground:true,bob:0};

/** Addytywne przesunięcie kamery (np. sprężyna odrzutu). Zerowane NIE jest automatycznie: właściciel sam je wygasza. */
export const camOffset={pitch:0,yaw:0,roll:0,pos:new THREE.Vector3()};

Object.assign(DS.player,{
  P,EYE,camOffset,
  fovMul:1,                 // mnożnik FOV (ADS); kamera aktualizuje się tylko przy zmianie
  /** Trwały kopniak celownika (jak w oryginale: dodaje do pitch/yaw gracza). */
  addRecoil(pitch,yaw){P.pitch+=pitch;P.yaw+=yaw||0},
  /** Mnożnik prędkości ruchu (adrenalina: S.G.adrenT>0 -> CFG.adrenaline.sprintMul). Liczy go updateMovement. */
  speedMul(){const G=S.G;return G&&G.adrenT>0?CFG.adrenaline.sprintMul:1},
  /** Mnożnik odrzutu (adrenalina: CFG.adrenaline.recoilMul = .7). Hook dla ds-gunfeel: mnóż nim podrzut/sprężynę odrzutu. */
  recoilMul(){const G=S.G;return G&&G.adrenT>0?CFG.adrenaline.recoilMul:1},
  /** Mnoznik rozrzutu (weapons/fire.js). Domyslnie 1; ds-gunfeel podmienia go na wartosc zalezna od postepu ADS (W.adsSpread). */
  spreadMul(){return 1},
  /** Flaga: gdy true, kamere (rotation/position bez wstrzasu) i viewmodel sklada ds-gunfeel w zdarzeniu 'update', a updateCamera/updateViewmodel pomijaja
   *  swoje warstwy (bob, wstrzas rand, odrzut bazowy); zanikanie G.shake/G.recoil i efekty skorek nadal dzialaja. Domyslnie false = zachowanie bez zmian. */
  feelOwnsView:false,
});

export function resetPlayer(){const sp=world.level&&world.level.spawn||{x:0,z:30,yaw:0};P.pos.set(sp.x,0,sp.z);P.vel.set(0,0,0);P.vy=0;P.yaw=sp.yaw||0;P.pitch=0}

export function updateMovement(dt){
  const G=S.G,inp=DS.input;
  if(!G.dead){
    const sprint=inp.isDown('sprint');const sp=(sprint?11:7)*DS.player.speedMul();
    let mx=(inp.isDown('moveRight')?1:0)-(inp.isDown('moveLeft')?1:0),mz=(inp.isDown('moveBack')?1:0)-(inp.isDown('moveForward')?1:0);const l=Math.hypot(mx,mz)||1;mx/=l;mz/=l;
    const s=Math.sin(P.yaw),c=Math.cos(P.yaw);const tx=(mx*c+mz*s)*sp,tz=(-mx*s+mz*c)*sp;
    const acc=P.ground?14:4;P.vel.x+=(tx-P.vel.x)*Math.min(1,acc*dt);P.vel.z+=(tz-P.vel.z)*Math.min(1,acc*dt);
    P.pos.x+=P.vel.x*dt;P.pos.z+=P.vel.z*dt;collide(P.pos,.45);
    if(inp.isDown('jump')&&P.ground){P.vy=7;P.ground=false}
    P.vy-=20*dt;P.pos.y+=P.vy*dt;if(P.pos.y<=0){P.pos.y=0;P.vy=0;P.ground=true}
    const spd=Math.hypot(P.vel.x,P.vel.z);if(P.ground&&spd>1)P.bob+=dt*spd*1.4;
  }else{P.pos.y=Math.max(P.pos.y-dt*2,-1.1)}
}

/** Kamera z wstrząsem (G.shake), kołysaniem, przechyłem po śmierci i camOffset. */
export function updateCamera(dt){
  const G=S.G,o=camOffset;
  G.shake=Math.max(0,G.shake-dt*2.5);const shk=G.shake*[.25,1,1.7][opt.fx]*.03;
  G.recoil=Math.max(0,G.recoil-dt*6);
  if(DS.player.feelOwnsView)return;
  camera.position.set(P.pos.x+o.pos.x,P.pos.y+EYE+Math.sin(P.bob*2)*.04+o.pos.y,P.pos.z+o.pos.z);
  camera.rotation.set(P.pitch+rand(-shk,shk)+o.pitch,P.yaw+rand(-shk,shk)+o.yaw,(G.dead?Math.min(G.deadT=(G.deadT||0)+dt,1)*.5:0)+o.roll);
  const fov=opt.fov*DS.player.fovMul;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix()}
}
