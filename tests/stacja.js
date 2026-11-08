// Poziom 6 Stacja paliw i autostrada: wczytanie z menu, osiągalność mapy (BFS), 13 znajdziek, 3 sekretne drzwi (E) + brama automatyczna składu paliw, osłony co ~6-10 m,
// strefy spawnu i dojście wrogów, budżet draw calli z 30 wrogami, boss Szef Stacji w arenie + pasek HP + kałuże paliwa, ekran "Poziom ukończony" BEZ "Dalej" (ostatni poziom),
// wycieki przy przełączaniu poziomu, chodzenie prawdziwymi klawiszami (utknięcie/wypadnięcie), zrzuty tests/shots/stacja-*.png.
// Użycie (świeża strona, okno 1280x720!): window.__st=null;(0,eval)(await (await fetch('/tests/stacja.js')).text()).then(r=>window.__st=r);  ~90 s, potem odczytaj window.__st
// Przed testem: localStorage 'discoStrzelnica.opt.v1' = {"level":"remiza"} i przeładowanie.
// Zrzuty: gdy istnieje window.shot(nazwa) (runner CDP) zapisuje PNG; inaczej POST na /__shot/<nazwa> (node tests/serve-shots.js).
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,P=Q.P,R={},step=n=>{for(let i=0;i<n;i++){Q.T+=1/60;if(S.mode==='game'&&S.G&&!S.G.paused)Q.loop.updateGame(1/60);Q.skipLv()}},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d!==undefined?' ('+d+')':''),inf=(n,v)=>R['info.'+n]=v;
const wl=await import('/js/world/world.js'),ws=await import('/js/world/state.js'),cm=await import('/js/world/levels/common.js'),mg=await import('/js/enemies/manager.js'),wv=await import('/js/game/waves.js'),cb=await import('/js/game/combat.js');
const nav=await import('/js/enemies/nav.js'),pj=await import('/js/enemies/proj.js'),lcm=await import('/js/ui/levelcomplete.js');
const world=ws.world,info=Q.rend.renderer.info;
const shot=async n=>{Q.frames(3);if(window.shot){await window.shot('stacja-'+n+'.png');return}
  try{await fetch('/__shot/stacja-'+n+'.png',{method:'POST',body:Q.rend.renderer.domElement.toDataURL('image/png')})}catch(e){}};
