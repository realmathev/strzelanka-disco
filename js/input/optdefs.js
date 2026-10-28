// Domyślne wartości NOWYCH opcji (ds-input-menus). DEF_OPT w core/save.js należy do architekta,
// więc dopisujemy brakujące pola tutaj: stare zapisy `discoStrzelnica.opt.v1` zachowują wszystkie
// dotychczasowe ustawienia, a nowe pola dostają wartości domyślne.
import {opt} from '../core/save.js';

export const OPT_DEFAULTS={
  // Sterowanie
  adsMode:'hold',        // 'hold' | 'toggle': celowanie (PPM) przytrzymaj / przełącz
  sprintMode:'hold',     // 'hold' | 'toggle'
  crouchMode:'hold',     // 'hold' | 'toggle'
  adsSens:1,             // mnożnik czułości w trakcie ADS (0.2..1.5), względem `sens`
  keys:null,             // zapisane przypisania klawiszy {akcja:[kody]} (null = domyślne)
  // Dźwięk
  hitVol:.8,             // głośność dźwięków trafień (0..1), czyta audio/sfx
  // Celownik
  xhStyle:'cross',       // 'cross' | 'gap' | 'dot' | 'circle' | 'brackets' | 'none'
  xhColor:'#fff8e6',
  xhSize:22,             // px
  xhDot:0,               // kropka środkowa (dodatkowa)
  xhHit:1,               // znacznik trafienia
  // Dostępność
  uiScale:1,             // rozmiar napisów/HUD (0.85..1.5)
  contrast:0,            // 1 = wysoki kontrast interfejsu
  motion:'auto',         // 'auto' (system) | 'reduce' (ogranicz animacje interfejsu)
  // Gra
  difficulty:'normal',   // 'easy' | 'normal' | 'hard'
  dmgInd:1,              // czerwona poświata przy obrażeniach i niskim HP
  hitStop:1,             // hit-stop przy zabiciu (ds-gunfeel czyta opt.hitStop; 0 = wylaczony)
  dmgNum:1,              // liczby obrażeń nad wrogami
  level:'remiza',        // wybrany poziom
};

export function ensureOptDefaults(){for(const k in OPT_DEFAULTS)if(!(k in opt))opt[k]=OPT_DEFAULTS[k]}
ensureOptDefaults();
