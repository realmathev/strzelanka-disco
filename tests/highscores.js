// Ranking JuicyJuicy: wynik runu, wysyłka przy śmierci i wyjściu, jednorazowe uzupełnienie ze starego zapisu (best:7 -> 7000),
// ekran Ranking (stany, wyróżnienie własnego wiersza, nazwy tylko jako tekst), ramka TOP 3, ekran końca gry.
// Dwa kroki jak oldsave.js: krok 1 ustawia stary zapis w localStorage (zwraca 'SETUP DONE, reload'), po przeładowaniu krok 2 sprawdza.
// Najprościej: node tests/cdp-run.js highscores.js 4202   (opcjonalnie --size=375x667 i --size=768x1024)
(async()=>{
const K='discoStrzelnica.save.v1',MARK='__qa_hs_marker';
if(!sessionStorage.getItem(MARK)){
  localStorage.clear();
  localStorage.setItem('discoStrzelnica.opt.v1','{"level":"remiza"}');
  localStorage.setItem(K,JSON.stringify({coins:500,keys:1,weapons:['pistol'],skin:'fabryczny',skins:['fabryczny'],best:7,kills:3}));
  sessionStorage.setItem(MARK,'1');return 'SETUP DONE, reload'}
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,R={},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d?' ('+d+')':'');
const HS=await import('/js/ui/highscores.js');
const sv=Q.sv,$=s=>document.querySelector(s),OPTS={order:'high',format:'points'};
const sc=window.juicy.scores,origSubmit=sc.submit,origTop=sc.top;

// --- stary zapis: 7 -> 7000, snippet lokalnie (cloud:false) = flaga NIE ustawiona, kolejna próba
ok('hs.snippetPresent',!!(window.juicy&&sc&&typeof sc.submit==='function'&&typeof sc.top==='function'));
ok('hs.oldBestKept',sv.save.best===7&&sv.save.kills===3&&sv.save.coins===500);
ok('hs.migratedDefaults',sv.save.bestScore===7000&&sv.save.hsSynced===false,JSON.stringify([sv.save.bestScore,sv.save.hsSynced]));
const loc=JSON.parse(localStorage.getItem('juicyjuicy:best')||'null');
ok('hs.oldBestSubmittedLocal(7000)',!!loc&&loc.score===7000&&loc.order==='high'&&loc.format==='points',JSON.stringify(loc));
let calls=[];
sc.submit=(s,o)=>{calls.push([s,o]);return Promise.resolve({cloud:false,best:s,rank:null,improved:false})};
ok('hs.syncRetryWhenSignedOut',(await HS.syncOldBest())==='retry'&&calls.length===1&&calls[0][0]===7000&&sv.save.hsSynced===false);
sc.submit=(s,o)=>{calls.push([s,o]);return Promise.resolve({cloud:true,best:s,rank:5,improved:true})};
calls=[];
ok('hs.syncCloudSetsFlag',(await HS.syncOldBest())==='synced'&&calls.length===1&&calls[0][0]===7000&&JSON.stringify(calls[0][1])===JSON.stringify(OPTS)&&sv.save.hsSynced===true);
ok('hs.flagPersisted',JSON.parse(localStorage.getItem(K)).hsSynced===true&&JSON.parse(localStorage.getItem(K)).bestScore===7000);
calls=[];await HS.syncOldBest();ok('hs.syncOnlyOnce',calls.length===0);

// --- wzór wyniku
ok('hs.runScore',HS.runScore({wave:3,kills:20,heads:4})===3220&&HS.runScore({wave:0,kills:0,heads:0})===0&&Number.isInteger(HS.runScore({wave:1,kills:1,heads:1})));

// --- śmierć: wysyłka od razu, ekran końca z punktami i „NOWY REKORD! #2”
calls=[];
sc.submit=(s,o)=>{calls.push([s,o]);return Promise.resolve({cloud:true,best:s,rank:2,improved:true})};
await Q.start();let G=S.G;Q.frames(5);
G.wave=3;G.kills=20;G.heads=4;Q.cmb.hurt(99999);
ok('hs.deathSubmits',G.dead&&calls.length===1&&calls[0][0]===3220&&JSON.stringify(calls[0][1])===JSON.stringify(OPTS),JSON.stringify(calls));
R['hs.bestScoreKeepsMax']=sv.save.bestScore===7000?'PASS':'FAIL ('+sv.save.bestScore+')';
await Q.sleep(1800);
ok('hs.overShown',Q.vis()==='scrOver',Q.vis());
const st=$('#overStats').innerText;
ok('hs.overShowsPoints',/Punkty\s*3\s?220/.test(st)&&/Rekord punktowy\s*7\s?000/.test(st)&&/Rekord fali/.test(st),st.replace(/\s+/g,' '));
ok('hs.overNewRecord',!$('#overNew').hidden&&/NOWY REKORD!\s*#2/.test($('#overNew').innerText),$('#overNew').innerText);
$('#oMenu').click();await Q.sleep(120);
ok('hs.noDoubleSubmitOnMenu',calls.length===1,String(calls.length));
// nowy rekord punktowy lokalny
await Q.start();G=S.G;Q.frames(3);G.wave=9;G.kills=30;G.heads=2;Q.cmb.hurt(99999);
ok('hs.newLocalBest',sv.save.bestScore===9310&&calls.length===2&&calls[1][0]===9310,sv.save.bestScore+' '+calls.length);
await Q.sleep(1800);
$('#oMenu').click();await Q.sleep(100);

// --- wyjście do menu z trwającego runu; fala 0 nie jest wysyłana
calls=[];
await Q.start();G=S.G;Q.frames(3);G.wave=0;G.kills=0;Q.flow.quitToMenu();await Q.sleep(100);
ok('hs.waveZeroNotSent',calls.length===0,JSON.stringify(calls));
await Q.start();G=S.G;Q.frames(3);G.wave=2;G.kills=5;G.heads=1;Q.flow.quitToMenu();await Q.sleep(100);
ok('hs.quitSubmits',calls.length===1&&calls[0][0]===2055&&JSON.stringify(calls[0][1])===JSON.stringify(OPTS),JSON.stringify(calls));

// --- ekran Ranking
sc.submit=origSubmit;
const go=()=>{document.querySelector('#scrMenu [data-go=scrRanking]').click()};
ok('hs.menuHasRankingButton',!!document.querySelector('#scrMenu [data-go=scrRanking]'));
window.__xss=0;const oa=window.alert;window.alert=()=>{window.__xss++};
const top=(f)=>{sc.top=f};
// ładowanie
top(()=>new Promise(()=>{}));go();await Q.sleep(60);
ok('hs.ranking.screen',Q.vis()==='scrRanking',Q.vis());
ok('hs.ranking.loading',/Ładowanie/.test($('#hsBox').innerText),$('#hsBox').innerText);
// Esc wraca do menu
Q.key('Escape');await Q.sleep(60);ok('hs.ranking.escBack',Q.vis()==='scrMenu',Q.vis());
// brak wyników
top(()=>Promise.resolve({cloud:true,signedIn:true,order:'high',format:'points',entries:[],me:null}));go();await Q.sleep(80);
ok('hs.ranking.empty',/Brak wyników/.test($('#hsBox').innerText),$('#hsBox').innerText);
// niezalogowany (cloud:true, signedIn:false)
top(()=>Promise.resolve({cloud:true,signedIn:false,order:'high',format:'points',entries:[{rank:1,name:'Ala',score:5000,me:false}],me:null}));go();await Q.sleep(80);
ok('hs.ranking.signedOutPrompt',/Zaloguj się na JuicyJuicy, żeby trafić do rankingu/.test($('#hsBox').innerText)&&/Ala/.test($('#hsBox').innerText));
// lokalny (cloud:false, „You” -> „Ty”) z lokalnym rekordem
top(()=>origTop.call(sc,10));localStorage.setItem('juicyjuicy:best',JSON.stringify({score:9310,order:'high',format:'points'}));go();await Q.sleep(80);
const t0=$('#hsBox').innerText;
ok('hs.ranking.localYouToTy',/Ty/.test($('#hsBox .hsName').textContent)&&!/You/.test(t0),t0.replace(/\s+/g,' '));
ok('hs.ranking.localPromptAndRecord',/Zaloguj się na JuicyJuicy/.test(t0)&&/9\s?310/.test(t0)&&/rekord fali/.test(t0),t0.replace(/\s+/g,' '));
// XSS + własny wiersz + pozycja poza top 10
const XSS='<img src=x onerror=alert(1)>';
const ent=[];for(let i=1;i<=10;i++)ent.push({rank:i,name:i===2?XSS:'Gracz '+i,score:20000-i*100,me:i===4});
top(()=>Promise.resolve({cloud:true,signedIn:true,order:'high',format:'points',entries:ent,me:{rank:4,score:19600}}));go();await Q.sleep(100);
const rows=[...document.querySelectorAll('#hsBox tbody tr')];
ok('hs.ranking.tenRows',rows.length===10,String(rows.length));
ok('hs.ranking.xssAsText',rows[1].querySelector('.hsName').textContent===XSS&&!document.querySelector('#hsBox img')&&!document.querySelector('#hsBox [onerror]')&&window.__xss===0,rows[1].innerHTML);
ok('hs.ranking.meRow',rows[3].classList.contains('me')&&rows.filter(r=>r.classList.contains('me')).length===1&&/\(Ty\)/.test(rows[3].innerText));
ok('hs.ranking.noMeBelowWhenInTop',!document.querySelector('#hsBox .hsMe'));
const ent2=ent.map(e=>({...e,me:false}));
top(()=>Promise.resolve({cloud:true,signedIn:true,order:'high',format:'points',entries:ent2,me:{rank:37,score:1234}}));go();await Q.sleep(100);
ok('hs.ranking.ownPositionOutsideTop10',/Twoja pozycja:\s*#37/.test($('#hsBox .hsMe').innerText)&&/1\s?234/.test($('#hsBox .hsMe').innerText),$('#hsBox').innerText.slice(-80));
// błąd / timeout
top(()=>Promise.reject(Object.assign(new Error('x'),{code:'TIMEOUT'})));go();await Q.sleep(100);
ok('hs.ranking.error',/Nie udało się pobrać rankingu/.test($('#hsBox').innerText)&&!!$('#hsBox button'),$('#hsBox').innerText);
// nawigacja klawiaturą: fokus w ekranie rankingu
ok('hs.ranking.focusInScreen',$('#scrRanking').contains(document.activeElement),String(document.activeElement&&document.activeElement.id));
ok('hs.ranking.noHorizontalOverflow',document.documentElement.scrollWidth<=innerWidth+1&&$('#scrRanking .wrap').scrollWidth<=$('#scrRanking .wrap').clientWidth+1,innerWidth+' '+document.documentElement.scrollWidth);

// --- TOP 3 w menu
Q.key('Escape');await Q.sleep(60);
top(()=>Promise.resolve({cloud:true,signedIn:true,order:'high',format:'points',entries:[{rank:1,name:'Najdłuższa nazwa gracza jaka tylko się da wymyślić na tablicy',score:123456,me:false},{rank:2,name:'B',score:5000,me:true},{rank:3,name:XSS,score:4000,me:false}],me:null}));
const m=$('#scrMenu');m.hidden=true;(await import('/js/ui/screens.js')).show('scrMenu');await Q.sleep(100);
const t3=$('#hsTop3');
ok('hs.top3.visible',!t3.hidden&&t3.querySelectorAll('li').length===3&&!t3.querySelector('img'),t3.innerText);
const box=t3.getBoundingClientRect();
ok('hs.top3.fitsViewportWidth',box.right<=innerWidth&&box.left>=0&&document.documentElement.scrollWidth<=innerWidth+1&&$('#scrMenu').scrollWidth<=$('#scrMenu').clientWidth+1,JSON.stringify([box.left,box.right,innerWidth,$('#scrMenu').scrollWidth,$('#scrMenu').clientWidth]));
top(()=>Promise.resolve({cloud:true,signedIn:true,entries:[],me:null}));
(await import('/js/ui/screens.js')).show('scrMenu');await Q.sleep(60);
ok('hs.top3.hiddenWhenEmpty',$('#hsTop3').hidden);

sc.submit=origSubmit;sc.top=origTop;window.alert=oa;
ok('hs.noAlertFired',window.__xss===0);
ok('console.noErrorsOrWarnings',Q.errs.length===0,Q.errs.slice(0,3).join(' | '));
sessionStorage.removeItem(MARK);
return R})()
