const listeners=new Map();
export const bus={
 on(evt,fn){let s=listeners.get(evt);if(!s){s=new Set();listeners.set(evt,s);}s.add(fn);return ()=>bus.off(evt,fn);},
 off(evt,fn){const s=listeners.get(evt);if(s)s.delete(fn);},
 emit(evt,payload){const s=listeners.get(evt);if(!s)return;for(const fn of Array.from(s)){try{fn(payload);}catch(e){console.warn('bus handler error',evt,e);}}}
};
export const state={
 playing:false,emitter:'speaker',source:'tone',frequency:440,level:60,timbre:'sine',
 medium:'air',slow:0.005,spreading:'sphere',
 layers:{particles:true,slice:true,markers:true,ruler:true,labels:true,flow:true},
 particleMode:'slab',headMode:'full',view:'room',
 earExplode:0,earCut:true,earUnroll:0,
 quality:'auto',qualityResolved:'high',volume:0.8,muted:false,
 t:0,dt:0,
 live:{active:false,frequency:440,level:60,env:0},
 earDrive:{pressure:0,amp:0,phase:0,frequency:440},
 tourStep:-1,focus:null,hover:null
};
export function set(key,value){state[key]=value;bus.emit('change',{key,value});}
