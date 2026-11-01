// Test co-op (etap 1) na kilku kartach jednej przeglądarki (pokoje JuicyJuicy poza JuicyJuicy = BroadcastChannel).
// node tests/coop.js [port=4203] [--gpu]      (serwer: node tests/serve.js 4203)
// A = host, B = dołącza kodem, C = dołącza z linku zaproszenia (?room=KOD), D = przypadki błędów.
const {launch,sleep}=require('./cdp-multi.js');
const port=+(process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:4203),gpu=process.argv.includes('--gpu');
const base='http://127.0.0.1:'+port+'/';
const R={};const ok=(n,c,d)=>{R[n]=c?'PASS':'FAIL'+(d!==undefined?' ('+(typeof d==='string'?d:JSON.stringify(d))+')':'');return c};
const info=(n,v)=>R['info.'+n]=v;

// Pomocnicze funkcje w stronie (harness QA + klatki „na żywo” równolegle we wszystkich kartach).
const SETUP=`(async()=>{(0,eval)(await (await fetch('/tests/harness.js')).text());await new Promise(r=>{const t=setInterval(()=>{if(window.QA){clearInterval(t);r()}},20)});
  QA.live=async(ms,god)=>{const t0=performance.now();while(performance.now()-t0<ms){const G=QA.S.G;if(god&&G&&!G.dead&&!G.coopEnded)G.hp=G.maxHp;QA.frame(1/60);await QA.sleep(16)}};
  QA.until=async(fn,ms=8000,god=true)=>{const t0=performance.now();while(performance.now()-t0<ms){if(fn())return true;const G=QA.S.G;if(god&&G&&!G.dead&&!G.coopEnded)G.hp=G.maxHp;if(QA.S.mode==='game')QA.frame(1/60);await QA.sleep(16)}return !!fn()};
  QA.dmg=[];DS.bus.on('damage',e=>QA.dmg.push(e.amount));QA.heals=[];DS.bus.on('heal',e=>QA.heals.push(e.source));QA.kills=0;DS.bus.on('kill',()=>QA.kills++);
  QA.$=s=>document.querySelector(s);QA.txt=s=>{const e=document.querySelector(s);return e?e.textContent:null};
  QA.host=await import('/js/net/host.js');QA.en=await import('/js/enemies/manager.js');
  QA.proj=await import('/js/enemies/proj.js');QA.lvc=await import('/js/world/levels/common.js');QA.pk=await import('/js/pickups/pickups.js');
  QA.ann=[];DS.bus.on('update',()=>{const a=QA.S.G&&QA.S.G.announce;if(a&&a.t===0&&QA.ann[QA.ann.length-1]!==a.text)QA.ann.push(a.text)});
  // strzał w punkt (x,y,z) z odległości dist, z kolejnych stron, aż padnie trafienie spełniające ok(hits)
  QA.shootAt=(getPt,dist,okFn,tries=16)=>{const G=QA.S.G,P=QA.P;for(let k=0;k<tries;k++){const pt=getPt();if(!pt)return false;const a=k*Math.PI/8;
    P.pos.set(pt.x+Math.sin(a)*dist,0,pt.z+Math.cos(a)*dist);P.vel.set(0,0,0);QA.frame();const q=getPt();const dx=q.x-P.pos.x,dz=q.z-P.pos.z;
    P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(q.y-1.62-P.pos.y,Math.hypot(dx,dz));QA.frame();G.fireT=0;G.reloadT=0;G.ammo[G.weapon]=5;
    let hits=null;const off=DS.bus.on('shot',e=>{hits=e.hits});QA.fire.fire();off();if(hits&&okFn(hits))return true}return false};
  return document.visibilityState})()`;

