// Skrzynki ze skórkami: losowanie rzadkości, animacja taśmy, wynik.
import {$,$$,rand,pick} from '../core/util.js';
import {save,reduced,persist} from '../core/save.js';
import {SKINS,RAR,CRATES} from '../core/meta.js';
import {sfx} from '../audio/sfx.js';
import {applySkin} from '../weapons/viewmodel.js';
import {gunSVG} from './skinart.js';
function rollRarity(w){const tot=Object.values(w).reduce((a,b)=>a+b,0);let r=Math.random()*tot;for(const k in w){r-=w[k];if(r<=0)return k}return 'common'}
function rollSkin(w){const r=rollRarity(w);return pick(SKINS.filter(s=>s.r===r))}
let crateBusy=false;
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>openCrate(b.dataset.open)));
export function openCrate(type){
  if(crateBusy)return;const C=CRATES[type];
  if(save.keys<C.cost){sfx('error');const r=$('#cresult');r.hidden=false;r.innerHTML='<div><h3>Brak kluczy</h3><p>Kup je u Pana Heńka albo zdobądź w strzelaninie.</p></div>';return}
  save.keys-=C.cost;persist();crateBusy=true;$('#cresult').hidden=true;
  const N=52,WIN=44;const items=[];for(let i=0;i<N;i++)items.push(rollSkin(C.w));const result=items[WIN];
  // tease: put a legendary right next to the winner sometimes
  if(result.r!=='legend'&&Math.random()<.5)items[WIN+(Math.random()<.5?1:-1)]=pick(SKINS.filter(s=>s.r==='legend'));
  const tr=$('#ctrack');tr.innerHTML=items.map(s=>`<div class="citem r-${s.r}">${gunSVG(s)}<span>${s.name}</span><div class="rb"></div></div>`).join('');
  const sp=$('#spinner');sp.hidden=false;
  tr.style.transition='none';tr.style.transform='translateX(0)';void tr.offsetWidth;
  const step=132+8,target=-(WIN*step+66)+sp.clientWidth/2+rand(-50,50);
  const dur=reduced?1.5:5.6;
  tr.style.transition=`transform ${dur}s cubic-bezier(.08,.82,.17,1)`;tr.style.transform=`translateX(${target}px)`;
  let last=0;const t0=performance.now();
  const tick=()=>{const m=new DOMMatrixReadOnly(getComputedStyle(tr).transform);const idx=Math.floor((-m.m41+sp.clientWidth/2)/step);if(idx!==last){last=idx;sfx('tick',1400+Math.random()*300)}
    if(performance.now()-t0<dur*1000+80)requestAnimationFrame(tick);else crateDone(result)};
  requestAnimationFrame(tick);
}
function crateDone(s){
  crateBusy=false;const dup=save.skins.includes(s.id);
  if(dup)save.coins+=RAR[s.r].dup;else save.skins.push(s.id);persist();
  sfx('reveal',{common:0,rare:2,epic:5,legend:12}[s.r]);if(s.r==='legend')setTimeout(()=>sfx('jackpot'),500);
  const r=$('#cresult');r.hidden=false;
  r.innerHTML=`<div class="big">${gunSVG(s)}</div><div style="display:flex;flex-direction:column;gap:8px"><span class="rlabel" style="background:${RAR[s.r].c};align-self:flex-start">${RAR[s.r].n}</span><h3>${s.name}</h3><p style="margin:0">${dup?`Duplikat. Pan Heniek odkupił go za ${RAR[s.r].dup} ZD.`:'Nowa skórka trafiła do ekwipunku.'}</p><div class="row">${dup?'':'<button class="btn red sm" id="equipNew">Załóż teraz</button>'}<button class="btn sm" id="again">Otwórz kolejną</button></div></div>`;
  r.style.background=s.r==='legend'?'var(--yellow)':'';
  const eq=$('#equipNew');if(eq)eq.addEventListener('click',()=>{save.skin=s.id;persist();applySkin();eq.textContent='Założona';eq.disabled=true;sfx('buy')});
  $('#again').addEventListener('click',()=>openCrate(save.keys>=2&&s.r!=='common'?'remiza':'remiza'));
}
