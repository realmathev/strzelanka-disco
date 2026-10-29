// Niezależne testy po spinaniu fazy 1 (QA): trudność w prawdziwym AI, pancerz w prawdziwym trafieniu wroga, czułość myszy,
// hitVol, cykle gra->menu i przeładowanie poziomu pod kątem wycieków (geometrie, tekstury, scena, kolidery), tryb „Bezpieczna”, CSS reduced-motion.
// Użycie na świeżo załadowanej stronie (ekran ostrzeżenia), okno widoczne:
//   window.__x=null;(0,eval)(await (await fetch('/tests/phase1b.js')).text()).then(r=>window.__x=r);   // potem odpytuj window.__x co kilka s (ok. 60-80 s)
// Zapis ze starego formatu: patrz tests/oldsave.js (wymaga ustawienia localStorage PRZED załadowaniem strony).
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,R={},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d?' ('+d+')':'');
const info=Q.rend.renderer.info,geo=()=>info.memory.geometries,tex=()=>info.memory.textures,sc=()=>Q.rend.scene.children.length;
const sp=await import('/js/enemies/manager.js'),col=await import('/js/player/collision.js');
const opt=Q.sv.opt;
document.getElementById('warnFull').click();await Q.sleep(150);
// ---------- A. trudność i pancerz w prawdziwym AI (wróg strzela do gracza) ----------
await Q.start();const G=S.G;Q.frames(5);
G.enemies.forEach(e=>e.alive=false);G.queue=0;G.wave=1;
// znajdź otwarte miejsce: gracz w punkcie, z którego widać punkt 8 m dalej na wysokości oczu
// (sonda: prawdziwy wróg, prawdziwa lufa po obrocie w stronę gracza; sprawdzamy los() dokładnie tak jak AI)
let spot=null;
{const probe=sp.spawnEnemy('gangster',{boss:false});const eye=new THREE.Vector3(),mz=new THREE.Vector3(),W=Q.wst.world;
 for(let a=0;a<360&&!spot;a+=15)for(const [px,pz] of [[0,0],[0,20],[10,10],[-10,10],[0,-20],[15,-15],[-15,-15],[0,10],[20,0],[-20,0]]){
  const r=a*Math.PI/180,ex=px+Math.cos(r)*8,ez=pz+Math.sin(r)*8;
  if(Math.abs(ex)>W.arena-4||Math.abs(ez)>W.arena-4)continue;
  if(W.colliders.some(c=>(ex>c.x0-2&&ex<c.x1+2&&ez>c.z0-2&&ez<c.z1+2)||(px>c.x0-1&&px<c.x1+1&&pz>c.z0-1&&pz<c.z1+1)))continue;
  probe.g.position.set(ex,0,ez);probe.g.rotation.y=Math.atan2(-(px-ex),-(pz-ez));probe.g.updateMatrixWorld(true);
  mz.set(0,0,-.25);probe.gun.localToWorld(mz);eye.set(px,1.62,pz);
  if(col.los(mz,eye)){spot={px,pz,ex,ez};break}}
 probe.alive=false;probe.gone=true;Q.rend.scene.remove(probe.g);G.enemies=G.enemies.filter(x=>x!==probe)}