(async()=>{
  const B_=await launch({gpu,size:[1280,720]});
  const [A,B,C,D]=[await B_.page(),await B_.page(),await B_.page(),await B_.page()];
  const pages={A,B,C,D};
  try{
    await A.nav(base);await A.ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem('discoStrzelnica.opt.v1','{"level":"remiza"}');1`);
    for(const p of [A,B,D])await p.nav(base);
    for(const [k,p] of Object.entries({A,B,D}))info('visibility.'+k,await p.ev(SETUP));
    for(const p of [A,B,D])await p.ev(`document.getElementById('warnFull').click();1`);
    await sleep(300);
    const base0={};for(const [k,p] of Object.entries({A,B}))base0[k]=await p.ev(`QA.rend.scene.children.length`);
    ok('menu.coopButton',await A.ev(`!!document.getElementById('mCoop')`));

    /* --- lobby: utworzenie pokoju --- */
    await A.ev(`document.getElementById('mCoop').click();1`);
    ok('lobby.screen',await A.ev(`QA.vis()`)==='scrCoop',await A.ev(`QA.vis()`));
    await A.ev(`document.getElementById('coopCreate').click();1`);
    await A.ev(`QA.until(()=>DS.net.inRoom(),4000)`);
    const code=await A.ev(`DS.net.N.room&&DS.net.N.room.code`);
    ok('lobby.create',/^[A-Z0-9]{6}$/.test(code||''),code);
    ok('lobby.codeShown',await A.ev(`QA.txt('#coopRoomCode')`)===code);

    /* --- błędy: zły kod, nieistniejący pokój --- */
    await D.ev(`document.getElementById('mCoop').click();const i=document.getElementById('coopCode');i.value='ab';document.getElementById('coopJoin').click();1`);
    ok('err.badCode',/6 znaków/.test(await D.ev(`QA.txt('#coopMsg')`)),await D.ev(`QA.txt('#coopMsg')`));
    await D.ev(`document.getElementById('coopCode').value='ZZZZZ9';document.getElementById('coopJoin').click();1`);
    await sleep(2600);
    ok('err.ROOM_NOT_FOUND',/Nie ma pokoju/.test(await D.ev(`QA.txt('#coopMsg')`)),await D.ev(`QA.txt('#coopMsg')`));
    ok('err.textsPolish',await D.ev(`['ROOM_FULL','ROOM_LOCKED','KICKED','TICKET','TIMEOUT','DISCONNECTED'].every(c=>!/Błąd połączenia/.test(DS.net.errText(c)))`));
    /* --- ROOM_FULL: D tworzy pokój na 2 (API), B wchodzi (API), C próbuje z lobby --- */
    const code2=await D.ev(`(async()=>{window.__r=await juicy.rooms.create({max:2});return __r.code})()`);
    await B.ev(`(async()=>{window.__rb=await juicy.rooms.join('${code2}');return 1})()`);
    await C.nav(base);info('visibility.C',await C.ev(SETUP));await C.ev(`document.getElementById('warnFull').click();1`);await sleep(200);
    await C.ev(`document.getElementById('mCoop').click();document.getElementById('coopCode').value='${code2}';document.getElementById('coopJoin').click();1`);
    await sleep(800);
    ok('err.ROOM_FULL',/pełny/.test(await C.ev(`QA.txt('#coopMsg')`)),await C.ev(`QA.txt('#coopMsg')`));
    await B.ev(`__rb.leave();1`);await D.ev(`__r.leave();1`);await C.ev(`document.querySelector('#scrCoop [data-go=scrMenu]').click();1`);

    /* --- B dołącza kodem, C z linku zaproszenia --- */
    await B.ev(`document.getElementById('mCoop').click();document.getElementById('coopCode').value='${code.toLowerCase()}';document.getElementById('coopJoin').click();1`);
    ok('lobby.joinByCode',await B.ev(`QA.until(()=>DS.net.inRoom(),4000)`));
    const invite=await A.ev(`DS.net.N.room.invite()`);
    ok('lobby.inviteLink',invite.endsWith('?room='+code),invite);
    await C.nav(invite);info('visibility.C2',await C.ev(SETUP));
    await C.ev(`document.getElementById('warnFull').click();1`);
    ok('lobby.joinByInvite',await C.ev(`QA.until(()=>DS.net.inRoom()&&QA.vis()==='scrCoop',5000)`));
    await sleep(300);
    const listA=await A.ev(`[...document.querySelectorAll('#coopList li .nm')].map(e=>e.textContent)`);
    ok('lobby.list3',listA.length===3,listA);
    ok('lobby.namesAsText',await A.ev(`[...document.querySelectorAll('#coopList li .nm')].every(e=>e.children.length===0)`));
    ok('lobby.startBlockedUntilReady',await A.ev(`document.getElementById('coopStart').disabled`));
    await A.ev(`const s=document.getElementById('coopLevel');s.value='blokowisko';s.dispatchEvent(new Event('change'));1`);
    await B.ev(`document.getElementById('coopReady').click();1`);await C.ev(`document.getElementById('coopReady').click();1`);
    await sleep(400);
    ok('lobby.levelSync',/Blokowisko/.test(await B.ev(`QA.txt('#coopSetup')`)),await B.ev(`QA.txt('#coopSetup')`));
    ok('lobby.allReady',await A.ev(`!document.getElementById('coopStart').disabled`));
    const ids={A:await A.ev(`DS.net.me()`),B:await B.ev(`DS.net.me()`),C:await C.ev(`DS.net.me()`)};

    /* --- start --- */
    await A.ev(`document.getElementById('coopStart').click();1`);
    await sleep(2500);
    const st=await Promise.all([A,B,C].map(p=>p.ev(`({mode:QA.S.mode,lvl:QA.wst.world.level.id,active:DS.net.active(),host:DS.net.isHost(),wave:QA.S.G&&QA.S.G.wave})`)));
    ok('start.allInGame',st.every(s=>s.mode==='game'&&s.active),st);
    ok('start.sameLevel',st.every(s=>s.lvl==='blokowisko'),st.map(s=>s.lvl));
    ok('start.oneHost',st[0].host&&!st[1].host&&!st[2].host);
    await D.ev(`document.getElementById('coopCode').value='${code}';document.getElementById('coopJoin').click();1`);await sleep(900);
    ok('err.ROOM_LOCKED',/zamknięty/.test(await D.ev(`QA.txt('#coopMsg')`)),await D.ev(`QA.txt('#coopMsg')`));

    const live=(ms,god=true)=>Promise.all([A,B,C].map(p=>p.ev(`QA.live(${ms},${god})`)));
    await live(1200);

    /* --- ruch awatara --- */
    const bp=await B.ev(`(()=>{const P=QA.P;P.pos.x+=3;P.pos.z-=2;return [P.pos.x,P.pos.z]})()`);
    await live(900);
    const av=await A.ev(`(()=>{const r=DS.net.N.players.get('${ids.B}');return r&&r.avatar?[r.avatar.g.position.x,r.avatar.g.position.z]:null})()`);
    ok('avatar.movesOnHost',!!av&&Math.hypot(av[0]-bp[0],av[1]-bp[1])<.35,{av,bp});
    const avC=await C.ev(`(()=>{const r=DS.net.N.players.get('${ids.B}');return r&&r.avatar?[r.avatar.g.position.x,r.avatar.g.position.z]:null})()`);
    ok('avatar.movesOnOtherClient',!!avC&&Math.hypot(avC[0]-bp[0],avC[1]-bp[1])<.35,{avC,bp});
    ok('avatar.nickSprite',await A.ev(`(()=>{const r=DS.net.N.players.get('${ids.B}');return !!(r.avatar.tag&&r.avatar.tag.material.map)})()`));

    /* --- wrogowie: repliki zgodne z hostem --- */
    ok('enemies.spawnOnHost',await A.ev(`QA.until(()=>QA.S.G.enemies.filter(e=>e.alive).length>=4,25000)`));
    await live(1000);
    const cmp=async p=>{
      const h=await A.ev(`QA.S.G.enemies.filter(e=>e.alive).map(e=>[e.eid,e.g.position.x,e.g.position.z,e.type])`);
      const c=await p.ev(`QA.S.G.enemies.filter(e=>e.alive&&e.replica).map(e=>[e.eid,e.g.position.x,e.g.position.z,e.type])`);
      const m=new Map(c.map(x=>[x[0],x]));let match=0,maxD=0,typeOk=true;
      for(const e of h){const r=m.get(e[0]);if(!r)continue;match++;maxD=Math.max(maxD,Math.hypot(e[1]-r[1],e[2]-r[2]));if(r[3]!==e[3])typeOk=false}
      return {host:h.length,rep:c.length,match,maxD:+maxD.toFixed(2),typeOk};
    };
    const cB=await cmp(B),cC=await cmp(C);
    ok('replicas.countB',Math.abs(cB.host-cB.rep)<=1&&cB.match>=cB.host-1,cB);
    ok('replicas.countC',Math.abs(cC.host-cC.rep)<=1&&cC.match>=cC.host-1,cC);
    ok('replicas.positions(<1.5m)',cB.maxD<1.5&&cC.maxD<1.5,{B:cB.maxD,C:cC.maxD});
    ok('replicas.types',cB.typeOk&&cC.typeOk);

    /* --- trafienie klienta zabija wroga u hosta --- */
    const target=await B.ev(`(()=>{const e=QA.S.G.enemies.find(x=>x.alive&&x.replica);if(!e)return null;QA.P.pos.set(e.g.position.x,0,e.g.position.z+5);return e.eid})()`);
    await A.ev(`(()=>{const e=QA.S.G.enemies.find(x=>x.eid===${target});if(e){e.hp=1}return 1})()`);
    await B.ev(`QA.live(300,true)`);
    const killsB0=await B.ev(`QA.S.G.kills`),killsA0=await A.ev(`QA.S.G.kills`);
    // stoimy 4 m od repliki, z kolejnych stron (blokowisko ma ściany), aż strzał trafi
    const shot=await B.ev(`(()=>{const G=QA.S.G,P=QA.P,v=new THREE.Vector3();let hit=0;const off=DS.bus.on('hit',()=>hit++);
      for(let k=0;k<16&&!hit;k++){const e=G.enemies.find(x=>x.eid===${target});if(!e||!e.alive)break;const a=k*Math.PI/8;
        P.pos.set(e.g.position.x+Math.sin(a)*4,0,e.g.position.z+Math.cos(a)*4);P.vel.set(0,0,0);QA.frame();
        const h=e.meshes.find(m=>m.userData.part==='body')||e.meshes[0];h.getWorldPosition(v);
        const dx=v.x-P.pos.x,dz=v.z-P.pos.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(v.y-1.62,Math.hypot(dx,dz));QA.frame();
        G.fireT=0;G.reloadT=0;G.ammo[G.weapon]=5;QA.fire.fire()}
      off();return hit})()`);
    info('client.hitEvents',shot);
    await live(700);
    ok('client.hitKillsOnHost',await A.ev(`!(QA.S.G.enemies.find(x=>x.eid===${target})||{alive:false}).alive`),shot);
    ok('client.killCreditedToShooter',(await B.ev(`QA.S.G.kills`))>killsB0,{before:killsB0});
    ok('client.replicaDies',await C.ev(`!(QA.S.G.enemies.find(x=>x.eid===${target})||{alive:false}).alive`));
    ok('host.noRewardForRemoteKill',await A.ev(`QA.S.G.kills`)===killsA0);

    /* --- bezpieczeństwo: śmieci i zalew wiadomości --- */
    const inv0=await A.ev(`DS.net.N.stats.invalid`);
    await B.ev(`(()=>{const r=DS.net.N.room;r.send({k:'shot',h:[[1,'x',0]]});r.send({k:'in',t:1,p:[NaN,0,0]});r.send({k:'snap',t:1,w:1,q:0,e:[]});r.send({k:'zzz'});r.send('tekst');r.send({k:'shot',h:[[999999,50,0]]});
      for(let i=0;i<150;i++)r.send({k:'rev'},'${ids.A}');return 1})()`);
    await live(400);
    const sec=await A.ev(`({inv:DS.net.N.stats.invalid,drop:DS.net.N.stats.dropped,errs:QA.errs.length,active:DS.net.active()})`);
    ok('security.invalidIgnored',sec.inv>=inv0+4&&sec.active,sec);
    ok('security.floodDropped',sec.drop>0,sec);

    /* --- hurt dochodzi do klienta --- */
    const d0=await B.ev(`(QA.dmg=[],QA.S.G.hp)`);
    await A.ev(`(()=>{const r=DS.net.N.players.get('${ids.B}');QA.host.aimAt(r);QA.cmb.hurt(15);QA.host.unaim();return 1})()`);
    await Promise.all([A.ev(`QA.live(400,true)`),B.ev(`QA.live(400,false)`),C.ev(`QA.live(400,true)`)]);
    const d1=await B.ev(`({hp:QA.S.G.hp,dmg:QA.dmg})`);
    ok('hurt.reachesClient',d1.dmg.length>0&&d1.hp<d0,{d0,d1});
    ok('hurt.hostUnharmed',await A.ev(`QA.S.G.hp===QA.S.G.maxHp`));

    /* --- powalenie i podnoszenie --- */
    await B.ev(`QA.cmb.hurt(99999);1`);
    await live(500,true);
    ok('down.clientDowned',await B.ev(`QA.S.G.dead&&!QA.S.G.coopEnded&&document.getElementById('scrOver').hidden`));
    ok('down.seenByHost',await A.ev(`DS.net.N.players.get('${ids.B}').down`));
    const bpos=await B.ev(`[QA.P.pos.x,QA.P.pos.z]`);
    await C.ev(`QA.P.pos.set(${bpos[0]+1},0,${bpos[1]});QA.key('KeyE');1`);
    await Promise.all([A.ev(`QA.live(3500,true)`),B.ev(`QA.live(3500,false)`),C.ev(`(async()=>{const t0=performance.now();while(performance.now()-t0<3500){QA.P.pos.set(${bpos[0]+1},0,${bpos[1]});QA.S.G.hp=QA.S.G.maxHp;QA.frame();await QA.sleep(16)}})()`)]);
    await C.ev(`QA.key('KeyE','keyup');1`);
    await live(300,false);
    const rv=await B.ev(`({dead:QA.S.G.dead,hp:QA.S.G.hp,max:QA.S.G.maxHp})`);
    ok('revive.byTeammate',!rv.dead&&Math.abs(rv.hp/rv.max-.5)<.15,rv);

    /* ===================== ETAP 2 ===================== */
    /* --- boss: replika z paskiem HP i fazą u klienta --- */
    const bossEid=await A.ev(`(()=>{const G=QA.S.G;const e=QA.en.spawnEnemy('boss_szef_ochrony',{boss:true,at:{x:QA.P.pos.x+10,z:QA.P.pos.z}});return e.eid})()`);
    await live(1200);
    const bB=await B.ev(`(()=>{const e=QA.S.G.enemies.find(x=>x.eid===${bossEid});return {rep:!!e&&e.replica&&e.boss&&!!e.bar,bar:!document.getElementById('hBoss').hidden,name:QA.txt('#hBossName')}})()`);
    ok('boss.replicaWithBar',bB.rep&&bB.bar&&/SZEF/.test(bB.name),bB);
    const hpMul=await A.ev(`(()=>{const e=QA.S.G.enemies.find(x=>x.eid===${bossEid});return +(e.maxHp/ (720+62*QA.S.G.wave) / ({easy:.75,normal:1,hard:1.35}[DS.opt.difficulty]||1)).toFixed(2)})()`);
    ok('boss.hpScaled(x2.5 @3 graczy)',Math.abs(hpMul-2.5)<.05,hpMul);
    await A.ev(`(()=>{const e=QA.S.G.enemies.find(x=>x.eid===${bossEid});e.hp=e.maxHp*.6;return 1})()`);
    await live(1500);
    const ph=await B.ev(`({phase:QA.txt('#hBossPhase'),ann:QA.ann.slice(-6)})`);
    ok('boss.phaseOnClient',/FAZA 2/.test(ph.phase)&&ph.ann.includes('WZYWAM POSIŁKI!'),ph);

    /* --- kałuża i pocisk ranią klienta (obrażenia liczy host) --- */
    const bp2=await B.ev(`(QA.dmg=[],[QA.P.pos.x,QA.P.pos.z])`);
    await A.ev(`QA.proj.puddle(${bp2[0]},${bp2[1]},{r:2.5,life:4,dmg:6,kind:'bimber'});1`);
    await Promise.all([A.ev(`QA.live(1500,true)`),B.ev(`(async()=>{const t0=performance.now();while(performance.now()-t0<1500){QA.P.pos.set(${bp2[0]},0,${bp2[1]});QA.S.G.invulnT=0;QA.frame();await QA.sleep(16)}})()`),C.ev(`QA.live(1500,true)`)]);
    const pd=await B.ev(`({dmg:QA.dmg.length,puddles:QA.proj.projCount().puddles,hp:QA.S.G.hp})`);
    ok('fx.puddleHurtsClient',pd.dmg>0&&pd.puddles>0,pd);
    await B.ev(`(QA.dmg=[],QA.S.G.hp=QA.S.G.maxHp,1)`);
    await A.ev(`QA.proj.throwProj('bottle',new THREE.Vector3(${bp2[0]}+5,1.6,${bp2[1]}),${bp2[0]},1.1,${bp2[1]},{speed:12,dmg:12});1`);
    await Promise.all([A.ev(`QA.live(1200,true)`),B.ev(`(async()=>{const t0=performance.now();while(performance.now()-t0<1200){QA.P.pos.set(${bp2[0]},0,${bp2[1]});QA.frame();await QA.sleep(16)}})()`),C.ev(`QA.live(1200,true)`)]);
    ok('fx.bottleHurtsClient',(await B.ev(`QA.dmg.length`))>0);

    /* --- znajdźka zebrana przez klienta znika u hosta --- */
    await A.ev(`(QA.P.pos.set(${bp2[0]}+18,0,${bp2[1]}),1)`);   // host daleko: jego magnes nie może zgarnąć znajdźki
    const pid=await A.ev(`(()=>{const p=QA.pk.spawnPickup('med',{x:${bp2[0]},z:${bp2[1]}},30);return p.nid})()`);
    await B.ev(`(QA.S.G.hp=40,QA.heals=[],1)`);
    await Promise.all([A.ev(`QA.live(1500,true)`),B.ev(`(async()=>{const t0=performance.now();while(performance.now()-t0<1500){QA.P.pos.set(${bp2[0]},0,${bp2[1]});QA.frame();await QA.sleep(16)}})()`),C.ev(`QA.live(1500,true)`)]);
    const pkA=await A.ev(`QA.S.G.pickups.some(p=>p.nid===${pid})`),pkB=await B.ev(`({hp:QA.S.G.hp,healed:QA.heals.includes('pickup'),mirror:QA.S.G.pickups.some(p=>p.nid===${pid})})`),pkC=await C.ev(`QA.S.G.pickups.some(p=>p.nid===${pid})`);
    ok('pickup.clientTakes',!!pid&&!pkA&&!pkB.mirror&&!pkC&&pkB.healed,{pid,pkA,pkB,pkC});

    /* --- beczka wysadzona przez klienta --- */
    const bi=await B.ev(`(()=>{const b=QA.lvc.debugState().barrels;if(!b)return -1;return b.items.findIndex(x=>!x.dead)})()`);
    let barrelOk=false;
    if(bi>=0){
      const shotB=await B.ev(`QA.shootAt(()=>{const b=QA.lvc.debugState().barrels.items[${bi}];return {x:b.x,y:.5,z:b.z}},7,h=>h.some(x=>QA.lvc.debugState().barrels.ims.has(x.object)))`);
      await live(900);
      const bA=await A.ev(`QA.lvc.debugState().barrels.items[${bi}].dead`),bC=await C.ev(`QA.lvc.debugState().barrels.items[${bi}].dead`);
      barrelOk=shotB&&bA&&bC;ok('barrel.clientShot',barrelOk,{shotB,bA,bC});
    }else ok('barrel.clientShot',false,'brak beczek');

    /* --- drzwi otwarte przez klienta widoczne u hosta --- */
    const di=await B.ev(`(()=>{const d=QA.lvc.debugState().doors;return d.findIndex(x=>!x.auto&&x.target===0)})()`);
    if(di>=0){
      await B.ev(`(()=>{const d=QA.lvc.debugState().doors[${di}];QA.P.pos.set(d.px+(d.axis==='x'?0:1.2),0,d.pz+(d.axis==='x'?1.2:0));QA.frame();QA.tap('KeyE');return d.target})()`);
      await live(900);
      const dA=await A.ev(`QA.lvc.debugState().doors[${di}].target`),dC=await C.ev(`QA.lvc.debugState().doors[${di}].target`);
      ok('door.clientOpensForAll',dA===1&&dC===1,{dA,dC});
    }else ok('door.clientOpensForAll',false,'brak drzwi');

    /* --- boss poziomu zabity przez klienta: levelComplete u wszystkich, „Dalej” tylko host --- */
    await A.ev(`(()=>{const e=QA.S.G.enemies.find(x=>x.eid===${bossEid});if(e){e.hp=1;e.invulT=0}return 1})()`);
    const ld0=await B.ev(`!!(DS.save.levelsDone&&DS.save.levelsDone.blokowisko)`);
    const bossShot=await B.ev(`QA.shootAt(()=>{const e=QA.S.G.enemies.find(x=>x.eid===${bossEid}&&x.alive);if(!e)return null;const v=new THREE.Vector3();(e.meshes.find(m=>m.userData.part==='body')||e.meshes[0]).getWorldPosition(v);return v},6,h=>h.some(x=>x.enemy&&x.enemy.eid===${bossEid}))`);
    await live(900);
    for(let i=0;i<6;i++){if(await A.ev(`!(QA.S.G.enemies.find(x=>x.eid===${bossEid})||{alive:false}).alive`))break;
      await A.ev(`(()=>{const e=QA.S.G.enemies.find(x=>x.eid===${bossEid});if(e){e.hp=1;e.invulT=0}return 1})()`);
      await B.ev(`QA.shootAt(()=>{const e=QA.S.G.enemies.find(x=>x.eid===${bossEid}&&x.alive);if(!e)return null;const v=new THREE.Vector3();(e.meshes.find(m=>m.userData.part==='body')||e.meshes[0]).getWorldPosition(v);return v},5,h=>h.some(x=>x.enemy&&x.enemy.eid===${bossEid}))`);
      await live(700)}
    ok('boss.killedByClient',await A.ev(`!(QA.S.G.enemies.find(x=>x.eid===${bossEid})||{alive:false}).alive`),{bossShot});
    await live(3000);
    const lcA=await A.ev(`({vis:QA.vis(),next:!document.getElementById('lcNext').disabled,nt:QA.txt('#lcNext')})`);
    const lcB=await B.ev(`({vis:QA.vis(),dis:document.getElementById('lcNext').disabled,nt:QA.txt('#lcNext'),done:!!(DS.save.levelsDone&&DS.save.levelsDone.blokowisko)})`);
    const lcC=await C.ev(`({vis:QA.vis(),dis:document.getElementById('lcNext').disabled})`);
    ok('levelComplete.allScreens',lcA.vis==='scrLevelDone'&&lcB.vis==='scrLevelDone'&&lcC.vis==='scrLevelDone',{A:lcA.vis,B:lcB.vis,C:lcC.vis});
    ok('levelComplete.onlyHostNext',lcA.next&&lcB.dis&&lcC.dis&&/Czekamy/.test(lcB.nt),{lcA,lcB});
    ok('levelComplete.levelsDoneClient',lcB.done,{before:ld0});
    const nextId=await A.ev(`(()=>{const l=DS.levels.all(),i=l.findIndex(x=>x.id==='blokowisko');return l[i+1]&&l[i+1].id})()`);
    await A.ev(`document.getElementById('lcNext').click();1`);
    await sleep(3000);
    const nx=await Promise.all([A,B,C].map(p=>p.ev(`({mode:QA.S.mode,lvl:QA.wst.world.level.id,active:DS.net.active(),vis:QA.vis(),wave:QA.S.G&&QA.S.G.wave})`)));
    ok('next.allOnNextLevel',nx.every(s=>s.mode==='game'&&s.active&&s.lvl===nextId),nx);
    await live(1500);
    const team=await A.ev(`DS.net.debug()`);ok('next.teamKept',team.players===2&&team.avatars===2,team);

    /* ===================== ETAP 3 ===================== */
    /* --- HUD kolegów i zawołania --- */
    const hudA=await A.ev(`({rows:[...document.querySelectorAll('#coopTeam .coopRow')].map(r=>r.querySelector('.coopName').textContent),vis:!document.getElementById('coopTeam').hidden,
      txtOnly:[...document.querySelectorAll('#coopTeam .coopName')].every(e=>e.children.length===0)})`);
    ok('hud.teamPanel',hudA.vis&&hudA.rows.length===2&&hudA.txtOnly,hudA);
    await B.ev(`QA.tap('KeyZ');1`);await live(400);
    const callA=await A.ev(`({feed:[...document.querySelectorAll('#coopFeed .coopFeedItem')].map(e=>e.textContent),callT:DS.net.N.players.get('${ids.B}').callT,
      mark:[...document.querySelectorAll('#coopMarks .coopMark')].some(m=>!m.hidden&&/Tutaj/.test(m.textContent))})`);
    ok('hud.callout',callA.feed.some(t=>/Tutaj!/.test(t))&&callA.callT>0&&callA.mark,callA);
    await B.ev(`QA.cmb.hurt(99999);1`);await live(500);
    const downRow=await A.ev(`[...document.querySelectorAll('#coopTeam .coopRow')].map(r=>r.querySelector('.coopState').textContent)`);
    const reviveMark=await C.ev(`(()=>{const r=DS.net.N.players.get('${ids.B}');QA.P.pos.set(r.pos.x+6,0,r.pos.z);const dx=r.pos.x-QA.P.pos.x,dz=r.pos.z-QA.P.pos.z;QA.P.yaw=Math.atan2(-dx,-dz);QA.P.pitch=-.2;QA.frame();QA.frame();
      const ms=[...document.querySelectorAll('#coopMarks .coopMark')].map(m=>({h:m.hidden,t:m.textContent}));return {ok:ms.some(m=>!m.h&&/PODNIEŚ/.test(m.t)),ms,down:r.down,rp:[r.pos.x,r.pos.y,r.pos.z],p:[QA.P.pos.x,QA.P.pos.z]}})()`);
    ok('hud.downedState',downRow.includes('POWALONY')&&reviveMark.ok,{downRow,reviveMark});
    await C.ev(`DS.net.N.room.send({k:'rev'},'${ids.B}');1`);await live(400,false);

    /* --- dołączenie w trakcie runu (między falami) z pełnym stanem --- */
    await A.ev(`(()=>{const G=QA.S.G;G.wave=Math.max(G.wave,1);G.enemies.forEach(e=>{if(e.alive){e.alive=false;e.dieT=4.9}});G.queue=0;G.cleared=true;G.between=60;return 1})()`);
    await live(1600);
    ok('join.roomOpenBetweenWaves',await A.ev(`DS.net.N.room.locked===false`));
    const jp=await A.ev(`(()=>{const p=QA.pk.spawnPickup('kebab',{x:QA.P.pos.x+14,z:QA.P.pos.z},20);return p.nid})()`);
    await live(300);
    await D.ev(`(()=>{if(QA.vis()!=='scrCoop')document.getElementById('mCoop').click();document.getElementById('coopCode').value='${code}';document.getElementById('coopJoin').click();return 1})()`);
    ok('join.midRun',await D.ev(`QA.until(()=>DS.net.active()&&QA.S.mode==='game',6000)`));
    await Promise.all([A,B,C,D].map(p=>p.ev(`QA.live(1200,true)`)));
    const jD=await D.ev(`({lvl:QA.wst.world.level.id,wave:QA.S.G.wave,hp:QA.S.G.hp===QA.S.G.maxHp,pk:QA.S.G.pickups.some(p=>p.nid===${jp}&&p.mirror),avatars:DS.net.debug().avatars,
      spawn:(()=>{const s=QA.wst.world.level.spawn||{x:0,z:30};return Math.hypot(QA.P.pos.x-s.x,QA.P.pos.z-s.z)<3})()})`);
    const jA=await A.ev(`({lvl:QA.wst.world.level.id,wave:QA.S.G.wave,players:DS.net.debug().players,avatars:DS.net.debug().avatars})`);
    ok('join.fullState',jD.lvl===jA.lvl&&jD.wave===jA.wave&&jD.hp&&jD.pk&&jD.spawn,{jD,jA});
    ok('join.seenByAll',jA.avatars===3&&jD.avatars===3&&(await B.ev(`DS.net.debug().avatars`))===3,{jA:jA.avatars,jD:jD.avatars});
    await A.ev(`(QA.S.G.between=.3,1)`);
    await Promise.all([A,B,C,D].map(p=>p.ev(`QA.live(2500,true)`)));
    const sc=await A.ev(`({n:DS.net.N.scaleN,locked:DS.net.N.room.locked,alive:QA.S.G.enemies.filter(e=>e.alive).length,wave:QA.S.G.wave})`);
    ok('join.rescaleNextWave',sc.n===4&&sc.locked===true,sc);
    ok('join.replicasOnJoiner',(await D.ev(`QA.S.G.enemies.filter(e=>e.alive&&e.replica).length`))>=Math.max(1,sc.alive-1),{host:sc.alive});

    /* --- zerwane połączenie klienta: komunikat, powrót, pełny stan --- */
    await B.ev(`(()=>{const r=DS.net.N.room;window.__lk=r.link;r.link=null;return 1})()`);
    await Promise.all([A,B,C,D].map(p=>p.ev(`QA.live(900,true)`)));
    const rc1=await B.ev(`({banner:QA.txt('#coopBanner'),hidden:document.getElementById('coopBanner').hidden})`);
    await A.ev(`(()=>{QA.en.spawnEnemy('dres',{});return 1})()`);
    await B.ev(`(()=>{DS.net.N.room.link=window.__lk;return 1})()`);
    await Promise.all([A,B,C,D].map(p=>p.ev(`QA.live(1500,true)`)));
    const rcA=await A.ev(`QA.S.G.enemies.filter(e=>e.alive).length`),rcB=await B.ev(`({rep:QA.S.G.enemies.filter(e=>e.alive&&e.replica).length,feed:[...document.querySelectorAll('#coopFeed .coopFeedItem')].map(e=>e.textContent),banner:document.getElementById('coopBanner').hidden,active:DS.net.active()})`);
    ok('reconnect.message',!rc1.hidden&&/Rozłączono/.test(rc1.banner),rc1);
    ok('reconnect.backWithFull',rcB.active&&rcB.banner&&rcB.feed.some(t=>/wróciło/.test(t))&&Math.abs(rcB.rep-rcA)<=1,{rcA,rcB});

    /* --- host w tle: ostrzeżenie u klientów, symulacja hosta na setInterval --- */
    await A.ev(`(()=>{const r=DS.net.N.room;window.__snd=r.send;r.send=function(){};return 1})()`);
    await Promise.all([B,C].map(p=>p.ev(`QA.live(2000,true)`)));
    const hw=await B.ev(`({t:QA.txt('#coopBanner'),hidden:document.getElementById('coopBanner').hidden})`);
    await A.ev(`(()=>{const r=DS.net.N.room;r.send=window.__snd;return 1})()`);
    await Promise.all([A,B,C,D].map(p=>p.ev(`QA.live(800,true)`)));
    ok('bg.clientWarning',!hw.hidden&&/zminimalizował/.test(hw.t)&&await B.ev(`document.getElementById('coopBanner').hidden`),hw);
    const bg=await A.ev(`(async()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});DS.net.checkHidden();const s0=DS.net.N.stats.bgSteps||0,n0=DS.net.N.stats.snaps;
      await QA.sleep(1500);const out={steps:(DS.net.N.stats.bgSteps||0)-s0,snaps:DS.net.N.stats.snaps-n0,ms:DS.net.N.stats.bgMs};delete document.hidden;await QA.sleep(150);return out})()`);
    ok('bg.hostIntervalSim',bg.steps>=20&&bg.snaps>=10,bg);info('bg.stepCostMs',bg.ms);

    /* --- odejście hosta (JuicyJuicy przekazuje rolę): run kończy się, lobby z nowym hostem --- */
    // Lokalny relay (BroadcastChannel) nie przenosi hosta, więc symulujemy zdarzenia relaya JuicyJuicy u gracza D.
    await D.ev(`(()=>{const r=DS.net.N.room;r.receive({t:'leave',id:'${ids.A}'});r.receive({t:'host',id:DS.net.me()});return 1})()`);
    await sleep(400);
    const hl=await D.ev(`({vis:QA.vis(),mode:QA.S.mode,host:DS.net.N.room&&DS.net.N.room.isHost(),msg:QA.txt('#coopMsg'),active:DS.net.active()})`);
    ok('hostLeft.lobbyNewHost',hl.vis==='scrCoop'&&hl.mode==='menu'&&hl.host&&!hl.active&&/Host wyszedł/.test(hl.msg),hl);
    await D.ev(`DS.net.leaveRoom();1`);await live(600);

    /* --- rozmiar snapshotu przy 30 wrogach --- */
    const snap=await A.ev(`(()=>{const G=QA.S.G;let n=G.enemies.filter(e=>e.alive).length;while(n<30){QA.en.spawnEnemy(['dres','bandyta','ochroniarz','pijak','medyk'][n%5],{});n++}
      const s=DS.net.buildSnap();return {n:s.e.length,bytes:JSON.stringify(s).length,max:DS.net.N.stats.snapMax}})()`);
    ok('snap.size<=6KB@30',snap.n>=30&&snap.bytes<=6144,snap);info('snap',snap);
    await live(600);
    const c30=await cmp(B);ok('replicas.30',Math.abs(c30.host-c30.rep)<=2,c30);

    /* --- koniec runu: wszyscy leżą --- */
    for(const p of [A,B,C])await p.ev(`QA.cmb.hurt(99999);1`);
    await live(2600,false);
    const end=await Promise.all([A,B,C].map(p=>p.ev(`({vis:QA.vis(),rows:document.querySelectorAll('#overStats .coopStats tbody tr').length,ended:!!(QA.S.G&&QA.S.G.coopEnded),active:DS.net.active()})`)));
    ok('end.allSeeOver',end.every(e=>e.vis==='scrOver'&&e.ended&&!e.active),end);
    ok('end.statsAllPlayers',end.every(e=>e.rows===3),end.map(e=>e.rows));
    ok('end.roomUnlocked',await A.ev(`DS.net.N.room&&!DS.net.N.room.locked`));

    /* --- powrót do lobby, wyjście z pokoju, wycieki --- */
    for(const p of [A,B,C])await p.ev(`document.getElementById('oLobby').click();1`);
    await sleep(300);
    const lob=await Promise.all([A,B,C].map(p=>p.ev(`({vis:QA.vis(),mode:QA.S.mode,dbg:DS.net.debug()})`)));
    ok('lobby.afterEnd',lob.every(l=>l.vis==='scrCoop'&&l.mode==='menu'&&l.dbg.room===code),lob.map(l=>l.vis+'/'+l.mode));
    ok('leak.avatarsReplicasGone',lob.every(l=>l.dbg.avatars===0&&l.dbg.replicas===0),lob.map(l=>l.dbg));
    for(const p of [B,C,A])await p.ev(`document.getElementById('coopLeave').click();1`);
    await sleep(600);
    const fin={};
    for(const [k,p] of Object.entries({A,B})){fin[k]=await p.ev(`(()=>{QA.wld.loadLevel('remiza');QA.frame();return {scene:QA.rend.scene.children.length,dbg:DS.net.debug(),G:!!QA.S.G}})()`)}
    ok('leak.sceneBaseline',fin.A.scene===base0.A&&fin.B.scene===base0.B,{A:[fin.A.scene,base0.A],B:[fin.B.scene,base0.B]});
    ok('leave.roomClosed',!fin.A.dbg.room&&!fin.B.dbg.room&&fin.A.dbg.players===0,fin.A.dbg);
    info('stats.A',fin.A.dbg.stats);
    // błędy w konsoli
    const errs={};for(const [k,p] of Object.entries(pages)){const e=await p.ev(`QA.errs.slice(0,5)`);if(e.length||p.logs.length)errs[k]=e.concat(p.logs.slice(0,5))}
    ok('console.noErrors',!Object.keys(errs).length,errs);
  }catch(e){R.FATAL=String(e&&e.stack||e)}
  finally{B_.close()}
  console.log(JSON.stringify(R,null,1));
  const fails=Object.entries(R).filter(([k,v])=>String(v).startsWith('FAIL')||k==='FATAL');
  console.log(fails.length?'FAILS: '+fails.length:'ALL PASS');
  setTimeout(()=>process.exit(fails.length?1:0),1000);
})();
