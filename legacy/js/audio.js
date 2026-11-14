import {state,bus,set} from './state.js';
import {levelToGain} from './physics.js';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const TWO_PI=Math.PI*2;
let ctx=null,master=null,limiter=null,voice=null,voiceType=null,shadow=null,shadowOut=null;
let speaking=false,utter=null,running=false,lastT=0,speechT=0,basePitch=1;

export const audio={analyser:null,init,playTone,stop,speak,cancelSpeak,voices,getWaveform,getSpectrum};

function init(){
 if(ctx){if(ctx.state==='suspended')ctx.resume().catch(()=>{});return true;}
 try{
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)throw new Error('no WebAudio');
  ctx=new AC();
  master=ctx.createGain();master.gain.value=0;
  limiter=ctx.createDynamicsCompressor();
  limiter.threshold.value=-6;limiter.knee.value=0;limiter.ratio.value=20;limiter.attack.value=0.003;limiter.release.value=0.1;
  const an=ctx.createAnalyser();an.fftSize=2048;an.smoothingTimeConstant=0.6;
  master.connect(limiter);limiter.connect(ctx.destination);limiter.connect(an);
  audio.analyser=an;
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return true;
 }catch(e){console.warn('Audio init failed',e);ctx=null;master=null;limiter=null;audio.analyser=null;return false;}
}

function capFactor(f){return f>16000?0.35:1;}
function updateMaster(){
 if(!ctx||!master)return;
 const g=state.muted?0:state.volume*levelToGain(state.level)*capFactor(state.frequency);
 master.gain.setTargetAtTime(g,ctx.currentTime,0.015);
}

function makeVoice(type,dest,f){
 const c=ctx,out=c.createGain();out.gain.value=0;out.connect(dest);
 const nodes=[];let setF;
 const trim={sine:0.6,voice:0.55,rich:0.3}[type]||0.5;
 const mk=(t,fr)=>{const o=c.createOscillator();o.type=t;o.frequency.value=fr;nodes.push(o);return o;};
 if(type==='voice'){
  const o=mk('sawtooth',f);
  [[800,1,8],[1150,0.7,10],[2900,0.4,12],[3900,0.2,12]].forEach(([fc,g,q])=>{
   const b=c.createBiquadFilter();b.type='bandpass';b.frequency.value=fc;b.Q.value=q;
   const gg=c.createGain();gg.gain.value=g*3;
   o.connect(b);b.connect(gg);gg.connect(out);
  });
  setF=x=>o.frequency.setTargetAtTime(x,c.currentTime,0.01);
 }else if(type==='rich'){
  const hs=[];
  for(let n=1;n<=8;n++){const o=mk('sine',f*n),g=c.createGain();g.gain.value=1/n;o.connect(g);g.connect(out);hs.push([n,o,g]);}
  const lim=Math.min(20000,c.sampleRate/2*0.95);
  setF=x=>{for(const [n,o,g] of hs){o.frequency.setTargetAtTime(Math.min(n*x,lim),c.currentTime,0.01);g.gain.setTargetAtTime(n*x<lim?1/n:0,c.currentTime,0.01);}};
  setF(f);
 }else{
  const o=mk('sine',f);o.connect(out);
  setF=x=>o.frequency.setTargetAtTime(x,c.currentTime,0.01);
 }
 nodes.forEach(o=>o.start());
 out.gain.setTargetAtTime(trim,c.currentTime,0.013);
 return {setF,stop(){
  try{out.gain.setTargetAtTime(0,c.currentTime,0.013);}catch(e){}
  setTimeout(()=>{nodes.forEach(o=>{try{o.stop();}catch(e){}});try{out.disconnect();}catch(e){}},160);
 }};
}

function stopVoice(){if(voice){voice.stop();voice=null;voiceType=null;}}

function sync(){
 if(state.source==='tone'&&speaking)cancelSpeak();
 const wantTone=state.playing&&state.source==='tone';
 if(wantTone){
  if(init()){
   if(!voice||voiceType!==state.timbre){
    stopVoice();
    try{voiceType=state.timbre;voice=makeVoice(voiceType,master,state.frequency);}catch(e){console.warn('voice failed',e);voice=null;voiceType=null;}
   }else{voice.setF(state.frequency);}
   if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});
  }
 }else{
  stopVoice();
  if(state.source==='speech'&&!speaking&&state.playing)set('playing',false);
 }
 updateMaster();
 kick();
}

