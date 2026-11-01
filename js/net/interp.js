// Bufor próbek z czasem nadawcy i interpolacja z opóźnieniem (~100 ms): ruch awatarów i replik bez szarpania.
// Zegar nadawcy (performance.now() w jego karcie) mapujemy na lokalny przez przesunięcie `off` ≈ najmniejsze obserwowane opóźnienie.
export const DELAY=100;   // ms

export const lerpAng=(a,b,k)=>{let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return a+d*k};

export class SampleBuf{
  /** n = liczba pól próbki (np. x,y,z,yaw,pitch); `ang` = indeksy pól kątowych (interpolacja po najkrótszym łuku). */
  constructor(n,ang=[],cap=24){this.n=n;this.ang=ang;this.cap=cap;this.t=new Float64Array(cap);this.v=new Float32Array(cap*n);this.len=0;this.head=0;this.off=null}
  /** Dodaje próbkę (ts = czas nadawcy w ms, vals = tablica n liczb). Próbki starsze od ostatniej są ignorowane. */
  push(ts,vals){
    const now=performance.now(),o=now-ts;
    if(this.off===null||o<this.off)this.off=o;else this.off+=(o-this.off)*.02;   // powolny dryf w górę (zmiana trasy relaya), skok w dół od razu
    if(this.len&&ts<=this.t[(this.head+this.len-1)%this.cap])return false;
    let i;if(this.len<this.cap){i=(this.head+this.len)%this.cap;this.len++}else{i=this.head;this.head=(this.head+1)%this.cap}
    this.t[i]=ts;for(let k=0;k<this.n;k++)this.v[i*this.n+k]=vals[k];
    return true;
  }
  /** Ostatnia próbka (do logiki, np. cele AI). */
  last(out){if(!this.len)return null;const i=(this.head+this.len-1)%this.cap;for(let k=0;k<this.n;k++)out[k]=this.v[i*this.n+k];return out}
  /** Stan w chwili (teraz − delay), w czasie nadawcy; poza zakresem: najbliższa próbka (bez ekstrapolacji). */
  sample(out,delay=DELAY){
    if(!this.len)return null;
    const T=performance.now()-this.off-delay,n=this.n,cap=this.cap;
    const first=this.head,lastI=(this.head+this.len-1)%cap;
    if(T<=this.t[first]){for(let k=0;k<n;k++)out[k]=this.v[first*n+k];return out}
    if(T>=this.t[lastI]){for(let k=0;k<n;k++)out[k]=this.v[lastI*n+k];return out}
    for(let j=this.len-2;j>=0;j--){
      const a=(this.head+j)%cap,b=(a+1)%cap;
      if(this.t[a]<=T){
        const k0=(T-this.t[a])/Math.max(1e-6,this.t[b]-this.t[a]);
        for(let k=0;k<n;k++){const va=this.v[a*n+k],vb=this.v[b*n+k];out[k]=this.ang.includes(k)?lerpAng(va,vb,k0):va+(vb-va)*k0}
        return out;
      }
    }
    return out;
  }
}
