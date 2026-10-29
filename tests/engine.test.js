const assert=require('node:assert/strict'),E=require('../app/src/main/assets/engine.js');
const s={lat:-34.9,lon:138.6,inverter:10,loss:13,arrays:[{count:9,watts:440,tilt:25,azimuth:29,shade:0},{count:15,watts:440,tilt:25,azimuth:27,shade:0},{count:6,watts:440,tilt:25,azimuth:299,shade:0}]};
E.validate(s);assert.equal(E.azimuth(0),-180);assert.equal(E.azimuth(90),-90);assert.equal(E.azimuth(270),90);assert.equal(E.azimuth(299),119);
assert.equal(E.power(s,[0,0,0]),0);assert.equal(E.power(s,[1000,1000,1000]),10);assert.ok(Math.abs(E.power(s,[500,500,500])-5.742)<1e-9);assert.equal(E.power(s,[500,null,500]),null);assert.equal(E.power(s,[-10,-20,-30]),0);
assert.throws(()=>E.validate({...s,arrays:[{...s.arrays[0],count:-1}]}));
const end=Date.UTC(2026,9,29,13,30)/1000;assert.equal(E.dateKey(end-1800,'Australia/Adelaide'),'2026-10-29');assert.equal(E.hour(end,'Australia/Adelaide'),'00:00');
const b={capacity:10,soc:50,reserve:10,load:1,charge:5,efficiency:100};let x=E.battery([{end:3600,kw:5}],b,0);assert.equal(x.soc,90);assert.equal(x.grid,0);x=E.battery([{end:3600,kw:0}],b,1800);assert.equal(x.soc,45);x=E.battery([{end:3600,kw:0}],{...b,soc:10},0);assert.equal(x.grid,1);assert.equal(x.soc,10);assert.throws(()=>E.battery([{end:3600,kw:null}],b,0));
console.log('Solar model tests passed: orientation, units, clipping, missing data, validation, timezone and battery conservation.');
