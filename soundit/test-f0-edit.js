global.self = global;
require('./timepitch-f0.js');
const E = require('./timepitch-f0-edit.js');
const F = self.PKF0;
let fail = 0;
function ok(c, m){ console.log((c?'PASS ':'FAIL ')+m); if(!c) fail++; }
const sr = 16000, rate = 100;

// 合成一條已知輪廓：0.2s 靜音，0.2~1.8s 有聲（200Hz 緩降到 160Hz，加 ±15 音分顫動），1.8~2s 靜音，2~3s 平 220Hz
function mkTrack(){
  const n = 300, f0 = new Float32Array(n), conf = new Float32Array(n).fill(1);
  for (let i=0;i<n;i++){
    const t = i/rate;
    if (t>=0.2 && t<1.8) f0[i] = 200*Math.pow(160/200,(t-0.2)/1.6)*Math.pow(2,(15*Math.sin(t*40))/1200);
    else if (t>=2.0) f0[i] = 220;
  }
  return {hop:sr/rate, rate, sr, n, f0, conf, fmin:60, fmax:800};
}
const tr = mkTrack();
const ed = E.create(tr);
const cents=(a,b)=>1200*Math.log2(a/b);

ok(!ed.dirty(), '新建後 dirty=false');
ok(ed.orig.f0 !== ed.edited.f0, 'edited.f0 與 orig.f0 是不同陣列');

// shift
const i = 75, before = ed.edited.f0[i];
const c1 = ed.shift(100, 0.5, 1.0);
ok(c1 === 50, 'shift 改動幀數 = 50（得 '+c1+'）');
ok(Math.abs(cents(ed.edited.f0[i], before)-100)<0.01, 'shift +100 音分精確');
ok(ed.edited.f0[10]===0 && ed.edited.f0[60]>0, 'shift 不動無聲幀');
ok(ed.orig.f0[i]===before, '原始軌跡不被改');
ok(ed.undo() && Math.abs(ed.edited.f0[i]-before)<1e-4, 'undo 還原');
ok(ed.redo() && Math.abs(cents(ed.edited.f0[i], before)-100)<0.01, 'redo 重做');
ed.undo();

// smooth：顫動的標準差應下降
function jitter(f0,a,b){ let s=0,c=0,p=null; for(let k=a;k<b;k++){ if(f0[k]>0&&f0[k-1]>0){ const d=cents(f0[k],f0[k-1]); s+=d*d;c++; } } return Math.sqrt(s/c); }
const j0 = jitter(ed.edited.f0, 25, 175);
ed.smooth(0.6, 0.2, 1.8);
const j1 = jitter(ed.edited.f0, 25, 175);
ok(j1 < j0*0.5, 'smooth 後幀間起伏下降（'+j0.toFixed(2)+' → '+j1.toFixed(2)+' 音分）');
ok(ed.edited.f0[10]===0 && ed.edited.f0[190]===0, 'smooth 不把無聲變有聲');
// 整體走向保留
ok(Math.abs(cents(ed.edited.f0[100], tr.f0[100]))<40, 'smooth 保留整體走向（偏 '+cents(ed.edited.f0[100],tr.f0[100]).toFixed(1)+' 音分）');
ed.undo();

// flatten 1.0：段內全部相同
ed.flatten(1, 0.2, 1.8);
let mn=1e9,mx=0; for(let k=20;k<180;k++){ mn=Math.min(mn,ed.edited.f0[k]); mx=Math.max(mx,ed.edited.f0[k]); }
ok(cents(mx,mn)<0.01, 'flatten 1.0 完全平（差 '+cents(mx,mn).toFixed(4)+' 音分）');
ed.undo();
// flatten 0.5 與 enhance：偏離量按比例
const mean = (a,b)=>{let m=0; for(let k=a;k<b;k++) m+=Math.log2(ed.edited.f0[k]); return m/(b-a);};
const m0 = mean(20,180), dev0 = Math.log2(ed.edited.f0[60])-m0;
ed.enhance(1, 0.2, 1.8);
const dev1 = Math.log2(ed.edited.f0[60])-mean(20,180);
ok(Math.abs(dev1/dev0-2)<1e-3, 'enhance 1.0 → 偏離放大 2 倍（'+(dev1/dev0).toFixed(4)+'）');
ok(Math.abs(mean(20,180)-m0)<1e-4, 'enhance 保持段平均不變');
ed.undo();
ed.flatten(0.5, 0.2, 1.8);
const dev2 = Math.log2(ed.edited.f0[60])-mean(20,180);
ok(Math.abs(dev2/dev0-0.5)<1e-3, 'flatten 0.5 → 偏離減半');
ed.undo();

