import {state,bus,set} from './state.js';
import {waveParams,describePitch,SPEED} from './physics.js';
import {audio} from './audio.js';
import {api} from './api.js';
import {startOnboarding} from './onboarding.js';

/* Tên hiển thị – sửa ở đây nếu cần */
export const APP_TITLE='Thí nghiệm mô phỏng sóng âm';
export const SCHOOL='Trường THPT Trần Quốc Toản (Đồng Tháp)';

const PATHS={
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><path d="M12 17.5h.01"/>',
  book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>',
  route:'<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  shot:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  vol:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  mute:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  play:'<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>',
  pause:'<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  mouth:'<path d="M3 12c3-4 6-5 9-3 3-2 6-1 9 3-3 4-6 5-9 5s-6-1-9-5z"/><path d="M3 12h18"/>',
  speaker:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="14.5" r="3.5"/><circle cx="12" cy="6.8" r="1.3"/>',
  sine:'<path d="M2 12c2.5-7 5-7 7.5 0s5 7 7.5 0 3.5-5 5-3"/>',
  voice:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M17 7a4 4 0 0 1 0 6M19.5 4.5a8 8 0 0 1 0 11"/>',
  music:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  text:'<path d="M4 7V5h16v2M12 5v14M9 19h6"/>',
  freq:'<path d="M2 12h2l2-6 3 12 3-12 3 12 3-12 2 6h2"/>',
  level:'<path d="M5 20v-4M10 20v-8M15 20v-12M20 20V4"/>',
  slow:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  medium:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  dots:'<circle cx="5" cy="7" r="1.6" fill="currentColor"/><circle cx="12" cy="7" r="1.6" fill="currentColor"/><circle cx="19" cy="7" r="1.6" fill="currentColor"/><circle cx="7" cy="13" r="1.6" fill="currentColor"/><circle cx="14" cy="13" r="1.6" fill="currentColor"/><circle cx="5" cy="19" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/><circle cx="19" cy="17" r="1.6" fill="currentColor"/>',
  slice:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  marker:'<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M3 12h3M18 12h3M5 9l-2 3 2 3M19 9l2 3-2 3"/>',
  ruler:'<rect x="2" y="7" width="20" height="10" rx="1.5"/><path d="M6 7v4M10 7v3M14 7v4M18 7v3"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  flow:'<path d="M3 12h15M14 7l5 5-5 5"/>',
  cut:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1L20 20M8.1 15.9L20 4"/>',
  room:'<path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',
  ear:'<path d="M6 9a6 6 0 1 1 12 0c0 3-2 4.5-3 6s-1 4-4 4a3 3 0 0 1-3-3"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2 3"/>',
  cam:'<rect x="2" y="7" width="14" height="10" rx="2"/><path d="M16 11l6-3v8l-6-3z"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 16l9 5 9-5"/>',
  sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  reset:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
};
function icon(name,size=20,cls=''){
  const s=document.createElement('span');
  s.className='ico '+cls;
  s.innerHTML='<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(PATHS[name]||'')+'</svg>';
  return s;
}
function h(tag,props,...kids){
  const e=document.createElement(tag);
  if(props)for(const k in props){
    const v=props[k];
    if(v==null||v===false)continue;
    if(k==='class')e.className=v;
    else if(k==='text')e.textContent=v;
    else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);
    else e.setAttribute(k,v===true?'':v);
  }
  for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(c));}
  return e;
}
const call=f=>{try{const r=f();if(r&&typeof r.catch==='function')r.catch(e=>console.warn(e));}catch(e){console.warn(e);}};
const raf=f=>window.requestAnimationFrame?window.requestAnimationFrame(f):setTimeout(f,50);

let syncs=[];
const bind=f=>{syncs.push(f);};
const IGNORE=new Set(['t','dt','live','earDrive','hover']);
function syncAll(){for(const f of syncs){try{f();}catch(e){console.warn('UI sync',e);}}}

const group=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
function num(x,d=3){
  if(!isFinite(x))return '–';
  if(Math.abs(x)>=1000)return group(x);
  if(Math.abs(x)>=100)return String(Math.round(x));
  return String(Number(x.toPrecision(d))).replace('.',',');
}
const lenParts=m=>m>=1?[num(m),'m']:m>=0.01?[num(m*100),'cm']:[num(m*1000),'mm'];
const timeParts=T=>T>=1?[num(T),'s']:T>=0.001?[num(T*1000),'ms']:[num(T*1e6),'µs'];

