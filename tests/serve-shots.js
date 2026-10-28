// Serwer statyczny + zapis zrzutów z przeglądarki: node tests/serve-shots.js [port]
// POST /__shot/<nazwa>.png  (body = data URL z canvas.toDataURL) zapisuje do tests/shots/<nazwa>.png.
// Tylko do QA na localhost; zapisuje wyłącznie do tests/shots, nazwa po filtrze [A-Za-z0-9_.-].
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),port=+process.argv[2]||4190,shots=path.join(__dirname,'shots');fs.mkdirSync(shots,{recursive:true});
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png'};
http.createServer((q,r)=>{
  if(q.method==='POST'&&q.url.startsWith('/__shot/')){
    const name=decodeURIComponent(q.url.slice(8)).replace(/[^A-Za-z0-9_.-]/g,'_');const chunks=[];
    q.on('data',c=>chunks.push(c));q.on('end',()=>{const s=Buffer.concat(chunks).toString().replace(/^data:image\/png;base64,/,'');
      fs.writeFileSync(path.join(shots,name),Buffer.from(s,'base64'));r.writeHead(200);r.end('ok')});return}
  let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);
  if(!f.startsWith(root)){r.writeHead(403);return r.end()}
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('404')}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});r.end(d)})
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
