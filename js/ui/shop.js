// Bazar: trzech NPC i ich towary.
import {$,$$,pick} from '../core/util.js';
import {save,persist} from '../core/save.js';
import {DS} from '../core/ds.js';
import {sfx} from '../audio/sfx.js';
import {weaponsBySlot,weaponKeyHint} from '../weapons/slots.js';
export const PORTRAITS={
heniek:`<svg viewBox="0 0 200 230" role="img" aria-label="Pan Heniek"><g stroke="#15110e" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
<path d="M14 232 C18 186 58 168 100 168 C142 168 182 186 186 232Z" fill="#e7a97f"/><path d="M50 232 L58 176 C80 186 120 186 142 176 L150 232Z" fill="#f5f2ea"/>
<path d="M66 178 Q100 214 134 178" fill="none" stroke="#e3a91a" stroke-width="7"/><path d="M66 178 Q100 214 134 178" fill="none" stroke-width="2"/>
<rect x="82" y="146" width="36" height="32" fill="#e7a97f"/>
<ellipse cx="42" cy="102" rx="13" ry="17" fill="#e7a97f"/><ellipse cx="158" cy="102" rx="13" ry="17" fill="#e7a97f"/>
<ellipse cx="100" cy="94" rx="58" ry="68" fill="#efb58b"/>
<path d="M62 54 Q80 34 104 38" fill="none" stroke="#fff6e6" stroke-width="7"/>
<path d="M62 82 L90 76" stroke-width="8"/><path d="M110 76 L138 82" stroke-width="8"/>
<circle cx="80" cy="95" r="5" fill="#15110e"/><circle cx="120" cy="95" r="5" fill="#15110e"/>
<path d="M100 96 C86 114 86 124 100 126 C114 124 114 114 100 96Z" fill="#e08f6c"/>
<path d="M54 134 C68 116 92 120 100 128 C108 120 132 116 146 134 C132 144 112 140 100 134 C88 140 68 144 54 134Z" fill="#6b4226"/>
<path d="M86 146 Q100 154 114 146" fill="none"/></g></svg>`,
zdzichu:`<svg viewBox="0 0 200 230" role="img" aria-label="Zdzichu Spluwa"><g stroke="#15110e" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
<path d="M40 150 C30 190 34 214 50 232 L150 232 C166 214 170 190 160 150Z" fill="#5a3a20"/>
<path d="M14 232 C20 186 60 170 100 170 C140 170 180 186 186 232Z" fill="#6b7a3a"/>
<circle cx="50" cy="206" r="10" fill="#3d4a22" stroke="none"/><circle cx="150" cy="200" r="12" fill="#8a7a3a" stroke="none"/><circle cx="82" cy="220" r="8" fill="#3d2f1a" stroke="none"/><circle cx="128" cy="222" r="9" fill="#3d4a22" stroke="none"/>
<path d="M14 232 C20 186 60 170 100 170 C140 170 180 186 186 232" fill="none"/>
<rect x="84" y="146" width="32" height="30" fill="#d9a07a"/>
<ellipse cx="100" cy="96" rx="54" ry="64" fill="#e5ad86"/>
<path d="M46 86 C44 40 78 26 104 28 C140 30 158 50 154 86 C146 66 130 56 100 58 C76 58 56 66 46 86Z" fill="#5a3a20"/>
<rect x="56" y="84" width="38" height="26" rx="10" fill="#2a3340"/><rect x="106" y="84" width="38" height="26" rx="10" fill="#2a3340"/>
<path d="M94 92 L106 92" /><path d="M64 92 L74 88" stroke="#cfe3ec" stroke-width="3"/><path d="M114 92 L124 88" stroke="#cfe3ec" stroke-width="3"/>
<path d="M100 104 C92 118 92 126 102 128" fill="none"/>
<path d="M80 142 Q100 136 120 142" fill="none"/><path d="M118 140 L150 130" stroke="#d9b06a" stroke-width="4"/>
<g fill="#15110e" stroke="none"><circle cx="76" cy="134" r="1.6"/><circle cx="84" cy="140" r="1.6"/><circle cx="70" cy="128" r="1.6"/><circle cx="126" cy="132" r="1.6"/><circle cx="132" cy="126" r="1.6"/><circle cx="96" cy="148" r="1.6"/><circle cx="106" cy="150" r="1.6"/></g></g></svg>`,
halina:`<svg viewBox="0 0 200 230" role="img" aria-label="Siostra Halina"><g stroke="#15110e" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
<path d="M14 232 C20 188 60 172 100 172 C140 172 180 188 186 232Z" fill="#f6f3ec"/><path d="M76 176 L100 200 L124 176" fill="none" stroke="#d3242a" stroke-width="7"/>
<rect x="86" y="150" width="28" height="28" fill="#f0c4a2"/>
<path d="M44 100 C36 130 46 150 60 156 L64 110Z" fill="#e8c35a"/><path d="M156 100 C164 130 154 150 140 156 L136 110Z" fill="#e8c35a"/>
<ellipse cx="100" cy="106" rx="50" ry="58" fill="#f6cfaf"/>
<path d="M30 92 C26 40 64 14 100 14 C136 14 174 40 170 92Z" fill="#8a7a6a"/>
<path d="M30 92 C40 70 60 64 100 64 C140 64 160 70 170 92 C150 84 130 82 100 82 C70 82 50 84 30 92Z" fill="#a8988a"/>
<path d="M32 88 C22 110 24 136 38 150 C48 136 52 112 48 92Z" fill="#8a7a6a"/><path d="M168 88 C178 110 176 136 162 150 C152 136 148 112 152 92Z" fill="#8a7a6a"/>
<g stroke-width="2.5" opacity=".7"><path d="M50 40 l6 8"/><path d="M70 28 l4 9"/><path d="M128 28 l-4 9"/><path d="M150 40 l-6 8"/><path d="M96 22 l0 10"/><path d="M40 60 l8 4"/><path d="M160 60 l-8 4"/></g>
<circle cx="100" cy="72" r="13" fill="#fff"/><path d="M100 64 V80 M92 72 H108" stroke="#d3242a" stroke-width="5"/>
<path d="M72 104 Q80 98 88 104" fill="none"/><path d="M112 104 Q120 98 128 104" fill="none"/>
<path d="M70 98 l-5 -4 M76 96 l-2 -5" stroke-width="3"/><path d="M130 98 l5 -4 M124 96 l2 -5" stroke-width="3"/>
<circle cx="72" cy="124" r="9" fill="#f29a9a" stroke="none"/><circle cx="128" cy="124" r="9" fill="#f29a9a" stroke="none"/>
<path d="M100 108 C96 118 96 122 102 124" fill="none"/>
<path d="M86 136 Q100 128 114 136 Q100 148 86 136Z" fill="#d3242a"/></g></svg>`};
export const NPCS={
  heniek:{name:'Pan Heniek',role:'Sklep ogólnospożywczo-wojenny',say:['No co, kolego? Klucze, kamizelki, wszystko po kosztach. Prawie.','Klucz to inwestycja. Ja tak mówię każdemu.','Gotówka, karta, ZD. Biorę tylko ZD.','Jak skrzynka da Kulę Disco, to stawiasz piwo.'],
    items:()=>[
      {id:'key1',name:'Klucz do skrzyni',desc:'Otwiera Skrzynię Remizową.',price:150,ok:()=>true,buy:()=>{save.keys++}},
      {id:'key5',name:'Pęk 5 kluczy',desc:'Taniej o 100 ZD niż pojedynczo.',price:650,ok:()=>true,buy:()=>{save.keys+=5}},
      {id:'hp',name:`Kamizelka z bazaru (poz. ${save.hpLvl}/4)`,desc:'+25 maks. zdrowia na każdym poziomie.',price:250*(save.hpLvl+1),ok:()=>save.hpLvl<4,buy:()=>{save.hpLvl++}},
      {id:'dmg',name:`Ostra amunicja (poz. ${save.dmgLvl}/5)`,desc:'+10% obrażeń wszystkich broni.',price:300*(save.dmgLvl+1),ok:()=>save.dmgLvl<5,buy:()=>{save.dmgLvl++}},
    ]},
  zdzichu:{name:'Zdzichu Spluwa',role:'Handlarz bronią spod lady',say:['Te klamki są z pewnego źródła. Nie pytaj z jakiego.','Obrzyn „Sołtys”. Rozwiązuje spory sąsiedzkie.','Uzi na wesele, karabin na poprawiny.','Gotówka na stół, broń do ręki.'],
    items:()=>weaponsBySlot().filter(w=>w!=='pistol').map(w=>{const W=DS.weapons.get(w);return{id:w,name:W.name,desc:`Obrażenia ${W.dmg}${W.pellets>1?'×'+W.pellets:''} · magazynek ${W.mag} · ${W.auto?'automat':'półautomat'} · ${weaponKeyHint(w)}`,price:W.price,ok:()=>!save.weapons.includes(w),owned:save.weapons.includes(w),buy:()=>{save.weapons.push(w)}}})},
  halina:{name:'Siostra Halina',role:'Medyczka w uszance',say:['Siadaj, zszyję cię. Ale najpierw zapłać.','Apteczka pod H. Nie mów, że nie mówiłam.','Druga Szansa to nie cud, to procedura.','Zimno w tej remizie, dlatego uszanka.'],
    items:()=>[
      {id:'med',name:`Apteczka (masz ${save.medkits}/9)`,desc:'Klawisz H w grze: +50 zdrowia.',price:60,ok:()=>save.medkits<9,buy:()=>{save.medkits++}},
      {id:'second',name:`Druga Szansa (masz ${save.secondChance}/1)`,desc:'Raz na grę wstajesz z pełnym zdrowiem.',price:450,ok:()=>save.secondChance<1,buy:()=>{save.secondChance++}},
    ]},
};
let curNpc='heniek';
export function renderShop(sayLine){
  const N=NPCS[curNpc];
  $$('#shopTabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.npc===curNpc)));
  $('#npcPic').innerHTML=PORTRAITS[curNpc];$('#npcName').textContent=N.name;$('#npcRole').textContent=N.role;$('#npcSay').textContent=sayLine||pick(N.say);
  $('#npcItems').innerHTML='';
  N.items().forEach(it=>{const d=document.createElement('div');d.className='item';
    const can=it.ok()&&save.coins>=it.price;const label=it.owned?'Posiadasz':!it.ok()?'Maks.':'Kup';
    d.innerHTML=`<div><b></b><p></p></div><button class="btn sm" ${can?'':'disabled'}><span class="price">${it.price} ZD</span> · ${label}</button>`;
    d.querySelector('b').textContent=it.name;d.querySelector('p').textContent=it.desc;
    d.querySelector('button').addEventListener('click',()=>{if(save.coins<it.price||!it.ok()){sfx('error');return}save.coins-=it.price;it.buy();persist();sfx('buy');renderShop(pick(['Dobry wybór. Prawie tak dobry jak mój wąs.','Interes życia, kolego.','Dziękuję, przyjdź jeszcze.','Wiedziałem, że się dogadamy.']))});
    $('#npcItems').appendChild(d)});
}
$$('#shopTabs button').forEach(b=>b.addEventListener('click',()=>{curNpc=b.dataset.npc;sfx('tick',1100);renderShop()}));
