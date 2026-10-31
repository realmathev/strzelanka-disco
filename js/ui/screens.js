// Ekrany (sekcje .screen), portfel, nawigacja, ostrzeżenie, ekran końca gry.
// Ekrany menu/opcji/pauzy buduje build.js (importowany pierwszy, żeby DOM był gotowy).
import './build.js';
import {$,$$,pick} from '../core/util.js';
import {save,opt,persistOpt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {audioInit} from '../audio/init.js';
import {setTrack} from '../audio/music.js';
import {sfx} from '../audio/sfx.js';
import {world} from '../world/state.js';
import {loadLevel} from '../world/world.js';
import {clearRun} from '../game/run.js';
import {startGame,toMenuMode,resume,pause,quitToMenu,revive} from '../game/flow.js';
import {syncOptUI,openOptionsTab} from './options.js';
import {applyUiOpts,motionReduced} from './uiopts.js';
import {renderShop} from './shop.js';
import {renderInv,stopPreview} from './inventory.js';
import {initSlots} from './slots.js';
import {refreshMenu,renderPlay,renderPausePerks,validLevel} from './menu.js';
import {renderAch,renderCollection} from './extras.js';
import {cancelBindUi} from './controls.js';
import {initNav,activeScreen,focusInitial} from './nav.js';

let optReturn='scrMenu';
export function show(id){
  cancelBindUi(true);stopPreview();
  let target=null;
  $$('.screen').forEach(s=>{const on=s.id===id;s.hidden=!on;if(on)target=s});
  if(id==='scrMenu')refreshMenu();
  if(id==='scrPause')renderPausePerks();
  if(id==='scrShop')renderShop();if(id==='scrInv')renderInv();if(id==='scrCasino')initSlots();if(id==='scrOptions')syncOptUI();
  if(id==='scrPlay')renderPlay();if(id==='scrAch')renderAch();if(id==='scrCollection')renderCollection();
  if(id==='scrCrates'){$('#cresult').hidden=true;$('#spinner').hidden=true}
  updateWallet();
  if(target){
    if(!motionReduced()){target.classList.remove('enter');void target.offsetWidth;target.classList.add('enter')}
    focusInitial(target);
  }
}
export function hideAll(){$$('.screen').forEach(s=>s.hidden=true);stopPreview()}
export function updateWallet(){$$('.w-coins').forEach(e=>e.textContent=save.coins.toLocaleString('pl-PL'));$$('.w-keys').forEach(e=>e.textContent=save.keys);$$('.w-best').forEach(e=>e.textContent=save.best)}
DS.bus.on('save',updateWallet);

// Przyciski nawigacji [data-go] (delegacja: ekrany są budowane dynamicznie).
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-go]');if(!b)return;
  sfx('tick',1000);const G=S.G;
  if(b.dataset.go==='scrMenu'||S.mode!=='game'||(G&&G.dead)){if(S.mode==='game')clearRun();S.mode='menu';$('#hud').hidden=true;setTrack('A',true)}
  show(b.dataset.go);
});

function startWarn(intensity){opt.fx=intensity;persistOpt();applyUiOpts();audioInit();setTrack('A',true);S.mode='menu';show('scrMenu');syncOptUI()}
$('#warnFull').addEventListener('click',()=>startWarn(Math.max(opt.fx,1)===2?2:1));
$('#warnSafe').addEventListener('click',()=>startWarn(0));
$('#mOpts').addEventListener('click',()=>{optReturn='scrMenu';show('scrOptions')});
$('#optBack').addEventListener('click',()=>{show(optReturn)});
$('#mExit').addEventListener('click',()=>{sfx('tick',1000);show('scrBye');if(window.opener){try{window.close()}catch(e){}}});
if(matchMedia('(pointer:coarse)').matches&&!matchMedia('(pointer:fine)').matches)$('#touchNote').hidden=false;

/** Start gry na wybranym poziomie (ładuje poziom, jeśli to inny niż aktualny). */
function playNow(){
  const id=validLevel();
  if(id&&world.level&&world.level.id!==id&&DS.levels.has(id)){try{loadLevel(id)}catch(err){opt.level=world.level.id;persistOpt()}}
  startGame();
}
$('#mPlay').addEventListener('click',playNow);
$('#pGo').addEventListener('click',playNow);
$('#oAgain').addEventListener('click',()=>startGame());
$('#oMenu').addEventListener('click',()=>{toMenuMode();show('scrMenu')});
$('#pResume').addEventListener('click',()=>resume());
$('#pOpts').addEventListener('click',()=>{optReturn='scrPause';show('scrOptions')});
$('#pKeys').addEventListener('click',()=>{optReturn='scrPause';show('scrOptions');openOptionsTab('ctl')});
$('#pQuit').addEventListener('click',()=>quitToMenu());
$('#oRevive').addEventListener('click',()=>revive());

/** Esc / B: wstecz z bieżącego ekranu. Zwraca true, jeśli akcja została obsłużona. */
export function goBack(){
  if(cancelBindUi())return true;
  const s=activeScreen();if(!s)return false;
  switch(s.id){
    case 'scrPause':if(S.G&&S.G.paused){resume();return true}return false;
    case 'scrOptions':$('#optBack').click();return true;
    case 'scrLevelDone':$('#lcKeep').click();return true;
    case 'scrMenu':case 'scrWarn':case 'scrOver':return false;
    default:{const b=s.querySelector('[data-go="scrMenu"]');if(b){b.click();return true}return false}
  }
}
initNav({back:goBack,start:()=>pause()});

export function showOver(){
  if(S.mode!=='game')return;const G=S.G;
  $('#overCap').textContent=pick(['Orkiestra gra dalej, ale już bez ciebie.','Gang zabrał ci portfel, ale ZD zostały na koncie.','Siostra Halina wzdycha i sięga po bandaż.']);
  $('#overStats').innerHTML=`<span>Fala</span><span>${G.wave}</span><span>Zabici</span><span>${G.kills}</span><span>Headshoty</span><span>${G.heads}</span><span>Zarobione ZD</span><span>${G.earned}</span><span>Znalezione klucze</span><span>${G.keysFound}</span><span>Rekord</span><span>fala ${save.best}</span>`;
  $('#oRevive').hidden=!(save.secondChance>0&&!G.revived);show('scrOver');
}