ok('viewport.realSize',innerWidth>=800&&innerHeight>=500,innerWidth+'x'+innerHeight);
if(document.getElementById('warnFull'))document.getElementById('warnFull').click();await Q.sleep(150);
// --- 1. wybor poziomu w menu przez UI ---
const zmien=[...document.querySelectorAll('#scrMenu *')].find(e=>e.textContent.trim().toLowerCase().match(/^(zmień|change)$/));
if(zmien){zmien.click();await Q.sleep(150);const it=[...document.querySelectorAll('.screen:not([hidden]) *')].find(e=>/stacja paliw|autostrad/i.test(e.textContent)&&(e.tagName==='BUTTON'||e.onclick||e.closest('button')));if(it){(it.closest('button')||it).click();await Q.sleep(400)}}
if(world.level.id!=='stacja'){inf('menuPicker','nie udalo sie wybrac przez UI, uzyto levelSelect');(await import('/js/core/save.js')).opt.level='stacja';DS.bus.emit('levelSelect',{level:'stacja'});await Q.sleep(300)}
ok('level.loadedFromMenu',world.level.id==='stacja',world.level.id);
const L=world.level;
ok('level.isLastRegistered',DS.levels.ids()[DS.levels.ids().length-1]==='stacja'&&lcm.nextLevel('stacja')===null,DS.levels.ids().join(','));
ok('level.size3to4xRemiza',(2*world.arena)**2/(84*84)>=3&&(2*world.arena)**2/(84*84)<=4,((2*world.arena)**2/(84*84)).toFixed(2)+'x');
ok('level.hasTrackAndZonesAndBossArena',L.track==='B'&&L.spawnZones.length>=12&&!!L.waves.bossArena&&L.win&&L.win.kind==='boss'&&L.win.boss==='boss_szef_stacji');
{const zs=L.spawnZones.map(z=>z.id).join(' ');ok('level.spawnZonesRequested',/tir/.test(zs)&&/hwy/.test(zs)&&/warsztat/.test(zs)&&/pole/.test(zs),zs)}
// --- 2. ponowne wczytanie: ostrzezenia, czas budowy ---
const w0=console.warn,got=[];console.warn=(...a)=>{got.push(a.join(' '))};const t0=performance.now();wl.loadLevel('stacja');const buildMs=Math.round(performance.now()-t0);console.warn=w0;
inf('buildMs',buildMs);inf('atlasWarnings',got.length);
ok('level.navHasCover',L.nav&&L.nav.cover&&L.nav.cover.length>50,L.nav&&L.nav.cover&&L.nav.cover.length);
ok('level.neonsAreEmissive',world.neon.length+scene_neonCount()>=1);
function scene_neonCount(){let n=0;Q.rend.scene.traverse(o=>{if(o.userData&&o.userData.neon&&o.visible!==false)n++});return n}
ok('level.neonNeverHidden',(()=>{let bad=0;Q.rend.scene.traverse(o=>{if(o.userData&&o.userData.neon&&o.visible===false)bad++});return bad===0})());
// --- 3. osiagalnosc (BFS 0,5 m, promien 0,4); sekretne drzwi otwarte ---
const cmd=cm.debugState();
const cols=()=>world.colliders.filter(c=>c.h>=.9&&c.x0<1e4);
const reach=(from)=>{const A=world.arena,st=.5,N=Math.round(2*A/st),cs=cols();
  const blocked=new Uint8Array(N*N);for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=-A+i*st+st/2,z=-A+j*st+st/2;for(const c of cs){const cx=Math.max(c.x0,Math.min(x,c.x1)),cz=Math.max(c.z0,Math.min(z,c.z1));if((x-cx)**2+(z-cz)**2<.16){blocked[i*N+j]=1;break}}}
  const idx=(x,z)=>Math.floor((x+A)/st)*N+Math.floor((z+A)/st);const seen=new Uint8Array(N*N),q=[idx(from.x,from.z)];if(blocked[q[0]])return {blocked,seen,N,A,st,startBlocked:true};seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const c=q[h],i=(c/N)|0,j=c%N;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=N||b>=N)continue;const k=a*N+b;if(!seen[k]&&!blocked[k]){seen[k]=1;q.push(k)}}}
  return {blocked,seen,N,A,st,count:q.length,startBlocked:false}};
await Q.start();const G=S.G;G.queue=0;G.between=1e12;G.cleared=true;DS.bus.on('update',()=>{const g=S.G;if(g){g.hp=g.maxHp;g.ammo[g.weapon]=99}});
ok('start.spawnFree',!reach(L.spawn).startBlocked);
const sec=cmd.doors.filter(d=>d.secret),auto=cmd.doors.filter(d=>d.auto);
ok('secrets.doorsCount',sec.length===3,sec.map(d=>d.label).join(','));
ok('gate.autoDoorExists',auto.length>=1);
const sd=[];
for(const d of sec){
  let done=false;
  for(const s of [[d.axis==='x'?d.px:d.px+1.5,d.axis==='x'?d.pz+1.5:d.pz],[d.axis==='x'?d.px:d.px-1.5,d.axis==='x'?d.pz-1.5:d.pz]]){
    P.pos.set(s[0],0,s[1]);step(10);Q.tap('KeyE');step(70);if(d.t>.55){done=true;break}Q.tap('KeyE');step(5);d.t=0;d.target=0;d.col.x0=d.col0.x0;d.col.x1=d.col0.x1}
  sd.push({label:d.label,open:d.t>.55,colMoved:d.col.x0>1e4,done});
}
ok('secrets.openWithE',sd.length===3&&sd.every(s=>s.open&&s.colMoved),JSON.stringify(sd));
{const d=sec[0];const s=[d.axis==='x'?d.px:d.px+1.5,d.axis==='x'?d.pz+1.5:d.pz];
  P.pos.set(s[0],0,s[1]);step(5);Q.tap('KeyE');step(80);const closedNow=d.t<.3;Q.tap('KeyE');step(80);ok('secrets.closeWithE',closedNow||d.t>.55,'t='+d.t.toFixed(2))}
