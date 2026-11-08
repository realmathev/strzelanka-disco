// Poziom Kasyno „Złoty Bandyta” (faza 2): wczytanie z menu, osiagalnosc mapy (BFS), 14 znajdziek, 2 sekretne drzwi (E) + 2 windy (skrot A<->B),
// strefy spawnu i dojscie wrogow, budzet draw calli z 30 wrogami, boss w arenie (Jednooki) + pasek HP, ekran "Poziom ukonczony", wycieki przy
// przelaczaniu poziomu, chodzenie prawdziwymi klawiszami (utkniecie/wypadniecie), zrzuty tests/shots/kasyno-*.png.
// Uzycie (swieza strona, okno widoczne): window.__ks=null;(0,eval)(await (await fetch('/tests/kasyno.js')).text()).then(r=>window.__ks=r);  ~90 s, potem odczytaj window.__ks
// Zrzuty: gdy istnieje window.shot(nazwa) (runner CDP) zapisuje PNG; inaczej POST na /__shot/<nazwa> (node tests/serve-shots.js).
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,P=Q.P,R={},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d!==undefined?' ('+d+')':''),inf=(n,v)=>R['info.'+n]=v;
const wl=await import('/js/world/world.js'),ws=await import('/js/world/state.js'),cm=await import('/js/world/levels/common.js'),mg=await import('/js/enemies/manager.js'),wv=await import('/js/game/waves.js'),cb=await import('/js/game/combat.js');
const nav=await import('/js/enemies/nav.js');
const world=ws.world,info=Q.rend.renderer.info;
const shot=async n=>{Q.frames(3);if(window.shot){await window.shot('kasyno-'+n+'.png');return}
  try{await fetch('/__shot/kasyno-'+n+'.png',{method:'POST',body:Q.rend.renderer.domElement.toDataURL('image/png')})}catch(e){}};
if(document.getElementById('warnFull'))document.getElementById('warnFull').click();await Q.sleep(150);
// --- 1. wybor poziomu w menu przez UI ---
const zmien=[...document.querySelectorAll('#scrMenu *')].find(e=>e.textContent.trim().toLowerCase().match(/^(zmień|change)$/));
if(zmien){zmien.click();await Q.sleep(150);const it=[...document.querySelectorAll('.screen:not([hidden]) *')].find(e=>/kasyno/i.test(e.textContent)&&(e.tagName==='BUTTON'||e.onclick||e.closest('button')));if(it){(it.closest('button')||it).click();await Q.sleep(400)}}
if(world.level.id!=='kasyno'){inf('menuPicker','nie udalo sie wybrac przez UI, uzyto levelSelect');(await import('/js/core/save.js')).opt.level='kasyno';DS.bus.emit('levelSelect',{level:'kasyno'});await Q.sleep(300)}
ok('level.loadedFromMenu',world.level.id==='kasyno',world.level.id);
const L=world.level;
ok('level.size3to4xRemiza',(2*world.arena)**2/(84*84)>=3&&(2*world.arena)**2/(84*84)<=4,((2*world.arena)**2/(84*84)).toFixed(2)+'x');
ok('level.hasTrackAndZonesAndBossArena',L.track==='C'&&L.spawnZones.length>=8&&!!L.waves.bossArena&&L.win.boss==='boss_jednooki');
// --- 2. ponowne wczytanie: ostrzezenia, czas budowy ---
const w0=console.warn,got=[];console.warn=(...a)=>{got.push(a.join(' '))};const t0=performance.now();wl.loadLevel('kasyno');const buildMs=Math.round(performance.now()-t0);console.warn=w0;
inf('buildMs',buildMs);inf('atlasWarnings',got.length);
// --- 3. osiagalnosc (BFS 0,5 m, promien 0,4); sekretne drzwi i windy otwarte ---
const cmd=cm.debugState();
const cols=()=>world.colliders.filter(c=>c.h>=.9&&c.x0<1e4);
const reach=(from)=>{const A=world.arena,st=.5,N=Math.round(2*A/st),cs=cols();
  const blocked=new Uint8Array(N*N);for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=-A+i*st+st/2,z=-A+j*st+st/2;for(const c of cs){const cx=Math.max(c.x0,Math.min(x,c.x1)),cz=Math.max(c.z0,Math.min(z,c.z1));if((x-cx)**2+(z-cz)**2<.16){blocked[i*N+j]=1;break}}}
  const idx=(x,z)=>Math.floor((x+A)/st)*N+Math.floor((z+A)/st);const seen=new Uint8Array(N*N),q=[idx(from.x,from.z)];if(blocked[q[0]])return {blocked,seen,N,A,st,startBlocked:true};seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const c=q[h],i=(c/N)|0,j=c%N;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=N||b>=N)continue;const k=a*N+b;if(!seen[k]&&!blocked[k]){seen[k]=1;q.push(k)}}}
  return {blocked,seen,N,A,st,count:q.length,startBlocked:false}};
