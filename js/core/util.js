// Drobne narzędzia współdzielone przez wszystkie moduły.
export const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
export const clamp=(v,a,b)=>v<a?a:v>b?b:v, rand=(a=0,b=1)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
export const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
