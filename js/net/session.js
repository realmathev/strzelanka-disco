// Sesja co-op: pokój JuicyJuicy (window.juicy.rooms, snippet w index.html), lista graczy, odbiór wiadomości z walidacją
// i limitem częstotliwości, API DS.net (hooki dla reszty gry). Logika runu: coop.js, host: host.js, klient: replicas.js, awatary: avatars.js.
import {DS} from '../core/ds.js';
import {opt} from '../core/save.js';
import {SampleBuf} from './interp.js';
import {V,MAX_BYTES,RATE_MAX,sizeOf,isId} from './proto.js';
import {L} from '../core/i18n.js';

export const COLORS=[0xffcf2e,0x35c8ff,0xff4fb4,0x6cf06a];
export const COLOR_CSS=['#ffcf2e','#35c8ff','#ff4fb4','#6cf06a'];

/** Stan sieci (jeden na kartę). players: zdalni gracze (bez mnie), id -> rekord. */
export const N={
  room:null,me:null,inRun:false,busy:false,msg:'',msgErr:false,
  players:new Map(),
  lob:{lv:'remiza',df:'normal',rd:{},c:{}},
  stats:{snapBytes:0,snapMax:0,snaps:0,rx:0,tx:0,dropped:0,invalid:0},
  pendingInvite:null,
};

/** Rekord zdalnego gracza. pos/vel: ostatni stan z `in` (logika hosta), buf: próbki do interpolacji awatara. */
function makeRec(id,name){
  return {id,name:String(name==null?'':name).slice(0,40),pos:new THREE.Vector3(),vel:new THREE.Vector3(),yaw:0,pitch:0,down:false,hp:100,mhp:100,w:null,ads:0,
    kl:0,hd:0,zd:0,inRun:false,lastIn:0,seen:false,buf:new SampleBuf(5,[3]),avatar:null,rate:{t:0,n:0},revCd:0};
}
export function rec(id){return N.players.get(id)||null}
export const isHost=()=>!!(N.room&&N.room.isHost());
export const nameOf=id=>{if(id===N.me)return L('Ty','You');const p=N.room&&N.room.player(id);return p?String(p.name||L('Gracz','Player')):L('Gracz','Player')};
export const colorOf=id=>{const c=N.lob.c&&N.lob.c[id];return Number.isInteger(c)&&c>=0&&c<COLORS.length?c:0};
/** Gracze w runie: ja + zdalni z inRun. */
export const runCount=()=>{let n=1;for(const r of N.players.values())if(r.inRun)n++;return n};

/* ---------- wysyłanie ---------- */
export function send(d,to){
  if(!N.room)return;
  N.stats.tx++;
  try{N.room.send(d,to)}catch(e){}
}

/* ---------- odbiór ---------- */
const handlers=Object.create(null);
/** Rejestruje obsługę rodzaju wiadomości: fn(data, fromId, rec|null). */
export function handle(k,fn){handlers[k]=fn}
const listeners=new Set();
/** Powiadomienia o zmianach (lista graczy, stan pokoju): lobby odświeża widok. */
export function onChange(fn){listeners.add(fn);return ()=>listeners.delete(fn)}
export function changed(){for(const f of listeners){try{f()}catch(e){console.warn('net onChange',e)}}}

function receive(d,from){
  N.stats.rx++;
  if(!d||typeof d!=='object'||Array.isArray(d)||typeof d.k!=='string'||!isId(from)||from===N.me){N.stats.invalid++;return}
  const r=rec(from);
  // limit częstotliwości od jednego gracza (relay JuicyJuicy: 60/s); nadmiar ignorujemy
  if(r){const now=performance.now();if(now-r.rate.t>1000){r.rate.t=now;r.rate.n=0}if(++r.rate.n>RATE_MAX){N.stats.dropped++;return}}
  const val=V[d.k],fn=handlers[d.k];
  if(!val||!fn){N.stats.invalid++;return}
  if(sizeOf(d)>MAX_BYTES){N.stats.invalid++;return}
  try{if(!val(d)){N.stats.invalid++;return}}catch(e){N.stats.invalid++;return}
  try{fn(d,from,r)}catch(e){console.warn('net',d.k,e)}
}

