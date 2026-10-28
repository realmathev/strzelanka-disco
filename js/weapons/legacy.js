// Trzy bronie z pierwotnej gry (dane i modele 1:1): pistolet, obrzyn, karabin. Czwarta, Uzi „Weselne” (id 'smg'),
// została zastąpiona przez 'uzi' z weapons/data; stare zapisy z 'smg' migrują do 'uzi' (core/save.js, WEAPON_ALIAS w weapons/slots.js).
// Klawisze 1-6 wybierają SLOT (pole `slot`), patrz weapons/slots.js.
// Nowe bronie: weapons/data (dane), weapons/models (modele). Ta sama id nadpisuje definicję.
import {DS} from '../core/ds.js';

// Pola wspólne każdej broni — patrz ARCHITECTURE.md („Broń”).
// kick: kopnięcie viewmodelu (G.recoil), pitchKick: trwały podrzut celownika [rad], shake: wstrząs kamery, burst: chmurka napisu.
const L=[
  {id:'pistol',name:'Pistolet „Remiza”',short:'Pistolet',dmg:34,rate:.3,mag:12,reload:1.1,spread:.006,pellets:1,auto:false,snd:'BANG!',price:0,key:'1',slot:1,
    kick:.45,pitchKick:.012,shake:.08,burst:false,
    model({B,mat1,mat2,muzzle}){B(.07,.08,.3,0,.02,-.1,mat1);B(.065,.05,.26,0,-.03,-.09,mat2);B(.06,.17,.08,0,-.11,.02,mat2,.25);B(.015,.03,.02,0,.075,-.23,mat2);muzzle.set(0,.02,-.27)}},
  {id:'shotgun',name:'Obrzyn „Sołtys”',short:'Obrzyn',dmg:13,rate:.8,mag:6,reload:2,spread:.09,pellets:9,auto:false,snd:'BUUUM!',price:750,key:'3',slot:3,
    kick:1,pitchKick:.035,shake:.35,burst:true,
    model({B,mat1,mat2,muzzle}){B(.065,.065,.62,0,.02,-.32,mat1);B(.085,.06,.22,0,-.045,-.3,mat2);B(.085,.11,.22,0,0,0,mat1);B(.065,.13,.32,0,-.05,.24,mat2,-.15);muzzle.set(0,.02,-.64)}},
  {id:'rifle',name:'Karabin „Dyskoteka”',short:'Karabin',dmg:29,rate:.11,mag:30,reload:1.8,spread:.012,pellets:1,auto:true,snd:'TRRRT!',price:1300,key:'4',slot:4,
    kick:.45,pitchKick:.012,shake:.08,burst:false,
    model({B,mat1,mat2,muzzle}){B(.08,.12,.44,0,0,-.1,mat1);B(.035,.035,.32,0,.02,-.47,mat2);B(.06,.23,.08,0,-.16,-.14,mat2,-.3);B(.06,.12,.3,0,-.03,.25,mat2);B(.02,.06,.02,0,.08,-.28,mat1);muzzle.set(0,.02,-.64)}},
];
L.forEach(w=>{w.sfx=w.id;DS.weapons.register(w)});
