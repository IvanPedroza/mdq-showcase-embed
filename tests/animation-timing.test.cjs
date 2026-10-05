const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../orbit-motion.js');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const timings = html.match(/var GAP_MS =[^;]+;/)[0];
const advance = html.slice(html.indexOf('  function advance(dt){'), html.indexOf('  function frame(ts){'));
let holds = 0;
for (const [width,height,narrow] of [[327,398,false],[552,398,false],[390,281,true],[289,250,true]]) {
  for (const dt of [16,33,80]) {
    const state = vm.createContext({model, geometry:()=>model.geometry(width,height,narrow),
      phase:3.00196631343, state:'idle', elapsed:0, selected:-1, storyIndex:0,
      stories:[1,2,3,4,5,6], setStory(){}});
    vm.runInContext(timings + advance, state);
    let entered = null;
    for(let elapsed=0;elapsed<model.PERIOD*3;elapsed+=dt){
      const before=state.state;
      state.advance(dt);
      if(before!=='hold'&&state.state==='hold') entered=elapsed;
      if(before==='hold'&&state.state!=='hold'){
        const duration=elapsed-entered;
        assert.ok(duration>=3000-dt && duration<=3000+dt,
          `Hold was ${duration}ms at ${width}x${height}, frame=${dt}ms`);
        holds++;
      }
    }
  }
}
assert.ok(holds>100);
console.log(`Passed: ${holds} actual animation holds stay within one frame of 3 seconds.`);
