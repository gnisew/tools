global.self = global;
require('./timepitch-f0.js'); const E = require('./timepitch-f0-edit.js');
require('./timepitch-engine.js'); require('./timepitch-psola.js');
const F = self.PKF0, P = self.PKPsola, TP = self.PKTimePitch;
let fail = 0; const ok=(c,m)=>{ console.log((c?'PASS ':'FAIL ')+m); if(!c) fail++; };
const sr = 44100;
const rms = (x,a=0,b=x.length)=>{let s=0;for(let i=a;i<b;i++)s+=x[i]*x[i];return Math.sqrt(s/Math.max(1,b-a));};

// 母音合成：脈衝列 × 3 個共振器；f0Fn(t) 回傳 Hz（0=無聲，改放低音量雜訊）
function reson(fc,bw){ const r=Math.exp(-Math.PI*bw/sr), th=2*Math.PI*fc/sr; return {a1:-2*r*Math.cos(th), a2:r*r, y1:0,y2:0}; }
function vowel(dur, f0Fn, F1=700, F2=1200, F3=2600){
  const n=Math.round(dur*sr), out=new Float32Array(n), R=[reson(F1,90),reson(F2,110),reson(F3,160)];
  let ph=0, seed=1; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0; return seed/4294967296-0.5;};
  for(let i=0;i<n;i++){
    const t=i/sr, f=f0Fn(t); let e=0;
    if(f>0){ ph+=f/sr; if(ph>=1){ph-=1; e=1;} } else { e=rnd()*0.08; }
    let y=0; for(const r of R){ const v=e-r.a1*r.y1-r.a2*r.y2; r.y2=r.y1; r.y1=v; y+=v; }
    out[i]=y;
  }
  let pk=0; for(const v of out) pk=Math.max(pk,Math.abs(v)); for(let i=0;i<n;i++) out[i]*=0.5/pk;
  return out;
}
const contour = t => (t<0.3||t>=2.2) ? 0 : 200*Math.pow(160/200,(t-0.3)/1.9)*Math.pow(2,(12*Math.sin(t*35))/1200);
const x = vowel(2.6, contour);
const tr = F.track([x], sr, {fmin:60,fmax:800});
console.log('  原始偵測有聲比例', F.stats(tr).voicedRatio.toFixed(2), '中位', F.stats(tr).median.toFixed(1),'Hz');

// 期望軌跡：輸出時間 t 對應輸入時間 t*tempo，F0 乘上 ratio
function expectTrack(target, tempo, ratio, outSec){
  const rate=target.rate, n=Math.floor(outSec*rate), f0=new Float32Array(n);
  for(let i=0;i<n;i++){ const fi=Math.round(i/rate*tempo*rate); f0[i]= fi<target.n && target.f0[fi]>0 ? target.f0[fi]*ratio : 0; }
  return {rate, n, f0};
}
function cmpOut(out, expect, a, b){ const re=F.track([out],sr,{fmin:60,fmax:1200}); return {re, c:E.compare(expect,re,a,b)}; }

// 1. 整體移調 +5 半音，速度不變（無 f0Target：由原軌跡 × pitch）
let t0=Date.now();
let o = P.process([x], sr, {f0:tr, pitch:5});
console.log('  +5 半音耗時', Date.now()-t0,'ms');
ok(o[0].length===x.length, '長度不變');
let ratio=Math.pow(2,5/12), {c}=cmpOut(o[0], expectTrack(tr,1,ratio,2.6), 0.45, 2.0);
console.log('  +5 半音再偵測', JSON.stringify(c));
ok(c.n>100 && c.medianCents<15 && c.p90Cents<60, '+5 半音：中位 '+c.medianCents.toFixed(1)+' 音分、P90 '+c.p90Cents.toFixed(1));
let r0=rms(x,Math.round(0.5*sr),Math.round(2*sr)), r1=rms(o[0],Math.round(0.5*sr),Math.round(2*sr));
ok(Math.abs(20*Math.log10(r1/r0))<2, '有聲段音量差 '+(20*Math.log10(r1/r0)).toFixed(2)+' dB（±2 內）');

