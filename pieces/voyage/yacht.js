import * as T from '../tower/vendor/three.js';
// A sculptural interpretation of the Excess 14, sized for the miniature harbour.
export function createYacht(){
 const boat=new T.Group();boat.name='Disco Volante';
 const material=(color,roughness=.7)=>new T.MeshStandardMaterial({color,roughness});
 const white=material('#f5f0df'),glass=material('#365961',.3),carbon=material('#303f43'),teak=material('#c7a67a'),red=material('#ac4137');
 function add(geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;boat.add(m);return m;}
 const box=(w,h,d,x,y,z,m=white)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
 function line(points,color='#879998'){const l=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color,transparent:true,opacity:.8}));boat.add(l);return l;}
 function hull(x){const shape=new T.Shape();shape.moveTo(-.22,2.05);shape.lineTo(-.27,-1.4);shape.lineTo(-.16,-2.15);shape.lineTo(.02,-2.45);shape.lineTo(.22,-1.95);shape.lineTo(.28,1.7);shape.lineTo(.2,2.05);shape.closePath();const m=add(new T.ExtrudeGeometry(shape,{depth:.54,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:2,steps:1}),white,x,.62,0);m.rotation.x=Math.PI/2;box(.025,.15,1.8,x+.28,.43,.05,glass);for(let i=0;i<3;i++)box(.41,.08,.25,x,.52-i*.12,1.92+i*.13,teak);}
 hull(-1.04);hull(1.04);box(1.85,.13,2.6,0,.68,.4);box(1.7,.035,1.15,0,.77,1.14,teak);
 // Low coachroof, panoramic windows, and open aft cockpit.
 box(1.7,.55,1.65,0,1.03,-.13);box(1.73,.31,1.39,0,1.1,-.16,glass);box(1.92,.12,2.35,0,1.38,.1);box(.07,.6,.07,-.84,1.07,1.14);box(.07,.6,.07,.84,1.07,1.14);
 box(.45,.21,.7,-.58,.87,1.05);box(.7,.09,.4,.2,1,1.08,teak);box(.07,.23,.07,.2,.85,1.08,carbon);
 // Foredeck trampoline mesh and bowsprit.
 box(1.65,.04,1.05,0,.65,-1.52,carbon);for(let i=0;i<10;i++)line([[-.8,.68,-2+i*.1],[.8,.68,-2+i*.1]],'#a9b9b3');for(let i=0;i<12;i++)line([[-.8+i*.14,.68,-2],[-.8+i*.14,.68,-1.03]],'#a9b9b3');box(.075,.07,1.05,0,.66,-2.18,carbon);
 // Twin aft helms, with the wheels exposed at the stern.
 for(const x of [-1.03,1.03]){box(.26,.35,.24,x,.87,1.35);const wheel=add(new T.TorusGeometry(.13,.016,6,24),carbon,x,1.12,1.48);wheel.rotation.x=.25;box(.29,.08,.24,x,.84,1.8,teak);}
 // Forward mast, low boom, furled sail, stays and lifelines.
 add(new T.CylinderGeometry(.028,.048,5.4,12),white,0,3.32,-.68);box(.1,.1,2,0,1.93,.23,carbon);box(.16,.15,1.75,0,2.04,.2,carbon);
 line([[0,5.99,-.68],[0,.67,-2.65]]);line([[0,5.5,-.68],[-1.18,.75,.55]]);line([[0,5.5,-.68],[1.18,.75,.55]]);line([[-1.03,3.5,-.68],[1.03,3.5,-.68]],'#d9ded2');
 for(const x of [-1.26,1.26]){for(const z of [-1.65,-.7,.45,1.65])line([[x,.68,z],[x,.99,z]],'#c9d3c8');line([[x,.99,-1.65],[x,.99,1.65]],'#bac6bc');}
 // OC-style rigid, angular tender suspended athwartships from two davits.
 for(const x of [-.65,.65]){line([[x,.75,1.63],[x,1.5,1.8],[x,1.5,2.5]],'#dce0d4');line([[x,1.5,2.5],[x,.96,2.5]],'#8b9998');}
 const tender=new T.Group();boat.add(tender);tender.position.set(0,.88,2.5);const shape=new T.Shape();shape.moveTo(-.8,-.2);shape.lineTo(.55,-.25);shape.lineTo(.86,0);shape.lineTo(.55,.25);shape.lineTo(-.8,.2);shape.closePath();const tub=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.21,bevelEnabled:true,bevelSize:.04,bevelThickness:.02,bevelSegments:1}),white);tub.rotation.x=Math.PI/2;tender.add(tub);const floor=new T.Mesh(new T.BoxGeometry(1.27,.025,.32),carbon);floor.position.y=.015;tender.add(floor);for(const x of [-.4,.35]){const seat=new T.Mesh(new T.BoxGeometry(.12,.07,.37),teak);seat.position.set(x,.07,0);tender.add(seat);}box(.12,.28,.13,-.84,.99,2.5,carbon);
 function lettering(text,w,h){const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#173039';ctx.font='500 100px sans-serif';ctx.textAlign='center';ctx.fillText(text,512,90);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false}));}
 for(const side of [-1,1]){const name=lettering('Disco Volante',2.45,.28);name.position.set(side*1.405,.29,.3);name.rotation.y=side*Math.PI/2;boat.add(name);}const stern=lettering('Disco Volante',1.35,.18);stern.position.set(0,.69,1.716);boat.add(stern);
 const oc=lettering('OC',.2,.08);oc.position.set(-.4,.84,2.775);boat.add(oc);
 // Red ensign, including its Union flag canton, in a plain cloth mesh.
 const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#a93935';ctx.fillRect(0,0,256,128);ctx.fillStyle='#243e61';ctx.fillRect(0,0,128,64);ctx.save();ctx.beginPath();ctx.rect(0,0,128,64);ctx.clip();for(const [color,width] of [['#eee8d7',13],['#a93935',5]]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(128,64);ctx.moveTo(128,0);ctx.lineTo(0,64);ctx.stroke();}ctx.fillStyle='#eee8d7';ctx.fillRect(53,0,22,64);ctx.fillRect(0,22,128,20);ctx.fillStyle='#a93935';ctx.fillRect(58,0,12,64);ctx.fillRect(0,27,128,10);ctx.restore();const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
 line([[1.12,.8,1.95],[1.12,2.18,1.95]],'#dce0d4');
 const flag=add(new T.PlaneGeometry(.8,.4,12,4),new T.MeshStandardMaterial({map:texture,side:T.DoubleSide,roughness:1}),1.12,1.95,1.95);flag.geometry.translate(.4,0,0);
 return {group:boat,update(time,motion){boat.position.y=motion?Math.sin(time*.7)*.012:0;boat.rotation.z=motion?Math.sin(time*.48)*.003:0;const p=flag.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,motion?Math.sin(p.getX(i)*12-time*1.8)*p.getX(i)*.07:0);p.needsUpdate=true;flag.geometry.computeVertexNormals();}};
}
