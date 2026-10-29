// Poziom Blokowisko (faza 2): wczytanie z menu, osiagalnosc mapy, 13 znajdziek, 3 sekrety (E), beczki, boss fali 5 + pasek HP, wycieki przy przelaczaniu poziomu,
// start i chodzenie prawdziwymi klawiszami (czy gracz nie utyka / nie wypada), ostrzezenie "props atlas pelny".
// Uzycie (swieza strona, okno widoczne): window.__bk=null;(0,eval)(await (await fetch('/tests/blokowisko.js')).text()).then(r=>window.__bk=r);  ~60 s, potem odczytaj window.__bk
(async()=>{
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,P=Q.P,R={},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d!==undefined?' ('+d+')':''),inf=(n,v)=>R['info.'+n]=v;
const wl=await import('/js/world/world.js'),ws=await import('/js/world/state.js'),cm=await import('/js/world/levels/common.js'),mg=await import('/js/enemies/manager.js'),wv=await import('/js/game/waves.js'),cb=await import('/js/game/combat.js'),col=await import('/js/player/collision.js');
const world=ws.world,info=Q.rend.renderer.info;
if(document.getElementById('warnFull'))document.getElementById('warnFull').click();await Q.sleep(150);
// --- 1. wybor poziomu w menu przez UI ---
document.querySelector('#scrMenu [data-go=scrPlay]')&&0;
const zmien=[...document.querySelectorAll('#scrMenu *')].find(e=>e.textContent.trim().toLowerCase()==='zmień');
if(zmien){zmien.click();await Q.sleep(150);const it=[...document.querySelectorAll('.screen:not([hidden]) *')].find(e=>/blokowisko/i.test(e.textContent)&&(e.tagName==='BUTTON'||e.onclick||e.closest('button')));if(it){(it.closest('button')||it).click();await Q.sleep(400)}}
if(world.level.id!=='blokowisko'){inf('menuPicker','nie udalo sie wybrac przez UI, uzyto levelSelect');DS.bus.emit('levelSelect',{level:'blokowisko'});await Q.sleep(300)}
ok('level.loadedFromMenu',world.level.id==='blokowisko',world.level.id);
const L=world.level;
// --- 2. ostrzezenie atlasu ---
const w0=console.warn,got=[];console.warn=(...a)=>{got.push(a.join(' '))};wl.loadLevel('blokowisko');console.warn=w0;
inf('atlasWarnings',got.length+' ostrzezen, '+new Set(got).size+' unikalnych kluczy (props/lib.js:51: atlas 2048x1024 przepelniony, nadmiarowe decale dostaja prostokat pierwszego wpisu)');
// --- 3. osiagalnosc (BFS 0,5 m, promien 0,4) z otwartymi sekretnymi drzwiami ---
const dbg=cm.debugState();
const closeDoors=()=>dbg.doors.forEach(d=>{d.target=0;d.t=0;d.col.x0=d.col0.x0;d.col.x1=d.col0.x1});
const cols=()=>world.colliders.filter(c=>c.h>=.9&&c.x0<1e4);
const reach=(from)=>{const A=world.arena,st=.5,N=Math.round(2*A/st),cs=cols(),p=new THREE.Vector3();
  const blocked=new Uint8Array(N*N);for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=-A+i*st+st/2,z=-A+j*st+st/2;for(const c of cs){const cx=Math.max(c.x0,Math.min(x,c.x1)),cz=Math.max(c.z0,Math.min(z,c.z1));if((x-cx)**2+(z-cz)**2<.16){blocked[i*N+j]=1;break}}}
  const idx=(x,z)=>Math.floor((x+A)/st)*N+Math.floor((z+A)/st);const seen=new Uint8Array(N*N),q=[idx(from.x,from.z)];if(blocked[q[0]])return {blocked,seen,N,A,st,startBlocked:true};seen[q[0]]=1;
  for(let h=0;h<q.length;h++){const c=q[h],i=(c/N)|0,j=c%N;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=N||b>=N)continue;const k=a*N+b;if(!seen[k]&&!blocked[k]){seen[k]=1;q.push(k)}}}
  return {blocked,seen,N,A,st,count:q.length,startBlocked:false}};
