// Nawigacja wrogów: siatka przejść, A* z budżetem węzłów na klatkę, linia widzenia po siatce, szukanie osłon.
// Źródła danych (w kolejności): `level.nav` dostarczone przez poziom (siatka albo graf waypointów), a gdy go nie ma,
// siatka liczona z `world.colliders` (poziomów nie trzeba edytować). Kontrakt `level.nav` opisuje docs/requests/ds-enemy-designer.md.
import {world} from '../world/state.js';

const CELL_AUTO=1;                    // m
const R0=.6,R1=1.15;                  // promienie zajęcia: klasa 0 (ludzie), klasa 1 (boss, Maluch)
const LOS_H=1.7;                      // collider niższy niż to nie zasłania widoku stojącego
const LOW_H=1.3;                      // ...ale chowa kucającego (osłona częściowa: skrzynie, auta, murki)
const MAX_EXP=5000;                   // limit węzłów jednego zapytania A*

let N=null;                           // aktualna siatka: {key,x0,z0,cols,rows,cell,b0,b1,los,low,graph,cover}
let stamp=0,gS,par,seen,closed,hk,hv,hn=0;  // bufory A* (jedno zadanie naraz, więc współdzielone)
const jobs=[];let cur=null;

const colliderKey=()=>(world.level?world.level.id:'-')+'|'+world.arena+'|'+world.colliders.length;

/** Zwraca siatkę dla bieżącego poziomu; liczy ją od nowa, gdy zmienił się poziom/liczba colliderów. */
export function grid(){
  const key=colliderKey();
  if(N&&N.key===key)return N;
  build(key);return N;
}
export function resetNav(){N=null;jobs.length=0;cur=null}

function allocBuffers(n){
  gS=new Float32Array(n);par=new Int32Array(n);seen=new Uint32Array(n);closed=new Uint32Array(n);
  hk=new Float32Array(n*6);hv=new Int32Array(n*6);stamp=0;
}

function build(key){
  const A=world.arena,lv=world.level,ln=lv&&lv.nav;
  let cell=CELL_AUTO,x0=-A-1,z0=-A-1,cols,rows,b0,b1,los;
  if(ln&&ln.blocked&&ln.cols&&ln.rows){          // siatka od poziomu
    cell=ln.cell||1;x0=ln.x0;z0=ln.z0;cols=ln.cols;rows=ln.rows;b0=Uint8Array.from(ln.blocked);b1=dilate(b0,cols,rows);los=new Uint8Array(cols*rows);
    if(ln.los)los.set(ln.los);
  }else{
    cols=Math.ceil((2*A+2)/cell);rows=cols;b0=new Uint8Array(cols*rows);b1=new Uint8Array(cols*rows);los=new Uint8Array(cols*rows);
  }
  N={key,x0,z0,cols,rows,cell,b0,b1,los,low:null,graph:null,cover:null};
  N.low=new Uint8Array(los);
  if(!(ln&&ln.blocked)){
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){            // poza areną = zablokowane
      const cx=x0+(c+.5)*cell,cz=z0+(r+.5)*cell;
      if(Math.abs(cx)>A-R0||Math.abs(cz)>A-R0)b0[r*cols+c]=1;
      if(Math.abs(cx)>A-R1||Math.abs(cz)>A-R1)b1[r*cols+c]=1}
    for(const k of world.colliders){
      const i0=Math.max(0,Math.floor((k.x0-R1-x0)/cell)),i1=Math.min(cols-1,Math.floor((k.x1+R1-x0)/cell));
      const j0=Math.max(0,Math.floor((k.z0-R1-z0)/cell)),j1=Math.min(rows-1,Math.floor((k.z1+R1-z0)/cell));
      const tall=k.h===undefined||k.h>=LOS_H,mid=k.h===undefined||k.h>=LOW_H;
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
        const cx=x0+(i+.5)*cell,cz=z0+(j+.5)*cell;
        const dx=Math.max(k.x0-cx,0,cx-k.x1),dz=Math.max(k.z0-cz,0,cz-k.z1),d2=dx*dx+dz*dz;
        const id=j*cols+i;
        if(d2<R0*R0)b0[id]=1;if(d2<R1*R1)b1[id]=1;
        if(dx<cell*.5&&dz<cell*.5){if(tall)los[id]=1;if(mid)N.low[id]=1}   // komórka zachodzi na collider
      }}
  }
  if(ln&&ln.points&&ln.points.length)N.graph=buildGraph(ln);
  if(ln&&ln.cover)N.cover=ln.cover;
  allocBuffers(cols*rows);
}
function dilate(b,cols,rows){
  const o=new Uint8Array(b.length);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(b[r*cols+c])for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    const rr=r+dr,cc=c+dc;if(rr>=0&&rr<rows&&cc>=0&&cc<cols)o[rr*cols+cc]=1}
  return o;
}
function buildGraph(ln){
  const pts=ln.points.map(p=>({x:p.x,z:p.z})),adj=pts.map(()=>[]);
  const links=ln.links||[];
  for(const [a,b] of links){if(!pts[a]||!pts[b])continue;adj[a].push(b);adj[b].push(a)}
  return {pts,adj};
}

