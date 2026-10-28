// Bazowe nasłuchiwanie klawiatury/myszy -> akcje DS.input -> działania w grze.
import {clamp} from '../core/util.js';
import {save,opt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {canvas} from '../render/renderer.js';
import {P} from './player.js';
import {fire,startReload,switchWeapon,selectSlot} from '../weapons/fire.js';
import {ownedWeapons,SLOT_COUNT} from '../weapons/slots.js';
import {useMedkit} from '../pickups/medkit.js';
import {pause,lockPointer} from '../game/flow.js';

const I=DS.input;
const inGame=()=>S.mode==='game'&&S.G&&!S.G.paused&&!S.G.dead;

document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&S.mode==='game'&&S.G&&!S.G.dead&&!S.G.paused)pause()});
addEventListener('keydown',e=>{I.setCode(e.code,true);if(!inGame())return;
  const c=e.code;
  if(I.matches('reload',c))startReload();
  if(I.matches('medkit',c))useMedkit();
  for(let i=1;i<=SLOT_COUNT;i++)if(I.matches('weapon'+i,c))selectSlot(i); // klawisze 1-6 = sloty (weapons/slots.js)
  if(I.matches('pause',c))pause();
  if(['Space','ArrowUp','ArrowDown'].includes(c))e.preventDefault()});
addEventListener('keyup',e=>I.setCode(e.code,false));
addEventListener('blur',()=>{I.releaseAll();S.mouseDown=false});
canvas.addEventListener('mousedown',e=>{if(!inGame())return;if(document.pointerLockElement!==canvas)lockPointer();const c='Mouse'+e.button;I.setCode(c,true);if(I.matches('fire',c)){S.mouseDown=true;fire()}});
addEventListener('mouseup',e=>{const c='Mouse'+e.button;I.setCode(c,false);if(I.matches('fire',c))S.mouseDown=false});
addEventListener('mousemove',e=>{if(!inGame())return;const s=.0022*I.sensitivity();P.yaw-=e.movementX*s;P.pitch-=e.movementY*s*(opt.invert?-1:1);P.pitch=clamp(P.pitch,-1.45,1.45)});
addEventListener('wheel',e=>{const G=S.G;if(S.mode!=='game'||!G||G.paused)return;const c=e.deltaY>0?'WheelDown':'WheelUp';const d=I.matches('weaponNext',c)?1:I.matches('weaponPrev',c)?-1:0;if(!d)return;
  const own=ownedWeapons();let i=own.indexOf(G.weapon);i=(i+d+own.length)%own.length;switchWeapon(own[i])},{passive:true});
