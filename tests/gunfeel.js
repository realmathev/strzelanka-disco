// Gunfeel z prawdziwymi zdarzeniami wejscia (mousedown/mouseup na canvasie #gl, keydown na oknie), ale klatki reczne (QA.frames), wiec dziala tez
// w ukrytym panelu, gdzie rAF stoi. Sprawdza: ADS (PPM, tryb trzymaj i przelacz), serie z automatu, odrzut/kamere, przeladowanie klawiszem R,
// klawisze 1-6 i kolko, hit-stop (opt.hitStop 1/0, tryb Bezpieczna fx=0), brak blysku/wstrzasu w trybie Bezpieczna.
// Hit-stop = flaga na zegarze scianowym (DS.gunfeel.hitStopActive), wiec probkujemy ja synchronicznie w zdarzeniach hit/kill i po kazdej klatce.
// Uzycie (swieza strona): window.__gf=null;(0,eval)(await (await fetch('/tests/gunfeel.js')).text()).then(r=>window.__gf=r);  ~10 s
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,P=Q.P,R={},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d!==undefined?' ('+d+')':''),inf=(n,v)=>R['info.'+n]=v;
const {opt}=await import('/js/core/save.js'),mg=await import('/js/enemies/manager.js'),cv=document.getElementById('gl');
const md=b=>cv.dispatchEvent(new MouseEvent('mousedown',{button:b,bubbles:true,cancelable:true})),mu=b=>dispatchEvent(new MouseEvent('mouseup',{button:b,bubbles:true}));
if(document.getElementById('warnFull'))document.getElementById('warnFull').click();await Q.sleep(150);
await Q.start();const G=S.G;G.queue=0;G.between=1e12;G.cleared=true;
const god=()=>{S.G.hp=S.G.maxHp};
const run=(n,cb)=>{for(let i=0;i<n;i++){god();if(cb)cb(i);Q.frame()}};
const camera=Q.rend.camera;
// --- ADS (trzymaj PPM) ---
opt.adsMode='hold';opt.fx=1;P.pos.set(0,0,0);P.yaw=0;P.pitch=0;Q.frames(10);
const fov0=camera.fov;md(2);Q.frames(45);
const mul=DS.player.fovMul,fovAds=camera.fov;
ok('ads.holdZooms',mul<.95&&fovAds<fov0-1,'fovMul='+mul.toFixed(2)+' fov '+fov0+'->'+fovAds.toFixed(1));
ok('ads.adsActive',DS.input.adsActive()===true);
opt.adsSens=1;const sN=DS.input.sensitivity();opt.adsSens=.5;const sA=DS.input.sensitivity();opt.adsSens=1;
ok('ads.sensScaled',Math.abs(sA/sN-.5)<.01,sA+' vs '+sN);
mu(2);Q.frames(45);ok('ads.releaseRestores',DS.player.fovMul>.99&&Math.abs(camera.fov-fov0)<.5,'fovMul='+DS.player.fovMul.toFixed(2));
opt.adsMode='toggle';md(2);mu(2);Q.frames(45);const tog1=DS.player.fovMul;md(2);mu(2);Q.frames(45);const tog2=DS.player.fovMul;opt.adsMode='hold';
ok('ads.toggleMode',tog1<.95&&tog2>.99,'po 1. kliku '+tog1.toFixed(2)+', po 2. '+tog2.toFixed(2));
// --- bronie ---
Q.sv.save.coins=1e6;for(const id of DS.weapons.ids())if(!Q.sv.save.weapons.includes(id))Q.sv.save.weapons.push(id);
Q.fire.switchWeapon('akm');Q.frames(40);ok('weapon.switchedToAkm',S.G.weapon==='akm',S.G.weapon);
// cel stojacy 14 m przed graczem, niesmiertelny, nie atakuje
const target=(type='dres',hp=1e5)=>{mg.spawnEnemy(type,{boss:false});const t=S.G.enemies.filter(z=>z.alive).pop();t.hp=t.maxHp=hp;t.speed=0;t.dmg=0;t.g.position.set(P.pos.x,0,P.pos.z-14);
  t.ai&&(t.ai.state='idle');return t};