await Q.start();const G=S.G;G.queue=0;G.between=1e12;G.cleared=true;DS.bus.on('update',()=>{const g=S.G;if(g){g.hp=g.maxHp;g.ammo[g.weapon]=99}});
ok('start.spawnFree',!reach(L.spawn).startBlocked);
const sec=cmd.doors.filter(d=>d.secret);
ok('secrets.doorsCount',sec.length===2,sec.map(d=>d.label).join(','));
const sd=[];
for(const d of sec){
  const side=d.axis==='x'?[d.px,d.pz+1.5]:[d.px+1.5,d.pz];
  P.pos.set(side[0],0,side[1]);Q.frames(10);Q.tap('KeyE');Q.frames(70);
  sd.push({label:d.label,open:d.t>.55,colMoved:d.col.x0>1e4});
}
ok('secrets.openWithE',sd.length===2&&sd.every(s=>s.open&&s.colMoved),JSON.stringify(sd));
{const d=sec[0];const side=d.axis==='x'?[d.px,d.pz+1.5]:[d.px+1.5,d.pz];P.pos.set(side[0],0,side[1]);Q.frames(5);Q.tap('KeyE');Q.frames(80);ok('secrets.closeWithE',d.t<.3,'t='+d.t.toFixed(2));Q.tap('KeyE');Q.frames(80)}
const lifts=L._lifts;ok('lifts.count',lifts&&lifts.length===2);
// windy: otworz obie (kabiny maja osobne kolidery drzwi) tylko na czas BFS
const openLifts=()=>lifts.forEach(l=>{l.target=1;l.t=1;l.col.x0=l.col0.x0+1e5;l.col.x1=l.col0.x1+1e5});
const closeLifts=()=>lifts.forEach(l=>{l.target=0;l.t=0;l.col.x0=l.col0.x0;l.col.x1=l.col0.x1});
openLifts();
const rc=reach(L.spawn);inf('reach.cellsFromSpawn',rc.count+' / '+(rc.N*rc.N));
closeLifts();
const items=L.collectibles,bad=[];
for(const it of items.filter(i=>i.id!=='ks-klucz-2')){const i=Math.floor((it.x+rc.A)/rc.st),j=Math.floor((it.z+rc.A)/rc.st);let near=false;for(let a=-2;a<=2&&!near;a++)for(let b=-2;b<=2;b++){const k=(i+a)*rc.N+(j+b);if(rc.seen[k]){near=true;break}}if(!near)bad.push(it.id)}
ok('reach.allCollectiblesReachable',bad.length===0,bad.join(','));
const seenAt=(x,z)=>rc.seen[Math.floor((x+rc.A)/rc.st)*rc.N+Math.floor((z+rc.A)/rc.st)]===1;
for(const s of L.starts)ok('reach.start.'+s.name,seenAt(s.x,s.z));
for(const [n,x,z] of [['arenaBossa',0,-22],['scena',0,-34],['kuchnia',-48,-54],['magazyn',48,-54],['korytarzZaScena',0,-43],['skarbiec',0,-56],['chlodnia',-62,-44],['aleja.W',-71,-10],['aleja.E',71,-10],['podworze',0,-72.5],['parking.W',-40,48],['parking.E',40,48]])ok('reach.'+n,seenAt(x,z));
// pętla zewnetrzna: aleja W -> podworze -> aleja E bez przechodzenia przez budynek (budynek zablokowany: sprawdz, czy aleje lacza sie z parkingiem po obu stronach)
{const mid=(x0,x1,z0,z1)=>{let n=0;for(let x=x0;x<=x1;x+=1)for(let z=z0;z<=z1;z+=1)if(seenAt(x,z))n++;return n};inf('pętlaZewn.alejaW/E/podworze',mid(-74,-68,-60,20)+' / '+mid(68,74,-60,20)+' / '+mid(-60,60,-74,-68))}
// wolne, nieosiagalne kieszenie (poza sekretnymi pokojami) = martwe miejsca / mozliwe utkniecie
{const pockets=[];const vis=new Uint8Array(rc.N*rc.N);const isSecretRoom=(x,z)=>(Math.abs(x)<8&&z<-46)||(x<-57.6&&z<-40.4&&z>-48)||false;
  for(let i=0;i<rc.N;i++)for(let j=0;j<rc.N;j++){const k=i*rc.N+j;if(rc.blocked[k]||rc.seen[k]||vis[k])continue;const q=[k];vis[k]=1;let sx=0,sz=0;for(let h=0;h<q.length;h++){const c=q[h],a=(c/rc.N)|0,b=c%rc.N;sx+=a;sz+=b;for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=a+da,v=b+db;if(u<0||v<0||u>=rc.N||v>=rc.N)continue;const m=u*rc.N+v;if(!vis[m]&&!rc.blocked[m]&&!rc.seen[m]){vis[m]=1;q.push(m)}}}
    const cx=-rc.A+sx/q.length*rc.st,cz=-rc.A+sz/q.length*rc.st;if(q.length>=8&&!isSecretRoom(cx,cz))pockets.push(Math.round(cx)+','+Math.round(cz)+' ('+Math.round(q.length*rc.st*rc.st)+' m2)')}
  ok('reach.noUnreachablePocketsOver2m2',pockets.length===0,pockets.slice(0,6).join(' | '))}
