/* One glass renderer for both the orbit and the morphing card. All surfaces use
   the same sampling, alpha compositing and pixel grid, including at handoff. */
window.createGlassScene = function (canvas) {
  var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return null;
  var vertex = [
    'attribute vec2 position; varying vec2 uv;',
    'uniform vec2 viewport; uniform vec2 center; uniform vec2 size; uniform float angle;',
    'void main(){uv=position*.5+.5; vec2 p=position*size*.5;',
    'float c=cos(angle),s=sin(angle);vec2 q=vec2(c*p.x+s*p.y,-s*p.x+c*p.y);',
    'gl_Position=vec4(2.*(center.x+q.x)/viewport.x-1.,1.-2.*center.y/viewport.y+2.*q.y/viewport.y,0.,1.);}'
  ].join('\n');
  var high = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT).precision > 0;
  var derivatives=gl.getExtension('OES_standard_derivatives');
  var fragment = [
    derivatives?'#extension GL_OES_standard_derivatives : enable':'',
    'precision '+(high?'highp':'mediump')+' float;',
    'varying vec2 uv; uniform sampler2D base; uniform sampler2D light;',
    'uniform vec2 size; uniform float density;',
    'uniform float morph; uniform float glint; uniform float lift; uniform float layer;',
    'vec4 sampleGlass(vec2 q){',
    'q.y*=.7579934;float c=cos(1.1700687),s=sin(1.1700687);',
    'vec2 st=vec2(.5)+.443*vec2(c*q.x-s*q.y,s*q.x+c*q.y);st.y=1.-st.y;',
    'vec4 b=texture2D(base,st),l=texture2D(light,st);float la=l.a*glint;',
    'return vec4(l.rgb*glint+b.rgb*(1.-la),la+b.a*(1.-la));}',
    'void main(){',
    'vec2 pixel=(uv-vec2(.5))*size;pixel.y=-pixel.y;',
    'vec2 halfSize=size/2.10;vec2 p=pixel/halfSize;',
    'if(morph<=0.&&layer<.5){gl_FragColor=sampleGlass(p);return;}',
    'float r=length(p);vec2 dir=r>.0001?p/r:vec2(1.,0.);',
    // Exact ray/rounded-rectangle intersection. All four corners use 22 CSS px.
    'float radius=min(22.,min(halfSize.x,halfSize.y)*.35);',
    'vec2 ray=abs(dir)*halfSize;',
    'float rectBound=min(halfSize.x/max(ray.x,.0001),halfSize.y/max(ray.y,.0001));',
    'vec2 hit=ray*rectBound,corner=halfSize-vec2(radius);',
    'if(hit.x>corner.x&&hit.y>corner.y){float a=dot(ray,ray),b=dot(ray,corner);',
    'float c=dot(corner,corner)-radius*radius;rectBound=(b+sqrt(max(0.,b*b-a*c)))/a;}',
    'float bound=mix(1.,rectBound,morph);vec2 q=p/bound;float rho=length(q);',
    'vec4 original=sampleGlass(q);',
    // Stop sampling the baked circular rim for the panel; keep its glass interior.
    'vec4 body=sampleGlass(q*min(1.,.86/max(rho,.0001)));',
    'float edge=rho-1.;',
    derivatives ? 'float dist=edge/max(length(vec2(dFdx(edge),dFdy(edge)))*density,.0001);' : 'float dist=edge*min(halfSize.x,halfSize.y);',
    'vec2 sd=abs(pixel)-halfSize+vec2(radius);',
    'float rectangleDist=length(max(sd,0.))+min(max(sd.x,sd.y),0.)-radius;',
    'dist=mix(dist,rectangleDist,smoothstep(.96,1.,morph));',
    // Pixel-space coverage gives a constant 3.5 px rim, including the corners.
    'float aa=.65,coverage=1.-smoothstep(-aa,aa,dist);',
    'float inside=1.-smoothstep(-aa,aa,dist+3.5);float rim=coverage-inside;',
    'float lightLevel=.65+.35*clamp(dot(normalize(pixel+vec2(.0001)),normalize(vec2(-.6,.8)))*.5+.5,0.,1.);',
    'float line=1.-smoothstep(.3,.9,abs(dist+1.8));',
    'vec3 rimColor=mix(vec3(.22,.23,.50),vec3(.51,.87,.98),line*lightLevel);',
    'float rimAlpha=rim*.94;vec4 panel=body*coverage;',
    'panel=vec4(rimColor*rimAlpha+panel.rgb*(1.-rimAlpha),rimAlpha+panel.a*(1.-rimAlpha));',
    'vec4 surface=mix(original,panel,smoothstep(0.,.45,morph));',
    'float a=surface.a;vec3 rgb=surface.rgb;',
    'float weight=1.;if(layer>1.5)weight=lift;',
    'else if(layer>.5)weight=(1.-lift)/max(1.-a*lift,.0001);',
    'gl_FragColor=vec4(rgb*weight,a*weight);',
    '}'
  ].join('\n');
  function shader(type,code){
    var s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var program;
  try{
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
  }catch(error){return null;}
  gl.useProgram(program);
  var buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  var position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  var uniforms={};
  ['viewport','center','size','angle','morph','glint','lift','layer','density'].forEach(function(name){uniforms[name]=gl.getUniformLocation(program,name);});
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0,0,0,0);
  var ready=0,lost=false,failed=false;
  ['assets/glass-lens.webp','assets/glass-lens-light.webp'].forEach(function(url,i){
    var texture=gl.createTexture(),image=new Image();
    gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program,i?'light':'base'),i);
    image.onload=function(){
      gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      if((image.width&(image.width-1))===0&&(image.height&(image.height-1))===0){
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
      }
      ready++;canvas.dispatchEvent(new Event('glassready'));
    };
    image.onerror=function(){failed=true;canvas.dispatchEvent(new Event('glassready'));};
    image.src=url;
  });
  canvas.addEventListener('webglcontextlost',function(event){event.preventDefault();lost=true;canvas.dispatchEvent(new Event('glassready'));});
  return {
    begin:function(width,height){
      if(ready<2||lost||failed)return false;
      // At least 2× backing pixels smooth alpha-texture rims even on 1× screens.
      var density=Math.min(3,Math.max(2,window.devicePixelRatio||1));
      var w=Math.ceil(width*density),h=Math.ceil(height*density);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
      gl.uniform2f(uniforms.viewport,width,height);gl.uniform1f(uniforms.density,density);gl.clear(gl.COLOR_BUFFER_BIT);return true;
    },
    draw:function(x,y,width,height,angle,morph,glint,lift,layer){
      gl.uniform2f(uniforms.center,x,y);gl.uniform2f(uniforms.size,width,height);
      gl.uniform1f(uniforms.angle,angle);gl.uniform1f(uniforms.morph,morph);gl.uniform1f(uniforms.glint,glint);
      gl.uniform1f(uniforms.lift,lift||0);gl.uniform1f(uniforms.layer,layer||0);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
  };
};
