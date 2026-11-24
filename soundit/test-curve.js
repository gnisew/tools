function load(f){ const g={}; new Function('self', require('fs').readFileSync(f,'utf8').replace("typeof self !== 'undefined' ? self : this","self"))(g); return g.PKTimePitch; }
const E=load('new.js'), sr=44100;
const sine=(f,s,a=0.5)=>{const x=new Float32Array(sr*s); for(let i=0;i<x.length;i++) x[i]=a*Math.sin(2*Math.PI*f*i/sr); return x;};
function freqAt(y,t0,dur){ const a=Math.round(t0*sr), b=Math.min(y.length-1,Math.round((t0+dur)*sr)); let first=-1,last=-1,cnt=0;
  for(let i=a+1;i<b;i++) if(y[i-1]<0&&y[i]>=0){ const p=i-1+(-y[i-1])/(y[i]-y[i-1]); if(first<0) first=p; last=p; cnt++; }
  return cnt>1? (cnt-1)*sr/(last-first):0; }
const cents=(f,g)=>1200*Math.log2(f/g);
const rms=(y,t0,d)=>{let s=0,a=Math.round(t0*sr),b=Math.round((t0+d)*sr); for(let i=a;i<b;i++) s+=y[i]*y[i]; return Math.sqrt(s/(b-a));};
let fails=0; const chk=(name,ok,info)=>{ console.log((ok?'✓ ':'✗ ')+name+'  '+info); if(!ok) fails++; };

// 1) 音高斜坡 0→+12 半音（10 秒），速度 1：輸出時間 = 輸入時間
for (const mode of ['speech','mixed','music']) {
  const y=E.process([sine(440,10)],sr,{pitchCurve:[{t:0,v:0},{t:10,v:12}],mode})[0];
  let worst=0; const rep=[];
  for(const t of [1.5,4,6.5,8.5]){ const exp=440*Math.pow(2,1.2*(t+0.1)/12); const e=cents(freqAt(y,t,0.2),exp); worst=Math.max(worst,Math.abs(e)); rep.push(e.toFixed(1)); }
  chk('音高斜坡 '+mode+' 長度='+(y.length/sr).toFixed(3)+'s', Math.abs(y.length-sr*10)<=2 && worst<15, '各點誤差(音分) '+rep.join(', '));
}

// 2) 速度斜坡 1→2（log 線性），用節拍測時間對應
/* 鼓聲式節拍：120 Hz 衰減正弦（約 120 ms）＋小底噪，比孤立的 7 ms 脈衝更接近實際素材 */
function clicks(period,secs){ const x=new Float32Array(sr*secs); for(let t=0.25;t<secs-0.2;t+=period){ const s=Math.round(t*sr); for(let k=0;k<0.15*sr;k++) x[s+k]+=0.8*Math.sin(2*Math.PI*120*k/sr)*Math.exp(-k/(0.03*sr)); } let seed=7; for(let i=0;i<x.length;i++){ seed=(seed*1103515245+12345)&0x7fffffff; x[i]+=((seed/0x7fffffff)-0.5)*0.06; } return x; }
function peaks(y,minGap){ const out=[]; const g=Math.round(minGap*sr); let i=0; while(i<y.length){ if(Math.abs(y[i])>0.3){ let best=i,bv=0; for(let j=i;j<Math.min(y.length,i+g/2);j++){ if(Math.abs(y[j])>bv){bv=Math.abs(y[j]);best=j;} } out.push(best/sr); i+=g; } else i++; } return out; }
const tau=u=>(10/Math.LN2)*(1-Math.pow(2,-u/10));
const expLen=tau(10);
for (const mode of ['speech','perc','mixed']) {
  const x=clicks(0.5,10), y=E.process([x],sr,{tempoCurve:[{t:0,v:1},{t:10,v:2}],mode})[0];
  const pk=peaks(y,0.12), exps=[]; for(let u=0.25;u<9.8;u+=0.5) exps.push(tau(u));
  /* 每個偵測到的節拍對照最近的預期位置（去掉視窗造成的固定延遲後看偏差）；掉拍另計 */
  const devs=pk.map(p=>{ const e=exps.reduce((a,b)=>Math.abs(b-p)<Math.abs(a-p)?b:a); return p-e; });
  const mean=devs.reduce((a,b)=>a+b,0)/devs.length, spread=Math.max(...devs.map(d=>Math.abs(d-mean)));
  const dropped=exps.length-pk.length;
  chk('速度斜坡 1→2 '+mode, Math.abs(y.length/sr-expLen)/expLen<0.003 && spread<0.02 && Math.abs(mean)<0.04 && dropped<=2,
      '長度 '+(y.length/sr).toFixed(3)+' 預期 '+expLen.toFixed(3)+'；固定延遲 '+(mean*1000).toFixed(1)+' ms，抖動 '+(spread*1000).toFixed(1)+' ms，掉拍 '+dropped+'/'+exps.length);
}