// strefy spawnu: kazda ma wolne i osiagalne komorki nawigacji
{const zb=[];for(const z of L.spawnZones){let n=0;for(let a=0;a<40;a++){const x=z.x+Math.cos(a)*z.r*.6,y=z.z+Math.sin(a)*z.r*.6;if(nav.isFree(x,y,0)&&seenAt(x,y))n++}if(n<3)zb.push(z.id+'('+n+')')}
  ok('spawnZones.eachHasFreeReachableCells',zb.length===0,zb.join(','))}
// --- 4. znajdzki: teleport + klatki ---
const c0=Q.sv.save.coins,k0=Q.sv.save.keys;Q.sv.save.lvFound={};cmd.col.items.forEach(i=>i.got=false);
for(const it of items){P.pos.set(it.x,0,it.z);Q.frames(3)}
const st=cm.collectStats(L);ok('collect.14of14',st.found===14&&st.total===14,st.found+'/'+st.total);
ok('collect.idsStable',items.every(i=>/^ks-(kaseta|lancuch|klucz|plakat)-\d$/.test(i.id))&&new Set(items.map(i=>i.id)).size===14);
ok('collect.rewards',Q.sv.save.keys===k0+2&&Q.sv.save.coins>c0,'klucze +'+(Q.sv.save.keys-k0)+', monety +'+(Q.sv.save.coins-c0));
ok('collect.persistedOnce',['ks-kaseta-1','ks-klucz-1','ks-plakat-1'].every(id=>Q.sv.save.lvFound[id]));
ok('collect.secretCount>=4',items.filter(i=>i.secret).length>=4);
// --- 5. windy: A -> B na E ---
{closeLifts();const A=lifts[0],B=lifts[1],key2=items.find(i=>i.id==='ks-klucz-2');key2.got=false;delete Q.sv.save.lvFound['ks-klucz-2'];
  P.pos.set(A.x,0,A.z+.68+1.8);P.yaw=Math.PI;Q.frames(8);Q.tap('KeyE');Q.frames(70);const opened=A.t>.8;
  P.pos.set(A.x,0,A.z);Q.frames(4);Q.tap('KeyE');Q.frames(110);
  ok('lifts.rideAtoB',opened&&Math.abs(P.pos.x-B.x)<1&&Math.abs(P.pos.z-B.z)<1&&B.target===1,'otwarta='+opened+', gracz '+P.pos.x.toFixed(1)+','+P.pos.z.toFixed(1));
  P.pos.set(B.x,0,B.z+.68+1.8);Q.frames(30);ok('lifts.canExitB',P.pos.z>-63);ok('lifts.keyInCabBCollectedOnArrival',key2.got===true&&Q.sv.save.lvFound['ks-klucz-2']===true);
  Q.tap('KeyE');Q.frames(5);closeLifts()}
