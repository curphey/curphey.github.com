import * as T from '../../tower/vendor/three.js';
// Scene -> HDR target with depth -> contact shading, glow, miniature depth of field, haze, filmic tone, grain.
const quadVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export function createPipeline(renderer) {
  const depthTexture = new T.DepthTexture(2, 2); depthTexture.type = T.UnsignedIntType;
  const sceneTarget = new T.WebGLRenderTarget(2, 2, { type: T.HalfFloatType, samples: 4, depthTexture });
  const small = () => new T.WebGLRenderTarget(2, 2, { type: T.HalfFloatType, depthBuffer: false });
  const bloomA = small(), bloomB = small(), wideA = small(), wideB = small();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new T.Mesh(new T.PlaneGeometry(2, 2)), fsScene = new T.Scene(); fsScene.add(quad);
  const pass = (fragmentShader, uniforms) => new T.ShaderMaterial({ vertexShader: quadVertex, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const bright = pass(`uniform sampler2D tColor;uniform float threshold;varying vec2 vUv;
    void main(){vec3 c=texture2D(tColor,vUv).rgb;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(threshold,threshold*2.2,l),1.);}`, { tColor: { value: null }, threshold: { value: 1.05 } });
  const blur = pass(`uniform sampler2D tColor;uniform vec2 dir;varying vec2 vUv;
    void main(){vec3 c=texture2D(tColor,vUv).rgb*.227;
      c+=(texture2D(tColor,vUv+dir*1.385).rgb+texture2D(tColor,vUv-dir*1.385).rgb)*.316;
      c+=(texture2D(tColor,vUv+dir*3.231).rgb+texture2D(tColor,vUv-dir*3.231).rgb)*.070;gl_FragColor=vec4(c,1.);}`, { tColor: { value: null }, dir: { value: new T.Vector2() } });
  const u = {
    tColor: { value: sceneTarget.texture }, tDepth: { value: depthTexture }, tBloom: { value: bloomA.texture }, tWide: { value: wideA.texture },
    res: { value: new T.Vector2() }, near: { value: 0.1 }, far: { value: 300 }, ppu: { value: 40 }, focus: { value: 70 }, focusRange: { value: 11 },
    blurMax: { value: 4 }, haze: { value: new T.Color() }, hazeNear: { value: 70 }, hazeFar: { value: 130 }, hazeAmount: { value: 0.85 },
    veil: { value: 0 }, time: { value: 0 }, tint: { value: new T.Color('#fff4e6') }, exposure: { value: 1 }
  };
  const composite = pass(`uniform sampler2D tColor,tDepth,tBloom,tWide;uniform vec2 res;uniform float near,far,ppu,focus,focusRange,blurMax,hazeNear,hazeFar,hazeAmount,time,exposure,veil;uniform vec3 haze,tint;varying vec2 vUv;
    float dist(vec2 uv){return near+texture2D(tDepth,uv).x*(far-near);}
    vec3 viewPos(vec2 uv){return vec3(uv*res/ppu,-dist(uv));}
    float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
    void main(){
      vec2 px=1./res;float d=dist(vUv);vec3 P=viewPos(vUv);
      // Surface normal from depth, taking the smaller step on each axis so edges stay clean.
      vec3 dx1=viewPos(vUv+vec2(px.x,0.))-P,dx2=P-viewPos(vUv-vec2(px.x,0.));vec3 dy1=viewPos(vUv+vec2(0.,px.y))-P,dy2=P-viewPos(vUv-vec2(0.,px.y));
      vec3 n=normalize(cross(abs(dx1.z)<abs(dx2.z)?dx1:dx2,abs(dy1.z)<abs(dy2.z)?dy1:dy2));
      float occ=0.,spin=rnd(vUv*res)*6.283;
      for(int i=0;i<14;i++){float fi=float(i)+.5,a=fi*2.39996+spin,r=sqrt(fi/14.)*.75;
        vec3 S=viewPos(vUv+vec2(cos(a),sin(a))*r*ppu*px),v=S-P;float l=length(v);
        occ+=max(0.,dot(n,v)/l-.12)*(1./(1.+l*l*1.6));}
      float ao=clamp(1.-occ/14.*2.3,0.,1.);
      // Miniature depth of field: sharp around the traveller, soft towards the near and far edges.
      float coc=smoothstep(focusRange,focusRange*2.6,abs(d-focus))*blurMax;
      vec3 col=texture2D(tColor,vUv).rgb;
      if(coc>.3){float w=1.;for(int i=0;i<16;i++){float fi=float(i)+.5,a=fi*2.39996,r=sqrt(fi/16.)*coc;col+=texture2D(tColor,vUv+vec2(cos(a),sin(a))*r*px).rgb;w+=1.;}col/=w;}
      col*=mix(vec3(ao),vec3(1.),.12)*mix(vec3(.62,.7,.86),vec3(1.),ao);
      col=mix(col,haze,hazeAmount*smoothstep(hazeNear,hazeFar,d));
      col+=texture2D(tBloom,vUv).rgb*.55+texture2D(tWide,vUv).rgb*.35;
      col=mix(col,haze,veil);
      col*=tint*exposure;
      vec2 q=vUv-.5;col*=1.-dot(q,q)*.55;
      col=aces(col);
      col=mix(col,smoothstep(0.,1.,col),.18);
      col=pow(col,vec3(1./2.2));
      col+=(rnd(vUv*res+time)-.5)*.018;
      gl_FragColor=vec4(col,1.);}`, u);
  const size = new T.Vector2();
  function resize() {
    renderer.getDrawingBufferSize(size);
    sceneTarget.setSize(size.x, size.y); u.res.value.copy(size);
    const w = Math.max(2, size.x >> 2), h = Math.max(2, size.y >> 2);
    bloomA.setSize(w, h); bloomB.setSize(w, h); wideA.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); wideB.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2));
  }
  function run(material, target) { quad.material = material; renderer.setRenderTarget(target); renderer.render(fsScene, camera); }
  function blurPair(a, b, spread) {
    blur.uniforms.tColor.value = a.texture; blur.uniforms.dir.value.set(spread / a.width, 0); run(blur, b);
    blur.uniforms.tColor.value = b.texture; blur.uniforms.dir.value.set(0, spread / a.height); run(blur, a);
  }
  function render(scene, cam, time) {
    u.near.value = cam.near; u.far.value = cam.far; u.ppu.value = size.y / (cam.top - cam.bottom) * cam.zoom; u.time.value = time % 100;
    renderer.setRenderTarget(sceneTarget); renderer.clear(); renderer.render(scene, cam);
    bright.uniforms.tColor.value = sceneTarget.texture; run(bright, bloomA); blurPair(bloomA, bloomB, 1); blurPair(bloomA, bloomB, 1.6);
    blur.uniforms.tColor.value = bloomA.texture; blur.uniforms.dir.value.set(0, 0); run(blur, wideA); blurPair(wideA, wideB, 1.5); blurPair(wideA, wideB, 2.5);
    run(composite, null);
  }
  return { render, resize, uniforms: u };
}
