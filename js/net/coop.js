// Przebieg runu co-op: start (host -> wszyscy), stan gracza `in` ~20 Hz, strzały (`shot`: efekt + trafienia dla hosta),
// zabójstwa i asysty, powalenie / podnoszenie (E 3 s w promieniu 2 m), powrót w następnej fali z 50% HP, koniec runu, wyjście.
import {$} from '../core/util.js';
import {save,opt,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {announce} from '../render/comicfx.js';
import {addTracer} from '../render/fx3d.js';
import {sfx} from '../audio/sfx.js';
import {world} from '../world/state.js';
import {P} from '../player/player.js';
import {wakeByShot} from '../enemies/ai.js';
import {xpForKill} from '../progression/config.js';
import {loadLevel} from '../world/world.js';
import {startGame,toMenuMode} from '../game/flow.js';
import {killEnemy,hurt} from '../game/combat.js';
import {waveIntro,waveClearReward} from '../game/waves.js';
import {submitRun,fillOver} from '../ui/highscores.js';
import {show} from '../ui/screens.js';
import {h,clear} from '../ui/dom.js';
import {showLobby} from './lobby.js';
import {N,rec,send,handle,hooks,isHost,nameOf,changed,setMsg,errText,allReady} from './session.js';
import {q2,IN_HZ,SNAP_HZ,MAX_HITS,isVec} from './proto.js';
import {buildAvatar,destroyAvatar,updateAvatar,flashAvatar} from './avatars.js';
import {updateReplicas,clearReplicas,setReplicaHooks,replicaCount} from './replicas.js';
import {applyRemoteHits,assistsOf,queueEv,hostTick,resetHost,flushNow,buildFull} from './host.js';
import {hudUpdate,hudClear,feed,setBanner,CALLS} from './hud.js';
import {updateGame} from '../game/loop.js';
import {isStunned} from '../enemies/proj.js';
import {applyFull} from './replicas.js';
import {COLOR_CSS,colorOf} from './session.js';
import {resetWorldSync} from './world.js';
import {stunPlayer} from '../enemies/proj.js';

const REVIVE_TIME=3,REVIVE_R=2,BACK_HP=.5;
const V1=new THREE.Vector3(),V2=new THREE.Vector3();

/* ---------- start ---------- */
/** Host: start runu dla wszystkich (wymaga gotowości pozostałych). */
export function hostStart(){
  if(!isHost()||N.inRun)return false;
  if(!allReady()){setMsg('Czekam, aż wszyscy będą gotowi.',true);return false}
  const lv=DS.levels.has(N.lob.lv)?N.lob.lv:'remiza',df=N.lob.df,seed=Math.floor(Math.random()*2147483647);
  try{N.room.lock(true)}catch(e){}          // w trakcie gry nikt nie dołącza (dołączanie między falami: etap 3)
  send({k:'start',lv,df,seed});
  beginRun(lv,df,seed);
  return true;
}
handle('start',(d,from)=>{if(!N.room||from!==N.room.host||isHost())return;if(!DS.levels.has(d.lv)){setMsg('Host wybrał poziom, którego ta wersja gry nie zna.',true);return}beginRun(d.lv,d.df,d.seed)});

let prevDiff=null;
function beginRun(lv,df,seed){
  if(!N.room)return;
  if(S.mode==='game')toMenuMode();
  N.inRun=true;N.seed=seed;N.down=false;N.revT=0;resetHost();clearReplicas();resetWorldSync();
  for(const r of N.players.values()){r.inRun=true;r.outed=false;r.down=false;r.kl=r.hd=r.zd=0;r.lastIn=performance.now();r.seen=false}
  if(prevDiff===null)prevDiff=opt.difficulty;opt.difficulty=df;    // trudność hosta tylko na czas runu (bez zapisu opcji)
  if(!world.level||world.level.id!==lv)loadLevel(lv);
  startGame();
  S.G.coop=true;S.G.seed=seed;
  if(!isHost())S.G.levelWon=true;   // klient: warunek wygranej liczy host (ev `lc` -> winLevel), lokalne słuchacze poziomu milczą
  DS.net.rescale();N.lastSnapAt=performance.now();
  sendIn();changed();
}

/* ---------- stan gracza `in` ---------- */
let inT=0;
const wrapYaw=a=>{a%=Math.PI*2;if(a>Math.PI)a-=Math.PI*2;if(a<-Math.PI)a+=Math.PI*2;return a};
function sendIn(){
  const G=S.G;if(!G)return;
  send({k:'in',t:Math.round(performance.now()),p:[q2(P.pos.x),q2(P.pos.y),q2(P.pos.z)],y:q2(wrapYaw(P.yaw)),pi:q2(P.pitch),w:G.weapon,dn:G.dead?1:0,
    hp:Math.max(0,Math.min(10000,Math.ceil(G.hp))),mhp:Math.max(1,Math.min(10000,Math.round(G.maxHp))),kl:G.kills|0,hd:G.heads|0,zd:Math.max(0,Math.round(G.earned||0)),a:DS.input.adsActive&&DS.input.adsActive()?1:0,st:isStunned()?1:0});
}
handle('in',(d,from,r)=>{
  if(!r||!N.inRun)return;
  if(!r.inRun){if(r.outed)return;r.inRun=true;r.seen=false;feed(nameOf(from)+' dołącza do gry')}   // dołączył w trakcie runu (dostał `full` od hosta)
  const now=performance.now(),x=d.p[0],y=d.p[1],z=d.p[2];
  if(r.seen&&now>r.lastIn){const dt=Math.max(.03,(now-r.lastIn)/1000);r.vel.set((x-r.pos.x)/dt,0,(z-r.pos.z)/dt);if(r.vel.length()>25)r.vel.setLength(25)}
  r.pos.set(x,y,z);r.yaw=d.y;r.pitch=d.pi;r.down=d.dn===1;r.hp=d.hp;r.mhp=d.mhp;r.kl=d.kl;r.hd=d.hd;r.zd=d.zd;r.ads=d.a|0;r.stun=d.st===1;
  r.w=d.w&&DS.weapons.has(d.w)?d.w:r.w;r.lastIn=now;r.seen=true;
  r.buf.push(d.t,[x,y,z,d.y,d.pi]);
  if(!r.avatar&&S.mode==='game'&&S.G)buildAvatar(r);
});

/* ---------- strzały ---------- */
let pend=[];
/** combat.damageEnemy na replice (klient): trafienie czeka na wysyłkę z najbliższym `shot`. */
DS.net.sendHit=(e,dmg,head)=>{if(!DS.net.isClient()||!e.eid||pend.length>=MAX_HITS)return;pend.push([e.eid,q2(Math.max(0,Math.min(5000,dmg))),head?1:0])};
const qv=v=>[q2(v.x),q2(v.y),q2(v.z)];
DS.bus.on('shot',ev=>{
  if(!DS.net.active()||!ev)return;
  const d={k:'shot',w:ev.weapon,m:qv(ev.muzzle)};
  if(ev.ends&&ev.ends.length)d.e=ev.ends.slice(0,3).map(qv);
  if(pend.length){d.h=pend;pend=[]}
  send(d);
});
function flushHits(){if(pend.length&&DS.net.isClient()){send({k:'shot',h:pend});pend=[]}}
handle('shot',(d,from,r)=>{
  if(!r||!N.inRun||!r.inRun||!S.G||S.mode!=='game')return;
  if(d.h&&isHost())applyRemoteHits(d.h,from);
  if(d.m){
    if(isHost())wakeByShot(r.pos.x,r.pos.z);
    V1.set(d.m[0],d.m[1],d.m[2]);
    if(d.e)for(const e of d.e)if(isVec(e)){V2.set(e[0],e[1],e[2]);addTracer(V1,V2,0xffe14a,.05)}
    const dist=Math.hypot(r.pos.x-P.pos.x,r.pos.z-P.pos.z);sfx('enemyShot',Math.max(.15,1.2-dist/40));
    flashAvatar(r);
  }
});

/* ---------- zabójstwa (host rozsyła), nagrody (każdy u siebie) ---------- */
DS.bus.on('kill',ev=>{const e=ev&&ev.enemy;if(!DS.net.isHost()||!e||e.replica||!e.eid)return;queueEv({t:'kill',id:e.eid,by:N.me,hd:ev.head?1:0,a:assistsOf(e,N.me)})});
DS.bus.on('netKill',ev=>{
  const e=ev&&ev.enemy;if(!DS.net.isHost()||!e||!e.eid)return;
  const a=assistsOf(e,ev.by);queueEv({t:'kill',id:e.eid,by:ev.by,hd:ev.head?1:0,a});
  if(a.includes(N.me))assistXp(e);
});
DS.bus.on('waveStart',ev=>{
  if(!DS.net.active())return;
  if(DS.net.isHost()){const v={t:'wave',w:ev.wave|0,c:ev.count|0};if(ev.boss){v.b=1;if(ev.bossName)v.n=String(ev.bossName).slice(0,40)}queueEv(v)}
  const G=S.G;if(G&&G.dead&&!G.coopEnded)reviveLocal(BACK_HP,'Nowa fala: wracasz do gry z połową zdrowia');
});
DS.bus.on('waveClear',ev=>{if(DS.net.isHost())queueEv({t:'clear',w:ev.wave|0})});
/** Asysta (≥25% obrażeń): 50% XP zabójstwa. */
function assistXp(e){
  const G=S.G;if(!G||!G.mods||!DS.progression)return;
  const base=xpForKill({enemy:e,head:false,combo:0,wave:G.wave,difficulty:opt.difficulty});
  DS.progression.addXp(Math.max(1,Math.round(base*.5*(G.mods.xpMul||1))));
}
setReplicaHooks({
  onKill(e,v){
    if(v.by===N.me)killEnemy(e,v.hd===1);   // moje zabójstwo: XP, combo, napisy jak w solo (monety i dropy rzuca host)
    else{e.alive=false;e.mats.forEach(m=>m.emissive.setRGB(0,0,0));if(v.a.includes(N.me))assistXp(e);
      if(e.boss)announce((e.name||'BOSS').toUpperCase()+' POKONANY!',nameOf(v.by)+' zadał ostatni cios')}
  },
  onWave(v){const G=S.G;if(!G)return;G.boss=v.b===1;waveIntro(G,v.n||undefined);DS.bus.emit('waveStart',{wave:v.w,boss:G.boss,count:v.c})},
  onClear(){if(S.G)waveClearReward(S.G)},
  onHurt(d,kx,kz,stun){const G=S.G;if(!G||!N.inRun)return;if(d>0)hurt(d);if(kx||kz)DS.player.knock({x:kx,z:kz});if(stun>0)stunPlayer(stun)},
  onLevelDone(v){winLevel(v.lv,v.w)},
});

/* ---------- poziom ukończony, „Dalej”, „Menu” ---------- */
// Host: poziom sam emituje 'levelComplete' (warunek wygranej, także po zabójstwie zdalnego gracza: 'netKill'); idzie do klientów jako ev `lc`.
DS.bus.on('levelComplete',e=>{if(DS.net.isHost()&&e&&e.level)queueEv({t:'lc',lv:String(e.level),w:(S.G&&S.G.wave)|0})});
/** Klient: nagroda poziomu do własnego zapisu (levelsDone, ZD, klucze) i ekran „Poziom ukończony”. */
function winLevel(lv,w){
  const G=S.G,L=DS.levels.get(lv);if(!G||!L||G.coopWon||!world.level||world.level.id!==lv)return;
  G.coopWon=true;
  const r=(L.win&&L.win.reward)||{};
  save.coins+=r.coins|0;save.keys+=r.keys|0;G.earned+=r.coins|0;G.keysFound+=r.keys|0;
  save.levelsDone=save.levelsDone||{};save.levelsDone[lv]=true;persist();
  setTimeout(()=>{if(S.G===G&&L.win)announce(L.win.text||'POZIOM UKOŃCZONY!','+'+(r.coins|0)+' ZD'+(r.keys?' i klucze: '+r.keys:''))},1500);
  DS.bus.emit('levelComplete',{level:lv,wave:w});
}
/** Host: „Dalej” = kolejny poziom u wszystkich (ta sama drużyna, nowy run). */
function nextLevel(id){
  if(!isHost()||!DS.levels.has(id))return;
  const seed=Math.floor(Math.random()*2147483647);
  flushNow();send({k:'level',lv:id,seed});
  opt.level=id;
  beginRun(id,N.lob.df,seed);
}
handle('level',(d,from)=>{if(!N.room||from!==N.room.host||isHost()||!DS.levels.has(d.lv))return;beginRun(d.lv,N.lob.df,d.seed)});
/** Host: „Menu” na ekranie ukończenia = cała drużyna wraca do lobby (pokój zostaje). */
function toLobbyAll(){
  if(!isHost())return;
  flushNow();send({k:'lobby'});N.inRun=false;try{N.room.lock(false)}catch(e){}backToLobby();
}
handle('lobby',(d,from)=>{if(!N.room||from!==N.room.host||isHost())return;N.inRun=false;if(S.G)S.G.coopEnded=true;backToLobby()});
DS.net.nextLevel=nextLevel;DS.net.toLobbyAll=toLobbyAll;

/* ---------- powalenie i podnoszenie ---------- */
/** combat.die w co-op: zamiast końca gry gracz leży (G.dead), czeka na kumpla albo następną falę. */
DS.net.onDowned=()=>{
  N.down=true;announce('POWALONY!','Kumpel podniesie cię klawiszem '+DS.input.keyFor('use')+', albo wrócisz w następnej fali');
  sendIn();
};
function reviveLocal(frac,txt){
  const G=S.G;if(!G||!G.dead)return;
  G.dead=false;G.deadT=0;G.hp=Math.max(1,Math.round(G.maxHp*frac));P.pos.y=0;P.vy=0;N.down=false;
  announce('WSTAJESZ!',txt||'');sfx('heal');DS.bus.emit('heal',{amount:G.hp,source:'revive'});sendIn();
}
handle('rev',(d,from,r)=>{if(!r||!N.inRun||!r.inRun)return;const G=S.G;if(G&&G.dead&&!G.coopEnded)reviveLocal(BACK_HP,nameOf(from)+' postawił cię na nogi')});

let tipEl=null;
function tip(t){
  if(!tipEl){tipEl=document.createElement('div');tipEl.id='coopTip';tipEl.className='coopTip';tipEl.setAttribute('role','status');$('#hud').append(tipEl)}
  if(tipEl.textContent!==t)tipEl.textContent=t;tipEl.hidden=!t;
}
/** Podnoszenie: przytrzymaj „use” przy leżącym koledze (≤2 m) przez 3 s. */
function reviveTick(dt){
  const G=S.G;
  if(G.dead){tip(N.down?'Leżysz. Poczekaj na pomoc albo na następną falę.':'');N.revT=0;return}
  let best=null,bd=REVIVE_R;
  for(const r of N.players.values()){r.revCd=Math.max(0,r.revCd-dt);if(!r.inRun||!r.down||r.revCd>0)continue;const d=Math.hypot(r.pos.x-P.pos.x,r.pos.z-P.pos.z);if(d<=bd){bd=d;best=r}}
  if(!best){N.revT=0;tip('');return}
  if(DS.input.isDown('use')&&!G.uiPause)N.revT+=dt;else N.revT=0;
  const pct=Math.min(100,Math.round(N.revT/REVIVE_TIME*100));
  tip('Przytrzymaj '+DS.input.keyFor('use')+': podnieś '+nameOf(best.id)+(N.revT>0?' ('+pct+'%)':''));
  if(N.revT>=REVIVE_TIME){N.revT=0;best.revCd=2;send({k:'rev'},best.id);announce('PODNIOSŁEŚ KUMPLA!',nameOf(best.id)+' wraca do gry');sfx('heal')}
}

/* ---------- pętla ---------- */
let downT=0;
DS.bus.on('update',dt=>{
  if(!DS.net.active())return;
  const G=S.G;if(!G||G.coopEnded)return;
  if(G.invulnT>0)G.invulnT-=dt;
  inT-=dt;if(inT<=0){inT=1/IN_HZ;sendIn()}
  flushHits();
  for(const r of N.players.values())if(r.inRun){if(!r.avatar)buildAvatar(r);updateAvatar(r,dt)}
  reviveTick(dt);
  hudUpdate(dt);
  if(isHost()){
    hostTick(dt,SNAP_HZ);
    lockTick();
    if(DS.net.allDown()){downT+=dt;if(downT>1.5){downT=0;hostEnd('down')}}else downT=0;
    setBanner(null);
  }else{
    // brak snapshotów > 1,5 s: host w tle (karta zminimalizowana) albo przerwa w sieci; rozłączenie ma własny komunikat
    const quiet=performance.now()-(N.lastSnapAt||0)>1500;
    setBanner(N.reconnecting?'Rozłączono — próbuję wrócić…':quiet?'Host zminimalizował grę — wrogowie stoją, czekamy na hosta':null);
  }
});
DS.net.updateReplicas=updateReplicas;

/* ---------- dołączanie w trakcie runu ---------- */
// Pokój jest otwarty między falami (fala czysta, odliczanie do następnej) i zamknięty w trakcie fali: dołączający nie wpada w środek
// walki, a skalowanie trudności (DS.net.rescale) i tak liczy się od następnej fali. Relay sam odrzuca piątego gracza (ROOM_FULL).
let lockT=0;
function lockTick(){
  const G=S.G,room=N.room;if(!room)return;
  lockT-=1/60;if(lockT>0)return;
  let alive=0;for(const e of G.enemies)if(e.alive)alive++;
  const want=G.queue>0||alive>0||G.wave===0;
  if(room.locked!==want){lockT=1;try{room.lock(want)}catch(e){}}
}
/** Host: nowy gracz w pokoju w trakcie runu dostaje pełny stan (`full`) i staje na punkcie startu z pełnym HP. */
hooks.onJoin=r=>{
  feed(nameOf(r.id)+' dołącza do pokoju');
  if(!isHost()||!N.inRun||!S.G)return;
  r.inRun=true;r.outed=false;r.lastIn=performance.now();
  send(buildFull(),r.id);
};
handle('hi',(d,from,r)=>{   // klient po powrocie połączenia
  if(!isHost()||!N.inRun||!r||!S.G)return;
  const now=performance.now();if(now-(r.fullAt||0)<2000)return;r.fullAt=now;
  r.inRun=true;r.outed=false;r.lastIn=now;send(buildFull(),from);
});
handle('full',(d,from)=>{
  if(!N.room||from!==N.room.host||isHost()||!DS.levels.has(d.lv))return;
  const resync=N.inRun&&S.mode==='game'&&S.G&&!S.G.coopEnded&&world.level&&world.level.id===d.lv;
  N.lob.df=d.df;
  if(!resync){beginRun(d.lv,d.df,d.seed);feed('Dołączasz do gry: fala '+d.w)}
  else feed('Połączenie wróciło');
  applyFull(d);
});
hooks.onReconnect=ok=>{
  if(!ok){feed('Rozłączono — próbuję wrócić…');return}
  feed('Połączenie wróciło');
  if(N.inRun&&N.room&&!isHost())send({k:'hi'},N.room.host);
};

/* ---------- zawołania ---------- */
handle('call',(d,from,r)=>{
  if(!r||!N.inRun||!r.inRun)return;
  r.callT=3;r.callTxt=CALLS[d.c];feed(nameOf(from)+': '+CALLS[d.c],COLOR_CSS[colorOf(from)]);sfx('tick',1100);
});

/* ---------- host w tle: symulacja na setInterval ---------- */
// Karta w tle nie dostaje requestAnimationFrame, więc host przestałby liczyć wrogów wszystkim. Gdy document.hidden, krok gry idzie z setInterval
// (20 Hz, bez renderu). Przeglądarka może dławić timery kart w tle (Chrome: zwykle do 1/s bez dźwięku), wtedy klienci widzą ostrzeżenie.
let bgTimer=null,bgLast=0;
function bgStep(){
  if(!document.hidden||!DS.net.isHost()){clearInterval(bgTimer);bgTimer=null;return}
  const now=performance.now(),dt=Math.min(.1,(now-bgLast)/1000);bgLast=now;
  const G=S.G;if(S.mode!=='game'||!G||G.paused||!(dt>0))return;
  const t0=performance.now();updateGame(dt);const ms=performance.now()-t0;
  N.stats.bgSteps=(N.stats.bgSteps||0)+1;N.stats.bgMs=+(((N.stats.bgMs||ms)*.9+ms*.1).toFixed(3));
}
function onVis(){if(document.hidden&&DS.net.isHost()&&!bgTimer){bgLast=performance.now();bgTimer=setInterval(bgStep,50)}}
document.addEventListener('visibilitychange',onVis);
DS.net.checkHidden=onVis;   // testy: po podmianie document.hidden

/* ---------- koniec runu ---------- */
function myRow(){const G=S.G;return [N.me,G.kills|0,G.heads|0,Math.round(G.earned||0)]}
function rows(){const out=[myRow()];for(const r of N.players.values())if(r.inRun||r.seen)out.push([r.id,r.kl,r.hd,r.zd]);return out}
function hostEnd(reason){
  if(!isHost()||!N.inRun)return;
  const s=rows(),w=S.G.wave|0;
  // ostatni snapshot (zdarzenia z tej klatki), potem koniec
  hostTick(1e9,SNAP_HZ);
  send({k:'end',r:reason,w,s});
  showEnd(reason,s,w);
}
handle('end',(d,from)=>{if(!N.room||from!==N.room.host||!N.inRun)return;
  const s=d.s.filter(x=>Array.isArray(x)&&x.length===4&&typeof x[0]==='string'&&x.slice(1).every(n=>Number.isInteger(n)&&n>=0&&n<1e9));
  showEnd(d.r,s,d.w)});
handle('out',(d,from,r)=>{if(!r)return;r.inRun=false;r.outed=true;destroyAvatar(r);if(N.inRun){announce(nameOf(from).toUpperCase()+' WYSZEDŁ','Gra toczy się dalej');feed(nameOf(from)+' wychodzi do lobby')}});

let lobbyBtn=null;
function showEnd(reason,s,w){
  const G=S.G;if(!G)return;
  G.coopEnded=true;G.dead=true;G.paused=true;N.inRun=false;S.mouseDown=false;tip('');
  if(isHost())try{N.room.lock(false)}catch(e){}
  try{document.exitPointerLock()}catch(e){}
  if((G.wave|0)>save.best)save.best=G.wave;persist();
  submitRun(G);
  {
    $('#overCap').textContent=reason==='quit'?'Host zakończył grę.':reason==='host'?errText('HOST_LEFT'):'Cała ekipa leży. Fala '+w+'.';
    const st=$('#overStats');clear(st);
    st.append(h('span',null,'Fala'),h('span',null,String(w)),h('span',null,'Punkty (Ty)'),h('span',null,String(G.score||0)));
    const tb=h('table',{class:'coopStats'},h('thead',null,h('tr',null,h('th',null,'Gracz'),h('th',null,'Zabici'),h('th',null,'Headshoty'),h('th',null,'ZD'))),
      h('tbody',null,s.map(x=>h('tr',null,h('td',null,nameOf(x[0])),h('td',null,String(x[1])),h('td',null,String(x[2])),h('td',null,String(x[3]))))));   // nazwy wyłącznie jako tekst
    st.append(tb);
    $('#oRevive').hidden=true;$('#oAgain').hidden=true;
    if(!lobbyBtn){lobbyBtn=h('button',{class:'btn red',id:'oLobby',type:'button',onclick:()=>backToLobby()},'Wróć do lobby');$('#oAgain').parentNode.prepend(lobbyBtn)}
    lobbyBtn.hidden=false;
    show('scrOver');fillOver(G);
  }
  changed();
}
function backToLobby(){toMenuMode();showLobby()}

/** Pauza -> „Wyjdź do menu” w co-op: host kończy run wszystkim, klient wychodzi do lobby (gra innych trwa). */
DS.net.quitRun=()=>{
  if(isHost()){hostEnd('quit');return}
  send({k:'out'});N.inRun=false;backToLobby();
};

/* ---------- sprzątanie ---------- */
DS.bus.on('levelEnd',()=>{
  for(const r of N.players.values())destroyAvatar(r);
  clearReplicas();pend=[];downT=0;tip('');hudClear();
  if(prevDiff!==null){opt.difficulty=prevDiff;prevDiff=null}
  if(lobbyBtn){lobbyBtn.hidden=true;$('#oAgain').hidden=false}
});
hooks.onPlayerGone=r=>{destroyAvatar(r);if(N.inRun&&r.inRun){announce(nameOf(r.id).toUpperCase()+' WYSZEDŁ','Gra toczy się dalej');feed(nameOf(r.id)+' opuszcza pokój')}};
hooks.beforeLeave=()=>{if(N.inRun){if(isHost())hostEnd('quit');else send({k:'out'})}};
/** JuicyJuicy przekazał rolę hosta (stary host wyszedł): bez migracji stanu run kończy się u wszystkich, drużyna wraca do lobby z nowym hostem. */
hooks.onHostChange=id=>{
  if(!N.inRun)return;
  N.inRun=false;if(S.G)S.G.coopEnded=true;
  if(N.room&&N.room.isHost())try{N.room.lock(false)}catch(e){}
  backToLobby();
  setMsg('Host wyszedł z gry — run zakończony. Nowy host: '+(id===N.me?'Ty':nameOf(id))+'.',true);
};
hooks.onClosed=(reason,wasRun)=>{
  if(wasRun&&S.G&&S.mode==='game')backToLobby();
};
/** Do testów / konsoli. */
DS.net.debug=()=>({room:N.room?N.room.code:null,me:N.me,host:isHost(),inRun:N.inRun,players:N.players.size,
  avatars:[...N.players.values()].filter(r=>r.avatar).length,replicas:replicaCount(),stats:Object.assign({},N.stats)});
DS.net.hostStart=hostStart;
DS.net.lobbyState=()=>({lob:JSON.parse(JSON.stringify(N.lob)),ready:allReady()});
