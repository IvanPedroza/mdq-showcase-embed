const assert = require('node:assert/strict');
const orbit = require('../orbit-motion.js');
const close = (actual, expected, tolerance=1e-8) => assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
const configurations = [[366.62,520,false],[552,520,false],[390,403,true],[320,360,true]];
let samples=0,departures=0;
for(const [width,height,narrow] of configurations){
  const g=orbit.geometry(width,height,narrow);
  const chord=2*g.radius*Math.sin(Math.PI/orbit.COUNT);
  for(let tick=0;tick<360;tick++){
    const phase=tick*orbit.TAU/360;
    const slots=Array.from({length:orbit.COUNT},(_,i)=>orbit.slot(phase,i,g));
    close(slots.reduce((sum,p)=>sum+p.x,0)/orbit.COUNT,g.cx);
    close(slots.reduce((sum,p)=>sum+p.y,0)/orbit.COUNT,g.cy);
    slots.forEach((p,i)=>{
      close(Math.hypot(p.x-g.cx,p.y-g.cy),g.radius);
      const next=slots[(i+1)%slots.length];
      close(Math.hypot(p.x-next.x,p.y-next.y),chord);
      close(((p.angle-next.angle)%orbit.TAU+orbit.TAU)%orbit.TAU,orbit.TAU/orbit.COUNT);
    });
    // Hiding exactly one slot leaves regular neighbor spacing and one doubled
    // angular gap; reinstating that SAME slot fills it without a duplicate.
    for(const selected of [0,6,12]){
      const kept=slots.filter(p=>p.index!==selected);
      assert.equal(new Set(kept.map(p=>p.index)).size,orbit.COUNT-1);
      const gaps=kept.map((p,i)=>((p.angle-kept[(i+1)%kept.length].angle)%orbit.TAU+orbit.TAU)%orbit.TAU);
      assert.equal(gaps.filter(gap=>Math.abs(gap-orbit.TAU/orbit.COUNT*2)<1e-8).length,1);
      assert.equal(gaps.filter(gap=>Math.abs(gap-orbit.TAU/orbit.COUNT)<1e-8).length,orbit.COUNT-2);
    }
    const selected=orbit.select(phase,g,19000);
    if(selected>=0){
      departures++;
      assert.ok(orbit.visible(slots[selected],g));
      const returnStart=orbit.future(phase,2400+14000);
      assert.ok(orbit.canReturn(returnStart,selected,g,2600));
      const landing=orbit.slot(orbit.future(returnStart,2600),selected,g);
      assert.ok(orbit.visible(landing,g));
    }
    samples++;
  }
  // Any arbitrarily long reading hold must have a visible return opportunity
  // within one revolution, without changing the selected slot's identity.
  for(const heldFor of [0,45000,180000,789123]){
    const phase=orbit.future(2.1,heldFor);
    let found=false;
    for(let ms=0;ms<=orbit.PERIOD;ms+=100){
      if(orbit.canReturn(orbit.future(phase,ms),7,g,2600)){found=true;break;}
    }
    assert.ok(found);
  }
  let canDepart=false;
  for(let ms=0;ms<=orbit.PERIOD/orbit.COUNT;ms+=50){
    if(orbit.select(orbit.future(3.00196631343,ms),g,19000)>=0){canDepart=true;break;}
  }
  assert.ok(canDepart,'Departure must become available for every layout');
}
assert.ok(departures>0);
console.log(`Passed: ${samples} orbit samples; ${departures} visible departure/return pairs; fixed center, radius, spacing, one gap, long holds, responsive layouts.`);
