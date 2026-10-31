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

const SHOW_DELAY=2200;     // po napisie poziomu ("WYCZYSZCZONE!"), żeby nie przykryć animacji zwycięstwa
let cur=null;

const stats=h('div',{class:'stats',id:'lcStats'});
const title=h('h2',{id:'lcT'},'Poziom ukończony!');
const cap=h('div',{class:'caption',id:'lcCap',style:'text-transform:none'});
const bKeep=h('button',{class:'btn paper',id:'lcKeep',type:'button'},'Graj dalej');
const bNext=h('button',{class:'btn red',id:'lcNext',type:'button','data-autofocus':''},'Dalej');
const bMenu=h('button',{class:'btn paper',id:'lcMenu',type:'button'},'Menu');
const scr=h('section',{class:'screen dim',id:'scrLevelDone',hidden:true},
  h('div',{class:'panel card',role:'dialog','aria-modal':'true','aria-labelledby':'lcT'},title,cap,stats,h('div',{class:'row'},bNext,bKeep,bMenu)));
(document.getElementById('scrOver').parentNode).append(scr);

/** Następny poziom w rejestrze po `id` (null, gdy to ostatni). */
export function nextLevel(id){const l=DS.levels.all(),i=l.findIndex(x=>x.id===id);return i>=0&&i+1<l.length?l[i+1]:null}

function open(e){
  const G=S.G;if(!G||G.dead||S.mode!=='game')return;
  const L=DS.levels.get(e.level)||{},w=L.win||{},r=w.reward||{},st=collectStats(L);
  cur={id:e.level,next:nextLevel(e.level)};
  title.textContent=w.text||'Poziom ukończony!';
  cap.textContent=(L.name||e.level)+' · gra może toczyć się dalej';
  const rw=[r.coins?'+'+r.coins+' ZD':'',r.keys?'+'+r.keys+(r.keys===1?' klucz':' klucze'):''].filter(Boolean).join(', ')||'brak';
  clear(stats);
  for(const [k,v] of [['Fala',e.wave],['Zabici',G.kills],['Znajdźki',st.found+' / '+st.total],['Nagroda',rw]])stats.append(h('span',null,k),h('span',null,String(v)));
  bNext.hidden=!cur.next;bNext.textContent=cur.next?'Dalej: '+(cur.next.name||cur.next.id):'Dalej';
  G.paused=true;S.mouseDown=false;try{document.exitPointerLock&&document.exitPointerLock()}catch(_){}
  show('scrLevelDone');DS.bus.emit('pause',true);sfx('win');
}
DS.bus.on('levelComplete',e=>{
  const G=S.G;if(!e||!G)return;
  setTimeout(()=>{if(S.G===G&&!G.paused)open(e)},SHOW_DELAY);
});

bKeep.addEventListener('click',()=>{sfx('tick',1000);resume()});
bMenu.addEventListener('click',()=>{sfx('tick',1000);toMenuMode();show('scrMenu')});
bNext.addEventListener('click',()=>{
  sfx('tick',1000);const n=cur&&cur.next;if(!n)return;
  toMenuMode();                                   // sprząta run (levelEnd) przed zmianą poziomu
  try{loadLevel(n.id);opt.level=n.id;persistOpt()}catch(err){console.warn('Dalej: nie udało się wczytać poziomu',n.id,err);show('scrMenu');return}
  startGame();
});
