// Pasek HP bossa (górny środek HUD, styl komiksowy). Zdarzenia szyny od typów bossów (enemies/boss.js):
//   'bossHp'    {enemy, hp, max, name, phase}  co ~0,18 s żywego bossa: wypełnienie paska i nazwa,
//   'bossPhase' {enemy, phase, name}           próg fazy: plakietka "FAZA n" z mignięciem.
// Pasek znika po zabiciu bossa ('kill'), na 'levelEnd' i gdy przez 1,5 s nie ma 'bossHp' (boss usunięty/wyczyszczony).
import {$} from '../core/util.js';
import {opt} from '../core/save.js';
import {DS} from '../core/ds.js';
import {h} from './dom.js';
import {motionReduced} from './uiopts.js';

const fill=h('i',{id:'hBossFill'}),ghost=h('i',{class:'ghost',id:'hBossGhost'});
const nameEl=h('b',{id:'hBossName'},'');
const phaseEl=h('small',{id:'hBossPhase',hidden:true},'');
const pctEl=h('span',{id:'hBossPct'},'');
const bar=h('div',{class:'bossbar',id:'hBoss',hidden:true,role:'progressbar','aria-label':'Zdrowie bossa','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':'100'},
  h('div',{class:'bosshead'},nameEl,phaseEl),h('div',{class:'bosstrack'},ghost,fill,pctEl));
$('#hud').append(bar);

let shown=false,staleT=0,phaseT=0,lastFrac=-1,lastName='',lastPhase=0,lastPct=-1;
function hide(){if(!shown)return;shown=false;bar.hidden=true;phaseEl.hidden=true;bar.classList.remove('flash');lastFrac=-1;lastPct=-1;lastName='';lastPhase=0}
function setPhase(n){
  if(n===lastPhase)return;lastPhase=n;
  phaseEl.hidden=!(n>1);phaseEl.textContent=n>1?'FAZA '+n:'';
}
DS.bus.on('bossHp',e=>{
  if(!e||!(e.max>0))return;
  if(e.enemy&&e.enemy.alive===false){hide();return}
  const f=Math.max(0,Math.min(1,e.hp/e.max));
  if(!shown){shown=true;bar.hidden=false}
  staleT=1.5;
  if(f!==lastFrac){lastFrac=f;fill.style.transform=`scaleX(${f})`;ghost.style.transform=`scaleX(${f})`;
    const pct=Math.ceil(f*100);if(pct!==lastPct){lastPct=pct;pctEl.textContent=pct+'%';bar.setAttribute('aria-valuenow',String(pct))}}
  const nm=(e.name||'BOSS').toUpperCase();if(nm!==lastName){lastName=nm;nameEl.textContent=nm}
  setPhase(e.phase||1);
});
DS.bus.on('bossPhase',e=>{
  if(!e)return;
  if(!shown){shown=true;bar.hidden=false}
  staleT=1.5;setPhase(e.phase||1);
  if(opt.fx>0&&!motionReduced()){bar.classList.remove('flash');void bar.offsetWidth;bar.classList.add('flash');phaseT=.7}
});
DS.bus.on('kill',e=>{if(e&&e.enemy&&e.enemy.boss)hide()});
DS.bus.on('levelEnd',hide);
DS.bus.on('update',dt=>{
  if(!shown)return;
  if(phaseT>0){phaseT-=dt;if(phaseT<=0)bar.classList.remove('flash')}
  staleT-=dt;if(staleT<=0)hide();
});