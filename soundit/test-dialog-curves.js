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
(async()=>{
  await sleep(50);
  const canvas=q('cur_box').querySelector('canvas');
  ok('曲線畫布已放進對話框', !!canvas && canvas.style.display==='none', '初始隱藏');
  // 1) 開啟速度曲線 → 建立平坦兩點
  q('cur_tempo').onclick();
  const A=()=>{ const ids=Object.keys(modal._auto||{}); return null; };
  ok('開啟速度曲線後畫布顯示', canvas.style.display==='block', '提示：'+q('cur_hint').textContent);
  ok('速度固定值控制項已停用', q('tempo_n').disabled && q('len_n').disabled && q('bpm_to').disabled);
  // 2) 在畫布上雙擊加點：位置 x=250（中間）、y=50（約 ln→高速）
  mouse('click',250,50); mouse('click',250,50);
  // 3) 套用預設「漸慢」
  q('cur_preset').value='2'; q('cur_preset').onchange();
  await sleep(20);
  ok('套用「漸慢 100%→60%」後長度預估', /→/.test(q('len_info').textContent), q('len_info').textContent);
  const exp=(()=>{ // ∫ du / T(u)，T 對數線性 1→0.6
    let a=0,N=20000; for(let i=0;i<N;i++){ const f=(i+.5)/N; a+=secs/N/Math.exp(Math.log(0.6)*f); } return a; })();
  ok('預估長度與數值積分一致', Math.abs(parseFloat(q('len_n').value)-exp)<0.01, q('len_n').value+' 預期 '+exp.toFixed(3));
  // 4) 音高曲線預設
  q('cur_preset').value='8'; q('cur_preset').onchange(); await sleep(20);
  ok('速度＋音高曲線同時存在', q('semi_n').disabled && q('tempo_n').disabled, q('info').textContent);
  // 5) 磁帶停止：連動、音高曲線被清掉
  q('cur_preset').value='4'; q('cur_preset').onchange(); await sleep(20);
  ok('磁帶停止：連動且音高曲線停用', q('link').value==='1' && q('cur_hint').textContent.length>0, q('cur_hint').textContent);
  // 6) 磁帶停止＋音高滑升：切回獨立
  q('cur_preset').value='6'; q('cur_preset').onchange(); await sleep(20);
  ok('套用音高滑升後回到獨立模式', q('link').value==='0');
  // 7) 套用（主執行緒後備路徑，因 jsdom 無 Worker）
  const applyBtn=modal.cfg.buttons[0]; applyBtn.callback(modal);
  await sleep(4000);
  const expApply=8+2*(4-1)/Math.log(4);   // 磁帶停止的速度曲線：前 8 秒 1×，後 2 秒對數線性 1→0.25
  ok('套用完成並替換音訊', !!replaced, replaced? '長度 '+(replaced.len/sr).toFixed(3)+' 秒（原 '+secs+' 秒）':'');
  ok('套用後長度與曲線預估一致', replaced && Math.abs(replaced.len/sr-expApply)<0.01, '預期 '+expApply.toFixed(3));
  console.log('事件記錄:', events.join(', '));
  console.log('其他記錄:', log.join(' | '));
})();
