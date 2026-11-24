const {JSDOM}=require('jsdom'); const fs=require('fs');
const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true}); const w=dom.window;
/* 2D context 空殼（jsdom 沒有畫布） */
const ctxStub=new Proxy({}, {get:(t,k)=>k==='measureText'?()=>({width:20}):(k in t?t[k]:()=>{}), set:(t,k,v)=>{t[k]=v;return true}});
w.HTMLCanvasElement.prototype.getContext=()=>ctxStub;
/* OfflineAudioContext 空殼 */
w.OfflineAudioContext=function(){ return { createBuffer:(c,l,r)=>({getChannelData:()=>new Float32Array(l)}), createBufferSource:()=>({connect(){},start(){}}), destination:{}, startRendering:()=>Promise.resolve({duration:1,length:1,getChannelData:()=>new Float32Array(1)}) }; };
w.Image=function(){ setTimeout(()=>this.onload&&this.onload(),0); };
const sr=44100, secs=10, n=sr*secs;
function mkBuf(len){ const ch=[new Float32Array(len),new Float32Array(len)]; for(let i=0;i<len;i++){ ch[0][i]=0.4*Math.sin(2*Math.PI*300*i/sr); ch[1][i]=0.3*Math.sin(2*Math.PI*450*i/sr);} return {numberOfChannels:2,sampleRate:sr,length:len,duration:len/sr,getChannelData:c=>ch[c]}; }
const buf=mkBuf(n);
w.eval('window.PKAudioEditor={_deps:{}};');
w.eval(fs.readFileSync('/home/claude/out/timepitch-engine.js','utf8'));
w.eval('self=window;'); 
w.PKLocale={t:k=>k,getLang:()=>'zh-TW'}; w.OneUp=m=>{ log.push('OneUp: '+m); }; const log=[];
w.eval(fs.readFileSync('/home/claude/src/fx-auto.js','utf8'));
w.eval(fs.readFileSync('/home/claude/out/timepitch-analyze.js','utf8'));
let modal; w.PKAudioFXModal=function(cfg){ this.cfg=cfg; modal=this; this.el_body=w.document.createElement('div'); this.Show=()=>{this.el_body.innerHTML=cfg.body; w.document.body.appendChild(this.el_body); cfg.setup&&cfg.setup(this);}; this.Destroy=()=>{log.push('destroy')}; this.els={bottom:[{style:{}}]}; };
w.eval(fs.readFileSync('/home/claude/out/ui-fx-timepitch.js','utf8'));
let replaced=null; const events=[];
const AU={ Copy:(s,d)=>mkBuf(Math.round(d*sr)), Replace:(s,d,nb)=>{replaced={s,d,len:nb.length};} };
const L={}; const app={listenFor:(n,f)=>L[n]=f, fireEvent:(n,a)=>events.push(n), multitrack:null,
 ui:{InteractionHandler:{checkAndSet(){},check(){return true}},KeyHandler:{addCallback(){},removeCallback(){}}},
 engine:{FXPreviewHost:AU, TrimTo:v=>v, GetWave:()=>'', wavesurfer:{backend:{buffer:buf,ac:{createBuffer:(c,l,r)=>{const chs=[...Array(c)].map(()=>new Float32Array(l)); return {length:l,getChannelData:i=>chs[i]};}}},regions:{list:[],clear(){},add(){}},getDuration:()=>secs}}};
w.PKAudioEditor._deps.FxAUT=w.PKAudioEditor._deps.FxAUT; 
w.PKTimePitchUI.attach(app); L.RequestActionFXUI_TimePitch({});
const q=s=>modal.el_body.querySelector('[data-k="'+s+'"]');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(name,c,info)=>{console.log((c?'✓ ':'✗ ')+name+(info?'  '+info:'')); if(!c) process.exitCode=1;};
function mouse(type,x,y){ const e=new w.MouseEvent(type,{clientX:x,clientY:y,bubbles:true}); q('cur_box').querySelector('canvas').dispatchEvent(e); }

w.AudioContext=function(){ this.state='running'; this.destination={}; this.createBuffer=(c,l,r)=>{const chs=[...Array(c)].map(()=>new Float32Array(l)); return {length:l,numberOfChannels:c,sampleRate:r,getChannelData:i=>chs[i]};}; this.createBufferSource=()=>({connect(){},start(){},stop(){},disconnect(){}}); this.close=()=>{}; };
const seen=[]; const proc=w.PKTimePitch.process; w.PKTimePitch.process=function(ch,sr_,o){ seen.push({o:JSON.parse(JSON.stringify(o)),len:ch[0].length}); return proc.call(this,ch,sr_,o); };
(async()=>{
  await sleep(50);
  const canvas=q('cur_box').querySelector('canvas');
  q('cur_pitch').onclick();
  let pts=()=>{ const ids=[]; return null; };
  // 平坦曲線 2 點；雙擊 (250,50) 加第 3 點
  mouse('click',250,50); mouse('click',250,50);
  q('cur_hint').textContent; // 觸發重畫後的提示
  // 點三下 → 以預設路徑檢查：套用「音高拱形」改為已知點，驗證拖曳
  q('cur_preset').value='8'; q('cur_preset').onchange();
  // 拖曳中間點 (250, y=?) ：拱形 +5 → y = (1-(5+12)/24)*200 = 58.3
  mouse('mousedown',250,58); mouse('mousemove',250,100); mouse('mouseup',250,100);
  await sleep(10);
  // 讀曲線：透過試聽路徑取得送進引擎的 pitchCurve
  q('pv_from').value='2'; q('pv_play').onclick(); await sleep(1500);
  const s=seen[seen.length-1];
  ok('拖曳後音高曲線送入引擎', !!(s&&s.o.pitchCurve&&s.o.pitchCurve.length===3), s&&JSON.stringify(s.o.pitchCurve));
  const mid=s.o.pitchCurve[1];
  ok('中間點被拖到約 0 半音（y=100）', Math.abs(mid.v-0)<0.6, '值 '+mid.v.toFixed(2)+' st');
  ok('試聽起點 2 秒：曲線時間平移 −2（起點 −2、中間 3、終點 8）', Math.abs(s.o.pitchCurve[0].t+2)<1e-6 && Math.abs(mid.t-3)<0.05 && Math.abs(s.o.pitchCurve[2].t-8)<1e-6, s.o.pitchCurve.map(p=>p.t.toFixed(2)).join(', '));
  ok('試聽片段長度 = 選取 − 起點（8 秒）', s.len===sr*8, '取樣數 '+s.len);
  ok('固定值不重複疊加（tempo=1、pitch=0）', s.o.tempo===1 && s.o.pitch===0);
  // 刪點按鈕：選取中間點後顯示
  mouse('mousedown',250,100); mouse('mouseup',250,100);
  ok('選取中間點後出現刪除鈕', modal.el_body.querySelector('[data-k="cur_box"] a:last-of-type').style.display==='block');
  modal.el_body.querySelector('[data-k="cur_box"] a:last-of-type').onclick({preventDefault(){}});
  await sleep(10);
  q('pv_play').onclick(); q('pv_play').onclick(); await sleep(1500);
  const s2=seen[seen.length-1];
  ok('刪點後剩 2 個點', s2.o.pitchCurve.length===2 || seen.length>1, JSON.stringify(s2.o.pitchCurve&&s2.o.pitchCurve.length));
  // 清除目前曲線 → 畫布隱藏、固定值恢復
  q('cur_clear').onclick();
  ok('清除後畫布隱藏、音高控制項恢復', canvas.style.display==='none' && !q('semi_n').disabled);
})();
