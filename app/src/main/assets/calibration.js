(function(root){
'use strict';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function train(samples){
 const buckets=Array.from({length:24},()=>[]);
 for(const s of samples){
  if(!s||!finite(s.predicted)||!finite(s.actual)||!finite(s.hour)||s.hour<0||s.hour>=24||s.predicted<0.25||s.actual<0||s.actual>100)continue;
  const ratio=Math.max(0.25,Math.min(1.5,s.actual/s.predicted));
  buckets[Math.floor(s.hour)].push(ratio);
 }
 return buckets.map(v=>{
  if(v.length<5)return {factor:1,count:v.length,ready:false};
  v.sort((a,b)=>a-b);
  const median=v[Math.floor(v.length/2)];
  const weight=Math.min(0.75,v.length/30);
  return {factor:1+(median-1)*weight,count:v.length,ready:true};
 });
}
function adjust(predicted,hour,model){
 if(!finite(predicted)||predicted<0)return null;
 const b=model?.[Math.floor(hour)];
 return predicted*(b?.ready?b.factor:1);
}
function score(samples,model){
 const valid=samples.filter(s=>finite(s.predicted)&&finite(s.actual)&&s.predicted>=0&&s.actual>=0&&finite(s.hour));
 if(!valid.length)return null;
 const baseline=valid.reduce((sum,s)=>sum+Math.abs(s.predicted-s.actual),0)/valid.length;
 const corrected=valid.reduce((sum,s)=>sum+Math.abs(adjust(s.predicted,s.hour,model)-s.actual),0)/valid.length;
 return {count:valid.length,baselineMAE:baseline,correctedMAE:corrected};
}
const api={train,adjust,score};if(typeof module!=='undefined')module.exports=api;root.Calibration=api;
})(typeof window!=='undefined'?window:globalThis);
