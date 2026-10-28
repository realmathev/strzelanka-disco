// HUD w grze. setTxt dotyka DOM tylko przy zmianie wartości.
// Nasłuchuje zdarzeń: 'xp' {xp, level, next}, 'levelup' {level}, 'armor' {armor, max} (ukryty przy max=0),
// 'damage' (poświata), 'hit' (znacznik trafienia). Dodatkowe elementy HUD tworzone są tu, w JS.
import {$} from '../core/util.js';
import {save,opt} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {comboMult} from '../game/run.js';
import '../input/optdefs.js';
import {h} from './dom.js';
import {makeCrosshair,applyCrosshair} from './crosshair.js';
import {motionReduced} from './uiopts.js';

let lastHud={};
export function resetHud(){lastHud={}}
export function setTxt(id,v){if(lastHud[id]!==v){lastHud[id]=v;$('#'+id).textContent=v}}

/* ---- budowa dodatkowych elementów ---- */
const hud=$('#hud');
const xh=makeCrosshair('xhair');
const oldCross=hud.querySelector('.cross');if(oldCross)oldCross.replaceWith(xh);else hud.prepend(xh);
applyCrosshair(xh);

const hpbar=hud.querySelector('.hpbar');
const armorBar=h('div',{class:'armorbar',id:'hArmorBar',hidden:true,role:'img','aria-label':'Pancerz'},h('i',{id:'hArmor'}),h('span',{id:'hArmorTxt'},'0'));
const barRow=h('div',{class:'bars'});hpbar.replaceWith(barRow);barRow.append(hpbar,armorBar);
const xpBar=h('div',{class:'xpbar',id:'hXpBar',role:'progressbar','aria-label':'Doświadczenie','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':'0'},
  h('b',{id:'hLvl'},'LV 1'),h('span',{class:'xptrack'},h('i',{id:'hXp'})),h('small',{id:'hXpTxt'},''));
$('.hud-bl').insertBefore(xpBar,barRow);
const vig=h('div',{class:'vig',id:'hVig','aria-hidden':'true'});hud.prepend(vig);
const lvlBanner=h('div',{class:'caption lvlup',id:'hLevelUp',hidden:true,role:'status','aria-live':'polite'});hud.append(lvlBanner);

/* ---- XP / poziom / pancerz ---- */
const clamp01=v=>v<0?0:v>1?1:v;
DS.bus.on('xp',e=>{
  if(!e)return;const next=e.next||0,frac=next>0?clamp01(e.xp/next):0;
  $('#hXp').style.transform=`scaleX(${frac})`;
  setTxt('hLvl','LV '+(e.level||1));
  setTxt('hXpTxt',next>0?`${Math.floor(e.xp)}/${next}`:'');
  xpBar.setAttribute('aria-valuenow',String(Math.round(frac*100)));
  xpBar.setAttribute('aria-valuetext',`Poziom ${e.level||1}, ${Math.floor(e.xp)} z ${next} XP`);
});
let lvlT=0;
DS.bus.on('levelup',e=>{
  lvlBanner.textContent='POZIOM '+(e&&e.level!=null?e.level:'')+'!';lvlBanner.hidden=false;lvlT=2.4;
  lvlBanner.classList.remove('pulse');if(opt.fx>0&&!motionReduced()){void lvlBanner.offsetWidth;lvlBanner.classList.add('pulse')}
});
DS.bus.on('armor',e=>{
  if(!e)return;const max=e.max||0;armorBar.hidden=!(max>0);if(!(max>0))return;
  $('#hArmor').style.transform=`scaleX(${clamp01(e.armor/max)})`;
  setTxt('hArmorTxt',String(Math.ceil(e.armor)));
  armorBar.setAttribute('aria-label',`Pancerz ${Math.ceil(e.armor)} z ${max}`);
});
DS.bus.on('levelEnd',()=>{
  armorBar.hidden=true;lvlBanner.hidden=true;lvlT=0;vigT=0;setVig(0);hitT=0;
  $('#hXp').style.transform='scaleX(0)';lastHud.hLvl='LV 1';$('#hLvl').textContent='LV 1';lastHud.hXpTxt='';$('#hXpTxt').textContent='';
});

/* ---- poświata obrażeń i niskie HP ---- */
let vigT=0,vigNow=-1,hitT=0,hitHead=false,tAcc=0;
function setVig(v){v=Math.round(v*50)/50;if(v!==vigNow){vigNow=v;vig.style.opacity=String(v)}}
DS.bus.on('damage',e=>{if(!opt.dmgInd)return;vigT=Math.min(1,.45+(e&&e.amount?e.amount/70:.2))*(opt.fx===0?.6:1)});
DS.bus.on('hit',e=>{
  if(!opt.xhHit)return;hitT=e&&e.head?.22:.14;hitHead=!!(e&&e.head);
  xh.classList.toggle('hitHead',hitHead);xh.classList.add('hit');
});
DS.bus.on('update',dt=>{
  const G=S.G;
  if(lvlT>0){lvlT-=dt;if(lvlT<=0)lvlBanner.hidden=true}
  if(hitT>0){hitT-=dt;if(hitT<=0)xh.classList.remove('hit','hitHead')}
  tAcc+=dt;
  let base=0;
  if(opt.dmgInd&&G&&G.maxHp>0){const f=G.hp/G.maxHp;if(f<.3&&!G.dead)base=.28+(opt.fx>0&&!motionReduced()?.1*Math.sin(tAcc*5):0)}
  if(vigT>0)vigT=Math.max(0,vigT-dt*1.8);
  setVig(Math.max(base,vigT));
});

/* ---- aktualizacja co klatkę ---- */
export function updateHud(alive){
  const G=S.G,W=DS.weapons.get(G.weapon);
  setTxt('hWave','Fala '+G.wave+(G.boss?' · BOSS':''));setTxt('hLeft','Wrogowie: '+(alive+G.queue));
  setTxt('hCoins',String(save.coins));setTxt('hCombo',G.combo>1?'×'+comboMult().toFixed(1):'');setTxt('hKeys','Klucze: '+save.keys);
  setTxt('hHpTxt',String(Math.ceil(G.hp)));$('#hHp').style.transform=`scaleX(${G.hp/G.maxHp})`;
  setTxt('hMed','Apteczki: '+save.medkits+' ['+DS.input.keyFor('medkit')+']');setTxt('hWeap',W.name);setTxt('hAmmo',String(G.ammo[G.weapon]));setTxt('hMag',String(W.mag));
  $('#hReload').hidden=!(G.reloadT>0);
}
