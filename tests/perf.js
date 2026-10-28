// Wydajność: FPS (rAF, okno MUSI być widoczne: document.visibilityState==='visible' i panel przeglądarki pokazany),
// draw calle (z cieniami, wg ARCHITECTURE.md), geometrie po 5 falach i po 2 cyklach gra->menu.
// Użycie na świeżo załadowanej stronie: (0,eval)(await (await fetch('/tests/perf.js')).text()).then(r=>JSON.stringify(r,null,1))
// Uwaga: FPS jest ograniczony odświeżaniem monitora (tu 166 Hz); wynik = „co najmniej tyle”, nie zapas mocy (zob. msPerSimFrame).
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,R={visible:document.visibilityState,viewport:innerWidth+'x'+innerHeight};
const geo=()=>Q.rend.renderer.info.memory.geometries;
if(document.visibilityState!=='visible'||document.hidden){R.FPS='POMINIĘTE: okno ukryte, rAF nie działa';}
const fps=ms=>new Promise(res=>{let n=0,t0=performance.now(),last=t0,worst=0;const f=t=>{n++;if(n>2)worst=Math.max(worst,t-last);last=t;if(t-t0>=ms)res({fps:+(n*1000/(t-t0)).toFixed(1),worstFrameMs:+worst.toFixed(1)});else requestAnimationFrame(f)};requestAnimationFrame(f);setTimeout(()=>res('timeout (rAF nie działa)'),ms+2000)});
if(document.getElementById('warnFull'))document.getElementById('warnFull').click();await Q.sleep(150);
const sp=await import('/js/enemies/manager.js');
const preset=async p=>{document.getElementById('mOpts').click();await Q.sleep(60);document.querySelector('#oPreset button[data-v='+p+']').click();await Q.sleep(60);document.getElementById('optBack').click();await Q.sleep(60)};
if(!R.FPS)for(const p of ['low','high']){
  await preset(p);R['menu_'+p]=await fps(3000);
  document.getElementById('mPlay').click();await Q.sleep(300);const G=S.G;R['calm_'+p]=await fps(3000);
  for(let i=0;i<8;i++)sp.spawnEnemy('gangster',{boss:false});sp.spawnEnemy('gangster',{boss:true});G.queue=0;
  const off=DS.bus.on('update',()=>{const g=S.G;if(!g)return;g.hp=g.maxHp;const u=DS.progression.ui;if(u.isOpen())u.forceClose();const e=Q.aim();if(e&&g.fireT<=0&&g.reloadT<=0)Q.fire.fire();
    if(g.enemies.filter(x=>x.alive).length<8)sp.spawnEnemy('gangster',{boss:false});if(g.ammo[g.weapon]<3)g.ammo[g.weapon]+=5});
  await Q.sleep(1500);R['battle_'+p]=await fps(5000);R['battle_'+p].drawCallsWithShadows=Q.cost().calls;off();Q.flow.quitToMenu();await Q.sleep(150)}
if(!R.FPS)R['PASS_FPS>=55_high']=(R.battle_high.fps>=55&&R.calm_high.fps>=55)?'PASS':'FAIL';
// 5 fal x 2 cykle: calle, geometrie, scena
const cyc=[];
for(let c=0;c<2;c++){
  Q.flow.quitToMenu();await Q.sleep(80);Q.frames(5);const gm=geo(),sc=Q.rend.scene.children.length;
  document.getElementById('mPlay').click();await Q.sleep(150);const G=S.G;let maxCalls=0,maxTris=0,lastK=-1;const t0=performance.now();let n=0;
  for(let i=0;i<60*240&&G.wave<6&&!G.dead;i++){G.hp=G.maxHp;if(i%240===0){if(G.kills===lastK){const t=G.enemies.find(x=>x.alive);if(t)Q.P.pos.set(t.g.position.x,0,t.g.position.z+8)}lastK=G.kills}
    const e=Q.aim();if(e&&G.fireT<=0&&G.reloadT<=0)Q.fire.fire();if(i%90===0)G.ammo[G.weapon]=DS.weapons.get(G.weapon).mag;Q.frame();n++;
    if(i%120===0){const k=Q.cost();maxCalls=Math.max(maxCalls,k.calls);maxTris=Math.max(maxTris,k.tris)}}
  cyc.push({cycle:c,wave:G.wave,maxCalls,maxTris,msPerSimFrame:+((performance.now()-t0)/n).toFixed(2),menuGeoBefore:gm,menuSceneBefore:sc});
}
Q.flow.quitToMenu();await Q.sleep(100);Q.frames(5);
R.cycles=cyc;R.geoAfterMenu=geo();R.sceneAfterMenu=Q.rend.scene.children.length;
R['PASS_calls<=400']=cyc.every(c=>c.maxCalls<=400)?'PASS':'FAIL';
R['PASS_sceneBaseline']=R.sceneAfterMenu===cyc[0].menuSceneBefore?'PASS':'FAIL';
R['info_geoGrowthPerRun']=(R.geoAfterMenu-cyc[0].menuGeoBefore)/2;
R.errs=Q.errs;return R})()
