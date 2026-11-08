// Czytelne nazwy kodów wejścia (KeyboardEvent.code, MouseN, WheelUp/Down) po polsku lub angielsku.
import {L} from '../core/i18n.js';
const NAMES={
  Space:L('Spacja','Space'),Enter:'Enter',Tab:'Tab',Backspace:'Backspace',Delete:'Delete',Insert:'Insert',Home:'Home',End:'End',PageUp:'Page Up',PageDown:'Page Down',
  ShiftLeft:L('Lewy Shift','Left Shift'),ShiftRight:L('Prawy Shift','Right Shift'),ControlLeft:L('Lewy Ctrl','Left Ctrl'),ControlRight:L('Prawy Ctrl','Right Ctrl'),AltLeft:L('Lewy Alt','Left Alt'),AltRight:L('Prawy Alt','Right Alt'),CapsLock:'Caps Lock',
  ArrowUp:L('Strzałka ↑','Arrow ↑'),ArrowDown:L('Strzałka ↓','Arrow ↓'),ArrowLeft:L('Strzałka ←','Arrow ←'),ArrowRight:L('Strzałka →','Arrow →'),
  Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',IntlBackslash:'\\',
  Escape:'Esc',
  NumpadAdd:'Num +',NumpadSubtract:'Num -',NumpadMultiply:'Num *',NumpadDivide:'Num /',NumpadDecimal:'Num .',NumpadEnter:'Num Enter',
  Mouse0:L('LPM','LMB'),Mouse1:L('Środkowy przycisk myszy','Middle mouse button'),Mouse2:L('PPM','RMB'),Mouse3:L('Przycisk myszy 4','Mouse button 4'),Mouse4:L('Przycisk myszy 5','Mouse button 5'),
  WheelUp:L('Kółko w górę','Wheel up'),WheelDown:L('Kółko w dół','Wheel down'),
};
/** Nazwa kodu do wyświetlenia. Pusty kod -> „—”. */
export function codeLabel(code){
  if(!code)return '—';
  if(NAMES[code])return NAMES[code];
  let m;
  if((m=/^Key([A-Z])$/.exec(code)))return m[1];
  if((m=/^Digit(\d)$/.exec(code)))return m[1];
  if((m=/^Numpad(\d)$/.exec(code)))return 'Num '+m[1];
  if((m=/^F(\d{1,2})$/.exec(code)))return code;
  if((m=/^Mouse(\d+)$/.exec(code)))return L('Przycisk myszy ','Mouse button ')+(+m[1]+1);
  return code;
}
