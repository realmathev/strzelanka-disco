// Czytelne nazwy kodów wejścia (KeyboardEvent.code, MouseN, WheelUp/Down) po polsku.
const NAMES={
  Space:'Spacja',Enter:'Enter',Tab:'Tab',Backspace:'Backspace',Delete:'Delete',Insert:'Insert',Home:'Home',End:'End',PageUp:'Page Up',PageDown:'Page Down',
  ShiftLeft:'Lewy Shift',ShiftRight:'Prawy Shift',ControlLeft:'Lewy Ctrl',ControlRight:'Prawy Ctrl',AltLeft:'Lewy Alt',AltRight:'Prawy Alt',CapsLock:'Caps Lock',
  ArrowUp:'Strzałka ↑',ArrowDown:'Strzałka ↓',ArrowLeft:'Strzałka ←',ArrowRight:'Strzałka →',
  Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',IntlBackslash:'\\',
  Escape:'Esc',
  NumpadAdd:'Num +',NumpadSubtract:'Num -',NumpadMultiply:'Num *',NumpadDivide:'Num /',NumpadDecimal:'Num .',NumpadEnter:'Num Enter',
  Mouse0:'LPM',Mouse1:'Środkowy przycisk myszy',Mouse2:'PPM',Mouse3:'Przycisk myszy 4',Mouse4:'Przycisk myszy 5',
  WheelUp:'Kółko w górę',WheelDown:'Kółko w dół',
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
  if((m=/^Mouse(\d+)$/.exec(code)))return 'Przycisk myszy '+(+m[1]+1);
  return code;
}