/* ---------- pokój ---------- */
const ERR={
  ROOM_NOT_FOUND:L('Nie ma pokoju o tym kodzie. Sprawdź kod i spróbuj jeszcze raz.','There is no room with that code. Check the code and try again.'),
  ROOM_FULL:L('Pokój jest pełny (maksymalnie 4 graczy).','The room is full (4 players max).'),
  ROOM_LOCKED:L('Pokój jest zamknięty, bo trwa fala. Spróbuj za chwilę: pokój otwiera się między falami.','The room is locked because a wave is in progress. Try again in a moment: the room opens between waves.'),
  KICKED:L('Host usunął cię z pokoju.','The host removed you from the room.'),
  TICKET:L('Zaloguj się na JuicyJuicy, żeby grać ze znajomymi.','Sign in to JuicyJuicy to play with friends.'),
  SIGNED_OUT:L('Zaloguj się na JuicyJuicy, żeby grać ze znajomymi.','Sign in to JuicyJuicy to play with friends.'),
  TIMEOUT:L('JuicyJuicy nie odpowiada. Spróbuj ponownie za chwilę.','JuicyJuicy is not responding. Try again in a moment.'),
  DISCONNECTED:L('Połączenie z pokojem zostało przerwane (host wyszedł albo zerwało sieć).','The connection to the room was lost (the host left or the network dropped).'),
  REPLACED:L('Ten pokój jest otwarty w innej karcie.','This room is open in another tab.'),
  TOO_FAST:L('Za dużo wiadomości naraz: serwer rozłączył pokój.','Too many messages at once: the server closed the room.'),
  GAME_GONE:L('Ta wersja gry nie jest już dostępna na JuicyJuicy.','This version of the game is no longer available on JuicyJuicy.'),
  OFF:L('Gra ze znajomymi jest chwilowo wyłączona.','Playing with friends is temporarily disabled.'),
  FAILED:L('Nie udało się połączyć z pokojem.','Could not connect to the room.'),
  NOT_HOST:L('Tylko host może to zrobić.','Only the host can do that.'),
  NO_ROOMS:L('Ta przeglądarka nie obsługuje pokoi (brak BroadcastChannel/WebSocket).','This browser does not support rooms (no BroadcastChannel/WebSocket).'),
  HOST_LEFT:L('Host wyszedł. Wróć do lobby i załóż nowy pokój.','The host left. Go back to the lobby and create a new room.'),
};
/** Czytelny komunikat po polsku dla kodu błędu JuicyJuicy (nieznany kod: ogólny tekst z kodem). */
export function errText(code){return ERR[code]||(L('Błąd połączenia (','Connection error (')+String(code||L('nieznany','unknown')).slice(0,24)+').')}
export function setMsg(t,err){N.msg=t||'';N.msgErr=!!err;changed()}

function rooms(){return window.juicy&&window.juicy.rooms}

