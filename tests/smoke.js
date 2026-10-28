// Smoke test fazy 0. Wklej do javascript_tool (lub konsoli) na świeżo załadowanej stronie (ekran ostrzeżenia).
// Zwraca obiekt {name: PASS|FAIL|info}. NIE zależy od requestAnimationFrame: pętlę klatek symuluje sam
// (frame()), więc działa także w ukrytym oknie. NIE mierzy FPS, pointer locka ani słyszalności dźwięku.
(async()=>{
const R={},errs=[];
console.error=(...a)=>errs.push('E:'+a.join(' '));console.warn=(...a)=>errs.push('W:'+a.join(' '));
addEventListener('error',e=>errs.push('ERR:'+e.message));addEventListener('unhandledrejection',e=>errs.push('REJ:'+e.reason));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const imp=async p=>import('/js/'+p);
const [loop,cf,wld,rend,st,sv,en,pl,fire,cmb,wst,flow,mat]=await Promise.all(['game/loop.js','render/comicfx.js','world/world.js','render/renderer.js','core/state.js','core/save.js','enemies/manager.js','player/player.js','weapons/fire.js','game/combat.js','world/state.js','game/flow.js','render/materials.js'].map(imp));
const {S}=st,P=pl.P,info=rend.renderer.info;let T=0;const SCENE0=rend.scene.children.length;
// Faza 1: ekran level-up (jednoręki bandyta) pauzuje grę (G.paused=true) i blokuje symulację. Smoke omija go przez
// DS.progression.ui.forceClose() (bez perku; prawdziwy przebieg automatu testuje tests/integration.js).
const skipLevelup=()=>{const u=DS.progression&&DS.progression.ui;if(u&&u.isOpen()){u.forceClose();lvSkipped++}};let lvSkipped=0;
const frame=(dt=1/60)=>{const G=S.G;T+=dt;wld.animateWorld(T,dt);skipLevelup();if(S.mode==='game'&&G&&!G.paused){loop.updateGame(dt);skipLevelup()}rend.renderer.render(rend.scene,rend.camera);
  if(S.mode==='game'&&G&&G.panelReq)cf.capturePanels();cf.drawFx(S.mode==='game'&&G&&!G.paused?dt:0)};
const frames=n=>{for(let i=0;i<n;i++)frame()};
const ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d?' ('+d+')':'');
const click=id=>document.getElementById(id).click();
const vis=()=>[...document.querySelectorAll('.screen')].filter(s=>!s.hidden).map(s=>s.id).join(',');

// 1. start + ostrzeżenie
ok('boot.mode=warn',S.mode==='warn');ok('boot.warnScreen',vis()==='scrWarn',vis());
ok('boot.glError0',rend.renderer.getContext().getError()===0);
click('warnFull');await sleep(150);ok('menu.afterWarn',S.mode==='menu'&&vis()==='scrMenu',vis());
// 2. podekrany
for(const id of ['scrShop','scrCasino','scrCrates','scrInv']){document.querySelector('#scrMenu [data-go='+id+']').click();await sleep(80);
  ok('nav.'+id,vis()===id,vis());document.querySelector('#'+id+' [data-go=scrMenu]').click();await sleep(40)}
click('mOpts');await sleep(80);ok('nav.options',vis()==='scrOptions');click('optBack');ok('nav.optionsBack',vis()==='scrMenu');
// 3. neony: nigdy visible=false, miganie tylko jasnością (3600 klatek, fx=1 i fx=0)
const neon=wst.world.neon;let inv=0,dim=0,dimSafe=0;
for(let i=0;i<3600;i++){frame();for(const s of neon){if(!s.visible)inv++;if(s.material.color.r<1)dim++}}
sv.opt.fx=0;for(let i=0;i<600;i++){frame();for(const s of neon)if(s.material.color.r<1)dimSafe++}sv.opt.fx=1;
ok('neon.count4',neon.length===4,neon.length);ok('neon.neverInvisible',inv===0,inv);ok('neon.dimsSometimes',dim>0);ok('neon.safeModeSteady',dimSafe===0,dimSafe);
// 4. gra: start, fale, strzał, headshot z kadrami
click('mPlay');await sleep(150);const G0=S.G;ok('game.start',S.mode==='game'&&!!G0&&!document.getElementById('hud').hidden);
sv.save.weapons=['pistol','smg','shotgun','rifle'];/* 'smg' = stary zapis z fazy 0: alias do 'uzi' (weapons/slots.js) */sv.opt.panels=1;
const v=new THREE.Vector3(),aim=()=>{const e=S.G.enemies.find(x=>x.alive);if(!e)return null;const h=e.meshes.find(m=>m.userData.part==='head')||e.meshes[0];h.getWorldPosition(v);
  const dx=v.x-P.pos.x,dz=v.z-P.pos.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(v.y-1.62,Math.hypot(dx,dz));return e};
let head=0;const un=DS.bus.on('kill',e=>{if(e.head)head++});
const snaps=[];let lw=-1,maxCalls=0;
let lastK=-1;
for(let i=0;i<60*150&&S.G.wave<5&&!S.G.dead;i++){const G=S.G;G.hp=G.maxHp;
  // stojący strzelec bywa zasłonięty: co 4 s bez zabójstwa podchodzimy na 8 m do wroga (inaczej test jest losowy)
  if(i%240===0){if(G.kills===lastK){const t=G.enemies.find(x=>x.alive);if(t)P.pos.set(t.g.position.x,0,t.g.position.z+8)}lastK=G.kills}if(G.wave!==lw){lw=G.wave;snaps.push({w:G.wave,geo:info.memory.geometries,pick:G.pickups.length,scene:rend.scene.children.length})}
  const e=aim();if(e&&G.fireT<=0&&G.reloadT<=0)fire.fire();frame();maxCalls=Math.max(maxCalls,info.render.calls)}
un();ok('game.wavesAdvance',S.G.wave>=3,S.G.wave);ok('game.headKills',head>0,head);
R['info.snapshots(w,geo,pickups,scene)']=JSON.stringify(snaps);
ok('perf.drawCalls<=400',maxCalls<=400,'max '+maxCalls);
ok('leak.geometriesStable',snaps.length<2||snaps[snaps.length-1].geo-snaps[0].geo<100,snaps.length&&(snaps[snaps.length-1].geo-snaps[0].geo)+' nowych geometrii');
ok('leak.pickupsDespawn',snaps.length<2||snaps[snaps.length-1].pick<40,snaps.length&&snaps[snaps.length-1].pick+' znajdziek na scenie');
// kadry komiksowe
{const G=S.G;for(let i=0;i<600&&!G.enemies.some(e=>e.alive);i++)frame();const e=G.enemies.find(x=>x.alive);P.pos.set(e.g.position.x,0,e.g.position.z+8);aim();frame();
 e.hp=1;G.panelCD=0;G.fireT=0;G.reloadT=0;G.ammo[G.weapon]=5;fire.fire();frame();
 const el=document.getElementById('panels');ok('panels.shown',!el.hidden);
 const px=[...el.querySelectorAll('canvas')].map(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(Math.abs(d[i]-244)>20||Math.abs(d[i+1]-231)>20||Math.abs(d[i+2]-197)>20)n++;return n/(d.length/4)});
 ok('panels.contentNotBlank',px.every(p=>p>.3),px.map(p=>p.toFixed(2)).join(','))}
