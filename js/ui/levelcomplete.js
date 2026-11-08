// Ekran „Poziom ukończony”: po zdarzeniu 'levelComplete' {level, wave} (emituje poziom, np. po zabiciu bossa).
// Pauzuje run, pokazuje podsumowanie (fale, zabici, znajdźki x/y, nagroda z level.win.reward) i przyciski:
//   „Graj dalej” (wznawia run: gra toczy się dalej), „Dalej” (następny poziom z DS.levels, jeśli jest), „Menu”.
import {$} from '../core/util.js';
import {opt,persistOpt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {sfx} from '../audio/sfx.js';
import {loadLevel} from '../world/world.js';
import {collectStats} from '../world/levels/common.js';
import {startGame,toMenuMode,resume} from '../game/flow.js';
import {show} from './screens.js';
import {h,clear} from './dom.js';
import {L as T} from '../core/i18n.js';

const SHOW_DELAY=2200;     // po napisie poziomu ("WYCZYSZCZONE!"), żeby nie przykryć animacji zwycięstwa
let cur=null;

const stats=h('div',{class:'stats',id:'lcStats'});
const title=h('h2',{id:'lcT'},T('Poziom ukończony!','Level complete!'));
const cap=h('div',{class:'caption',id:'lcCap',style:'text-transform:none'});
const bKeep=h('button',{class:'btn paper',id:'lcKeep',type:'button'},T('Graj dalej','Keep playing'));
const bNext=h('button',{class:'btn red',id:'lcNext',type:'button','data-autofocus':''},T('Dalej','Next'));
const bMenu=h('button',{class:'btn paper',id:'lcMenu',type:'button'},T('Menu','Menu'));
const scr=h('section',{class:'screen dim',id:'scrLevelDone',hidden:true},
  h('div',{class:'panel card',role:'dialog','aria-modal':'true','aria-labelledby':'lcT'},title,cap,stats,h('div',{class:'row'},bNext,bKeep,bMenu)));
(document.getElementById('scrOver').parentNode).append(scr);

/** Następny poziom w rejestrze po `id` (null, gdy to ostatni). */
export function nextLevel(id){const l=DS.levels.all(),i=l.findIndex(x=>x.id===id);return i>=0&&i+1<l.length?l[i+1]:null}

function open(e){
  const G=S.G;if(!G||(G.dead&&!DS.net.active())||S.mode!=='game')return;   // co-op: ekran także u leżącego
  const L=DS.levels.get(e.level)||{},w=L.win||{},r=w.reward||{},st=collectStats(L);
  cur={id:e.level,next:nextLevel(e.level)};
  title.textContent=w.text||T('Poziom ukończony!','Level complete!');
  cap.textContent=(L.name||e.level)+T(' · gra może toczyć się dalej',' · the game can go on');
  const rw=[r.coins?'+'+r.coins+' ZD':'',r.keys?'+'+r.keys+' '+T.n(r.keys,{pl:['klucz','klucze','kluczy'],en:['key','keys']}):''].filter(Boolean).join(', ')||T('brak','none');
  clear(stats);
  for(const [k,v] of [[T('Fala','Wave'),e.wave],[T('Zabici','Kills'),G.kills],[T('Znajdźki','Collectibles'),st.found+' / '+st.total],[T('Nagroda','Reward'),rw]])stats.append(h('span',null,k),h('span',null,String(v)));
  bNext.hidden=!cur.next;bNext.textContent=cur.next?T('Dalej: ','Next: ')+(cur.next.name||cur.next.id):T('Dalej','Next');bNext.disabled=false;
  // Co-op: świat się nie zatrzymuje (G.uiPause), „Dalej” klika tylko host, klient czeka.
  const coop=DS.net.active(),client=coop&&DS.net.isClient();
  if(client&&cur.next){bNext.disabled=true;bNext.textContent=T('Czekamy na hosta…','Waiting for the host…')}
  if(coop)G.uiPause=true;else G.paused=true;
  S.mouseDown=false;try{document.exitPointerLock&&document.exitPointerLock()}catch(_){}
  show('scrLevelDone');DS.bus.emit('pause',true);sfx('win');
}
DS.bus.on('levelComplete',e=>{
  const G=S.G;if(!e||!G)return;
  // Zabicie bossa często daje level-up, który pauzuje grę: czekamy, aż gracz wybierze perk (albo zamknie pauzę), zamiast przepuścić ekran.
  const tryOpen=()=>{if(S.G!==G||(G.dead&&!DS.net.active())||S.mode!=='game')return;if(G.paused){setTimeout(tryOpen,300);return}open(e)};
  setTimeout(tryOpen,SHOW_DELAY);
});

bKeep.addEventListener('click',()=>{sfx('tick',1000);resume()});
bMenu.addEventListener('click',()=>{sfx('tick',1000);
  if(DS.net.active()){if(DS.net.isHost())DS.net.toLobbyAll();else DS.net.quitRun();return}   // co-op: host wraca z drużyną do lobby, klient sam
  toMenuMode();show('scrMenu')});
bNext.addEventListener('click',()=>{
  sfx('tick',1000);const n=cur&&cur.next;if(!n)return;
  if(DS.net.active()){if(DS.net.isHost())DS.net.nextLevel(n.id);return}   // co-op: kolejny poziom u wszystkich (klient czeka na hosta)
  toMenuMode();                                   // sprząta run (levelEnd) przed zmianą poziomu
  try{loadLevel(n.id);opt.level=n.id;persistOpt()}catch(err){console.warn('Dalej: nie udało się wczytać poziomu',n.id,err);show('scrMenu');return}
  startGame();
});
