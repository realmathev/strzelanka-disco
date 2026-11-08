// Dane meta-progresji: skórki, rzadkości, skrzynki (zapisywane w `save`).
import {L} from './i18n.js';
export const SKINS=[
  {id:'fabryczny',name:L('Fabryczny','Factory'),r:'common',c1:'#3a3835',c2:'#8a857c'},
  {id:'kremowka',name:L('Kremówka','Cream Cake'),r:'common',c1:'#e8d7b0',c2:'#b38b4d'},
  {id:'cegla',name:L('Cegła z PRL','Communist-Era Brick'),r:'common',c1:'#9b3b2a',c2:'#d7a35a'},
  {id:'moro',name:L('Moro z bazaru','Bazaar Camo'),r:'common',c1:'#5b6b3a',c2:'#3a2f22'},
  {id:'maluch',name:L('Maluch Błękitny','Maluch Blue'),r:'rare',c1:'#2d5fa8',c2:'#e6e6e6'},
  {id:'biesiada',name:L('Biesiada','The Feast'),r:'rare',c1:'#c2185b',c2:'#ffd54f'},
  {id:'dres',name:L('Dres Trzy Paski','Tracksuit Three Stripes'),r:'rare',c1:'#1b1b1b',c2:'#f4f4f4'},
  {id:'zab',name:L('Złoty Ząb','Golden Tooth'),r:'epic',c1:'#d4a017',c2:'#fff3b0',fx:'gold'},
  {id:'neon',name:L('Neon Remiza','Neon Fire Station'),r:'epic',c1:'#00d5f0',c2:'#ff2bd6',fx:'glow'},
  {id:'kula',name:L('Kula Disco','Disco Ball'),r:'legend',c1:'#ff2b6a',c2:'#ffffff',fx:'rainbow'},
  {id:'zlotadysk',name:L('Złota Dyskoteka','Golden Disco'),r:'legend',c1:'#ffcc33',c2:'#1a1200',fx:'pulse'},
];
export const RAR={common:{n:L('Zwykła','Common'),c:'#8c877c',dup:40},rare:{n:L('Rzadka','Rare'),c:'#2f6fd0',dup:120},epic:{n:L('Epicka','Epic'),c:'#8a3bd1',dup:300},legend:{n:L('Legendarna','Legendary'),c:'#e3a91a',dup:800}};
export const CRATES={remiza:{cost:1,w:{common:70,rare:22,epic:7,legend:1}},wesele:{cost:2,w:{common:40,rare:35,epic:19,legend:6}}};
