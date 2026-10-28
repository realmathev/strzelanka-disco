// Pętla gry. Kolejność kroków w updateGame jest taka sama jak w monolicie — nie przestawiaj bez powodu.
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {renderer,scene,camera} from '../render/renderer.js';
import {updateFx3d} from '../render/fx3d.js';
import {drawFx,capturePanels,tickPanels} from '../render/comicfx.js';
import {world} from '../world/state.js';
import {animateWorld} from '../world/world.js';
import {updateMovement,updateCamera} from '../player/player.js';
import {gunRoot,tickFlash,updateViewmodel} from '../weapons/viewmodel.js';
import {updateWeapons} from '../weapons/fire.js';
import {updateEnemies} from '../enemies/manager.js';
import {updatePickups} from '../pickups/pickups.js';
import {updateWaves} from './waves.js';
import {updateHud} from '../ui/hud.js';

export const clock=new THREE.Clock();
let menuT=0;
/** Oficjalny hit-stop: DS.time.freeze(ms) zatrzymuje symulacje (dt=0) na ms (max 80), render idzie dalej. Wolajacy sprawdza opt.hitStop / opt.fx. */
let freezeUntil=0;
DS.time={freeze(ms){ms=Math.min(80,Math.max(0,+ms||0));if(ms>0)freezeUntil=Math.max(freezeUntil,performance.now()+ms)},frozen(){return performance.now()<freezeUntil}};
const MENU_CAM={r:26,y:7,look:[0,4,0]};

export function updateGame(dt){
  const G=S.G;
  G.time+=dt;
  updateMovement(dt);
  // timers
  G.fireT-=dt;G.hurtT=Math.max(0,G.hurtT-dt);G.hitT=Math.max(0,G.hitT-dt);G.flashT=Math.max(0,(G.flashT||0)-dt);G.panelCD-=dt;
  G.comboT-=dt;if(G.comboT<=0&&G.combo>0)G.combo=0;
  updateWeapons(dt);
  tickFlash(dt);
  tickPanels(dt);
  // waves
  const alive=updateEnemies(dt);
  updateWaves(dt,alive);
  updatePickups(dt);updateFx3d(dt);
  updateCamera(dt);
  updateViewmodel(dt);
  updateHud(alive);
  DS.bus.emit('update',dt);
}

export function loop(){
  requestAnimationFrame(loop);
  const dt=DS.time.frozen()?(clock.getDelta(),0):Math.min(clock.getDelta(),.05);const t=clock.elapsedTime;
  animateWorld(t,dt);
  const G=S.G;
  if(S.mode==='game'&&G&&!G.paused)updateGame(dt);
  else if(S.mode!=='game'){const mc=world.level&&world.level.menuCam||MENU_CAM;menuT+=dt*.08;camera.position.set(Math.cos(menuT)*mc.r,mc.y+Math.sin(menuT*.7)*1.5,Math.sin(menuT)*mc.r);camera.lookAt(mc.look[0],mc.look[1],mc.look[2]);gunRoot.visible=false}
  if(S.mode==='game')gunRoot.visible=!G.dead;
  renderer.render(scene,camera);
  if(S.mode==='game'&&G&&G.panelReq)capturePanels();
  drawFx(S.mode==='game'&&G&&!G.paused?dt:0);
}