function kick(){if(!running){running=true;lastT=performance.now();requestAnimationFrame(tick);}}

function tick(now){
 const dt=Math.min(0.1,Math.max(0,(now-lastT)/1000));lastT=now;
 const L=state.live;
 const tone=state.playing&&state.source==='tone';
 const sounding=tone||speaking;
 let target=sounding?1:0,rate=1/0.35;
 if(speaking){
  speechT+=dt;const s=speechT;
  const syl=0.5+0.5*Math.sin(TWO_PI*4.2*s);
  const phrase=0.65+0.35*Math.sin(TWO_PI*0.45*s+1);
  target=0.1+0.9*Math.pow(syl,0.8)*phrase;
  if(s>0.35)rate=1/0.07;
  L.frequency=clamp(basePitch*(185+55*Math.sin(TWO_PI*0.55*s)+18*Math.sin(TWO_PI*2.1*s+0.7)),110,260);
 }else if(tone){L.frequency=state.frequency;}
 if(sounding)L.level=state.level;
 const d=target-L.env,st=rate*dt;
 L.env=Math.abs(d)<=st?target:L.env+Math.sign(d)*st;
 const act=sounding||L.env>0;
 if(act!==L.active){L.active=act;bus.emit('change',{key:'live',value:L});}
 if(speaking&&ctx&&audio.analyser){
  try{
   if(!shadow){shadowOut=ctx.createGain();shadowOut.connect(audio.analyser);shadow=makeVoice('voice',shadowOut,L.frequency);}
   shadow.setF(L.frequency);shadowOut.gain.value=L.env*0.6;
  }catch(e){shadow=null;}
 }else if(shadow){
  shadow.stop();shadow=null;
  if(shadowOut){shadowOut.gain.value=0;try{shadowOut.disconnect();}catch(e){}shadowOut=null;}
 }
 if(act)requestAnimationFrame(tick);else running=false;
}

function playTone(){
 init();
 if(speaking)cancelSpeak();
 if(state.source!=='tone')set('source','tone');
 set('playing',true);
}

function stop(){
 cancelSpeak();
 set('playing',false);
}

function voices(){
 try{
  if(!('speechSynthesis' in window))return [];
  const isVi=v=>(v.lang||'').toLowerCase().startsWith('vi');
  return speechSynthesis.getVoices().slice().sort((a,b)=>(isVi(b)?1:0)-(isVi(a)?1:0));
 }catch(e){return [];}
}

function speak(text,opts={}){
 if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
  bus.emit('toast',{text:'Trình duyệt này không hỗ trợ đọc văn bản thành giọng nói.',kind:'warn'});
  return false;
 }
 try{
  init();
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(String(text||''));
  u.lang='vi-VN';u.rate=opts.rate||1;u.pitch=opts.pitch||1;
  u.volume=state.muted?0:clamp(state.volume,0,1);
  const vs=voices();
  const v=(opts.voiceURI&&vs.find(x=>x.voiceURI===opts.voiceURI))||vs.find(x=>(x.lang||'').toLowerCase().startsWith('vi'));
  if(v){u.voice=v;u.lang=v.lang;}
  basePitch=clamp(opts.pitch||1,0.6,1.4);
  utter=u;speaking=true;speechT=0;
  const done=()=>{if(u!==utter)return;speaking=false;utter=null;set('playing',false);kick();};
  u.onend=done;u.onerror=done;
  if(state.source!=='speech')set('source','speech');
  set('playing',true);
  speechSynthesis.speak(u);
  kick();
  return true;
 }catch(e){console.warn('speak failed',e);speaking=false;utter=null;return false;}
}

function cancelSpeak(){
 if(!speaking&&!utter)return;
 utter=null;speaking=false;
 try{speechSynthesis.cancel();}catch(e){}
 if(state.source==='speech'&&state.playing)set('playing',false);
 kick();
}

function getWaveform(arr){if(audio.analyser&&arr)audio.analyser.getFloatTimeDomainData(arr);else if(arr)arr.fill(0);return arr;}
function getSpectrum(arr){if(audio.analyser&&arr)audio.analyser.getByteFrequencyData(arr);else if(arr)arr.fill(0);return arr;}

const WATCH=new Set(['frequency','level','timbre','volume','muted','source','playing']);
bus.on('change',e=>{if(e&&WATCH.has(e.key))sync();});