function chip(content,isOn,onClick,cls,title){
  const b=h('button',{type:'button',class:'chip '+(cls||''),'aria-pressed':'false',onclick:onClick,title:title||null},content);
  bind(()=>b.setAttribute('aria-pressed',String(!!isOn())));
  return b;
}
function toggle(ic,label,get,set_,id){
  const b=h('button',{type:'button',class:'tg',id,'aria-pressed':'false',title:label,onclick:()=>set_(!get())},icon(ic,18),h('span',{text:label}));
  bind(()=>b.setAttribute('aria-pressed',String(!!get())));
  return b;
}
function slider({id,min,max,step,label,pos,apply}){
  const i=h('input',{type:'range',id,min,max,step:step||1,'aria-label':label});
  const paint=()=>i.style.setProperty('--p',((+i.value-min)/(max-min)*100)+'%');
  i.value=String(pos());paint();
  i.addEventListener('input',()=>{paint();apply(+i.value);});
  bind(()=>{if(document.activeElement===i)return;const p=String(pos());if(i.value!==p){i.value=p;paint();}});
  return i;
}
const lab=(ic,text,valEl)=>h('div',{class:'lab'},h('span',{class:'ic'},icon(ic,15),text),valEl||null);

const DEFAULTS={emitter:'speaker',frequency:440,level:60,timbre:'sine',source:'tone',medium:'air',slow:0.005,spreading:'sphere',particleMode:'slab',earExplode:0,earCut:true,earUnroll:0,quality:'auto',volume:0.8,muted:false};
function resetDefaults(){
  for(const k in DEFAULTS)set(k,DEFAULTS[k]);
  set('layers',{particles:true,slice:true,markers:true,ruler:true,labels:true,flow:true});
}
const ROOM_CAMS=[['overview','Toàn cảnh'],['speaker','Nguồn âm'],['path','Đường truyền'],['head','Tai nghe']];
const EAR_CAMS=[['overview','Toàn cảnh'],['canal','Ống tai'],['drum','Màng nhĩ'],['ossicles','Xương con'],['cochlea','Ốc tai'],['nerve','Thần kinh']];

