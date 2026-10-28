// Zapis ze starego formatu (faza 0, z 'smg' w ekwipunku i nieznanym id broni) musi się wczytać, a 'smg' = 'uzi'.
// Dwa kroki (localStorage trzeba ustawić PRZED załadowaniem gry):
//  1) na dowolnej stronie z tego samego origin wykonaj:  (0,eval)(await (await fetch('/tests/oldsave.js')).text()).then(r=>r)   -> 'SETUP DONE, reload'
//     (gdy localStorage ma już stary zapis oznaczony przez ten skrypt, krok 1 jest pomijany i skrypt przechodzi od razu do asercji)
//  2) przeładuj stronę (navigate) i wykonaj ten sam skrypt jeszcze raz: zwraca {nazwa: PASS|FAIL}.
// Uwaga: skrypt NADPISUJE zapis w localStorage (zapis testowy). Wyczyść go na końcu: localStorage.clear().
(async()=>{
const K='discoStrzelnica.save.v1',O='discoStrzelnica.opt.v1',MARK='__qa_oldsave_marker';
if(!sessionStorage.getItem(MARK)){
  localStorage.setItem(K,JSON.stringify({coins:777,keys:2,weapons:['pistol','smg','shotgun','rifle','zzz_unknown'],skin:'fabryczny',skins:['fabryczny'],medkits:3,hpLvl:1,dmgLvl:2,secondChance:0,best:5,kills:42}));
  localStorage.setItem(O,JSON.stringify({preset:'high',scale:1,fov:80,draw:120,shadows:1,outlines:1,halftone:1,panels:1,onoma:1,fx:1,music:.6,sfx:.8,track:'A',sens:1,invert:0}));
  sessionStorage.setItem(MARK,'1');return 'SETUP DONE, reload'}
await (0,eval)(await (await fetch('/tests/harness.js')).text());
const Q=window.QA,S=Q.S,R={},ok=(n,c,d)=>R[n]=c?'PASS':'FAIL'+(d?' ('+d+')':'');const sv=Q.sv;
ok('oldsave.coinsKept',sv.save.coins===777&&sv.save.kills===42&&sv.save.medkits===3,JSON.stringify([sv.save.coins,sv.save.kills,sv.save.medkits]));
ok('oldsave.smgMigratedToUzi',sv.save.weapons.includes('uzi')&&!sv.save.weapons.includes('smg')&&new Set(sv.save.weapons).size===sv.save.weapons.length,JSON.stringify(sv.save.weapons));
ok('oldsave.unknownIdKept',sv.save.weapons.includes('zzz_unknown'));
ok('oldsave.newOptsDefaulted',sv.opt.difficulty==='normal'&&sv.opt.hitVol===.8&&sv.opt.dmgNum===1&&sv.opt.adsSens===1&&!!sv.opt.level,JSON.stringify({d:sv.opt.difficulty,h:sv.opt.hitVol,n:sv.opt.dmgNum,a:sv.opt.adsSens,l:sv.opt.level}));
document.getElementById('warnFull').click();await Q.sleep(150);
for(const id of ['scrShop','scrInv','scrCrates','scrCasino']){document.querySelector('#scrMenu [data-go='+id+']').click();await Q.sleep(100);document.querySelector('#'+id+' [data-go=scrMenu]').click();await Q.sleep(40)}
ok('oldsave.inventoryListsUzi',(()=>{document.querySelector('#scrMenu [data-go=scrInv]').click();const t=document.getElementById('scrInv').innerText;document.querySelector('#scrInv [data-go=scrMenu]').click();return /Uzi/.test(t)&&/klawisz 2/.test(t)})());
await Q.start();const G=S.G;Q.frames(30);
const w=[];for(const k of ['Digit2','Digit3','Digit4','Digit5','Digit6','Digit1']){Q.tap(k);Q.frames(2);w.push(G.weapon)}
ok('oldsave.slotKeysInGame',w.join()==='uzi,shotgun,rifle,rifle,rifle,pistol',w.join());
G.weapon!=null&&Q.fire.switchWeapon('smg');Q.frame();ok('oldsave.switchWeaponSmgAlias',G.weapon==='uzi',G.weapon);
Q.fire.switchWeapon('zzz_unknown');Q.frames(3);ok('oldsave.unknownWeaponNoCrash',Q.errs.length===0&&!!DS.weapons.get(G.weapon),G.weapon+' '+Q.errs.slice(0,2).join('|'));
Q.play(60*5,{});ok('console.noErrorsOrWarnings',Q.errs.length===0,Q.errs.slice(0,3).join(' | '));
sessionStorage.removeItem(MARK);
return R})()
