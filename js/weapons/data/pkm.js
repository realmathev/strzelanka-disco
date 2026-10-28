// PKM (7,62×54R, LKM na taśmie). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,0096·825² ≈ 3267 J -> 40 -> sufit 40; rate 60/600=0,1 -> nmin 3 -> dmg 30.
// Dane z artykułu o PK (PKM ma te same parametry podstawowe); zasięg 1000 m = skuteczny z artykułu.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'pkm', name:'PKM', short:'PKM', key:'19', price:2200,
  dmg:30, rate:.1, mag:100, reload:4, spread:.02, pellets:1, auto:true,
  snd:'DRRRRT!', sfx:'rifle', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:6, adsFov:.8, adsSpread:.6, adsTime:.64, moveMult:.60, moveMultAds:.36, recoil:{pitch:.0075, yaw:.0019, recovery:25},
  real:{cal:'7.62×54 mm R', mag:100, rpm:600, v0:825, bulletG:9.6, weight:9, length:1203, barrel:605, range:1000,
    fire:'automatyczny (LKM)', action:'gas-operated, long-stroke piston, open rotating bolt', feed:'taśma 100/200/250 (mag=100)',
    src:['https://en.wikipedia.org/wiki/PK_machine_gun'],
    unv:['bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.4)}, // stub, ds-weapon-modeler
});
