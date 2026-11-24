function load(f){ const g={}; new Function('self', require('fs').readFileSync(f,'utf8').replace("typeof self !== 'undefined' ? self : this","self"))(g); return g.PKTimePitch; }
const O=load('old.js'), N=load('new.js'), sr=44100, n=sr*3;
const L=new Float32Array(n), R=new Float32Array(n);
for(let i=0;i<n;i++){ const e=1+0.5*Math.sin(i/9000); L[i]=Math.sin(2*Math.PI*220*i/sr)*0.3*e+Math.sin(2*Math.PI*660*i/sr)*0.1+(i%11025<40?0.5:0); R[i]=Math.sin(2*Math.PI*330*i/sr)*0.3; }
let allSame=true;
for(const o of [ {tempo:1.5,mode:'speech'},{tempo:0.7,pitch:3,mode:'perc'},{tempo:1.2,pitch:-4,mode:'music'},{tempo:0.8,pitch:5,mode:'mixed',formant:true,formantShift:2},{tempo:1.3,link:true} ]){
  const a=O.process([L,R],sr,Object.assign({},o)), b=N.process([L,R],sr,Object.assign({},o));
  let md=0; for(let c=0;c<2;c++){ if(a[c].length!==b[c].length){md=Infinity;break;} for(let i=0;i<a[c].length;i++) md=Math.max(md,Math.abs(a[c][i]-b[c][i])); }
  console.log(JSON.stringify(o),'長度',a[0].length,b[0].length,'最大差',md); if(md>0) allSame=false;
}
console.log(allSame?'回歸通過：輸出與舊版完全相同':'有差異');
