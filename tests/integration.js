// Test integracyjny fazy 1: bronie (kupno w sklepie, wybór, strzał, przeładowanie, wyciek), level-up z perkiem,
// pancerz i leczenie, rebind w UI, spójność rejestrów. Wymaga świeżo załadowanej strony (ekran ostrzeżenia).
// Użycie: (0,eval)(await (await fetch('/tests/integration.js')).text()).then(r=>JSON.stringify(r,null,1))
// Wynik: {nazwa: 'PASS'|'FAIL (szczegóły)'|'info: ...'}. Nie mierzy FPS (to robi tests/perf.js w widocznym oknie).
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,R={},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d?' ('+d+')':''),S=Q.S;
const geo=()=>Q.rend.renderer.info.memory.geometries;
// --- 1. sklep: kupno wszystkich broni przez UI ---
document.getElementById('warnFull').click();await Q.sleep(150);
Q.sv.save.coins=900000;Q.sv.persist();
document.querySelector('#scrMenu [data-go=scrShop]').click();await Q.sleep(80);
document.querySelector('#shopTabs button[data-npc=zdzichu]').click();await Q.sleep(80);
for(let g=0;g<40;g++){const b=[...document.querySelectorAll('#npcItems .item button')].find(b=>!b.disabled);if(!b)break;b.click();await Q.sleep(15)}
const ids=DS.weapons.ids();
ok('shop.allWeaponsBought',Q.sv.save.weapons.length===ids.length,Q.sv.save.weapons.length+'/'+ids.length);
const keyLabels=[...document.querySelectorAll('#npcItems .item p')].map(p=>+(p.textContent.match(/klawisz (\d+)/)||[])[1]).filter(Boolean);
ok('shop.keyLabelsReachable(slots 1-6)',keyLabels.length>0&&keyLabels.every(k=>DS.input.has('weapon'+k)),'sklep podaje klawisze '+[...new Set(keyLabels)].join(',')+', akcje weapon1-N: '+DS.input.all().filter(a=>/^weapon\d+$/.test(a.id)).length);
document.querySelector('#scrShop [data-go=scrMenu]').click();await Q.sleep(40);
// --- 2. bronie w grze ---
await Q.start();const G=S.G;Q.frames(10);
const noModel=[];
for(const id of ids){
  const W=DS.weapons.get(id);G.hp=G.maxHp;Q.fire.switchWeapon(id);Q.frames(3);
  ok('weapon.select.'+id,G.weapon===id);
  let meshes=0;Q.vm.gunRoot.traverse(o=>{if(o.isMesh&&o!==Q.vm.flash)meshes++});if(!meshes)noModel.push(id);
  G.fireT=0;G.reloadT=0;G.ammo[id]=W.mag;Q.fire.fire();ok('weapon.fire.'+id,G.ammo[id]===W.mag-1);
  G.ammo[id]=1;G.fireT=0;Q.fire.startReload();Q.frames(Math.ceil((W.reload+.15)*60));ok('weapon.reload.'+id,G.ammo[id]===W.mag,G.ammo[id]+'/'+W.mag);
}
ok('weapon.allHaveViewmodel',noModel.length===0,'bez modelu (niewidoczna broń): '+noModel.join(','));
// wyciek geometrii przy zmianie broni (40 przełączeń)
for(const w of ids){Q.fire.switchWeapon(w);Q.frame()}Q.fire.switchWeapon('pistol');Q.frame();const g0=geo(),o0=Q.mat.outlines.length,c0=Q.vm.gunRoot.children.length;
for(let k=0;k<2;k++)for(const w of ids){Q.fire.switchWeapon(w);Q.frame()}Q.fire.switchWeapon('pistol');Q.frame();
ok('leak.weaponSwitchGeometry',geo()-g0<=4,'+'+(geo()-g0)+' geometrii / '+(2*ids.length)+' przełączeń (buildGun nie zwalnia starego modelu)');ok('leak.weaponSwitchChildren',Q.vm.gunRoot.children.length===c0,'gunRoot.children '+c0+' -> '+Q.vm.gunRoot.children.length);
ok('leak.weaponSwitchOutlines',Q.mat.outlines.length-o0<=2,'+'+(Q.mat.outlines.length-o0));
// klawisze 1-9 i kółko
{let bad='';const SL=await import('/js/weapons/slots.js');
 for(let i=1;i<=SL.SLOT_COUNT;i++){Q.tap('Digit'+i);const l=SL.slotWeapons(i);if(!l.includes(G.weapon)){bad='klawisz '+i+': '+G.weapon+' nie jest ze slotu '+i;break}
  if(l.length>1){const seen=new Set([G.weapon]);for(let k=0;k<l.length;k++){Q.tap('Digit'+i);seen.add(G.weapon)}if(seen.size!==l.length){bad='slot '+i+' nie przełącza cyklicznie: '+[...seen];break}}}
 ok('input.slotKeys1to6',!bad,bad);
 // legacy 'smg' z zapisu = uzi
 const sv0=Q.sv.save.weapons.slice();Q.sv.save.weapons=['pistol','smg'];Q.fire.switchWeapon('pistol');Q.tap('Digit2');ok('save.smgAliasToUzi',G.weapon==='uzi',G.weapon);Q.sv.save.weapons=sv0}
