// Osiągnięcia i kolekcja znajdziek. Dane pochodzą ze zdarzeń DS.bus ('kill', 'waveStart', 'levelup', 'pickup',
// 'levelEnd', 'save'); stan trzymany w `save.ach` (id -> czas odblokowania) i `save.found` (typ -> ile zebrano).
// Zapisują się przy najbliższym persist() (osiągnięcia same wołają persist).
import {$} from '../core/util.js';
import {save,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {h,clear} from './dom.js';
import {L} from '../core/i18n.js';
import {fmtDate} from '../core/fmt.js';
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
  {id:'first',name:L('Pierwsza krew','First Blood'),desc:L('Zabij pierwszego wroga.','Kill your first enemy.')},
  {id:'kills100',name:L('Setka','The Hundred'),desc:L('Zabij łącznie 100 wrogów.','Kill 100 enemies in total.')},
  {id:'kills1000',name:L('Rzeźnik z remizy','Butcher of the Fire Station'),desc:L('Zabij łącznie 1000 wrogów.','Kill 1000 enemies in total.')},
  {id:'heads10',name:L('Celne oko','Sharp Eye'),desc:L('Zrób 10 headshotów w jednym podejściu.','Land 10 headshots in a single run.')},
  {id:'combo10',name:L('Biesiada ołowiu','Lead Feast'),desc:L('Osiągnij combo ×10.','Reach a ×10 combo.')},
  {id:'wave5',name:L('Piąta fala','Fifth Wave'),desc:L('Dotrwaj do 5. fali.','Survive until wave 5.')},
  {id:'wave10',name:L('Do rana','Till Dawn'),desc:L('Dotrwaj do 10. fali.','Survive until wave 10.')},
  {id:'boss',name:L('Baron pokonany','Baron Down'),desc:L('Pokonaj bossa.','Defeat a boss.')},
  {id:'level5',name:L('Awans','Promotion'),desc:L('Osiągnij 5. poziom doświadczenia.','Reach experience level 5.')},
  {id:'rich',name:L('Złota rączka','Moneybags'),desc:L('Miej na koncie 5000 ZD.','Hold 5000 ZD in your account.')},
  {id:'arsenal',name:L('Arsenał','Arsenal'),desc:L('Posiadaj 4 bronie.','Own 4 weapons.')},
  {id:'skins5',name:L('Kolekcjoner','Collector'),desc:L('Zdobądź 5 skórek.','Collect 5 skins.')},
];
const ach=()=>save.ach||(save.ach={});
function unlock(id){
  const a=ach();if(a[id])return;a[id]=Date.now();
  const def=ACHIEVEMENTS.find(x=>x.id===id);persist();
  if(def)toast(L('Osiągnięcie: ','Achievement: ')+def.name,def.desc);
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
  $('#achSum').textContent=L(`Odblokowano ${n} z ${ACHIEVEMENTS.length}.`,`Unlocked ${n} of ${ACHIEVEMENTS.length}.`);
  clear(list);
  for(const x of ACHIEVEMENTS){const got=!!a[x.id];
    list.append(h('li',{class:'ach'+(got?' got':'')},
      h('span',{class:'achState'},got?L('Zdobyte','Unlocked'):L('Zablokowane','Locked')),
      h('b',null,got?x.name:x.name),h('p',null,x.desc),
      got?h('small',null,fmtDate(a[x.id])):null));
  }
}

/* ---- kolekcja znajdziek ---- */
const BASIC={coin:{name:L('Złotówka disco','Disco zloty'),desc:L('Waluta (ZD) wypadająca z wrogów.','Currency (ZD) dropped by enemies.')},key:{name:L('Klucz do skrzynki','Crate key'),desc:L('Otwiera skrzynki.','Opens crates.')},med:{name:L('Apteczka z mapy','Map medkit'),desc:L('Leczy po podniesieniu.','Heals when picked up.')}};
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
      h('p',null,known?(def.desc||b.desc||''):L('Jeszcze nie znaleziono.','Not found yet.')),
      h('span',{class:'count'},n>0?L('Zebrano: ','Collected: ')+n:L('Nie zebrano','Not collected'))));
  }
  if(!list.children.length)list.append(h('p',{class:'note'},L('Znajdźki pojawią się wraz z nowymi poziomami.','Collectibles will appear with new levels.')));
}
