// Globalna tablica wyników JuicyJuicy (window.juicy.scores, snippet w index.html).
// Wynik runu = fala*1000 + zabici*10 + headshoty*5. Zawsze order:'high', format:'points' (pierwszy wynik ustala tablicę).
// Poza JuicyJuicy snippet działa na localStorage (cloud:false), więc UI działa także lokalnie.
import {$} from '../core/util.js';
import {save,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {h,clear} from './dom.js';
import {L} from '../core/i18n.js';
import {fmtNum} from '../core/fmt.js';

const OPTS={order:'high',format:'points'};
const scores=()=>window.juicy&&window.juicy.scores;

/** Punkty runu (liczba całkowita). */
export function runScore(G){
  if(!G)return 0;
  return Math.max(0,Math.floor((G.wave|0)*1000+(G.kills|0)*10+(G.heads|0)*5));
}
export const fmt=fmtNum;

/** Wysyła wynik do JuicyJuicy. Zwraca obietnicę {cloud,best,rank,improved} albo null (błąd/brak snippetu); nigdy nie odrzuca. */
export function sendScore(score){
  const sc=scores();
  if(!sc||!(score>0))return Promise.resolve(null);
  try{return Promise.resolve(sc.submit(score,OPTS)).catch(()=>null)}catch(e){return Promise.resolve(null)}
}

/**
 * Koniec runu (śmierć albo wyjście z trwającego runu). Wywoływane z combat.die() i z 'levelEnd'.
 * Aktualizuje rekord lokalny i wysyła wynik (fala >= 1). Wynik nie jest wysyłany drugi raz, jeśli nie jest wyższy
 * (np. po Drugiej Szansie run trwa dalej i może zakończyć się wyższym wynikiem).
 */
export function submitRun(G){
  if(!G||!(G.wave>=1))return null;
  const score=runScore(G);if(!(score>0))return null;
  G.score=score;
  if(score>save.bestScore){save.bestScore=score;persist()}
  if(G.hsSent!=null&&score<=G.hsSent)return G.hsResult||null;
  G.hsSent=score;
  G.hsResult=sendScore(score).then(r=>{G.hsRes=r;return r});
  return G.hsResult;
}
DS.bus.on('levelEnd',()=>{try{submitRun(S.G)}catch(e){}});

/**
 * Jednorazowe uzupełnienie tablicy starym rekordem. To jedyna droga: gra nie może czytać cudzych przeglądarek,
 * więc tablica zapełnia się dopiero wtedy, gdy gracze otwierają nową wersję. Stary zapis zna tylko najlepszą falę (save.best),
 * stąd max(bestScore, best*1000). Flagę save.hsSynced ustawiamy dopiero po cloud:true; gracz niezalogowany (cloud:false)
 * spróbuje ponownie przy następnym starcie.
 */
export async function syncOldBest(){
  if(save.hsSynced)return 'done';
  const score=Math.max(save.bestScore|0,(save.best|0)*1000);
  if(!(score>0)){save.hsSynced=true;persist();return 'empty'}
  if(score>save.bestScore){save.bestScore=score;persist()}
  const r=await sendScore(score);
  if(r&&r.cloud===true){save.hsSynced=true;persist();return 'synced'}
  return 'retry';
}
setTimeout(()=>{syncOldBest().catch(()=>{})},400);

/* ---- tablica: pobieranie i rysowanie ---- */
let board=null,boardState='idle';   // idle|loading|ok|error
const nameOf=(e,cloud)=>(!cloud&&e.me&&e.name==='You')?L('Ty','You'):String(e.name==null?'':e.name);

function row(e,cloud){
  return h('tr',{class:'hsRow'+(e.me?' me':'')},
    h('td',{class:'hsRank'},'#'+e.rank),
    h('td',{class:'hsName'},nameOf(e,cloud),e.me&&cloud?h('em',null,L(' (Ty)',' (you)')):null),   // textContent przez węzeł tekstowy, nigdy innerHTML
    h('td',{class:'hsScore'},fmt(e.score)));
}

/** Rysuje zawartość ekranu Ranking z danych `b` (wynik top()) lub stanu. */
export function renderBoard(box,b,state,limit){
  clear(box);
  if(state==='loading'){box.append(h('p',{class:'hsMsg',role:'status'},L('Ładowanie rankingu…','Loading leaderboard…')));return}
  if(state==='error'){box.append(h('p',{class:'hsMsg err',role:'alert'},L('Nie udało się pobrać rankingu. Sprawdź połączenie i spróbuj ponownie.','Could not load the leaderboard. Check your connection and try again.')),
    h('button',{class:'btn paper sm',type:'button',onclick:()=>renderRanking()},L('Spróbuj ponownie','Try again')));return}
  if(!b)return;
  const cloud=!!b.cloud;
  if(cloud&&b.signedIn===false){
    box.append(h('p',{class:'hsMsg'},L('Zaloguj się na JuicyJuicy, żeby trafić do rankingu.','Sign in to JuicyJuicy to get on the leaderboard.')));
  }
  if(!cloud){
    box.append(h('p',{class:'hsMsg'},L('Zaloguj się na JuicyJuicy, żeby trafić do rankingu.','Sign in to JuicyJuicy to get on the leaderboard.')),
      h('p',{class:'hsLocal'},L('Twój rekord lokalny: ','Your local record: '),h('b',null,fmt(Math.max(save.bestScore|0,b.me?b.me.score:0))+L(' pkt',' pts')),L(' · rekord fali: ',' · best wave: '),h('b',null,String(save.best|0))));
  }
  const list=(b.entries||[]).slice(0,limit||10);
  if(!list.length){box.append(h('p',{class:'hsMsg'},L('Brak wyników. Zagraj i zostań pierwszy na tablicy.','No scores yet. Play and be the first on the board.')));return}
  const body=h('tbody',null,list.map(e=>row(e,cloud)));
  box.append(h('table',{class:'hsTable'},
    h('caption',{class:'sr'},L('Najlepsze wyniki','Top scores')),
    h('thead',null,h('tr',null,h('th',{scope:'col'},L('Miejsce','Rank')),h('th',{scope:'col'},L('Gracz','Player')),h('th',{scope:'col'},L('Punkty','Points')))),body));
  // własna pozycja poza top 10
  if(b.me&&!list.some(e=>e.me)){
    box.append(h('div',{class:'hsMe'},L('Twoja pozycja: ','Your rank: '),h('b',null,'#'+b.me.rank),' · ',h('b',null,fmt(b.me.score)+L(' pkt',' pts'))));
  }
}

function fetchTop(n){
  const sc=scores();
  if(!sc)return Promise.reject(new Error('no-scores'));
  return Promise.resolve(sc.top(n));
}

/** Ekran Ranking: top 10. */
export function renderRanking(){
  const box=$('#hsBox');if(!box)return Promise.resolve();
  boardState='loading';renderBoard(box,null,'loading');
  const my=++seq;
  return fetchTop(10).then(b=>{if(my!==seq)return;board=b;boardState='ok';renderBoard(box,b,'ok',10);box.setAttribute('aria-busy','false')},
    ()=>{if(my!==seq)return;boardState='error';renderBoard(box,null,'error')});
}
let seq=0;

/** Mała ramka TOP 3 w menu głównym (pomija się po cichu, gdy brak danych). */
export function renderTop3(){
  const box=$('#hsTop3');if(!box)return Promise.resolve();
  const my=++seq3;
  return fetchTop(3).then(b=>{
    if(my!==seq3)return;
    const list=(b.entries||[]).slice(0,3);
    clear(box);
    if(!list.length){box.hidden=true;return}
    box.hidden=false;
    box.append(h('b',{class:'hsT3h'},'TOP 3'),h('ol',null,list.map(e=>h('li',{class:e.me?'me':''},
      h('span',{class:'n'},nameOf(e,!!b.cloud)),h('span',{class:'p'},fmt(e.score))))));
  },()=>{if(my===seq3){box.hidden=true}});
}
let seq3=0;

/** Napis „NOWY REKORD! #rank” i punkty na ekranie końca gry. */
export function fillOver(G){
  const box=$('#overNew');if(!box)return;
  box.hidden=true;clear(box);
  const p=G.hsResult;if(!p)return;
  p.then(r=>{
    if(!r||S.G!==G||!r.improved)return;
    box.hidden=false;
    box.append(h('b',null,L('NOWY REKORD!','NEW RECORD!')),r.cloud&&r.rank?h('span',null,' #'+r.rank):null);
  });
}
