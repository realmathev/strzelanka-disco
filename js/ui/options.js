// Ekran opcji (zakładki): Grafika, Dźwięk, Sterowanie (z przypisaniem klawiszy), Celownik, Dostępność, Gra.
// Budowany w JS na elemencie #scrOptions z index.html. Dla zgodności zostają id: oPreset, oScale, oFov, oDraw,
// oMusic, oSfx, oSens, oReset, optBack.
import {$,$$} from '../core/util.js';
import {opt,persistOpt,persist,resetSave} from '../core/save.js';
import {S} from '../core/state.js';
import {applyOpts,PRESETS} from '../render/settings.js';
import {setTrack,gameTrack} from '../audio/music.js';
import {sfx} from '../audio/sfx.js';
import '../input/optdefs.js';
import {h,clear} from './dom.js';
import {applyUiOpts} from './uiopts.js';
import {XH_STYLES,XH_COLORS,makeCrosshair} from './crosshair.js';
import {buildControls} from './controls.js';
import {L} from '../core/i18n.js';
import {langSwitch} from './lang.js';

const TABS=[['gfx',L('Grafika','Graphics')],['snd',L('Dźwięk','Sound')],['ctl',L('Sterowanie','Controls')],['xh',L('Celownik','Crosshair')],['acc',L('Dostępność','Accessibility')],['game',L('Gra','Gameplay')]];
const panes={},syncers=[];
const pct=v=>Math.round(v*100)+'%';
const ONOFF=[['1',L('Włączone','On')],['0',L('Wyłączone','Off')]];
const YESNO=[['0',L('Nie','No')],['1',L('Tak','Yes')]];
const HOLD=[['hold',L('Przytrzymaj','Hold')],['toggle',L('Przełącz','Toggle')]];

/** Zapis opcji i zastosowanie we wszystkich warstwach. */
function commit(){persistOpt();applyOpts();applyUiOpts();syncOptUI()}

function field(label,labelId,control,hint){
  return h('div',{class:'opt'},label,control,hint?h('p',{class:'hint'},hint):null);
}
function range(pane,{id,key,label,min,max,step,fmt=String,custom,hint}){
  const out=h('output',{id:id+'V','aria-hidden':'true'});
  const inp=h('input',{type:'range',id,min,max,step,'aria-valuetext':''});
  inp.addEventListener('input',()=>{opt[key]=+inp.value;if(custom)opt.preset='custom';commit()});
  panes[pane].append(field(h('label',{for:id},label,out),id,inp,hint));
  syncers.push(()=>{const v=opt[key];inp.value=String(v);out.textContent=fmt(v);inp.setAttribute('aria-valuetext',fmt(v))});
}
function seg(pane,{key,label,choices,num=true,custom,hint,swatch,after,id}){
  const lid='lbl-'+(id||key);
  const wrap=h('div',{class:'seg'+(swatch?' swatch':''),role:'group','aria-labelledby':lid,'data-key':key});
  const btns=choices.map(([v,t])=>{
    const b=h('button',{type:'button','data-v':v,'aria-pressed':'false'},swatch?h('i',{class:'sw',style:'background:'+v,'aria-hidden':'true'}):null,swatch?t:t);
    b.addEventListener('click',()=>{opt[key]=num?+v:v;if(custom)opt.preset='custom';commit();sfx('tick',1200);if(after)after(v)});
    wrap.append(b);return b;
  });
  panes[pane].append(field(h('label',{id:lid},label),lid,wrap,hint));
  syncers.push(()=>btns.forEach(b=>b.setAttribute('aria-pressed',String(String(opt[key])===b.dataset.v))));
}
function heading(pane,text,id){panes[pane].append(h('h3',null,text))}

/* ---- budowa ---- */
const root=$('#scrOptions');clear(root);root.setAttribute('aria-labelledby','optT');
const tabBar=h('div',{class:'tabs optTabs',role:'tablist','aria-label':L('Kategorie opcji','Option categories')});
const body=h('div',{class:'panel optBody'});
root.append(h('div',{class:'wrap'},
  h('div',{class:'topbar'},h('h2',{id:'optT'},L('Opcje','Options')),h('button',{class:'btn paper',id:'optBack',type:'button'},L('Wróć','Back'))),
  tabBar,body));
const tabBtns={};
for(const [id,label] of TABS){
  tabBtns[id]=h('button',{role:'tab',id:'optTab-'+id,type:'button','aria-controls':'optPane-'+id,'aria-selected':'false',tabindex:'-1',onclick:()=>openOptionsTab(id,true)},label);
  tabBar.append(tabBtns[id]);
  panes[id]=h('div',{class:'opts optPane',role:'tabpanel',id:'optPane-'+id,'aria-labelledby':'optTab-'+id,hidden:true});
  body.append(panes[id]);
}
tabBar.addEventListener('keydown',e=>{
  const ids=TABS.map(t=>t[0]),cur=ids.indexOf(curTab);let n=-1;
  if(e.key==='ArrowRight')n=(cur+1)%ids.length;else if(e.key==='ArrowLeft')n=(cur+ids.length-1)%ids.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=ids.length-1;
  if(n>=0){e.preventDefault();e.stopPropagation();openOptionsTab(ids[n],true)}
});
let curTab='gfx';
/** Otwiera zakładkę opcji (opcjonalnie z fokusem na zakładce). */
export function openOptionsTab(id,focus){
  if(!panes[id])id='gfx';curTab=id;
  for(const t in panes){const on=t===id;panes[t].hidden=!on;tabBtns[t].setAttribute('aria-selected',String(on));tabBtns[t].tabIndex=on?0:-1}
  if(focus)tabBtns[id].focus();
}