for(const d of sec){d.target=1;d.t=1;d.col.x0=d.col0.x0+1e5;d.col.x1=d.col0.x1+1e5}
// brama automatyczna: otwiera sie przy zblizeniu, zamyka po oddaleniu
{const g=auto[0];P.pos.set(g.px,0,g.pz+3);step(60);const open=g.t>.55;P.pos.set(g.px,0,g.pz+30);step(90);ok('gate.autoOpensAndCloses',open&&g.t<.3,'otwarta '+open+', po oddaleniu t='+g.t.toFixed(2))}
for(const g of auto){g.target=1;g.t=1;g.col.x0=g.col0.x0+1e5;g.col.x1=g.col0.x1+1e5}
const rc=reach(L.spawn);inf('reach.cellsFromSpawn',rc.count+' / '+(rc.N*rc.N));
const items=L.collectibles,bad=[],inCol=[];
for(const it of items){const i=Math.floor((it.x+rc.A)/rc.st),j=Math.floor((it.z+rc.A)/rc.st);let near=false;for(let a=-2;a<=2&&!near;a++)for(let b=-2;b<=2;b++){const k=(i+a)*rc.N+(j+b);if(rc.seen[k]){near=true;break}}if(!near)bad.push(it.id);
  if(world.colliders.some(c=>c.x0<1e4&&it.x>c.x0&&it.x<c.x1&&it.z>c.z0&&it.z<c.z1))inCol.push(it.id)}
ok('reach.allCollectiblesReachable',bad.length===0,bad.join(','));
ok('reach.noCollectibleInsideCollider',inCol.length===0,inCol.join(','));
const seenAt=(x,z)=>rc.seen[Math.floor((x+rc.A)/rc.st)*rc.N+Math.floor((z+rc.A)/rc.st)]===1;
for(const s of L.starts)ok('reach.start.'+s.name,seenAt(s.x,s.z));
const spots=[['start',0,72],['dojazd.zach',-52,66],['dojazd.wsch',40,66],['plac',0,9],['pod.wiata',0,18],['sklep.wnetrze',.5,.5],['zaplecze',4,-10],['alejka.za.sklepem',4,-5.5],['warsztat.podworko',-34,6],['warsztat.wnetrze',-31,-3],['kanal',-36,-14],
  ['myjnia.tunel',-28,24],['sklad.paliw',24,-12],['sklad.zbiorniki',20,-19.5],['mop.wiata',42,8.5],['mop.kebab',40,15],['tir.alejka1',21.3,44],['tir.alejka2',27.7,48],['tir.alejka3',34.3,47],['tir.alejka4',40.7,45],['tir.zachod',14,45],['tir.wschod',47.5,45],
  ['tir.poludnie',31.9,56],['autostrada.A',58,0],['autostrada.B',69,0],['autostrada.pn',58,-70],['pod.wiaduktem',59,-40],['droga.wiadukt',30,-40],['pole.1',-46,-56],['pole.2',-20,-62],['bunkier',-68,-65],['zlom',-64,14],['pn.droga',22,-62],['arenaBossa',0,12],['arenaBossa2',-8,9]];
for(const [n,x,z] of spots)ok('reach.'+n,seenAt(x,z));
// wolne, nieosiagalne kieszenie = martwe miejsca / mozliwe utkniecie (wszystkie drzwi otwarte)
{const pockets=[];const vis=new Uint8Array(rc.N*rc.N);
  for(let i=0;i<rc.N;i++)for(let j=0;j<rc.N;j++){const k=i*rc.N+j;if(rc.blocked[k]||rc.seen[k]||vis[k])continue;const q=[k];vis[k]=1;let sx=0,sz=0;for(let h=0;h<q.length;h++){const c=q[h],a=(c/rc.N)|0,b=c%rc.N;sx+=a;sz+=b;for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=a+da,v=b+db;if(u<0||v<0||u>=rc.N||v>=rc.N)continue;const m=u*rc.N+v;if(!vis[m]&&!rc.blocked[m]&&!rc.seen[m]){vis[m]=1;q.push(m)}}}
    const cx=-rc.A+sx/q.length*rc.st,cz=-rc.A+sz/q.length*rc.st;if(q.length>=8&&Math.abs(cx)<76&&Math.abs(cz)<76)pockets.push(Math.round(cx)+','+Math.round(cz)+' ('+Math.round(q.length*rc.st*rc.st)+' m2)')}
  ok('reach.noUnreachablePocketsOver2m2',pockets.length===0,pockets.slice(0,8).join(' | '))}