export function mountUI(root){
  root=root||document.getElementById('ui-root')||document.body;
  syncs=[];root.textContent='';
  let overlay=document.getElementById('overlay-root');
  if(!overlay){overlay=h('div',{id:'overlay-root'});document.body.append(overlay);}
  const mq=window.matchMedia?window.matchMedia('(max-width: 819px)'):{matches:false};

  /* ---------- header ---------- */
  const tb=(id,ic,label,fn,cls)=>h('button',{type:'button',id,class:'tbtn '+(cls||''),'aria-label':label,title:label,onclick:fn},icon(ic,20));
  const btnMute=tb('btn-mute','vol','Tắt tiếng',()=>set('muted',!state.muted));
  const btnFull=tb('btn-fullscreen','full','Toàn màn hình',()=>{
    try{
      const d=document.documentElement;
      if(document.fullscreenElement||document.webkitFullscreenElement)(document.exitFullscreen||document.webkitExitFullscreen).call(document);
      else if(d.requestFullscreen)d.requestFullscreen();
      else if(d.webkitRequestFullscreen)d.webkitRequestFullscreen();
    }catch(e){console.warn(e);}
  });
  const btnLearn=tb('btn-learn','book','Bài học',()=>openSide('learn'),'desk');
  const btnTour=tb('btn-tour','route','Hành trình 9 bước',()=>openSide('tour'),'desk');
  const btnSet=tb('btn-settings','gear','Cài đặt',()=>openSide('sim'));
  const tools=h('div',{id:'tools',class:'panel brk'},
    tb('btn-help','help','Hướng dẫn sử dụng',()=>call(()=>startOnboarding({force:true}))),
    btnLearn,btnTour,btnMute,btnFull,tb('btn-shot','shot','Chụp ảnh màn hình',()=>call(()=>api.screenshot()),'desk'),btnSet);
  bind(()=>{
    const m=!!state.muted;
    btnMute.setAttribute('aria-pressed',String(m));
    btnMute.title=m?'Bật tiếng':'Tắt tiếng';btnMute.setAttribute('aria-label',btnMute.title);
    btnMute.replaceChildren(icon(m?'mute':'vol',20));
  });
  document.addEventListener('fullscreenchange',()=>btnFull.setAttribute('aria-pressed',String(!!document.fullscreenElement)));
  const title=h('div',{id:'title'},h('h1',{text:APP_TITLE}));
  const school=h('div',{id:'school',text:SCHOOL});

  /* ---------- bảng điều khiển ---------- */
  // Nhóm 1: nguồn âm
  const viewSeg=h('div',{id:'btn-view',class:'seg',role:'group','aria-label':'Chế độ xem'},
    [['room','room','Phòng nghe'],['ear','ear','Bên trong tai']].map(([v,ic,t])=>{
      const b=h('button',{type:'button','aria-pressed':'false',onclick:()=>call(()=>api.setView(v))},icon(ic,16),t);
      bind(()=>b.setAttribute('aria-pressed',String(state.view===v)));return b;
    }));
  const emitChips=h('div',{class:'chips g2'},
    chip([icon('speaker',17),'Loa'],()=>state.emitter!=='mouth',()=>set('emitter','speaker')),
    chip([icon('mouth',17),'Miệng người'],()=>state.emitter==='mouth',()=>set('emitter','mouth')));
  const TIMBRES=[['sine','sine','Âm đơn'],['voice','voice','Giọng nói'],['rich','music','Họa âm'],['speech','text','Đọc chữ']];
  const timbreChips=h('div',{class:'chips g4'},TIMBRES.map(([v,ic,t])=>chip([icon(ic,17),t],
    ()=>v==='speech'?state.source==='speech':(state.source!=='speech'&&state.timbre===v),
    ()=>{if(v==='speech')set('source','speech');else{set('source','tone');set('timbre',v);}},'v',t)));
  const speechOK='speechSynthesis' in window;
  const ta=h('input',{type:'text',id:'ctl-text',class:'field',maxlength:300,placeholder:'Gõ câu cần đọc…','aria-label':'Văn bản để đọc'});
  let rate=1;
  const speakBtn=h('button',{type:'button',id:'btn-speak',class:'btn primary',onclick:()=>{
    const text=ta.value.trim();if(!text){ta.focus();return;}
    call(()=>api.speak(text,{rate,pitch:1,voiceURI:voiceSel.value||undefined}));
  }},'Đọc');
  const stopBtn=h('button',{type:'button',id:'btn-stopspeak',class:'btn',onclick:()=>call(()=>api.stopSpeak())},'Dừng');
  ta.addEventListener('keydown',e=>{if(e.key==='Enter')speakBtn.click();});
  const speakRow=h('div',{class:'speak-row'},ta,speakBtn,stopBtn);
  if(!speechOK){[ta,speakBtn,stopBtn].forEach(e=>{e.disabled=true;});ta.placeholder='Trình duyệt chưa hỗ trợ đọc chữ';}
  bind(()=>{speakRow.hidden=state.source!=='speech';});
  const gSrc=h('section',{class:'grp','data-grp':'src'},
    viewSeg,
    h('h2',{class:'grp-h',text:'Nguồn âm'}),emitChips,timbreChips,speakRow);

  // Nhóm 2: đại lượng sóng
  const FMIN=20,FMAX=20000,RATIO=FMAX/FMIN;
  const fVal=h('span',{class:'val'});
  const warnF=h('span',{class:'warnchip',role:'status',text:'Ngoài ngưỡng nghe (20 Hz – 20 kHz)',hidden:true});
  bind(()=>{
    let p={label:''};try{p=describePitch(state.frequency)||p;}catch(e){}
    fVal.replaceChildren(num(state.frequency)+' Hz',h('small',{text:p.label||''}));
    warnF.hidden=!(state.frequency<20||state.frequency>20000);
  });
  const fChips=h('div',{class:'chips'},[100,262,440,1000,4000].map(v=>chip(String(v),()=>state.frequency===v,()=>set('frequency',v),'sm')));
  const lVal=h('span',{class:'val'});
  const safety=h('span',{class:'warnchip',role:'status',hidden:true,text:'Trên 85 dB: nghe lâu có hại cho tai'});
  bind(()=>{lVal.textContent=Math.round(state.level)+' dB';safety.hidden=!(state.level>85);});
  const SMIN=0.001,SRATIO=50;
  const sVal=h('span',{class:'val'});
  bind(()=>{sVal.textContent='×'+group(1/state.slow);});
  const gWave=h('section',{class:'grp','data-grp':'wave'},
    h('h2',{class:'grp-h',text:'Điều chỉnh sóng'}),
    lab('freq','Tần số f',fVal),
    slider({id:'ctl-frequency',min:0,max:1000,step:1,label:'Tần số',
      pos:()=>Math.round(Math.max(0,Math.min(1000,1000*Math.log(Math.max(state.frequency,1)/FMIN)/Math.log(RATIO)))),
      apply:p=>{const f=FMIN*Math.pow(RATIO,p/1000);set('frequency',f<100?Math.round(f*10)/10:Math.round(f));}}),
    fChips,warnF,
    lab('level','Độ to',lVal),
    slider({id:'ctl-level',min:20,max:100,step:1,label:'Độ to (dB)',pos:()=>state.level,apply:v=>set('level',v)}),safety,
    lab('medium','Môi trường truyền âm'),
    h('div',{class:'chips g3'},[['air','Không khí'],['water','Nước'],['steel','Thép']].map(([v,l])=>
      chip([h('span',{text:l}),h('small',{text:SPEED[v]+' m/s'})],()=>state.medium===v,()=>set('medium',v),'v'))),
    lab('slow','Làm chậm',sVal),
    slider({id:'ctl-slow',min:0,max:1000,step:1,label:'Làm chậm',
      pos:()=>Math.round(Math.max(0,Math.min(1000,1000*Math.log(state.slow/SMIN)/Math.log(SRATIO)))),
      apply:p=>set('slow',Number((SMIN*Math.pow(SRATIO,p/1000)).toFixed(5)))}));

  // Nhóm 3: hiển thị + camera
  const L=k=>()=>state.layers[k];
  const SL=k=>v=>set('layers',{...state.layers,[k]:v});
  const roomToggles=h('div',{class:'chips g4'},
    toggle('dots','Phần tử',L('particles'),SL('particles'),'ctl-layer-particles'),
    toggle('marker','Đánh dấu',L('markers'),SL('markers'),'ctl-layer-markers'),
    toggle('slice','Áp suất',L('slice'),SL('slice'),'ctl-layer-slice'),
    toggle('ruler','Thước λ',L('ruler'),SL('ruler'),'ctl-layer-ruler'),
    toggle('tag','Nhãn',L('labels'),SL('labels'),'ctl-layer-labels'),
    toggle('flow','Tín hiệu',L('flow'),SL('flow'),'ctl-layer-flow'),
    toggle('layers','Khối',()=>state.particleMode==='volume',v=>set('particleMode',v?'volume':'slab'),'ctl-volume-mode'),
    (()=>{const b=toggle('cut','Nửa đầu',()=>state.headMode==='cut',v=>call(()=>api.setHeadMode(v?'cut':'full')),'btn-headcut');return b;})());
  const earToggles=h('div',{},
    lab('layers','Tách rời bộ phận'),
    slider({id:'ctl-ear-explode',min:0,max:100,step:1,label:'Tách rời các bộ phận',pos:()=>Math.round(state.earExplode*100),apply:v=>set('earExplode',v/100)}),
    lab('sliders','Duỗi thẳng ốc tai'),
    slider({id:'ctl-ear-unroll',min:0,max:100,step:1,label:'Duỗi thẳng ốc tai',pos:()=>Math.round(state.earUnroll*100),apply:v=>set('earUnroll',v/100)}),
    h('div',{class:'chips g4',style:'margin-top:6px'},
      toggle('cut','Cắt dọc',()=>state.earCut,v=>set('earCut',v),'ctl-ear-cut'),
      toggle('tag','Nhãn',L('labels'),SL('labels'),'ctl-layer-labels-ear'),
      toggle('flow','Tín hiệu',L('flow'),SL('flow'),'ctl-layer-flow-ear')));
  const camBtn=(p,t)=>h('button',{type:'button',class:'chip sm',onclick:()=>call(()=>api.goTo({view:state.view,preset:(p==='head'&&state.headMode==='cut')?'headCut':p,duration:1.2}))},t);
  const camsRoom=h('div',{class:'chips'},h('span',{class:'lab',title:'Góc nhìn'},h('span',{class:'ic'},icon('cam',15))),ROOM_CAMS.map(([p,t])=>camBtn(p,t)));
  const camsEar=h('div',{class:'chips'},h('span',{class:'lab',title:'Góc nhìn'},h('span',{class:'ic'},icon('cam',15))),EAR_CAMS.map(([p,t])=>camBtn(p,t)));
  bind(()=>{const room=state.view!=='ear';roomToggles.hidden=!room;camsRoom.hidden=!room;earToggles.hidden=room;camsEar.hidden=room;});
  const gShow=h('section',{class:'grp','data-grp':'show'},
    h('h2',{class:'grp-h',text:'Hiển thị'}),roomToggles,earToggles,
    camsRoom,camsEar);

  const DOCK=[['src','mouth','Nguồn'],['wave','freq','Sóng'],['show','eye','Hiển thị'],['learn','book','Bài học'],['tour','route','Hành trình']];
  const ctrl=h('aside',{id:'ctrl',class:'panel brk','data-tab':mq.matches?'none':'src','aria-label':'Bảng điều khiển'});
  const dockBtns=DOCK.map(([k,ic,t])=>{
    const b=h('button',{type:'button','data-k':k,'aria-pressed':'false',onclick:()=>{
      if(k==='learn'||k==='tour'){openSide(k);return;}
      ctrl.dataset.tab=ctrl.dataset.tab===k?'none':k;syncDock();
    }},icon(ic,20),t);
    return b;
  });
  function syncDock(){dockBtns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.k===ctrl.dataset.tab)));}
  syncDock();
  ctrl.append(h('div',{class:'grps',style:'display:flex;flex-direction:column;min-height:0'},gSrc,gWave,gShow),h('nav',{class:'dock-tabs','aria-label':'Nhóm điều khiển'},dockBtns));

  /* ---------- số liệu ---------- */
  const cells={};
  const metric=(key,label)=>{
    const v=h('b',{class:'m-val'}),note=h('small',{class:'m-note',hidden:true,text:'hình vẽ rút gọn'});
    cells[key]={v,note,last:''};
    return h('div',{class:'metric'},h('span',{class:'m-lab',text:label}),v,note);
  };
  const scopeRoot=h('div',{id:'scope-root'});
  const info=h('aside',{id:'info',class:'panel brk','aria-label':'Số liệu'},
    h('h2',{class:'grp-h info-h',text:'Số liệu'}),
    h('div',{id:'metrics'},metric('f','Tần số f'),metric('T','Chu kì T'),metric('l','Bước sóng λ'),metric('v','Tốc độ v')),
    h('div',{class:'formula'},'λ = ',h('b',{text:'v'}),' / f = ',h('b',{text:'v'}),'·T'),
    h('div',{class:'legend'},
      h('span',{class:'comp'},h('i'),'Cam: vùng nén (áp suất cao)'),
      h('span',{class:'rare'},h('i'),'Xanh: vùng giãn (áp suất thấp)')),
    scopeRoot);

  /* ---------- nút phát ---------- */
  const playLab=h('span',{text:'Phát âm'});
  const btnPlay=h('button',{type:'button',id:'btn-play','data-playing':'false','aria-label':'Phát âm thanh',onclick:()=>call(()=>api.togglePlay())},
    icon('play',22,'i-play'),icon('pause',22,'i-pause'),playLab);
  const playWrap=h('div',{id:'play-wrap'},btnPlay);

  /* ---------- ngăn kéo ---------- */
  const tabDefs=[['learn','book','Bài học'],['tour','route','Hành trình'],['sim','gear','Cài đặt']];
  const tabBtns={},panes={};
  let curTab='tour';
  const tabs=h('div',{class:'tabs',role:'tablist','aria-label':'Nội dung'});
  const paneBox=h('div',{class:'panes',style:'display:flex;flex-direction:column;flex:1;min-height:0'});
  for(const [k,ic,t] of tabDefs){
    tabBtns[k]=h('button',{type:'button',id:'tab-'+k,class:'tab',role:'tab','aria-controls':'pane-'+k,'aria-selected':'false',onclick:()=>{curTab=k;syncTabs();}},icon(ic,16),t);
    panes[k]=h('div',{id:'pane-'+k,class:'pane',role:'tabpanel','aria-labelledby':'tab-'+k});
    tabs.append(tabBtns[k]);paneBox.append(panes[k]);
  }
  function syncTabs(){
    for(const k in tabBtns){const on=k===curTab;tabBtns[k].setAttribute('aria-selected',String(on));tabBtns[k].tabIndex=on?0:-1;panes[k].hidden=!on;}
    const open=root.dataset.side==='open';
    btnLearn.setAttribute('aria-pressed',String(open&&curTab==='learn'));
    btnTour.setAttribute('aria-pressed',String(open&&curTab==='tour'));
    btnSet.setAttribute('aria-pressed',String(open&&curTab==='sim'));
  }
  const closeBtn=h('button',{type:'button',id:'sidebar-toggle','aria-controls':'sidebar','aria-label':'Đóng',title:'Đóng',onclick:()=>closeSide()},icon('close',20));
  const sidebar=h('aside',{id:'sidebar','aria-label':'Bài học, hành trình và cài đặt'},closeBtn,h('div',{class:'side-inner'},tabs,paneBox));
  function openSide(k){
    if(root.dataset.side==='open'&&curTab===k){closeSide();return;}
    curTab=k;root.dataset.side='open';syncTabs();
  }
  function closeSide(){root.dataset.side='closed';syncTabs();}
  root.dataset.side='closed';
  bus.on('ui:openside',()=>{if(root.dataset.side!=='open'){root.dataset.side='open';syncTabs();}});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&root.dataset.side==='open')closeSide();});
  syncTabs();

  /* ---------- cài đặt ---------- */
  const voiceSel=h('select',{id:'ctl-voice',class:'field','aria-label':'Giọng đọc'});
  function fillVoices(){
    let list=[];try{list=(audio.voices&&audio.voices())||[];}catch(e){}
    const keep=voiceSel.value;
    list=list.slice().sort((a,b)=>(/^vi/i.test(b.lang||'')?1:0)-(/^vi/i.test(a.lang||'')?1:0));
    voiceSel.replaceChildren(h('option',{value:'',text:'Giọng mặc định'}),...list.map(v=>h('option',{value:v.voiceURI||v.name,text:(v.name||v.voiceURI)+(v.lang?' ('+v.lang+')':'')})));
    if(keep)voiceSel.value=keep;
  }
  fillVoices();
  if(speechOK){try{window.speechSynthesis.addEventListener('voiceschanged',fillVoices);}catch(e){}setTimeout(fillVoices,800);}
  const rateVal=h('span',{class:'val',text:'×1,0'});
  const volVal=h('span',{class:'val'});
  bind(()=>{volVal.textContent=Math.round(state.volume*100)+'%';});
  const qSeg=h('div',{class:'seg'},[['auto','Tự động'],['low','Thấp'],['medium','Vừa'],['high','Cao']].map(([v,t])=>{
    const b=h('button',{type:'button','aria-pressed':'false',onclick:()=>set('quality',v)},t);
    bind(()=>b.setAttribute('aria-pressed',String(state.quality===v)));return b;}));
  const waveSeg=h('div',{class:'seg'},[['sphere','Sóng cầu'],['plane','Sóng phẳng']].map(([v,t])=>{
    const b=h('button',{type:'button','aria-pressed':'false',onclick:()=>set('spreading',v)},t);
    bind(()=>b.setAttribute('aria-pressed',String(state.spreading===v)));return b;}));
  const credits=h('p',{class:'credits',text:'Mô hình đầu: Lee Perry-Smith (CC BY 3.0) · Three.js (MIT).'});
  import('./content.js').then(m=>{const c=m.CREDITS;if(Array.isArray(c))credits.textContent=c.join(' · ');}).catch(()=>{});
  panes.sim.append(
    h('section',{class:'set-sec'},h('h3',{text:'Âm lượng máy'}),lab('vol','Âm lượng',volVal),
      slider({id:'ctl-volume',min:0,max:100,step:1,label:'Âm lượng máy',pos:()=>Math.round(state.volume*100),apply:v=>set('volume',v/100)})),
    h('section',{class:'set-sec'},h('h3',{text:'Đọc chữ'}),voiceSel,lab('slow','Tốc độ đọc',rateVal),
      slider({id:'ctl-rate',min:0.6,max:1.4,step:0.05,label:'Tốc độ đọc',pos:()=>rate,apply:v=>{rate=v;rateVal.textContent='×'+v.toFixed(1).replace('.',',');}})),
    h('section',{class:'set-sec'},h('h3',{text:'Kiểu lan truyền'}),waveSeg),
    h('section',{class:'set-sec'},h('h3',{text:'Chất lượng hình ảnh'}),qSeg,h('p',{class:'credits',text:'Máy yếu hoặc điện thoại: chọn Thấp để mượt hơn.'})),
    h('section',{class:'set-sec'},h('button',{type:'button',id:'btn-reset',class:'btn dark',onclick:resetDefaults},icon('reset',16),'Đặt lại mặc định'),credits));

  /* ---------- toasts ---------- */
  const toasts=h('div',{id:'toasts','aria-live':'polite'});
  bus.on('toast',p=>{
    if(!p||!p.text)return;
    const t=h('div',{class:'toast '+(p.kind==='warn'?'warn':''),role:'status',text:p.text});
    toasts.append(t);setTimeout(()=>t.remove(),4200);
  });

  root.append(title,school,tools,ctrl,info,playWrap,sidebar,toasts);

  // chiều cao dock trên điện thoại -> CSS biến --dock-h
  const setDock=()=>{const v=mq.matches?ctrl.offsetHeight+'px':'0px';root.style.setProperty('--dock-h',v);document.documentElement.style.setProperty('--dock-h',v);};
  try{new ResizeObserver(setDock).observe(ctrl);}catch(e){addEventListener('resize',setDock);}
  if(mq.addEventListener)mq.addEventListener('change',setDock);
  setDock();

  /* ---------- đồng bộ ---------- */
  bus.on('change',e=>{if(e&&IGNORE.has(e.key))return;syncAll();});
  syncAll();

  /* ---------- số liệu trực tiếp ---------- */
  const put=(c,a,u)=>{const t=a+'|'+u;if(c.last!==t){c.last=t;c.v.replaceChildren(a,h('small',{text:u}));}};
  let lastPlaying=null;
  function tick(){
    try{
      const w=waveParams();
      put(cells.f,num(w.f),'Hz');
      const tp=timeParts(w.T);put(cells.T,tp[0],tp[1]);
      const lp=lenParts(w.lambda);put(cells.l,lp[0],lp[1]);
      cells.l.note.hidden=!w.approx;
      put(cells.v,group(w.v),'m/s');
      const p=!!state.playing;
      if(p!==lastPlaying){
        lastPlaying=p;
        btnPlay.dataset.playing=String(p);
        playLab.textContent=p?'Dừng':'Phát âm';
        btnPlay.setAttribute('aria-label',p?'Dừng âm thanh':'Phát âm thanh');
        btnPlay.setAttribute('aria-pressed',String(p));
      }
    }catch(e){/* chờ engine sẵn sàng */}
    raf(tick);
  }
  tick();

  /* ---------- module con ---------- */
  const note=(box,text)=>box.append(h('p',{class:'placeholder',text}));
  (async()=>{
    try{const m=await import('./learn.js');m.mountLearn(panes.learn);try{m.mountPartCard(overlay);}catch(e){console.warn('mountPartCard',e);}}
    catch(e){console.warn('learn.js',e);note(panes.learn,'Phần Bài học đang được chuẩn bị.');}
    try{const m=await import('./tour.js');m.mountTour(panes.tour,overlay);}
    catch(e){console.warn('tour.js',e);note(panes.tour,'Phần Hành trình đang được chuẩn bị.');}
    try{const m=await import('./scope.js');m.mountScope(scopeRoot);}
    catch(e){console.warn('scope.js',e);note(scopeRoot,'Máy hiện sóng chưa sẵn sàng.');}
  })();
  // bấm một bước hành trình thì thu ngăn kéo để nhìn cảnh 3D
  panes.tour.addEventListener('click',e=>{const t=e.target;if(t&&t.closest&&t.closest('.tr-item,.tr-start'))setTimeout(closeSide,150);});

  /* ---------- hướng dẫn lần đầu ---------- */
  let started=false;
  const begin=()=>{if(started)return;started=true;setTimeout(()=>{try{startOnboarding({});}catch(e){console.warn(e);}},500);};
  const loader=document.getElementById('loader');
  const loaderGone=!loader||loader.hidden||getComputedStyle(loader).display==='none'||getComputedStyle(loader).visibility==='hidden';
  bus.on('ready',begin);
  if(loaderGone&&typeof api.togglePlay==='function'&&typeof api.anchorToScreen==='function')begin();

  return {syncAll};
}