const aimAt=(t,part)=>{const h=t.meshes.find(m=>m.userData.part===part)||t.meshes[0];const v=new THREE.Vector3();h.getWorldPosition(v);const dx=v.x-P.pos.x,dz=v.z-P.pos.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(v.y-1.62,Math.hypot(dx,dz))};
const en=target();
// --- seria ---
const s0=S.G.shots,a0=S.G.ammo.akm;let camMax=0,kick=false;
md(0);for(let i=0;i<90;i++){god();aimAt(en,'body');Q.frame();camMax=Math.max(camMax,Math.abs(camera.rotation.x-P.pitch)+Math.abs(camera.rotation.y-P.yaw)+Math.abs(camera.rotation.z));if(DS.player.vmOffset&&DS.player.vmOffset.pos.length()>.002)kick=true}mu(0);
const shots=S.G.shots-s0,rate=DS.weapons.get('akm').rate;
ok('burst.autoFires',shots>=Math.floor(1.5/rate*.6),shots+' strzalow w 1,5 s (kadencja '+rate+' s, oczekiwane ~'+Math.round(1.5/rate)+')');
ok('burst.ammoDrops',S.G.ammo.akm<a0,a0+'->'+S.G.ammo.akm);
ok('burst.cameraKicks',camMax>0||kick,'odchylenie kamery od P.pitch/yaw max '+camMax.toFixed(4)+' rad, vmOffset '+kick);
ok('burst.enemyDamaged',en.hp<en.maxHp,Math.round(en.hp)+'/'+en.maxHp);
// --- przeladowanie ---
S.G.ammo.akm=5;const mag=DS.weapons.get('akm').mag;Q.tap('KeyR');Q.frames(6);ok('reload.starts',S.G.reloadT>0,'reloadT='+S.G.reloadT);
run(Math.ceil(DS.weapons.get('akm').reload*60)+40);ok('reload.finishes',S.G.reloadT<=0&&S.G.ammo.akm===mag,'ammo '+S.G.ammo.akm+'/'+mag);
// strzal podczas przeladowania nie dziala
S.G.ammo.akm=3;Q.tap('KeyR');Q.frames(3);const sh0=S.G.shots;md(0);run(20);mu(0);ok('reload.blocksFire',S.G.shots===sh0,(S.G.shots-sh0)+' strzalow w trakcie');run(200);
// --- hit-stop ---
const killTest=()=>{{const e0=performance.now()+120;while(performance.now()<e0);}   // odczekaj, az wygasnie hit-stop z poprzedniego testu (zegar scienny, klatki reczne sa szybkie)
  const t=target('dres',1);let seen=0,onEv=0;const o1=DS.bus.on('hit',()=>{if(DS.gunfeel.hitStopActive())onEv++}),o2=DS.bus.on('kill',()=>{if(DS.gunfeel.hitStopActive())onEv++});
  S.G.fireT=0;S.G.reloadT=0;S.G.ammo[S.G.weapon]=30;md(0);run(120,()=>{if(t.alive)aimAt(t,'head');if(DS.gunfeel.hitStopActive())seen++});mu(0);o1();o2();return {killed:!t.alive,seenAfterFrame:seen,seenInEvent:onEv}};
opt.fx=1;opt.hitStop=1;const k1=killTest();ok('hitstop.onWhenEnabled',k1.killed&&(k1.seenAfterFrame+k1.seenInEvent)>0,JSON.stringify(k1));
opt.hitStop=0;const k2=killTest();ok('hitstop.offWhenOptionOff',k2.killed&&k2.seenAfterFrame+k2.seenInEvent===0,JSON.stringify(k2));
opt.hitStop=1;opt.fx=0;const k3=killTest();ok('hitstop.offInSafeMode(fx=0)',k3.killed&&k3.seenAfterFrame+k3.seenInEvent===0,JSON.stringify(k3));
// --- tryb Bezpieczna: brak blysku ekranu/wstrzasu ---
{opt.fx=0;const t=target('dres',1e5);let flash=0,shake=0,light=0;S.G.fireT=0;S.G.ammo[S.G.weapon]=30;
 md(0);for(let i=0;i<60;i++){god();aimAt(t,'body');Q.frame();flash=Math.max(flash,S.G.flashT||0);shake=Math.max(shake,Math.abs(camera.rotation.z));const f=DS.player.flash;if(f&&f.intensity)light=Math.max(light,f.intensity)}mu(0);
 inf('safeMode.maxFlashT/camRoll/muzzleLight',flash+' / '+shake+' / '+light);ok('safe.noScreenFlash',flash===0,flash);ok('safe.noShake',shake<=.001,shake);
 opt.fx=1;S.G.fireT=0;S.G.shake=0;md(0);let shake1=0;for(let i=0;i<60;i++){god();aimAt(t,'body');Q.frame();shake1=Math.max(shake1,Math.abs(camera.rotation.z))}mu(0);inf('fullFx.camRoll',shake1)}
// --- klawisze 1-6, kolko ---
const slots=[];for(const k of ['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6']){Q.tap(k);Q.frames(30);slots.push(S.G.weapon)}
ok('weapon.slotKeysChangeWeapon',new Set(slots).size>=4,slots.join(','));
const wn=S.G.weapon;dispatchEvent(new WheelEvent('wheel',{deltaY:100}));Q.frames(30);ok('weapon.wheelChanges',S.G.weapon!==wn,wn+'->'+S.G.weapon);
// zmiana broni w trakcie ADS nie zawiesza ADS / FOV wraca po puszczeniu
md(2);Q.frames(30);Q.tap('Digit2');Q.frames(30);mu(2);Q.frames(45);ok('ads.releaseAfterSwitchRestoresFov',DS.player.fovMul>.99,DS.player.fovMul.toFixed(2));
R.errs=Q.errs.slice(0,5);ok('console.noErrorsOrWarnings',Q.errs.length===0,Q.errs.slice(0,3).join('|'));
Q.flow.quitToMenu();return R})()
