// Przejścia stanu gry: start, pauza, wznowienie, powrót do menu, druga szansa.
import {$} from '../core/util.js';
import {save,opt,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {canvas} from '../render/renderer.js';
import {announce} from '../render/comicfx.js';
import {audioInit} from '../audio/init.js';
import {setTrack,gameTrack} from '../audio/music.js';
import {sfx} from '../audio/sfx.js';
import {world} from '../world/state.js';
import {P} from '../player/player.js';
import {newRun,clearRun} from './run.js';
import {clock} from './loop.js';
import {show,hideAll} from '../ui/screens.js';
import {resetHud} from '../ui/hud.js';

export function lockPointer(){try{const r=canvas.requestPointerLock&&canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}}
export function startGame(){audioInit();newRun();S.mode='game';hideAll();$('#hud').hidden=false;$('#panels').hidden=true;setTrack(gameTrack(opt),false);resetHud();lockPointer();
  DS.bus.emit('levelStart',{level:world.level&&world.level.id})}
/** Kończy run i wraca do trybu menu (bez wybierania ekranu). */
export function toMenuMode(){clearRun();S.mode='menu';$('#hud').hidden=true;setTrack('A',true)}
export function pause(){const G=S.G;if(!G||G.dead||G.paused)return;G.paused=true;S.mouseDown=false;show('scrPause');DS.bus.emit('pause',true)}
export function resume(){S.G.paused=false;hideAll();lockPointer();clock.getDelta();DS.bus.emit('pause',false)}
export function quitToMenu(){persist();toMenuMode();show('scrMenu')}
export function revive(){const G=S.G;save.secondChance--;persist();G.revived=true;G.dead=false;G.hp=G.maxHp;G.deadT=0;P.pos.y=0;hideAll();announce('DRUGA SZANSA!','Siostra Halina postawiła cię na nogi');sfx('heal');G.enemies.forEach(e=>e.shootT=2.5);lockPointer();
  DS.bus.emit('heal',{amount:G.maxHp,source:'revive'})}