// --- 6. zrzuty ---
const shots=[['parking',0,66,0,.05],['foyer',0,22,0,.02],['parkiet',0,-4,0,-.08],['sala',-44,10,Math.PI/2,0],['stoly',40,16,-Math.PI/2,0],['bar',-36,-12,Math.PI/2+.5,0],['vip',40,-10,-Math.PI/2-.3,0],['kuchnia',-34,-46,Math.PI/2+.4,0],['magazyn',33,-53,-Math.PI/2+.2,0],['zaplecze',0,-43,Math.PI/2,0]];
G.enemies.forEach(e=>{e.alive=false});
for(const [n,x,z,yaw,pit] of shots){P.pos.set(x,0,z);P.yaw=yaw;P.pitch=pit;P.vel.set(0,0,0);await shot(n)}
// skarbiec otwarty
{const d=sec[0];d.target=1;d.t=1;d.col.x0=d.col0.x0+1e5;d.col.x1=d.col0.x1+1e5;P.pos.set(0,0,-47);P.yaw=0;P.pitch=0;await shot('skarbiec');d.target=0;d.t=0;d.col.x0=d.col0.x0;d.col.x1=d.col0.x1}
// --- 7. chodzenie prawdziwymi klawiszami z kazdego startu ---
const walks=[];
for(const s of L.starts){
  P.pos.set(s.x,0,s.z);P.yaw=s.yaw;P.pitch=0;P.vel.set(0,0,0);G.queue=0;G.enemies.forEach(e=>{e.alive=false});await Q.sleep(150);
  const p0={x:P.pos.x,z:P.pos.z};Q.key('KeyW');Q.frames(150);Q.key('KeyW','keyup');
  const d=Math.hypot(P.pos.x-p0.x,P.pos.z-p0.z);walks.push({start:s.name,moved:+d.toFixed(1),y:+P.pos.y.toFixed(2),inArena:Math.abs(P.pos.x)<=world.arena&&Math.abs(P.pos.z)<=world.arena,finite:isFinite(P.pos.x+P.pos.z+P.pos.y)});
}
inf('walk',JSON.stringify(walks));
ok('walk.notStuckNotFallen',walks.every(w=>w.inArena&&w.finite&&w.y>=-.01&&w.y<2&&w.moved>5),JSON.stringify(walks));
for(const [n,x,z,yaw] of [['rogNW',-72,-72,Math.PI*.75],['rogSE',72,72,-Math.PI*.25],['rogNE',72,-72,-Math.PI*.75]]){P.pos.set(x,0,z);P.yaw=yaw;P.vel.set(0,0,0);Q.key('KeyW');Q.frames(120);Q.key('KeyW','keyup');ok('walk.cornerInArena.'+n,Math.abs(P.pos.x)<=world.arena&&Math.abs(P.pos.z)<=world.arena,P.pos.x.toFixed(1)+','+P.pos.z.toFixed(1))}
// trasa przez budynek: parking -> foyer -> hall -> prawe skrzydlo klawiszami (sprawdza, czy otwory sa przejezdne)
{P.pos.set(0,0,60);P.yaw=0;P.pitch=0;P.vel.set(0,0,0);Q.key('KeyW');Q.frames(60*12);Q.key('KeyW','keyup');ok('walk.mainEntranceToHall',P.pos.z<-5&&Math.abs(P.pos.x)<9,P.pos.x.toFixed(1)+','+P.pos.z.toFixed(1))}
// --- 8. beczki ---
const bar=cmd.barrels;inf('barrels.count',bar?bar.items.length:0);
const sample=[{b:{x:68,z:44},from:{x:58,z:44}},{b:{x:-33.2,z:-56.1},from:{x:-33.4,z:-50.5}},{b:{x:65,z:-52},from:{x:57.5,z:-52}},{b:{x:-72,z:-64.9},from:{x:-72,z:-58}}],bres=[];
const a0=Q.rend.scene.children.filter(o=>o.isInstancedMesh&&o.geometry.type==='CylinderGeometry'&&Math.abs(o.geometry.parameters.radiusTop-.3)<1e-6&&o.count>=1&&o.count<=4);
for(const {b,from:stand} of sample){
  P.pos.set(stand.x,0,stand.z);P.vel.set(0,0,0);const dx=b.x-stand.x,dz=b.z-stand.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(.5-1.62,Math.hypot(dx,dz));
  const m4=new THREE.Matrix4(),tmp=new THREE.Vector3();const isAlive=()=>{let n=0;for(const im of a0)for(let i=0;i<im.count;i++){im.getMatrixAt(i,m4);tmp.setFromMatrixPosition(m4);if(Math.hypot(tmp.x-b.x,tmp.z-b.z)<.1&&m4.elements[0]>.1)n++}return n};
  const before=isAlive();Q.frames(3);G.fireT=0;G.reloadT=0;Q.fire.fire();Q.frames(10);bres.push({at:b.x+','+b.z,aliveBefore:before,aliveAfter:isAlive()});
}
ok('barrels.allGroupsExplodeWhenShot',bres.every(r=>r.aliveBefore===1&&r.aliveAfter===0),JSON.stringify(bres));
// --- 9. wrogowie: dojscie ze stref spawnu + budzet draw calli z 30 wrogami ---
G.enemies.forEach(e=>{e.alive=false;e.hp=0});Q.frames(5);
{const types=['gangster','dres','bandyta','ochroniarz','pijak','kamikadze','snajper','medyk'];G.wave=20;
  P.pos.set(0,0,18);P.yaw=0;P.pitch=0;
  for(let i=0;i<30;i++)mg.spawnEnemy(types[i%types.length],{wave:20});
  const costs={};
  for(const [n,x,z,yaw] of [['parking',0,66,0],['foyer',0,18,0],['hall',0,-4,0],['sala',-48,12,Math.PI/2]]){P.pos.set(x,0,z);P.yaw=yaw;G.enemies.forEach((e,i)=>{const a=i/30*6.28;e.g.position.set(x+Math.cos(a)*9,0,z+Math.sin(a)*7)});Q.frames(3);const c=Q.cost();costs[n]=c.calls+'/'+Math.round(c.tris/1000)+'k';R['perf.'+n+'.calls']=c.calls;R['perf.'+n+'.tris']=c.tris}
  inf('cost30enemies',JSON.stringify(costs));
  ok('perf.drawCalls<400With30Enemies',['parking','foyer','hall','sala'].every(n=>R['perf.'+n+'.calls']<400),JSON.stringify(costs));
  ok('perf.tris<=300k',['parking','foyer','hall','sala'].every(n=>R['perf.'+n+'.tris']<=300000),JSON.stringify(costs));
  await shot('walka');
  G.enemies.forEach(e=>{e.alive=false;e.hp=0});Q.frames(5);
}
{const reached=[];
  for(const z of L.spawnZones.filter(z=>!z.boss)){
    G.enemies.forEach(e=>{e.alive=false;e.hp=0});Q.frames(2);
    P.pos.set(0,0,18);P.vel.set(0,0,0);P.yaw=0;
    let e=null;try{e=mg.spawnEnemy('dres',{at:{x:z.x,z:z.z}})}catch(err){}
    e=G.enemies.find(q=>q.alive);if(!e){reached.push(z.id+':brak');continue}
    const d0=Math.hypot(e.g.position.x-P.pos.x,e.g.position.z-P.pos.z);let best=1e9;for(let f=0;f<60*22;f++){Q.frame();const d=Math.hypot(e.g.position.x-P.pos.x,e.g.position.z-P.pos.z);if(d<best)best=d;if(d<3||!e.alive)break}
    if(best>=6&&best>d0*.35)reached.push(z.id+':'+d0.toFixed(0)+'->'+best.toFixed(0)+'m');
  }
  inf('enemies.note','strefa przechodzi, gdy wrog w 22 s dojdzie na <6 m albo pokona 65% dystansu (dalekie strefy: podworze, kuchnia, magazyn)');ok('enemies.eachZoneReachesPlayer',reached.length===0,reached.join(','));
  G.enemies.forEach(e=>{e.alive=false;e.hp=0});Q.frames(5)}