R['info.spot']=JSON.stringify(spot);
const shoot=async(diff,{armor=0,n=40}={})=>{
  opt.difficulty=diff;G.dead=false;G.hp=G.maxHp=1e6;G.armor=armor;G.armorMax=100;
  const e=sp.spawnEnemy('gangster',{boss:false});
  Q.P.pos.set(spot.px,0,spot.pz);Q.P.vel.set(0,0,0);e.g.position.set(spot.ex,0,spot.ez);e.acc=100;e.speed=0;e.strafe=0;
  const rec=[];const off=DS.bus.on('damage',d=>rec.push(d.amount));
  const armor0=G.armor;let steps=0;
  while(rec.length<n&&steps<60*120){e.shootT=Math.min(e.shootT,.02);e.g.position.set(spot.ex,0,spot.ez);G.hp=1e6;Q.frame();steps++}
  off();e.alive=false;
  return {dmg:e.dmg,n:rec.length,mean:rec.reduce((a,b)=>a+b,0)/Math.max(rec.length,1),armorLost:armor0-G.armor,rec};
};
if(spot){
  const out={};for(const d of ['easy','normal','hard'])out[d]=await shoot(d);
  R['info.enemyHitMeans']=JSON.stringify(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,{e_dmg:+v.dmg.toFixed(2),mean:+v.mean.toFixed(2),n:v.n}])));
  const ratio=k=>out[k].mean/out[k].dmg;
  ok('difficulty.hitsHaveEnoughSamples',['easy','normal','hard'].every(k=>out[k].n>=20),JSON.stringify(Object.values(out).map(v=>v.n)));
  ok('difficulty.damageToPlayerScales',out.easy.mean<out.normal.mean&&out.normal.mean<out.hard.mean&&Math.abs(out.easy.mean/out.normal.mean-.75)<.12&&Math.abs(out.hard.mean/out.normal.mean-1.25)<.15,
    'sr. obrażenia easy/normal/hard = '+out.easy.mean.toFixed(2)+' / '+out.normal.mean.toFixed(2)+' / '+out.hard.mean.toFixed(2));
  ok('difficulty.hurtUsesEnemyDmgOnce',['easy','normal','hard'].every(k=>ratio(k)>.83&&ratio(k)<1.17),'amount/e.dmg = '+['easy','normal','hard'].map(k=>ratio(k).toFixed(2)).join('/'));
  // pancerz pochłania w prawdziwym trafieniu
  opt.difficulty='normal';const a=await shoot('normal',{armor:100,n:20});
  ok('armor.absorbsRealHits',a.armorLost>0&&a.mean<out.normal.mean*.8,'armor -'+a.armorLost.toFixed(1)+', sr. w HP '+a.mean.toFixed(2)+' vs '+out.normal.mean.toFixed(2)+' bez pancerza');
  // zdarzenie damage.amount = obrażenia w HP po pancerzu (kontrakt ARCHITECTURE.md)
  ok('armor.damageEventIsPostArmor',a.n>0&&a.rec.every(x=>x<=a.dmg*1.16+1e-6)&&a.mean<a.dmg,'sr. '+a.mean.toFixed(2)+' vs e.dmg '+a.dmg.toFixed(2));
}else{R['difficulty.damageToPlayerScales']='SKIP (nie znaleziono otwartego miejsca z LOS)'}
opt.difficulty='normal';G.hp=G.maxHp=125;G.armor=0;G.enemies.forEach(e=>e.alive=false);
// ---------- B. czułość myszy ----------
{const mm=dx=>{const y=Q.P.yaw;dispatchEvent(new MouseEvent('mousemove',{movementX:dx,movementY:0}));return y-Q.P.yaw};
 opt.sens=1;const s1=mm(100);opt.sens=2;const s2=mm(100);opt.sens=1;
 ok('input.sensitivityScalesYaw',Math.abs(s2/s1-2)<.01,s1.toFixed(4)+' / '+s2.toFixed(4))}
// ---------- C. hitVol: 0 = cisza, domyślnie dźwięk ----------
{const au=await import('/js/audio/context.js'),sx=await import('/js/audio/sfx.js'),gs=await import('/js/audio/gunsfx.js'); // od fazy 2a dzwiek trafienia gra gunsfx.gunHit (sfx('hit') jest pusty, gdy gunfeel gotowy)
 if(au.A.ctx){const c=au.A.ctx,orig=c.createOscillator.bind(c);let n=0;c.createOscillator=function(){n++;return orig()};
  const run=v=>{opt.hitVol=v;n=0;sx.sfx('hit');sx.sfx('head');gs.gunHit(false);gs.gunHit(true);return n};const n0=run(0),n8=run(.8);opt.hitVol=.8;c.createOscillator=orig;
  ok('audio.hitVolZeroSilences',n0===0&&n8>0,'oscylatory przy hitVol 0 / .8: '+n0+' / '+n8)}
 else R['audio.hitVolZeroSilences']='SKIP (AudioContext nie wystartował w tym oknie)'}
