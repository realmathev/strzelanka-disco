// Dane meta-progresji: skórki, rzadkości, skrzynki (zapisywane w `save`).
export const SKINS=[
  {id:'fabryczny',name:'Fabryczny',r:'common',c1:'#3a3835',c2:'#8a857c'},
  {id:'kremowka',name:'Kremówka',r:'common',c1:'#e8d7b0',c2:'#b38b4d'},
  {id:'cegla',name:'Cegła z PRL',r:'common',c1:'#9b3b2a',c2:'#d7a35a'},
  {id:'moro',name:'Moro z bazaru',r:'common',c1:'#5b6b3a',c2:'#3a2f22'},
  {id:'maluch',name:'Maluch Błękitny',r:'rare',c1:'#2d5fa8',c2:'#e6e6e6'},
  {id:'biesiada',name:'Biesiada',r:'rare',c1:'#c2185b',c2:'#ffd54f'},
  {id:'dres',name:'Dres Trzy Paski',r:'rare',c1:'#1b1b1b',c2:'#f4f4f4'},
  {id:'zab',name:'Złoty Ząb',r:'epic',c1:'#d4a017',c2:'#fff3b0',fx:'gold'},
  {id:'neon',name:'Neon Remiza',r:'epic',c1:'#00d5f0',c2:'#ff2bd6',fx:'glow'},
  {id:'kula',name:'Kula Disco',r:'legend',c1:'#ff2b6a',c2:'#ffffff',fx:'rainbow'},
  {id:'zlotadysk',name:'Złota Dyskoteka',r:'legend',c1:'#ffcc33',c2:'#1a1200',fx:'pulse'},
];
export const RAR={common:{n:'Zwykła',c:'#8c877c',dup:40},rare:{n:'Rzadka',c:'#2f6fd0',dup:120},epic:{n:'Epicka',c:'#8a3bd1',dup:300},legend:{n:'Legendarna',c:'#e3a91a',dup:800}};
export const CRATES={remiza:{cost:1,w:{common:70,rare:22,epic:7,legend:1}},wesele:{cost:2,w:{common:40,rare:35,epic:19,legend:6}}};