// --- 10. boss fali 5 (Jednooki) w arenie + pasek HP + ukonczenie ---
const evs={hp:0,phase:0,kill:0,complete:0},offs=[DS.bus.on('bossHp',()=>evs.hp++),DS.bus.on('bossPhase',()=>evs.phase++),DS.bus.on('levelComplete',()=>evs.complete++)];
P.pos.set(0,0,18);P.yaw=0;P.pitch=0;G.wave=4;const kb=Q.sv.save.keys,cb0=Q.sv.save.coins;wv.nextWave();G.queue=0;
const boss=G.enemies.find(e=>e.boss);ok('boss.wave5IsJednooki',boss&&boss.type==='boss_jednooki',boss&&boss.type);
const ba=L.waves.bossArena;
ok('boss.spawnedInArena',boss&&Math.abs(boss.g.position.x-ba.x)<=ba.hw&&Math.abs(boss.g.position.z-ba.z)<=ba.hd,boss&&(boss.g.position.x.toFixed(0)+','+boss.g.position.z.toFixed(0)));
if(boss){P.pos.set(0,0,2);P.yaw=0}
Q.frames(210);
const bb=document.getElementById('hBoss');
ok('boss.barShown',!bb.hidden&&evs.hp>0,'bossHp zdarzen: '+evs.hp+', hidden='+bb.hidden+', boss '+(boss&&boss.g.position.x.toFixed(0)+','+boss.g.position.z.toFixed(0)));
await shot('boss');
if(boss){boss.hp=boss.maxHp*.6;Q.frames(30);ok('boss.barFollowsHp',document.getElementById('hBossPct').textContent.replace('%','')<=61,document.getElementById('hBossPct').textContent);
  P.pos.set(boss.g.position.x,0,boss.g.position.z+8);let tries=0;const phases=[];const offP=DS.bus.on('bossPhase',e=>phases.push(e.phase));
  while(boss.alive&&tries<15){cb.damageEnemy(boss,1e6,false,new THREE.Vector3(boss.g.position.x,1.2,boss.g.position.z));Q.frames(100);tries++}
  offP();inf('bossKill','zabity po '+tries+' seriach, fazy: '+phases.join(','));await Q.sleep(2700);const u=DS.progression&&DS.progression.ui;if(u&&u.isOpen())u.forceClose()}
