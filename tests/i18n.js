// Test językowy: skanuje tekst widoczny na każdym ekranie. Uruchamiany w języku strony (opt.lang):
//   node tests/cdp-run.js i18n.js 4204 --gpu --lang=en   (tryb EN: szuka resztek polskiego)
//   node tests/cdp-run.js i18n.js 4204 --gpu --lang=pl   (tryb PL: sprawdza, że polskie teksty zostały bez zmian)
// Zbiorczo (EN 375/768/1280 + PL + przepełnienie): node tests/i18n-all.js 4204
(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const lang=document.documentElement.lang,R={lang},leftovers=[];
const scr=await import('/js/ui/screens.js'),opts=await import('/js/ui/options.js'),{S}=await import('/js/core/state.js');
const {save}=await import('/js/core/save.js'),flow=await import('/js/game/flow.js'),loop=await import('/js/game/loop.js'),cmb=await import('/js/game/combat.js');
const ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d?' ('+d+')':'');
// nazwy własne ze świata gry, które zostają po polsku w obu językach
const KEEP=/Heniek|Heńk\w*|Zdzich\w*|Spluwa|Halin\w*|Zadupie|Dolne|Sołtys|Mietek|Zdzisiek|Halinka_z_Remizy|Maluch|Kremówka|JuicyJuicy|Strzelnica|Bangers/gi;
const DIA=/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const WORDS=/(^|[^A-Za-z])(się|Graj|Opcje|Wróć|Sklep|Kasyno|Skrzynki|Klucze|Fala|Fali|Wrogowie|Pauza|Wznów|Rekord|Poziom|Trudność|Normalny|Łatwy|Trudny|Zabici|Nagroda|Gracz|Gotowy|Ekwipunek|Kup|Posiadasz|Misja|zmień|Dźwięk|Muzyka|Efekty|Sterowanie|Dostępność|Włączone|Wyłączone|Nie|Tak|jest|nie|dla|oraz|albo|lub|jak|przez|Zagraj|Jeszcze|raz|Dalej|Zaproś|Dołącz|Opuść|pokój|pokoju|Zwykła|Rzadka|Epicka|Legendarna|Wyjście|Strzał|Skok|Kucanie|Przeładuj|Apteczka|Broń|Zabij|Zdobądź|Miej|Osiągnij)([^A-Za-z]|$)/;
const PL_I=/ i /;
function gather(root){
  const out=[];if(!root)return out;
  out.push(root.innerText||'');
  for(const el of root.querySelectorAll('[aria-label],[title],[placeholder],[alt]'))for(const a of ['aria-label','title','placeholder','alt']){const v=el.getAttribute(a);if(v)out.push(v)}
  for(const o of root.querySelectorAll('option'))out.push(o.textContent);
  return out;
}
function scan(tag,strs){
  for(const s of strs)for(const line of String(s).split(/\n+/)){
    const t=line.replace(KEEP,'').trim();if(!t)continue;
    if(lang==='en'&&(DIA.test(t)||WORDS.test(t)||PL_I.test(t)))leftovers.push(tag+' | '+line.slice(0,110));
  }
}
const here=(tag,root)=>scan(tag,gather(typeof root==='string'?document.querySelector(root):root));

// 1. ostrzeżenie
ok('boot.htmlLang',document.documentElement.lang===lang);
here('scrWarn','#scrWarn');here('hud-static','#hud');
document.getElementById('warnFull').click();await sleep(200);

