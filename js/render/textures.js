// Tekstury proceduralne z canvas 2D.
import {rand} from '../core/util.js';

export function cnv(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c}

export const winCanvas=cnv(128,128,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#d9d2c4';g.fillRect(0,h-14,w,14);
  [[18,18],[74,18]].forEach(([x,y])=>{g.fillStyle='#2b3140';g.fillRect(x,y,36,62);g.fillStyle='#5f7d8f';g.beginPath();g.moveTo(x,y+40);g.lineTo(x+24,y);g.lineTo(x+36,y);g.lineTo(x+36,y+10);g.lineTo(x+8,y+62);g.lineTo(x,y+62);g.fill();
  g.strokeStyle='#15110e';g.lineWidth=5;g.strokeRect(x,y,36,62);g.lineWidth=3;g.beginPath();g.moveTo(x+18,y);g.lineTo(x+18,y+62);g.stroke();g.fillStyle='#f4e7c5';g.fillRect(x-4,y+64,44,6);g.strokeRect(x-4,y+64,44,6)});
  g.strokeStyle='#15110e';g.lineWidth=3;g.beginPath();g.moveTo(0,h-14);g.lineTo(w,h-14);g.stroke()});
export function winTex(rx,ry){const t=new THREE.CanvasTexture(winCanvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);return t}
export const groundTex=new THREE.CanvasTexture(cnv(256,256,(g,w,h)=>{g.fillStyle='#9a8b74';g.fillRect(0,0,w,h);g.strokeStyle='rgba(21,17,14,.55)';g.lineWidth=2;
  for(let i=0;i<9;i++){g.beginPath();let x=Math.random()*w,y=Math.random()*h;g.moveTo(x,y);for(let k=0;k<4;k++){x+=rand(-30,30);y+=rand(-30,30);g.lineTo(x,y)}g.stroke()}
  g.fillStyle='rgba(21,17,14,.12)';for(let i=0;i<300;i++)g.fillRect(Math.random()*w,Math.random()*h,2,2);
  g.strokeStyle='rgba(21,17,14,.35)';g.lineWidth=3;g.strokeRect(0,0,w,h)}));
groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping; groundTex.repeat.set(24,24);
export function signTex(text,col,bg){return new THREE.CanvasTexture(cnv(512,140,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle='#15110e';g.lineWidth=12;g.strokeRect(0,0,w,h);
  g.font='96px Bangers, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor=col;g.shadowBlur=24;g.fillStyle=col;g.fillText(text,w/2,h/2+4);g.shadowBlur=0;g.lineWidth=4;g.strokeText(text,w/2,h/2+4)}))}
export const starTex=new THREE.CanvasTexture(cnv(128,128,(g)=>{g.translate(64,64);g.beginPath();for(let i=0;i<16;i++){const r=i%2?22:60,a=i/16*Math.PI*2;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fillStyle='#ffe14a';g.fill();g.lineWidth=6;g.strokeStyle='#15110e';g.stroke();g.beginPath();g.arc(0,0,14,0,7);g.fillStyle='#fff';g.fill()}));
export const puffTex=new THREE.CanvasTexture(cnv(128,128,(g)=>{g.translate(64,64);g.fillStyle='#f4e7c5';g.strokeStyle='#15110e';g.lineWidth=6;for(let i=0;i<6;i++){const a=i/6*7;g.beginPath();g.arc(Math.cos(a)*24,Math.sin(a)*24,24,0,7);g.fill();g.stroke()}g.beginPath();g.arc(0,0,26,0,7);g.fill()}));
export const cloudTex=new THREE.CanvasTexture(cnv(256,128,(g)=>{g.fillStyle='#fff6dc';g.strokeStyle='#15110e';g.lineWidth=5;const b=[[60,80,34],[100,60,44],[150,64,40],[190,84,30],[120,90,36]];b.forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke()});b.forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r-4,0,7);g.fill()})}));