// ---------- D. tryb „Bezpieczna” (opt.fx=0): brak błysków podczas walki ----------
{opt.fx=0;let maxFlash=0;G.hp=G.maxHp;
 const sx=sp.spawnEnemy('gangster',{boss:false});for(let i=0;i<8;i++)sp.spawnEnemy('gangster',{boss:false});
 Q.play(60*12,{});maxFlash=0;for(let i=0;i<120;i++){Q.frame();maxFlash=Math.max(maxFlash,G.flashT||0)}
 ok('safe.flashTAlwaysZero',maxFlash===0,'max G.flashT='+maxFlash);opt.fx=1;G.enemies.forEach(e=>e.alive=false)}
// ---------- E. CSS: prefers-reduced-motion ma reguły ----------
{let n=0,txt=[];for(const ss of document.styleSheets){let rules;try{rules=ss.cssRules}catch(e){continue}for(const r of rules)if(r.media&&/prefers-reduced-motion/.test(r.conditionText||r.media.mediaText)){n++;txt.push((r.cssText||'').slice(0,80))}}
 ok('a11y.cssReducedMotionRules',n>0,'brak @media (prefers-reduced-motion)');R['info.reducedMotionRules']=n}
// ---------- F. wycieki: 6 cykli gra->menu (2 fale) + 10x przeładowanie poziomu ----------
Q.flow.quitToMenu();await Q.sleep(60);Q.frames(5);
const snap=()=>({geo:geo(),tex:tex(),scene:sc(),col:Q.wst.world.colliders.length,out:Q.mat.outlines.length});
const runs=[];
for(let c=0;c<10;c++){
  document.getElementById('mPlay').click();await Q.sleep(120);const g=S.G;g.hp=g.maxHp;
  for(let i=0;i<60*40&&g.wave<3&&!g.dead;i++){g.hp=g.maxHp;if(i%240===0){const t=g.enemies.find(x=>x.alive);if(t)Q.P.pos.set(t.g.position.x,0,t.g.position.z+8)}
    const e=Q.aim();if(e&&g.fireT<=0&&g.reloadT<=0)Q.fire.fire();if(g.ammo[g.weapon]<3)g.ammo[g.weapon]+=10;Q.frame()}
  Q.flow.quitToMenu();await Q.sleep(60);Q.frames(5);runs.push(snap())}
R['info.cycleSnapshots(geo,tex,scene,col,outlines)']=JSON.stringify(runs.map(r=>[r.geo,r.tex,r.scene,r.col,r.out]));
// geometrie rosną skokowo w pierwszych cyklach (leniwe cache: modele znajdziek, kadry itd.) i wchodzą w plateau; wyciek = wzrost w ostatnich 4 cyklach
const last4=runs.slice(-4);
ok('leak.tenCyclesPlateau',Math.abs(last4[3].geo-last4[0].geo)<=3&&last4[3].tex<=last4[0].tex+1&&runs.every(r=>r.scene===runs[0].scene&&r.col===runs[0].col&&r.out===runs[0].out),
  'geo '+runs.map(r=>r.geo).join('>')+' tex '+runs.map(r=>r.tex).join('>'));
{const wl=await import('/js/world/world.js');const b=snap();
 DS.levels.register({id:'__t2',name:'T2',arena:40,spawn:{x:0,z:10,yaw:0},menuCam:{r:20,y:6,look:[0,3,0]},build(){DS.props.get('crate').place({x:3,z:3,s:1.6});if(DS.props.has('neonSign'))DS.props.get('neonSign').place({x:0,z:-8,y:5})}});
 for(let k=0;k<10;k++){DS.bus.emit('levelSelect',{level:'__t2'});Q.frames(2);DS.bus.emit('levelSelect',{level:'remiza'});Q.frames(2)}
 DS.levels.remove('__t2');await Q.sleep(60);Q.frames(3);const a=snap();
 ok('leak.levelSwitch10x',a.scene===b.scene&&a.col===b.col&&a.out===b.out&&a.geo-b.geo<=3&&a.tex-b.tex<=2,JSON.stringify(b)+' -> '+JSON.stringify(a));
 ok('level.neonsLitAfterSwitch',Q.wst.world.neon.length===4&&Q.wst.world.neon.every(s=>s.visible&&s.parent===Q.rend.scene))}
ok('console.noErrorsOrWarnings',Q.errs.length===0,Q.errs.slice(0,3).join(' | '));
return R})()