// przerwy w barierach i szczeliny w labiryncie naczep: gracz (0,4 m) przejdzie
{const gaps=[['bariera.zach.mop',52,25],['bariera.zach.sw',52,2],['bariera.mediana.pd',63.5,13],['bariera.mediana.pn',63.5,-53],['tir.przerwa.T6T7',31.9,59],['tir.wejscie.zach',13,38],['tir.alejka2.wejscie',27.7,38],['tir.alejka3.wejscie',34.3,36],['brama.skladu',24,-7],['brama.skladu.zach',13,-18],['sklep.drzwi',0,4.3],['warsztat.brama1',-37,.5],['warsztat.brama2',-31,.5]];
  const miss=gaps.filter(([n,x,z])=>!seenAt(x,z)).map(g=>g[0]);ok('reach.gaps',miss.length===0,miss.join(','))}
// osłony co ~6-10 m: z kazdego osiagalnego punktu siatki 4 m (poza pustym polem z krzakami) jest collider h>=1.3 w promieniu 10 m
{const cs=world.colliders.filter(c=>c.h>=1.3&&c.x0<1e4);let n=0,far=0,worst=0;const worstAt=[];
  for(let x=-72;x<=72;x+=4)for(let z=-72;z<=72;z+=4){if(!seenAt(x,z))continue;n++;let best=1e9;for(const c of cs){const dx=Math.max(c.x0-x,0,x-c.x1),dz=Math.max(c.z0-z,0,z-c.z1);const d=Math.hypot(dx,dz);if(d<best)best=d}
    if(best>10){far++;if(worstAt.length<8)worstAt.push(x+','+z)}worst=Math.max(worst,best)}
  inf('cover.nearestMax',worst.toFixed(1)+' m');ok('cover.within10mFrom>=95%OfCells',far/n<=.05,(100-far/n*100).toFixed(1)+'% ok; dalekie: '+worstAt.join(' '))}
// strefy spawnu: kazda ma wolne i osiagalne komorki nawigacji
{const zb=[];for(const z of L.spawnZones){let n=0;for(let a=0;a<40;a++){const x=z.x+Math.cos(a)*z.r*.6,y=z.z+Math.sin(a)*z.r*.6;if(nav.isFree(x,y,0)&&seenAt(x,y))n++}if(n<3)zb.push(z.id+'('+n+')')}
  ok('spawnZones.eachHasFreeReachableCells',zb.length===0,zb.join(','))}
// --- 4. znajdzki: teleport + klatki ---
const c0=Q.sv.save.coins,k0=Q.sv.save.keys;Q.sv.save.lvFound={};cmd.col.items.forEach(i=>i.got=false);
for(const it of items){P.pos.set(it.x,0,it.z);step(3)}
const st=cm.collectStats(L);ok('collect.13of13',st.found===13&&st.total===13,st.found+'/'+st.total);
ok('collect.idsStable',items.every(i=>/^st-(kaseta|lancuch|klucz|plakat)-\d$/.test(i.id))&&new Set(items.map(i=>i.id)).size===13);
ok('collect.rewards',Q.sv.save.keys===k0+2&&Q.sv.save.coins>c0,'klucze +'+(Q.sv.save.keys-k0)+', monety +'+(Q.sv.save.coins-c0));
ok('collect.persistedOnce',['st-kaseta-1','st-klucz-1','st-plakat-1'].every(id=>Q.sv.save.lvFound[id]));
ok('collect.secretCount>=3',items.filter(i=>i.secret).length>=3);
ok('collect.atLeast8',items.length>=8);
for(const d of sec){d.target=0;d.t=0;d.col.x0=d.col0.x0;d.col.x1=d.col0.x1}
for(const g of auto){g.target=0;g.t=0;g.col.x0=g.col0.x0;g.col.x1=g.col0.x1}
// --- 6. zrzuty ---
const shots=[['start',0,72,0,.04],['pylon',-14,60,0,.1],['stacja',0,40,0,.08],['wiata',0,28,0,.05],['sklep',4,12,0,.05],['wnetrze',0,6,0,0],['mop',30,22,-Math.PI/2,0],['tir-alejka',34.3,56,0,0],['tir-labirynt',27.7,60,Math.PI/2*0,0],['autostrada',60,52,0,.05],['wiadukt',60,-20,0,.1],
  ['pole',-40,-40,0,0],['warsztat',-34,10,0,0],['sklad',24,-4,0,.08],['zlom',-60,45,Math.PI/2,0],['bar',36,15,-Math.PI/2,0],['myjnia',-28,34,0,.02]];
