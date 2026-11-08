// Treść gry po angielsku (i18n): rejestry broni, perków, wrogów, znajdziek z mapy i poziomów + napisy wywołane w grze
// (pływające napisy, zapowiedzi faz bossów, zbieranie) bez polskich znaków i typowych polskich słów (z białą listą nazw własnych
// i szyldów). Potem w ramce (iframe) z językiem PL: polskie teksty rejestrów muszą być dokładnie literałami sprzed tłumaczenia
// (tests/i18n-baseline.json z `node tests/i18n-baseline.js` = git show 8e4f02d:<plik>).
// Uruchomienie: node tests/serve.js 4205 ; node tests/cdp-run.js i18n-content.js 4205 --gpu --size=1280x720 --lang=en
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,P=Q.P,R={},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d!==undefined?' ('+d+')':''),inf=(n,v)=>R['info.'+n]=v;
const i18n=await import('/js/core/i18n.js'),ws=await import('/js/world/state.js'),cm=await import('/js/world/levels/common.js'),mg=await import('/js/enemies/manager.js');
const cat=await import('/js/progression/catalog.js'),sv=await import('/js/core/save.js');
const world=ws.world;
ok('lang.en',i18n.lang==='en',i18n.lang);

/* ---------- wykrywanie polskiego ---------- */
// Biała lista: nazwy własne (słowniczek docs/i18n-glossary.md) i szyldy, które celowo zostają po polsku.
const WHITE=['STRZELNICA GŁÓWNA','Strzelnica Główna','Bar u Zdzicha','ZŁOTY BANDYTA','REMIZA DISCO','Dolne Zadupie','Fiat 126p','Sołtys','Żubr','Kiełbasa',
  'Zdzichu','Zdzicha','Zdzisiek','Heniek','Halina','Maluchs','Maluch','Polonez','Wiesiek','Wojtek','Mietek','PALIWEX','PKS','zł','wz. 96'].sort((a,b)=>b.length-a.length);
const PL_CH=/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const PL_W=/\b(się|nie|jest|oraz|przy|pod|dla|za|na|od|ze|po|już|klucz|klucze|kaseta|plakat|znajdźki|sekrety|poziom|gra|toczy|dalej|zabójstw|obrażeń|szansy|strzał|magazynka|prędkości|pada|wchodzi|automat)\b/i;
const PL_1=/(^|[\s(])[iwz](?=[\s)]|$)/;   // polskie jednoliterowe spójniki/przyimki
const polish=s=>{let t=String(s);for(const w of WHITE)t=t.split(w).join(' ');return PL_CH.test(t)||PL_W.test(t)||PL_1.test(t)};
ok('detector.selftest',polish('Znajdźki 3/13')&&polish('Pijak z butelkami')&&polish('Dres')===false&&polish('KLUCZ do skrzynek')&&!polish('The Village Head (Sołtys) is down')&&!polish('Poster: Hot dog 2 zł'));
const seen=new Map();   // tekst -> źródło
const add=(src,s)=>{if(s==null||s==='')return;if(Array.isArray(s)){s.forEach(x=>add(src,x));return}s=String(s);if(!seen.has(s))seen.set(s,src)};

/* ---------- 1. rejestry ---------- */
for(const w of DS.weapons.all())add('weapon:'+w.id,[w.name,w.short,w.snd]);
for(const p of DS.perks.all()){add('perk:'+p.id,[p.name,p.desc]);add('perkTotals:'+p.id,cat.describeTotals(p,p.max||1))}
add('rarity',Object.values(cat.RARITY_NAME));
for(const e of DS.enemies.all())add('enemy:'+e.id,e.name);
const LV=DS.levels.all();
for(const l of LV){add('level:'+l.id,[l.name,l.desc,l.win&&l.win.text,l.waves&&l.waves.intro]);(l.starts||[]).forEach(s=>add('start:'+l.id,s.name));(l.secrets||[]).forEach(s=>add('secret:'+l.id,s.name))}
ok('registry.counts',DS.perks.all().length>=33&&DS.weapons.all().length>=15&&LV.length>=6,DS.perks.all().length+' perków, '+DS.weapons.all().length+' broni, '+LV.length+' poziomów');