/* Grafika */
{const p='gfx';
  panes[p].append(field(h('label',{id:'lbl-preset'},L('Preset jakości','Quality preset')),'lbl-preset',(()=>{
    const w=h('div',{class:'seg',id:'oPreset',role:'group','aria-labelledby':'lbl-preset'});
    for(const [v,t] of [['low',L('Niska','Low')],['med',L('Średnia','Medium')],['high',L('Wysoka','High')],['ultra','Ultra']]){
      const b=h('button',{type:'button','data-v':v,'aria-pressed':'false'},t);
      b.addEventListener('click',()=>{opt.preset=v;Object.assign(opt,PRESETS[v]);commit();sfx('tick',1200)});w.append(b)}
    syncers.push(()=>$$('#oPreset button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===opt.preset))));
    return w})(),L('Wpływa na rozdzielczość, cienie i zasięg widzenia.','Affects resolution, shadows and draw distance.')));
  range(p,{id:'oScale',key:'scale',label:L('Rozdzielczość renderu','Render resolution'),min:.5,max:1.5,step:.05,fmt:pct,custom:true});
  range(p,{id:'oFov',key:'fov',label:L('Pole widzenia (FOV)','Field of view (FOV)'),min:60,max:110,step:1,fmt:v=>v+'°'});
  range(p,{id:'oDraw',key:'draw',label:L('Zasięg widzenia','Draw distance'),min:50,max:180,step:5,fmt:v=>v+' m',custom:true});
  seg(p,{key:'shadows',label:L('Cienie','Shadows'),choices:ONOFF,custom:true});
  seg(p,{key:'outlines',label:L('Kontury komiksowe','Comic outlines'),choices:ONOFF});
  seg(p,{key:'panels',label:L('Kadry komiksu przy headshocie','Comic panels on headshots'),choices:ONOFF});
}
/* Dźwięk */
{const p='snd';
  range(p,{id:'oMusic',key:'music',label:L('Muzyka','Music'),min:0,max:1,step:.05,fmt:pct});
  range(p,{id:'oSfx',key:'sfx',label:L('Efekty','Effects'),min:0,max:1,step:.05,fmt:pct});
  range(p,{id:'oHitVol',key:'hitVol',label:L('Głośność trafień','Hit sound volume'),min:0,max:1,step:.05,fmt:pct,hint:L('Dźwięk potwierdzenia trafienia we wroga.','The sound that confirms a hit on an enemy.')});
  seg(p,{key:'track',label:L('Utwór w grze','In-game track'),num:false,choices:[['A',L('Biesiada w Kasynie','Casino Banquet')],['B',L('Ołowiane Wesele','Leaden Wedding')],['C',L('Remiza Turbo','Fire Station Turbo')],['L',L('Wg poziomu','By level')]],after:()=>{if(S.mode==='game')setTrack(gameTrack(opt),false)}});
}
/* Sterowanie */
{const p='ctl';
  heading(p,L('Mysz','Mouse'));
  range(p,{id:'oSens',key:'sens',label:L('Czułość myszy','Mouse sensitivity'),min:.2,max:3,step:.05,fmt:v=>(+v).toFixed(2)});
  range(p,{id:'oAdsSens',key:'adsSens',label:L('Czułość podczas celowania (ADS)','Aiming sensitivity (ADS)'),min:.2,max:1.5,step:.05,fmt:v=>'×'+(+v).toFixed(2),hint:L('Mnożnik czułości myszy, gdy celujesz.','Multiplier applied to mouse sensitivity while aiming.')});
  seg(p,{key:'invert',label:L('Odwróć oś Y','Invert Y axis'),choices:YESNO});
  heading(p,L('Tryby przycisków','Button modes'));
  seg(p,{key:'adsMode',label:L('Celowanie (ADS)','Aiming (ADS)'),num:false,choices:HOLD,hint:L('Przytrzymaj: celujesz, dopóki trzymasz przycisk. Przełącz: jedno naciśnięcie włącza, kolejne wyłącza.','Hold: you aim as long as you hold the button. Toggle: one press turns it on, the next turns it off.')});
  seg(p,{key:'sprintMode',label:'Sprint',num:false,choices:HOLD,hint:L('W trybie „Przełącz” sprint gaśnie, gdy przestajesz się ruszać.','In “Toggle” mode, sprint switches off when you stop moving.')});
  seg(p,{key:'crouchMode',label:L('Kucanie','Crouch'),num:false,choices:HOLD});
  const bwrap=h('div',{class:'bindHost'});panes[p].append(bwrap);buildControls(bwrap);
}
/* Celownik */
{const p='xh';
  const prev=h('div',{class:'xhPreview',role:'img','aria-label':L('Podgląd celownika','Crosshair preview')},makeCrosshair('xhPrev'));
  panes[p].append(h('div',{class:'opt wide'},h('label',null,L('Podgląd','Preview')),prev));
  seg(p,{key:'xhStyle',label:L('Styl','Style'),num:false,choices:XH_STYLES});
  seg(p,{key:'xhColor',label:L('Kolor','Colour'),num:false,choices:XH_COLORS,swatch:true});
  range(p,{id:'oXhSize',key:'xhSize',label:L('Rozmiar','Size'),min:8,max:60,step:1,fmt:v=>v+' px'});
  seg(p,{key:'xhDot',label:L('Kropka na środku','Centre dot'),choices:ONOFF});
  seg(p,{key:'xhHit',label:L('Znacznik trafienia','Hit marker'),choices:ONOFF,hint:L('Krzyżyk przy celowniku po trafieniu (dłuższy i grubszy przy headshocie).','A small cross by the crosshair after a hit (longer and thicker on a headshot).')});
}
/* Dostępność */
{const p='acc';
  seg(p,{key:'fx',label:L('Intensywność błysków i wstrząsów','Flash and screen-shake intensity'),choices:[['0',L('Bezpieczna','Safe')],['1',L('Normalna','Normal')],['2',L('Maksymalna','Maximum')]],hint:L('„Bezpieczna” wyłącza migotanie neonów i mocno ogranicza wstrząsy.','“Safe” turns off neon flicker and greatly reduces screen shake.')});
  range(p,{id:'oUiScale',key:'uiScale',label:L('Rozmiar napisów i HUD','Text and HUD size'),min:.85,max:1.5,step:.05,fmt:pct});
  seg(p,{key:'contrast',label:L('Wysoki kontrast interfejsu','High-contrast interface'),choices:ONOFF.map(([v,t])=>[v==='1'?'1':'0',t])});
  seg(p,{key:'motion',label:L('Animacje interfejsu','Interface animations'),num:false,choices:[['auto',L('Jak w systemie','Match system')],['reduce',L('Ogranicz','Reduce')]]});
  seg(p,{key:'hitStop',label:L('Zatrzymanie klatki przy zabiciu (hit-stop)','Freeze frame on kill (hit-stop)'),choices:ONOFF,hint:L('Ułamek sekundy zamrożenia przy zabójstwie. „Bezpieczna” intensywność wyłącza go zawsze.','A fraction of a second of freeze on a kill. The “Safe” intensity always turns it off.')});
  seg(p,{key:'onoma',label:L('Onomatopeje (BLAM, tap tap)','Onomatopoeia (BLAM, tap tap)'),choices:ONOFF,hint:L('Wyłącz, jeśli napisy dźwiękowe zasłaniają widok.','Turn off if the sound words block your view.')});
}
/* Gra */
{const p='game';
  seg(p,{key:'difficulty',label:L('Trudność','Difficulty'),num:false,choices:[['easy',L('Łatwy','Easy')],['normal',L('Normalny','Normal')],['hard',L('Trudny','Hard')]],hint:L('Zmiana działa od następnego runu.','Takes effect from the next run.')});
  seg(p,{key:'dmgInd',label:L('Wskaźnik otrzymanych obrażeń','Damage indicator'),choices:ONOFF,hint:L('Czerwona poświata krawędzi ekranu przy trafieniu i niskim zdrowiu.','A red glow around the screen edges when you are hit or on low health.')});
  seg(p,{key:'dmgNum',label:L('Liczby obrażeń nad wrogami','Damage numbers above enemies'),choices:ONOFF});
  heading(p,L('Język','Language'));
  panes[p].append(field(h('label',{id:'lbl-lang'},L('Język interfejsu','Interface language')),'lbl-lang',langSwitch('optLang'),L('Zmiana języka przeładowuje grę.','Changing the language reloads the game.')));
  heading(p,L('Postęp','Progress'));
  const rb=h('button',{type:'button',id:'oReset'},L('Wyzeruj zapis gry','Reset saved game'));
  let arm=false;
  rb.addEventListener('click',()=>{
    if(!arm){arm=true;rb.textContent=L('Kliknij ponownie, aby potwierdzić','Click again to confirm');setTimeout(()=>{arm=false;rb.textContent=L('Wyzeruj zapis gry','Reset saved game')},3000);return}
    resetSave();persist();rb.textContent=L('Zapis wyzerowany','Save reset');arm=false});
  panes[p].append(field(h('label',{id:'lbl-prog'},L('Postęp','Progress')),'lbl-prog',h('div',{class:'seg'},rb)));
}
openOptionsTab('gfx');

/** Odświeża wszystkie kontrolki wartościami z `opt`. */
export function syncOptUI(){syncers.forEach(f=>f())}
syncOptUI();