// 有聲段分開：壓平範圍橫跨兩段，兩段各自平均
ed.flatten(1);
ok(Math.abs(ed.edited.f0[250]-220)<1e-3, '平的段（220）壓平後仍 220');
let mn2=1e9,mx2=0; for(let k=30;k<170;k++){mn2=Math.min(mn2,ed.edited.f0[k]);mx2=Math.max(mx2,ed.edited.f0[k]);}
ok(cents(mx2,mn2)<0.01 && ed.edited.f0[190]===0, '兩段分別壓平，段間靜音保持');
ed.undo();
ok(!ed.dirty(), '全部 undo 後 dirty=false');

// draw：只改有聲幀，且連續筆畫合併成一次 undo
ed.beginStroke();
let c2=0; c2+=ed.draw(0.3,300,0.5,300); c2+=ed.draw(0.5,300,0.9,350); c2+=ed.draw(0.1,500,0.19,500);
ed.endStroke();
ok(c2>0, '手繪有改動 '+c2+' 幀');
ok(ed.edited.f0[10]===0 && ed.edited.f0[15]===0, '手繪不寫入無聲幀');
ok(Math.abs(ed.edited.f0[40]-300)<0.01, '手繪值正確');
ok(Math.abs(cents(ed.edited.f0[70],Math.pow(2,Math.log2(300)+(Math.log2(350/300))*(70-50)/40)))<0.01,'手繪斜線內插（對數域）');
ok(ed.undo() && !ed.dirty(), '整個筆畫一次 undo 完全還原');
ok(ed.draw(0.1,500,0.19,500)===0 && !ed.canUndo(), '沒改動不進復原記錄');

// reset 也能 undo
ed.shift(300);
ok(ed.reset() && !ed.dirty(), 'reset 還原原始');
ok(ed.undo() && ed.dirty(), 'reset 可復原');
ed.reset(); 

// 無效參數
ok(ed.shift(0)===0 && ed.smooth(0)===0 && ed.draw(0,0,1,100)===0, '無效參數不改動');
ok(E.create(tr).shift(50, 5, 6)===0, '範圍在軌跡外 → 0');

// 歷史上限
const e2 = E.create(tr); for(let k=0;k<60;k++) e2.shift(10); let u=0; while(e2.undo()) u++;
ok(u===40, '復原記錄上限 40（得 '+u+'）');

// ---- 寫回再偵測驗證：編輯 → 合成 → PKF0.track → 比對 ----
const e3 = E.create(tr);
e3.smooth(0.7); e3.shift(-300, 0.2, 1.8);
const wav = E.synth(e3.edited, sr);
ok(Math.abs(wav.length - tr.n/rate*sr) <= 1, '合成長度正確');
const re = F.track([wav], sr, {fmin:60,fmax:800});
const cmp = E.compare(e3.edited, re, 0.3, 1.7);
console.log('  再偵測比對', JSON.stringify(cmp));
ok(cmp.n>100 && cmp.medianCents<5 && cmp.p90Cents<25, '再偵測與編輯目標：中位 '+cmp.medianCents.toFixed(2)+' 音分，P90 '+cmp.p90Cents.toFixed(2));
// 與「未編輯」比對應明顯不同（移了 -300 音分）
const cmp0 = E.compare(tr, re, 0.3, 1.7);
ok(cmp0.medianCents>250, '與原始輪廓差約 300 音分（'+cmp0.medianCents.toFixed(1)+'）— 證明驗證能分辨');
// 手繪成大幅 +7 半音再驗證
const e4 = E.create(tr); e4.draw(0.4,320,1.4,400);
const re4 = F.track([E.synth(e4.edited, sr)], sr, {fmin:60,fmax:800});
const c4 = E.compare(e4.edited, re4, 0.45, 1.35);
ok(c4.medianCents<5, '手繪輪廓再偵測：中位 '+c4.medianCents.toFixed(2)+' 音分');
console.log(fail? '\n失敗 '+fail+' 項':'\n全部通過'); process.exit(fail?1:0);
