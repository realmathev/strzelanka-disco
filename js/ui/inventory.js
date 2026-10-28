// Ekwipunek: podgląd 3D broni, lista broni i siatka skórek.
import {$} from '../core/util.js';
import {save,persist} from '../core/save.js';
import {DS} from '../core/ds.js';
import {SKINS,RAR} from '../core/meta.js';
import {sfx} from '../audio/sfx.js';
import {applySkin} from '../weapons/viewmodel.js';
import {weaponsBySlot,weaponKeyHint} from '../weapons/slots.js';
import {gunSVG} from './skinart.js';
import {h,clear} from './dom.js';
import {setWeapon,startPreview,stopPreview as stop3d} from './preview3d.js';

export {stop3d as stopPreview};
let sel=null,stage=null;

function buildStage(){
  if(stage)return stage;
  const canvas=h('canvas',{id:'pvCanvas',tabindex:'0',role:'img','aria-label':'Podgląd 3D broni. Przeciągnij lub użyj strzałek, aby obrócić.'});
  stage={
    canvas,fallback:h('div',{class:'pvFallback',hidden:true,'aria-hidden':'true'}),
    name:h('h3',{id:'pvName'}),info:h('dl',{class:'pvStats',id:'pvStats'}),note:h('p',{class:'note',id:'pvNote'}),
  };
  const panel=h('div',{class:'panel invPreview',id:'invPreview'},
    h('div',{class:'pvStage'},canvas,stage.fallback),
    h('div',{class:'pvInfo'},stage.name,stage.info,stage.note));
  const wrap=$('#scrInv .wrap');wrap.insertBefore(panel,wrap.children[1]);
  return stage;
}
const stat=(dt,dd)=>[h('dt',null,dt),h('dd',null,dd)];

function renderPreview(){
  const st=buildStage(),ids=weaponsBySlot();if(!sel||!DS.weapons.has(sel))sel=ids.includes(save.weapons[0])?save.weapons[0]:ids[0];
  const W=DS.weapons.get(sel),skin=SKINS.find(k=>k.id===save.skin)||SKINS[0],own=save.weapons.includes(sel);
  st.name.textContent=W.name;
  clear(st.info);
  st.info.append(...stat('Obrażenia',W.dmg+(W.pellets>1?' ×'+W.pellets:'')),...stat('Kadencja',(1/W.rate).toFixed(1)+' strz./s'),
    ...stat('Magazynek',String(W.mag)),...stat('Przeładowanie',W.reload+' s'),...stat('Tryb',W.auto?'automat':'pojedynczy'));
  st.note.textContent=own?`Posiadasz · ${weaponKeyHint(sel)}`:(W.price?`Do kupienia u Zdzicha: ${W.price} ZD`:'Niedostępna');
  const ok=setWeapon(st.canvas,sel,skin);
  st.canvas.hidden=!ok;st.fallback.hidden=ok;
  if(!ok){st.fallback.innerHTML=gunSVG(skin)}
  else startPreview();
}

export function renderInv(){
  const wl=$('#wlist');wl.innerHTML='';
  weaponsBySlot().forEach(w=>{const W=DS.weapons.get(w),own=save.weapons.includes(w);
    const d=h('button',{class:'wcard'+(w===sel?' on':''),type:'button','aria-pressed':String(w===sel),style:'opacity:'+(own?1:.7),
        onclick:()=>{sel=w;sfx('tick',1100);renderInv();const b=$('#wlist .wcard.on');if(b)b.focus({preventScroll:true})}},
      h('b',null,W.name),
      h('p',null,own?'Posiadasz · '+weaponKeyHint(w):'Do kupienia u Zdzicha: '+W.price+' ZD'),
      h('p',null,`Obrażenia ${W.dmg}${W.pellets>1?'×'+W.pellets:''} · magazynek ${W.mag}`));
    wl.appendChild(d)});
  const g=$('#skinGrid');g.innerHTML='';
  SKINS.forEach(s=>{const own=save.skins.includes(s.id);const d=document.createElement('button');d.className='skin'+(own?'':' locked')+(save.skin===s.id?' on':'');
    d.innerHTML=(own?gunSVG(s):gunSVG({c1:'#8c877c',c2:'#bdb5a5'}))+`<span>${own?s.name:'???'}</span><span class="rlabel" style="background:${RAR[s.r].c}">${RAR[s.r].n}</span>`;
    d.disabled=!own;d.setAttribute('aria-pressed',String(save.skin===s.id));
    d.addEventListener('click',()=>{save.skin=s.id;persist();applySkin();sfx('buy');renderInv();const b=$('#skinGrid .skin.on');if(b)b.focus({preventScroll:true})});g.appendChild(d)});
  renderPreview();
}