const idx=(x,z)=>{const g=N,c=Math.floor((x-g.x0)/g.cell),r=Math.floor((z-g.z0)/g.cell);return c<0||r<0||c>=g.cols||r>=g.rows?-1:r*g.cols+c};
/** true, jeśli punkt jest poza areną albo w zajętej komórce (klasa 0 = człowiek, 1 = duży). */
export function blocked(x,z,cls=0){grid();const i=idx(x,z);return i<0||(cls?N.b1[i]:N.b0[i])===1}
export const isFree=(x,z,cls=0)=>!blocked(x,z,cls);

/** Widok między punktami nie jest zasłonięty wysokim colliderem (próbkowanie co 0,5 m). Tania alternatywa dla raycastu. */
export function gridLos(x0,z0,x1,z1,low=false){
  grid();
  const L=low?N.low:N.los,dx=x1-x0,dz=z1-z0,d=Math.hypot(dx,dz),n=Math.ceil(d/.5);
  for(let i=1;i<n;i++){const t=i/n,j=idx(x0+dx*t,z0+dz*t);if(j>=0&&L[j])return false}
  return true;
}
/** Bezpośrednie przejście (próbkowanie co 0,4 m po siatce zajęć). */
export function walkable(x0,z0,x1,z1,cls=0){
  grid();const b=cls?N.b1:N.b0;
  const dx=x1-x0,dz=z1-z0,d=Math.hypot(dx,dz),n=Math.ceil(d/.4);
  for(let i=1;i<=n;i++){const t=i/n,j=idx(x0+dx*t,z0+dz*t);if(j<0||b[j])return false}
  return true;
}
const NF={x:0,z:0};
/** Najbliższy wolny punkt od (x,z) w promieniu maxR; zwraca wspólny obiekt {x,z} (nie przechowuj) albo null. */
export function nearestFree(x,z,cls=0,maxR=6){
  grid();
  if(isFree(x,z,cls)){NF.x=x;NF.z=z;return NF}
  for(let r=1;r<=maxR;r++)for(let k=0;k<r*8;k++){
    const a=k/(r*8)*Math.PI*2,px=x+Math.cos(a)*r*N.cell,pz=z+Math.sin(a)*r*N.cell;
    if(isFree(px,pz,cls)){NF.x=px;NF.z=pz;return NF}}
  return null;
}
/** Losowy wolny punkt w promieniu r od (cx,cz); {x,z} (nowy obiekt) albo null. */
export function randomPoint(cx,cz,r,cls=0){
  grid();
  for(let i=0;i<12;i++){const a=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*r,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(isFree(x,z,cls))return {x,z}}
  return null;
}

/* ---------- A* ---------- */
function hpush(k,v){if(hn>=hk.length)return;let i=hn++;while(i>0){const p=(i-1)>>1;if(hk[p]<=k)break;hk[i]=hk[p];hv[i]=hv[p];i=p}hk[i]=k;hv[i]=v}
function hpop(){
  const v=hv[0];hn--;
  if(hn>0){const k=hk[hn],x=hv[hn];let i=0;
    for(;;){let c=i*2+1;if(c>=hn)break;if(c+1<hn&&hk[c+1]<hk[c])c++;if(hk[c]>=k)break;hk[i]=hk[c];hv[i]=hv[c];i=c}
    hk[i]=k;hv[i]=x}
  return v;
}
const DX=[1,-1,0,0,1,1,-1,-1],DZ=[0,0,1,-1,1,-1,1,-1];

