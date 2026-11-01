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
  QA.dmg=[];DS.bus.on('damage',e=>QA.dmg.push(e.amount));QA.kills=0;DS.bus.on('kill',()=>QA.kills++);
  QA.$=s=>document.querySelector(s);QA.txt=s=>{const e=document.querySelector(s);return e?e.textContent:null};
  QA.host=await import('/js/net/host.js');QA.en=await import('/js/enemies/manager.js');
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