// --- 3. pancerz i leczenie ---
G.enemies.forEach(e=>e.alive=false);G.armor=50;G.armorMax=100;G.hp=100;Q.cmb.hurt(20);
ok('armor.hurtUsesArmor',G.hp>80&&G.armor<50,'hp='+G.hp+' armor='+G.armor+' (hurt() nie woła absorbDamage; docs/requests/ds-healing.md #1)');
const pk=await import('/js/pickups/index.js');
for(const [k,v] of [['med',30],['bandage',pk.CFG.bandage.total],['adrenaline',pk.CFG.adrenaline.heal],['vest',pk.CFG.vest.add],['zapiekanka',pk.CFG.food.zapiekanka.heal],['kebab',pk.CFG.food.kebab.heal],['zubr',pk.CFG.food.zubr.heal]]){
  G.enemies.forEach(e=>e.alive=false);G.hp=40;G.armor=0;pk.spawnPickup(k,new THREE.Vector3(Q.P.pos.x,.5,Q.P.pos.z),v);Q.frames(150);
  ok('pickup.'+k,k==='vest'?G.armor>0:G.hp>40,'hp='+G.hp.toFixed(1)+' armor='+G.armor.toFixed(1));}
G.hp=40;Q.sv.save.medkits=2;Q.tap('KeyH');ok('heal.medkitKey',G.hp>=90);
ok('combat.noDuplicateMedDrop',!/spawnPickup\('med'/.test(await (await fetch('/js/game/combat.js')).text()),'combat.js nadal losuje apteczkę obok pickups/drops.js (requests #2)');
{const q=Q.P;const run=()=>{q.pos.set(0,0,30);q.vel.set(0,0,0);q.yaw=0;Q.key('KeyW');Q.frames(30);Q.key('KeyW','keyup');Q.frames(20);return 30-q.pos.z};G.adrenT=0;const d0=run();G.adrenT=6;const d1=run();G.adrenT=0;ok('adrenaline.speedUsed',d1>d0*1.2&&DS.player.recoilMul()===1,'dystans bez/z adrenalina: '+d0.toFixed(2)+' / '+d1.toFixed(2))}
// --- 4. level-up: prawdziwy przebieg ekranu ---
Q.keepLevelup=true;G.enemies.forEach(e=>e.alive=false);G.hp=G.maxHp;
const ev=[];for(const n of ['xp','levelup','perk','pause'])DS.bus.on(n,p=>ev.push(n));
DS.progression.levelUp();let n=0;while(!DS.progression.ui.isOpen()&&n<300){G.hp=G.maxHp;Q.frame();n++}
ok('levelup.opens',DS.progression.ui.isOpen()&&G.paused,n+' klatek');
document.getElementById('lvSpin').click();await Q.sleep(6200);await Q.sleep(800);
ok('levelup.perkAwarded',Object.keys(G.perks).length===1&&ev.includes('perk'),JSON.stringify(G.perks));
document.getElementById('lvTake').click();await Q.sleep(100);
ok('levelup.resumes',!G.paused&&!DS.progression.ui.isOpen());
ok('levelup.eventOrder',ev.join()==='levelup,xp,pause,perk,pause'||ev.join().includes('perk'),ev.join());
Q.keepLevelup=false;
// wszystkie perki: brak wyjątków, nakładki broni przywracane po wyjściu
const w0=DS.weapons.get('glock17').mag+'/'+DS.weapons.get('glock17').rate+'/'+DS.weapons.get('glock17').reload;
for(const p of DS.perks.all()){let k=0;while(DS.progression.grant(p.id)&&k<12)k++}Q.frames(60);
ok('perks.allApplyNoError',Q.errs.length===0,Q.errs.slice(0,2).join('|'));
Q.flow.quitToMenu();await Q.sleep(50);
ok('perks.patchesRestored',DS.weapons.get('glock17').mag+'/'+DS.weapons.get('glock17').rate+'/'+DS.weapons.get('glock17').reload===w0);
// --- 5. rebind przez UI i w grze ---
document.getElementById('mOpts').click();await Q.sleep(80);document.getElementById('optTab-ctl').click();await Q.sleep(60);
document.querySelector('.slot[data-a=reload][data-i="0"]').click();await Q.sleep(40);Q.key('KeyT');Q.key('KeyT','keyup');await Q.sleep(80);
ok('rebind.ui',document.querySelector('.slot[data-a=reload][data-i="0"]').textContent==='T');
ok('rebind.useVisibleInControls',!!document.querySelector('.bind[data-a=use]'),'akcja use (E) nie ma group i nie jest na liście Sterowania (requests ds-healing #5b)');
document.getElementById('optBack').click();await Q.sleep(40);document.getElementById('mPlay').click();await Q.sleep(150);const G2=S.G;Q.frames(10);
G2.ammo[G2.weapon]=2;G2.reloadT=0;Q.tap('KeyR');const oldKey=G2.reloadT>0;G2.reloadT=0;Q.tap('KeyT');ok('rebind.inGame',!oldKey&&G2.reloadT>0);
DS.input.reset();
// --- 6. rejestry ---
ok('registry.useActionOnce',DS.input.all().filter(a=>a.id==='use').length===1);
ok('registry.conflictsEmpty',Object.keys(DS.input.conflicts()).length===0,JSON.stringify(DS.input.conflicts()));
const uzis=DS.weapons.all().filter(w=>/^Uzi/.test(w.name)).map(w=>w.id);ok('registry.singleUzi',uzis.length===1,'dwa Uzi: '+uzis.join('+')+' (legacy smg i data/uzi.js; requests ds-weapon-data #1)');
// --- 7. spinanie fazy 1: trudność, opcje, przeładowanie poziomu, migracja zapisu ---
{const sp=await import('/js/enemies/manager.js'),opt=Q.sv.opt,G3=S.G;G3.wave=1;G3.enemies.forEach(e=>e.alive=false);const hp={},dmg={};
 for(const d of ['easy','normal','hard']){opt.difficulty=d;const e=sp.spawnEnemy('gangster',{boss:false});hp[d]=e.hp;dmg[d]=e.dmg;e.alive=false}opt.difficulty='normal';
 ok('difficulty.enemyHpDmg',Math.abs(hp.easy/hp.normal-.75)<.01&&Math.abs(hp.hard/hp.normal-1.35)<.01&&Math.abs(dmg.easy/dmg.normal-.75)<.01&&Math.abs(dmg.hard/dmg.normal-1.25)<.01,JSON.stringify({hp,dmg}));
 const e=sp.spawnEnemy('gangster',{boss:false});e.hp=1e6;const pt=new THREE.Vector3();const n0=G3.floaters.length;opt.dmgNum=0;Q.cmb.damageEnemy(e,1,false,pt);const n1=G3.floaters.length;opt.dmgNum=1;Q.cmb.damageEnemy(e,1,false,pt);const n2=G3.floaters.length;
 ok('opt.dmgNum',n1===n0&&n2===n1+1,n0+'/'+n1+'/'+n2);e.alive=false;
}
Q.flow.quitToMenu();Q.frames(3);
{const wl=await import('/js/world/world.js'),w=Q.wst.world,sc=()=>Q.rend.scene.children.length;
 const base={sc:sc(),col:w.colliders.length,mesh:w.meshes.length,neon:w.neon.length,out:Q.mat.outlines.length};
 // renderer.info.memory.geometries liczy geometrie dopiero po wgraniu na GPU, a wgrywa je pierwszy render, w ktorym obiekt jest w frustum.
 // Zywa petla (rAF) obraca kamere menu miedzy pomiarami, wiec wczesniej +13 geometrii pojawialo sie losowo. warm() renderuje scene w 8 kierunkach.
 const cam=Q.rend.camera,warm=()=>{const p=cam.position.clone(),r=cam.rotation.clone();cam.position.set(0,3,0);for(let a=0;a<8;a++){cam.rotation.set(0,a*Math.PI/4,0);Q.rend.renderer.render(Q.rend.scene,cam)}cam.position.copy(p);cam.rotation.copy(r)};
 wl.loadLevel('remiza');Q.frames(3);warm();const g1=geo();
 for(let k=0;k<5;k++){wl.loadLevel('remiza');Q.frames(2)}await Q.sleep(30);Q.frames(2);warm();
 const now={sc:sc(),col:w.colliders.length,mesh:w.meshes.length,neon:w.neon.length,out:Q.mat.outlines.length};
 ok('level.reloadStable',JSON.stringify(base)===JSON.stringify(now)&&geo()-g1<=3,JSON.stringify(base)+' -> '+JSON.stringify(now)+' geo +'+(geo()-g1));
 ok('level.neonsAfterReload',w.neon.length===4&&w.neon.every(s=>s.parent===Q.rend.scene));
 ok('level.selectLoads',(()=>{let hit=0;const off=DS.bus.on('levelLoad',()=>hit++);DS.levels.register({id:'__t',name:'T',arena:30,spawn:{x:0,z:10,yaw:0},menuCam:{r:20,y:6,look:[0,3,0]},build(){DS.props.get('crate').place({x:3,z:3,s:1.6})}});
   DS.bus.emit('levelSelect',{level:'__t'});const ok1=hit===1&&w.level.id==='__t'&&w.colliders.length===1&&w.neon.length===0&&w.meshes.length>0;
   DS.bus.emit('levelSelect',{level:'remiza'});off();DS.levels.remove('__t');return ok1&&w.level.id==='remiza'&&w.neon.length===4})());
 await Q.sleep(30);Q.frames(3);ok('level.switchSceneBaseline',sc()===base.sc&&w.colliders.length===base.col,sc()+' vs '+base.sc);
}Q.flow.quitToMenu();
ok('console.noErrorsOrWarnings',Q.errs.length===0,Q.errs.slice(0,3).join(' | '));
return R})()
