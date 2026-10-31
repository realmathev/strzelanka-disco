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

const TABS=[['gfx','Grafika'],['snd','Dźwięk'],['ctl','Sterowanie'],['xh','Celownik'],['acc','Dostępność'],['game','Gra']];
const panes={},syncers=[];
const pct=v=>Math.round(v*100)+'%';
const ONOFF=[['1','Włączone'],['0','Wyłączone']];
const YESNO=[['0','Nie'],['1','Tak']];
const HOLD=[['hold','Przytrzymaj'],['toggle','Przełącz']];

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
const tabBar=h('div',{class:'tabs optTabs',role:'tablist','aria-label':'Kategorie opcji'});
const body=h('div',{class:'panel optBody'});
root.append(h('div',{class:'wrap'},
  h('div',{class:'topbar'},h('h2',{id:'optT'},'Opcje'),h('button',{class:'btn paper',id:'optBack',type:'button'},'Wróć')),
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
  panes[p].append(field(h('label',{id:'lbl-preset'},'Preset jakości'),'lbl-preset',(()=>{
    const w=h('div',{class:'seg',id:'oPreset',role:'group','aria-labelledby':'lbl-preset'});
    for(const [v,t] of [['low','Niska'],['med','Średnia'],['high','Wysoka'],['ultra','Ultra']]){
      const b=h('button',{type:'button','data-v':v,'aria-pressed':'false'},t);
      b.addEventListener('click',()=>{opt.preset=v;Object.assign(opt,PRESETS[v]);commit();sfx('tick',1200)});w.append(b)}
    syncers.push(()=>$$('#oPreset button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===opt.preset))));
    return w})(),'Wpływa na rozdzielczość, cienie i zasięg widzenia.'));
  range(p,{id:'oScale',key:'scale',label:'Rozdzielczość renderu',min:.5,max:1.5,step:.05,fmt:pct,custom:true});
  range(p,{id:'oFov',key:'fov',label:'Pole widzenia (FOV)',min:60,max:110,step:1,fmt:v=>v+'°'});
  range(p,{id:'oDraw',key:'draw',label:'Zasięg widzenia',min:50,max:180,step:5,fmt:v=>v+' m',custom:true});
  seg(p,{key:'shadows',label:'Cienie',choices:ONOFF,custom:true});
  seg(p,{key:'outlines',label:'Kontury komiksowe',choices:ONOFF});
  seg(p,{key:'halftone',label:'Raster (halftone)',choices:ONOFF});
  seg(p,{key:'panels',label:'Kadry komiksu przy headshocie',choices:ONOFF});
}
/* Dźwięk */
{const p='snd';
  range(p,{id:'oMusic',key:'music',label:'Muzyka',min:0,max:1,step:.05,fmt:pct});
  range(p,{id:'oSfx',key:'sfx',label:'Efekty',min:0,max:1,step:.05,fmt:pct});
  range(p,{id:'oHitVol',key:'hitVol',label:'Głośność trafień',min:0,max:1,step:.05,fmt:pct,hint:'Dźwięk potwierdzenia trafienia we wroga.'});
  seg(p,{key:'track',label:'Utwór w grze',num:false,choices:[['A','Biesiada w Kasynie'],['B','Ołowiane Wesele'],['C','Remiza Turbo'],['L','Wg poziomu']],after:()=>{if(S.mode==='game')setTrack(gameTrack(opt),false)}});
}
/* Sterowanie */
{const p='ctl';
  heading(p,'Mysz');
  range(p,{id:'oSens',key:'sens',label:'Czułość myszy',min:.2,max:3,step:.05,fmt:v=>(+v).toFixed(2)});
  range(p,{id:'oAdsSens',key:'adsSens',label:'Czułość podczas celowania (ADS)',min:.2,max:1.5,step:.05,fmt:v=>'×'+(+v).toFixed(2),hint:'Mnożnik czułości myszy, gdy celujesz.'});
  seg(p,{key:'invert',label:'Odwróć oś Y',choices:YESNO});
  heading(p,'Tryby przycisków');
  seg(p,{key:'adsMode',label:'Celowanie (ADS)',num:false,choices:HOLD,hint:'Przytrzymaj: celujesz, dopóki trzymasz przycisk. Przełącz: jedno naciśnięcie włącza, kolejne wyłącza.'});
  seg(p,{key:'sprintMode',label:'Sprint',num:false,choices:HOLD,hint:'W trybie „Przełącz” sprint gaśnie, gdy przestajesz się ruszać.'});
  seg(p,{key:'crouchMode',label:'Kucanie',num:false,choices:HOLD});
  const bwrap=h('div',{class:'bindHost'});panes[p].append(bwrap);buildControls(bwrap);
}
/* Celownik */
{const p='xh';
  const prev=h('div',{class:'xhPreview',role:'img','aria-label':'Podgląd celownika'},makeCrosshair('xhPrev'));
  panes[p].append(h('div',{class:'opt wide'},h('label',null,'Podgląd'),prev));
  seg(p,{key:'xhStyle',label:'Styl',num:false,choices:XH_STYLES});
  seg(p,{key:'xhColor',label:'Kolor',num:false,choices:XH_COLORS,swatch:true});
  range(p,{id:'oXhSize',key:'xhSize',label:'Rozmiar',min:8,max:60,step:1,fmt:v=>v+' px'});
  seg(p,{key:'xhDot',label:'Kropka na środku',choices:ONOFF});
  seg(p,{key:'xhHit',label:'Znacznik trafienia',choices:ONOFF,hint:'Krzyżyk przy celowniku po trafieniu (dłuższy i grubszy przy headshocie).'});
}
/* Dostępność */
{const p='acc';
  seg(p,{key:'fx',label:'Intensywność błysków i wstrząsów',choices:[['0','Bezpieczna'],['1','Normalna'],['2','Maksymalna']],hint:'„Bezpieczna” wyłącza migotanie neonów i mocno ogranicza wstrząsy.'});
  range(p,{id:'oUiScale',key:'uiScale',label:'Rozmiar napisów i HUD',min:.85,max:1.5,step:.05,fmt:pct});
  seg(p,{key:'contrast',label:'Wysoki kontrast interfejsu',choices:ONOFF.map(([v,t])=>[v==='1'?'1':'0',t])});
  seg(p,{key:'motion',label:'Animacje interfejsu',num:false,choices:[['auto','Jak w systemie'],['reduce','Ogranicz']]});
  seg(p,{key:'hitStop',label:'Zatrzymanie klatki przy zabiciu (hit-stop)',choices:ONOFF,hint:'Ułamek sekundy zamrożenia przy zabójstwie. „Bezpieczna” intensywność wyłącza go zawsze.'});
  seg(p,{key:'onoma',label:'Onomatopeje (BLAM, tap tap)',choices:ONOFF,hint:'Wyłącz, jeśli napisy dźwiękowe zasłaniają widok.'});
}
/* Gra */
{const p='game';
  seg(p,{key:'difficulty',label:'Trudność',num:false,choices:[['easy','Łatwy'],['normal','Normalny'],['hard','Trudny']],hint:'Zmiana działa od następnego runu.'});
  seg(p,{key:'dmgInd',label:'Wskaźnik otrzymanych obrażeń',choices:ONOFF,hint:'Czerwona poświata krawędzi ekranu przy trafieniu i niskim zdrowiu.'});
  seg(p,{key:'dmgNum',label:'Liczby obrażeń nad wrogami',choices:ONOFF});
  heading(p,'Postęp');
  const rb=h('button',{type:'button',id:'oReset'},'Wyzeruj zapis gry');
  let arm=false;
  rb.addEventListener('click',()=>{
    if(!arm){arm=true;rb.textContent='Kliknij ponownie, aby potwierdzić';setTimeout(()=>{arm=false;rb.textContent='Wyzeruj zapis gry'},3000);return}
    resetSave();persist();rb.textContent='Zapis wyzerowany';arm=false});
  panes[p].append(field(h('label',{id:'lbl-prog'},'Postęp'),'lbl-prog',h('div',{class:'seg'},rb)));
}
openOptionsTab('gfx');

/** Odświeża wszystkie kontrolki wartościami z `opt`. */
export function syncOptUI(){syncers.forEach(f=>f())}
syncOptUI();