/** Zleca przeliczenie ścieżki dla wroga `e` do (gx,gz). Wynik pojawia się później w e.ai.path (tablica {x,z}) i e.ai.pathGoal. */
export function request(e,gx,gz,cls=0){
  grid();
  for(let i=jobs.length-1;i>=0;i--)if(jobs[i].e===e)jobs.splice(i,1);
  if(cur&&cur.e===e)cur=null;
  const p=e.g.position;
  if(N.graph){const path=graphPath(p.x,p.z,gx,gz,cls);deliver(e,path,gx,gz);return}
  jobs.push({e,sx:p.x,sz:p.z,gx,gz,cls,state:0,exp:0,best:-1,bestH:1e9});
  e.ai.pathPending=true;
}
export function cancel(e){for(let i=jobs.length-1;i>=0;i--)if(jobs[i].e===e)jobs.splice(i,1);if(cur&&cur.e===e)cur=null;if(e.ai)e.ai.pathPending=false}

function deliver(e,path,gx,gz){const a=e.ai;a.pathPending=false;a.path=path&&path.length?path:null;a.pi=0;a.pathGoalX=gx;a.pathGoalZ=gz;a.pathAge=0}

/** Przetwarza zadania A* do `budget` rozwiniętych węzłów w tej klatce. */
export function tick(budget=500){
  if(!N)return;
  while(budget>0){
    if(!cur){
      cur=jobs.shift();if(!cur)return;
      if(!cur.e.alive||cur.e.gone){cur=null;continue}
      startJob(cur);
    }
    budget-=stepJob(cur,budget);
    if(cur.state===2)cur=null;
  }
}
function startJob(j){
  const g=N,b=j.cls?g.b1:g.b0;
  const s=nearestFree(j.sx,j.sz,j.cls,3);if(s){j.sx=s.x;j.sz=s.z}
  const t=nearestFree(j.gx,j.gz,j.cls,6);if(t){j.gx=t.x;j.gz=t.z}
  j.si=idx(j.sx,j.sz);j.gi=idx(j.gx,j.gz);j.b=b;
  if(j.si<0||j.gi<0||b[j.gi]){j.state=2;deliver(j.e,null,j.gx,j.gz);return}
  stamp++;hn=0;
  gS[j.si]=0;seen[j.si]=stamp;par[j.si]=-1;hpush(heur(j.si,j.gi),j.si);j.state=1;
}
function heur(a,b){
  const c=N.cols,dx=Math.abs((a%c)-(b%c)),dz=Math.abs(((a/c)|0)-((b/c)|0));
  return (dx+dz+(1.4142-2)*Math.min(dx,dz))*N.cell;
}
function stepJob(j,budget){
  const g=N,cols=g.cols,rows=g.rows,b=j.b;let used=0;
  while(used<budget&&hn>0){
    const i=hpop();
    if(closed[i]===stamp)continue;
    closed[i]=stamp;used++;j.exp++;
    if(i===j.gi){finishJob(j,i);return used}
    const hh=heur(i,j.gi);if(hh<j.bestH){j.bestH=hh;j.best=i}
    const c=i%cols,r=(i/cols)|0;
    for(let d=0;d<8;d++){
      const nc=c+DX[d],nr=r+DZ[d];
      if(nc<0||nr<0||nc>=cols||nr>=rows)continue;
      const ni=nr*cols+nc;if(b[ni]||closed[ni]===stamp)continue;
      if(d>=4&&(b[r*cols+nc]||b[nr*cols+c]))continue;          // bez ścinania rogów
      const ng=gS[i]+(d<4?1:1.4142)*g.cell;
      if(seen[ni]!==stamp||ng<gS[ni]){seen[ni]=stamp;gS[ni]=ng;par[ni]=i;hpush(ng+heur(ni,j.gi),ni)}
    }
    if(j.exp>MAX_EXP){break}
  }
  if(hn===0||j.exp>MAX_EXP)finishJob(j,j.best);                   // brak drogi: idź do najbliższego znanego punktu
  return used;
}
function finishJob(j,endI){
  j.state=2;
  if(endI<0){deliver(j.e,null,j.gx,j.gz);return}
  const g=N,cols=g.cols,rev=[];
  for(let i=endI;i>=0;i=par[i])rev.push(i);
  const pts=[];
  for(let k=rev.length-1;k>=0;k--){const i=rev[k];pts.push({x:g.x0+((i%cols)+.5)*g.cell,z:g.z0+(((i/cols)|0)+.5)*g.cell})}
  if(endI===j.gi){pts[pts.length-1].x=j.gx;pts[pts.length-1].z=j.gz}
  deliver(j.e,smooth(j.sx,j.sz,pts,j.cls),j.gx,j.gz);
}
/** Prostowanie ścieżki: z każdego punktu kotwicy idź do najdalszego punktu osiągalnego linią prostą. */
function smooth(sx,sz,pts,cls){
  const out=[];let ax=sx,az=sz,i=0;
  while(i<pts.length){
    let far=i;
    for(let k=pts.length-1;k>i;k--)if(walkable(ax,az,pts[k].x,pts[k].z,cls)){far=k;break}
    out.push(pts[far]);ax=pts[far].x;az=pts[far].z;i=far+1;
  }
  return out;
}

