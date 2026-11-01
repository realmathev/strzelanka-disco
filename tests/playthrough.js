// Pomocnik przejścia "jak gracz" (QA, pełny przegląd). Wczytanie na ŻYWEJ grze (po kliknięciu Graj, prawdziwa pętla rAF):
//   (0,eval)(await (await fetch('/tests/playthrough.js')).text())  -> window.PT
// PT.state()      stan: poziom, fala, ekrany, pauza, level-up otwarty?, wrogowie, boss, błędy konsoli
// PT.spawnBoss()  teleportuje gracza, ustawia falę 5 (bossa) i spawnuje bossa poziomu; zwraca {type,pos,hp}; zrzut robi się osobno
// PT.killBoss()   zabija bossa obrażeniami (jak w skryptach poziomów), NIE zamyka ekranu level-up (prawdziwy przebieg)
// PT.neutralize() zabija zwykłych wrogów (żeby nie przeszkadzali w zrzutach)
(async()=>{
const imp=p=>import('/js/'+p);
const [st,pl,wv,cb,mg]=await Promise.all(['core/state.js','player/player.js','game/waves.js','game/combat.js','enemies/manager.js'].map(imp));
const {S}=st,P=pl.P;
if(!window.__ptErrs){window.__ptErrs=[];const oe=console.error,ow=console.warn;
  console.error=(...a)=>{__ptErrs.push('E:'+a.join(' '));oe.apply(console,a)};console.warn=(...a)=>{__ptErrs.push('W:'+a.join(' '));ow.apply(console,a)};
  addEventListener('error',e=>__ptErrs.push('ERR:'+e.message+' @'+e.filename+':'+e.lineno));addEventListener('unhandledrejection',e=>__ptErrs.push('REJ:'+e.reason))}
const vis=()=>[...document.querySelectorAll('.screen')].filter(s=>!s.hidden).map(s=>s.id).join(',');
const PT={
  state(){const G=S.G,u=DS.progression&&DS.progression.ui;const b=G&&G.enemies.find(e=>e.boss&&e.alive);
    return {mode:S.mode,level:DS.levels.get(window.__lvId||'')?window.__lvId:undefined,optLevel:JSON.parse(localStorage.getItem('discoStrzelnica.opt.v1')||'{}').level,wave:G&&G.wave,hp:G&&Math.round(G.hp),paused:G&&G.paused,screens:vis(),levelupOpen:!!(u&&u.isOpen()),
      enemies:G&&G.enemies.filter(e=>e.alive).length,boss:b?{type:b.type,hp:Math.round(b.hp),max:b.maxHp,x:+b.g.position.x.toFixed(1),z:+b.g.position.z.toFixed(1)}:null,
      levelWon:G&&G.levelWon,levelsDone:JSON.parse(localStorage.getItem('discoStrzelnica.save.v1')||'{}').levelsDone,errs:__ptErrs.slice()}},
  neutralize(){const G=S.G;G.enemies.forEach(e=>{if(!e.boss){e.alive=false;e.hp=0}});G.queue=0},
  spawnBoss(){const G=S.G;const L=window.__ptLevel;G.hp=G.maxHp;G.wave=4;wv.nextWave();G.queue=0;const b=G.enemies.find(e=>e.boss);
    if(b){const bp=b.g.position;P.pos.set(bp.x,0,bp.z+16);P.yaw=0;P.pitch=-.05;}
    return b?{type:b.type,name:b.name,x:+b.g.position.x.toFixed(1),z:+b.g.position.z.toFixed(1),hp:b.hp}:null},
  killBoss(){const G=S.G;const b=G.enemies.find(e=>e.boss&&e.alive);if(!b)return 'brak bossa';let n=0;
    while(b.alive&&n<20){cb.damageEnemy(b,1e6,false,new THREE.Vector3(b.g.position.x,1.2,b.g.position.z));n++}return 'zabity po '+n},
};
window.PT=PT;return 'PT ready'})()