/* ---------- 2. poziomy: znajdźki i sekretne drzwi ---------- */
if(document.getElementById('warnFull'))document.getElementById('warnFull').click();await Q.sleep(150);
let nCol=0;
for(const l of LV){sv.opt.level=l.id;DS.bus.emit('levelSelect',{level:l.id});await Q.sleep(250);
  if(!world.level||world.level.id!==l.id){ok('level.load.'+l.id,false,world.level&&world.level.id);continue}
  for(const c of world.level.collectibles||[]){add('collectible:'+c.id,[c.name,c.hint]);nCol++}
  const st=cm.debugState&&cm.debugState();if(st&&st.doors)st.doors.forEach(d=>add('door:'+l.id,d.label))}
inf('collectibles',nCol);ok('collectibles.seen',nCol>=60,nCol);

/* ---------- 3. napisy w grze: zbieranie, pływające napisy, bossowie ---------- */
const tapOld=S.fxTap;S.fxTap=(k,a,b)=>{add('fx:'+k,a);if(k==='an')add('fx:an.sub',typeof b==='string'?b:null);if(tapOld)try{tapOld(k,a,b)}catch(e){}};
const scanFl=()=>{const G=S.G;if(!G)return;for(const f of G.floaters||[])add('floater',f.text);if(G.announce){add('announce',G.announce.text);add('announce.sub',G.announce.sub)}};
sv.opt.level='remiza';DS.bus.emit('levelSelect',{level:'remiza'});await Q.sleep(250);
sv.opt.onoma=1;
await Q.start();const G=S.G;
// znajdźki z wrogów i z mapy: collect() każdego typu
for(const pk of DS.pickups.all()){G.hp=1;try{pk.collect({val:10,type:pk.id})}catch(e){add('ERR pickup '+pk.id,e.message)}scanFl()}
// granie: strzały, okrzyki wrogów, wybuchy
for(let i=0;i<60*25&&!G.dead;i++){G.hp=G.maxHp;const e=Q.aim();if(e&&G.fireT<=0&&G.reloadT<=0)Q.fire.fire();Q.frame();scanFl()}
// bossowie: fazy (hp < 66% i < 33%) i zabicie
const bosses=DS.enemies.ids().filter(id=>id.startsWith('boss_'));
for(const id of bosses){
  S.G.enemies.forEach(e=>{e.alive=false});
  let e=null;try{e=mg.spawnEnemy(id,{at:{x:P.pos.x,z:P.pos.z-9}})}catch(err){add('ERR boss '+id,err.message)}
  if(!e){e=S.G.enemies[S.G.enemies.length-1]}
  if(!e||e.type!==id){ok('boss.spawn.'+id,false);continue}
  for(const f of [.6,.3]){e.hp=e.maxHp*f;for(let i=0;i<120;i++){S.G.hp=S.G.maxHp;Q.frame();scanFl()}}
  const def=DS.enemies.get(id);if(def.onKill)def.onKill(e);scanFl();add('bossName',e.name);e.alive=false}
S.fxTap=tapOld;
inf('bossesTested',bosses.join(','));

/* ---------- 4. raport EN ---------- */
const bad=[...seen].filter(([s])=>polish(s)).map(([s,src])=>src+' -> '+s);
inf('textsChecked',seen.size);
inf('sampleInGame',[...seen].filter(([s,src])=>/^(fx|floater|announce)/.test(src)).map(([s])=>s).slice(0,40).join(' | '));
ok('en.noPolishLeft',bad.length===0,bad.length+': '+bad.slice(0,25).join(' | '));
const errs=[...seen].filter(([s,src])=>/^ERR/.test(src));ok('en.noErrors',errs.length===0,errs.map(x=>x[1]+' '+x[0]).join(' | '));