G.enemies.forEach(e=>{e.alive=false});
for(const [n,x,z,yaw,pit] of shots){P.pos.set(x,0,z);P.yaw=yaw;P.pitch=pit;P.vel.set(0,0,0);await shot(n)}
for(const [i,pose] of [[0,[4,-5.5,0]],[1,[-36,-8.6,0]],[2,[-68,-58,0]]]){const d=sec[i];d.target=1;d.t=1;d.col.x0=d.col0.x0+1e5;d.col.x1=d.col0.x1+1e5;P.pos.set(pose[0],0,pose[1]);P.yaw=pose[2];P.pitch=0;await shot('sekret-'+(i+1));d.target=0;d.t=0;d.col.x0=d.col0.x0;d.col.x1=d.col0.x1}
// --- 7. chodzenie prawdziwymi klawiszami z kazdego startu ---
const walks=[];
for(const s of L.starts){
  P.pos.set(s.x,0,s.z);P.yaw=s.yaw;P.pitch=0;P.vel.set(0,0,0);G.queue=0;G.enemies.forEach(e=>{e.alive=false});await Q.sleep(150);
  const p0={x:P.pos.x,z:P.pos.z};Q.key('KeyW');step(150);Q.key('KeyW','keyup');
  const d=Math.hypot(P.pos.x-p0.x,P.pos.z-p0.z);walks.push({start:s.name,moved:+d.toFixed(1),y:+P.pos.y.toFixed(2),inArena:Math.abs(P.pos.x)<=world.arena&&Math.abs(P.pos.z)<=world.arena,finite:isFinite(P.pos.x+P.pos.z+P.pos.y)});
}
inf('walk',JSON.stringify(walks));
ok('walk.notStuckNotFallen',walks.every(w=>w.inArena&&w.finite&&w.y>=-.01&&w.y<2&&w.moved>4),JSON.stringify(walks));
for(const [n,x,z,yaw] of [['rogNW',-72,-72,Math.PI*.75],['rogSE',72,72,-Math.PI*.25],['rogNE',72,-72,-Math.PI*.75],['rogSW',-72,72,Math.PI*.25]]){P.pos.set(x,0,z);P.yaw=yaw;P.vel.set(0,0,0);Q.key('KeyW');step(120);Q.key('KeyW','keyup');ok('walk.cornerInArena.'+n,Math.abs(P.pos.x)<=world.arena&&Math.abs(P.pos.z)<=world.arena,P.pos.x.toFixed(1)+','+P.pos.z.toFixed(1))}
// trasa przez sklep: od drzwi (0,4,5) na polnoc do sciany (sciana tylna: nie wychodzi poza mape); trasa pod wiata
{P.pos.set(0,0,30);P.yaw=0;P.pitch=0;P.vel.set(0,0,0);Q.key('KeyW');step(60*5);Q.key('KeyW','keyup');ok('walk.throughForecourtTowardShop',P.pos.z<8&&P.pos.z>-14,P.pos.x.toFixed(1)+','+P.pos.z.toFixed(1))}
// --- 8. beczki ---
const bar=cmd.barrels;inf('barrels.count',bar?bar.items.length:0);
ok('barrels.fiveGroups',bar&&bar.items.length>=12,bar&&bar.items.length);
const pick=[bar.items[0],bar.items[2],bar.items[bar.items.length-1]],bres=[];
const a0=Q.rend.scene.children.filter(o=>o.isInstancedMesh&&o.geometry.type==='CylinderGeometry'&&Math.abs(o.geometry.parameters.radiusTop-.3)<1e-6&&o.count>=1&&o.count<=4);
for(const b of pick){
  const st2={x:b.x+(b.x>60?-3:b.x<-40?3:0),z:b.z+(b.x>60||b.x<-40?0:3.2)};
  P.pos.set(st2.x,0,st2.z);P.vel.set(0,0,0);const dx=b.x-st2.x,dz=b.z-st2.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(.5-1.62,Math.hypot(dx,dz));
  const m4=new THREE.Matrix4(),tmp=new THREE.Vector3();const isAlive=()=>{let n=0;for(const im of a0)for(let i=0;i<im.count;i++){im.getMatrixAt(i,m4);tmp.setFromMatrixPosition(m4);if(Math.hypot(tmp.x-b.x,tmp.z-b.z)<.1&&m4.elements[0]>.1)n++}return n};
  const before=isAlive();Q.frames(3);G.fireT=0;G.reloadT=0;Q.fire.fire();Q.frames(10);bres.push({at:b.x+','+b.z,aliveBefore:before,aliveAfter:isAlive()});
}
ok('barrels.groupsExplodeWhenShot',bres.every(r=>r.aliveBefore>=1&&r.aliveAfter===0),JSON.stringify(bres));
// --- 9. wrogowie: dojscie ze stref spawnu + budzet draw calli z 30 wrogami ---
G.enemies.forEach(e=>{e.alive=false;e.hp=0});step(5);
{const types=['gangster','dres','bandyta','ochroniarz','pijak','kamikadze','snajper','medyk'];G.wave=20;
  P.pos.set(0,0,18);P.yaw=0;P.pitch=0;
  for(let i=0;i<30;i++)mg.spawnEnemy(types[i%types.length],{wave:20});
  const costs={},pts=[['start',0,72,0],['stacja',0,36,Math.PI],['sklep',0,3,0],['tir',31.9,56,0],['autostrada',58,48,0],['wiadukt',60,-20,0],['pole',-40,-40,0],['warsztat',-34,10,0],['mop',36,16,-Math.PI/2],['sklad',24,-5,0]];
  for(const [n,x,z,yaw] of pts){P.pos.set(x,0,z);P.yaw=yaw;G.enemies.forEach((e,i)=>{const a=i/30*6.28;e.g.position.set(x+Math.cos(a)*9,0,z+Math.sin(a)*7)});Q.frames(3);const c=Q.cost();costs[n]=c.calls+'/'+Math.round(c.tris/1000)+'k';R['perf.'+n+'.calls']=c.calls;R['perf.'+n+'.tris']=c.tris}
  inf('cost30enemies',JSON.stringify(costs));
  ok('perf.drawCalls<400With30Enemies',pts.every(p=>R['perf.'+p[0]+'.calls']<400),JSON.stringify(costs));
  ok('perf.tris<=300k',pts.every(p=>R['perf.'+p[0]+'.tris']<=300000),JSON.stringify(costs));
  await shot('walka');
  G.enemies.forEach(e=>{e.alive=false;e.hp=0});step(5);
}
{const reached=[];
  for(const z of L.spawnZones.filter(z=>!z.boss)){
    G.enemies.forEach(e=>{e.alive=false;e.hp=0});step(2);
    P.pos.set(0,0,9);P.vel.set(0,0,0);P.yaw=0;
    let e=null;try{e=mg.spawnEnemy('dres',{at:{x:z.x,z:z.z}})}catch(err){}
    e=G.enemies.find(q=>q.alive);if(!e){reached.push(z.id+':brak');continue}
    const d0=Math.hypot(e.g.position.x-P.pos.x,e.g.position.z-P.pos.z);let best=1e9;for(let f=0;f<60*30;f++){step(1);const d=Math.hypot(e.g.position.x-P.pos.x,e.g.position.z-P.pos.z);if(d<best)best=d;if(d<3||!e.alive)break}
    if(best>=6&&best>d0*.35)reached.push(z.id+':'+d0.toFixed(0)+'->'+best.toFixed(0)+'m');
  }
  inf('enemies.note','strefa przechodzi, gdy wrog w 30 s dojdzie na <6 m albo pokona 65% dystansu');ok('enemies.eachZoneReachesPlayer',reached.length===0,reached.join(','));
  G.enemies.forEach(e=>{e.alive=false;e.hp=0});step(5)}