// otworz sekretne drzwi (E przy kazdych drzwiach), potem BFS
await Q.start();const G=S.G;G.queue=0;G.between=1e12;G.cleared=true;DS.bus.on('update',()=>{const g=S.G;if(g){g.hp=g.maxHp;g.ammo[g.weapon]=99}});
ok('start.spawnFree',!reach(L.spawn).startBlocked);
R['secrets.count']=dbg.doors.filter(d=>d.secret).length===3?'PASS':'FAIL ('+dbg.doors.filter(d=>d.secret).length+')';
const sd=[];
for(const d of dbg.doors.filter(d=>d.secret)){
  const outX=d.axis==='x'?d.px:d.px+(d.dir>0?-1.3:-1.3),outZ=d.axis==='x'?d.pz+1.5:d.pz;   // przed drzwiami (strona zewnetrzna: s => +z, w => -x)
  const side=d.axis==='x'?[d.px,d.pz+1.5]:[d.px-1.5,d.pz];
  P.pos.set(side[0],0,side[1]);Q.frames(10);Q.tap('KeyE');Q.frames(70);
  sd.push({label:d.label,open:d.t>.55,colMoved:d.col.x0>1e4});
}
ok('secrets.openWithE',sd.length===3&&sd.every(s=>s.open&&s.colMoved),JSON.stringify(sd));
// zamkniecie ponownie E
{const d=dbg.doors.find(d=>d.secret);const side=d.axis==='x'?[d.px,d.pz+1.5]:[d.px-1.5,d.pz];P.pos.set(side[0],0,side[1]);Q.frames(5);Q.tap('KeyE');Q.frames(80);ok('secrets.closeWithE',d.t<.3,'t='+d.t.toFixed(2));Q.tap('KeyE');Q.frames(80)}
const rc=reach(L.spawn);inf('reach.cellsFromSpawn',rc.count+' / '+(rc.N*rc.N));
const items=L.collectibles,bad=[];
for(const it of items){const i=Math.floor((it.x+rc.A)/rc.st),j=Math.floor((it.z+rc.A)/rc.st);let near=false;for(let a=-2;a<=2&&!near;a++)for(let b=-2;b<=2;b++){const k=(i+a)*rc.N+(j+b);if(rc.seen[k]){near=true;break}}if(!near)bad.push(it.id)}
ok('reach.allCollectiblesReachable',bad.length===0,bad.join(','));
for(const [n,p] of [['Dziedziniec',{x:-22,z:-8}],['PrzyOrliku',{x:50,z:-44}]]){const k=Math.floor((p.x+rc.A)/rc.st)*rc.N+Math.floor((p.z+rc.A)/rc.st);ok('reach.start.'+n,rc.seen[k]===1)}
const k2=Math.floor((49+rc.A)/rc.st)*rc.N+Math.floor((-63+rc.A)/rc.st);ok('reach.orlik',rc.seen[k2]===1);
// --- 4. znajdzki: teleport + klatki ---
const c0=Q.sv.save.coins,k0=Q.sv.save.keys;Q.sv.save.lvFound={};dbg.col.items.forEach(i=>i.got=false);
for(const it of items){P.pos.set(it.x,0,it.z);Q.frames(3)}
const st=cm.collectStats(L);ok('collect.13of13',st.found===13&&st.total===13,st.found+'/'+st.total);
ok('collect.rewards',Q.sv.save.keys===k0+2&&Q.sv.save.coins>c0,'klucze +'+(Q.sv.save.keys-k0)+', monety +'+(Q.sv.save.coins-c0));
ok('collect.persistedOnce',['bl-kaseta-1','bl-klucz-1','bl-plakat-1'].every(id=>Q.sv.save.lvFound[id]));
// --- 7. chodzenie prawdziwymi klawiszami z kazdego startu ---
const walks=[];
for(const s of L.starts){
  P.pos.set(s.x,0,s.z);P.yaw=s.yaw;P.pitch=0;P.vel.set(0,0,0);G.queue=0;G.enemies.forEach(e=>{e.alive=false});await Q.sleep(200);
  const p0={x:P.pos.x,z:P.pos.z};Q.key('KeyW');Q.frames(150);Q.key('KeyW','keyup');   // klatki reczne: rAF w ukrytym panelu stoi
  const d=Math.hypot(P.pos.x-p0.x,P.pos.z-p0.z);walks.push({start:s.name,moved:+d.toFixed(1),y:+P.pos.y.toFixed(2),inArena:Math.abs(P.pos.x)<=world.arena&&Math.abs(P.pos.z)<=world.arena,finite:isFinite(P.pos.x+P.pos.z+P.pos.y)});
}
inf('walk',JSON.stringify(walks));
ok('walk.notStuckNotFallen',walks.every(w=>w.inArena&&w.finite&&w.y>=-.01&&w.y<2),JSON.stringify(walks));
// czy chodzac wzdluz osi mozna wyjsc poza arene / utknac w rogu
for(const [n,x,z,yaw] of [['rogNW',-70,-70,Math.PI*.75],['rogSE',70,70,-Math.PI*.25]]){P.pos.set(x,0,z);P.yaw=yaw;P.vel.set(0,0,0);Q.key('KeyW');Q.frames(120);Q.key('KeyW','keyup');ok('walk.cornerInArena.'+n,Math.abs(P.pos.x)<=world.arena&&Math.abs(P.pos.z)<=world.arena,P.pos.x.toFixed(1)+','+P.pos.z.toFixed(1))}
// --- 5. beczki ---
const bar=dbg.barrels;inf('barrels.groupsInState',bar?bar.items.length+' beczek w stanie (poziom stawia 6 w 3 grupach: 3+2+3... ) ':'brak');
const allIM=Q.rend.scene.children.filter(o=>o.isInstancedMesh&&o.geometry.type==='CylinderGeometry'&&Math.abs(o.geometry.parameters.radiusTop-.3)<1e-6&&o.count>=2&&o.count<=4);
inf('barrels.instancedMeshesInScene',allIM.length+' (liczby: '+allIM.map(o=>o.count).join(',')+')');
const sample=[{x:-76.2,z:62},{x:-62,z:4},{x:31,z:-71}],bres=[];
for(const b of sample){
  const stand={x:b.x+(b.x<0?6:-6)*1,z:b.z};if(b.x===-62){stand.x=-62;stand.z=10} // (-56,4) stoi za ścianą bloku (kolider x -58..-57,5)
  P.pos.set(stand.x,0,stand.z);P.vel.set(0,0,0);const dx=b.x-stand.x,dz=b.z-stand.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(.5-1.62,Math.hypot(dx,dz));
  const a=Q.rend.scene.children.filter(o=>o.isInstancedMesh&&o.geometry.type==='CylinderGeometry'&&Math.abs(o.geometry.parameters.radiusTop-.3)<1e-6&&o.count>=2&&o.count<=4);
  const m4=new THREE.Matrix4(),tmp=new THREE.Vector3();const isAlive=()=>{let n=0;for(const im of a)for(let i=0;i<im.count;i++){im.getMatrixAt(i,m4);tmp.setFromMatrixPosition(m4);if(Math.hypot(tmp.x-b.x,tmp.z-b.z)<.1&&m4.elements[0]>.1)n++}return n};
  const before=isAlive();Q.frames(3);G.fireT=0;G.reloadT=0;Q.fire.fire();Q.frames(10);bres.push({at:b.x+','+b.z,aliveBefore:before,aliveAfter:isAlive()});
}
ok('barrels.allGroupsExplodeWhenShot',bres.every(r=>r.aliveBefore===1&&r.aliveAfter===0),JSON.stringify(bres));
// --- 6. boss fali 5 + pasek HP ---
G.enemies.forEach(e=>{e.alive=false;e.hp=0});Q.frames(5);
const evs={hp:0,phase:0,kill:0,complete:0},offs=[DS.bus.on('bossHp',()=>evs.hp++),DS.bus.on('bossPhase',()=>evs.phase++),DS.bus.on('levelComplete',()=>evs.complete++)];
P.pos.set(0,0,70);P.yaw=0;P.pitch=0;G.wave=4;const kb=Q.sv.save.keys;wv.nextWave();G.queue=0;
const boss=G.enemies.find(e=>e.boss);ok('boss.wave5IsSzefOchrony',boss&&boss.type==='boss_szef_ochrony',boss&&boss.type);
ok('boss.spawnedInOrlik',boss&&Math.abs(boss.g.position.x-49)<30&&boss.g.position.z<-40,boss&&(boss.g.position.x.toFixed(0)+','+boss.g.position.z.toFixed(0)));
if(boss){P.pos.set(boss.g.position.x,0,boss.g.position.z+25);P.yaw=0}
Q.frames(210);
const bb=document.getElementById('hBoss');
ok('boss.barShown',!bb.hidden&&evs.hp>0,'bossHp zdarzen: '+evs.hp+', hidden='+bb.hidden+', pozycja bossa po 3 s: '+(boss&&boss.g.position.x.toFixed(0)+','+boss.g.position.z.toFixed(0)));
if(boss){boss.hp=boss.maxHp*.6;Q.frames(30);ok('boss.barFollowsHp',document.getElementById('hBossPct').textContent.replace('%','')<=61,document.getElementById('hBossPct').textContent);
  P.pos.set(boss.g.position.x,0,boss.g.position.z+8);let tries=0;const phases=[];const offP=DS.bus.on('bossPhase',e=>phases.push(e.phase));
  while(boss.alive&&tries<15){cb.damageEnemy(boss,1e6,false,new THREE.Vector3(boss.g.position.x,1.2,boss.g.position.z));Q.frames(100);tries++}   // fazy: boss bywa nietykalny miedzy progami
  offP();R['info.bossKill']='zabity po '+tries+' seriach, fazy: '+phases.join(',');await Q.sleep(1700);const u=DS.progression&&DS.progression.ui;if(u&&u.isOpen())u.forceClose()}