/* ---------- 5. PL w ramce: teksty bez zmian względem 8e4f02d ---------- */
const base=await (await fetch('/tests/i18n-baseline.json')).json(),B=new Set(base.strings);
const optKey='discoStrzelnica.opt.v1',optRaw=localStorage.getItem(optKey),saveRaw=localStorage.getItem('discoStrzelnica.save.v1');
const o=JSON.parse(optRaw||'{}');o.lang='pl';localStorage.setItem(optKey,JSON.stringify(o));
const fr=document.createElement('iframe');fr.style.cssText='position:fixed;left:0;top:0;width:800px;height:600px;opacity:0;pointer-events:none';fr.src='/?i18n-pl';document.body.appendChild(fr);
let W=null;for(let i=0;i<200;i++){await Q.sleep(100);try{const d=fr.contentWindow.DS;if(d&&d.levels.ids().length>=6&&d.perks.all().length>=33&&d.weapons.all().length>=15){W=fr.contentWindow;break}}catch(e){}}
// przywróć opcje i zapis strony EN (ramka mogła je nadpisać)
if(optRaw!=null)localStorage.setItem(optKey,optRaw);if(saveRaw!=null)localStorage.setItem('discoStrzelnica.save.v1',saveRaw);
ok('pl.frameLoaded',!!W);
if(W){
  const PD=W.DS,pl=[];const padd=(src,s)=>{if(s!=null&&s!=='')pl.push([src,String(s)])};
  const pi=await W.eval("import('/js/core/i18n.js')");ok('pl.lang',pi.lang==='pl',pi.lang);
  for(const w of PD.weapons.all()){padd('weapon:'+w.id,w.name);padd('weapon.short:'+w.id,w.short);padd('weapon.snd:'+w.id,w.snd)}
  for(const p of PD.perks.all()){padd('perk:'+p.id,p.name);padd('perk.desc:'+p.id,p.desc)}
  for(const e of PD.enemies.all())padd('enemy:'+e.id,e.name);
  for(const l of PD.levels.all()){padd('level:'+l.id,l.name);padd('level.desc:'+l.id,l.desc);padd('level.win:'+l.id,l.win&&l.win.text);padd('level.intro:'+l.id,l.waves&&l.waves.intro);
    (l.starts||[]).forEach(s=>padd('start:'+l.id,s.name));(l.secrets||[]).forEach(s=>padd('secret:'+l.id,s.name))}
  // znajdźki w PL: wczytaj każdy poziom w ramce
  try{const wb=W.document.getElementById('warnFull');if(wb)wb.click()}catch(e){}await Q.sleep(150);
  const pws=await W.eval("import('/js/world/state.js')"),psv=await W.eval("import('/js/core/save.js')");let pc=0;
  for(const l of PD.levels.all()){psv.opt.level=l.id;PD.bus.emit('levelSelect',{level:l.id});await Q.sleep(250);
    const lv=pws.world.level;if(lv&&lv.id===l.id)for(const c of lv.collectibles||[]){padd('collectible:'+c.id,c.name);padd('collectible.hint:'+c.id,c.hint);pc++}}
  inf('pl.collectibles',pc);
  const miss=pl.filter(([src,s])=>!B.has(s));
  inf('pl.textsChecked',pl.length);
  ok('pl.unchangedVsBaseline',miss.length===0,miss.length+': '+miss.slice(0,15).map(m=>m[0]+' -> '+m[1]).join(' | '));
  // EN różni się od PL tam, gdzie powinien (nazwy poziomów, perki, bossowie)
  const pairs=[[DS.levels.get('blokowisko').name,PD.levels.get('blokowisko').name],[DS.perks.get('bimber').desc,PD.perks.get('bimber').desc],[DS.enemies.get('boss_soltys').name,PD.enemies.get('boss_soltys').name],[DS.weapons.get('pistol').name,PD.weapons.get('pistol').name]];
  ok('en.differsFromPl',pairs.every(([a,b])=>a!==b),JSON.stringify(pairs));
  ok('pl.sample',PD.levels.get('stacja').win.text==='STACJA ZDOBYTA!'&&PD.perks.get('zubr_na_kaca').name==='Żubr na Kaca'&&PD.enemies.get('dres').name==='Dres',PD.levels.get('stacja').win.text);
}
fr.remove();
ok('console.noErrors',Q.errs.filter(e=>/^(E:|ERR|REJ)/.test(e)).length===0,Q.errs.filter(e=>/^(E:|ERR|REJ)/.test(e)).slice(0,3).join(' | '));
try{Q.flow.quitToMenu()}catch(e){}
return R})()
