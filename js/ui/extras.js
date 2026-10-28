// Osiągnięcia i kolekcja znajdziek. Dane pochodzą ze zdarzeń DS.bus ('kill', 'waveStart', 'levelup', 'pickup',
// 'levelEnd', 'save'); stan trzymany w `save.ach` (id -> czas odblokowania) i `save.found` (typ -> ile zebrano).
// Zapisują się przy najbliższym persist() (osiągnięcia same wołają persist).
import {$} from '../core/util.js';
import {save,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {h,clear} from './dom.js';
import {motionReduced} from './uiopts.js';

/* ---- toast ---- */
let toastEl=null,toastT=0;
export function toast(title,sub){
  if(!toastEl){toastEl=h('div',{class:'toast',id:'toast',role:'status','aria-live':'polite',hidden:true});$('#app').append(toastEl)}
  clear(toastEl);toastEl.append(h('b',null,title),sub?h('span',null,sub):null);
  toastEl.hidden=false;toastEl.classList.remove('in');if(!motionReduced()){void toastEl.offsetWidth;toastEl.classList.add('in')}
  clearTimeout(toastT);toastT=setTimeout(()=>{toastEl.hidden=true},4200);
}

/* ---- osiągnięcia ---- */
export const ACHIEVEMENTS=[
  {id:'first',name:'Pierwsza krew',desc:'Zabij pierwszego wroga.'},
  {id:'kills100',name:'Setka',desc:'Zabij łącznie 100 wrogów.'},
  {id:'kills1000',name:'Rzeźnik z remizy',desc:'Zabij łącznie 1000 wrogów.'},
  {id:'heads10',name:'Celne oko',desc:'Zrób 10 headshotów w jednym podejściu.'},
  {id:'combo10',name:'Biesiada ołowiu',desc:'Osiągnij combo ×10.'},
  {id:'wave5',name:'Piąta fala',desc:'Dotrwaj do 5. fali.'},
  {id:'wave10',name:'Do rana',desc:'Dotrwaj do 10. fali.'},
  {id:'boss',name:'Baron pokonany',desc:'Pokonaj bossa.'},
  {id:'level5',name:'Awans',desc:'Osiągnij 5. poziom doświadczenia.'},
  {id:'rich',name:'Złota rączka',desc:'Miej na koncie 5000 ZD.'},
  {id:'arsenal',name:'Arsenał',desc:'Posiadaj 4 bronie.'},
  {id:'skins5',name:'Kolekcjoner',desc:'Zdobądź 5 skórek.'},
];
const ach=()=>save.ach||(save.ach={});
function unlock(id){
  const a=ach();if(a[id])return;a[id]=Date.now();
  const def=ACHIEVEMENTS.find(x=>x.id===id);persist();
  if(def)toast('Osiągnięcie: '+def.name,def.desc);
}
function checkTotals(){
  if(save.kills>=100)unlock('kills100');if(save.kills>=1000)unlock('kills1000');
  if(save.coins>=5000)unlock('rich');if(save.weapons&&save.weapons.length>=4)unlock('arsenal');if(save.skins&&save.skins.length>=5)unlock('skins5');
}
DS.bus.on('kill',e=>{
  unlock('first');const G=S.G;
  if(e&&e.combo>=10)unlock('combo10');
  if(G&&G.heads>=10)unlock('heads10');
  if(e&&e.enemy&&e.enemy.boss)unlock('boss');
  checkTotals();
});
DS.bus.on('waveStart',e=>{if(e&&e.wave>=5)unlock('wave5');if(e&&e.wave>=10)unlock('wave10')});
DS.bus.on('levelup',e=>{if(e&&e.level>=5)unlock('level5')});
DS.bus.on('save',checkTotals);

export function renderAch(){
  const a=ach(),list=$('#achList'),n=ACHIEVEMENTS.filter(x=>a[x.id]).length;
  $('#achSum').textContent=`Odblokowano ${n} z ${ACHIEVEMENTS.length}.`;
  clear(list);
  for(const x of ACHIEVEMENTS){const got=!!a[x.id];
    list.append(h('li',{class:'ach'+(got?' got':'')},
      h('span',{class:'achState'},got?'Zdobyte':'Zablokowane'),
      h('b',null,got?x.name:x.name),h('p',null,x.desc),
      got?h('small',null,new Date(a[x.id]).toLocaleDateString('pl-PL')):null));
  }
}

/* ---- kolekcja znajdziek ---- */
const BASIC={coin:{name:'Złotówka disco',desc:'Waluta (ZD) wypadająca z wrogów.'},key:{name:'Klucz do skrzynki',desc:'Otwiera skrzynki.'},med:{name:'Apteczka z mapy',desc:'Leczy po podniesieniu.'}};
const found=()=>save.found||(save.found={});
DS.bus.on('pickup',e=>{if(!e||!e.type)return;const f=found();f[e.type]=(f[e.type]||0)+1});
DS.bus.on('levelEnd',()=>{if(save.found)persist()});

export function renderCollection(){
  const f=found(),list=$('#collList');clear(list);
  const ids=new Set([...Object.keys(BASIC),...DS.pickups.ids(),...Object.keys(f)]);
  let seen=0;
  for(const id of ids){
    const def=DS.pickups.get(id)||{},b=BASIC[id]||{};
    const n=f[id]||0,known=n>0||!!BASIC[id];if(n>0)seen++;
    list.append(h('div',{class:'collCard'+(n>0?' got':'')},
      h('b',null,known?(def.name||b.name||id):'???'),
      h('p',null,known?(def.desc||b.desc||''):'Jeszcze nie znaleziono.'),
      h('span',{class:'count'},n>0?'Zebrano: '+n:'Nie zebrano')));
  }
  if(!list.children.length)list.append(h('p',{class:'note'},'Znajdźki pojawią się wraz z nowymi poziomami.'));
}
