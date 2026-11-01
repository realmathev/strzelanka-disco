// Runner wielokartowy: jeden headless Chrome, kilka stron tego samego originu (BroadcastChannel między kartami = pokoje JuicyJuicy poza JuicyJuicy).
// const {launch}=require('./cdp-multi.js'); const B=await launch({gpu:true,size:[1280,720]}); const p=await B.page(); await p.nav(url); await p.ev('1+1'); B.close();
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os'),http=require('http');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function req(method,u){return new Promise((res,rej)=>{const r=http.request(u,{method},s=>{let d='';s.on('data',c=>d+=c);s.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(new Error(d))}})});r.on('error',rej);r.end()})}

async function launch({gpu=false,size=[1280,720]}={}){
  const cands=[process.env.CHROME,process.env.LOCALAPPDATA+'\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean);
  const exe=cands.find(p=>fs.existsSync(p));if(!exe)throw new Error('Brak Chrome');
  const dbg=9300+Math.floor(Math.random()*500),dir=fs.mkdtempSync(path.join(os.tmpdir(),'ds-cdpm-'));
  const ch=spawn(exe,['--headless=new','--remote-debugging-port='+dbg,'--user-data-dir='+dir,'--window-size='+size[0]+','+size[1],'--no-first-run',
    '--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows',
    ...(gpu?['--use-gl=angle','--use-angle=d3d11']:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']),'--ignore-gpu-blocklist','about:blank'],{stdio:'ignore'});
  const base='http://127.0.0.1:'+dbg;
  for(let i=0;i<60;i++){try{const t=await req('GET',base+'/json');if(t.some(x=>x.type==='page'))break}catch(e){}await sleep(250)}
  let first=true;const pages=[];
  async function page(){
    let t;
    if(first){first=false;t=(await req('GET',base+'/json')).find(x=>x.type==='page')}
    else t=await req('PUT',base+'/json/new?about:blank');
    const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
    let id=0;const wait={},logs=[];
    ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&wait[d.id]){wait[d.id](d);delete wait[d.id]}
      else if(d.method==='Runtime.exceptionThrown')logs.push('EXC '+(d.params.exceptionDetails.exception&&d.params.exceptionDetails.exception.description||d.params.exceptionDetails.text))
      else if(d.method==='Runtime.consoleAPICalled'&&(d.params.type==='error'||d.params.type==='warning'))logs.push(d.params.type+': '+d.params.args.map(a=>a.value!==undefined?a.value:a.description).join(' '))};
    const send=(method,params={})=>new Promise(r=>{wait[++id]=r;ws.send(JSON.stringify({id,method,params}))});
    const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true,timeout:600000});
      if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails.exception&&r.result.exceptionDetails.exception.description||r.result.exceptionDetails));return r.result.result.value};
    const nav=async url=>{await send('Page.navigate',{url});await sleep(400);for(let i=0;i<80;i++){try{if(await ev('document.readyState')==='complete')break}catch(e){}await sleep(150)}await sleep(1200)};
    await send('Page.enable');await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride',{width:size[0],height:size[1],deviceScaleFactor:1,mobile:false});
    await send('Emulation.setFocusEmulationEnabled',{enabled:true});
    const p={ev,nav,send,logs,close:()=>ws.close()};pages.push(p);return p;
  }
  function close(){for(const p of pages)try{p.close()}catch(e){}try{ch.kill()}catch(e){}setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch(e){}},800)}
  return {page,close,pages};
}
module.exports={launch,sleep};
