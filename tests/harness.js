// Wspólny harness QA (faza 1). Wczytanie: (0,eval)(await (await fetch('/tests/harness.js')).text())  -> window.QA
// Symuluje klatki gry ręcznie (frame): updateGame + animateWorld + render (render jest potrzebny, bo raycast używa matrixWorld).
// Ekran level-up pauzuje grę: frame() domyślnie go zamyka przez DS.progression.ui.forceClose() (qa.keepLevelup=true wyłącza).
(async()=>{
const imp=p=>import('/js/'+p);
const [loop,wld,rend,st,sv,pl,fire,cmb,wst,flow,mat,cf,vm,run]=await Promise.all(['game/loop.js','world/world.js','render/renderer.js','core/state.js','core/save.js','player/player.js','weapons/fire.js','game/combat.js','world/state.js','game/flow.js','render/materials.js','render/comicfx.js','weapons/viewmodel.js','game/run.js'].map(imp));
const {S}=st,P=pl.P,info=rend.renderer.info;
const QA={S,P,loop,wld,rend,sv,fire,cmb,wst,flow,mat,cf,vm,run,T:0,keepLevelup:false,errs:[],lvSkipped:0};
if(!window.__qaErrHook){window.__qaErrHook=1;const oe=console.error,ow=console.warn;
  console.error=(...a)=>{QA.errs.push('E:'+a.join(' '));oe.apply(console,a)};console.warn=(...a)=>{QA.errs.push('W:'+a.join(' '));ow.apply(console,a)};
  addEventListener('error',e=>QA.errs.push('ERR:'+e.message+' @'+(e.filename||'')+':'+e.lineno));addEventListener('unhandledrejection',e=>QA.errs.push('REJ:'+(e.reason&&e.reason.stack||e.reason)))}
QA.errs=window.__qaErrs=window.__qaErrs||QA.errs;
QA.sleep=ms=>new Promise(r=>setTimeout(r,ms));
QA.skipLv=()=>{const u=DS.progression&&DS.progression.ui;if(!QA.keepLevelup&&u&&u.isOpen()){u.forceClose();QA.lvSkipped++}};
QA.frame=(dt=1/60)=>{const G=S.G;QA.T+=dt;wld.animateWorld(QA.T,dt);QA.skipLv();if(S.mode==='game'&&G&&!G.paused){loop.updateGame(dt);QA.skipLv()}
  rend.renderer.render(rend.scene,rend.camera);if(S.mode==='game'&&G&&G.panelReq)cf.capturePanels();cf.drawFx(S.mode==='game'&&G&&!G.paused?dt:0)};
QA.frames=n=>{for(let i=0;i<n;i++)QA.frame()};
const v=new THREE.Vector3();
QA.aim=()=>{const e=S.G.enemies.find(x=>x.alive);if(!e)return null;const h=e.meshes.find(m=>m.userData.part==='head')||e.meshes[0];h.getWorldPosition(v);
  const dx=v.x-P.pos.x,dz=v.z-P.pos.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(v.y-1.62,Math.hypot(dx,dz));return e};
QA.stats=()=>({calls:info.render.calls,tris:info.render.triangles,geo:info.memory.geometries,tex:info.memory.textures,scene:rend.scene.children.length,outlines:mat.outlines.length});
/** Prawdziwy koszt klatki (z cieniami), zgodnie z ARCHITECTURE.md. */
QA.cost=()=>{const r=rend.renderer;const ar=r.info.autoReset;r.info.autoReset=false;r.info.reset();r.render(rend.scene,rend.camera);const c={calls:r.info.render.calls,tris:r.info.render.triangles};r.info.autoReset=ar;return c};
QA.start=async()=>{if(S.mode==='warn'){document.getElementById('warnFull').click();await QA.sleep(120)}
  if(S.mode==='game'){try{flow.quitToMenu()}catch(e){}}
  document.getElementById('mPlay').click();await QA.sleep(150);return S.G};
QA.play=(frames,{until,fireAt=true,god=true}={})=>{for(let i=0;i<frames;i++){const G=S.G;if(!G||G.dead)break;if(god)G.hp=G.maxHp;if(fireAt){const e=QA.aim();if(e&&G.fireT<=0&&G.reloadT<=0)fire.fire()}
  QA.frame();if(until&&until(G))return i}return frames};
QA.key=(c,t='keydown')=>dispatchEvent(new KeyboardEvent(t,{code:c,key:c,bubbles:true,cancelable:true}));
QA.tap=c=>{QA.key(c);QA.key(c,'keyup')};
QA.vis=()=>[...document.querySelectorAll('.screen')].filter(s=>!s.hidden).map(s=>s.id).join(',');
window.QA=QA;return 'QA ready'})()
