// Protokół co-op: rodzaje wiadomości (pole `k`), walidacja danych z sieci, kwantyzacja.
// Wszystko z relaya to DANE: sprawdzamy typy, zakresy i długości; wiadomość niepoprawna = ignorowana (nigdy wyjątek).
// Opis protokołu: ARCHITECTURE.md, sekcja „Sieć / co-op”.

export const MAX_BYTES=16384;        // limit relaya JuicyJuicy
export const RATE_MAX=70;            // wiadomości/s od jednego gracza (relay pozwala 60; nadmiar ignorujemy)
export const SNAP_HZ=15,IN_HZ=20;
export const MAX_ENEMIES=64,MAX_EV=64,MAX_HITS=16,MAX_ENDS=3;

/** Stany AI w snapshotach (indeks); nieznany = 0. */
export const STATES=['other','patrol','alert','chase','attack','flank','cover','flee'];

export const q2=v=>Math.round(v*100)/100;          // 1 cm / 0,01 rad
export const isNum=(v,a,b)=>typeof v==='number'&&v===v&&v>=a&&v<=b;   // v===v: odrzuca NaN; Infinity odpada na zakresie
export const isInt=(v,a,b)=>isNum(v,a,b)&&Math.floor(v)===v;
export const isStr=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
const isArr=(v,max)=>Array.isArray(v)&&v.length<=max;
const W=1000;                                        // granica współrzędnych świata [m]
export const isVec=v=>isArr(v,3)&&v.length===3&&isNum(v[0],-W,W)&&isNum(v[1],-50,200)&&isNum(v[2],-W,W);
const ID_RE=/^[\w\-:.@]{1,64}$/;   // id gracza nadaje relay (lokalnie "p1"); nigdy nie trafia do HTML
export const isId=v=>typeof v==='string'&&ID_RE.test(v);
export const isLvl=v=>typeof v==='string'&&/^[a-z0-9_-]{1,32}$/.test(v);
export const DIFF=['easy','normal','hard'];

/** Przybliżony rozmiar wiadomości (bajty JSON). */
export function sizeOf(d){try{return JSON.stringify(d).length}catch(e){return Infinity}}

/** Walidatory per rodzaj (true = przyjmij). Sprawdzają kształt; semantykę (istniejące eid, kto jest hostem) sprawdza odbiorca. */
export const V={
  lob:d=>isLvl(d.lv)&&DIFF.includes(d.df)&&d.rd&&typeof d.rd==='object'&&d.c&&typeof d.c==='object'&&Object.keys(d.c).length<=10&&Object.keys(d.rd).length<=10,
  rdy:d=>d.r===0||d.r===1,
  start:d=>isLvl(d.lv)&&DIFF.includes(d.df)&&isInt(d.seed,0,2147483647),
  in:d=>isNum(d.t,0,1e12)&&isVec(d.p)&&isNum(d.y,-1e4,1e4)&&isNum(d.pi,-2,2)&&(d.w===undefined||isStr(d.w,32))&&(d.dn===0||d.dn===1)&&
    isInt(d.hp,0,10000)&&isInt(d.mhp,1,10000)&&isInt(d.kl,0,1e6)&&isInt(d.hd,0,1e6)&&isInt(d.zd,0,1e9)&&(d.a===undefined||d.a===0||d.a===1),
  shot:d=>(d.m===undefined||isVec(d.m))&&(d.e===undefined||(isArr(d.e,MAX_ENDS)&&d.e.every(isVec)))&&(d.w===undefined||isStr(d.w,32))&&
    (d.h===undefined||(isArr(d.h,MAX_HITS)&&d.h.every(h=>isArr(h,3)&&h.length===3&&isInt(h[0],1,1e9)&&isNum(h[1],0,5000)&&(h[2]===0||h[2]===1)))),
  snap:d=>isNum(d.t,0,1e12)&&isInt(d.w,0,10000)&&isInt(d.q,0,10000)&&isArr(d.e,MAX_ENEMIES)&&(d.ev===undefined||isArr(d.ev,MAX_EV))&&(d.hu===undefined||isArr(d.hu,10)),
  rev:d=>true,
  end:d=>(d.r==='down'||d.r==='quit')&&isArr(d.s,10)&&isInt(d.w,0,10000),
  out:d=>true,
};

/** Jeden wpis wroga w snapshocie: [eid, typ(indeks w DS.enemies.ids()), wariant, x, z, ry, hp%, stan, anim]. */
export function validEnemy(a){
  return Array.isArray(a)&&a.length===9&&isInt(a[0],1,1e9)&&isInt(a[1],0,999)&&isInt(a[2],-1,1e6)&&isNum(a[3],-W,W)&&isNum(a[4],-W,W)&&
    isNum(a[5],-100,100)&&isInt(a[6],0,100)&&isInt(a[7],0,STATES.length-1)&&isInt(a[8],0,999);
}
/** anim = przykucnięcie(0..9) + 10·pochylenie(0..8) + 100·ręka(0..8): kompaktowa poza do animacji repliki. */
export function packAnim(crouch,lean,arm){
  const c=Math.round(Math.max(0,Math.min(1,crouch||0))*9),l=Math.round((Math.max(-1,Math.min(1,lean||0))+1)*4),r=Math.round((Math.max(-1,Math.min(1,arm||0))+1)*4);
  return c+10*l+100*r;
}
export function unpackAnim(n,out){out.crouch=(n%10)/9;out.lean=(Math.floor(n/10)%10)/4-1;out.arm=(Math.floor(n/100)%10)/4-1;return out}

/** Zdarzenia w polu `ev` snapshotu: {t:'wave'|'clear'|'kill', ...}. */
export function validEv(v){
  if(!v||typeof v!=='object')return false;
  switch(v.t){
    case 'wave':return isInt(v.w,1,10000)&&isInt(v.c,0,10000);
    case 'clear':return isInt(v.w,1,10000);
    case 'kill':return isInt(v.id,1,1e9)&&isId(v.by)&&(v.hd===0||v.hd===1)&&isArr(v.a,10)&&v.a.every(isId);
    default:return false;
  }
}