// 5. klawisze, ruch, pauza, rebind
const key=(c,t='keydown')=>dispatchEvent(new KeyboardEvent(t,{code:c,key:c,bubbles:true,cancelable:true}));const tap=c=>{key(c);key(c,'keyup')};
{const G=S.G;G.enemies.forEach(e=>e.alive=false);if(G.prog)G.prog.pending=0;skipLevelup();G.paused=false;R['info.levelupScreensSkipped']=lvSkipped;const w=[];for(const k of ['Digit2','Digit3','Digit4','Digit1']){tap(k);w.push(G.weapon)}ok('input.weaponKeys',w.join()==='uzi,shotgun,rifle,pistol',w.join());
 G.fireT=0;G.ammo[G.weapon]=0;tap('KeyR');ok('input.reloadKey',G.reloadT>0);frames(120);ok('input.reloadFinishes',G.ammo[G.weapon]===DS.weapons.get(G.weapon).mag);
 const y0=P.yaw;dispatchEvent(new MouseEvent('mousemove',{movementX:100,movementY:0}));ok('input.mouseMoveTurns(bez pointer locka)',P.yaw!==y0);
 P.pos.set(0,0,30);P.yaw=0;P.vel.set(0,0,0);key('KeyW');frames(30);key('KeyW','keyup');ok('input.moveW',P.pos.z<28,P.pos.z.toFixed(2));
 G.hp=40;const mk=sv.save.medkits;tap('KeyH');ok('heal.medkit',mk>0?G.hp>40:true,G.hp);
 tap('Escape');ok('pause.escape',G.paused&&!document.getElementById('scrPause').hidden);const t0=G.time;frames(30);ok('pause.timeFrozen',G.time===t0);click('pResume');ok('pause.resume',!G.paused);
 DS.input.bind('reload',['KeyT']);G.ammo[G.weapon]=2;tap('KeyR');const oldW=G.reloadT>0;G.reloadT=0;tap('KeyT');ok('rebind.works',!oldW&&G.reloadT>0);DS.input.reset();G.reloadT=0}
// 6. śmierć, druga szansa, restart, wyjście; levelEnd raz na run
{const ev=[];const u=DS.bus.on('levelEnd',e=>ev.push(e.reason));const G=S.G;cmb.hurt(1000);ok('death.dead',G.dead);await sleep(1700);ok('death.overScreen',vis()==='scrOver',vis());
 click('oAgain');await sleep(100);ok('restart.newRun',S.G!==G&&!S.G.dead&&S.mode==='game');frames(60);
 tap('Escape');click('pQuit');ok('quit.menu',S.mode==='menu'&&vis()==='scrMenu');ok('quit.sceneBaseline',rend.scene.children.length===SCENE0,rend.scene.children.length+' vs '+SCENE0);
 ok('bus.levelEndOncePerRun',ev.join()==='death,quit',ev.join());u()}
// 7. zapis
{const raw=localStorage.getItem('discoStrzelnica.save.v1');ok('save.persisted',!!raw&&JSON.parse(raw).coins===sv.save.coins)}
ok('console.noErrorsOrWarnings',errs.length===0,errs.slice(0,3).join(' | '));
return R})()
