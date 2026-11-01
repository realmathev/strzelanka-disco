// Uruchamia skrypt QA z tests/ w headless Chrome przez CDP (okno 1280x720), bez zależności.
// node tests/cdp-run.js <plik.js> [port=4202] [--noclear] [--size=1280x720] [--gpu]
// Przed testem: localStorage.clear() i opt {"level":"remiza"}, przeładowanie przez nawigację.
// Skrypt zwracający tekst z "reload" (np. oldsave.js, highscores.js) jest uruchamiany drugi raz po nawigacji.
// Zmienna CHROME wskazuje chrome.exe (domyślnie typowe ścieżki Windows). Serwer: node tests/serve.js <port>.
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os'),http=require('http');
const file=process.argv[2],port=+(process.argv[3]&&!process.argv[3].startsWith('--')?process.argv[3]:4202);
const flags=process.argv.slice(2).filter(a=>a.startsWith('--'));
const size=((flags.find(f=>f.startsWith('--size='))||'--size=1280x720').slice(7)).split('x').map(Number);
const cands=[process.env.CHROME,process.env.LOCALAPPDATA+'\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean);
const exe=cands.find(p=>fs.existsSync(p));if(!exe){console.error('Brak Chrome');process.exit(2)}
const dbg=9300+Math.floor(Math.random()*500),dir=fs.mkdtempSync(path.join(os.tmpdir(),'ds-cdp-'));
const ch=spawn(exe,['--headless=new','--remote-debugging-port='+dbg,'--user-data-dir='+dir,'--window-size='+size[0]+','+size[1],'--no-first-run',...(flags.includes('--gpu')?['--use-gl=angle','--use-angle=d3d11']:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']),'--ignore-gpu-blocklist','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const getJson=u=>new Promise((res,rej)=>http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej));
(async()=>{
  let tabs;for(let i=0;i<60;i++){try{tabs=await getJson('http://127.0.0.1:'+dbg+'/json');if(tabs.some(t=>t.type==='page'))break}catch(e){}await sleep(250)}
  const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  let id=0;const wait={};const logs=[];
  ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&wait[d.id]){wait[d.id](d);delete wait[d.id]}else if(d.method==='Runtime.exceptionThrown')logs.push('EXC '+JSON.stringify(d.params.exceptionDetails.exception&&d.params.exceptionDetails.exception.description||d.params.exceptionDetails.text))};
  const send=(method,params={})=>new Promise(r=>{wait[++id]=r;ws.send(JSON.stringify({id,method,params}))});
  const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true,timeout:600000});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails.exception||r.result.exceptionDetails));return r.result.result.value};
  const nav=async url=>{await send('Page.navigate',{url});await sleep(400);for(let i=0;i<80;i++){if(await ev('document.readyState')==='complete')break;await sleep(150)}await sleep(1200)};
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:size[0],height:size[1],deviceScaleFactor:1,mobile:false});
  const base='http://127.0.0.1:'+port+'/';
  await nav(base);
  if(!flags.includes('--noclear')){await ev(`localStorage.clear();sessionStorage.clear();localStorage.setItem('discoStrzelnica.opt.v1','{"level":"remiza"}');1`);await nav(base)}
  const run=`(0,eval)(await (await fetch('/tests/${file}')).text())`;
  let res=await ev(`(async()=>JSON.stringify(await ${run},null,1))()`);
  if(/reload/.test(String(res))){await nav(base);res=await ev(`(async()=>JSON.stringify(await ${run},null,1))()`)}
  console.log(res);if(logs.length)console.log('LOGS',logs.slice(0,5));
  ws.close();
})().catch(e=>{console.error('FAIL',e.message);process.exitCode=1}).finally(()=>{try{ch.kill()}catch(e){}setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch(e){}process.exit()},500)});
