// Formatowanie liczb i dat zgodne z językiem gry (EN: en-US, PL: pl-PL).
import {lang} from './i18n.js';

export const LOCALE=lang==='en'?'en-US':'pl-PL';
/** Liczba z separatorem tysięcy w bieżącym języku. */
export const fmtNum=n=>Number(n||0).toLocaleString(LOCALE);
/** Data w bieżącym języku. */
export const fmtDate=t=>new Date(t).toLocaleDateString(LOCALE);
