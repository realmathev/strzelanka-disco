// Wydajnosc przy maksymalnej liczbie wrogow (faza 2): poziom x preset. Okno musi byc widoczne (zrob zrzut przed startem).
// Uzycie (swieza strona): window.__cfg={levels:['remiza','blokowisko'],presets:['high','low']};
//   (0,eval)(await (await fetch('/tests/perf2.js')).text()); potem odpytuj window.__x (gotowe gdy __x.done).
// Mierzy: FPS realnej petli (rAF), draw calle z cieniami (QA.cost), trojkaty, geometrie, scene.children, liczbe zywych wrogow (cel 30).
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,cfg=window.__cfg||{levels:['remiza','blokowisko'],presets:['high','low']};
const X=window.__x={rows:[],done:false,errs:Q.errs};
// Uwaga: pierwsze klatki po zaladowaniu poziomu maja stall ~1 s (kompilacja shaderow), stad rozgrzewka 1,5 s. Wynik FPS zalezy od tempa rAF panelu (tu ~83 Hz na menu).
const mg=await import('/js/enemies/manager.js'),wv=await import('/js/game/waves.js'),wl=await import('/js/world/world.js');
// stall = klatka >250 ms: rAF panelu przycina sie, gdy jest ukryty (artefakt srodowiska); podajemy FPS z i bez stalli
const fps=ms=>new Promise(res=>{const d=[];let t0=performance.now(),last=t0;const f=()=>{const n=performance.now();d.push(n-last);last=n;if(n-t0>=ms){const dd=d.slice(2),ok=dd.filter(x=>x<250),so=ok.slice().sort((a,b)=>a-b);res({fps:+(d.length*1000/(n-t0)).toFixed(1),fpsNoStall:+(ok.length*1000/ok.reduce((a,b)=>a+b,0)).toFixed(1),medMs:+so[so.length>>1].toFixed(1),p95Ms:+so[Math.floor(so.length*.95)].toFixed(1),stalls:dd.length-ok.length})}else requestAnimationFrame(f)};requestAnimationFrame(f)});
if(document.getElementById('warnFull'))document.getElementById('warnFull').click();await Q.sleep(150);
const preset=async p=>{document.getElementById('mOpts').click();await Q.sleep(60);document.querySelector('#oPreset button[data-v='+p+']').click();await Q.sleep(60);document.getElementById('optBack').click();await Q.sleep(60)};
for(const lv of cfg.levels)for(const p of cfg.presets){
  const row={level:lv,preset:p};
  try{
  await preset(p);wl.loadLevel(lv);DS.bus.emit('levelSelect',{level:lv});await Q.sleep(200);
  document.getElementById('mPlay').click();await Q.sleep(400);const G=S.G;row.levelActive=DS.world&&0;
  await Q.sleep(1500);row.calm=await fps(3000);row.calmCost=Q.cost();
  const off=DS.bus.on('update',()=>{const g=S.G;if(!g)return;g.hp=g.maxHp;const u=DS.progression.ui;if(u.isOpen())u.forceClose();if(g.ammo[g.weapon]<3)g.ammo[g.weapon]+=5});
  G.wave=64;wv.nextWave();G.queue=0;   // fala 65: boss + maxAlive 30
  row.maxAlive=G.maxAlive;
  for(let i=0;i<40&&G.enemies.filter(e=>e.alive).length<30;i++)mg.makeEnemy(false);
  await Q.sleep(1500);
  row.alive=G.enemies.filter(e=>e.alive).length;row.types=[...new Set(G.enemies.filter(e=>e.alive).map(e=>e.type||e.name))].join('|');
  await Q.sleep(1500);row.battle=await fps(6000);row.battleCost=Q.cost();row.geo=Q.stats().geo;row.scene=Q.stats().scene;
  row.aliveAfter=G.enemies.filter(e=>e.alive).length;
  off();Q.flow.quitToMenu();await Q.sleep(200);
  }catch(e){row.err=String(e&&e.stack||e)}
  X.rows.push(row)}
X.done=true;return X})();
