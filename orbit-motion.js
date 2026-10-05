/* Fixed, equally spaced slots on one circular path. Shared by the animation and
   geometry checks. A departing card never removes or slows its orbital slot. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.MDQOrbit=factory();
})(typeof window!=='undefined'?window:this,function(){
  var TAU=Math.PI*2,COUNT=13,PERIOD=67368;
  function geometry(width,height,narrow){
    return {width:width,height:height,cx:width*(narrow?1.0:1.10),cy:height*1.03,
      radius:Math.min(width*.82,height*(narrow?.80:.72)),
      diameter:Math.min(width*(narrow?.62:.69),height*.70,narrow?275:365)*.886};
  }
  function slot(phase,index,g){
    var angle=phase-index*TAU/COUNT;
    return {index:index,angle:angle,x:g.cx+g.radius*Math.cos(angle),y:g.cy-g.radius*Math.sin(angle),
      depth:(1+Math.sin(angle+.48))/2};
  }
  function future(phase,milliseconds){return phase+milliseconds/PERIOD*TAU;}
  function visible(pos,g){
    // Keep the center safely in frame; natural edge clipping matches the corner composition.
    return pos.x>g.diameter*.28&&pos.x<g.width-g.diameter*.12&&
      pos.y>g.diameter*.36&&pos.y<g.height-g.diameter*.32;
  }
  function canReturn(phase,index,g,duration){
    return visible(slot(future(phase,duration),index,g),g);
  }
  function select(phase,g,duration){
    var best=-1,score=Infinity;
    for(var i=0;i<COUNT;i++){
      var start=slot(phase,i,g),end=slot(future(phase,duration),i,g);
      if(!visible(start,g)||!visible(end,g))continue;
      // Keep the landing away from a visibility boundary. Frame rounding must
      // not turn a three-second hold into a wait for another revolution.
      if(!visible(slot(future(phase,duration-240),i,g),g)||
         !visible(slot(future(phase,duration+240),i,g),g))continue;
      var distance=Math.pow(start.x-g.width*.85,2)+Math.pow(start.y-g.height*.5,2);
      if(distance<score){score=distance;best=i;}
    }
    return best;
  }
  return {COUNT:COUNT,PERIOD:PERIOD,TAU:TAU,geometry:geometry,slot:slot,future:future,visible:visible,canReturn:canReturn,select:select};
});
