// MP5A3 (9×19). Formuły i tabela: data/BALANCE.md. Prędkość 400 m/s to wartość dla rodziny MP5. rate 60/800=0,075 -> nmin 4 -> dmg 20.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'mp5a3', name:'MP5A3', short:'MP5', key:'10', price:600,
  dmg:20, rate:.075, mag:30, reload:1.6, spread:.03, pellets:1, auto:true,
  snd:'RATATA!', sfx:'smg', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:2, adsFov:.8, adsTime:.25, moveMult:.82, moveMultAds:.49, recoil:{pitch:.0057, yaw:.0014, recovery:25},
  real:{cal:'9×19 mm Parabellum', mag:30, rpm:800, v0:400, bulletG:8.0, weight:2.54, length:680, barrel:null, range:200,
    fire:'automatyczny (przełącznik trybów w grupie spustowej SEF/Navy; tryby dla A3 niepotwierdzone)', action:'roller-delayed blowback, zamek zamknięty',
    src:['https://en.wikipedia.org/wiki/Heckler_%26_Koch_MP5'],
    unv:['bulletG','fire']},
  model({muzzle}){muzzle.set(0,.02,-.25)}, // stub, ds-weapon-modeler
});
