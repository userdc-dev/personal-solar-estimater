(function(root){
'use strict';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function validate(s){
 if(!finite(s.lat)||s.lat< -90||s.lat>90||!finite(s.lon)||s.lon< -180||s.lon>180)throw Error('Choose a location or valid coordinates.');
 if(!finite(s.inverter)||s.inverter<=0||!finite(s.loss)||s.loss<0||s.loss>=100)throw Error('Check inverter capacity and system losses.');
 if(!s.arrays.length||s.arrays.length>8)throw Error('Add between 1 and 8 panel groups.');
 for(const a of s.arrays)if(![a.count,a.watts,a.tilt,a.azimuth,a.shade].every(finite)||a.count<1||!Number.isInteger(a.count)||a.watts<=0||a.tilt<0||a.tilt>90||a.azimuth<0||a.azimuth>=360||a.shade<0||a.shade>=100)throw Error('Check panel counts, watts, tilt (0–90°), direction (0–359°) and shading.');
}
function azimuth(n){return ((n%360)+360)%360-180;}
function power(s,irr){
 if(irr.length!==s.arrays.length||irr.some(v=>!finite(v)))return null;
 const dc=s.arrays.reduce((sum,a,i)=>sum+a.count*a.watts/1000*Math.max(0,irr[i])/1000*(1-a.shade/100),0);
 return Math.min(s.inverter,dc*(1-s.loss/100));
}
function dateKey(t,tz){return new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t*1000));}
function hour(t,tz){return new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(t*1000));}
function combine(s,res){
 validate(s);if(res.length!==s.arrays.length)throw Error('Some panel forecasts are missing.');
 const base=res[0],tz=base.timezone;
 if(!tz||!base.hourly?.time?.length)throw Error('Weather service returned no hourly forecast.');
 const maps=res.map(r=>new Map(r.hourly.time.map((t,i)=>[t,r.hourly.global_tilted_irradiance[i]])));
 return {tz,rows:base.hourly.time.map((end,i)=>({end,start:end-3600,date:dateKey(end-1800,tz),label:hour(end-3600,tz),kw:power(s,maps.map(m=>m.get(end))),temp:base.hourly.temperature_2m?.[i],cloud:base.hourly.cloud_cover?.[i]}))};
}
function days(rows){const m=new Map();for(const r of rows){if(!m.has(r.date))m.set(r.date,{date:r.date,kwh:0,peak:0,missing:0,rows:[]});let d=m.get(r.date);d.rows.push(r);if(r.kw===null)d.missing++;else {d.kwh+=r.kw;d.peak=Math.max(d.peak,r.kw);}}return [...m.values()];}
function battery(rows,{capacity,soc,reserve,load,charge,efficiency},now){
 if(![capacity,soc,reserve,load,charge,efficiency].every(finite)||capacity<=0||soc<0||soc>100||reserve<0||reserve>100||load<0||charge<=0||efficiency<=0||efficiency>100)throw Error('Check battery inputs; reserve must not exceed current charge.');
 let stored=capacity*soc/100,grid=0,exported=0; const minimum=capacity*reserve/100;
 for(const r of rows){let fraction=Math.max(0,Math.min(1,(r.end-now)/3600));if(!fraction)continue;if(r.kw===null)throw Error('Missing forecast hours prevent a battery estimate.');let net=(r.kw-load)*fraction;
 if(net>=0){let incoming=Math.min(net,charge*fraction,(capacity-stored)/(efficiency/100));stored+=incoming*efficiency/100;exported+=net-incoming;}
 else {let output=Math.min(-net,charge*fraction,Math.max(0,stored-minimum)*(efficiency/100));stored-=output/(efficiency/100);grid+=-net-output;}}
 return {soc:stored/capacity*100,grid,exported};
}
const api={validate,azimuth,power,combine,days,dateKey,hour,battery}; if(typeof module!=='undefined')module.exports=api;root.Solar=api;
})(typeof window!=='undefined'?window:globalThis);
