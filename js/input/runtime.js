// Warstwa działania akcji ponad surowym stanem kodów z core/input.js (właściciel: ds-input-menus):
//  - przytrzymaj/przełącz dla ADS, sprintu i kucania (opt.adsMode / sprintMode / crouchMode),
//  - DS.input.pressed(id): true w klatce, w której akcję właśnie wciśnięto,
//  - zdarzenia DS.bus 'input:down' / 'input:up' {action, code} (tylko w trakcie gry),
//  - przechwytywanie następnego klawisza/przycisku/kółka do rebindu (DS.input.capture),
//  - blokowanie domyślnych reakcji przeglądarki (menu kontekstowe, przewijanie) w grze.
// Surowe `isDown` z core jest owinięte: w trybie „przełącz” zwraca stan przełącznika.
import {DS} from '../core/ds.js';
import {S} from '../core/state.js';
import {opt} from '../core/save.js';
import {canon} from './actions.js';

const I=DS.input;
const TOGGLE={ads:'adsMode',sprint:'sprintMode',crouch:'crouchMode'};
const on={ads:false,sprint:false,crouch:false};let sprintMoved=false;
const isTog=id=>opt[TOGGLE[id]]==='toggle';
const inGame=()=>{const G=S.G;return S.mode==='game'&&!!G&&!G.paused&&!G.dead};

/* ---- isDown / pressed ---- */
const isDown0=I.isDown;
I.isDown=id=>{id=canon(id);return (id in TOGGLE&&isTog(id))?on[id]:isDown0(id)};
let tick=0;const pressedAt=Object.create(null);
/** Prawda w klatce gry, w której akcja została wciśnięta (krawędź narastająca). */
I.pressed=id=>pressedAt[canon(id)]===tick;
function frameTick(){tick++;requestAnimationFrame(frameTick)}
requestAnimationFrame(frameTick);

/** Efektywna czułość myszy: `opt.sens` (w ADS dodatkowo razy `opt.adsSens`). */
I.sensitivity=()=>opt.sens*(I.isDown('ads')?opt.adsSens:1);
/** Czy gracz celuje (ADS), z uwzględnieniem trybu przytrzymaj/przełącz. */
I.adsActive=()=>I.isDown('ads');
/** Zerowanie przełączników (pauza, koniec runu, utrata fokusu). */
I.resetToggles=()=>{on.ads=on.sprint=on.crouch=false};

/* ---- krawędzie wciśnięcia/puszczenia ---- */
function press(code,repeat){
  if(repeat)return;
  const ids=I.actionsFor(code);
  for(let i=0;i<ids.length;i++){
    const id=ids[i];pressedAt[id]=tick;
    if(id in TOGGLE){if(isTog(id)){on[id]=!on[id];if(id==='sprint')sprintMoved=false}else on[id]=false}
    DS.bus.emit('input:down',{action:id,code});
  }
}
function release(code){
  const ids=I.actionsFor(code);
  for(let i=0;i<ids.length;i++)DS.bus.emit('input:up',{action:ids[i],code});
}
const movementDown=()=>{const d=isDown0;return d('moveForward')||d('moveBack')||d('moveLeft')||d('moveRight')};

/* ---- przechwytywanie do rebindu ---- */
let cap=null;
/** Przechwytuje następny klawisz / przycisk myszy / kółko. cb({code}) albo cb(null) po Esc. Zwraca funkcję anulującą. */
I.capture=cb=>{cap=cb;return ()=>{if(cap===cb)cap=null}};
I.capturing=()=>!!cap;
function finishCapture(code){const f=cap;cap=null;if(f)f(code?{code}:null)}
function swallowClick(){
  const sup=ev=>{ev.stopPropagation();ev.preventDefault()};
  addEventListener('click',sup,{capture:true,once:true});addEventListener('contextmenu',sup,{capture:true,once:true});
  setTimeout(()=>{removeEventListener('click',sup,true);removeEventListener('contextmenu',sup,true)},500);
}

addEventListener('keydown',e=>{
  if(cap){e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;finishCapture(e.code==='Escape'?null:e.code);return}
  if(!inGame())return;
  const code=e.code;
  if(I.actionsFor(code).length&&!e.metaKey&&!e.altKey)e.preventDefault();
  press(code,e.repeat);
},true);
addEventListener('keyup',e=>{if(inGame())release(e.code)},true);
addEventListener('mousedown',e=>{
  if(cap){e.preventDefault();e.stopImmediatePropagation();swallowClick();finishCapture('Mouse'+e.button);return}
  if(!inGame())return;
  if(e.button===1||e.button===3||e.button===4)e.preventDefault();
  press('Mouse'+e.button,false);
},true);
addEventListener('mouseup',e=>{if(!inGame())return;if(e.button===1||e.button===3||e.button===4)e.preventDefault();release('Mouse'+e.button)},true);
addEventListener('auxclick',e=>{if(S.mode==='game')e.preventDefault()},true);
addEventListener('contextmenu',e=>{if(S.mode==='game'||cap)e.preventDefault()},true);
addEventListener('wheel',e=>{
  const code=e.deltaY>0?'WheelDown':'WheelUp';
  if(cap){e.preventDefault();e.stopImmediatePropagation();finishCapture(code);return}
  if(inGame())press(code,false);
},{capture:true,passive:false});
addEventListener('blur',()=>I.resetToggles());

/* ---- czyszczenie stanu przy zmianach trybu ---- */
DS.bus.on('pause',I.resetToggles);
DS.bus.on('levelStart',I.resetToggles);
DS.bus.on('levelEnd',I.resetToggles);
// Sprint „przełącz” gaśnie, gdy gracz przestaje się ruszać.
DS.bus.on('update',()=>{if(!on.sprint)return;if(movementDown())sprintMoved=true;else if(sprintMoved){on.sprint=false;sprintMoved=false}});