// --- 10. boss fali 5 (Szef Stacji) w arenie + pasek HP + kałuże paliwa + ukonczenie ---
const evs={hp:0,phase:0,kill:0,complete:0},offs=[DS.bus.on('bossHp',()=>evs.hp++),DS.bus.on('bossPhase',()=>evs.phase++),DS.bus.on('levelComplete',()=>evs.complete++)];
P.pos.set(0,0,50);P.yaw=0;P.pitch=0;G.wave=4;const kb=Q.sv.save.keys,cb0=Q.sv.save.coins;wv.nextWave();G.queue=0;
const boss=G.enemies.find(e=>e.boss);ok('boss.wave5IsSzefStacji',boss&&boss.type==='boss_szef_stacji',boss&&boss.type);
const ba=L.waves.bossArena;
ok('boss.spawnedInArena',boss&&Math.abs(boss.g.position.x-ba.x)<=ba.hw&&Math.abs(boss.g.position.z-ba.z)<=ba.hd,boss&&(boss.g.position.x.toFixed(0)+','+boss.g.position.z.toFixed(0)));
if(boss){P.pos.set(0,0,32);P.yaw=0}
Q.frames(30);step(180);
const bb=document.getElementById('hBoss');
ok('boss.barShown',!bb.hidden&&evs.hp>0,'bossHp zdarzen: '+evs.hp+', hidden='+bb.hidden+', boss '+(boss&&boss.g.position.x.toFixed(0)+','+boss.g.position.z.toFixed(0)));
await shot('boss');
// boss rozlewa paliwo (kałuże) i rzuca kanistry: obserwuj 25 s walki z graczem w arenie
if(boss){let maxPud=0,maxProj=0;P.pos.set(0,0,30);P.yaw=0;for(let f=0;f<60*25&&boss.alive;f++){step(1);const c=pj.projCount();maxPud=Math.max(maxPud,c.puddles);maxProj=Math.max(maxProj,c.projs);if(f%20===0){P.pos.set(0,0,30);G.hp=G.maxHp}}
  ok('boss.spillsFuelOrThrowsCans',maxPud>=1||maxProj>=1,'kałuże '+maxPud+', pociski '+maxProj);inf('boss.afterObservation','boss '+(boss.alive?'żyje, hp '+Math.round(boss.hp):'zabity')+', faza '+boss.phase);
  const bx=boss.g.position.x,bz=boss.g.position.z;ok('boss.staysInArenaRegion',Math.abs(bx-ba.x)<=ba.hw+8&&Math.abs(bz-ba.z)<=ba.hd+8,bx.toFixed(0)+','+bz.toFixed(0));await shot('boss-walka')}