ok('boss.barHidesAfterKill',bb.hidden);
ok('boss.levelCompleteOnce',evs.complete===1&&G.levelWon===true,'complete='+evs.complete);
ok('boss.rewardAndSave',Q.sv.save.keys>=kb+1&&Q.sv.save.coins>=cb0+400&&Q.sv.save.levelsDone&&Q.sv.save.levelsDone.kasyno===true,'klucze '+kb+'->'+Q.sv.save.keys);
{const scr=document.getElementById('scrLevelDone');ok('boss.levelDoneScreen',scr&&!scr.hidden&&/ukończony|wyczyszczone|complete|cleared|conquered/i.test(document.getElementById('lcT').textContent),scr&&('hidden='+scr.hidden));
  inf('levelDoneStats',(document.getElementById('lcStats')||{}).textContent);await shot('poziom-ukonczony');
  const keep=document.getElementById('lcKeep');if(keep)keep.click();}
offs.forEach(f=>f());
// --- 11. wycieki: przelaczanie remiza <-> kasyno ---
Q.flow.quitToMenu();await Q.sleep(150);Q.frames(5);
const snap=()=>({geo:info.memory.geometries,tex:info.memory.textures,scene:Q.rend.scene.children.length,col:world.colliders.length,meshes:world.meshes.length});
wl.loadLevel('remiza');Q.frames(3);const sR=snap();wl.loadLevel('kasyno');Q.frames(3);const sK=snap();
const ws2=[];for(let i=0;i<5;i++){wl.loadLevel('remiza');Q.frames(2);const r=snap();wl.loadLevel('kasyno');Q.frames(2);ws2.push({r,b:snap()})}
const last=ws2[4];
ok('leak.kasynoStable5x',last.b.geo<=sK.geo+2&&last.b.scene===sK.scene&&last.b.col===sK.col&&last.b.meshes===sK.meshes,JSON.stringify({first:sK,last:last.b}));
ok('leak.remizaStable5x',last.r.geo<=sR.geo+2&&last.r.scene===sR.scene&&last.r.col===sR.col,JSON.stringify({first:sR,last:last.r}));
inf('texturesGrowth',sK.tex+' -> '+last.b.tex);
ok('leak.doorsNotDuplicated',cm.debugState().doors.length===cmd.doors.length&&L._lifts.length===2,cm.debugState().doors.length+' vs '+cmd.doors.length);
// pelny cykl gra -> menu na kasynie x8
await Q.start();Q.frames(30);Q.flow.quitToMenu();await Q.sleep(100);Q.frames(3);const sW=snap();
for(let i=0;i<8;i++){await Q.start();Q.frames(30);Q.flow.quitToMenu();await Q.sleep(100)}Q.frames(3);const sC=snap();
ok('leak.runCycles8xAfterWarmup',sC.scene===sW.scene&&sC.geo<=sW.geo+4&&sC.tex<=sW.tex+4,JSON.stringify({warm:sW,after:sC}));
// ponowne wczytanie nie psuje Blokowiska
wl.loadLevel('blokowisko');Q.frames(2);ok('blokowisko.stillLoads',world.level.id==='blokowisko'&&world.colliders.length>100);
wl.loadLevel('remiza');
R.errs=Q.errs.filter(e=>!/props atlas pełny/.test(e));inf('atlasWarningsInQAErrs',Q.errs.length-R.errs.length);
ok('console.noErrorsOrWarnings(poza atlasem)',R.errs.length===0,R.errs.slice(0,3).join('|'));
return R})()