// 2. 降 7 半音
o = P.process([x], sr, {f0:tr, pitch:-7}); ratio=Math.pow(2,-7/12);
c=cmpOut(o[0], expectTrack(tr,1,ratio,2.6), 0.45, 2.0).c;
ok(c.n>100 && c.medianCents<15, '−7 半音：中位 '+c.medianCents.toFixed(1)+' 音分、P90 '+c.p90Cents.toFixed(1));
r1=rms(o[0],Math.round(0.5*sr),Math.round(2*sr)); ok(Math.abs(20*Math.log10(r1/r0))<2.5, '−7 半音音量差 '+(20*Math.log10(r1/r0)).toFixed(2)+' dB');

// 3. 變速不變調：0.7 與 1.6
for (const tempo of [0.7,1.6]){
  o = P.process([x], sr, {f0:tr, tempo});
  ok(o[0].length===Math.round(x.length/tempo), 'tempo '+tempo+' 長度 '+o[0].length+' = '+Math.round(x.length/tempo));
  const cc=cmpOut(o[0], expectTrack(tr,tempo,1,2.6/tempo), 0.5/tempo, 2.0/tempo).c;
  ok(cc.n>50 && cc.medianCents<15, 'tempo '+tempo+' 音高保持：中位 '+cc.medianCents.toFixed(1)+' 音分');
}

// 4. 輪廓編輯：壓平（f0Target）→ 再偵測應貼目標
const ed = E.create(tr); ed.flatten(1, 0.3, 2.2);
o = P.process([x], sr, {f0:tr, f0Target:ed.edited});
let cm=cmpOut(o[0], ed.edited, 0.45, 2.05); 
console.log('  壓平再偵測', JSON.stringify(cm.c));
ok(cm.c.n>100 && cm.c.medianCents<15 && cm.c.p90Cents<50, '壓平後再偵測貼目標：中位 '+cm.c.medianCents.toFixed(1)+'、P90 '+cm.c.p90Cents.toFixed(1)+' 音分');
const st=F.stats(cm.re,0.6,2.0); ok(1200*Math.log2(st.p90/st.p10)<60, '壓平後實際音高起伏 '+(1200*Math.log2(st.p90/st.p10)).toFixed(0)+' 音分（原約 '+(1200*Math.log2(F.stats(tr,0.6,2.0).p90/F.stats(tr,0.6,2.0).p10)).toFixed(0)+'）');
// 增強 + 手繪
const ed2 = E.create(tr); ed2.enhance(1.0, 0.3, 2.2); ed2.draw(1.0,330,1.4,330);
o = P.process([x], sr, {f0:tr, f0Target:ed2.edited});
cm=cmpOut(o[0], ed2.edited, 0.45, 2.05);
ok(cm.c.medianCents<20, '增強＋手繪：中位 '+cm.c.medianCents.toFixed(1)+'、P90 '+cm.c.p90Cents.toFixed(1)+' 音分');

// 5. 共振峰保留：+7 半音後頻譜包絡峰仍在 ~700 Hz 附近（把輸出頻譜在 500~1000 Hz 取最強處，與原音比）
function specPeak(sig, a, b){ // 以 Goertzel 掃 400~1500Hz，步進 10 Hz，取包絡（對諧波以 ±100Hz 平滑）
  const seg=sig.subarray(Math.round(a*sr),Math.round(b*sr)), N=seg.length, bins=[];
  for(let f=300;f<=1600;f+=10){ let re=0,im=0,w=2*Math.PI*f/sr; for(let i=0;i<N;i+=2){ const h=0.5-0.5*Math.cos(2*Math.PI*i/N); re+=seg[i]*h*Math.cos(w*i); im-=seg[i]*h*Math.sin(w*i);} bins.push([f,Math.hypot(re,im)]); }
  let bf=0,bv=-1; for(let i=0;i<bins.length;i++){ let s=0,c2=0; for(let j=Math.max(0,i-10);j<=Math.min(bins.length-1,i+10);j++){s+=bins[j][1];c2++;} if(s/c2>bv){bv=s/c2;bf=bins[i][0];} } return bf; }
