// Dane broni (właściciel: ds-weapon-data). Kolejność importu = kolejność rejestracji = slotów (po legacy.js).
// Każdy plik: DS.weapons.register({...}) z tym samym zestawem pól co legacy.js, plus:
//   slot, adsFov, adsTime, moveMult, moveMultAds, recoil:{pitch,yaw,recovery} (dla ds-gunfeel; silnik ich jeszcze nie czyta),
//   real:{...} (dane realne: cal, mag, rpm, v0, bulletG, weight, length, barrel, range, fire, action, src[URL], unv[null-owe]).
// Pełne formuły i tabela: js/weapons/data/BALANCE.md. Skrót:
//   E = ½·m·v0²; dmgE = min(40, round(1.5·√E)); rate = 60/rpm (półautomat bez rpm 0,30; pompka 0,80; repetier 1,20);
//   nmin = max(2, ceil(0,25/rate)); dmg = min(dmgE, floor(61/(nmin-1)))  -> TTK w [0,25 s; 6 s] dla HP 62-132.
//   Śrutówki: 13 × 9 śrutów (kalibracja legacy).
//   Uzi (uzi.js) zastąpiło legacy 'smg' (decyzja ds-architect: alias w zapisach); klawisze 1-6 = sloty (pole slot), patrz weapons/slots.js.
// Stuby model() ustawiają tylko muzzle; pełne modele dopina ds-weapon-modeler (buildGun ma zabezpieczenie na brak model()).

import './glock17.js';
import './p83wanad.js';
import './deagle50.js';
import './python357.js';
import './uzi.js';
import './mp5a3.js';
import './pm63rak.js';
import './mossberg500.js';
import './saiga12.js';
import './akm.js';
import './m4a1.js';
import './beryl96.js';
import './svd.js';
import './mosin9130.js';
import './pkm.js';
