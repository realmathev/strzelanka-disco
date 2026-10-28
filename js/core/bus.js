// Szyna zdarzeń. Listy słuchaczy są kopiowane przy on/off (copy-on-write),
// więc emit nie alokuje i można się wypisać w trakcie obsługi zdarzenia.
const lists=new Map();
export const bus={
  on(ev,fn){lists.set(ev,[...(lists.get(ev)||[]),fn]);return ()=>bus.off(ev,fn)},
  off(ev,fn){const l=lists.get(ev);if(l)lists.set(ev,l.filter(f=>f!==fn))},
  once(ev,fn){const off=bus.on(ev,(a,b,c)=>{off();fn(a,b,c)});return off},
  emit(ev,a,b,c){const l=lists.get(ev);if(!l)return;for(let i=0;i<l.length;i++)l[i](a,b,c)},
};
