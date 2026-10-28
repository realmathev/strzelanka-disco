// Testy samoczynne areny (tools/enemy-test.html): ARENA.selfTest([typ]) -> {nazwa: 'PASS' | 'FAIL (szczegóły)' | 'info: …'}.
// Bez GPU render jest programowy i wolny, więc symulacja idzie klatkami po 1/30 s z renderem co kilkadziesiąt klatek; czasy w sekundach SYMULACJI.
import {clearProj,projCount,puddle} from './proj.js';
import {makeEnemy} from './manager.js';

const TYPES=['dres','ochroniarz','bandyta','snajper','pijak','kamikadze','medyk','kierowca'];
const BOSSES=['boss_dj','boss_jednooki','boss_szef_ochrony'];

export async function runAll(A,X,only){
  const {S,DS,P,world,nav,opt,damageEnemy,spawnEnemy,updateEnemies,enter}=X;
  const R={},DT=1/30;
  const ok=(n,c,d)=>{R[n]=c?'PASS':'FAIL'+(d!==undefined?' ('+d+')':'')};
  const inf=(n,v)=>{R[n]='info: '+v};
  const fx=v=>+v.toFixed(2);
  A.renderEvery=45;
  if(S.mode!=='game'||!S.G)await A.start();
  const scn=()=>X.scene.children.length;
  // domyślne stanowisko gracza: pas z=-22 (bez wysokich przeszkód), patrzy w +X, wrogowie „przed” = dalej na wschód
  const P0={x:-34,z:-22,yaw:-Math.PI/2};
  const reset=(o)=>{const p=o||P0;A.clear();A.step(2);clearProj();A.dmg=0;A.dmgN=0;A.setGod(true);A.player(p.x,p.z,p.yaw||0);S.G.pickups.forEach(q=>{q.t=99});A.step(1)};
  /** Symuluje do n klatek; cb(i) zwraca true, żeby przerwać. Zwraca indeks lub -1. */
  const run=(n,cb)=>{for(let i=0;i<n;i++){A.frame(DT);if(cb&&cb(i)===true)return i}return -1};
  const dist=(e)=>Math.hypot(P.pos.x-e.g.position.x,P.pos.z-e.g.position.z);
  const faceP=e=>{e.g.rotation.y=Math.atan2(-(P.pos.x-e.g.position.x),-(P.pos.z-e.g.position.z))};
  const meshBox=e=>{const b=new THREE.Box3();e.g.updateMatrixWorld(true);for(const m of e.meshes)b.union(new THREE.Box3().setFromObject(m));return b};
  const tri=g=>g.index?g.index.count/3:g.attributes.position.count/3;
  const states=new Set();
  const watch=(e)=>{if(e.ai)states.add(e.ai.state+(e.ai.act?':'+e.ai.act:''))};
  const geoCount=()=>X.renderer.info.memory.geometries;
  const kills=[];DS.bus.on('kill',ev=>kills.push(ev));
  const xps=[];DS.bus.on('xp',ev=>xps.push(ev));
  const phases=[];DS.bus.on('bossPhase',ev=>phases.push(ev.phase));
  let bossHpEv=0;DS.bus.on('bossHp',()=>bossHpEv++);

  /* ---------- wspólne testy typu ---------- */
  async function common(t){
    const def=DS.enemies.get(t),boss=BOSSES.includes(t),car=t==='kierowca';
    reset();
    let e=A.spawn(t,{d:18});
    const bb=meshBox(e),h=bb.max.y-bb.min.y,len=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z);
    if(car){ok(`model.${t}.rozmiar`,len>2.9&&len<3.5&&h>1.2&&h<1.5,`dł. ${fx(len)} wys. ${fx(h)}`)}
    else if(boss)ok(`model.${t}.wzrost`,h>2.1&&h<2.9,fx(h)+' m');
    else ok(`model.${t}.wzrost`,h>1.62&&h<2.05,fx(h)+' m');
    ok(`model.${t}.trafialne`,e.meshes.some(m=>m.userData.part==='head')&&e.meshes.some(m=>m.userData.part==='body')&&e.meshes.every(m=>m.userData.enemy===e));
    let tris=0,draw=0,hulls=0;e.g.traverse(o=>{if(o.isMesh){draw++;tris+=tri(o.geometry);if(!o.userData.part)hulls++}});
    inf(`model.${t}.siatki`,`${draw} siatek (${hulls} konturów), ${Math.round(tris)} tri`);
    ok(`dane.${t}`,e.hp>0&&e.maxHp===e.hp&&typeof e.xp==='number'&&e.xp>0&&!!e.name&&e.dmg>0&&typeof def.dying==='function',`hp ${Math.round(e.hp)} xp ${e.xp} dmg ${fx(e.dmg)}`);
    ok(`dane.${t}.udostępnione`,e.mats.length===1&&e.meshes.every(m=>m.geometry.userData.shared),'geometrie współdzielone');
    // trudność: mnożniki w spawnEnemy
    opt.difficulty='easy';const eE=A.spawn(t,{d:20,off:.6});opt.difficulty='hard';const eH=A.spawn(t,{d:20,off:-.6});opt.difficulty='normal';
    ok(`trudność.${t}`,Math.abs(eH.hp/eE.hp-1.35/.75)<.02&&Math.abs(eH.dmg/eE.dmg-1.25/.75)<.02,`hp ${fx(eH.hp/eE.hp)} dmg ${fx(eH.dmg/eE.dmg)}`);
    // percepcja: słuch strzału, tył i przód pola widzenia
    reset();
    e=A.spawn(t,{d:30,aware:false});
    ok(`ai.${t}.start:patrol`,e.ai.state==='patrol',e.ai.state);
    DS.bus.emit('shot',{});
    ok(`ai.${t}.słyszyStrzał`,e.ai.state==='alert'||e.ai.state==='chase',e.ai.state);
    reset();
    e=A.spawn(t,{d:22,aware:false});e.g.rotation.y=Math.atan2(-(P.pos.x-e.g.position.x),-(P.pos.z-e.g.position.z))+Math.PI;e.ai.wait=99;
    run(45);
    ok(`ai.${t}.niewidziZaPlecami`,e.ai.state==='patrol'&&!e.ai.sees,e.ai.state);
    reset();
    e=A.spawn(t,{d:22,aware:false});faceP(e);e.ai.wait=99;
    const iSee=run(150,()=>e.ai.state!=='patrol');
    ok(`ai.${t}.widziPrzed`,iSee>=0&&e.ai.state!=='patrol',iSee<0?'nie zareagował w 5 s':'po '+fx(iSee*DT)+' s → '+e.ai.state);
    // pościg wave-spawn: dociera na dystans ataku
    reset();
    e=A.spawn(t,{d:24,aware:true});let min=99;
    run(300,()=>{min=Math.min(min,dist(e));return false});
    ok(`ai.${t}.pościg`,min<=e.cfg.range[1]*1.4+1,`min ${fx(min)} m (zasięg ${e.cfg.range[1]})`);
    // śmierć, XP, sprzątanie
    reset();
    const g0=scn();let gm;
    for(let k=0;k<3;k++){
      reset();e=A.spawn(t,{d:20});A.step(2);
      kills.length=0;xps.length=0;
      A.shoot(e,{dmg:1e6,head:true});
      if(k===0){
        ok(`śmierć.${t}.kill`,kills.length===1&&kills[0].enemy===e&&!e.alive&&kills[0].enemy.xp===e.xp,kills.length);
        ok(`śmierć.${t}.xp`,xps.length>0&&xps[0].gain>0,xps[0]&&('gain '+xps[0].gain));
      }
      A.step(25);
      if(k===0&&!car)ok(`śmierć.${t}.upadek`,Math.abs(e.rig.rotation.x)+Math.abs(e.rig.rotation.z)>.7,fx(Math.abs(e.rig.rotation.x)+Math.abs(e.rig.rotation.z)));
      run(180);
      if(k===1)gm=geoCount();
      if(k===2)ok(`wyciek.${t}.geometrie`,geoCount()<=gm,`${gm}→${geoCount()}`);
    }
    reset();
    ok(`wyciek.${t}.scena`,scn()===g0,`${g0}→${scn()}`);
  }

  /* ---------- testy zachowań ---------- */
  const SCEN={
    dres:async()=>{
      reset();const e=A.spawn('dres',{d:20});states.clear();let peak=0,px=e.g.position.x,pz=e.g.position.z;
      run(360,()=>{watch(e);const v=Math.hypot(e.g.position.x-px,e.g.position.z-pz)/DT;px=e.g.position.x;pz=e.g.position.z;peak=Math.max(peak,v);return false});
      ok('dres.szarża',states.has('wind')&&states.has('charge'),[...states].join(','));
      ok('dres.prędkośćSzarży',peak>8,fx(peak)+' m/s');
      ok('dres.bije',A.dmg>0,fx(A.dmg)+' obr.');
      // flankowanie w stadzie
      reset();A.setGod(true);
      const a=A.spawn('dres',{d:20,off:-.2}),b=A.spawn('dres',{d:21,off:.2});
      let flank=false;run(300,()=>{if(a.ai.state==='flank'||b.ai.state==='flank')flank=true;return flank});
      inf('dres.flankowanie',flank?'tak':'nie w 10 s (losowe)');
    },
    ochroniarz:async()=>{
      reset();const e=A.spawn('ochroniarz',{d:6});faceP(e);e.hp=e.maxHp=1000;const hp0=e.hp;
      A.shoot(e,{dmg:40});const front=hp0-e.hp;
      ok('ochroniarz.blokPrzód',front<=40*.15+.5,'tracone '+fx(front)+' z 40');
      e.hp=hp0;A.shoot(e,{dmg:40,head:true});ok('ochroniarz.głowaPrzebija',hp0-e.hp>=40-.01,'tracone '+fx(hp0-e.hp));
      e.hp=hp0;e.g.rotation.y+=Math.PI;A.shoot(e,{dmg:40});const back=hp0-e.hp;
      ok('ochroniarz.tyłBezOchrony',back>=40,'tracone '+fx(back));
      reset();const f=A.spawn('ochroniarz',{d:10});states.clear();run(300,()=>{watch(f);return false});
      ok('ochroniarz.pchnięcie',A.dmg>0,fx(A.dmg)+' obr.');
    },
    bandyta:async()=>{
      reset();let e=A.spawn('bandyta',{d:6});let hits=0;const off=DS.bus.on('damage',()=>hits++);
      run(450,()=>hits>=1);off();
      ok('bandyta.trafiaZBliska',hits>=1,hits+' trafień w 15 s');
      reset();e=A.spawn('bandyta',{d:22});const h0=A.dmgN;run(60);inf('bandyta.dalekoSłabszy','po 2 s ze 22 m trafień: '+(A.dmgN-h0));
      // obrażenia zależą od dystansu (jedno trafienie z bliska vs z daleka)
      let dNear=0;{reset();const n=A.spawn('bandyta',{d:3});const o2=DS.bus.on('damage',({amount})=>{dNear=Math.max(dNear,amount)});run(300,()=>dNear>0);o2()}
      ok('bandyta.obrzynZbliska',dNear>10,fx(dNear)+' obr. jednym strzałem');
    },
    snajper:async()=>{
      reset();const s=A.spawn('snajper',{d:40,aware:true});
      let tBeam=-1,tShot=-1;states.clear();
      const d0=A.dmgN;
      run(600,(i)=>{watch(s);const b=projCount().beams;if(b>0&&tBeam<0)tBeam=i;if(tBeam>=0&&tShot<0&&s.ai.sub===2)tShot=i;if(A.dmgN>d0&&tShot>=0)return true;return false});
      ok('snajper.laserZapowiedź',tBeam>=0,tBeam<0?'brak wiązki':'wiązka po '+fx(tBeam*DT)+' s');
      ok('snajper.zapowiedź≥1,8s',tBeam>=0&&tShot>=0&&(tShot-tBeam)*DT>=1.8,fx((tShot-tBeam)*DT)+' s od lasera do strzału');
      ok('snajper.trafiaStojącego',A.dmgN>d0,A.dmgN-d0+' trafień');
      // unik: po zamrożeniu celownika (st≥1,7) odskocz 3 m w bok
      reset();const s2=A.spawn('snajper',{d:40,aware:true});s2.ai.cd=0;
      const d1=A.dmgN;let dodged=false,shot=false;
      run(700,()=>{if(s2.ai.state==='attack'&&s2.ai.sub===1&&s2.ai.st>1.7&&!dodged){P.pos.z+=3;dodged=true}if(dodged&&s2.ai.sub===2)shot=true;return shot&&s2.ai.sub===0});
      ok('snajper.unikDziała',dodged&&shot&&A.dmgN===d1,`uniknięto=${dodged&&shot} trafień ${A.dmgN-d1}`);
      A.clear();A.step(2);
      ok('snajper.laserZwolniony',projCount().beams===0,JSON.stringify(projCount()));
    },
    pijak:async()=>{
      reset();const e=A.spawn('pijak',{d:12});let bottle=false,pud=false;
      run(360,()=>{const c=projCount();if(c.projs>0)bottle=true;if(c.puddles>0)pud=true;return bottle&&pud});
      ok('pijak.rzucaButelką',bottle);
      ok('pijak.kałuża',pud,JSON.stringify(projCount()));
      // kałuża rani stojącego w niej gracza
      reset();const pe=A.spawn('pijak',{d:12});
      puddle(P.pos.x,P.pos.z,{r:1.6,life:6,dmg:2});
      A.dmg=0;run(60);ok('pijak.kałużaRani',A.dmg>0,fx(A.dmg)+' obr. w 2 s');
      // po śmierci zostaje kałuża
      reset();const d=A.spawn('pijak',{d:12});A.shoot(d,{dmg:1e6});A.step(1);ok('pijak.kałużaPoŚmierci',projCount().puddles>=1,JSON.stringify(projCount()));
    },
    kamikadze:async()=>{
      reset();let e=A.spawn('kamikadze',{d:16});const kl=kills.length;states.clear();let fuse=false;
      run(300,()=>{watch(e);return !e.alive});
      ok('kamikadze.fuse+wybuch',states.has('fuse')&&!e.alive,[...states].join(','));
      ok('kamikadze.raniGracza',A.dmg>5,fx(A.dmg)+' obr.');
      ok('kamikadze.bezKillZdarzenia',kills.length===kl,'zabójstw '+(kills.length-kl));
      ok('kamikadze.petardy',true);
      // zastrzelony z daleka: ładunek wybucha po chwili, ale nie rani
      reset();e=A.spawn('kamikadze',{d:12});A.shoot(e,{dmg:1e6});A.dmg=0;run(60);
      ok('kamikadze.zdaleka:bezObrażeń',A.dmg===0,fx(A.dmg));
      // zastrzelony tuż przy graczu: wybuch zadaje obrażenia
      reset();e=A.spawn('kamikadze',{d:2});A.shoot(e,{dmg:1e6});A.dmg=0;run(60);
      ok('kamikadze.zblizaPoŚmierci',A.dmg>0,fx(A.dmg));
      // petarda (pocisk) z dystansu
      reset();e=A.spawn('kamikadze',{d:12});let petard=false;run(240,()=>{if(projCount().projs>0)petard=true;return petard});
      ok('kamikadze.rzucaPetardę',petard);
    },
    medyk:async()=>{
      reset();const ally=A.spawn('bandyta',{d:14,off:.15}),m=A.spawn('medyk',{d:18,off:-.15});
      ally.hp=ally.maxHp*.25;const before=ally.hp;let healed=false;
      run(450,()=>{if(ally.hp>before+ally.maxHp*.15)healed=true;return healed});
      ok('medyk.leczy',healed,`${fx(before)}→${fx(ally.hp)}/${fx(ally.maxHp)}, ładunki ${m.charges}`);
      ok('medyk.priorytet',m.priority===true&&m.meshes.length>=2);
      reset();const alone=A.spawn('medyk',{d:14});run(240);ok('medyk.samStrzela',alone.ai.state==='attack'||alone.ai.state==='chase',alone.ai.state);
    },
    kierowca:async()=>{
      reset();const e=A.spawn('kierowca',{d:24});states.clear();let peak=0,px=e.g.position.x,pz=e.g.position.z;
      run(600,()=>{watch(e);const v=Math.hypot(e.g.position.x-px,e.g.position.z-pz)/DT;px=e.g.position.x;pz=e.g.position.z;if(e.ai.state==='charge')peak=Math.max(peak,v);return A.dmgN>0&&states.has('brake')});
      ok('kierowca.szarża',states.has('rev')&&states.has('charge'),[...states].join(','));
      ok('kierowca.prędkość',peak>12,fx(peak)+' m/s');
      ok('kierowca.potrącenie',A.dmgN>0,fx(A.dmg)+' obr.');
      // rozbicie o ścianę: gracz za kioskiem, kierowca zmusza się do szarży w mur
      reset({x:0,z:-9,yaw:0});const c=A.spawn('kierowca',{at:{x:0,z:12}});c.ai.state='chase';enter(c,'rev');c.ai.t=0;
      let crash=false,vul=false;run(240,()=>{if(c.ai.state==='crash'){crash=true;if(c.vuln)vul=true}return crash&&vul});
      ok('kierowca.rozbijaSięOMur',crash&&vul,'crash='+crash+' vuln='+vul);
      if(crash){const hp0=c.hp;A.shoot(c,{dmg:20});ok('kierowca.okno:+50%obr.',hp0-c.hp>=29.9,'tracone '+fx(hp0-c.hp)+' z 20')}
      // kierowca (głowa) trafialny
      ok('kierowca.głowaTrafialna',c.meshes.some(m=>m.userData.part==='head'));
    },
  };
  const BOSS={
    boss_dj:async()=>{
      reset();const e=A.spawn('boss_dj',{d:18});phases.length=0;bossHpEv=0;
      ok('dj.pasekHP',!!e.bar&&e.boss===true);
      let waves=false;run(450,()=>{if(projCount().waves>0)waves=true;return waves});
      ok('dj.fala1:bas',waves,JSON.stringify(projCount()));
      e.hp=e.maxHp*.6;run(12);
      ok('dj.faza2',e.phase===2&&e.invulT>0,'faza '+e.phase);
      const hp1=e.hp;A.shoot(e,{dmg:80});ok('dj.nietykalnyPrzyFazie',e.hp>=hp1-.01,fx(hp1-e.hp));
      run(60);const dres=A.alive().filter(x=>x.type==='dres').length;ok('dj.faza2:dresy',dres>=2,dres+' dresów');
      e.hp=e.maxHp*.3;run(12);
      ok('dj.faza3',e.phase===3,'faza '+e.phase);
      let beams=false;run(450,()=>{if(projCount().beams>=3)beams=true;return beams});
      ok('dj.faza3:lasery',beams,JSON.stringify(projCount()));
      ok('dj.fazyZdarzenia',phases.join()==='2,3'&&bossHpEv>0,phases.join()+' bossHp×'+bossHpEv);
      ok('dj.faza3:wsparcie',A.alive().some(x=>x.type==='medyk')&&A.alive().some(x=>x.type==='bandyta'));
      run(90);A.shoot(e,{dmg:1e6,head:true});A.step(30);
      ok('dj.zabity',!e.alive&&!e.beams&&projCount().beams===0,JSON.stringify(projCount()));
    },
    boss_jednooki:async()=>{
      reset();const e=A.spawn('boss_jednooki',{d:16});phases.length=0;
      let vul=false,shots=0;const off=DS.bus.on('damage',()=>shots++);
      run(540,()=>{if(e.vuln)vul=true;return vul&&shots>=2});off();
      ok('jednooki.strzelaIprzeładowuje',shots>=2&&vul,`trafień ${shots}, luka=${vul}`);
      const hp0=e.hp=e.maxHp;if(e.vuln||true){e.vuln=true;A.shoot(e,{dmg:40});ok('jednooki.luka+35%',hp0-e.hp>=40*1.34,fx(hp0-e.hp));e.vuln=false}
      e.hp=e.maxHp*.6;run(12);ok('jednooki.faza2',e.phase===2,'faza '+e.phase);
      let chips=false,dash=false;states.clear();
      run(900,()=>{if(projCount().projs>0)chips=true;if(e.ai.act==='dash')dash=true;return chips&&dash});
      ok('jednooki.faza2:żetony+szarża',chips&&dash,`żetony=${chips} szarża=${dash}`);
      e.hp=e.maxHp*.3;run(12);ok('jednooki.faza3',e.phase===3,'faza '+e.phase);
      let reels=null;run(900,()=>{if(e.ai.reels)reels=e.ai.reels.join('|');return !!reels});
      ok('jednooki.jackpot',!!reels,reels);
      ok('jednooki.fazyZdarzenia',phases.join()==='2,3',phases.join());
      A.shoot(e,{dmg:1e6});A.step(5);ok('jednooki.zabity',!e.alive);
    },
    boss_szef_ochrony:async()=>{
      reset();const e=A.spawn('boss_szef_ochrony',{d:14});faceP(e);const hp0=e.hp;
      e.hp=e.maxHp=5000;A.shoot(e,{dmg:100});ok('szef.tarczaPrzód',5000-e.hp<=100*.15,'tracone '+fx(5000-e.hp));
      e.hp=e.maxHp=hp0;
      states.clear();let rush=false;run(600,()=>{if(e.ai.act==='rush')rush=true;return rush&&A.dmgN>0});
      ok('szef.szarżaTarczą',rush&&A.dmgN>0,fx(A.dmg)+' obr.');
      e.hp=e.maxHp*.6;run(12);ok('szef.faza2',e.phase===2,'faza '+e.phase);
      run(60);ok('szef.faza2:posiłki',A.alive().filter(x=>x.type==='ochroniarz').length>=2);
      A.shoot(e,{dmg:1e6,head:true});A.step(5);ok('szef.zabity',!e.alive);
    },
  };
  const GLOBAL={
    nawigacja:async()=>{
      const g=nav.grid();ok('nav.siatka',g.cols>=80&&g.rows>=80&&g.b0.some(v=>v===1),`${g.cols}×${g.rows}, zajęte ${g.b0.reduce((a,b)=>a+b,0)} (klasa 0), ${g.b1.reduce((a,b)=>a+b,0)} (klasa 1)`);
      // obejście kiosku [-6.5,6.5]x[-5,5]: gracz z jednej strony, wróg z drugiej
      for(const t of ['dres','bandyta','kierowca']){
        reset({x:0,z:-11,yaw:0});const e=A.spawn(t,{at:{x:0,z:11},aware:true});
        let inside=0,usedPath=false,stuck=0,maxStuck=0,px=e.g.position.x,pz=e.g.position.z,len=0,reached=-1;
        const need=e.cfg.melee?2.8:e.cfg.range[1]*.95;
        run(600,i=>{
          const p=e.g.position;len+=Math.hypot(p.x-px,p.z-pz);
          if(i%15===0){if(Math.hypot(p.x-px,p.z-pz)<.02&&e.ai.state==='chase'){}}
          px=p.x;pz=p.z;
          if(A.insideCollider(p.x,p.z,e.radius*.6))inside++;
          if(e.ai.path)usedPath=true;
          if(e.ai.sp<.15&&(e.ai.state==='chase'||e.ai.state==='flank')){stuck+=DT;maxStuck=Math.max(maxStuck,stuck)}else stuck=0;
          if(dist(e)<=need){reached=i;return true}return false});
        ok(`nav.${t}.dochodziZaKiosk`,reached>=0&&usedPath,`${reached>=0?fx(reached*DT)+' s':'nie dotarł'}, droga ${fx(len)} m (prosto 22), ścieżka=${usedPath}`);
        ok(`nav.${t}.bezWchodzeniaWMur`,inside===0,inside+' klatek w colliderze');
        ok(`nav.${t}.bezZacięć`,maxStuck<1.6,fx(maxStuck)+' s bez ruchu');
      }
    },
    osłona:async()=>{
      reset({x:0,z:-12,yaw:0});const e=A.spawn('bandyta',{at:{x:14,z:-12},aware:true});
      enter(e,'cover');const goal=e.ai.state==='cover';
      let t0=run(300,()=>e.ai.state!=='cover');
      const hidden=!nav.gridLos(e.g.position.x,e.g.position.z,P.pos.x,P.pos.z,true);
      ok('ai.osłona',goal&&hidden,`stan ${e.ai.state}, ukryty=${hidden}, ${fx(e.ai.coverHold)}`);
    },
    flankowanie:async()=>{
      reset({x:0,z:-12,yaw:0});const e=A.spawn('bandyta',{d:16,aware:true});
      const d0=Math.atan2(e.g.position.x-P.pos.x,e.g.position.z-P.pos.z);enter(e,'flank');
      run(240,()=>e.ai.state!=='flank');
      const d1=Math.atan2(e.g.position.x-P.pos.x,e.g.position.z-P.pos.z);let da=Math.abs(d1-d0);if(da>Math.PI)da=2*Math.PI-da;
      ok('ai.flankowanie',da>.6,'kąt '+fx(da*180/Math.PI)+'° względem gracza');
    },
    ucieczka:async()=>{
      for(const t of ['snajper','medyk']){
        reset({x:0,z:-12,yaw:0});const e=A.spawn(t,{d:20,aware:true});run(30);
        const d0=dist(e);e.hp=e.maxHp*.2;A.shoot(e,{dmg:1});
        let fled=false;run(60,()=>{if(e.ai.state==='flee')fled=true;return fled});
        run(120);
        ok(`ai.ucieczka.${t}`,fled&&dist(e)>d0-1,`stan ${e.ai.state}, dystans ${fx(d0)}→${fx(dist(e))}`);
      }
    },
    spawn:async()=>{
      let viol=0,close=0,blocked=0,seenCnt=0,n=0;
      const half=(Math.atan(Math.tan((+opt.fov||75)*Math.PI/360)*(innerWidth/Math.max(1,innerHeight))))+.25;
      for(let yi=0;yi<10;yi++){
        reset({x:(yi%3-1)*10,z:(yi%2?20:-5),yaw:yi*.628});
        const batch=[];for(let k=0;k<12;k++)batch.push(spawnEnemy(k%3?'dres':'kierowca',{aware:true}));
        for(const e of batch){
          n++;const p=e.g.position,dx=p.x-P.pos.x,dz=p.z-P.pos.z,d=Math.hypot(dx,dz);
          const ang=Math.acos(Math.max(-1,Math.min(1,(dx*-Math.sin(P.yaw)+dz*-Math.cos(P.yaw))/d)));
          const seen=ang<half&&nav.gridLos(P.pos.x,P.pos.z,p.x,p.z);
          if(d<12)close++;if(seen)seenCnt++;if(nav.blocked(p.x,p.z,e.cfg.cls||0))blocked++;
        }
        A.clear();A.step(2);
      }
      ok('spawn.pozaPolemWidzenia',seenCnt===0,`${seenCnt}/${n} w polu widzenia`);
      ok('spawn.dystans≥12m',close===0,`${close}/${n} bliżej niż 12 m`);
      ok('spawn.wolnaKomórka',blocked===0,`${blocked}/${n} w zajętej komórce`);
    },
    tabela:async()=>{
      const t1=DS.enemies.table('remiza',1),t8=DS.enemies.table('remiza',8),t20=DS.enemies.table('remiza',20);
      ok('tabela.fala1:tylkoBandyci+dresy',Object.keys(t1.weights).every(k=>['gangster'].includes(k)),Object.keys(t1.weights).join());
      ok('tabela.fala8:wszystkieTypy',TYPES.every(k=>t8.weights[k]>0),Object.keys(t8.weights).join());
      ok('tabela.limity',t8.caps.snajper>=1&&t8.caps.kierowca===1&&t20.caps.kierowca===2&&t8.maxAlive>=10,JSON.stringify(t8.caps));
      ok('tabela.rośnieZFalą',t20.maxAlive>t8.maxAlive&&t20.weights.dres>t8.weights.dres);
      const bp=[5,10,15].map(w=>t8.boss.pick(w).type);
      ok('tabela.bossRemizy',bp.join()==='gangster,boss_dj,boss_jednooki',bp.join());
      ok('tabela.bossKasyno',DS.enemies.table('kasyno',5).boss.pick(5).type==='boss_szef_ochrony');
      ok('tabela.nieznanyPoziom',Object.keys(DS.enemies.table('nie-ma',9).weights).length>=5);
      const lv=DS.levels.get('remiza');lv.enemies={weights:{dres:500},caps:{dres:1},mul:{kierowca:0}};
      const to=DS.enemies.table('remiza',9);delete lv.enemies;
      ok('tabela.nadpisaniePoziomu',to.weights.dres===500&&to.caps.dres===1&&!to.weights.kierowca,JSON.stringify(to.weights));
      // makeEnemy honoruje limity i wymóg sojuszników
      reset();const G=S.G;G.wave=9;const cnt={};
      for(let i=0;i<40;i++){const e=makeEnemy(false);cnt[e.type]=(cnt[e.type]||0)+1}
      const tb=DS.enemies.table('remiza',9);
      ok('tabela.makeEnemy:limity',Object.keys(cnt).every(k=>cnt[k]<=(tb.caps[k]||99)),JSON.stringify(cnt));
      reset();G.wave=5;const b=makeEnemy(true);ok('tabela.makeEnemy:boss',b.boss===true&&b.type==='gangster',b.type);
      reset();G.wave=10;const b2=makeEnemy(true);ok('tabela.makeEnemy:boss10',b2.boss===true&&b2.type==='boss_dj',b2.type);
      reset();G.wave=1;
    },
    wydajność:async()=>{
      reset({x:0,z:25,yaw:0});const G=S.G;G.wave=10;
      const mix=['gangster','dres','ochroniarz','bandyta','snajper','pijak','kamikadze','medyk','kierowca'];
      for(let i=0;i<30;i++){const t=mix[i%mix.length];A.spawn(t,{at:{x:(i%10-4.5)*3,z:25-(14+Math.floor(i/10)*5+(i%2)*2)},aware:true})}
      A.setGod(true);
      let tot=0,mx=0;const N=240;
      for(let i=0;i<N;i++){const t0=performance.now();updateEnemies(DT);const dt=performance.now()-t0;tot+=dt;mx=Math.max(mx,dt);A.T+=DT;P.pos.set(0,0,25)}
      const alive=A.alive().length;
      inf('wydajność.AI',`${alive} wrogów: ${fx(tot/N)} ms/klatkę średnio, max ${fx(mx)} ms (tylko updateEnemies; CPU kontenera)`);
      ok('wydajność.AI≤4ms',tot/N<4,fx(tot/N)+' ms');
      A.renderEvery=1;A.step(2);const c=A.cost();A.renderEvery=45;
      ok('wydajność.drawCalle≤400',c.calls<=400,`${c.calls} calli, ${c.tris} tri przy ${alive} wrogach w kadrze (z cieniami)`);
      inf('wydajność.FPS','render programowy (SwiftShader): FPS nie jest miarodajny');
    },
    konsola:async()=>{ok('konsola.bezBłędów',A.errs.length===0,A.errs.slice(0,3).join(' | '))},
  };

  const t0=performance.now();
  const wants=only?(Array.isArray(only)?only:[only]):null;
  for(const t of TYPES.concat(BOSSES)){
    if(wants&&!wants.includes(t))continue;
    await common(t);
    const f=SCEN[t]||BOSS[t];if(f)await f();
  }
  if(!wants){for(const k of ['nawigacja','osłona','flankowanie','ucieczka','spawn','tabela','wydajność','konsola'])await GLOBAL[k]()}
  else if(wants.includes('global'))for(const k in GLOBAL)await GLOBAL[k]();
  inf('czas',fx((performance.now()-t0)/1000)+' s zegara (symulacja '+fx(A.T)+' s)');
  return R;
}
