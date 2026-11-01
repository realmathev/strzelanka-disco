// Lobby „Graj ze znajomymi”: utwórz pokój / dołącz kodem / zaproszenie z linku (rooms.invited() przy starcie gry),
// lista graczy (nazwy wyłącznie przez textContent), gotowość, host wybiera poziom i trudność, „Zaproś”, kod pokoju, wyjście.
import {$} from '../core/util.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {sfx} from '../audio/sfx.js';
import {show} from '../ui/screens.js';
import {h,clear} from '../ui/dom.js';
import {DIFFS,levelList,levelName} from '../ui/menu.js';
import {N,COLOR_CSS,colorOf,isHost,onChange,createRoom,joinRoom,leaveRoom,setReady,allReady,broadcastLobby,setMsg} from './session.js';
import {hostStart} from './coop.js';

/* ---------- budowa ekranu ---------- */
const el={};
(function build(){
  const back=h('button',{class:'btn paper sm',type:'button','data-go':'scrMenu',id:'coopBack'},'Wróć');
  el.msg=h('p',{class:'coopMsg',id:'coopMsg',role:'alert','aria-live':'assertive'});
  // poza pokojem
  el.code=h('input',{id:'coopCode',type:'text',maxLength:6,autocomplete:'off',spellcheck:false,placeholder:'KOD',class:'coopCode','aria-label':'Kod pokoju (6 znaków)'});
  el.create=h('button',{class:'btn red',id:'coopCreate',type:'button','data-autofocus':''},'Utwórz pokój');
  el.join=h('button',{class:'btn',id:'coopJoin',type:'button'},'Dołącz');
  el.out=h('div',{class:'coopOut',id:'coopOut'},
    h('p',{class:'note'},'Graj z 1–3 znajomymi. Host prowadzi wrogów i fale, każdy zbiera ZD i XP do własnego zapisu.'),
    el.create,h('div',{class:'row coopJoinRow'},el.code,el.join));
  // w pokoju
  el.roomCode=h('b',{id:'coopRoomCode',class:'coopRoomCode'});
  el.copy=h('button',{class:'btn paper sm',id:'coopCopy',type:'button'},'Kopiuj kod');
  el.invite=h('button',{class:'btn paper sm',id:'coopInvite',type:'button'},'Zaproś');
  el.list=h('ul',{class:'coopList',id:'coopList','aria-label':'Gracze w pokoju'});
  el.lvl=h('select',{id:'coopLevel','aria-label':'Poziom'});
  el.diff=h('select',{id:'coopDiff','aria-label':'Trudność'});
  el.setup=h('p',{class:'note',id:'coopSetup'});
  el.ready=h('button',{class:'btn',id:'coopReady',type:'button'},'Gotowy');
  el.start=h('button',{class:'btn red play',id:'coopStart',type:'button'},'Start');
  el.leave=h('button',{class:'btn paper',id:'coopLeave',type:'button'},'Opuść pokój');
  el.hostBox=h('div',{class:'coopHost'},h('label',null,'Poziom ',el.lvl),h('label',null,'Trudność ',el.diff));
  el.inRoom=h('div',{class:'coopIn',id:'coopIn',hidden:true},
    h('div',{class:'row coopCodeRow'},h('span',null,'Kod pokoju: '),el.roomCode,el.copy,el.invite),
    el.list,el.hostBox,el.setup,h('div',{class:'row'},el.ready,el.start,el.leave));
  $('#app').append(h('section',{class:'screen',id:'scrCoop',hidden:true,'aria-labelledby':'coopT'},
    h('div',{class:'wrap'},h('div',{class:'topbar'},h('h2',{id:'coopT'},'Graj ze znajomymi'),h('div',{class:'wallet'},back)),
      h('div',{class:'panel coopPanel'},el.out,el.inRoom,el.msg))));
  back.addEventListener('click',()=>{if(N.room)leaveRoom()});           // wyjście z ekranu = wyjście z pokoju
  el.create.addEventListener('click',()=>{sfx('tick',1000);createRoom()});
  el.join.addEventListener('click',()=>{sfx('tick',1000);joinRoom(el.code.value)});
  el.code.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();joinRoom(el.code.value)}});
  el.code.addEventListener('input',()=>{const v=el.code.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);if(v!==el.code.value)el.code.value=v});
  el.copy.addEventListener('click',()=>copy(N.room&&N.room.code,'Kod skopiowany.'));
  el.invite.addEventListener('click',()=>{if(!N.room)return;let link='';try{link=N.room.invite()}catch(e){}if(link)copy(link,'Link zaproszenia skopiowany: '+link)});
  el.ready.addEventListener('click',()=>{sfx('tick',1200);setReady(N.lob.rd[N.me]!==1)});
  el.start.addEventListener('click',()=>{sfx('tick',1200);hostStart()});
  el.leave.addEventListener('click',()=>{sfx('tick',1000);leaveRoom();render()});
  el.lvl.addEventListener('change',()=>{if(!isHost()||!DS.levels.has(el.lvl.value))return;N.lob.lv=el.lvl.value;broadcastLobby()});
  el.diff.addEventListener('change',()=>{if(!isHost()||!DIFFS.some(d=>d.id===el.diff.value))return;N.lob.df=el.diff.value;broadcastLobby()});
})();
function copy(text,ok){
  if(!text)return;
  const done=()=>setMsg(ok,false);
  try{const p=navigator.clipboard&&navigator.clipboard.writeText(String(text));if(p&&p.then)p.then(done,()=>setMsg(String(text),false));else done()}catch(e){setMsg(String(text),false)}
}