if(boss){boss.hp=boss.maxHp*.6;step(30);ok('boss.barFollowsHp',document.getElementById('hBossPct').textContent.replace('%','')<=61,document.getElementById('hBossPct').textContent);
  P.pos.set(boss.g.position.x,0,boss.g.position.z+8);let tries=0;const phases=[];const offP=DS.bus.on('bossPhase',e=>phases.push(e.phase));
  while(boss.alive&&tries<15){cb.damageEnemy(boss,1e6,false,new THREE.Vector3(boss.g.position.x,1.2,boss.g.position.z));step(100);tries++}
  offP();inf('bossKill',boss.type+' zabity po '+tries+' seriach, fazy: '+phases.join(','));await Q.sleep(2700);const u=DS.progression&&DS.progression.ui;if(u&&u.isOpen())u.forceClose()}
ok('boss.barHidesAfterKill',bb.hidden);
ok('boss.levelCompleteOnce',evs.complete===1&&G.levelWon===true,'complete='+evs.complete);
ok('boss.rewardAndSave',Q.sv.save.keys>=kb+2&&Q.sv.save.coins>=cb0+800&&Q.sv.save.levelsDone&&Q.sv.save.levelsDone.stacja===true,'klucze '+kb+'->'+Q.sv.save.keys);
{const scr=document.getElementById('scrLevelDone');ok('boss.levelDoneScreen',scr&&!scr.hidden&&/zdobyta|ukończony|wyczyszczony|oczyszczony|complete|cleared|conquered/i.test(document.getElementById('lcT').textContent),scr&&('hidden='+scr.hidden));
  const nx=document.getElementById('lcNext');ok('boss.lastLevelHasNoNextButton',nx&&(nx.hidden||getComputedStyle(nx).display==='none')&&!/Dalej:|Next:/.test(nx.textContent),nx&&('hidden='+nx.hidden+' text='+nx.textContent));
  const keep=document.getElementById('lcKeep'),menu=document.getElementById('lcMenu');ok('boss.keepAndMenuButtonsVisible',keep&&menu&&getComputedStyle(keep).display!=='none'&&getComputedStyle(menu).display!=='none');
  inf('levelDoneStats',(document.getElementById('lcStats')||{}).textContent);await shot('poziom-ukonczony');
  if(keep)keep.click();await Q.sleep(150);ok('boss.keepPlayingResumes',!G.paused&&S.mode==='game');}
