// Menu główne: podsumowanie misji, skrót sterowania, wybór poziomu i trudności.
import {$} from '../core/util.js';
import {save,opt,persistOpt} from '../core/save.js';
import {DS} from '../core/ds.js';
import {sfx} from '../audio/sfx.js';
import {world} from '../world/state.js';
import '../input/optdefs.js';
import {h,clear} from './dom.js';
import {L as Tr} from '../core/i18n.js';

export const DIFFS=[
  {id:'easy',name:Tr('Łatwy','Easy'),desc:Tr('Luźna strzelanina na rozgrzewkę.','A relaxed warm-up shootout.')},
  {id:'normal',name:Tr('Normalny','Normal'),desc:Tr('Tak, jak zamierzył DJ.','The way the DJ intended.')},
  {id:'hard',name:Tr('Trudny','Hard'),desc:Tr('Więcej wrogów, mniej litości.','More enemies, less mercy.')},
];
const I=()=>DS.input;

/** Lista poziomów z rejestru (zawsze zawiera przynajmniej bieżący). */
export function levelList(){
  const l=DS.levels.all();
  if(!l.length&&world.level)l.push(world.level);
  return l;
}
export function levelName(id){const L=DS.levels.get(id)||(world.level&&world.level.id===id?world.level:null);return L?(L.name||L.id):id}
/** Poprawia opt.level, jeśli wskazuje poziom, którego nie ma w rejestrze. */
export function validLevel(){
  const l=levelList();
  if(l.length&&!l.some(x=>x.id===opt.level)){opt.level=(world.level&&world.level.id)||l[0].id}
  return opt.level;
}

export function refreshMenu(){
  validLevel();
  $('#mLevelName').textContent=levelName(opt.level);
  $('#mDiffName').textContent=(DIFFS.find(d=>d.id===opt.difficulty)||DIFFS[1]).name;
  // skrót sterowania z aktualnych przypisań
  const I_=I(),k=id=>I_.keyFor(id);
  const items=[
    [[k('moveForward'),k('moveLeft'),k('moveBack'),k('moveRight')].join(' '),Tr('ruch','move')],
    [k('fire'),Tr('strzał','fire')],[k('ads'),Tr('celowanie','aim')],[k('reload'),Tr('przeładuj','reload')],
    ['1–6 / '+(I_.get('weaponNext').codes.every(c=>/^Wheel/.test(c))?Tr('kółko','wheel'):k('weaponNext')),Tr('broń','weapon')],[k('sprint'),'sprint'],[k('jump'),Tr('skok','jump')],[k('crouch'),Tr('kucanie','crouch')],
    [k('medkit'),Tr('apteczka','medkit')],[k('pause'),Tr('pauza','pause')],
  ];
  const box=$('#keysHelp');clear(box);
  items.forEach(([key,txt],i)=>{box.append(h('b',null,key),' '+txt+(i<items.length-1?' · ':''))});
  const ph=$('#pauseHint');if(ph)ph.textContent=Tr(`${k('pause')} lub P wznawia grę. Sterowanie możesz zmienić w Opcjach.`,`${k('pause')} or P resumes the game. You can change the controls in Options.`);
}
DS.bus.on('keys',refreshMenu);

/** Lista perków zdobytych w bieżącym runie (ekran pauzy), z DS.progression.owned(). */
export function renderPausePerks(){
  const box=$('#pausePerks');if(!box)return;clear(box);
  let owned={};try{owned=(DS.progression&&DS.progression.owned&&DS.progression.owned())||{}}catch(e){}
  const ids=Object.keys(owned);box.hidden=!ids.length;if(!ids.length)return;
  const RN={common:Tr('zwykły','common'),rare:Tr('rzadki','rare'),epic:Tr('epicki','epic'),legend:Tr('legendarny','legendary')};
  box.append(h('h3',null,Tr('Perki w tym podejściu','Perks this run')),h('ul',null,ids.map(id=>{
    const d=DS.perks.get(id)||{};
    return h('li',{title:d.desc||''},h('b',null,(d.name||id)+(owned[id]>1?' ×'+owned[id]:'')),h('span',null,' · '+(RN[d.rarity]||''),d.desc?' · '+d.desc:''));
  })));
}

/** Rysuje ekran wyboru misji. */
export function renderPlay(){
  validLevel();
  const ll=$('#levelList');clear(ll);
  for(const L of levelList()){
    const on=L.id===opt.level;
    ll.append(h('button',{class:'pick'+(on?' on':''),type:'button',role:'radio','aria-checked':String(on),'data-id':L.id,
        onclick:()=>{opt.level=L.id;persistOpt();sfx('tick',1200);DS.bus.emit('levelSelect',{level:L.id});renderPlay();refreshMenu();const b=$('#levelList .pick.on');if(b)b.focus({preventScroll:true})}},
      h('b',null,L.name||L.id),
      h('span',{class:'meta'},L.arena?Tr(`Arena ${L.arena} m`,`Arena ${L.arena} m`):Tr('Poziom','Level'),save.levelsDone&&save.levelsDone[L.id]?h('em',{class:'done'},Tr(' · ✓ UKOŃCZONY',' · ✓ COMPLETED')):null),
      L.desc||L.tagline?h('span',{class:'desc'},L.desc||L.tagline):null,
      h('span',{class:'tick','aria-hidden':'true'},on?Tr('WYBRANY','SELECTED'):'')));
  }
  const dl=$('#diffList');clear(dl);
  for(const d of DIFFS){
    const on=d.id===opt.difficulty;
    dl.append(h('button',{class:'pick'+(on?' on':''),type:'button',role:'radio','aria-checked':String(on),'data-id':d.id,
        onclick:()=>{opt.difficulty=d.id;persistOpt();sfx('tick',1200);renderPlay();refreshMenu();const b=$('#diffList .pick.on');if(b)b.focus({preventScroll:true})}},
      h('b',null,d.name),h('span',{class:'desc'},d.desc),h('span',{class:'tick','aria-hidden':'true'},on?Tr('WYBRANY','SELECTED'):'')));
  }
  $('#playNote').textContent=`${levelName(opt.level)} · ${(DIFFS.find(d=>d.id===opt.difficulty)||DIFFS[1]).name}`;
}