/* ---------- graf waypointów (level.nav.points/links) ---------- */
function graphPath(sx,sz,gx,gz,cls){
  const G=N.graph,pts=G.pts,n=pts.length;
  const near=(x,z)=>{const l=[];for(let i=0;i<n;i++){const d=Math.hypot(pts[i].x-x,pts[i].z-z);if(d<40&&walkable(x,z,pts[i].x,pts[i].z,cls))l.push([d,i])}l.sort((a,b)=>a[0]-b[0]);return l.slice(0,4)};
  if(walkable(sx,sz,gx,gz,cls))return [{x:gx,z:gz}];
  const S=near(sx,sz),T=near(gx,gz);
  if(!S.length||!T.length)return [{x:gx,z:gz}];
  const dist=new Float32Array(n).fill(1e9),prev=new Int32Array(n).fill(-1),done=new Uint8Array(n);
  const goalSet=new Map(T.map(([d,i])=>[i,d]));
  for(const [d,i] of S)dist[i]=d;
  let best=-1,bestC=1e9;
  for(;;){
    let u=-1,m=1e9;for(let i=0;i<n;i++)if(!done[i]&&dist[i]<m){m=dist[i];u=i}
    if(u<0||m>=bestC)break;
    done[u]=1;
    if(goalSet.has(u)&&m+goalSet.get(u)<bestC){bestC=m+goalSet.get(u);best=u}
    for(const v of G.adj[u]){const nd=m+Math.hypot(pts[u].x-pts[v].x,pts[u].z-pts[v].z);if(nd<dist[v]){dist[v]=nd;prev[v]=u}}
  }
  if(best<0)return [{x:gx,z:gz}];
  const path=[{x:gx,z:gz}];for(let i=best;i>=0;i=prev[i])path.push({x:pts[i].x,z:pts[i].z});
  path.reverse();return path;
}

/* ---------- osłony ---------- */
const COV={x:0,z:0};
/** Najbliższe miejsce w promieniu maxD od (fx,fz), z którego (tx,tz) nie widzi (collider ≥1,3 m, bo wróg kuca). {x,z} (wspólny obiekt) albo null. */
export function findCover(fx,fz,tx,tz,maxD=16,cls=0){
  grid();
  let best=null,bs=1e9;
  const test=(x,z,pen)=>{
    if(!isFree(x,z,cls))return;
    const dT=Math.hypot(x-tx,z-tz);if(dT<5)return;
    if(gridLos(x,z,tx,tz,true))return;                         // osłona = wysokie przeszkody albo skrzynie (kucanie)
    const s=Math.hypot(x-fx,z-fz)+pen+(walkable(fx,fz,x,z,cls)?0:6);
    if(s<bs){bs=s;COV.x=x;COV.z=z;best=COV}
  };
  if(N.cover)for(const c of N.cover)if(Math.hypot(c.x-fx,c.z-fz)<maxD*1.6)test(c.x,c.z,-1);
  for(let r=3;r<=maxD;r+=2.5){const n=Math.max(8,Math.round(r*2));for(let k=0;k<n;k++){const a=(k/n)*Math.PI*2;test(fx+Math.cos(a)*r,fz+Math.sin(a)*r,0)}if(best&&r>bs+2)break}
  return best;
}
