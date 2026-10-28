// Uzi (9×19). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,008·400² = 640 J -> 38; rate 60/600=0,1 -> nmin 3 -> dmg 30.
// Zastępuje legacy 'smg' (Uzi 'Weselne', usunięte z legacy.js): stare zapisy z 'smg' migrują do 'uzi' (core/save.js, weapons/slots.js).
// Slot 2 (pistolety maszynowe) = klawisz 2.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'uzi', name:'Uzi', short:'Uzi', key:'9', price:450,
  dmg:30, rate:.1, mag:32, reload:1.6, spread:.03, pellets:1, auto:true,
  snd:'RATATA!', sfx:'smg', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:2, adsFov:.8, adsTime:.31, moveMult:.76, moveMultAds:.46, recoil:{pitch:.0048, yaw:.0012, recovery:25},
  real:{cal:'9×19 mm Parabellum', mag:32, rpm:600, v0:400, bulletG:8.0, weight:3.5, length:445, barrel:null, range:200,
    fire:'automatyczny', action:'blowback, otwarty zamek',
    src:['https://en.wikipedia.org/wiki/Uzi'],
    unv:['bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.25)}, // stub, ds-weapon-modeler
});
