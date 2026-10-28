// Sprężyny tłumione, krzywe ease i sumowane krzywe kopniaka (bez alokacji w pętli).

export const clamp01=t=>t<0?0:t>1?1:t;
export const lerp=(a,b,t)=>a+(b-a)*t;
/** smootherstep: ease w obie strony, ciągła pochodna (brak szarpnięcia przy zmianie kierunku ADS). */
export const smoother=t=>{t=clamp01(t);return t*t*t*(t*(t*6-15)+10)};
export const smooth=t=>{t=clamp01(t);return t*t*(3-2*t)};
export const easeOut=t=>{t=clamp01(t);const u=1-t;return 1-u*u*u};
export const easeIn=t=>{t=clamp01(t);return t*t*t};
/** Ease-out z przeregulowaniem (np. broń „siada” po dobyciu). */
export const backOut=(t,s=1.5)=>{t=clamp01(t)-1;return 1+t*t*((s+1)*t+s)};
/** Okno: 0 przed a, narasta do 1 w [a,b], trzyma do c, opada do 0 w [c,d]. */
export function win(p,a,b,c,d){if(p<=a||p>=d)return 0;if(p<b)return smooth((p-a)/(b-a));if(p<=c)return 1;return 1-smooth((p-c)/(d-c))}
/** Postęp 0..1 w przedziale [a,b] z ease. */
export const seg=(p,a,b)=>smooth((p-a)/(b-a));
/** Kopniak: szybki atak (ease-out) do 1, potem powrót ease-out do 0 (szybko, potem coraz wolniej). */
export function kickCurve(t,att,dec){if(t<0)return 0;if(t<att)return easeOut(t/att);const u=(t-att)/dec;if(u>=1)return 0;return 1-easeOut(u)}
export const wrapPi=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a};

/** Sprężyna tłumiona 1D: x'' = -k(x-cel) - c x'. f [Hz], z = współczynnik tłumienia (<1 przeregulowanie). */
export class Spring{
  constructor(f=8,z=.5){this.x=0;this.v=0;this.f=-1;this.set(f,z)}
  set(f,z){if(f===this.f&&z===this.z)return this;z=Math.max(.05,z);this.f=f;this.z=z;const w=2*Math.PI*f;this.w=w;this.k=w*w;this.c=2*z*w;
    // impuls dający szczyt odpowiedzi = amp (wzór na maksimum odpowiedzi impulsowej oscylatora tłumionego)
    if(z<1){const s=Math.sqrt(1-z*z);this.imp=w/Math.exp(-z/s*Math.atan(s/z))}else this.imp=w*Math.E;
    return this}
  /** Impuls, po którym wychylenie osiąga szczyt ≈ amp (sumuje się z bieżącym ruchem). */
  kick(amp){this.v+=amp*this.imp}
  step(dt,target=0){if(dt<=0)return this.x;let n=Math.ceil(dt*240);if(n>16)n=16;const h=dt/n;
    for(let i=0;i<n;i++){this.v+=(-this.k*(this.x-target)-this.c*this.v)*h;this.x+=this.v*h}
    if(Math.abs(this.x)<1e-7&&Math.abs(this.v)<1e-6&&target===0){this.x=0;this.v=0}
    return this.x}
  reset(){this.x=0;this.v=0}
}

/** Pula sumowanych krzywych kopniaka: kolejne strzały się dodają, nie restartują animacji. Dwa kanały (a, b). */
export class Kicks{
  constructor(n=8){this.k=[];for(let i=0;i<n;i++)this.k.push({on:false,t:0,a:0,b:0,att:.015,dec:.1});this.a=0;this.b=0}
  add(a,b,att,dec){let s=null,old=null;for(const k of this.k){if(!k.on){s=k;break}if(!old||k.t>old.t)old=k}s=s||old;
    s.on=true;s.t=0;s.a=a;s.b=b;s.att=att;s.dec=dec}
  step(dt){let a=0,b=0;for(const k of this.k){if(!k.on)continue;k.t+=dt;const c=kickCurve(k.t,k.att,k.dec);if(k.t>k.att+k.dec){k.on=false;continue}a+=k.a*c;b+=k.b*c}
    this.a=a;this.b=b}
  reset(){for(const k of this.k)k.on=false;this.a=this.b=0}
}