// 2. wszystkie ekrany menu
const ids=[...document.querySelectorAll('.screen')].map(s=>s.id).filter(id=>!['scrWarn','scrPause','scrOver','scrLevelDone'].includes(id));
for(const id of ids){
  scr.show(id);await sleep(id==='scrRanking'?600:80);here(id,'#'+id);
  if(id==='scrOptions')for(const t of ['gfx','snd','ctl','xh','acc','game']){opts.openOptionsTab(t);await sleep(40);here('opt:'+t,'#scrOptions')}
  if(id==='scrShop')for(const n of ['heniek','zdzichu','halina']){document.querySelector('#shopTabs button[data-npc='+n+']').click();await sleep(40);here('shop:'+n,'#scrShop')}
}
// 3. przełącznik języka w menu i w opcjach
scr.show('scrMenu');
const sw=[...document.querySelectorAll('#scrMenu .langBtn')];
ok('lang.menuSwitch',sw.length===2&&sw.find(b=>b.dataset.lang===lang).getAttribute('aria-pressed')==='true');
scr.show('scrOptions');opts.openOptionsTab('game');
ok('lang.optionsSwitch',document.querySelectorAll('#optPane-game .langBtn').length===2);
// 4. skrzynki i kasyno
scr.show('scrCrates');save.keys=0;document.querySelector('[data-open=remiza]').click();await sleep(60);here('crates:nokeys','#cresult');
save.keys=1;document.querySelector('[data-open=remiza]').click();await sleep(6400);here('crates:result','#cresult');
scr.show('scrCasino');save.coins=5000;scr.updateWallet();document.getElementById('spin').click();await sleep(3200);here('casino:msg','#slotMsg');here('casino:paytable','#scrCasino');
// 5. gra: HUD, ogłoszenia, kombo, pauza, śmierć
scr.show('scrMenu');document.getElementById('mPlay').click();await sleep(200);
const G=S.G;const seen=new Set();
const grab=()=>{if(G.announce){seen.add(G.announce.text);if(G.announce.sub)seen.add(G.announce.sub)}for(const f of G.floaters)seen.add(f.text);const n=document.getElementById('narr');if(!n.hidden)seen.add(n.textContent)};
for(let i=0;i<240;i++){loop.updateGame(1/60);grab()}
for(let k=0;k<6;k++){const e=G.enemies.find(x=>x.alive);if(!e)break;cmb.damageEnemy(e,99999,k%2===0,e.g.position.clone());for(let i=0;i<4;i++){loop.updateGame(1/60);grab()}}
scan('game:announce',[...seen]);here('hud','#hud');
flow.pause();await sleep(80);here('pause','#scrPause');flow.resume();
G.hp=1;cmb.hurt(999);for(let i=0;i<5;i++){loop.updateGame(1/60);grab()}scan('game:dead',[...seen]);
await sleep(1700);here('over','#scrOver');
// 6. ukończenie poziomu
flow.toMenuMode();scr.show('scrMenu');document.getElementById('mPlay').click();await sleep(200);
DS.bus.emit('levelComplete',{level:'remiza',wave:3});await sleep(2800);here('levelDone','#scrLevelDone');
// 7. HUD co-op i komunikaty sieciowe
if(DS.net&&DS.net.hudDemo){document.getElementById('hud').hidden=false;DS.net.hudDemo(true);await sleep(80);here('coopHud','#hud');DS.net.hudDemo(false)}
const net=await import('/js/net/session.js');for(const c of ['ROOM_NOT_FOUND','ROOM_FULL','ROOM_LOCKED','KICKED','TICKET','TIMEOUT','DISCONNECTED','REPLACED','TOO_FAST','GAME_GONE','OFF','FAILED','NOT_HOST','NO_ROOMS','HOST_LEFT','XYZ'])scan('net:'+c,[net.errText(c)]);
const ctl=await import('/js/input/labels.js');for(const c of ['Space','ShiftLeft','Mouse0','Mouse2','Mouse3','WheelUp','ArrowUp','KeyW','Digit1'])scan('key:'+c,[ctl.codeLabel(c)]);
ok('lang.leftovers',lang!=='en'||leftovers.length===0,leftovers.length+' lines');
if(lang==='pl'){
  scr.show('scrMenu');const m=document.getElementById('scrMenu').innerText;
  ok('pl.menuPolish',/Sklep u Heńka/.test(m)&&/Graj/.test(m)&&/Opcje/.test(m)&&/Wyjście/.test(m));
  scr.show('scrOptions');opts.openOptionsTab('gfx');ok('pl.optionsPolish',/Grafika/.test(document.getElementById('scrOptions').innerText));
}else{
  scr.show('scrMenu');const m=document.getElementById('scrMenu').innerText;
  ok('en.menuEnglish',/Play/.test(m)&&/Options/.test(m)&&/Exit/.test(m));
}
R.leftovers=leftovers.slice(0,40);
return R})()