/** Tworzy pokój (ja = host, max 4). */
export function createRoom(){
  if(N.room||N.busy)return Promise.resolve(false);
  const R=rooms();if(!R){setMsg(errText('NO_ROOMS'),true);return Promise.resolve(false)}
  N.busy=true;setMsg(L('Tworzę pokój…','Creating room…'));
  return R.create({max:4}).then(room=>{N.busy=false;attach(room);setMsg('');return true},e=>{N.busy=false;setMsg(errText(e&&e.code),true);return false});
}
/** Dołącza do pokoju o kodzie (6 znaków). */
export function joinRoom(code){
  if(N.room||N.busy)return Promise.resolve(false);
  code=String(code||'').trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code)){setMsg(L('Kod pokoju ma 6 znaków (litery i cyfry).','The room code has 6 characters (letters and digits).'),true);return Promise.resolve(false)}
  const R=rooms();if(!R){setMsg(errText('NO_ROOMS'),true);return Promise.resolve(false)}
  N.busy=true;setMsg(L('Dołączam do pokoju ','Joining room ')+code+'…');
  return R.join(code).then(room=>{N.busy=false;attach(room);setMsg('');return true},e=>{N.busy=false;setMsg(errText(e&&e.code),true);return false});
}
/** Opuszcza pokój (kończy też trwający run co-op). */
export function leaveRoom(){
  const room=N.room;if(!room)return;
  hooks.beforeLeave&&hooks.beforeLeave();
  try{room.leave()}catch(e){}
  detach('LEFT');
}

/** Hooki ustawiane przez coop.js (unikamy cyklu importów). */
export const hooks={beforeLeave:null,onLeave:null,onHostChange:null,onPlayerGone:null,onClosed:null,onJoin:null,onReconnect:null};

function assignColors(){
  const c=N.lob.c,used=new Set();const ids=N.room.players.map(p=>p.id);
  for(const id of Object.keys(c))if(!ids.includes(id))delete c[id];
  for(const id of ids)if(Number.isInteger(c[id]))used.add(c[id]);
  for(const id of ids)if(!Number.isInteger(c[id])){let i=0;while(used.has(i))i++;c[id]=i%COLORS.length;used.add(i)}
  for(const id of Object.keys(N.lob.rd))if(!ids.includes(id))delete N.lob.rd[id];
}
/** Host: rozsyła stan lobby (poziom, trudność, gotowość, kolory). */
export function broadcastLobby(){
  if(!isHost())return;
  assignColors();
  send({k:'lob',lv:N.lob.lv,df:N.lob.df,rd:N.lob.rd,c:N.lob.c});
  changed();
}

function attach(room){
  N.room=room;N.me=room.me;N.players.clear();N.inRun=false;
  for(const p of room.players)if(p.id!==N.me&&isId(p.id))N.players.set(p.id,makeRec(p.id,p.name));
  if(room.isHost()){N.lob={lv:opt.level||'remiza',df:opt.difficulty||'normal',rd:{},c:{}};broadcastLobby()}
  else N.lob={lv:'remiza',df:'normal',rd:{},c:{}};
  room.on('message',(d,from)=>{if(N.room===room)receive(d,from)});
  room.on('join',p=>{if(N.room!==room||!p||!isId(p.id)||p.id===N.me)return;const r=makeRec(p.id,p.name);N.players.set(p.id,r);broadcastLobby();hooks.onJoin&&hooks.onJoin(r);changed()});
  room.on('leave',p=>{if(N.room!==room||!p)return;const r=rec(p.id);if(r){hooks.onPlayerGone&&hooks.onPlayerGone(r);N.players.delete(p.id)}delete N.lob.rd[p.id];broadcastLobby();changed()});
  room.on('host',id=>{if(N.room!==room)return;hooks.onHostChange&&hooks.onHostChange(id);if(room.isHost())broadcastLobby();changed()});
  room.on('lock',()=>changed());
  room.on('error',e=>{if(N.room===room&&!(e&&e.code==='NOT_HOST'))setMsg(errText(e&&e.code),true)});   // NOT_HOST: niegroźny wyścig przy zmianie hosta (lock/kick)
  room.on('close',reason=>{if(N.room===room)detach(reason)});
  changed();
}
function detach(reason){
  const wasRun=N.inRun;
  N.room=null;
  hooks.onClosed&&hooks.onClosed(reason,wasRun);
  for(const r of N.players.values())hooks.onPlayerGone&&hooks.onPlayerGone(r);
  N.players.clear();N.inRun=false;N.me=null;N.reconnecting=false;N.lob={lv:'remiza',df:'normal',rd:{},c:{}};
  if(wasRun&&reason==='DISCONNECTED')setMsg(L('Nie udało się wrócić do gry: połączenie zerwane (host wyszedł albo brak sieci).','Could not get back into the game: connection lost (the host left or there is no network).'),true);
  else if(reason&&reason!=='LEFT')setMsg(errText(reason),true);else changed();
}
/* ---------- zerwane połączenie ---------- */
// Snippet sam próbuje wrócić 3 razy (room.link = null w trakcie). Pokazujemy „Rozłączono — próbuję wrócić…”, a po powrocie
// klient prosi hosta o pełny stan (`hi` -> `full`). Nieudany powrót kończy się zdarzeniem 'close' (DISCONNECTED).
setInterval(()=>{
  const room=N.room;if(!room||room.closed)return;
  if(!room.link&&!N.reconnecting){N.reconnecting=true;hooks.onReconnect&&hooks.onReconnect(false);changed()}
  else if(room.link&&N.reconnecting){N.reconnecting=false;N.me=room.me;hooks.onReconnect&&hooks.onReconnect(true);changed()}
},250);