offs.forEach(f=>f());
// --- 11. wycieki: przelaczanie remiza <-> stacja ---
Q.flow.quitToMenu();await Q.sleep(150);step(5);
const snap=()=>({geo:info.memory.geometries,tex:info.memory.textures,scene:Q.rend.scene.children.length,col:world.colliders.length,meshes:world.meshes.length});
wl.loadLevel('remiza');step(3);const sR=snap();wl.loadLevel('stacja');step(3);const sK=snap();
const ws2=[];for(let i=0;i<5;i++){wl.loadLevel('remiza');step(2);const r=snap();wl.loadLevel('stacja');step(2);ws2.push({r,b:snap()})}
const last=ws2[4];
ok('leak.stacjaStable5x',last.b.geo<=sK.geo+2&&last.b.scene===sK.scene&&last.b.col===sK.col&&last.b.meshes===sK.meshes,JSON.stringify({first:sK,last:last.b}));
ok('leak.remizaStable5x',last.r.geo<=sR.geo+2&&last.r.scene===sR.scene&&last.r.col===sR.col,JSON.stringify({first:sR,last:last.r}));
inf('texturesGrowth',sK.tex+' -> '+last.b.tex);
ok('leak.doorsNotDuplicated',cm.debugState().doors.length===cmd.doors.length,cm.debugState().doors.length+' vs '+cmd.doors.length);
// pelny cykl gra -> menu na stacji x8
for(let i=0;i<3;i++){await Q.start();Q.frames(30);Q.flow.quitToMenu();await Q.sleep(100)}Q.frames(3);const sW=snap();
for(let i=0;i<8;i++){await Q.start();Q.frames(30);Q.flow.quitToMenu();await Q.sleep(100)}Q.frames(3);const sC=snap();
ok('leak.runCycles8xAfterWarmup',sC.scene===sW.scene&&sC.geo<=sW.geo+4&&sC.tex<=sW.tex+4,JSON.stringify({warm:sW,after:sC}));
// ponowne wczytanie nie psuje pozostalych poziomow
wl.loadLevel('blokowisko');step(2);const okB=world.level.id==='blokowisko'&&world.colliders.length>100;wl.loadLevel('dyskoteka');step(2);ok('otherLevels.stillLoad',okB&&world.level.id==='dyskoteka'&&world.colliders.length>100);
wl.loadLevel('remiza');
R.errs=Q.errs.filter(e=>!/props atlas pełny/.test(e));inf('atlasWarningsInQAErrs',Q.errs.length-R.errs.length);
ok('console.noErrorsOrWarnings(poza atlasem)',R.errs.length===0,R.errs.slice(0,3).join('|'));
return R})()