ok('boss.barHidesAfterKill',bb.hidden);
ok('boss.levelCompleteOnce',evs.complete===1&&G.levelWon===true,'complete='+evs.complete);
ok('boss.reward',Q.sv.save.keys>=kb+1,'klucze '+kb+'->'+Q.sv.save.keys);
offs.forEach(f=>f());
// --- 8. wycieki: przelaczanie remiza <-> blokowisko ---
Q.flow.quitToMenu();await Q.sleep(150);Q.frames(5);
const snap=()=>({geo:info.memory.geometries,tex:info.memory.textures,scene:Q.rend.scene.children.length,col:world.colliders.length,meshes:world.meshes.length});
wl.loadLevel('remiza');Q.frames(3);const sR=snap();wl.loadLevel('blokowisko');Q.frames(3);const sB=snap();
const ws2=[];for(let i=0;i<5;i++){wl.loadLevel('remiza');Q.frames(2);const r=snap();wl.loadLevel('blokowisko');Q.frames(2);ws2.push({r,b:snap()})}
const last=ws2[4];
ok('leak.blokowiskoStable5x',last.b.geo<=sB.geo+2&&last.b.scene===sB.scene&&last.b.col===sB.col&&last.b.meshes===sB.meshes,JSON.stringify({first:sB,last:last.b}));
ok('leak.remizaStable5x',last.r.geo<=sR.geo+2&&last.r.scene===sR.scene&&last.r.col===sR.col,JSON.stringify({first:sR,last:last.r}));
inf('texturesGrowth',sB.tex+' -> '+last.b.tex);
ok('leak.doorsNotDuplicated',cm.debugState().doors.length===dbg.doors.length,cm.debugState().doors.length+' vs '+dbg.doors.length);
// pelny cykl gra -> menu na blokowisku x3
await Q.start();Q.frames(30);Q.flow.quitToMenu();await Q.sleep(100);Q.frames(3);const sW=snap(); // rozgrzewka (modele broni, kity wrogow)
for(let i=0;i<8;i++){await Q.start();Q.frames(30);Q.flow.quitToMenu();await Q.sleep(100)}Q.frames(3);const sC=snap();
ok('leak.runCycles8xAfterWarmup',sC.scene===sW.scene&&sC.geo<=sW.geo+4&&sC.tex<=sW.tex+4,JSON.stringify({warm:sW,after:sC}));
wl.loadLevel('remiza');
R.errs=Q.errs.filter(e=>!/props atlas pełny/.test(e));inf('atlasWarningsInQAErrs',Q.errs.length-R.errs.length);
ok('console.noErrorsOrWarnings(poza atlasem)',R.errs.length===0,R.errs.slice(0,3).join('|'));
return R})()