/* ---------- lobby: gotowość i stan od hosta ---------- */
handle('lob',(d,from)=>{
  if(!N.room||from!==N.room.host)return;
  const rd={},c={};
  for(const k of Object.keys(d.rd))if(isId(k)&&(d.rd[k]===1||d.rd[k]===0))rd[k]=d.rd[k];
  for(const k of Object.keys(d.c))if(isId(k)&&Number.isInteger(d.c[k])&&d.c[k]>=0&&d.c[k]<COLORS.length)c[k]=d.c[k];
  N.lob={lv:DS.levels.has(d.lv)?d.lv:N.lob.lv,df:d.df,rd,c};changed();
});
handle('rdy',(d,from)=>{if(!isHost()||!rec(from))return;N.lob.rd[from]=d.r;broadcastLobby()});
/** Klient: zgłasza gotowość. */
export function setReady(on){if(!N.room||isHost())return;N.lob.rd[N.me]=on?1:0;send({k:'rdy',r:on?1:0},N.room.host);changed()}
/** Host: wszyscy pozostali gotowi? */
export const allReady=()=>{if(!N.room)return false;for(const p of N.room.players)if(p.id!==N.room.host&&N.lob.rd[p.id]!==1)return false;return true};

/* ---------- API DS.net ---------- */
Object.assign(DS.net,{
  N,
  active:()=>!!(N.room&&N.inRun),
  isHost:()=>!!(N.room&&N.inRun&&N.room.isHost()),
  isClient:()=>!!(N.room&&N.inRun&&!N.room.isHost()),
  inRoom:()=>!!N.room,
  me:()=>N.me,
  playerCount:runCount,
  /** Mnożnik HP wrogów (docs/COOP.md): ×(1+0,6·(n−1)), boss ×(1+0,75·(n−1)). */
  /** Liczba graczy do skalowania trudności: ustalana na starcie runu i każdej fali (dołączający zmienia ją od następnej fali). */
  rescale:()=>{N.scaleN=runCount();return N.scaleN},
  hpScale:boss=>{const n=N.scaleN||runCount();return 1+(boss?.75:.6)*(n-1)},
  /** Mnożnik limitu żywych wrogów: ×(1+0,35·(n−1)) (waves.js tnie do 30). */
  aliveScale:()=>1+.35*((N.scaleN||runCount())-1),
  /** Czy punkt (x,z) jest co najmniej `min` m od każdego zdalnego gracza w runie (spawn wrogów). */
  farFromPlayers:(x,z,min)=>{for(const r of N.players.values())if(r.inRun&&Math.hypot(r.pos.x-x,r.pos.z-z)<min)return false;return true},
  createRoom,joinRoom,leaveRoom,setReady,errText,
});
