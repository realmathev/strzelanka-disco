// Kolejność: legacy (4 stare bronie) -> data (nowe dane) -> models (modele do danych).
import './legacy.js';
import './data/index.js';
import './models/index.js';
// Klawisz broni = klawisz jej slotu (1-6); pole key z plików danych jest tylko historyczne.
import {DS} from '../core/ds.js';
import {slotOf} from './slots.js';
for(const W of DS.weapons.all())W.key=String(slotOf(W.id));
export * from './slots.js';
export * from './viewmodel.js';
export * from './fire.js';
