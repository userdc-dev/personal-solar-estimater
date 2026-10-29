(function(root){
'use strict';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function train(samples){
 const buckets=Array.from({length:24},()=>new Map());
 for(const s of samples){
  if(!s||!finite(s.predicted)||!finite(s.actual)||!finite(s.hour)||s.hour<0||s.hour>=24||s.predicted<0.25||s.actual<0||s.actual>100)continue;
  const ratio=Math.max(0.25,Math.min(1.5,s.actual/s.predicted));
  const day=s.date|| (finite(s.at)?new Date(s.at*1000).toISOString().slice(0,10):null);if(day) {const bucket=buckets[Math.floor(s.hour)];const list=bucket.get(day)||[];list.push(ratio);bucket.set(day,list);}
 }
 return buckets.map(dayMap=>{const v=[...dayMap.values()].map(a=>{a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)];});
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
function dailyModel(history,signature,forecastDate){
 const points=Object.entries(history||{}).filter(([date,h])=>
  date<forecastDate&&h&&h.forecast?.signature===signature&&
  finite(h.forecast.kwh)&&h.forecast.kwh>=5&&h.forecast.complete===true&&
  finite(h.actual)&&h.actual>=0&&
  (!finite(h.forecast.at)||h.forecast.at<new Date(date+'T00:00:00Z').getTime()+86400000)
 ).sort(([a],[b])=>b.localeCompare(a)).slice(0,45);
 if(points.length<7)return {factor:1,count:points.length,ready:false};
 const ratios=points.map(([,h])=>Math.max(0.7,Math.min(1.3,h.actual/h.forecast.kwh))).sort((a,b)=>a-b);
 const median=ratios[Math.floor(ratios.length/2)];
 const confidence=Math.min(0.8,points.length/30);
 return {factor:Math.max(0.8,Math.min(1.2,1+(median-1)*confidence)),count:points.length,ready:true};
}
function correctedDay(kwh,model){return finite(kwh)&&kwh>=0?kwh*(model?.ready?model.factor:1):null;}
function score(samples,model){
 const valid=samples.filter(s=>finite(s.predicted)&&finite(s.actual)&&s.predicted>=0&&s.actual>=0&&finite(s.hour));
 if(!valid.length)return null;
 const baseline=valid.reduce((sum,s)=>sum+Math.abs(s.predicted-s.actual),0)/valid.length;
 const corrected=valid.reduce((sum,s)=>sum+Math.abs(adjust(s.predicted,s.hour,model)-s.actual),0)/valid.length;
 return {count:valid.length,baselineMAE:baseline,correctedMAE:corrected};
}
const api={train,adjust,score,dailyModel,correctedDay};if(typeof module!=='undefined')module.exports=api;root.Calibration=api;
})(typeof window!=='undefined'?window:globalThis);