const vo = specPeak(x,0.6,1.6); o = P.process([x], sr, {f0:tr, pitch:7}); const vn = specPeak(o[0],0.6,1.6);
console.log('  最強共振區：原音', vo,'Hz → +7 半音', vn,'Hz');
ok(Math.abs(vn-vo)<150, '共振峰保留（沒有跟著音高跑到 '+Math.round(vo*Math.pow(2,7/12))+' Hz）');

// 6. 立體聲：左 = x，右 = 0.5x → 比值 0.5，相位一致
o = P.process([x, x.map(v=>v*0.5)], sr, {f0:tr, pitch:3, tempo:1.2});
let dl=0; for(let i=0;i<o[0].length;i++) dl=Math.max(dl,Math.abs(o[1][i]-0.5*o[0][i]));
ok(dl<1e-5, '立體聲共用標記：右聲道 = 0.5×左聲道（最大差 '+dl.toExponential(1)+'）');

// 7. 無聲段（雜訊）不炸、無爆音：峰值不超過原峰值 1.5 倍
o = P.process([x], sr, {f0:tr, pitch:9, tempo:0.8});
let pk=0; for(const v of o[0]) pk=Math.max(pk,Math.abs(v));
ok(pk<0.5*1.5, '輸出峰值 '+pk.toFixed(3)+'（原 0.5）');
let nan=0; for(const v of o[0]) if(!isFinite(v)) nan++; ok(nan===0,'沒有 NaN/Inf');
// 爆音：相鄰取樣差在有聲段不應超過原訊號最大相鄰差的 2 倍
let md0=0,md1=0; for(let i=1;i<x.length;i++) md0=Math.max(md0,Math.abs(x[i]-x[i-1])); for(let i=1;i<o[0].length;i++) md1=Math.max(md1,Math.abs(o[0][i]-o[0][i-1]));
ok(md1<md0*2, '無爆音：最大相鄰差 '+md1.toFixed(3)+' vs 原 '+md0.toFixed(3));

// 8. 經由引擎分派 + 沒給 f0 時自行分析
const viaEngine = TP.process([x], sr, {mode:'psola', pitch:4, f0:tr});
ok(viaEngine[0].length===x.length, 'PKTimePitch.process(mode:psola) 分派成功');
const auto = TP.process([x.subarray(0, 2*sr)], sr, {mode:'psola', pitch:4});
const ca = cmpOut(auto[0], expectTrack(F.track([x.subarray(0,2*sr)],sr,{fmin:60,fmax:800}),1,Math.pow(2,4/12),2), 0.45, 1.9).c;
ok(ca.medianCents<20, '未提供 f0 → 自動分析：中位 '+ca.medianCents.toFixed(1)+' 音分');

// 9. trackOffset：只處理 1.0 秒之後的片段
const seg = x.subarray(Math.round(1.0*sr), Math.round(2.0*sr));
o = P.process([seg], sr, {f0:tr, pitch:5, trackOffset:1.0});
const segTr = F.track([seg],sr,{fmin:60,fmax:800}), sub={rate:tr.rate,n:100,f0:new Float32Array(100)};
for(let i=0;i<100;i++) sub.f0[i]=tr.f0[100+i];
const cs=cmpOut(o[0], expectTrack(sub,1,Math.pow(2,5/12),1), 0.1, 0.9).c;
ok(cs.medianCents<20, 'trackOffset=1.0：中位 '+cs.medianCents.toFixed(1)+' 音分');

// 10. 速度
const big = new Float32Array(sr*60); for(let i=0;i<big.length;i++) big[i]=x[i%x.length];
const bigTr = F.track([x],sr,{fmin:60,fmax:800}); // 重複用同軌跡 → 不精確但量速度；使用自動標記上限
t0=Date.now(); P.process([x],sr,{f0:tr,pitch:3,tempo:1.1}); const dt=Date.now()-t0;
console.log('  2.6 秒立體聲（單聲道）處理耗時', dt,'ms'); ok(dt<2000,'速度合理（2.6 秒音訊 '+dt+' ms）');

console.log(fail?'\n失敗 '+fail+' 項':'\n全部通過'); process.exit(fail?1:0);
