import {state} from './state.js';
import {LAYOUT} from './layout.js';
export const SPEED={air:343,water:1482,steel:5960};
export const HEARING={min:20,max:20000};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function waveParams(st=state){
 const live=st.live,f=live.frequency,v=SPEED[st.medium]||SPEED.air;
 const lambda=v/f,T=1/f,visLambda=clamp(lambda,0.25,8);
 const k=2*Math.PI/visLambda,omega=2*Math.PI*f*st.slow;
 const amp=live.active?(Math.pow(clamp((live.level-20)/80,0,1),1.2)*0.94+0.06)*live.env:0;
 return {active:live.active,v,f,T,lambda,visLambda,approx:lambda!==visLambda,k,omega,amp,xi0:0.09*visLambda*amp};
}
export function spread(r,st=state){
 if(st.spreading==='plane')return 1;
 return clamp(0.5/Math.max(r,0.5),0.3,1);
}
export function phaseAt(r,t=state.t){const p=waveParams();return p.k*r-p.omega*t;}
export function displacementAt(r,t=state.t){const p=waveParams();return p.xi0*spread(r)*Math.cos(p.k*r-p.omega*t);}
export function pressureAt(r,t=state.t){const p=waveParams();return p.amp*spread(r)*Math.sin(p.k*r-p.omega*t);}
export function cochleaPlace(f){return clamp(1-Math.log10(f/165.4+0.88)/2.1,0,1);}
export function levelToGain(db){return Math.pow(10,(clamp(db,20,100)-100)/40);}
export function describePitch(f){
 if(f<20)return {label:'Hạ âm',audible:false};
 if(f<=250)return {label:'Âm trầm',audible:true};
 if(f<=2000)return {label:'Âm trung',audible:true};
 if(f<=20000)return {label:'Âm bổng',audible:true};
 return {label:'Siêu âm',audible:false};
}
export function earDistance(){
 const a=LAYOUT.head.earRight,b=LAYOUT.speaker.mouth;
 return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
}
