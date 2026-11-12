import * as T from '../../tower/vendor/three.js';
// Still water that mirrors the buildings (a second render from below) and a drifting, clouded sky.
const NOISE = `
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float t=0.,a=.5;for(int i=0;i<5;i++){t+=a*vnoise(p);p=p*2.03+vec2(17.,9.);a*=.5;}return t;}`;
export function createWater(level) {
  const target = new T.WebGLRenderTarget(512, 512, { type: T.HalfFloatType, samples: 4 });
  const textureMatrix = new T.Matrix4(), clip = new T.Plane(new T.Vector3(0, 1, 0), -level - 0.02);
  const uniforms = {
    tReflect: { value: target.texture }, textureMatrix: { value: textureMatrix }, time: { value: 0 },
    body: { value: new T.Color() }, skyTop: { value: new T.Color() }, skyLow: { value: new T.Color() },
    sunDir: { value: new T.Vector3() }, sunColor: { value: new T.Color() }, toCamera: { value: new T.Vector3(1, 1, 1).normalize() }
  };
  const material = new T.ShaderMaterial({
    uniforms,
    vertexShader: `uniform mat4 textureMatrix;varying vec4 vProj;varying vec3 vWorld;
      void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vProj=textureMatrix*w;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform sampler2D tReflect;uniform float time;uniform vec3 body,skyTop,skyLow,sunDir,sunColor,toCamera;varying vec4 vProj;varying vec3 vWorld;${NOISE}
      float height(vec2 p){return .5*vnoise(p*.9+vec2(time*.11,time*.07))+.3*vnoise(p*2.3-vec2(time*.16,-time*.1))+.12*vnoise(p*6.1+time*.3);}
      void main(){
        vec2 p=vWorld.xz;float e=.12,h=height(p);
        vec3 n=normalize(vec3((h-height(p+vec2(e,0.)))*.55,1.,(h-height(p+vec2(0.,e)))*.55));
        vec3 r=reflect(-toCamera,n);
        float up=clamp(r.y,0.,1.);
        vec3 sky=mix(skyLow,skyTop,pow(up,.55));
        // Clouds are placed in world space so they read as large, slow shapes lying on the water.
        float c=fbm(p*.045+r.xz*1.5+vec2(time*.006,time*.003));
        sky=mix(sky,vec3(1.)*mix(.9,1.25,c)*mix(skyLow,vec3(1.),.6),smoothstep(.5,.78,c)*.75);
        sky+=sunColor*(pow(max(dot(r,sunDir),0.),900.)*40.+pow(max(dot(r,sunDir),0.),24.)*.25);
        vec2 uv=vProj.xy/vProj.w+n.xz*.035;
        vec4 mirror=texture2D(tReflect,uv);
        vec3 reflected=mix(sky,mirror.rgb*.82,mirror.a);
        float fresnel=.42+.5*pow(1.-max(dot(n,toCamera),0.),3.);
        vec3 col=mix(body,reflected,fresnel);
        col+=vec3(1.)*smoothstep(.985,1.,n.y)*0.;
        gl_FragColor=vec4(col,1.);
      }`
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(1200, 1200), material);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = level; mesh.name = 'water';
  const virtual = new T.OrthographicCamera(), n = new T.Vector3(0, 1, 0), origin = new T.Vector3(0, level, 0);
  const view = new T.Vector3(), targetPoint = new T.Vector3(), rot = new T.Matrix4(), camPos = new T.Vector3(), size = new T.Vector2();
  function renderReflection(renderer, scene, camera) {
    renderer.getDrawingBufferSize(size);
    const w = Math.max(2, size.x >> 1), h = Math.max(2, size.y >> 1);
    if (target.width !== w || target.height !== h) target.setSize(w, h);
    camPos.setFromMatrixPosition(camera.matrixWorld); rot.extractRotation(camera.matrixWorld);
    view.subVectors(origin, camPos).reflect(n).negate().add(origin);
    targetPoint.set(0, 0, -1).applyMatrix4(rot).add(camPos); targetPoint.subVectors(origin, targetPoint).reflect(n).negate().add(origin);
    virtual.position.copy(view); virtual.up.set(0, 1, 0).applyMatrix4(rot).reflect(n); virtual.lookAt(targetPoint);
    virtual.near = camera.near; virtual.far = camera.far; virtual.updateMatrixWorld(); virtual.projectionMatrix.copy(camera.projectionMatrix);
    virtual.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    textureMatrix.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(virtual.projectionMatrix).multiply(virtual.matrixWorldInverse);
    const old = renderer.getRenderTarget(), shadows = renderer.shadowMap.autoUpdate, color = renderer.getClearColor(new T.Color()), alpha = renderer.getClearAlpha();
    mesh.visible = false; renderer.clippingPlanes = [clip]; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, virtual);
    renderer.setRenderTarget(old); renderer.setClearColor(color, alpha); renderer.clippingPlanes = []; renderer.shadowMap.autoUpdate = shadows; mesh.visible = true;
  }
  function setPalette(p, sunDir) {
    uniforms.body.value.set(p.water); uniforms.skyTop.value.set(p.skyTop); uniforms.skyLow.value.set(p.skyLow);
    uniforms.sunColor.value.set(p.sun); uniforms.sunDir.value.copy(sunDir);
  }
  return { mesh, uniforms, renderReflection, setPalette };
}
// A sky used only to light the scene: gradient, sun and soft cloud, baked into an environment map.
export function createSkyEnvironment(renderer) {
  const uniforms = { skyTop: { value: new T.Color() }, skyLow: { value: new T.Color() }, sunDir: { value: new T.Vector3() }, sunColor: { value: new T.Color() }, ground: { value: new T.Color() } };
  const dome = new T.Mesh(new T.SphereGeometry(50, 48, 24), new T.ShaderMaterial({
    side: T.BackSide, uniforms,
    vertexShader: `varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform vec3 skyTop,skyLow,sunDir,sunColor,ground;varying vec3 vDir;${NOISE}
      void main(){vec3 d=normalize(vDir);vec3 c=mix(skyLow,skyTop,pow(clamp(d.y,0.,1.),.55));
        float cl=fbm(d.xz/(abs(d.y)+.25)*1.6);c=mix(c,vec3(1.1),smoothstep(.5,.8,cl)*.6*step(0.,d.y));
        c+=sunColor*(pow(max(dot(d,sunDir),0.),350.)*30.+pow(max(dot(d,sunDir),0.),8.)*.5);
        c=mix(c,ground,smoothstep(0.,-.25,d.y));gl_FragColor=vec4(c,1.);}`
  }));
  const scene = new T.Scene(); scene.add(dome);
  const pmrem = new T.PMREMGenerator(renderer); let current = null;
  function bake(p, sunDir) {
    uniforms.skyTop.value.set(p.skyTop); uniforms.skyLow.value.set(p.skyLow); uniforms.sunColor.value.set(p.sun); uniforms.sunDir.value.copy(sunDir);
    uniforms.ground.value.set(p.water).lerp(new T.Color(p.skyLow), 0.35);
    const next = pmrem.fromScene(scene, 0.02); current?.dispose(); current = next; return next.texture;
  }
  return { bake };
}