/* ---------- rysowanie ---------- */
function fillSelect(sel,items,val){
  if(sel.options.length!==items.length){clear(sel);for(const [id,name] of items)sel.append(h('option',{value:id},name))}
  if(sel.value!==val)sel.value=val;
}
export function render(){
  const room=N.room,inRoom=!!room;
  el.out.hidden=inRoom;el.inRoom.hidden=!inRoom;
  el.create.disabled=el.join.disabled=N.busy;
  el.msg.textContent=N.msg;el.msg.classList.toggle('err',N.msgErr);el.msg.hidden=!N.msg;
  if(!inRoom)return;
  el.roomCode.textContent=room.code||'';
  clear(el.list);
  for(const p of room.players){
    const host=p.id===room.host,me=p.id===N.me,rd=host||N.lob.rd[p.id]===1;
    el.list.append(h('li',{class:'coopPl'+(me?' me':'')},
      h('i',{class:'sw',style:'background:'+COLOR_CSS[colorOf(p.id)],'aria-hidden':'true'}),
      h('span',{class:'nm'},String(p.name==null?'':p.name)),                       // nazwa z relaya: tylko węzeł tekstowy
      me?h('em',null,' (Ty)'):null,
      h('span',{class:'tag'},host?'HOST':rd?'GOTOWY':'czeka')));
  }
  const H=isHost();
  el.hostBox.hidden=!H;
  if(H){fillSelect(el.lvl,levelList().map(L=>[L.id,L.name||L.id]),N.lob.lv);fillSelect(el.diff,DIFFS.map(d=>[d.id,d.name]),N.lob.df)}
  el.setup.textContent='Misja: '+levelName(N.lob.lv)+' · '+((DIFFS.find(d=>d.id===N.lob.df)||DIFFS[1]).name)+
    (N.inRun?' · trwa gra':room.locked?' · pokój zamknięty':'')+' · graczy: '+room.players.length+'/'+(room.max||4);
  el.ready.hidden=H;el.ready.textContent=N.lob.rd[N.me]===1?'Nie jestem gotowy':'Gotowy';
  el.start.hidden=!H;el.start.disabled=!allReady()||N.inRun;
  el.start.title=allReady()?'':'Czekam na gotowość wszystkich graczy';
}
onChange(()=>{if(!$('#scrCoop').hidden)render()});

/** Pokazuje lobby (z menu, po końcu runu, po zaproszeniu). */
export function showLobby(){
  if(S.mode==='game')return;
  show('scrCoop');render();
}
// Przycisk w menu głównym.
(function menuButton(){
  const play=$('#mSetup');if(!play)return;
  const b=h('button',{class:'btn coop',id:'mCoop',type:'button'},'Graj ze znajomymi');
  b.addEventListener('click',()=>{sfx('tick',1000);showLobby()});
  play.after(b);
})();

/* ---------- zaproszenie z linku ---------- */
// rooms.invited(): kod z linku zaproszenia (JuicyJuicy albo ?room=KOD poza nim). Po ekranie ostrzeżenia otwieramy od razu lobby i dołączamy.
try{
  const R=window.juicy&&window.juicy.rooms;
  if(R)R.invited().then(code=>{
    if(!code)return;N.pendingInvite=String(code).toUpperCase();
    const go=()=>{if(!N.pendingInvite||N.room)return;const c=N.pendingInvite;N.pendingInvite=null;showLobby();el.code.value=c;joinRoom(c)};
    if(S.mode==='menu')go();
    else for(const id of ['warnFull','warnSafe']){const b=$('#'+id);if(b)b.addEventListener('click',()=>setTimeout(go,0))}
  },()=>{});
}catch(e){}
