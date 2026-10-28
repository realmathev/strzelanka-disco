// Zastosowanie opcji interfejsu: rozmiar napisów, kontrast, ograniczenie animacji, celownik.
import {$$} from '../core/util.js';
import {opt} from '../core/save.js';
import '../input/optdefs.js';
import {applyCrosshair} from './crosshair.js';

const mq=matchMedia('(prefers-reduced-motion: reduce)');
/** Czy animacje interfejsu mają być ograniczone (opcja gracza albo ustawienie systemu). */
export const motionReduced=()=>opt.motion==='reduce'||mq.matches;

export function applyUiOpts(){
  const r=document.documentElement;
  r.style.setProperty('--ts',String(opt.uiScale));
  r.dataset.contrast=opt.contrast?'high':'normal';
  r.dataset.motion=motionReduced()?'reduced':'full';
  $$('.xh').forEach(applyCrosshair);
}
mq.addEventListener&&mq.addEventListener('change',applyUiOpts);
applyUiOpts();