// 3) 階梯：前 5 秒 0.5×，後 5 秒 2×（5 秒處急轉）
{ const y=E.process([sine(300,10)],sr,{tempoCurve:[{t:0,v:0.5},{t:4.99,v:0.5},{t:5.01,v:2},{t:10,v:2}],mode:'speech'})[0];
  const exp=5/0.5+5/2; chk('階梯速度 長度', Math.abs(y.length/sr-exp)/exp<0.003, (y.length/sr).toFixed(3)+' 預期 '+exp);
  chk('階梯速度 音高不變', Math.abs(cents(freqAt(y,3,0.3),300))<8 && Math.abs(cents(freqAt(y,exp-1,0.3),300))<8, '前段 '+freqAt(y,3,0.3).toFixed(1)+' Hz、後段 '+freqAt(y,exp-1,0.3).toFixed(1)+' Hz'); }

// 4) 音量：速度 0.5→2 斜坡，各處 RMS 應維持 0.354
for (const mode of ['speech','mixed']) { const y=E.process([sine(300,10)],sr,{tempoCurve:[{t:0,v:0.5},{t:10,v:2}],mode})[0]; const r=[1,0.5,0.25].map(f=>rms(y,y.length/sr*f-0.3 > 0.5? y.length/sr*(1-f)+0.05:0.5,0.3)/0.3536);
  chk('音量 '+mode, r.every(v=>v>0.97&&v<1.03), '比值 '+r.map(v=>v.toFixed(3)).join(', ')); }

// 5) 磁帶式曲線：速度 1→2，頻率應等於 300×T(u(τ))
{ const y=E.process([sine(300,10)],sr,{tempoCurve:[{t:0,v:1},{t:10,v:2}],link:true})[0];
  const uOf=t=>-10*Math.log2(1-t*Math.LN2/10); let worst=0;
  for(const t of [1,3,5]){ const u=uOf(t+0.1), e=cents(freqAt(y,t,0.2),300*Math.pow(2,u/10)); worst=Math.max(worst,Math.abs(e)); }
  chk('磁帶式曲線', Math.abs(y.length/sr-expLen)/expLen<0.003 && worst<10, '長度 '+(y.length/sr).toFixed(3)+'，頻率最大誤差 '+worst.toFixed(1)+' 音分'); }

// 6) 速度曲線與音高曲線同時：速度 1→1.5，音高 +7→−5
{ const tc=[{t:0,v:1},{t:10,v:1.5}], pc=[{t:0,v:7},{t:10,v:-5}];
  const y=E.process([sine(330,10)],sr,{tempoCurve:tc,pitchCurve:pc,mode:'speech'})[0];
  const tauF=u=>{ let a=0; const N=4000; for(let i=0;i<N;i++){ const uu=(i+0.5)*u/N; a+=u/N/Math.pow(1.5,uu/10); } return a; };
  const uOf=t=>{ let lo=0,hi=10; for(let k=0;k<50;k++){ const m=(lo+hi)/2; if(tauF(m)<t) lo=m; else hi=m; } return lo; };
  let worst=0; const rep=[];
  for(const t of [1,3,5]){ const u=uOf(t+0.1), exp=330*Math.pow(2,(7-1.2*u)/12), e=cents(freqAt(y,t,0.2),exp); worst=Math.max(worst,Math.abs(e)); rep.push(e.toFixed(1)); }
  chk('速度＋音高曲線同時', Math.abs(y.length/sr-tauF(10))/tauF(10)<0.003 && worst<20, '長度 '+(y.length/sr).toFixed(3)+' 預期 '+tauF(10).toFixed(3)+'；音高誤差(音分) '+rep.join(', ')); }

// 7) 常數曲線 = 常數參數（長度與頻率）
{ const a=E.process([sine(440,5)],sr,{tempo:1.25,pitch:5,mode:'speech'})[0], b=E.process([sine(440,5)],sr,{tempoCurve:[{t:0,v:1.25},{t:5,v:1.25}],pitchCurve:[{t:0,v:5},{t:5,v:5}],mode:'speech'})[0];
  chk('常數曲線 = 常數參數', a.length===b.length && Math.abs(cents(freqAt(a,1,0.5),freqAt(b,1,0.5)))<3, '長度 '+a.length+' / '+b.length); }

// 8) 立體聲 + 共振峰 + 曲線可以跑完，長度正確；曲線長度預估
{ const L=sine(220,6),R=sine(330,6); const o={tempoCurve:[{t:0,v:1},{t:6,v:1.6}],pitchCurve:[{t:0,v:0},{t:3,v:6},{t:6,v:0}],mode:'mixed',formant:true};
  const t0=Date.now(); const y=E.process([L,R],sr,o); const ms=Date.now()-t0;
  chk('立體聲＋共振峰＋曲線', y.length===2 && y[0].length===y[1].length && y[0].length===E.curveLength(L.length,sr,o) && !y[0].some(v=>!isFinite(v)), '長度 '+y[0].length+' = curveLength '+E.curveLength(L.length,sr,o)+'，'+ms+' ms'); }

// 9) 效能：60 秒立體聲、速度＋音高曲線、通用模式
{ const L=sine(220,60),R=sine(330,60); const t0=Date.now();
  const y=E.process([L,R],sr,{tempoCurve:[{t:0,v:0.8},{t:30,v:1.5},{t:60,v:1}],pitchCurve:[{t:0,v:-3},{t:60,v:4}],mode:'mixed'}); console.log('  效能：60 秒立體聲 通用模式 '+(Date.now()-t0)+' ms，輸出 '+(y[0].length/sr).toFixed(2)+' 秒'); }
console.log(fails?('失敗 '+fails+' 項'):'全部通過');
